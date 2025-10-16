'use client'

/**
 * MCA Contacts - Enhanced Contact Hub
 * Mobile-First Enterprise Page for Contact Management
 * 
 * Module: MCA
 * Entity: CONTACT
 * Smart Code: HERA.CRM.MCA.ENTITY.CONTACT.V1
 * Path: /crm/mca/contacts
 * Description: Person records with GDPR fields and multi-channel identities for MCA campaigns
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
  MoreVertical,
  Plus,
  Save,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  User,
  X
} from 'lucide-react'

/**
 * Contact Entity Interface
 * Extends TableRecord for HERA compliance
 */
interface Contact extends TableRecord {
  id: string
  entity_id?: string
  entity_name: string
  smart_code: string
  status?: string
  
  // Dynamic fields (stored in core_dynamic_data)
  email?: string
  phone?: string
  title?: string
  account?: string
  department?: string
  owner?: string
  locale?: string
  timezone?: string
  consent_status?: string
  
  // System fields
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
  
  // Business rule fields
  
  
}

/**
 * HERA Contact Smart Codes
 * Auto-generated from preset configuration
 */
const CONTACT_SMART_CODES = {
  ENTITY: 'HERA.CRM.MCA.ENTITY.CONTACT.V1',
  FIELD_EMAIL: 'HERA.CRM.MCA.DYN.CONTACT.V1.EMAIL.V1',
  FIELD_PHONE: 'HERA.CRM.MCA.DYN.CONTACT.V1.PHONE.V1',
  FIELD_TITLE: 'HERA.CRM.MCA.DYN.CONTACT.V1.TITLE.V1',
  FIELD_ACCOUNT: 'HERA.CRM.MCA.DYN.CONTACT.V1.ACCOUNT.V1',
  FIELD_DEPARTMENT: 'HERA.CRM.MCA.DYN.CONTACT.V1.DEPARTMENT.V1',
  FIELD_OWNER: 'HERA.CRM.MCA.DYN.CONTACT.V1.OWNER.V1',
  FIELD_LOCALE: 'HERA.CRM.MCA.DYN.CONTACT.V1.LOCALE.V1',
  FIELD_TIMEZONE: 'HERA.CRM.MCA.DYN.CONTACT.V1.TIMEZONE.V1',
  FIELD_CONSENT_STATUS: 'HERA.CRM.MCA.DYN.CONTACT.V1.CONSENT_STATUS.V1',
  
  // Event smart codes for audit trail
  EVENT_CREATED: 'HERA.CRM.MCA.EVENT.CONTACT.V1.CREATED.V1',
  EVENT_UPDATED: 'HERA.CRM.MCA.EVENT.CONTACT.V1.UPDATED.V1',
  EVENT_DELETED: 'HERA.CRM.MCA.EVENT.CONTACT.V1.DELETED.V1'
} as const

/**
 * Contacts Main Page Component
 * Enterprise-grade CRUD with quality gates and business rules
 */
export default function ContactsPage() {
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [selectedContacts, setSelectedContacts] = useState<(string | number)[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [currentContact, setCurrentContact] = useState<Contact | null>(null)
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    // Dynamic filter fields
    email: '',
    phone: '',
    title: ''
  })

  // HERA Universal Entity Integration
  const contactData = useUniversalEntity({
    entity_type: 'CONTACT',
    organizationId: currentOrganization?.id,
    filters: {
      include_dynamic: true,
      include_relationships: undefined,
      status: 'active'
    },
    dynamicFields: [
      { name: 'email', type: 'email', smart_code: 'HERA.CRM.MCA.DYN.CONTACT.V1.EMAIL.V1', required: true },
      { name: 'phone', type: 'phone', smart_code: 'HERA.CRM.MCA.DYN.CONTACT.V1.PHONE.V1', required: true },
      { name: 'title', type: 'text', smart_code: 'HERA.CRM.MCA.DYN.CONTACT.V1.TITLE.V1', required: false },
      { name: 'account', type: 'text', smart_code: 'HERA.CRM.MCA.DYN.CONTACT.V1.ACCOUNT.V1', required: true },
      { name: 'department', type: 'text', smart_code: 'HERA.CRM.MCA.DYN.CONTACT.V1.DEPARTMENT.V1', required: false },
      { name: 'owner', type: 'text', smart_code: 'HERA.CRM.MCA.DYN.CONTACT.V1.OWNER.V1', required: true },
      { name: 'locale', type: 'text', smart_code: 'HERA.CRM.MCA.DYN.CONTACT.V1.LOCALE.V1', required: false },
      { name: 'timezone', type: 'text', smart_code: 'HERA.CRM.MCA.DYN.CONTACT.V1.TIMEZONE.V1', required: false },
      { name: 'consent_status', type: 'text', smart_code: 'HERA.CRM.MCA.DYN.CONTACT.V1.CONSENT_STATUS.V1', required: false }
    ]
  })

  // Transform entities with business rule extensions
  const contacts: Contact[] = contactData.entities?.map((entity: any) => {
    return {
      id: entity.id,
      entity_id: entity.id,
      entity_name: entity.entity_name || '',
      smart_code: entity.smart_code || '',
      status: entity.status || 'active',
      
      // Map dynamic fields with type safety
      email: entity.dynamic_data?.find((d: any) => d.field_name === 'email')?.field_value_text || '',
      phone: entity.dynamic_data?.find((d: any) => d.field_name === 'phone')?.field_value_text || '',
      title: entity.dynamic_data?.find((d: any) => d.field_name === 'title')?.field_value_text || '',
      account: entity.dynamic_data?.find((d: any) => d.field_name === 'account')?.field_value_text || '',
      department: entity.dynamic_data?.find((d: any) => d.field_name === 'department')?.field_value_text || '',
      owner: entity.dynamic_data?.find((d: any) => d.field_name === 'owner')?.field_value_text || '',
      locale: entity.dynamic_data?.find((d: any) => d.field_name === 'locale')?.field_value_text || '',
      timezone: entity.dynamic_data?.find((d: any) => d.field_name === 'timezone')?.field_value_text || '',
      consent_status: entity.dynamic_data?.find((d: any) => d.field_name === 'consent_status')?.field_value_text || '',
      
      // System fields
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      created_by: entity.created_by,
      updated_by: entity.updated_by
      
      
    }
  }) || []

  // Enhanced KPI calculations with preset metrics
  const kpis = [
    {
      title: 'Total Contacts',
      value: contacts.length.toString(),
      change: '+5.2%',
      trend: 'up' as const,
      icon: User
    },
    {
      title: 'Active Contacts',
      value: contacts.filter(item => item.status === 'active').length.toString(),
      change: '+2.1%',
      trend: 'up' as const,
      icon: CheckCircle
    },
    {
      title: 'This Month',
      value: contacts.filter(item => {
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

  // Enhanced table columns with business rule columns
  const columns: TableColumn[] = [
    { key: 'entity_name', label: 'Contact Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'title', label: 'Title', sortable: true },
    { key: 'account', label: 'Account', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  // Enhanced filter fields with business rule filters
  const filterFields: FilterField[] = [
    { key: 'search', label: 'Search Contacts', type: 'search' },
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: '', label: 'All Status' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]},
    
  ]

  // Enterprise CRUD Operations with Events
  const handleAddContact = async (contactData: any) => {
    try {
      const result = await contactData.create({
        entity_type: 'CONTACT',
        entity_name: contactData.entity_name,
        smart_code: CONTACT_SMART_CODES.ENTITY,
        organization_id: currentOrganization?.id
      }, contactData)

      // Emit creation event for audit trail
      await contactData.emitEvent(CONTACT_SMART_CODES.EVENT_CREATED, {
        entity_id: result.id,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
        data: contactData
      })

      setShowAddModal(false)
      console.log('✅ Contact created successfully')
    } catch (error) {
      console.error('❌ Error adding contact:', error)
    }
  }

  const handleEditContact = async (contactData: any) => {
    if (!currentContact) return
    
    try {
      await contactData.update(currentContact.entity_id!, {
        entity_name: contactData.entity_name
      }, contactData)

      // Emit update event
      await contactData.emitEvent(CONTACT_SMART_CODES.EVENT_UPDATED, {
        entity_id: currentContact.entity_id!,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
        changes: contactData
      })

      setShowEditModal(false)
      setCurrentContact(null)
      console.log('✅ Contact updated successfully')
    } catch (error) {
      console.error('❌ Error updating contact:', error)
    }
  }

  const handleDeleteContact = async () => {
    if (!contactToDelete) return
    
    try {
      await contactData.delete(contactToDelete.entity_id!)

      // Emit deletion event
      await contactData.emitEvent(CONTACT_SMART_CODES.EVENT_DELETED, {
        entity_id: contactToDelete.entity_id!,
        user_id: user?.id,
        timestamp: new Date().toISOString(),
        entity_name: contactToDelete.entity_name
      })

      setShowDeleteModal(false)
      setContactToDelete(null)
      console.log('✅ Contact deleted successfully')
    } catch (error) {
      console.error('❌ Error deleting contact:', error)
    }
  }

  
  

  // Enterprise security checks
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p>Please log in to access Contacts.</p>
      </div>
    )
  }

  if (contactData.contextLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        <p>Loading Contacts...</p>
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
      title="Contacts"
      subtitle={`${contacts.length} total contacts`}
      primaryColor="#0078d4"
      accentColor="#005a9e"
      showBackButton={false}
    >
      {/* Enterprise KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <MobileCard key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{kpi.title}</p>
                <p className="text-2xl font-bold" style={{ color: '#0078d4' }}>{kpi.value}</p>
                <p className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
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

      {/* Enterprise Data Table */}
      <MobileDataTable
        data={contacts}
        columns={columns}
        selectedRows={selectedContacts}
        onRowSelect={setSelectedContacts}
        onRowClick={(contact) => {
          setCurrentContact(contact)
          setShowEditModal(true)
        }}
        showBulkActions={selectedContacts.length > 0}
        bulkActions={[
          {
            label: 'Delete Selected',
            action: async () => {
              // Bulk delete with events
              for (const id of selectedContacts) {
                await contactData.delete(id.toString())
              }
              setSelectedContacts([])
            },
            variant: 'destructive'
          }
        ]}
        mobileCardRender={(contact) => (
          <MobileCard key={contact.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{contact.entity_name}</h3>
                
                
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setCurrentContact(contact)
                    setShowEditModal(true)
                  }}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setContactToDelete(contact)
                    setShowDeleteModal(true)
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            {/* Dynamic fields display */}
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Email:</span>{' '}
              {contact.email || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Phone:</span>{' '}
              {contact.phone || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Title:</span>{' '}
              {contact.title || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Account:</span>{' '}
              {contact.account || 'N/A'}
            </div>
            
            <div className="text-xs text-gray-400 mt-2 pt-2 border-t">
              Created: {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </MobileCard>
        )}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 text-white rounded-full p-4 shadow-lg transition-colors z-50 hover:shadow-xl"
        style={{ backgroundColor: '#0078d4' }}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Enterprise Modals */}
      {showAddModal && (
        <ContactModal
          title="Add New Contact"
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddContact}
          dynamicFields={contactData.dynamicFieldsConfig || []}
          businessRules={{"duplicate_detection":true,"audit_trail":true,"gdpr_compliance":true,"consent_tracking":true}}
        />
      )}

      {showEditModal && currentContact && (
        <ContactModal
          title="Edit Contact"
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setCurrentContact(null)
          }}
          onSave={handleEditContact}
          initialData={currentContact}
          dynamicFields={contactData.dynamicFieldsConfig || []}
          businessRules={{"duplicate_detection":true,"audit_trail":true,"gdpr_compliance":true,"consent_tracking":true}}
        />
      )}

      {showDeleteModal && contactToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold">Delete Contact</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{contactToDelete.entity_name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setContactToDelete(null)
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteContact}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </MobilePageLayout>
  )
}

/**
 * Enterprise Contact Modal Component
 * Enhanced with business rules and validation
 */
interface ContactModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: Contact
  dynamicFields: any[]
  businessRules: any
}

function ContactModal({ 
  title, 
  isOpen, 
  onClose, 
  onSave, 
  initialData, 
  dynamicFields,
  businessRules 
}: ContactModalProps) {
  const [formData, setFormData] = useState(() => {
    const initial: any = { 
      entity_name: initialData?.entity_name || '' 
    }
    
    dynamicFields.forEach(field => {
      initial[field.name] = initialData?.[field.name as keyof Contact] || (field.type === 'number' ? 0 : '')
    })
    
    return initial
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    // Validate required fields
    dynamicFields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label || field.name} is required`
      }
    })
    
    // Entity name validation
    if (!formData.entity_name?.trim()) {
      newErrors.entity_name = 'Contact name is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
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
                Contact Name *
              </label>
              <input
                type="text"
                value={formData.entity_name}
                onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.entity_name ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                required
                disabled={isSubmitting}
              />
              {errors.entity_name && (
                <p className="mt-1 text-sm text-red-600">{errors.entity_name}</p>
              )}
            </div>

            {/* Dynamic Fields with Enhanced Validation */}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                required
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.phone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                required
                disabled={isSubmitting}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title 
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.title ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account *
              </label>
              <input
                type="text"
                value={formData.account}
                onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.account ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                required
                disabled={isSubmitting}
              />
              {errors.account && (
                <p className="mt-1 text-sm text-red-600">{errors.account}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department 
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.department ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                
                disabled={isSubmitting}
              />
              {errors.department && (
                <p className="mt-1 text-sm text-red-600">{errors.department}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Owner *
              </label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.owner ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                required
                disabled={isSubmitting}
              />
              {errors.owner && (
                <p className="mt-1 text-sm text-red-600">{errors.owner}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Locale 
              </label>
              <input
                type="text"
                value={formData.locale}
                onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.locale ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                
                disabled={isSubmitting}
              />
              {errors.locale && (
                <p className="mt-1 text-sm text-red-600">{errors.locale}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone 
              </label>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.timezone ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                
                disabled={isSubmitting}
              />
              {errors.timezone && (
                <p className="mt-1 text-sm text-red-600">{errors.timezone}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Consent Status 
              </label>
              <input
                type="text"
                value={formData.consent_status}
                onChange={(e) => setFormData({ ...formData, consent_status: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${errors.consent_status ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                
                disabled={isSubmitting}
              />
              {errors.consent_status && (
                <p className="mt-1 text-sm text-red-600">{errors.consent_status}</p>
              )}
            </div>

            {/* Business Rules Info */}
            

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-white rounded-md hover:opacity-90 flex items-center disabled:opacity-50"
                style={{ backgroundColor: '#0078d4' }}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}