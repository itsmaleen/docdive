package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/itsmaleen/tech-doc-processor/helpers"
	"github.com/jackc/pgx/v5/pgxpool"
)

func HandleLoadDocsMarkdown(logger *log.Logger, pgxConn *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow GET requests
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get the URL from the query parameters
		url := r.URL.Query().Get("url")
		if url == "" {
			http.Error(w, "URL is required", http.StatusBadRequest)
			return
		}

		// Get the html contend from all pages
		type Page struct {
			Title    string `json:"title"`
			URL      string `json:"url"`
			Markdown string `json:"markdown"`
		}

		rows, err := pgxConn.Query(context.Background(), "SELECT url, markdown_content, html_content FROM pages JOIN urls ON pages.url_id = urls.id WHERE url ilike $1", fmt.Sprintf("%%%s%%", url))
		if err != nil {
			http.Error(w, "Failed to query pages", http.StatusInternalServerError)
			return
		}

		defer rows.Close()

		var pages []Page
		for rows.Next() {
			var page Page
			var htmlContent string
			err := rows.Scan(&page.URL, &page.Markdown, &htmlContent)
			if err != nil {
				http.Error(w, "Failed to scan page", http.StatusInternalServerError)
				return
			}

			// Get the title from the html content
			page.Title = helpers.GetTitleFromHTML(htmlContent)
			pages = append(pages, page)
		}

		// Write the pages to the response
		w.Header().Set("Content-Type", "application/json")
		helpers.Encode(w, r, http.StatusOK, pages)
	}
}
