package schemabuilder

func buildProcedure(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Procedure"
	ensureMetaProfile(out, canonicalProfiles["Procedure"])

	if getString(out, "status") == "" {
		if status := getString(resource, "procedureStatus", "status"); status != "" {
			out["status"] = status
		}
	}

	codeSystem := getString(resource, "procedureCodeSystem", "codeSystem")
	code := getString(resource, "procedureCode", "code")
	setCodeableConceptIfMissing(out, "code", codeSystem, code)
	ensureReferenceIfMissing(out, "subject", getString(resource, "patientReference"))

	return out, requireAll("Procedure", out, "status", "code", "subject")
}
