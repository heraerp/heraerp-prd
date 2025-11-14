'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Link, Users, Mail, Calendar, Plus, Trash2, AlertCircle } from 'lucide-react'
import { useSaveMapping } from '@/hooks/use-integrations'
import { useToast } from '@/components/ui/use-toast'
import type { Connector, ConnectorMapping } from '@/types/integrations'
import { useQuery } from '@tanstack/react-query'
import { useOrgStore } from '@/state/org'

interface MappingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  connector: Connector
}

interface MappingRow {
  id?: string
  mapping_type: string
  source_id: string
  source_name: string
  target_id: string
  target_name: string
  is_active: boolean
}

export function MappingModal({ open, onOpenChange, connector }: MappingModalProps) {
  const { toast } = useToast()
  const { currentOrgId } = useOrgStore()
  const [activeTab, setActiveTab] = useState('lists')
  const [mappings, setMappings] = useState<MappingRow[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  const saveMutation = useSaveMapping()

  // Fetch existing mappings
  const { data: existingMappings } = useQuery({
    queryKey: ['connector-mappings', connector.id],
    queryFn: async () => {
      // Query relationships where from_entity is the connector
      const response = await fetch(
        `/api/v2/universal/relationships?from_entity_id=${connector.id}`,
        {
          headers: {
            'X-Organization-Id': currentOrgId!
          }
        }
      )
      return response.json()
    },
    enabled: open && !!connector.id
  })

  // Fetch available targets (audiences, campaigns, programs)
  const { data: audiences } = useQuery({
    queryKey: ['audiences-for-mapping', currentOrgId],
    queryFn: async () => {
      const response = await fetch('/api/civicflow/communications/audiences', {
        headers: {
          'X-Organization-Id': currentOrgId!
        }
      })
      const data = await response.json()
      return data.items || []
    },
    enabled: open && !!currentOrgId
  })

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns-for-mapping', currentOrgId],
    queryFn: async () => {
      const response = await fetch('/api/civicflow/communications/campaigns', {
        headers: {
          'X-Organization-Id': currentOrgId!
        }
      })
      const data = await response.json()
      return data.items || []
    },
    enabled: open && !!currentOrgId
  })

  // Load existing mappings when modal opens
  useEffect(() => {
    if (existingMappings?.items) {
      const loadedMappings: MappingRow[] = existingMappings.items.map((rel: any) => ({
        id: rel.id,
        mapping_type: rel.relationship_type,
        source_id: rel.metadata?.source_id || '',
        source_name: rel.metadata?.source_name || '',
        target_id: rel.to_entity_id,
        target_name: rel.metadata?.target_name || '',
        is_active: rel.metadata?.is_active ?? true
      }))
      setMappings(loadedMappings)
    }
  }, [existingMappings])

  const getSourceOptions = () => {
    // In a real implementation, these would come from the connector's API
    switch (connector.vendor) {
      case 'mailchimp':
        return [
          { id: 'list_1', name: 'Newsletter Subscribers' },
          { id: 'list_2', name: 'Event Attendees' },
          { id: 'list_3', name: 'VIP Members' }
        ]
      case 'eventbrite':
        return [
          { id: 'event_1', name: 'Annual Town Hall 2024' },
          { id: 'event_2', name: 'Community Workshop Series' },
          { id: 'event_3', name: 'Summer Festival' }
        ]
      default:
        return []
    }
  }

  const getTargetOptions = () => {
    switch (activeTab) {
      case 'lists':
        return audiences?.map((a: any) => ({ id: a.id, name: a.entity_name })) || []
      case 'campaigns':
        return campaigns?.map((c: any) => ({ id: c.id, name: c.entity_name })) || []
      case 'events':
        // Would fetch programs/events
        return [
          { id: 'prog_1', name: 'Community Engagement Program' },
          { id: 'prog_2', name: 'Youth Development Initiative' }
        ]
      default:
        return []
    }
  }

  const getMappingType = () => {
    switch (activeTab) {
      case 'lists':
        return 'list_to_audience'
      case 'campaigns':
        return 'campaign_to_campaign'
      case 'events':
        return 'event_to_program'
      default:
        return ''
    }
  }

  const handleAddMapping = () => {
    const newMapping: MappingRow = {
      mapping_type: getMappingType(),
      source_id: '',
      source_name: '',
      target_id: '',
      target_name: '',
      is_active: true
    }
    setMappings([...mappings, newMapping])
    setHasChanges(true)
  }

  const handleUpdateMapping = (index: number, field: keyof MappingRow, value: any) => {
    const updated = [...mappings]
    updated[index] = { ...updated[index], [field]: value }

    // If source or target changed, update the name
    if (field === 'source_id') {
      const source = getSourceOptions().find(s => s.id === value)
      if (source) {
        updated[index].source_name = source.name
      }
    } else if (field === 'target_id') {
      const target = getTargetOptions().find(t => t.id === value)
      if (target) {
        updated[index].target_name = target.name
      }
    }

    setMappings(updated)
    setHasChanges(true)
  }

  const handleRemoveMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      // Save each mapping
      for (const mapping of mappings) {
        if (mapping.source_id && mapping.target_id) {
          await saveMutation.mutateAsync({
            ...mapping,
            connector_id: connector.id
          })
        }
      }

      setHasChanges(false)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save mappings:', error)
    }
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'lists':
        return <Users className="h-4 w-4" />
      case 'campaigns':
        return <Mail className="h-4 w-4" />
      case 'events':
        return <Calendar className="h-4 w-4" />
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure {connector.vendor} Mapping</DialogTitle>
          <DialogDescription>
            Map your {connector.vendor} data to CivicFlow entities for automatic synchronization.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lists" className="gap-2">
              {getTabIcon('lists')}
              Lists & Audiences
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2">
              {getTabIcon('campaigns')}
              Campaigns
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="gap-2"
              disabled={connector.vendor !== 'eventbrite'}
            >
              {getTabIcon('events')}
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {activeTab === 'lists' && 'List to Audience Mapping'}
                      {activeTab === 'campaigns' && 'Campaign Mapping'}
                      {activeTab === 'events' && 'Event to Program Mapping'}
                    </CardTitle>
                    <CardDescription>
                      {activeTab === 'lists' && 'Map external lists to your CivicFlow audiences'}
                      {activeTab === 'campaigns' && 'Link campaigns for unified tracking'}
                      {activeTab === 'events' && 'Connect events to your programs'}
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddMapping} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Mapping
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {mappings.filter(m => m.mapping_type === getMappingType()).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No mappings configured yet.</p>
                    <p className="text-sm">Click "Add Mapping" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {mappings
                      .filter(m => m.mapping_type === getMappingType())
                      .map((mapping, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <Label className="text-xs">Source</Label>
                            <Select
                              value={mapping.source_id}
                              onValueChange={value =>
                                handleUpdateMapping(index, 'source_id', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                              <SelectContent>
                                {getSourceOptions().map(option => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <ArrowRight className="h-4 w-4 text-muted-foreground" />

                          <div className="flex-1">
                            <Label className="text-xs">Target</Label>
                            <Select
                              value={mapping.target_id}
                              onValueChange={value =>
                                handleUpdateMapping(index, 'target_id', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select target" />
                              </SelectTrigger>
                              <SelectContent>
                                {getTargetOptions().map(option => (
                                  <SelectItem key={option.id} value={option.id}>
                                    {option.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={mapping.is_active}
                              onCheckedChange={checked =>
                                handleUpdateMapping(index, 'is_active', checked)
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveMapping(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save Mappings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
