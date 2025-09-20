'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { onOrgChange, offOrgChange } from '@/lib/api-client'
import type { OrgId } from '@/types/common'

// Create a stable query client instance
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000 // 5 minutes
      }
    }
  })
}

let browserQueryClient: QueryClient | undefined = undefined

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient()
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient()
    return browserQueryClient
  }
}

function OrgChangeListener({ queryClient }: { queryClient: QueryClient }) {
  useEffect(() => {
    const handleOrgChange = (orgId: OrgId | null) => {
      console.log('[OrgChangeListener] Organization changed to:', orgId)

      // Clear all cached data
      queryClient.clear()

      // Invalidate all queries to trigger refetch with new org context
      queryClient.invalidateQueries()

      // Optionally refetch active queries immediately
      queryClient.refetchQueries({ type: 'active' })
    }

    // Subscribe to organization changes
    onOrgChange(handleOrgChange)

    // Cleanup subscription on unmount
    return () => {
      offOrgChange(handleOrgChange)
    }
  }, [queryClient])

  return null // This component doesn't render anything
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <OrgChangeListener queryClient={queryClient} />
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
