# Chunking Service

A gRPC service that provides document chunking capabilities using both Markdown structure and semantic splitting strategies.

## Features

- Process markdown documents and URLs
- Chunk documents based on markdown structure
- Semantic chunking using sentence transformers
- Configurable chunk sizes and overlap
- Docker support for easy deployment

## Prerequisites

- Python 3.9+
- Docker (optional)

## Installation

### Local Development

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Generate protobuf files:
```bash
python -m grpc_tools.protoc \
    -I./proto \
    --python_out=./generated \
    --grpc_python_out=./generated \
    ./proto/chunker.proto
```

### Docker

Build the image:
```bash
docker build -t chunking-service .
```

Run the container:
```bash
docker run -p 50051:50051 chunking-service
```

## Running Tests

### Local Development

```bash
python -m unittest test_chunker_service.py
```

### Docker

```bash
docker build -t chunking-service-test -f Dockerfile.test .
docker run chunking-service-test
```

## API

The service provides two main endpoints:

### ProcessDocument

Process a single document and return chunks.

```protobuf
rpc ProcessDocument (ProcessDocumentRequest) returns (ProcessDocumentResponse)
```

### ProcessUrls

Process multiple URLs and return chunks.

```protobuf
rpc ProcessUrls (ProcessUrlsRequest) returns (ProcessUrlsResponse)
```

## Configuration

The service accepts configuration through the `ChunkingConfig` message:

- `md_chunk_size`: Target size for Markdown chunks (character count)
- `md_chunk_overlap`: Overlap between Markdown chunks (character count)
- `semantic_chunk_size`: Max size for semantic chunks (token count)
- `semantic_breakpoint_threshold_type`: Method to find semantic breaks
- `semantic_breakpoint_threshold_amount`: Threshold value for semantic breaks
- `embedding_model_name`: Name of the sentence-transformer model for embeddings

## Example Usage

```python
import grpc
from generated.chunker_pb2 import ProcessDocumentRequest, ChunkingConfig
from generated.chunker_pb2_grpc import ChunkingServiceStub

# Create a channel
channel = grpc.insecure_channel('localhost:50051')
stub = ChunkingServiceStub(channel)

# Create a request
config = ChunkingConfig(
    md_chunk_size=1000,
    md_chunk_overlap=150,
    semantic_chunk_size=256,
    semantic_breakpoint_threshold_type="percentile",
    semantic_breakpoint_threshold_amount=95.0,
    embedding_model_name="sentence-transformers/all-MiniLM-L6-v2"
)

request = ProcessDocumentRequest(
    text="# Test Document\nThis is a test.",
    source_url="http://test.com",
    config=config
)

# Make the request
response = stub.ProcessDocument(request)
``` 