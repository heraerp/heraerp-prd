'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, MessageSquare, Globe, Code, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import type { Template } from '@/types/communications'

interface TemplateCardProps {
  template: Template
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter()

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'webhook':
        return <Globe className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/civicflow/communications/templates/${template.id}`)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold">{template.entity_name}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {getChannelIcon(template.channel)}
                <span className="capitalize">{template.channel}</span>
              </div>
              <Badge variant="outline">v{template.version}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={template.is_active ? 'default' : 'secondary'}>
              {template.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation()
                    router.push(`/civicflow/communications/templates/${template.id}`)
                  }}
                >
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={e => e.stopPropagation()}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={e => e.stopPropagation()}>Clone</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={e => e.stopPropagation()}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {template.channel === 'email' && template.subject && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Subject</p>
            <p className="text-sm truncate">{template.subject}</p>
          </div>
        )}

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Preview</p>
          <p className="text-sm line-clamp-2">{template.body_text || 'No content'}</p>
        </div>

        {template.variables && template.variables.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Code className="h-3 w-3" />
            <span>{template.variables.length} variables</span>
          </div>
        )}

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Updated {format(new Date(template.updated_at), 'MMM d, yyyy')}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
