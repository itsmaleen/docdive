import { ChatInterface } from "@/components/chat-interface";
import { InteractionSteps } from "@/components/interaction-steps";
import { UrlInputEnhanced } from "@/components/url-input";
import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { useState } from "react";
import { useDocumentationQuery } from "@/api/queries";
import { EnhancedMarkdownViewer } from "@/components/enhanced-markdown-viewer";

export const Route = createFileRoute("/docs/$url")({
  component: RouteComponent,
});

function RouteComponent() {
  const { url } = Route.useParams();
  const [documentationUrl] = useState<string>(url);

  const {
    data: documentation,
    isLoading,
    error,
  } = useDocumentationQuery(documentationUrl);

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <UrlInputEnhanced />

        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
          <EnhancedMarkdownViewer
            documentation={documentation}
            originalUrl={documentationUrl}
            className="w-full md:w-2/3"
            isLoading={isLoading}
            error={error || undefined}
          />

          <div className="w-full md:w-1/3">
            <ChatInterface documentation={documentation} className="flex-1" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
