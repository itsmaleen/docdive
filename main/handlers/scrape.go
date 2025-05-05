package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/mendableai/firecrawl-go"

	htmltomarkdown "github.com/JohannesKaufmann/html-to-markdown/v2"
	"github.com/JohannesKaufmann/html-to-markdown/v2/converter"

	pb "github.com/itsmaleen/tech-doc-processor/proto/rag-tools"

	"github.com/itsmaleen/tech-doc-processor/helpers"
)

func HandleFirecrawlWebhook(logger *log.Logger, pgxConn *pgxpool.Pool, supabaseURL string, supabaseAnonKey string, supabaseStorageBucket string, firecrawlClient *firecrawl.FirecrawlApp) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger.Printf("Firecrawl webhook received")

		// Get the source id from the request
		sourceIDValue := r.FormValue("source_id")
		if sourceIDValue == "" {
			logger.Printf("Source ID not found in request")
		}

		sourceID, err := strconv.Atoi(sourceIDValue)
		if err != nil {
			logger.Printf("Failed to convert source ID to int: %v", err)
		}
		logger.Printf("Source ID: %d", sourceID)

		// Get webhook response data

		// success - If the webhook was successful in crawling the page correctly.
		// type - The type of event that occurred.
		// id - The ID of the crawl.
		// data - The data that was scraped (Array). This will only be non empty on crawl.page and will contain 1 item if the page was scraped successfully. The response is the same as the /scrape endpoint.
		// error - If the webhook failed, this will contain the error message.

		type FirecrawlWebhookResponse struct {
			Success bool        `json:"success"`
			Type    string      `json:"type"`
			ID      string      `json:"id"`
			Data    interface{} `json:"data"`
			// Data    []*firecrawl.FirecrawlDocument `json:"data"`
			Error string `json:"error"`
		}

		// Types:
		// crawl.started - Triggered when the crawl is started.
		// crawl.page - Triggered for every page crawled.
		// crawl.completed - Triggered when the crawl is completed to let you know it's done (Beta)**
		// crawl.failed - Triggered when the crawl fails.

		webhookResponse, err := helpers.Decode[FirecrawlWebhookResponse](r.Body)
		if err != nil {
			logger.Printf("Failed to parse webhook response: %v", err)
			http.Error(w, "Failed to parse webhook response", http.StatusBadRequest)
			return
		}

		logger.Printf("Crawl ID: %s", webhookResponse.ID)
		logger.Printf("Webhook response type: %s", webhookResponse.Type)
		logger.Printf("Webhook response data: %v", webhookResponse.Data)

		if !webhookResponse.Success {
			logger.Printf("Firecrawl crawl failed: %s", webhookResponse.Error)
			http.Error(w, "Crawl failed for job "+webhookResponse.ID, http.StatusBadRequest)
			return
		}

		switch webhookResponse.Type {
		case "crawl.page":
			// Check if the data is a firecrawl.FirecrawlDocument
			// print the type of the data
			logger.Printf("Type of data: %T", webhookResponse.Data)
			var data firecrawl.FirecrawlDocument

			// First try to unmarshal the data into a FirecrawlDocument
			if dataMap, ok := webhookResponse.Data.(map[string]interface{}); ok {
				logger.Printf("Data is a map[string]interface{}")
				jsonData, err := json.Marshal(dataMap)
				if err != nil {
					logger.Printf("Failed to marshal data map: %v", err)
					http.Error(w, "Failed to process data", http.StatusBadRequest)
					return
				}
				if err := json.Unmarshal(jsonData, &data); err != nil {
					logger.Printf("Failed to unmarshal into FirecrawlDocument: %v", err)
					http.Error(w, "Failed to process data", http.StatusBadRequest)
					return
				}
			} else if dataSlice, ok := webhookResponse.Data.([]interface{}); ok && len(dataSlice) > 0 {
				logger.Printf("Data is a []interface{}")
				// Handle array case
				if dataMap, ok := dataSlice[0].(map[string]interface{}); ok {
					jsonData, err := json.Marshal(dataMap)
					if err != nil {
						logger.Printf("Failed to marshal data map: %v", err)
						http.Error(w, "Failed to process data", http.StatusBadRequest)
						return
					}
					if err := json.Unmarshal(jsonData, &data); err != nil {
						logger.Printf("Failed to unmarshal into FirecrawlDocument: %v", err)
						http.Error(w, "Failed to process data", http.StatusBadRequest)
						return
					}
				} else {
					logger.Printf("Data is not in expected format")
					http.Error(w, "Data is not in expected format", http.StatusBadRequest)
					return
				}
			} else {
				logger.Printf("Data is not in expected format")
				http.Error(w, "Data is not in expected format", http.StatusBadRequest)
				return
			}

			// Create entry in urls table
			var urlID int
			err = pgxConn.QueryRow(r.Context(), "INSERT INTO urls (source_id, url) VALUES ($1, $2) RETURNING id", sourceID, *data.Metadata.SourceURL).Scan(&urlID)
			if err != nil {
				logger.Printf("Failed to create URL: %v", err)
				http.Error(w, "Failed to create URL", http.StatusInternalServerError)
				return
			}

			// Create entry in pages table
			var pageID int
			err = pgxConn.QueryRow(r.Context(), "INSERT INTO pages (url_id) VALUES ($1) RETURNING id", urlID).Scan(&pageID)
			if err != nil {
				logger.Printf("Failed to create page: %v", err)
				http.Error(w, "Failed to create page", http.StatusInternalServerError)
				return
			}

			// Add html to storage
			logger.Printf("Saving page html\n%s", data.HTML)
			err = helpers.SaveFileToStorageFromLocalFile(r.Context(), logger, supabaseURL, supabaseStorageBucket, fmt.Sprintf("%d/%d/page.html", urlID, pageID), data.HTML, supabaseAnonKey)
			if err != nil {
				logger.Printf("Failed to save page html to storage bucket %s for %s: %v", supabaseStorageBucket, *data.Metadata.SourceURL, err)
				http.Error(w, "Failed to save page html to storage bucket", http.StatusInternalServerError)
				return
			}

			err = helpers.SaveFileToStorageFromLocalFile(r.Context(), logger, supabaseURL, supabaseStorageBucket, fmt.Sprintf("%d/%d/page.md", urlID, pageID), data.Markdown, supabaseAnonKey)
			if err != nil {
				logger.Printf("Failed to save page markdown to storage bucket %s for %s: %v", supabaseStorageBucket, *data.Metadata.SourceURL, err)
				http.Error(w, "Failed to save page markdown to storage bucket", http.StatusInternalServerError)
				return
			}

			// Update the pages table to set markdown_content and html_content to the markdown and html content
			_, err = pgxConn.Exec(r.Context(), "UPDATE pages SET markdown_content = $1, html_content = $2 WHERE id = $3", fmt.Sprintf("%d/%d/page.md", urlID, pageID), fmt.Sprintf("%d/%d/page.html", urlID, pageID), pageID)
			if err != nil {
				logger.Printf("Failed to update page markdown and html content: %v", err)
				http.Error(w, "Failed to update page markdown and html content", http.StatusInternalServerError)
				return
			}

			logger.Printf("Successfully updated page markdown and html content: %s", *data.Metadata.SourceURL)

			// Update the urls table to set scraped to true
			_, err = pgxConn.Exec(r.Context(), "UPDATE urls SET scraped = TRUE WHERE id = $1", urlID)
			if err != nil {
				logger.Printf("Failed to update url scraped status: %v", err)
				http.Error(w, "Failed to update url scraped status", http.StatusInternalServerError)
				return
			}
		}
	}
}

func HandleStartFirecrawlAsyncCrawl(logger *log.Logger, pgxConn *pgxpool.Pool, supabaseURL string, supabaseAnonKey string, supabaseStorageBucket string, firecrawlClient *firecrawl.FirecrawlApp, backendURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST requests
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse the request body to get the URL
		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Failed to parse form", http.StatusBadRequest)
			return
		}

		sourceURL := r.FormValue("url")
		if sourceURL == "" {
			http.Error(w, "URL is required", http.StatusBadRequest)
			return
		}

		// Parse the URL to get the base domain
		parsedURL, err := url.Parse(sourceURL)
		if err != nil {
			http.Error(w, "Invalid URL", http.StatusBadRequest)
			return
		}

		// First, insert the documentation source
		var sourceID int
		err = pgxConn.QueryRow(
			r.Context(),
			"INSERT INTO documentation_sources (source_url, source_name) VALUES ($1, $2) RETURNING id",
			sourceURL,
			parsedURL.Host,
		).Scan(&sourceID)
		if err != nil {
			// Check if it's a unique constraint violation (source already exists)
			if strings.Contains(err.Error(), "duplicate key") {
				// Get the existing source ID
				err = pgxConn.QueryRow(
					r.Context(),
					"SELECT id FROM documentation_sources WHERE source_url = $1",
					sourceURL,
				).Scan(&sourceID)
				if err != nil {
					http.Error(w, fmt.Sprintf("Failed to get existing source: %v", err), http.StatusInternalServerError)
					return
				}
			} else {
				http.Error(w, fmt.Sprintf("Failed to insert documentation source: %v", err), http.StatusInternalServerError)
				return
			}
		}

		webhookURL := fmt.Sprintf("%s/api/scraper/firecrawl/webhook?source_id=%d", backendURL, sourceID)

		limit := 1
		crawlParams := &firecrawl.CrawlParams{
			Webhook: &webhookURL,
			ScrapeOptions: firecrawl.ScrapeParams{
				Formats: []string{"html", "markdown"},
			},
			Limit: &limit,
		}

		idempotencyKey := uuid.New().String()

		crawlStatus, err := firecrawlClient.AsyncCrawlURL(sourceURL, crawlParams, &idempotencyKey)

		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to crawl URL: %v", err), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Started crawl with ID: %s", crawlStatus.ID)
	}
}

// HandleScrapeDocsRaw handles the scraping of documentation from a given URL
func HandleScrapeDocsRaw(logger *log.Logger, pgxConn *pgxpool.Pool, supabaseURL string, supabaseAnonKey string, supabaseStorageBucket string, firecrawlClient *firecrawl.FirecrawlApp) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST requests
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Parse the request body to get the URL
		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Failed to parse form", http.StatusBadRequest)
			return
		}

		sourceURL := r.FormValue("url")
		if sourceURL == "" {
			http.Error(w, "URL is required", http.StatusBadRequest)
			return
		}

		// Parse the URL to get the base domain
		parsedURL, err := url.Parse(sourceURL)
		if err != nil {
			http.Error(w, "Invalid URL", http.StatusBadRequest)
			return
		}

		// First, insert the documentation source
		var sourceID int
		err = pgxConn.QueryRow(
			r.Context(),
			"INSERT INTO documentation_sources (source_url, source_name) VALUES ($1, $2) RETURNING id",
			sourceURL,
			parsedURL.Host,
		).Scan(&sourceID)
		if err != nil {
			// Check if it's a unique constraint violation (source already exists)
			if strings.Contains(err.Error(), "duplicate key") {
				// Get the existing source ID
				err = pgxConn.QueryRow(
					r.Context(),
					"SELECT id FROM documentation_sources WHERE source_url = $1",
					sourceURL,
				).Scan(&sourceID)
				if err != nil {
					http.Error(w, fmt.Sprintf("Failed to get existing source: %v", err), http.StatusInternalServerError)
					return
				}
			} else {
				http.Error(w, fmt.Sprintf("Failed to insert documentation source: %v", err), http.StatusInternalServerError)
				return
			}
		}

		// Parse the sitemap
		urls, err := helpers.GetUrlsFromSitemap(logger, parsedURL)
		useFirecrawl := false
		if err != nil {
			logger.Printf("Failed to get URLs from sitemap: %v", err)
			useFirecrawl = true
		}

		if useFirecrawl {
			mapResult, err := firecrawlClient.MapURL(parsedURL.String(), nil)
			if err != nil {
				logger.Printf("Failed to get URLs from firecrawl: %v", err)
				http.Error(w, fmt.Sprintf("Failed to get URLs from firecrawl: %v", err), http.StatusInternalServerError)
				return
			}

			urls = mapResult.Links
		}

		logger.Printf("Found %d URLs in sitemap", len(urls))

		// Begin a transaction for bulk operations
		tx, err := pgxConn.Begin(r.Context())
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to begin transaction: %v", err), http.StatusInternalServerError)
			return
		}
		defer tx.Rollback(r.Context())

		// Prepare the statement for bulk URL insertion
		_, err = tx.Prepare(r.Context(), "url_insert", `
			INSERT INTO urls (source_id, url)
			VALUES ($1, $2)
			ON CONFLICT (url) DO NOTHING
			RETURNING id
		`)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to prepare URL insert statement: %v", err), http.StatusInternalServerError)
			return
		}

		// Prepare the statement for page insertion
		_, err = tx.Prepare(r.Context(), "page_insert", `
			INSERT INTO pages (url_id)
			VALUES ($1)
			RETURNING id
		`)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to prepare page insert statement: %v", err), http.StatusInternalServerError)
			return
		}

		urlsFoundInPagesMap := make(map[string]bool)

		// Process each URL
		processAndScrapeURLs(urls, tx, r, sourceID, logger, urlsFoundInPagesMap, sourceURL, supabaseURL, supabaseAnonKey, supabaseStorageBucket)

		if !useFirecrawl {
			var urlsFoundInPages []string
			for url, found := range urlsFoundInPagesMap {
				if found {
					urlsFoundInPages = append(urlsFoundInPages, url)
				}
			}
			if len(urlsFoundInPages) > 0 {
				logger.Printf("Found %d URLs in pages", len(urlsFoundInPages))
				processAndScrapeURLs(urlsFoundInPages, tx, r, sourceID, logger, urlsFoundInPagesMap, sourceURL, supabaseURL, supabaseAnonKey, supabaseStorageBucket)
			}
		}

		// Commit the transaction
		err = tx.Commit(r.Context())
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to commit transaction: %v", err), http.StatusInternalServerError)
			return
		}

		// Return success response
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
	}
}

func processAndScrapeURLs(urls []string, tx pgx.Tx, r *http.Request, sourceID int, logger *log.Logger, urlsFoundInPages map[string]bool, sourceURL string, supabaseURL string, supabaseAnonKey string, supabaseStorageBucket string) {
	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	for _, urlStr := range urls {
		// Insert the URL and get its ID
		var urlID int
		err := tx.QueryRow(r.Context(), "url_insert", sourceID, urlStr).Scan(&urlID)
		if err != nil {
			if err.Error() == "no rows in result set" {
				// URL already exists, get its ID
				err = tx.QueryRow(r.Context(), "SELECT id FROM urls WHERE url = $1", urlStr).Scan(&urlID)
				if err != nil {
					logger.Printf("Failed to get ID for existing URL %s: %v", urlStr, err)
					continue
				}
			} else {
				logger.Printf("Failed to insert URL %s: %v", urlStr, err)
				continue
			}
		}

		urlsFoundInPages[urlStr] = false

		// Skip if URL is already scraped
		var scraped bool
		err = tx.QueryRow(r.Context(), "SELECT scraped FROM urls WHERE id = $1", urlID).Scan(&scraped)
		if err != nil {
			logger.Printf("Failed to check if URL %s is scraped: %v", urlStr, err)
			continue
		}
		if scraped {
			logger.Printf("URL %s already scraped, skipping", urlStr)
			continue
		}

		// Fetch the page content
		resp, err := client.Get(urlStr)
		if err != nil {
			logger.Printf("Failed to fetch page %s: %v", urlStr, err)
			continue
		} else {
			logger.Printf("Successfully fetched page %s", urlStr)
		}

		// Read the page content
		htmlContent, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			logger.Printf("Failed to read page %s: %v", urlStr, err)
			continue
		}

		urls := helpers.GetURLsFromHTML(logger, string(htmlContent), urlStr)

		for _, url := range urls {
			if !urlsFoundInPages[url] {
				urlsFoundInPages[url] = true
			}
		}

		// Insert the page content
		var pageID int
		err = tx.QueryRow(r.Context(), "page_insert", urlID).Scan(&pageID)
		if err != nil {
			logger.Printf("Failed to insert page content for %s: %v", urlStr, err)
			continue
		}

		// Add html to storage
		err = helpers.SaveFileToStorageFromLocalFile(r.Context(), logger, supabaseURL, supabaseStorageBucket, fmt.Sprintf("%d/%d/page.html", urlID, pageID), string(htmlContent), supabaseAnonKey)
		if err != nil {
			logger.Printf("Failed to save page content to storage bucket %s for %s: %v", supabaseStorageBucket, urlStr, err)
			continue
		} else {
			// Update the page content with the storage path
			_, err = tx.Exec(r.Context(), "UPDATE pages SET html_content = $1 WHERE id = $2", fmt.Sprintf("%d/%d/page.html", urlID, pageID), pageID)
			if err != nil {
				logger.Printf("Failed to update page content with storage path for %s: %v", urlStr, err)
				continue
			}
		}

		// Mark the URL as scraped
		_, err = tx.Exec(r.Context(), "UPDATE urls SET scraped = TRUE WHERE id = $1", urlID)
		if err != nil {
			logger.Printf("Failed to mark URL %s as scraped: %v", urlStr, err)
			continue
		}

		logger.Printf("Successfully scraped and saved: %s", urlStr)
	}
}

func HandlePagesWithoutMarkdownContent(logger *log.Logger, pgxConn *pgxpool.Pool, supabaseURL string, supabaseAnonKey string, supabaseStorageBucket string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST requests
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get values from urls table where markdown_content is null
		rows, err := pgxConn.Query(r.Context(), "SELECT pages.id, html_content, url, urls.id FROM pages JOIN urls ON pages.url_id = urls.id WHERE markdown_content IS NULL")
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to query URLs: %v", err), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		totalRows := 0

		for rows.Next() {
			var pageID int
			var htmlContent string
			var url string
			var urlID int
			err = rows.Scan(&pageID, &htmlContent, &url, &urlID)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to scan URL: %v", err), http.StatusInternalServerError)
				return
			}

			// Convert HTML content to Markdown
			markdownContent, err := ConvertHTMLToMarkdown(htmlContent, url)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to convert HTML to Markdown: %v", err), http.StatusInternalServerError)
				return
			}

			logger.Printf("Successfully converted HTML to Markdown: %s\n\n%s\n\n", url, markdownContent)

			cleanedMarkdownContent := CleanMarkdown(markdownContent)
			// Add markdown to storage
			err = helpers.SaveFileToStorageFromLocalFile(r.Context(), logger, supabaseURL, supabaseStorageBucket, fmt.Sprintf("%d/%d/page.md", urlID, pageID), cleanedMarkdownContent, supabaseAnonKey)
			if err != nil {
				logger.Printf("Failed to save page content to storage for %d: %v", pageID, err)
				continue
			}

			_, err = pgxConn.Exec(r.Context(), "UPDATE pages SET markdown_content = $1 WHERE id = $2", fmt.Sprintf("%d/%d/page.md", urlID, pageID), pageID)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to update page %d: %v", pageID, err), http.StatusInternalServerError)
				return
			}

			totalRows++
		}

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Successfully updated %d URLs", totalRows)
	}
}

type ChunkMetadata struct {
	SourceURL string   `json:"source_url"`
	ChunkPath []string `json:"chunk_path"`
	HasCode   bool     `json:"has_code"`
	Text      string   `json:"text"`
	Index     int      `json:"index"`
}

type Chunk struct {
	ID        int           `json:"id"`
	PageID    int           `json:"page_id"`
	Text      string        `json:"text"`
	Embedding []float32     `json:"vector_embedding"`
	Metadata  ChunkMetadata `json:"metadata"`
	CreatedAt time.Time     `json:"created_at"`
}

func HandleChunkingUnProcessedPages(logger *log.Logger, pgxConn *pgxpool.Pool, ragToolsServiceClient pb.MarkdownChunkerServiceClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST requests
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get values from urls table where markdown_content is null
		rows, err := pgxConn.Query(r.Context(), "SELECT pages.id, markdown_content, url FROM pages JOIN urls ON pages.url_id = urls.id WHERE processed_at IS NULL")
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to query URLs: %v", err), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var chunksToWrite []Chunk

		var pageIDs []int
		for rows.Next() {
			var id int
			var markdownContent string
			var url string
			err = rows.Scan(&id, &markdownContent, &url)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to scan URL: %v", err), http.StatusInternalServerError)
				return
			}

			chunks, err := ragToolsServiceClient.ChunkMarkdown(r.Context(), &pb.ChunkMarkdownRequest{
				Content:   markdownContent,
				ChunkSize: 1000,
				Overlap:   200,
			})
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to chunk markdown: %v", err), http.StatusInternalServerError)
				return
			}

			for i, chunk := range chunks.Chunks {
				chunkPath := GetMarkdownPath(logger, markdownContent, chunk)
				logger.Printf("Chunk path: %v", chunkPath)

				chunksToWrite = append(chunksToWrite, Chunk{
					PageID: id,
					Text:   chunk,
					Metadata: ChunkMetadata{
						SourceURL: url,
						ChunkPath: chunkPath,
						HasCode:   ChunkHasCode(chunk),
						Text:      chunk,
						Index:     i,
					},
					CreatedAt: time.Now(),
				})
			}

			pageIDs = append(pageIDs, id)

			// logger.Printf("Successfully chunked markdown: %s into %d chunks\n\n%s\n\n", url, len(chunks.Chunks), strings.Join(chunks.Chunks, "\n\n"))
			logger.Printf("Successfully chunked markdown: %s originally %d bytes into %d chunks\n\n", url, len(markdownContent), len(chunks.Chunks))
		}

		// Write the chunks to the database
		for _, chunk := range chunksToWrite {
			_, err = pgxConn.Exec(r.Context(), "INSERT INTO chunks (page_id, text, metadata, created_at) VALUES ($1, $2, $3, $4)", chunk.PageID, chunk.Text, chunk.Metadata, chunk.CreatedAt)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to insert chunk: %v", err), http.StatusInternalServerError)
				return
			}
		}

		// Update the pages table to set processed_at to the current time
		_, err = pgxConn.Exec(r.Context(), "UPDATE pages SET processed_at = $1 WHERE id = ANY($2)", time.Now(), pageIDs)
		if err != nil {
			logger.Printf("Failed to update pages: %v", err)
			http.Error(w, fmt.Sprintf("Failed to update pages: %v", err), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Successfully chunked and wrote %d chunks", len(chunksToWrite))
	}
}

func HandleSaveEmbeddings(logger *log.Logger, pgxConn *pgxpool.Pool, geminiApiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST requests
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		logger.Println("Generating embeddings for chunks")

		// Get chunks from database where vector_embedding is null
		rows, err := pgxConn.Query(r.Context(), "SELECT id, text FROM chunks WHERE vector_embedding IS NULL")
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to query chunks: %v", err), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		totalRows := 0

		for rows.Next() {
			var id int
			var text string
			err = rows.Scan(&id, &text)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to scan chunk: %v", err), http.StatusInternalServerError)
				return
			}

			logger.Printf("Generating embedding for chunk %d", id)

			embedding, err := helpers.GenerateGeminiEmbedding(geminiApiKey, text, "gemini-embedding-exp-03-07", helpers.TaskTypeRetrievalDocument)
			if err != nil {
				if strings.Contains(err.Error(), "429") {
					logger.Printf("Rate limit exceeded, sleeping for 60 seconds before retrying chunk %d", id)
					time.Sleep(60 * time.Second)

					// Retry the same chunk after waiting
					embedding, err = helpers.GenerateGeminiEmbedding(geminiApiKey, text, "gemini-embedding-exp-03-07", helpers.TaskTypeRetrievalDocument)
					if err != nil {
						logger.Printf("Failed to generate embedding after retry: %v", err)
						http.Error(w, fmt.Sprintf("Failed to generate embedding after retry: %v", err), http.StatusInternalServerError)
						return
					}
				} else {
					http.Error(w, fmt.Sprintf("Failed to generate embedding: %v", err), http.StatusInternalServerError)
					return
				}
			}

			// Convert []float32 to a string in PostgreSQL vector format
			vectorStr := "["
			for i, v := range embedding {
				if i > 0 {
					vectorStr += ","
				}
				vectorStr += fmt.Sprintf("%f", v)
			}
			vectorStr += "]"

			_, err = pgxConn.Exec(r.Context(), "UPDATE chunks SET vector_embedding = $1::vector WHERE id = $2", vectorStr, id)
			if err != nil {
				logger.Printf("Failed to update chunk %d with error: %v", id, err)
				http.Error(w, fmt.Sprintf("Failed to update chunk: %v", err), http.StatusInternalServerError)
				return
			}

			totalRows++
		}

		w.WriteHeader(http.StatusOK)
		logger.Printf("Successfully generated and saved %d embeddings", totalRows)
	}
}

func ConvertHTMLToMarkdown(htmlContent, urlString string) (string, error) {
	url, err := url.Parse(urlString)
	if err != nil {
		return "", fmt.Errorf("failed to parse URL: %v", err)
	}

	domain := fmt.Sprintf("%s://%s", url.Scheme, url.Host)

	markdown, err := htmltomarkdown.ConvertString(
		htmlContent,
		converter.WithDomain(domain),
	)

	if err != nil {
		return "", fmt.Errorf("failed to convert HTML to Markdown: %v", err)
	}

	return markdown, nil
}

func CleanMarkdown(markdownContent string) string {
	// Split the markdown into lines
	lines := strings.Split(markdownContent, "\n")

	// Variables to track the current state
	var cleanedLines []string
	var currentHeader string
	var sectionLines []string
	var sectionContainsNonLinks bool

	// Regular expressions for detecting headers and links
	headerRegex := regexp.MustCompile(`^#{1,6}\s+.*$`)
	linkRegex := regexp.MustCompile(`^\s*(?:[*+-]\s*)?\[.*?\]\(.*?\).*$`)
	emptyLineRegex := regexp.MustCompile(`^\s*$`)

	// Process each line
	for i := 0; i < len(lines); i++ {
		line := lines[i]

		// Check if the line is a header
		if headerRegex.MatchString(line) {
			// Process the previous section if it exists
			if len(sectionLines) > 0 {
				if sectionContainsNonLinks {
					if currentHeader != "" {
						cleanedLines = append(cleanedLines, currentHeader)
					}
					cleanedLines = append(cleanedLines, sectionLines...)
				}
			}

			// Start a new section
			currentHeader = line
			sectionLines = []string{}
			sectionContainsNonLinks = false
			continue
		}

		// Add the line to the current section
		if !emptyLineRegex.MatchString(line) {
			sectionLines = append(sectionLines, line)

			// Check if the line is not a link
			if !linkRegex.MatchString(line) {
				sectionContainsNonLinks = true
			}
		} else if len(sectionLines) > 0 {
			// Empty line - add it to the section if we have content
			sectionLines = append(sectionLines, line)
		}

		// If we're at the end of the file, process the last section
		if i == len(lines)-1 && len(sectionLines) > 0 {
			if sectionContainsNonLinks {
				if currentHeader != "" {
					cleanedLines = append(cleanedLines, currentHeader)
				}
				cleanedLines = append(cleanedLines, sectionLines...)
			}
		}
	}

	return strings.Join(cleanedLines, "\n")
}

func GetMarkdownPath(logger *log.Logger, markdownContent, chunk string) []string {
	// Find the position of the chunk in the markdown content
	chunkPos := strings.Index(markdownContent, chunk)
	if chunkPos == -1 {
		logger.Printf("Chunk not found in markdown content")
		return []string{}
	}

	// Extract the content before the chunk
	contentBeforeChunk := markdownContent[:chunkPos]

	// Split the content into lines
	lines := strings.Split(contentBeforeChunk, "\n")

	// Initialize variables to track headers and their levels
	var path []string
	headerLevels := make([]int, 0)

	// Process each line to find headers
	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)
		if len(trimmedLine) == 0 {
			continue
		}

		// Check if the line is a header (starts with #)
		if trimmedLine[0] == '#' {
			// Count the number of # characters
			level := 0
			for i := 0; i < len(trimmedLine) && trimmedLine[i] == '#'; i++ {
				level++
			}

			// Extract the header text
			headerText := ""
			if level < len(trimmedLine) && trimmedLine[level] == ' ' {
				headerText = strings.TrimSpace(trimmedLine[level:])
			}

			if headerText != "" {
				// Remove headers of equal or higher level
				for len(headerLevels) > 0 && headerLevels[len(headerLevels)-1] >= level {
					headerLevels = headerLevels[:len(headerLevels)-1]
					path = path[:len(path)-1]
				}

				// Add the new header to the path
				headerLevels = append(headerLevels, level)
				path = append(path, strings.Repeat("#", level)+" "+headerText)
			}
		}
	}

	return path
}

// TODO: fix issue where code blocks are getting chunked in the middle of the code block / code block is not being closed
func ChunkHasCode(chunk string) bool {
	// Check if the chunk contains any code blocks
	codeBlock := regexp.MustCompile("```(.*)```")
	return codeBlock.MatchString(chunk)
}
