package service

import (
	"fmt"
	"strings"
)

var allowedResourceTypes = map[string]struct{}{
	"Patient":                  {},
	"Appointment":              {},
	"Encounter":                {},
	"Procedure":                {},
	"Immunization":             {},
	"Observation":              {},
	"Medication":               {},
	"Location":                 {},
	"Organization":             {},
	"Practitioner":             {},
	"Account":                  {},
	"Claim":                    {},
	"ClaimResponse":            {},
	"ChargeItem":               {},
	"ChargeItemDefinition":     {},
	"Invoice":                  {},
	"PaymentNotice":            {},
	"PaymentReconciliation":    {},
	"AllergyIntolerance":       {},
	"Condition":                {},
	"DiagnosticReport":         {},
	"MedicationAdministration": {},
	"MedicationRequest":        {},
	"NutritionOrder":           {},
	"PractitionerRole":         {},
}

// IsAllowedResourceType reports whether the resource type is supported by the gateway.
func IsAllowedResourceType(resourceType string) bool {
	_, ok := allowedResourceTypes[resourceType]
	return ok
}

// ParseAndValidateResourceType extracts and validates {resourceType} from a route prefix.
func ParseAndValidateResourceType(path, prefix string) (string, error) {
	if !strings.HasPrefix(path, prefix) {
		return "", fmt.Errorf("%w: unexpected path", ErrInvalidResourceType)
	}

	resourceType := strings.TrimPrefix(path, prefix)
	resourceType = strings.TrimSuffix(resourceType, "/")

	if resourceType == "" {
		return "", fmt.Errorf("%w: resourceType is required", ErrInvalidResourceType)
	}
	if strings.Contains(resourceType, "/") {
		return "", fmt.Errorf("%w: extra path segments are not allowed", ErrInvalidResourceType)
	}
	if strings.TrimSpace(resourceType) != resourceType || resourceType == "." || resourceType == ".." {
		return "", fmt.Errorf("%w: malformed resourceType", ErrInvalidResourceType)
	}
	if !IsAllowedResourceType(resourceType) {
		return "", fmt.Errorf("%w: unsupported resourceType %q", ErrInvalidResourceType, resourceType)
	}

	return resourceType, nil
}
