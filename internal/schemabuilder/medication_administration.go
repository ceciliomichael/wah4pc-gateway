package schemabuilder

func buildMedicationAdministration(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "MedicationAdministration"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/MedicationAdministration")

	if getString(out, "status") == "" {
		if status := getString(resource, "medicationAdministrationStatus", "status"); status != "" {
			out["status"] = status
		}
	}

	codeSystem := getString(resource, "medicationCodeSystem", "codeSystem")
	code := getString(resource, "medicationCode", "code")
	setCodeableConceptIfMissing(out, "medicationCodeableConcept", codeSystem, code)
	ensureReferenceIfMissing(out, "subject", getString(resource, "patientReference", "subjectReference"))

	return out, requireAll("MedicationAdministration", out, "status", "medicationCodeableConcept", "subject")
}
