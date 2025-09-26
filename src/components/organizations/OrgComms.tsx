import { useState } from 'react'
import { useOrgComms } from '@/hooks/use-organizations'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Mail, Phone, Send, AlertCircle, Calendar, User, Filter } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface OrgCommsProps {
  organizationId: string
}

export default function OrgComms({ organizationId }: OrgCommsProps) {
  const [filterChannel, setFilterChannel] = useState<string>('all')
  const [filterDirection, setFilterDirection] = useState<string>('all')
  const { currentOrgId } = useOrgStore()
  const { data, isLoading, error } = useOrgComms(organizationId, {
    channel: filterChannel !== 'all' ? filterChannel : undefined,
    direction: filterDirection !== 'all' ? filterDirection : undefined
  })

  if (isLoading) {
    return <CommsSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load communication history. Please try again.</AlertDescription>
      </Alert>
    )
  }

  const channelIcons = {
    email: Mail,
    sms: MessageSquare,
    phone: Phone,
    whatsapp: MessageSquare,
    letter: Send
  }

  const channelColors = {
    email: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    sms: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    phone: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    whatsapp: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
    letter: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400'
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{data?.summary.total_messages}</p>
              </div>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold">{data?.summary.sent_count}</p>
              </div>
              <Send className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Received</p>
                <p className="text-2xl font-bold">{data?.summary.received_count}</p>
              </div>
              <Mail className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Last 30 Days</p>
                <p className="text-2xl font-bold">{data?.summary.last_30_days}</p>
              </div>
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Feed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Communication History ({data?.total || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterDirection} onValueChange={setFilterDirection}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All directions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All directions</SelectItem>
                  <SelectItem value="outbound">Sent</SelectItem>
                  <SelectItem value="inbound">Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data?.data && data.data.length > 0 ? (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {data.data.map(comm => {
                  const ChannelIcon =
                    channelIcons[comm.channel as keyof typeof channelIcons] || MessageSquare

                  return (
                    <div
                      key={comm.id}
                      className={cn(
                        'p-4 rounded-lg border',
                        comm.direction === 'inbound'
                          ? 'border-l-4 border-l-green-500'
                          : 'border-l-4 border-l-blue-500'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'p-2 rounded-lg',
                              channelColors[comm.channel as keyof typeof channelColors]
                            )}
                          >
                            <ChannelIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{comm.subject || 'No subject'}</p>
                              <Badge variant="outline" className="text-xs capitalize">
                                {comm.channel}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs',
                                  comm.direction === 'inbound' ? 'text-green-600' : 'text-blue-600'
                                )}
                              >
                                {comm.direction === 'inbound' ? 'Received' : 'Sent'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(comm.communication_date), 'MMM d, yyyy h:mm a')}{' '}
                              {'\u2022'}
                              {formatDistanceToNow(new Date(comm.communication_date), {
                                addSuffix: true
                              })}
                            </p>
                          </div>
                        </div>
                      </div>

                      {comm.content && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                          {comm.content}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          {comm.from_user && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>From: {comm.from_user}</span>
                            </div>
                          )}
                          {comm.to_recipients && comm.to_recipients.length > 0 && (
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              <span>
                                To: {comm.to_recipients.slice(0, 2).join(', ')}
                                {comm.to_recipients.length > 2 &&
                                  ` +${comm.to_recipients.length - 2} more`}
                              </span>
                            </div>
                          )}
                        </div>
                        {comm.tags && comm.tags.length > 0 && (
                          <div className="flex gap-1">
                            {comm.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No communications found</p>
              <p className="text-sm text-muted-foreground">
                Email, SMS, and other communications will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CommsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
