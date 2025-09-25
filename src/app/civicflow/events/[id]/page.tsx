'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useOrgStore } from '@/state/org';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  UserPlus,
  Download,
  Edit,
  Share,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle,
  QrCode,
} from 'lucide-react';
import { format } from 'date-fns';
import { 
  useEvent, 
  useEventStats, 
  useEventInvites,
  useUpdateEvent,
  useSendInvitations,
  useRecordCheckin,
  useExportEvent,
} from '@/hooks/use-events';
import { useTrackEngagement } from '@/hooks/use-engagement';
import { isDemoMode } from '@/lib/demo-guard';
import { DemoBanner } from '@/components/communications/DemoBanner';
import { Loading } from '@/components/states/Loading';
import { ErrorState } from '@/components/states/ErrorState';
import { useToast } from '@/components/ui/use-toast';
import { InviteModal } from '@/components/events/InviteModal';
import { CheckinModal } from '@/components/events/CheckinModal';
import type { EventInvite, InviteStatus } from '@/types/events';

const STATUS_ICONS: Record<InviteStatus, any> = {
  invited: AlertCircle,
  registered: Clock,
  attended: CheckCircle,
  no_show: XCircle,
  cancelled: XCircle,
  declined: XCircle,
};

const STATUS_COLORS: Record<InviteStatus, string> = {
  invited: 'text-blue-500',
  registered: 'text-orange-500',
  attended: 'text-green-500',
  no_show: 'text-red-500',
  cancelled: 'text-gray-500',
  declined: 'text-gray-500',
};

function EventDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { currentOrgId } = useOrgStore();
  const { trackAction } = useTrackEngagement();
  const isDemo = isDemoMode(currentOrgId);
  
  const eventId = params.id as string;
  const tabFromUrl = searchParams.get('tab') || 'overview';
  
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [selectedInvites, setSelectedInvites] = useState<string[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [checkinInviteId, setCheckinInviteId] = useState<string | null>(null);
  
  // Queries
  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(eventId);
  const { data: stats, isLoading: statsLoading } = useEventStats(eventId);
  const { data: invitesData, isLoading: invitesLoading } = useEventInvites({ event_id: eventId });
  
  // Mutations
  const updateEvent = useUpdateEvent();
  const recordCheckin = useRecordCheckin();
  const exportEvent = useExportEvent();
  
  useEffect(() => {
    const validTabs = ['overview', 'registrations', 'settings'];
    if (validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/civicflow/events/${eventId}?tab=${value}`);
  };
  
  const handleCheckin = (inviteId: string) => {
    setCheckinInviteId(inviteId);
    setShowCheckinModal(true);
  };
  
  const handleBulkCheckin = async () => {
    const registeredInvites = invitesData?.items.filter(
      invite => selectedInvites.includes(invite.id) && invite.status === 'registered'
    ) || [];
    
    for (const invite of registeredInvites) {
      await recordCheckin.mutateAsync({
        event_id: eventId,
        invite_id: invite.id,
      });
      
      // Track engagement
      if (invite.subject_id) {
        trackAction(invite.subject_id, 'event_attend', {
          event_id: eventId,
          event_name: event?.entity_name,
        });
      }
    }
    
    setSelectedInvites([]);
    toast({ title: `${registeredInvites.length} check-ins recorded` });
  };
  
  const handleExport = (format: 'csv' | 'pdf' | 'zip') => {
    exportEvent.mutate({ eventId, format });
  };
  
  if (!currentOrgId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">No Organization Selected</h2>
          <p className="text-muted-foreground">
            Please select an organization to view event details.
          </p>
        </div>
      </div>
    );
  }
  
  if (eventError) {
    return (
      <div className="container mx-auto py-6">
        <ErrorState 
          message="Failed to load event details" 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }
  
  if (eventLoading || !event) {
    return (
      <div className="container mx-auto py-6">
        <Loading />
      </div>
    );
  }
  
  const eventStatus = (() => {
    const now = new Date();
    const start = new Date(event.start_datetime);
    const end = new Date(event.end_datetime);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'past';
    return 'ongoing';
  })();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      {isDemo && <DemoBanner />}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{event.entity_name}</h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <Badge variant={eventStatus === 'upcoming' ? 'default' : eventStatus === 'ongoing' ? 'destructive' : 'secondary'}>
              {eventStatus}
            </Badge>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(event.start_datetime), 'PPP')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {format(new Date(event.start_datetime), 'p')} - {format(new Date(event.end_datetime), 'p')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast({ title: 'Share feature coming soon' })}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Export to PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('zip')}>
                Export Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Invited
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {statsLoading ? '-' : stats?.invited_count || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Registered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {statsLoading ? '-' : stats?.registered_count || 0}
            </p>
            {stats && stats.invited_count > 0 && (
              <p className="text-sm text-muted-foreground">
                {Math.round(stats.registration_rate)}% rate
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {statsLoading ? '-' : stats?.attended_count || 0}
            </p>
            {stats && stats.registered_count > 0 && (
              <p className="text-sm text-muted-foreground">
                {Math.round(stats.attendance_rate)}% rate
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              No Shows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {statsLoading ? '-' : stats?.no_show_count || 0}
            </p>
            {stats && stats.registered_count > 0 && (
              <p className="text-sm text-muted-foreground">
                {Math.round(stats.no_show_rate)}% rate
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {event.capacity ? (
              <>
                <p className="text-2xl font-bold">
                  {Math.round((stats?.registered_count || 0) / event.capacity * 100)}%
                </p>
                <p className="text-sm text-muted-foreground">
                  {stats?.registered_count || 0} / {event.capacity}
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold">∞</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="flex items-center gap-2">
                    {event.is_online ? (
                      <>
                        <Globe className="h-4 w-4" />
                        {event.online_url || 'Online Event'}
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4" />
                        {event.venue_name || 'Venue TBD'}
                      </>
                    )}
                  </p>
                  {event.venue_address && (
                    <p className="text-sm text-muted-foreground ml-6">
                      {event.venue_address}
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <p className="capitalize">{event.event_type}</p>
                </div>
                
                {event.host_program_name && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Host Program</p>
                    <p>{event.host_program_name}</p>
                  </div>
                )}
                
                {event.registration_deadline && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Registration Deadline</p>
                    <p>{format(new Date(event.registration_deadline), 'PPP')}</p>
                  </div>
                )}
              </div>
              
              {event.description && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="whitespace-pre-wrap">{event.description}</p>
                </div>
              )}
              
              {event.tags && event.tags.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setShowInviteModal(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invitations
                </Button>
                <Button variant="outline" onClick={() => setShowCheckinModal(true)}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Check-in Mode
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/civicflow/events/${eventId}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="registrations" className="space-y-4">
          {/* Bulk Actions */}
          {selectedInvites.length > 0 && (
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {selectedInvites.length} selected
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleBulkCheckin}>
                      Record Check-ins
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedInvites([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Registrations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Registrations & Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {invitesLoading ? (
                <Loading />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            invitesData?.items.length > 0 &&
                            selectedInvites.length === invitesData.items.length
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedInvites(invitesData?.items.map(i => i.id) || []);
                            } else {
                              setSelectedInvites([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitesData?.items.map((invite) => {
                      const StatusIcon = STATUS_ICONS[invite.status];
                      
                      return (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedInvites.includes(invite.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedInvites([...selectedInvites, invite.id]);
                                } else {
                                  setSelectedInvites(selectedInvites.filter(id => id !== invite.id));
                                }
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {invite.subject_name || invite.entity_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {invite.subject_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`h-4 w-4 ${STATUS_COLORS[invite.status]}`} />
                              <span className="capitalize">{invite.status}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {invite.registered_at
                              ? format(new Date(invite.registered_at), 'MMM d, h:mm a')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {invite.checkin_time
                              ? format(new Date(invite.checkin_time), 'h:mm a')
                              : invite.status === 'registered' ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCheckin(invite.id)}
                                >
                                  Check In
                                </Button>
                              ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => router.push(`/civicflow/constituents/${invite.subject_id}`)}
                                >
                                  View Profile
                                </DropdownMenuItem>
                                {invite.status === 'registered' && (
                                  <DropdownMenuItem onClick={() => handleCheckin(invite.id)}>
                                    Record Check-in
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => toast({ title: 'Resend invitation' })}
                                >
                                  Resend Invitation
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Event Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Event settings and configuration options will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Modals */}
      <InviteModal
        open={showInviteModal}
        onOpenChange={setShowInviteModal}
        eventId={eventId}
        eventName={event.entity_name}
      />
      
      <CheckinModal
        open={showCheckinModal}
        onOpenChange={setShowCheckinModal}
        eventId={eventId}
        inviteId={checkinInviteId}
      />
    </div>
  );
}

export default function EventDetailPage() {
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
      <EventDetailContent />
    </Suspense>
  );
}