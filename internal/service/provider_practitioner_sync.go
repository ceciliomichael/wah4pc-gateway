package service

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

const practitionerListMaxPayloadBytes = 2 * 1024 * 1024

func normalizePractitionerListEndpoint(raw string) (string, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return "", nil
	}

	if strings.HasPrefix(trimmed, "http://") || strings.HasPrefix(trimmed, "https://") {
		return "", fmt.Errorf("practitionerListEndpoint must be a relative path")
	}

	if !strings.HasPrefix(trimmed, "/") {
		trimmed = "/" + trimmed
	}

	return trimmed, nil
}

func (s *ProviderService) syncPractitionerListOnSave(provider *model.Provider) {
	provider.PractitionerListSyncError = ""
	provider.PractitionerListLastSyncedAt = time.Time{}
	if provider.PractitionerListEndpoint == "" {
		provider.PractitionerList = nil
		return
	}

	practitioners, err := fetchProviderPractitionerList(
		s.httpClient,
		provider.BaseURL,
		provider.PractitionerListEndpoint,
		provider.GatewayAuthKey,
	)
	if err != nil {
		provider.PractitionerListSyncError = err.Error()
		return
	}

	provider.PractitionerList = practitioners
	provider.PractitionerListLastSyncedAt = time.Now().UTC()
}

func fetchProviderPractitionerList(
	client *http.Client,
	baseURL string,
	endpoint string,
	gatewayAuthKey string,
) ([]model.ProviderPractitioner, error) {
	requestURL, err := buildProviderEndpointURL(baseURL, endpoint)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest(http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/json")
	if gatewayAuthKey != "" {
		req.Header.Set("X-Gateway-Auth", gatewayAuthKey)
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch practitioner list: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("practitioner list endpoint returned %s", resp.Status)
	}

	limitedBody := io.LimitReader(resp.Body, practitionerListMaxPayloadBytes)
	var payload interface{}
	if err := json.NewDecoder(limitedBody).Decode(&payload); err != nil {
		return nil, fmt.Errorf("invalid practitioner list payload: %w", err)
	}

	items := normalizePractitionerPayload(payload)
	if len(items) == 0 {
		return nil, fmt.Errorf("practitioner list payload did not contain usable practitioners")
	}
	return items, nil
}

func normalizePractitionerPayload(payload interface{}) []model.ProviderPractitioner {
	candidates := extractPractitionerCandidates(payload)
	result := make([]model.ProviderPractitioner, 0, len(candidates))
	seen := make(map[string]struct{})

	for _, candidate := range candidates {
		item, ok := normalizePractitionerCandidate(candidate)
		if !ok {
			continue
		}
		if _, exists := seen[item.Code]; exists {
			continue
		}
		seen[item.Code] = struct{}{}
		result = append(result, item)
	}
	return result
}

func extractPractitionerCandidates(payload interface{}) []interface{} {
	switch typed := payload.(type) {
	case []interface{}:
		return typed
	case map[string]interface{}:
		if resourceType, _ := typed["resourceType"].(string); resourceType == "Bundle" {
			if entry, ok := typed["entry"].([]interface{}); ok {
				return extractCandidatesFromBundleEntries(entry)
			}
		}

		for _, key := range []string{"practitioners", "items", "data", "entry"} {
			if arr, ok := typed[key].([]interface{}); ok {
				if key == "entry" {
					return extractCandidatesFromBundleEntries(arr)
				}
				return arr
			}
		}

		return []interface{}{typed}
	default:
		return nil
	}
}

func extractCandidatesFromBundleEntries(entries []interface{}) []interface{} {
	candidates := make([]interface{}, 0, len(entries))
	for _, entry := range entries {
		entryMap, ok := entry.(map[string]interface{})
		if !ok {
			continue
		}
		if resource, exists := entryMap["resource"]; exists {
			candidates = append(candidates, resource)
			continue
		}
		candidates = append(candidates, entryMap)
	}
	return candidates
}

func normalizePractitionerCandidate(raw interface{}) (model.ProviderPractitioner, bool) {
	item := model.ProviderPractitioner{
		Active: true,
	}

	rawMap, ok := raw.(map[string]interface{})
	if !ok {
		return item, false
	}

	item.Code = firstNonEmptyStringFromMap(rawMap, "code", "id", "practitionerId", "practitionerID")
	item.Display = firstNonEmptyStringFromMap(rawMap, "display", "name", "fullName", "label", "title")
	if item.Display == "" {
		item.Display = deriveDisplayFromFHIRName(rawMap)
	}

	if activeValue, exists := rawMap["active"].(bool); exists {
		item.Active = activeValue
	}

	if strings.TrimSpace(item.Code) == "" || strings.TrimSpace(item.Display) == "" {
		return item, false
	}

	return item, true
}

func firstNonEmptyStringFromMap(input map[string]interface{}, keys ...string) string {
	for _, key := range keys {
		value, ok := input[key]
		if !ok {
			continue
		}
		if str, ok := value.(string); ok && strings.TrimSpace(str) != "" {
			return strings.TrimSpace(str)
		}
	}
	return ""
}

func deriveDisplayFromFHIRName(rawMap map[string]interface{}) string {
	nameField, exists := rawMap["name"]
	if !exists {
		return ""
	}

	nameList, ok := nameField.([]interface{})
	if !ok || len(nameList) == 0 {
		return ""
	}

	nameObj, ok := nameList[0].(map[string]interface{})
	if !ok {
		return ""
	}

	parts := make([]string, 0, 3)
	if prefixes, ok := nameObj["prefix"].([]interface{}); ok {
		if prefix := firstStringValue(prefixes); prefix != "" {
			parts = append(parts, prefix)
		}
	}
	if given, ok := nameObj["given"].([]interface{}); ok {
		if givenNames := strings.TrimSpace(strings.Join(stringSlice(given), " ")); givenNames != "" {
			parts = append(parts, givenNames)
		}
	}
	if family, ok := nameObj["family"].(string); ok && strings.TrimSpace(family) != "" {
		parts = append(parts, strings.TrimSpace(family))
	}

	return strings.TrimSpace(strings.Join(parts, " "))
}

func firstStringValue(values []interface{}) string {
	for _, value := range values {
		if str, ok := value.(string); ok {
			trimmed := strings.TrimSpace(str)
			if trimmed != "" {
				return trimmed
			}
		}
	}
	return ""
}

func stringSlice(values []interface{}) []string {
	result := make([]string, 0, len(values))
	for _, value := range values {
		if str, ok := value.(string); ok && strings.TrimSpace(str) != "" {
			result = append(result, strings.TrimSpace(str))
		}
	}
	return result
}
