package service

import (
	"errors"
	"testing"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

func TestGatewayServiceProcessResponse_ResourceTypeMismatch(t *testing.T) {
	t.Parallel()

	repo := newTxRepoStub()
	now := time.Now().UTC()
	repo.items["txn-1"] = model.Transaction{
		ID:           "txn-1",
		RequesterID:  "requester",
		TargetID:     "target",
		ResourceType: "Encounter",
		Status:       model.StatusPending,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	svc := NewGatewayService(
		repo,
		nil,
		NewSettingsService(&settingsRepoStub{}),
		"http://gateway.local",
		nil,
	)

	err := svc.ProcessResponse(
		IncomingResultPayload{
			TransactionID: "txn-1",
			Status:        string(ResultStatusSuccess),
		},
		"target",
		"Patient",
	)
	if !errors.Is(err, ErrResourceTypeMismatch) {
		t.Fatalf("expected ErrResourceTypeMismatch, got: %v", err)
	}
}
