import type { Message } from "@/lib/chat-api";
import { addMessage } from "@/lib/chat-store";
import { setDocumentationPage } from "@/lib/markdown-store";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface DocumentationPage {
  id: string;
  url: string;
  markdown: string;
  title: string;
  path: string;
}

const fetchDocumentationPage = async (
  id: string
): Promise<DocumentationPage> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/docs/pages?id=${encodeURIComponent(id)}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch documentation page");
  }
  return response.json();
};

export const useDocumentationPageMutation = () => {
  return useMutation({
    mutationFn: (id: string) => fetchDocumentationPage(id),
    onSuccess: (data) => {
      setDocumentationPage(data);
    },
    onError: (error) => {
      console.error("Error fetching documentation page", error);
      const errorMessageMarkdown: DocumentationPage = {
        id: "",
        url: "",
        markdown: "An error occurred while fetching the documentation page.",
        title: "",
        path: "",
      };
      setDocumentationPage(errorMessageMarkdown);
    },
  });
};

const fetchDocumentationPaths = async (
  url: string
): Promise<DocumentationPage[]> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/docs/list?url=${encodeURIComponent(url)}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch documentation paths");
  }
  return response.json();
};

export const useDocumentationPathsQuery = (url: string) => {
  return useQuery({
    queryKey: ["documentation-paths", url],
    queryFn: () => fetchDocumentationPaths(url),
    enabled: !!url,
  });
};

const fetchDocumentation = async (
  url: string
): Promise<DocumentationPage[]> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/docs/content?url=${encodeURIComponent(url)}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch documentation");
  }
  return response.json();
};

export const useDocumentationQuery = (url: string) => {
  return useQuery({
    queryKey: ["documentation", url],
    queryFn: () => fetchDocumentation(url),
    enabled: !!url,
  });
};

const fetchRAGChunks = async (query: string): Promise<Message> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/rag/retrieve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `query=${encodeURIComponent(query)}`,
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch RAG chunks");
  }
  return response.json();
};

export const useRAGChunksMutation = () => {
  return useMutation({
    mutationFn: (query: string) => fetchRAGChunks(query),
    onSuccess: (data) => {
      const message: Message = {
        id: new Date().toISOString(),
        content: "Here are the chunks that I found relevant to your query.",
        sender: "bot",
        timestamp: new Date(),
        sources: data.sources,
      };
      addMessage(message);
    },
    onError: (error) => {
      console.error("Error fetching RAG chunks", error);
    },
  });
};

const fetchRAGAnswer = async (query: string): Promise<Message> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/api/rag/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `query=${encodeURIComponent(query)}`,
    }
  );
  if (!response.ok) {
    throw new Error("Failed to fetch RAG answer");
  }
  return response.json();
};

export const useRAGAnswerMutation = () => {
  return useMutation({
    mutationFn: (query: string) => fetchRAGAnswer(query),
    onSuccess: (data) => {
      addMessage(data);
    },
    onError: (error) => {
      console.error("Error fetching RAG answer", error);
      const errorMessage: Message = {
        id: new Date().toISOString(),
        content: "An error occurred while fetching the RAG answer.",
        sender: "bot",
        timestamp: new Date(),
        sources: [],
      };
      addMessage(errorMessage);
    },
  });
};
