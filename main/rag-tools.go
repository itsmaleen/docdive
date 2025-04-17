package main

import (
	"context"

	pb "github.com/itsmaleen/tech-doc-processor/proto/rag-tools"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// TFIDFService wraps the TFIDF client and provides methods for text analysis
type RAGToolsService struct {
	Client pb.MarkdownChunkerServiceClient
	Conn   *grpc.ClientConn
}

// NewRAGToolsService creates a new RAGTools service instance
func NewRAGToolsService(address string) (*RAGToolsService, error) {
	conn, err := grpc.NewClient(address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	client := pb.NewMarkdownChunkerServiceClient(conn)
	return &RAGToolsService{
		Client: client,
		Conn:   conn,
	}, nil
}

// Close closes the RAGTools service connection
func (s *RAGToolsService) Close() error {
	return s.Conn.Close()
}

func (s *RAGToolsService) ChunkMarkdown(ctx context.Context, content string, chunkSize, overlap int32) ([]string, error) {
	request := &pb.ChunkMarkdownRequest{
		Content:   content,
		ChunkSize: chunkSize,
		Overlap:   overlap,
	}

	response, err := s.Client.ChunkMarkdown(ctx, request)
	if err != nil {
		return nil, err
	}

	return response.Chunks, nil
}
