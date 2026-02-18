package service

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/wah4pc/wah4pc-gateway/pkg/logger"
)

// MigrateLegacyLogs imports file-based audit logs into MongoDB and removes old files.
func MigrateLegacyLogs(logDir, legacyFile string, repo logger.AuditLogStorage) error {
	if repo == nil {
		return nil
	}

	if err := migrateDirectoryLogs(logDir, repo); err != nil {
		return err
	}
	if err := migrateLegacySingleFile(legacyFile, repo); err != nil {
		return err
	}

	if info, err := os.Stat(logDir); err == nil && info.IsDir() {
		if rmErr := os.RemoveAll(logDir); rmErr != nil {
			return fmt.Errorf("failed to delete legacy log directory: %w", rmErr)
		}
	}
	if _, err := os.Stat(legacyFile); err == nil {
		if rmErr := os.Remove(legacyFile); rmErr != nil {
			return fmt.Errorf("failed to delete legacy %s: %w", legacyFile, rmErr)
		}
	}

	return nil
}

func migrateDirectoryLogs(logDir string, repo logger.AuditLogStorage) error {
	entries, err := os.ReadDir(logDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		date := entry.Name()
		if _, parseErr := time.Parse("2006-01-02", date); parseErr != nil {
			continue
		}

		dateDir := filepath.Join(logDir, date)
		logFiles, readErr := os.ReadDir(dateDir)
		if readErr != nil {
			return readErr
		}
		for _, file := range logFiles {
			if file.IsDir() || !strings.HasSuffix(file.Name(), ".txt") {
				continue
			}
			entryPath := filepath.Join(dateDir, file.Name())
			parsed, parseErr := parseLegacyAuditFile(entryPath, date, file.Name())
			if parseErr != nil {
				continue
			}
			if upsertErr := repo.Upsert(parsed); upsertErr != nil {
				return upsertErr
			}
		}
	}

	return nil
}

func parseLegacyAuditFile(path, date, filename string) (logger.StoredLogEntry, error) {
	contentBytes, err := os.ReadFile(path)
	if err != nil {
		return logger.StoredLogEntry{}, err
	}
	content := string(contentBytes)

	entry := logger.StoredLogEntry{
		ID:      fmt.Sprintf("%s_%s", date, filename),
		Date:    date,
		Method:  "GET",
		URL:     "/unknown",
		Content: content,
	}

	if ts := parseTimestampFromFilename(filename, date); !ts.IsZero() {
		entry.Timestamp = ts.UTC()
	} else {
		entry.Timestamp = time.Now().UTC()
	}

	lines := strings.Split(content, "\n")
	for _, rawLine := range lines {
		line := strings.TrimSpace(strings.TrimRight(rawLine, "\r"))
		if line == "" {
			continue
		}

		if method, url, ok := parseRequestLine(line); ok {
			entry.Method = method
			entry.URL = url
			continue
		}

		key, value, ok := splitLegacyKeyValue(line)
		if !ok {
			continue
		}

		switch key {
		case "Request ID":
			if value != "" && value != "-" {
				entry.ID = value
			}
		case "Timestamp":
			if parsedTS, parseErr := parseLegacyTimestamp(value); parseErr == nil {
				entry.Timestamp = parsedTS.UTC()
				entry.Date = parsedTS.UTC().Format("2006-01-02")
			}
		case "Duration":
			if d, parseErr := time.ParseDuration(value); parseErr == nil {
				entry.DurationMs = d.Milliseconds()
			}
		case "Status Code":
			parts := strings.Fields(value)
			if len(parts) > 0 {
				if code, parseErr := strconv.Atoi(parts[0]); parseErr == nil {
					entry.StatusCode = code
				}
			}
		case "Remote Address":
			entry.RemoteAddr = value
		case "API Key ID":
			if value != "-" {
				entry.KeyID = value
			}
		case "Role":
			if value != "-" {
				entry.Role = value
			}
		case "Provider ID":
			if value != "-" {
				entry.ProviderID = value
			}
		}
	}

	return entry, nil
}

func migrateLegacySingleFile(path string, repo logger.AuditLogStorage) error {
	file, err := os.Open(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	lineNo := 0
	for scanner.Scan() {
		lineNo++
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		var raw map[string]interface{}
		if err := json.Unmarshal([]byte(line), &raw); err != nil {
			continue
		}

		id, _ := raw["id"].(string)
		if id == "" {
			id = fmt.Sprintf("legacy_logs_txt_%d", lineNo)
		}

		method, _ := raw["method"].(string)
		url, _ := raw["url"].(string)
		keyID, _ := raw["keyId"].(string)
		role, _ := raw["role"].(string)
		providerID, _ := raw["providerId"].(string)

		ts := time.Now().UTC()
		if tsRaw, ok := raw["timestamp"].(string); ok {
			if parsed, parseErr := time.Parse(time.RFC3339, tsRaw); parseErr == nil {
				ts = parsed.UTC()
			}
		}

		statusCode := intFromRaw(raw["statusCode"])
		durationMs := int64(intFromRaw(raw["durationMs"]))
		clientIP, _ := raw["clientIp"].(string)

		entry := logger.StoredLogEntry{
			ID:         id,
			Timestamp:  ts,
			Date:       ts.Format("2006-01-02"),
			Method:     method,
			URL:        url,
			StatusCode: statusCode,
			DurationMs: durationMs,
			RemoteAddr: clientIP,
			KeyID:      keyID,
			Role:       role,
			ProviderID: providerID,
			Content:    line,
		}

		if err := repo.Upsert(entry); err != nil {
			return err
		}
	}

	return scanner.Err()
}

func intFromRaw(value interface{}) int {
	switch v := value.(type) {
	case float64:
		return int(v)
	case int:
		return v
	case int32:
		return int(v)
	case int64:
		return int(v)
	case string:
		n, _ := strconv.Atoi(strings.TrimSpace(v))
		return n
	default:
		return 0
	}
}

func splitLegacyKeyValue(line string) (string, string, bool) {
	before, after, ok := strings.Cut(line, ":")
	if !ok {
		return "", "", false
	}
	return strings.TrimSpace(before), strings.TrimSpace(after), true
}

func parseRequestLine(line string) (string, string, bool) {
	methods := []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	for _, method := range methods {
		prefix := method + " "
		if strings.HasPrefix(line, prefix) {
			return method, strings.TrimSpace(strings.TrimPrefix(line, prefix)), true
		}
	}
	return "", "", false
}

func parseLegacyTimestamp(value string) (time.Time, error) {
	layouts := []string{
		"2006-01-02 15:04:05.000 -07",
		"2006-01-02 15:04:05.000 MST",
		time.RFC3339,
	}
	for _, layout := range layouts {
		if ts, err := time.Parse(layout, value); err == nil {
			return ts, nil
		}
	}
	return time.Time{}, fmt.Errorf("unable to parse timestamp %q", value)
}

func parseTimestampFromFilename(filename, date string) time.Time {
	base := strings.TrimSuffix(filename, ".txt")
	parts := strings.Split(base, "_")
	if len(parts) < 2 {
		return time.Time{}
	}
	timeStr := strings.ReplaceAll(parts[0], "-", ":")
	parsed, err := time.ParseInLocation("2006-01-02 15:04:05", fmt.Sprintf("%s %s", date, timeStr), time.UTC)
	if err != nil {
		return time.Time{}
	}
	return parsed
}
