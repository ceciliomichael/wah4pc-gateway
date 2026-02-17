package schemabuilder

func buildClaimResponse(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "ClaimResponse"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/ClaimResponse")

	if getString(out, "status") == "" {
		if status := getString(resource, "claimResponseStatus", "status"); status != "" {
			out["status"] = status
		}
	}
	if getString(out, "use") == "" {
		if use := getString(resource, "claimResponseUse", "use"); use != "" {
			out["use"] = use
		}
	}
	if getString(out, "created") == "" {
		if created := getString(resource, "createdDate", "created"); created != "" {
			out["created"] = created
		}
	}
	ensureReferenceIfMissing(out, "patient", getString(resource, "patientReference"))
	if getString(out, "outcome") == "" {
		if outcome := getString(resource, "claimOutcome", "outcome"); outcome != "" {
			out["outcome"] = outcome
		}
	}

	return out, requireAll("ClaimResponse", out, "status", "use", "patient", "created", "outcome")
}
