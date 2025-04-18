import { UploadIcon, MessageSquareIcon, ZapIcon } from "lucide-react";

interface InteractionStepsProps {
  currentStep: number;
}

export function InteractionSteps({ currentStep }: InteractionStepsProps) {
  const steps = [
    {
      id: 1,
      title: "Add Documentation",
      description: "Upload a file or paste a URL",
      icon: UploadIcon,
    },
    {
      id: 2,
      title: "Ask a Question",
      description: "Inquire about the API documentation",
      icon: MessageSquareIcon,
    },
    {
      id: 3,
      title: "Explore the Answer",
      description: "View diagrams and navigate to relevant sections",
      icon: ZapIcon,
    },
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium mb-4">Interaction Steps</h3>
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = currentStep >= step.id;

          return (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                {index + 1}
              </div>
              <div>
                <h4
                  className={`text-sm font-medium ${isActive ? "" : "text-muted-foreground"}`}
                >
                  {step.title}
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
