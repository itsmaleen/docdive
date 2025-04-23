import React, { useState, useEffect, useRef } from "react";
import {
  ExternalLinkIcon,
  SearchIcon,
  BookOpenIcon,
  CodeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { CollapsibleSidebar } from "@/polymet/components/collapsible-sidebar";

interface SidebarSection {
  id: string;
  title: string;
  level: number;
  children?: SidebarSection[];
}

interface EnhancedDocViewerProps {
  markdown: string;
  originalUrl?: string;
  activeSection?: string | null;
  className?: string;
}

export function EnhancedDocViewer({
  markdown,
  originalUrl,
  activeSection,
  className = "",
}: EnhancedDocViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("documentation");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showOnlyCode, setShowOnlyCode] = useState(false);
  const [sections, setSections] = useState<SidebarSection[]>([]);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Check for dark mode
  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setIsDarkMode(isDark);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === "class" &&
          mutation.target === document.documentElement
        ) {
          setIsDarkMode(document.documentElement.classList.contains("dark"));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  // Parse markdown to extract sections
  useEffect(() => {
    const extractSections = (markdownText: string) => {
      const headingRegex = /^(#{1,6})\s+(.+)$/gm;
      const matches = [...markdownText.matchAll(headingRegex)];

      const flatSections: SidebarSection[] = matches.map((match) => {
        const level = match[1].length;
        const title = match[2].trim();
        const id = generateSlug(title);

        return {
          id,
          title,
          level,
        };
      });

      // Convert flat list to hierarchical structure
      const rootSections: SidebarSection[] = [];
      const sectionStack: SidebarSection[] = [];

      flatSections.forEach((section) => {
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

    setSections(extractSections(markdown));
  }, [markdown]);

  // Handle scrolling to active section
  useEffect(() => {
    if (activeSection && viewerRef.current) {
      const sectionElement = viewerRef.current.querySelector(
        `#${activeSection}`
      );

      if (sectionElement) {
        // Scroll to the element with smooth behavior
        sectionElement.scrollIntoView({ behavior: "smooth", block: "center" });

        // Add highlight effect
        sectionElement.classList.add(
          "bg-yellow-100",
          "dark:bg-yellow-900/30",
          "scale-105",
          "transition-all",
          "duration-500"
        );

        // Add a border to make it more noticeable
        sectionElement.classList.add(
          "border-2",
          "border-primary",
          "rounded-lg",
          "shadow-lg"
        );

        // Remove the highlight effect after some time
        setTimeout(() => {
          sectionElement.classList.remove(
            "bg-yellow-100",
            "dark:bg-yellow-900/30",
            "scale-105",
            "border-2",
            "border-primary",
            "shadow-lg"
          );
        }, 3000);
      }
    }
  }, [activeSection]);

  // Function to generate IDs for headings
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  };

  // Function to handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Function to open original documentation
  const openOriginalDoc = () => {
    if (originalUrl) {
      window.open(originalUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Handle section click from sidebar
  const handleSectionClick = (sectionId: string) => {
    // Find the element with the given ID
    if (viewerRef.current) {
      const sectionElement = viewerRef.current.querySelector(`#${sectionId}`);

      if (sectionElement) {
        // Scroll to the element with smooth behavior
        sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });

        // Add highlight effect
        sectionElement.classList.add(
          "bg-yellow-100",
          "dark:bg-yellow-900/30",
          "scale-105",
          "transition-all",
          "duration-500"
        );

        // Add a border to make it more noticeable
        sectionElement.classList.add(
          "border-2",
          "border-primary",
          "rounded-lg",
          "shadow-lg"
        );

        // Remove the highlight effect after some time
        setTimeout(() => {
          sectionElement.classList.remove(
            "bg-yellow-100",
            "dark:bg-yellow-900/30",
            "scale-105",
            "border-2",
            "border-primary",
            "shadow-lg"
          );
        }, 3000);
      }
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  // Filter content based on showOnlyCode
  const filteredMarkdown = showOnlyCode
    ? markdown
        .split("\n")
        .filter((line, index, array) => {
          // Keep code blocks and their language specifiers
          if (line.startsWith("```")) return true;

          // Check if we're inside a code block
          let codeBlockCount = 0;
          for (let i = 0; i <= index; i++) {
            if (array[i].startsWith("```")) codeBlockCount++;
          }

          // If we're inside a code block (odd count), keep the line
          return codeBlockCount % 2 === 1;
        })
        .join("\n")
    : markdown;

  return (
    <div
      className={`flex flex-col bg-card rounded-lg border border-border overflow-hidden h-full ${className}`}
    >
      <div className="border-b border-border p-3 flex items-center justify-between">
        <div className="flex items-center">
          <BookOpenIcon className="h-5 w-5 mr-2 text-primary" />
          <h2 className="font-semibold">API Documentation</h2>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center space-x-2 mr-4">
            <Switch
              id="code-only"
              checked={showOnlyCode}
              onCheckedChange={setShowOnlyCode}
            />

            <Label htmlFor="code-only" className="text-sm">
              Code only
            </Label>
          </div>

          <Tabs
            defaultValue="documentation"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList>
              <TabsTrigger value="documentation">Documentation</TabsTrigger>
              <TabsTrigger value="raw">Raw Markdown</TabsTrigger>
            </TabsList>
          </Tabs>

          {originalUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={openOriginalDoc}
              className="h-8 gap-1 ml-2"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Original</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <CollapsibleSidebar
          sections={sections}
          activeSection={activeSection || undefined}
          onSectionClick={handleSectionClick}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          className="flex-shrink-0"
        />

        <div className="flex-1 flex flex-col">
          <div className="border-b border-border p-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in documentation..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 h-9 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="flex-1" viewportRef={viewerRef}>
            <div className="p-6">
              {activeTab === "documentation" ? (
                <ReactMarkdown
                  components={{
                    h1: ({ node, ...props }) => {
                      const text = props.children?.toString() || "";
                      const slug = generateSlug(text);
                      return (
                        <h1
                          id={slug}
                          className="scroll-mt-16 text-3xl font-bold mt-6 mb-4 pb-2 border-b"
                          {...props}
                        />
                      );
                    },
                    h2: ({ node, ...props }) => {
                      const text = props.children?.toString() || "";
                      const slug = generateSlug(text);
                      return (
                        <h2
                          id={slug}
                          className="scroll-mt-16 text-2xl font-semibold mt-6 mb-3"
                          {...props}
                        />
                      );
                    },
                    h3: ({ node, ...props }) => {
                      const text = props.children?.toString() || "";
                      const slug = generateSlug(text);
                      return (
                        <h3
                          id={slug}
                          className="scroll-mt-16 text-xl font-medium mt-5 mb-2"
                          {...props}
                        />
                      );
                    },
                    h4: ({ node, ...props }) => {
                      const text = props.children?.toString() || "";
                      const slug = generateSlug(text);
                      return (
                        <h4
                          id={slug}
                          className="scroll-mt-16 text-lg font-medium mt-4 mb-2"
                          {...props}
                        />
                      );
                    },
                    p: ({ node, ...props }) => (
                      <p className="my-3 leading-relaxed" {...props} />
                    ),

                    a: ({ node, ...props }) => (
                      <a
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...props}
                      />
                    ),

                    ul: ({ node, ...props }) => (
                      <ul
                        className="list-disc pl-6 my-3 space-y-1"
                        {...props}
                      />
                    ),

                    ol: ({ node, ...props }) => (
                      <ol
                        className="list-decimal pl-6 my-3 space-y-1"
                        {...props}
                      />
                    ),

                    li: ({ node, ...props }) => (
                      <li className="my-1" {...props} />
                    ),

                    blockquote: ({ node, ...props }) => (
                      <blockquote
                        className="border-l-4 border-muted-foreground/30 pl-4 italic my-4"
                        {...props}
                      />
                    ),

                    code: ({ node, inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={isDarkMode ? vscDarkPlus : oneLight}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-md my-4"
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      ) : (
                        <code
                          className={`${
                            inline
                              ? "bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                              : "block bg-muted p-3 rounded-md my-4 overflow-x-auto"
                          }`}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-4">
                        <table
                          className="w-full border-collapse border border-border"
                          {...props}
                        />
                      </div>
                    ),

                    thead: ({ node, ...props }) => (
                      <thead className="bg-muted/50" {...props} />
                    ),

                    tbody: ({ node, ...props }) => <tbody {...props} />,

                    tr: ({ node, ...props }) => (
                      <tr className="border-b border-border" {...props} />
                    ),

                    th: ({ node, ...props }) => (
                      <th
                        className="border border-border p-2 text-left font-semibold"
                        {...props}
                      />
                    ),

                    td: ({ node, ...props }) => (
                      <td className="border border-border p-2" {...props} />
                    ),

                    hr: ({ node, ...props }) => (
                      <hr className="my-6 border-border" {...props} />
                    ),
                  }}
                >
                  {filteredMarkdown}
                </ReactMarkdown>
              ) : (
                <pre className="font-mono text-sm whitespace-pre-wrap">
                  {filteredMarkdown}
                </pre>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
