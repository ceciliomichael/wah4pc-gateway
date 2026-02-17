package schemabuilder

func buildNutritionOrder(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "NutritionOrder"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/NutritionOrder")

	ensureReferenceIfMissing(out, "patient", getString(resource, "patientReference"))
	if getString(out, "dateTime") == "" {
		if dateTime := getString(resource, "orderDateTime", "dateTime"); dateTime != "" {
			out["dateTime"] = dateTime
		}
	}
	if getString(out, "status") == "" {
		if status := getString(resource, "nutritionOrderStatus", "status"); status != "" {
			out["status"] = status
		}
	}

	return out, requireAll("NutritionOrder", out, "patient", "dateTime")
}
