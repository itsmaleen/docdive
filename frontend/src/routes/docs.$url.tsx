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
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  const {
    data: documentation,
    isLoading,
    error,
  } = useDocumentationQuery(documentationUrl);

  const handleQuestionSubmit = () => {
    // In a real application, this would trigger an API call to process the question
    // For now, we'll simulate highlighting a section
    setActiveSection(`section-${Math.floor(Math.random() * 5) + 1}`);
    setCurrentStep(3);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <UrlInputEnhanced />

        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
          <EnhancedMarkdownViewer
            documentation={documentation}
            originalUrl={documentationUrl}
            activeSection={activeSection}
            className="w-full md:w-2/3"
            isLoading={isLoading}
            error={error || undefined}
          />

          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <InteractionSteps currentStep={currentStep} />
            <ChatInterface
              onQuestionSubmit={handleQuestionSubmit}
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}
