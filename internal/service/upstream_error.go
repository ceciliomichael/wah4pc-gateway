package service

import (
	"fmt"
	"net/http"
)

// UpstreamHTTPError represents an HTTP error returned by an upstream provider.
type UpstreamHTTPError struct {
	Upstream     string
	StatusCode   int
	ResponseBody string
	Attempts     int
	TargetURL    string
}

func (e *UpstreamHTTPError) Error() string {
	return e.Summary()
}

// Summary returns a readable message that includes status and upstream response detail when available.
func (e *UpstreamHTTPError) Summary() string {
	message := fmt.Sprintf("%s returned HTTP %s (%d)", e.Upstream, http.StatusText(e.StatusCode), e.StatusCode)
	if e.Attempts > 0 {
		message = fmt.Sprintf("%s after %d attempt(s)", message, e.Attempts)
	}
	if e.TargetURL != "" {
		message = fmt.Sprintf("%s while calling %s", message, e.TargetURL)
	}
	if e.ResponseBody == "" {
		return message
	}
	return fmt.Sprintf("%s: %s", message, e.ResponseBody)
}

// UpstreamForwardingError represents a transport-level forwarding failure after retries.
type UpstreamForwardingError struct {
	Upstream   string
	Attempts   int
	TargetURL  string
	LastReason string
}

func (e *UpstreamForwardingError) Error() string {
	return e.Summary()
}

// Summary returns a readable message that describes the retry attempts and final reason.
func (e *UpstreamForwardingError) Summary() string {
	message := fmt.Sprintf("failed to forward request to %s", e.Upstream)
	if e.Attempts > 0 {
		message = fmt.Sprintf("%s after %d attempt(s)", message, e.Attempts)
	}
	if e.TargetURL != "" {
		message = fmt.Sprintf("%s while calling %s", message, e.TargetURL)
	}
	if e.LastReason == "" {
		return message
	}
	return fmt.Sprintf("%s: %s", message, e.LastReason)
}
