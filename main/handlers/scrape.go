package handlers

import (
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	htmltomarkdown "github.com/JohannesKaufmann/html-to-markdown/v2"
	"github.com/JohannesKaufmann/html-to-markdown/v2/converter"
)

// SitemapIndex represents the structure of a sitemap index file
type SitemapIndex struct {
	XMLName  xml.Name  `xml:"urlset"`
	Sitemaps []Sitemap `xml:"sitemap"`
}

// Sitemap represents a single sitemap entry
type Sitemap struct {
	Loc     string `xml:"loc"`
	Lastmod string `xml:"lastmod,omitempty"`
}

// URLSet represents the structure of a sitemap file
type URLSet struct {
	XMLName xml.Name `xml:"urlset"`
	URLs    []URL    `xml:"url"`
}

// URL represents a single URL entry in a sitemap
type URL struct {
	Loc     string `xml:"loc"`
	Lastmod string `xml:"lastmod,omitempty"`
}

// HandleScrapeDocsRaw handles the scraping of documentation from a given URL
func HandleScrapeDocsRaw(logger *log.Logger, pgxConn *pgxpool.Pool) http.HandlerFunc {
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

		// Construct the sitemap URL
		sitemapURL := fmt.Sprintf("%s://%s/sitemap.xml", parsedURL.Scheme, parsedURL.Host)
		logger.Printf("Fetching sitemap from: %s", sitemapURL)

		// Fetch the sitemap
		client := &http.Client{
			Timeout: 30 * time.Second,
		}
		resp, err := client.Get(sitemapURL)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to fetch sitemap: %v", err), http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		// Read the sitemap content
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to read sitemap: %v", err), http.StatusInternalServerError)
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
		var urls []string
		if strings.Contains(string(body), "<sitemapindex") {
			// This is a sitemap index
			var sitemapIndex SitemapIndex
			err = xml.Unmarshal(body, &sitemapIndex)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to parse sitemap index: %v", err), http.StatusInternalServerError)
				return
			}

			// Process each sitemap in the index
			for _, sitemap := range sitemapIndex.Sitemaps {
				// Fetch the individual sitemap
				sitemapResp, err := client.Get(sitemap.Loc)
				if err != nil {
					logger.Printf("Failed to fetch sitemap %s: %v", sitemap.Loc, err)
					continue
				}

				sitemapBody, err := io.ReadAll(sitemapResp.Body)
				sitemapResp.Body.Close()
				if err != nil {
					logger.Printf("Failed to read sitemap %s: %v", sitemap.Loc, err)
					continue
				}

				// Parse the individual sitemap
				var urlSet URLSet
				err = xml.Unmarshal(sitemapBody, &urlSet)
				if err != nil {
					logger.Printf("Failed to parse sitemap %s: %v", sitemap.Loc, err)
					continue
				}

				// Extract URLs from the sitemap
				for _, u := range urlSet.URLs {
					urls = append(urls, u.Loc)
				}
			}
		} else {
			// This is a regular sitemap
			var urlSet URLSet
			err = xml.Unmarshal(body, &urlSet)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to parse sitemap: %v", err), http.StatusInternalServerError)
				return
			}

			// Extract URLs from the sitemap
			for _, u := range urlSet.URLs {
				urls = append(urls, u.Loc)
			}
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
			INSERT INTO pages (url_id, html_content)
			VALUES ($1, $2)
		`)
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to prepare page insert statement: %v", err), http.StatusInternalServerError)
			return
		}

		// Process each URL
		for _, urlStr := range urls {
			// Insert the URL and get its ID
			var urlID int
			err = tx.QueryRow(r.Context(), "url_insert", sourceID, urlStr).Scan(&urlID)
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
			}

			// Read the page content
			htmlContent, err := io.ReadAll(resp.Body)
			resp.Body.Close()
			if err != nil {
				logger.Printf("Failed to read page %s: %v", urlStr, err)
				continue
			}

			// Insert the page content
			_, err = tx.Exec(r.Context(), "page_insert", urlID, string(htmlContent))
			if err != nil {
				logger.Printf("Failed to insert page content for %s: %v", urlStr, err)
				continue
			}

			// Mark the URL as scraped
			_, err = tx.Exec(r.Context(), "UPDATE urls SET scraped = TRUE WHERE id = $1", urlID)
			if err != nil {
				logger.Printf("Failed to mark URL %s as scraped: %v", urlStr, err)
				continue
			}

			logger.Printf("Successfully scraped and saved: %s", urlStr)
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
		fmt.Fprintf(w, `{"status": "success", "message": "Documentation scraping completed", "urls_processed": %d}`, len(urls))
	}
}

func HandlePagesWithoutMarkdownContent(logger *log.Logger, pgxConn *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST requests
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get values from urls table where markdown_content is null
		rows, err := pgxConn.Query(r.Context(), "SELECT pages.id, html_content, url FROM pages JOIN urls ON pages.url_id = urls.id WHERE markdown_content IS NULL")
		if err != nil {
			http.Error(w, fmt.Sprintf("Failed to query URLs: %v", err), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		markdownContents := make(map[int]string)

		for rows.Next() {
			var id int
			var htmlContent string
			var url string
			err = rows.Scan(&id, &htmlContent, &url)
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

			markdownContents[id] = markdownContent
		}

		// Update the pages table with the new markdown content
		for id, markdownContent := range markdownContents {
			_, err = pgxConn.Exec(r.Context(), "UPDATE pages SET markdown_content = $1 WHERE id = $2", markdownContent, id)
			if err != nil {
				http.Error(w, fmt.Sprintf("Failed to update page %d: %v", id, err), http.StatusInternalServerError)
				return
			}
		}

		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "Successfully updated %d URLs", len(markdownContents))

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
