'use client'

import React, { useState } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileFilters, type FilterField } from '@/components/mobile/MobileFilters'
import { MobileDataTable, type TableColumn, type TableRecord } from '@/components/mobile/MobileDataTable'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { 
  Building2, 
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

interface Account extends TableRecord {
  id: string
  entity_id?: string
  entity_name: string
  smart_code: string
  status?: string
  // Dynamic fields (stored in core_dynamic_data)
  industry?: string
  website?: string
  employees?: number
  revenue?: number
  owner?: string
  created_at?: string
  updated_at?: string
}

// HERA Account Smart Codes
const ACCOUNT_SMART_CODES = {
  ENTITY: 'HERA.CRM.ACCOUNT.ENTITY.COMPANY.V1',
  FIELD_INDUSTRY: 'HERA.CRM.ACCOUNT.DYN.INDUSTRY.V1',
  FIELD_WEBSITE: 'HERA.CRM.ACCOUNT.DYN.WEBSITE.V1',
  FIELD_EMPLOYEES: 'HERA.CRM.ACCOUNT.DYN.EMPLOYEES.V1',
  FIELD_REVENUE: 'HERA.CRM.ACCOUNT.DYN.REVENUE.V1',
  FIELD_OWNER: 'HERA.CRM.ACCOUNT.DYN.OWNER.V1'
} as const

export default function AccountsPage() {
  const { currentOrganization, isAuthenticated } = useHERAAuth()
  const [selectedAccounts, setSelectedAccounts] = useState<(string | number)[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    // Add filter fields based on dynamic fields
    industry: '',
    website: '',
    employees: ''
  })

  // Use Universal Entity hook for Account management
  const accountData = useUniversalEntity({
    entity_type: 'ACCOUNT',
    organizationId: currentOrganization?.id,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      status: 'active'
    },
    dynamicFields: [
      { name: 'industry', type: 'text', smart_code: 'HERA.CRM.ACCOUNT.DYN.INDUSTRY.V1', required: true },
      { name: 'website', type: 'url', smart_code: 'HERA.CRM.ACCOUNT.DYN.WEBSITE.V1', required: false },
      { name: 'employees', type: 'number', smart_code: 'HERA.CRM.ACCOUNT.DYN.EMPLOYEES.V1', required: false },
      { name: 'revenue', type: 'number', smart_code: 'HERA.CRM.ACCOUNT.DYN.REVENUE.V1', required: false },
      { name: 'owner', type: 'text', smart_code: 'HERA.CRM.ACCOUNT.DYN.OWNER.V1', required: true }
    ]
  })

  // Transform universal entities to Account interface
  const accounts: Account[] = accountData.entities?.map((entity: any) => {
    console.log('Transforming entity:', entity) // Debug log
    
    return {
      id: entity.id,
      entity_id: entity.id,
      entity_name: entity.entity_name || '',
      smart_code: entity.smart_code || '',
      status: entity.status || 'active',
      // Map dynamic fields
      industry: entity.dynamic_data?.find((d: any) => d.field_name === 'industry')?.field_value_text || '',
      website: entity.dynamic_data?.find((d: any) => d.field_name === 'website')?.field_value_text || '',
      employees: entity.dynamic_data?.find((d: any) => d.field_name === 'employees')?.field_value_number || 0,
      revenue: entity.dynamic_data?.find((d: any) => d.field_name === 'revenue')?.field_value_number || 0,
      owner: entity.dynamic_data?.find((d: any) => d.field_name === 'owner')?.field_value_text || '',
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }
  }) || []

  // KPI calculations
  const kpis = [
    {
      title: 'Total Accounts',
      value: accounts.length.toString(),
      change: '+5.2%',
      trend: 'up' as const,
      icon: Building2
    },
    {
      title: 'Active Accounts',
      value: accounts.filter(item => item.status === 'active').length.toString(),
      change: '+2.1%',
      trend: 'up' as const,
      icon: TrendingUp
    },
    {
      title: 'This Month',
      value: accounts.filter(item => {
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
    { key: 'entity_name', label: 'Account Name', sortable: true },
    { key: 'industry', label: 'Industry', sortable: true },
    { key: 'website', label: 'Website', sortable: true },
    { key: 'employees', label: 'Employees', sortable: true },
    { key: 'revenue', label: 'Revenue', sortable: true },
    { key: 'owner', label: 'Owner', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  // Filter fields configuration
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Search Accounts', type: 'search' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]},
    { key: 'industry', label: 'Industry', type: 'select', options: [
        { value: '', label: 'All Industrys' },
        ...Array.from(new Set(accounts.map(item => item.industry).filter(Boolean))).map(val => ({ value: val!, label: val! }))
      ]}
  ]

  // CRUD Operations
  const handleAddAccount = async (accountData: any) => {
    try {
      await accountData.create({
        entity_type: 'ACCOUNT',
        entity_name: accountData.entity_name,
        smart_code: ACCOUNT_SMART_CODES.ENTITY,
        organization_id: currentOrganization?.id
      }, accountData)
      setShowAddModal(false)
    } catch (error) {
      console.error('Error adding account:', error)
    }
  }

  const handleEditAccount = async (accountData: any) => {
    if (!currentAccount) return
    
    try {
      await accountData.update(currentAccount.entity_id!, {
        entity_name: accountData.entity_name
      }, accountData)
      setShowEditModal(false)
      setCurrentAccount(null)
    } catch (error) {
      console.error('Error updating account:', error)
    }
  }

  const handleDeleteAccount = async () => {
    if (!accountToDelete) return
    
    try {
      await accountData.delete(accountToDelete.entity_id!)
      setShowDeleteModal(false)
      setAccountToDelete(null)
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedAccounts) {
        await accountData.delete(id.toString())
      }
      setSelectedAccounts([])
    } catch (error) {
      console.error('Error bulk deleting accounts:', error)
    }
  }

  // Loading and auth checks
  if (!isAuthenticated) {
    return <div className="p-4 text-center">Please log in to access Accounts.</div>
  }

  if (accountData.contextLoading) {
    return <div className="p-4 text-center">Loading Accounts...</div>
  }

  if (!currentOrganization) {
    return <div className="p-4 text-center">No organization context found.</div>
  }

  return (
    <MobilePageLayout
      title="Accounts"
      subtitle={`${accounts.length} total accounts`}
      primaryColor="#107c10"
      accentColor="#0b5a0b"
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
                <p className={`text-xs ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
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
        data={accounts}
        columns={columns}
        selectedRows={selectedAccounts}
        onRowSelect={setSelectedAccounts}
        onRowClick={(account) => {
          setCurrentAccount(account)
          setShowEditModal(true)
        }}
        showBulkActions={selectedAccounts.length > 0}
        bulkActions={[
          {
            label: 'Delete Selected',
            action: handleBulkDelete,
            variant: 'destructive'
          }
        ]}
        mobileCardRender={(account) => (
          <MobileCard key={account.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-lg">{account.entity_name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setCurrentAccount(account)
                    setShowEditModal(true)
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setAccountToDelete(account)
                    setShowDeleteModal(true)
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Industry:</span> {account.industry || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Website:</span> {account.website || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Employees:</span> {account.employees || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Account Owner:</span> {account.owner || 'N/A'}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Created: {account.created_at ? new Date(account.created_at).toLocaleDateString() : 'N/A'}
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

      {/* Add Account Modal */}
      {showAddModal && (
        <AccountModal
          title="Add New Account"
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddAccount}
          dynamicFields={accountData.dynamicFieldsConfig || []}
        />
      )}

      {/* Edit Account Modal */}
      {showEditModal && currentAccount && (
        <AccountModal
          title="Edit Account"
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setCurrentAccount(null)
          }}
          onSave={handleEditAccount}
          initialData={currentAccount}
          dynamicFields={accountData.dynamicFieldsConfig || []}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && accountToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Delete Account</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{accountToDelete.entity_name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setAccountToDelete(null)
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
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
interface AccountModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: Account
  dynamicFields: any[]
}

function AccountModal({ title, isOpen, onClose, onSave, initialData, dynamicFields }: AccountModalProps) {
  const [formData, setFormData] = useState(() => {
    const initial: any = { entity_name: initialData?.entity_name || '' }
    dynamicFields.forEach(field => {
      initial[field.name] = initialData?.[field.name as keyof Account] || (field.type === 'number' ? 0 : '')
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
                Account Name *
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
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry *
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website 
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employees 
              </label>
              <input
                type="number"
                value={formData.employees}
                onChange={(e) => setFormData({ ...formData, employees: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Revenue 
              </label>
              <input
                type="number"
                value={formData.revenue}
                onChange={(e) => setFormData({ ...formData, revenue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Owner *
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

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
}