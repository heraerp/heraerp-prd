import { useOrgActivity } from '@/hooks/use-organizations'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Activity,
  UserPlus,
  Mail,
  FileText,
  Calendar,
  DollarSign,
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Settings,
  Upload,
  Pencil,
  Phone
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface OrgActivityProps {
  organizationId: string
}

export default function OrgActivity({ organizationId }: OrgActivityProps) {
  const { currentOrgId } = useOrgStore()
  const { data, isLoading, error } = useOrgActivity(organizationId)

  if (isLoading) {
    return <ActivitySkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load activity timeline. Please try again.</AlertDescription>
      </Alert>
    )
  }

  const getActivityIcon = (smartCode: string) => {
    if (smartCode.includes('MANAGER.ASSIGN')) return UserPlus
    if (smartCode.includes('CONTACT.LINK')) return UserPlus
    if (smartCode.includes('CONTACT.UNLINK')) return XCircle
    if (smartCode.includes('STAGE.UPDATE')) return Settings
    if (smartCode.includes('NOTE.ADD')) return Pencil
    if (smartCode.includes('COMM.EMAIL')) return Mail
    if (smartCode.includes('COMM.SMS')) return MessageSquare
    if (smartCode.includes('COMM.PHONE')) return Phone
    if (smartCode.includes('CASE.CREATE')) return FileText
    if (smartCode.includes('CASE.UPDATE')) return FileText
    if (smartCode.includes('EVENT.INVITE')) return Calendar
    if (smartCode.includes('EVENT.ATTEND')) return CheckCircle
    if (smartCode.includes('FUNDING.APPLY')) return DollarSign
    if (smartCode.includes('FUNDING.AWARD')) return DollarSign
    if (smartCode.includes('DOC.UPLOAD')) return Upload
    if (smartCode.includes('EXPORT')) return FileText
    return Activity
  }

  const getActivityColor = (smartCode: string) => {
    if (smartCode.includes('MANAGER') || smartCode.includes('CONTACT'))
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    if (smartCode.includes('STAGE')) return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
    if (smartCode.includes('COMM')) return 'text-green-600 bg-green-100 dark:bg-green-900/20'
    if (smartCode.includes('CASE')) return 'text-amber-600 bg-amber-100 dark:bg-amber-900/20'
    if (smartCode.includes('EVENT')) return 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/20'
    if (smartCode.includes('FUNDING'))
      return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20'
    if (smartCode.includes('DOC')) return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    return 'text-muted-foreground bg-muted'
  }

  const formatActivityDescription = (activity: any): string => {
    const metadata = activity.metadata || {}
    const smartCode = activity.smart_code

    if (smartCode.includes('MANAGER.ASSIGN')) {
      return `Assigned ${metadata.manager_name || 'manager'} as relationship manager`
    }
    if (smartCode.includes('CONTACT.LINK')) {
      return `Added ${metadata.contact_name || 'contact'} as ${metadata.role || 'contact'}`
    }
    if (smartCode.includes('CONTACT.UNLINK')) {
      return `Removed ${metadata.contact_name || 'contact'} from organization`
    }
    if (smartCode.includes('STAGE.UPDATE')) {
      return `Updated engagement stage to ${metadata.new_stage || 'new stage'}`
    }
    if (smartCode.includes('NOTE.ADD')) {
      return `Added a note: "${metadata.note_preview || 'Note content'}"`
    }
    if (smartCode.includes('COMM.EMAIL')) {
      return `Sent email: "${metadata.subject || 'No subject'}"`
    }
    if (smartCode.includes('COMM.SMS')) {
      return `Sent SMS message${metadata.to ? ` to ${metadata.to}` : ''}`
    }
    if (smartCode.includes('CASE.CREATE')) {
      return `Created case: ${metadata.case_title || 'Support case'}`
    }
    if (smartCode.includes('EVENT.INVITE')) {
      return `Invited to event: ${metadata.event_name || 'Event'}`
    }
    if (smartCode.includes('EVENT.ATTEND')) {
      return `Attended event: ${metadata.event_name || 'Event'}`
    }
    if (smartCode.includes('FUNDING.APPLY')) {
      return `Applied for grant: ${metadata.grant_name || 'Grant'} ($${metadata.amount_requested?.toLocaleString() || '0'})`
    }
    if (smartCode.includes('FUNDING.AWARD')) {
      return `Grant awarded: ${metadata.grant_name || 'Grant'} ($${metadata.amount_awarded?.toLocaleString() || '0'})`
    }
    if (smartCode.includes('DOC.UPLOAD')) {
      return `Uploaded document: ${metadata.document_name || 'Document'}`
    }
    if (smartCode.includes('EXPORT')) {
      return `Exported organization data (${metadata.format || 'CSV'})`
    }

    return activity.description || 'Activity recorded'
  }

  const groupActivitiesByDate = (activities: any[]) => {
    const groups: Record<string, any[]> = {}

    activities.forEach(activity => {
      const date = format(new Date(activity.created_at), 'yyyy-MM-dd')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(activity)
    })

    return Object.entries(groups).map(([date, items]) => ({
      date,
      label: format(new Date(date), 'MMMM d, yyyy'),
      isToday: format(new Date(), 'yyyy-MM-dd') === date,
      items
    }))
  }

  const groupedActivities = data?.data ? groupActivitiesByDate(data.data) : []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Timeline ({data?.total || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {groupedActivities.length > 0 ? (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-8">
              {groupedActivities.map((group, groupIndex) => (
                <div key={group.date}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex-1 h-px bg-border" />
                    <Badge variant={group.isToday ? 'default' : 'outline'} className="text-xs">
                      {group.isToday ? 'Today' : group.label}
                    </Badge>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="space-y-4">
                    {group.items.map((activity, index) => {
                      const Icon = getActivityIcon(activity.smart_code)
                      const colorClass = getActivityColor(activity.smart_code)
                      const isLast =
                        groupIndex === groupedActivities.length - 1 &&
                        index === group.items.length - 1

                      return (
                        <div key={activity.id} className="relative flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn('p-2 rounded-full', colorClass)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            {!isLast && <div className="w-px bg-border flex-1 mt-2" />}
                          </div>

                          <div className="flex-1 pb-4">
                            <p className="text-sm font-medium">
                              {formatActivityDescription(activity)}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{format(new Date(activity.created_at), 'h:mm a')}</span>
                              <span>{'\u2022'}</span>
                              <span>
                                {formatDistanceToNow(new Date(activity.created_at), {
                                  addSuffix: true
                                })}
                              </span>
                              {activity.user_name && (
                                <>
                                  <span>{'\u2022'}</span>
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {activity.user_name}
                                  </span>
                                </>
                              )}
                            </div>
                            {activity.metadata?.tags && activity.metadata.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {activity.metadata.tags.map((tag: string, tagIndex: number) => (
                                  <Badge key={tagIndex} variant="secondary" className="text-xs">
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
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">No activity recorded yet</p>
            <p className="text-sm text-muted-foreground">
              All actions and changes will appear here
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ActivitySkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
