package logger

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// MaxBodySize is the maximum size of request/response body to log (16KB)
const MaxBodySize = 16 * 1024

// DetailedLogEntry represents a comprehensive audit log entry
type DetailedLogEntry struct {
	// Identifiers
	ID        string
	Timestamp time.Time
	Duration  time.Duration

	// Request details
	Method     string
	URL        string
	Host       string
	RemoteAddr string
	UserAgent  string

	// Request headers and body
	RequestHeaders  http.Header
	RequestBody     string
	RequestBodySize int

	// Response details
	StatusCode       int
	ResponseHeaders  http.Header
	ResponseBody     string
	ResponseBodySize int

	// Authentication context
	KeyID      string
	Role       string
	ProviderID string
}

// LogIndexEntry represents a summary of the log entry for indexing (JSONL)
type LogIndexEntry struct {
	ID         string    `json:"id"`
	Timestamp  time.Time `json:"timestamp"`
	Method     string    `json:"method"`
	URL        string    `json:"url"`
	StatusCode int       `json:"statusCode"`
	DurationMs int64     `json:"durationMs"`
	ClientIP   string    `json:"clientIp"`
	KeyID      string    `json:"keyId,omitempty"`
}

// FileLogger handles asynchronous file-based logging with individual files per request
type FileLogger struct {
	baseDir    string
	logChannel chan DetailedLogEntry
	done       chan struct{}
	wg         sync.WaitGroup
}

// NewFileLogger creates a new FileLogger and starts the background worker
func NewFileLogger(baseDir string) *FileLogger {
	l := &FileLogger{
		baseDir:    baseDir,
		logChannel: make(chan DetailedLogEntry, 1000), // Buffer for non-blocking writes
		done:       make(chan struct{}),
	}

	l.wg.Add(1)
	go l.worker()

	return l
}

// Log sends a detailed log entry to the worker (non-blocking)
func (l *FileLogger) Log(entry DetailedLogEntry) {
	select {
	case l.logChannel <- entry:
		// Successfully queued
	default:
		// Channel full, log to stderr to avoid blocking
		fmt.Fprintf(os.Stderr, "[AUDIT OVERFLOW] Request %s could not be logged\n", entry.ID)
	}
}

// Close gracefully shuts down the logger, flushing all pending entries
func (l *FileLogger) Close() {
	close(l.done)
	l.wg.Wait()
}

// worker is the background goroutine that handles file writes
func (l *FileLogger) worker() {
	defer l.wg.Done()

	for {
		select {
		case entry := <-l.logChannel:
			l.writeEntry(entry)
		case <-l.done:
			// Drain remaining entries before exiting
			for {
				select {
				case entry := <-l.logChannel:
					l.writeEntry(entry)
				default:
					return
				}
			}
		}
	}
}

// writeEntry handles the actual file write operation - creates a separate file for each request
func (l *FileLogger) writeEntry(entry DetailedLogEntry) {
	// Create date-based directory path
	dateStr := entry.Timestamp.Format("2006-01-02")
	dirPath := filepath.Join(l.baseDir, dateStr)

	// Ensure directory exists
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "[AUDIT ERROR] Failed to create directory %s: %v\n", dirPath, err)
		return
	}

	// Create unique filename: HH-MM-SS_UUID.txt
	timeStr := entry.Timestamp.Format("15-04-05")
	shortID := entry.ID
	if len(shortID) > 8 {
		shortID = shortID[:8] // Use first 8 chars of UUID for shorter filenames
	}
	fileName := fmt.Sprintf("%s_%s.txt", timeStr, shortID)
	filePath := filepath.Join(dirPath, fileName)

	// Create the file
	file, err := os.Create(filePath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "[AUDIT ERROR] Failed to create file %s: %v\n", filePath, err)
		return
	}
	defer file.Close()

	// Write formatted content
	content := l.formatEntry(entry)
	if _, err := file.WriteString(content); err != nil {
		fmt.Fprintf(os.Stderr, "[AUDIT ERROR] Failed to write to %s: %v\n", filePath, err)
	}

	// Write to index.jsonl
	indexEntry := LogIndexEntry{
		ID:         entry.ID,
		Timestamp:  entry.Timestamp,
		Method:     entry.Method,
		URL:        entry.URL,
		StatusCode: entry.StatusCode,
		DurationMs: entry.Duration.Milliseconds(),
		ClientIP:   entry.RemoteAddr,
		KeyID:      entry.KeyID,
	}

	indexBytes, err := json.Marshal(indexEntry)
	if err == nil {
		indexFilePath := filepath.Join(dirPath, "index.jsonl")
		// Append to index file
		f, err := os.OpenFile(indexFilePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		if err != nil {
			fmt.Fprintf(os.Stderr, "[AUDIT ERROR] Failed to open index file %s: %v\n", indexFilePath, err)
		} else {
			defer f.Close()
			if _, err := f.Write(append(indexBytes, '\n')); err != nil {
				fmt.Fprintf(os.Stderr, "[AUDIT ERROR] Failed to write to index file %s: %v\n", indexFilePath, err)
			}
		}
	}
}

// formatEntry creates a human-readable log file content
func (l *FileLogger) formatEntry(entry DetailedLogEntry) string {
	var sb strings.Builder

	// Header section
	sb.WriteString("╔══════════════════════════════════════════════════════════════════════════════╗\n")
	sb.WriteString("║                           AUDIT LOG ENTRY                                    ║\n")
	sb.WriteString("╚══════════════════════════════════════════════════════════════════════════════╝\n\n")

	// Request ID and Timestamp
	sb.WriteString("┌─────────────────────────────────────────────────────────────────────────────┐\n")
	sb.WriteString("│ METADATA                                                                    │\n")
	sb.WriteString("├─────────────────────────────────────────────────────────────────────────────┤\n")
	sb.WriteString(fmt.Sprintf("  Request ID    : %s\n", entry.ID))
	sb.WriteString(fmt.Sprintf("  Timestamp     : %s\n", entry.Timestamp.Format("2006-01-02 15:04:05.000 MST")))
	sb.WriteString(fmt.Sprintf("  Duration      : %s\n", entry.Duration.String()))
	sb.WriteString(fmt.Sprintf("  Status Code   : %d %s\n", entry.StatusCode, http.StatusText(entry.StatusCode)))
	sb.WriteString("└─────────────────────────────────────────────────────────────────────────────┘\n\n")

	// Client Information
	sb.WriteString("┌─────────────────────────────────────────────────────────────────────────────┐\n")
	sb.WriteString("│ CLIENT INFORMATION                                                          │\n")
	sb.WriteString("├─────────────────────────────────────────────────────────────────────────────┤\n")
	sb.WriteString(fmt.Sprintf("  Remote Address: %s\n", entry.RemoteAddr))
	sb.WriteString(fmt.Sprintf("  User Agent    : %s\n", truncateString(entry.UserAgent, 70)))
	sb.WriteString(fmt.Sprintf("  API Key ID    : %s\n", valueOrDash(entry.KeyID)))
	sb.WriteString(fmt.Sprintf("  Role          : %s\n", valueOrDash(entry.Role)))
	sb.WriteString(fmt.Sprintf("  Provider ID   : %s\n", valueOrDash(entry.ProviderID)))
	sb.WriteString("└─────────────────────────────────────────────────────────────────────────────┘\n\n")

	// Request Section
	sb.WriteString("┌─────────────────────────────────────────────────────────────────────────────┐\n")
	sb.WriteString("│ REQUEST                                                                     │\n")
	sb.WriteString("├─────────────────────────────────────────────────────────────────────────────┤\n")
	sb.WriteString(fmt.Sprintf("  %s %s\n", entry.Method, entry.URL))
	sb.WriteString(fmt.Sprintf("  Host: %s\n", entry.Host))
	sb.WriteString("└─────────────────────────────────────────────────────────────────────────────┘\n\n")

	// Request Headers
	sb.WriteString("┌─────────────────────────────────────────────────────────────────────────────┐\n")
	sb.WriteString("│ REQUEST HEADERS                                                             │\n")
	sb.WriteString("├─────────────────────────────────────────────────────────────────────────────┤\n")
	if len(entry.RequestHeaders) > 0 {
		for key, values := range entry.RequestHeaders {
			// Mask sensitive headers
			displayValue := strings.Join(values, ", ")
			if isSensitiveHeader(key) {
				displayValue = "[REDACTED]"
			}
			sb.WriteString(fmt.Sprintf("  %s: %s\n", key, displayValue))
		}
	} else {
		sb.WriteString("  (no headers)\n")
	}
	sb.WriteString("└─────────────────────────────────────────────────────────────────────────────┘\n\n")

	// Request Body
	sb.WriteString("┌─────────────────────────────────────────────────────────────────────────────┐\n")
	sb.WriteString("│ REQUEST BODY                                                                │\n")
	sb.WriteString("├─────────────────────────────────────────────────────────────────────────────┤\n")
	if entry.RequestBody != "" {
		sb.WriteString(fmt.Sprintf("  Size: %d bytes\n\n", entry.RequestBodySize))
		sb.WriteString(indentBody(entry.RequestBody))
		sb.WriteString("\n")
	} else {
		sb.WriteString("  (empty body)\n")
	}
	sb.WriteString("└─────────────────────────────────────────────────────────────────────────────┘\n\n")

	// Response Headers
	sb.WriteString("┌─────────────────────────────────────────────────────────────────────────────┐\n")
	sb.WriteString("│ RESPONSE HEADERS                                                            │\n")
	sb.WriteString("├─────────────────────────────────────────────────────────────────────────────┤\n")
	if len(entry.ResponseHeaders) > 0 {
		for key, values := range entry.ResponseHeaders {
			sb.WriteString(fmt.Sprintf("  %s: %s\n", key, strings.Join(values, ", ")))
		}
	} else {
		sb.WriteString("  (no headers)\n")
	}
	sb.WriteString("└─────────────────────────────────────────────────────────────────────────────┘\n\n")

	// Response Body
	sb.WriteString("┌─────────────────────────────────────────────────────────────────────────────┐\n")
	sb.WriteString("│ RESPONSE BODY                                                               │\n")
	sb.WriteString("├─────────────────────────────────────────────────────────────────────────────┤\n")
	if entry.ResponseBody != "" {
		sb.WriteString(fmt.Sprintf("  Size: %d bytes\n\n", entry.ResponseBodySize))
		sb.WriteString(indentBody(entry.ResponseBody))
		sb.WriteString("\n")
	} else {
		sb.WriteString("  (empty body)\n")
	}
	sb.WriteString("└─────────────────────────────────────────────────────────────────────────────┘\n\n")

	// Footer
	sb.WriteString("══════════════════════════════════════════════════════════════════════════════\n")
	sb.WriteString(fmt.Sprintf("  END OF AUDIT LOG - %s\n", entry.ID))
	sb.WriteString("══════════════════════════════════════════════════════════════════════════════\n")

	return sb.String()
}

// Helper functions

func valueOrDash(s string) string {
	if s == "" {
		return "-"
	}
	return s
}

func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

func isSensitiveHeader(key string) bool {
	lower := strings.ToLower(key)
	sensitiveKeys := []string{
		"authorization",
		"x-api-key",
		"x-master-key",
		"cookie",
		"set-cookie",
	}
	for _, k := range sensitiveKeys {
		if lower == k {
			return true
		}
	}
	return false
}

func indentBody(body string) string {
	formattedBody := prettyPrintJSONBody(body)
	lines := strings.Split(formattedBody, "\n")
	var sb strings.Builder
	for _, line := range lines {
		sb.WriteString("  ")
		sb.WriteString(line)
		sb.WriteString("\n")
	}
	return strings.TrimSuffix(sb.String(), "\n")
}

func prettyPrintJSONBody(body string) string {
	trimmedBody := strings.TrimSpace(body)
	if trimmedBody == "" {
		return body
	}

	const truncationMarkerPrefix = "\n\n[TRUNCATED - Original size:"

	bodyToParse := body
	truncationSuffix := ""
	if markerIndex := strings.Index(body, truncationMarkerPrefix); markerIndex >= 0 {
		bodyToParse = body[:markerIndex]
		truncationSuffix = body[markerIndex:]
	}

	var parsed interface{}
	if err := json.Unmarshal([]byte(strings.TrimSpace(bodyToParse)), &parsed); err != nil {
		return body
	}

	pretty, err := json.MarshalIndent(parsed, "", "  ")
	if err != nil {
		return body
	}

	if truncationSuffix != "" {
		return string(pretty) + truncationSuffix
	}

	return string(pretty)
}

// TruncateBody truncates body content if it exceeds MaxBodySize
func TruncateBody(body []byte) (string, int, bool) {
	originalSize := len(body)
	if originalSize > MaxBodySize {
		return string(body[:MaxBodySize]) + "\n\n[TRUNCATED - Original size: " + fmt.Sprintf("%d", originalSize) + " bytes]", originalSize, true
	}
	return string(body), originalSize, false
}
