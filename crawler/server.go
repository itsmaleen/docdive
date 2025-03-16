package main

import (
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mendableai/firecrawl-go"
)

func Server(
	logger *log.Logger,
	pgxConn *pgxpool.Pool,
	firecrawlClient *firecrawl.FirecrawlApp,
) http.Handler {
	mux := http.NewServeMux()
	addRoutes(mux, logger, pgxConn, firecrawlClient)

	var handler http.Handler = mux
	// add middleware if needed
	return handler
}
