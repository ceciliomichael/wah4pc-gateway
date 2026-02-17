package service

import (
	"fmt"
	"strings"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

type selectorMode string

const (
	selectorModePatient  selectorMode = "patient"
	selectorModeResource selectorMode = "resource"
)

var resourceSelectorPolicy = map[string]selectorMode{
	"Patient":                  selectorModePatient,
	"Appointment":              selectorModePatient,
	"Encounter":                selectorModePatient,
	"Procedure":                selectorModePatient,
	"Immunization":             selectorModePatient,
	"Observation":              selectorModePatient,
	"AllergyIntolerance":       selectorModePatient,
	"Condition":                selectorModePatient,
	"DiagnosticReport":         selectorModePatient,
	"MedicationRequest":        selectorModePatient,
	"MedicationAdministration": selectorModePatient,
	"NutritionOrder":           selectorModePatient,
	"Claim":                    selectorModePatient,
	"ClaimResponse":            selectorModePatient,
	"PaymentNotice":            selectorModePatient,
	"PaymentReconciliation":    selectorModePatient,
	"Invoice":                  selectorModePatient,
	"ChargeItem":               selectorModePatient,
	"Account":                  selectorModePatient,
	"Organization":             selectorModeResource,
	"Location":                 selectorModeResource,
	"Practitioner":             selectorModeResource,
	"PractitionerRole":         selectorModeResource,
	"ChargeItemDefinition":     selectorModeResource,
	"Medication":               selectorModeResource,
}

func normalizeAndValidateQuerySelector(req *QueryRequest) error {
	if req == nil {
		return fmt.Errorf("%w: request body is required", ErrInvalidRequest)
	}
	if req.RequesterID == "" || req.TargetID == "" {
		return fmt.Errorf("%w: requesterId and targetId are required", ErrInvalidRequest)
	}

	mode, ok := resourceSelectorPolicy[req.ResourceType]
	if !ok {
		return fmt.Errorf("%w: unsupported selector policy for resourceType %q", ErrInvalidRequest, req.ResourceType)
	}

	// Backward compatibility: legacy identifiers map to patientIdentifiers.
	if mode == selectorModePatient && len(req.Identifiers) > 0 && len(req.Selector.PatientIdentifiers) == 0 {
		req.Selector.PatientIdentifiers = req.Identifiers
	}
	// Keep identifiers mirrored for legacy downstream consumers.
	req.Identifiers = req.Selector.PatientIdentifiers

	switch mode {
	case selectorModePatient:
		if !req.Selector.HasPatientSelector() {
			return fmt.Errorf("%w: patient selector is required for resourceType %s (use selector.patientIdentifiers or selector.patientReference)", ErrInvalidRequest, req.ResourceType)
		}
	case selectorModeResource:
		if !req.Selector.HasResourceSelector() && !hasResourceScopedLookupViaFilters(req) {
			return fmt.Errorf("%w: resource selector is required for resourceType %s (use selector.resourceIdentifiers or selector.resourceReference)", ErrInvalidRequest, req.ResourceType)
		}
	default:
		return fmt.Errorf("%w: invalid selector policy for resourceType %s", ErrInvalidRequest, req.ResourceType)
	}

	return nil
}

func hasResourceScopedLookupViaFilters(req *QueryRequest) bool {
	if req == nil || req.Filters == nil {
		return false
	}

	if req.ResourceType == "Medication" && req.Filters.Medication != nil && req.Filters.Medication.MedicationCode != nil {
		code := req.Filters.Medication.MedicationCode
		return strings.TrimSpace(code.System) != "" && strings.TrimSpace(code.Code) != ""
	}

	return false
}

func effectiveSelectorFromTransaction(tx model.Transaction) model.QuerySelector {
	if tx.Selector.HasPatientSelector() || tx.Selector.HasResourceSelector() {
		return tx.Selector
	}

	if len(tx.Identifiers) > 0 {
		return model.QuerySelector{
			PatientIdentifiers: tx.Identifiers,
		}
	}

	return model.QuerySelector{}
}
