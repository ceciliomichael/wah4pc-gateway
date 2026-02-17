package schemabuilder

func buildClaim(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Claim"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/Claim")

	if getString(out, "status") == "" {
		if status := getString(resource, "claimStatus", "status"); status != "" {
			out["status"] = status
		}
	}
	if getString(out, "use") == "" {
		if use := getString(resource, "claimUse", "use"); use != "" {
			out["use"] = use
		}
	}
	if getString(out, "created") == "" {
		if created := getString(resource, "createdDate", "created"); created != "" {
			out["created"] = created
		}
	}
	ensureReferenceIfMissing(out, "patient", getString(resource, "patientReference"))
	ensureReferenceIfMissing(out, "provider", getString(resource, "providerReference"))

	return out, requireAll("Claim", out, "status", "use", "patient", "created")
}
