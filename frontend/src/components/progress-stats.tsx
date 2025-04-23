import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PauseIcon, PlayIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProcessingStats } from "@/data/processing-data";
import { DOC_FACTS } from "@/data/processing-data";

interface ProgressStatsProps {
  stats: ProcessingStats;
  isPaused?: boolean;
  onPauseToggle?: () => void;
  onAbort?: () => void;
  className?: string;
}

export function ProgressStats({
  stats,
  isPaused = false,
  onPauseToggle,
  onAbort,
  className,
}: ProgressStatsProps) {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentFactIndex((prevIndex) => (prevIndex + 1) % DOC_FACTS.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return "Calculating...";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  };

  const formatElapsedTime = (startTime: Date) => {
    const elapsed = Math.floor(
      (new Date().getTime() - startTime.getTime()) / 1000
    );
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className={cn("border rounded-lg bg-card p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Processing Progress</h3>
        <div className="flex items-center gap-2">
          {onPauseToggle && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPauseToggle}
              className="h-8 px-3"
            >
              {isPaused ? (
                <>
                  <PlayIcon className="h-4 w-4 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <PauseIcon className="h-4 w-4 mr-1" />
                  Pause
                </>
              )}
            </Button>
          )}
          {onAbort && (
            <Button
              variant="outline"
              size="sm"
              onClick={onAbort}
              className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-500 dark:hover:text-red-400 dark:hover:bg-red-900/20"
            >
              <XIcon className="h-4 w-4 mr-1" />
              Abort
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{stats.overallProgress}%</span>
          </div>
          <Progress value={stats.overallProgress} className="h-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-muted-foreground mb-1">URLs</div>
            <div className="font-medium">
              {stats.processedUrls} / {stats.totalUrls}
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-muted-foreground mb-1">Elapsed Time</div>
            <div className="font-medium">
              {formatElapsedTime(stats.startTime)}
            </div>
          </div>
          <div className="bg-muted/50 p-3 rounded-md">
            <div className="text-muted-foreground mb-1">Est. Remaining</div>
            <div className="font-medium">
              {formatTime(stats.estimatedTimeRemaining)}
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-md p-3 text-sm italic text-blue-800 dark:text-blue-300">
          <p>{DOC_FACTS[currentFactIndex]}</p>
        </div>
      </div>
    </div>
  );
}
