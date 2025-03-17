package main

import (
	"log"
	"net/http"

	pb "github.com/itsmaleen/tech-doc-processor/proto/tfidf"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mendableai/firecrawl-go"
)

func Server(
	logger *log.Logger,
	pgxConn *pgxpool.Pool,
	firecrawlClient *firecrawl.FirecrawlApp,
	tfidfServiceClient pb.TFIDFServiceClient,
) http.Handler {
	mux := http.NewServeMux()
	addRoutes(mux, logger, pgxConn, firecrawlClient, tfidfServiceClient)

	var handler http.Handler = mux
	// add middleware if needed
	return handler
}
