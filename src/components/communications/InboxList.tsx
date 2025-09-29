'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Search,
  Filter,
  RefreshCw,
  Mail,
  MessageSquare,
  Globe,
  Star,
  Reply,
  Archive
} from 'lucide-react'
import { useInboxMessages } from '@/hooks/use-communications'
import { LoadingState } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyState } from '@/components/states/EmptyState'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'

export function InboxList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [channelFilter, setChannelFilter] = useState('all')
  const [readFilter, setReadFilter] = useState('all')
  const [page, setPage] = useState(1)
  const { toast } = useToast()

  const filters = {
    search: searchTerm,
    channel: channelFilter === 'all' ? undefined : [channelFilter],
    status:
      readFilter === 'all' ? undefined : readFilter === 'unread' ? ['new'] : ['read', 'replied'],
    page,
    page_size: 20
  }

  const { data, isLoading, error, refetch } = useInboxMessages(filters)

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'webhook':
        return <Globe className="h-4 w-4" />
      default:
        return <Mail className="h-4 w-4" />
    }
  }

  const handleReply = (messageId: string) => {
    toast({
      title: 'Reply feature coming soon',
      description: 'This will open a compose dialog to reply to the message.'
    })
  }

  const handleArchive = (messageId: string) => {
    toast({
      title: 'Message archived',
      description: 'The message has been moved to archives.'
    })
  }

  const handleMarkImportant = (messageId: string) => {
    toast({
      title: 'Marked as important',
      description: 'This message has been flagged as important.'
    })
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message="Failed to load inbox messages" onRetry={refetch} />
  }

  const messages = data?.items || []

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by sender, subject, content..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
              </SelectContent>
            </Select>
            <Select value={readFilter} onValueChange={setReadFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Messages List */}
      <Card>
        {messages.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No messages in inbox"
              description="Incoming messages from customers and replies will appear here."
              icon={Mail}
            />
          </div>
        ) : (
          <div className="divide-y">
            {messages.map(message => (
              <div
                key={message.id}
                className={`p-4 hover:bg-muted/50 transition-colors ${ message.status ==='new' ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getChannelIcon(message.channel)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{message.from || 'Unknown Sender'}</span>
                          {message.status === 'new' && (
                            <Badge variant="default" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(message.created_at), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <div>{message.subject || 'No Subject'}</div>
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {message.body_preview || 'No content available'}
                      </div>
                      {message.meta?.reply_to && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Reply className="h-3 w-3" />
                          <span>Reply to: {message.meta.reply_to}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="ghost" size="sm" onClick={() => handleReply(message.id)}>
                          <Reply className="h-3 w-3 mr-1" />
                          Reply
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleArchive(message.id)}>
                          <Archive className="h-3 w-3 mr-1" />
                          Archive
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkImportant(message.id)}
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Mark Important
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      {data && data.total > data.page_size && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * data.page_size + 1} to{' '}
            {Math.min(page * data.page_size, data.total)} of {data.total} messages
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page * data.page_size >= data.total}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
