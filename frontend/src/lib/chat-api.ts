import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Types
export type Message = {
  id: string;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  sources: { text: string; url: string }[];
  showDiagram?: boolean;
  diagramType?: "workflow" | "objects" | "sequence";
};

// Query keys
export const chatKeys = {
  all: ["chat"] as const,
  messages: () => [...chatKeys.all, "messages"] as const,
  message: (id: string) => [...chatKeys.messages(), id] as const,
};

// API functions
const fetchMessages = async (): Promise<Message[]> => {
  // In a real app, this would be an API call
  // For now, we'll return a mock initial message
  return [
    {
      id: "1",
      content:
        "Hello! I can help you understand this API documentation. Ask me anything about the endpoints, parameters, or workflows.",
      sender: "bot",
      timestamp: new Date(),
      sources: [],
    },
  ];
};

const sendMessage = async (message: string): Promise<Message> => {
  // In a real app, this would be an API call
  // For now, we'll simulate a response
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate API response
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
      const lowerInput = message.toLowerCase();
      let botResponse: {
        response: string;
        diagram: boolean;
        diagramType?: "workflow" | "objects" | "sequence";
        links: { text: string; section: string }[];
      } = {
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
            diagramType: response.diagramType,
            links: response.links || [
              { text: "View all endpoints", section: "section-1" },
            ],
          };
          break;
        }
      }

      resolve({
        id: Date.now().toString(),
        content: botResponse.response,
        sender: "bot",
        timestamp: new Date(),
        showDiagram: botResponse.diagram,
        diagramType: botResponse.diagramType,
        sources: botResponse.links.map((link) => ({
          text: link.text,
          url: link.section,
        })),
      });
    }, 1500);
  });
};

// Custom hooks
export function useMessages() {
  return useQuery({
    queryKey: chatKeys.messages(),
    queryFn: fetchMessages,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: (newMessage) => {
      // Optimistically update the messages list
      queryClient.setQueryData<Message[]>(
        chatKeys.messages(),
        (oldMessages = []) => {
          return [...oldMessages, newMessage];
        }
      );
    },
  });
}
