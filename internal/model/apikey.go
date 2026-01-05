package model

import "time"

// ApiKeyRole represents the role/permission level of an API key
type ApiKeyRole string

const (
	ApiKeyRoleAdmin ApiKeyRole = "admin"
	ApiKeyRoleUser  ApiKeyRole = "user"
)

// ApiKey represents an API key for authentication
type ApiKey struct {
	ID         string     `json:"id"`
	Prefix     string     `json:"prefix"`     // First 7 chars for display (e.g., "wah_abc")
	KeyHash    string     `json:"keyHash"`    // SHA256 hash of the full key
	Owner      string     `json:"owner"`      // Owner name or identifier
	ProviderID string     `json:"providerId"` // Associated provider ID (empty for admin keys)
	Role       ApiKeyRole `json:"role"`       // admin or user
	RateLimit  int        `json:"rateLimit"`  // Requests per second (0 = unlimited)
	IsActive   bool       `json:"isActive"`   // Whether the key is active
	CreatedAt  time.Time  `json:"createdAt"`
	LastUsedAt time.Time  `json:"lastUsedAt"`
}

// GetID implements the Identifiable interface for generic repository
func (a ApiKey) GetID() string {
	return a.ID
}

// ApiKeyCreateRequest represents the request to create an API key
type ApiKeyCreateRequest struct {
	Owner      string     `json:"owner"`
	ProviderID string     `json:"providerId"` // Required for user role, must be valid provider ID
	Role       ApiKeyRole `json:"role"`
	RateLimit  int        `json:"rateLimit"` // Requests per second
}

// ApiKeyResponse represents the response after creating an API key
// The raw key is only returned once during creation
type ApiKeyResponse struct {
	ID         string     `json:"id"`
	Key        string     `json:"key,omitempty"` // Only populated on creation
	Prefix     string     `json:"prefix"`
	Owner      string     `json:"owner"`
	ProviderID string     `json:"providerId,omitempty"` // Associated provider ID
	Role       ApiKeyRole `json:"role"`
	RateLimit  int        `json:"rateLimit"`
	IsActive   bool       `json:"isActive"`
	CreatedAt  time.Time  `json:"createdAt"`
}

// ApiKeyListItem represents an API key in list responses (no sensitive data)
type ApiKeyListItem struct {
	ID         string     `json:"id"`
	Prefix     string     `json:"prefix"`
	Owner      string     `json:"owner"`
	ProviderID string     `json:"providerId,omitempty"`
	Role       ApiKeyRole `json:"role"`
	RateLimit  int        `json:"rateLimit"`
	IsActive   bool       `json:"isActive"`
	CreatedAt  time.Time  `json:"createdAt"`
	LastUsedAt time.Time  `json:"lastUsedAt"`
}

// ToListItem converts an ApiKey to a safe list item
func (a ApiKey) ToListItem() ApiKeyListItem {
	return ApiKeyListItem{
		ID:         a.ID,
		Prefix:     a.Prefix,
		Owner:      a.Owner,
		ProviderID: a.ProviderID,
		Role:       a.Role,
		RateLimit:  a.RateLimit,
		IsActive:   a.IsActive,
		CreatedAt:  a.CreatedAt,
		LastUsedAt: a.LastUsedAt,
	}
}
