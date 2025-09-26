import { useState } from 'react'
import { useOrgEvents } from '@/hooks/use-organizations'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  ExternalLink,
  Filter,
  TrendingUp
} from 'lucide-react'
import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface OrgEventsProps {
  organizationId: string
}

export default function OrgEvents({ organizationId }: OrgEventsProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const { currentOrgId } = useOrgStore()
  const { data, isLoading, error } = useOrgEvents(organizationId, {
    status: filterStatus !== 'all' ? filterStatus : undefined,
    event_type: filterType !== 'all' ? filterType : undefined
  })

  if (isLoading) {
    return <EventsSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load events data. Please try again.</AlertDescription>
      </Alert>
    )
  }

  const statusColors = {
    invited: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    registered: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    attended: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    no_show: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  const eventTypeColors = {
    workshop: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    conference: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    webinar: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    networking: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    training: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  const getEventTimeLabel = (eventDate: string) => {
    const date = new Date(eventDate)
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    if (isPast(date)) return 'Past event'
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const getEventTimeColor = (eventDate: string) => {
    const date = new Date(eventDate)
    if (isToday(date)) return 'text-green-600 font-medium'
    if (isTomorrow(date)) return 'text-blue-600 font-medium'
    if (isPast(date)) return 'text-muted-foreground'
    return 'text-foreground'
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invitations</p>
                <p className="text-2xl font-bold">{data?.summary.total_invited}</p>
              </div>
              <Calendar className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Events Attended</p>
                <p className="text-2xl font-bold">{data?.summary.total_attended}</p>
              </div>
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold">{data?.summary.attendance_rate}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Events</p>
                <p className="text-2xl font-bold">{data?.summary.upcoming_count}</p>
              </div>
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Participation ({data?.total || 0})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="invited">Invited</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="attended">Attended</SelectItem>
                  <SelectItem value="no_show">No show</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data?.data && data.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map(event => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{event.event_name}</p>
                        <p className="text-xs text-muted-foreground">{event.event_code}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'capitalize',
                          eventTypeColors[event.event_type as keyof typeof eventTypeColors]
                        )}
                      >
                        {event.event_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-sm">
                          {format(new Date(event.event_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.event_date), 'h:mm a')}
                        </p>
                        <p className={cn('text-xs', getEventTimeColor(event.event_date))}>
                          {getEventTimeLabel(event.event_date)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.location ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                      ) : event.is_virtual ? (
                        <Badge variant="secondary">Virtual</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          'capitalize',
                          statusColors[event.status as keyof typeof statusColors]
                        )}
                      >
                        {event.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {event.event_entity_id && (
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`/civicflow/events/${event.event_entity_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View
                            <ExternalLink className="ml-1 h-3 w-3" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No events found</p>
              <p className="text-sm text-muted-foreground">
                Event invitations and attendance will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function EventsSkeleton() {
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
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
