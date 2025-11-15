'use client'

/**
 * Universal Relationship Page Component
 * Smart Code: HERA.UNIVERSAL.PAGE.RELATIONSHIP_CRUD.v1
 * 
 * Complete enterprise-grade relationship CRUD interface with:
 * - Three-panel layout (navigation | main | actions)
 * - Graph and tree visualization modes
 * - Relationship creation and editing
 * - Bulk operations support
 * - Search and filtering capabilities
 * - Mobile-first responsive design
 * - Real-time updates and validation
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  GitBranch,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Download,
  Upload,
  Eye,
  Settings,
  RefreshCw,
  LayoutGrid,
  Network,
  List,
  Calendar,
  Users,
  Building
} from 'lucide-react'
import { UniversalTransactionShell } from './UniversalTransactionShell'
import { UniversalRelationshipGraph, GraphNode, GraphEdge } from './UniversalRelationshipGraph'
import { UniversalRelationshipTreeView, TreeNode } from './UniversalRelationshipTreeView'
import { UniversalRelationshipEditor, Entity, RelationshipType, RelationshipData } from './UniversalRelationshipEditor'
import { UniversalRelationshipBulkManager } from './UniversalRelationshipBulkManager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { cn } from '@/lib/utils'

interface RelationshipPageData {
  entities: Entity[]
  relationships: RelationshipData[]
  relationshipTypes: RelationshipType[]
}

interface UniversalRelationshipPageProps {
  // Data
  initialData?: Partial<RelationshipPageData>
  
  // Behavior
  onRelationshipSave?: (relationship: RelationshipData) => Promise<void>
  onRelationshipDelete?: (relationshipId: string) => Promise<void>
  onBulkCreate?: (relationships: RelationshipData[]) => Promise<void>
  onBulkUpdate?: (relationships: RelationshipData[]) => Promise<void>
  onBulkDelete?: (relationshipIds: string[]) => Promise<void>
  onRefresh?: () => Promise<RelationshipPageData>
  
  // UI Configuration
  allowEdit?: boolean
  showBulkOperations?: boolean
  defaultView?: 'graph' | 'tree' | 'list'
  className?: string
}

// Sample data for development
const sampleEntities: Entity[] = [
  {
    id: '1',
    entity_id: 'entity_1',
    entity_name: 'ACME Corporation',
    entity_type: 'ORGANIZATION',
    entity_code: 'ACME',
    smart_code: 'HERA.ENTITY.ORGANIZATION.ACME.v1'
  },
  {
    id: '2',
    entity_id: 'entity_2',
    entity_name: 'Marketing Department',
    entity_type: 'DEPARTMENT',
    entity_code: 'MKT',
    smart_code: 'HERA.ENTITY.DEPARTMENT.MARKETING.v1'
  },
  {
    id: '3',
    entity_id: 'entity_3',
    entity_name: 'John Doe',
    entity_type: 'USER',
    entity_code: 'JDOE',
    smart_code: 'HERA.ENTITY.USER.JOHN_DOE.v1'
  },
  {
    id: '4',
    entity_id: 'entity_4',
    entity_name: 'Sales Team',
    entity_type: 'DEPARTMENT',
    entity_code: 'SALES',
    smart_code: 'HERA.ENTITY.DEPARTMENT.SALES.v1'
  }
]

const sampleRelationships: RelationshipData[] = [
  {
    id: 'rel_1',
    from_entity_id: '2',
    to_entity_id: '1',
    relationship_type: 'PARENT_OF',
    effective_date: '2024-01-01',
    smart_code: 'HERA.UNIVERSAL.RELATIONSHIP.PARENT_OF.v1'
  },
  {
    id: 'rel_2',
    from_entity_id: '3',
    to_entity_id: '2',
    relationship_type: 'MEMBER_OF',
    effective_date: '2024-01-15',
    smart_code: 'HERA.UNIVERSAL.RELATIONSHIP.MEMBER_OF.v1'
  }
]

export function UniversalRelationshipPage({
  initialData = {},
  onRelationshipSave,
  onRelationshipDelete,
  onBulkCreate,
  onBulkUpdate,
  onBulkDelete,
  onRefresh,
  allowEdit = true,
  showBulkOperations = true,
  defaultView = 'graph',
  className = ''
}: UniversalRelationshipPageProps) {
  const router = useRouter()
  const { user, organization } = useHERAAuth()
  
  // State
  const [entities] = useState<Entity[]>(initialData.entities || sampleEntities)
  const [relationships, setRelationships] = useState<RelationshipData[]>(
    initialData.relationships || sampleRelationships
  )
  const [relationshipTypes] = useState<RelationshipType[]>(
    initialData.relationshipTypes || []
  )
  
  const [activeView, setActiveView] = useState(defaultView)
  const [selectedRelationships, setSelectedRelationships] = useState<Set<string>>(new Set())
  const [searchFilter, setSearchFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [showExpired, setShowExpired] = useState(false)
  
  const [editingRelationship, setEditingRelationship] = useState<RelationshipData | null>(null)
  const [showBulkManager, setShowBulkManager] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filter relationships
  const filteredRelationships = useMemo(() => {
    let filtered = relationships

    if (searchFilter) {
      filtered = filtered.filter(rel => {
        const fromEntity = entities.find(e => e.id === rel.from_entity_id)
        const toEntity = entities.find(e => e.id === rel.to_entity_id)
        const searchLower = searchFilter.toLowerCase()
        
        return (
          rel.relationship_type.toLowerCase().includes(searchLower) ||
          fromEntity?.entity_name.toLowerCase().includes(searchLower) ||
          toEntity?.entity_name.toLowerCase().includes(searchLower)
        )
      })
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(rel => rel.relationship_type === typeFilter)
    }

    if (dateFilter === 'current') {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter(rel => {
        const isEffective = rel.effective_date <= today
        const notExpired = !rel.expiration_date || rel.expiration_date > today
        return isEffective && notExpired
      })
    } else if (dateFilter === 'future') {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter(rel => rel.effective_date > today)
    }

    if (!showExpired) {
      const today = new Date().toISOString().split('T')[0]
      filtered = filtered.filter(rel => 
        !rel.expiration_date || rel.expiration_date > today
      )
    }

    return filtered
  }, [relationships, entities, searchFilter, typeFilter, dateFilter, showExpired])

  // Convert relationships to graph format
  const { graphNodes, graphEdges } = useMemo(() => {
    const nodeMap = new Map<string, GraphNode>()
    
    // Create nodes from entities that have relationships
    filteredRelationships.forEach(rel => {
      const fromEntity = entities.find(e => e.id === rel.from_entity_id)
      const toEntity = entities.find(e => e.id === rel.to_entity_id)
      
      if (fromEntity && !nodeMap.has(fromEntity.id)) {
        nodeMap.set(fromEntity.id, {
          id: fromEntity.id,
          entity_id: fromEntity.entity_id,
          entity_name: fromEntity.entity_name,
          entity_type: fromEntity.entity_type,
          entity_code: fromEntity.entity_code,
          smart_code: fromEntity.smart_code,
          metadata: fromEntity.metadata
        })
      }
      
      if (toEntity && !nodeMap.has(toEntity.id)) {
        nodeMap.set(toEntity.id, {
          id: toEntity.id,
          entity_id: toEntity.entity_id,
          entity_name: toEntity.entity_name,
          entity_type: toEntity.entity_type,
          entity_code: toEntity.entity_code,
          smart_code: toEntity.smart_code,
          metadata: toEntity.metadata
        })
      }
    })

    const graphNodes = Array.from(nodeMap.values())
    const graphEdges: GraphEdge[] = filteredRelationships.map(rel => ({
      id: rel.id!,
      source: rel.from_entity_id,
      target: rel.to_entity_id,
      relationship_type: rel.relationship_type,
      relationship_data: rel.relationship_data,
      effective_date: rel.effective_date,
      expiration_date: rel.expiration_date,
      metadata: rel.metadata
    }))

    return { graphNodes, graphEdges }
  }, [entities, filteredRelationships])

  // Convert relationships to tree format
  const treeNodes = useMemo(() => {
    // Build hierarchical structure based on PARENT_OF relationships
    const nodeMap = new Map<string, TreeNode>()
    const parentRelationships = filteredRelationships.filter(rel => 
      rel.relationship_type === 'PARENT_OF'
    )

    // Create all nodes first
    graphNodes.forEach(node => {
      nodeMap.set(node.id, {
        id: node.id,
        entity_id: node.entity_id,
        entity_name: node.entity_name,
        entity_type: node.entity_type,
        entity_code: node.entity_code,
        smart_code: node.smart_code,
        level: 0,
        is_expanded: true,
        children: [],
        metadata: node.metadata
      })
    })

    // Build parent-child relationships
    parentRelationships.forEach(rel => {
      const parentNode = nodeMap.get(rel.from_entity_id)
      const childNode = nodeMap.get(rel.to_entity_id)
      
      if (parentNode && childNode) {
        childNode.parent_id = parentNode.id
        childNode.relationship_type = rel.relationship_type
        childNode.relationship_data = rel.relationship_data
      }
    })

    return Array.from(nodeMap.values())
  }, [graphNodes, filteredRelationships])

  // Handle relationship save
  const handleRelationshipSave = useCallback(async (relationshipData: RelationshipData) => {
    try {
      if (onRelationshipSave) {
        await onRelationshipSave(relationshipData)
      }
      
      // Update local state
      if (relationshipData.id) {
        setRelationships(prev => prev.map(rel => 
          rel.id === relationshipData.id ? relationshipData : rel
        ))
      } else {
        const newRelationship = {
          ...relationshipData,
          id: `rel_${Date.now()}`
        }
        setRelationships(prev => [...prev, newRelationship])
      }
      
      setEditingRelationship(null)
    } catch (error) {
      console.error('Error saving relationship:', error)
    }
  }, [onRelationshipSave])

  // Handle relationship delete
  const handleRelationshipDelete = useCallback(async (relationshipId: string) => {
    try {
      if (onRelationshipDelete) {
        await onRelationshipDelete(relationshipId)
      }
      
      setRelationships(prev => prev.filter(rel => rel.id !== relationshipId))
      setSelectedRelationships(prev => {
        const newSet = new Set(prev)
        newSet.delete(relationshipId)
        return newSet
      })
    } catch (error) {
      console.error('Error deleting relationship:', error)
    }
  }, [onRelationshipDelete])

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return
    
    setIsRefreshing(true)
    try {
      const data = await onRefresh()
      setRelationships(data.relationships)
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [onRefresh])

  // Get unique relationship types for filter
  const availableTypes = useMemo(() => {
    return [...new Set(relationships.map(rel => rel.relationship_type))].sort()
  }, [relationships])

  // Left panel content (Filters & Summary)
  const leftPanelContent = (
    <div className="space-y-4">
      {/* Summary Stats */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <GitBranch size={16} />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total:</span>
              <span className="font-medium">{relationships.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Filtered:</span>
              <span className="font-medium">{filteredRelationships.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Selected:</span>
              <span className="font-medium">{selectedRelationships.size}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Types:</span>
              <span className="font-medium">{availableTypes.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Controls */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-sm">View Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant={activeView === 'graph' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('graph')}
              className="justify-start"
            >
              <Network size={14} className="mr-2" />
              Graph View
            </Button>
            <Button
              variant={activeView === 'tree' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('tree')}
              className="justify-start"
            >
              <LayoutGrid size={14} className="mr-2" />
              Tree View
            </Button>
            <Button
              variant={activeView === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveView('list')}
              className="justify-start"
            >
              <List size={14} className="mr-2" />
              List View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter size={16} />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                placeholder="Search relationships..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9 h-8"
              />
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Filter */}
          <div>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="current">Current</SelectItem>
                <SelectItem value="future">Future</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Show Expired */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="show_expired"
              checked={showExpired}
              onCheckedChange={setShowExpired}
            />
            <label htmlFor="show_expired" className="text-sm cursor-pointer">
              Show expired
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {allowEdit && (
        <Card className="bg-white/90">
          <CardHeader>
            <CardTitle className="text-sm">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                size="sm" 
                className="w-full justify-start"
                onClick={() => setEditingRelationship({} as RelationshipData)}
              >
                <Plus size={14} className="mr-2" />
                New Relationship
              </Button>
              
              {showBulkOperations && (
                <Button 
                  variant="outline"
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => setShowBulkManager(true)}
                >
                  <Upload size={14} className="mr-2" />
                  Bulk Operations
                </Button>
              )}
              
              <Button 
                variant="outline"
                size="sm" 
                className="w-full justify-start"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <RefreshCw size={14} className="mr-2 animate-spin" />
                ) : (
                  <RefreshCw size={14} className="mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // Center panel content (Main visualization)
  const centerPanelContent = (
    <div className="h-full">
      {activeView === 'graph' && (
        <UniversalRelationshipGraph
          nodes={graphNodes}
          edges={graphEdges}
          onNodeSelect={(node) => console.log('Node selected:', node)}
          onEdgeSelect={(edge) => console.log('Edge selected:', edge)}
          className="h-full"
        />
      )}

      {activeView === 'tree' && (
        <UniversalRelationshipTreeView
          nodes={treeNodes}
          onNodeSelect={(node) => console.log('Node selected:', node)}
          onNodeExpand={(nodeId, expanded) => console.log('Node expand:', nodeId, expanded)}
          className="h-full"
        />
      )}

      {activeView === 'list' && (
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List size={20} />
              Relationships List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredRelationships.map((relationship) => {
                const fromEntity = entities.find(e => e.id === relationship.from_entity_id)
                const toEntity = entities.find(e => e.id === relationship.to_entity_id)
                
                return (
                  <div
                    key={relationship.id}
                    className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                    onClick={() => setEditingRelationship(relationship)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-sm">
                          <span className="font-medium">{fromEntity?.entity_name}</span>
                          <span className="text-slate-500 mx-2">→</span>
                          <span className="font-medium">{toEntity?.entity_name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {relationship.relationship_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar size={12} />
                        {relationship.effective_date}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  return (
    <div className={cn("h-screen", className)}>
      <UniversalTransactionShell
        title="Relationship Management"
        subtitle="Manage entity relationships and hierarchies"
        breadcrumbs={[
          { label: 'Dashboard' },
          { label: 'Relationships' }
        ]}
        leftPanelContent={leftPanelContent}
        centerPanelContent={centerPanelContent}
        rightPanelContent={null}
        showAIPanel={false}
        onToggleAIPanel={() => {}}
        allowFullscreen={true}
        showAutoSave={false}
      />

      {/* Relationship Editor Dialog */}
      {editingRelationship && (
        <Dialog 
          open={!!editingRelationship} 
          onOpenChange={() => setEditingRelationship(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRelationship.id ? 'Edit Relationship' : 'Create Relationship'}
              </DialogTitle>
            </DialogHeader>
            <UniversalRelationshipEditor
              entities={entities}
              relationshipTypes={relationshipTypes}
              initialData={editingRelationship}
              mode={editingRelationship.id ? 'edit' : 'create'}
              onSave={handleRelationshipSave}
              onCancel={() => setEditingRelationship(null)}
              readonly={!allowEdit}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Bulk Manager Dialog */}
      {showBulkManager && (
        <Dialog 
          open={showBulkManager} 
          onOpenChange={() => setShowBulkManager(false)}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Bulk Relationship Operations</DialogTitle>
            </DialogHeader>
            <UniversalRelationshipBulkManager
              entities={entities}
              relationshipTypes={relationshipTypes}
              onBulkCreate={onBulkCreate}
              onBulkUpdate={onBulkUpdate}
              onBulkDelete={onBulkDelete}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default UniversalRelationshipPage