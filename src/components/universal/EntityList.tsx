'use client'

/**
 * Universal Entity List Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.ENTITY_LIST.v1
 * 
 * Generic list component for any entity type
 * Dynamically configures based on entity type and parameters
 */

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Search, Filter, Download, Trash2, Edit, Eye, CheckCircle, AlertCircle } from 'lucide-react'
import type { DynamicComponentProps } from '@/lib/hera/component-loader'
import { CashewEntitiesAPI, CashewEntityTypes } from '@/lib/cashew/api-client'
import { useSafeHERAAuth } from '@/components/auth/SafeHERAAuth'

interface EntityListProps extends DynamicComponentProps {
  entityType: string
}

export function EntityList({ 
  resolvedOperation, 
  orgId, 
  actorId, 
  entityType, 
  searchParams 
}: EntityListProps) {
  const [entities, setEntities] = useState<any[]>([])
  const [filteredEntities, setFilteredEntities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedEntities, setSelectedEntities] = useState<string[]>([])
  const [sortField, setSortField] = useState('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const { organization } = useSafeHERAAuth()

  useEffect(() => {
    const loadEntities = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Use real HERA API for cashew entities, fallback to mock for others
        if (Object.values(CashewEntityTypes).includes(entityType as any) && organization?.id) {
          console.log(`[EntityList] Loading real cashew entities for type: ${entityType}`)
          
          const { data, error: apiError } = await CashewEntitiesAPI.listEntities(
            entityType,
            organization.id,
            { limit: 50 }
          )
          
          if (apiError) {
            console.warn(`[EntityList] API error for ${entityType}:`, apiError)
            // Fallback to mock data on API error
            setEntities(generateMockEntities(entityType))
          } else {
            console.log(`[EntityList] Loaded ${data.length} real entities for ${entityType}`)
            // Transform API data to UI format
            setEntities(transformApiEntitiesToUI(data, entityType))
          }
        } else {
          // Non-cashew entities or missing org context - use mock data
          console.log(`[EntityList] Using mock data for type: ${entityType}`)
          await new Promise(resolve => setTimeout(resolve, 500)) // Simulate network delay
          setEntities(generateMockEntities(entityType))
        }
      } catch (err) {
        console.error(`[EntityList] Error loading entities:`, err)
        setError(err instanceof Error ? err.message : 'Failed to load entities')
        // Fallback to mock data on error
        setEntities(generateMockEntities(entityType))
      } finally {
        setLoading(false)
      }
    }

    loadEntities()
  }, [entityType, organization?.id])

  // Filter and sort entities
  useEffect(() => {
    let filtered = [...entities]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(entity => 
        Object.values(entity).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entity => entity.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = String(a[sortField] || '').toLowerCase()
      const bValue = String(b[sortField] || '').toLowerCase()
      
      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue)
      } else {
        return bValue.localeCompare(aValue)
      }
    })

    setFilteredEntities(filtered)
  }, [entities, searchTerm, statusFilter, sortField, sortDirection])

  const getEntityConfig = (type: string) => {
    const configs: Record<string, any> = {
      CUSTOMER: {
        title: 'Customers',
        description: 'Manage your customer database',
        icon: '👥',
        createPath: resolvedOperation.canonical_path.replace('/list', '/create'),
        fields: ['name', 'email', 'phone', 'status']
      },
      VENDOR: {
        title: 'Vendors',
        description: 'Manage vendor relationships',
        icon: '🏢',
        createPath: resolvedOperation.canonical_path.replace('/list', '/create'),
        fields: ['name', 'category', 'contact', 'status']
      },
      JEWELRY_APPRAISAL: {
        title: 'Jewelry Appraisals',
        description: 'Track jewelry appraisal requests',
        icon: '💎',
        createPath: resolvedOperation.canonical_path.replace('/list', '/create'),
        fields: ['item', 'appraiser', 'value', 'status']
      },
      WM_ROUTE: {
        title: 'Waste Management Routes',
        description: 'Optimize collection routes',
        icon: '🚛',
        createPath: resolvedOperation.canonical_path.replace('/list', '/create'),
        fields: ['route', 'driver', 'zone', 'status']
      },

      // Cashew Manufacturing Entity Types
      MATERIAL: {
        title: 'Materials',
        description: 'Manage raw materials, packaging, and consumables',
        icon: '📦',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/cashew/materials/create',
        fields: ['materialName', 'materialType', 'uom', 'stdCostPerUom', 'supplierCode']
      },
      
      PRODUCT: {
        title: 'Products (Cashew Grades)',
        description: 'Manage finished cashew kernel grades',
        icon: '🥜',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/cashew/products/create',
        fields: ['grade', 'packSizeKg', 'stdYieldPct', 'exportHsCode']
      },
      
      BATCH: {
        title: 'Production Batches',
        description: 'Track cashew processing batches',
        icon: '🏭',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/cashew/batches/create',
        fields: ['batchNo', 'productId', 'locationId', 'targetOutputKg', 'status']
      },
      
      WORK_CENTER: {
        title: 'Work Centers',
        description: 'Manage processing work centers',
        icon: '⚙️',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/cashew/work-centers/create',
        fields: ['wcName', 'wcType', 'capacityKgPerShift', 'stdLabourRatePerHr']
      },
      
      LOCATION: {
        title: 'Locations',
        description: 'Manage plants and warehouses',
        icon: '🏢',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/cashew/locations/create',
        fields: ['locationName', 'locationType']
      },
      
      BOM: {
        title: 'Bills of Materials',
        description: 'Manage production BOMs',
        icon: '📋',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/cashew/boms/create',
        fields: ['productCode', 'bomUom', 'stdBatchSizeKg', 'scrapPct']
      },
      
      COST_CENTER: {
        title: 'Cost Centers',
        description: 'Manage cost centers for expense tracking',
        icon: '💰',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/cashew/cost-centers/create',
        fields: ['centerName', 'centerType']
      },
      
      PROFIT_CENTER: {
        title: 'Profit Centers',
        description: 'Manage profit centers for reporting',
        icon: '📊',
        createPath: resolvedOperation.canonical_path?.replace('/list', '/create') || '/cashew/profit-centers/create',
        fields: ['centerName', 'isReportableSegment']
      }
    }
    
    return configs[type] || {
      title: `${type} List`,
      description: `Manage ${type.toLowerCase()} records`,
      icon: '📋',
      createPath: '/create',
      fields: ['name', 'status']
    }
  }

  const config = getEntityConfig(entityType)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading {config.title}...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <span className="text-2xl">{config.icon}</span>
            {config.title}
          </h1>
          <p className="text-muted-foreground mt-1">{config.description}</p>
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <span>HERA</span>
            <span>→</span>
            <span>{resolvedOperation.params?.module || 'Module'}</span>
            <span>→</span>
            <span>{resolvedOperation.params?.area || 'Area'}</span>
            <span>→</span>
            <Badge variant="outline">{resolvedOperation.scenario}</Badge>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${config.title.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Bulk Actions */}
          {selectedEntities.length > 0 && (
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('activate')}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Activate ({selectedEntities.length})
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('deactivate')}>
                <AlertCircle className="h-4 w-4 mr-1" />
                Deactivate
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          )}
          
          <Button size="sm" asChild>
            <a href={config.createPath}>
              <Plus className="h-4 w-4 mr-2" />
              New {entityType.replace('_', ' ')}
            </a>
          </Button>
        </div>
      </div>

      {/* Debug Info */}
      <Card className="mb-6 bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Dynamic Resolution Info</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <strong>Component:</strong><br />
              <code className="text-xs">{resolvedOperation.component_id}</code>
            </div>
            <div>
              <strong>Entity Type:</strong><br />
              <code className="text-xs">{entityType}</code>
            </div>
            <div>
              <strong>Smart Code:</strong><br />
              <code className="text-xs">{resolvedOperation.smart_code}</code>
            </div>
            <div>
              <strong>Alias Hit:</strong><br />
              <Badge variant={resolvedOperation.aliasHit ? "default" : "secondary"}>
                {resolvedOperation.aliasHit ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filteredEntities.length}</div>
            <div className="text-sm text-muted-foreground">Total {config.title}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {filteredEntities.filter(e => e.status === 'Active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">
              {filteredEntities.filter(e => e.status === 'Pending').length}
            </div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {filteredEntities.filter(e => e.status === 'Inactive').length}
            </div>
            <div className="text-sm text-muted-foreground">Inactive</div>
          </CardContent>
        </Card>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select value={sortField} onValueChange={setSortField}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="updated_at">Updated Date</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
        
        {selectedEntities.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedEntities([])}
          >
            Clear Selection
          </Button>
        )}
      </div>

      {/* Entities List */}
      <div className="space-y-4">
        {filteredEntities.map((entity, index) => {
          const isSelected = selectedEntities.includes(entity.id || String(index))
          return (
            <Card key={entity.id || index} className={`hover:shadow-md transition-shadow ${isSelected ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Selection Checkbox */}
                  <div className="pt-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const entityId = entity.id || String(index)
                        if (e.target.checked) {
                          setSelectedEntities(prev => [...prev, entityId])
                        } else {
                          setSelectedEntities(prev => prev.filter(id => id !== entityId))
                        }
                      }}
                      className="w-4 h-4 text-primary bg-background border-muted-foreground rounded focus:ring-primary"
                    />
                  </div>
                  
                  {/* Entity Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{entity.name}</h3>
                      <Badge 
                        variant={entity.status === 'Active' ? 'default' : 
                                entity.status === 'Pending' ? 'secondary' : 'outline'}
                        className={entity.status === 'Active' ? 'bg-green-500' : 
                                  entity.status === 'Pending' ? 'bg-amber-500' : 'bg-red-500'}
                      >
                        {entity.status}
                      </Badge>
                      {entity.smart_code && (
                        <Badge variant="outline" className="text-xs">
                          {entity.smart_code}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Field Display Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                      {config.fields.map((field: string) => {
                        const value = entity[field]
                        if (!value || value === 'N/A') return null
                        
                        return (
                          <div key={field} className="">
                            <div className="text-muted-foreground text-xs uppercase tracking-wide">
                              {field.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="font-medium">{value}</div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Timestamps */}
                    {(entity.created_at || entity.updated_at) && (
                      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                        {entity.created_at && (
                          <span>Created: {new Date(entity.created_at).toLocaleDateString()}</span>
                        )}
                        {entity.updated_at && (
                          <span>Updated: {new Date(entity.updated_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEntityAction('view', entity)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEntityAction('edit', entity)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEntityAction('delete', entity)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredEntities.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">{config.icon}</div>
            <h3 className="text-lg font-semibold mb-2">
              {entities.length === 0 ? `No ${config.title} Found` : 'No Matching Results'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {entities.length === 0 
                ? `Get started by creating your first ${entityType.toLowerCase().replace('_', ' ')}.`
                : 'Try adjusting your search terms or filters.'
              }
            </p>
            {entities.length === 0 ? (
              <Button asChild>
                <a href={config.createPath}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First {entityType.replace('_', ' ')}
                </a>
              </Button>
            ) : (
              <div className="space-y-2">
                <Button variant="outline" onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}>
                  Clear Filters
                </Button>
                <div>
                  <Button asChild>
                    <a href={config.createPath}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create New {entityType.replace('_', ' ')}
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Handle bulk actions
  function handleBulkAction(action: 'activate' | 'deactivate' | 'export') {
    console.log(`Bulk ${action} for entities:`, selectedEntities)
    
    switch (action) {
      case 'activate':
        alert(`Activating ${selectedEntities.length} ${entityType.toLowerCase().replace('_', ' ')}(s)`)
        break
      case 'deactivate':
        alert(`Deactivating ${selectedEntities.length} ${entityType.toLowerCase().replace('_', ' ')}(s)`)
        break
      case 'export':
        // Create CSV export
        const csvData = filteredEntities
          .filter(entity => selectedEntities.includes(entity.id || entity.name))
          .map(entity => {
            const row: any = {}
            config.fields.forEach(field => {
              row[field] = entity[field] || ''
            })
            return row
          })
        
        const csvContent = [
          config.fields.join(','),
          ...csvData.map(row => config.fields.map(field => `"${row[field]}"`).join(','))
        ].join('\n')
        
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${entityType.toLowerCase()}_export_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        break
    }
    
    // Clear selection after action
    setSelectedEntities([])
  }

  // Handle individual entity actions
  function handleEntityAction(action: 'view' | 'edit' | 'delete', entity: any) {
    console.log(`${action} entity:`, entity)
    
    switch (action) {
      case 'view':
        alert(`View details for: ${entity.name}`)
        break
      case 'edit':
        // Navigate to edit page
        window.location.href = `${config.createPath}?edit=${entity.id || entity.name}`
        break
      case 'delete':
        if (confirm(`Are you sure you want to delete "${entity.name}"?`)) {
          alert(`Delete confirmed for: ${entity.name}`)
          // Here you would call the actual delete API
        }
        break
    }
  }
}

/**
 * Transform API entities to UI format
 */
function transformApiEntitiesToUI(apiEntities: any[], entityType: string): any[] {
  return apiEntities.map(entity => {
    // Extract dynamic fields into flat structure for UI
    const dynamicData = entity.dynamic_data || {}
    const flatEntity: any = {
      id: entity.id,
      name: entity.entity_name,
      code: entity.entity_code,
      status: 'Active', // Default status
      smart_code: entity.smart_code,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }

    // Map dynamic fields to expected UI fields based on entity type
    Object.entries(dynamicData).forEach(([fieldName, fieldData]: [string, any]) => {
      if (fieldData?.field_value_text) {
        flatEntity[fieldName] = fieldData.field_value_text
      } else if (fieldData?.field_value_number !== undefined) {
        flatEntity[fieldName] = fieldData.field_value_number.toString()
      } else if (fieldData?.field_value_boolean !== undefined) {
        flatEntity[fieldName] = fieldData.field_value_boolean ? 'true' : 'false'
      } else if (fieldData?.field_value_date) {
        flatEntity[fieldName] = fieldData.field_value_date
      }
    })

    return flatEntity
  })
}

/**
 * Generate mock entities for demo
 */
function generateMockEntities(entityType: string): any[] {
  const mockData: Record<string, any[]> = {
    CUSTOMER: [
      { id: '1', name: 'ACME Corporation', email: 'contact@acme.com', phone: '+1-555-0123', status: 'Active', created_at: '2024-01-15T10:00:00Z', updated_at: '2024-10-30T15:30:00Z' },
      { id: '2', name: 'Global Industries', email: 'info@global.com', phone: '+1-555-0456', status: 'Active', created_at: '2024-02-20T09:15:00Z', updated_at: '2024-10-29T11:20:00Z' },
      { id: '3', name: 'Tech Solutions Ltd', email: 'hello@techsol.com', phone: '+1-555-0789', status: 'Pending', created_at: '2024-03-10T14:45:00Z', updated_at: '2024-10-31T16:10:00Z' }
    ],
    VENDOR: [
      { name: 'Premium Supplies Co', category: 'Materials', contact: 'sales@premium.com', status: 'Approved' },
      { name: 'Quick Logistics', category: 'Shipping', contact: 'ops@quicklog.com', status: 'Active' },
      { name: 'Quality Tools Inc', category: 'Equipment', contact: 'info@qualtools.com', status: 'Review' }
    ],
    JEWELRY_APPRAISAL: [
      { item: 'Diamond Ring (2.5ct)', appraiser: 'GIA Certified', value: '$15,000', status: 'Complete' },
      { item: 'Gold Necklace (18k)', appraiser: 'AGS Certified', value: '$3,200', status: 'In Progress' },
      { item: 'Ruby Earrings', appraiser: 'Independent', value: '$1,800', status: 'Pending' }
    ],
    WM_ROUTE: [
      { route: 'Downtown Circuit', driver: 'John Smith', zone: 'Zone A', status: 'Active' },
      { route: 'Industrial Park', driver: 'Maria Garcia', zone: 'Zone B', status: 'Scheduled' },
      { route: 'Residential East', driver: 'Bob Johnson', zone: 'Zone C', status: 'Completed' }
    ],
    
    // Cashew Manufacturing Entity Mock Data
    MATERIAL: [
      { id: 'MAT001', name: 'Raw Cashew Nuts (Kerala)', materialName: 'Raw Cashew Nuts (Kerala)', materialType: 'RAW_NUT', uom: 'KG', stdCostPerUom: '180.00', supplierCode: 'VND001', origin: 'Kerala, Kollam District', moisturePct: '12.5', status: 'Active', created_at: '2024-01-10T08:00:00Z', updated_at: '2024-10-25T14:30:00Z', smart_code: 'HERA.CASHEW.MATERIAL.RAW_NUT.v1' },
      { id: 'MAT002', name: 'Vacuum Pack Bags 50kg', materialName: 'Vacuum Pack Bags 50kg', materialType: 'PACKAGING', uom: 'CARTON', stdCostPerUom: '2000.00', supplierCode: 'PKG001', shelfLifeDays: '730', status: 'Active', created_at: '2024-01-15T10:30:00Z', updated_at: '2024-10-20T16:45:00Z', smart_code: 'HERA.CASHEW.MATERIAL.PACKAGING.v1' },
      { id: 'MAT003', name: 'Steam Coal', materialName: 'Steam Coal', materialType: 'CONSUMABLE', uom: 'KG', stdCostPerUom: '8.50', supplierCode: 'FUE001', origin: 'Local Supplier', status: 'Active', created_at: '2024-02-01T12:00:00Z', updated_at: '2024-10-30T09:15:00Z', smart_code: 'HERA.CASHEW.MATERIAL.CONSUMABLE.v1' },
      { id: 'MAT004', name: 'Broken Cashew Nuts (B-Grade)', materialName: 'Broken Cashew Nuts (B-Grade)', materialType: 'RAW_NUT', uom: 'KG', stdCostPerUom: '120.00', supplierCode: 'VND002', moisturePct: '15.0', status: 'Pending', created_at: '2024-02-15T11:20:00Z', updated_at: '2024-10-28T13:40:00Z', smart_code: 'HERA.CASHEW.MATERIAL.RAW_NUT.v1' }
    ],
    
    PRODUCT: [
      { id: 'PRD001', name: 'W320 Premium White', grade: 'W320', packSizeKg: '50.0', stdYieldPct: '28.5', exportHsCode: '08013200', qualityGrade: 'Premium', targetMarkets: 'USA, Europe', stdLabourPerKg: '45.00', status: 'Active', created_at: '2024-01-05T09:00:00Z', updated_at: '2024-10-25T12:15:00Z', smart_code: 'HERA.CASHEW.PRODUCT.KERNEL.WHOLE.v1' },
      { id: 'PRD002', name: 'W240 Standard White', grade: 'W240', packSizeKg: '50.0', stdYieldPct: '25.0', exportHsCode: '08013200', qualityGrade: 'Standard', targetMarkets: 'Middle East, Asia', stdLabourPerKg: '42.00', status: 'Active', created_at: '2024-01-10T10:30:00Z', updated_at: '2024-10-28T14:20:00Z', smart_code: 'HERA.CASHEW.PRODUCT.KERNEL.WHOLE.v1' },
      { id: 'PRD003', name: 'LWP Large White Pieces', grade: 'LWP', packSizeKg: '50.0', stdYieldPct: '24.0', exportHsCode: '08013200', qualityGrade: 'Commercial', targetMarkets: 'Domestic, Asia', stdLabourPerKg: '38.00', status: 'Active', created_at: '2024-01-15T11:45:00Z', updated_at: '2024-10-30T10:30:00Z', smart_code: 'HERA.CASHEW.PRODUCT.KERNEL.PIECES.v1' },
      { id: 'PRD004', name: 'W180 Jumbo White', grade: 'W180', packSizeKg: '50.0', stdYieldPct: '22.0', exportHsCode: '08013200', qualityGrade: 'Premium', targetMarkets: 'USA, Europe', stdLabourPerKg: '48.00', status: 'Pending', created_at: '2024-02-01T13:20:00Z', updated_at: '2024-10-31T15:45:00Z', smart_code: 'HERA.CASHEW.PRODUCT.KERNEL.WHOLE.v1' }
    ],
    
    BATCH: [
      { id: 'BTH001', name: 'B-2024-001', batchNo: 'B-2024-001', productId: 'W320', locationId: 'Kollam Plant', targetOutputKg: '5000', rawMaterialKg: '18000', stdYieldPct: '28.5', priority: 'HIGH', status: 'IN_PROCESS', created_at: '2024-10-25T06:00:00Z', updated_at: '2024-10-31T08:30:00Z', smart_code: 'HERA.CASHEW.BATCH.PRODUCTION.v1' },
      { id: 'BTH002', name: 'B-2024-002', batchNo: 'B-2024-002', productId: 'W240', locationId: 'Kollam Plant', targetOutputKg: '4500', rawMaterialKg: '18000', stdYieldPct: '25.0', priority: 'NORMAL', status: 'COMPLETED', created_at: '2024-10-20T07:15:00Z', updated_at: '2024-10-28T18:00:00Z', smart_code: 'HERA.CASHEW.BATCH.PRODUCTION.v1' },
      { id: 'BTH003', name: 'B-2024-003', batchNo: 'B-2024-003', productId: 'LWP', locationId: 'Kochi Facility', targetOutputKg: '6000', rawMaterialKg: '25000', stdYieldPct: '24.0', priority: 'NORMAL', status: 'PLANNED', created_at: '2024-10-30T09:00:00Z', updated_at: '2024-10-30T09:00:00Z', smart_code: 'HERA.CASHEW.BATCH.PRODUCTION.v1' }
    ],
    
    WORK_CENTER: [
      { id: 'WC001', name: 'Steaming Line A', wcName: 'Steaming Line A', wcType: 'STEAMING', capacityKgPerShift: '5000', stdLabourRatePerHr: '150.00', stdPowerRatePerHr: '25.00', crewSize: '8', operatingHours: '16', location: 'Building A, Floor 1', status: 'Active', created_at: '2024-01-01T08:00:00Z', updated_at: '2024-10-15T14:30:00Z', smart_code: 'HERA.CASHEW.WORK_CENTER.STEAMING.v1' },
      { id: 'WC002', name: 'Peeling Line B', wcName: 'Peeling Line B', wcType: 'PEELING', capacityKgPerShift: '3000', stdLabourRatePerHr: '120.00', stdPowerRatePerHr: '20.00', crewSize: '12', operatingHours: '16', location: 'Building B, Floor 1', status: 'Active', created_at: '2024-01-05T09:30:00Z', updated_at: '2024-10-20T11:45:00Z', smart_code: 'HERA.CASHEW.WORK_CENTER.PEELING.v1' },
      { id: 'WC003', name: 'Grading Line C', wcName: 'Grading Line C', wcType: 'GRADING', capacityKgPerShift: '2500', stdLabourRatePerHr: '100.00', stdPowerRatePerHr: '15.00', crewSize: '6', operatingHours: '16', location: 'Building C, Floor 1', status: 'Active', created_at: '2024-01-10T10:15:00Z', updated_at: '2024-10-25T16:20:00Z', smart_code: 'HERA.CASHEW.WORK_CENTER.GRADING.v1' },
      { id: 'WC004', name: 'Packing Line D', wcName: 'Packing Line D', wcType: 'PACKING', capacityKgPerShift: '4000', stdLabourRatePerHr: '80.00', stdPowerRatePerHr: '10.00', crewSize: '4', operatingHours: '16', location: 'Building D, Floor 1', status: 'Inactive', created_at: '2024-01-15T11:00:00Z', updated_at: '2024-10-30T13:10:00Z', smart_code: 'HERA.CASHEW.WORK_CENTER.PACKING.v1' }
    ],
    
    LOCATION: [
      { id: 'LOC001', name: 'Kollam Processing Plant', locationName: 'Kollam Processing Plant', locationType: 'PLANT', address: 'Industrial Area, Kollam, Kerala, India', capacity: '1000 MT', managerId: 'Ravi Kumar', phone: '+91-474-1234567', email: 'kollam@keralacashew.com', isActive: 'Active', status: 'Active', created_at: '2023-12-01T08:00:00Z', updated_at: '2024-10-20T12:30:00Z', smart_code: 'HERA.CASHEW.LOCATION.PLANT.v1' },
      { id: 'LOC002', name: 'Kochi Export Warehouse', locationName: 'Kochi Export Warehouse', locationType: 'WAREHOUSE', address: 'Kochi Port Area, Ernakulam, Kerala, India', capacity: '500 MT', managerId: 'Suresh Nair', phone: '+91-484-9876543', email: 'kochi@keralacashew.com', isActive: 'Active', status: 'Active', created_at: '2024-01-01T09:00:00Z', updated_at: '2024-10-25T15:45:00Z', smart_code: 'HERA.CASHEW.LOCATION.WAREHOUSE.v1' },
      { id: 'LOC003', name: 'Trivandrum Quality Lab', locationName: 'Trivandrum Quality Lab', locationType: 'QUALITY_LAB', address: 'Technopark, Trivandrum, Kerala, India', capacity: '50 MT', managerId: 'Dr. Priya Menon', phone: '+91-471-5555666', email: 'lab@keralacashew.com', isActive: 'Active', status: 'Active', created_at: '2024-02-01T10:30:00Z', updated_at: '2024-10-30T14:20:00Z', smart_code: 'HERA.CASHEW.LOCATION.QUALITY_LAB.v1' }
    ],
    
    BOM: [
      { id: 'BOM001', name: 'W320 Production BOM v1.0', productCode: 'W320', bomUom: 'KG', stdBatchSizeKg: '1000', scrapPct: '5.0', yieldPct: '28.5', processTime: '8.0', version: 'v1.0', effectiveDate: '2024-01-01', status: 'Active', created_at: '2024-01-01T08:00:00Z', updated_at: '2024-10-15T10:30:00Z', smart_code: 'HERA.CASHEW.BOM.W320.v1' },
      { id: 'BOM002', name: 'W240 Production BOM v1.0', productCode: 'W240', bomUom: 'KG', stdBatchSizeKg: '1000', scrapPct: '6.0', yieldPct: '25.0', processTime: '8.5', version: 'v1.0', effectiveDate: '2024-01-01', status: 'Active', created_at: '2024-01-05T09:15:00Z', updated_at: '2024-10-20T14:45:00Z', smart_code: 'HERA.CASHEW.BOM.W240.v1' },
      { id: 'BOM003', name: 'LWP Production BOM v1.0', productCode: 'LWP', bomUom: 'KG', stdBatchSizeKg: '1200', scrapPct: '8.0', yieldPct: '24.0', processTime: '7.5', version: 'v1.0', effectiveDate: '2024-01-01', status: 'Active', created_at: '2024-01-10T10:00:00Z', updated_at: '2024-10-25T11:20:00Z', smart_code: 'HERA.CASHEW.BOM.LWP.v1' }
    ],
    
    COST_CENTER: [
      { id: 'CC001', name: 'Production - Steaming', centerName: 'Production - Steaming', centerType: 'PRODUCTION', centerCode: 'CC-PROD-STEAM-001', department: 'Manufacturing', annualBudget: '5000000', responsibleManager: 'Production Manager', isActive: 'Active', effectiveDate: '2024-01-01', status: 'Active', created_at: '2024-01-01T08:00:00Z', updated_at: '2024-10-15T12:15:00Z', smart_code: 'HERA.CASHEW.COST_CENTER.PRODUCTION.v1' },
      { id: 'CC002', name: 'Production - Peeling', centerName: 'Production - Peeling', centerType: 'PRODUCTION', centerCode: 'CC-PROD-PEEL-002', department: 'Manufacturing', annualBudget: '4500000', responsibleManager: 'Production Manager', isActive: 'Active', effectiveDate: '2024-01-01', status: 'Active', created_at: '2024-01-05T09:30:00Z', updated_at: '2024-10-20T13:45:00Z', smart_code: 'HERA.CASHEW.COST_CENTER.PRODUCTION.v1' },
      { id: 'CC003', name: 'Quality Control', centerName: 'Admin - Quality Control', centerType: 'QUALITY', centerCode: 'CC-QC-001', department: 'Quality_Control', annualBudget: '2000000', responsibleManager: 'Quality Manager', isActive: 'Active', effectiveDate: '2024-01-01', status: 'Active', created_at: '2024-01-10T10:15:00Z', updated_at: '2024-10-25T14:30:00Z', smart_code: 'HERA.CASHEW.COST_CENTER.QUALITY.v1' },
      { id: 'CC004', name: 'Plant Maintenance', centerName: 'Maintenance - Plant Equipment', centerType: 'MAINTENANCE', centerCode: 'CC-MAINT-001', department: 'Maintenance', annualBudget: '3000000', responsibleManager: 'Maintenance Manager', isActive: 'Active', effectiveDate: '2024-01-01', status: 'Inactive', created_at: '2024-01-15T11:45:00Z', updated_at: '2024-10-30T16:20:00Z', smart_code: 'HERA.CASHEW.COST_CENTER.MAINTENANCE.v1' }
    ],
    
    PROFIT_CENTER: [
      { id: 'PC001', name: 'Export Division - W Grades', centerName: 'Export Division - W Grades', centerCode: 'PC-EXP-W-001', isReportableSegment: 'Yes', businessUnit: 'Export_Division', targetRevenue: '50000000', targetMargin: '25.0', responsibleManager: 'Export Sales Manager', effectiveDate: '2024-01-01', status: 'Active', created_at: '2024-01-01T08:00:00Z', updated_at: '2024-10-15T11:30:00Z', smart_code: 'HERA.CASHEW.PROFIT_CENTER.EXPORT.v1' },
      { id: 'PC002', name: 'Export Division - LP Grades', centerName: 'Export Division - LP Grades', centerCode: 'PC-EXP-LP-002', isReportableSegment: 'Yes', businessUnit: 'Export_Division', targetRevenue: '30000000', targetMargin: '20.0', responsibleManager: 'Export Sales Manager', effectiveDate: '2024-01-01', status: 'Active', created_at: '2024-01-05T09:15:00Z', updated_at: '2024-10-20T12:45:00Z', smart_code: 'HERA.CASHEW.PROFIT_CENTER.EXPORT.v1' },
      { id: 'PC003', name: 'Domestic Sales', centerName: 'Domestic Sales', centerCode: 'PC-DOM-001', isReportableSegment: 'No', businessUnit: 'Domestic_Sales', targetRevenue: '15000000', targetMargin: '18.0', responsibleManager: 'Domestic Sales Manager', effectiveDate: '2024-01-01', status: 'Active', created_at: '2024-01-10T10:30:00Z', updated_at: '2024-10-25T15:20:00Z', smart_code: 'HERA.CASHEW.PROFIT_CENTER.DOMESTIC.v1' }
    ]
  }
  
  return mockData[entityType] || []
}