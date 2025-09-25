'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Mail, MessageSquare, Globe, Users, Eye, MousePointer, MoreVertical } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import type { Campaign } from '@/types/communications'

interface CampaignCardProps {
  campaign: Campaign
}

export function CampaignCard({ campaign }: CampaignCardProps) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary'
      case 'scheduled':
        return 'default'
      case 'running':
        return 'default'
      case 'paused':
        return 'outline'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const openRate =
    campaign.metrics.delivered > 0
      ? (campaign.metrics.opened / campaign.metrics.delivered) * 100
      : 0

  const clickRate =
    campaign.metrics.opened > 0 ? (campaign.metrics.clicked / campaign.metrics.opened) * 100 : 0

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => router.push(`/civicflow/communications/campaigns/${campaign.id}`)}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold">{campaign.entity_name}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                {getChannelIcon(campaign.channel)}
                <span className="capitalize">{campaign.channel}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{campaign.audience_size.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusColor(campaign.status)}>{campaign.status}</Badge>
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
                    router.push(`/civicflow/communications/campaigns/${campaign.id}`)
                  }}
                >
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={e => e.stopPropagation()}>Duplicate</DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={e => e.stopPropagation()}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {campaign.status !== 'draft' && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Delivery Progress</span>
                <span>
                  {campaign.metrics.sent} / {campaign.audience_size}
                </span>
              </div>
              <Progress
                value={(campaign.metrics.sent / campaign.audience_size) * 100}
                className="h-2"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span>Open Rate</span>
                </div>
                <p className="text-lg font-semibold">{openRate.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MousePointer className="h-3 w-3" />
                  <span>Click Rate</span>
                </div>
                <p className="text-lg font-semibold">{clickRate.toFixed(1)}%</p>
              </div>
            </div>
          </>
        )}

        {campaign.schedule_at && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">
              Scheduled for {format(new Date(campaign.schedule_at), 'MMM d, h:mm a')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
