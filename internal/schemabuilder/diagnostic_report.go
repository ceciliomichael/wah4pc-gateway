package schemabuilder

func buildDiagnosticReport(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "DiagnosticReport"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/DiagnosticReport")

	if getString(out, "status") == "" {
		if status := getString(resource, "diagnosticReportStatus", "status"); status != "" {
			out["status"] = status
		}
	}
	codeSystem := getString(resource, "reportCodeSystem", "codeSystem")
	code := getString(resource, "reportCode", "code")
	setCodeableConceptIfMissing(out, "code", codeSystem, code)
	ensureReferenceIfMissing(out, "subject", getString(resource, "patientReference", "subjectReference"))

	return out, requireAll("DiagnosticReport", out, "status", "code")
}
