'use client'

import React from 'react'
import { Play, Clock, CheckCircle, Archive, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlaybookActions } from './PlaybookActions'
import type { PlaybookListItem } from '@/types/playbooks'

interface PlaybookCardProps {
  playbook: PlaybookListItem
  onClick: () => void
}

export function PlaybookCard({ playbook, onClick }: PlaybookCardProps) {
  const statusConfig = {
    active: {
      label: 'Active',
      variant: 'default' as const,
      icon: Play,
      className: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    draft: {
      label: 'Draft',
      variant: 'secondary' as const,
      icon: FileText,
      className: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    archived: {
      label: 'Archived',
      variant: 'outline' as const,
      icon: Archive,
      className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
    }
  }

  const categoryConfig = {
    constituent: { label: 'Constituent Services', color: 'text-blue-600' },
    grants: { label: 'Grants Management', color: 'text-green-600' },
    service: { label: 'Service Delivery', color: 'text-purple-600' },
    case: { label: 'Case Management', color: 'text-orange-600' },
    outreach: { label: 'Outreach', color: 'text-pink-600' }
  }

  const status = statusConfig[playbook.status]
  const category = categoryConfig[playbook.category]
  const StatusIcon = status.icon

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 pr-2">
            <CardTitle className="text-lg line-clamp-1">{playbook.name}</CardTitle>
            {category && (
              <p className={`text-sm font-medium ${category.color}`}>{category.label}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={status.className}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {status.label}
            </Badge>
            <div onClick={e => e.stopPropagation()}>
              <PlaybookActions playbookId={playbook.id} status={playbook.status} />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Description */}
          {playbook.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{playbook.description}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{playbook.steps_count} steps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{playbook.total_runs || 0} runs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{playbook.success_rate || 0}%</span>
            </div>
          </div>

          {/* Last Run Info */}
          {playbook.last_run_at && (
            <div className="pt-2 border-t">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Last run: {new Date(playbook.last_run_at).toLocaleDateString()}</span>
              </div>
            </div>
          )}

          {/* Services/Programs Tags */}
          {playbook.services && playbook.services.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-2">
              {playbook.services.slice(0, 2).map(service => (
                <Badge key={service.id} variant="outline" className="text-xs">
                  {service.name}
                </Badge>
              ))}
              {playbook.services.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{playbook.services.length - 2} more
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
