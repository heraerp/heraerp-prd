'use client'

import { useState } from 'react'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  Linkedin,
  Globe,
  Calendar,
  FileText,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpRight
} from 'lucide-react'
import { DemoBanner } from '@/components/communications/DemoBanner'
import { ConnectorCard } from '@/components/integrations/ConnectorCard'
import { MappingModal } from '@/components/integrations/MappingModal'
import { useConnectors } from '@/hooks/use-integrations'
import { isDemoMode } from '@/lib/demo-guard'
import { Loading } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import type { VendorType, Connector } from '@/types/integrations'

const CONNECTORS: Array<{
  vendor: VendorType
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  features: string[]
  color: string
}> = [
  {
    vendor: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automation and audience management',
    icon: Mail,
    features: ['Campaigns', 'Lists & Segments', 'Email Analytics', 'Subscriber Activity'],
    color: 'bg-yellow-500'
  },
  {
    vendor: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional networking and social media engagement',
    icon: Linkedin,
    features: ['Organization Posts', 'Post Analytics', 'Follower Insights', 'Engagement Metrics'],
    color: 'bg-blue-600'
  },
  {
    vendor: 'bluesky',
    name: 'BlueSky',
    description: 'Decentralized social media platform',
    icon: Globe,
    features: ['Posts & Threads', 'Engagement Tracking', 'Follower Growth', 'Content Analytics'],
    color: 'bg-sky-500'
  },
  {
    vendor: 'eventbrite',
    name: 'Eventbrite',
    description: 'Event management and ticketing platform',
    icon: Calendar,
    features: ['Event Creation', 'Attendee Management', 'Ticket Sales', 'Check-in Tracking'],
    color: 'bg-orange-500'
  },
  {
    vendor: 'office365',
    name: 'Microsoft 365',
    description: 'Email and calendar integration for Microsoft accounts',
    icon: FileText,
    features: ['Email Sync', 'Calendar Events', 'Contact Import', 'Meeting Tracking'],
    color: 'bg-blue-500'
  },
  {
    vendor: 'google',
    name: 'Google Workspace',
    description: 'Email and calendar integration for Google accounts',
    icon: FileText,
    features: ['Gmail Sync', 'Calendar Events', 'Contact Import', 'Meeting Tracking'],
    color: 'bg-green-500'
  }
]

export default function IntegrationsPage() {
  const { currentOrgId } = useOrgStore()
  const isDemo = isDemoMode(currentOrgId)
  const [activeTab, setActiveTab] = useState('all')
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null)

  const { data: connectorsData, isLoading, error, refetch } = useConnectors()

  const connectors = connectorsData?.items || []
  const connectedCount = connectors.filter(c => c.status === 'active').length
  const syncingCount = connectors.filter(c => c.status === 'active' && c.sync_schedule).length

  const getConnectorInfo = (vendor: VendorType) => {
    return CONNECTORS.find(c => c.vendor === vendor)
  }

  const handleConfigureMapping = (connector: Connector) => {
    setSelectedConnector(connector)
    setShowMappingModal(true)
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
        <ErrorState message="Failed to load integrations" onRetry={() => refetch()} />
      </div>
    )
  }

  const filteredConnectors =
    activeTab === 'all'
      ? CONNECTORS
      : CONNECTORS.filter(c => {
          const connector = connectors.find(conn => conn.vendor === c.vendor)
          return activeTab === 'connected'
            ? connector?.status === 'active'
            : !connector || connector.status !== 'active'
        })

  return (
    <div className="container mx-auto py-6 space-y-6">
      {isDemo && <DemoBanner />}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-muted-foreground mt-1">
              Connect your favorite tools to sync data and automate workflows
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold">{connectedCount}</span>
                <span className="text-sm text-muted-foreground">/ {CONNECTORS.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Auto-Syncing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold">{syncingCount}</span>
                <span className="text-sm text-muted-foreground">active</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-gray-600" />
                <span className="text-sm">
                  {connectors.length > 0 ? 'Today, 2:30 PM' : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All Integrations
            <Badge variant="secondary" className="ml-2">
              {CONNECTORS.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="connected">
            Connected
            {connectedCount > 0 && (
              <Badge variant="default" className="ml-2">
                {connectedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="available">
            Available
            {CONNECTORS.length - connectedCount > 0 && (
              <Badge variant="outline" className="ml-2">
                {CONNECTORS.length - connectedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConnectors.map(connectorInfo => {
              const connector = connectors.find(c => c.vendor === connectorInfo.vendor)

              return (
                <ConnectorCard
                  key={connectorInfo.vendor}
                  vendor={connectorInfo.vendor}
                  name={connectorInfo.name}
                  description={connectorInfo.description}
                  icon={connectorInfo.icon}
                  features={connectorInfo.features}
                  color={connectorInfo.color}
                  connector={connector}
                  isDemo={isDemo}
                  onConfigureMapping={() => connector && handleConfigureMapping(connector)}
                />
              )
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <CardTitle className="text-base">How Integrations Work</CardTitle>
              <CardDescription>
                Connected integrations automatically sync data to your CivicFlow workspace:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span>
                <strong>Messages & Posts</strong> are imported as communication records for unified
                tracking
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span>
                <strong>Events & Registrations</strong> sync to your programs and constituent
                records
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span>
                <strong>Analytics & Metrics</strong> provide insights across all channels in one
                place
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              <span>
                <strong>Automatic Updates</strong> keep your data fresh with scheduled syncs
              </span>
            </li>
          </ul>
          {isDemo && (
            <p className="mt-4 text-sm text-orange-600 dark:text-orange-400">
              <strong>Demo Mode:</strong> Integrations simulate connections and generate sample data
              for testing.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mapping Modal */}
      {selectedConnector && (
        <MappingModal
          open={showMappingModal}
          onOpenChange={setShowMappingModal}
          connector={selectedConnector}
        />
      )}
    </div>
  )
}
