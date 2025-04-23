import { Store } from "@tanstack/store";
import type { DocumentationPage } from "@/api/queries";

// Create a singleton store for markdown content
export const markdownStore = new Store({
  documentationPage: null as DocumentationPage | null,
  isLoading: false,
  error: null as Error | null,
  activeSection: null as string | null,
});

// Helper functions to update the store
export const setDocumentationPage = (documentationPage: DocumentationPage) => {
  markdownStore.setState((state) => ({
    ...state,
    documentationPage: documentationPage,
  }));
};

export const setLoading = (isLoading: boolean) => {
  markdownStore.setState((state) => ({
    ...state,
    isLoading,
  }));
};

export const setError = (error: Error | null) => {
  markdownStore.setState((state) => ({
    ...state,
    error,
  }));
};

export const setActiveSection = (activeSection: string | null) => {
  markdownStore.setState((state) => ({
    ...state,
    activeSection,
  }));
};
