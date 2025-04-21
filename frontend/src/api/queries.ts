import { useQuery } from "@tanstack/react-query";

interface DocumentationPage {
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
