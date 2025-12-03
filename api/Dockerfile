FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev vips-dev

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o main ./cmd/api

# Final stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates vips

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/main .

# Create storage directory
RUN mkdir -p storage/uploads storage/qrcodes storage/pdfs

EXPOSE 8080

CMD ["./main"]
