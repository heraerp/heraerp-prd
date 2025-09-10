'use client'

// HERA Universal Resource Panel
// Manages calendar resources across all industries

import React, { useState, useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Users,
  Plus,
  Search,
  Filter,
  Settings,
  BarChart3,
  Clock,
  MapPin,
  Wrench,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Activity
} from 'lucide-react'

import { 
  ResourceManagerProps,
  UniversalResource,
  ResourceUtilization
} from '@/types/calendar.types'
import { calendarSmartCodeService } from '@/services/calendarSmartCodeService'
import { useCalendarAPI } from '@/services/calendarAPI'

import { ResourceCreateModal } from './ResourceCreateModal'
import { ResourceEditModal } from './ResourceEditModal'

export function ResourcePanel({
  organization_id,
  industry_type,
  resources,
  is_open,
  on_close,
  on_resource_create,
  on_resource_update,
  on_resource_delete,
  show_utilization = true,
  show_analytics = true
}: ResourceManagerProps & {
  is_open: boolean
  on_close: () => void
}) {

  // ==================== STATE MANAGEMENT ====================
  const [activeTab, setActiveTab] = useState('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<UniversalResource | null>(null)
  const [utilizationData, setUtilizationData] = useState<ResourceUtilization[]>([])
  const [loading, setLoading] = useState(false)

  // API instance
  const calendarAPI = useCalendarAPI(organization_id, 'current-user')

  // ==================== COMPUTED VALUES ====================
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesSearch = resource.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           resource.entity_code.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = selectedResourceType === 'all' || resource.resource_type === selectedResourceType
      const matchesStatus = selectedStatus === 'all' || resource.status === selectedStatus
      
      return matchesSearch && matchesType && matchesStatus
    })
  }, [resources, searchQuery, selectedResourceType, selectedStatus])

  const resourceTypes = useMemo(() => {
    const types = Array.from(new Set(resources.map(r => r.resource_type)))
    return types.sort()
  }, [resources])

  const resourceStats = useMemo(() => {
    const total = resources.length
    const active = resources.filter(r => r.status === 'active').length
    const maintenance = resources.filter(r => r.status === 'maintenance').length
    const inactive = resources.filter(r => r.status === 'inactive').length
    
    return { total, active, maintenance, inactive }
  }, [resources])

  // ==================== EVENT HANDLERS ====================
  const handleCreateResource = async (resourceData: Partial<UniversalResource>) => {
    try {
      await on_resource_create(resourceData)
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Failed to create resource:', error)
    }
  }

  const handleUpdateResource = async (resource: UniversalResource) => {
    try {
      await on_resource_update(resource)
      setEditingResource(null)
    } catch (error) {
      console.error('Failed to update resource:', error)
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      try {
        await on_resource_delete(resourceId)
      } catch (error) {
        console.error('Failed to delete resource:', error)
      }
    }
  }

  const loadUtilizationData = async () => {
    if (!show_utilization) return
    
    setLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      
      const utilization = await calendarAPI.getResourceUtilization(
        resources.map(r => r.entity_id),
        startDate,
        endDate,
        'week'
      )
      
      setUtilizationData(utilization)
    } catch (error) {
      console.error('Failed to load utilization data:', error)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    if (is_open && show_utilization) {
      loadUtilizationData()
    }
  }, [is_open, show_utilization, resources])

  // ==================== RENDER HELPERS ====================
  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'STAFF': return <Users className="h-4 w-4" />
      case 'EQUIPMENT': return <Wrench className="h-4 w-4" />
      case 'ROOM': return <MapPin className="h-4 w-4" />
      case 'VEHICLE': return <Activity className="h-4 w-4" />
      case 'VIRTUAL': return <Settings className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-orange-100 text-orange-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUtilizationForResource = (resourceId: string): ResourceUtilization | undefined => {
    return utilizationData.find(u => u.resource_entity_id === resourceId)
  }

  const renderResourceCard = (resource: UniversalResource) => {
    const utilization = getUtilizationForResource(resource.entity_id)
    
    return (
      <Card key={resource.entity_id} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getResourceIcon(resource.resource_type)}
              <div>
                <CardTitle className="text-base">{resource.entity_name}</CardTitle>
                <CardDescription className="text-sm">
                  {resource.entity_code} • {resource.resource_type}
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(resource.status)} variant="secondary">
                {resource.status}
              </Badge>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingResource(resource)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteResource(resource.entity_id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Resource Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {resource.capacity && (
              <div>
                <span className="font-medium">Capacity:</span> {resource.capacity}
              </div>
            )}
            {resource.location && (
              <div>
                <span className="font-medium">Location:</span> {resource.location}
              </div>
            )}
            
            {resource.cost_per_hour && (
              <div>
                <span className="font-medium">Cost/Hour:</span> ${resource.cost_per_hour}
              </div>
            )}
            
            {resource.skills && resource.skills.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium">Skills:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {resource.skills.slice(0, 5).map(skill => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {resource.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{resource.skills.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Utilization */}
          {show_utilization && utilization && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Utilization (30 days)</span>
                <span>{Math.round(utilization.utilization_percentage)}%</span>
              </div>
              <Progress 
                value={utilization.utilization_percentage} 
                className="h-2"
              />
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div>
                  <span className="font-medium">{utilization.appointments_count}</span> appointments
                </div>
                <div>
                  <span className="font-medium">{Math.round(utilization.total_booked_hours)}</span> hours booked
                </div>
                {utilization.revenue_generated && (
                  <div>
                    <span className="font-medium">${utilization.revenue_generated.toLocaleString()}</span> revenue
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Smart Code */}
          <div className="text-xs text-gray-500">
            <code>{resource.smart_code}</code>
            {resource.ai_confidence && (
              <span className="ml-2">
                • AI Confidence: {Math.round(resource.ai_confidence * 100)}%
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderAnalytics = () => {
    if (!show_analytics || utilizationData.length === 0) {
      return (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No analytics data available</p>
        </div>
      )
    }

    const avgUtilization = utilizationData.reduce((sum, u) => sum + u.utilization_percentage, 0) / utilizationData.length
    const totalRevenue = utilizationData.reduce((sum, u) => sum + (u.revenue_generated || 0), 0)
    const totalAppointments = utilizationData.reduce((sum, u) => sum + u.appointments_count, 0)
    
    const topPerformers = utilizationData
      .sort((a, b) => b.utilization_percentage - a.utilization_percentage)
      .slice(0, 5)
    
    const underUtilized = utilizationData
      .filter(u => u.utilization_percentage < 50)
      .sort((a, b) => a.utilization_percentage - b.utilization_percentage)
      .slice(0, 5)

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{Math.round(avgUtilization)}%</div>
              <div className="text-sm text-gray-600">Avg Utilization</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{totalAppointments}</div>
              <div className="text-sm text-gray-600">Total Appointments</div>
            </CardContent>
          </Card>
          
          {totalRevenue > 0 && (
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Revenue</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Top Performers */}
        {topPerformers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topPerformers.map(utilization => (
                <div key={utilization.resource_entity_id} className="flex items-center justify-between">
                  <span className="font-medium">{utilization.resource_name}</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={utilization.utilization_percentage} 
                      className="w-20 h-2"
                    />
                    <span className="text-sm w-12 text-right">
                      {Math.round(utilization.utilization_percentage)}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Under-utilized Resources */}
        {underUtilized.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
                Under-utilized Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {underUtilized.map(utilization => (
                <div key={utilization.resource_entity_id} className="flex items-center justify-between">
                  <span className="font-medium">{utilization.resource_name}</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={utilization.utilization_percentage} 
                      className="w-20 h-2"
                    />
                    <span className="text-sm w-12 text-right text-orange-600">
                      {Math.round(utilization.utilization_percentage)}%
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ==================== RENDER ====================
  return (
    <>
      <Sheet open={is_open} onOpenChange={on_close}>
        <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Resource Management</span>
              <Badge variant="outline">{industry_type}</Badge>
            </SheetTitle>
            <SheetDescription>
              Manage calendar resources for {organization_id}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold">{resourceStats.total}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-green-600">{resourceStats.active}</div>
                  <div className="text-xs text-gray-600">Active</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-orange-600">{resourceStats.maintenance}</div>
                  <div className="text-xs text-gray-600">Maintenance</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <div className="text-lg font-bold text-gray-600">{resourceStats.inactive}</div>
                  <div className="text-xs text-gray-600">Inactive</div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="list">Resources</TabsTrigger>
                  {show_analytics && (
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  )}
                </TabsList>
                
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </Button>
              </div>

              <TabsContent value="list" className="space-y-4">
                {/* Filters */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search resources..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    <select
                      value={selectedResourceType}
                      onChange={(e) => setSelectedResourceType(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All Types</option>
                      {resourceTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Resource List */}
                <div className="space-y-3">
                  {filteredResources.length > 0 ? (
                    filteredResources.map(renderResourceCard)
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600">No resources found</p>
                      {searchQuery && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearchQuery('')}
                          className="mt-2"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              {show_analytics && (
                <TabsContent value="analytics">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p>Loading analytics...</p>
                    </div>
                  ) : (
                    renderAnalytics()
                  )}
                </TabsContent>
              )}
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Resource Create Modal */}
      <ResourceCreateModal
        organization_id={organization_id}
        industry_type={industry_type}
        is_open={isCreateModalOpen}
        on_close={() => setIsCreateModalOpen(false)}
        on_save={handleCreateResource}
      />

      {/* Resource Pencil Modal */}
      {editingResource && (
        <ResourceEditModal
          organization_id={organization_id}
          resource={editingResource}
          is_open={!!editingResource}
          on_close={() => setEditingResource(null)}
          on_save={handleUpdateResource}
        />
      )}
    </>
  )
}