package service

import (
	"encoding/json"
	"testing"
)

func TestNormalizeCanonicalProfiles_RewritesPHCoreResourceProfile(t *testing.T) {
	input := json.RawMessage(`{
		"resourceType":"Bundle",
		"type":"collection",
		"entry":[
			{
				"resource":{
					"resourceType":"Patient",
					"id":"pat-1",
					"meta":{"profile":["http://provider.local/StructureDefinition/patient-custom"]}
				}
			}
		]
	}`)

	normalized, audit := normalizeCanonicalProfiles(input)
	if !audit.Applied {
		t.Fatal("expected normalization to be applied")
	}
	if len(audit.OriginalProfiles) != 1 || audit.OriginalProfiles[0] != "http://provider.local/StructureDefinition/patient-custom" {
		t.Fatalf("unexpected original profiles: %#v", audit.OriginalProfiles)
	}
	if len(audit.NormalizedProfiles) != 1 || audit.NormalizedProfiles[0] != "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient" {
		t.Fatalf("unexpected normalized profiles: %#v", audit.NormalizedProfiles)
	}

	var bundle map[string]interface{}
	if err := json.Unmarshal(normalized, &bundle); err != nil {
		t.Fatalf("failed to unmarshal normalized payload: %v", err)
	}

	profile := firstProfileFromBundleEntryResource(t, bundle, 0)
	if profile != "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient" {
		t.Fatalf("expected canonical PH Core patient profile, got %q", profile)
	}
}

func TestNormalizeCanonicalProfiles_RewritesBaseR4Fallback(t *testing.T) {
	input := json.RawMessage(`{
		"resourceType":"Condition",
		"id":"cond-1",
		"meta":{"profile":["http://provider.local/StructureDefinition/condition-custom"]}
	}`)

	normalized, audit := normalizeCanonicalProfiles(input)
	if !audit.Applied {
		t.Fatal("expected normalization to be applied")
	}
	if len(audit.NormalizedProfiles) != 1 || audit.NormalizedProfiles[0] != "http://hl7.org/fhir/StructureDefinition/Condition" {
		t.Fatalf("unexpected normalized profiles: %#v", audit.NormalizedProfiles)
	}

	var resource map[string]interface{}
	if err := json.Unmarshal(normalized, &resource); err != nil {
		t.Fatalf("failed to unmarshal normalized payload: %v", err)
	}

	meta, _ := resource["meta"].(map[string]interface{})
	profiles, _ := meta["profile"].([]interface{})
	if len(profiles) != 1 || profiles[0] != "http://hl7.org/fhir/StructureDefinition/Condition" {
		t.Fatalf("expected canonical base R4 condition profile, got %#v", profiles)
	}
}

func TestNormalizeCanonicalProfiles_NoChangeWhenAlreadyCanonical(t *testing.T) {
	input := json.RawMessage(`{
		"resourceType":"Observation",
		"id":"obs-1",
		"meta":{"profile":["urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation"]}
	}`)

	normalized, audit := normalizeCanonicalProfiles(input)
	if audit.Applied {
		t.Fatalf("expected no normalization changes, got audit: %#v", audit)
	}
	if string(normalized) != string(input) {
		t.Fatal("expected payload to remain unchanged")
	}
}

func firstProfileFromBundleEntryResource(t *testing.T, bundle map[string]interface{}, index int) string {
	t.Helper()

	entry, ok := bundle["entry"].([]interface{})
	if !ok || len(entry) <= index {
		t.Fatalf("bundle.entry missing at index %d", index)
	}

	entryObj, ok := entry[index].(map[string]interface{})
	if !ok {
		t.Fatalf("bundle.entry[%d] is not an object", index)
	}

	resource, ok := entryObj["resource"].(map[string]interface{})
	if !ok {
		t.Fatalf("bundle.entry[%d].resource is not an object", index)
	}

	meta, ok := resource["meta"].(map[string]interface{})
	if !ok {
		t.Fatalf("bundle.entry[%d].resource.meta is not an object", index)
	}

	profiles, ok := meta["profile"].([]interface{})
	if !ok || len(profiles) == 0 {
		t.Fatalf("bundle.entry[%d].resource.meta.profile missing", index)
	}

	profile, ok := profiles[0].(string)
	if !ok {
		t.Fatalf("bundle.entry[%d].resource.meta.profile[0] is not a string", index)
	}

	return profile
}
