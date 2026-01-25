package validator

import "encoding/json"

// Validator defines the interface for FHIR resource validation
type Validator interface {
	// Validate checks if the FHIR resource data is valid.
	// Returns nil if the resource is valid, or an error describing the validation failure.
	Validate(resourceType string, data json.RawMessage) error
}