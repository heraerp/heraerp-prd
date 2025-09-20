'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Truck,
  Globe,
  Plus,
  Settings,
  Activity,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  RefreshCw,
  Webhook,
  Key,
  MapPin,
  Zap,
  BarChart3,
  Users,
  Target,
  Star,
  Phone,
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'

// Steve Jobs Principle: "Innovation distinguishes between a leader and a follower."
// This delivery platform manager represents the future of restaurant integrations
// Updated: 2025-01-29 - Fixed modal visibility with proper white background

interface DeliveryPlatform {
  id: string
  name: string
  code: string
  status: 'active' | 'inactive' | 'configuring'
  created_at: string
  updated_at: string
  platform_type: string
  api_endpoint: string
  webhook_url: string
  api_key: string
  secret_key: string
  commission_rate: number
  delivery_fee: number
  minimum_order_value: number
  max_delivery_distance: number
  is_active: boolean
  auto_accept_orders: boolean
  sync_menu: boolean
  sync_inventory: boolean
  last_sync_at: string | null
  sync_status: 'not_configured' | 'configuring' | 'connected' | 'error'
  webhook_verified: boolean
  restaurant_id: string
  store_id: string
  delivery_zones: any[]
  stats?: {
    total_orders: number
    total_revenue: number
    pending_orders: number
    completed_orders: number
  }
}

interface DeliveryPlatformData {
  platforms: DeliveryPlatform[]
  stats: {
    total_platforms: number
    active_platforms: number
    configured_platforms: number
    total_today_orders: number
    total_today_revenue: number
  }
  supported_platforms: string[]
}

export function DeliveryPlatformManager() {
  const [platformData, setPlatformData] = useState<DeliveryPlatformData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPlatform, setEditingPlatform] = useState<DeliveryPlatform | null>(null)
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({})

  // Form state for adding/editing platforms
  const [formData, setFormData] = useState({
    name: '',
    platform_type: 'deliveroo',
    api_endpoint: '',
    webhook_url: '',
    api_key: '',
    secret_key: '',
    commission_rate: 0.15,
    delivery_fee: 0,
    minimum_order_value: 0,
    max_delivery_distance: 10,
    auto_accept_orders: false,
    sync_menu: true,
    sync_inventory: false,
    restaurant_id: '',
    store_id: '',
    description: ''
  })

  // Load delivery platforms data
  const loadPlatforms = async () => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('🚛 Loading delivery platforms...')
      const response = await fetch('/api/v1/delivery-platforms?include_stats=true')
      const result = await response.json()

      if (result.success) {
        setPlatformData(result.data)
        setLastUpdated(new Date())
        console.log(`✅ Loaded ${result.data.platforms.length} delivery platforms`)
      } else {
        throw new Error(result.message || 'Failed to load delivery platforms')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('❌ Delivery platforms error:', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh data every 60 seconds
  useEffect(() => {
    loadPlatforms()
    const interval = setInterval(loadPlatforms, 60000)
    return () => clearInterval(interval)
  }, [])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = editingPlatform ? 'PUT' : 'POST'
      const url = '/api/v1/delivery-platforms'
      const payload = editingPlatform ? { ...formData, id: editingPlatform.id } : formData

      console.log(`🚛 ${editingPlatform ? 'Updating' : 'Creating'} delivery platform...`)
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        console.log(`✅ Platform ${editingPlatform ? 'updated' : 'created'} successfully`)
        setShowAddForm(false)
        setEditingPlatform(null)
        resetForm()
        loadPlatforms()
      } else {
        throw new Error(result.message || 'Failed to save platform')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('❌ Save platform error:', errorMessage)
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      platform_type: 'deliveroo',
      api_endpoint: '',
      webhook_url: '',
      api_key: '',
      secret_key: '',
      commission_rate: 0.15,
      delivery_fee: 0,
      minimum_order_value: 0,
      max_delivery_distance: 10,
      auto_accept_orders: false,
      sync_menu: true,
      sync_inventory: false,
      restaurant_id: '',
      store_id: '',
      description: ''
    })
  }

  // Start editing platform
  const startEdit = (platform: DeliveryPlatform) => {
    setEditingPlatform(platform)
    setFormData({
      name: platform.name,
      platform_type: platform.platform_type,
      api_endpoint: platform.api_endpoint,
      webhook_url: platform.webhook_url,
      api_key: platform.api_key === '***HIDDEN***' ? '' : platform.api_key,
      secret_key: platform.secret_key === '***HIDDEN***' ? '' : platform.secret_key,
      commission_rate: platform.commission_rate,
      delivery_fee: platform.delivery_fee,
      minimum_order_value: platform.minimum_order_value,
      max_delivery_distance: platform.max_delivery_distance,
      auto_accept_orders: platform.auto_accept_orders,
      sync_menu: platform.sync_menu,
      sync_inventory: platform.sync_inventory,
      restaurant_id: platform.restaurant_id,
      store_id: platform.store_id,
      description: ''
    })
    setShowAddForm(true)
  }

  // Copy webhook URL to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      console.log('✅ Copied to clipboard')
    } catch (err) {
      console.error('❌ Failed to copy:', err)
    }
  }

  // Toggle secret visibility
  const toggleSecretVisibility = (platformId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }))
  }

  // Helper functions
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`
  const formatPercent = (rate: number) => `${(rate * 100).toFixed(1)}%`

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive':
        return 'bg-muted text-gray-200 border-border'
      case 'configuring':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default:
        return 'bg-muted text-gray-200 border-border'
    }
  }

  const getSyncStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'configuring':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-muted text-gray-200'
    }
  }

  const getPlatformIcon = (type: string) => {
    switch (type) {
      case 'deliveroo':
        return '🛵'
      case 'ubereats':
        return '🚗'
      case 'swiggy':
        return '🏍️'
      case 'zomato':
        return '🛺'
      case 'doordash':
        return '🚲'
      case 'grubhub':
        return '🚛'
      default:
        return '📱'
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">Loading delivery platforms...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !platformData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-100 mb-2">
            Unable to Load Delivery Platforms
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadPlatforms}
            className="px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </Card>
      </div>
    )
  }

  const { platforms, stats, supported_platforms } = platformData

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Delivery Platform Integration</h1>
          <p className="text-muted-foreground">
            Universal integration with delivery platforms powered by HERA's flexible architecture
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={loadPlatforms}
            className="flex items-center space-x-2 px-4 py-2 bg-muted text-gray-700 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Platform</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Platforms</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total_platforms}</p>
            </div>
            <Globe className="w-8 h-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Active</p>
              <p className="text-2xl font-bold text-green-900">{stats.active_platforms}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Configured</p>
              <p className="text-2xl font-bold text-purple-900">{stats.configured_platforms}</p>
            </div>
            <Settings className="w-8 h-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Today's Orders</p>
              <p className="text-2xl font-bold text-orange-900">{stats.total_today_orders}</p>
            </div>
            <Target className="w-8 h-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Today's Revenue</p>
              <p className="text-2xl font-bold text-yellow-900">
                {formatCurrency(stats.total_today_revenue)}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Platform List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-100">Connected Platforms</h3>
          <div className="text-sm text-muted-foreground">
            {platforms.length} of {supported_platforms.length} supported platforms
          </div>
        </div>

        {platforms.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              No Delivery Platforms Connected
            </h3>
            <p className="text-muted-foreground mb-6">
              Connect with delivery platforms like Deliveroo, Uber Eats, Swiggy to expand your reach
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 inline mr-2" />
              Connect Your First Platform
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {platforms.map(platform => (
              <Card key={platform.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getPlatformIcon(platform.platform_type)}</div>
                    <div>
                      <h4 className="font-semibold text-gray-100 flex items-center space-x-2">
                        <span>{platform.name}</span>
                        <Badge className={getStatusColor(platform.status)}>{platform.status}</Badge>
                      </h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {platform.platform_type}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => startEdit(platform)}
                    className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {/* Platform Stats */}
                {platform.stats && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Orders Today</p>
                      <p className="font-semibold text-gray-100">{platform.stats.total_orders}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="font-semibold text-gray-100">
                        {formatCurrency(platform.stats.total_revenue)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Configuration Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Sync Status</span>
                    <Badge className={getSyncStatusColor(platform.sync_status)}>
                      {platform.sync_status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Webhook</span>
                    <div className="flex items-center space-x-2">
                      {platform.webhook_verified ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="text-sm text-gray-100">
                        {platform.webhook_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Commission</span>
                    <span className="text-sm font-medium text-gray-100">
                      {formatPercent(platform.commission_rate)}
                    </span>
                  </div>

                  {platform.last_sync_at && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Sync</span>
                      <span className="text-sm text-gray-100">
                        {new Date(platform.last_sync_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Webhook URL */}
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Webhook URL</span>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/v1/delivery-platforms/${platform.id}/webhook`
                        )
                      }
                      className="p-1 text-muted-foreground hover:text-muted-foreground rounded"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs font-mono text-gray-700 bg-muted p-2 rounded mt-1 break-all">
                    {process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}
                    /api/v1/delivery-platforms/{platform.id}/webhook
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Add/Pencil Platform Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-background bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background text-gray-100 rounded-lg shadow-xl border border-border">
            <div className="p-6 bg-background">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-100">
                  {editingPlatform ? 'Pencil Platform' : 'Add New Delivery Platform'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingPlatform(null)
                    resetForm()
                  }}
                  className="p-2 text-muted-foreground hover:text-muted-foreground rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4 bg-muted p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-200">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="platform_name"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Platform Name *
                      </label>
                      <input
                        id="platform_name"
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                        placeholder="Mario's Deliveroo"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="platform_type"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Platform Type *
                      </label>
                      <select
                        id="platform_type"
                        value={formData.platform_type}
                        onChange={e => setFormData({ ...formData, platform_type: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                        required
                      >
                        {supported_platforms.map(platform => (
                          <option key={platform} value={platform}>
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* API Configuration */}
                <div className="space-y-4 bg-muted p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-200">API Configuration</h4>

                  <div>
                    <label
                      htmlFor="api_endpoint"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      API Endpoint *
                    </label>
                    <input
                      id="api_endpoint"
                      type="url"
                      value={formData.api_endpoint}
                      onChange={e => setFormData({ ...formData, api_endpoint: e.target.value })}
                      className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                      placeholder="https://api.deliveroo.com/v1/"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="api_key"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        API Key
                      </label>
                      <input
                        id="api_key"
                        type="text"
                        value={formData.api_key}
                        onChange={e => setFormData({ ...formData, api_key: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                        placeholder="Your API key"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="secret_key"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Secret Key
                      </label>
                      <input
                        id="secret_key"
                        type="password"
                        value={formData.secret_key}
                        onChange={e => setFormData({ ...formData, secret_key: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                        placeholder="Your secret key"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="restaurant_id"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Restaurant ID
                      </label>
                      <input
                        id="restaurant_id"
                        type="text"
                        value={formData.restaurant_id}
                        onChange={e => setFormData({ ...formData, restaurant_id: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                        placeholder="Platform restaurant ID"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="store_id"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Store ID
                      </label>
                      <input
                        id="store_id"
                        type="text"
                        value={formData.store_id}
                        onChange={e => setFormData({ ...formData, store_id: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                        placeholder="Platform store ID"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Configuration */}
                <div className="space-y-4 bg-muted p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-200">Business Configuration</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="commission_rate"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Commission Rate (%)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                          id="commission_rate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={formData.commission_rate}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              commission_rate: parseFloat(e.target.value) || 0
                            })
                          }
                          className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                          placeholder="0.15"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="delivery_fee"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Delivery Fee ($)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                          id="delivery_fee"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.delivery_fee}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              delivery_fee: parseFloat(e.target.value) || 0
                            })
                          }
                          className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                          placeholder="2.99"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="minimum_order"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Minimum Order Value ($)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                          id="minimum_order"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.minimum_order_value}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              minimum_order_value: parseFloat(e.target.value) || 0
                            })
                          }
                          className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                          placeholder="15.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="max_distance"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Max Delivery Distance (km)
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                          id="max_distance"
                          type="number"
                          step="0.1"
                          min="0"
                          value={formData.max_delivery_distance}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              max_delivery_distance: parseFloat(e.target.value) || 0
                            })
                          }
                          className="w-full pl-10 pr-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-gray-100"
                          placeholder="10.0"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operational Settings */}
                <div className="space-y-4 bg-muted p-4 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-200">Operational Settings</h4>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.auto_accept_orders}
                        onChange={e =>
                          setFormData({ ...formData, auto_accept_orders: e.target.checked })
                        }
                        className="w-4 h-4 text-primary border-border rounded focus:ring-blue-500 bg-background"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Auto-accept incoming orders
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sync_menu}
                        onChange={e => setFormData({ ...formData, sync_menu: e.target.checked })}
                        className="w-4 h-4 text-primary border-border rounded focus:ring-blue-500 bg-background"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Sync menu items with platform
                      </span>
                    </label>

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sync_inventory}
                        onChange={e =>
                          setFormData({ ...formData, sync_inventory: e.target.checked })
                        }
                        className="w-4 h-4 text-primary border-border rounded focus:ring-blue-500 bg-background"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Sync inventory levels
                      </span>
                    </label>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingPlatform(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-700 bg-muted rounded-lg hover:bg-gray-700 transition-colors border border-border"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-foreground rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <span>{editingPlatform ? 'Update Platform' : 'Add Platform'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* HERA Architecture Attribution */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Universal Delivery Platform Integration
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            HERA's universal architecture enables seamless integration with any delivery platform
            without custom development:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700">
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>Universal Entities</strong>
              <br />
              Each platform stored as flexible entity with unlimited custom properties
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>Webhook Architecture</strong>
              <br />
              Universal webhook handler transforms any platform order format to HERA transactions
            </div>
            <div className="bg-background/50 p-3 rounded-lg">
              <strong>Steve Jobs Philosophy</strong>
              <br />
              "Innovation distinguishes between a leader and a follower" - leading integration
              design
            </div>
          </div>
          <p className="text-xs text-primary mt-4">
            Same integration pattern works for e-commerce platforms, payment gateways, and
            third-party services
          </p>
        </div>
      </Card>
    </div>
  )
}
