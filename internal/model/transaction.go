package model

import "time"

// TransactionStatus represents the state of a FHIR transfer
type TransactionStatus string

const (
	StatusPending   TransactionStatus = "PENDING"
	StatusReceived  TransactionStatus = "RECEIVED"
	StatusCompleted TransactionStatus = "COMPLETED"
	StatusFailed    TransactionStatus = "FAILED"
)

// TransactionMetadata contains additional context for the transfer
type TransactionMetadata struct {
	Reason string `json:"reason,omitempty"`
	Notes  string `json:"notes,omitempty"`
}

// Transaction represents a FHIR resource transfer request
type Transaction struct {
	ID           string              `json:"id"`
	RequesterID  string              `json:"requesterId"`
	TargetID     string              `json:"targetId"`
	Identifiers  []Identifier        `json:"identifiers"` // FHIR-compliant patient identifiers (system + value)
	ResourceType string              `json:"resourceType"`
	Status       TransactionStatus   `json:"status"`
	Metadata     TransactionMetadata `json:"metadata"`
	CreatedAt    time.Time           `json:"createdAt"`
	UpdatedAt    time.Time           `json:"updatedAt"`
}

// Identifiable interface for generic repository
func (t Transaction) GetID() string {
	return t.ID
}
