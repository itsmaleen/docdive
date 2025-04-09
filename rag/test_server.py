import pytest
import grpc
from concurrent import futures
import rag_pb2
import rag_pb2_grpc
from server import RAGServicer


@pytest.fixture
def server():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    rag_pb2_grpc.add_RAGServiceServicer_to_server(RAGServicer(), server)
    server.add_insecure_port("[::]:0")
    server.start()
    yield server
    server.stop(0)


@pytest.fixture
def channel(server):
    return grpc.insecure_channel(server.add_insecure_port("[::]:0"))


@pytest.fixture
def stub(channel):
    return rag_pb2_grpc.RAGServiceStub(channel)


def test_split_text_fixed_size(stub):
    request = rag_pb2.SplitTextRequest(
        text="This is a test sentence. This is another test sentence.", chunk_size=5
    )
    response = stub.SplitTextFixedSize(request)
    assert len(response.chunks) > 0
    assert all(len(chunk.text.split()) <= 5 for chunk in response.chunks)
    assert response.chunks[0].start_index == 0


def test_split_text_sentences(stub):
    request = rag_pb2.SplitTextRequest(
        text="This is a test sentence. This is another test sentence.", chunk_size=10
    )
    response = stub.SplitTextSentences(request)
    assert len(response.chunks) > 0
    assert all(len(chunk.text.split()) <= 10 for chunk in response.chunks)
    assert response.chunks[0].start_index == 0


def test_split_text_paragraphs(stub):
    request = rag_pb2.SplitTextRequest(
        text="This is a paragraph.\n\nThis is another paragraph."
    )
    response = stub.SplitTextParagraphs(request)
    assert len(response.chunks) == 2
    assert all(chunk.text.strip() for chunk in response.chunks)
    assert response.chunks[0].start_index == 0


def test_split_text_context_aware(stub):
    request = rag_pb2.SplitTextRequest(
        text="This is a test sentence. This is another test sentence.", chunk_size=10
    )
    response = stub.SplitTextContextAware(request)
    assert len(response.chunks) > 0
    assert all(len(chunk.text.split()) <= 10 for chunk in response.chunks)
    assert response.chunks[0].start_index == 0


def test_generate_embeddings_sentence_transformers(stub):
    request = rag_pb2.EmbeddingRequest(
        texts=["This is a test sentence.", "This is another test sentence."],
        model="all-mpnet-base-v2",
    )
    response = stub.GenerateEmbeddingsSentenceTransformers(request)
    assert len(response.embeddings) == 2
    assert all(len(embedding.values) > 0 for embedding in response.embeddings)
    assert all(
        embedding.dimension == len(embedding.values)
        for embedding in response.embeddings
    )


def test_generate_embeddings_openai(stub):
    request = rag_pb2.EmbeddingRequest(
        texts=["This is a test sentence.", "This is another test sentence."],
        model="text-embedding-ada-002",
    )
    with pytest.raises(grpc.RpcError) as exc_info:
        stub.GenerateEmbeddingsOpenAI(request)
    assert exc_info.value.code() == grpc.StatusCode.FAILED_PRECONDITION


def test_invalid_requests(stub):
    # Test empty text
    request = rag_pb2.SplitTextRequest(text="", chunk_size=5)
    with pytest.raises(grpc.RpcError) as exc_info:
        stub.SplitTextFixedSize(request)
    assert exc_info.value.code() == grpc.StatusCode.INVALID_ARGUMENT

    # Test invalid chunk size
    request = rag_pb2.SplitTextRequest(text="Test", chunk_size=0)
    with pytest.raises(grpc.RpcError) as exc_info:
        stub.SplitTextFixedSize(request)
    assert exc_info.value.code() == grpc.StatusCode.INVALID_ARGUMENT

    # Test empty texts list for embeddings
    request = rag_pb2.EmbeddingRequest(texts=[], model="test")
    with pytest.raises(grpc.RpcError) as exc_info:
        stub.GenerateEmbeddingsSentenceTransformers(request)
    assert exc_info.value.code() == grpc.StatusCode.INVALID_ARGUMENT
