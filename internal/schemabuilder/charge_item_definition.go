package schemabuilder

func buildChargeItemDefinition(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "ChargeItemDefinition"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/ChargeItemDefinition")

	if getString(out, "url") == "" {
		if url := getString(resource, "definitionUrl", "url"); url != "" {
			out["url"] = url
		}
	}
	if getString(out, "status") == "" {
		if status := getString(resource, "definitionStatus", "status"); status != "" {
			out["status"] = status
		}
	}

	codeSystem := getString(resource, "chargeItemCodeSystem", "codeSystem")
	code := getString(resource, "chargeItemCode", "code")
	setCodeableConceptIfMissing(out, "code", codeSystem, code)

	return out, requireAll("ChargeItemDefinition", out, "url", "status")
}
