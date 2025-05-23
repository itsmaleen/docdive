package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/itsmaleen/tech-doc-processor/helpers"
	"github.com/itsmaleen/tech-doc-processor/types"
	"github.com/jackc/pgx/v5/pgxpool"
)

func HandleRetrievalQuery(logger *log.Logger, pgxConn *pgxpool.Pool, geminiApiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST requests
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Failed to parse form", http.StatusBadRequest)
			return
		}

		query := r.FormValue("query")
		if query == "" {
			http.Error(w, "Query is required", http.StatusBadRequest)
			return
		}

		logger.Printf("RAG Query: %s", query)

		// Retrieve relevant chunks
		chunksData, err := retrieveTopRelevantChunks(r.Context(), logger, pgxConn, geminiApiKey, query, 10)
		if err != nil {
			http.Error(w, "Failed to retrieve top relevant chunks", http.StatusInternalServerError)
			return
		}

		var sources []types.Source
		for _, chunk := range chunksData {
			htmlContent := helpers.GetHTMLFromMarkdown(chunk.Text)
			sources = append(sources, types.Source{
				Text: htmlContent,
				URL:  chunk.SourceURL,
			})
		}

		ragResponse := types.RAGResponse{
			ID:        uuid.New().String(),
			Answer:    "Here are the chunks that I found relevant to your query.",
			Sources:   sources,
			Sender:    "bot",
			Timestamp: time.Now().Format(time.RFC3339),
		}

		helpers.Encode(w, r, http.StatusOK, ragResponse)
	}
}

func retrieveTopRelevantChunks(ctx context.Context, logger *log.Logger, pgxConn *pgxpool.Pool, geminiApiKey string, query string, limit int) ([]types.ChunkData, error) {
	embedding, err := helpers.GenerateGeminiEmbedding(geminiApiKey, query, "gemini-embedding-exp-03-07", helpers.TaskTypeRetrievalQuery)
	if err != nil {
		logger.Printf("Error in similarity search: %v", err)
		return nil, err
	}

	logger.Printf("Embedding generated for query is dimension %d", len(embedding))

	// Convert query embedding to PostgreSQL vector format
	vectorStr := helpers.ConvertToVector(embedding)

	// Use cosine similarity operator (<->) with proper vector casting
	rows, err := pgxConn.Query(ctx, "SELECT id, text, metadata FROM chunks ORDER BY vector_embedding <=> $1::vector LIMIT $2", vectorStr, limit)
	if err != nil {
		logger.Printf("Error in similarity search: %v", err)
		return nil, err
	}
	defer rows.Close()

	var chunks []types.Chunk
	for rows.Next() {
		var id int
		var text string
		var metadata types.ChunkMetadata
		err = rows.Scan(&id, &text, &metadata)
		if err != nil {
			logger.Printf("Error scanning row: %v", err)
			return nil, err
		}

		chunks = append(chunks, types.Chunk{
			ID:       id,
			Text:     text,
			Metadata: metadata,
		})
	}

	logger.Printf("Found %d chunks in similarity search", len(chunks))

	chunksData := []types.ChunkData{}
	for _, chunk := range chunks {
		chunksData = append(chunksData, types.ChunkData{
			Text:       chunk.Text,
			SourceURL:  chunk.Metadata.SourceURL,
			ChunkPath:  chunk.Metadata.ChunkPath,
			ChunkIndex: chunk.Metadata.Index,
		})
	}

	return chunksData, nil
}

// HandleRAGQuery handles RAG-based question answering using the Gemini API
func HandleRAGQuery(logger *log.Logger, pgxConn *pgxpool.Pool, geminiApiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST requests
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Failed to parse form", http.StatusBadRequest)
			return
		}

		query := r.FormValue("query")
		if query == "" {
			http.Error(w, "Query is required", http.StatusBadRequest)
			return
		}

		logger.Printf("RAG Query: %s", query)

		// Retrieve relevant chunks
		chunksData, err := retrieveTopRelevantChunks(r.Context(), logger, pgxConn, geminiApiKey, query, 10)
		if err != nil {
			http.Error(w, "Failed to retrieve top relevant chunks", http.StatusInternalServerError)
			return
		}

		// Generate answer using the chunks as grounding
		answerStyle := helpers.AnswerStyleVerbose
		temperature := 0.2 // Low temperature for more deterministic answers

		// Use models from https://ai.google.dev/gemini-api/docs/models#model-variations
		response, err := helpers.GenerateAnswer(logger, geminiApiKey, query, chunksData, "models/gemini-2.5-pro-preview-03-25", answerStyle, temperature)
		if err != nil {
			logger.Printf("Error generating answer: %v", err)
			http.Error(w, "Failed to generate answer", http.StatusInternalServerError)
			return
		}
		var sources []types.Source
		for _, chunk := range chunksData {
			htmlContent := helpers.GetHTMLFromMarkdown(chunk.Text)
			sources = append(sources, types.Source{
				Text: htmlContent,
				URL:  chunk.SourceURL,
			})
		}

		answerText := "Unable to generate answer"
		if len(response.Answer.Content.Parts) > 0 {
			answerText = response.Answer.Content.Parts[0].Text
		}
		logger.Printf("Answer: %v", response.Answer.Content.Parts)

		ragResponse := types.RAGResponse{
			ID:        uuid.New().String(),
			Answer:    answerText,
			Sources:   sources,
			Sender:    "bot",
			Timestamp: time.Now().Format(time.RFC3339),
		}

		helpers.Encode(w, r, http.StatusOK, ragResponse)
	}
}
