import pytest
from text_processor import TextProcessor, TextChunk


@pytest.fixture
def processor():
    return TextProcessor()


@pytest.fixture
def sample_text():
    return """This is a sample text. It contains multiple sentences.
    Some sentences are longer than others. This is a paragraph.
    
    This is another paragraph. It has different content.
    The sentences here are also different."""


def test_split_text_fixed_size(processor, sample_text):
    chunks = processor.split_text_fixed_size(sample_text, chunk_size=10)
    assert len(chunks) > 0
    assert all(isinstance(chunk, TextChunk) for chunk in chunks)
    assert all(len(chunk.text.split()) <= 10 for chunk in chunks)
    assert chunks[0].start_index == 0
    assert chunks[-1].end_index <= len(sample_text)


def test_split_text_sentences(processor, sample_text):
    chunks = processor.split_text_sentences(sample_text, chunk_size=20)
    assert len(chunks) > 0
    assert all(isinstance(chunk, TextChunk) for chunk in chunks)
    assert all(len(chunk.text.split()) <= 20 for chunk in chunks)
    assert chunks[0].start_index == 0
    assert chunks[-1].end_index <= len(sample_text)


def test_split_text_paragraphs(processor, sample_text):
    chunks = processor.split_text_paragraphs(sample_text)
    assert len(chunks) == 2  # Two paragraphs in sample text
    assert all(isinstance(chunk, TextChunk) for chunk in chunks)
    assert all(chunk.text.strip() for chunk in chunks)
    assert chunks[0].start_index == 0
    assert chunks[-1].end_index <= len(sample_text)


def test_split_text_context_aware(processor, sample_text):
    chunks = processor.split_text_context_aware(sample_text, chunk_size=20)
    assert len(chunks) > 0
    assert all(isinstance(chunk, TextChunk) for chunk in chunks)
    assert all(len(chunk.text.split()) <= 20 for chunk in chunks)
    assert chunks[0].start_index == 0
    assert chunks[-1].end_index <= len(sample_text)


def test_generate_embeddings_sentence_transformers(processor):
    texts = ["This is a test sentence.", "This is another test sentence."]
    embeddings = processor.generate_embeddings_sentence_transformers(texts)
    assert len(embeddings) == len(texts)
    assert all(len(embedding) > 0 for embedding in embeddings)
    assert all(isinstance(embedding, list) for embedding in embeddings)
    assert all(
        all(isinstance(val, float) for val in embedding) for embedding in embeddings
    )


def test_generate_embeddings_openai(processor):
    texts = ["This is a test sentence.", "This is another test sentence."]
    with pytest.raises(ValueError):
        processor.generate_embeddings_openai(texts)


def test_generate_embeddings_openai_with_key():
    processor = TextProcessor(openai_api_key="test_key")
    texts = ["This is a test sentence.", "This is another test sentence."]
    with pytest.raises(Exception):  # Will fail due to invalid API key
        processor.generate_embeddings_openai(texts)
