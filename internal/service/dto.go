package service

import (
	"encoding/json"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

// QueryRequest represents an incoming request to fetch FHIR resources
// This is the payload sent by requesters to initiate a data transfer
type QueryRequest struct {
	RequesterID  string              `json:"requesterId"`
	TargetID     string              `json:"targetId"`
	Identifiers  []model.Identifier  `json:"identifiers"` // Legacy: mapped to selector.patientIdentifiers when selector is omitted
	Selector     model.QuerySelector `json:"selector,omitempty"`
	ResourceType string              `json:"resourceType"`
	Reason       string              `json:"reason,omitempty"`
	Notes        string              `json:"notes,omitempty"`
}

// ProcessQueryPayload is sent to the target provider to request patient data
// The target provider uses this to look up the patient and prepare the response
type ProcessQueryPayload struct {
	TransactionID    string              `json:"transactionId"`
	RequesterID      string              `json:"requesterId"`
	Identifiers      []model.Identifier  `json:"identifiers"` // Legacy mirror of selector.patientIdentifiers
	Selector         model.QuerySelector `json:"selector,omitempty"`
	ResourceType     string              `json:"resourceType"`
	GatewayReturnURL string              `json:"gatewayReturnUrl"`
	Reason           string              `json:"reason,omitempty"` // Optional: Purpose of the request (e.g., "Emergency", "Referral")
	Notes            string              `json:"notes,omitempty"`  // Optional: Additional context for the target provider
}

// ReceiveResultPayload is sent to the requester with the retrieved data
// This completes the data transfer flow
type ReceiveResultPayload struct {
	TransactionID string          `json:"transactionId"`
	Status        string          `json:"status"` // SUCCESS, REJECTED, ERROR
	Data          json.RawMessage `json:"data"`
}

// IncomingResultPayload is received from the target provider
// Contains the patient data or rejection reason
type IncomingResultPayload struct {
	TransactionID string          `json:"transactionId"`
	Status        string          `json:"status"` // SUCCESS, REJECTED, ERROR
	Data          json.RawMessage `json:"data"`
}

// ResultStatus defines the possible statuses for a result payload
type ResultStatus string

const (
	ResultStatusSuccess  ResultStatus = "SUCCESS"
	ResultStatusRejected ResultStatus = "REJECTED"
	ResultStatusError    ResultStatus = "ERROR"
)

// PushRequest represents an unsolicited resource transfer
// This is used when a provider sends data to another without a prior request
type PushRequest struct {
	SenderID     string          `json:"senderId"`
	TargetID     string          `json:"targetId"`
	ResourceType string          `json:"resourceType"`
	Data         json.RawMessage `json:"data"`
	Reason       string          `json:"reason,omitempty"`
	Notes        string          `json:"notes,omitempty"`
}

// ProcessPushPayload is sent to the target provider for a push request
// Contains the resource data directly
type ProcessPushPayload struct {
	TransactionID string          `json:"transactionId"`
	SenderID      string          `json:"senderId"`
	ResourceType  string          `json:"resourceType"`
	Data          json.RawMessage `json:"data"`
	Reason        string          `json:"reason,omitempty"`
	Notes         string          `json:"notes,omitempty"`
}
