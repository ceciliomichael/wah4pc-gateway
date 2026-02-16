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
	Reason string `json:"reason,omitempty" bson:"reason,omitempty"`
	Notes  string `json:"notes,omitempty" bson:"notes,omitempty"`
}

// Transaction represents a FHIR resource transfer request
type Transaction struct {
	ID           string              `json:"id" bson:"id"`
	RequesterID  string              `json:"requesterId" bson:"requesterId"`
	TargetID     string              `json:"targetId" bson:"targetId"`
	Identifiers  []Identifier        `json:"identifiers" bson:"identifiers"` // FHIR-compliant patient identifiers (system + value)
	Selector     QuerySelector       `json:"selector,omitempty" bson:"selector,omitempty"`
	ResourceType string              `json:"resourceType" bson:"resourceType"`
	Status       TransactionStatus   `json:"status" bson:"status"`
	Metadata     TransactionMetadata `json:"metadata" bson:"metadata"`
	CreatedAt    time.Time           `json:"createdAt" bson:"createdAt"`
	UpdatedAt    time.Time           `json:"updatedAt" bson:"updatedAt"`
}

// Identifiable interface for generic repository
func (t Transaction) GetID() string {
	return t.ID
}
