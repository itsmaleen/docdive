import { createFileRoute } from "@tanstack/react-router";
import Layout from "@/components/layout";
import { UrlInputEnhanced } from "@/components/url-input";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-2xl p-6">
          <UrlInputEnhanced />
        </div>
      </div>
    </Layout>
  );
}
