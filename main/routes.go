package main

import (
	"log"
	"net/http"

	"github.com/itsmaleen/tech-doc-processor/handlers"
	"github.com/jackc/pgx/v5/pgxpool"
)

func addRoutes(
	mux *http.ServeMux,
	logger *log.Logger,
	pgxConn *pgxpool.Pool,
) {
	mux.HandleFunc("/scrape", handlers.HandleScrapeDocsRaw(logger, pgxConn))
	mux.HandleFunc("/scrape/markdown", handlers.HandlePagesWithoutMarkdownContent(logger, pgxConn))
}
