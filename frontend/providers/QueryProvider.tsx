'use client';

/**
 * React Query Provider
 *
 * Wraps the application with QueryClientProvider to enable React Query functionality
 */

import React, { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * QueryProvider Component
 *
 * Provides React Query context to the entire application
 * Includes React Query DevTools in development mode for debugging
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Only show DevTools in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
