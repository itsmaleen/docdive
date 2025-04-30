import { Fragment, useEffect, useRef, useState } from "react";
import { SendIcon, BotIcon, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiagramSection } from "./diagram-section";
import { MessageItem } from "./message-item";
import {
  useRAGAnswerMutation,
  useRAGChunksMutation,
  type DocumentationPage,
} from "@/api/queries";
import type { Message } from "@/lib/chat-api";
import { addMessage, chatStore } from "@/lib/chat-store";
import { useStore } from "@tanstack/react-store";
import { setActiveSection, setDocumentationPage } from "@/lib/markdown-store";

interface ChatInterfaceProps {
  documentation: DocumentationPage[] | undefined;
  className?: string;
}

export function ChatInterface({ documentation }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useStore(chatStore, (state) => state.messages);

  const { mutate: fetchRAGChunks, isPending: isFetchingRAGChunks } =
    useRAGChunksMutation();
  const { mutate: sendMessage, isPending: isSending } = useRAGAnswerMutation();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
      sources: [],
    };

    addMessage(userMessage);

    fetchRAGChunks(input);
    // Send the message using React Query mutation
    sendMessage(input);

    // Clear the input
    setInput("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-border p-3">
        <h2 className="font-semibold flex items-center">
          <BotIcon className="h-4 w-4 mr-2" />
          Chat Interface
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Fragment key={message.id}>
            <MessageItem message={message} />

            {message.sources && message.sources.length > 0 && (
              <div className="ml-11 flex flex-wrap gap-2">
                {message.sources.map((source, sourceIndex) => (
                  <Button
                    key={sourceIndex}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 bg-secondary/30"
                    onClick={() => {
                      if (!documentation) return;
                      const page = documentation.find(
                        (page) => page.url === source.url
                      );
                      if (page) {
                        setDocumentationPage(page);
                        setTimeout(() => {
                          setActiveSection(source.text);
                        }, 200);
                      } else {
                        console.log("no page found");
                        console.log(documentation);
                      }
                    }}
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />

                    {sourceIndex}
                  </Button>
                ))}
              </div>
            )}

            {message.showDiagram && message.diagramType && (
              <DiagramSection
                type={message.diagramType}
                key={`diagram-${message.id}`}
              />
            )}
          </Fragment>
        ))}

        {isSending && (
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

      <div className="border-t border-border p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || isSending}>
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
