/**
 * Dependency Graph Visualization
 */

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Package, Info, ChevronRight } from 'lucide-react'
import type { ModuleEntity, RelationshipRow } from '@/lib/types/factory'

interface DependencyGraphProps {
  modules: ModuleEntity[]
  relationships: RelationshipRow[]
}

interface GraphNode {
  id: string
  name: string
  type: 'module' | 'capability'
  x: number
  y: number
}

interface GraphEdge {
  from: string
  to: string
  constraint?: string
}

export function DependencyGraph({ modules, relationships }: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])

  useEffect(() => {
    // Build graph data
    const nodeMap = new Map<string, GraphNode>()
    const edgeList: GraphEdge[] = []

    // Add module nodes
    modules.forEach((module, index) => {
      const node: GraphNode = {
        id: module.id,
        name: module.entity_name,
        type: 'module',
        x: 100 + (index % 3) * 200,
        y: 100 + Math.floor(index / 3) * 150
      }
      nodeMap.set(module.id, node)
    })

    // Process relationships
    relationships.forEach(rel => {
      if (rel.relationship_type === 'DEPENDS_ON') {
        // Check if target is a module
        const targetModule = modules.find(m => m.id === rel.to_entity_id)
        if (!targetModule && !nodeMap.has(rel.to_entity_id)) {
          // Add capability node
          const capNode: GraphNode = {
            id: rel.to_entity_id,
            name: `Capability ${rel.to_entity_id.slice(-6)}`,
            type: 'capability',
            x: 400 + Math.random() * 100,
            y: 50 + Math.random() * 300
          }
          nodeMap.set(rel.to_entity_id, capNode)
        }

        edgeList.push({
          from: rel.from_entity_id,
          to: rel.to_entity_id,
          constraint: (rel.metadata as any)?.version_constraint as string
        })
      }
    })

    setNodes(Array.from(nodeMap.values()))
    setEdges(edgeList)
  }, [modules, relationships])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw edges
    ctx.strokeStyle = '#9ca3af'
    ctx.lineWidth = 1
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from)
      const toNode = nodes.find(n => n.id === edge.to)
      if (fromNode && toNode) {
        ctx.beginPath()
        ctx.moveTo(fromNode.x, fromNode.y)
        ctx.lineTo(toNode.x, toNode.y)
        ctx.stroke()

        // Draw arrowhead
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x)
        const headLength = 10
        ctx.beginPath()
        ctx.moveTo(toNode.x, toNode.y)
        ctx.lineTo(
          toNode.x - headLength * Math.cos(angle - Math.PI / 6),
          toNode.y - headLength * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(toNode.x, toNode.y)
        ctx.lineTo(
          toNode.x - headLength * Math.cos(angle + Math.PI / 6),
          toNode.y - headLength * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()
      }
    })

    // Draw nodes
    nodes.forEach(node => {
      const isModule = node.type === 'module'

      // Node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, 30, 0, 2 * Math.PI)
      ctx.fillStyle = isModule ? '#3b82f6' : '#8b5cf6'
      ctx.fill()

      // Node icon
      ctx.fillStyle = 'white'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(isModule ? '📦' : '⚡', node.x, node.y)

      // Node label
      ctx.fillStyle = '#374151'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(node.name, node.x, node.y + 40)
    })
  }, [nodes, edges])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find clicked node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2))
      return distance <= 30
    })

    setSelectedNode(clickedNode || null)
  }

  return (
    <section
      aria-label="Dependency Graph"
      className="bg-background dark:bg-muted rounded-2xl shadow-lg p-6"
    >
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Module Dependencies
        </h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full" />
            <span className="text-muted-foreground dark:text-muted-foreground">Module</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded-full" />
            <span className="text-muted-foreground dark:text-muted-foreground">Capability</span>
          </div>
        </div>
      </header>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full h-[400px] border border-border dark:border-border rounded-lg cursor-pointer"
          onClick={handleCanvasClick}
        />

        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 bg-background dark:bg-muted rounded-lg shadow-lg p-4 w-64 border border-border dark:border-border"
          >
            <h3 className="font-semibold text-gray-900 dark:text-foreground flex items-center gap-2">
              {selectedNode.type === 'module' ? (
                <Package className="w-4 h-4" />
              ) : (
                <Info className="w-4 h-4" />
              )}
              {selectedNode.name}
            </h3>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
              Type: {selectedNode.type}
            </p>

            {selectedNode.type === 'module' && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Dependencies:
                </p>
                {edges
                  .filter(e => e.from === selectedNode.id)
                  .map((edge, idx) => {
                    const targetNode = nodes.find(n => n.id === edge.to)
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1 text-xs text-muted-foreground dark:text-muted-foreground"
                      >
                        <ChevronRight className="w-3 h-3" />
                        {targetNode?.name || 'Unknown'}
                        {edge.constraint && ` (${edge.constraint})`}
                      </div>
                    )
                  })}
              </div>
            )}

            {selectedNode.type === 'capability' && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Required by:</p>
                {edges
                  .filter(e => e.to === selectedNode.id)
                  .map((edge, idx) => {
                    const sourceNode = nodes.find(n => n.id === edge.from)
                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-1 text-xs text-muted-foreground dark:text-muted-foreground"
                      >
                        <ChevronRight className="w-3 h-3" />
                        {sourceNode?.name || 'Unknown'}
                      </div>
                    )
                  })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  )
}
