package schemabuilder

import (
	"fmt"
	"strings"
)

var canonicalProfiles = map[string]string{
	"Patient":      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient",
	"Encounter":    "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter",
	"Procedure":    "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-procedure",
	"Immunization": "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-immunization",
	"Observation":  "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation",
	"Medication":   "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-medication",
	"Practitioner": "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-practitioner",
}

func buildVanilla(resourceType string, resource map[string]interface{}) (map[string]interface{}, error) {
	out := cloneMap(resource)
	out["resourceType"] = resourceType
	ensureMetaProfile(out, "http://hl7.org/fhir/StructureDefinition/"+resourceType)
	if len(out) == 1 {
		return nil, fmt.Errorf("missing required fields for %s", resourceType)
	}
	return out, nil
}

func cloneMap(in map[string]interface{}) map[string]interface{} {
	out := make(map[string]interface{}, len(in))
	for k, v := range in {
		out[k] = v
	}
	return out
}

func getString(m map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		raw, ok := m[key]
		if !ok {
			continue
		}
		value, ok := raw.(string)
		if !ok {
			continue
		}
		value = strings.TrimSpace(value)
		if value != "" {
			return value
		}
	}
	return ""
}

func getNestedString(m map[string]interface{}, key string, nested ...string) string {
	raw, ok := m[key]
	if !ok {
		return ""
	}
	obj, ok := raw.(map[string]interface{})
	if !ok {
		return ""
	}
	return getString(obj, nested...)
}

func setNameIfMissing(out map[string]interface{}, firstName, lastName string) {
	if _, ok := out["name"]; ok {
		return
	}
	if strings.TrimSpace(firstName) == "" && strings.TrimSpace(lastName) == "" {
		return
	}

	name := map[string]interface{}{}
	if strings.TrimSpace(lastName) != "" {
		name["family"] = strings.TrimSpace(lastName)
	}
	if strings.TrimSpace(firstName) != "" {
		name["given"] = []interface{}{strings.TrimSpace(firstName)}
	}
	out["name"] = []interface{}{name}
}

func setIdentifierIfMissing(out map[string]interface{}, system, value string) {
	if _, ok := out["identifier"]; ok {
		return
	}
	if strings.TrimSpace(system) == "" || strings.TrimSpace(value) == "" {
		return
	}

	out["identifier"] = []interface{}{
		map[string]interface{}{
			"system": strings.TrimSpace(system),
			"value":  strings.TrimSpace(value),
		},
	}
}

func setCodeableConceptIfMissing(out map[string]interface{}, key, system, code string) {
	if _, ok := out[key]; ok {
		return
	}
	if strings.TrimSpace(system) == "" || strings.TrimSpace(code) == "" {
		return
	}
	out[key] = map[string]interface{}{
		"coding": []interface{}{
			map[string]interface{}{
				"system": strings.TrimSpace(system),
				"code":   strings.TrimSpace(code),
			},
		},
	}
}

func hasAnyField(m map[string]interface{}, keys ...string) bool {
	for _, key := range keys {
		raw, ok := m[key]
		if !ok {
			continue
		}
		if str, ok := raw.(string); ok && strings.TrimSpace(str) == "" {
			continue
		}
		return true
	}
	return false
}

func requireAny(resourceType string, out map[string]interface{}, keys ...string) error {
	if hasAnyField(out, keys...) {
		return nil
	}
	return fmt.Errorf("missing required fields for %s (need one of: %s)", resourceType, strings.Join(keys, ", "))
}

func requireAll(resourceType string, out map[string]interface{}, keys ...string) error {
	missing := make([]string, 0)
	for _, key := range keys {
		if !hasAnyField(out, key) {
			missing = append(missing, key)
		}
	}
	if len(missing) == 0 {
		return nil
	}
	return fmt.Errorf("missing required fields for %s (missing: %s)", resourceType, strings.Join(missing, ", "))
}

func ensureMetaProfile(out map[string]interface{}, profile string) {
	if strings.TrimSpace(profile) == "" {
		return
	}
	meta, ok := out["meta"].(map[string]interface{})
	if !ok {
		meta = map[string]interface{}{}
		out["meta"] = meta
	}

	// If profile already exists and non-empty, keep provider-specified value.
	if existing, ok := meta["profile"]; ok {
		switch typed := existing.(type) {
		case string:
			if strings.TrimSpace(typed) != "" {
				return
			}
		case []interface{}:
			if len(typed) > 0 {
				return
			}
		}
	}
	meta["profile"] = []interface{}{profile}
}

func ensureReferenceIfMissing(out map[string]interface{}, key, ref string) {
	if _, ok := out[key]; ok {
		return
	}
	ref = strings.TrimSpace(ref)
	if ref == "" {
		return
	}
	out[key] = map[string]interface{}{"reference": ref}
}

func ensurePatientIndigenousExtension(out map[string]interface{}) {
	const indigenousURL = "urn://example.com/ph-core/fhir/StructureDefinition/indigenous-people"

	extensions, _ := out["extension"].([]interface{})
	for _, raw := range extensions {
		ext, ok := raw.(map[string]interface{})
		if !ok {
			continue
		}
		if getString(ext, "url") == indigenousURL {
			return
		}
	}

	newExt := map[string]interface{}{
		"url":          indigenousURL,
		"valueBoolean": false,
	}
	out["extension"] = append(extensions, newExt)
}
