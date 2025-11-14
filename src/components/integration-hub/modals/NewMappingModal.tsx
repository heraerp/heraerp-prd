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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Loader2, GitBranch, Sparkles, ArrowRight } from 'lucide-react'
import { useCreateMapping } from '@/hooks/integration-hub/useMappings'
import type { IntegrationConnector, FieldMapping } from '@/types/integration-hub'

interface NewMappingModalProps {
  open: boolean
  onClose: () => void
  organizationId: string
  connectors: IntegrationConnector[]
}

// Mock resources - in production, these would be fetched from connectors
const RESOURCES = {
  microsoft_365: ['contacts', 'emails', 'calendar'],
  google: ['contacts', 'emails', 'calendar'],
  mailchimp: ['contacts', 'campaigns', 'lists'],
  linkedin: ['profile', 'connections', 'posts'],
  bluesky: ['posts', 'profile', 'feed'],
  twinfield: ['invoices', 'customers', 'suppliers'],
  craft_cms: ['entries', 'assets', 'users'],
  eventbrite: ['events', 'attendees', 'orders'],
  power_bi: ['reports', 'datasets', 'dashboards'],
  tableau: ['workbooks', 'views', 'datasources']
}

export function NewMappingModal({
  open,
  onClose,
  organizationId,
  connectors
}: NewMappingModalProps) {
  const [mappingName, setMappingName] = useState('')
  const [selectedConnector, setSelectedConnector] = useState('')
  const [selectedResource, setSelectedResource] = useState('')
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([])

  const { mutate: createMapping, isPending } = useCreateMapping()

  const selectedConnectorData = connectors.find(c => c.id === selectedConnector)
  const availableResources = selectedConnectorData
    ? RESOURCES[selectedConnectorData.vendor as keyof typeof RESOURCES] || []
    : []

  const handleAutoGenerate = () => {
    // Mock auto-generated field mappings
    const mockMappings: FieldMapping[] = [
      {
        id: '1',
        source_field: 'email',
        target_field: 'entity_metadata.email',
        is_key: true
      },
      {
        id: '2',
        source_field: 'firstName',
        target_field: 'entity_metadata.first_name'
      },
      {
        id: '3',
        source_field: 'lastName',
        target_field: 'entity_metadata.last_name'
      },
      {
        id: '4',
        source_field: 'company',
        target_field: 'entity_metadata.company_name'
      }
    ]
    setFieldMappings(mockMappings)
  }

  const handleCreate = () => {
    if (!mappingName || !selectedConnector || !selectedResource) return

    createMapping(
      {
        organizationId,
        connectorId: selectedConnector,
        name: mappingName,
        resource: selectedResource,
        fieldMappings
      },
      {
        onSuccess: () => {
          onClose()
          // Reset form
          setMappingName('')
          setSelectedConnector('')
          setSelectedResource('')
          setFieldMappings([])
        }
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Data Mapping</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mapping Name */}
          <div>
            <Label htmlFor="name">Mapping Name</Label>
            <Input
              id="name"
              value={mappingName}
              onChange={e => setMappingName(e.target.value)}
              placeholder="e.g. CRM Contact Sync"
              className="mt-1"
            />
          </div>

          {/* Connector Selection */}
          <div>
            <Label htmlFor="connector">Connector</Label>
            <Select value={selectedConnector} onValueChange={setSelectedConnector}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a connector" />
              </SelectTrigger>
              <SelectContent>
                {connectors.map(connector => (
                  <SelectItem key={connector.id} value={connector.id}>
                    <div className="flex items-center gap-2">
                      <span>{connector.entity_name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {connector.vendor}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resource Selection */}
          {selectedConnector && (
            <div>
              <Label htmlFor="resource">Resource Type</Label>
              <Select value={selectedResource} onValueChange={setSelectedResource}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a resource" />
                </SelectTrigger>
                <SelectContent>
                  {availableResources.map(resource => (
                    <SelectItem key={resource} value={resource}>
                      <span className="capitalize">{resource}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Field Mappings */}
          {selectedResource && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Field Mappings</Label>
                <Button size="sm" variant="outline" onClick={handleAutoGenerate} className="gap-2">
                  <Sparkles className="h-3 w-3" />
                  Auto-generate
                </Button>
              </div>

              {fieldMappings.length > 0 ? (
                <div className="space-y-2">
                  {fieldMappings.map((mapping, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{mapping.source_field}</div>
                            <div className="text-xs text-muted-foreground">Source field</div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="text-sm font-medium">{mapping.target_field}</div>
                            <div className="text-xs text-muted-foreground">HERA field</div>
                          </div>
                        </div>
                        {mapping.is_key && (
                          <Badge variant="secondary" className="ml-2">
                            Key
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <GitBranch className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No field mappings configured yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAutoGenerate}
                    className="mt-4 gap-2"
                  >
                    <Sparkles className="h-3 w-3" />
                    Auto-generate mappings
                  </Button>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !mappingName ||
              !selectedConnector ||
              !selectedResource ||
              fieldMappings.length === 0 ||
              isPending
            }
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4 mr-2" />
                Create Mapping
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
