package schemabuilder

func buildMedicationRequest(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "MedicationRequest"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/MedicationRequest")

	if getString(out, "status") == "" {
		if status := getString(resource, "medicationRequestStatus", "status"); status != "" {
			out["status"] = status
		}
	}
	if getString(out, "intent") == "" {
		if intent := getString(resource, "medicationRequestIntent", "intent"); intent != "" {
			out["intent"] = intent
		}
	}

	codeSystem := getString(resource, "medicationCodeSystem", "codeSystem")
	code := getString(resource, "medicationCode", "code")
	setCodeableConceptIfMissing(out, "medicationCodeableConcept", codeSystem, code)
	ensureReferenceIfMissing(out, "subject", getString(resource, "patientReference", "subjectReference"))

	return out, requireAll("MedicationRequest", out, "status", "intent", "medicationCodeableConcept", "subject")
}
