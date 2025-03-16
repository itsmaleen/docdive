package main

import (
	"context"

	pb "github.com/itsmaleen/tech-doc-processor/proto/tfidf"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// TFIDFService wraps the TFIDF client and provides methods for text analysis
type TFIDFService struct {
	client pb.TFIDFServiceClient
	conn   *grpc.ClientConn
}

// NewTFIDFService creates a new TFIDF service instance
func NewTFIDFService(address string) (*TFIDFService, error) {
	conn, err := grpc.Dial(address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	client := pb.NewTFIDFServiceClient(conn)
	return &TFIDFService{
		client: client,
		conn:   conn,
	}, nil
}

// Close closes the TFIDF service connection
func (s *TFIDFService) Close() error {
	return s.conn.Close()
}

// CleanText removes code blocks, URLs, and special characters from text
func (s *TFIDFService) CleanText(ctx context.Context, text string) (string, error) {
	resp, err := s.client.CleanText(ctx, &pb.CleanTextRequest{
		Text: text,
	})
	if err != nil {
		return "", err
	}
	return resp.CleanedText, nil
}

// GetTopTerms returns the top N terms for each document based on TF-IDF scores
func (s *TFIDFService) GetTopTerms(ctx context.Context, documents []string, maxFeatures, topN int32) ([][]string, error) {
	resp, err := s.client.GetTopTerms(ctx, &pb.TopTermsRequest{
		Documents:   documents,
		MaxFeatures: maxFeatures,
		TopN:        topN,
	})
	if err != nil {
		return nil, err
	}

	result := make([][]string, len(resp.Documents))
	for i, doc := range resp.Documents {
		result[i] = doc.Terms
	}
	return result, nil
}

// TermPair represents a pair of co-occurring terms and their count
type TermPair struct {
	Term1 string
	Term2 string
	Count int32
}

// GetCoOccurrences returns the top N co-occurring term pairs within the specified window size
func (s *TFIDFService) GetCoOccurrences(ctx context.Context, documents []string, windowSize, topN int32) ([]TermPair, error) {
	resp, err := s.client.GetCoOccurrences(ctx, &pb.CoOccurrenceRequest{
		Documents:  documents,
		WindowSize: windowSize,
		TopN:       topN,
	})
	if err != nil {
		return nil, err
	}

	result := make([]TermPair, len(resp.Pairs))
	for i, pair := range resp.Pairs {
		result[i] = TermPair{
			Term1: pair.Term1,
			Term2: pair.Term2,
			Count: pair.Count,
		}
	}
	return result, nil
}

// GetTermClusters groups terms into clusters based on their TF-IDF vectors
func (s *TFIDFService) GetTermClusters(ctx context.Context, documents []string, nClusters int32) (map[int32][]string, error) {
	resp, err := s.client.GetTermClusters(ctx, &pb.TermClustersRequest{
		Documents: documents,
		NClusters: nClusters,
	})
	if err != nil {
		return nil, err
	}

	result := make(map[int32][]string)
	for clusterID, termGroup := range resp.Clusters {
		result[clusterID] = termGroup.Terms
	}
	return result, nil
}
