package main

import (
	"log"
	"net/http"

	pb "github.com/itsmaleen/tech-doc-processor/proto/rag-tools"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Server(
	logger *log.Logger,
	pgxConn *pgxpool.Pool,
	ragToolsServiceClient pb.MarkdownChunkerServiceClient,
	geminiApiKey string,
) http.Handler {
	mux := http.NewServeMux()
	addRoutes(mux, logger, pgxConn, ragToolsServiceClient, geminiApiKey)

	var handler http.Handler = mux
	// add middleware if needed
	return handler
}
