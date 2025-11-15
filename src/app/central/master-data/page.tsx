
'use client'

/**
 * ================================================================================
 * HERA CENTRAL: Master Data Hub
 * Smart Code: HERA.PLATFORM.CENTRAL.UI.MASTERDATA.HUB.v1
 * ================================================================================
 * 
 * Global configuration and master data management interface providing:
 * - Industry and region definitions
 * - Chart of accounts templates and packs
 * - Field configuration templates
 * - Dimension and hierarchy definitions
 * - Currency and localization settings
 * - Global reference data and lookups
 * 
 * Second-layer navigation with master data workflows
 * ================================================================================
 */

import React, { useEffect, useState } from 'react'

import { 
  Database,
  Plus,
  Search,
  Filter,
  Globe,
  MapPin,
  Building,
  Tag,
  Settings,
  Download,
  Upload,
  Edit,
  Copy,
  MoreVertical,
  FileText,
  Code2,
  Layers,
  TreePine,
  Coins,
  Languages,
  Archive,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Package
} from 'lucide-react'
import { 
  dynamicPlatformDataService,
  type DynamicIndustryDefinition,
  type DynamicRegionDefinition 
} from '@/lib/central/dynamic-platform-data'

// =============================================================================
// TYPES FROM DYNAMIC DATA SERVICE
// =============================================================================

interface IndustryDefinition {
  id: string
  industry_code: string
  industry_name: string
  description: string
  status: 'active' | 'draft' | 'deprecated'
  default_modules: string[]
  default_apps: string[]
  organizations_count: number
  created_date: string
  last_updated: string
  icon_color: string
}

interface RegionDefinition {
  id: string
  region_code: string
  region_name: string
  description: string
  countries: string[]
  default_currency: string
  default_language: string
  timezone: string
  organizations_count: number
  tax_settings: {
    vat_enabled: boolean
    vat_rate: number
    sales_tax_enabled: boolean
  }
  compliance_requirements: string[]
  status: 'active' | 'draft'
  created_date: string
}

interface CoATemplate {
  id: string
  template_code: string
  template_name: string
  version: string
  industry: string
  region: string
  description: string
  accounts_count: number
  dimensions: string[]
  status: 'active' | 'draft' | 'deprecated'
  usage_count: number
  last_updated: string
  features: string[]
}

interface FieldTemplate {
  id: string
  template_code: string
  template_name: string
  entity_type: string
  industry: string
  description: string
  fields_count: number
  validation_rules: number
  organizations_using: number
  status: 'active' | 'draft'
  last_updated: string
}

interface MasterDataFilters {
  category: string
  status: string
  industry: string
  region: string
  search: string
}

// =============================================================================
// MOCK DATA (In production, this would come from platform APIs)
// =============================================================================

const SAMPLE_INDUSTRIES: IndustryDefinition[] = [
  {
    id: '1',
    industry_code: 'RETAIL',
    industry_name: 'Retail & E-commerce',
    description: 'Retail stores, e-commerce platforms, and consumer goods distribution',
    status: 'active',
    default_modules: ['FICO_CORE', 'INVENTORY_ADVANCED', 'CRM_FULL', 'POS_INTEGRATION'],
    default_apps: ['RETAIL_CORE', 'POS_ADVANCED', 'ECOMMERCE_BASIC'],
    organizations_count: 23,
    created_date: '2024-01-10',
    last_updated: '2024-01-20',
    icon_color: 'blue'
  },
  {
    id: '2',
    industry_code: 'SALON',
    industry_name: 'Salon & Spa Services',
    description: 'Beauty salons, spas, wellness centers, and personal care services',
    status: 'active',
    default_modules: ['FICO_CORE', 'APPOINTMENT_MANAGEMENT', 'STAFF_MANAGEMENT', 'CRM_SALON'],
    default_apps: ['SALON_PRO', 'BOOKING_SYSTEM', 'POS_SALON'],
    organizations_count: 18,
    created_date: '2024-01-08',
    last_updated: '2024-01-18',
    icon_color: 'purple'
  },
  {
    id: '3',
    industry_code: 'MANUFACTURING',
    industry_name: 'Manufacturing & Production',
    description: 'Manufacturing facilities, production lines, and industrial operations',
    status: 'active',
    default_modules: ['FICO_ADVANCED', 'MRP_STANDARD', 'QUALITY_MANAGEMENT', 'SHOP_FLOOR_CONTROL'],
    default_apps: ['MANUFACTURING_SUITE', 'PRODUCTION_PLANNING', 'QUALITY_CONTROL'],
    organizations_count: 12,
    created_date: '2024-01-15',
    last_updated: '2024-01-22',
    icon_color: 'green'
  },
  {
    id: '4',
    industry_code: 'HEALTHCARE',
    industry_name: 'Healthcare & Medical',
    description: 'Hospitals, clinics, medical practices, and healthcare facilities',
    status: 'draft',
    default_modules: ['FICO_HEALTHCARE', 'PATIENT_MANAGEMENT', 'COMPLIANCE_HIPAA'],
    default_apps: ['HEALTHCARE_MANAGEMENT', 'PATIENT_PORTAL'],
    organizations_count: 3,
    created_date: '2024-01-25',
    last_updated: '2024-01-25',
    icon_color: 'red'
  }
]

const SAMPLE_REGIONS: RegionDefinition[] = [
  {
    id: '1',
    region_code: 'GCC',
    region_name: 'Gulf Cooperation Council',
    description: 'UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman',
    countries: ['UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
    default_currency: 'AED',
    default_language: 'en',
    timezone: 'Asia/Dubai',
    organizations_count: 28,
    tax_settings: {
      vat_enabled: true,
      vat_rate: 0.05,
      sales_tax_enabled: false
    },
    compliance_requirements: ['VAT_COMPLIANCE', 'ZAKAT_COMPLIANCE', 'ECONOMIC_SUBSTANCE'],
    status: 'active',
    created_date: '2024-01-05'
  },
  {
    id: '2',
    region_code: 'EU',
    region_name: 'European Union',
    description: 'European Union member states',
    countries: ['Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Poland'],
    default_currency: 'EUR',
    default_language: 'en',
    timezone: 'Europe/London',
    organizations_count: 15,
    tax_settings: {
      vat_enabled: true,
      vat_rate: 0.20,
      sales_tax_enabled: false
    },
    compliance_requirements: ['GDPR', 'VAT_COMPLIANCE', 'ENVIRONMENTAL_REPORTING'],
    status: 'active',
    created_date: '2024-01-08'
  },
  {
    id: '3',
    region_code: 'US',
    region_name: 'United States',
    description: 'United States of America',
    countries: ['United States'],
    default_currency: 'USD',
    default_language: 'en',
    timezone: 'America/New_York',
    organizations_count: 8,
    tax_settings: {
      vat_enabled: false,
      vat_rate: 0,
      sales_tax_enabled: true
    },
    compliance_requirements: ['SOX_COMPLIANCE', 'SALES_TAX', 'PRIVACY_ACT'],
    status: 'active',
    created_date: '2024-01-12'
  }
]

const SAMPLE_COA_TEMPLATES: CoATemplate[] = [
  {
    id: '1',
    template_code: 'COA_RETAIL_GCC_BASIC_v1',
    template_name: 'Retail GCC Basic Chart of Accounts',
    version: 'v1.2.0',
    industry: 'RETAIL',
    region: 'GCC',
    description: 'Basic chart of accounts for retail businesses in GCC with VAT compliance',
    accounts_count: 89,
    dimensions: ['STORE', 'CHANNEL', 'PRODUCT_CATEGORY'],
    status: 'active',
    usage_count: 23,
    last_updated: '2024-01-20',
    features: ['VAT_READY', 'MULTI_CURRENCY', 'COST_CENTER']
  },
  {
    id: '2',
    template_code: 'COA_SALON_GCC_LUXURY_v1',
    template_name: 'Luxury Salon GCC Chart of Accounts',
    version: 'v1.1.0',
    industry: 'SALON',
    region: 'GCC',
    description: 'Specialized chart of accounts for luxury salons and spas',
    accounts_count: 67,
    dimensions: ['STORE', 'STYLIST', 'SERVICE_CATEGORY', 'MEMBERSHIP_TIER'],
    status: 'active',
    usage_count: 18,
    last_updated: '2024-01-18',
    features: ['COMMISSION_TRACKING', 'TIP_MANAGEMENT', 'MEMBERSHIP_ACCOUNTING']
  },
  {
    id: '3',
    template_code: 'COA_MFG_EU_ADVANCED_v2',
    template_name: 'Manufacturing EU Advanced Chart of Accounts',
    version: 'v2.0.1',
    industry: 'MANUFACTURING',
    region: 'EU',
    description: 'Advanced manufacturing chart of accounts with cost center and project tracking',
    accounts_count: 156,
    dimensions: ['COST_CENTER', 'PROFIT_CENTER', 'PROJECT', 'WORK_CENTER'],
    status: 'active',
    usage_count: 12,
    last_updated: '2024-01-22',
    features: ['WIP_TRACKING', 'OVERHEAD_ALLOCATION', 'PROJECT_ACCOUNTING']
  }
]

const SAMPLE_FIELD_TEMPLATES: FieldTemplate[] = [
  {
    id: '1',
    template_code: 'CUSTOMER_FIELDS_RETAIL',
    template_name: 'Retail Customer Fields',
    entity_type: 'CUSTOMER',
    industry: 'RETAIL',
    description: 'Standard customer fields for retail businesses',
    fields_count: 12,
    validation_rules: 8,
    organizations_using: 23,
    status: 'active',
    last_updated: '2024-01-20'
  },
  {
    id: '2',
    template_code: 'PRODUCT_FIELDS_SALON',
    template_name: 'Salon Service & Product Fields',
    entity_type: 'PRODUCT',
    industry: 'SALON',
    description: 'Service and product fields specific to salon industry',
    fields_count: 15,
    validation_rules: 10,
    organizations_using: 18,
    status: 'active',
    last_updated: '2024-01-18'
  },
  {
    id: '3',
    template_code: 'INVENTORY_FIELDS_MFG',
    template_name: 'Manufacturing Inventory Fields',
    entity_type: 'INVENTORY_ITEM',
    industry: 'MANUFACTURING',
    description: 'Manufacturing-specific inventory and material fields',
    fields_count: 20,
    validation_rules: 15,
    organizations_using: 12,
    status: 'active',
    last_updated: '2024-01-22'
  }
]

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'industries', label: 'Industry Definitions' },
  { value: 'regions', label: 'Region Definitions' },
  { value: 'coa', label: 'Chart of Accounts' },
  { value: 'fields', label: 'Field Templates' }
]

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'deprecated', label: 'Deprecated' }
]

// =============================================================================
// COMPONENT FUNCTIONS
// =============================================================================

function IndustryCard({ industry }: { industry: IndustryDefinition }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'draft': return 'yellow'
      case 'deprecated': return 'red'
      default: return 'gray'
    }
  }

  const statusColor = getStatusColor(industry.status)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 bg-gradient-to-br from-${industry.icon_color}-400 to-${industry.icon_color}-600 rounded-lg flex items-center justify-center`}>
            <Building className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{industry.industry_name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-slate-600">{industry.industry_code}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
                {industry.status}
              </span>
            </div>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-md">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4">{industry.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{industry.organizations_count}</div>
          <div className="text-xs text-slate-600">Organizations</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{industry.default_modules.length}</div>
          <div className="text-xs text-slate-600">Modules</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{industry.default_apps.length}</div>
          <div className="text-xs text-slate-600">Apps</div>
        </div>
      </div>

      {/* Default Apps */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 font-medium mb-2">Default Applications</div>
        <div className="flex flex-wrap gap-1">
          {industry.default_apps.slice(0, 2).map((app, index) => (
            <span key={index} className="px-2 py-1 bg-blue-50 text-xs text-blue-700 rounded border border-blue-200">
              {app}
            </span>
          ))}
          {industry.default_apps.length > 2 && (
            <span className="px-2 py-1 bg-slate-100 text-xs text-slate-700 rounded">
              +{industry.default_apps.length - 2} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">
          <Copy className="w-4 h-4" />
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function RegionCard({ region }: { region: RegionDefinition }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{region.region_name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-slate-600">{region.region_code}</span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {region.status}
              </span>
            </div>
          </div>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-md">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4">{region.description}</p>

      {/* Key Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-xs text-slate-500 font-medium">Currency</div>
          <div className="text-sm font-medium text-slate-900">{region.default_currency}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Organizations</div>
          <div className="text-sm font-medium text-slate-900">{region.organizations_count}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">VAT Rate</div>
          <div className="text-sm font-medium text-slate-900">
            {region.tax_settings.vat_enabled ? `${(region.tax_settings.vat_rate * 100)}%` : 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 font-medium">Timezone</div>
          <div className="text-sm font-medium text-slate-900">{region.timezone.split('/')[1]}</div>
        </div>
      </div>

      {/* Countries */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 font-medium mb-2">Countries</div>
        <div className="flex flex-wrap gap-1">
          {region.countries.slice(0, 3).map((country, index) => (
            <span key={index} className="px-2 py-1 bg-green-50 text-xs text-green-700 rounded border border-green-200">
              {country}
            </span>
          ))}
          {region.countries.length > 3 && (
            <span className="px-2 py-1 bg-slate-100 text-xs text-slate-700 rounded">
              +{region.countries.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md">
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">
          <MapPin className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function CoATemplateCard({ template }: { template: CoATemplate }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'draft': return 'yellow'
      case 'deprecated': return 'red'
      default: return 'gray'
    }
  }

  const statusColor = getStatusColor(template.status)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{template.template_name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm text-slate-600">{template.version}</span>
              <span className="text-slate-400">•</span>
              <span className="text-sm text-slate-600">{template.industry}</span>
              <span className="text-slate-400">•</span>
              <span className="text-sm text-slate-600">{template.region}</span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
          {template.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-600 mb-4">{template.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{template.accounts_count}</div>
          <div className="text-xs text-slate-600">Accounts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{template.dimensions.length}</div>
          <div className="text-xs text-slate-600">Dimensions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{template.usage_count}</div>
          <div className="text-xs text-slate-600">Installs</div>
        </div>
      </div>

      {/* Features */}
      <div className="mb-4">
        <div className="text-xs text-slate-500 font-medium mb-2">Features</div>
        <div className="flex flex-wrap gap-1">
          {template.features.map((feature, index) => (
            <span key={index} className="px-2 py-1 bg-purple-50 text-xs text-purple-700 rounded border border-purple-200">
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        <button className="flex-1 flex items-center justify-center px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md">
          <Download className="w-4 h-4 mr-2" />
          Install
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">
          <Edit className="w-4 h-4" />
        </button>
        <button className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">
          <Copy className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function FieldTemplateCard({ template }: { template: FieldTemplate }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-md font-semibold text-slate-900">{template.template_name}</h4>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-slate-600">{template.entity_type}</span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-600">{template.industry}</span>
            </div>
          </div>
        </div>
        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          {template.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-600 mb-3">{template.description}</p>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900">{template.fields_count}</div>
          <div className="text-xs text-slate-500">Fields</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900">{template.validation_rules}</div>
          <div className="text-xs text-slate-500">Rules</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-slate-900">{template.organizations_using}</div>
          <div className="text-xs text-slate-500">Using</div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <button className="flex items-center space-x-1 px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded">
          <Download className="w-3 h-3" />
          <span>Apply</span>
        </button>
        <span className="text-xs text-slate-500">Updated {new Date(template.last_updated).toLocaleDateString()}</span>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function MasterDataPage() {
  const [industries, setIndustries] = useState<DynamicIndustryDefinition[]>([])
  const [regions, setRegions] = useState<DynamicRegionDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<MasterDataFilters>({
    category: '',
    status: '',
    industry: '',
    region: '',
    search: ''
  })
  const [activeTab, setActiveTab] = useState<'industries' | 'regions'>('industries')
  const [showFilters, setShowFilters] = useState(false)

  // Load dynamic data on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        console.log('[MasterData] 🔄 Loading dynamic master data...')
        
        const [industriesData, regionsData] = await Promise.all([
          dynamicPlatformDataService.getIndustryDefinitions(),
          dynamicPlatformDataService.getRegionDefinitions()
        ])
        
        console.log(`[MasterData] ✅ Loaded ${industriesData.length} industries and ${regionsData.length} regions`)
        setIndustries(industriesData)
        setRegions(regionsData)
        
      } catch (error) {
        console.error('[MasterData] ❌ Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const updateFilter = (key: keyof MasterDataFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      category: '',
      status: '',
      industry: '',
      region: '',
      search: ''
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Master Data Hub</h1>
          <p className="text-slate-600 mt-1">
            Global configuration and reference data management ({industries.length} industries, {regions.length} regions, {SAMPLE_COA_TEMPLATES.length} CoA templates)
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
            Import
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Building className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{industries.length}</div>
              <div className="text-sm text-slate-600">Industry Definitions</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Globe className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{regions.length}</div>
              <div className="text-sm text-slate-600">Region Definitions</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{SAMPLE_COA_TEMPLATES.length}</div>
              <div className="text-sm text-slate-600">CoA Templates</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center">
            <Tag className="w-8 h-8 text-indigo-600" />
            <div className="ml-3">
              <div className="text-2xl font-bold text-slate-900">{SAMPLE_FIELD_TEMPLATES.length}</div>
              <div className="text-sm text-slate-600">Field Templates</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="border-b border-slate-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('industries')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'industries'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>Industry Definitions</span>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {industries.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('regions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'regions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Region Definitions</span>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {regions.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('coa')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'coa'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Chart of Accounts</span>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {SAMPLE_COA_TEMPLATES.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('fields')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'fields'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4" />
                <span>Field Templates</span>
                <span className="bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">
                  {SAMPLE_FIELD_TEMPLATES.length}
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

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => updateFilter('status', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>

                <select
                  value={filters.industry}
                  onChange={(e) => updateFilter('industry', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Industries</option>
                  {industries.map(industry => (
                    <option key={industry.industry_code} value={industry.industry_code}>
                      {industry.industry_name}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.region}
                  onChange={(e) => updateFilter('region', e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Regions</option>
                  {regions.map(region => (
                    <option key={region.region_code} value={region.region_code}>
                      {region.region_name}
                    </option>
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
      {activeTab === 'industries' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {industries.map((industry) => (
            <IndustryCard key={industry.id} industry={industry} />
          ))}
        </div>
      )}

      {activeTab === 'regions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {regions.map((region) => (
            <RegionCard key={region.id} region={region} />
          ))}
        </div>
      )}

      {activeTab === 'coa' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {SAMPLE_COA_TEMPLATES.map((template) => (
            <CoATemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}

      {activeTab === 'fields' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SAMPLE_FIELD_TEMPLATES.map((template) => (
            <FieldTemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {((activeTab === 'industries' && industries.length === 0) ||
        (activeTab === 'regions' && regions.length === 0) ||
        (activeTab === 'coa' && SAMPLE_COA_TEMPLATES.length === 0) ||
        (activeTab === 'fields' && SAMPLE_FIELD_TEMPLATES.length === 0)) && (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Database className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No {activeTab} found</h3>
          <p className="text-slate-600 mb-6">
            Get started by creating your first {activeTab} template.
          </p>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create {activeTab}
          </button>
        </div>
      )}
    </div>
  )
}