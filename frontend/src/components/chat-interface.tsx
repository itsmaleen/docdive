import { Fragment, useEffect, useRef, useState } from "react";
import { SendIcon, BotIcon, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiagramSection } from "./diagram-section";
import { MessageItem } from "./message-item";
import { useMessages, useSendMessage } from "@/lib/chat-api";
// import type { Message } from "@/lib/chat-api";

interface ChatInterfaceProps {
  onQuestionSubmit: (question: string) => void;
  className?: string;
}

export function ChatInterface({ onQuestionSubmit }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use React Query hooks
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages();
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;

    // const userMessage: Message = {
    //   id: Date.now().toString(),
    //   content: input,
    //   sender: "user",
    //   timestamp: new Date(),
    // };

    // // Add user message to the UI immediately (optimistic update)
    // const updatedMessages = [...messages, userMessage];

    // Call the onQuestionSubmit prop
    onQuestionSubmit(input);

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

            {message.links && message.links.length > 0 && (
              <div className="ml-11 flex flex-wrap gap-2">
                {message.links.map((link, linkIndex) => (
                  <Button
                    key={linkIndex}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 bg-secondary/30"
                    onClick={() => {
                      const element = document.getElementById(link.section);
                      if (element) {
                        element.scrollIntoView({
                          behavior: "smooth",
                          block: "center",
                        });
                        element.classList.add(
                          "bg-yellow-100",
                          "dark:bg-yellow-900/30",
                          "scale-105",
                          "transition-all",
                          "duration-500"
                        );
                        setTimeout(() => {
                          element.classList.remove(
                            "bg-yellow-100",
                            "dark:bg-yellow-900/30",
                            "scale-105"
                          );
                        }, 2000);
                      }
                    }}
                  >
                    <LinkIcon className="h-3 w-3 mr-1" />

                    {link.text}
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

        {(isSending || isLoadingMessages) && (
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
