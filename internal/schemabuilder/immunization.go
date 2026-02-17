package schemabuilder

func buildImmunization(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Immunization"
	ensureMetaProfile(out, canonicalProfiles["Immunization"])

	if getString(out, "status") == "" {
		if status := getString(resource, "immunizationStatus", "status"); status != "" {
			out["status"] = status
		}
	}

	codeSystem := getString(resource, "vaccineSystem", "codeSystem")
	code := getString(resource, "vaccineCode", "code")
	setCodeableConceptIfMissing(out, "vaccineCode", codeSystem, code)
	ensureReferenceIfMissing(out, "patient", getString(resource, "patientReference"))
	if getString(out, "occurrenceDateTime") == "" {
		if occurrence := getString(resource, "occurrenceDateTime", "occurrence"); occurrence != "" {
			out["occurrenceDateTime"] = occurrence
		}
	}
	if _, ok := out["primarySource"]; !ok {
		if raw, exists := resource["primarySource"]; exists {
			out["primarySource"] = raw
		}
	}
	if _, ok := out["primarySource"]; !ok {
		out["primarySource"] = true
	}

	return out, requireAll("Immunization", out, "status", "vaccineCode", "patient", "occurrenceDateTime", "primarySource")
}
