'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useEmailCounts } from '@/hooks/civicflow/useEmails'
import {
  Inbox,
  Send,
  FileText,
  CheckCircle,
  Trash2,
  Settings,
  RefreshCw,
  Loader2,
  Mail,
  Clock,
  Archive
} from 'lucide-react'

export type EmailFolder = 'inbox' | 'outbox' | 'drafts' | 'sent' | 'trash'

interface EmailSidebarProps {
  currentFolder: EmailFolder
  onFolderChange: (folder: EmailFolder) => void
  organizationId: string
}

interface FolderConfig {
  id: EmailFolder
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  color: string
}

const folderConfigs: FolderConfig[] = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: Inbox,
    description: 'Received messages',
    color: 'text-blue-600'
  },
  {
    id: 'outbox',
    label: 'Outbox',
    icon: Clock,
    description: 'Queued to send',
    color: 'text-orange-600'
  },
  {
    id: 'drafts',
    label: 'Drafts',
    icon: FileText,
    description: 'Draft messages',
    color: 'text-gray-600'
  },
  {
    id: 'sent',
    label: 'Sent',
    icon: CheckCircle,
    description: 'Sent messages',
    color: 'text-green-600'
  },
  {
    id: 'trash',
    label: 'Trash',
    icon: Trash2,
    description: 'Deleted messages',
    color: 'text-red-600'
  }
]

export function EmailSidebar({ currentFolder, onFolderChange, organizationId }: EmailSidebarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {
    data: emailCounts,
    isLoading: countsLoading,
    refetch: refetchCounts
  } = useEmailCounts(organizationId)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetchCounts()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const getFolderCount = (folder: EmailFolder): number => {
    if (!emailCounts) return 0
    return emailCounts[folder] || 0
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <span className="font-semibold ink dark:text-gray-100">Email</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
          </Button>
        </div>

        {/* Organization Info */}
        <div className="text-xs text-muted-foreground">Multi-tenant email workspace</div>
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {folderConfigs.map(folder => {
            const Icon = folder.icon
            const count = getFolderCount(folder.id)
            const isActive = currentFolder === folder.id

            return (
              <Button
                key={folder.id}
                variant="ghost"
                className={cn(
                  'w-full justify-start h-auto p-3 text-left',
                  isActive && 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
                )}
                onClick={() => onFolderChange(folder.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-4 w-4 flex-shrink-0',
                        isActive ? 'text-blue-600' : folder.color
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{folder.label}</span>
                      <span className="text-xs text-muted-foreground">{folder.description}</span>
                    </div>
                  </div>

                  {/* Count Badge */}
                  {countsLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : count > 0 ? (
                    <Badge
                      variant={isActive ? 'default' : 'secondary'}
                      className={cn(
                        'ml-auto text-xs min-w-[20px] h-5',
                        isActive && 'bg-blue-600 text-white'
                      )}
                    >
                      {count > 99 ? '99+' : count}
                    </Badge>
                  ) : null}
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Archive className="h-4 w-4 mr-2" />
            Archive
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Connection Status */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Email Connectors</div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs">Resend (Outbound)</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-xs">Demo Mode (Inbound)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
