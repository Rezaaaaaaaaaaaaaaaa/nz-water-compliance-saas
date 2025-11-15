/**
 * React Query Client Configuration
 *
 * Configures the QueryClient with optimal settings for the NZ Water Compliance SaaS
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Create and configure the React Query client
 *
 * Configuration:
 * - 5 minute stale time: Data is considered fresh for 5 minutes
 * - 10 minute cache time: Inactive data stays in cache for 10 minutes
 * - No refetch on window focus: Prevents unnecessary refetches when users switch tabs
 * - Retry logic: Failed requests retry up to 3 times with exponential backoff
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Inactive queries are garbage collected after 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Disable automatic refetching on window focus
      // Users can manually refetch if needed
      refetchOnWindowFocus: false,

      // Retry failed requests up to 3 times
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }

        // Retry up to 3 times for other errors (5xx, network issues)
        return failureCount < 3;
      },

      // Exponential backoff for retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,

      // Exponential backoff for mutation retries
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
