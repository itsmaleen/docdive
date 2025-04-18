import { Fragment, useEffect, useRef, useState } from "react";
import { SendIcon, BotIcon, LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiagramSection } from "./diagram-section";
import { MessageItem } from "./message-item";

interface ChatInterfaceProps {
  onQuestionSubmit: (question: string) => void;
  className?: string;
}

type Message = {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  showDiagram?: boolean;
  diagramType?: "workflow" | "objects" | "sequence";
  links?: { text: string; section: string }[];
};

export function ChatInterface({
  onQuestionSubmit,
  className = "",
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Hello! I can help you understand this API documentation. Ask me anything about the endpoints, parameters, or workflows.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
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
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    onQuestionSubmit(input);

    // Simulate API response
    setTimeout(() => {
      const botResponses: Record<
        string,
        {
          response: string;
          diagram?: boolean;
          diagramType?: "workflow" | "objects" | "sequence";
          links?: { text: string; section: string }[];
        }
      > = {
        authenticate: {
          response:
            "To authenticate a user, you need to make a POST request to /api/auth/login with the user's credentials. This will return a JWT token that you should include in the Authorization header for subsequent requests.",
          diagram: true,
          diagramType: "sequence",
          links: [
            { text: "View authentication endpoint", section: "section-3" },
            { text: "See user object schema", section: "section-2" },
          ],
        },
        user: {
          response:
            "The User object represents a person who can access the system. It contains properties like id, name, email, and role. You can retrieve user information using GET /api/users/{id}.",
          diagram: true,
          diagramType: "objects",
          links: [
            { text: "View user endpoints", section: "section-1" },
            { text: "See user creation", section: "section-3" },
          ],
        },
        get: {
          response:
            "The GET /api/users endpoint returns a list of all users. You can paginate results using the page and limit query parameters. Each user object includes their basic information.",
          diagram: true,
          diagramType: "workflow",
          links: [
            { text: "View GET endpoint details", section: "section-1" },
            { text: "See user object structure", section: "section-2" },
          ],
        },
        post: {
          response:
            "The POST /api/users endpoint creates a new user. You need to provide name, email, and role in the request body. Upon successful creation, the API returns the newly created user object with a 201 status code.",
          diagram: true,
          diagramType: "sequence",
          links: [
            { text: "View POST endpoint details", section: "section-3" },
            { text: "See user object structure", section: "section-2" },
          ],
        },
        workflow: {
          response:
            "When a user is created, the system first validates the input, then checks for duplicate emails, creates the user record, and finally sends a welcome email. This ensures data integrity and provides a good user experience.",
          diagram: true,
          diagramType: "workflow",
          links: [
            { text: "View user creation endpoint", section: "section-3" },
            { text: "See user object structure", section: "section-2" },
          ],
        },
      };

      // Find a matching keyword in the user's question
      const lowerInput = input.toLowerCase();
      let botResponse = {
        response:
          "I don't have specific information about that in the documentation. Can you try asking about authentication, users, GET, POST endpoints, or workflows?",
        diagram: false,
        links: [{ text: "View all endpoints", section: "section-1" }],
      };

      for (const [keyword, response] of Object.entries(botResponses)) {
        if (lowerInput.includes(keyword)) {
          botResponse = {
            response: response.response,
            diagram: response.diagram || false,
            links: response.links || [
              { text: "View all endpoints", section: "section-1" },
            ],
          };
          break;
        }
      }

      const botMessage: Message = {
        id: Date.now().toString(),
        content: botResponse.response,
        sender: "bot",
        timestamp: new Date(),
        showDiagram: botResponse.diagram,
        diagramType: botResponse?.diagramType || null,
        links: botResponse.links,
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 1500);
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
        {messages.map((message, index) => (
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

      <div className="border-t border-border p-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim()}>
            <SendIcon className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
