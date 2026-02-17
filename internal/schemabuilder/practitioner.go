package schemabuilder

func buildPractitioner(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Practitioner"
	ensureMetaProfile(out, canonicalProfiles["Practitioner"])

	firstName := getString(resource, "firstName", "givenName")
	lastName := getString(resource, "lastName", "familyName", "surname")
	setNameIfMissing(out, firstName, lastName)

	idSystem := getString(resource, "identifierSystem", "idSystem")
	idValue := getString(resource, "identifierValue", "idValue", "practitionerIdentifier")
	setIdentifierIfMissing(out, idSystem, idValue)

	return out, requireAll("Practitioner", out, "identifier", "name")
}
