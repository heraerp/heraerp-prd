'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Network, Download, Maximize2, RefreshCw, Info } from 'lucide-react'
import { useConnectors } from '@/hooks/integration-hub/useConnectors'
import { useMappings } from '@/hooks/integration-hub/useMappings'
import { useSyncJobs } from '@/hooks/integration-hub/useSyncJobs'
import { DataFlowEngine } from '@/lib/integration-hub/data-flow-engine'

interface DataFlowDiagramProps {
  organizationId: string
}

export function DataFlowDiagram({ organizationId }: DataFlowDiagramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { data: connectors, isLoading: connectorsLoading } = useConnectors(organizationId)
  const { data: mappings, isLoading: mappingsLoading } = useMappings(organizationId)
  const { data: syncJobs, isLoading: syncJobsLoading } = useSyncJobs(organizationId)

  const isLoading = connectorsLoading || mappingsLoading || syncJobsLoading

  useEffect(() => {
    if (!canvasRef.current || isLoading) return
    if (!connectors || !mappings || !syncJobs) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Generate flow diagram
    const flowDiagram = DataFlowEngine.generateFlowDiagram(connectors, mappings, syncJobs)

    // Draw diagram (simplified visualization)
    // In production, use a proper graph visualization library like react-flow or d3

    // Draw HERA central node
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    ctx.beginPath()
    ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI)
    ctx.fillStyle = '#3b82f6'
    ctx.fill()
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 3
    ctx.stroke()

    ctx.fillStyle = 'white'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('HERA', centerX, centerY - 10)
    ctx.fillText('CivicFlow', centerX, centerY + 10)

    // Draw connector nodes
    flowDiagram.nodes.forEach((node, index) => {
      if (node.type === 'connector' && node.position) {
        // Draw node
        ctx.beginPath()
        ctx.arc(node.position.x, node.position.y, 40, 0, 2 * Math.PI)

        if (node.status === 'active') {
          ctx.fillStyle = '#10b981'
        } else if (node.status === 'error') {
          ctx.fillStyle = '#ef4444'
        } else {
          ctx.fillStyle = '#6b7280'
        }

        ctx.fill()
        ctx.strokeStyle = '#374151'
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw icon
        ctx.fillStyle = 'white'
        ctx.font = '20px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(node.metadata?.icon || '🔌', node.position.x, node.position.y - 5)

        // Draw label
        ctx.fillStyle = '#374151'
        ctx.font = '12px sans-serif'
        ctx.fillText(node.label, node.position.x, node.position.y + 55)
      }
    })

    // Draw edges
    flowDiagram.edges.forEach(edge => {
      const sourceNode = flowDiagram.nodes.find(n => n.id === edge.source)
      const targetNode = flowDiagram.nodes.find(n => n.id === edge.target)

      if (sourceNode?.position && targetNode?.position) {
        ctx.beginPath()
        ctx.moveTo(sourceNode.position.x, sourceNode.position.y)
        ctx.lineTo(targetNode.position.x, targetNode.position.y)

        if (edge.style?.stroke) {
          ctx.strokeStyle = edge.style.stroke
        } else {
          ctx.strokeStyle = '#9ca3af'
        }

        ctx.lineWidth = edge.animated ? 3 : 2

        if (edge.animated) {
          ctx.setLineDash([5, 5])
        } else {
          ctx.setLineDash([])
        }

        ctx.stroke()

        // Draw arrowhead
        const angle = Math.atan2(
          targetNode.position.y - sourceNode.position.y,
          targetNode.position.x - sourceNode.position.x
        )
        const arrowLength = 10
        const arrowAngle = Math.PI / 6

        ctx.beginPath()
        ctx.moveTo(
          targetNode.position.x - 40 * Math.cos(angle),
          targetNode.position.y - 40 * Math.sin(angle)
        )
        ctx.lineTo(
          targetNode.position.x - 40 * Math.cos(angle) - arrowLength * Math.cos(angle - arrowAngle),
          targetNode.position.y - 40 * Math.sin(angle) - arrowLength * Math.sin(angle - arrowAngle)
        )
        ctx.moveTo(
          targetNode.position.x - 40 * Math.cos(angle),
          targetNode.position.y - 40 * Math.sin(angle)
        )
        ctx.lineTo(
          targetNode.position.x - 40 * Math.cos(angle) - arrowLength * Math.cos(angle + arrowAngle),
          targetNode.position.y - 40 * Math.sin(angle) - arrowLength * Math.sin(angle + arrowAngle)
        )
        ctx.stroke()

        // Draw label
        if (edge.label) {
          const midX = (sourceNode.position.x + targetNode.position.x) / 2
          const midY = (sourceNode.position.y + targetNode.position.y) / 2

          ctx.fillStyle = 'white'
          ctx.fillRect(midX - 40, midY - 10, 80, 20)

          ctx.fillStyle = '#374151'
          ctx.font = '11px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(edge.label, midX, midY)
        }
      }
    })
  }, [connectors, mappings, syncJobs, isLoading])

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  const activeConnectors = connectors?.filter(c => c.status === 'active').length || 0
  const activeSyncJobs = syncJobs?.filter(j => j.status === 'active').length || 0

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Data Flow Visualization</h1>
          <p className="text-muted-foreground">Visual representation of integration architecture</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Maximize2 className="h-4 w-4" />
            Fullscreen
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
          <span>Active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>Error</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
          <span>Inactive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-blue-500"></div>
          <span>Data Flow</span>
        </div>
      </div>

      {/* Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Integration Architecture</span>
            <div className="flex items-center gap-4 text-sm">
              <Badge variant="secondary">{connectors?.length || 0} Connectors</Badge>
              <Badge variant="secondary">{mappings?.length || 0} Mappings</Badge>
              <Badge variant="secondary">{syncJobs?.length || 0} Sync Jobs</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas ref={canvasRef} className="w-full h-[600px] border rounded-lg bg-muted/20" />

            {/* Info overlay */}
            <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur p-3 rounded-lg border">
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {activeConnectors} active connectors, {activeSyncJobs} active sync jobs
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flow Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Data Flow Patterns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Inbound Flows</h4>
              <div className="space-y-2">
                {syncJobs
                  ?.filter(j => j.sync_direction === 'inbound')
                  .map(job => (
                    <div key={job.id} className="flex items-center justify-between text-sm">
                      <span>{job.entity_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {job.sync_type}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Outbound Flows</h4>
              <div className="space-y-2">
                {syncJobs
                  ?.filter(j => j.sync_direction === 'outbound')
                  .map(job => (
                    <div key={job.id} className="flex items-center justify-between text-sm">
                      <span>{job.entity_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {job.sync_type}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Bidirectional Flows</h4>
              <div className="space-y-2">
                {syncJobs
                  ?.filter(j => j.sync_direction === 'bidirectional')
                  .map(job => (
                    <div key={job.id} className="flex items-center justify-between text-sm">
                      <span>{job.entity_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {job.sync_type}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
