'use client'

/**
 * MCA Deliveries - Multi-Channel Delivery Monitor
 * Mobile-First Enterprise Page for Campaign Delivery Monitoring
 * 
 * Module: MCA
 * Entity: DELIVERY_LOG
 * Smart Code: HERA.CRM.MCA.ENTITY.DELIVERY.V1
 * Path: /crm/mca/deliveries
 * Description: Real-time delivery monitoring across all channels with status tracking and retry logic
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
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  Filter,
  Mail,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Smartphone,
  Trash2,
  TrendingUp,
  Upload,
  X,
  XCircle
} from 'lucide-react'

/**
 * Delivery Entity Interface
 * Extends TableRecord for HERA compliance
 */
interface Delivery extends TableRecord {
  id: string
  entity_id?: string
  entity_name: string
  smart_code: string
  status?: string
  
  // Dynamic fields (stored in core_dynamic_data)
  campaign_id?: string
  contact_id?: string
  channel_type?: string
  message_status?: string
  sent_at?: string
  delivered_at?: string
  error_message?: string
  retry_count?: string
  
  // System fields
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

/**
 * HERA Delivery Smart Codes
 */
const DELIVERY_SMART_CODES = {
  ENTITY: 'HERA.CRM.MCA.ENTITY.DELIVERY.V1',
  FIELD_CAMPAIGN_ID: 'HERA.CRM.MCA.DYN.DELIVERY.V1.CAMPAIGN_ID.V1',
  FIELD_CONTACT_ID: 'HERA.CRM.MCA.DYN.DELIVERY.V1.CONTACT_ID.V1',
  FIELD_CHANNEL_TYPE: 'HERA.CRM.MCA.DYN.DELIVERY.V1.CHANNEL_TYPE.V1',
  FIELD_MESSAGE_STATUS: 'HERA.CRM.MCA.DYN.DELIVERY.V1.MESSAGE_STATUS.V1',
  FIELD_SENT_AT: 'HERA.CRM.MCA.DYN.DELIVERY.V1.SENT_AT.V1',
  FIELD_DELIVERED_AT: 'HERA.CRM.MCA.DYN.DELIVERY.V1.DELIVERED_AT.V1',
  FIELD_ERROR_MESSAGE: 'HERA.CRM.MCA.DYN.DELIVERY.V1.ERROR_MESSAGE.V1',
  FIELD_RETRY_COUNT: 'HERA.CRM.MCA.DYN.DELIVERY.V1.RETRY_COUNT.V1',
  
  // Event smart codes for audit trail
  EVENT_CREATED: 'HERA.CRM.MCA.EVENT.DELIVERY.V1.CREATED.V1',
  EVENT_UPDATED: 'HERA.CRM.MCA.EVENT.DELIVERY.V1.UPDATED.V1',
  EVENT_DELETED: 'HERA.CRM.MCA.EVENT.DELIVERY.V1.DELETED.V1'
} as const

/**
 * Deliveries Main Page Component
 * Real-time delivery monitoring with channel-specific insights
 */
export default function DeliveriesPage() {
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [selectedDeliveries, setSelectedDeliveries] = useState<(string | number)[]>([])
  const [filters, setFilters] = useState({
    search: '',
    channel_type: '',
    message_status: '',
    campaign_id: ''
  })

  // Mock data for deliveries (in production, this would use useUniversalEntity with real-time updates)
  const deliveries: Delivery[] = [
    {
      id: '1',
      entity_id: '1',
      entity_name: 'Welcome Email - John Doe',
      smart_code: 'HERA.CRM.MCA.ENTITY.DELIVERY.V1',
      campaign_id: 'welcome_001',
      contact_id: 'contact_123',
      channel_type: 'email',
      message_status: 'delivered',
      sent_at: '2024-10-14T10:30:00Z',
      delivered_at: '2024-10-14T10:32:15Z',
      retry_count: '0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      entity_id: '2',
      entity_name: 'Cart Reminder SMS - Jane Smith',
      smart_code: 'HERA.CRM.MCA.ENTITY.DELIVERY.V1',
      campaign_id: 'cart_reminder_001',
      contact_id: 'contact_456',
      channel_type: 'sms',
      message_status: 'failed',
      sent_at: '2024-10-14T10:25:00Z',
      error_message: 'Invalid phone number format',
      retry_count: '2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      entity_id: '3',
      entity_name: 'Promo Push - Mike Johnson',
      smart_code: 'HERA.CRM.MCA.ENTITY.DELIVERY.V1',
      campaign_id: 'promo_push_001',
      contact_id: 'contact_789',
      channel_type: 'push',
      message_status: 'pending',
      sent_at: '2024-10-14T10:35:00Z',
      retry_count: '0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]

  // Enhanced KPI calculations
  const kpis = [
    {
      title: 'Messages Sent Today',
      value: deliveries.length.toString(),
      change: '+45.2%',
      trend: 'up' as const,
      icon: Send
    },
    {
      title: 'Delivery Rate',
      value: `${((deliveries.filter(d => d.message_status === 'delivered').length / deliveries.length) * 100).toFixed(1)}%`,
      change: '+2.1%',
      trend: 'up' as const,
      icon: CheckCircle
    },
    {
      title: 'Failed Deliveries',
      value: deliveries.filter(d => d.message_status === 'failed').length.toString(),
      change: '-8.3%',
      trend: 'down' as const,
      icon: XCircle
    }
  ]

  // Enhanced table columns
  const columns: TableColumn[] = [
    { key: 'entity_name', label: 'Delivery', sortable: true },
    { key: 'channel_type', label: 'Channel', sortable: true },
    { key: 'message_status', label: 'Status', sortable: true },
    { key: 'sent_at', label: 'Sent', sortable: true },
    { key: 'delivered_at', label: 'Delivered', sortable: true },
    { key: 'retry_count', label: 'Retries', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  // Enhanced filter fields
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Search Deliveries', type: 'search' },
    { key: 'channel_type', label: 'Channel', type: 'select', options: [
      { value: '', label: 'All Channels' },
      { value: 'email', label: 'Email' },
      { value: 'sms', label: 'SMS' },
      { value: 'push', label: 'Push Notification' },
      { value: 'whatsapp', label: 'WhatsApp' }
    ]},
    { key: 'message_status', label: 'Status', type: 'select', options: [
      { value: '', label: 'All Status' },
      { value: 'pending', label: 'Pending' },
      { value: 'sent', label: 'Sent' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'failed', label: 'Failed' },
      { value: 'bounced', label: 'Bounced' }
    ]}
  ]

  // Helper function to get channel icon
  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'sms': return <MessageSquare className="h-4 w-4" />
      case 'push': return <Smartphone className="h-4 w-4" />
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />
      default: return <Send className="h-4 w-4" />
    }
  }

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100'
      case 'sent': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      case 'bounced': return 'text-orange-600 bg-orange-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Enterprise security checks
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p>Please log in to access Delivery Monitor.</p>
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
      title="Delivery Monitor"
      subtitle={`${deliveries.length} deliveries tracked in real-time`}
      primaryColor="#e67e22"
      accentColor="#d35400"
      showBackButton={false}
    >
      {/* Enterprise KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <MobileCard key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{kpi.title}</p>
                <p className="text-2xl font-bold" style={{ color: '#e67e22' }}>{kpi.value}</p>
                <p className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                  {kpi.change}
                </p>
              </div>
              <kpi.icon className="h-8 w-8 text-gray-400" />
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

      {/* Real-time refresh indicator */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Live monitoring active</span>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Enterprise Data Table */}
      <MobileDataTable
        data={deliveries}
        columns={columns}
        selectedRows={selectedDeliveries}
        onRowSelect={setSelectedDeliveries}
        showBulkActions={selectedDeliveries.length > 0}
        bulkActions={[
          {
            label: 'Retry Failed',
            action: async () => {
              console.log('Retrying failed deliveries:', selectedDeliveries)
              setSelectedDeliveries([])
            },
            variant: 'default'
          }
        ]}
        mobileCardRender={(delivery) => (
          <MobileCard key={delivery.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  {getChannelIcon(delivery.channel_type || '')}
                  <h3 className="font-semibold text-lg">{delivery.entity_name}</h3>
                </div>
                <p className="text-sm text-gray-600">Campaign: {delivery.campaign_id}</p>
              </div>
              <div className="flex flex-col items-end space-y-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.message_status || '')}`}>
                  {delivery.message_status}
                </span>
                {delivery.retry_count && parseInt(delivery.retry_count) > 0 && (
                  <span className="text-xs text-orange-600">
                    Retries: {delivery.retry_count}
                  </span>
                )}
              </div>
            </div>
            
            {/* Delivery timeline */}
            <div className="space-y-2 text-sm">
              {delivery.sent_at && (
                <div className="flex items-center space-x-2">
                  <Send className="h-3 w-3 text-blue-500" />
                  <span className="text-gray-600">Sent:</span>
                  <span>{new Date(delivery.sent_at).toLocaleString()}</span>
                </div>
              )}
              {delivery.delivered_at && (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-gray-600">Delivered:</span>
                  <span>{new Date(delivery.delivered_at).toLocaleString()}</span>
                </div>
              )}
              {delivery.error_message && (
                <div className="flex items-start space-x-2">
                  <XCircle className="h-3 w-3 text-red-500 mt-0.5" />
                  <div>
                    <span className="text-gray-600">Error:</span>
                    <p className="text-red-600 text-xs mt-1">{delivery.error_message}</p>
                  </div>
                </div>
              )}
            </div>
            
            {delivery.message_status === 'failed' && (
              <div className="mt-3 pt-3 border-t">
                <button
                  onClick={() => console.log('Retry delivery:', delivery.id)}
                  className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Retry Delivery</span>
                </button>
              </div>
            )}
          </MobileCard>
        )}
      />

      {/* Channel Performance Chart */}
      <MobileCard className="mt-6 p-6">
        <h3 className="text-lg font-semibold mb-4">Channel Performance</h3>
        <div className="space-y-4">
          {['email', 'sms', 'push', 'whatsapp'].map(channel => {
            const channelDeliveries = deliveries.filter(d => d.channel_type === channel)
            const deliveryRate = channelDeliveries.length > 0 
              ? (channelDeliveries.filter(d => d.message_status === 'delivered').length / channelDeliveries.length) * 100 
              : 0
            
            return (
              <div key={channel} className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 w-20">
                  {getChannelIcon(channel)}
                  <span className="text-sm capitalize">{channel}</span>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${deliveryRate}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium w-12 text-right">{deliveryRate.toFixed(0)}%</span>
              </div>
            )
          })}
        </div>
      </MobileCard>
    </MobilePageLayout>
  )
}