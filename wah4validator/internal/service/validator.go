package service

import (
	"context"
)

// ValidatorService defines the interface for managing the FHIR validator process
type ValidatorService interface {
	// Start launches the validator process
	Start(ctx context.Context) error
	// Stop terminates the validator process
	Stop() error
	// IsReady checks if the validator is ready to accept requests
	IsReady() bool
	// GetTargetURL returns the URL where the validator is listening
	GetTargetURL() string
}