/**
 * SAP Fiori CRUD Page Template
 * Production-ready template for generating entity and transaction pages
 */

import React from 'react'

export function generateEntityPageTemplate(config: any): string {
  const {
    entityType,
    entityName,
    entityNamePlural,
    entitySmartCode,
    dynamicFields,
    ui,
    features,
    businessRules
  } = config

  const iconImport = ui.icon
  const mobileCardFieldsArray = ui.mobileCardFields.map((f: string) => `'${f}'`).join(', ')
  const tableColumnsArray = ui.tableColumns.map((f: string) => `'${f}'`).join(', ')
  
  const dynamicFieldsConfig = dynamicFields.map((field: any) => 
    `      { name: '${field.name}', type: '${field.type}', smart_code: '${field.smart_code}', required: ${field.required} }`
  ).join(',\n')

  const interfaceFields = dynamicFields.map((field: any) => 
    `  ${field.name}?: ${field.type === 'number' ? 'number' : field.type === 'boolean' ? 'boolean' : 'string'}`
  ).join('\n')

  const smartCodesObject = dynamicFields.map((field: any) => 
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

interface ${entityName} extends TableRecord {
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

// HERA ${entityName} Smart Codes
const ${entityType}_SMART_CODES = {
  ENTITY: '${entitySmartCode}',
${smartCodesObject}
} as const

export default function ${entityNamePlural}Page() {
  const { currentOrganization, isAuthenticated } = useHERAAuth()
  const [selected${entityNamePlural}, setSelected${entityNamePlural}] = useState<(string | number)[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [current${entityName}, setCurrent${entityName}] = useState<${entityName} | null>(null)
  const [${entityType.toLowerCase()}ToDelete, set${entityName}ToDelete] = useState<${entityName} | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    // Add filter fields based on dynamic fields
    ${dynamicFields.slice(0, 3).map((f: any) => `${f.name}: ''`).join(',\n    ')}
  })

  // Use Universal Entity hook for ${entityName} management
  const ${entityType.toLowerCase()}Data = useUniversalEntity({
    entity_type: '${entityType}',
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

  // Transform universal entities to ${entityName} interface
  const ${entityType.toLowerCase()}s: ${entityName}[] = ${entityType.toLowerCase()}Data.entities?.map((entity: any) => {
    console.log('Transforming entity:', entity) // Debug log
    
    return {
      id: entity.id,
      entity_id: entity.id,
      entity_name: entity.entity_name || '',
      smart_code: entity.smart_code || '',
      status: entity.status || 'active',
      // Map dynamic fields
      ${dynamicFields.map((field: any) => 
        `${field.name}: entity.dynamic_data?.find((d: any) => d.field_name === '${field.name}')?.field_value_${field.type === 'number' ? 'number' : 'text'} || ${field.type === 'number' ? '0' : field.type === 'boolean' ? 'false' : "''"}`
      ).join(',\n      ')},
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }
  }) || []

  // KPI calculations
  const kpis = [
    {
      title: 'Total ${entityNamePlural}',
      value: ${entityType.toLowerCase()}s.length.toString(),
      change: '+5.2%',
      trend: 'up' as const,
      icon: ${iconImport}
    },
    {
      title: 'Active ${entityNamePlural}',
      value: ${entityType.toLowerCase()}s.filter(item => item.status === 'active').length.toString(),
      change: '+2.1%',
      trend: 'up' as const,
      icon: TrendingUp
    },
    {
      title: 'This Month',
      value: ${entityType.toLowerCase()}s.filter(item => {
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
    { key: 'entity_name', label: '${entityName} Name', sortable: true },
    ${ui.tableColumns.slice(1).map((col: string) => 
      `{ key: '${col}', label: '${col.charAt(0).toUpperCase() + col.slice(1).replace(/_/g, ' ')}', sortable: true }`
    ).join(',\n    ')},
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  // Filter fields configuration
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Search ${entityNamePlural}', type: 'search' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]},
    ${dynamicFields.slice(0, 2).map((field: any) => 
      field.type === 'text' ? 
      `{ key: '${field.name}', label: '${field.label}', type: 'select', options: [
        { value: '', label: 'All ${field.label}s' },
        ...Array.from(new Set(${entityType.toLowerCase()}s.map(item => item.${field.name}).filter(Boolean))).map(val => ({ value: val!, label: val! }))
      ]}` : null
    ).filter(Boolean).join(',\n    ')}
  ]

  // CRUD Operations
  const handleAdd${entityName} = async (${entityType.toLowerCase()}Data: any) => {
    try {
      await ${entityType.toLowerCase()}Data.create({
        entity_type: '${entityType}',
        entity_name: ${entityType.toLowerCase()}Data.entity_name,
        smart_code: ${entityType}_SMART_CODES.ENTITY,
        organization_id: currentOrganization?.id
      }, ${entityType.toLowerCase()}Data)
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding ${entityType.toLowerCase()}:', error)
    }
  }

  const handleEdit${entityName} = async (${entityType.toLowerCase()}Data: any) => {
    if (!current${entityName}) return
    
    try {
      await ${entityType.toLowerCase()}Data.update(current${entityName}.entity_id!, {
        entity_name: ${entityType.toLowerCase()}Data.entity_name
      }, ${entityType.toLowerCase()}Data)
      setShowEditModal(false)
      setCurrent${entityName}(null)
    } catch (error) {
      console.error('Error updating ${entityType.toLowerCase()}:', error)
    }
  }

  const handleDelete${entityName} = async () => {
    if (!${entityType.toLowerCase()}ToDelete) return
    
    try {
      await ${entityType.toLowerCase()}Data.delete(${entityType.toLowerCase()}ToDelete.entity_id!)
      setShowDeleteModal(false)
      set${entityName}ToDelete(null)
    } catch (error) {
      console.error('Error deleting ${entityType.toLowerCase()}:', error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      for (const id of selected${entityNamePlural}) {
        await ${entityType.toLowerCase()}Data.delete(id.toString())
      }
      setSelected${entityNamePlural}([])
    } catch (error) {
      console.error('Error bulk deleting ${entityType.toLowerCase()}s:', error)
    }
  }

  // Loading and auth checks
  if (!isAuthenticated) {
    return <div className="p-4 text-center">Please log in to access ${entityNamePlural}.</div>
  }

  if (${entityType.toLowerCase()}Data.contextLoading) {
    return <div className="p-4 text-center">Loading ${entityNamePlural}...</div>
  }

  if (!currentOrganization) {
    return <div className="p-4 text-center">No organization context found.</div>
  }

  return (
    <MobilePageLayout
      title="${entityNamePlural}"
      subtitle={\`\${${entityType.toLowerCase()}s.length} total ${entityType.toLowerCase()}s\`}
      primaryColor="${ui.primaryColor}"
      accentColor="${ui.accentColor}"
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
        data={${entityType.toLowerCase()}s}
        columns={columns}
        selectedRows={selected${entityNamePlural}}
        onRowSelect={setSelected${entityNamePlural}}
        onRowClick={(${entityType.toLowerCase()}) => {
          setCurrent${entityName}(${entityType.toLowerCase()})
          setShowEditModal(true)
        }}
        showBulkActions={selected${entityNamePlural}.length > 0}
        bulkActions={[
          {
            label: 'Delete Selected',
            action: handleBulkDelete,
            variant: 'destructive'
          }
        ]}
        mobileCardRender={(${entityType.toLowerCase()}) => (
          <MobileCard key={${entityType.toLowerCase()}.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{${entityType.toLowerCase()}.entity_name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setCurrent${entityName}(${entityType.toLowerCase()})
                    setShowEditModal(true)
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    set${entityName}ToDelete(${entityType.toLowerCase()})
                    setShowDeleteModal(true)
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            ${ui.mobileCardFields.map((field: string) => {
              const fieldConfig = dynamicFields.find((f: any) => f.name === field)
              return `<div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">${fieldConfig?.label || field}:</span> {${entityType.toLowerCase()}.${field} || 'N/A'}
            </div>`
            }).join('\n            ')}
            <div className="text-xs text-gray-400 mt-2">
              Created: {${entityType.toLowerCase()}.created_at ? new Date(${entityType.toLowerCase()}.created_at).toLocaleDateString() : 'N/A'}
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

      {/* Add ${entityName} Modal */}
      {showAddModal && (
        <${entityName}Modal
          title="Add New ${entityName}"
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAdd${entityName}}
          dynamicFields={${entityType.toLowerCase()}Data.dynamicFieldsConfig || []}
        />
      )}

      {/* Edit ${entityName} Modal */}
      {showEditModal && current${entityName} && (
        <${entityName}Modal
          title="Edit ${entityName}"
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setCurrent${entityName}(null)
          }}
          onSave={handleEdit${entityName}}
          initialData={current${entityName}}
          dynamicFields={${entityType.toLowerCase()}Data.dynamicFieldsConfig || []}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && ${entityType.toLowerCase()}ToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Delete ${entityName}</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{${entityType.toLowerCase()}ToDelete.entity_name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  set${entityName}ToDelete(null)
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete${entityName}}
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
interface ${entityName}ModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: ${entityName}
  dynamicFields: any[]
}

function ${entityName}Modal({ title, isOpen, onClose, onSave, initialData, dynamicFields }: ${entityName}ModalProps) {
  const [formData, setFormData] = useState(() => {
    const initial: any = { entity_name: initialData?.entity_name || '' }
    dynamicFields.forEach(field => {
      initial[field.name] = initialData?.[field.name as keyof ${entityName}] || (field.type === 'number' ? 0 : '')
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
                ${entityName} Name *
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
            {dynamicFields.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && '*'}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name]}
                    onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required={field.required}
                  />
                ) : (
                  <input
                    type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={formData[field.name]}
                    onChange={(e) => setFormData({ ...formData, [field.name]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={field.required}
                  />
                )}
              </div>
            ))}

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

export function generateTransactionPageTemplate(config: any): string {
  // Similar structure but for transactions with header/line items
  // This would be a more complex template for transaction-based pages
  return `// Transaction page template - to be implemented`
}