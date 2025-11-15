/**
 * HERA UIKit - DetailTabs
 * Generic tabbed detail layout
 */

'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import type { TabConfig } from '@/lib/ui-binder/types'

interface DetailTabsProps {
  tabs: TabConfig[]
  defaultTab?: string
  onTabChange?: (tabKey: string) => void
  className?: string
}

export function DetailTabs({ tabs, defaultTab, onTabChange, className = '' }: DetailTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.key || '')

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey)
    onTabChange?.(tabKey)
  }

  if (tabs.length === 0) {
    return <div className={`p-6 text-center text-gray-500 ${className}`}>No tabs configured</div>
  }

  if (tabs.length === 1) {
    // Single tab - render without tab interface
    const tab = tabs[0]
    const Component = tab.component
    return (
      <div className={className}>
        <Component {...(tab.props || {})} />
      </div>
    )
  }

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-auto">
          {tabs.map(tab => (
            <TabsTrigger key={tab.key} value={tab.key} className="flex items-center space-x-2">
              <span>{tab.label}</span>
              {tab.props?.badge && (
                <Badge variant="secondary" className="ml-1">
                  {tab.props.badge}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map(tab => {
          const Component = tab.component
          return (
            <TabsContent key={tab.key} value={tab.key} className="mt-6">
              <Component {...(tab.props || {})} />
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}

// Helper components for common tab content

/**
 * Generic data display tab
 */
export function DataTab({
  title,
  data,
  loading = false
}: {
  title?: string
  data: Array<{ label: string; value: any; formatter?: (value: any) => React.ReactNode }>
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {title && <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</p>
            <div className="text-sm text-gray-900 dark:text-gray-100">
              {item.formatter ? item.formatter(item.value) : item.value || '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Empty state tab
 */
export function EmptyTab({
  title = 'No Data',
  description = 'No information available to display.',
  icon
}: {
  title?: string
  description?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="text-center py-12">
      {icon && <div className="mx-auto h-12 w-12 text-gray-400 mb-4">{icon}</div>}
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  )
}

/**
 * Loading state tab
 */
export function LoadingTab({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  )
}

// Pre-built tab configurations
export const DetailTabPresets = {
  /**
   * Create a data display tab
   */
  dataTab: (
    key: string,
    label: string,
    data: Array<{ label: string; value: any; formatter?: (value: any) => React.ReactNode }>,
    options?: { title?: string; badge?: string }
  ): TabConfig => ({
    key,
    label,
    component: DataTab,
    props: {
      title: options?.title,
      data,
      badge: options?.badge
    }
  }),

  /**
   * Create an empty state tab
   */
  emptyTab: (
    key: string,
    label: string,
    options?: { title?: string; description?: string; icon?: React.ReactNode }
  ): TabConfig => ({
    key,
    label,
    component: EmptyTab,
    props: options
  }),

  /**
   * Create a loading tab
   */
  loadingTab: (key: string, label: string, message?: string): TabConfig => ({
    key,
    label,
    component: LoadingTab,
    props: { message }
  })
}
