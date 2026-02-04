# Build Stage
FROM golang:1.22-alpine AS builder

# Install git for fetching dependencies
RUN apk add --no-cache git

WORKDIR /app

# Copy go.mod and go.sum first to leverage layer caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
# CGO_ENABLED=0 ensures a statically linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -o server cmd/main.go

# Run Stage
FROM alpine:latest

# Install dependencies:
# - ca-certificates: for HTTPS
# - tzdata: for timezones
# - su-exec: for dropping privileges in entrypoint
RUN apk add --no-cache ca-certificates tzdata su-exec

WORKDIR /app

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy binary and config
COPY --from=builder /app/server .
COPY --from=builder /app/config.yaml .

# Copy entrypoint script
COPY entrypoint.sh .
# Fix potential Windows CRLF line endings and make executable
RUN sed -i 's/\r$//' entrypoint.sh && chmod +x entrypoint.sh

# Create necessary directories
RUN mkdir -p data log

# Entrypoint handles permission fixing and user switching
ENTRYPOINT ["./entrypoint.sh"]

# Default command
CMD ["./server"]