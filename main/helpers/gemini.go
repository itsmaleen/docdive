package helpers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"slices"
	"strings"

	"github.com/itsmaleen/tech-doc-processor/types"
)

// Supported task types
// Task type 	Description
// SEMANTIC_SIMILARITY 	Used to generate embeddings that are optimized to assess text similarity.
// CLASSIFICATION 	Used to generate embeddings that are optimized to classify texts according to preset labels.
// CLUSTERING 	Used to generate embeddings that are optimized to cluster texts based on their similarities.
// RETRIEVAL_DOCUMENT, RETRIEVAL_QUERY, QUESTION_ANSWERING, and FACT_VERIFICATION 	Used to generate embeddings that are optimized for document search or information retrieval.
// CODE_RETRIEVAL_QUERY 	Used to retrieve a code block based on a natural language query, such as sort an array or reverse a linked list. Embeddings of the code blocks are computed using RETRIEVAL_DOCUMENT.

// create an enum for the task types
type TaskType string

const (
	TaskTypeSemanticSimilarity TaskType = "SEMANTIC_SIMILARITY"
	TaskTypeClassification     TaskType = "CLASSIFICATION"
	TaskTypeClustering         TaskType = "CLUSTERING"
	TaskTypeRetrievalDocument  TaskType = "RETRIEVAL_DOCUMENT"
	TaskTypeRetrievalQuery     TaskType = "RETRIEVAL_QUERY"
	TaskTypeQuestionAnswering  TaskType = "QUESTION_ANSWERING"
	TaskTypeFactVerification   TaskType = "FACT_VERIFICATION"
	TaskTypeCodeRetrievalQuery TaskType = "CODE_RETRIEVAL_QUERY"
)

func IsValidTaskType(taskType TaskType) bool {
	return taskType == TaskTypeSemanticSimilarity ||
		taskType == TaskTypeClassification ||
		taskType == TaskTypeClustering ||
		taskType == TaskTypeRetrievalDocument ||
		taskType == TaskTypeRetrievalQuery ||
		taskType == TaskTypeQuestionAnswering ||
		taskType == TaskTypeFactVerification ||
		taskType == TaskTypeCodeRetrievalQuery
}

// GeminiEmbeddingRequest represents the request structure for Gemini embedding API
type GeminiEmbeddingRequest struct {
	Model   string `json:"model"`
	Content struct {
		Parts []struct {
			Text string `json:"text"`
		} `json:"parts"`
	} `json:"content"`
	TaskType TaskType `json:"taskType"`
}

// GeminiEmbeddingResponse represents the response structure from Gemini embedding API
type GeminiEmbeddingResponse struct {
	Embedding struct {
		Values []float32 `json:"values"`
	} `json:"embedding"`
}

// GenerateGeminiEmbedding generates embeddings using the Gemini API
func GenerateGeminiEmbedding(apiKey string, text string, model string, taskType TaskType) ([]float32, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("missing gemini api key")
	}

	if !IsValidTaskType(taskType) {
		return nil, fmt.Errorf("invalid task type: %s", taskType)
	}

	// Default model if not specified
	if model == "" {
		model = "models/gemini-embedding-exp-03-07"
	}

	// Create request payload
	reqBody := GeminiEmbeddingRequest{
		Model: model,
		Content: struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		}{
			Parts: []struct {
				Text string `json:"text"`
			}{
				{Text: text},
			},
		},
		TaskType: taskType,
	}

	// Marshal request to JSON
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %w", err)
	}

	// Create HTTP request
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models/%s:embedContent?key=%s", model, apiKey)
	if strings.Compare(url, "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-exp-03-07:embedContent?key=AIzaSyDxEbr6OT7jcZQuHqa5xgC4MiI8DfWZzrI") != 0 {
		return nil, fmt.Errorf("invalid url: %s", url)
	}
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")

	// Send request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %w", err)
	}

	// Check for non-200 status codes
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var response GeminiEmbeddingResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("error parsing response: %w", err)
	}

	return response.Embedding.Values, nil
}

// AnswerStyle represents the style in which answers should be returned
type AnswerStyle string

const (
	AnswerStyleUnspecified AnswerStyle = "ANSWER_STYLE_UNSPECIFIED"
	AnswerStyleAbstractive AnswerStyle = "ABSTRACTIVE"
	AnswerStyleExtractive  AnswerStyle = "EXTRACTIVE"
	AnswerStyleVerbose     AnswerStyle = "VERBOSE"
)

// Content represents a content object for the Gemini API
type Content struct {
	Parts []struct {
		Text string `json:"text"`
	} `json:"parts"`
}

// GroundingPassage represents a passage to ground the answer in
type GroundingPassage struct {
	ID      string  `json:"id"`
	Content Content `json:"content"`
}

// // GroundingPassages represents a list of passages to ground the answer in
type GroundingPassages struct {
	Passages []GroundingPassage `json:"passages"`
}

// GenerateAnswerRequest represents the request structure for Gemini generateAnswer API
type GenerateAnswerRequest struct {
	Contents    []Content         `json:"contents"`
	AnswerStyle AnswerStyle       `json:"answerStyle"`
	Passages    GroundingPassages `json:"inlinePassages"` // this is the grounding_source
	Temperature float64           `json:"temperature,omitempty"`
}

// Candidate represents a candidate answer from the model
type Candidate struct {
	Content Content `json:"content"`
}

// GenerateAnswerResponse represents the response structure from Gemini generateAnswer API
type GenerateAnswerResponse struct {
	Answer                Candidate `json:"answer"`
	AnswerableProbability float64   `json:"answerableProbability"`
}

// GenerateAnswer generates a grounded answer using the Gemini API
func GenerateAnswer(logger *log.Logger, apiKey string, query string, chunks []types.ChunkData, model string, answerStyle AnswerStyle, temperature float64) (*GenerateAnswerResponse, error) {
	if apiKey == "" {
		return nil, fmt.Errorf("missing gemini api key")
	}

	// Default model if not specified
	if model == "" {
		model = "models/gemini-1.5-pro"
	}

	// Create content for the query
	queryContent := Content{
		Parts: []struct {
			Text string `json:"text"`
		}{
			{Text: query},
		},
	}

	// Create grounding passages from chunks
	var passages []GroundingPassage
	for i, chunk := range chunks {
		passage := GroundingPassage{
			ID: fmt.Sprintf("%d", i),
			Content: Content{
				Parts: []struct {
					Text string `json:"text"`
				}{
					{Text: chunk.Text},
				},
			},
		}
		passages = append(passages, passage)
	}

	// Create request payload
	reqBody := GenerateAnswerRequest{
		Contents:    []Content{queryContent},
		AnswerStyle: answerStyle,
		Passages: GroundingPassages{
			Passages: passages,
		},
		Temperature: temperature,
	}

	// Marshal request to JSON
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("error marshaling request: %w", err)
	}

	client := &http.Client{}

	getModelsURL := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/models?key=%s", apiKey)
	getModelsReq, err := http.NewRequest("GET", getModelsURL, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	getModelsResp, err := client.Do(getModelsReq)
	if err != nil {
		return nil, fmt.Errorf("error sending request: %w", err)
	}
	defer getModelsResp.Body.Close()

	body, err := io.ReadAll(getModelsResp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %w", err)
	}

	var modelsResponse struct {
		Models []struct {
			Name                       string   `json:"name"`
			BaseModelId                string   `json:"baseModelId"`
			Version                    string   `json:"version"`
			DisplayName                string   `json:"displayName"`
			Description                string   `json:"description"`
			InputTokenLimit            int      `json:"inputTokenLimit"`
			OutputTokenLimit           int      `json:"outputTokenLimit"`
			SupportedGenerationMethods []string `json:"supportedGenerationMethods"`
			Temperature                float64  `json:"temperature"`
			MaxTemperature             float64  `json:"maxTemperature"`
			TopP                       float64  `json:"topP"`
			TopK                       int      `json:"topK"`
		} `json:"models"`
		NextPageToken string `json:"nextPageToken"`
	}

	if err := json.Unmarshal(body, &modelsResponse); err != nil {
		return nil, fmt.Errorf("error parsing get models response: %w", err)
	}

	var modelName string
	var supportedModels []string
	for _, model := range modelsResponse.Models {
		if slices.Contains(model.SupportedGenerationMethods, "generateAnswer") {
			supportedModels = append(supportedModels, model.Name)
		}
	}

	if len(supportedModels) == 0 {
		return nil, fmt.Errorf("no supported models found")
	}

	if slices.Contains(supportedModels, model) {
		modelName = model
	} else {
		logger.Printf("Model %s not supported, using %s", model, supportedModels[0])
		logger.Printf("Supported models: %v", supportedModels)
		modelName = supportedModels[0]
	}

	// Create HTTP request
	url := fmt.Sprintf("https://generativelanguage.googleapis.com/v1beta/%s:generateAnswer?key=%s", modelName, apiKey)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}

	// Set headers
	req.Header.Set("Content-Type", "application/json")

	// Send request
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error sending request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err = io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %w", err)
	}

	// Check for non-200 status codes
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var response GenerateAnswerResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("error parsing response: %w", err)
	}

	return &response, nil
}
