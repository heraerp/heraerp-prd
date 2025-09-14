'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Users,
  Plus,
  Search,
  Filter,
  Building2,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Edit,
  MapPin,
  Briefcase,
  Shield,
  Star,
  ArrowRight,
  Upload,
  UserCheck,
  UserX
} from 'lucide-react'

// Kerala Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface Contact {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    title?: string
    department?: string
    decision_maker?: boolean
  }
  created_at: string
  updated_at: string
}

interface DynamicData {
  field_name: string
  field_value_text?: string
  field_value_number?: number
}

interface ContactRelation {
  company?: string
  location?: string
}

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [contactDynamicData, setContactDynamicData] = useState<Record<string, DynamicData[]>>({})
  const [contactRelations, setContactRelations] = useState<Record<string, ContactRelation>>({})
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      // Load contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', KERALA_VISION_ORG_ID)
        .eq('entity_type', 'contact')
        .order('created_at', { ascending: false })

      if (contactsError) throw contactsError

      // Load dynamic data for contacts
      const contactIds = contactsData?.map(contact => contact.id) || []
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .in('entity_id', contactIds)

      if (dynamicError) throw dynamicError

      // Group dynamic data by entity
      const dynamicDataByEntity: Record<string, DynamicData[]> = {}
      dynamicData?.forEach(item => {
        if (!dynamicDataByEntity[item.entity_id]) {
          dynamicDataByEntity[item.entity_id] = []
        }
        dynamicDataByEntity[item.entity_id].push(item)
      })

      // Load relationships to get company info
      const { data: relationships, error: relError } = await supabase
        .from('core_relationships')
        .select(`
          *,
          from_entity:core_entities!from_entity_id(entity_name, entity_type),
          to_entity:core_entities!to_entity_id(entity_name, entity_type)
        `)
        .eq('relationship_type', 'ACCOUNT_HAS_CONTACT')
        .eq('organization_id', KERALA_VISION_ORG_ID)
        .in('to_entity_id', contactIds)

      if (relError) throw relError

      // Build contact relations
      const relations: Record<string, ContactRelation> = {}
      relationships?.forEach(rel => {
        if (rel.from_entity?.entity_type === 'account') {
          relations[rel.to_entity_id] = {
            company: rel.from_entity.entity_name,
            location: 'Bangalore' // Default location, could be from dynamic data
          }
        }
      })

      setContacts(contactsData || [])
      setContactDynamicData(dynamicDataByEntity)
      setContactRelations(relations)
    } catch (error) {
      console.error('Error loading contacts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDynamicValue = (contactId: string, fieldName: string) => {
    const fields = contactDynamicData[contactId] || []
    const field = fields.find(f => f.field_name === fieldName)
    return field?.field_value_text || field?.field_value_number || ''
  }

  const getContactType = (contact: Contact): string => {
    if (contact.metadata?.decision_maker === true) {
      return contact.metadata?.title?.toLowerCase().includes('cio') ||
             contact.metadata?.title?.toLowerCase().includes('cto') ? 'champion' : 'decision_maker'
    }
    return 'influencer'
  }

  const getContactStatus = (contact: Contact): string => {
    // Check smart code for status
    if (contact.entity_code?.includes('INACTIVE')) return 'inactive'
    return 'active'
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'decision_maker': return 'from-[#FF5A09] to-[#ec7f37]'
      case 'influencer': return 'from-[#ec7f37] to-[#be4f0c]'
      case 'champion': return 'from-emerald-500 to-green-600'
      case 'user': return 'from-blue-500 to-blue-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'decision_maker': return Shield
      case 'influencer': return Users
      case 'champion': return Star
      case 'user': return UserCheck
      default: return Users
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'inactive': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const filteredContacts = contacts.filter(contact => {
    const email = getDynamicValue(contact.id, 'email')
    const relation = contactRelations[contact.id] || {}
    const type = getContactType(contact)
    const status = getContactStatus(contact)
    
    const matchesSearch = contact.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         relation.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || type === selectedType
    const matchesStatus = selectedStatus === 'all' || status === selectedStatus
    return matchesSearch && matchesType && matchesStatus
  })

  const stats = [
    { label: 'Total Contacts', value: contacts.length, icon: Users, color: 'from-[#FF5A09] to-[#ec7f37]' },
    { label: 'Decision Makers', value: contacts.filter(c => getContactType(c) === 'decision_maker').length, icon: Shield, color: 'from-[#ec7f37] to-[#be4f0c]' },
    { label: 'Active Contacts', value: contacts.filter(c => getContactStatus(c) === 'active').length, icon: UserCheck, color: 'from-emerald-500 to-green-600' },
    { label: 'Engagement Rate', value: '82%', icon: ArrowRight, color: 'from-[#be4f0c] to-[#FF5A09]' }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading contacts...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Contacts</h1>
          <p className="text-white/60 mt-1">Manage your business contacts and relationships</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button 
            onClick={() => setIsImporting(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-all duration-300"
          >
            <Upload className="h-5 w-5" />
            <span>Import</span>
          </button>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            <span>New Contact</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#ec7f37]/50 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">+8%</span>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/60 mt-1">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF5A09] transition-colors"
          />
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Types</option>
          <option value="decision_maker">Decision Maker</option>
          <option value="influencer">Influencer</option>
          <option value="champion">Champion</option>
          <option value="user">User</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
          <Filter className="h-5 w-5" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Contacts List */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Company</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Contact Info</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Activity</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-medium text-white/60 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredContacts.map((contact) => {
              const type = getContactType(contact)
              const status = getContactStatus(contact)
              const TypeIcon = getTypeIcon(type)
              const email = getDynamicValue(contact.id, 'email')
              const phone = getDynamicValue(contact.id, 'phone')
              const relation = contactRelations[contact.id] || {}
              
              return (
                <tr key={contact.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${getTypeColor(type)}`}>
                        <TypeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{contact.entity_name}</p>
                        <p className="text-xs text-white/60">{contact.metadata?.title || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-white/40" />
                      <div>
                        <p className="text-sm text-white">{relation.company || 'N/A'}</p>
                        {contact.metadata?.department && (
                          <p className="text-xs text-white/60">{contact.metadata.department}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-white capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {email && (
                        <div className="flex items-center space-x-2 text-xs text-white/60">
                          <Mail className="h-3 w-3" />
                          <span>{email}</span>
                        </div>
                      )}
                      {phone && (
                        <div className="flex items-center space-x-2 text-xs text-white/60">
                          <Phone className="h-3 w-3" />
                          <span>{phone}</span>
                        </div>
                      )}
                      {relation.location && (
                        <div className="flex items-center space-x-2 text-xs text-white/60">
                          <MapPin className="h-3 w-3" />
                          <span>{relation.location}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-sm text-white">
                        2 opportunities
                      </div>
                      <div className="text-xs text-white/60">
                        5 activities
                      </div>
                      <div className="text-xs text-white/60">
                        Last: {new Date(contact.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button className="p-1 text-white/40 hover:text-[#FF5A09] transition-colors">
                        <Mail className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-white/40 hover:text-[#FF5A09] transition-colors">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-white/40 hover:text-[#FF5A09] transition-colors">
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-white/40 hover:text-white transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No contacts found</h3>
          <p className="text-white/60">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}