package middleware

// ContextKey is the type for context keys to avoid collisions
type ContextKey string

const (
	// ContextKeyApiKey is the context key for the authenticated API key
	ContextKeyApiKey ContextKey = "apiKey"
	// ContextKeyKeyID is the context key for the API key ID
	ContextKeyKeyID ContextKey = "keyID"
	// ContextKeyRole is the context key for the API key role
	ContextKeyRole ContextKey = "role"
	// ContextKeyRateLimit is the context key for the rate limit
	ContextKeyRateLimit ContextKey = "rateLimit"
	// ContextKeyProviderID is the context key for the associated provider ID
	ContextKeyProviderID ContextKey = "providerId"
)
