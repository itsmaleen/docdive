import { useState, useEffect, useRef } from "react";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Loader2,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useDocumentationPageMutation,
  type DocumentationPage,
} from "@/api/queries";
import {
  setDocumentationPage,
  markdownStore,
  setActiveTitle,
  setLoading,
  setLoadingContent,
} from "@/lib/markdown-store";
import { useStore } from "@tanstack/react-store";
import { generateSlug } from "@/lib/utils";

interface SidebarSection {
  id: string;
  title: string;
  level: number;
  children?: SidebarSection[];
}

interface DocumentationSidebarProps {
  documentation: DocumentationPage[] | undefined;
  isLoading?: boolean;
  error?: Error;
  onSectionClick: (sectionId: string) => void;
  className?: string;
}

export function DocumentationSidebar({
  documentation,
  isLoading = false,
  error,
  onSectionClick,
  className = "",
}: DocumentationSidebarProps) {
  const [sections, setSections] = useState<SidebarSection[]>([]);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState<number>(-1);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resultRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const currentTitle = useStore(
    markdownStore,
    (state) => state.documentationPage?.title
  );
  const currentMarkdown = useStore(
    markdownStore,
    (state) => state.documentationPage?.markdown || ""
  );

  const { mutate: fetchDocumentationPage, isPending: isFetching } =
    useDocumentationPageMutation();

  useEffect(() => {
    console.log("isFetching", isFetching);
    setLoadingContent(isFetching);
  }, [isFetching]);

  // Parse markdown to extract headings and build a table of contents
  useEffect(() => {
    const extractSections = (markdownText: string) => {
      const headingRegex = /^(#{1,6})\s+(.+)$/gm;
      const matches = [...markdownText.matchAll(headingRegex)];

      const flatSections: SidebarSection[] = matches.map((match) => {
        const level = match[1].length;
        // Remove link from title [](...)
        const title = match[2].trim().replace(/\[.*?\]\(.*?\)/g, "");
        const id = generateSlug(title);

        return {
          id,
          title,
          level,
        };
      });

      // Skip the first heading if it matches the page title
      const filteredSections = flatSections.filter((section) =>
        section.level === 1 && section.title === currentTitle ? false : true
      );

      // Convert flat list to hierarchical structure
      const rootSections: SidebarSection[] = [];
      const sectionStack: SidebarSection[] = [];

      filteredSections.forEach((section) => {
        // Pop items from stack if current section has lower or equal level
        while (
          sectionStack.length > 0 &&
          sectionStack[sectionStack.length - 1].level >= section.level
        ) {
          sectionStack.pop();
        }

        // If stack is empty, add to root
        if (sectionStack.length === 0) {
          rootSections.push(section);
          sectionStack.push(section);
        } else {
          // Add as child to the last item in stack
          const parent = sectionStack[sectionStack.length - 1];
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(section);
          sectionStack.push(section);
        }
      });

      return rootSections;
    };

    setSections(extractSections(currentMarkdown));
  }, [currentMarkdown]);

  // Toggle section expansion
  const toggleSection = (section: SidebarSection) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section.id]: !prev[section.id],
    }));
  };

  // Handle section click
  const handleSectionClick = (section: SidebarSection) => {
    onSectionClick(section.id);
    setActiveTitle(generateSlug(section.title));
    console.log("Active section set to:", section.title);
    console.log(generateSlug(section.title));
  };

  // Search through documentation titles
  useEffect(() => {
    if (!documentation) return;

    const results: number[] = [];
    documentation.forEach((page, index) => {
      if (page.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        results.push(index);
      }
    });

    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
  }, [searchQuery, documentation]);

  // Scroll to the current search result
  useEffect(() => {
    if (currentResultIndex >= 0 && currentResultIndex < searchResults.length) {
      const resultIndex = searchResults[currentResultIndex];
      const element = resultRefs.current.get(resultIndex);

      if (element && sidebarRef.current) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentResultIndex, searchResults]);

  // Navigate to next search result
  const goToNextResult = () => {
    if (searchResults.length === 0) return;
    setCurrentResultIndex((prev) => (prev + 1) % searchResults.length);
  };

  // Navigate to previous search result
  const goToPreviousResult = () => {
    if (searchResults.length === 0) return;
    setCurrentResultIndex(
      (prev) => (prev - 1 + searchResults.length) % searchResults.length
    );
  };

  // Render a section and its children recursively
  const renderSection = (section: SidebarSection, depth = 0) => {
    const hasChildren = section.children && section.children.length > 0;
    const isExpanded = expandedSections[section.id] || false;
    const isActive = section.title === currentTitle;

    return (
      <div key={section.id} className="my-0.5 w-full">
        <div className="flex items-start w-full">
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 mr-1 flex-shrink-0 mt-0.5"
              onClick={() => toggleSection(section)}
            >
              {isExpanded ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <div className="w-7 flex-shrink-0"></div>
          )}

          <Button
            variant={isActive ? "secondary" : "ghost"}
            className={`h-auto min-h-7 justify-start px-2 py-1.5 text-sm font-medium ${
              isActive ? "bg-secondary" : ""
            } hover:bg-secondary/80 w-full text-left break-words whitespace-normal`}
            style={{ paddingLeft: `${depth * 8 + 8}px` }}
            onClick={() => handleSectionClick(section)}
          >
            {section.title}
          </Button>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-2 w-full">
            {section.children!.map((child) => renderSection(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col border-r border-border h-full ${className}`}
      ref={sidebarRef}
    >
      <div className="p-3 border-b border-border sticky top-0 bg-background z-10">
        <div className="relative">
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm pr-20 placeholder:text-xs"
            disabled={isLoading}
          />
          {searchQuery && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchResults.length > 0 ? (
                <>
                  <span className="text-xs text-muted-foreground">
                    {currentResultIndex + 1} of {searchResults.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={goToPreviousResult}
                  >
                    <ChevronUpIcon className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 p-0"
                    onClick={goToNextResult}
                  >
                    <ChevronDownIcon className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  No results
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-2 w-full">
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center p-6 text-destructive">
              <p>Error loading documentation: {error.message}</p>
            </div>
          ) : (
            documentation?.map((page, index) => (
              <div
                key={index}
                className={`mb-2 w-full ${
                  searchResults.includes(index) && searchQuery !== ""
                    ? index === searchResults[currentResultIndex]
                      ? "bg-secondary/80"
                      : "bg-secondary/40"
                    : ""
                }`}
                ref={(el) => {
                  if (el) resultRefs.current.set(index, el);
                }}
              >
                <Button
                  variant="ghost"
                  className="w-full justify-between h-auto min-h-8 px-2 py-1.5 whitespace-normal"
                  onClick={() => {
                    if (page.markdown != "") {
                      setDocumentationPage(page);
                    } else {
                      fetchDocumentationPage(page.id);
                    }
                  }}
                >
                  <span className="text-left break-words pr-2">
                    {page.title}
                  </span>
                  <ChevronRightIcon
                    className={`h-4 w-4 transition-transform flex-shrink-0 ${
                      page.title === currentTitle ? "rotate-90" : ""
                    }`}
                  />
                </Button>
                {page.title === currentTitle && (
                  <div className="ml-4 mt-1 border-l-2 border-border w-4/5">
                    {sections.length > 0 ? (
                      sections.map((section) => renderSection(section))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No sections found
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
