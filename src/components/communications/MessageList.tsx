'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Search,
  Calendar as CalendarIcon,
  Mail,
  MessageSquare,
  Globe,
  Send,
  Check,
  X,
  AlertCircle,
  Eye,
  Clock,
  Download,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react'
import { useOutboxMessages, useInboxMessages } from '@/hooks/use-communications'
import { Message } from '@/types/communications'
import { cn } from '@/lib/utils'

interface MessageListProps {
  direction: 'in' | 'out'
}

export function MessageList({ direction }: MessageListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    channel: [],
    status: [],
    date_from: null,
    date_to: null
  })
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })

  const useMessages = direction === 'out' ? useOutboxMessages : useInboxMessages
  const { data, isLoading } = useMessages({
    q: searchQuery,
    ...filters
  })

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4" />
      case 'delivered':
        return <Check className="h-4 w-4" />
      case 'opened':
        return <Eye className="h-4 w-4" />
      case 'failed':
        return <X className="h-4 w-4" />
      case 'bounced':
        return <AlertCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      sent: 'secondary',
      delivered: 'default',
      opened: 'default',
      failed: 'destructive',
      bounced: 'destructive',
      pending: 'outline',
      received: 'default'
    }

    return (
      <Badge variant={variants[status] || 'secondary'} className="flex items-center gap-1">
        {getStatusIcon(status)}
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {direction === 'out' ? (
              <>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="opened">Opened</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="bounced">Bounced</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="received">Received</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                  </>
                ) : (
                  format(dateRange.from, 'LLL dd, y')
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Messages
        </Button>
      </div>

      {/* Message Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                {direction === 'out' ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownLeft className="h-4 w-4" />
                )}
              </TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>{direction === 'out' ? 'Recipient' : 'Sender'}</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((message: Message) => (
              <TableRow key={message.id}>
                <TableCell>
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      message.status === 'failed' || message.status === 'bounced'
                        ? 'bg-destructive'
                        : 'bg-primary'
                    )}
                  />
                </TableCell>
                <TableCell>
                  <div className="max-w-[300px]">
                    {message.subject && <p className="font-medium truncate">{message.subject}</p>}
                    <p className="text-sm text-muted-foreground truncate">
                      {message.body_text || 'No preview available'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getChannelIcon(message.channel)}
                    <span className="capitalize">{message.channel}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="truncate">
                      {direction === 'out' ? message.recipient : message.sender}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {message.campaign_name ? (
                    <p className="text-sm">{message.campaign_name}</p>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(message.status)}</TableCell>
                <TableCell>
                  <div>
                    <p>{format(new Date(message.created_at), 'MMM d')}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(message.created_at), 'h:mm a')}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
