import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { UrlInputEnhanced } from "@/components/url-input";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <UrlInputEnhanced />

        <div className="flex items-center justify-center h-[calc(100vh-200px)] bg-muted/30 rounded-lg border border-border">
          <div className="text-center max-w-md p-6">
            <h2 className="text-2xl font-bold mb-2">Welcome to API Explorer</h2>
            <p className="text-muted-foreground mb-4">
              Upload your API documentation or paste a URL to get started. You
              can then ask questions about the documentation and get interactive
              responses.
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
      </div>
    </Layout>
  );
}
