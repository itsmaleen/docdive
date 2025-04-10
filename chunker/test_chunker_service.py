import unittest
from unittest.mock import Mock, patch
import grpc
from concurrent import futures
import os
import sys

# Add the generated protobuf files to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "generated"))

from chunker_pb2 import (
    ProcessUrlsRequest,
    ProcessDocumentRequest,
    ChunkingConfig,
    DocumentChunk,
)
from chunker_pb2_grpc import ChunkingServiceStub, add_ChunkingServiceServicer_to_server
from server import ChunkingServiceServicer


class TestChunkingService(unittest.TestCase):
    def setUp(self):
        self.server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
        self.servicer = ChunkingServiceServicer()
        add_ChunkingServiceServicer_to_server(self.servicer, self.server)
        self.server.add_insecure_port("[::]:50051")
        self.server.start()

        # Create a stub
        self.channel = grpc.insecure_channel("localhost:50051")
        self.stub = ChunkingServiceStub(self.channel)

        # Default config for testing
        self.default_config = ChunkingConfig(
            md_chunk_size=1000,
            md_chunk_overlap=150,
            semantic_chunk_size=256,
            semantic_breakpoint_threshold_type="percentile",
            semantic_breakpoint_threshold_amount=95.0,
            embedding_model_name="sentence-transformers/all-MiniLM-L6-v2",
        )

    def tearDown(self):
        self.server.stop(0)
        self.channel.close()

    def test_process_document(self):
        # Test with a simple markdown document
        test_text = """# Test Document
This is a test document with multiple sections.

## Section 1
This is the first section with some content.

## Section 2
This is the second section with different content.
"""
        request = ProcessDocumentRequest(
            text=test_text, source_url="http://test.com", config=self.default_config
        )

        response = self.stub.ProcessDocument(request)

        # Basic assertions
        self.assertIsNotNone(response)
        self.assertGreater(len(response.chunks), 0)

        # Check first chunk
        first_chunk = response.chunks[0]
        self.assertEqual(first_chunk.source_url, "http://test.com")
        self.assertIn("# Test Document", first_chunk.content)
        self.assertEqual(first_chunk.part, 1)

    @patch("requests.get")
    def test_process_urls(self, mock_get):
        # Mock the requests.get response
        mock_response = Mock()
        mock_response.text = """# Test URL Content
This is content from a URL.

## Section
Some content here.
"""
        mock_response.headers = {"content-type": "text/markdown"}
        mock_get.return_value = mock_response

        request = ProcessUrlsRequest(
            urls=["http://test.com"], config=self.default_config
        )

        response = self.stub.ProcessUrls(request)

        # Basic assertions
        self.assertIsNotNone(response)
        self.assertGreater(len(response.chunks), 0)

        # Check first chunk
        first_chunk = response.chunks[0]
        self.assertEqual(first_chunk.source_url, "http://test.com")
        self.assertIn("# Test URL Content", first_chunk.content)
        self.assertEqual(first_chunk.part, 1)


if __name__ == "__main__":
    unittest.main()
