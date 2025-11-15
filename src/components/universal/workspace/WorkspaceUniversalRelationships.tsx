'use client'

/**
 * Workspace Universal Relationships Component
 * Smart Code: HERA.WORKSPACE.COMPONENT.RELATIONSHIPS.v1
 * 
 * Workspace-aware relationship management that automatically configures
 * relationship types, filtering, and visualizations based on domain/section context.
 * 
 * Features:
 * - Domain-specific relationship types and mappings
 * - Workspace-filtered entity relationships
 * - Context-aware relationship templates and workflows
 * - Visual relationship mapping and hierarchy views
 * - Integration with Universal Relationships system
 * - Mobile-first responsive design with workspace theming
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  GitBranch,
  Users,
  Building2,
  Package,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  ArrowUpDown,
  Plus,
  Search,
  Filter,
  Eye,
  Edit3,
  Trash2,
  Network,
  Hierarchy,
  Map,
  Target,
  Link,
  Unlink,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'
import { UniversalRelationshipPage } from '../UniversalRelationshipPage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWorkspaceContext, useWorkspacePermissions } from '@/lib/workspace/workspace-context'
import { cn } from '@/lib/utils'

interface WorkspaceRelationshipType {
  id: string
  name: string
  description: string
  smart_code: string
  category: string
  direction: 'bidirectional' | 'from_to' | 'to_from'
  allows_many: boolean
  requires_approval?: boolean
  icon: React.ComponentType<any>
  color: string
  context_specific?: boolean
  default_duration?: 'temporary' | 'permanent' | 'date_bound'
  business_rules?: string[]
}

interface WorkspaceRelationship {
  id: string
  relationship_type: string
  from_entity_id: string
  to_entity_id: string
  from_entity_name: string
  to_entity_name: string
  from_entity_type: string
  to_entity_type: string
  effective_date: string
  expiration_date?: string
  status: 'active' | 'pending' | 'expired' | 'terminated'
  created_at: string
  created_by: string
  relationship_data?: Record<string, any>
}

interface WorkspaceUniversalRelationshipsProps {
  // Data
  initialRelationships?: WorkspaceRelationship[]
  
  // Configuration
  showQuickActions?: boolean
  showVisualMap?: boolean
  defaultView?: 'list' | 'visual' | 'hierarchy'
  allowedEntityTypes?: string[]
  
  // Callbacks
  onRelationshipSave?: (relationship: any) => Promise<void>
  onRelationshipDelete?: (relationshipId: string) => Promise<void>
  
  // UI
  className?: string
}

// Domain-specific relationship type configurations
const getDomainRelationshipTypes = (domain: string, section: string): WorkspaceRelationshipType[] => {
  const relationshipConfigs: Record<string, WorkspaceRelationshipType[]> = {
    sales: [
      {
        id: 'CUSTOMER_CONTACT',
        name: 'Customer Contact',
        description: 'Contacts associated with customer accounts',
        smart_code: 'HERA.SALES.REL.CUSTOMER_CONTACT.v1',
        category: 'customer_management',
        direction: 'from_to',
        allows_many: true,
        icon: Users,
        color: 'text-blue-600 bg-blue-50',
        default_duration: 'permanent',
        business_rules: ['contact_must_have_phone_or_email']
      },
      {
        id: 'SALES_TERRITORY',
        name: 'Sales Territory',
        description: 'Customer assignment to sales territories',
        smart_code: 'HERA.SALES.REL.TERRITORY.v1',
        category: 'territory_management',
        direction: 'from_to',
        allows_many: false,
        icon: Map,
        color: 'text-green-600 bg-green-50',
        default_duration: 'date_bound',
        business_rules: ['exclusive_territory_assignment']
      },
      {
        id: 'SALES_REP_ASSIGNMENT',
        name: 'Sales Rep Assignment',
        description: 'Sales representative assignments to customers',
        smart_code: 'HERA.SALES.REL.SALES_REP.v1',
        category: 'sales_management',
        direction: 'from_to',
        allows_many: false,
        icon: Target,
        color: 'text-purple-600 bg-purple-50',
        default_duration: 'date_bound',
        requires_approval: true
      }
    ],
    
    purchase: [
      {
        id: 'VENDOR_CONTACT',
        name: 'Vendor Contact',
        description: 'Vendor contact persons and relationships',
        smart_code: 'HERA.PURCHASE.REL.VENDOR_CONTACT.v1',
        category: 'vendor_management',
        direction: 'from_to',
        allows_many: true,
        icon: Building2,
        color: 'text-indigo-600 bg-indigo-50',
        default_duration: 'permanent'
      },
      {
        id: 'PREFERRED_VENDOR',
        name: 'Preferred Vendor',
        description: 'Product-vendor preference relationships',
        smart_code: 'HERA.PURCHASE.REL.PREFERRED_VENDOR.v1',
        category: 'sourcing',
        direction: 'from_to',
        allows_many: true,
        icon: Package,
        color: 'text-amber-600 bg-amber-50',
        default_duration: 'date_bound',
        business_rules: ['pricing_agreement_required']
      },
      {
        id: 'APPROVAL_HIERARCHY',
        name: 'Approval Hierarchy',
        description: 'Purchase approval authority relationships',
        smart_code: 'HERA.PURCHASE.REL.APPROVAL.v1',
        category: 'approval_management',
        direction: 'from_to',
        allows_many: false,
        icon: Hierarchy,
        color: 'text-red-600 bg-red-50',
        requires_approval: true,
        default_duration: 'permanent'
      }
    ],
    
    inventory: [
      {
        id: 'PRODUCT_CATEGORY',
        name: 'Product Category',
        description: 'Product categorization relationships',
        smart_code: 'HERA.INVENTORY.REL.CATEGORY.v1',
        category: 'classification',
        direction: 'from_to',
        allows_many: false,
        icon: Package,
        color: 'text-emerald-600 bg-emerald-50',
        default_duration: 'permanent'
      },
      {
        id: 'LOCATION_ASSIGNMENT',
        name: 'Location Assignment',
        description: 'Product-location stock assignments',
        smart_code: 'HERA.INVENTORY.REL.LOCATION.v1',
        category: 'location_management',
        direction: 'from_to',
        allows_many: true,
        icon: Map,
        color: 'text-teal-600 bg-teal-50',
        default_duration: 'permanent',
        business_rules: ['min_max_stock_levels']
      },
      {
        id: 'PRODUCT_SUBSTITUTION',
        name: 'Product Substitution',
        description: 'Alternative/substitute product relationships',
        smart_code: 'HERA.INVENTORY.REL.SUBSTITUTION.v1',
        category: 'product_management',
        direction: 'bidirectional',
        allows_many: true,
        icon: ArrowUpDown,
        color: 'text-orange-600 bg-orange-50',
        default_duration: 'date_bound'
      }
    ],
    
    finance: [
      {
        id: 'ACCOUNT_HIERARCHY',
        name: 'Account Hierarchy',
        description: 'Chart of accounts parent-child relationships',
        smart_code: 'HERA.FINANCE.REL.ACCOUNT_HIERARCHY.v1',
        category: 'chart_of_accounts',
        direction: 'from_to',
        allows_many: false,
        icon: Hierarchy,
        color: 'text-slate-600 bg-slate-50',
        default_duration: 'permanent',
        business_rules: ['no_circular_references']
      },
      {
        id: 'COST_CENTER_ASSIGNMENT',
        name: 'Cost Center Assignment',
        description: 'Account-cost center relationships',
        smart_code: 'HERA.FINANCE.REL.COST_CENTER.v1',
        category: 'cost_accounting',
        direction: 'from_to',
        allows_many: true,
        icon: Target,
        color: 'text-violet-600 bg-violet-50',
        default_duration: 'date_bound',
        requires_approval: true
      },
      {
        id: 'BUDGET_ALLOCATION',
        name: 'Budget Allocation',
        description: 'Budget allocation relationships',
        smart_code: 'HERA.FINANCE.REL.BUDGET.v1',
        category: 'budgeting',
        direction: 'from_to',
        allows_many: true,
        icon: DollarSign,
        color: 'text-cyan-600 bg-cyan-50',
        default_duration: 'date_bound',
        requires_approval: true
      }
    ]
  }
  
  return relationshipConfigs[domain] || []
}

// Sample relationship data for demonstration
const sampleRelationships: WorkspaceRelationship[] = [
  {
    id: 'rel_001',
    relationship_type: 'CUSTOMER_CONTACT',
    from_entity_id: 'cust_001',
    to_entity_id: 'contact_001',
    from_entity_name: 'ACME Corporation',
    to_entity_name: 'John Smith',
    from_entity_type: 'CUSTOMER',
    to_entity_type: 'CONTACT',
    effective_date: '2024-01-01',
    status: 'active',
    created_at: '2024-01-01T09:00:00Z',
    created_by: 'user_001',
    relationship_data: {
      primary_contact: true,
      contact_role: 'Decision Maker'
    }
  },
  {
    id: 'rel_002',
    relationship_type: 'SALES_TERRITORY',
    from_entity_id: 'cust_002',
    to_entity_id: 'territory_001',
    from_entity_name: 'Global Tech Solutions',
    to_entity_name: 'North Region',
    from_entity_type: 'CUSTOMER',
    to_entity_type: 'TERRITORY',
    effective_date: '2024-01-01',
    expiration_date: '2024-12-31',
    status: 'active',
    created_at: '2024-01-01T10:00:00Z',
    created_by: 'user_002'
  }
]

export function WorkspaceUniversalRelationships({
  initialRelationships = sampleRelationships,
  showQuickActions = true,
  showVisualMap = true,
  defaultView = 'list',
  allowedEntityTypes,
  onRelationshipSave,
  onRelationshipDelete,
  className = ''
}: WorkspaceUniversalRelationshipsProps) {
  const router = useRouter()
  const workspace = useWorkspaceContext()
  const permissions = useWorkspacePermissions()
  
  // State
  const [relationships, setRelationships] = useState(initialRelationships)
  const [selectedRelationship, setSelectedRelationship] = useState<WorkspaceRelationship | null>(null)
  const [currentView, setCurrentView] = useState(defaultView)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRelationshipType, setSelectedRelationshipType] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)

  // Get workspace-specific relationship types
  const workspaceRelationshipTypes = useMemo(
    () => getDomainRelationshipTypes(workspace.domain, workspace.section),
    [workspace.domain, workspace.section]
  )
  
  // Filter relationships based on search and type
  const filteredRelationships = useMemo(() => {
    let filtered = relationships
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(rel =>
        rel.from_entity_name?.toLowerCase().includes(query) ||
        rel.to_entity_name?.toLowerCase().includes(query) ||
        rel.relationship_type?.toLowerCase().includes(query)
      )
    }
    
    if (selectedRelationshipType !== 'all') {
      filtered = filtered.filter(rel => rel.relationship_type === selectedRelationshipType)
    }
    
    return filtered
  }, [relationships, searchQuery, selectedRelationshipType])

  // Handle relationship actions
  const handleCreateRelationship = useCallback((relationshipType?: string) => {
    setCurrentView('create')
    setSelectedRelationship({
      id: '',
      relationship_type: relationshipType || workspaceRelationshipTypes[0]?.id || '',
      from_entity_id: '',
      to_entity_id: '',
      from_entity_name: '',
      to_entity_name: '',
      from_entity_type: '',
      to_entity_type: '',
      effective_date: new Date().toISOString().split('T')[0],
      status: 'active',
      created_at: new Date().toISOString(),
      created_by: 'current_user'
    })
  }, [workspaceRelationshipTypes])
  
  const handleEditRelationship = useCallback((relationship: WorkspaceRelationship) => {
    setSelectedRelationship(relationship)
    setCurrentView('edit')
  }, [])
  
  const handleSaveRelationship = useCallback(async (relationshipData: any) => {
    setIsLoading(true)
    try {
      if (onRelationshipSave) {
        await onRelationshipSave(relationshipData)
      }
      
      // Update local state
      if (selectedRelationship?.id) {
        // Update existing
        setRelationships(prev => prev.map(rel => 
          rel.id === selectedRelationship.id ? relationshipData : rel
        ))
      } else {
        // Add new
        setRelationships(prev => [...prev, { ...relationshipData, id: `rel_${Date.now()}` }])
      }
      
      setCurrentView('list')
      setSelectedRelationship(null)
    } catch (error) {
      console.error('Failed to save relationship:', error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedRelationship, onRelationshipSave])

  // Get relationship type appearance
  const getRelationshipTypeAppearance = useCallback((relationshipType: string) => {
    const typeConfig = workspaceRelationshipTypes.find(t => t.id === relationshipType)
    if (!typeConfig) {
      return { color: 'text-slate-600 bg-slate-100', icon: GitBranch, label: relationshipType }
    }
    
    return {
      color: typeConfig.color,
      icon: typeConfig.icon,
      label: typeConfig.name
    }
  }, [workspaceRelationshipTypes])

  // Get status appearance
  const getStatusAppearance = useCallback((status: string) => {
    const statusConfig = {
      active: { color: 'text-green-600 bg-green-100', label: 'Active', icon: CheckCircle },
      pending: { color: 'text-amber-600 bg-amber-100', label: 'Pending', icon: Clock },
      expired: { color: 'text-slate-600 bg-slate-100', label: 'Expired', icon: AlertCircle },
      terminated: { color: 'text-red-600 bg-red-100', label: 'Terminated', icon: AlertCircle }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.active
  }, [])

  // Render workspace-specific quick actions
  const renderQuickActions = () => {
    if (!showQuickActions || !permissions.canManageEntities) return null
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Quick Relationship Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {workspaceRelationshipTypes.slice(0, 6).map((type) => {
              const Icon = type.icon
              return (
                <Button
                  key={type.id}
                  variant="outline"
                  className={cn(
                    "h-auto p-4 flex flex-col items-center gap-2 text-center",
                    "hover:shadow-md transition-all duration-200"
                  )}
                  onClick={() => handleCreateRelationship(type.id)}
                >
                  <Icon className="w-6 h-6" />
                  <div>
                    <div className="font-medium text-sm">{type.name}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </Button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render relationship analytics
  const renderAnalytics = () => {
    const stats = useMemo(() => {
      const total = filteredRelationships.length
      const active = filteredRelationships.filter(r => r.status === 'active').length
      const pending = filteredRelationships.filter(r => r.status === 'pending').length
      
      return { total, active, pending }
    }, [filteredRelationships])

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Relationships</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Network className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render relationships list
  const renderRelationshipsList = () => (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            {workspace.displayName} Relationships ({filteredRelationships.length})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search relationships..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            
            {/* Filter by relationship type */}
            <Select value={selectedRelationshipType} onValueChange={setSelectedRelationshipType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {workspaceRelationshipTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Actions */}
            {permissions.canManageEntities && (
              <Button onClick={() => handleCreateRelationship()}>
                <Plus className="w-4 h-4 mr-2" />
                New Relationship
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {filteredRelationships.map((relationship) => {
            const typeConfig = getRelationshipTypeAppearance(relationship.relationship_type)
            const statusConfig = getStatusAppearance(relationship.status)
            const TypeIcon = typeConfig.icon
            const StatusIcon = statusConfig.icon
            
            return (
              <div
                key={relationship.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("p-2 rounded-lg", typeConfig.color)}>
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium">{relationship.from_entity_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {relationship.from_entity_type}
                      </div>
                    </div>
                    
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    
                    <div>
                      <div className="font-medium">{relationship.to_entity_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {relationship.to_entity_type}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-medium text-sm">{typeConfig.label}</div>
                    <div className="text-xs text-muted-foreground">
                      Since {new Date(relationship.effective_date).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <Badge variant="outline" className={statusConfig.color}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedRelationship(relationship)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      {permissions.canManageEntities && (
                        <>
                          <DropdownMenuItem onClick={() => handleEditRelationship(relationship)}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })}
          
          {filteredRelationships.length === 0 && (
            <div className="text-center py-12">
              <Network className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No relationships found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedRelationshipType !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : `Create your first ${workspace.displayName.toLowerCase()} relationship to get started.`
                }
              </p>
              {permissions.canManageEntities && (
                <Button onClick={() => handleCreateRelationship()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Relationship
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  // Render visual relationship map placeholder
  const renderVisualMap = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Map className="w-5 h-5" />
          Relationship Visualization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed border-muted rounded-lg">
          <div className="text-center">
            <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Interactive relationship diagram would be rendered here</p>
            <p className="text-sm">Integration with D3.js, Cytoscape.js, or similar library</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Main render logic
  if (currentView === 'create' || currentView === 'edit') {
    return (
      <div className={className}>
        <UniversalRelationshipPage
          initialRelationship={selectedRelationship}
          relationshipTypes={workspaceRelationshipTypes}
          onSave={handleSaveRelationship}
          onCancel={() => {
            setCurrentView('list')
            setSelectedRelationship(null)
          }}
          allowEdit={permissions.canManageEntities}
          workspaceContext={workspace}
        />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{workspace.displayName} Relationships</h2>
          <p className="text-muted-foreground">
            Manage entity relationships and connections for your {workspace.domain} operations
          </p>
        </div>
      </div>

      {/* Workspace-specific tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visual">Visual Map</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          {renderQuickActions()}
          
          {/* Analytics */}
          {renderAnalytics()}
          
          {/* Relationships List */}
          {renderRelationshipsList()}
        </TabsContent>
        
        <TabsContent value="visual" className="space-y-6">
          {showVisualMap && renderVisualMap()}
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relationship Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workspaceRelationshipTypes.map((type) => {
                  const Icon = type.icon
                  return (
                    <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-lg", type.color)}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium">{type.name}</div>
                          <div className="text-sm text-muted-foreground">{type.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {type.direction} • {type.allows_many ? 'Many allowed' : 'One-to-one'} • {type.default_duration}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => handleCreateRelationship(type.id)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Use Template
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default WorkspaceUniversalRelationships