package service

import (
	"encoding/json"
	"sort"
	"strings"
)

var phCoreCanonicalProfiles = map[string]string{
	"Patient":      "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-patient",
	"Encounter":    "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-encounter",
	"Procedure":    "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-procedure",
	"Immunization": "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-immunization",
	"Observation":  "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-observation",
	"Medication":   "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-medication",
	"Location":     "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-location",
	"Organization": "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-organization",
	"Practitioner": "urn://example.com/ph-core/fhir/StructureDefinition/ph-core-practitioner",
}

type profileNormalizationAudit struct {
	Applied            bool
	OriginalProfiles   []string
	NormalizedProfiles []string
	ResourcesTouched   int
	ResourcesSkipped   int
}

func normalizeCanonicalProfiles(data json.RawMessage) (json.RawMessage, profileNormalizationAudit) {
	audit := profileNormalizationAudit{}
	trimmed := strings.TrimSpace(string(data))
	if trimmed == "" {
		return data, audit
	}

	var payload interface{}
	if err := json.Unmarshal(data, &payload); err != nil {
		return data, audit
	}

	switch typed := payload.(type) {
	case map[string]interface{}:
		if isFHIRBundle(typed) {
			normalizeBundleEntries(typed, &audit)
		} else {
			normalizeResourceProfiles(typed, &audit)
		}
	case []interface{}:
		for _, raw := range typed {
			resource, ok := raw.(map[string]interface{})
			if !ok {
				audit.ResourcesSkipped++
				continue
			}
			normalizeResourceProfiles(resource, &audit)
		}
	default:
		return data, audit
	}

	if !audit.Applied {
		return data, finalizeProfileAudit(audit)
	}

	normalized, err := json.Marshal(payload)
	if err != nil {
		return data, profileNormalizationAudit{}
	}

	return normalized, finalizeProfileAudit(audit)
}

func isFHIRBundle(resource map[string]interface{}) bool {
	resourceType, _ := resource["resourceType"].(string)
	return resourceType == "Bundle"
}

func normalizeBundleEntries(bundle map[string]interface{}, audit *profileNormalizationAudit) {
	entryRaw, ok := bundle["entry"]
	if !ok {
		audit.ResourcesSkipped++
		return
	}

	entries, ok := entryRaw.([]interface{})
	if !ok {
		audit.ResourcesSkipped++
		return
	}

	for _, rawEntry := range entries {
		entry, ok := rawEntry.(map[string]interface{})
		if !ok {
			audit.ResourcesSkipped++
			continue
		}
		resource, ok := entry["resource"].(map[string]interface{})
		if !ok {
			audit.ResourcesSkipped++
			continue
		}
		normalizeResourceProfiles(resource, audit)
	}
}

func normalizeResourceProfiles(resource map[string]interface{}, audit *profileNormalizationAudit) {
	resourceType, _ := resource["resourceType"].(string)
	if resourceType == "" {
		audit.ResourcesSkipped++
		return
	}

	canonicalURI, ok := canonicalProfileURI(resourceType)
	if !ok {
		audit.ResourcesSkipped++
		return
	}

	originalProfiles := extractMetaProfiles(resource)
	if !shouldRewriteProfiles(originalProfiles, canonicalURI) {
		return
	}

	audit.Applied = true
	audit.ResourcesTouched++
	audit.OriginalProfiles = append(audit.OriginalProfiles, originalProfiles...)
	audit.NormalizedProfiles = append(audit.NormalizedProfiles, canonicalURI)
	setCanonicalMetaProfile(resource, canonicalURI)
}

func canonicalProfileURI(resourceType string) (string, bool) {
	if uri, ok := phCoreCanonicalProfiles[resourceType]; ok {
		return uri, true
	}

	if _, ok := allowedResourceTypes[resourceType]; ok {
		return "http://hl7.org/fhir/StructureDefinition/" + resourceType, true
	}

	return "", false
}

func extractMetaProfiles(resource map[string]interface{}) []string {
	meta, ok := resource["meta"].(map[string]interface{})
	if !ok {
		return nil
	}
	profilesRaw, ok := meta["profile"]
	if !ok {
		return nil
	}

	switch profiles := profilesRaw.(type) {
	case string:
		if strings.TrimSpace(profiles) == "" {
			return nil
		}
		return []string{profiles}
	case []interface{}:
		result := make([]string, 0, len(profiles))
		for _, raw := range profiles {
			profile, ok := raw.(string)
			if !ok || strings.TrimSpace(profile) == "" {
				continue
			}
			result = append(result, profile)
		}
		return result
	default:
		return nil
	}
}

func shouldRewriteProfiles(existing []string, canonical string) bool {
	return len(existing) != 1 || existing[0] != canonical
}

func setCanonicalMetaProfile(resource map[string]interface{}, canonical string) {
	meta, ok := resource["meta"].(map[string]interface{})
	if !ok {
		meta = map[string]interface{}{}
		resource["meta"] = meta
	}
	meta["profile"] = []interface{}{canonical}
}

func finalizeProfileAudit(audit profileNormalizationAudit) profileNormalizationAudit {
	audit.OriginalProfiles = dedupeAndSort(audit.OriginalProfiles)
	audit.NormalizedProfiles = dedupeAndSort(audit.NormalizedProfiles)
	return audit
}

func dedupeAndSort(values []string) []string {
	if len(values) == 0 {
		return nil
	}

	seen := make(map[string]struct{}, len(values))
	deduped := make([]string, 0, len(values))
	for _, value := range values {
		if _, ok := seen[value]; ok {
			continue
		}
		seen[value] = struct{}{}
		deduped = append(deduped, value)
	}
	sort.Strings(deduped)
	return deduped
}
