
import React, { useEffect, useState } from 'react'
/**
 * ================================================================================
 * HERA CENTRAL: Organizations Management
 * Smart Code: HERA.PLATFORM.CENTRAL.UI.ORGS.LIST.v1
 * ================================================================================
 * 
 * Organization management interface providing:
 * - List of all tenant organizations
 * - Organization provisioning wizard
 * - Health status and metrics per organization
 * - Quick actions (apps, policies, users)
 * - Search and filtering capabilities
 * - One-click organization creation
 * 
 * Second-layer navigation with organization-focused workflows
 * ================================================================================
 */

'use client'

import { 
  Building2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Users,
  Package,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Settings,
  TrendingUp,
  DollarSign,
  Calendar
} from 'lucide-react'

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

interface Organization {
  id: string
  name: string
  industry: string
  region: string
  license_tier: string
  status: 'active' | 'inactive' | 'suspended'
  created_date: string
  last_active: string
  apps_count: number
  users_count: number
  monthly_revenue: number
  health_score: number
  admin_email: string
  compliance_status: 'compliant' | 'warning' | 'non_compliant'
}

interface OrganizationFilters {
  industry: string
  region: string
  license_tier: string
  status: string
  search: string
}

// =============================================================================
// MOCK DATA (In production, this would come from API)
// =============================================================================

const SAMPLE_ORGANIZATIONS: Organization[] = [
  {
    id: '1',
    name: 'Matrix IT World',
    industry: 'RETAIL',
    region: 'GCC',
    license_tier: 'PROFESSIONAL',
    status: 'active',
    created_date: '2024-01-15',
    last_active: '2 minutes ago',
    apps_count: 5,
    users_count: 24,
    monthly_revenue: 2840,
    health_score: 98,
    admin_email: 'admin@matrixitworld.com',
    compliance_status: 'compliant'
  },
  {
    id: '2',
    name: 'Luxe Beauty Salon',
    industry: 'SALON',
    region: 'GCC',
    license_tier: 'STARTER',
    status: 'active',
    created_date: '2024-02-03',
    last_active: '1 hour ago',
    apps_count: 3,
    users_count: 8,
    monthly_revenue: 890,
    health_score: 95,
    admin_email: 'manager@luxebeauty.ae',
    compliance_status: 'compliant'
  },
  {
    id: '3',
    name: 'GreenTech Manufacturing',
    industry: 'MANUFACTURING',
    region: 'EU',
    license_tier: 'ENTERPRISE',
    status: 'active',
    created_date: '2024-01-08',
    last_active: '15 minutes ago',
    apps_count: 8,
    users_count: 156,
    monthly_revenue: 12450,
    health_score: 92,
    admin_email: 'it@greentech-mfg.eu',
    compliance_status: 'warning'
  },
  {
    id: '4',
    name: 'Golden Harvest Farms',
    industry: 'AGRO',
    region: 'INDIA',
    license_tier: 'PROFESSIONAL',
    status: 'inactive',
    created_date: '2024-03-12',
    last_active: '3 days ago',
    apps_count: 4,
    users_count: 12,
    monthly_revenue: 1240,
    health_score: 78,
    admin_email: 'admin@goldenharvest.in',
    compliance_status: 'non_compliant'
  }
]

const INDUSTRY_OPTIONS = [
  { value: '', label: 'All Industries' },
  { value: 'RETAIL', label: 'Retail' },
  { value: 'SALON', label: 'Salon & Spa' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'AGRO', label: 'Agriculture' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'TECHNOLOGY', label: 'Technology' }
]

const REGION_OPTIONS = [
  { value: '', label: 'All Regions' },
  { value: 'GCC', label: 'GCC' },
  { value: 'EU', label: 'Europe' },
  { value: 'US', label: 'United States' },
  { value: 'INDIA', label: 'India' },
  { value: 'ASIA', label: 'Asia Pacific' }
]

const LICENSE_OPTIONS = [
  { value: '', label: 'All License Tiers' },
  { value: 'STARTER', label: 'Starter' },
  { value: 'PROFESSIONAL', label: 'Professional' },
  { value: 'ENTERPRISE', label: 'Enterprise' }
]

// =============================================================================
// COMPONENT FUNCTIONS
// =============================================================================

function OrganizationCard({ org }: { org: Organization }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'gray'
      case 'suspended': return 'red'
      default: return 'gray'
    }
  }

  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case 'compliant': return 'green'
      case 'warning': return 'yellow'
      case 'non_compliant': return 'red'
      default: return 'gray'
    }
  }

  const statusColor = getStatusColor(org.status)
  const complianceColor = getComplianceColor(org.compliance_status)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{org.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-slate-600">{org.industry}</span>
              <span className="text-slate-400">•</span>
              <span className="text-sm text-slate-600">{org.region}</span>
              <span className="text-slate-400">•</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
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

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{org.apps_count}</div>
          <div className="text-xs text-slate-600">Apps</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{org.users_count}</div>
          <div className="text-xs text-slate-600">Users</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">${(org.monthly_revenue / 1000).toFixed(1)}K</div>
          <div className="text-xs text-slate-600">Monthly</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${org.health_score >= 95 ? 'text-green-600' : org.health_score >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
            {org.health_score}%
          </div>
          <div className="text-xs text-slate-600">Health</div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full bg-${complianceColor}-500`}></div>
            <span className="text-xs text-slate-600 capitalize">
              {org.compliance_status.replace('_', ' ')}
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Last active: {org.last_active}
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {org.license_tier}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200">
          <ExternalLink className="w-4 h-4 mr-2" />
          Access
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-200">
          <Settings className="w-4 h-4" />
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors duration-200">
          <Activity className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>(SAMPLE_ORGANIZATIONS)
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>(SAMPLE_ORGANIZATIONS)
  const [filters, setFilters] = useState<OrganizationFilters>({
    industry: '',
    region: '',
    license_tier: '',
    status: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // Apply filters
  useEffect(() => {
    let filtered = organizations

    if (filters.search) {
      filtered = filtered.filter(org => 
        org.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        org.admin_email.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.industry) {
      filtered = filtered.filter(org => org.industry === filters.industry)
    }

    if (filters.region) {
      filtered = filtered.filter(org => org.region === filters.region)
    }

    if (filters.license_tier) {
      filtered = filtered.filter(org => org.license_tier === filters.license_tier)
    }

    if (filters.status) {
      filtered = filtered.filter(org => org.status === filters.status)
    }

    setFilteredOrgs(filtered)
  }, [filters, organizations])

  const updateFilter = (key: keyof OrganizationFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      industry: '',
      region: '',
      license_tier: '',
      status: '',
      search: ''
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
          <p className="text-slate-600 mt-1">
            Manage and monitor all tenant organizations ({filteredOrgs.length} of {organizations.length})
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
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            New Organization
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{organizations.length}</div>
              <div className="text-sm text-slate-600">Total Organizations</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">
                {organizations.reduce((sum, org) => sum + org.users_count, 0)}
              </div>
              <div className="text-sm text-slate-600">Active Users</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">
                {organizations.reduce((sum, org) => sum + org.apps_count, 0)}
              </div>
              <div className="text-sm text-slate-600">Deployed Apps</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-emerald-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">
                ${(organizations.reduce((sum, org) => sum + org.monthly_revenue, 0) / 1000).toFixed(1)}K
              </div>
              <div className="text-sm text-slate-600">Monthly Revenue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search organizations or admin emails..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                value={filters.region}
                onChange={(e) => updateFilter('region', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {REGION_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select
                value={filters.license_tier}
                onChange={(e) => updateFilter('license_tier', e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {LICENSE_OPTIONS.map(option => (
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

      {/* Organizations Grid */}
      {filteredOrgs.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOrgs.map((org) => (
            <OrganizationCard key={org.id} org={org} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No organizations found</h3>
          <p className="text-slate-600 mb-6">
            {filters.search || filters.industry || filters.region || filters.license_tier
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by creating your first organization.'
            }
          </p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Organization
          </button>
        </div>
      )}
    </div>
  )
}