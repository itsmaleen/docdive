import { BotIcon, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";

interface MessageItemProps {
  message: {
    id: string;
    content: string;
    sender: "user" | "bot";
    timestamp: Date;
    links?: { text: string; section: string }[];
  };
}

export function MessageItem({ message }: MessageItemProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  return (
    <div className="flex items-start gap-3 w-full">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        {message.sender === "bot" ? (
          <BotIcon className="h-4 w-4 text-primary" />
        ) : (
          <UserIcon className="h-4 w-4 text-secondary-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="markdown-body prose dark:prose-invert max-w-full break-words">
          <ReactMarkdown
            components={{
              h1: ({ node, ...props }) => {
                return (
                  <h1
                    className="scroll-mt-16 text-3xl font-bold mt-6 mb-4 pb-2 border-b break-words"
                    {...props}
                  />
                );
              },
              h2: ({ node, ...props }) => {
                return (
                  <h2
                    className="scroll-mt-16 text-2xl font-semibold mt-6 mb-3 break-words"
                    {...props}
                  />
                );
              },
              h3: ({ node, ...props }) => {
                return (
                  <h3
                    className="scroll-mt-16 text-xl font-medium mt-5 mb-2 break-words"
                    {...props}
                  />
                );
              },
              h4: ({ node, ...props }) => {
                return (
                  <h4
                    className="scroll-mt-16 text-lg font-medium mt-4 mb-2 break-words"
                    {...props}
                  />
                );
              },
              p: ({ node, ...props }) => (
                <p className="my-3 leading-relaxed break-words" {...props} />
              ),
              a: ({ node, ...props }) => (
                <a
                  className="text-primary hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              ul: ({ node, ...props }) => (
                <ul
                  className="list-disc pl-6 my-3 space-y-1 break-words"
                  {...props}
                />
              ),
              ol: ({ node, ...props }) => (
                <ol
                  className="list-decimal pl-6 my-3 space-y-1 break-words"
                  {...props}
                />
              ),
              li: ({ node, ...props }) => (
                <li className="my-1 break-words" {...props} />
              ),
              blockquote: ({ node, ...props }) => (
                <blockquote
                  className="border-l-4 border-muted-foreground/30 pl-4 italic my-4 break-words"
                  {...props}
                />
              ),
              code: ({ node, className, children, ...props }: any) => {
                const containsLanguageMatch = /language-(\w+)/.exec(
                  className || ""
                );
                const isInline = !containsLanguageMatch;
                return containsLanguageMatch ? (
                  <SyntaxHighlighter
                    style={isDarkMode ? vscDarkPlus : oneLight}
                    language={containsLanguageMatch[1]}
                    PreTag="div"
                    className="rounded-md my-4"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                ) : (
                  <code
                    className={`${
                      isInline
                        ? "bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
                        : "block bg-muted p-3 rounded-md my-4 overflow-x-auto"
                    } whitespace-pre-wrap block`}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
              table: ({ node, ...props }) => (
                <div className="overflow-x-auto my-4 max-w-full">
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
                  className="border border-border p-2 text-left font-semibold break-words"
                  {...props}
                />
              ),
              td: ({ node, ...props }) => (
                <td
                  className="border border-border p-2 break-words"
                  {...props}
                />
              ),
              hr: ({ node, ...props }) => (
                <hr className="my-6 border-border" {...props} />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
