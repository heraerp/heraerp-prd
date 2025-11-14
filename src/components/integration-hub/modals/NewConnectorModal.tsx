'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Loader2, Cable, CheckCircle } from 'lucide-react'
import { useCreateConnector } from '@/hooks/integration-hub/useConnectors'
import { ConnectorManager } from '@/lib/integration-hub/connector-manager'
import type { IntegrationVendor } from '@/types/integration-hub'

interface NewConnectorModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
}

export function NewConnectorModal({ open, onClose, organizationId }: NewConnectorModalProps) {
  const [selectedVendor, setSelectedVendor] = useState<IntegrationVendor | null>(null)
  const [connectorName, setConnectorName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  const { mutate: createConnector, isPending } = useCreateConnector()

  const vendors = ConnectorManager.getAllVendors()

  const handleCreate = () => {
    if (!selectedVendor || !connectorName) return

    const vendorConfig = vendors.find(v => v.id === selectedVendor)
    if (!vendorConfig) return

    let config: any = {
      auth_type: vendorConfig.authType
    }

    if (vendorConfig.authType === 'api_key') {
      config.api_key = apiKey
    } else if (vendorConfig.authType === 'oauth2') {
      config.oauth = {
        client_id: clientId,
        client_secret: clientSecret,
        scopes: vendorConfig.defaultScopes || []
      }
    }

    createConnector(
      {
        organizationId,
        vendor: selectedVendor,
        name: connectorName,
        config
      },
      {
        onSuccess: () => {
          onClose()
          // Reset form
          setSelectedVendor(null)
          setConnectorName('')
          setApiKey('')
          setClientId('')
          setClientSecret('')
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Integration Connector</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Vendor Selection */}
          <div>
            <Label className="mb-2">Select Service</Label>
            <div className="grid grid-cols-3 gap-3">
              {vendors.map(vendor => (
                <Card
                  key={vendor.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedVendor === vendor.id
                      ? 'ring-2 ring-primary border-primary'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedVendor(vendor.id as IntegrationVendor)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{vendor.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{vendor.displayName}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {vendor.authType.replace('_', ' ')}
                      </div>
                    </div>
                    {selectedVendor === vendor.id && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {selectedVendor && (
            <>
              {/* Connector Name */}
              <div>
                <Label htmlFor="name">Connector Name</Label>
                <Input
                  id="name"
                  value={connectorName}
                  onChange={e => setConnectorName(e.target.value)}
                  placeholder={`My ${vendors.find(v => v.id === selectedVendor)?.displayName} Connection`}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Give this connector a unique name to identify it
                </p>
              </div>

              {/* Authentication Fields */}
              {(() => {
                const vendor = vendors.find(v => v.id === selectedVendor)
                if (!vendor) return null

                if (vendor.authType === 'api_key') {
                  return (
                    <div>
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        value={apiKey}
                        onChange={e => setApiKey(e.target.value)}
                        placeholder="Enter your API key"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Find your API key in the {vendor.displayName} dashboard
                      </p>
                    </div>
                  )
                } else if (vendor.authType === 'oauth2') {
                  return (
                    <>
                      <div>
                        <Label htmlFor="clientId">Client ID</Label>
                        <Input
                          id="clientId"
                          value={clientId}
                          onChange={e => setClientId(e.target.value)}
                          placeholder="Enter OAuth client ID"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="clientSecret">Client Secret</Label>
                        <Input
                          id="clientSecret"
                          type="password"
                          value={clientSecret}
                          onChange={e => setClientSecret(e.target.value)}
                          placeholder="Enter OAuth client secret"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>OAuth Scopes</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {vendor.defaultScopes?.map(scope => (
                            <Badge key={scope} variant="secondary" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )
                }
                return null
              })()}

              {/* Capabilities */}
              <div>
                <Label>Capabilities</Label>
                <div className="mt-2 space-y-2">
                  {vendors
                    .find(v => v.id === selectedVendor)
                    ?.capabilities.slice(0, 3)
                    .map((cap, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>
                          {cap.type === 'read' && 'Read'}
                          {cap.type === 'write' && 'Write'}
                          {cap.type === 'webhook' && 'Webhook'}
                          {cap.type === 'realtime' && 'Real-time'}
                          {cap.type === 'batch' && 'Batch'}
                        </span>
                        <span className="text-muted-foreground">{cap.resource}</span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!selectedVendor || !connectorName || isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Cable className="h-4 w-4 mr-2" />
                Create Connector
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
