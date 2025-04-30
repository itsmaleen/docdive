import { ChatInterface } from "@/components/chat-interface";
import { UrlInputEnhanced } from "@/components/url-input";
import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { useEffect, useState } from "react";
import {
  useDocumentationPathsQuery,
  useDocumentationQuery,
  type DocumentationPage,
} from "@/api/queries";
import { EnhancedMarkdownViewer } from "@/components/enhanced-markdown-viewer";
import { setLoading } from "@/lib/markdown-store";

export const Route = createFileRoute("/docs/$url")({
  component: RouteComponent,
});

function RouteComponent() {
  const { url } = Route.useParams();
  const [documentationUrl] = useState<string>(url);

  const {
    data: documentationPaths,
    isLoading: isLoadingPaths,
    error: errorPaths,
  } = useDocumentationPathsQuery(documentationUrl);

  setLoading(isLoadingPaths);

  const {
    data,
    isLoading: isLoadingDocs,
    error: errorDocs,
  } = useDocumentationQuery(documentationUrl);

  // First use documentationPaths to show the paths / titles
  // Once data is loaded, use documentation to show the content

  const [documentation, setDocumentation] = useState<DocumentationPage[]>([]);

  useEffect(() => {
    if (data) {
      setDocumentation(data);
      console.log("set documentation");
    } else if (documentationPaths) {
      setDocumentation(documentationPaths);
    }
  }, [data, documentationPaths]);

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <UrlInputEnhanced />

        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
          <EnhancedMarkdownViewer
            documentation={documentation}
            originalUrl={documentationUrl}
            className="w-full md:w-2/3"
            error={errorPaths || undefined}
          />

          <div className="w-full md:w-1/3">
            <ChatInterface documentation={documentation} className="flex-1" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
