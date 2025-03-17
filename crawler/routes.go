package main

import (
	"log"
	"net/http"

	"github.com/itsmaleen/tech-doc-processor/handlers"
	pb "github.com/itsmaleen/tech-doc-processor/proto/tfidf"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mendableai/firecrawl-go"
)

func addRoutes(
	mux *http.ServeMux,
	logger *log.Logger,
	pgxConn *pgxpool.Pool,
	firecrawlClient *firecrawl.FirecrawlApp,
	tfidfServiceClient pb.TFIDFServiceClient,

) {
	mux.HandleFunc("/docs/crawl", handlers.HandleCrawl(logger, pgxConn, firecrawlClient))
	mux.HandleFunc("/docs/unscraped-urls", handlers.HandleUnScrapedUrls(logger, pgxConn, firecrawlClient))
	mux.HandleFunc("/docs/categorize", handlers.HandleCategorizeScrapedPages(logger, pgxConn, tfidfServiceClient))
}
