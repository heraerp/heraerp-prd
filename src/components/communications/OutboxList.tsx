'use client'

import React from 'react'
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
  MoreHorizontal,
  Send,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useOutbox, useRetryFailed } from '@/hooks/use-communications'
import { LoadingState } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyState } from '@/components/states/EmptyState'
import { format } from 'date-fns'

export function OutboxList() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filters = {
    search: searchTerm,
    status: statusFilter === 'all' ? undefined : [statusFilter],
    page,
    page_size: 20
  }

  const { data, isLoading, error, refetch } = useOutbox(filters)
  const retryMutation = useRetryFailed()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-3 w-3 text-green-600" />
      case 'failed':
      case 'bounced':
        return <XCircle className="h-3 w-3 text-red-600" />
      case 'queued':
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-600" />
      case 'sending':
        return <Send className="h-3 w-3 text-blue-600" />
      default:
        return <AlertCircle className="h-3 w-3 ink-muted" />
    }
  }

  const getStatusColor = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'secondary'
      case 'failed':
      case 'bounced':
        return 'destructive'
      case 'sending':
        return 'default'
      default:
        return 'outline'
    }
  }

  const handleRetry = (messageId: string) => {
    retryMutation.mutate({ message_id: messageId })
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message="Failed to load outbox messages" onRetry={refetch} />
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
                placeholder="Search by recipient, subject..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="sending">Sending</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Messages Table */}
      <Card>
        {messages.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No messages in outbox"
              description="Messages that are queued or sent will appear here."
              icon={Send}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Subject/Preview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map(message => (
                <TableRow key={message.id}>
                  <TableCell className="text-sm">
                    {format(new Date(message.created_at), 'MMM d, h:mm a')}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{message.to || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {message.channel}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate">
                      {message.subject || message.body_preview || 'No preview available'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(message.status)}
                      <Badge variant={getStatusColor(message.status)} className="capitalize">
                        {message.status}
                      </Badge>
                    </div>
                    {message.error && (
                      <div className="text-xs text-red-600 mt-1">{message.error}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {message.campaign_name ? (
                      <Badge variant="secondary">{message.campaign_name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {message.status === 'failed' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRetry(message.id)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Retry Send
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
