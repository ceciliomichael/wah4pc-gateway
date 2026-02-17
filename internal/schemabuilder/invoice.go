package schemabuilder

func buildInvoice(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Invoice"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/Invoice")

	if getString(out, "status") == "" {
		if status := getString(resource, "invoiceStatus", "status"); status != "" {
			out["status"] = status
		}
	}
	if getString(out, "date") == "" {
		if date := getString(resource, "invoiceDate", "date"); date != "" {
			out["date"] = date
		}
	}
	ensureReferenceIfMissing(out, "subject", getString(resource, "patientReference", "subjectReference"))
	ensureReferenceIfMissing(out, "recipient", getString(resource, "recipientReference"))

	return out, requireAll("Invoice", out, "status")
}
