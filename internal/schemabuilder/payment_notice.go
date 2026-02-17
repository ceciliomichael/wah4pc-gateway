package schemabuilder

func buildPaymentNotice(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "PaymentNotice"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/PaymentNotice")

	if getString(out, "status") == "" {
		if status := getString(resource, "paymentNoticeStatus", "status"); status != "" {
			out["status"] = status
		}
	}
	if getString(out, "created") == "" {
		if created := getString(resource, "createdDate", "created"); created != "" {
			out["created"] = created
		}
	}
	ensureReferenceIfMissing(out, "request", getString(resource, "requestReference"))
	ensureReferenceIfMissing(out, "payment", getString(resource, "paymentReference"))
	ensureReferenceIfMissing(out, "recipient", getString(resource, "recipientReference"))

	return out, requireAll("PaymentNotice", out, "status", "created", "payment")
}
