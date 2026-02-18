package logger

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/wah4pc/wah4pc-gateway/pkg/realtime"
)

// MaxBodySize is the maximum size of request/response body to log (16KB)
const MaxBodySize = 16 * 1024

// DetailedLogEntry represents a comprehensive audit log entry.
type DetailedLogEntry struct {
	ID        string
	Timestamp time.Time
	Duration  time.Duration

	Method     string
	URL        string
	Host       string
	RemoteAddr string
	UserAgent  string

	RequestHeaders  http.Header
	RequestBody     string
	RequestBodySize int

	StatusCode       int
	ResponseHeaders  http.Header
	ResponseBody     string
	ResponseBodySize int

	KeyID      string
	Role       string
	ProviderID string
}

// StoredLogEntry is the MongoDB representation of a log entry.
type StoredLogEntry struct {
	ID string `json:"id" bson:"id"`

	Timestamp  time.Time `json:"timestamp" bson:"timestamp"`
	Date       string    `json:"date" bson:"date"`
	DurationMs int64     `json:"durationMs" bson:"durationMs"`

	Method     string `json:"method" bson:"method"`
	URL        string `json:"url" bson:"url"`
	Host       string `json:"host" bson:"host"`
	RemoteAddr string `json:"remoteAddr" bson:"remoteAddr"`
	UserAgent  string `json:"userAgent" bson:"userAgent"`

	RequestHeaders  http.Header `json:"requestHeaders" bson:"requestHeaders"`
	RequestBody     string      `json:"requestBody" bson:"requestBody"`
	RequestBodySize int         `json:"requestBodySize" bson:"requestBodySize"`

	StatusCode       int         `json:"statusCode" bson:"statusCode"`
	ResponseHeaders  http.Header `json:"responseHeaders" bson:"responseHeaders"`
	ResponseBody     string      `json:"responseBody" bson:"responseBody"`
	ResponseBodySize int         `json:"responseBodySize" bson:"responseBodySize"`

	KeyID      string `json:"keyId,omitempty" bson:"keyId,omitempty"`
	Role       string `json:"role,omitempty" bson:"role,omitempty"`
	ProviderID string `json:"providerId,omitempty" bson:"providerId,omitempty"`

	Content string `json:"content" bson:"content"`
}

// AuditLogStorage defines the storage contract used by the async logger.
type AuditLogStorage interface {
	Upsert(entry StoredLogEntry) error
}

// FileLogger keeps the existing type name for compatibility with current wiring.
type FileLogger struct {
	storage    AuditLogStorage
	broker     *realtime.Broker
	logChannel chan DetailedLogEntry
	done       chan struct{}
	wg         sync.WaitGroup
}

// NewFileLogger creates an async logger that persists logs to the provided storage.
func NewFileLogger(storage AuditLogStorage, broker ...*realtime.Broker) *FileLogger {
	var resolvedBroker *realtime.Broker
	if len(broker) > 0 {
		resolvedBroker = broker[0]
	}

	l := &FileLogger{
		storage:    storage,
		broker:     resolvedBroker,
		logChannel: make(chan DetailedLogEntry, 1000),
		done:       make(chan struct{}),
	}

	l.wg.Add(1)
	go l.worker()

	return l
}

// Log queues a detailed log entry for async persistence.
func (l *FileLogger) Log(entry DetailedLogEntry) {
	select {
	case l.logChannel <- entry:
	default:
		fmt.Fprintf(os.Stderr, "[AUDIT OVERFLOW] Request %s could not be logged\n", entry.ID)
	}
}

// Close gracefully shuts down the logger and flushes queued entries.
func (l *FileLogger) Close() {
	close(l.done)
	l.wg.Wait()
}

func (l *FileLogger) worker() {
	defer l.wg.Done()

	for {
		select {
		case entry := <-l.logChannel:
			l.writeEntry(entry)
		case <-l.done:
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

func (l *FileLogger) writeEntry(entry DetailedLogEntry) {
	if l.storage == nil {
		return
	}

	stored := StoredLogEntry{
		ID:               entry.ID,
		Timestamp:        entry.Timestamp.UTC(),
		Date:             entry.Timestamp.UTC().Format("2006-01-02"),
		DurationMs:       entry.Duration.Milliseconds(),
		Method:           entry.Method,
		URL:              entry.URL,
		Host:             entry.Host,
		RemoteAddr:       entry.RemoteAddr,
		UserAgent:        entry.UserAgent,
		RequestHeaders:   entry.RequestHeaders,
		RequestBody:      entry.RequestBody,
		RequestBodySize:  entry.RequestBodySize,
		StatusCode:       entry.StatusCode,
		ResponseHeaders:  entry.ResponseHeaders,
		ResponseBody:     entry.ResponseBody,
		ResponseBodySize: entry.ResponseBodySize,
		KeyID:            entry.KeyID,
		Role:             entry.Role,
		ProviderID:       entry.ProviderID,
		Content:          l.formatEntry(entry),
	}

	if err := l.storage.Upsert(stored); err != nil {
		fmt.Fprintf(os.Stderr, "[AUDIT ERROR] Failed to persist log %s: %v\n", entry.ID, err)
		return
	}

	if l.broker != nil {
		combinedBody := strings.Join([]string{entry.RequestBody, entry.ResponseBody}, "\n")
		l.broker.Publish(realtime.Event{
			Type:          "audit.log.created",
			Timestamp:     entry.Timestamp.UTC(),
			LogID:         entry.ID,
			ProviderIDs:   collectProviderIDs(entry.ProviderID, combinedBody),
			TransactionID: extractJSONField(combinedBody, "transactionId"),
		})
	}
}

// formatEntry creates a human-readable audit log body.
func (l *FileLogger) formatEntry(entry DetailedLogEntry) string {
	var sb strings.Builder

	sb.WriteString("╔══════════════════════════════════════════════════════════════════════════════╗\n")
	sb.WriteString("║                           AUDIT LOG ENTRY                                    ║\n")
	sb.WriteString("╚══════════════════════════════════════════════════════════════════════════════╝\n\n")

	sb.WriteString("┌─────────────────────────────────────────────────────────────────────────────┐\n")
	sb.WriteString("│ METADATA                                                                    │\n")
	sb.WriteString("├─────────────────────────────────────────────────────────────────────────────┤\n")
	sb.WriteString(fmt.Sprintf("  Request ID    : %s\n", entry.ID))
	sb.WriteString(fmt.Sprintf("  Timestamp     : %s\n", entry.Timestamp.Format("2006-01-02 15:04:05.000 MST")))
	sb.WriteString(fmt.Sprintf("  Duration      : %s\n", entry.Duration.String()))
	sb.WriteString(fmt.Sprintf("  Status Code   : %d %s\n", entry.StatusCode, http.StatusText(entry.StatusCode)))
	sb.WriteString("└─────────────────────────────────────────────────────────────────────────────┘\n\n")

	sb.WriteString("┌─────────────────────────────────────────────────────────────────────────────┐\n")
	sb.WriteString("│ CLIENT INFORMATION                                                          │\n")
	sb.WriteString("├─────────────────────────────────────────────────────────────────────────────┤\n")
	sb.WriteString(fmt.Sprintf("  Remote Address: %s\n", entry.RemoteAddr))
	sb.WriteString(fmt.Sprintf("  User Agent    : %s\n", truncateString(entry.UserAgent, 70)))
	sb.WriteString(fmt.Sprintf("  API Key ID    : %s\n", valueOrDash(entry.KeyID)))
	sb.WriteString(fmt.Sprintf("  Role          : %s\n", valueOrDash(entry.Role)))
	sb.WriteString(fmt.Sprintf("  Provider ID   : %s\n", valueOrDash(entry.ProviderID)))
	sb.WriteString("└─────────────────────────────────────────────────────────────────────────────┘\n\n")

	sb.WriteString("┌─────────────────────────────────────────────────────────────────────────────┐\n")
	sb.WriteString("│ REQUEST                                                                     │\n")
	sb.WriteString("├─────────────────────────────────────────────────────────────────────────────┤\n")
	sb.WriteString(fmt.Sprintf("  %s %s\n", entry.Method, entry.URL))
	sb.WriteString(fmt.Sprintf("  Host: %s\n", entry.Host))
	sb.WriteString("└─────────────────────────────────────────────────────────────────────────────┘\n\n")

	sb.WriteString("┌─────────────────────────────────────────────────────────────────────────────┐\n")
	sb.WriteString("│ REQUEST HEADERS                                                             │\n")
	sb.WriteString("├─────────────────────────────────────────────────────────────────────────────┤\n")
	if len(entry.RequestHeaders) > 0 {
		for key, values := range entry.RequestHeaders {
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

	sb.WriteString("══════════════════════════════════════════════════════════════════════════════\n")
	sb.WriteString(fmt.Sprintf("  END OF AUDIT LOG - %s\n", entry.ID))
	sb.WriteString("══════════════════════════════════════════════════════════════════════════════\n")

	return sb.String()
}

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
	sensitiveKeys := []string{"authorization", "x-api-key", "x-master-key", "cookie", "set-cookie"}
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

// TruncateBody truncates body content if it exceeds MaxBodySize.
func TruncateBody(body []byte) (string, int, bool) {
	originalSize := len(body)
	if originalSize > MaxBodySize {
		return string(body[:MaxBodySize]) + "\n\n[TRUNCATED - Original size: " + fmt.Sprintf("%d", originalSize) + " bytes]", originalSize, true
	}
	return string(body), originalSize, false
}

func collectProviderIDs(providerID, body string) []string {
	seen := make(map[string]struct{})
	out := make([]string, 0, 4)

	appendUnique := func(value string) {
		v := strings.TrimSpace(value)
		if v == "" {
			return
		}
		if _, ok := seen[v]; ok {
			return
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}

	appendUnique(providerID)
	appendUnique(extractJSONField(body, "requesterId"))
	appendUnique(extractJSONField(body, "targetId"))
	appendUnique(extractJSONField(body, "senderId"))

	return out
}

func extractJSONField(content, field string) string {
	pattern := fmt.Sprintf(`"%s"\s*:\s*"([^"]+)"`, field)
	re := regexp.MustCompile(pattern)
	matches := re.FindStringSubmatch(content)
	if len(matches) < 2 {
		return ""
	}
	return strings.TrimSpace(matches[1])
}
