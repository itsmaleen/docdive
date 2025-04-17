import grpc
from server import serve
import markdown_chunker_pb2
import markdown_chunker_pb2_grpc
import threading
import time


def test_grpc_service():
    # Start the server in a separate thread
    server_thread = threading.Thread(target=serve)
    server_thread.daemon = True
    server_thread.start()

    # Give the server time to start
    time.sleep(1)

    try:
        # Create a channel and stub
        channel = grpc.insecure_channel("localhost:50051")
        stub = markdown_chunker_pb2_grpc.MarkdownChunkerServiceStub(channel)

        # Create a request
        request = markdown_chunker_pb2.ChunkMarkdownRequest(
            content="# Test\nThis is a test.", chunk_size=100, overlap=20
        )

        # Make the request
        response = stub.ChunkMarkdown(request)

        # Verify the response
        assert len(response.chunks) > 0
        assert all(isinstance(chunk, str) for chunk in response.chunks)
        assert all(len(chunk) > 0 for chunk in response.chunks)

    finally:
        # Clean up
        channel.close()
