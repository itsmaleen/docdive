import React, { useState, useRef, useEffect } from "react";
import { SendIcon, BotIcon, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DiagramSection } from "@/components/diagram-section";
import { SourceReferencesList } from "@/components/source-reference";
import {
  DOCUMENTATION_SOURCES,
  SAMPLE_CHAT_RESPONSES,
} from "@/data/markdown-content";

interface EnhancedChatInterfaceProps {
  onQuestionSubmit: (question: string) => void;
  onSourceClick: (section: string) => void;
  className?: string;
}

type Message = {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  showDiagram?: boolean;
  diagramType?: "workflow" | "objects" | "sequence";
  sources?: string[];
};

export function EnhancedChatInterface({
  onQuestionSubmit,
  onSourceClick,
  className = "",
}: EnhancedChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I can help you understand this API documentation. Ask me anything about the endpoints, parameters, or workflows.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    onQuestionSubmit(inputValue);

    // Simulate API response using our sample data
    setTimeout(() => {
      let botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I don't have specific information about that in the documentation. Can you try asking about authentication, users, products, errors, rate limits, or pagination?",
        sender: "bot",
        timestamp: new Date(),
      };

      // Check if we have a predefined response for this query
      const lowerInput = inputValue.toLowerCase();

      // Find a matching response based on keywords
      for (const [keyword, response] of Object.entries(SAMPLE_CHAT_RESPONSES)) {
        if (lowerInput.includes(keyword.toLowerCase())) {
          const sources = response.sources.flatMap(
            (sourceKey) => DOCUMENTATION_SOURCES[sourceKey] || []
          );

          botResponse = {
            id: (Date.now() + 1).toString(),
            content: response.answer,
            sender: "bot",
            timestamp: new Date(),
            sources: response.sources,
          };
          break;
        }
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const getSourcesForMessage = (message: Message) => {
    if (!message.sources || message.sources.length === 0) return [];

    return message.sources.flatMap(
      (sourceKey) => DOCUMENTATION_SOURCES[sourceKey] || []
    );
  };

  return (
    <div
      className={`flex flex-col bg-card rounded-lg border border-border overflow-hidden ${className}`}
    >
      <div className="border-b border-border p-3">
        <h2 className="font-semibold flex items-center">
          <BotIcon className="h-4 w-4 mr-2" />
          API Assistant
        </h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((message, index) => (
            <div key={message.id} className="space-y-2">
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full ${
                    message.sender === "bot"
                      ? "bg-primary/10"
                      : "bg-secondary/80"
                  } flex items-center justify-center`}
                >
                  {message.sender === "bot" ? (
                    <BotIcon className="h-4 w-4 text-primary" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-secondary-foreground" />
                  )}
                </div>

                <div
                  className={`flex-1 ${
                    message.sender === "bot" ? "bg-muted/50" : "bg-secondary/30"
                  } rounded-lg p-3 max-w-[80%]`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>

              {message.sender === "bot" && message.sources && (
                <div className="ml-11">
                  <SourceReferencesList
                    sources={getSourcesForMessage(message)}
                    onSourceClick={onSourceClick}
                  />
                </div>
              )}

              {message.showDiagram && message.diagramType && (
                <DiagramSection
                  type={message.diagramType}
                  key={`diagram-${message.id}`}
                />
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <BotIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 bg-muted/50 rounded-lg p-3 max-w-[80%]">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse"></div>
                  <div
                    className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about the API documentation..."
            disabled={isLoading}
          />

          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isLoading}
          >
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
