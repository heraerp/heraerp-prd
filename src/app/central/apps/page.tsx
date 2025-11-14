
import React, { useEffect, useState } from 'react'
/**
 * ================================================================================
 * HERA CENTRAL: Apps & Modules Management
 * Smart Code: HERA.PLATFORM.CENTRAL.UI.APPS.REGISTRY.v1
 * ================================================================================
 * 
 * Application registry and marketplace interface providing:
 * - App definitions and marketplace
 * - Module management and dependencies
 * - Installation status across organizations
 * - Version control and updates
 * - App performance metrics
 * - Publishing and approval workflow
 * 
 * Second-layer navigation with app-focused workflows
 * ================================================================================
 */

'use client'

import { 
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  Eye,
  Settings,
  MoreVertical,
  ArrowUpRight,
  TrendingUp,
  Users,
  Zap,
  Shield,
  Code,
  Globe,
  Tag,
  GitBranch
} from 'lucide-react'
import { 
  dynamicPlatformDataService,
  type DynamicAppDefinition,
  type DynamicModuleDefinition 
} from '@/lib/central/dynamic-platform-data'

// =============================================================================
// TYPES FROM DYNAMIC DATA SERVICE
// =============================================================================

interface AppFilters {
  app_type: string
  industry: string
  status: string
  price_tier: string
  search: string
}

// Dynamic data will be loaded from the platform organization

const APP_TYPE_OPTIONS = [
  { value: '', label: 'All App Types' },
  { value: 'CORE', label: 'Core Applications' },
  { value: 'INDUSTRY', label: 'Industry Solutions' },
  { value: 'CUSTOM', label: 'Custom Applications' },
  { value: 'MARKETPLACE', label: 'Marketplace Apps' }
]

const INDUSTRY_OPTIONS = [
  { value: '', label: 'All Industries' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'SALON', label: 'Salon & Spa' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'AGRO', label: 'Agriculture' }
]

const PRICE_TIER_OPTIONS = [
  { value: '', label: 'All Price Tiers' },
  { value: 'FREE', label: 'Free' },
  { value: 'STARTER', label: 'Starter' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'ENTERPRISE', label: 'Enterprise' }
]

// =============================================================================
// COMPONENT FUNCTIONS
// =============================================================================

function AppCard({ app }: { app: DynamicAppDefinition }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'green'
      case 'draft': return 'gray'
      case 'review': return 'yellow'
      case 'deprecated': return 'red'
      default: return 'gray'
    }
  }

  const getPriceColor = (tier: string) => {
    switch (tier) {
      case 'FREE': return 'green'
      case 'STARTER': return 'blue'
      case 'PROFESSIONAL': return 'purple'
      case 'ENTERPRISE': return 'orange'
      default: return 'gray'
    }
  }

  const statusColor = getStatusColor(app.dynamic_data.status)
  const priceColor = getPriceColor(app.dynamic_data.price_tier)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-br from-${priceColor}-400 to-${priceColor}-600 rounded-lg flex items-center justify-center`}>
            <Package className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{app.entity_name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-slate-600">{app.dynamic_data.app_version}</span>
              <span className="text-slate-400">•</span>
              <span className="text-sm text-slate-600">{app.dynamic_data.industry}</span>
              <span className="text-slate-400">•</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                {app.dynamic_data.status.charAt(0).toUpperCase() + app.dynamic_data.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <div className="relative">
          <button className="p-2 text-slate-400 hover:text-slate-600 rounded-md">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4 line-clamp-2">{app.dynamic_data.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-slate-900">{app.install_count}</div>
          <div className="text-xs text-slate-600">Installs</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="text-lg font-bold text-slate-900">{app.rating.toFixed(1)}</span>
          </div>
          <div className="text-xs text-slate-600">Rating</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-900">{app.dynamic_data.size_mb.toFixed(1)}MB</div>
          <div className="text-xs text-slate-600">Size</div>
        </div>
        <div className="text-center">
          <div className={`text-lg font-bold text-${priceColor}-600`}>{app.dynamic_data.price_tier}</div>
          <div className="text-xs text-slate-600">License</div>
        </div>
      </div>

      {/* Features */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 font-medium mb-2">Key Features</div>
        <div className="flex flex-wrap gap-1">
          {app.dynamic_data.features.slice(0, 3).map((feature, index) => (
            <span key={index} className="px-2 py-1 bg-slate-100 text-xs text-slate-700 rounded">
              {feature}
            </span>
          ))}
          {app.dynamic_data.features.length > 3 && (
            <span className="px-2 py-1 bg-slate-100 text-xs text-slate-700 rounded">
              +{app.dynamic_data.features.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Dependencies */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 font-medium mb-2">Dependencies</div>
        <div className="flex flex-wrap gap-1">
          {app.dynamic_data.dependencies.slice(0, 2).map((dep, index) => (
            <span key={index} className="px-2 py-1 bg-blue-50 text-xs text-blue-700 rounded border border-blue-200">
              {dep}
            </span>
          ))}
          {app.dynamic_data.dependencies.length > 2 && (
            <span className="px-2 py-1 bg-blue-50 text-xs text-blue-700 rounded border border-blue-200">
              +{app.dynamic_data.dependencies.length - 2} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200">
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-200">
          <Download className="w-4 h-4" />
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-200">
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function ModuleCard({ module }: { module: DynamicModuleDefinition }) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'FOUNDATION': return 'blue'
      case 'BUSINESS': return 'green'
      case 'INTEGRATION': return 'purple'
      case 'ANALYTICS': return 'orange'
      default: return 'gray'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'beta': return Clock
      case 'deprecated': return AlertCircle
      default: return AlertCircle
    }
  }

  const categoryColor = getCategoryColor(module.dynamic_data.category)
  const StatusIcon = getStatusIcon(module.status)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 bg-gradient-to-br from-${categoryColor}-400 to-${categoryColor}-600 rounded-lg flex items-center justify-center`}>
            <Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-md font-semibold text-slate-900">{module.entity_name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-slate-600">{module.dynamic_data.module_version}</span>
              <StatusIcon className={`w-3 h-3 ${
                module.status === 'active' ? 'text-green-500' :
                module.status === 'beta' ? 'text-yellow-500' : 'text-red-500'
              }`} />
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium bg-${categoryColor}-100 text-${categoryColor}-800`}>
          {module.dynamic_data.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 mb-3 line-clamp-2">{module.dynamic_data.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900">{module.apps_using}</div>
          <div className="text-xs text-slate-500">Apps</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900">{module.orgs_installed}</div>
          <div className="text-xs text-slate-500">Orgs</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900">{module.dynamic_data.api_endpoints}</div>
          <div className="text-xs text-slate-500">APIs</div>
        </div>
      </div>

      {/* Dependencies */}
      {module.dynamic_data.dependencies.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-slate-500 font-medium mb-1">Dependencies</div>
          <div className="flex flex-wrap gap-1">
            {module.dynamic_data.dependencies.map((dep, index) => (
              <span key={index} className="px-1.5 py-0.5 bg-blue-50 text-xs text-blue-600 rounded border border-blue-200">
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{module.dynamic_data.size_mb.toFixed(1)}MB</span>
        <span>Updated {new Date(module.updated_at).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AppsPage() {
  const [apps, setApps] = useState<DynamicAppDefinition[]>([])
  const [modules, setModules] = useState<DynamicModuleDefinition[]>([])
  const [filteredApps, setFilteredApps] = useState<DynamicAppDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AppFilters>({
    app_type: '',
    industry: '',
    status: '',
    price_tier: '',
    search: ''
  })
  const [activeTab, setActiveTab] = useState<'apps' | 'modules'>('apps')
  const [showFilters, setShowFilters] = useState(false)

  // Load dynamic data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        console.log('[AppsPage] 🔄 Loading dynamic platform data...')
        
        const [appsData, modulesData] = await Promise.all([
          dynamicPlatformDataService.getAppDefinitions(),
          dynamicPlatformDataService.getModuleDefinitions()
        ])
        
        console.log(`[AppsPage] ✅ Loaded ${appsData.length} apps and ${modulesData.length} modules`)
        setApps(appsData)
        setModules(modulesData)
        setFilteredApps(appsData)
        
      } catch (error) {
        console.error('[AppsPage] ❌ Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = apps

    if (filters.search) {
      filtered = filtered.filter(app => 
        app.entity_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        app.dynamic_data.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        app.dynamic_data.publisher.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.app_type) {
      filtered = filtered.filter(app => app.dynamic_data.app_type === filters.app_type)
    }

    if (filters.industry) {
      filtered = filtered.filter(app => app.dynamic_data.industry === filters.industry)
    }

    if (filters.status) {
      filtered = filtered.filter(app => app.dynamic_data.status === filters.status)
    }

    if (filters.price_tier) {
      filtered = filtered.filter(app => app.dynamic_data.price_tier === filters.price_tier)
    }

    setFilteredApps(filtered)
  }, [filters, apps])

  const updateFilter = (key: keyof AppFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      app_type: '',
      industry: '',
      status: '',
      price_tier: '',
      search: ''
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Apps & Modules</h1>
          <p className="text-slate-600 mt-1">
            Manage applications and modules across the platform ({filteredApps.length} apps, {modules.length} modules)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700">
            <Upload className="w-4 h-4 mr-2" />
            Publish App
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create App
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{apps.length}</div>
              <div className="text-sm text-slate-600">Total Apps</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Code className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{modules.length}</div>
              <div className="text-sm text-slate-600">Active Modules</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Download className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">
                {apps.reduce((sum, app) => sum + app.install_count, 0)}
              </div>
              <div className="text-sm text-slate-600">Total Installs</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Star className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">
                {(apps.reduce((sum, app) => sum + app.rating, 0) / apps.length).toFixed(1)}
              </div>
              <div className="text-sm text-slate-600">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('apps')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'apps'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Applications</span>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {filteredApps.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('modules')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'modules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4" />
                <span>Modules</span>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {modules.length}
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {showFilters && activeTab === 'apps' && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.app_type}
                  onChange={(e) => updateFilter('app_type', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {APP_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <select
                  value={filters.industry}
                  onChange={(e) => updateFilter('industry', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {INDUSTRY_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <select
                  value={filters.price_tier}
                  onChange={(e) => updateFilter('price_tier', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PRICE_TIER_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-200"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'apps' ? (
        <div>
          {filteredApps.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredApps.map((app) => (
                <AppCard key={app.id} app={app} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No applications found</h3>
              <p className="text-slate-600 mb-6">
                {filters.search || filters.app_type || filters.industry || filters.price_tier
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first application.'
                }
              </p>
              <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Application
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          {modules.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {modules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <Code className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No modules found</h3>
              <p className="text-slate-600 mb-6">
                Modules will appear here once applications are installed.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}