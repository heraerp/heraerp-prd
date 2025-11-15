'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Activity,
  Calendar as CalendarIcon,
  Download,
  Printer,
  Mail,
  MessageSquare,
  Plus,
  Edit,
  Trash,
  Send,
  Eye
} from 'lucide-react'
import { useCommLogs } from '@/hooks/use-communications'
import { cn } from '@/lib/utils'

export function AuditLogList() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    event_type: [],
    entity_id: null,
    date_from: null,
    date_to: null
  })
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })

  const { data, isLoading } = useCommLogs(filters)

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('created')) return <Plus className="h-4 w-4" />
    if (eventType.includes('updated') || eventType.includes('edited'))
      return <Edit className="h-4 w-4" />
    if (eventType.includes('deleted')) return <Trash className="h-4 w-4" />
    if (eventType.includes('sent') || eventType.includes('delivered'))
      return <Send className="h-4 w-4" />
    if (eventType.includes('opened') || eventType.includes('clicked'))
      return <Eye className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  const getEventColor = (eventType: string): string => {
    if (eventType.includes('created')) return 'text-green-600 dark:text-green-400'
    if (eventType.includes('updated') || eventType.includes('edited'))
      return 'text-blue-600 dark:text-blue-400'
    if (eventType.includes('deleted')) return 'text-red-600 dark:text-red-400'
    if (eventType.includes('sent') || eventType.includes('delivered'))
      return 'text-purple-600 dark:text-purple-400'
    if (eventType.includes('opened') || eventType.includes('clicked'))
      return 'text-amber-600 dark:text-amber-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const formatEventType = (eventType: string): string => {
    return eventType
      .replace('comm_', '')
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handlePrint = () => {
    const params = new URLSearchParams()
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    if (filters.event_type?.length) params.set('event_type', filters.event_type.join(','))

    window.open(`/civicflow/communications/logs/print?${params.toString()}`, '_blank')
  }

  const handleExport = async () => {
    const params = new URLSearchParams()
    params.set('type', 'logs')
    params.set('format', 'csv')
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)

    const response = await fetch(`/api/civicflow/communications/export?${params.toString()}`)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `communication-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by event" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            <SelectItem value="template_created">Template Created</SelectItem>
            <SelectItem value="template_updated">Template Updated</SelectItem>
            <SelectItem value="audience_created">Audience Created</SelectItem>
            <SelectItem value="campaign_created">Campaign Created</SelectItem>
            <SelectItem value="campaign_sent">Campaign Sent</SelectItem>
            <SelectItem value="message_delivered">Message Delivered</SelectItem>
            <SelectItem value="message_opened">Message Opened</SelectItem>
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

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>User</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell>
                  <div
                    className={cn(
                      'flex items-center justify-center',
                      getEventColor(log.transaction_type)
                    )}
                  >
                    {getEventIcon(log.transaction_type)}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p>{format(new Date(log.created_at), 'MMM d, yyyy')}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), 'h:mm:ss a')}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{formatEventType(log.transaction_type)}</span>
                </TableCell>
                <TableCell>
                  {log.entity_name ? (
                    <div>
                      <p>{log.entity_name}</p>
                      <p className="text-sm text-muted-foreground">{log.entity_code}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <p className="text-sm truncate">
                    {log.metadata ? JSON.stringify(log.metadata) : '-'}
                  </p>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{log.created_by || 'System'}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
