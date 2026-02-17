package schemabuilder

func buildOrganization(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Organization"
	ensureMetaProfile(out, canonicalProfiles["Organization"])

	if getString(out, "name") == "" {
		if name := getString(resource, "organizationName", "name"); name != "" {
			out["name"] = name
		}
	}

	idSystem := getString(resource, "identifierSystem", "organizationIdentifierSystem")
	idValue := getString(resource, "identifierValue", "organizationIdentifierValue", "organizationIdentifier")
	setIdentifierIfMissing(out, idSystem, idValue)

	return out, requireAny("Organization", out, "name", "identifier")
}
