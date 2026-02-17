package schemabuilder

func buildPractitionerRole(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "PractitionerRole"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/PractitionerRole")

	ensureReferenceIfMissing(out, "practitioner", getString(resource, "practitionerReference"))
	ensureReferenceIfMissing(out, "organization", getString(resource, "organizationReference"))
	if _, ok := out["active"]; !ok {
		if raw, exists := resource["active"]; exists {
			out["active"] = raw
		}
	}

	return out, requireAny("PractitionerRole", out, "practitioner", "organization", "code")
}
