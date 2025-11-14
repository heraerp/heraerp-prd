/**
 * LazyDashboardSection - Intersection observer loading for dashboard panels
 * Reduces initial load time by only fetching data when panels come into view
 */

'use client'

import React from 'react'
import { LazyPanelWithSkeleton } from '@/components/ui/LazyPanel'
import useSWR from 'swr'
import { bearerFetch } from '@/lib/api'

interface LazyDashboardSectionProps {
  sectionId: string
  endpoint: string
  children: (data: any, isLoading: boolean) => React.ReactNode
  skeletonHeight?: string
  skeletonClassName?: string
  className?: string
}

const fetcher = async (url: string) => {
  const response = await bearerFetch(url)
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }
  return response.json()
}

export function LazyDashboardSection({
  sectionId,
  endpoint,
  children,
  skeletonHeight = 'h-64',
  skeletonClassName = '',
  className = ''
}: LazyDashboardSectionProps) {
  const [shouldLoad, setShouldLoad] = useState(false)
  
  const { data, error, isLoading } = useSWR(
    shouldLoad ? endpoint : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  )

  const handleVisible = () => {
    setShouldLoad(true)
  }

  return (
    <LazyPanelWithSkeleton
      onVisible={handleVisible}
      skeletonHeight={skeletonHeight}
      skeletonClassName={skeletonClassName}
      className={className}
    >
      {shouldLoad ? children(data, isLoading || !data) : null}
    </LazyPanelWithSkeleton>
  )
}

/**
 * LazyRelationshipsSection - For relationship data with grouped API
 */
interface LazyRelationshipsSectionProps {
  organizationId: string
  relationshipTypes: string[]
  children: (data: any, isLoading: boolean) => React.ReactNode
  className?: string
}

export function LazyRelationshipsSection({
  organizationId,
  relationshipTypes,
  children,
  className = ''
}: LazyRelationshipsSectionProps) {
  const endpoint = `/api/v2/relationships/grouped?types=${relationshipTypes.join(',')}&limit=1000&include_items=true`
  
  return (
    <LazyDashboardSection
      sectionId="relationships"
      endpoint={endpoint}
      className={className}
      skeletonHeight="h-48"
    >
      {children}
    </LazyDashboardSection>
  )
}

/**
 * LazyAnalyticsSection - For heavy analytics with charts
 */
interface LazyAnalyticsSectionProps {
  organizationId: string
  period: string
  analyticsType: 'revenue' | 'appointments' | 'staff' | 'customers'
  children: (data: any, isLoading: boolean) => React.ReactNode
  className?: string
}

export function LazyAnalyticsSection({
  organizationId,
  period,
  analyticsType,
  children,
  className = ''
}: LazyAnalyticsSectionProps) {
  const endpoint = `/api/v2/analytics/${analyticsType}?organization_id=${organizationId}&period=${period}`
  
  return (
    <LazyDashboardSection
      sectionId={`analytics-${analyticsType}`}
      endpoint={endpoint}
      className={className}
      skeletonHeight="h-64"
    >
      {children}
    </LazyDashboardSection>
  )
}