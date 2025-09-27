'use client'

import { useState, useEffect } from 'react'
import { useOrgStore } from '@/state/org'
import { IntegrationDashboard } from '@/components/integration-hub/IntegrationDashboard'
import { IntegrationNav } from '@/components/integration-hub/IntegrationNav'
import { ConnectorList } from '@/components/integration-hub/ConnectorList'
import { MappingList } from '@/components/integration-hub/MappingList'
import { SyncJobList } from '@/components/integration-hub/SyncJobList'
import { SyncRunHistory } from '@/components/integration-hub/SyncRunHistory'
import { DataFlowDiagram } from '@/components/integration-hub/DataFlowDiagram'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

type ViewType = 'dashboard' | 'connectors' | 'mappings' | 'sync-jobs' | 'sync-runs' | 'data-flow'

export default function IntegrationsPage() {
  const { currentOrgId } = useOrgStore()
  const [activeView, setActiveView] = useState<ViewType>('dashboard')
  const [isLoading, setIsLoading] = useState(true)

  // Use demo org if no current org
  const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'
  const organizationId = currentOrgId || DEMO_ORG_ID

  // Set loading false after mount
  useEffect(() => {
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Navigation */}
      <IntegrationNav
        activeView={activeView}
        onViewChange={setActiveView}
        organizationId={organizationId}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {activeView === 'dashboard' && <IntegrationDashboard organizationId={organizationId} />}

          {activeView === 'connectors' && <ConnectorList organizationId={organizationId} />}

          {activeView === 'mappings' && <MappingList organizationId={organizationId} />}

          {activeView === 'sync-jobs' && <SyncJobList organizationId={organizationId} />}

          {activeView === 'sync-runs' && <SyncRunHistory organizationId={organizationId} />}

          {activeView === 'data-flow' && <DataFlowDiagram organizationId={organizationId} />}
        </div>
      </div>
    </div>
  )
}
