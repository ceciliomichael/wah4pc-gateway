package schemabuilder

func buildPatient(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Patient"
	ensureMetaProfile(out, canonicalProfiles["Patient"])

	firstName := getString(resource, "firstName", "givenName")
	lastName := getString(resource, "lastName", "familyName", "surname")
	setNameIfMissing(out, firstName, lastName)

	idSystem := getString(resource, "identifierSystem", "idSystem")
	idValue := getString(resource, "identifierValue", "idValue", "patientIdentifier")
	setIdentifierIfMissing(out, idSystem, idValue)
	ensurePatientIndigenousExtension(out)

	return out, requireAll("Patient", out, "identifier", "name", "extension")
}
