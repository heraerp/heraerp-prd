'use client'

/**
 * Universal Relationship Graph Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.RELATIONSHIP_GRAPH.v1
 * 
 * Interactive relationship visualization with:
 * - Force-directed graph layout
 * - Entity nodes with type-based styling
 * - Relationship edges with directional arrows
 * - Zoom, pan, and selection capabilities
 * - Mobile-first responsive design
 * - Real-time updates and filtering
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  Filter, 
  Search,
  Eye,
  EyeOff,
  Settings,
  Download,
  Layers,
  Navigation,
  Info,
  GitBranch,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface GraphNode {
  id: string
  entity_id: string
  entity_name: string
  entity_type: string
  entity_code?: string
  smart_code: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  metadata?: Record<string, any>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  relationship_type: string
  relationship_data?: Record<string, any>
  effective_date?: string
  expiration_date?: string
  strength?: number
  metadata?: Record<string, any>
}

interface GraphConfig {
  node_size_range: [number, number]
  edge_width_range: [number, number]
  force_strength: number
  center_strength: number
  collision_radius: number
  link_distance: number
  show_labels: boolean
  show_arrows: boolean
  enable_clustering: boolean
  color_by_type: boolean
}

interface UniversalRelationshipGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  config?: Partial<GraphConfig>
  selectedNodeId?: string
  onNodeSelect?: (node: GraphNode | null) => void
  onEdgeSelect?: (edge: GraphEdge | null) => void
  onNodeDoubleClick?: (node: GraphNode) => void
  readonly?: boolean
  className?: string
}

const defaultConfig: GraphConfig = {
  node_size_range: [8, 24],
  edge_width_range: [1, 4],
  force_strength: -300,
  center_strength: 0.1,
  collision_radius: 30,
  link_distance: 100,
  show_labels: true,
  show_arrows: true,
  enable_clustering: false,
  color_by_type: true
}

export function UniversalRelationshipGraph({
  nodes,
  edges,
  config: userConfig = {},
  selectedNodeId,
  onNodeSelect,
  onEdgeSelect,
  onNodeDoubleClick,
  readonly = false,
  className = ''
}: UniversalRelationshipGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [config] = useState<GraphConfig>({ ...defaultConfig, ...userConfig })
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null)
  const [searchFilter, setSearchFilter] = useState('')
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set())
  const [relationshipFilters, setRelationshipFilters] = useState<Set<string>>(new Set())
  const [showOnlyConnected, setShowOnlyConnected] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Entity type colors
  const entityTypeColors: Record<string, string> = {
    'CUSTOMER': '#3b82f6',
    'VENDOR': '#8b5cf6',
    'PRODUCT': '#10b981',
    'ACCOUNT': '#f59e0b',
    'LOCATION': '#ef4444',
    'USER': '#06b6d4',
    'ORGANIZATION': '#84cc16',
    default: '#6b7280'
  }

  // Relationship type colors
  const relationshipTypeColors: Record<string, string> = {
    'PARENT_OF': '#3b82f6',
    'MEMBER_OF': '#8b5cf6',
    'OWNS': '#10b981',
    'MAPS_TO': '#f59e0b',
    'ASSIGNED_TO': '#ef4444',
    'LINKED_TO': '#06b6d4',
    default: '#6b7280'
  }

  // Get unique entity types and relationship types
  const { entityTypes, relationshipTypes } = useMemo(() => {
    const entityTypes = [...new Set(nodes.map(n => n.entity_type))].sort()
    const relationshipTypes = [...new Set(edges.map(e => e.relationship_type))].sort()
    return { entityTypes, relationshipTypes }
  }, [nodes, edges])

  // Filter nodes and edges based on search and filters
  const { filteredNodes, filteredEdges } = useMemo(() => {
    let filteredNodes = nodes

    // Search filter
    if (searchFilter) {
      filteredNodes = filteredNodes.filter(node =>
        node.entity_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        node.entity_type.toLowerCase().includes(searchFilter.toLowerCase()) ||
        node.entity_code?.toLowerCase().includes(searchFilter.toLowerCase())
      )
    }

    // Type filters
    if (typeFilters.size > 0) {
      filteredNodes = filteredNodes.filter(node => typeFilters.has(node.entity_type))
    }

    // Get node IDs for edge filtering
    const nodeIds = new Set(filteredNodes.map(n => n.id))

    let filteredEdges = edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    )

    // Relationship type filters
    if (relationshipFilters.size > 0) {
      filteredEdges = filteredEdges.filter(edge => relationshipFilters.has(edge.relationship_type))
    }

    // Show only connected nodes
    if (showOnlyConnected) {
      const connectedNodeIds = new Set<string>()
      filteredEdges.forEach(edge => {
        connectedNodeIds.add(edge.source)
        connectedNodeIds.add(edge.target)
      })
      filteredNodes = filteredNodes.filter(node => connectedNodeIds.has(node.id))
    }

    return { filteredNodes, filteredEdges }
  }, [nodes, edges, searchFilter, typeFilters, relationshipFilters, showOnlyConnected])

  // Calculate node positions using a simple force simulation
  const positionedNodes = useMemo(() => {
    if (filteredNodes.length === 0) return []

    // Create a copy with initial positions
    const positioned = filteredNodes.map((node, index) => ({
      ...node,
      x: node.x || Math.cos(index * 2.4) * 200 + 300,
      y: node.y || Math.sin(index * 2.4) * 200 + 300,
      fx: node.fx,
      fy: node.fy
    }))

    // Simple force simulation for better positioning
    const simulation = {
      nodes: positioned,
      edges: filteredEdges,
      iterations: 50,
      
      run() {
        for (let i = 0; i < this.iterations; i++) {
          this.tick()
        }
      },

      tick() {
        // Repulsion force between nodes
        this.nodes.forEach((nodeA, i) => {
          this.nodes.forEach((nodeB, j) => {
            if (i === j) return
            
            const dx = nodeB.x! - nodeA.x!
            const dy = nodeB.y! - nodeA.y!
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (distance < config.collision_radius) {
              const force = (config.collision_radius - distance) / distance * 0.5
              const fx = dx * force
              const fy = dy * force
              
              if (!nodeA.fx) nodeA.x! -= fx
              if (!nodeA.fy) nodeA.y! -= fy
              if (!nodeB.fx) nodeB.x! += fx
              if (!nodeB.fy) nodeB.y! += fy
            }
          })
        })

        // Attraction force for connected nodes
        this.edges.forEach(edge => {
          const source = this.nodes.find(n => n.id === edge.source)
          const target = this.nodes.find(n => n.id === edge.target)
          
          if (!source || !target) return
          
          const dx = target.x! - source.x!
          const dy = target.y! - source.y!
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > config.link_distance) {
            const force = (distance - config.link_distance) / distance * 0.1
            const fx = dx * force
            const fy = dy * force
            
            if (!source.fx) source.x! += fx
            if (!source.fy) source.y! += fy
            if (!target.fx) target.x! -= fx
            if (!target.fy) target.y! -= fy
          }
        })

        // Center force
        const centerX = 400
        const centerY = 300
        this.nodes.forEach(node => {
          if (!node.fx) {
            const dx = centerX - node.x!
            node.x! += dx * config.center_strength
          }
          if (!node.fy) {
            const dy = centerY - node.y!
            node.y! += dy * config.center_strength
          }
        })
      }
    }

    simulation.run()
    return positioned
  }, [filteredNodes, filteredEdges, config])

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedNode(node)
    setSelectedEdge(null)
    onNodeSelect?.(node)
  }, [onNodeSelect])

  // Handle edge click
  const handleEdgeClick = useCallback((edge: GraphEdge, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedEdge(edge)
    setSelectedNode(null)
    onEdgeSelect?.(edge)
  }, [onEdgeSelect])

  // Handle node double click
  const handleNodeDoubleClick = useCallback((node: GraphNode) => {
    onNodeDoubleClick?.(node)
  }, [onNodeDoubleClick])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedNode(null)
    setSelectedEdge(null)
    onNodeSelect?.(null)
    onEdgeSelect?.(null)
  }, [onNodeSelect, onEdgeSelect])

  // Reset zoom
  const resetZoom = useCallback(() => {
    setTransform({ x: 0, y: 0, k: 1 })
  }, [])

  // Zoom in
  const zoomIn = useCallback(() => {
    setTransform(prev => ({ ...prev, k: Math.min(prev.k * 1.5, 4) }))
  }, [])

  // Zoom out
  const zoomOut = useCallback(() => {
    setTransform(prev => ({ ...prev, k: Math.max(prev.k / 1.5, 0.25) }))
  }, [])

  // Export to SVG
  const exportSVG = useCallback(() => {
    if (!svgRef.current) return
    
    const svgData = new XMLSerializer().serializeToString(svgRef.current)
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'relationship-graph.svg'
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  // Handle type filter toggle
  const toggleTypeFilter = useCallback((type: string) => {
    setTypeFilters(prev => {
      const newFilters = new Set(prev)
      if (newFilters.has(type)) {
        newFilters.delete(type)
      } else {
        newFilters.add(type)
      }
      return newFilters
    })
  }, [])

  // Handle relationship filter toggle
  const toggleRelationshipFilter = useCallback((type: string) => {
    setRelationshipFilters(prev => {
      const newFilters = new Set(prev)
      if (newFilters.has(type)) {
        newFilters.delete(type)
      } else {
        newFilters.add(type)
      }
      return newFilters
    })
  }, [])

  // Update selected node when selectedNodeId prop changes
  useEffect(() => {
    if (selectedNodeId) {
      const node = positionedNodes.find(n => n.id === selectedNodeId)
      if (node) {
        setSelectedNode(node)
      }
    }
  }, [selectedNodeId, positionedNodes])

  return (
    <div className={cn("relative bg-white border border-slate-200 rounded-xl overflow-hidden", className)}>
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <Input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search nodes..."
            className="pl-8 w-48 h-8 text-sm"
          />
        </div>

        {/* Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter size={14} className="mr-1" />
              Filters
              {(typeFilters.size + relationshipFilters.size) > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {typeFilters.size + relationshipFilters.size}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <div className="p-2">
              <Label className="text-xs font-medium text-slate-600">Entity Types</Label>
              {entityTypes.map(type => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={typeFilters.has(type)}
                  onCheckedChange={() => toggleTypeFilter(type)}
                  className="text-xs"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: entityTypeColors[type] || entityTypeColors.default }}
                    />
                    {type}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Label className="text-xs font-medium text-slate-600">Relationship Types</Label>
              {relationshipTypes.map(type => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={relationshipFilters.has(type)}
                  onCheckedChange={() => toggleRelationshipFilter(type)}
                  className="text-xs"
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <div className="p-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="connected-only" className="text-xs">Connected only</Label>
                <Switch
                  id="connected-only"
                  checked={showOnlyConnected}
                  onCheckedChange={setShowOnlyConnected}
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={zoomIn}>
          <ZoomIn size={14} />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={zoomOut}>
          <ZoomOut size={14} />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={resetZoom}>
          <RotateCcw size={14} />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setIsFullscreen(!isFullscreen)}>
          <Maximize2 size={14} />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={exportSVG}>
          <Download size={14} />
        </Button>
      </div>

      {/* Graph SVG */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab"
        style={{ height: isFullscreen ? '100vh' : '600px' }}
        onClick={clearSelection}
        onMouseDown={(e) => {
          const startX = e.clientX - transform.x
          const startY = e.clientY - transform.y
          
          const handleMouseMove = (e: MouseEvent) => {
            setTransform(prev => ({
              ...prev,
              x: e.clientX - startX,
              y: e.clientY - startY
            }))
          }
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
          }
          
          document.addEventListener('mousemove', handleMouseMove)
          document.addEventListener('mouseup', handleMouseUp)
        }}
      >
        <defs>
          {/* Arrow markers for directed relationships */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
          </marker>
          
          {/* Selected node glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.k})`}>
          {/* Edges */}
          {filteredEdges.map((edge) => {
            const source = positionedNodes.find(n => n.id === edge.source)
            const target = positionedNodes.find(n => n.id === edge.target)
            
            if (!source || !target) return null
            
            const isSelected = selectedEdge?.id === edge.id
            const color = relationshipTypeColors[edge.relationship_type] || relationshipTypeColors.default
            
            return (
              <g key={edge.id}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={isSelected ? color : '#d1d5db'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  markerEnd={config.show_arrows ? "url(#arrowhead)" : ""}
                  className="cursor-pointer hover:stroke-2"
                  onClick={(e) => handleEdgeClick(edge, e)}
                />
                
                {/* Edge label */}
                {config.show_labels && (
                  <text
                    x={(source.x! + target.x!) / 2}
                    y={(source.y! + target.y!) / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-xs fill-slate-600 pointer-events-none"
                    style={{ fontSize: '10px' }}
                  >
                    {edge.relationship_type}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {positionedNodes.map((node) => {
            const isSelected = selectedNode?.id === node.id || selectedNodeId === node.id
            const color = config.color_by_type 
              ? (entityTypeColors[node.entity_type] || entityTypeColors.default)
              : '#3b82f6'
            
            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? config.node_size_range[1] : config.node_size_range[0]}
                  fill={color}
                  stroke={isSelected ? '#fff' : color}
                  strokeWidth={isSelected ? 3 : 1}
                  className="cursor-pointer"
                  filter={isSelected ? "url(#glow)" : ""}
                  onClick={(e) => handleNodeClick(node, e)}
                  onDoubleClick={() => handleNodeDoubleClick(node)}
                />
                
                {/* Node label */}
                {config.show_labels && (
                  <text
                    x={node.x}
                    y={node.y! + config.node_size_range[1] + 12}
                    textAnchor="middle"
                    className="text-xs fill-slate-700 pointer-events-none"
                    style={{ fontSize: '11px' }}
                  >
                    {node.entity_name}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      </svg>

      {/* Info Panel */}
      {(selectedNode || selectedEdge) && (
        <Card className="absolute bottom-4 left-4 w-80 max-h-60 overflow-y-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {selectedNode && (
                <>
                  <Target size={16} />
                  Node Details
                </>
              )}
              {selectedEdge && (
                <>
                  <GitBranch size={16} />
                  Relationship Details
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            {selectedNode && (
              <>
                <div>
                  <span className="font-medium">Name:</span> {selectedNode.entity_name}
                </div>
                <div>
                  <span className="font-medium">Type:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {selectedNode.entity_type}
                  </Badge>
                </div>
                {selectedNode.entity_code && (
                  <div>
                    <span className="font-medium">Code:</span> {selectedNode.entity_code}
                  </div>
                )}
                <div>
                  <span className="font-medium">Smart Code:</span> {selectedNode.smart_code}
                </div>
              </>
            )}
            
            {selectedEdge && (
              <>
                <div>
                  <span className="font-medium">Type:</span>
                  <Badge variant="outline" className="ml-2 text-xs">
                    {selectedEdge.relationship_type}
                  </Badge>
                </div>
                {selectedEdge.effective_date && (
                  <div>
                    <span className="font-medium">Effective:</span> {selectedEdge.effective_date}
                  </div>
                )}
                {selectedEdge.expiration_date && (
                  <div>
                    <span className="font-medium">Expires:</span> {selectedEdge.expiration_date}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Panel */}
      <Card className="absolute bottom-4 right-4">
        <CardContent className="p-3">
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{filteredNodes.length} nodes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{filteredEdges.length} relationships</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span>{entityTypes.length} types</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default UniversalRelationshipGraph