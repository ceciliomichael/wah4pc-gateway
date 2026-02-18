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
	ID                           string                 `json:"id" bson:"id"`
	Name                         string                 `json:"name" bson:"name"`
	Type                         ProviderType           `json:"type" bson:"type"`
	FacilityCode                 string                 `json:"facility_code" bson:"facility_code,omitempty"`
	Location                     string                 `json:"location" bson:"location,omitempty"`
	BaseURL                      string                 `json:"baseUrl" bson:"baseUrl"` // Base URL for receiving FHIR resources
	GatewayAuthKey               string                 `json:"gatewayAuthKey" bson:"gatewayAuthKey"`
	PractitionerListEndpoint     string                 `json:"practitionerListEndpoint,omitempty" bson:"practitionerListEndpoint,omitempty"`
	PractitionerList             []ProviderPractitioner `json:"practitionerList,omitempty" bson:"practitionerList,omitempty"`
	PractitionerListLastSyncedAt time.Time              `json:"practitionerListLastSyncedAt,omitempty" bson:"practitionerListLastSyncedAt,omitempty"`
	PractitionerListSyncError    string                 `json:"practitionerListSyncError,omitempty" bson:"practitionerListSyncError,omitempty"`
	IsActive                     bool                   `json:"isActive" bson:"isActive"`
	CreatedAt                    time.Time              `json:"createdAt" bson:"createdAt"`
	UpdatedAt                    time.Time              `json:"updatedAt" bson:"updatedAt"`
}

// ProviderPractitioner represents a normalized practitioner option from a provider.
type ProviderPractitioner struct {
	Code    string `json:"code" bson:"code"`
	Display string `json:"display" bson:"display"`
	Active  bool   `json:"active" bson:"active"`
}

// Identifiable interface for generic repository
func (p Provider) GetID() string {
	return p.ID
}
