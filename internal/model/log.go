package model

import "time"

// LogSummary represents a summary of a log entry returned to the API
type LogSummary struct {
	ID         string    `json:"id"`
	Timestamp  time.Time `json:"timestamp"`
	Method     string    `json:"method"`
	URL        string    `json:"url"`
	StatusCode int       `json:"statusCode"`
	DurationMs int64     `json:"durationMs"`
	ClientIP   string    `json:"clientIp"`
	KeyID      string    `json:"keyId,omitempty"`
	Role       string    `json:"role,omitempty"`
	ProviderID string    `json:"providerId,omitempty"`
}

// LogDetail represents the full content of a log file
type LogDetail struct {
	ID        string `json:"id"`
	Timestamp string `json:"timestamp"`
	Content   string `json:"content"` // The raw text content of the log file
}

// LogDate represents a directory containing logs
type LogDate struct {
	Date      string `json:"date"`      // YYYY-MM-DD
	Count     int    `json:"count"`     // Number of logs (estimated)
	SizeBytes int64  `json:"sizeBytes"` // Total size of logs (estimated)
}
