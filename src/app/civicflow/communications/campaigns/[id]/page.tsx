

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Globe,
  Users,
  Calendar,
  Clock,
  Play,
  Pause,
  Square,
  Download,
  Printer,
  ChevronDown,
  Eye,
  MousePointer,
  TrendingUp,
  Activity
} from 'lucide-react'
import { DemoBanner } from '@/components/communications/DemoBanner'
import {
  useCampaign,
  useCampaignSchedule,
  useCampaignPause,
  useCampaignResume,
  useCampaignCancel,
  useExportComms
} from '@/hooks/use-communications'
import { isDemoMode } from '@/lib/demo-guard'
import { Loading } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyState } from '@/components/states/EmptyState'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

export default function CampaignDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrgId } = useOrgStore()
  const isDemo = isDemoMode(currentOrgId)
  const campaignId = params.id as string

  const [showCancelDialog, setShowCancelDialog] = useState(false)

  // Queries and mutations
  const { data: campaign, isLoading, error, refetch } = useCampaign(campaignId)
  const scheduleMutation = useCampaignSchedule()
  const pauseMutation = useCampaignPause()
  const resumeMutation = useCampaignResume()
  const cancelMutation = useCampaignCancel()
  const exportMutation = useExportComms()

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'secondary'
      case 'scheduled':
        return 'default'
      case 'running':
        return 'default'
      case 'paused':
        return 'outline'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const handleAction = async (action: 'schedule' | 'pause' | 'resume' | 'cancel') => {
    const mutations = {
      schedule: scheduleMutation,
      pause: pauseMutation,
      resume: resumeMutation,
      cancel: cancelMutation
    }

    const mutation = mutations[action]
    mutation.mutate(
      { campaign_id: campaignId },
      {
        onSuccess: () => {
          toast({ title: `Campaign ${action}d successfully` })
          refetch()
        },
        onError: () => {
          toast({
            title: `Failed to ${action} campaign`,
            variant: 'destructive'
          })
        }
      }
    )
  }

  const handleExport = () => {
    exportMutation.mutate({
      kind: 'campaign',
      format: 'pdf',
      campaign_id: campaignId,
      organization_id: currentOrgId,
      include_demo_watermark: isDemo
    })
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Loading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <ErrorState message="Failed to load campaign" onRetry={() => refetch()} />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="container mx-auto py-6">
        <EmptyState
          title="Campaign not found"
          description="The requested campaign could not be found."
        />
      </div>
    )
  }

  const openRate =
    campaign.metrics.delivered > 0
      ? (campaign.metrics.opened / campaign.metrics.delivered) * 100
      : 0

  const clickRate =
    campaign.metrics.opened > 0 ? (campaign.metrics.clicked / campaign.metrics.opened) * 100 : 0

  const bounceRate =
    campaign.metrics.sent > 0 ? (campaign.metrics.bounced / campaign.metrics.sent) * 100 : 0

  return (
    <div className="container mx-auto py-6 space-y-6">
      {isDemo && <DemoBanner />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-[rgb(0,166,166)]/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold">{campaign.entity_name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              {getChannelIcon(campaign.channel)}
              <span className="capitalize">{campaign.channel}</span>
            </div>
            <Badge variant={getStatusColor(campaign.status)}>{campaign.status}</Badge>
            {campaign.schedule_at && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Scheduled for {format(new Date(campaign.schedule_at), 'MMM d, h:mm a')}</span>
              </div>
            )}
            {campaign.throttle_per_hour && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{campaign.throttle_per_hour}/hour</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campaign.status === 'draft' && (
            <Button
              onClick={() => handleAction('schedule')}
              className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Schedule
            </Button>
          )}
          {campaign.status === 'running' && (
            <Button
              onClick={() => handleAction('pause')}
              variant="outline"
              className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          )}
          {campaign.status === 'paused' && (
            <Button
              onClick={() => handleAction('resume')}
              className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
            >
              <Play className="h-4 w-4 mr-2" />
              Resume
            </Button>
          )}
          {['draft', 'scheduled', 'running', 'paused'].includes(campaign.status) && (
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Campaign</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this campaign? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleAction('cancel')}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Cancel Campaign
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />

      {/* Overview Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Template</span>
                <span className="text-sm font-medium">{campaign.template_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Audience</span>
                <span className="text-sm font-medium">{campaign.audience_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Audience Size</span>
                <span className="text-sm font-medium">
                  <Users className="h-3 w-3 inline mr-1" />
                  {campaign.audience_size.toLocaleString()}
                </span>
              </div>
              {campaign.tags && campaign.tags.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">Tags</span>
                  <div className="flex flex-wrap gap-1">
                    {campaign.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {campaign.utm_params && (
                <div className="space-y-1">
                  <span className="text-sm text-muted-foreground">UTM Parameters</span>
                  <div className="text-xs space-y-1">
                    {Object.entries(campaign.utm_params).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {campaign.status !== 'draft' && (
          <Card>
            <CardHeader>
              <CardTitle>Delivery Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {campaign.metrics.sent} / {campaign.audience_size}
                  </span>
                </div>
                <Progress
                  value={(campaign.metrics.sent / campaign.audience_size) * 100}
                  className="h-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Delivered</span>
                  <p className="text-lg font-semibold">
                    {campaign.metrics.delivered.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Bounced</span>
                  <p className="text-lg font-semibold">
                    {campaign.metrics.bounced.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Performance Metrics */}
      {campaign.status !== 'draft' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span>Open Rate</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{openRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.metrics.opened.toLocaleString()} opens
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MousePointer className="h-3 w-3" />
                  <span>Click Rate</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{clickRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.metrics.clicked.toLocaleString()} clicks
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Bounce Rate</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{bounceRate.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.metrics.bounced.toLocaleString()} bounces
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Unsubscribes</span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold">{campaign.metrics.unsubscribed || 0}</p>
                  <p className="text-xs text-muted-foreground">opt-outs</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-muted-foreground">
                {format(new Date(campaign.created_at), 'MMM d, yyyy h:mm a')}
              </span>
              <span>Campaign created</span>
            </div>
            {campaign.schedule_at && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-muted-foreground">
                  {format(new Date(campaign.schedule_at), 'MMM d, yyyy h:mm a')}
                </span>
                <span>Scheduled to start</span>
              </div>
            )}
            {campaign.status !== 'draft' && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">
                  {format(new Date(campaign.updated_at), 'MMM d, yyyy h:mm a')}
                </span>
                <span>Last status update</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
