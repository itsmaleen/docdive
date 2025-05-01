package main

import (
	"log"
	"net/http"

	pb "github.com/itsmaleen/tech-doc-processor/proto/rag-tools"
	"github.com/jackc/pgx/v5/pgxpool"
)

// corsMiddleware adds CORS headers to allow requests from specified origins
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "https://fenn.pages.dev")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func Server(
	logger *log.Logger,
	pgxConn *pgxpool.Pool,
	ragToolsServiceClient pb.MarkdownChunkerServiceClient,
	geminiApiKey string,
	supabaseURL string,
	supabaseAnonKey string,
	supabaseStorageBucket string,
) http.Handler {
	mux := http.NewServeMux()
	addRoutes(mux, logger, pgxConn, ragToolsServiceClient, geminiApiKey, supabaseURL, supabaseAnonKey, supabaseStorageBucket)

	var handler http.Handler = mux
	// Add CORS middleware
	handler = corsMiddleware(handler)
	return handler
}
