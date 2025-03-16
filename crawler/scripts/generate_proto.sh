#!/bin/bash

# Install protoc-gen-go and protoc-gen-go-grpc if not already installed
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest

export PATH="$PATH:$(go env GOPATH)/bin"

# Generate the protobuf code
protoc --go_out=. \
       --go_opt=paths=source_relative \
       --go_opt=M=proto/tfidf.proto=github.com/itsmaleen/tech-doc-processor/proto/tfidf \
       --go-grpc_out=. \
       --go-grpc_opt=paths=source_relative \
       --go-grpc_opt=M=proto/tfidf.proto=github.com/itsmaleen/tech-doc-processor/proto/tfidf \
       proto/tfidf.proto