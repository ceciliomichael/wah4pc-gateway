package service

import (
	"errors"
	"testing"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

func TestQueryRequestPayloadToQueryRequest_PatientScopedUsesPatientIdentifiers(t *testing.T) {
	payload := QueryRequestPayload{
		RequesterID: "requester",
		TargetID:    "target",
		PatientIdentifiers: []model.Identifier{
			{System: "http://example.org/patient-id", Value: "PAT-001"},
		},
	}

	req, err := payload.ToQueryRequest("Encounter")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(req.Selector.PatientIdentifiers) != 1 {
		t.Fatalf("expected patientIdentifiers to be mapped")
	}
	if len(req.Selector.ResourceIdentifiers) != 0 {
		t.Fatalf("did not expect resourceIdentifiers to be set")
	}
}

func TestQueryRequestPayloadToQueryRequest_ResourceScopedUsesPractitionerIdentifiers(t *testing.T) {
	payload := QueryRequestPayload{
		RequesterID: "requester",
		TargetID:    "target",
		PractitionerIdentifiers: []model.Identifier{
			{System: "http://example.org/practitioner-id", Value: "PRAC-001"},
		},
	}

	req, err := payload.ToQueryRequest("Practitioner")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(req.Selector.ResourceIdentifiers) != 1 {
		t.Fatalf("expected resourceIdentifiers to be mapped")
	}
	if len(req.Selector.PatientIdentifiers) != 0 {
		t.Fatalf("did not expect patientIdentifiers to be set")
	}
}

func TestQueryRequestPayloadToQueryRequest_ResourceScopedAllowsGenericIdentifiers(t *testing.T) {
	payload := QueryRequestPayload{
		RequesterID: "requester",
		TargetID:    "target",
		Identifiers: []model.Identifier{
			{System: "http://example.org/resource-id", Value: "RES-001"},
		},
	}

	req, err := payload.ToQueryRequest("Medication")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(req.Selector.ResourceIdentifiers) != 1 {
		t.Fatalf("expected generic identifiers to map to resourceIdentifiers")
	}
}

func TestQueryRequestPayloadToQueryRequest_ResourceScopedSupportsLocationIdentifiers(t *testing.T) {
	payload := QueryRequestPayload{
		RequesterID: "requester",
		TargetID:    "target",
		LocationIdentifiers: []model.Identifier{
			{System: "http://example.org/location-id", Value: "LOC-001"},
		},
	}

	req, err := payload.ToQueryRequest("Location")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(req.Selector.ResourceIdentifiers) != 1 {
		t.Fatalf("expected location identifiers to map to resourceIdentifiers")
	}
}

func TestQueryRequestPayloadToQueryRequest_AppointmentRequiresDateRange(t *testing.T) {
	payload := QueryRequestPayload{
		RequesterID: "requester",
		TargetID:    "target",
		PatientIdentifiers: []model.Identifier{
			{System: "http://example.org/patient-id", Value: "PAT-001"},
		},
	}

	_, err := payload.ToQueryRequest("Appointment")
	if !errors.Is(err, ErrInvalidRequest) {
		t.Fatalf("expected ErrInvalidRequest, got %v", err)
	}
}

func TestQueryRequestPayloadToQueryRequest_AppointmentWithDateRangeAccepted(t *testing.T) {
	payload := QueryRequestPayload{
		RequesterID: "requester",
		TargetID:    "target",
		PatientIdentifiers: []model.Identifier{
			{System: "http://example.org/patient-id", Value: "PAT-001"},
		},
		DateFrom: "2026-02-01",
		DateTo:   "2026-02-29",
		Status:   "booked",
	}

	req, err := payload.ToQueryRequest("Appointment")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if req.Filters == nil || req.Filters.Appointment == nil {
		t.Fatalf("expected appointment filters to be populated")
	}
	if req.Filters.Appointment.DateFrom != "2026-02-01" {
		t.Fatalf("unexpected dateFrom: %s", req.Filters.Appointment.DateFrom)
	}
}

func TestQueryRequestPayloadToQueryRequest_MedicationCodeOnlyAccepted(t *testing.T) {
	payload := QueryRequestPayload{
		RequesterID: "requester",
		TargetID:    "target",
		MedicationCode: &CodeLookup{
			System: "http://www.nlm.nih.gov/research/umls/rxnorm",
			Code:   "1049502",
		},
	}

	req, err := payload.ToQueryRequest("Medication")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if req.Filters == nil || req.Filters.Medication == nil || req.Filters.Medication.MedicationCode == nil {
		t.Fatalf("expected medicationCode to be mapped into filters")
	}
	if req.Filters.Medication.MedicationCode.Code != "1049502" {
		t.Fatalf("unexpected medication code")
	}
}

func TestQueryRequestPayloadToQueryRequest_LegacySelectorStillAccepted(t *testing.T) {
	payload := QueryRequestPayload{
		RequesterID: "requester",
		TargetID:    "target",
		Selector: model.QuerySelector{
			PatientIdentifiers: []model.Identifier{
				{System: "http://example.org/patient-id", Value: "PAT-001"},
			},
		},
	}

	req, err := payload.ToQueryRequest("Observation")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(req.Selector.PatientIdentifiers) != 1 {
		t.Fatalf("expected selector.patientIdentifiers to be preserved")
	}
}
