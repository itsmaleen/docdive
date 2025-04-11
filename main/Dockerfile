# Use official Go image to create a build artifact
FROM golang:1.24.2 AS builder

ENV CGO_ENABLED=0 GOOS=linux GOARCH=amd64

# Set the working directory inside the container
WORKDIR /app

# Copy go module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application code
COPY . .

# Build the application
RUN go build -o main .

# Use a minimal base image for deployment
FROM debian:bullseye-slim

RUN apt-get update && apt-get install -y ca-certificates

# Set the working directory in the container
WORKDIR /app

# Copy the compiled binary from the builder stage
COPY --from=builder /app/main .

# Expose the port the application runs on
EXPOSE 8080

# Command to run the application
ENTRYPOINT ["./main"]
