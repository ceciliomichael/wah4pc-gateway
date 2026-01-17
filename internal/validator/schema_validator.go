package validator

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Supported resource types for validation
var supportedResourceTypes = map[string]string{
	"Patient":      "StructureDefinition-ph-core-patient.json",
	"Procedure":    "StructureDefinition-ph-core-procedure.json",
	"Immunization": "StructureDefinition-ph-core-immunization.json",
	"Observation":  "StructureDefinition-ph-core-observation.json",
	"Medication":   "StructureDefinition-ph-core-medication.json",
	"Encounter":    "StructureDefinition-ph-core-encounter.json",
}

// Validation errors
var (
	ErrValidationFailed         = errors.New("schema validation failed")
	ErrUnsupportedResource      = errors.New("unsupported resource type")
	ErrMissingProfile           = errors.New("missing required profile URL in meta.profile")
	ErrInvalidProfile           = errors.New("invalid profile URL")
	ErrMissingResourceType      = errors.New("missing resourceType field")
	ErrResourceTypeMismatch     = errors.New("resourceType does not match expected type")
	ErrMissingRequiredField     = errors.New("missing required field")
	ErrMissingRequiredExtension = errors.New("missing required extension")
)

// ProfileDefinition holds the parsed schema requirements for a resource type
type ProfileDefinition struct {
	URL                string
	ResourceType       string
	FHIRVersion        string
	RequiredFields     []string               // Simple required fields (min >= 1)
	RequiredExtensions []ExtensionRequirement // Required extensions with their profile URLs
}

// ExtensionRequirement defines a required extension with its identifying URL
type ExtensionRequirement struct {
	SliceName  string // e.g., "indigenousPeople"
	ProfileURL string // The extension profile URL to match
	Min        int    // Minimum occurrences required
}

// StructureDefinition represents the FHIR StructureDefinition resource
type StructureDefinition struct {
	ResourceType string       `json:"resourceType"`
	ID           string       `json:"id"`
	URL          string       `json:"url"`
	Name         string       `json:"name"`
	Type         string       `json:"type"`
	FHIRVersion  string       `json:"fhirVersion"`
	Differential Differential `json:"differential"`
}

// Differential contains the element definitions
type Differential struct {
	Elements []Element `json:"element"`
}

// Element represents a single element in the differential
type Element struct {
	ID        string        `json:"id"`
	Path      string        `json:"path"`
	SliceName string        `json:"sliceName,omitempty"`
	Min       int           `json:"min"`
	Max       string        `json:"max,omitempty"`
	Types     []ElementType `json:"type,omitempty"`
}

// ElementType represents the type definition of an element
type ElementType struct {
	Code     string   `json:"code"`
	Profiles []string `json:"profile,omitempty"`
}

// SchemaValidator validates FHIR resources against PH Core StructureDefinitions
type SchemaValidator struct {
	profiles map[string]*ProfileDefinition
}

// NewSchemaValidator creates a new schema validator by loading definitions from the resources directory
func NewSchemaValidator(resourceDir string) (*SchemaValidator, error) {
	validator := &SchemaValidator{
		profiles: make(map[string]*ProfileDefinition),
	}

	for resourceType, filename := range supportedResourceTypes {
		filePath := filepath.Join(resourceDir, filename)
		profile, err := loadProfileDefinition(filePath, resourceType)
		if err != nil {
			return nil, fmt.Errorf("failed to load %s schema: %w", resourceType, err)
		}
		validator.profiles[resourceType] = profile
	}

	return validator, nil
}

// loadProfileDefinition reads and parses a StructureDefinition file
func loadProfileDefinition(filePath string, expectedType string) (*ProfileDefinition, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	var sd StructureDefinition
	if err := json.Unmarshal(data, &sd); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	// Validate the StructureDefinition
	if sd.ResourceType != "StructureDefinition" {
		return nil, fmt.Errorf("invalid resource type: expected StructureDefinition, got %s", sd.ResourceType)
	}
	if sd.Type != expectedType {
		return nil, fmt.Errorf("type mismatch: expected %s, got %s", expectedType, sd.Type)
	}

	profile := &ProfileDefinition{
		URL:                sd.URL,
		ResourceType:       sd.Type,
		FHIRVersion:        sd.FHIRVersion,
		RequiredFields:     make([]string, 0),
		RequiredExtensions: make([]ExtensionRequirement, 0),
	}

	// Parse differential elements to find required fields and extensions
	for _, elem := range sd.Differential.Elements {
		if elem.Min >= 1 {
			// Check if this is an extension slice
			if strings.Contains(elem.Path, ".extension") && elem.SliceName != "" {
				// This is a required extension
				var profileURL string
				if len(elem.Types) > 0 && len(elem.Types[0].Profiles) > 0 {
					profileURL = elem.Types[0].Profiles[0]
				}
				profile.RequiredExtensions = append(profile.RequiredExtensions, ExtensionRequirement{
					SliceName:  elem.SliceName,
					ProfileURL: profileURL,
					Min:        elem.Min,
				})
			} else if !strings.Contains(elem.ID, ":") {
				// Not a slice, and has min >= 1: it's a required field
				// Extract the field path relative to the resource type
				fieldPath := strings.TrimPrefix(elem.Path, sd.Type+".")
				if fieldPath != "" && fieldPath != elem.Path {
					profile.RequiredFields = append(profile.RequiredFields, fieldPath)
				}
			}
		}
	}

	return profile, nil
}

// Validate checks if the given FHIR resource data conforms to the expected schema
func (v *SchemaValidator) Validate(resourceType string, data json.RawMessage) error {
	// Check if we support this resource type
	profile, ok := v.profiles[resourceType]
	if !ok {
		return fmt.Errorf("%w: %s", ErrUnsupportedResource, resourceType)
	}

	// Parse the incoming data
	var resource map[string]interface{}
	if err := json.Unmarshal(data, &resource); err != nil {
		return fmt.Errorf("%w: invalid JSON: %v", ErrValidationFailed, err)
	}

	// Validate resourceType field
	actualType, ok := resource["resourceType"].(string)
	if !ok {
		return fmt.Errorf("%w: resourceType field is missing or not a string", ErrMissingResourceType)
	}
	if actualType != resourceType {
		return fmt.Errorf("%w: expected %s, got %s", ErrResourceTypeMismatch, resourceType, actualType)
	}

	// Validate meta.profile contains the required profile URL
	if err := v.validateProfile(resource, profile.URL); err != nil {
		return err
	}

	// Validate required extensions
	if err := v.validateRequiredExtensions(resource, profile.RequiredExtensions); err != nil {
		return err
	}

	// Validate required fields
	if err := v.validateRequiredFields(resource, profile.RequiredFields); err != nil {
		return err
	}

	return nil
}

// validateProfile checks that meta.profile contains the expected profile URL
func (v *SchemaValidator) validateProfile(resource map[string]interface{}, expectedURL string) error {
	meta, ok := resource["meta"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("%w: meta object is missing", ErrMissingProfile)
	}

	profiles, ok := meta["profile"].([]interface{})
	if !ok {
		return fmt.Errorf("%w: meta.profile array is missing", ErrMissingProfile)
	}

	for _, p := range profiles {
		if profileStr, ok := p.(string); ok && profileStr == expectedURL {
			return nil
		}
	}

	return fmt.Errorf("%w: expected %s in meta.profile, but found %v", ErrInvalidProfile, expectedURL, profiles)
}

// validateRequiredExtensions checks that all required extensions are present
func (v *SchemaValidator) validateRequiredExtensions(resource map[string]interface{}, requirements []ExtensionRequirement) error {
	extensions, _ := resource["extension"].([]interface{})

	for _, req := range requirements {
		if req.Min < 1 {
			continue
		}

		found := false
		for _, ext := range extensions {
			extMap, ok := ext.(map[string]interface{})
			if !ok {
				continue
			}
			extURL, ok := extMap["url"].(string)
			if !ok {
				continue
			}
			// Match by profile URL
			if extURL == req.ProfileURL {
				found = true
				break
			}
		}

		if !found {
			return fmt.Errorf("%w: extension '%s' with url '%s' is required",
				ErrMissingRequiredExtension, req.SliceName, req.ProfileURL)
		}
	}

	return nil
}

// validateRequiredFields checks that all required fields are present
func (v *SchemaValidator) validateRequiredFields(resource map[string]interface{}, requiredFields []string) error {
	for _, fieldPath := range requiredFields {
		if !v.fieldExists(resource, fieldPath) {
			return fmt.Errorf("%w: %s", ErrMissingRequiredField, fieldPath)
		}
	}
	return nil
}

// fieldExists checks if a field exists at the given dot-notation path
func (sv *SchemaValidator) fieldExists(data map[string]interface{}, path string) bool {
	parts := strings.Split(path, ".")
	current := data

	for i, part := range parts {
		if current == nil {
			return false
		}

		val, ok := current[part]
		if !ok {
			return false
		}

		// If this is the last part, we just need it to exist
		if i == len(parts)-1 {
			return true
		}

		// Navigate deeper
		switch typedVal := val.(type) {
		case map[string]interface{}:
			current = typedVal
		case []interface{}:
			// For arrays, check if any element has the remaining path
			if len(typedVal) == 0 {
				return false
			}
			remainingPath := strings.Join(parts[i+1:], ".")
			for _, item := range typedVal {
				if itemMap, ok := item.(map[string]interface{}); ok {
					if sv.fieldExists(itemMap, remainingPath) {
						return true
					}
				}
			}
			return false
		default:
			return false
		}
	}

	return true
}

// GetSupportedResourceTypes returns the list of resource types this validator supports
func (v *SchemaValidator) GetSupportedResourceTypes() []string {
	types := make([]string, 0, len(v.profiles))
	for t := range v.profiles {
		types = append(types, t)
	}
	return types
}

// GetProfileURL returns the expected profile URL for a given resource type
func (v *SchemaValidator) GetProfileURL(resourceType string) (string, error) {
	profile, ok := v.profiles[resourceType]
	if !ok {
		return "", fmt.Errorf("%w: %s", ErrUnsupportedResource, resourceType)
	}
	return profile.URL, nil
}

// IsSupported checks if a resource type is supported for validation
func (v *SchemaValidator) IsSupported(resourceType string) bool {
	_, ok := v.profiles[resourceType]
	return ok
}
