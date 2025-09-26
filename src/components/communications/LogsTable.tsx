'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Download,
  Printer,
  Calendar,
  Activity,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { useCommLogs } from '@/hooks/use-communications'
import { LoadingState } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyState } from '@/components/states/EmptyState'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/use-toast'

export function LogsTable() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [dateRange, setDateRange] = useState('7days')
  const [page, setPage] = useState(1)

  // Calculate date range
  const getDateRange = () => {
    const endDate = new Date()
    let startDate = new Date()

    switch (dateRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'yesterday':
        startDate.setDate(startDate.getDate() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate.setDate(endDate.getDate() - 1)
        endDate.setHours(23, 59, 59, 999)
        break
      case '7days':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30days':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90days':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    return {
      date_from: format(startDate, 'yyyy-MM-dd'),
      date_to: format(endDate, 'yyyy-MM-dd')
    }
  }

  const filters = {
    search: searchTerm,
    event_type: eventFilter === 'all' ? undefined : [eventFilter],
    page,
    page_size: 50,
    ...getDateRange()
  }

  const { data, isLoading, error, refetch } = useCommLogs(filters)

  const getEventIcon = (eventType: string) => {
    if (eventType?.includes('sent') || eventType?.includes('delivered')) {
      return <CheckCircle className="h-3 w-3 text-green-600" />
    }
    if (
      eventType?.includes('failed') ||
      eventType?.includes('error') ||
      eventType?.includes('bounce')
    ) {
      return <XCircle className="h-3 w-3 text-red-600" />
    }
    if (eventType?.includes('pending') || eventType?.includes('queue')) {
      return <Clock className="h-3 w-3 text-yellow-600" />
    }
    return <Activity className="h-3 w-3 text-blue-600" />
  }

  const getEventColor = (
    eventType: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (eventType?.includes('sent') || eventType?.includes('delivered')) {
      return 'secondary'
    }
    if (
      eventType?.includes('failed') ||
      eventType?.includes('error') ||
      eventType?.includes('bounce')
    ) {
      return 'destructive'
    }
    return 'outline'
  }

  const handleExport = () => {
    toast({
      title: 'Export started',
      description: 'Your log export is being prepared. This may take a few moments.'
    })
  }

  const handlePrint = () => {
    const queryParams = new URLSearchParams(filters as any)
    router.push(`/civicflow/communications/logs/print?${queryParams}`)
  }

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState message="Failed to load communication logs" onRetry={refetch} />
  }

  const logs = data?.items || []

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="message_sent">Message Sent</SelectItem>
                <SelectItem value="message_delivered">Delivered</SelectItem>
                <SelectItem value="message_failed">Failed</SelectItem>
                <SelectItem value="message_bounced">Bounced</SelectItem>
                <SelectItem value="campaign_scheduled">Campaign Scheduled</SelectItem>
                <SelectItem value="campaign_started">Campaign Started</SelectItem>
                <SelectItem value="campaign_completed">Campaign Completed</SelectItem>
                <SelectItem value="template_created">Template Created</SelectItem>
                <SelectItem value="audience_created">Audience Created</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </Card>

      {/* Logs Table */}
      <Card>
        {logs.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No logs found"
              description="Communication activity logs will appear here."
              icon={FileText}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm font-mono">
                    {format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {getEventIcon(log.transaction_type)}
                      <Badge
                        variant={getEventColor(log.transaction_type)}
                        className="capitalize text-xs"
                      >
                        {log.transaction_type?.replace(/_/g, ' ') || 'unknown'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{log.entity_name || '-'}</div>
                      {log.entity_code && (
                        <div className="text-xs text-muted-foreground">{log.entity_code}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="text-sm space-y-1">
                      {log.metadata?.recipient && <div>To: {log.metadata.recipient}</div>}
                      {log.metadata?.channel && (
                        <Badge variant="outline" className="text-xs">
                          {log.metadata.channel}
                        </Badge>
                      )}
                      {log.metadata?.error_message && (
                        <div className="text-red-600 text-xs flex items-start gap-1">
                          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{log.metadata.error_message}</span>
                        </div>
                      )}
                      {log.smart_code && (
                        <div className="text-xs text-muted-foreground font-mono">
                          {log.smart_code}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{log.created_by || 'System'}</TableCell>
                  <TableCell className="text-sm">
                    {log.metadata?.duration_ms ? (
                      <span className="font-mono">{log.metadata.duration_ms}ms</span>
                    ) : (
                      '-'
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
            {Math.min(page * data.page_size, data.total)} of {data.total} logs
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
