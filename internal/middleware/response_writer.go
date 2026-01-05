package middleware

import (
	"bytes"
	"net/http"
)

// ResponseWriterWrapper wraps http.ResponseWriter to capture status code, headers, and body
// This is shared across middleware that needs to capture response details
type ResponseWriterWrapper struct {
	http.ResponseWriter
	statusCode    int
	written       bool
	body          *bytes.Buffer
	maxBodySize   int
	bodyTruncated bool
}

// NewResponseWriterWrapper creates a new wrapper with default 200 status
func NewResponseWriterWrapper(w http.ResponseWriter, maxBodySize int) *ResponseWriterWrapper {
	return &ResponseWriterWrapper{
		ResponseWriter: w,
		statusCode:     http.StatusOK,
		written:        false,
		body:           &bytes.Buffer{},
		maxBodySize:    maxBodySize,
		bodyTruncated:  false,
	}
}

// WriteHeader captures the status code before calling the underlying WriteHeader
func (rw *ResponseWriterWrapper) WriteHeader(code int) {
	if !rw.written {
		rw.statusCode = code
		rw.written = true
	}
	rw.ResponseWriter.WriteHeader(code)
}

// Write captures the response body while also writing to the original writer
func (rw *ResponseWriterWrapper) Write(b []byte) (int, error) {
	if !rw.written {
		rw.statusCode = http.StatusOK
		rw.written = true
	}

	// Capture body up to max size
	if !rw.bodyTruncated {
		remaining := rw.maxBodySize - rw.body.Len()
		if remaining > 0 {
			if len(b) <= remaining {
				rw.body.Write(b)
			} else {
				rw.body.Write(b[:remaining])
				rw.bodyTruncated = true
			}
		} else {
			rw.bodyTruncated = true
		}
	}

	return rw.ResponseWriter.Write(b)
}

// StatusCode returns the captured status code
func (rw *ResponseWriterWrapper) StatusCode() int {
	return rw.statusCode
}

// Written returns whether the response has been written
func (rw *ResponseWriterWrapper) Written() bool {
	return rw.written
}

// GetBody returns the captured response body as a string
func (rw *ResponseWriterWrapper) GetBody() string {
	body := rw.body.String()
	if rw.bodyTruncated {
		body += "\n\n[TRUNCATED - Response exceeded max capture size]"
	}
	return body
}

// GetBodyBytes returns the captured response body as bytes
func (rw *ResponseWriterWrapper) GetBodyBytes() []byte {
	return rw.body.Bytes()
}

// GetBodySize returns the captured body size
func (rw *ResponseWriterWrapper) GetBodySize() int {
	return rw.body.Len()
}

// IsTruncated returns whether the body was truncated
func (rw *ResponseWriterWrapper) IsTruncated() bool {
	return rw.bodyTruncated
}

// Header returns the header map (implements http.ResponseWriter)
func (rw *ResponseWriterWrapper) Header() http.Header {
	return rw.ResponseWriter.Header()
}