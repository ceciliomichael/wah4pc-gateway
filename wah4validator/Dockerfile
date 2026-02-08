# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
# Build static export (output to 'out' folder by default with output: 'export')
RUN npm run build

# Stage 2: Build Backend
FROM golang:1.23-alpine AS backend-builder
WORKDIR /app
# Install git
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# Build the Go binary
RUN CGO_ENABLED=0 GOOS=linux go build -o validator-service cmd/api/main.go

# Stage 3: Runtime
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy Go binary
COPY --from=backend-builder /app/validator-service .

# Copy Frontend Static Assets
# We copy them to 'public' because that's what we configured in main.go
COPY --from=frontend-builder /app/frontend/out ./public

# Copy Configuration and Resources
# NOTE: validator_cli.jar must exist in the context or be downloaded
COPY config.yaml .
COPY validator_cli.jar . 
COPY resources ./resources

# Set ownership
RUN chown -R appuser:appgroup /app

USER appuser

# Expose ports
# 8080: Go HTTP API + Frontend
EXPOSE 8080

CMD ["./validator-service"]