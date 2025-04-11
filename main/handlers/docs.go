package handlers

import (
	"context"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/itsmaleen/tech-doc-processor/helpers"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mendableai/firecrawl-go"
)

type ScrapeDocsRequest struct {
	URL string `json:"url"`
}

type Source struct {
	ID        int       `json:"id"`
	URL       string    `json:"source_url"`
	Name      string    `json:"source_name"`
	CrawledAt time.Time `json:"crawled_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Url struct {
	ID      int    `json:"id"`
	URL     string `json:"url"`
	Scraped bool   `json:"scraped"`
}

type Page struct {
	ID              int       `json:"id"`
	UrlID           int       `json:"url_id"`
	HTMLContent     string    `json:"html_content"`
	MarkdownContent string    `json:"markdown_content"`
	ProcessedAt     time.Time `json:"processed_at"`
}

func ptr[T any](v T) *T {
	return &v
}

func HandleScrapeDocs(logger *log.Logger, pgxConn *pgxpool.Pool, firecrawlClient *firecrawl.FirecrawlApp) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		scrapeReq, err := helpers.Decode[ScrapeDocsRequest](r.Body)
		if err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// TODO:
		// From there, create a set of urls that don't need to be scraped

		// Scrape a website page
		scrapeStatus, err := firecrawlClient.ScrapeURL(scrapeReq.URL, &firecrawl.ScrapeParams{
			Formats: []string{"markdown", "html"},
		})
		if err != nil {
			log.Fatalf("Failed to send scrape request: %v", err)
		}

		logger.Printf("Scrape status: %v", scrapeStatus)

		// Crawl a website
		idempotencyKey := uuid.New().String() // optional idempotency key
		crawlParams := &firecrawl.CrawlParams{
			ExcludePaths: []string{"blog/*"},
			MaxDepth:     ptr(2),
		}

		crawlStatus, err := firecrawlClient.CrawlURL(scrapeReq.URL, crawlParams, &idempotencyKey)
		if err != nil {
			log.Fatalf("Failed to send crawl request: %v", err)
		}

		logger.Printf("Crawl status: %v", crawlStatus)

	}
}

func HandleCrawl(logger *log.Logger, pgxConn *pgxpool.Pool, firecrawlClient *firecrawl.FirecrawlApp) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		scrapeReq, err := helpers.Decode[ScrapeDocsRequest](r.Body)
		if err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		// Create or get a source
		var source Source
		err = pgxConn.QueryRow(context.Background(), `
			INSERT INTO documentation_sources (source_url) 
			VALUES ($1) 
			ON CONFLICT (source_url) DO UPDATE 
			SET updated_at = NOW()
			RETURNING id`,
			scrapeReq.URL).Scan(&source.ID)
		if err != nil {
			log.Fatalf("Failed to create or get source: %v", err)
		}

		// TODO: update the source with the name if it's not already set with the name of the website

		// Map a website
		mapResult, err := firecrawlClient.MapURL(scrapeReq.URL, nil)
		if err != nil {
			log.Fatalf("Failed to map URL: %v", err)
		}

		// Create a batch
		batch := &pgx.Batch{}

		// Queue all the inserts
		for _, url := range mapResult.Links {
			batch.Queue(
				"INSERT INTO urls (url, source_id) VALUES ($1, $2) ON CONFLICT (url) DO NOTHING",
				url,
				source.ID,
			)
		}

		// Execute the batch
		br := pgxConn.SendBatch(context.Background(), batch)
		defer br.Close()

		// Check for errors
		for i := 0; i < batch.Len(); i++ {
			if _, err := br.Exec(); err != nil {
				log.Fatalf("Failed to execute batch insert: %v", err)
			}
		}

		helpers.Encode(w, r, http.StatusOK, mapResult)

	}
}

func HandleUnScrapedUrls(logger *log.Logger, pgxConn *pgxpool.Pool, firecrawlClient *firecrawl.FirecrawlApp) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get all urls that are not scraped
		rows, err := pgxConn.Query(context.Background(), "SELECT id, url FROM urls WHERE scraped = FALSE")
		if err != nil {
			log.Fatalf("Failed to get unscraped urls: %v", err)
		}
		defer rows.Close()

		// Read the rows
		var scrapedUrlIDs []int
		var pages []Page
		for rows.Next() {
			var url Url
			err = rows.Scan(&url.ID, &url.URL)
			if err != nil {
				log.Printf("Failed to scan url: %v", err)
				continue
			}

			scrapeResult, err := firecrawlClient.ScrapeURL(url.URL, &firecrawl.ScrapeParams{
				Formats: []string{"markdown", "html"},
			})
			if err != nil {
				log.Printf("Failed to scrape url: %v", err)
				continue
			}

			page := Page{
				ID:              url.ID,
				UrlID:           url.ID,
				HTMLContent:     scrapeResult.HTML,
				MarkdownContent: scrapeResult.Markdown,
			}
			pages = append(pages, page)
			scrapedUrlIDs = append(scrapedUrlIDs, url.ID)
		}

		// Update the urls to be scraped
		_, err = pgxConn.Exec(context.Background(), "UPDATE urls SET scraped = TRUE WHERE id = ANY($1)", scrapedUrlIDs)
		if err != nil {
			log.Printf("Failed to update urls: %v", err)
		}

		batch := &pgx.Batch{}
		for _, page := range pages {
			batch.Queue("INSERT INTO pages (url_id, html_content, markdown_content, processed_at) VALUES ($1, $2, $3, NOW())", page.UrlID, page.HTMLContent, page.MarkdownContent)
		}

		// Execute the batch
		br := pgxConn.SendBatch(context.Background(), batch)
		defer br.Close()

		// Check for errors
		for i := 0; i < batch.Len(); i++ {
			if _, err := br.Exec(); err != nil {
				log.Printf("Failed to execute batch insert: %v", err)
			}
		}

		helpers.Encode(w, r, http.StatusOK, pages)
	}
}
