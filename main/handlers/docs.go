package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/itsmaleen/tech-doc-processor/helpers"
	"github.com/itsmaleen/tech-doc-processor/types"
	"github.com/jackc/pgx/v5/pgxpool"
)

func HandleQueryDocs(logger *log.Logger, pgxConn *pgxpool.Pool, geminiApiKey string) http.HandlerFunc {
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

		logger.Printf("Query: %s", query)

		chunksData, err := retrieveTopRelevantChunks(r.Context(), logger, pgxConn, geminiApiKey, query, 10)
		if err != nil {
			http.Error(w, "Failed to retrieve top relevant chunks", http.StatusInternalServerError)
			return
		}

		helpers.Encode(w, r, http.StatusOK, chunksData)
	}
}

func HandleLoadDocsMarkdown(logger *log.Logger, pgxConn *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow GET requests
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get the URL from the query parameters
		url := r.URL.Query().Get("url")
		if url == "" {
			http.Error(w, "URL is required", http.StatusBadRequest)
			return
		}

		logger.Printf("URL: %s", url)

		// Get the html contend from all pages
		type Page struct {
			Title    string `json:"title"`
			URL      string `json:"url"`
			Markdown string `json:"markdown"`
		}

		rows, err := pgxConn.Query(context.Background(), "SELECT url, markdown_content, html_content FROM pages JOIN urls ON pages.url_id = urls.id WHERE url ilike $1", fmt.Sprintf("%%%s%%", url))
		if err != nil {
			http.Error(w, "Failed to query pages", http.StatusInternalServerError)
			return
		}

		defer rows.Close()

		var pages []Page
		for rows.Next() {
			var page Page
			var htmlPath string
			var markdownPath string
			err := rows.Scan(&page.URL, &markdownPath, &htmlPath)
			if err != nil {
				http.Error(w, "Failed to scan page", http.StatusInternalServerError)
				return
			}

			htmlContent, err := os.ReadFile(htmlPath)
			if err != nil {
				http.Error(w, "Failed to read html content", http.StatusInternalServerError)
				return
			}

			markdownContent, err := os.ReadFile(markdownPath)
			if err != nil {
				http.Error(w, "Failed to read markdown content", http.StatusInternalServerError)
				return
			}

			// Get the title from the html content
			page.Title = helpers.GetTitleFromHTML(string(htmlContent))
			// Clean the markdown content by starting from the title
			page.Markdown = helpers.CleanMarkdownByStartingFromTitle(string(markdownContent), page.Title)
			pages = append(pages, page)
		}

		// Write the pages to the response
		w.Header().Set("Content-Type", "application/json")
		helpers.Encode(w, r, http.StatusOK, pages)
	}
}

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

		logger.Printf("Query: %s", query)

		responseData, err := retrieveTopRelevantChunks(r.Context(), logger, pgxConn, geminiApiKey, query, 10)
		if err != nil {
			http.Error(w, "Failed to retrieve top relevant chunks", http.StatusInternalServerError)
			return
		}

		// Write the chunks to the response
		helpers.Encode(w, r, http.StatusOK, responseData)
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

		type Source struct {
			Text string `json:"text"`
			URL  string `json:"url"`
		}

		// Return the answer and metadata
		type RAGResponse struct {
			ID        string   `json:"id"`
			Answer    string   `json:"content"`
			Sources   []Source `json:"sources"`
			Sender    string   `json:"sender"`
			Timestamp string   `json:"timestamp"`
		}

		var sources []Source
		for _, chunk := range chunksData {
			htmlContent := helpers.GetHTMLFromMarkdown(chunk.Text)
			sources = append(sources, Source{
				Text: htmlContent,
				URL:  chunk.SourceURL,
			})
		}

		logger.Printf("Answer: %v", response.Answer.Content.Parts)

		ragResponse := RAGResponse{
			ID:        uuid.New().String(),
			Answer:    response.Answer.Content.Parts[0].Text,
			Sources:   sources,
			Sender:    "bot",
			Timestamp: time.Now().Format(time.RFC3339),
		}

		helpers.Encode(w, r, http.StatusOK, ragResponse)
	}
}
