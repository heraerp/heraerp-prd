'use client'

/**
 * MCA Channel Provider Settings
 * Mobile-First Enterprise Page for Channel Adapter Management & Monitoring
 * 
 * Module: MCA
 * Entity: PROVIDER_CONFIG
 * Smart Code: HERA.CRM.MCA.PAGE.PROVIDER_SETTINGS.V1
 * Path: /crm/mca/settings/providers
 * Description: Email, SMS, WhatsApp, and Push adapter configuration with health monitoring
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
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  EyeOff,
  Filter,
  Key,
  Mail,
  MessageSquare,
  MoreVertical,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Smartphone,
  Trash2,
  TrendingUp,
  Upload,
  Wifi,
  X,
  Zap
} from 'lucide-react'

/**
 * Provider Config Entity Interface
 * Extends TableRecord for HERA compliance
 */
interface ProviderConfig extends TableRecord {
  id: string
  entity_id?: string
  entity_name: string
  smart_code: string
  status?: string
  
  // Dynamic fields (stored in core_dynamic_data)
  provider_name?: string
  provider_type?: string
  api_key?: string
  rate_limit?: string
  health_status?: string
  last_checked?: string
  success_rate?: number
  avg_latency?: number
  error_rate?: number
  
  // System fields
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

/**
 * HERA Provider Settings Smart Codes
 */
const PROVIDER_SMART_CODES = {
  PAGE: 'HERA.CRM.MCA.PAGE.PROVIDER_SETTINGS.V1',
  ENTITY: 'HERA.CRM.MCA.ENTITY.PROVIDER_CONFIG.V1',
  FIELD_PROVIDER_NAME: 'HERA.CRM.MCA.DYN.PROVIDER_CONFIG.V1.PROVIDER_NAME.V1',
  FIELD_PROVIDER_TYPE: 'HERA.CRM.MCA.DYN.PROVIDER_CONFIG.V1.PROVIDER_TYPE.V1',
  FIELD_API_KEY: 'HERA.CRM.MCA.DYN.PROVIDER_CONFIG.V1.API_KEY.V1',
  FIELD_RATE_LIMIT: 'HERA.CRM.MCA.DYN.PROVIDER_CONFIG.V1.RATE_LIMIT.V1',
  FIELD_HEALTH_STATUS: 'HERA.CRM.MCA.DYN.PROVIDER_CONFIG.V1.HEALTH_STATUS.V1',
  
  // Event smart codes for audit trail
  EVENT_CREATED: 'HERA.CRM.MCA.EVENT.PROVIDER_CONFIG.V1.CREATED.V1',
  EVENT_UPDATED: 'HERA.CRM.MCA.EVENT.PROVIDER_CONFIG.V1.UPDATED.V1',
  EVENT_HEALTH_CHECK: 'HERA.CRM.MCA.EVENT.PROVIDER_CONFIG.V1.HEALTH_CHECK.V1'
} as const

/**
 * Provider Settings Main Page Component
 * Enterprise-grade provider management with health monitoring
 */
export default function ProviderSettingsPage() {
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [selectedProviders, setSelectedProviders] = useState<(string | number)[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [currentProvider, setCurrentProvider] = useState<ProviderConfig | null>(null)
  const [filters, setFilters] = useState({
    provider_type: '',
    status: '',
    health_status: ''
  })

  // Mock provider configuration data (in production, this would use useUniversalEntity)
  const providers: ProviderConfig[] = [
    {
      id: '1',
      entity_id: '1',
      entity_name: 'SendGrid Email Provider',
      smart_code: 'HERA.CRM.MCA.ENTITY.PROVIDER_CONFIG.V1',
      provider_name: 'SendGrid',
      provider_type: 'email',
      api_key: 'sg-***************abc123',
      rate_limit: '1000/hour',
      health_status: 'healthy',
      last_checked: new Date().toISOString(),
      success_rate: 98.7,
      avg_latency: 245,
      error_rate: 1.3,
      status: 'active',
      created_at: '2024-09-15T00:00:00Z'
    },
    {
      id: '2',
      entity_id: '2',
      entity_name: 'Twilio SMS Provider',
      smart_code: 'HERA.CRM.MCA.ENTITY.PROVIDER_CONFIG.V1',
      provider_name: 'Twilio',
      provider_type: 'sms',
      api_key: 'tw-***************xyz789',
      rate_limit: '500/hour',
      health_status: 'healthy',
      last_checked: new Date(Date.now() - 300000).toISOString(),
      success_rate: 97.2,
      avg_latency: 1200,
      error_rate: 2.8,
      status: 'active',
      created_at: '2024-09-20T00:00:00Z'
    },
    {
      id: '3',
      entity_id: '3',
      entity_name: 'WhatsApp Business API',
      smart_code: 'HERA.CRM.MCA.ENTITY.PROVIDER_CONFIG.V1',
      provider_name: 'Meta WhatsApp',
      provider_type: 'whatsapp',
      api_key: 'wa-***************def456',
      rate_limit: '100/hour',
      health_status: 'warning',
      last_checked: new Date(Date.now() - 600000).toISOString(),
      success_rate: 94.1,
      avg_latency: 890,
      error_rate: 5.9,
      status: 'active',
      created_at: '2024-10-01T00:00:00Z'
    },
    {
      id: '4',
      entity_id: '4',
      entity_name: 'Firebase Push Service',
      smart_code: 'HERA.CRM.MCA.ENTITY.PROVIDER_CONFIG.V1',
      provider_name: 'Firebase',
      provider_type: 'push',
      api_key: 'fb-***************ghi789',
      rate_limit: '2000/hour',
      health_status: 'error',
      last_checked: new Date(Date.now() - 1800000).toISOString(),
      success_rate: 89.3,
      avg_latency: 560,
      error_rate: 10.7,
      status: 'inactive',
      created_at: '2024-09-25T00:00:00Z'
    }
  ]

  // Calculate aggregate KPIs
  const activeProviders = providers.filter(p => p.status === 'active').length
  const avgLatency = providers.reduce((sum, p) => sum + (p.avg_latency || 0), 0) / providers.length
  const avgSuccessRate = providers.reduce((sum, p) => sum + (p.success_rate || 0), 0) / providers.length
  const avgErrorRate = providers.reduce((sum, p) => sum + (p.error_rate || 0), 0) / providers.length

  const kpis = [
    {
      title: 'Active Providers',
      value: activeProviders.toString(),
      change: '+1',
      trend: 'up' as const,
      icon: CheckCircle
    },
    {
      title: 'Average Latency',
      value: `${Math.round(avgLatency)}ms`,
      change: '-15ms',
      trend: 'up' as const,
      icon: Zap
    },
    {
      title: 'Success Rate',
      value: `${avgSuccessRate.toFixed(1)}%`,
      change: '+0.5%',
      trend: 'up' as const,
      icon: Activity
    },
    {
      title: 'Error Rate',
      value: `${avgErrorRate.toFixed(1)}%`,
      change: '-0.3%',
      trend: 'down' as const,
      icon: AlertTriangle
    }
  ]

  // Enhanced table columns
  const columns: TableColumn[] = [
    { key: 'provider_name', label: 'Provider Name', sortable: true },
    { key: 'provider_type', label: 'Type', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'api_key', label: 'API Key', sortable: false },
    { key: 'rate_limit', label: 'Rate Limit', sortable: true },
    { key: 'health_status', label: 'Health', sortable: true },
    { key: 'last_checked', label: 'Last Checked', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  // Enhanced filter fields
  const filterFields: FilterField[] = [
    { key: 'provider_type', label: 'Provider Type', type: 'select', options: [
      { value: '', label: 'All Types' },
      { value: 'email', label: 'Email' },
      { value: 'sms', label: 'SMS' },
      { value: 'whatsapp', label: 'WhatsApp' },
      { value: 'push', label: 'Push Notification' }
    ]},
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]},
    { key: 'health_status', label: 'Health', type: 'select', options: [
      { value: '', label: 'All Health Status' },
      { value: 'healthy', label: 'Healthy' },
      { value: 'warning', label: 'Warning' },
      { value: 'error', label: 'Error' }
    ]}
  ]

  // Helper functions
  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-5 w-5" />
      case 'sms': return <MessageSquare className="h-5 w-5" />
      case 'whatsapp': return <MessageSquare className="h-5 w-5" />
      case 'push': return <Smartphone className="h-5 w-5" />
      default: return <Settings className="h-5 w-5" />
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'inactive': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const maskApiKey = (key: string) => {
    if (!key) return 'Not configured'
    const parts = key.split('-')
    if (parts.length >= 2) {
      return `${parts[0]}-***************${parts[parts.length - 1].slice(-6)}`
    }
    return key.slice(0, 6) + '***************' + key.slice(-6)
  }

  // Handler functions
  const handleTestConnection = async (providerId: string) => {
    console.log('Testing connection for provider:', providerId)
    // In production, this would call the actual provider health check API
  }

  const handleRotateKey = async (provider: ProviderConfig) => {
    setCurrentProvider(provider)
    setShowKeyModal(true)
  }

  const handleToggleStatus = async (providerId: string) => {
    console.log('Toggling status for provider:', providerId)
    // In production, this would update the provider status
  }

  // Enterprise security checks
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p>Please log in to access Provider Settings.</p>
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
      title="Provider Settings"
      subtitle={`${providers.length} channel adapters configured`}
      primaryColor="#34495e"
      accentColor="#2c3e50"
      showBackButton={true}
    >
      {/* Enterprise KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <MobileCard key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <kpi.icon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">{kpi.title}</p>
              <p className="text-xl font-bold" style={{ color: '#34495e' }}>{kpi.value}</p>
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

      {/* Message Success Rate Chart */}
      <MobileCard className="mb-6 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Message Success Rate by Provider</h3>
          <Activity className="h-5 w-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {providers.map((provider, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  {getProviderIcon(provider.provider_type || '')}
                </div>
                <div>
                  <div className="font-medium">{provider.provider_name}</div>
                  <div className="text-sm text-gray-500">{provider.provider_type}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${provider.success_rate! >= 95 ? 'bg-green-500' : provider.success_rate! >= 90 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${provider.success_rate}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium w-12 text-right">{provider.success_rate}%</span>
              </div>
            </div>
          ))}
        </div>
      </MobileCard>

      {/* Provider Configuration Table */}
      <MobileDataTable
        data={providers}
        columns={columns}
        selectedRows={selectedProviders}
        onRowSelect={setSelectedProviders}
        showBulkActions={selectedProviders.length > 0}
        bulkActions={[
          {
            label: 'Test All Connections',
            action: async () => {
              console.log('Testing connections for providers:', selectedProviders)
              setSelectedProviders([])
            },
            variant: 'default'
          }
        ]}
        mobileCardRender={(provider) => (
          <MobileCard key={provider.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-gray-100">
                  {getProviderIcon(provider.provider_type || '')}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{provider.provider_name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{provider.provider_type} Provider</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(provider.status || '')}`}>
                  {provider.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(provider.health_status || '')}`}>
                  {provider.health_status}
                </span>
              </div>
            </div>
            
            {/* Provider details */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">API Key:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs">{maskApiKey(provider.api_key || '')}</span>
                  <button
                    onClick={() => handleRotateKey(provider)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Rotate API Key"
                  >
                    <Key className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rate Limit:</span>
                <span className="font-medium">{provider.rate_limit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Success Rate:</span>
                <span className={`font-medium ${provider.success_rate! >= 95 ? 'text-green-600' : provider.success_rate! >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {provider.success_rate}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg Latency:</span>
                <span className="font-medium">{provider.avg_latency}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Checked:</span>
                <span className="text-xs">
                  {provider.last_checked ? new Date(provider.last_checked).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-3 border-t">
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTestConnection(provider.id)}
                  className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  <Wifi className="h-3 w-3" />
                  <span>Test</span>
                </button>
                <button
                  onClick={() => handleToggleStatus(provider.id)}
                  className={`flex items-center space-x-1 px-3 py-1 text-xs rounded-md ${
                    provider.status === 'active' 
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {provider.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  <span>{provider.status === 'active' ? 'Pause' : 'Activate'}</span>
                </button>
              </div>
              <span className="text-xs text-gray-500">
                Added: {provider.created_at ? new Date(provider.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </MobileCard>
        )}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 text-white rounded-full p-4 shadow-lg transition-colors z-50 hover:shadow-xl"
        style={{ backgroundColor: '#34495e' }}
        title="Add New Provider Adapter"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add Provider Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Add New Provider Adapter</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Provider Configuration Wizard</p>
              <p className="text-sm text-gray-500 mb-6">Set up Email, SMS, WhatsApp, or Push notification providers with guided configuration, API key validation, and health check setup.</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: 'email', icon: <Mail className="h-6 w-6" />, name: 'Email Provider' },
                  { type: 'sms', icon: <MessageSquare className="h-6 w-6" />, name: 'SMS Provider' },
                  { type: 'whatsapp', icon: <MessageSquare className="h-6 w-6" />, name: 'WhatsApp API' },
                  { type: 'push', icon: <Smartphone className="h-6 w-6" />, name: 'Push Service' }
                ].map((providerType, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      console.log('Configure', providerType.type, 'provider')
                      setShowAddModal(false)
                    }}
                    className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    {providerType.icon}
                    <span className="mt-2 text-sm font-medium">{providerType.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Key Rotation Modal */}
      {showKeyModal && currentProvider && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Rotate API Key</h3>
              <button onClick={() => setShowKeyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="text-center py-4">
              <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Generate a new API key for {currentProvider.provider_name}?</p>
              <p className="text-sm text-gray-500 mb-6">This will invalidate the current key immediately. Update your application configuration before confirming.</p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Rotating API key for:', currentProvider.id)
                    setShowKeyModal(false)
                    setCurrentProvider(null)
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Rotate Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MobilePageLayout>
  )
}