import grpc
from concurrent import futures
import logging
from typing import List, Dict, Any

# Import the generated protobuf files
from generated.chunker_pb2 import (
    ProcessUrlsRequest,
    ProcessDocumentRequest,
    ProcessUrlsResponse,
    ProcessDocumentResponse,
    DocumentChunk,
    ChunkingConfig,
)
from generated.chunker_pb2_grpc import (
    ChunkingServiceServicer,
    add_ChunkingServiceServicer_to_server,
)

from chunking_service import ChunkingService

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


class ChunkingServiceServicer(ChunkingServiceServicer):
    def __init__(self):
        self.chunking_service = None

    def _get_chunking_service(self, config: ChunkingConfig) -> ChunkingService:
        """Get or create a ChunkingService instance with the given config."""
        if self.chunking_service is None:
            self.chunking_service = ChunkingService(
                md_chunk_size=config.md_chunk_size,
                md_chunk_overlap=config.md_chunk_overlap,
                semantic_chunk_size=config.semantic_chunk_size,
                semantic_breakpoint_threshold_type=config.semantic_breakpoint_threshold_type,
                semantic_breakpoint_threshold_amount=config.semantic_breakpoint_threshold_amount,
                embedding_model_name=config.embedding_model_name,
            )
        return self.chunking_service

    def _document_to_proto(
        self, doc: Dict[str, Any], source_url: str, part: int
    ) -> DocumentChunk:
        """Convert a document dictionary to a DocumentChunk proto message."""
        return DocumentChunk(
            content=doc["page_content"],
            source_url=source_url,
            part=part,
            metadata=doc.get("metadata", {}),
        )

    def ProcessDocument(
        self, request: ProcessDocumentRequest, context
    ) -> ProcessDocumentResponse:
        """Process a single document and return chunks."""
        try:
            service = self._get_chunking_service(request.config)
            chunks = service.chunk_document(request.text, request.source_url)

            # Convert chunks to proto format
            proto_chunks = [
                self._document_to_proto(chunk, request.source_url, i + 1)
                for i, chunk in enumerate(chunks)
            ]

            return ProcessDocumentResponse(chunks=proto_chunks)

        except Exception as e:
            logging.error(f"Error processing document: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return ProcessDocumentResponse()

    def ProcessUrls(self, request: ProcessUrlsRequest, context) -> ProcessUrlsResponse:
        """Process multiple URLs and return chunks."""
        try:
            service = self._get_chunking_service(request.config)
            chunks = service.process_urls(request.urls)

            # Convert chunks to proto format
            proto_chunks = [
                self._document_to_proto(
                    chunk, chunk.metadata.get("source_url", ""), i + 1
                )
                for i, chunk in enumerate(chunks)
            ]

            return ProcessUrlsResponse(chunks=proto_chunks)

        except Exception as e:
            logging.error(f"Error processing URLs: {e}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(str(e))
            return ProcessUrlsResponse()


def serve():
    """Start the gRPC server."""
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    add_ChunkingServiceServicer_to_server(ChunkingServiceServicer(), server)
    server.add_insecure_port("[::]:50051")
    server.start()
    logging.info("Server started on port 50051")
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
