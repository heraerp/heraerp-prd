'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Cable,
  GitBranch,
  Play,
  History,
  Network,
  Settings,
  HelpCircle,
  ChevronRight
} from 'lucide-react'
import { useIntegrationDashboard } from '@/hooks/integration-hub/useDashboard'

type ViewType = 'dashboard' | 'connectors' | 'mappings' | 'sync-jobs' | 'sync-runs' | 'data-flow'

interface IntegrationNavProps {
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  organizationId: string
}

export function IntegrationNav({ activeView, onViewChange, organizationId }: IntegrationNavProps) {
  const { data: dashboard } = useIntegrationDashboard(organizationId)

  const navItems = [
    {
      id: 'dashboard' as ViewType,
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Overview & metrics'
    },
    {
      id: 'connectors' as ViewType,
      label: 'Connectors',
      icon: Cable,
      description: 'External services',
      count: dashboard?.total_connectors
    },
    {
      id: 'mappings' as ViewType,
      label: 'Data Mappings',
      icon: GitBranch,
      description: 'Field transformations'
    },
    {
      id: 'sync-jobs' as ViewType,
      label: 'Sync Jobs',
      icon: Play,
      description: 'Scheduled syncs',
      count: dashboard?.total_sync_jobs,
      activeCount: dashboard?.active_sync_jobs
    },
    {
      id: 'sync-runs' as ViewType,
      label: 'Run History',
      icon: History,
      description: 'Execution logs'
    },
    {
      id: 'data-flow' as ViewType,
      label: 'Data Flow',
      icon: Network,
      description: 'Visual mapping'
    }
  ]

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          Integration Hub
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Connect & sync data</p>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3">
        <div className="space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = activeView === item.id

            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  'w-full justify-start h-auto py-3 px-3',
                  isActive && 'bg-accent text-accent-foreground'
                )}
                onClick={() => onViewChange(item.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isActive ? 'text-accent-foreground' : 'text-muted-foreground'
                      )}
                    />
                    <div className="text-left">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.count !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        {item.count}
                      </Badge>
                    )}
                    {item.activeCount !== undefined && item.activeCount > 0 && (
                      <Badge className="text-xs bg-green-100 text-green-800">
                        {item.activeCount}
                      </Badge>
                    )}
                    {isActive && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </Button>
            )
          })}
        </div>

        <Separator className="my-4" />

        {/* Footer Actions */}
        <div className="space-y-1">
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <Settings className="h-4 w-4 mr-3 text-muted-foreground" />
            Settings
          </Button>
          <Button variant="ghost" className="w-full justify-start" size="sm">
            <HelpCircle className="h-4 w-4 mr-3 text-muted-foreground" />
            Documentation
          </Button>
        </div>
      </div>

      {/* Status Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center justify-between mb-1">
            <span>System Status</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Operational</span>
            </div>
          </div>
          {dashboard && <div className="text-xs">{dashboard.last_24h_syncs} syncs in 24h</div>}
        </div>
      </div>
    </div>
  )
}
