package model

import "time"

// ProviderType represents the type of healthcare provider
type ProviderType string

const (
	ProviderTypeClinic   ProviderType = "clinic"
	ProviderTypeHospital ProviderType = "hospital"
	ProviderTypeLab      ProviderType = "laboratory"
	ProviderTypePharmacy ProviderType = "pharmacy"
)

// Provider represents a registered healthcare provider in the gateway
type Provider struct {
	ID             string       `json:"id"`
	Name           string       `json:"name"`
	Type           ProviderType `json:"type"`
	BaseURL        string       `json:"baseUrl"`        // Base URL for receiving FHIR resources
	GatewayAuthKey string       `json:"gatewayAuthKey"` // Secret key for Gateway->Provider authentication
	IsActive       bool         `json:"isActive"`
	CreatedAt      time.Time    `json:"createdAt"`
	UpdatedAt      time.Time    `json:"updatedAt"`
}

// Identifiable interface for generic repository
func (p Provider) GetID() string {
	return p.ID
}
