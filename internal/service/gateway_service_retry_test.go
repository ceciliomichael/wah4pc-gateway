package service

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

func setupGatewayForRetryTests(t *testing.T, targetBaseURL string) *GatewayService {
	t.Helper()

	providerRepo := newProviderRepoStub()
	now := time.Now().UTC()
	_ = providerRepo.Create(model.Provider{
		ID:        "requester",
		Name:      "Requester",
		BaseURL:   "https://requester.example",
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	})
	_ = providerRepo.Create(model.Provider{
		ID:        "target",
		Name:      "Target",
		BaseURL:   targetBaseURL,
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	})

	return NewGatewayService(
		newTxRepoStub(),
		NewProviderService(providerRepo),
		NewSettingsService(&settingsRepoStub{}),
		"http://gateway.local",
		nil,
	)
}

func retryTestQueryRequest() QueryRequest {
	return QueryRequest{
		RequesterID: "requester",
		TargetID:    "target",
		Identifiers: []model.Identifier{
			{System: "http://philhealth.gov.ph", Value: "12-345678901-1"},
		},
		ResourceType: "Patient",
	}
}

func TestGatewayServiceInitiateQuery_RetriesThreeTimesOnRetryableHTTPFailure(t *testing.T) {
	t.Parallel()

	var attempts int32
	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/fhir/process-query" {
			http.NotFound(w, r)
			return
		}
		atomic.AddInt32(&attempts, 1)
		http.Error(w, "temporary upstream failure", http.StatusServiceUnavailable)
	}))
	defer target.Close()

	svc := setupGatewayForRetryTests(t, target.URL)
	_, err := svc.InitiateQuery(retryTestQueryRequest())
	if err == nil {
		t.Fatal("expected initiate query to fail")
	}

	if got := atomic.LoadInt32(&attempts); got != maxForwardAttempts {
		t.Fatalf("expected %d attempts, got %d", maxForwardAttempts, got)
	}

	var upstreamErr *UpstreamHTTPError
	if !errors.As(err, &upstreamErr) {
		t.Fatalf("expected UpstreamHTTPError, got %v", err)
	}
	if upstreamErr.Attempts != maxForwardAttempts {
		t.Fatalf("expected attempts %d, got %d", maxForwardAttempts, upstreamErr.Attempts)
	}
}

func TestGatewayServiceInitiateQuery_RetriesThreeTimesOnTransportFailure(t *testing.T) {
	t.Parallel()

	target := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	targetURL := target.URL
	target.Close()

	svc := setupGatewayForRetryTests(t, targetURL)
	_, err := svc.InitiateQuery(retryTestQueryRequest())
	if err == nil {
		t.Fatal("expected initiate query to fail")
	}

	if !errors.Is(err, ErrTargetUnreachable) {
		t.Fatalf("expected ErrTargetUnreachable, got %v", err)
	}

	var forwardingErr *UpstreamForwardingError
	if !errors.As(err, &forwardingErr) {
		t.Fatalf("expected UpstreamForwardingError, got %v", err)
	}
	if forwardingErr.Attempts != maxForwardAttempts {
		t.Fatalf("expected attempts %d, got %d", maxForwardAttempts, forwardingErr.Attempts)
	}
	if !strings.Contains(forwardingErr.TargetURL, targetURL) {
		t.Fatalf("expected target URL %q in forwarding error, got %q", targetURL, forwardingErr.TargetURL)
	}
}
