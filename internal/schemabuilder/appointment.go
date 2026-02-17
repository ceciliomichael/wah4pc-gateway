package schemabuilder

func buildAppointment(resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = "Appointment"
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/Appointment")

	if getString(out, "status") == "" {
		if status := getString(resource, "appointmentStatus", "status"); status != "" {
			out["status"] = status
		}
	}

	if getString(out, "start") == "" {
		if start := getString(resource, "startDateTime", "start"); start != "" {
			out["start"] = start
		}
	}
	if getString(out, "end") == "" {
		if end := getString(resource, "endDateTime", "end"); end != "" {
			out["end"] = end
		}
	}

	if _, ok := out["participant"]; !ok {
		if ref := getString(resource, "patientReference"); ref != "" {
			out["participant"] = []interface{}{
				map[string]interface{}{
					"actor": map[string]interface{}{
						"reference": ref,
					},
				},
			}
		}
	}

	return out, requireAll("Appointment", out, "status", "start")
}
