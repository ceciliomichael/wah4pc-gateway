package handler

import (
	"net/http"
	"strings"

	"github.com/wah4pc/wah4pc-gateway/internal/service"
)

type LogHandler struct {
	logService *service.LogService
}

func NewLogHandler(logService *service.LogService) *LogHandler {
	return &LogHandler{
		logService: logService,
	}
}

// GetDates returns available log dates
func (h *LogHandler) GetDates(w http.ResponseWriter, r *http.Request) {
	dates, err := h.logService.GetLogDates()
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, dates)
}

// GetLogs returns logs for a specific date
func (h *LogHandler) GetLogs(w http.ResponseWriter, r *http.Request) {
	// Extract date from URL path: /api/v1/logs/{date}
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 5 {
		respondError(w, http.StatusBadRequest, "invalid path")
		return
	}
	date := parts[4]

	logs, err := h.logService.GetLogsByDate(date)
	if err != nil {
		respondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	respondJSON(w, http.StatusOK, logs)
}

// GetLogDetail returns the content of a specific log
func (h *LogHandler) GetLogDetail(w http.ResponseWriter, r *http.Request) {
	// Extract date and ID from URL path: /api/v1/logs/{date}/{id}
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 6 {
		respondError(w, http.StatusBadRequest, "invalid path")
		return
	}
	date := parts[4]
	id := parts[5]

	detail, err := h.logService.GetLogDetail(date, id)
	if err != nil {
		respondError(w, http.StatusNotFound, "log not found")
		return
	}
	respondJSON(w, http.StatusOK, detail)
}