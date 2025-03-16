package main

import (
	"context"
	"testing"
	"time"
)

func TestTFIDFClient(t *testing.T) {
	ctx := context.Background()
	client, err := NewTFIDFService("tfidf-service:50051")
	if err != nil {
		t.Fatalf("Failed to create TFIDF client: %v", err)
	}
	defer client.Close()

	// Add timeout to context
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	t.Run("CleanText", func(t *testing.T) {
		text := "Hello World! This is a test with some https://links.com and ```code blocks```"
		cleaned, err := client.CleanText(ctx, text)
		if err != nil {
			t.Fatalf("CleanText failed: %v", err)
		}
		if cleaned == "" {
			t.Error("CleanText returned empty string")
		}
	})

	t.Run("GetTopTerms", func(t *testing.T) {
		docs := []string{
			"machine learning is a subset of artificial intelligence",
			"deep learning uses neural networks for machine learning",
			"artificial intelligence is changing the world",
		}
		terms, err := client.GetTopTerms(ctx, docs, 10, 3)
		if err != nil {
			t.Fatalf("GetTopTerms failed: %v", err)
		}
		if len(terms) != len(docs) {
			t.Errorf("Expected %d document results, got %d", len(docs), len(terms))
		}
	})

	t.Run("GetCoOccurrences", func(t *testing.T) {
		docs := []string{
			"the quick brown fox jumps over the lazy dog",
			"the brown fox is quick and the dog is lazy",
		}
		pairs, err := client.GetCoOccurrences(ctx, docs, 2, 3)
		if err != nil {
			t.Fatalf("GetCoOccurrences failed: %v", err)
		}
		if len(pairs) > 3 {
			t.Errorf("Expected at most 3 pairs, got %d", len(pairs))
		}
	})

	t.Run("GetTermClusters", func(t *testing.T) {
		docs := []string{
			"machine learning artificial intelligence",
			"deep learning neural networks",
			"data science machine learning",
			"artificial intelligence deep learning",
		}
		clusters, err := client.GetTermClusters(ctx, docs, 2)
		if err != nil {
			t.Fatalf("GetTermClusters failed: %v", err)
		}
		if len(clusters) > 2 {
			t.Errorf("Expected at most 2 clusters, got %d", len(clusters))
		}
		for _, terms := range clusters {
			if len(terms) == 0 {
				t.Error("Got empty cluster")
			}
		}
	})

	t.Run("Error Handling", func(t *testing.T) {
		// Test empty input
		_, err := client.CleanText(ctx, "")
		if err == nil {
			t.Error("Expected error for empty text input")
		}

		// Test invalid window size
		_, err = client.GetCoOccurrences(ctx, []string{"test"}, -1, 3)
		if err == nil {
			t.Error("Expected error for negative window size")
		}

		// Test invalid cluster count
		_, err = client.GetTermClusters(ctx, []string{"test"}, 0)
		if err == nil {
			t.Error("Expected error for zero clusters")
		}
	})
}
