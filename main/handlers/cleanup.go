package handlers

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/itsmaleen/tech-doc-processor/helpers"
	"github.com/jackc/pgx/v5/pgxpool"
)

func HandleMoveHTMLContentToStorage(logger *log.Logger, pgxConn *pgxpool.Pool, supabaseURL string, supabaseAnonKey string, supabaseStorageBucket string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger.Println("Moving HTML content to storage")

		// get all html content from the database
		rows, err := pgxConn.Query(context.Background(), "SELECT id, html_content, url_id FROM pages")
		if err != nil {
			logger.Println("Error getting HTML content:", err)
			http.Error(w, "Error getting HTML content", http.StatusInternalServerError)
			return
		}

		for rows.Next() {
			var id int
			var htmlContent string
			var urlId int
			err = rows.Scan(&id, &htmlContent, &urlId)
			if err != nil {
				logger.Println("Error scanning HTML content:", err)
			}

			// save the html content to the storage
			err = helpers.SaveFileToStorageFromLocalFile(context.Background(), logger, supabaseURL, supabaseStorageBucket, fmt.Sprintf("%d/%d/page.html", urlId, id), htmlContent, supabaseAnonKey)
			if err != nil {
				logger.Println("Error saving HTML content:", err)
			} else {
				// Update html_content to path
				_, err = pgxConn.Exec(context.Background(), "UPDATE pages SET html_content = $1 WHERE id = $2", fmt.Sprintf("%d/%d/page.html", urlId, id), id)
				if err != nil {
					logger.Println("Error updating HTML content:", err)
				}
			}
		}
	}
}

func HandleMoveMarkdownContentToStorage(logger *log.Logger, pgxConn *pgxpool.Pool, supabaseURL string, supabaseAnonKey string, supabaseStorageBucket string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger.Println("Moving HTML content to storage")

		// get all html content from the database
		rows, err := pgxConn.Query(context.Background(), "SELECT id, markdown_content, url_id FROM pages")
		if err != nil {
			logger.Println("Error getting markdown content:", err)
			http.Error(w, "Error getting markdown content", http.StatusInternalServerError)
			return
		}

		for rows.Next() {
			var id int
			var markdownContent string
			var urlId int
			err = rows.Scan(&id, &markdownContent, &urlId)
			if err != nil {
				logger.Println("Error scanning markdown content:", err)
			}

			// save the html content to the storage
			err = helpers.SaveFileToStorageFromLocalFile(context.Background(), logger, supabaseURL, supabaseStorageBucket, fmt.Sprintf("%d/%d/page.md", urlId, id), markdownContent, supabaseAnonKey)
			if err != nil {
				logger.Println("Error saving markdown content:", err)
			} else {
				// Update html_content to path
				_, err = pgxConn.Exec(context.Background(), "UPDATE pages SET markdown_content = $1 WHERE id = $2", fmt.Sprintf("%d/%d/page.md", urlId, id), id)
				if err != nil {
					logger.Println("Error updating markdown content:", err)
				}
			}
		}
	}
}

func HandleUpdatePageContentFields(logger *log.Logger, pgxConn *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger.Println("Updating page content fields")

		// get all html content from the database
		rows, err := pgxConn.Query(context.Background(), "SELECT id, url_id FROM pages")
		if err != nil {
			logger.Println("Error getting content:", err)
			http.Error(w, "Error getting content", http.StatusInternalServerError)
			return
		}

		for rows.Next() {
			var id int
			var urlId int
			err = rows.Scan(&id, &urlId)
			if err != nil {
				logger.Println("Error scanning content:", err)
			}

			htmlContent := fmt.Sprintf("%d/%d/page.html", urlId, id)
			markdownContent := fmt.Sprintf("%d/%d/page.md", urlId, id)

			// update the page content fields
			_, err = pgxConn.Exec(context.Background(), "UPDATE pages SET html_content = $1, markdown_content = $2 WHERE id = $3", htmlContent, markdownContent, id)
			if err != nil {
				logger.Println("Error updating page content fields:", err)
			}
		}
	}
}

func HandleUpdatePageTitle(logger *log.Logger, pgxConn *pgxpool.Pool, supabaseURL string, supabaseStorageBucket string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger.Println("Updating page titles from HTML content")

		// get all html content from the database
		rows, err := pgxConn.Query(context.Background(), "SELECT id, html_content FROM pages")
		if err != nil {
			logger.Println("Error getting content:", err)
			http.Error(w, "Error getting content", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var updateErrors []error
		for rows.Next() {
			var id int
			var path string
			err = rows.Scan(&id, &path)
			if err != nil {
				logger.Println("Error scanning content:", err)
				updateErrors = append(updateErrors, err)
				continue
			}

			htmlContent, err := helpers.GetFileContentFromStorage(logger, supabaseURL, supabaseStorageBucket, path)
			if err != nil {
				logger.Println("Error getting content:", err)
				updateErrors = append(updateErrors, err)
				continue
			}

			title := helpers.GetTitleFromHTML(htmlContent)

			// update the page content fields
			_, err = pgxConn.Exec(context.Background(), "UPDATE pages SET title = $1 WHERE id = $2", title, id)
			if err != nil {
				logger.Println("Error updating page title:", err)
				updateErrors = append(updateErrors, err)
			}
		}

		if len(updateErrors) > 0 {
			logger.Println("Errors updating page titles:", updateErrors)
			http.Error(w, "Errors updating page titles", http.StatusInternalServerError)
			return
		}
		helpers.Encode(w, r, http.StatusOK, "Page titles updated successfully")
	}
}

func HandleTestUpsertStoreFile(logger *log.Logger, pgxConn *pgxpool.Pool, supabaseURL string, supabaseAnonKey string, supabaseStorageBucket string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		logger.Println("Testing upsert store file")

		path := "page.html"
		content := "test"

		err := helpers.SaveFileToStorageFromLocalFile(context.Background(), logger, supabaseURL, supabaseStorageBucket, path, content, supabaseAnonKey)
		if err != nil {
			logger.Println("Error saving file:", err)
			helpers.Encode(w, r, http.StatusInternalServerError, "Error saving file")
			return
		}

		helpers.Encode(w, r, http.StatusOK, "File saved successfully")
	}
}
