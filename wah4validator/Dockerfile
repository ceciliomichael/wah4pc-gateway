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
COPY config.yaml .
COPY validator_cli.jar . 
COPY resources ./resources

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose port 3041 for API
EXPOSE 3041

CMD ["./validator-service"]