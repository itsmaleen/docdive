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
	mux.HandleFunc("/scrape", loggingMiddleware(logger, handlers.HandleScrapeDocsRaw(logger, pgxConn, supabaseURL, supabaseAnonKey)))
	mux.HandleFunc("/scrape/markdown", loggingMiddleware(logger, handlers.HandlePagesWithoutMarkdownContent(logger, pgxConn, supabaseURL, supabaseAnonKey)))
	mux.HandleFunc("/scrape/markdown/chunk", loggingMiddleware(logger, handlers.HandleChunkingUnProcessedPages(logger, pgxConn, ragToolsServiceClient)))
	mux.HandleFunc("/embeddings", loggingMiddleware(logger, handlers.HandleSaveEmbeddings(logger, pgxConn, geminiApiKey)))
	mux.HandleFunc("/retrieval", loggingMiddleware(logger, handlers.HandleRetrievalQuery(logger, pgxConn, geminiApiKey)))
	mux.HandleFunc("/rag", loggingMiddleware(logger, handlers.HandleRAGQuery(logger, pgxConn, geminiApiKey)))
	mux.HandleFunc("/docs", loggingMiddleware(logger, handlers.HandleLoadDocsMarkdown(logger, pgxConn, supabaseURL)))
	mux.HandleFunc("/cleanup", loggingMiddleware(logger, handlers.HandleUpdatePageContentFields(logger, pgxConn)))
}
