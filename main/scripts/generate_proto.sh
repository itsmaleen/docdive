#!/bin/bash

# Install protoc-gen-go and protoc-gen-go-grpc if not already installed
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

sudo apt install protobuf-compiler

export PATH="$PATH:$(go env GOPATH)/bin"

# Generate the protobuf code
protoc --go_out=. --go-grpc_out=. proto/rag-tools.proto