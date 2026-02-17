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
	ID             string       `json:"id" bson:"id"`
	Name           string       `json:"name" bson:"name"`
	Type           ProviderType `json:"type" bson:"type"`
	FacilityCode   string       `json:"facility_code" bson:"facility_code"`
	Location       string       `json:"location" bson:"location"`
	BaseURL        string       `json:"baseUrl" bson:"baseUrl"`               // Base URL for receiving FHIR resources
	GatewayAuthKey string       `json:"gatewayAuthKey" bson:"gatewayAuthKey"` // Secret key for Gateway->Provider authentication
	IsActive       bool         `json:"isActive" bson:"isActive"`
	CreatedAt      time.Time    `json:"createdAt" bson:"createdAt"`
	UpdatedAt      time.Time    `json:"updatedAt" bson:"updatedAt"`
}

// Identifiable interface for generic repository
func (p Provider) GetID() string {
	return p.ID
}
