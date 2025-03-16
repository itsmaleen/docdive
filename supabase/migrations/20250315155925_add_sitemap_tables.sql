-- Table to store crawled documentation sources
CREATE TABLE documentation_sources (
    id SERIAL PRIMARY KEY,
    source_url TEXT UNIQUE NOT NULL,
    source_name TEXT,
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE urls (
  id       SERIAL PRIMARY KEY,
  source_id    INTEGER REFERENCES documentation_sources(id)
                   ON DELETE CASCADE,
  url          TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scraped      BOOLEAN DEFAULT FALSE  -- Indicates if the URL has been scraped.
);

-- Table to store crawled pages and their content
CREATE TABLE pages (
    id SERIAL PRIMARY KEY,
    url_id INTEGER NOT NULL REFERENCES urls(id) ON DELETE CASCADE,    
    html_content      TEXT,            -- Raw HTML from the URL.
    markdown_content  TEXT,            -- LLM-friendly version.
    processed_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store categories or context for pages
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    category_name TEXT UNIQUE NOT NULL,
    category_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction table for many-to-many relationship between pages and categories
CREATE TABLE page_categories (
    page_id INTEGER REFERENCES pages(id),
    category_id INTEGER REFERENCES categories(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (page_id, category_id)
);

-- Table to store chunks of content with references
CREATE TABLE chunks (
    id SERIAL PRIMARY KEY,
    page_id INTEGER REFERENCES pages(id),
    chunk_text       TEXT NOT NULL,    -- Typically a subsection or paragraph.
    chunk_markdown   TEXT,             -- Optionally a markdown version of the chunk.
    vector_embedding JSONB,  -- Store vector embeddings for RAG
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chunk_categories (
  chunk_id    INTEGER REFERENCES chunks(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (chunk_id, category_id)
);


-- Indexes for efficient querying:
-- Fast lookup for URLs.
CREATE INDEX idx_urls_url ON urls (url);

-- Full-text search indexes on page and chunk text.
CREATE INDEX idx_pages_markdown_content
  ON pages
  USING GIN (to_tsvector('english', markdown_content));

CREATE INDEX idx_chunks_text
  ON chunks
  USING GIN (to_tsvector('english', chunk_text));

-- GIN index for vector embedding similarity search.
CREATE INDEX idx_vector_embedding ON chunks USING GIN (vector_embedding);
