# RAG Service

A gRPC service for text splitting and embedding generation, designed for use in Retrieval-Augmented Generation (RAG) systems.

## Features

### Text Splitting
- Fixed-size chunks: Split text into chunks of a specified size
- Sentence-based splitting: Split text into chunks based on sentence boundaries
- Paragraph splitting: Split text into paragraphs
- Context-aware splitting: Split text using semantic boundaries while respecting chunk size

### Embedding Generation
- Sentence Transformers: Generate embeddings using the all-mpnet-base-v2 model
- OpenAI Embeddings: Generate embeddings using OpenAI's API (requires API key)

## Setup

### Local Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Generate gRPC code:
```bash
python -m grpc_tools.protoc -I./proto --python_out=. --grpc_python_out=. ./proto/rag.proto
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env to add your OpenAI API key if you want to use OpenAI embeddings
```

### Docker Setup

1. Build the service image:
```bash
docker build -t rag-service .
```

2. Run the service:
```bash
docker run -p 50052:50052 --env-file .env rag-service
```

3. Run tests:
```bash
docker build -t rag-service-test -f Dockerfile.test .
docker run rag-service-test
```

## Running the Service

### Local
Start the server:
```bash
python server.py
```

The server will start on port 50052.

### Docker
```bash
docker run -p 50052:50052 --env-file .env rag-service
```

## Running Tests

### Local
Run the tests:
```bash
pytest
```

### Docker
```bash
docker build -t rag-service-test -f Dockerfile.test .
docker run rag-service-test
```

## API Documentation

### Text Splitting Methods

#### SplitTextFixedSize
- Input: Text and chunk size
- Output: List of text chunks with start and end indices

#### SplitTextSentences
- Input: Text and chunk size
- Output: List of text chunks based on sentence boundaries

#### SplitTextParagraphs
- Input: Text
- Output: List of paragraphs

#### SplitTextContextAware
- Input: Text and chunk size
- Output: List of text chunks using semantic boundaries

### Embedding Generation Methods

#### GenerateEmbeddingsSentenceTransformers
- Input: List of texts and model name
- Output: List of embeddings

#### GenerateEmbeddingsOpenAI
- Input: List of texts and model name
- Output: List of embeddings
- Note: Requires OpenAI API key

## Example Usage

```python
import grpc
import rag_pb2
import rag_pb2_grpc

# Create a channel
channel = grpc.insecure_channel('localhost:50052')
stub = rag_pb2_grpc.RAGServiceStub(channel)

# Split text
request = rag_pb2.SplitTextRequest(
    text="Your text here...",
    chunk_size=200
)
response = stub.SplitTextFixedSize(request)

# Generate embeddings
request = rag_pb2.EmbeddingRequest(
    texts=["Your text here..."],
    model="all-mpnet-base-v2"
)
response = stub.GenerateEmbeddingsSentenceTransformers(request)
``` 