import type {
  IntegrationConnector,
  DataMapping,
  SyncJob,
  FlowDiagram,
  FlowNode,
  FlowEdge
} from '@/types/integration-hub'

export class DataFlowEngine {
  // Generate flow diagram from connectors, mappings, and sync jobs
  static generateFlowDiagram(
    connectors: IntegrationConnector[],
    mappings: DataMapping[],
    syncJobs: SyncJob[]
  ): FlowDiagram {
    const nodes: FlowNode[] = []
    const edges: FlowEdge[] = []
    const nodeMap = new Map<string, FlowNode>()

    // Create HERA central node
    const heraNode: FlowNode = {
      id: 'hera-central',
      type: 'target',
      label: 'HERA CivicFlow',
      status: 'active',
      metadata: {
        icon: '🌐',
        description: 'Central data hub',
        nodeType: 'hera'
      },
      position: { x: 400, y: 300 }
    }
    nodes.push(heraNode)
    nodeMap.set(heraNode.id, heraNode)

    // Create connector nodes
    connectors.forEach((connector, index) => {
      const angle = (2 * Math.PI * index) / connectors.length
      const radius = 200
      const x = 400 + radius * Math.cos(angle)
      const y = 300 + radius * Math.sin(angle)

      const node: FlowNode = {
        id: connector.id,
        type: 'connector',
        label: connector.entity_name,
        status:
          connector.status === 'active'
            ? 'active'
            : connector.status === 'error'
              ? 'error'
              : 'inactive',
        metadata: {
          vendor: connector.vendor,
          icon: this.getVendorIcon(connector.vendor),
          capabilities: connector.capabilities,
          lastHealthCheck: connector.last_health_check
        },
        position: { x, y }
      }
      nodes.push(node)
      nodeMap.set(node.id, node)
    })

    // Create transformer nodes for mappings
    mappings.forEach(mapping => {
      const connectorNode = nodeMap.get(mapping.connector_id)
      if (!connectorNode) return

      const node: FlowNode = {
        id: mapping.id,
        type: 'transformer',
        label: `Map: ${mapping.entity_name}`,
        status: 'active',
        metadata: {
          resource: mapping.metadata?.resource,
          fieldCount: mapping.field_mappings?.length || 0,
          transformCount: mapping.transform_operations?.length || 0
        },
        position: {
          x: (connectorNode.position!.x + heraNode.position!.x) / 2,
          y: (connectorNode.position!.y + heraNode.position!.y) / 2
        }
      }
      nodes.push(node)
      nodeMap.set(node.id, node)
    })

    // Create edges based on sync jobs
    syncJobs.forEach(syncJob => {
      const connectorNode = nodeMap.get(syncJob.connector_id)
      const mappingNode = nodeMap.get(syncJob.mapping_id)

      if (!connectorNode) return

      if (syncJob.sync_direction === 'inbound') {
        // Connector -> Mapping -> HERA
        if (mappingNode) {
          edges.push({
            id: `edge-${syncJob.id}-1`,
            source: connectorNode.id,
            target: mappingNode.id,
            label: this.getSyncLabel(syncJob),
            animated: syncJob.status === 'active',
            style: { stroke: this.getEdgeColor(syncJob.status) }
          })
          edges.push({
            id: `edge-${syncJob.id}-2`,
            source: mappingNode.id,
            target: heraNode.id,
            animated: syncJob.status === 'active',
            style: { stroke: this.getEdgeColor(syncJob.status) }
          })
        } else {
          // Direct: Connector -> HERA
          edges.push({
            id: `edge-${syncJob.id}`,
            source: connectorNode.id,
            target: heraNode.id,
            label: this.getSyncLabel(syncJob),
            animated: syncJob.status === 'active',
            style: { stroke: this.getEdgeColor(syncJob.status) }
          })
        }
      } else if (syncJob.sync_direction === 'outbound') {
        // HERA -> Mapping -> Connector
        if (mappingNode) {
          edges.push({
            id: `edge-${syncJob.id}-1`,
            source: heraNode.id,
            target: mappingNode.id,
            label: this.getSyncLabel(syncJob),
            animated: syncJob.status === 'active',
            style: { stroke: this.getEdgeColor(syncJob.status) }
          })
          edges.push({
            id: `edge-${syncJob.id}-2`,
            source: mappingNode.id,
            target: connectorNode.id,
            animated: syncJob.status === 'active',
            style: { stroke: this.getEdgeColor(syncJob.status) }
          })
        } else {
          // Direct: HERA -> Connector
          edges.push({
            id: `edge-${syncJob.id}`,
            source: heraNode.id,
            target: connectorNode.id,
            label: this.getSyncLabel(syncJob),
            animated: syncJob.status === 'active',
            style: { stroke: this.getEdgeColor(syncJob.status) }
          })
        }
      } else {
        // Bidirectional: Create two edges
        edges.push({
          id: `edge-${syncJob.id}-in`,
          source: connectorNode.id,
          target: heraNode.id,
          label: `↓ ${this.getSyncLabel(syncJob)}`,
          animated: syncJob.status === 'active',
          style: { stroke: this.getEdgeColor(syncJob.status) }
        })
        edges.push({
          id: `edge-${syncJob.id}-out`,
          source: heraNode.id,
          target: connectorNode.id,
          label: `↑ ${this.getSyncLabel(syncJob)}`,
          animated: syncJob.status === 'active',
          style: { stroke: this.getEdgeColor(syncJob.status) }
        })
      }
    })

    return {
      nodes,
      edges,
      layout: 'radial'
    }
  }

  // Generate data flow statistics
  static generateDataFlowStats(syncRuns: any[], period: '1h' | '24h' | '7d' | '30d'): any {
    const now = new Date()
    const periodMs = this.getPeriodMilliseconds(period)
    const cutoffTime = new Date(now.getTime() - periodMs)

    // Filter runs within period
    const recentRuns = syncRuns.filter(run => new Date(run.metadata?.started_at || 0) > cutoffTime)

    // Group by connector and direction
    const flowStats = new Map<
      string,
      {
        connectorId: string
        connectorName: string
        inboundRecords: number
        outboundRecords: number
        inboundBytes: number
        outboundBytes: number
        errors: number
        avgDuration: number
      }
    >()

    recentRuns.forEach(run => {
      const syncJob = run.metadata?.sync_job
      if (!syncJob) return

      const key = syncJob.connector_id
      const existing = flowStats.get(key) || {
        connectorId: syncJob.connector_id,
        connectorName: syncJob.connector_name || 'Unknown',
        inboundRecords: 0,
        outboundRecords: 0,
        inboundBytes: 0,
        outboundBytes: 0,
        errors: 0,
        avgDuration: 0
      }

      const stats = run.metadata?.stats || {}
      const direction = syncJob.sync_direction

      if (direction === 'inbound') {
        existing.inboundRecords += stats.processed_records || 0
        existing.inboundBytes += stats.data_volume_bytes || 0
      } else if (direction === 'outbound') {
        existing.outboundRecords += stats.processed_records || 0
        existing.outboundBytes += stats.data_volume_bytes || 0
      }

      existing.errors += stats.error_records || 0
      existing.avgDuration = (existing.avgDuration + (run.metadata?.duration_seconds || 0)) / 2

      flowStats.set(key, existing)
    })

    // Calculate totals and peak times
    let totalInbound = 0
    let totalOutbound = 0
    let totalErrors = 0
    const hourlyStats = new Map<number, { inbound: number; outbound: number }>()

    recentRuns.forEach(run => {
      const stats = run.metadata?.stats || {}
      const direction = run.metadata?.sync_job?.sync_direction
      const hour = new Date(run.metadata?.started_at || 0).getHours()

      const hourly = hourlyStats.get(hour) || { inbound: 0, outbound: 0 }

      if (direction === 'inbound') {
        hourly.inbound += stats.processed_records || 0
        totalInbound += stats.processed_records || 0
      } else if (direction === 'outbound') {
        hourly.outbound += stats.processed_records || 0
        totalOutbound += stats.processed_records || 0
      }

      totalErrors += stats.error_records || 0
      hourlyStats.set(hour, hourly)
    })

    // Find peak hours
    let peakInboundHour = -1
    let peakOutboundHour = -1
    let maxInbound = 0
    let maxOutbound = 0

    hourlyStats.forEach((stats, hour) => {
      if (stats.inbound > maxInbound) {
        maxInbound = stats.inbound
        peakInboundHour = hour
      }
      if (stats.outbound > maxOutbound) {
        maxOutbound = stats.outbound
        peakOutboundHour = hour
      }
    })

    return {
      period,
      totalInboundRecords: totalInbound,
      totalOutboundRecords: totalOutbound,
      totalErrors,
      errorRate:
        totalInbound + totalOutbound > 0
          ? ((totalErrors / (totalInbound + totalOutbound)) * 100).toFixed(2) + '%'
          : '0%',
      connectorStats: Array.from(flowStats.values()),
      peakInboundHour: peakInboundHour >= 0 ? `${peakInboundHour}:00` : 'N/A',
      peakOutboundHour: peakOutboundHour >= 0 ? `${peakOutboundHour}:00` : 'N/A',
      hourlyDistribution: Array.from(hourlyStats.entries()).map(([hour, stats]) => ({
        hour: `${hour}:00`,
        ...stats
      }))
    }
  }

  // Helper methods
  private static getVendorIcon(vendor: string): string {
    const iconMap: Record<string, string> = {
      microsoft_365: '🔷',
      google: '🌈',
      mailchimp: '🐵',
      linkedin: '💼',
      bluesky: '🦋',
      twinfield: '📊',
      craft_cms: '🔨',
      eventbrite: '🎫',
      power_bi: '📈',
      tableau: '📊'
    }
    return iconMap[vendor] || '🔌'
  }

  private static getSyncLabel(syncJob: SyncJob): string {
    if (syncJob.schedule?.type === 'cron') {
      return `${syncJob.sync_type} (${this.describeCron(syncJob.schedule.cron!)})`
    }
    if (syncJob.schedule?.type === 'interval') {
      return `${syncJob.sync_type} (every ${syncJob.schedule.interval_minutes}m)`
    }
    return `${syncJob.sync_type} (manual)`
  }

  private static describeCron(cron: string): string {
    // Simple cron description
    if (cron === '0 * * * *') return 'hourly'
    if (cron === '0 0 * * *') return 'daily'
    if (cron === '0 0 * * 0') return 'weekly'
    if (cron === '0 0 1 * *') return 'monthly'
    return 'custom'
  }

  private static getEdgeColor(status: string): string {
    switch (status) {
      case 'active':
        return '#10b981' // green
      case 'paused':
        return '#f59e0b' // amber
      case 'error':
        return '#ef4444' // red
      default:
        return '#6b7280' // gray
    }
  }

  private static getPeriodMilliseconds(period: '1h' | '24h' | '7d' | '30d'): number {
    switch (period) {
      case '1h':
        return 60 * 60 * 1000
      case '24h':
        return 24 * 60 * 60 * 1000
      case '7d':
        return 7 * 24 * 60 * 60 * 1000
      case '30d':
        return 30 * 24 * 60 * 60 * 1000
    }
  }
}
