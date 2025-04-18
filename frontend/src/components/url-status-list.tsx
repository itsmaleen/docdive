import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircleIcon,
  CircleIcon,
  ExternalLinkIcon,
  LoaderIcon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UrlStatus, ProcessingStatus } from "@/data/processing-data";

interface UrlStatusListProps {
  urls: UrlStatus[];
  onRetry?: (url: string) => void;
  className?: string;
  maxHeight?: string;
}

export function UrlStatusList({
  urls,
  onRetry,
  className,
  maxHeight = "400px",
}: UrlStatusListProps) {
  const [filter, setFilter] = useState<ProcessingStatus | "all">("all");

  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case "complete":
        return (
          <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
        );

      case "in-progress":
        return (
          <LoaderIcon className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
        );

      case "failed":
        return <XCircleIcon className="h-4 w-4 text-red-500 flex-shrink-0" />;

      default:
        return (
          <CircleIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        );
    }
  };

  const getStatusText = (status: ProcessingStatus) => {
    switch (status) {
      case "complete":
        return "Complete";
      case "in-progress":
        return "In progress...";
      case "failed":
        return "Failed";
      default:
        return "Pending";
    }
  };

  const filteredUrls =
    filter === "all" ? urls : urls.filter((url) => url.status === filter);

  const statusCounts = {
    all: urls.length,
    complete: urls.filter((url) => url.status === "complete").length,
    "in-progress": urls.filter((url) => url.status === "in-progress").length,
    pending: urls.filter((url) => url.status === "pending").length,
    failed: urls.filter((url) => url.status === "failed").length,
  };

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      <div className="p-3 border-b flex items-center justify-between">
        <h3 className="font-medium">Processing URLs</h3>
        <div className="flex gap-1 text-xs">
          <Button
            variant={filter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("all")}
            className="h-7 px-2"
          >
            All ({statusCounts.all})
          </Button>
          <Button
            variant={filter === "in-progress" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("in-progress")}
            className="h-7 px-2"
          >
            Active ({statusCounts["in-progress"]})
          </Button>
          <Button
            variant={filter === "failed" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setFilter("failed")}
            className="h-7 px-2"
          >
            Failed ({statusCounts.failed})
          </Button>
        </div>
      </div>
      <ScrollArea
        className={`p-2 ${maxHeight ? `max-h-[${maxHeight}]` : ""}`}
        style={{ maxHeight }}
      >
        <div className="space-y-2 p-2">
          {filteredUrls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No URLs match the selected filter
            </div>
          ) : (
            filteredUrls.map((url, index) => (
              <div
                key={url.url}
                className={cn(
                  "p-3 rounded-md border flex items-start gap-3",
                  url.status === "failed"
                    ? "bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30"
                    : "bg-card"
                )}
              >
                <div className="mt-1">{getStatusIcon(url.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm truncate">
                      {url.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {url.stage && (
                        <Badge variant="outline" className="text-xs">
                          {url.stage
                            .split("-")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                        </Badge>
                      )}
                      <a
                        href={url.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLinkIcon className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-1">
                    {url.url}
                  </div>
                  {url.status === "failed" && url.error && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400 flex items-center justify-between">
                      <span>{url.error}</span>
                      {onRetry && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRetry(url.url)}
                          className="h-6 px-2 text-xs"
                        >
                          <RefreshCwIcon className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </div>
                  )}
                  {url.status !== "failed" && (
                    <div className="mt-1 text-xs">
                      {getStatusText(url.status)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
