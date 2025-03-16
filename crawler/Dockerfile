# Use official Go image to create a build artifact
FROM golang:1.22 AS builder

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64

# Install protoc and its dependencies
RUN apt-get update && apt-get install -y \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application code
COPY . .

RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@latest

# Generate protobuf code
RUN chmod +x scripts/generate_proto.sh
RUN GOPROXY=https://proxy.golang.org,direct ./scripts/generate_proto.sh

# Build the application
RUN go build -o main .

# Use distroless as minimal base image 
FROM gcr.io/distroless/static-debian11

# Set the working directory in the container
WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/main .

# Expose the port the application runs on
EXPOSE 8080

# Command to run the application
ENTRYPOINT ["/app/main"]
