package service

import (
	"encoding/json"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

// QueryRequest represents an incoming request to fetch FHIR resources
// This is the payload sent by requesters to initiate a data transfer
type QueryRequest struct {
	RequesterID  string             `json:"requesterId"`
	TargetID     string             `json:"targetId"`
	Identifiers  []model.Identifier `json:"identifiers"` // FHIR-compliant patient identifiers
	ResourceType string             `json:"resourceType"`
	Reason       string             `json:"reason,omitempty"`
	Notes        string             `json:"notes,omitempty"`
}

// ProcessQueryPayload is sent to the target provider to request patient data
// The target provider uses this to look up the patient and prepare the response
type ProcessQueryPayload struct {
	TransactionID    string             `json:"transactionId"`
	RequesterID      string             `json:"requesterId"`
	Identifiers      []model.Identifier `json:"identifiers"` // FHIR-compliant patient identifiers
	ResourceType     string             `json:"resourceType"`
	GatewayReturnURL string             `json:"gatewayReturnUrl"`
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
