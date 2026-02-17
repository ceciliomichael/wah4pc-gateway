package schemabuilder

func buildCondition(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Condition"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/Condition")

	codeSystem := getString(resource, "conditionCodeSystem", "codeSystem")
	code := getString(resource, "conditionCode", "code")
	setCodeableConceptIfMissing(out, "code", codeSystem, code)
	ensureReferenceIfMissing(out, "subject", getString(resource, "patientReference", "subjectReference"))
	ensureReferenceIfMissing(out, "encounter", getString(resource, "encounterReference"))

	return out, nil
}
