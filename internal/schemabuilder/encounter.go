package schemabuilder

func buildEncounter(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Encounter"
	ensureMetaProfile(out, canonicalProfiles["Encounter"])

	if getString(out, "status") == "" {
		if status := getString(resource, "encounterStatus", "status"); status != "" {
			out["status"] = status
		}
	}

	if _, ok := out["class"]; !ok {
		if classCode := getString(resource, "classCode"); classCode != "" {
			out["class"] = map[string]interface{}{"code": classCode}
		}
	}

	ensureReferenceIfMissing(out, "subject", getString(resource, "patientReference"))

	return out, requireAll("Encounter", out, "status", "class", "subject")
}
