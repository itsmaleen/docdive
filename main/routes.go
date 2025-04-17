package main

import (
	"log"
	"net/http"

	"github.com/itsmaleen/tech-doc-processor/handlers"
	pb "github.com/itsmaleen/tech-doc-processor/proto/rag-tools"
	"github.com/jackc/pgx/v5/pgxpool"
)

func addRoutes(
	mux *http.ServeMux,
	logger *log.Logger,
	pgxConn *pgxpool.Pool,
	ragToolsServiceClient pb.MarkdownChunkerServiceClient,
	geminiApiKey string,
) {
	mux.HandleFunc("/scrape", handlers.HandleScrapeDocsRaw(logger, pgxConn))
	mux.HandleFunc("/scrape/markdown", handlers.HandlePagesWithoutMarkdownContent(logger, pgxConn))
	mux.HandleFunc("/scrape/markdown/chunk", handlers.HandleChunkingUnProcessedPages(logger, pgxConn, ragToolsServiceClient))
	mux.HandleFunc("/embeddings", handlers.HandleSaveEmbeddings(logger, pgxConn, geminiApiKey))
	mux.HandleFunc("/retrieval", handlers.HandleRetrievalQuery(logger, pgxConn, geminiApiKey))
}
