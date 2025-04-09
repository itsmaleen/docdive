import argparse
import logging
import requests
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
import markdownify

from langchain.text_splitter import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.schema import Document

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)


class ChunkingService:
    """
    A service to fetch markdown content from URLs and chunk it using
    Markdown structure and semantic splitting.
    """

    def __init__(
        self,
        md_chunk_size: int = 1000,
        md_chunk_overlap: int = 150,
        semantic_chunk_size: int = 256,  # Smaller for semantic coherence
        semantic_breakpoint_threshold_type: str = "percentile",  # Or "standard_deviation", "interquartile"
        semantic_breakpoint_threshold_amount: float = 95,  # Adjust based on type
        embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        user_agent: str = "MarkdownChunkingService/1.0",
    ):
        """
        Initializes the ChunkingService.

        Args:
            md_chunk_size: Target size for Markdown chunks (character count).
            md_chunk_overlap: Overlap between Markdown chunks (character count).
            semantic_chunk_size: Max size for semantic chunks (token count).
            semantic_breakpoint_threshold_type: Method to find semantic breaks.
            semantic_breakpoint_threshold_amount: Threshold value for semantic breaks.
            embedding_model_name: Name of the sentence-transformer model for embeddings.
            user_agent: User-Agent string for HTTP requests.
        """
        logging.info("Initializing Chunking Service...")
        self.md_chunk_size = md_chunk_size
        self.md_chunk_overlap = md_chunk_overlap
        self.user_agent = user_agent

        # Using RecursiveCharacterTextSplitter with Markdown awareness
        # This often works better than MarkdownHeaderTextSplitter alone for RAG
        self.markdown_splitter = RecursiveCharacterTextSplitter.from_language(
            language="markdown",
            chunk_size=md_chunk_size,
            chunk_overlap=md_chunk_overlap,
        )

        # Initialize embeddings only once
        try:
            self.embeddings = HuggingFaceEmbeddings(model_name=embedding_model_name)
        except Exception as e:
            logging.error(f"Failed to load embedding model: {e}")
            raise

        # Initialize SemanticChunker (using RecursiveCharacterTextSplitter internally)
        # Note: SemanticChunker often uses token counts, not character counts
        self.semantic_chunker = RecursiveCharacterTextSplitter(
            chunk_size=semantic_chunk_size,
            chunk_overlap=int(semantic_chunk_size * 0.1),  # ~10% overlap
            # Add other parameters if needed, like length_function
        ).embed_and_split(  # This is a conceptual representation; LangChain API might differ slightly
            self.embeddings,
            breakpoint_threshold_type=semantic_breakpoint_threshold_type,
            breakpoint_threshold_amount=semantic_breakpoint_threshold_amount,
        )
        # --- Correction/Refinement based on LangChain Docs ---
        # SemanticChunker is instantiated directly, not via RecursiveCharacterTextSplitter
        # It uses an underlying text_splitter, often RecursiveCharacterTextSplitter
        from langchain.text_splitter import SemanticChunker

        # Let's use a default RecursiveCharacterTextSplitter *if* SemanticChunker needs one
        # Note: SemanticChunker's primary mechanism is embedding breakpoints, not fixed size splitting initially.
        # The 'chunk_size' in SemanticChunker might refer to a target size *after* semantic splitting.
        # Let's stick to the documented SemanticChunker usage:
        self.semantic_chunker = SemanticChunker(
            embeddings=self.embeddings,
            breakpoint_threshold_type=semantic_breakpoint_threshold_type,
            breakpoint_threshold_amount=semantic_breakpoint_threshold_amount,
            # add_start_index=True # Useful for locating chunks later
        )

        logging.info("Chunking Service Initialized.")

    def _fetch_and_extract_markdown(self, url: str) -> Optional[str]:
        """Fetches content from a URL and attempts to extract Markdown."""
        logging.info(f"Fetching content from: {url}")
        headers = {"User-Agent": self.user_agent}
        try:
            response = requests.get(url, headers=headers, timeout=20)
            response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)

            content_type = response.headers.get("content-type", "").lower()

            if "markdown" in content_type or "text/plain" in content_type:
                logging.info("Direct Markdown or plain text detected.")
                return response.text
            elif "html" in content_type:
                logging.info("HTML detected, attempting Markdown extraction...")
                soup = BeautifulSoup(response.content, "html.parser")
                # Try to find the main content area (heuristic, might need adjustment)
                main_content = soup.find("main") or soup.find("article") or soup.body
                if main_content:
                    # Convert HTML to Markdown
                    markdown_text = markdownify.markdownify(
                        str(main_content), heading_style="ATX"
                    )
                    logging.info("Successfully extracted Markdown from HTML.")
                    return markdown_text
                else:
                    logging.warning(
                        f"Could not find main content area in HTML for {url}"
                    )
                    return None  # Or return response.text and let chunker handle it
            else:
                logging.warning(
                    f"Unsupported content type '{content_type}' for {url}. Skipping."
                )
                return None

        except requests.exceptions.RequestException as e:
            logging.error(f"Failed to fetch URL {url}: {e}")
            return None
        except Exception as e:
            logging.error(f"Error processing URL {url}: {e}")
            return None

    def chunk_document(self, text: str, source_url: str) -> List[Document]:
        """
        Chunks a single document using Markdown splitting followed by semantic splitting.

        Args:
            text: The Markdown text content.
            source_url: The URL from which the text was fetched.

        Returns:
            A list of LangChain Document objects representing the final chunks.
        """
        if not text:
            return []

        logging.info(f"Starting chunking for {source_url}...")

        # 1. Initial Split based on Markdown Structure (using RecursiveCharacterTextSplitter)
        # This splitter is generally more robust for arbitrary markdown.
        initial_md_chunks = self.markdown_splitter.create_documents(
            [text], metadatas=[{"source_url": source_url}]  # Start propagating metadata
        )
        logging.info(f"Created {len(initial_md_chunks)} initial Markdown chunks.")

        final_chunks: List[Document] = []

        # 2. Refine chunks using Semantic Splitting
        for i, md_chunk in enumerate(initial_md_chunks):
            logging.debug(
                f"Processing Markdown chunk {i+1}/{len(initial_md_chunks)} semantically."
            )
            try:
                # Apply semantic chunker to the content of the markdown chunk
                semantic_split_chunks = self.semantic_chunker.create_documents(
                    [md_chunk.page_content]
                )

                # Add/Update metadata for each semantic chunk
                for sem_chunk in semantic_split_chunks:
                    # Combine metadata: Start with original md_chunk metadata
                    sem_chunk.metadata.update(md_chunk.metadata)
                    # Ensure source_url is present
                    sem_chunk.metadata["source_url"] = source_url
                    # You could add more metadata here, e.g., chunk sequence numbers
                    sem_chunk.metadata["part"] = i + 1
                    final_chunks.append(sem_chunk)

                logging.debug(
                    f"Markdown chunk {i+1} resulted in {len(semantic_split_chunks)} semantic chunks."
                )

            except Exception as e:
                logging.error(
                    f"Error during semantic chunking for part of {source_url}: {e}"
                )
                # Optionally, add the original markdown chunk if semantic fails
                # final_chunks.append(md_chunk)

        logging.info(
            f"Finished chunking for {source_url}. Total final chunks: {len(final_chunks)}"
        )
        return final_chunks

    def process_urls(self, urls: List[str]) -> List[Document]:
        """
        Fetches content from multiple URLs and chunks them.

        Args:
            urls: A list of URLs to process.

        Returns:
            A list of all final Document chunks from all URLs.
        """
        all_chunks: List[Document] = []
        for url in urls:
            markdown_content = self._fetch_and_extract_markdown(url)
            if markdown_content:
                chunks = self.chunk_document(markdown_content, url)
                all_chunks.extend(chunks)
            else:
                logging.warning(f"Skipping URL due to fetch/extraction failure: {url}")
        return all_chunks


# --- Command Line Interface ---
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Fetch Markdown from URLs and chunk using Markdown and Semantic splitting."
    )
    parser.add_argument(
        "urls", nargs="+", help="List of URLs containing Markdown content."
    )
    parser.add_argument(
        "--md-chunk-size", type=int, default=1000, help="Markdown chunk size (chars)."
    )
    parser.add_argument(
        "--md-chunk-overlap",
        type=int,
        default=150,
        help="Markdown chunk overlap (chars).",
    )
    parser.add_argument(
        "--sem-chunk-size",
        type=int,
        default=256,
        help="Approx Semantic chunk size (tokens).",
    )
    parser.add_argument(
        "--sem-threshold-type",
        choices=["percentile", "standard_deviation", "interquartile"],
        default="percentile",
        help="Semantic breakpoint threshold type.",
    )
    parser.add_argument(
        "--sem-threshold",
        type=float,
        default=95,  # Default for percentile
        help="Semantic breakpoint threshold amount.",
    )
    parser.add_argument(
        "--model",
        default="sentence-transformers/all-MiniLM-L6-v2",
        help="Sentence transformer model name.",
    )
    parser.add_argument(
        "--output-file",
        help="Optional file path to save chunked content (e.g., chunks.jsonl).",
    )

    args = parser.parse_args()

    # --- Initialize and Run Service ---
    try:
        service = ChunkingService(
            md_chunk_size=args.md_chunk_size,
            md_chunk_overlap=args.md_chunk_overlap,
            # semantic_chunk_size=args.sem_chunk_size, # SemanticChunker doesn't take size directly
            semantic_breakpoint_threshold_type=args.sem_threshold_type,
            semantic_breakpoint_threshold_amount=args.sem_threshold,
            embedding_model_name=args.model,
        )

        final_chunks = service.process_urls(args.urls)

        logging.info(f"\n--- Processing Complete ---")
        logging.info(f"Total URLs processed: {len(args.urls)}")
        logging.info(f"Total final chunks generated: {len(final_chunks)}")

        # --- Output Results ---
        if final_chunks:
            logging.info("\n--- Sample Chunk ---")
            sample_chunk = final_chunks[0]
            logging.info(f"Content: {sample_chunk.page_content[:200]}...")
            logging.info(f"Metadata: {sample_chunk.metadata}")

        if args.output_file:
            logging.info(f"Saving chunks to {args.output_file}...")
            try:
                import json

                with open(args.output_file, "w", encoding="utf-8") as f:
                    for chunk in final_chunks:
                        # Serialize Document object to JSON Lines format
                        json_line = json.dumps(
                            {
                                "page_content": chunk.page_content,
                                "metadata": chunk.metadata,
                            }
                        )
                        f.write(json_line + "\n")
                logging.info("Successfully saved chunks.")
            except Exception as e:
                logging.error(f"Failed to save chunks to file: {e}")

    except Exception as e:
        logging.error(f"An error occurred during service execution: {e}", exc_info=True)
