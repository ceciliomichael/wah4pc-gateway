package schemabuilder

func buildChargeItem(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "ChargeItem"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/ChargeItem")

	if getString(out, "status") == "" {
		if status := getString(resource, "chargeItemStatus", "status"); status != "" {
			out["status"] = status
		}
	}

	codeSystem := getString(resource, "chargeItemCodeSystem", "codeSystem")
	code := getString(resource, "chargeItemCode", "code")
	setCodeableConceptIfMissing(out, "code", codeSystem, code)
	ensureReferenceIfMissing(out, "subject", getString(resource, "patientReference", "subjectReference"))

	return out, requireAll("ChargeItem", out, "status", "code", "subject")
}
