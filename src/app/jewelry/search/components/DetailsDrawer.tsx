'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  X, 
  ExternalLink, 
  Edit, 
  RefreshCw, 
  Award, 
  FileText, 
  Calendar,
  DollarSign,
  Hash,
  Type,
  Link as LinkIcon,
  Activity,
  Info
} from 'lucide-react'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

// Mock detail data
const MOCK_DETAILS = {
  jewelry_1: {
    entity_id: 'jewelry_1',
    entity_name: 'Diamond Solitaire Ring',
    entity_type: 'JEWELRY_ITEM',
    smart_code: 'HERA.JEWELRY.ITEM.RING.SOLITAIRE.V1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    dynamic_data: {
      item_type: 'ring',
      metal_type: 'platinum',
      stone_type: 'diamond',
      carat_weight: 1.5,
      price: 15000,
      status: 'available',
      color: 'D',
      clarity: 'VVS1',
      cut: 'Excellent',
      polish: 'Excellent',
      symmetry: 'Excellent',
      fluorescence: 'None',
      certification: 'GIA',
      serial_number: 'DIA-2024-001',
      location: 'Display Case A-1',
      description: 'Stunning 1.5ct diamond solitaire ring in platinum setting'
    },
    relationships: [
      {
        type: 'HAS_CERTIFICATE',
        to_entity_id: 'cert_1',
        to_entity_name: 'GIA-2024-001',
        created_at: '2024-01-15T15:00:00Z'
      },
      {
        type: 'CREATED_BY',
        to_entity_id: 'user_1',
        to_entity_name: 'John Smith',
        created_at: '2024-01-15T10:00:00Z'
      }
    ],
    activity: [
      {
        id: '1',
        action: 'created',
        description: 'Item created in inventory',
        user: 'John Smith',
        timestamp: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        action: 'updated',
        description: 'Price updated from $14,500 to $15,000',
        user: 'Jane Doe',
        timestamp: '2024-01-15T14:30:00Z'
      },
      {
        id: '3',
        action: 'certified',
        description: 'GIA certificate linked',
        user: 'System',
        timestamp: '2024-01-15T15:00:00Z'
      }
    ]
  },
  grading_1: {
    entity_id: 'grading_1',
    entity_name: 'GJ-2024-001',
    entity_type: 'GRADING_JOB',
    smart_code: 'HERA.JEWELRY.GRADING.JOB.STANDARD.V1',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-16T16:45:00Z',
    dynamic_data: {
      status: 'in_progress',
      priority: 'high',
      assigned_to: 'John Smith',
      due_date: '2024-02-01',
      customer_name: 'Alice Johnson',
      item_description: '2ct Diamond Ring',
      estimated_value: 25000,
      notes: 'Customer requested priority grading for insurance purposes'
    },
    relationships: [
      {
        type: 'FOR_ITEM',
        to_entity_id: 'jewelry_2',
        to_entity_name: 'Customer Diamond Ring',
        created_at: '2024-01-10T09:00:00Z'
      },
      {
        type: 'ASSIGNED_TO',
        to_entity_id: 'user_1',
        to_entity_name: 'John Smith',
        created_at: '2024-01-10T09:15:00Z'
      }
    ],
    activity: [
      {
        id: '1',
        action: 'created',
        description: 'Grading job created',
        user: 'Reception',
        timestamp: '2024-01-10T09:00:00Z'
      },
      {
        id: '2',
        action: 'assigned',
        description: 'Assigned to John Smith',
        user: 'Manager',
        timestamp: '2024-01-10T09:15:00Z'
      },
      {
        id: '3',
        action: 'started',
        description: 'Grading process started',
        user: 'John Smith',
        timestamp: '2024-01-16T16:45:00Z'
      }
    ]
  }
}

interface DetailsDrawerProps {
  isOpen: boolean
  entityId: string | null
  onClose: () => void
  organizationId: string
  userRole: string
}

export function DetailsDrawer({
  isOpen,
  entityId,
  onClose,
  organizationId,
  userRole
}: DetailsDrawerProps) {
  const [entity, setEntity] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Load entity details
  useEffect(() => {
    if (entityId && isOpen) {
      setLoading(true)
      // In production, this would use useUniversalEntityDetail
      setTimeout(() => {
        const mockData = MOCK_DETAILS[entityId as keyof typeof MOCK_DETAILS]
        setEntity(mockData || null)
        setLoading(false)
      }, 500)
    }
  }, [entityId, isOpen])

  // Format field value
  const formatFieldValue = (value: any, key: string) => {
    if (value === null || value === undefined) return '-'

    if (key.includes('date') || key.includes('_at')) {
      return new Date(value).toLocaleString()
    }

    if (key === 'price' || key.includes('amount') || key.includes('value')) {
      return `$${parseFloat(value).toLocaleString()}`
    }

    if (key === 'carat_weight') {
      return `${value}ct`
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }

    return String(value)
  }

  // Get field icon
  const getFieldIcon = (key: string, type?: string) => {
    if (key.includes('date') || key.includes('_at')) return Calendar
    if (key.includes('price') || key.includes('amount') || key.includes('value')) return DollarSign
    if (key.includes('number') || key.includes('weight') || key.includes('count')) return Hash
    return Type
  }

  // Render action buttons
  const renderActions = () => {
    if (!entity) return null

    const actions = []

    // Edit action
    if (['owner', 'manager'].includes(userRole)) {
      actions.push(
        <Button
          key="edit"
          variant="outline"
          className="border-yellow-500/50 text-yellow-400"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      )
    }

    // Entity-specific actions
    if (entity.entity_type === 'GRADING_JOB') {
      if (['owner', 'manager', 'grader'].includes(userRole)) {
        actions.push(
          <Button
            key="regrade"
            variant="outline"
            className="border-blue-500/50 text-blue-400"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regrade
          </Button>
        )
      }

      if (['owner', 'manager'].includes(userRole)) {
        actions.push(
          <Button
            key="certificate"
            className="bg-green-600 hover:bg-green-700"
          >
            <Award className="h-4 w-4 mr-2" />
            Issue Certificate
          </Button>
        )
      }
    }

    if (entity.entity_type === 'CERTIFICATE') {
      actions.push(
        <Button
          key="download"
          variant="outline"
          className="border-green-500/50 text-green-400"
        >
          <FileText className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      )
    }

    return actions
  }

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[700px] glass-card border-yellow-500/30 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
          </div>
        ) : entity ? (
          <>
            <SheetHeader className="pb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <SheetTitle className="text-xl text-yellow-400 mb-2">
                    {entity.entity_name}
                  </SheetTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      {entity.entity_type.replace('_', ' ')}
                    </Badge>
                    {entity.dynamic_data?.status && (
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {entity.dynamic_data.status.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 font-mono">
                    {entity.smart_code}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Updated {new Date(entity.updated_at).toLocaleString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {renderActions()}
              </div>
            </SheetHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                <TabsTrigger value="overview" className="data-[state=active]:bg-yellow-500/20">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="relationships" className="data-[state=active]:bg-yellow-500/20">
                  Relationships
                </TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-yellow-500/20">
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <Card className="glass-card border-yellow-500/30">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
                      <Info className="h-5 w-5 mr-2" />
                      Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(entity.dynamic_data || {}).map(([key, value]) => {
                        const Icon = getFieldIcon(key)
                        return (
                          <div key={key} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
                            <Icon className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-300 capitalize">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm text-gray-100 break-words">
                                {formatFieldValue(value, key)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <Separator className="my-6 bg-yellow-500/30" />

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Entity ID</p>
                        <p className="text-gray-100 font-mono">{entity.entity_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Created</p>
                        <p className="text-gray-100">{new Date(entity.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="relationships" className="mt-6">
                <Card className="glass-card border-yellow-500/30">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
                      <LinkIcon className="h-5 w-5 mr-2" />
                      Relationships
                    </h3>
                    
                    {entity.relationships && entity.relationships.length > 0 ? (
                      <div className="space-y-3">
                        {entity.relationships.map((rel: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className="bg-purple-500/20 text-purple-400">
                                  {rel.type.replace(/_/g, ' ')}
                                </Badge>
                                <ExternalLink className="h-4 w-4 text-gray-400" />
                              </div>
                              <p className="text-sm text-gray-100 mt-1">
                                {rel.to_entity_name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Created {new Date(rel.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-yellow-400 hover:text-yellow-300"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <LinkIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No relationships found</p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card className="glass-card border-yellow-500/30">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center">
                      <Activity className="h-5 w-5 mr-2" />
                      Activity Log
                    </h3>
                    
                    {entity.activity && entity.activity.length > 0 ? (
                      <div className="space-y-4">
                        {entity.activity.map((activity: any) => (
                          <div key={activity.id} className="flex gap-3">
                            <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-100">
                                  {activity.description}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(activity.timestamp).toLocaleString()}
                                </p>
                              </div>
                              <p className="text-xs text-gray-400 mt-1">
                                by {activity.user}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No activity recorded</p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-gray-500">
              <p>Entity not found</p>
              <p className="text-sm mt-2">The requested entity could not be loaded</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}