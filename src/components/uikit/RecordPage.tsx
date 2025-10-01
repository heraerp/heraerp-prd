/**
 * HERA UIKit - RecordPage
 * Generic record detail page layout
 */

'use client'

import { ArrowLeft, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface RecordPageProps {
  title: string
  subtitle?: string
  metadata?: Array<{
    label: string
    value: string | number | React.ReactNode
    highlight?: boolean
  }>
  actions?: Array<{
    key: string
    label: string
    icon?: React.ReactNode
    variant?: 'default' | 'destructive' | 'outline' | 'secondary'
    onClick: () => void
  }>
  onBack?: () => void
  loading?: boolean
  error?: string
  children: React.ReactNode
  className?: string
}

export function RecordPage({
  title,
  subtitle,
  metadata = [],
  actions = [],
  onBack,
  loading = false,
  error,
  children,
  className = ''
}: RecordPageProps) {
  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="flex items-center space-x-4 mb-6">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
            Error Loading Record
          </h3>
          <p className="text-red-600 dark:text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  const primaryActions = actions.filter(action => action.key !== 'more')
  const moreActions = actions.filter(action => action.key === 'more')

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
              {subtitle && <p className="text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
            </div>
          </div>

          {actions.length > 0 && (
            <div className="flex items-center space-x-2">
              {primaryActions.map(action => (
                <Button
                  key={action.key}
                  variant={action.variant || 'default'}
                  size="sm"
                  onClick={action.onClick}
                  className="flex items-center space-x-2"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </Button>
              ))}

              {moreActions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {moreActions.map(action => (
                      <DropdownMenuItem
                        key={action.key}
                        onClick={action.onClick}
                        className="flex items-center space-x-2"
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>

        {/* Metadata */}
        {metadata.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metadata.map((item, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {item.label}
                  </p>
                  <p
                    className={`text-sm ${
                      item.highlight
                        ? 'font-medium text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="p-6">{children}</div>
    </div>
  )
}

// Predefined action helpers
export const RecordPageActions = {
  edit: (onClick: () => void) => ({
    key: 'edit',
    label: 'Edit',
    icon: <Edit className="h-4 w-4" />,
    variant: 'outline' as const,
    onClick
  }),

  delete: (onClick: () => void) => ({
    key: 'delete',
    label: 'Delete',
    icon: <Trash2 className="h-4 w-4" />,
    variant: 'destructive' as const,
    onClick
  })
}
