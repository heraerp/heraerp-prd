'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  Plus,
  Search,
  Filter,
  Download,
  MoreVertical,
  MapPin,
  Globe,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { useEvents, useEventKPIs } from '@/hooks/use-events'
import { isDemoMode } from '@/lib/demo-guard'
import { DemoBanner } from '@/components/communications/DemoBanner'
import { Loading } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import { useToast } from '@/components/ui/use-toast'
import { NewEventModal } from '@/components/events/NewEventModal'
import type { EventFilters, EventType } from '@/types/events'

const EVENT_TYPE_LABELS: Record<EventType, string> = {
  webinar: 'Webinar',
  roundtable: 'Roundtable',
  conference: 'Conference',
  workshop: 'Workshop',
  meeting: 'Meeting',
  other: 'Other'
}

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  webinar: 'bg-blue-500',
  roundtable: 'bg-purple-500',
  conference: 'bg-green-500',
  workshop: 'bg-orange-500',
  meeting: 'bg-gray-500',
  other: 'bg-gray-400'
}

function EventsContent() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrgId } = useOrgStore()
  const isDemo = isDemoMode(currentOrgId)

  const [filters, setFilters] = useState<EventFilters>({
    status: 'upcoming',
    page: 1,
    page_size: 20
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showNewEventModal, setShowNewEventModal] = useState(false)

  // Queries
  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useEvents(filters)
  const { data: kpis, isLoading: kpisLoading } = useEventKPIs()

  const handleSearch = () => {
    setFilters({ ...filters, search: searchTerm, page: 1 })
  }

  const handleFilterChange = (key: keyof EventFilters, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 })
  }

  const getEventIcon = (event: any) => {
    if (event.is_online) return <Globe className="h-4 w-4" />
    if (event.is_hybrid) return <MapPin className="h-4 w-4" />
    return <MapPin className="h-4 w-4" />
  }

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) return 'upcoming'
    if (now > end) return 'past'
    return 'ongoing'
  }

  if (!currentOrgId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">No Organization Selected</h2>
          <p className="text-muted-foreground">Please select an organization to view events.</p>
        </div>
      </div>
    )
  }

  if (eventsError) {
    return (
      <div className="container mx-auto py-6">
        <ErrorState message="Failed to load events data" onRetry={() => window.location.reload()} />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {isDemo && <DemoBanner />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Events & Registrations</h1>
        <Button onClick={() => setShowNewEventModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {kpisLoading ? '-' : kpis?.total_events || 0}
              </span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {kpisLoading ? '-' : kpis?.upcoming_events || 0}
              </span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {kpisLoading ? '-' : kpis?.total_registrations || 0}
              </span>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attendance Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {kpisLoading ? '-' : `${Math.round(kpis?.avg_attendance_rate || 0)}%`}
              </span>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.status || 'upcoming'}
              onValueChange={value => handleFilterChange('status', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.event_type || 'all'}
              onValueChange={value =>
                handleFilterChange('event_type', value === 'all' ? undefined : value)
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Event Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={
                filters.is_online === true
                  ? 'online'
                  : filters.is_online === false
                    ? 'in-person'
                    : 'all'
              }
              onValueChange={value =>
                handleFilterChange(
                  'is_online',
                  value === 'online' ? true : value === 'in-person' ? false : undefined
                )
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="in-person">In-Person</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleSearch}>
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Events</CardTitle>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <Loading />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Registrations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eventsData?.items.map(event => {
                  const status = getEventStatus(event.start_datetime, event.end_datetime)

                  return (
                    <TableRow
                      key={event.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/civicflow/events/${event.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <p>{event.entity_name}</p>
                          {event.host_program_name && (
                            <p className="text-sm text-muted-foreground">
                              {event.host_program_name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={EVENT_TYPE_COLORS[event.event_type]}>
                          {EVENT_TYPE_LABELS[event.event_type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <div>
                            <p>{format(new Date(event.start_datetime), 'MMM d, yyyy')}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(event.start_datetime), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventIcon(event)}
                          <span>{event.is_online ? 'Online' : event.venue_name || 'TBD'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>0</span>
                          {event.capacity && (
                            <span className="text-sm text-muted-foreground">
                              / {event.capacity}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            status === 'upcoming'
                              ? 'default'
                              : status === 'ongoing'
                                ? 'destructive'
                                : 'secondary'
                          }
                        >
                          {status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
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
                                router.push(`/civicflow/events/${event.id}`)
                              }}
                            >
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={e => {
                                e.stopPropagation()
                                router.push(`/civicflow/events/${event.id}?tab=registrations`)
                              }}
                            >
                              Manage Registrations
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={e => {
                                e.stopPropagation()
                                toast({ title: 'Export started' })
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {eventsData && eventsData.total > filters.page_size! && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(filters.page! - 1) * filters.page_size! + 1} to{' '}
                {Math.min(filters.page! * filters.page_size!, eventsData.total)} of{' '}
                {eventsData.total} events
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
                  disabled={filters.page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
                  disabled={filters.page! * filters.page_size! >= eventsData.total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Event Modal */}
      <NewEventModal
        open={showNewEventModal}
        onOpenChange={setShowNewEventModal}
        onSuccess={() => {
          toast({ title: 'Event created successfully' })
          setShowNewEventModal(false)
        }}
      />
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto">Loading...</div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  )
}
