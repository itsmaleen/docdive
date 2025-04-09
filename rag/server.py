import grpc
from concurrent import futures
import rag_pb2
import rag_pb2_grpc
from text_processor import TextProcessor
import os


class RAGServicer(rag_pb2_grpc.RAGServiceServicer):
    def __init__(self):
        self.processor = TextProcessor(
            openai_api_key=os.getenv("OPENAI_API_KEY"),
            gemini_api_key=os.getenv("GEMINI_API_KEY"),
        )

    def SplitTextFixedSize(self, request, context):
        if not request.text:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Text cannot be empty")
        if request.chunk_size <= 0:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "chunk_size must be positive"
            )

        chunks = self.processor.split_text_fixed_size(
            request.text, chunk_size=request.chunk_size, overlap=request.overlap
        )
        return rag_pb2.SplitTextResponse(
            chunks=[
                rag_pb2.TextChunk(
                    text=chunk.text,
                    start_index=chunk.start_index,
                    end_index=chunk.end_index,
                )
                for chunk in chunks
            ]
        )

    def SplitTextSentences(self, request, context):
        if not request.text:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Text cannot be empty")
        if request.chunk_size <= 0:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "chunk_size must be positive"
            )

        chunks = self.processor.split_text_sentences(
            request.text, chunk_size=request.chunk_size
        )
        return rag_pb2.SplitTextResponse(
            chunks=[
                rag_pb2.TextChunk(
                    text=chunk.text,
                    start_index=chunk.start_index,
                    end_index=chunk.end_index,
                )
                for chunk in chunks
            ]
        )

    def SplitTextParagraphs(self, request, context):
        if not request.text:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Text cannot be empty")

        chunks = self.processor.split_text_paragraphs(request.text)
        return rag_pb2.SplitTextResponse(
            chunks=[
                rag_pb2.TextChunk(
                    text=chunk.text,
                    start_index=chunk.start_index,
                    end_index=chunk.end_index,
                )
                for chunk in chunks
            ]
        )

    def SplitTextContextAware(self, request, context):
        if not request.text:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Text cannot be empty")
        if request.chunk_size <= 0:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "chunk_size must be positive"
            )

        chunks = self.processor.split_text_context_aware(
            request.text, chunk_size=request.chunk_size
        )
        return rag_pb2.SplitTextResponse(
            chunks=[
                rag_pb2.TextChunk(
                    text=chunk.text,
                    start_index=chunk.start_index,
                    end_index=chunk.end_index,
                )
                for chunk in chunks
            ]
        )

    def GenerateEmbeddingsSentenceTransformers(self, request, context):
        if not request.texts:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "Texts list cannot be empty"
            )

        embeddings = self.processor.generate_embeddings_sentence_transformers(
            request.texts
        )
        return rag_pb2.EmbeddingResponse(
            embeddings=[
                rag_pb2.Embedding(values=embedding, dimension=len(embedding))
                for embedding in embeddings
            ]
        )

    def GenerateEmbeddingsOpenAI(self, request, context):
        if not request.texts:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "Texts list cannot be empty"
            )
        if not request.model:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Model name is required")

        try:
            embeddings = self.processor.generate_embeddings_openai(
                request.texts, model=request.model
            )
            return rag_pb2.EmbeddingResponse(
                embeddings=[
                    rag_pb2.Embedding(values=embedding, dimension=len(embedding))
                    for embedding in embeddings
                ]
            )
        except ValueError as e:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, str(e))
        except Exception as e:
            context.abort(grpc.StatusCode.INTERNAL, str(e))

    def GenerateEmbeddingsGemini(self, request, context):
        if not request.texts:
            context.abort(
                grpc.StatusCode.INVALID_ARGUMENT, "Texts list cannot be empty"
            )
        if not request.model:
            context.abort(grpc.StatusCode.INVALID_ARGUMENT, "Model name is required")

        try:
            embeddings = self.processor.generate_embeddings_gemini(
                request.texts, model=request.model
            )
            return rag_pb2.EmbeddingResponse(
                embeddings=[
                    rag_pb2.Embedding(values=embedding, dimension=len(embedding))
                    for embedding in embeddings
                ]
            )
        except ValueError as e:
            context.abort(grpc.StatusCode.FAILED_PRECONDITION, str(e))
        except Exception as e:
            context.abort(grpc.StatusCode.INTERNAL, str(e))


def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    rag_pb2_grpc.add_RAGServiceServicer_to_server(RAGServicer(), server)
    server.add_insecure_port("[::]:50052")
    server.start()
    server.wait_for_termination()


if __name__ == "__main__":
    serve()
