package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/wah4pc/wah4pc-gateway/internal/middleware"
	"github.com/wah4pc/wah4pc-gateway/internal/model"
	"github.com/wah4pc/wah4pc-gateway/pkg/realtime"
)

// EventsHandler streams realtime server events over SSE.
type EventsHandler struct {
	broker *realtime.Broker
}

func NewEventsHandler(broker *realtime.Broker) *EventsHandler {
	return &EventsHandler{broker: broker}
}

func (h *EventsHandler) Stream(w http.ResponseWriter, r *http.Request) {
	if h.broker == nil {
		http.Error(w, "realtime unavailable", http.StatusServiceUnavailable)
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming unsupported", http.StatusInternalServerError)
		return
	}

	role := middleware.GetRoleFromContext(r.Context())
	providerID := middleware.GetProviderIDFromContext(r.Context())
	isAdmin := role == model.ApiKeyRoleAdmin

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	ch := h.broker.Subscribe()
	defer h.broker.Unsubscribe(ch)

	fmt.Fprint(w, "event: ready\ndata: {\"status\":\"connected\"}\n\n")
	flusher.Flush()

	for {
		select {
		case <-r.Context().Done():
			return
		case event, ok := <-ch:
			if !ok {
				return
			}
			if !isAdmin && !eventMatchesProvider(event, providerID) {
				continue
			}

			payload, err := json.Marshal(event)
			if err != nil {
				continue
			}

			fmt.Fprintf(w, "event: %s\n", event.Type)
			fmt.Fprintf(w, "data: %s\n\n", payload)
			flusher.Flush()
		}
	}
}

func eventMatchesProvider(event realtime.Event, providerID string) bool {
	if providerID == "" {
		return false
	}
	for _, id := range event.ProviderIDs {
		if id == providerID {
			return true
		}
	}
	return false
}
