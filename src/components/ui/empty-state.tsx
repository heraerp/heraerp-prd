'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Search, RefreshCw, Sparkles } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'search' | 'data' | 'error'
}

export function EmptyState({
  icon: Icon = Search,
  title,
  description,
  action,
  variant = 'search'
}: EmptyStateProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'search':
        return {
          iconColor: 'text-blue-500',
          iconBg: 'bg-blue-50 border-blue-200'
        }
      case 'data':
        return {
          iconColor: 'text-gray-500',
          iconBg: 'bg-gray-50 border-gray-200'
        }
      case 'error':
        return {
          iconColor: 'text-red-500',
          iconBg: 'bg-red-50 border-red-200'
        }
      default:
        return {
          iconColor: 'text-gray-500',
          iconBg: 'bg-gray-50 border-gray-200'
        }
    }
  }

  const styles = getVariantStyles()

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className={`w-20 h-20 rounded-2xl ${styles.iconBg} border-2 flex items-center justify-center mb-6 shadow-sm`}
      >
        <Icon className={`w-10 h-10 ${styles.iconColor}`} />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>

      <p className="text-gray-600 max-w-md mb-6 leading-relaxed">{description}</p>

      {action && (
        <Button
          onClick={action.onClick}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          {action.label}
        </Button>
      )}
    </div>
  )
}

// No Search Results Component
export function NoSearchResults({
  searchQuery,
  onClearSearch
}: {
  searchQuery: string
  onClearSearch: () => void
}) {
  return (
    <EmptyState
      icon={Search}
      title="No apps found"
      description={`We couldn't find any applications matching "${searchQuery}". Try adjusting your search or browse all available apps.`}
      action={{
        label: 'Clear Search',
        onClick: onClearSearch
      }}
      variant="search"
    />
  )
}

// Coming Soon Placeholder
export function ComingSoonState() {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border border-yellow-200 p-8 text-center">
      <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
        <Sparkles className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">More Apps Coming Soon</h3>
      <p className="text-gray-600 text-sm">
        We're constantly expanding our progressive app catalog. Check back soon for new industry
        solutions!
      </p>
    </div>
  )
}
