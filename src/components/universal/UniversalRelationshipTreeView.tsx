'use client'

/**
 * Universal Relationship Tree View Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.RELATIONSHIP_TREE_VIEW.v1
 * 
 * Hierarchical tree visualization of entity relationships with:
 * - Expandable/collapsible tree structure
 * - Multiple root nodes support
 * - Drag & drop for relationship editing
 * - Context menus for quick actions
 * - Mobile-first responsive design
 * - Real-time search and filtering
 */

import React, { useState, useCallback, useMemo } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Move,
  Search,
  Filter,
  TreePine,
  Folder,
  FolderOpen,
  File,
  Link,
  Users,
  Building,
  Package,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'

export interface TreeNode {
  id: string
  entity_id: string
  entity_name: string
  entity_type: string
  entity_code?: string
  smart_code: string
  parent_id?: string
  children?: TreeNode[]
  level: number
  is_expanded: boolean
  relationship_type?: string
  relationship_data?: Record<string, any>
  metadata?: Record<string, any>
}

interface TreeViewConfig {
  max_depth: number
  show_entity_codes: boolean
  show_relationship_types: boolean
  enable_drag_drop: boolean
  enable_context_menu: boolean
  default_expanded: boolean
  group_by_type: boolean
}

interface UniversalRelationshipTreeViewProps {
  nodes: TreeNode[]
  selectedNodeId?: string
  onNodeSelect?: (node: TreeNode | null) => void
  onNodeExpand?: (nodeId: string, expanded: boolean) => void
  onNodeMove?: (nodeId: string, newParentId: string | null) => void
  onNodeAdd?: (parentId: string | null, nodeType: string) => void
  onNodeEdit?: (node: TreeNode) => void
  onNodeDelete?: (nodeId: string) => void
  config?: Partial<TreeViewConfig>
  readonly?: boolean
  className?: string
}

const defaultConfig: TreeViewConfig = {
  max_depth: 10,
  show_entity_codes: true,
  show_relationship_types: true,
  enable_drag_drop: true,
  enable_context_menu: true,
  default_expanded: false,
  group_by_type: false
}

const entityTypeIcons: Record<string, React.ComponentType<any>> = {
  'CUSTOMER': Users,
  'VENDOR': Building,
  'PRODUCT': Package,
  'ACCOUNT': Target,
  'LOCATION': Building,
  'USER': Users,
  'ORGANIZATION': Building,
  default: File
}

const entityTypeColors: Record<string, string> = {
  'CUSTOMER': 'text-blue-600',
  'VENDOR': 'text-purple-600',
  'PRODUCT': 'text-green-600',
  'ACCOUNT': 'text-yellow-600',
  'LOCATION': 'text-red-600',
  'USER': 'text-cyan-600',
  'ORGANIZATION': 'text-lime-600',
  default: 'text-slate-600'
}

export function UniversalRelationshipTreeView({
  nodes,
  selectedNodeId,
  onNodeSelect,
  onNodeExpand,
  onNodeMove,
  onNodeAdd,
  onNodeEdit,
  onNodeDelete,
  config: userConfig = {},
  readonly = false,
  className = ''
}: UniversalRelationshipTreeViewProps) {
  const [config] = useState<TreeViewConfig>({ ...defaultConfig, ...userConfig })
  const [searchFilter, setSearchFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [draggedNode, setDraggedNode] = useState<TreeNode | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  // Build tree structure from flat nodes array
  const treeStructure = useMemo(() => {
    const nodeMap = new Map<string, TreeNode>()
    const roots: TreeNode[] = []

    // First pass: create map and initialize children arrays
    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] })
    })

    // Second pass: build parent-child relationships
    nodes.forEach(node => {
      const treeNode = nodeMap.get(node.id)!
      
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        const parent = nodeMap.get(node.parent_id)!
        parent.children!.push(treeNode)
      } else {
        roots.push(treeNode)
      }
    })

    // Sort roots and children by name
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => a.entity_name.localeCompare(b.entity_name))
      nodes.forEach(node => {
        if (node.children && node.children.length > 0) {
          sortNodes(node.children)
        }
      })
    }

    if (config.group_by_type) {
      // Group by entity type
      const grouped = new Map<string, TreeNode[]>()
      roots.forEach(node => {
        if (!grouped.has(node.entity_type)) {
          grouped.set(node.entity_type, [])
        }
        grouped.get(node.entity_type)!.push(node)
      })

      const groupedRoots: TreeNode[] = []
      Array.from(grouped.entries()).forEach(([type, typeNodes]) => {
        sortNodes(typeNodes)
        
        // Create type group node
        const groupNode: TreeNode = {
          id: `group-${type}`,
          entity_id: `group-${type}`,
          entity_name: `${type} (${typeNodes.length})`,
          entity_type: 'GROUP',
          smart_code: `HERA.UNIVERSAL.GROUP.${type}.v1`,
          level: 0,
          is_expanded: config.default_expanded,
          children: typeNodes.map(node => ({ ...node, level: 1 }))
        }
        
        groupedRoots.push(groupNode)
      })
      
      return groupedRoots
    } else {
      sortNodes(roots)
      return roots
    }
  }, [nodes, config])

  // Filter tree based on search and type filters
  const filteredTree = useMemo(() => {
    if (!searchFilter && typeFilter === 'all') {
      return treeStructure
    }

    const filterNode = (node: TreeNode): TreeNode | null => {
      const matchesSearch = !searchFilter || 
        node.entity_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        node.entity_type.toLowerCase().includes(searchFilter.toLowerCase()) ||
        node.entity_code?.toLowerCase().includes(searchFilter.toLowerCase())

      const matchesType = typeFilter === 'all' || node.entity_type === typeFilter

      const filteredChildren = (node.children || [])
        .map(filterNode)
        .filter(Boolean) as TreeNode[]

      if (matchesSearch && matchesType) {
        return { ...node, children: filteredChildren }
      } else if (filteredChildren.length > 0) {
        return { ...node, children: filteredChildren }
      }

      return null
    }

    return treeStructure.map(filterNode).filter(Boolean) as TreeNode[]
  }, [treeStructure, searchFilter, typeFilter])

  // Get unique entity types for filter dropdown
  const entityTypes = useMemo(() => {
    const types = new Set<string>()
    const collectTypes = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.entity_type !== 'GROUP') {
          types.add(node.entity_type)
        }
        if (node.children) {
          collectTypes(node.children)
        }
      })
    }
    collectTypes(treeStructure)
    return Array.from(types).sort()
  }, [treeStructure])

  // Handle node selection
  const handleNodeSelect = useCallback((node: TreeNode) => {
    if (node.entity_type === 'GROUP') return
    onNodeSelect?.(node)
  }, [onNodeSelect])

  // Handle node expansion toggle
  const handleNodeExpand = useCallback((node: TreeNode) => {
    onNodeExpand?.(node.id, !node.is_expanded)
  }, [onNodeExpand])

  // Handle drag start
  const handleDragStart = useCallback((node: TreeNode) => {
    if (readonly || !config.enable_drag_drop) return
    setDraggedNode(node)
  }, [readonly, config.enable_drag_drop])

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, nodeId: string) => {
    e.preventDefault()
    setDropTarget(nodeId)
  }, [])

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, targetNode: TreeNode) => {
    e.preventDefault()
    
    if (!draggedNode || !onNodeMove || draggedNode.id === targetNode.id) {
      setDraggedNode(null)
      setDropTarget(null)
      return
    }

    // Prevent dropping on descendants
    const isDescendant = (node: TreeNode, ancestorId: string): boolean => {
      if (node.id === ancestorId) return true
      return (node.children || []).some(child => isDescendant(child, ancestorId))
    }

    if (isDescendant(draggedNode, targetNode.id)) {
      setDraggedNode(null)
      setDropTarget(null)
      return
    }

    onNodeMove(draggedNode.id, targetNode.id)
    setDraggedNode(null)
    setDropTarget(null)
  }, [draggedNode, onNodeMove])

  // Handle context menu actions
  const handleContextAction = useCallback((action: string, node: TreeNode) => {
    switch (action) {
      case 'add':
        onNodeAdd?.(node.id, node.entity_type)
        break
      case 'edit':
        onNodeEdit?.(node)
        break
      case 'delete':
        if (confirm(`Delete ${node.entity_name}?`)) {
          onNodeDelete?.(node.id)
        }
        break
      case 'copy':
        // Copy node ID to clipboard
        navigator.clipboard.writeText(node.entity_id)
        break
    }
  }, [onNodeAdd, onNodeEdit, onNodeDelete])

  // Render tree node
  const renderNode = useCallback((node: TreeNode, depth = 0): React.ReactNode => {
    const isSelected = selectedNodeId === node.id
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = node.is_expanded
    const isGroup = node.entity_type === 'GROUP'
    const IconComponent = entityTypeIcons[node.entity_type] || entityTypeIcons.default
    const iconColor = entityTypeColors[node.entity_type] || entityTypeColors.default

    const nodeContent = (
      <div
        className={cn(
          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
          isSelected && "bg-blue-50 border-blue-200 border",
          !isSelected && "hover:bg-slate-50",
          dropTarget === node.id && "bg-yellow-50 border-yellow-200 border"
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => handleNodeSelect(node)}
        draggable={!readonly && config.enable_drag_drop && !isGroup}
        onDragStart={() => handleDragStart(node)}
        onDragOver={(e) => handleDragOver(e, node.id)}
        onDrop={(e) => handleDrop(e, node)}
      >
        {/* Expand/collapse button */}
        <Button
          variant="ghost"
          size="sm"
          className="p-0 h-5 w-5"
          onClick={(e) => {
            e.stopPropagation()
            handleNodeExpand(node)
          }}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <div className="w-3.5 h-3.5" />
          )}
        </Button>

        {/* Node icon */}
        <IconComponent 
          size={16} 
          className={cn(iconColor, isGroup && "text-slate-500")} 
        />

        {/* Node info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium truncate text-sm",
              isGroup && "text-slate-600"
            )}>
              {node.entity_name}
            </span>
            
            {!isGroup && (
              <>
                <Badge variant="outline" className="text-xs shrink-0">
                  {node.entity_type}
                </Badge>
                
                {config.show_entity_codes && node.entity_code && (
                  <span className="text-xs text-slate-500 shrink-0">
                    {node.entity_code}
                  </span>
                )}
              </>
            )}
          </div>
          
          {config.show_relationship_types && node.relationship_type && (
            <div className="flex items-center gap-1 mt-1">
              <Link size={10} className="text-slate-400" />
              <span className="text-xs text-slate-500">{node.relationship_type}</span>
            </div>
          )}
        </div>

        {/* Actions menu */}
        {!readonly && config.enable_context_menu && !isGroup && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleContextAction('add', node)}>
                <Plus size={14} className="mr-2" />
                Add Child
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleContextAction('edit', node)}>
                <Edit3 size={14} className="mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleContextAction('copy', node)}>
                <Copy size={14} className="mr-2" />
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleContextAction('delete', node)}
                className="text-red-600"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    )

    return (
      <div key={node.id} className="group">
        {config.enable_context_menu && !readonly && !isGroup ? (
          <ContextMenu>
            <ContextMenuTrigger>{nodeContent}</ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => handleContextAction('add', node)}>
                <Plus size={14} className="mr-2" />
                Add Child
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleContextAction('edit', node)}>
                <Edit3 size={14} className="mr-2" />
                Edit
              </ContextMenuItem>
              <ContextMenuItem onClick={() => handleContextAction('copy', node)}>
                <Copy size={14} className="mr-2" />
                Copy ID
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem 
                onClick={() => handleContextAction('delete', node)}
                className="text-red-600"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        ) : (
          nodeContent
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="ml-4 border-l border-slate-200">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }, [
    selectedNodeId,
    dropTarget,
    readonly,
    config,
    handleNodeSelect,
    handleNodeExpand,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleContextAction
  ])

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <TreePine size={20} />
            Relationship Tree
          </CardTitle>
          
          {!readonly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNodeAdd?.(null, 'ENTITY')}
            >
              <Plus size={14} className="mr-1" />
              Add Root
            </Button>
          )}
        </div>
        
        {/* Search and Filter Controls */}
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search nodes..."
              className="pl-8"
            />
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
          >
            <option value="all">All Types</option>
            {entityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {filteredTree.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <TreePine className="mx-auto mb-2 text-slate-300" size={32} />
              <p>No relationships found</p>
              {!readonly && (
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={() => onNodeAdd?.(null, 'ENTITY')}
                >
                  <Plus size={14} className="mr-1" />
                  Add First Node
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {filteredTree.map(node => renderNode(node))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default UniversalRelationshipTreeView