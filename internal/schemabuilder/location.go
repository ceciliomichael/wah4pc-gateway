package schemabuilder

func buildLocation(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Location"
	ensureMetaProfile(out, canonicalProfiles["Location"])

	if getString(out, "name") == "" {
		if name := getString(resource, "locationName", "name"); name != "" {
			out["name"] = name
		}
	}
	if getString(out, "status") == "" {
		if status := getString(resource, "locationStatus", "status"); status != "" {
			out["status"] = status
		}
	}

	idSystem := getString(resource, "identifierSystem", "locationIdentifierSystem")
	idValue := getString(resource, "identifierValue", "locationIdentifierValue", "locationIdentifier")
	setIdentifierIfMissing(out, idSystem, idValue)
	ensureReferenceIfMissing(out, "managingOrganization", getString(resource, "organizationReference"))

	return out, requireAny("Location", out, "name", "identifier")
}
