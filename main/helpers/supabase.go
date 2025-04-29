package helpers

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
)

func SaveFileToStorageFromLocalFile(ctx context.Context, logger *log.Logger, supabaseS3URL string, bucketName string, fileName string, content string, anonKey string) error {
	file := bytes.NewReader([]byte(content))

	// Construct the URL for the Supabase storage API
	url := fmt.Sprintf("%s/storage/v1/object/%s/%s", supabaseS3URL, bucketName, fileName)

	// Create a new HTTP request
	req, err := http.NewRequestWithContext(ctx, "POST", url, file)
	if err != nil {
		return fmt.Errorf("failed to create HTTP request: %v", err)
	}

	// Set the required headers
	req.Header.Set("apikey", anonKey)
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", anonKey))

	// Create an HTTP client and send the request
	httpClient := &http.Client{}
	resp, err := httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send HTTP request: %v", err)
	}
	defer resp.Body.Close()

	// Check the response status
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to upload file: status code %d, response: %s", resp.StatusCode, string(body))
	}

	logger.Printf("Successfully uploaded local file %s to Supabase storage bucket %s", fileName, bucketName)
	return nil
}
