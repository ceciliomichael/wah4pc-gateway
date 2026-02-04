# Build Stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install git
RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build the Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -o validator-service cmd/api/main.go

# Runtime Stage (Must include Java for the JAR)
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy Go binary
COPY --from=builder /app/validator-service .

# Copy Configuration and Resources
# NOTE: We assume these exist in the context. 
# If validator_cli.jar is downloaded during build, add that step.
COPY config.yaml .
COPY validator_cli.jar . 
COPY resources ./resources

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose ports
# 8080: Go HTTP API
# 9090: Internal Java Validator (if exposed, though usually internal)
EXPOSE 8080

CMD ["./validator-service"]