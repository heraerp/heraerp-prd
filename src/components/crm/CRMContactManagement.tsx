'use client'

import React, { useState } from 'react'
import { 
  User, 
  Plus, 
  Filter, 
  Search, 
  MoreHorizontal,
  Download,
  Edit3,
  Trash2,
  Users,
  Building2,
  Mail,
  Phone,
  Calendar,
  Star
} from 'lucide-react'
import { MobileButton, MobileInput, MobileSelect, MobileModal } from '@/components/mobile'
import { CRMContactCard, CRMContactListItem, type CRMContact } from './CRMContactCard'
import { CRMContactForm } from './forms/CRMContactForm'
import { useCRMEntities } from '@/hooks/useCRM'
import { CRM_STATUS_VALUES } from '@/lib/crm/smart-codes'

export interface CRMContactManagementProps {
  className?: string
}

type ContactViewMode = 'cards' | 'list'
type ContactFilter = 'all' | 'decision-makers' | 'influencers' | 'champions' | 'recent'
type ContactSort = 'name' | 'created' | 'company' | 'role' | 'department'

export function CRMContactManagement({ className = '' }: CRMContactManagementProps) {
  const [viewMode, setViewMode] = useState<ContactViewMode>('cards')
  const [filter, setFilter] = useState<ContactFilter>('all')
  const [sortBy, setSortBy] = useState<ContactSort>('created')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showNewContactForm, setShowNewContactForm] = useState(false)

  // Hooks
  const { data: contacts = [], isLoading, error } = useCRMEntities('CONTACT')
  const { data: accounts = [] } = useCRMEntities('ACCOUNT')

  // Transform universal entities to contact format
  const transformedContacts: CRMContact[] = contacts.map(entity => {
    // Find related account
    const accountId = entity.dynamic_fields?.account_id?.value ||
      entity.relationships?.CONTACT_OF_ACCOUNT?.[0]?.target_entity_id
    
    const relatedAccount = accounts.find(acc => acc.entity_id === accountId)

    return {
      id: entity.entity_id || '',
      entity_name: entity.entity_name,
      email: entity.dynamic_fields?.email?.value,
      phone: entity.dynamic_fields?.phone?.value,
      mobile: entity.dynamic_fields?.mobile?.value,
      job_title: entity.dynamic_fields?.job_title?.value,
      department: entity.dynamic_fields?.department?.value,
      company: relatedAccount?.entity_name,
      linkedin_url: entity.dynamic_fields?.linkedin_url?.value,
      contact_role: entity.dynamic_fields?.contact_role?.value,
      last_activity_date: entity.updated_at,
      avatar_url: entity.dynamic_fields?.avatar_url?.value
    }
  })

  // Filter and sort contacts
  const filteredContacts = transformedContacts
    .filter(contact => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch = 
          contact.entity_name.toLowerCase().includes(query) ||
          contact.company?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.job_title?.toLowerCase().includes(query) ||
          contact.department?.toLowerCase().includes(query)
        
        if (!matchesSearch) return false
      }

      // Role filter
      switch (filter) {
        case 'decision-makers':
          return contact.contact_role === 'Decision Maker'
        case 'influencers':
          return contact.contact_role === 'Influencer'
        case 'champions':
          return contact.contact_role === 'Champion'
        case 'recent':
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return new Date(contact.last_activity_date || 0) > weekAgo
        default:
          return true
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.entity_name.localeCompare(b.entity_name)
        case 'company':
          return (a.company || '').localeCompare(b.company || '')
        case 'role':
          return (a.contact_role || '').localeCompare(b.contact_role || '')
        case 'department':
          return (a.department || '').localeCompare(b.department || '')
        case 'created':
        default:
          return new Date(b.last_activity_date || 0).getTime() - new Date(a.last_activity_date || 0).getTime()
      }
    })

  // Get summary stats
  const stats = {
    total: transformedContacts.length,
    decisionMakers: transformedContacts.filter(c => c.contact_role === 'Decision Maker').length,
    influencers: transformedContacts.filter(c => c.contact_role === 'Influencer').length,
    champions: transformedContacts.filter(c => c.contact_role === 'Champion').length,
    withEmail: transformedContacts.filter(c => c.email).length,
    withPhone: transformedContacts.filter(c => c.phone || c.mobile).length
  }

  // Handle contact actions
  const handleSelectContact = (contact: CRMContact) => {
    setSelectedContacts(prev => 
      prev.includes(contact.id) 
        ? prev.filter(id => id !== contact.id)
        : [...prev, contact.id]
    )
  }

  const handleSelectAllContacts = () => {
    setSelectedContacts(
      selectedContacts.length === filteredContacts.length 
        ? [] 
        : filteredContacts.map(contact => contact.id)
    )
  }

  const handleNewContactCreated = (contactId: string) => {
    setShowNewContactForm(false)
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">Failed to load contacts. Please try again.</div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <User className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
              <p className="text-gray-600">Manage your professional network</p>
            </div>
          </div>

          <MobileButton
            onClick={() => setShowNewContactForm(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Contact
          </MobileButton>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Total Contacts</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-600">Decision Makers</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.decisionMakers}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-600">Influencers</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.influencers}</div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-gray-600">Champions</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.champions}</div>
          </div>
        </div>

        {/* Contact Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Email Contacts</span>
            </div>
            <div className="text-xl font-bold text-green-900">
              {stats.withEmail} ({Math.round((stats.withEmail / Math.max(stats.total, 1)) * 100)}%)
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Phone Contacts</span>
            </div>
            <div className="text-xl font-bold text-blue-900">
              {stats.withPhone} ({Math.round((stats.withPhone / Math.max(stats.total, 1)) * 100)}%)
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Companies</span>
            </div>
            <div className="text-xl font-bold text-purple-900">
              {new Set(transformedContacts.map(c => c.company).filter(Boolean)).size}
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <MobileInput
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <MobileSelect
              value={filter}
              onChange={(e) => setFilter(e.target.value as ContactFilter)}
              className="w-full sm:w-40"
            >
              <option value="all">All Contacts</option>
              <option value="decision-makers">Decision Makers</option>
              <option value="influencers">Influencers</option>
              <option value="champions">Champions</option>
              <option value="recent">Recent Activity</option>
            </MobileSelect>

            <MobileSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ContactSort)}
              className="w-full sm:w-32"
            >
              <option value="created">Latest</option>
              <option value="name">Name</option>
              <option value="company">Company</option>
              <option value="role">Role</option>
              <option value="department">Department</option>
            </MobileSelect>

            <div className="flex gap-2">
              <MobileButton
                variant="outline"
                size="small"
                icon={<Filter className="w-4 h-4" />}
              >
                Filter
              </MobileButton>
              
              <MobileButton
                variant="outline"
                size="small"
                icon={<Download className="w-4 h-4" />}
              >
                Export
              </MobileButton>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedContacts.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {selectedContacts.length} contact{selectedContacts.length > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2">
              <MobileButton
                size="small"
                variant="outline"
                icon={<Mail className="w-4 h-4" />}
              >
                Bulk Email
              </MobileButton>
              <MobileButton
                size="small"
                variant="outline"
                icon={<Edit3 className="w-4 h-4" />}
              >
                Bulk Edit
              </MobileButton>
              <MobileButton
                size="small"
                variant="outline"
                icon={<Trash2 className="w-4 h-4" />}
                className="text-red-600 hover:bg-red-50"
              >
                Delete
              </MobileButton>
            </div>
          </div>
        )}
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading contacts...</div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || filter !== 'all' 
                ? 'No contacts match your current filters'
                : 'Start by adding your first contact'
              }
            </p>
            {(!searchQuery && filter === 'all') && (
              <MobileButton
                onClick={() => setShowNewContactForm(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add First Contact
              </MobileButton>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Header for list view */}
            {viewMode === 'list' && (
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === filteredContacts.length}
                    onChange={handleSelectAllContacts}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All
                  </span>
                </label>
                <div className="text-sm text-gray-600">
                  {filteredContacts.length} contact{filteredContacts.length > 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Contacts */}
            <div className={viewMode === 'cards' ? 'p-4 space-y-4' : 'divide-y divide-gray-200'}>
              {filteredContacts.map((contact) => (
                viewMode === 'cards' ? (
                  <CRMContactCard
                    key={contact.id}
                    contact={contact}
                    onCall={(contact) => console.log('Call', contact)}
                    onEmail={(contact) => console.log('Email', contact)}
                    onSMS={(contact) => console.log('SMS', contact)}
                    onScheduleMeeting={(contact) => console.log('Schedule meeting', contact)}
                    onViewProfile={(contact) => console.log('View profile', contact)}
                  />
                ) : (
                  <div key={contact.id} className="p-4">
                    <CRMContactListItem
                      contact={contact}
                      selected={selectedContacts.includes(contact.id)}
                      onSelect={handleSelectContact}
                      onCall={(contact) => console.log('Call', contact)}
                      onEmail={(contact) => console.log('Email', contact)}
                    />
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Contact Modal */}
      <MobileModal
        isOpen={showNewContactForm}
        onClose={() => setShowNewContactForm(false)}
        title="Add New Contact"
        size="large"
      >
        <CRMContactForm
          onSubmit={handleNewContactCreated}
          onCancel={() => setShowNewContactForm(false)}
        />
      </MobileModal>
    </div>
  )
}