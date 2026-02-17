package schemabuilder

func buildMedication(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Medication"
	ensureMetaProfile(out, canonicalProfiles["Medication"])

	system := getNestedString(resource, "medicationCode", "system")
	code := getNestedString(resource, "medicationCode", "code")
	if system == "" {
		system = getString(resource, "medicationCodeSystem", "codeSystem")
	}
	if code == "" {
		code = getString(resource, "medicationCodeValue", "code")
	}
	setCodeableConceptIfMissing(out, "code", system, code)

	idSystem := getString(resource, "medicationIdentifierSystem", "identifierSystem", "idSystem")
	idValue := getString(resource, "medicationIdentifierValue", "identifierValue", "idValue")
	setIdentifierIfMissing(out, idSystem, idValue)

	return out, requireAll("Medication", out, "code")
}
