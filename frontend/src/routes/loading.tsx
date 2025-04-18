import { ProcessingStage } from "@/components/processing-stage";
import { ProgressStats } from "@/components/progress-stats";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UrlStatusList } from "@/components/url-status-list";
import {
  INITIAL_PROCESSING_STAGES,
  INITIAL_PROCESSING_STATS,
  type ProcessingStageInfo,
  type ProcessingStats,
  type UrlStatus,
} from "@/data/processing-data";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

const documentationUrlSchema = z.object({
  url: z.string().url(),
});

export const Route = createFileRoute("/loading")({
  component: RouteComponent,
  validateSearch: documentationUrlSchema,
});

function RouteComponent() {
  // Get search param "url"
  const { url } = Route.useSearch();

  return (
    <LoadingScreen
      documentationUrl={url}
      onCancel={() => {}}
      onComplete={() => {}}
    />
  );
}

interface LoadingScreenProps {
  documentationUrl: string;
  onCancel: () => void;
  onComplete: () => void;
  initialUrls?: UrlStatus[];
}

export function LoadingScreen({
  documentationUrl,
  onCancel,
  onComplete,
  initialUrls = [],
}: LoadingScreenProps) {
  const [stages, setStages] = useState<ProcessingStageInfo[]>(
    INITIAL_PROCESSING_STAGES
  );
  const [stats, setStats] = useState<ProcessingStats>({
    ...INITIAL_PROCESSING_STATS,
    startTime: new Date(),
  });
  const [urls, setUrls] = useState<UrlStatus[]>(initialUrls);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Simulate the processing flow
  useEffect(() => {
    if (isPaused || isComplete) return;

    // Start with sitemap crawling
    const simulateProcessing = async () => {
      // Step 1: Sitemap Crawling
      await simulateStage("sitemap-crawling", 5000, 30);

      // Step 2: Markdown Conversion
      await simulateStage("markdown-conversion", 10000, 60);

      // Step 3: Embedding Generation
      await simulateStage("embedding-generation", 8000, 45);

      // Complete
      setIsComplete(true);
      setTimeout(() => {
        onComplete();
      }, 1000);
    };

    simulateProcessing();
  }, [isPaused, isComplete, onComplete]);

  const simulateStage = async (
    stageId: string,
    duration: number,
    urlCount: number
  ) => {
    // Update current stage
    setStats((prev) => ({
      ...prev,
      currentStage: stageId as any,
    }));

    // Set stage to in-progress
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              status: "in-progress",
              totalItems: urlCount,
              estimatedTimeRemaining: duration / 1000,
            }
          : stage
      )
    );

    // Generate URLs for this stage if we don't have any yet
    if (urls.length === 0) {
      const newUrls: UrlStatus[] = [];
      const baseUrl = new URL(documentationUrl).origin;

      for (let i = 0; i < urlCount; i++) {
        newUrls.push({
          url: `${baseUrl}/docs/page-${i + 1}`,
          title: `Documentation Page ${i + 1}`,
          status: "pending",
          stage: null,
        });
      }

      setUrls(newUrls);
      setStats((prev) => ({
        ...prev,
        totalUrls: newUrls.length,
      }));
    }

    // Process URLs for this stage
    const urlsForStage = [...urls];
    let completedForStage = 0;
    const totalForStage = urlCount;
    const interval = 100; // Update every 100ms
    const incrementsPerUrl = duration / interval / totalForStage;

    for (let i = 0; i < totalForStage; i++) {
      // Check if we're paused
      if (isPaused) {
        i--; // Stay on the same index
        await new Promise((resolve) => setTimeout(resolve, 100));
        continue;
      }

      const urlIndex = i;
      urlsForStage[urlIndex] = {
        ...urlsForStage[urlIndex],
        status: "in-progress",
        stage: stageId as any,
      };

      setUrls([...urlsForStage]);

      // Simulate processing time for this URL
      const urlProcessingTime = Math.random() * 1000 + 500; // 500-1500ms
      await new Promise((resolve) => setTimeout(resolve, urlProcessingTime));

      // Randomly fail some URLs (5% chance)
      const shouldFail = Math.random() < 0.05;

      urlsForStage[urlIndex] = {
        ...urlsForStage[urlIndex],
        status: shouldFail ? "failed" : "complete",
        error: shouldFail ? "Failed to process URL" : undefined,
      };

      completedForStage++;

      // Update stages progress
      setStages((prev) =>
        prev.map((stage) =>
          stage.id === stageId
            ? {
                ...stage,
                completedItems: completedForStage,
                progress: Math.round((completedForStage / totalForStage) * 100),
                estimatedTimeRemaining:
                  ((totalForStage - completedForStage) * urlProcessingTime) /
                  1000,
              }
            : stage
        )
      );

      // Update overall stats
      setStats((prev) => {
        const processedUrls = prev.processedUrls + 1;
        const failedUrls = shouldFail ? prev.failedUrls + 1 : prev.failedUrls;
        const overallProgress = Math.round(
          (processedUrls / prev.totalUrls) * 100
        );

        return {
          ...prev,
          processedUrls,
          failedUrls,
          overallProgress,
          estimatedTimeRemaining:
            ((prev.totalUrls - processedUrls) * urlProcessingTime) / 1000,
        };
      });

      setUrls([...urlsForStage]);
    }

    // Mark stage as complete
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              status: "complete",
              progress: 100,
              estimatedTimeRemaining: null,
            }
          : stage
      )
    );
  };

  const handleRetry = (url: string) => {
    setUrls((prev) =>
      prev.map((item) =>
        item.url === url
          ? { ...item, status: "in-progress", error: undefined }
          : item
      )
    );

    // Simulate success after 1 second
    setTimeout(() => {
      setUrls((prev) =>
        prev.map((item) =>
          item.url === url ? { ...item, status: "complete" } : item
        )
      );

      // Update stats
      setStats((prev) => ({
        ...prev,
        processedUrls: prev.processedUrls + 1,
        failedUrls: prev.failedUrls - 1,
        overallProgress: Math.round(
          ((prev.processedUrls + 1) / prev.totalUrls) * 100
        ),
      }));
    }, 1000);
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const currentStageIndex = stages.findIndex(
    (stage) => stage.id === stats.currentStage
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button variant="ghost" onClick={onCancel} className="mb-2">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Processing Documentation</h1>
          <p className="text-muted-foreground">
            {new URL(documentationUrl).hostname}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-medium mb-4">Processing Stages</h2>
              <div className="space-y-4">
                {stages.map((stage, index) => (
                  <ProcessingStage
                    key={stage.id}
                    stage={stage}
                    isActive={
                      index === currentStageIndex &&
                      stage.status === "in-progress"
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <ProgressStats
            stats={stats}
            isPaused={isPaused}
            onPauseToggle={togglePause}
            onAbort={onCancel}
          />
        </div>

        <div className="lg:col-span-1">
          <UrlStatusList urls={urls} onRetry={handleRetry} maxHeight="600px" />
        </div>
      </div>
    </div>
  );
}
