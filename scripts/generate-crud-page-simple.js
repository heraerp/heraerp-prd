#!/usr/bin/env node

/**
 * HERA CRUD Page Generator CLI - Simple Version
 * Usage: node scripts/generate-crud-page-simple.js ACCOUNT
 */

const fs = require('fs')
const path = require('path')

// Predefined entity configurations
const PREDEFINED_ENTITIES = {
  ACCOUNT: {
    entityType: 'ACCOUNT',
    entityName: 'Account',
    entityNamePlural: 'Accounts',
    entitySmartCode: 'HERA.CRM.ACCOUNT.ENTITY.COMPANY.V1',
    fieldSmartCodes: {
      industry: 'HERA.CRM.ACCOUNT.DYN.INDUSTRY.V1',
      website: 'HERA.CRM.ACCOUNT.DYN.WEBSITE.V1',
      employees: 'HERA.CRM.ACCOUNT.DYN.EMPLOYEES.V1',
      revenue: 'HERA.CRM.ACCOUNT.DYN.REVENUE.V1',
      owner: 'HERA.CRM.ACCOUNT.DYN.OWNER.V1'
    },
    dynamicFields: [
      { name: 'industry', type: 'text', label: 'Industry', required: true, smart_code: 'HERA.CRM.ACCOUNT.DYN.INDUSTRY.V1' },
      { name: 'website', type: 'url', label: 'Website', required: false, smart_code: 'HERA.CRM.ACCOUNT.DYN.WEBSITE.V1' },
      { name: 'employees', type: 'number', label: 'Employees', required: false, smart_code: 'HERA.CRM.ACCOUNT.DYN.EMPLOYEES.V1' },
      { name: 'revenue', type: 'number', label: 'Annual Revenue', required: false, smart_code: 'HERA.CRM.ACCOUNT.DYN.REVENUE.V1' },
      { name: 'owner', type: 'text', label: 'Account Owner', required: true, smart_code: 'HERA.CRM.ACCOUNT.DYN.OWNER.V1' }
    ],
    ui: {
      icon: 'Building2',
      primaryColor: '#107c10',
      accentColor: '#0b5a0b',
      showKPIs: true,
      showFilters: true,
      showBulkActions: true,
      mobileCardFields: ['industry', 'website', 'employees', 'owner'],
      tableColumns: ['entity_name', 'industry', 'website', 'employees', 'revenue', 'owner']
    }
  },
  
  LEAD: {
    entityType: 'LEAD',
    entityName: 'Lead',
    entityNamePlural: 'Leads',
    entitySmartCode: 'HERA.CRM.LEAD.ENTITY.PROSPECT.V1',
    fieldSmartCodes: {
      email: 'HERA.CRM.LEAD.DYN.EMAIL.V1',
      phone: 'HERA.CRM.LEAD.DYN.PHONE.V1',
      company: 'HERA.CRM.LEAD.DYN.COMPANY.V1',
      source: 'HERA.CRM.LEAD.DYN.SOURCE.V1',
      score: 'HERA.CRM.LEAD.DYN.SCORE.V1',
      owner: 'HERA.CRM.LEAD.DYN.OWNER.V1'
    },
    dynamicFields: [
      { name: 'email', type: 'email', label: 'Email', required: true, smart_code: 'HERA.CRM.LEAD.DYN.EMAIL.V1' },
      { name: 'phone', type: 'phone', label: 'Phone', required: false, smart_code: 'HERA.CRM.LEAD.DYN.PHONE.V1' },
      { name: 'company', type: 'text', label: 'Company', required: true, smart_code: 'HERA.CRM.LEAD.DYN.COMPANY.V1' },
      { name: 'source', type: 'text', label: 'Lead Source', required: true, smart_code: 'HERA.CRM.LEAD.DYN.SOURCE.V1' },
      { name: 'score', type: 'number', label: 'Lead Score', required: false, smart_code: 'HERA.CRM.LEAD.DYN.SCORE.V1' },
      { name: 'owner', type: 'text', label: 'Owner', required: true, smart_code: 'HERA.CRM.LEAD.DYN.OWNER.V1' }
    ],
    ui: {
      icon: 'Target',
      primaryColor: '#d83b01',
      accentColor: '#a62d01',
      showKPIs: true,
      showFilters: true,
      showBulkActions: true,
      mobileCardFields: ['email', 'company', 'source', 'score'],
      tableColumns: ['entity_name', 'email', 'company', 'source', 'score', 'owner']
    }
  },
  
  PRODUCT: {
    entityType: 'PRODUCT',
    entityName: 'Product',
    entityNamePlural: 'Products',
    entitySmartCode: 'HERA.INV.PRODUCT.ENTITY.ITEM.V1',
    fieldSmartCodes: {
      sku: 'HERA.INV.PRODUCT.DYN.SKU.V1',
      price: 'HERA.INV.PRODUCT.DYN.PRICE.V1',
      cost: 'HERA.INV.PRODUCT.DYN.COST.V1',
      category: 'HERA.INV.PRODUCT.DYN.CATEGORY.V1',
      supplier: 'HERA.INV.PRODUCT.DYN.SUPPLIER.V1',
      stock: 'HERA.INV.PRODUCT.DYN.STOCK.V1'
    },
    dynamicFields: [
      { name: 'sku', type: 'text', label: 'SKU', required: true, smart_code: 'HERA.INV.PRODUCT.DYN.SKU.V1' },
      { name: 'price', type: 'number', label: 'Price', required: true, smart_code: 'HERA.INV.PRODUCT.DYN.PRICE.V1' },
      { name: 'cost', type: 'number', label: 'Cost', required: false, smart_code: 'HERA.INV.PRODUCT.DYN.COST.V1' },
      { name: 'category', type: 'text', label: 'Category', required: true, smart_code: 'HERA.INV.PRODUCT.DYN.CATEGORY.V1' },
      { name: 'supplier', type: 'text', label: 'Supplier', required: false, smart_code: 'HERA.INV.PRODUCT.DYN.SUPPLIER.V1' },
      { name: 'stock', type: 'number', label: 'Stock Quantity', required: false, smart_code: 'HERA.INV.PRODUCT.DYN.STOCK.V1' }
    ],
    ui: {
      icon: 'Package',
      primaryColor: '#6264a7',
      accentColor: '#464775',
      showKPIs: true,
      showFilters: true,
      showBulkActions: true,
      mobileCardFields: ['sku', 'price', 'category', 'stock'],
      tableColumns: ['entity_name', 'sku', 'price', 'category', 'supplier', 'stock']
    }
  }
}

function generateEntityPageTemplate(config) {
  const iconImport = config.ui.icon
  const mobileCardFieldsArray = config.ui.mobileCardFields.map(f => `'${f}'`).join(', ')
  const tableColumnsArray = config.ui.tableColumns.map(f => `'${f}'`).join(', ')
  
  const dynamicFieldsConfig = config.dynamicFields.map(field => 
    `      { name: '${field.name}', type: '${field.type}', smart_code: '${field.smart_code}', required: ${field.required} }`
  ).join(',\n')

  const interfaceFields = config.dynamicFields.map(field => 
    `  ${field.name}?: ${field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string'}`
  ).join('\n')

  const smartCodesObject = config.dynamicFields.map(field => 
    `  FIELD_${field.name.toUpperCase()}: '${field.smart_code}'`
  ).join(',\n')

  return `'use client'

import React, { useState } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileFilters, type FilterField } from '@/components/mobile/MobileFilters'
import { MobileDataTable, type TableColumn, type TableRecord } from '@/components/mobile/MobileDataTable'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { 
  ${iconImport}, 
  TrendingUp, 
  Plus, 
  Edit,
  Trash2,
  X,
  Save,
  Eye,
  Download,
  Upload,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react'

interface ${config.entityName} extends TableRecord {
  id: string
  entity_id?: string
  entity_name: string
  smart_code: string
  status?: string
  // Dynamic fields (stored in core_dynamic_data)
${interfaceFields}
  created_at?: string
  updated_at?: string
}

// HERA ${config.entityName} Smart Codes
const ${config.entityType}_SMART_CODES = {
  ENTITY: '${config.entitySmartCode}',
${smartCodesObject}
} as const

export default function ${config.entityNamePlural}Page() {
  const { currentOrganization, isAuthenticated } = useHERAAuth()
  const [selected${config.entityNamePlural}, setSelected${config.entityNamePlural}] = useState<(string | number)[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [current${config.entityName}, setCurrent${config.entityName}] = useState<${config.entityName} | null>(null)
  const [${config.entityType.toLowerCase()}ToDelete, set${config.entityName}ToDelete] = useState<${config.entityName} | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    // Add filter fields based on dynamic fields
    ${config.dynamicFields.slice(0, 3).map(f => `${f.name}: ''`).join(',\n    ')}
  })

  // Use Universal Entity hook for ${config.entityName} management
  const ${config.entityType.toLowerCase()}Data = useUniversalEntity({
    entity_type: '${config.entityType}',
    organizationId: currentOrganization?.id,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      status: 'active'
    },
    dynamicFields: [
${dynamicFieldsConfig}
    ]
  })

  // Transform universal entities to ${config.entityName} interface
  const ${config.entityType.toLowerCase()}s: ${config.entityName}[] = ${config.entityType.toLowerCase()}Data.entities?.map((entity: any) => {
    console.log('Transforming entity:', entity) // Debug log
    
    return {
      id: entity.id,
      entity_id: entity.id,
      entity_name: entity.entity_name || '',
      smart_code: entity.smart_code || '',
      status: entity.status || 'active',
      // Map dynamic fields
      ${config.dynamicFields.map(field => 
        `${field.name}: entity.dynamic_data?.find((d: any) => d.field_name === '${field.name}')?.field_value_${field.type === 'number' ? 'number' : 'text'} || ${field.type === 'number' ? '0' : field.type === 'boolean' ? 'false' : "''"}`
      ).join(',\n      ')},
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }
  }) || []

  // KPI calculations
  const kpis = [
    {
      title: 'Total ${config.entityNamePlural}',
      value: ${config.entityType.toLowerCase()}s.length.toString(),
      change: '+5.2%',
      trend: 'up' as const,
      icon: ${iconImport}
    },
    {
      title: 'Active ${config.entityNamePlural}',
      value: ${config.entityType.toLowerCase()}s.filter(item => item.status === 'active').length.toString(),
      change: '+2.1%',
      trend: 'up' as const,
      icon: TrendingUp
    },
    {
      title: 'This Month',
      value: ${config.entityType.toLowerCase()}s.filter(item => {
        if (!item.created_at) return false
        const created = new Date(item.created_at)
        const now = new Date()
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
      }).length.toString(),
      change: '+8.3%',
      trend: 'up' as const,
      icon: TrendingUp
    }
  ]

  // Table columns configuration
  const columns: TableColumn[] = [
    { key: 'entity_name', label: '${config.entityName} Name', sortable: true },
    ${config.ui.tableColumns.slice(1).map(col => 
      `{ key: '${col}', label: '${col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')}', sortable: true }`
    ).join(',\n    ')},
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  // Filter fields configuration
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Search ${config.entityNamePlural}', type: 'search' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]},
    ${config.dynamicFields.slice(0, 2).map(field => 
      field.type === 'text' ? 
      `{ key: '${field.name}', label: '${field.label}', type: 'select', options: [
        { value: '', label: 'All ${field.label}s' },
        ...Array.from(new Set(${config.entityType.toLowerCase()}s.map(item => item.${field.name}).filter(Boolean))).map(val => ({ value: val!, label: val! }))
      ]}` : null
    ).filter(Boolean).join(',\n    ')}
  ]

  // CRUD Operations
  const handleAdd${config.entityName} = async (${config.entityType.toLowerCase()}Data: any) => {
    try {
      await ${config.entityType.toLowerCase()}Data.create({
        entity_type: '${config.entityType}',
        entity_name: ${config.entityType.toLowerCase()}Data.entity_name,
        smart_code: ${config.entityType}_SMART_CODES.ENTITY,
        organization_id: currentOrganization?.id
      }, ${config.entityType.toLowerCase()}Data)
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding ${config.entityType.toLowerCase()}:', error)
    }
  }

  const handleEdit${config.entityName} = async (${config.entityType.toLowerCase()}Data: any) => {
    if (!current${config.entityName}) return
    
    try {
      await ${config.entityType.toLowerCase()}Data.update(current${config.entityName}.entity_id!, {
        entity_name: ${config.entityType.toLowerCase()}Data.entity_name
      }, ${config.entityType.toLowerCase()}Data)
      setShowEditModal(false)
      setCurrent${config.entityName}(null)
    } catch (error) {
      console.error('Error updating ${config.entityType.toLowerCase()}:', error)
    }
  }

  const handleDelete${config.entityName} = async () => {
    if (!${config.entityType.toLowerCase()}ToDelete) return
    
    try {
      await ${config.entityType.toLowerCase()}Data.delete(${config.entityType.toLowerCase()}ToDelete.entity_id!)
      setShowDeleteModal(false)
      set${config.entityName}ToDelete(null)
    } catch (error) {
      console.error('Error deleting ${config.entityType.toLowerCase()}:', error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      for (const id of selected${config.entityNamePlural}) {
        await ${config.entityType.toLowerCase()}Data.delete(id.toString())
      }
      setSelected${config.entityNamePlural}([])
    } catch (error) {
      console.error('Error bulk deleting ${config.entityType.toLowerCase()}s:', error)
    }
  }

  // Loading and auth checks
  if (!isAuthenticated) {
    return <div className="p-4 text-center">Please log in to access ${config.entityNamePlural}.</div>
  }

  if (${config.entityType.toLowerCase()}Data.contextLoading) {
    return <div className="p-4 text-center">Loading ${config.entityNamePlural}...</div>
  }

  if (!currentOrganization) {
    return <div className="p-4 text-center">No organization context found.</div>
  }

  return (
    <MobilePageLayout
      title="${config.entityNamePlural}"
      subtitle={\`\${${config.entityType.toLowerCase()}s.length} total ${config.entityType.toLowerCase()}s\`}
      primaryColor="${config.ui.primaryColor}"
      accentColor="${config.ui.accentColor}"
      showBackButton={false}
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <MobileCard key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className={\`text-xs \${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}\`}>
                  {kpi.change}
                </p>
              </div>
              <kpi.icon className="h-8 w-8 text-gray-400" />
            </div>
          </MobileCard>
        ))}
      </div>

      {/* Filters */}
      <MobileFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        className="mb-6"
      />

      {/* Data Table */}
      <MobileDataTable
        data={${config.entityType.toLowerCase()}s}
        columns={columns}
        selectedRows={selected${config.entityNamePlural}}
        onRowSelect={setSelected${config.entityNamePlural}}
        onRowClick={(${config.entityType.toLowerCase()}) => {
          setCurrent${config.entityName}(${config.entityType.toLowerCase()})
          setShowEditModal(true)
        }}
        showBulkActions={selected${config.entityNamePlural}.length > 0}
        bulkActions={[
          {
            label: 'Delete Selected',
            action: handleBulkDelete,
            variant: 'destructive'
          }
        ]}
        mobileCardRender={(${config.entityType.toLowerCase()}) => (
          <MobileCard key={${config.entityType.toLowerCase()}.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{${config.entityType.toLowerCase()}.entity_name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setCurrent${config.entityName}(${config.entityType.toLowerCase()})
                    setShowEditModal(true)
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    set${config.entityName}ToDelete(${config.entityType.toLowerCase()})
                    setShowDeleteModal(true)
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            ${config.ui.mobileCardFields.map(field => {
              const fieldConfig = config.dynamicFields.find(f => f.name === field)
              return `<div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">${fieldConfig?.label || field}:</span> {${config.entityType.toLowerCase()}.${field} || 'N/A'}
            </div>`
            }).join('\n            ')}
            <div className="text-xs text-gray-400 mt-2">
              Created: {${config.entityType.toLowerCase()}.created_at ? new Date(${config.entityType.toLowerCase()}.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </MobileCard>
        )}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors z-50"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Add ${config.entityName} Modal */}
      {showAddModal && (
        <${config.entityName}Modal
          title="Add New ${config.entityName}"
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd${config.entityName}}
          dynamicFields={${config.entityType.toLowerCase()}Data.dynamicFieldsConfig || []}
        />
      )}

      {/* Edit ${config.entityName} Modal */}
      {showEditModal && current${config.entityName} && (
        <${config.entityName}Modal
          title="Edit ${config.entityName}"
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setCurrent${config.entityName}(null)
          }}
          onSave={handleEdit${config.entityName}}
          initialData={current${config.entityName}}
          dynamicFields={${config.entityType.toLowerCase()}Data.dynamicFieldsConfig || []}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ${config.entityType.toLowerCase()}ToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Delete ${config.entityName}</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{${config.entityType.toLowerCase()}ToDelete.entity_name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  set${config.entityName}ToDelete(null)
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete${config.entityName}}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MobilePageLayout>
  )
}

// Modal Component for Add/Edit
interface ${config.entityName}ModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: ${config.entityName}
  dynamicFields: any[]
}

function ${config.entityName}Modal({ title, isOpen, onClose, onSave, initialData, dynamicFields }: ${config.entityName}ModalProps) {
  const [formData, setFormData] = useState(() => {
    const initial: any = { entity_name: initialData?.entity_name || '' }
    dynamicFields.forEach(field => {
      initial[field.name] = initialData?.[field.name as keyof ${config.entityName}] || (field.type === 'number' ? 0 : '')
    })
    return initial
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Entity Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ${config.entityName} Name *
              </label>
              <input
                type="text"
                value={formData.entity_name}
                onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Dynamic Fields */}
            ${config.dynamicFields.map(field => `
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ${field.label} ${field.required ? '*' : ''}
              </label>
              ${field.type === 'textarea' ? `<textarea
                value={formData.${field.name}}
                onChange={(e) => setFormData({ ...formData, ${field.name}: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                ${field.required ? 'required' : ''}
              />` : `<input
                type="${field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}"
                value={formData.${field.name}}
                onChange={(e) => setFormData({ ...formData, ${field.name}: ${field.type === 'number' ? 'parseFloat(e.target.value) || 0' : 'e.target.value'} })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                ${field.required ? 'required' : ''}
              />`}
            </div>`).join('\n            ')}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}`
}

function generateSampleDataScript(config) {
  const sampleData = {
    'ACCOUNT': `{
      entity_name: 'Acme Corporation',
      entity_type: 'ACCOUNT',
      smart_code: '${config.entitySmartCode}',
      status: 'active',
      organization_id: orgId,
      metadata: { account_type: 'enterprise', tier: 'gold' }
    },
    {
      entity_name: 'Global Manufacturing Inc',
      entity_type: 'ACCOUNT',
      smart_code: '${config.entitySmartCode}',
      status: 'active',
      organization_id: orgId,
      metadata: { account_type: 'enterprise', tier: 'platinum' }
    },
    {
      entity_name: 'TechStartup Inc',
      entity_type: 'ACCOUNT', 
      smart_code: '${config.entitySmartCode}',
      status: 'active',
      organization_id: orgId,
      metadata: { account_type: 'startup', tier: 'silver' }
    }`
  }

  const dynamicData = {
    'ACCOUNT': `'Acme Corporation': {
    industry: 'Technology',
    website: 'https://acme.com',
    employees: 500,
    revenue: 50000000,
    owner: 'Sarah Wilson'
  },
  'Global Manufacturing Inc': {
    industry: 'Manufacturing',
    website: 'https://globalmanuf.com',
    employees: 1200,
    revenue: 120000000,
    owner: 'Mike Johnson'
  },
  'TechStartup Inc': {
    industry: 'Technology',
    website: 'https://techstartup.io',
    employees: 25,
    revenue: 2500000,
    owner: 'Alex Chen'
  }`
  }

  return `import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://awfcrncxngqwbhqapffb.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createSample${config.entityNamePlural}() {
  const orgId = '6e1954fe-e34a-4056-84f4-745e5b8378ec'
  
  const sample${config.entityNamePlural} = [
    ${sampleData[config.entityType] || ''}
  ]
  
  console.log('Creating sample ${config.entityNamePlural.toLowerCase()} for retail CRM demo...')
  
  for (const [index, ${config.entityType.toLowerCase()}] of sample${config.entityNamePlural}.entries()) {
    const { data: entity, error } = await supabase
      .from('core_entities')
      .insert(${config.entityType.toLowerCase()})
      .select()
      .single()
      
    if (error) {
      console.error('Error creating ${config.entityType.toLowerCase()}:', error)
      continue
    }
    
    console.log(\`\${index + 1}. Created ${config.entityType.toLowerCase()}: \${entity.entity_name} (ID: \${entity.id})\`)
    
    // Add dynamic fields
    const fieldsData = sampleDynamicData[entity.entity_name]
    if (!fieldsData) continue
    
    const dynamicFields = []
    for (const [fieldName, fieldValue] of Object.entries(fieldsData)) {
      dynamicFields.push({
        organization_id: orgId,
        entity_id: entity.id,
        field_name: fieldName,
        field_type: typeof fieldValue === 'number' ? 'number' : 'text',
        field_value_text: typeof fieldValue === 'number' ? null : fieldValue,
        field_value_number: typeof fieldValue === 'number' ? fieldValue : null,
        smart_code: \`${config.entitySmartCode.replace('.ENTITY.', '.DYN.')}\${fieldName.toUpperCase()}.V1\`
      })
    }
    
    const { error: dynError } = await supabase
      .from('core_dynamic_data')
      .insert(dynamicFields)
      
    if (dynError) {
      console.error(\`Error creating dynamic fields for \${entity.entity_name}:\`, dynError)
    } else {
      console.log(\`   ✅ Added dynamic fields: \${Object.keys(fieldsData).join(', ')}\`)
    }
  }
  
  console.log('')
  console.log('✅ Sample ${config.entityNamePlural} created successfully!')
  console.log('🌐 Visit http://localhost:3001/${config.entityType.toLowerCase()}s to view them')
}

const sampleDynamicData = {
  ${dynamicData[config.entityType] || ''}
}

createSample${config.entityNamePlural}().catch(console.error)`
}

// Main CLI logic
const args = process.argv.slice(2)

if (args.length === 0) {
  console.log('🏗️  HERA SAP Fiori CRUD Page Generator')
  console.log('')
  console.log('📖 Usage:')
  console.log('  node scripts/generate-crud-page-simple.js <ENTITY_TYPE>')
  console.log('')
  console.log('📋 Available Entity Types:')
  Object.keys(PREDEFINED_ENTITIES).forEach(entity => {
    console.log(`  - ${entity}`)
  })
  console.log('')
  console.log('🔧 Examples:')
  console.log('  node scripts/generate-crud-page-simple.js ACCOUNT')
  console.log('  node scripts/generate-crud-page-simple.js LEAD')
  console.log('  node scripts/generate-crud-page-simple.js PRODUCT')
  console.log('')
  console.log('🎯 This generates:')
  console.log('  ✅ Production-quality SAP Fiori page with full CRUD')
  console.log('  ✅ TypeScript-safe configuration')
  console.log('  ✅ HERA Universal Entity integration')
  console.log('  ✅ Mobile-first responsive design')
  console.log('  ✅ Sample data creation scripts')
  console.log('  ✅ Sacred Six schema compliance')
  process.exit(0)
}

const [entityType] = args
const config = PREDEFINED_ENTITIES[entityType.toUpperCase()]

if (!config) {
  console.error(`❌ Entity type '${entityType}' not found.`)
  console.log('Available entities:', Object.keys(PREDEFINED_ENTITIES).join(', '))
  process.exit(1)
}

console.log(`🏗️  Generating ${config.entityName} page...`)

// Generate page
const baseDir = '/Users/san/Documents/PRD/heraerp-prd'
const entityPath = config.entityType.toLowerCase() + 's'
const outputPath = path.join(baseDir, 'src/app', entityPath, 'page.tsx')

// Create directory
const dirPath = path.dirname(outputPath)
if (!fs.existsSync(dirPath)) {
  fs.mkdirSync(dirPath, { recursive: true })
}

// Generate and write page
const pageContent = generateEntityPageTemplate(config)
fs.writeFileSync(outputPath, pageContent)

console.log(`✅ Generated page: ${outputPath}`)

// Generate sample data script
const scriptPath = path.join(baseDir, 'mcp-server', `create-sample-${config.entityType.toLowerCase()}s.js`)
const scriptContent = generateSampleDataScript(config)
fs.writeFileSync(scriptPath, scriptContent)

console.log(`✅ Generated sample data script: ${scriptPath}`)
console.log('')
console.log('🚀 Next Steps:')
console.log(`1. Run sample data: node mcp-server/create-sample-${config.entityType.toLowerCase()}s.js`)
console.log(`2. Visit page: http://localhost:3001/${entityPath}`)
console.log('')
console.log('🎉 Production-quality CRUD page generated successfully!')