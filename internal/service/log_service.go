package service

import (
	"bufio"
	"encoding/json"
	"fmt"
	neturl "net/url"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/wah4pc/wah4pc-gateway/internal/model"
)

// LogService handles log retrieval
type LogService struct {
	baseDir string
}

// NewLogService creates a new LogService
func NewLogService(baseDir string) *LogService {
	return &LogService{
		baseDir: baseDir,
	}
}

// GetLogDates returns a list of dates available in the logs
func (s *LogService) GetLogDates() ([]model.LogDate, error) {
	return s.GetLogDatesFiltered("", true)
}

// GetLogDatesFiltered returns visible log dates based on caller scope.
func (s *LogService) GetLogDatesFiltered(providerID string, isAdmin bool) ([]model.LogDate, error) {
	entries, err := os.ReadDir(s.baseDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []model.LogDate{}, nil
		}
		return nil, fmt.Errorf("failed to read log directory: %w", err)
	}

	var dates []model.LogDate
	for _, entry := range entries {
		if entry.IsDir() {
			name := entry.Name()
			// Basic validation that it looks like a date (YYYY-MM-DD)
			if _, err := time.Parse("2006-01-02", name); err == nil {
				if isAdmin {
					// Estimate count/size
					info, _ := s.getDirStats(filepath.Join(s.baseDir, name))
					dates = append(dates, model.LogDate{
						Date:      name,
						Count:     info.count,
						SizeBytes: info.size,
					})
					continue
				}

				logs, logsErr := s.GetLogsByDateFiltered(name, providerID, false)
				if logsErr != nil {
					continue
				}
				if len(logs) > 0 {
					dates = append(dates, model.LogDate{
						Date:      name,
						Count:     len(logs),
						SizeBytes: 0,
					})
				}
			}
		}
	}

	// Sort descending (newest first)
	sort.Slice(dates, func(i, j int) bool {
		return dates[i].Date > dates[j].Date
	})

	return dates, nil
}

type dirStats struct {
	count int
	size  int64
}

func (s *LogService) getDirStats(path string) (dirStats, error) {
	entries, err := os.ReadDir(path)
	if err != nil {
		return dirStats{}, err
	}
	var stats dirStats
	for _, e := range entries {
		if !e.IsDir() {
			stats.count++
			info, err := e.Info()
			if err == nil {
				stats.size += info.Size()
			}
		}
	}
	// Adjust count if index.jsonl exists (it's not a log file itself)
	if _, err := os.Stat(filepath.Join(path, "index.jsonl")); err == nil {
		stats.count--
	}
	return stats, nil
}

// GetLogsByDate returns log summaries for a specific date
func (s *LogService) GetLogsByDate(date string) ([]model.LogSummary, error) {
	return s.GetLogsByDateFiltered(date, "", true)
}

// GetLogsByDateFiltered returns visible log summaries for a specific date based on caller scope.
func (s *LogService) GetLogsByDateFiltered(date, providerID string, isAdmin bool) ([]model.LogSummary, error) {
	dirPath := filepath.Join(s.baseDir, date)
	indexFile := filepath.Join(dirPath, "index.jsonl")

	// Check if index exists
	if _, err := os.Stat(indexFile); err == nil {
		return s.readIndexFile(indexFile, providerID, isAdmin)
	}

	if !isAdmin {
		// Without indexed provider metadata we cannot safely scope provider logs.
		return []model.LogSummary{}, nil
	}

	// Fallback: list files (less efficient, less data)
	return s.scanLogFiles(dirPath, date)
}

func (s *LogService) readIndexFile(path, providerID string, isAdmin bool) ([]model.LogSummary, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var logs []model.LogSummary
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		var log model.LogSummary
		if err := json.Unmarshal(scanner.Bytes(), &log); err == nil {
			if shouldHideLogURL(log.URL) {
				continue
			}
			if !isAdmin {
				// Legacy rows may not have providerId; hide them from provider users.
				if strings.TrimSpace(log.ProviderID) == "" || log.ProviderID != providerID {
					continue
				}
			}
			logs = append(logs, log)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	// Sort by timestamp descending
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

func (s *LogService) scanLogFiles(dirPath, dateStr string) ([]model.LogSummary, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("date not found")
		}
		return nil, err
	}

	var logs []model.LogSummary
	for _, entry := range entries {
		name := entry.Name()
		if strings.HasSuffix(name, ".txt") {
			// Filename format: HH-MM-SS_SHORTID.txt
			parts := strings.Split(strings.TrimSuffix(name, ".txt"), "_")
			if len(parts) >= 2 {
				timeStr := parts[0]
				shortID := parts[1]

				// Construct timestamp
				fullTimeStr := fmt.Sprintf("%s %s", dateStr, strings.ReplaceAll(timeStr, "-", ":"))
				ts, _ := time.ParseInLocation("2006-01-02 15:04:05", fullTimeStr, time.UTC)

				logs = append(logs, model.LogSummary{
					ID:        shortID, // We only have short ID here
					Timestamp: ts,
					Method:    "???", // Unknown without reading file
					URL:       "???",
				})
			}
		}
	}
	
	// Sort by timestamp descending
	sort.Slice(logs, func(i, j int) bool {
		return logs[i].Timestamp.After(logs[j].Timestamp)
	})

	return logs, nil
}

// GetLogDetail reads the full content of a log file
func (s *LogService) GetLogDetail(date, id string) (*model.LogDetail, error) {
	return s.GetLogDetailFiltered(date, id, "", true)
}

// GetLogDetailFiltered reads a single log detail if visible within caller scope.
func (s *LogService) GetLogDetailFiltered(date, id, providerID string, isAdmin bool) (*model.LogDetail, error) {
	if !isAdmin {
		visibleLogs, err := s.GetLogsByDateFiltered(date, providerID, false)
		if err != nil {
			return nil, err
		}
		found := false
		for _, log := range visibleLogs {
			if log.ID == id {
				found = true
				break
			}
		}
		if !found {
			return nil, fmt.Errorf("log file not found")
		}
	}

	dirPath := filepath.Join(s.baseDir, date)
	
	// We need to find the file. It starts with a timestamp we don't know, but ends with the short ID.
	// The ID passed might be full UUID or short ID.
	shortID := id
	if len(id) > 8 {
		shortID = id[:8]
	}

	pattern := filepath.Join(dirPath, fmt.Sprintf("*_%s.txt", shortID))
	matches, err := filepath.Glob(pattern)
	if err != nil {
		return nil, fmt.Errorf("failed to search for log file: %w", err)
	}

	if len(matches) == 0 {
		return nil, fmt.Errorf("log file not found")
	}

	// Read the first match (should be unique per ID)
	content, err := os.ReadFile(matches[0])
	if err != nil {
		return nil, fmt.Errorf("failed to read log file: %w", err)
	}

	// Parse timestamp from filename
	fileName := filepath.Base(matches[0])
	timeStr := strings.Split(fileName, "_")[0]
	fullTimeStr := fmt.Sprintf("%s %s", date, strings.ReplaceAll(timeStr, "-", ":"))

	return &model.LogDetail{
		ID:        id,
		Timestamp: fullTimeStr,
		Content:   string(content),
	}, nil
}
