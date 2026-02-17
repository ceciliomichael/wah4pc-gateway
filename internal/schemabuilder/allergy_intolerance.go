package schemabuilder

func buildAllergyIntolerance(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "AllergyIntolerance"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/AllergyIntolerance")

	codeSystem := getString(resource, "allergyCodeSystem", "codeSystem")
	code := getString(resource, "allergyCode", "code")
	setCodeableConceptIfMissing(out, "code", codeSystem, code)
	ensureReferenceIfMissing(out, "patient", getString(resource, "patientReference"))

	return out, requireAll("AllergyIntolerance", out, "patient")
}
