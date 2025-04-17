import pytest
from markdown_chunker import MarkdownChunker


def test_chunk_markdown_basic():
    chunker = MarkdownChunker()
    markdown_content = """
    # Title
    This is a paragraph.
    
    ## Subtitle
    This is another paragraph.
    """
    chunks = chunker.chunk(markdown_content)
    assert len(chunks) > 0
    assert all(isinstance(chunk, str) for chunk in chunks)
    assert all(len(chunk) > 0 for chunk in chunks)


def test_chunk_markdown_empty():
    chunker = MarkdownChunker()
    chunks = chunker.chunk("")
    assert len(chunks) == 0


def test_chunk_markdown_with_code_blocks():
    chunker = MarkdownChunker()
    markdown_content = """
    # Code Example
    Here's some code:
    ```python
    def hello():
        print("Hello, World!")
    ```
    And some more text.
    """
    chunks = chunker.chunk(markdown_content)
    assert len(chunks) > 0
    assert any("```python" in chunk for chunk in chunks)


def test_chunk_markdown_with_custom_chunk_size():
    chunker = MarkdownChunker(chunk_size=100, overlap=20)
    markdown_content = "This is a test. " * 20
    chunks = chunker.chunk(markdown_content)
    assert len(chunks) > 0


def test_chunk_markdown_with_custom_overlap():
    chunker = MarkdownChunker(chunk_size=100, overlap=20)
    markdown_content = "This is a test. " * 10
    chunks = chunker.chunk(markdown_content)
    assert len(chunks) > 1
