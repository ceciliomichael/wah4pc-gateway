package schemabuilder

import (
	"encoding/json"
	"fmt"
)

type resourceBuilder func(resource map[string]interface{}) (map[string]interface{}, error)

var builders = map[string]resourceBuilder{
	"Patient":                  buildPatient,
	"Appointment":              buildAppointment,
	"Encounter":                buildEncounter,
	"Procedure":                buildProcedure,
	"Immunization":             buildImmunization,
	"Observation":              buildObservation,
	"Practitioner":             buildPractitioner,
	"Medication":               buildMedication,
	"Location":                 buildLocation,
	"Organization":             buildOrganization,
	"Account":                  buildAccount,
	"Claim":                    buildClaim,
	"ClaimResponse":            buildClaimResponse,
	"ChargeItem":               buildChargeItem,
	"ChargeItemDefinition":     buildChargeItemDefinition,
	"Invoice":                  buildInvoice,
	"PaymentNotice":            buildPaymentNotice,
	"PaymentReconciliation":    buildPaymentReconciliation,
	"AllergyIntolerance":       buildAllergyIntolerance,
	"Condition":                buildCondition,
	"DiagnosticReport":         buildDiagnosticReport,
	"MedicationAdministration": buildMedicationAdministration,
	"MedicationRequest":        buildMedicationRequest,
	"NutritionOrder":           buildNutritionOrder,
	"PractitionerRole":         buildPractitionerRole,
}

// BuildSuccessBundle rebuilds successful provider payloads into canonical FHIR resources.
// The input is expected to be a FHIR Bundle.
func BuildSuccessBundle(resourceType string, data json.RawMessage) (json.RawMessage, error) {
	var bundle map[string]interface{}
	if err := json.Unmarshal(data, &bundle); err != nil {
		return nil, fmt.Errorf("failed to parse bundle: %w", err)
	}

	if getString(bundle, "resourceType") != "Bundle" {
		return nil, fmt.Errorf("input must be a FHIR Bundle")
	}

	entryRaw, ok := bundle["entry"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("bundle.entry must be an array")
	}

	for i, rawEntry := range entryRaw {
		entry, ok := rawEntry.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("bundle.entry[%d] must be an object", i)
		}

		resource, ok := entry["resource"].(map[string]interface{})
		if !ok {
			resource = map[string]interface{}{}
		}

		rebuilt, err := buildResource(resourceType, resource)
		if err != nil {
			return nil, fmt.Errorf("entry[%d]: %w", i, err)
		}
		entry["resource"] = rebuilt
		entryRaw[i] = entry
	}

	bundle["entry"] = entryRaw
	rebuilt, err := json.Marshal(bundle)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal rebuilt bundle: %w", err)
	}
	return rebuilt, nil
}

func buildResource(resourceType string, resource map[string]interface{}) (map[string]interface{}, error) {
	builder, ok := builders[resourceType]
	if !ok {
		return buildVanilla(resourceType, resource)
	}
	return builder(resource)
}
