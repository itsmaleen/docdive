package types

// ChunkData represents a chunk of text with metadata
type ChunkData struct {
	Text       string   `json:"text"`
	SourceURL  string   `json:"source_url"`
	ChunkPath  []string `json:"chunk_path"`
	ChunkIndex int      `json:"chunk_index"`
}

// ChunkMetadata represents metadata for a chunk
type ChunkMetadata struct {
	SourceURL string   `json:"source_url"`
	ChunkPath []string `json:"chunk_path"`
	Index     int      `json:"index"`
}

// Chunk represents a chunk of text with metadata
type Chunk struct {
	ID       int           `json:"id"`
	Text     string        `json:"text"`
	Metadata ChunkMetadata `json:"metadata"`
}
