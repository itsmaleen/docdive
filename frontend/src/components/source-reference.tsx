import React from "react";
import { ExternalLinkIcon, BookOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SourceReference } from "@/data/markdown-content";

interface SourceReferenceProps {
  source: SourceReference;
  onSourceClick: (section: string) => void;
}

export function SourceReference({
  source,
  onSourceClick,
}: SourceReferenceProps) {
  const handleSourceClick = () => {
    onSourceClick(source.section);
  };

  const handleExternalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(source.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="border rounded-md p-3 bg-card hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={handleSourceClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="h-4 w-4 text-primary flex-shrink-0" />
          <h4 className="font-medium text-sm">{source.title}</h4>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleExternalClick}
          title="Open in original documentation"
        >
          <ExternalLinkIcon className="h-3 w-3" />
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {source.content}
      </p>
    </div>
  );
}

interface SourceReferencesListProps {
  sources: SourceReference[];
  onSourceClick: (section: string) => void;
}

export function SourceReferencesList({
  sources,
  onSourceClick,
}: SourceReferencesListProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mt-2">
      <h3 className="text-xs font-medium text-muted-foreground">Sources:</h3>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <SourceReference
            key={index}
            source={source}
            onSourceClick={onSourceClick}
          />
        ))}
      </div>
    </div>
  );
}
