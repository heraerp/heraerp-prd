'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Cable,
  Plus,
  Search,
  MoreVertical,
  Settings,
  TestTube,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react'
import { useConnectors, useTestConnection } from '@/hooks/integration-hub/useConnectors'
import { ConnectorManager } from '@/lib/integration-hub/connector-manager'
import { NewConnectorModal } from './modals/NewConnectorModal'
import { formatDistanceToNow } from 'date-fns'
import type { IntegrationConnector } from '@/types/integration-hub'

interface ConnectorListProps {
  organizationId: string
}

export function ConnectorList({ organizationId }: ConnectorListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState<IntegrationConnector | null>(null)

  const { data: connectors, isLoading, refetch } = useConnectors(organizationId)
  const { mutate: testConnection, isPending: isTesting } = useTestConnection()

  const filteredConnectors = connectors?.filter(
    connector =>
      connector.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      connector.vendor.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusIcon = (status: IntegrationConnector['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'configuring':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 ink-muted" />
    }
  }

  const getStatusBadge = (status: IntegrationConnector['status']) => {
    const variants: Record<IntegrationConnector['status'], string> = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      error: 'bg-red-100 text-red-800',
      configuring: 'bg-yellow-100 text-yellow-800'
    }

    return <Badge className={variants[status] || variants.inactive}>{status}</Badge>
  }

  const handleTestConnection = (connector: IntegrationConnector) => {
    testConnection(connector.id, {
      onSuccess: () => {
        refetch()
      }
    })
  }

  const vendorDetails = ConnectorManager.getAllVendors()

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Connectors</h1>
          <p className="text-muted-foreground">Connect to external services and APIs</p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Connector
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search connectors..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Connector Grid */}
      <div className="grid grid-cols-3 gap-4">
        {filteredConnectors?.map(connector => {
          const vendor = vendorDetails.find(v => v.id === connector.vendor)

          return (
            <Card key={connector.id} className="relative hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{vendor?.icon || '🔌'}</div>
                    <div>
                      <CardTitle className="text-base">{connector.entity_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {vendor?.displayName || connector.vendor}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleTestConnection(connector)}>
                        <TestTube className="h-4 w-4 mr-2" />
                        Test Connection
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(connector.status)}
                      {getStatusBadge(connector.status)}
                    </div>
                  </div>

                  {/* Auth Type */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Auth</span>
                    <Badge variant="secondary">{connector.config.auth_type}</Badge>
                  </div>

                  {/* Last Health Check */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Check</span>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(connector.last_health_check), {
                        addSuffix: true
                      })}
                    </span>
                  </div>

                  {/* Capabilities */}
                  <div>
                    <span className="text-sm text-muted-foreground">Capabilities</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {connector.capabilities.slice(0, 3).map((cap, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cap.type}
                        </Badge>
                      ))}
                      {connector.capabilities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{connector.capabilities.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      disabled={isTesting}
                      onClick={() => handleTestConnection(connector)}
                    >
                      {isTesting ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <>
                          <TestTube className="h-3 w-3 mr-1" />
                          Test
                        </>
                      )}
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Empty State */}
        {filteredConnectors?.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <Cable className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No connectors found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by adding your first connector'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowNewModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Connector
              </Button>
            )}
          </div>
        )}
      </div>

      {/* New Connector Modal */}
      <NewConnectorModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        organizationId={organizationId}
      />
    </div>
  )
}
