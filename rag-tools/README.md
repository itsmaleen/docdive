# RAG Tools Service

A gRPC service that provides tools for RAG (Retrieval-Augmented Generation) operations, specifically for chunking and splitting markdown content.

## Features

- Markdown chunking with configurable chunk size and overlap
- gRPC interface for easy integration with other services
- Docker support for containerized deployment

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Generate gRPC code:
```bash
python -m grpc_tools.protoc -I./proto --python_out=. --grpc_python_out=. ./proto/markdown_chunker.proto
```

3. Run tests:
```bash
pytest tests/
```

## Docker

Build and run the service using Docker:

```bash
docker build -t rag-tools .
docker run -p 50051:50051 rag-tools
```

## Usage

The service exposes a gRPC endpoint on port 50051 with the following service:

```protobuf
service MarkdownChunkerService {
  rpc ChunkMarkdown (ChunkMarkdownRequest) returns (ChunkMarkdownResponse) {}
}
```

Example client usage:

```python
import grpc
import markdown_chunker_pb2
import markdown_chunker_pb2_grpc

channel = grpc.insecure_channel('localhost:50051')
stub = markdown_chunker_pb2_grpc.MarkdownChunkerServiceStub(channel)

request = markdown_chunker_pb2.ChunkMarkdownRequest(
    content="# My Markdown\nContent here",
    chunk_size=1000,
    overlap=200
)

response = stub.ChunkMarkdown(request)
chunks = response.chunks
``` 