import type { Message } from "@/lib/chat-api";
import { addMessage } from "@/lib/chat-store";
import { useMutation, useQuery } from "@tanstack/react-query";

export interface DocumentationPage {
  url: string;
  markdown: string;
  title: string;
}

const fetchDocumentation = async (
  url: string
): Promise<DocumentationPage[]> => {
  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/docs?url=${encodeURIComponent(url)}`
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

const fetchRAGAnswer = async (query: string): Promise<Message> => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/rag`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `query=${encodeURIComponent(query)}`,
  });
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
