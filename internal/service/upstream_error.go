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
}

func (e *UpstreamHTTPError) Error() string {
	return e.Summary()
}

// Summary returns a readable message that includes status and upstream response detail when available.
func (e *UpstreamHTTPError) Summary() string {
	message := fmt.Sprintf("%s returned HTTP %s (%d)", e.Upstream, http.StatusText(e.StatusCode), e.StatusCode)
	if e.ResponseBody == "" {
		return message
	}
	return fmt.Sprintf("%s: %s", message, e.ResponseBody)
}
