package service

import "fmt"

// UpstreamHTTPError represents an HTTP error returned by an upstream provider.
type UpstreamHTTPError struct {
	Upstream   string
	StatusCode int
}

func (e *UpstreamHTTPError) Error() string {
	return fmt.Sprintf("%s returned HTTP %d", e.Upstream, e.StatusCode)
}
