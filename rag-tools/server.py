import grpc
from concurrent import futures
from markdown_chunker import MarkdownChunker
import markdown_chunker_pb2
import markdown_chunker_pb2_grpc


class MarkdownChunkerServicer(markdown_chunker_pb2_grpc.MarkdownChunkerServiceServicer):
    def ChunkMarkdown(self, request, context):
        chunker = MarkdownChunker(
            chunk_size=request.chunk_size if request.chunk_size > 0 else 1000,
            overlap=request.overlap if request.overlap > 0 else 200,
        )
        chunks = chunker.chunk(request.content)
        return markdown_chunker_pb2.ChunkMarkdownResponse(chunks=chunks)


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    markdown_chunker_pb2_grpc.add_MarkdownChunkerServiceServicer_to_server(
        MarkdownChunkerServicer(), server
    )
    server.add_insecure_port("[::]:50051")
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
