export type ProcessingStage =
  | "sitemap-crawling"
  | "markdown-conversion"
  | "embedding-generation";

export type ProcessingStatus =
  | "pending"
  | "in-progress"
  | "complete"
  | "failed";

export interface UrlStatus {
  url: string;
  title: string;
  status: ProcessingStatus;
  stage: ProcessingStage | null;
  error?: string;
}

export interface ProcessingStageInfo {
  id: ProcessingStage;
  title: string;
  description: string;
  icon: string;
  status: ProcessingStatus;
  progress: number;
  totalItems: number;
  completedItems: number;
  estimatedTimeRemaining: number | null;
}

export interface ProcessingStats {
  totalUrls: number;
  processedUrls: number;
  failedUrls: number;
  currentStage: ProcessingStage;
  overallProgress: number;
  estimatedTimeRemaining: number | null;
  startTime: Date;
}

export const INITIAL_PROCESSING_STAGES: ProcessingStageInfo[] = [
  {
    id: "sitemap-crawling",
    title: "Sitemap Crawling",
    description: "Discovering all documentation pages",
    icon: "✅",
    status: "pending",
    progress: 0,
    totalItems: 0,
    completedItems: 0,
    estimatedTimeRemaining: null,
  },
  {
    id: "markdown-conversion",
    title: "Markdown Conversion",
    description: "Converting HTML to structured markdown",
    icon: "✍️",
    status: "pending",
    progress: 0,
    totalItems: 0,
    completedItems: 0,
    estimatedTimeRemaining: null,
  },
  {
    id: "embedding-generation",
    title: "Embedding Generation",
    description: "Creating vector embeddings for AI retrieval",
    icon: "🧠",
    status: "pending",
    progress: 0,
    totalItems: 0,
    completedItems: 0,
    estimatedTimeRemaining: null,
  },
];

export const INITIAL_PROCESSING_STATS: ProcessingStats = {
  totalUrls: 0,
  processedUrls: 0,
  failedUrls: 0,
  currentStage: "sitemap-crawling",
  overallProgress: 0,
  estimatedTimeRemaining: null,
  startTime: new Date(),
};

export const SAMPLE_URLS: UrlStatus[] = [
  {
    url: "https://stripe.com/docs/api",
    title: "API Reference",
    status: "complete",
    stage: "sitemap-crawling",
  },
  {
    url: "https://stripe.com/docs/api/authentication",
    title: "Authentication",
    status: "complete",
    stage: "sitemap-crawling",
  },
  {
    url: "https://stripe.com/docs/api/charges",
    title: "Charges",
    status: "in-progress",
    stage: "markdown-conversion",
  },
  {
    url: "https://stripe.com/docs/api/customers",
    title: "Customers",
    status: "pending",
    stage: null,
  },
  {
    url: "https://stripe.com/docs/api/invoices",
    title: "Invoices",
    status: "failed",
    stage: "markdown-conversion",
    error: "Failed to convert page content",
  },
  {
    url: "https://stripe.com/docs/api/payment_intents",
    title: "Payment Intents",
    status: "pending",
    stage: null,
  },
  {
    url: "https://stripe.com/docs/api/payment_methods",
    title: "Payment Methods",
    status: "pending",
    stage: null,
  },
];

export const DOC_FACTS = [
  "Did you know? The first API documentation was created in the 1960s for IBM's mainframe systems.",
  "Well-documented APIs can reduce support tickets by up to 80%.",
  "The average developer spends 30% of their time reading documentation.",
  "OpenAPI (formerly Swagger) is the most widely used API documentation standard.",
  "Good documentation can reduce API onboarding time from days to hours.",
  "API documentation with examples is 300% more effective than text-only docs.",
  "The most common complaint about APIs is poor or outdated documentation.",
  "Interactive documentation can increase API adoption rates by up to 40%.",
  "DocDive uses AI to help you navigate even the most complex documentation.",
  "Vector embeddings allow DocDive to understand the semantic meaning of documentation.",
];
