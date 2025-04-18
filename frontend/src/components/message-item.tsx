import { BotIcon, UserIcon } from "lucide-react";

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
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        {message.sender === "bot" ? (
          <BotIcon className="h-4 w-4 text-primary" />
        ) : (
          <UserIcon className="h-4 w-4 text-secondary-foreground" />
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm">{message.content}</p>
        <div className="mt-1 text-xs text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
