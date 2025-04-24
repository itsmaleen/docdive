import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default stale time of 5 minutes
      staleTime: 1000 * 60 * 5,
      // Keep unused data in cache for 24 hours
      gcTime: 1000 * 60 * 60 * 24,
      // Retry failed requests 3 times
      retry: 3,
      // Refetch on window focus
      refetchOnWindowFocus: true,
    },
    mutations: {
      // Retry failed mutations 3 times
      retry: 3,
    },
  },
});

export function getContext() {
  return {
    queryClient,
  };
}

export function Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
