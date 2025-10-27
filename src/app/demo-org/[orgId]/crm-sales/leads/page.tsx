'use client'

/**
 * CRM Leads Management
 * Smart Code: HERA.DEMO.CRM.LEADS.v1
 * 
 * Demo leads page for CRM Sales/Lead Management module
 */

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Filter, 
  Star,
  Mail,
  Phone,
  Building2,
  TrendingUp,
  UserPlus,
  MoreVertical
} from 'lucide-react'

export default function LeadsPage() {
  const params = useParams()
  const orgId = params?.orgId as string
  const [selectedLead, setSelectedLead] = useState<any>(null)

  // Demo leads data
  const leads = [
    {
      id: 'LEAD-001',
      name: 'Emily Chen',
      email: 'emily.chen@startup.com',
      phone: '+1-555-2001',
      company: 'TechStart Inc',
      title: 'CTO',
      score: 85,
      source: 'Website',
      status: 'New',
      value: '$45,000',
      created: '2024-01-15',
      notes: 'Interested in scalable ERP solution for growing startup',
      activities: 3,
      qualification_level: 'High'
    },
    {
      id: 'LEAD-002',
      name: 'Michael Torres',
      email: 'michael.torres@retailco.com',
      phone: '+1-555-2002',
      company: 'RetailCo',
      title: 'Operations Director',
      score: 92,
      source: 'Referral',
      status: 'Qualified',
      value: '$120,000',
      created: '2024-01-12',
      notes: 'Referred by existing customer, ready to move forward',
      activities: 7,
      qualification_level: 'Very High'
    },
    {
      id: 'LEAD-003',
      name: 'Sarah Wilson',
      email: 'sarah.wilson@global-mfg.com',
      phone: '+1-555-2003',
      company: 'Global Manufacturing',
      title: 'VP Operations',
      score: 78,
      source: 'Trade Show',
      status: 'Contacted',
      value: '$750,000',
      created: '2024-01-10',
      notes: 'Large enterprise opportunity, long sales cycle expected',
      activities: 5,
      qualification_level: 'High'
    },
    {
      id: 'LEAD-004',
      name: 'David Kim',
      email: 'david.kim@fintech.io',
      phone: '+1-555-2004',
      company: 'FinTech Solutions',
      title: 'Head of Technology',
      score: 67,
      source: 'LinkedIn',
      status: 'Nurturing',
      value: '$85,000',
      created: '2024-01-08',
      notes: 'Early stage fintech, budget constraints mentioned',
      activities: 2,
      qualification_level: 'Medium'
    }
  ]

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-orange-600 bg-orange-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'text-blue-600 bg-blue-100'
      case 'Qualified': return 'text-green-600 bg-green-100'
      case 'Contacted': return 'text-orange-600 bg-orange-100'
      case 'Nurturing': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads Management</h1>
          <p className="text-gray-600">Capture, qualify, and convert leads to customers</p>
        </div>
        <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>New Lead</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads by name, company, or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Sources</option>
              <option>Website</option>
              <option>Referral</option>
              <option>Trade Show</option>
              <option>LinkedIn</option>
            </select>
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Statuses</option>
              <option>New</option>
              <option>Qualified</option>
              <option>Contacted</option>
              <option>Nurturing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {leads.map((lead) => (
          <div 
            key={lead.id} 
            className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 hover:shadow-lg transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedLead(lead)}
          >
            {/* Lead Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{lead.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${getScoreColor(lead.score)}`}>
                    {lead.score}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{lead.title}</p>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Building2 className="h-3 w-3" />
                  <span>{lead.company}</span>
                </div>
              </div>
              <button className="p-1 hover:bg-gray-100 rounded">
                <MoreVertical className="h-4 w-4 text-gray-400" />
              </button>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-3 w-3" />
                <span>{lead.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
              </div>
            </div>

            {/* Status and Value */}
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
              <span className="text-sm font-semibold text-gray-900">{lead.value}</span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50/50 rounded-lg">
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">{lead.activities}</div>
                <div className="text-xs text-gray-500">Activities</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">{lead.source}</div>
                <div className="text-xs text-gray-500">Source</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-900">{lead.qualification_level}</div>
                <div className="text-xs text-gray-500">Quality</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <button className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                Qualify
              </button>
              <button className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                Convert
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Insights Panel */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Lead Insights</h3>
            <p className="text-sm text-gray-600">Powered by HERA AI Assistant</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/70 p-4 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">24.8%</div>
            <div className="text-sm text-gray-600">Lead conversion rate this month</div>
            <div className="text-xs text-green-600 mt-1">↑ 4.3% from last month</div>
          </div>
          <div className="bg-white/70 p-4 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">3.2 days</div>
            <div className="text-sm text-gray-600">Average response time</div>
            <div className="text-xs text-green-600 mt-1">↓ 18% improvement</div>
          </div>
          <div className="bg-white/70 p-4 rounded-lg">
            <div className="text-lg font-semibold text-gray-900">$127K</div>
            <div className="text-sm text-gray-600">Average deal value</div>
            <div className="text-xs text-green-600 mt-1">↑ 12% increase</div>
          </div>
        </div>
      </div>

      {/* Demo Instructions */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200/50">
        <h3 className="font-semibold text-gray-900 mb-3">Demo Features Available</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-700">4-Step Lead Creation Wizard</span>
          </div>
          <div className="flex items-center space-x-3">
            <Star className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-700">AI-Powered Lead Scoring</span>
          </div>
          <div className="flex items-center space-x-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm text-gray-700">Automated Qualification Workflows</span>
          </div>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedLead.name}</h2>
                <p className="text-gray-600">{selectedLead.company} • {selectedLead.title}</p>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{selectedLead.notes}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Score</label>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${getScoreColor(selectedLead.score)}`}>
                    {selectedLead.score}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(selectedLead.status)}`}>
                    {selectedLead.status}
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Qualify Lead
                </button>
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Convert to Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}