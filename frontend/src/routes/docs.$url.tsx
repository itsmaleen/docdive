import {
  useDocumentationPathsQuery,
  useDocumentationQuery,
  type DocumentationPage,
} from "@/api/queries";
import { AppSidebar } from "@/components/documentation-sidebar";
import { ChatInterface } from "@/components/chat-interface";
import { DocsViewer } from "@/components/docs-viewer";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { markdownStore, setLoading } from "@/lib/markdown-store";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useStore } from "@tanstack/react-store";

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

  const { data } = useDocumentationQuery(documentationUrl);

  const isLoading = useStore(markdownStore, (state) => state.isLoading);

  const [documentation, setDocumentation] = useState<DocumentationPage[]>([]);

  const currentTitle = useStore(
    markdownStore,
    (state) => state.documentationPage?.title
  );

  useEffect(() => {
    if (data) {
      setDocumentation(data);
      console.log("set documentation");
    } else if (documentationPaths) {
      setDocumentation(documentationPaths);
    }
  }, [data, documentationPaths]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "350px",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        documentation={documentation}
        isLoading={isLoading}
        error={errorPaths}
      />
      <SidebarInset>
        <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4 z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">{documentationUrl}</BreadcrumbLink>
              </BreadcrumbItem>
              {currentTitle && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="grid auto-rows-min gap-4 md:grid-cols-5">
          <div className="md:col-span-3 w-full">
            <DocsViewer error={errorPaths} />
          </div>
          <div className="md:col-span-2 sticky top-[73px] h-[calc(100vh-73px)]">
            <ChatInterface documentation={documentation} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
