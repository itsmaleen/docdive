package main

import (
	"log"
	"net/http"
	"time"

	"github.com/itsmaleen/tech-doc-processor/handlers"
	pb "github.com/itsmaleen/tech-doc-processor/proto/rag-tools"
	"github.com/jackc/pgx/v5/pgxpool"
)

// loggingMiddleware wraps an http.HandlerFunc with request logging
func loggingMiddleware(logger *log.Logger, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		logger.Printf("[%s] %s", r.Method, r.URL.Path)
		defer func() {
			logger.Printf("[%s] %s | %v", r.Method, r.URL.Path, time.Since(start))
		}()
		next(w, r)
	}
}

func addRoutes(
	mux *http.ServeMux,
	logger *log.Logger,
	pgxConn *pgxpool.Pool,
	ragToolsServiceClient pb.MarkdownChunkerServiceClient,
	geminiApiKey string,
	supabaseURL string,
	supabaseAnonKey string,
) {
	// Documentation Routes
	mux.HandleFunc("/api/docs/list", loggingMiddleware(logger, handlers.HandleLoadDocPaths(logger, pgxConn)))
	mux.HandleFunc("/api/docs/content", loggingMiddleware(logger, handlers.HandleLoadDocsContent(logger, pgxConn, supabaseURL)))
	mux.HandleFunc("/api/docs/pages", loggingMiddleware(logger, handlers.HandleLoadPageContent(logger, pgxConn, supabaseURL)))

	// Scraping Routes
	mux.HandleFunc("/api/scraper/raw", loggingMiddleware(logger, handlers.HandleScrapeDocsRaw(logger, pgxConn, supabaseURL, supabaseAnonKey)))
	mux.HandleFunc("/api/scraper/markdown", loggingMiddleware(logger, handlers.HandlePagesWithoutMarkdownContent(logger, pgxConn, supabaseURL, supabaseAnonKey)))
	mux.HandleFunc("/api/scraper/chunk", loggingMiddleware(logger, handlers.HandleChunkingUnProcessedPages(logger, pgxConn, ragToolsServiceClient)))

	// RAG Routes
	mux.HandleFunc("/api/rag/embeddings", loggingMiddleware(logger, handlers.HandleSaveEmbeddings(logger, pgxConn, geminiApiKey)))
	mux.HandleFunc("/api/rag/retrieve", loggingMiddleware(logger, handlers.HandleRetrievalQuery(logger, pgxConn, geminiApiKey)))
	mux.HandleFunc("/api/rag/query", loggingMiddleware(logger, handlers.HandleRAGQuery(logger, pgxConn, geminiApiKey)))

	// Maintenance Routes
	mux.HandleFunc("/api/maintenance/cleanup-titles", loggingMiddleware(logger, handlers.HandleUpdatePageTitle(logger, pgxConn, supabaseURL)))
}
