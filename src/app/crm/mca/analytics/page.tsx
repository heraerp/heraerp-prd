'use client'

/**
 * MCA Campaign Analytics Dashboard
 * Mobile-First Enterprise Page for Campaign Performance & Engagement Insights
 * 
 * Module: MCA
 * Entity: ANALYTICS_VIEW
 * Smart Code: HERA.CRM.MCA.PAGE.ANALYTICS.V1
 * Path: /crm/mca/analytics
 * Description: Campaign performance insights with deliverability, engagement, and conversion tracking
 */

import React, { useState, useCallback, useEffect } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileFilters, type FilterField } from '@/components/mobile/MobileFilters'
import { MobileDataTable, type TableColumn, type TableRecord } from '@/components/mobile/MobileDataTable'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { 
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle,
  Download,
  Edit,
  Eye,
  Filter,
  LineChart,
  Mail,
  MessageSquare,
  MoreVertical,
  PieChart,
  Plus,
  Save,
  Search,
  Send,
  Smartphone,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  X,
  Zap
} from 'lucide-react'

/**
 * Campaign Analytics Entity Interface
 * Extends TableRecord for HERA compliance
 */
interface CampaignAnalytics extends TableRecord {
  id: string
  campaign_name: string
  channel_mix: string
  sends: number
  delivered: number
  opened: number
  clicked: number
  conversions: number
  status: string
  created_at?: string
  
  // Calculated fields
  delivery_rate: number
  open_rate: number
  click_rate: number
  conversion_rate: number
}

/**
 * HERA Analytics Smart Codes
 */
const ANALYTICS_SMART_CODES = {
  PAGE: 'HERA.CRM.MCA.PAGE.ANALYTICS.V1',
  EVENT_MESSAGE_DISPATCHED: 'HERA.CRM.MCA.EVENT.MESSAGE_DISPATCHED.V1',
  EVENT_DELIVERY_EVENT: 'HERA.CRM.MCA.EVENT.DELIVERY_EVENT.V1',
  EVENT_CLICK: 'HERA.CRM.MCA.EVENT.CLICK.V1',
  EVENT_CONVERSION: 'HERA.CRM.MCA.EVENT.CONVERSION.V1'
} as const

/**
 * Campaign Analytics Main Page Component
 * Enterprise-grade analytics with real-time insights
 */
export default function CampaignAnalyticsPage() {
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [selectedCampaigns, setSelectedCampaigns] = useState<(string | number)[]>([])
  const [filters, setFilters] = useState({
    date_range: '7d',
    channel: '',
    segment: '',
    campaign_status: ''
  })

  // Mock analytics data (in production, this would aggregate from universal_transactions)
  const campaignAnalytics: CampaignAnalytics[] = [
    {
      id: '1',
      campaign_name: 'Welcome Onboarding Series',
      channel_mix: 'Email + SMS',
      sends: 12450,
      delivered: 11891,
      opened: 6234,
      clicked: 1876,
      conversions: 234,
      status: 'active',
      delivery_rate: 95.5,
      open_rate: 52.4,
      click_rate: 30.1,
      conversion_rate: 12.5,
      created_at: '2024-10-07T00:00:00Z'
    },
    {
      id: '2',
      campaign_name: 'Cart Abandonment Recovery',
      channel_mix: 'Email + Push',
      sends: 8760,
      delivered: 8234,
      opened: 3456,
      clicked: 876,
      conversions: 187,
      status: 'active',
      delivery_rate: 94.0,
      open_rate: 42.0,
      click_rate: 25.3,
      conversion_rate: 21.4,
      created_at: '2024-10-08T00:00:00Z'
    },
    {
      id: '3',
      campaign_name: 'Monthly Newsletter',
      channel_mix: 'Email',
      sends: 45600,
      delivered: 43892,
      opened: 15432,
      clicked: 2156,
      conversions: 98,
      status: 'completed',
      delivery_rate: 96.3,
      open_rate: 35.1,
      click_rate: 14.0,
      conversion_rate: 4.5,
      created_at: '2024-10-01T00:00:00Z'
    }
  ]

  // Aggregate KPIs
  const totalSends = campaignAnalytics.reduce((sum, c) => sum + c.sends, 0)
  const totalDelivered = campaignAnalytics.reduce((sum, c) => sum + c.delivered, 0)
  const totalOpened = campaignAnalytics.reduce((sum, c) => sum + c.opened, 0)
  const totalClicked = campaignAnalytics.reduce((sum, c) => sum + c.clicked, 0)
  const totalConversions = campaignAnalytics.reduce((sum, c) => sum + c.conversions, 0)
  
  const kpis = [
    {
      title: 'Total Sends',
      value: totalSends.toLocaleString(),
      change: '+18.2%',
      trend: 'up' as const,
      icon: Send
    },
    {
      title: 'Delivery Rate',
      value: `${((totalDelivered / totalSends) * 100).toFixed(1)}%`,
      change: '+1.3%',
      trend: 'up' as const,
      icon: CheckCircle
    },
    {
      title: 'Open Rate',
      value: `${((totalOpened / totalDelivered) * 100).toFixed(1)}%`,
      change: '-2.1%',
      trend: 'down' as const,
      icon: Eye
    },
    {
      title: 'Click Rate',
      value: `${((totalClicked / totalOpened) * 100).toFixed(1)}%`,
      change: '+4.8%',
      trend: 'up' as const,
      icon: Target
    },
    {
      title: 'Conversion Rate',
      value: `${((totalConversions / totalClicked) * 100).toFixed(1)}%`,
      change: '+7.2%',
      trend: 'up' as const,
      icon: Zap
    },
    {
      title: 'Unsubscribes',
      value: '0.12%',
      change: '-0.03%',
      trend: 'down' as const,
      icon: Users
    }
  ]

  // Chart data
  const deliverabilityByChannel = [
    { name: 'Email', value: 95.8, color: '#3498db' },
    { name: 'SMS', value: 97.2, color: '#2ecc71' },
    { name: 'WhatsApp', value: 94.1, color: '#25d366' },
    { name: 'Push', value: 89.3, color: '#f39c12' }
  ]

  const engagementOverTime = [
    { date: '10/07', opens: 5234, clicks: 1876, conversions: 234 },
    { date: '10/08', opens: 6123, clicks: 2012, conversions: 267 },
    { date: '10/09', opens: 4987, clicks: 1654, conversions: 198 },
    { date: '10/10', opens: 7234, clicks: 2345, conversions: 312 },
    { date: '10/11', opens: 6789, clicks: 2198, conversions: 289 },
    { date: '10/12', opens: 8012, clicks: 2567, conversions: 345 },
    { date: '10/13', opens: 7456, clicks: 2289, conversions: 298 }
  ]

  const topTemplatesByCTR = [
    { name: 'Welcome Email v3', ctr: 32.4 },
    { name: 'Flash Sale Alert', ctr: 28.7 },
    { name: 'Cart Reminder SMS', ctr: 25.3 },
    { name: 'Weekly Newsletter', ctr: 18.9 },
    { name: 'Product Launch', ctr: 16.2 }
  ]

  // Enhanced table columns
  const columns: TableColumn[] = [
    { key: 'campaign_name', label: 'Campaign Name', sortable: true },
    { key: 'channel_mix', label: 'Channel Mix', sortable: true },
    { key: 'sends', label: 'Sends', sortable: true },
    { key: 'delivered', label: 'Delivered', sortable: true },
    { key: 'opened', label: 'Opened', sortable: true },
    { key: 'clicked', label: 'Clicked', sortable: true },
    { key: 'conversions', label: 'Conversions', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  // Enhanced filter fields
  const filterFields: FilterField[] = [
    { key: 'date_range', label: 'Date Range', type: 'select', options: [
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' },
      { value: '90d', label: 'Last 90 days' },
      { value: 'custom', label: 'Custom range' }
    ]},
    { key: 'channel', label: 'Channel', type: 'select', options: [
      { value: '', label: 'All Channels' },
      { value: 'email', label: 'Email' },
      { value: 'sms', label: 'SMS' },
      { value: 'whatsapp', label: 'WhatsApp' },
      { value: 'push', label: 'Push' }
    ]},
    { key: 'campaign_status', label: 'Status', type: 'select', options: [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'completed', label: 'Completed' },
      { value: 'paused', label: 'Paused' }
    ]}
  ]

  // Helper function to get channel icon
  const getChannelIcon = (channelMix: string) => {
    if (channelMix.includes('Email')) return <Mail className="h-4 w-4" />
    if (channelMix.includes('SMS')) return <MessageSquare className="h-4 w-4" />
    if (channelMix.includes('Push')) return <Smartphone className="h-4 w-4" />
    return <Send className="h-4 w-4" />
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'paused': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Enterprise security checks
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p>Please log in to access Campaign Analytics.</p>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p>No organization context found. Please select an organization.</p>
      </div>
    )
  }

  return (
    <MobilePageLayout
      title="Campaign Analytics"
      subtitle={`Performance insights across ${campaignAnalytics.length} campaigns`}
      primaryColor="#8e44ad"
      accentColor="#9b59b6"
      showBackButton={false}
    >
      {/* Enterprise KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {kpis.map((kpi, index) => (
          <MobileCard key={index} className="p-3 hover:shadow-md transition-shadow">
            <div className="text-center">
              <kpi.icon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-medium">{kpi.title}</p>
              <p className="text-lg font-bold" style={{ color: '#8e44ad' }}>{kpi.value}</p>
              <p className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                {kpi.change}
              </p>
            </div>
          </MobileCard>
        ))}
      </div>

      {/* Enhanced Filters */}
      <MobileFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        className="mb-6"
      />

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Deliverability by Channel */}
        <MobileCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Deliverability by Channel</h3>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {deliverabilityByChannel.map((channel, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: channel.color }}
                  ></div>
                  <span className="text-sm font-medium">{channel.name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        backgroundColor: channel.color, 
                        width: `${channel.value}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{channel.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </MobileCard>

        {/* Engagement Over Time */}
        <MobileCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Engagement Over Time</h3>
            <LineChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-32 flex items-end justify-between space-x-1">
            {engagementOverTime.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full flex flex-col items-center space-y-1">
                  <div 
                    className="w-full bg-purple-500 rounded-t"
                    style={{ height: `${(day.conversions / 400) * 100}px` }}
                    title={`Conversions: ${day.conversions}`}
                  ></div>
                  <div 
                    className="w-full bg-purple-300 rounded"
                    style={{ height: `${(day.clicks / 3000) * 80}px` }}
                    title={`Clicks: ${day.clicks}`}
                  ></div>
                  <div 
                    className="w-full bg-purple-100 rounded-b"
                    style={{ height: `${(day.opens / 10000) * 60}px` }}
                    title={`Opens: ${day.opens}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{day.date}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-500 rounded"></div>
              <span>Conversions</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-300 rounded"></div>
              <span>Clicks</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-100 rounded"></div>
              <span>Opens</span>
            </div>
          </div>
        </MobileCard>

        {/* Top Templates by CTR */}
        <MobileCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Top Templates by CTR</h3>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {topTemplatesByCTR.map((template, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium flex-1 truncate">{template.name}</span>
                <div className="flex items-center space-x-3">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${(template.ctr / 35) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{template.ctr}%</span>
                </div>
              </div>
            ))}
          </div>
        </MobileCard>

        {/* Conversion Funnel */}
        <MobileCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Conversion Funnel</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-2">
            {[
              { stage: 'Sent', value: totalSends, percentage: 100 },
              { stage: 'Delivered', value: totalDelivered, percentage: (totalDelivered / totalSends) * 100 },
              { stage: 'Opened', value: totalOpened, percentage: (totalOpened / totalSends) * 100 },
              { stage: 'Clicked', value: totalClicked, percentage: (totalClicked / totalSends) * 100 },
              { stage: 'Converted', value: totalConversions, percentage: (totalConversions / totalSends) * 100 }
            ].map((stage, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium w-20">{stage.stage}</span>
                <div className="flex-1 mx-3">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-purple-500 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{stage.value.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{stage.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </MobileCard>
      </div>

      {/* Campaign Performance Table */}
      <MobileDataTable
        data={campaignAnalytics}
        columns={columns}
        selectedRows={selectedCampaigns}
        onRowSelect={setSelectedCampaigns}
        showBulkActions={selectedCampaigns.length > 0}
        bulkActions={[
          {
            label: 'Export Analytics',
            action: async () => {
              console.log('Exporting analytics for campaigns:', selectedCampaigns)
              setSelectedCampaigns([])
            },
            variant: 'default'
          }
        ]}
        mobileCardRender={(campaign) => (
          <MobileCard key={campaign.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  {getChannelIcon(campaign.channel_mix)}
                  <h3 className="font-semibold text-lg">{campaign.campaign_name}</h3>
                </div>
                <p className="text-sm text-gray-600">{campaign.channel_mix}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                {campaign.status}
              </span>
            </div>
            
            {/* Performance metrics grid */}
            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-bold text-lg">{campaign.sends.toLocaleString()}</div>
                <div className="text-gray-600 text-xs">Sends</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-bold text-lg text-green-600">{campaign.delivery_rate}%</div>
                <div className="text-gray-600 text-xs">Delivered</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-bold text-lg text-blue-600">{campaign.open_rate}%</div>
                <div className="text-gray-600 text-xs">Opened</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="font-bold text-lg text-purple-600">{campaign.conversion_rate}%</div>
                <div className="text-gray-600 text-xs">Converted</div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs text-gray-500">
                Created: {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'N/A'}
              </span>
              <button
                onClick={() => console.log('View detailed campaign:', campaign.id)}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium"
              >
                View Details →
              </button>
            </div>
          </MobileCard>
        )}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => console.log('Navigate to detailed campaign view')}
        className="fixed bottom-6 right-6 text-white rounded-full p-4 shadow-lg transition-colors z-50 hover:shadow-xl"
        style={{ backgroundColor: '#8e44ad' }}
        title="View Detailed Campaign Analytics"
      >
        <BarChart3 className="h-6 w-6" />
      </button>
    </MobilePageLayout>
  )
}