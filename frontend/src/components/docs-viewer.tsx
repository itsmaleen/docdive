import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { markdownStore } from "@/lib/markdown-store";
import { useStore } from "@tanstack/react-store";
import { generateSlug, stringToHTMLCollection } from "@/lib/utils";
import { Code } from "./code";

interface DocsViewerProps {
  error: Error | null;
}

export function DocsViewer({ error }: DocsViewerProps) {
  const [, setIsDarkMode] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);

  const markdown = useStore(
    markdownStore,
    (state) => state.documentationPage?.markdown
  );

  const isLoading = useStore(markdownStore, (state) => state.isLoading);
  const isLoadingContent = useStore(
    markdownStore,
    (state) => state.isLoadingContent
  );

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

  const activeTitle = useStore(markdownStore, (state) => state.activeTitle);
  useEffect(() => {
    if (activeTitle && viewerRef.current) {
      const sectionElement = viewerRef.current.querySelector(
        `[id*="${activeTitle}"]`
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
  }, [activeTitle]);

  const activeSection = useStore(markdownStore, (state) => state.activeSection);
  useEffect(() => {
    if (!activeSection) return;

    // Get div[data-slot="scroll-area-viewport"] > div > div
    const activeElement = document.getElementById("markdown-viewer");
    if (!activeElement) return;

    if (activeElement.children.length === 0) return;

    const activeSectionElements = stringToHTMLCollection(activeSection);

    // Find the longest chain of matching nodeNames
    let maxLength = 0;
    let currentLength = 0;
    let currentStartIndex = 0;

    // For each possible starting position in activeElement.children
    for (let i = 0; i < activeElement.children.length; i++) {
      currentLength = 0;

      // Check if we can match a sequence starting at this position
      for (
        let j = 0;
        j < activeSectionElements.length &&
        i + j < activeElement.children.length;
        j++
      ) {
        if (
          activeElement.children[i + j].nodeName ===
          activeSectionElements[j].nodeName
        ) {
          currentLength++;
        } else {
          break; // Break as soon as we find a mismatch
        }
      }

      // Update maxLength if we found a longer chain
      if (currentLength > maxLength) {
        maxLength = currentLength;
        currentStartIndex = i;
      }
    }

    // Set the indices based on the longest chain found
    if (maxLength <= 0) {
      alert("No matching elements found");
      return;
    }

    const startingElementIndex = currentStartIndex;
    const endingElementIndex = currentStartIndex + maxLength;

    activeElement.children[startingElementIndex].scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // highlight the elements between startingElementIndex and endingElementIndex
    for (let i = startingElementIndex; i <= endingElementIndex; i++) {
      const sectionElement = activeElement.children[i];

      // Add highlight effect
      sectionElement.classList.add(
        "bg-yellow-100",
        "dark:bg-yellow-900/30",
        "transition-all",
        "duration-500"
      );
    }
  }, [activeSection]);

  if (isLoading || isLoadingContent) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 text-center p-6 text-destructive">
        <p>Error loading documentation: {error.message}</p>
      </div>
    );
  }

  if (!markdown) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-muted-foreground">
        <p className="text-center">
          Please select a page from the sidebar to view its documentation.
        </p>
      </div>
    );
  }

  return (
    <div id="markdown-viewer" className="p-6 flex-1" ref={viewerRef}>
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
            <ul className="list-disc pl-6 my-3 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 my-3 space-y-1" {...props} />
          ),
          li: ({ node, ...props }) => <li className="my-1" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-muted-foreground/30 pl-4 italic my-4"
              {...props}
            />
          ),
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match;
            return !isInline && match ? (
              <Code>{String(children).replace(/\n$/, "")}</Code>
            ) : (
              <code
                className={`${
                  isInline
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
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
