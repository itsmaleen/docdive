package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/itsmaleen/tech-doc-processor/helpers"
	"github.com/itsmaleen/tech-doc-processor/types"
	"github.com/jackc/pgx/v5/pgxpool"
)

func HandleQueryDocs(logger *log.Logger, pgxConn *pgxpool.Pool, geminiApiKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow POST requests
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		err := r.ParseForm()
		if err != nil {
			http.Error(w, "Failed to parse form", http.StatusBadRequest)
			return
		}

		query := r.FormValue("query")
		if query == "" {
			http.Error(w, "Query is required", http.StatusBadRequest)
			return
		}

		logger.Printf("Query: %s", query)

		chunksData, err := retrieveTopRelevantChunks(r.Context(), logger, pgxConn, geminiApiKey, query, 10)
		if err != nil {
			http.Error(w, "Failed to retrieve top relevant chunks", http.StatusInternalServerError)
			return
		}

		helpers.Encode(w, r, http.StatusOK, chunksData)
	}
}

func HandleLoadDocPaths(logger *log.Logger, pgxConn *pgxpool.Pool) http.HandlerFunc {
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

		logger.Printf("URL: %s", url)

		// Get the html contend from all pages

		rows, err := pgxConn.Query(context.Background(), "SELECT pages.id, url, markdown_content, title FROM pages JOIN urls ON pages.url_id = urls.id WHERE url ilike $1", fmt.Sprintf("%%%s%%", url))
		if err != nil {
			http.Error(w, "Failed to query pages", http.StatusInternalServerError)
			return
		}

		defer rows.Close()

		logger.Println("Select done")

		var pages []types.Page
		for rows.Next() {
			var page types.Page
			err := rows.Scan(&page.ID, &page.URL, &page.Path, &page.Title)
			if err != nil {
				http.Error(w, "Failed to scan page", http.StatusInternalServerError)
				return
			}
			if page.Title == "" {
				page.Title = "Untitled"
			}

			pages = append(pages, page)
		}

		// Write the pages to the response
		w.Header().Set("Content-Type", "application/json")
		helpers.Encode(w, r, http.StatusOK, pages)
	}
}

func HandleLoadDocsContent(logger *log.Logger, pgxConn *pgxpool.Pool, supabaseURL string) http.HandlerFunc {
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

		logger.Printf("URL: %s", url)

		rows, err := pgxConn.Query(context.Background(), "SELECT pages.id, url, markdown_content, title FROM pages JOIN urls ON pages.url_id = urls.id WHERE url ilike $1", fmt.Sprintf("%%%s%%", url))
		if err != nil {
			http.Error(w, "Failed to query pages", http.StatusInternalServerError)
			return
		}

		defer rows.Close()

		logger.Println("Select done")

		var pages []types.Page
		for rows.Next() {
			var page types.Page
			err := rows.Scan(&page.ID, &page.URL, &page.Path, &page.Title)
			if err != nil {
				http.Error(w, "Failed to scan page", http.StatusInternalServerError)
				return
			}

			markdownContent, err := helpers.GetFileContentFromStorage(logger, supabaseURL, "pages", page.Path)
			if err != nil {
				logger.Printf("Failed to read markdown content: %v", err)
				http.Error(w, "Failed to read markdown content", http.StatusInternalServerError)
				return
			}

			if page.Title == "" {
				page.Title = "Untitled"
			}

			// Clean the markdown content by starting from the title
			page.Markdown = helpers.CleanMarkdownByStartingFromTitle(markdownContent, page.Title)
			pages = append(pages, page)
		}

		// Write the pages to the response
		w.Header().Set("Content-Type", "application/json")
		helpers.Encode(w, r, http.StatusOK, pages)
	}
}

func HandleLoadPageContent(logger *log.Logger, pgxConn *pgxpool.Pool, supabaseURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Only allow GET requests
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// Get the URL from the query parameters
		id := r.URL.Query().Get("id")
		if id == "" {
			http.Error(w, "URL is required", http.StatusBadRequest)
			return
		}

		logger.Printf("ID: %s", id)

		var page types.Page

		err := pgxConn.QueryRow(context.Background(), "SELECT url, markdown_content, title FROM pages JOIN urls ON pages.url_id = urls.id WHERE pages.id=$1", id).Scan(&page.URL, &page.Path, &page.Title)
		if err != nil {
			http.Error(w, "Failed to query pages", http.StatusInternalServerError)
			return
		}

		markdownContent, err := helpers.GetFileContentFromStorage(logger, supabaseURL, "pages", page.Path)
		if err != nil {
			logger.Printf("Failed to read markdown content: %v", err)
			http.Error(w, "Failed to read markdown content", http.StatusInternalServerError)
			return
		}

		if page.Title == "" {
			page.Title = "Untitled"
		}

		// Clean the markdown content by starting from the title
		page.Markdown = helpers.CleanMarkdownByStartingFromTitle(markdownContent, page.Title)

		// Write the pages to the response
		w.Header().Set("Content-Type", "application/json")
		helpers.Encode(w, r, http.StatusOK, page)
	}
}
