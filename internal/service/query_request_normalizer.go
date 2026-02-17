package service

import (
	"fmt"
	"strings"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

// QueryRequestPayload accepts both legacy selector requests and new flat per-resource requests.
type QueryRequestPayload struct {
	RequesterID  string `json:"requesterId"`
	TargetID     string `json:"targetId"`
	ResourceType string `json:"resourceType,omitempty"`
	Reason       string `json:"reason,omitempty"`
	Notes        string `json:"notes,omitempty"`

	// Flat common fields
	Identifiers []model.Identifier `json:"identifiers,omitempty"`
	Reference   string             `json:"reference,omitempty"`

	// Patient-scoped flat fields
	PatientIdentifiers []model.Identifier `json:"patientIdentifiers,omitempty"`
	PatientReference   string             `json:"patientReference,omitempty"`

	// Practitioner-scoped flat fields
	PractitionerIdentifiers []model.Identifier `json:"practitionerIdentifiers,omitempty"`
	PractitionerReference   string             `json:"practitionerReference,omitempty"`

	// Medication-scoped flat fields
	MedicationIdentifiers []model.Identifier `json:"medicationIdentifiers,omitempty"`
	MedicationReference   string             `json:"medicationReference,omitempty"`
	MedicationCode        *CodeLookup        `json:"medicationCode,omitempty"`

	// Other resource-scoped flat fields
	OrganizationIdentifiers      []model.Identifier `json:"organizationIdentifiers,omitempty"`
	OrganizationReference        string             `json:"organizationReference,omitempty"`
	LocationIdentifiers          []model.Identifier `json:"locationIdentifiers,omitempty"`
	LocationReference            string             `json:"locationReference,omitempty"`
	PractitionerRoleIdentifiers  []model.Identifier `json:"practitionerRoleIdentifiers,omitempty"`
	PractitionerRoleReference    string             `json:"practitionerRoleReference,omitempty"`
	ChargeItemDefinitionIDs      []model.Identifier `json:"chargeItemDefinitionIdentifiers,omitempty"`
	ChargeItemDefinitionReference string            `json:"chargeItemDefinitionReference,omitempty"`

	// Generic resource-scoped aliases
	ResourceIdentifiers []model.Identifier `json:"resourceIdentifiers,omitempty"`
	ResourceReference   string             `json:"resourceReference,omitempty"`

	// Appointment filters
	DateFrom                string             `json:"dateFrom,omitempty"`
	DateTo                  string             `json:"dateTo,omitempty"`
	Status                  string             `json:"status,omitempty"`
	AppointmentPractitioner []model.Identifier `json:"appointmentPractitionerIdentifiers,omitempty"`

	// Legacy selector
	Selector model.QuerySelector `json:"selector,omitempty"`
}

func (p QueryRequestPayload) ToQueryRequest(pathResourceType string) (QueryRequest, error) {
	req := QueryRequest{
		RequesterID:  strings.TrimSpace(p.RequesterID),
		TargetID:     strings.TrimSpace(p.TargetID),
		ResourceType: pathResourceType,
		Reason:       strings.TrimSpace(p.Reason),
		Notes:        strings.TrimSpace(p.Notes),
		Selector:     p.Selector,
	}

	mode, ok := resourceSelectorPolicy[pathResourceType]
	if !ok {
		return QueryRequest{}, fmt.Errorf("%w: unsupported selector policy for resourceType %q", ErrInvalidRequest, pathResourceType)
	}

	switch mode {
	case selectorModePatient:
		req.Selector.PatientIdentifiers = firstNonEmptyIdentifiers(
			p.PatientIdentifiers,
			p.Identifiers,
			req.Selector.PatientIdentifiers,
		)
		req.Selector.PatientReference = firstNonEmptyString(
			p.PatientReference,
			p.Reference,
			req.Selector.PatientReference,
		)
	case selectorModeResource:
		req.Selector.ResourceIdentifiers = firstNonEmptyIdentifiers(
			p.ResourceIdentifiers,
			p.PractitionerIdentifiers,
			p.MedicationIdentifiers,
			p.OrganizationIdentifiers,
			p.LocationIdentifiers,
			p.PractitionerRoleIdentifiers,
			p.ChargeItemDefinitionIDs,
			p.Identifiers,
			req.Selector.ResourceIdentifiers,
		)
		req.Selector.ResourceReference = firstNonEmptyString(
			p.ResourceReference,
			p.PractitionerReference,
			p.MedicationReference,
			p.OrganizationReference,
			p.LocationReference,
			p.PractitionerRoleReference,
			p.ChargeItemDefinitionReference,
			p.Reference,
			req.Selector.ResourceReference,
		)
	}

	if pathResourceType == "Medication" && p.MedicationCode != nil {
		req.Filters = ensureQueryFilters(req.Filters)
		req.Filters.Medication = &MedicationQueryFilter{
			MedicationCode: &CodeLookup{
				System: strings.TrimSpace(p.MedicationCode.System),
				Code:   strings.TrimSpace(p.MedicationCode.Code),
			},
		}
	}

	if pathResourceType == "Appointment" {
		if strings.TrimSpace(p.DateFrom) == "" || strings.TrimSpace(p.DateTo) == "" {
			return QueryRequest{}, fmt.Errorf("%w: dateFrom and dateTo are required for Appointment", ErrInvalidRequest)
		}
		req.Filters = &QueryFilters{
			Appointment: &AppointmentQueryFilter{
				DateFrom: strings.TrimSpace(p.DateFrom),
				DateTo:   strings.TrimSpace(p.DateTo),
				Status:   strings.TrimSpace(p.Status),
				PractitionerIdentifiers: firstNonEmptyIdentifiers(
					p.AppointmentPractitioner,
					p.PractitionerIdentifiers,
				),
			},
		}
	}

	if err := normalizeAndValidateQuerySelector(&req); err != nil {
		return QueryRequest{}, err
	}

	return req, nil
}

func ensureQueryFilters(filters *QueryFilters) *QueryFilters {
	if filters == nil {
		return &QueryFilters{}
	}
	return filters
}

func firstNonEmptyIdentifiers(candidates ...[]model.Identifier) []model.Identifier {
	for _, ids := range candidates {
		if len(ids) > 0 {
			return ids
		}
	}
	return nil
}

func firstNonEmptyString(candidates ...string) string {
	for _, v := range candidates {
		trimmed := strings.TrimSpace(v)
		if trimmed != "" {
			return trimmed
		}
	}
	return ""
}
