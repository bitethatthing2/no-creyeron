'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

// Optimized query client configuration for Wolfpack Feed
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache feed data for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep cached data for 10 minutes after becoming stale
        gcTime: 10 * 60 * 1000,
        // Retry failed requests 2 times with exponential backoff
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Don't refetch on window focus for better UX (users scrolling through feed)
        refetchOnWindowFocus: false,
        // Refetch on reconnect to get latest data
        refetchOnReconnect: true,
        // Background refetch every 10 minutes for active queries
        refetchInterval: 10 * 60 * 1000,
        // Only background refetch when window is focused
        refetchIntervalInBackground: false,
      },
      mutations: {
        // Retry mutations once
        retry: 1,
        // Shorter retry delay for mutations (user actions)
        retryDelay: 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // Safe error boundary for QueryProvider
  try {
    const queryClient = getQueryClient();

    return (
      <QueryClientProvider client={queryClient}>
        {children}
        {/* DevTools temporarily disabled for debugging */}
      </QueryClientProvider>
    );
  } catch (error) {
    // Fallback if React Query fails - don't break the app
    console.warn('QueryProvider failed to initialize, falling back to children only:', error);
    return <>{children}</>;
  }
}