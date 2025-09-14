import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'

interface ISPMetrics {
  totalRevenue: number
  totalSubscribers: number
  activeSubscribers: number
  networkUptime: number
  arpu: number
  churnRate: number
  newThisMonth: number
  revenueStreams: {
    broadband: number
    cableTV: number
    advertisement: number
    leasedLines: number
  }
}

interface RevenueData {
  month: string
  revenue: number
  subscribers: number
}

interface NetworkMetric {
  region: string
  uptime: number
  subscribers: number
}

interface AgentMetric {
  name: string
  newConnections: number
  commission: number
  region: string
}

export function useISPDashboard(organizationId: string) {
  const [metrics, setMetrics] = useState<ISPMetrics | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetric[]>([])
  const [agentMetrics, setAgentMetrics] = useState<AgentMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!organizationId) return

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true)
        
        // Set the organization context
        universalApi.setOrganizationId(organizationId)

        // Fetch real-time metrics
        const metricsResponse = await universalApi.read('core_entities', {
          filter: {
            entity_type: 'dashboard_metrics',
            organization_id: organizationId
          }
        })

        if (metricsResponse.data && metricsResponse.data.length > 0) {
          const metricsData = metricsResponse.data[0].metadata
          setMetrics({
            totalRevenue: metricsData.monthly_revenue,
            totalSubscribers: metricsData.total_subscribers,
            activeSubscribers: metricsData.active_subscribers,
            networkUptime: metricsData.network_uptime,
            arpu: metricsData.arpu,
            churnRate: metricsData.churn_rate,
            newThisMonth: metricsData.new_this_month,
            revenueStreams: metricsData.revenue_streams
          })
        }

        // Fetch revenue transactions
        const revenueResponse = await universalApi.read('universal_transactions', {
          filter: {
            transaction_type: 'monthly_revenue',
            organization_id: organizationId
          }
        })

        if (revenueResponse.data) {
          const revenue = revenueResponse.data.map((tx: any) => ({
            month: tx.metadata.month,
            revenue: tx.total_amount,
            subscribers: tx.metadata.subscriber_count
          }))
          setRevenueData(revenue)
        }

        // Fetch network performance
        const networkResponse = await universalApi.read('core_entities', {
          filter: {
            entity_type: 'network_region',
            organization_id: organizationId
          }
        })

        if (networkResponse.data) {
          const network = networkResponse.data.map((entity: any) => ({
            region: entity.metadata.region_name,
            uptime: entity.metadata.uptime_percentage,
            subscribers: entity.metadata.subscriber_count
          }))
          setNetworkMetrics(network)
        }

        // Fetch agent performance
        const agentResponse = await universalApi.read('core_entities', {
          filter: {
            entity_type: 'agent_performance',
            organization_id: organizationId
          }
        })

        if (agentResponse.data) {
          const agents = agentResponse.data.map((entity: any) => ({
            name: entity.metadata.agent_name,
            newConnections: entity.metadata.new_connections_mtd,
            commission: entity.metadata.commission_earned,
            region: entity.metadata.region
          }))
          setAgentMetrics(agents)
        }

        setError(null)
      } catch (err) {
        console.error('Error fetching ISP dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [organizationId])

  return {
    metrics,
    revenueData,
    networkMetrics,
    agentMetrics,
    isLoading,
    error
  }
}