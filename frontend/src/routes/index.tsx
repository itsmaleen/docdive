import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/components/Layout";
import logo from "../logo.svg";
import { useState } from "react";
import { UrlInputEnhanced } from "@/components/url-input";
import { DocumentationViewer } from "@/components/documentation-viewer";
import { ChatInterface } from "@/components/chat-interface";
import { InteractionSteps } from "@/components/interaction-steps";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [documentationUrl, setDocumentationUrl] = useState<string>("");
  const [documentationFile, setDocumentationFile] = useState<File | null>(null);
  const [isDocumentationLoaded, setIsDocumentationLoaded] =
    useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleUrlSubmit = (url: string) => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setDocumentationUrl(url);
      setDocumentationFile(null);
      setIsDocumentationLoaded(true);
      setCurrentStep(2);
      setIsLoading(false);
    }, 1500);
  };

  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    // Simulate loading
    setTimeout(() => {
      setDocumentationFile(file);
      setDocumentationUrl("");
      setIsDocumentationLoaded(true);
      setCurrentStep(2);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuestionSubmit = (question: string) => {
    // In a real application, this would trigger an API call to process the question
    // For now, we'll simulate highlighting a section
    setActiveSection(`section-${Math.floor(Math.random() * 5) + 1}`);
    setCurrentStep(3);
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <UrlInputEnhanced
          onUrlSubmit={handleUrlSubmit}
          onFileUpload={handleFileUpload}
          isLoading={isLoading}
        />

        {isDocumentationLoaded ? (
          <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
            <DocumentationViewer
              url={documentationUrl}
              file={documentationFile}
              activeSection={activeSection}
              className="w-full md:w-2/3"
            />

            <div className="w-full md:w-1/3 flex flex-col gap-4">
              <InteractionSteps currentStep={currentStep} />
              <ChatInterface
                onQuestionSubmit={handleQuestionSubmit}
                className="flex-1"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-200px)] bg-muted/30 rounded-lg border border-border">
            <div className="text-center max-w-md p-6">
              <h2 className="text-2xl font-bold mb-2">
                Welcome to API Explorer
              </h2>
              <p className="text-muted-foreground mb-4">
                Upload your API documentation or paste a URL to get started. You
                can then ask questions about the documentation and get
                interactive responses.
              </p>
              <div className="flex justify-center">
                <img
                  src="https://images.unsplash.com/photo-1580894732444-8ecded7900cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
                  alt="API Documentation"
                  className="rounded-lg max-w-xs opacity-70"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
