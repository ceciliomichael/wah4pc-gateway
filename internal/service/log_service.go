package service

import (
	"fmt"
	neturl "net/url"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/pkg/logger"
)

// AuditLogRepository defines storage access for audit logs.
type AuditLogRepository interface {
	ListDates() ([]string, error)
	ListByDate(date string) ([]logger.StoredLogEntry, error)
	GetByID(id string) (logger.StoredLogEntry, error)
}

// LogService handles log retrieval.
type LogService struct {
	repo   AuditLogRepository
	txRepo TransactionRepository
}

// NewLogService creates a new LogService.
func NewLogService(repo AuditLogRepository, txRepo TransactionRepository) *LogService {
	return &LogService{repo: repo, txRepo: txRepo}
}

// GetLogDates returns a list of dates available in the logs.
func (s *LogService) GetLogDates() ([]model.LogDate, error) {
	return s.GetLogDatesFiltered("", true)
}

// GetLogDatesFiltered returns visible log dates based on caller scope.
func (s *LogService) GetLogDatesFiltered(providerID string, isAdmin bool) ([]model.LogDate, error) {
	dates, err := s.repo.ListDates()
	if err != nil {
		return nil, err
	}

	out := make([]model.LogDate, 0, len(dates))
	for _, date := range dates {
		logs, logsErr := s.GetLogsByDateFiltered(date, providerID, isAdmin)
		if logsErr != nil || len(logs) == 0 {
			continue
		}
		out = append(out, model.LogDate{
			Date:      date,
			Count:     len(logs),
			SizeBytes: 0,
		})
	}

	sort.Slice(out, func(i, j int) bool {
		return out[i].Date > out[j].Date
	})

	return out, nil
}

// GetLogsByDate returns log summaries for a specific date.
func (s *LogService) GetLogsByDate(date string) ([]model.LogSummary, error) {
	return s.GetLogsByDateFiltered(date, "", true)
}

// GetLogsByDateFiltered returns visible log summaries for a specific date based on caller scope.
func (s *LogService) GetLogsByDateFiltered(date, providerID string, isAdmin bool) ([]model.LogSummary, error) {
	entries, err := s.repo.ListByDate(date)
	if err != nil {
		return nil, err
	}

	logs := make([]model.LogSummary, 0, len(entries))
	for _, entry := range entries {
		if shouldHideLogURL(entry.URL) {
			continue
		}
		if !isAdmin && !s.isProviderVisible(entry, providerID) {
			continue
		}

		logs = append(logs, model.LogSummary{
			ID:         entry.ID,
			Timestamp:  entry.Timestamp,
			Method:     entry.Method,
			URL:        entry.URL,
			StatusCode: entry.StatusCode,
			DurationMs: entry.DurationMs,
			ClientIP:   entry.RemoteAddr,
			KeyID:      entry.KeyID,
			Role:       entry.Role,
			ProviderID: entry.ProviderID,
		})
	}

	sort.Slice(logs, func(i, j int) bool {
		return logs[i].Timestamp.After(logs[j].Timestamp)
	})

	return logs, nil
}

func shouldHideLogURL(rawURL string) bool {
	path := rawURL
	if parsed, err := neturl.Parse(rawURL); err == nil && parsed.Path != "" {
		path = parsed.Path
	}
	if idx := strings.Index(path, "?"); idx >= 0 {
		path = path[:idx]
	}

	return path == "/providers" ||
		path == "/api/v1/providers" ||
		strings.HasPrefix(path, "/api/v1/providers/") ||
		path == "/api/v1/apikeys" ||
		strings.HasPrefix(path, "/api/v1/apikeys/") ||
		path == "/settings" ||
		path == "/api/v1/settings" ||
		path == "/api/v1/transactions" ||
		strings.HasPrefix(path, "/api/v1/transactions/")
}

// GetLogDetail reads the full content of a log entry.
func (s *LogService) GetLogDetail(date, id string) (*model.LogDetail, error) {
	return s.GetLogDetailFiltered(date, id, "", true)
}

// GetLogDetailFiltered reads a single log detail if visible within caller scope.
func (s *LogService) GetLogDetailFiltered(date, id, providerID string, isAdmin bool) (*model.LogDetail, error) {
	entry, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if entry.Date != date {
		return nil, fmt.Errorf("log file not found")
	}
	if shouldHideLogURL(entry.URL) {
		return nil, fmt.Errorf("log file not found")
	}
	if !isAdmin && !s.isProviderVisible(entry, providerID) {
		return nil, fmt.Errorf("log file not found")
	}

	return &model.LogDetail{
		ID:        entry.ID,
		Timestamp: entry.Timestamp.UTC().Format(time.RFC3339),
		Content:   entry.Content,
	}, nil
}

func (s *LogService) isProviderVisible(entry logger.StoredLogEntry, providerID string) bool {
	if providerID == "" {
		return false
	}

	if strings.TrimSpace(entry.ProviderID) == providerID {
		return true
	}

	combined := strings.Join([]string{entry.RequestBody, entry.ResponseBody, entry.Content}, "\n")
	requesterID := extractJSONField(combined, "requesterId")
	targetID := extractJSONField(combined, "targetId")
	senderID := extractJSONField(combined, "senderId")
	if requesterID == providerID || targetID == providerID || senderID == providerID {
		return true
	}

	if strings.HasPrefix(entry.URL, "/api/v1/fhir/receive/") && s.txRepo != nil {
		txID := extractJSONField(combined, "transactionId")
		if strings.TrimSpace(txID) == "" {
			return false
		}
		tx, txErr := s.txRepo.GetByID(txID)
		if txErr != nil {
			return false
		}
		return tx.RequesterID == providerID || tx.TargetID == providerID
	}

	return false
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
