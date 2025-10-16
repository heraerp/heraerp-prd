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
  User, 
  Users, 
  TrendingUp, 
  Plus, 
  Phone, 
  Mail,
  Building2,
  Calendar,
  MessageCircle,
  UserCheck,
  Edit,
  Trash2,
  X,
  Save,
  Eye
} from 'lucide-react'

interface Contact extends TableRecord {
  id: string
  entity_id?: string
  entity_name: string
  smart_code: string
  status?: string
  // Dynamic fields (stored in core_dynamic_data)
  email?: string
  phone?: string
  account?: string
  title?: string
  department?: string
  owner?: string
  lastActivity?: string
  avatar?: string
  linkedinUrl?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

// HERA CRM Contact Smart Codes
const CONTACT_SMART_CODES = {
  ENTITY: 'HERA.CRM.CONTACT.ENTITY.PERSON.V1',
  FIELD_EMAIL: 'HERA.CRM.CONTACT.DYN.EMAIL.V1',
  FIELD_PHONE: 'HERA.CRM.CONTACT.DYN.PHONE.V1',
  FIELD_TITLE: 'HERA.CRM.CONTACT.DYN.TITLE.V1',
  FIELD_DEPARTMENT: 'HERA.CRM.CONTACT.DYN.DEPARTMENT.V1',
  FIELD_OWNER: 'HERA.CRM.CONTACT.DYN.OWNER.V1',
  FIELD_ACCOUNT: 'HERA.CRM.CONTACT.DYN.ACCOUNT.V1',
  FIELD_NOTES: 'HERA.CRM.CONTACT.DYN.NOTES.V1'
} as const

export default function ContactsPage() {
  const { currentOrganization, isAuthenticated } = useHERAAuth()
  const [selectedContacts, setSelectedContacts] = useState<(string | number)[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentContact, setCurrentContact] = useState<Contact | null>(null)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [filters, setFilters] = useState({
    account: '',
    title: '',
    owner: '',
    status: '',
    search: ''
  })

  // Use Universal Entity hook for Contact management
  const contactsData = useUniversalEntity({
    entity_type: 'CONTACT',
    organizationId: currentOrganization?.id,
    filters: {
      include_dynamic: true,
      include_relationships: false,
      status: 'active'
    },
    dynamicFields: [
      { name: 'email', type: 'text', smart_code: CONTACT_SMART_CODES.FIELD_EMAIL, required: true },
      { name: 'phone', type: 'text', smart_code: CONTACT_SMART_CODES.FIELD_PHONE, required: true },
      { name: 'title', type: 'text', smart_code: CONTACT_SMART_CODES.FIELD_TITLE, required: true },
      { name: 'department', type: 'text', smart_code: CONTACT_SMART_CODES.FIELD_DEPARTMENT },
      { name: 'owner', type: 'text', smart_code: CONTACT_SMART_CODES.FIELD_OWNER },
      { name: 'account', type: 'text', smart_code: CONTACT_SMART_CODES.FIELD_ACCOUNT, required: true },
      { name: 'notes', type: 'text', smart_code: CONTACT_SMART_CODES.FIELD_NOTES }
    ]
  })

  // Transform universal entities to Contact interface
  const contacts: Contact[] = contactsData.entities?.map((entity: any) => {
    console.log('Transforming entity:', entity) // Debug log
    return {
      id: entity.id || entity.entity_id,
      entity_id: entity.id || entity.entity_id,
      entity_name: entity.entity_name,
      smart_code: entity.smart_code,
      status: entity.status,
      // Map dynamic fields
      email: entity.email,
      phone: entity.phone,
      account: entity.account,
      title: entity.title,
      department: entity.department,
      owner: entity.owner,
      notes: entity.notes,
      lastActivity: entity.updated_at || entity.created_at,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    }
  }) || []

  console.log('Contacts data:', { 
    isLoading: contactsData.isLoading, 
    error: contactsData.error,
    entityCount: contactsData.entities?.length,
    transformedContactCount: contacts.length,
    organizationId: currentOrganization?.id,
    firstContact: contacts[0]
  }) // Debug log

  const handleApplyFilters = () => {
    contactsData.refetch()
  }

  // CRUD Operations using Universal Entity
  const handleAddContact = async (contactData: any) => {
    try {
      await contactsData.create({
        entity_type: 'CONTACT',
        entity_name: contactData.name,
        smart_code: CONTACT_SMART_CODES.ENTITY,
        status: contactData.status || 'active',
        // Dynamic fields
        email: contactData.email,
        phone: contactData.phone,
        account: contactData.account,
        title: contactData.title,
        department: contactData.department,
        owner: contactData.owner,
        notes: contactData.notes
      })
      setShowAddModal(false)
    } catch (error) {
      console.error('Failed to create contact:', error)
    }
  }

  const handleEditContact = async (contactData: Contact) => {
    try {
      await contactsData.update({
        entity_id: contactData.entity_id || contactData.id,
        entity_name: contactData.entity_name,
        status: contactData.status,
        dynamic_patch: {
          email: contactData.email,
          phone: contactData.phone,
          account: contactData.account,
          title: contactData.title,
          department: contactData.department,
          owner: contactData.owner,
          notes: contactData.notes
        }
      })
      setShowEditModal(false)
      setCurrentContact(null)
    } catch (error) {
      console.error('Failed to update contact:', error)
    }
  }

  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (contactToDelete) {
      try {
        await contactsData.delete({
          entity_id: contactToDelete.entity_id || contactToDelete.id,
          hard_delete: false, // Soft delete (archive)
          cascade: true,
          reason: 'User requested deletion'
        })
        setSelectedContacts(prev => prev.filter(id => id !== contactToDelete.id))
      } catch (error) {
        console.error('Failed to delete contact:', error)
      }
    }
    setShowDeleteModal(false)
    setContactToDelete(null)
  }

  const handleBulkDelete = async () => {
    try {
      for (const contactId of selectedContacts) {
        await contactsData.delete({
          entity_id: contactId as string,
          hard_delete: false,
          cascade: true,
          reason: 'Bulk deletion'
        })
      }
      setSelectedContacts([])
    } catch (error) {
      console.error('Failed to bulk delete contacts:', error)
    }
  }

  const openEditModal = (contact: Contact) => {
    setCurrentContact(contact)
    setShowEditModal(true)
  }

  // Filter fields
  const filterFields: FilterField[] = [
    {
      key: 'account',
      label: 'Account',
      type: 'select',
      placeholder: 'All Accounts',
      options: [
        { value: 'acme', label: 'Acme Corporation' },
        { value: 'global', label: 'Global Manufacturing Inc' },
        { value: 'healthcare', label: 'Healthcare Solutions LLC' },
        { value: 'retail', label: 'Retail Chain Co' },
        { value: 'techstartup', label: 'TechStartup Inc' }
      ],
      value: filters.account,
      onChange: (value) => setFilters(prev => ({ ...prev, account: value }))
    },
    {
      key: 'title',
      label: 'Job Title',
      type: 'select',
      placeholder: 'All Titles',
      options: [
        { value: 'executive', label: 'Executive' },
        { value: 'manager', label: 'Manager' },
        { value: 'director', label: 'Director' },
        { value: 'vp', label: 'VP Level' },
        { value: 'cto', label: 'CTO' }
      ],
      value: filters.title,
      onChange: (value) => setFilters(prev => ({ ...prev, title: value }))
    },
    {
      key: 'owner',
      label: 'Contact Owner',
      type: 'select',
      placeholder: 'All Owners',
      options: [
        { value: 'sarah', label: 'Sarah Wilson' },
        { value: 'mike', label: 'Mike Johnson' },
        { value: 'alex', label: 'Alex Chen' }
      ],
      value: filters.owner,
      onChange: (value) => setFilters(prev => ({ ...prev, owner: value }))
    },
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search contacts...',
      value: filters.search,
      onChange: (value) => setFilters(prev => ({ ...prev, search: value }))
    }
  ]

  // Table columns (using correct schema field names)
  const columns: TableColumn[] = [
    {
      key: 'entity_name',
      label: 'Contact',
      render: (value, record) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
            {value.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <div>
            <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
              {value}
            </div>
            <div className="text-xs text-gray-500">{record.title}</div>
          </div>
        </div>
      )
    },
    {
      key: 'account',
      label: 'Account',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-gray-400" />
          <a href={`mailto:${value}`} className="text-blue-600 hover:text-blue-800 text-sm">
            {value}
          </a>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-gray-400" />
          <a href={`tel:${value}`} className="text-blue-600 hover:text-blue-800 text-sm">
            {value}
          </a>
        </div>
      )
    },
    {
      key: 'department',
      label: 'Department',
      align: 'center'
    },
    {
      key: 'updated_at',
      label: 'Last Activity',
      render: (value) => (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Calendar className="w-3 h-3" />
          {value ? new Date(value).toLocaleDateString() : 'N/A'}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'active' ? 'bg-green-100 text-green-800' :
          value === 'lead' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    }
  ]

  // Mobile card renderer
  const mobileCardRender = (record: Contact) => (
    <div className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
          {record.entity_name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-blue-600 cursor-pointer hover:text-blue-800">
                {record.entity_name}
              </h3>
              <p className="text-sm text-gray-600">{record.title}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {record.account}
              </p>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              record.status === 'active' ? 'bg-green-100 text-green-800' :
              record.status === 'lead' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {record.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Email</div>
          <a href={`mailto:${record.email}`} className="text-blue-600 hover:text-blue-800 truncate block">
            {record.email}
          </a>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Phone</div>
          <a href={`tel:${record.phone}`} className="text-blue-600 hover:text-blue-800">
            {record.phone}
          </a>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Department</div>
          <div className="font-medium">{record.department}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide">Last Activity</div>
          <div className="font-medium">{record.updated_at ? new Date(record.updated_at).toLocaleDateString() : 'N/A'}</div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button className="flex-1 text-sm text-blue-600 hover:text-blue-800 py-2 px-3 border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
          <Phone className="w-4 h-4" />
          Call
        </button>
        <button 
          onClick={() => openEditModal(record)}
          className="flex-1 text-sm text-gray-600 hover:text-gray-800 py-2 px-3 border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button 
          onClick={() => handleDeleteContact(record)}
          className="flex-1 text-sm text-red-600 hover:text-red-800 py-2 px-3 border border-red-200 rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>
  )

  // KPI data
  const kpiData = {
    totalContacts: contacts.length,
    newThisMonth: contacts.filter(c => {
      const created = new Date(c.created_at || '')
      const thisMonth = new Date()
      return created.getMonth() === thisMonth.getMonth() && created.getFullYear() === thisMonth.getFullYear()
    }).length,
    activeRatio: contacts.length > 0 ? Math.round((contacts.filter(c => c.status === 'active').length / contacts.length) * 100) : 0,
    topCompany: contacts.reduce((acc, contact) => {
      if (!contact.account) return acc
      acc[contact.account] = (acc[contact.account] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  // Chart data
  const roleChartData = [
    { name: 'Executive', value: 20, color: '#3b82f6' },
    { name: 'Manager', value: 30, color: '#10b981' },
    { name: 'Director', value: 25, color: '#f59e0b' },
    { name: 'VP Level', value: 15, color: '#ef4444' },
    { name: 'Other', value: 10, color: '#8b5cf6' }
  ]

  const activityData = [
    { week: 'W1', calls: 12, emails: 28, meetings: 6 },
    { week: 'W2', calls: 15, emails: 32, meetings: 8 },
    { week: 'W3', calls: 18, emails: 35, meetings: 12 },
    { week: 'W4', calls: 22, emails: 40, meetings: 15 }
  ]

  return (
    <MobilePageLayout title="HERA" breadcrumb="CRM / Contacts Directory">
      <MobileFilters 
        title="Contact Filters"
        fields={filterFields}
        onApply={handleApplyFilters}
        onAdaptFilters={() => console.log('Adapt filters')}
      />

      <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MobileCard 
            title="Total Contacts"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.totalContacts}</div>
                <div className="text-sm text-gray-600">All contacts</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="New This Month"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.newThisMonth}</div>
                <div className="text-sm text-gray-600">Recently added</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Plus className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Active Ratio"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.activeRatio}%</div>
                <div className="text-sm text-gray-600">Active contacts</div>
              </div>
              <div className="p-2 bg-yellow-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Top Company"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-bold text-gray-900">
                  {Object.keys(kpiData.topCompany).length > 0 ? 
                    Object.keys(kpiData.topCompany).reduce((a, b) => kpiData.topCompany[a] > kpiData.topCompany[b] ? a : b) : 
                    'None'}
                </div>
                <div className="text-sm text-gray-600">Most contacts</div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </MobileCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MobileChart 
            title="Contacts by Role"
            type="pie"
            data={roleChartData}
            height="300"
          />
          <MobileChart 
            title="Recent Contact Activities"
            type="bar"
            data={activityData}
            height="300"
          />
        </div>

        {/* Contacts Table */}
        <MobileDataTable
          title={`Contacts (${contacts.length})`}
          subtitle="Manage your customer contacts and communication"
          columns={columns}
          data={contacts}
          loading={contactsData.isLoading}
          selectable={true}
          selectedRows={selectedContacts}
          onRowSelect={setSelectedContacts}
          mobileCardRender={mobileCardRender}
          actions={
            <div className="flex gap-2">
              <button className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors">
                Export
              </button>
              {selectedContacts.length > 0 && (
                <button 
                  onClick={handleBulkDelete}
                  className="text-sm text-red-600 hover:text-red-800 px-3 py-2 border border-red-200 rounded hover:bg-red-50 transition-colors"
                >
                  Delete Selected ({selectedContacts.length})
                </button>
              )}
            </div>
          }
        />
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center min-w-[56px] min-h-[56px]"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <ContactModal
          title="Add New Contact"
          onSave={handleAddContact}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Contact Modal */}
      {showEditModal && currentContact && (
        <ContactModal
          title="Edit Contact"
          contact={currentContact}
          onSave={handleEditContact}
          onCancel={() => {
            setShowEditModal(false)
            setCurrentContact(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && contactToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Contact</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{contactToDelete.entity_name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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

// Contact Modal Component for Add/Edit
interface ContactModalProps {
  title: string
  contact?: Contact
  onSave: (contact: any) => void
  onCancel: () => void
}

function ContactModal({ title, contact, onSave, onCancel }: ContactModalProps) {
  const [formData, setFormData] = useState({
    name: contact?.entity_name || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    account: contact?.account || '',
    title: contact?.title || '',
    department: contact?.department || '',
    owner: contact?.owner || 'Sarah Wilson',
    status: contact?.status || 'active',
    notes: contact?.notes || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format'
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required'
    if (!formData.account.trim()) newErrors.account = 'Account is required'
    if (!formData.title.trim()) newErrors.title = 'Job title is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const contactData = contact 
      ? { ...contact, entity_name: formData.name, ...formData }
      : { ...formData, entity_name: formData.name }

    onSave(contactData)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter full name"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+1-555-0123"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="lead">Lead</option>
                </select>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Company Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account/Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.account}
                  onChange={(e) => handleInputChange('account', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.account ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter company name"
                />
                {errors.account && <p className="text-red-500 text-xs mt-1">{errors.account}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter job title"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select department</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Technology">Technology</option>
                  <option value="Operations">Operations</option>
                  <option value="Finance">Finance</option>
                  <option value="HR">Human Resources</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Owner</label>
                <select
                  value={formData.owner}
                  onChange={(e) => handleInputChange('owner', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Sarah Wilson">Sarah Wilson</option>
                  <option value="Mike Johnson">Mike Johnson</option>
                  <option value="Alex Chen">Alex Chen</option>
                </select>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or comments..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {contact ? 'Update Contact' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}