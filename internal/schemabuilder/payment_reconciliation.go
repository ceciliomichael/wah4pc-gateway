package schemabuilder

func buildPaymentReconciliation(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "PaymentReconciliation"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/PaymentReconciliation")

	if getString(out, "status") == "" {
		if status := getString(resource, "paymentReconciliationStatus", "status"); status != "" {
			out["status"] = status
		}
	}
	if getString(out, "created") == "" {
		if created := getString(resource, "createdDate", "created"); created != "" {
			out["created"] = created
		}
	}

	return out, requireAll("PaymentReconciliation", out, "status", "created")
}
