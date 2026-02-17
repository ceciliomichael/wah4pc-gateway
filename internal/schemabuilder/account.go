package schemabuilder

func buildAccount(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Account"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/Account")

	if getString(out, "status") == "" {
		if status := getString(resource, "accountStatus", "status"); status != "" {
			out["status"] = status
		}
	}
	ensureReferenceIfMissing(out, "subject", getString(resource, "patientReference", "subjectReference"))

	return out, requireAll("Account", out, "status")
}
