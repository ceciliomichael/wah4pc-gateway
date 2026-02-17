package service

import (
	"encoding/json"
	"errors"
	"sort"
	"testing"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

func TestSelectorPolicy_CoversAllAllowedResourceTypes(t *testing.T) {
	for resourceType := range allowedResourceTypes {
		if _, ok := resourceSelectorPolicy[resourceType]; !ok {
			t.Fatalf("resourceType %q is allowed but has no selector policy", resourceType)
		}
	}

	for resourceType := range resourceSelectorPolicy {
		if _, ok := allowedResourceTypes[resourceType]; !ok {
			t.Fatalf("resourceType %q has selector policy but is not an allowed resource type", resourceType)
		}
	}
}

func TestSelectorPolicy_AllResources_RequestBodies(t *testing.T) {
	patientIdentifiers := []model.Identifier{
		{System: "http://example.org/patient-id", Value: "PAT-001"},
	}
	resourceIdentifiers := []model.Identifier{
		{System: "http://example.org/resource-id", Value: "RES-001"},
	}

	resourceTypes := sortedResourceTypes()
	for _, resourceType := range resourceTypes {
		mode := resourceSelectorPolicy[resourceType]

		t.Run(resourceType+"_valid_selector", func(t *testing.T) {
			req := QueryRequest{
				RequesterID:  "requester-provider",
				TargetID:     "target-provider",
				ResourceType: resourceType,
			}
			if mode == selectorModePatient {
				req.Selector = model.QuerySelector{PatientIdentifiers: patientIdentifiers}
			} else {
				req.Selector = model.QuerySelector{ResourceIdentifiers: resourceIdentifiers}
			}

			body, _ := json.Marshal(req)
			if err := normalizeAndValidateQuerySelector(&req); err != nil {
				t.Fatalf("expected valid request for %s, got %v; requestBody=%s", resourceType, err, string(body))
			}
		})

		t.Run(resourceType+"_invalid_selector_mode", func(t *testing.T) {
			req := QueryRequest{
				RequesterID:  "requester-provider",
				TargetID:     "target-provider",
				ResourceType: resourceType,
			}
			if mode == selectorModePatient {
				req.Selector = model.QuerySelector{ResourceIdentifiers: resourceIdentifiers}
			} else {
				req.Selector = model.QuerySelector{PatientIdentifiers: patientIdentifiers}
			}

			body, _ := json.Marshal(req)
			err := normalizeAndValidateQuerySelector(&req)
			if !errors.Is(err, ErrInvalidRequest) {
				t.Fatalf("expected ErrInvalidRequest for %s, got %v; requestBody=%s", resourceType, err, string(body))
			}
		})

		t.Run(resourceType+"_legacy_identifiers_behavior", func(t *testing.T) {
			req := QueryRequest{
				RequesterID:  "requester-provider",
				TargetID:     "target-provider",
				ResourceType: resourceType,
				Identifiers:  patientIdentifiers,
			}

			body, _ := json.Marshal(req)
			err := normalizeAndValidateQuerySelector(&req)
			if mode == selectorModePatient {
				if err != nil {
					t.Fatalf("expected legacy identifiers to be accepted for %s, got %v; requestBody=%s", resourceType, err, string(body))
				}
				if !model.IdentifiersMatch(req.Selector.PatientIdentifiers, patientIdentifiers) {
					t.Fatalf("expected selector.patientIdentifiers to mirror legacy identifiers for %s", resourceType)
				}
				return
			}

			if !errors.Is(err, ErrInvalidRequest) {
				t.Fatalf("expected ErrInvalidRequest for legacy identifiers on %s, got %v; requestBody=%s", resourceType, err, string(body))
			}
		})
	}
}

func sortedResourceTypes() []string {
	resourceTypes := make([]string, 0, len(allowedResourceTypes))
	for resourceType := range allowedResourceTypes {
		resourceTypes = append(resourceTypes, resourceType)
	}
	sort.Strings(resourceTypes)
	return resourceTypes
}

