package schemabuilder

func buildObservation(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Observation"
	ensureMetaProfile(out, canonicalProfiles["Observation"])

	if getString(out, "status") == "" {
		if status := getString(resource, "observationStatus", "status"); status != "" {
			out["status"] = status
		}
	}

	codeSystem := getString(resource, "observationCodeSystem", "codeSystem")
	code := getString(resource, "observationCode", "code")
	setCodeableConceptIfMissing(out, "code", codeSystem, code)

	return out, requireAll("Observation", out, "status", "code")
}
