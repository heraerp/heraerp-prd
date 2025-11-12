'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// ✅ OPTIMIZED: Create a client with performance-focused defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 5 minutes (reduces unnecessary refetches)
      staleTime: 5 * 60 * 1000, // 5 minutes
      // Keep data in cache for 10 minutes after last use
      gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
      // Don't refetch on window focus (reduces API calls for booking pages)
      refetchOnWindowFocus: false,
      // Don't refetch on component mount if data is already cached
      refetchOnMount: false,
      // Retry failed queries 1 time (instead of default 3)
      retry: 1,
      // Shorter retry delay for better UX
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
})

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
