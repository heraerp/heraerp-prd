'use client'

import React, { useState } from 'react'
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
import { TestIntegrationButton } from '@/components/integrations/TestIntegrationButton'
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
  accentColor: string
  darkColor: string
}> = [
  {
    vendor: 'mailchimp',
    name: 'Mailchimp',
    description: 'Email marketing automation and audience management',
    icon: Mail,
    features: ['Campaigns', 'Lists & Segments', 'Email Analytics', 'Subscriber Activity'],
    color: 'bg-amber-500',
    accentColor: 'text-amber-700 dark:text-amber-400',
    darkColor: 'dark:bg-amber-600'
  },
  {
    vendor: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional networking and social media engagement',
    icon: Linkedin,
    features: ['Organization Posts', 'Post Analytics', 'Follower Insights', 'Engagement Metrics'],
    color: 'bg-blue-600',
    accentColor: 'text-blue-700 dark:text-blue-400',
    darkColor: 'dark:bg-blue-700'
  },
  {
    vendor: 'bluesky',
    name: 'BlueSky',
    description: 'Decentralized social media platform',
    icon: Globe,
    features: ['Posts & Threads', 'Engagement Tracking', 'Follower Growth', 'Content Analytics'],
    color: 'bg-sky-600',
    accentColor: 'text-sky-700 dark:text-sky-400',
    darkColor: 'dark:bg-sky-700'
  },
  {
    vendor: 'eventbrite',
    name: 'Eventbrite',
    description: 'Event management and ticketing platform',
    icon: Calendar,
    features: ['Event Creation', 'Attendee Management', 'Ticket Sales', 'Check-in Tracking'],
    color: 'bg-orange-600',
    accentColor: 'text-orange-700 dark:text-orange-400',
    darkColor: 'dark:bg-orange-700'
  },
  {
    vendor: 'office365',
    name: 'Microsoft 365',
    description: 'Email and calendar integration for Microsoft accounts',
    icon: FileText,
    features: ['Email Sync', 'Calendar Events', 'Contact Import', 'Meeting Tracking'],
    color: 'bg-indigo-600',
    accentColor: 'text-indigo-700 dark:text-indigo-400',
    darkColor: 'dark:bg-indigo-700'
  },
  {
    vendor: 'google',
    name: 'Google Workspace',
    description: 'Email and calendar integration for Google accounts',
    icon: FileText,
    features: ['Gmail Sync', 'Calendar Events', 'Contact Import', 'Meeting Tracking'],
    color: 'bg-green-600',
    accentColor: 'text-green-700 dark:text-green-400',
    darkColor: 'dark:bg-green-700'
  }
]

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

export default function IntegrationsPage() {
  const { currentOrgId, setCurrentOrgId } = useOrgStore()
  
  // Use CivicFlow demo org if no org is set
  const orgId = currentOrgId || CIVICFLOW_ORG_ID
  const isDemo = isDemoMode(orgId)
  
  const [activeTab, setActiveTab] = useState('all')
  const [showMappingModal, setShowMappingModal] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null)
  
  // Set default org if none exists
  React.useEffect(() => {
    if (!currentOrgId) {
      setCurrentOrgId(CIVICFLOW_ORG_ID)
    }
  }, [currentOrgId, setCurrentOrgId])

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto py-6 space-y-6">
        {isDemo && <DemoBanner />}

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Integrations</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Connect your favorite tools to sync data and automate workflows
            </p>
          </div>
          <div className="flex items-center gap-2">
            {process.env.NODE_ENV === 'development' && <TestIntegrationButton />}
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Connected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{connectedCount}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">/ {CONNECTORS.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Auto-Syncing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{syncingCount}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
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
                  accentColor={connectorInfo.accentColor}
                  darkColor={connectorInfo.darkColor}
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
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">How Integrations Work</CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Connected integrations automatically sync data to your CivicFlow workspace:
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-semibold mt-0.5">→</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-gray-100">Messages & Posts</strong> are imported as communication records for unified
                tracking
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-semibold mt-0.5">→</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-gray-100">Events & Registrations</strong> sync to your programs and constituent
                records
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-semibold mt-0.5">→</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-gray-100">Analytics & Metrics</strong> provide insights across all channels in one
                place
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 font-semibold mt-0.5">→</span>
              <span className="text-gray-700 dark:text-gray-300">
                <strong className="text-gray-900 dark:text-gray-100">Automatic Updates</strong> keep your data fresh with scheduled syncs
              </span>
            </li>
          </ul>
          {isDemo && (
            <div className="mt-4 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <p className="text-sm text-amber-900 dark:text-amber-200">
                <strong className="font-semibold">Demo Mode:</strong> Integrations simulate connections and generate sample data
                for testing.
              </p>
            </div>
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
    </div>
  )
}
