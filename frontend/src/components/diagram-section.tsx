import {
  ZapIcon,
  UsersIcon,
  ArrowRightIcon,
  PlusIcon,
  CheckIcon,
  MailIcon,
  MaximizeIcon,
  MinimizeIcon,
  ExternalLinkIcon,
  DownloadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface DiagramSectionProps {
  type: "workflow" | "objects" | "sequence";
}

export function DiagramSection({ type }: DiagramSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const renderDiagram = () => {
    switch (type) {
      case "objects":
        return <ObjectsDiagram />;
      case "workflow":
        return <WorkflowDiagram />;
      case "sequence":
        return <SequenceDiagram />;
      default:
        return null;
    }
  };

  const toggleFullScreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFullScreen(!isFullScreen);
    if (!isExpanded) {
      setIsExpanded(true);
    }
  };

  return (
    <div className="ml-11 mt-2 mb-4">
      <div
        className={`bg-card border border-border rounded-lg overflow-hidden transition-all duration-300 ${
          isFullScreen
            ? "fixed top-0 left-0 right-0 bottom-0 z-50 m-0 rounded-none"
            : isExpanded
              ? "max-h-[500px]"
              : "max-h-[200px]"
        }`}
      >
        <div className="p-3 border-b border-border flex justify-between items-center">
          <h3 className="text-sm font-medium flex items-center">
            <ZapIcon className="h-4 w-4 mr-2 text-primary" />
            {type === "objects"
              ? "Object Diagram"
              : type === "workflow"
                ? "Workflow Diagram"
                : "Sequence Diagram"}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-7 text-xs"
            >
              {isExpanded ? (
                <>
                  <MinimizeIcon className="h-3 w-3 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <MaximizeIcon className="h-3 w-3 mr-1" />
                  Expand
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullScreen}
              className="h-7 w-7 p-0"
            >
              {isFullScreen ? (
                <MinimizeIcon className="h-3 w-3" />
              ) : (
                <MaximizeIcon className="h-3 w-3" />
              )}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <DownloadIcon className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <ExternalLinkIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div
          className={`p-4 overflow-auto ${isFullScreen ? "h-[calc(100vh-60px)]" : ""}`}
        >
          {renderDiagram()}
        </div>
      </div>
    </div>
  );
}

function ObjectsDiagram() {
  return (
    <div className="flex flex-col items-center">
      <div className="border-2 border-primary/70 rounded-lg p-4 w-64 bg-primary/5">
        <h4 className="font-bold text-center mb-2">User</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">id:</span>
            <span className="text-muted-foreground">string</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">name:</span>
            <span className="text-muted-foreground">string</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">email:</span>
            <span className="text-muted-foreground">string</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">role:</span>
            <span className="text-muted-foreground">string</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">created_at:</span>
            <span className="text-muted-foreground">datetime</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center my-4">
        <ArrowRightIcon className="h-6 w-6 text-muted-foreground rotate-90" />
      </div>

      <div className="border-2 border-secondary/70 rounded-lg p-4 w-64 bg-secondary/5">
        <h4 className="font-bold text-center mb-2">Profile</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">user_id:</span>
            <span className="text-muted-foreground">string</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">avatar:</span>
            <span className="text-muted-foreground">string</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">bio:</span>
            <span className="text-muted-foreground">string</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkflowDiagram() {
  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <UsersIcon className="h-8 w-8 text-primary" />
          </div>
          <span className="text-xs mt-2 text-center">Client</span>
        </div>

        <ArrowRightIcon className="h-6 w-6 text-muted-foreground hidden md:block" />

        <ArrowRightIcon className="h-6 w-6 text-muted-foreground rotate-90 md:hidden" />

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ZapIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs mt-2 text-center">API Request</span>
        </div>

        <ArrowRightIcon className="h-6 w-6 text-muted-foreground hidden md:block" />

        <ArrowRightIcon className="h-6 w-6 text-muted-foreground rotate-90 md:hidden" />

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-xs mt-2 text-center">Validation</span>
        </div>

        <ArrowRightIcon className="h-6 w-6 text-muted-foreground hidden md:block" />

        <ArrowRightIcon className="h-6 w-6 text-muted-foreground rotate-90 md:hidden" />

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <MailIcon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="text-xs mt-2 text-center">Response</span>
        </div>
      </div>
    </div>
  );
}

function SequenceDiagram() {
  return (
    <div className="min-w-[500px]">
      <div className="flex justify-around mb-4">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <UsersIcon className="h-8 w-8 text-primary" />
          </div>
          <span className="text-xs mt-2">Client</span>
          <div className="w-px h-[200px] bg-dashed-border border-l border-dashed border-muted-foreground/50 mt-2"></div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <ZapIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <span className="text-xs mt-2">API</span>
          <div className="w-px h-[200px] bg-dashed-border border-l border-dashed border-muted-foreground/50 mt-2"></div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <PlusIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <span className="text-xs mt-2">Database</span>
          <div className="w-px h-[200px] bg-dashed-border border-l border-dashed border-muted-foreground/50 mt-2"></div>
        </div>
      </div>

      <div className="absolute top-[120px] left-0 right-0">
        <div className="relative">
          <div className="absolute top-0 left-[16%] right-[68%] flex items-center">
            <div className="h-px w-full bg-primary"></div>
            <ArrowRightIcon className="h-4 w-4 text-primary flex-shrink-0" />
          </div>
          <div className="absolute top-0 left-[20%] text-xs text-muted-foreground">
            POST /api/users
          </div>
        </div>

        <div className="relative mt-16">
          <div className="absolute top-0 left-[32%] right-[52%] flex items-center">
            <div className="h-px w-full bg-green-600 dark:bg-green-400"></div>
            <ArrowRightIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
          </div>
          <div className="absolute top-0 left-[36%] text-xs text-muted-foreground">
            Create User
          </div>
        </div>

        <div className="relative mt-16">
          <div className="absolute top-0 left-[52%] right-[32%] flex items-center">
            <ArrowRightIcon className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 rotate-180" />

            <div className="h-px w-full bg-green-600 dark:bg-green-400"></div>
          </div>
          <div className="absolute top-0 left-[36%] text-xs text-muted-foreground">
            User Created
          </div>
        </div>

        <div className="relative mt-16">
          <div className="absolute top-0 left-[68%] right-[16%] flex items-center">
            <ArrowRightIcon className="h-4 w-4 text-primary flex-shrink-0 rotate-180" />

            <div className="h-px w-full bg-primary"></div>
          </div>
          <div className="absolute top-0 left-[20%] text-xs text-muted-foreground">
            201 Created
          </div>
        </div>
      </div>
    </div>
  );
}
