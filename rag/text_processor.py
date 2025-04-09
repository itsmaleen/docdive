from typing import List, Tuple
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
from sentence_transformers import SentenceTransformer
import openai
from dataclasses import dataclass
import re
from google import genai


@dataclass
class TextChunk:
    text: str
    start_index: int
    end_index: int


class TextProcessor:
    def __init__(self, openai_api_key: str = None, gemini_api_key: str = None):
        """Initialize the text processor with optional OpenAI API key."""
        self.openai_api_key = openai_api_key
        if openai_api_key:
            openai.api_key = openai_api_key

        self.gemini_api_key = gemini_api_key

        # Download required NLTK data
        try:
            nltk.data.find("tokenizers/punkt")
        except LookupError:
            nltk.download("punkt")

        # Initialize sentence transformer model
        self.sentence_transformer = SentenceTransformer("all-mpnet-base-v2")

    def split_text_fixed_size(
        self, text: str, chunk_size: int = 200, overlap: int = 0
    ) -> List[TextChunk]:
        """Split text into fixed-size chunks with optional overlap."""
        words = word_tokenize(text)
        chunks = []
        start_idx = 0

        while start_idx < len(words):
            end_idx = min(start_idx + chunk_size, len(words))
            chunk_text = " ".join(words[start_idx:end_idx])
            chunks.append(TextChunk(chunk_text, start_idx, end_idx))
            start_idx += chunk_size - overlap

        return chunks

    def split_text_sentences(self, text: str, chunk_size: int = 200) -> List[TextChunk]:
        """Split text into chunks based on sentences."""
        sentences = sent_tokenize(text)
        chunks = []
        current_chunk = []
        current_size = 0
        start_idx = 0

        for sentence in sentences:
            sentence_words = word_tokenize(sentence)
            if current_size + len(sentence_words) > chunk_size and current_chunk:
                chunks.append(
                    TextChunk(
                        " ".join(current_chunk), start_idx, start_idx + current_size
                    )
                )
                current_chunk = []
                current_size = 0
                start_idx = (
                    len(" ".join(chunks[-1].text.split()) + " ") if chunks else 0
                )

            current_chunk.append(sentence)
            current_size += len(sentence_words)

        if current_chunk:
            chunks.append(TextChunk(" ".join(current_chunk), start_idx, len(text)))

        return chunks

    def split_text_paragraphs(self, text: str) -> List[TextChunk]:
        """Split text into paragraphs."""
        paragraphs = text.split("\n\n")
        chunks = []
        current_pos = 0

        for para in paragraphs:
            if para.strip():
                chunks.append(
                    TextChunk(para.strip(), current_pos, current_pos + len(para))
                )
                current_pos += len(para) + 2  # +2 for the double newline

        return chunks

    def split_text_context_aware(
        self, text: str, chunk_size: int = 200
    ) -> List[TextChunk]:
        """Split text using context-aware boundaries."""
        # This is a more sophisticated approach that tries to split on natural boundaries
        # while respecting the chunk size
        sentences = sent_tokenize(text)
        chunks = []
        current_chunk = []
        current_size = 0
        start_idx = 0

        for sentence in sentences:
            sentence_words = word_tokenize(sentence)

            # Check if adding this sentence would exceed chunk size
            if current_size + len(sentence_words) > chunk_size and current_chunk:
                # Try to find a good breaking point
                chunk_text = " ".join(current_chunk)
                chunks.append(
                    TextChunk(chunk_text, start_idx, start_idx + len(chunk_text))
                )
                current_chunk = []
                current_size = 0
                start_idx = (
                    len(" ".join(chunks[-1].text.split()) + " ") if chunks else 0
                )

            current_chunk.append(sentence)
            current_size += len(sentence_words)

        if current_chunk:
            chunks.append(TextChunk(" ".join(current_chunk), start_idx, len(text)))

        return chunks

    def generate_embeddings_sentence_transformers(
        self, texts: List[str]
    ) -> List[List[float]]:
        """Generate embeddings using Sentence Transformers."""
        embeddings = self.sentence_transformer.encode(texts)
        return embeddings.tolist()

    def generate_embeddings_openai(
        self, texts: List[str], model: str = "text-embedding-ada-002"
    ) -> List[List[float]]:
        """Generate embeddings using OpenAI's API."""
        if not self.openai_api_key:
            raise ValueError("OpenAI API key is required for this method")

        embeddings = []
        for text in texts:
            response = openai.Embedding.create(input=text, model=model)
            embeddings.append(response["data"][0]["embedding"])

        return embeddings

    def generate_embeddings_gemini(
        self, texts: List[str], model: str = "gemini-embedding-exp-03-07"
    ) -> List[List[float]]:
        """Generate embeddings using Google Gemini."""
        if not self.gemini_api_key:
            raise ValueError("Google Gemini API key is required for this method")

        if not self.gemini_api_key:
            raise ValueError("Google Gemini API key is required for this method")

        client = genai.Client(api_key=self.gemini_api_key)

        embeddings = []
        for text in texts:
            result = client.models.embed_content(
                model=model,
                contents=text,
            )
            embeddings.append(result.embeddings)

        return embeddings
