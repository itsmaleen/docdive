from typing import List
from langchain_text_splitters import MarkdownTextSplitter


class MarkdownChunker:
    def __init__(self, chunk_size: int = 1000, overlap: int = 200):
        self.splitter = MarkdownTextSplitter(
            chunk_size=chunk_size, chunk_overlap=overlap
        )

    def chunk(self, markdown_content: str) -> List[str]:
        if not markdown_content.strip():
            return []

        # Use Langchain's MarkdownTextSplitter to split the content
        chunks = self.splitter.split_text(markdown_content)
        return chunks
