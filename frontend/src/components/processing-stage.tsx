import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircleIcon,
  CircleIcon,
  LoaderIcon,
  XCircleIcon,
} from "lucide-react";
import type {
  ProcessingStageInfo,
  ProcessingStatus,
} from "@/data/processing-data";
import { cn } from "@/lib/utils";

interface ProcessingStageProps {
  stage: ProcessingStageInfo;
  isActive: boolean;
}

export function ProcessingStage({ stage, isActive }: ProcessingStageProps) {
  const getStatusIcon = (status: ProcessingStatus) => {
    switch (status) {
      case "complete":
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <LoaderIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case "failed":
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <CircleIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ProcessingStatus) => {
    switch (status) {
      case "complete":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
          >
            Complete
          </Badge>
        );

      case "in-progress":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
          >
            In Progress
          </Badge>
        );

      case "failed":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
          >
            Failed
          </Badge>
        );

      default:
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800"
          >
            Pending
          </Badge>
        );
    }
  };

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "Calculating...";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all",
        isActive
          ? "border-blue-500 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
          : stage.status === "complete"
            ? "border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/10"
            : stage.status === "failed"
              ? "border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10"
              : "border-border bg-card"
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{stage.icon}</span>
          <h3 className="font-medium">{stage.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(stage.status)}
          {getStatusIcon(stage.status)}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{stage.description}</p>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>
            {stage.completedItems} / {stage.totalItems} items
          </span>
          <span>{stage.progress}%</span>
        </div>
        <Progress value={stage.progress} className="h-2" />
        {stage.status === "in-progress" &&
          stage.estimatedTimeRemaining !== null && (
            <div className="text-xs text-muted-foreground text-right">
              Estimated time remaining:{" "}
              {formatTime(stage.estimatedTimeRemaining)}
            </div>
          )}
      </div>
    </div>
  );
}
