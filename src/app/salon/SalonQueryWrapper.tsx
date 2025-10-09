'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Create a global query client that persists across navigation
let globalSalonQueryClient: QueryClient | null = null

const getOrCreateSalonQueryClient = () => {
  if (!globalSalonQueryClient) {
    globalSalonQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Cache for 10 minutes to prevent reloading
          staleTime: 10 * 60 * 1000,
          // Keep in cache for 30 minutes
          gcTime: 30 * 60 * 1000,
          // Don't refetch on window focus
          refetchOnWindowFocus: false,
          // Don't refetch on mount if we have cached data
          refetchOnMount: false,
          // Retry failed requests
          retry: 2
        }
      }
    })
  }
  return globalSalonQueryClient
}

interface SalonQueryWrapperProps {
  children: React.ReactNode
}

export function SalonQueryWrapper({ children }: SalonQueryWrapperProps) {
  // Use the persistent query client
  const queryClient = getOrCreateSalonQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
