package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/internal/repository"
)

const maxPractitionerLookupResponseBody = 2 << 20 // 2 MiB

type providerEnvelope struct {
	Success bool            `json:"success"`
	Data    json.RawMessage `json:"data"`
	Error   string          `json:"error"`
}

type practitionerBundle struct {
	ResourceType string                    `json:"resourceType"`
	Entry        []practitionerBundleEntry `json:"entry"`
}

type practitionerBundleEntry struct {
	Resource practitionerResource `json:"resource"`
}

type practitionerResource struct {
	ID         string             `json:"id"`
	Name       []fhirHumanName    `json:"name"`
	Identifier []model.Identifier `json:"identifier"`
}

type fhirHumanName struct {
	Text   string   `json:"text"`
	Prefix []string `json:"prefix"`
	Given  []string `json:"given"`
	Family string   `json:"family"`
}

// GetPractitionersByFacilityCode proxies practitioner records from a facility provider.
func (s *ProviderService) GetPractitionersByFacilityCode(facilityCode string) ([]PractitionerOption, error) {
	normalizedFacilityCode := normalizeFacilityCode(facilityCode)
	if normalizedFacilityCode == "" {
		return nil, ErrInvalidFacilityCode
	}

	provider, err := s.repo.GetByFacilityCode(normalizedFacilityCode)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrProviderNotFound
		}
		return nil, err
	}

	return s.fetchPractitionersFromProvider(provider)
}

func (s *ProviderService) fetchPractitionersFromProvider(provider model.Provider) ([]PractitionerOption, error) {
	endpoint, err := buildProviderEndpointURL(provider.BaseURL, "/api/practitioners")
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrProviderUpstreamUnavailable, err)
	}

	req, err := http.NewRequest(http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("%w: failed to create upstream request", ErrProviderUpstreamUnavailable)
	}
	req.Header.Set("Accept", "application/json")
	if provider.GatewayAuthKey != "" {
		req.Header.Set("X-Gateway-Auth", provider.GatewayAuthKey)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrProviderUpstreamUnavailable, err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(io.LimitReader(resp.Body, maxPractitionerLookupResponseBody))
	if err != nil {
		return nil, fmt.Errorf("%w: failed to read upstream response", ErrProviderUpstreamUnavailable)
	}

	if resp.StatusCode >= http.StatusBadRequest {
		return nil, fmt.Errorf("%w: provider returned HTTP %s", ErrProviderUpstreamUnavailable, resp.Status)
	}

	bundle, err := decodePractitionerBundle(body)
	if err != nil {
		return nil, err
	}

	return mapPractitionerBundleToOptions(bundle), nil
}

func decodePractitionerBundle(raw []byte) (*practitionerBundle, error) {
	bundlePayload := extractBundlePayload(raw)
	if len(bundlePayload) == 0 {
		return nil, fmt.Errorf("%w: missing bundle payload", ErrInvalidUpstreamResponse)
	}

	var bundle practitionerBundle
	if err := json.Unmarshal(bundlePayload, &bundle); err != nil {
		return nil, fmt.Errorf("%w: invalid bundle JSON", ErrInvalidUpstreamResponse)
	}
	if bundle.ResourceType != "Bundle" {
		return nil, fmt.Errorf("%w: expected Bundle resourceType", ErrInvalidUpstreamResponse)
	}

	return &bundle, nil
}

func extractBundlePayload(raw []byte) json.RawMessage {
	trimmed := strings.TrimSpace(string(raw))
	if trimmed == "" {
		return nil
	}

	var direct struct {
		ResourceType string `json:"resourceType"`
	}
	if err := json.Unmarshal([]byte(trimmed), &direct); err == nil && direct.ResourceType == "Bundle" {
		return json.RawMessage(trimmed)
	}

	var envelope providerEnvelope
	if err := json.Unmarshal([]byte(trimmed), &envelope); err != nil {
		return nil
	}
	return envelope.Data
}

func mapPractitionerBundleToOptions(bundle *practitionerBundle) []PractitionerOption {
	options := make([]PractitionerOption, 0, len(bundle.Entry))
	for _, entry := range bundle.Entry {
		id := strings.TrimSpace(entry.Resource.ID)
		if id == "" {
			continue
		}

		options = append(options, PractitionerOption{
			ID:          id,
			Reference:   "Practitioner/" + id,
			Display:     practitionerDisplayName(entry.Resource.Name, id),
			Identifiers: entry.Resource.Identifier,
		})
	}

	return options
}

func practitionerDisplayName(names []fhirHumanName, practitionerID string) string {
	for _, name := range names {
		if text := strings.TrimSpace(name.Text); text != "" {
			return text
		}

		parts := make([]string, 0, len(name.Prefix)+len(name.Given)+1)
		parts = append(parts, name.Prefix...)
		parts = append(parts, name.Given...)
		if family := strings.TrimSpace(name.Family); family != "" {
			parts = append(parts, family)
		}

		display := strings.Join(parts, " ")
		display = strings.Join(strings.Fields(display), " ")
		if display != "" {
			return display
		}
	}

	return "Practitioner/" + practitionerID
}
