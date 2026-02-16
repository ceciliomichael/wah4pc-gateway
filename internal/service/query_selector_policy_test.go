package service

import (
	"errors"
	"testing"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

func TestNormalizeAndValidateQuerySelector_BackwardCompatibleIdentifiers(t *testing.T) {
	req := QueryRequest{
		RequesterID:  "req",
		TargetID:     "target",
		ResourceType: "MedicationRequest",
		Identifiers: []model.Identifier{
			{System: "http://philhealth.gov.ph", Value: "12-345678901-1"},
		},
	}

	if err := normalizeAndValidateQuerySelector(&req); err != nil {
		t.Fatalf("expected request to be valid, got %v", err)
	}
	if len(req.Selector.PatientIdentifiers) != 1 {
		t.Fatalf("expected patientIdentifiers to be populated from identifiers")
	}
}

func TestNormalizeAndValidateQuerySelector_ResourceTypeRequiresResourceSelector(t *testing.T) {
	req := QueryRequest{
		RequesterID: "req",
		TargetID:    "target",
		Selector: model.QuerySelector{
			PatientIdentifiers: []model.Identifier{
				{System: "http://philhealth.gov.ph", Value: "12-345678901-1"},
			},
		},
		ResourceType: "Organization",
	}

	err := normalizeAndValidateQuerySelector(&req)
	if !errors.Is(err, ErrInvalidRequest) {
		t.Fatalf("expected ErrInvalidRequest, got %v", err)
	}
}

func TestNormalizeAndValidateQuerySelector_ResourceSelectorAcceptedForOrganization(t *testing.T) {
	req := QueryRequest{
		RequesterID: "req",
		TargetID:    "target",
		Selector: model.QuerySelector{
			ResourceIdentifiers: []model.Identifier{
				{System: "http://example.org/organization-id", Value: "ORG-1"},
			},
		},
		ResourceType: "Organization",
	}

	if err := normalizeAndValidateQuerySelector(&req); err != nil {
		t.Fatalf("expected request to be valid, got %v", err)
	}
}
