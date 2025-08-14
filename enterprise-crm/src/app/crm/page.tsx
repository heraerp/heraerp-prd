'use client'

import React, { useState, useEffect } from 'react'
import { UniversalTourProvider, TourElement } from '@/components/tours/UniversalTourProvider'
import { 
  Users, Building, DollarSign, TrendingUp, Search, 
  Bell, MoreHorizontal, Plus, Filter, Download
} from 'lucide-react'

export default function EnterpriseCRMPage() {
  const [contacts, setContacts] = useState([])
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  // Demo data - TechVantage Solutions
  const demoStats = {
    totalRevenue: '$1.6M',
    activeDeals: '8',
    conversionRate: '23.5%',
    avgDealSize: '$187K'
  }

  const demoContacts = [
    { 
      id: 1, 
      name: 'Michael Thompson', 
      company: 'Global Manufacturing Inc',
      email: 'mthompson@globalmanuf.com',
      phone: '+1 (555) 123-4567',
      dealValue: '$750,000',
      stage: 'Proposal',
      probability: '85%'
    },
    {
      id: 2,
      name: 'Sarah Chen', 
      company: 'AI Innovations Corp',
      email: 'schen@aiinnovations.com',
      phone: '+1 (555) 234-5678',
      dealValue: '$450,000', 
      stage: 'Discovery',
      probability: '45%'
    },
    {
      id: 3,
      name: 'David Rodriguez',
      company: 'Healthcare Systems LLC', 
      email: 'drodriguez@healthsystems.com',
      phone: '+1 (555) 345-6789',
      dealValue: '$320,000',
      stage: 'Negotiation',
      probability: '90%'
    },
    {
      id: 4,
      name: 'Emma Wilson',
      company: 'Retail Excellence Group',
      email: 'ewilson@retailexcellence.com', 
      phone: '+1 (555) 456-7890',
      dealValue: '$180,000',
      stage: 'Qualified',
      probability: '60%'
    }
  ]

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setContacts(demoContacts)
      setLoading(false)
    }, 800)
  }, [])

  return (
    <UniversalTourProvider industryKey="enterprise-crm" autoStart={true}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        {/* Header */}
        <TourElement tourId="crm-header">
          <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Enterprise CRM
                  </h1>
                  <p className="text-gray-600 mt-1">TechVantage Solutions Demo Environment</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <Search className="w-5 h-5 text-gray-600" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreHorizontal className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <TourElement tourId="crm-metrics">
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                    <p className="text-sm text-blue-600 mb-1">Total Pipeline</p>
                    <p className="text-2xl font-bold text-blue-900">{demoStats.totalRevenue}</p>
                    <p className="text-sm text-blue-600 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +15.3%
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                    <p className="text-sm text-green-600 mb-1">Active Deals</p>
                    <p className="text-2xl font-bold text-green-900">{demoStats.activeDeals}</p>
                    <p className="text-sm text-green-600">High Quality</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                    <p className="text-sm text-purple-600 mb-1">Conversion Rate</p>
                    <p className="text-2xl font-bold text-purple-900">{demoStats.conversionRate}</p>
                    <p className="text-sm text-purple-600">Above Target</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                    <p className="text-sm text-orange-600 mb-1">Avg Deal Size</p>
                    <p className="text-2xl font-bold text-orange-900">{demoStats.avgDealSize}</p>
                    <p className="text-sm text-orange-600">Enterprise Focus</p>
                  </div>
                </div>
              </TourElement>
            </div>
          </header>
        </TourElement>

        {/* Main Content */}
        <main className="p-8">
          {/* Action Bar */}
          <TourElement tourId="crm-actions">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Sales Pipeline</h2>
                <p className="text-gray-600">TechVantage Solutions - Live Demo Data</p>
              </div>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
                  <Plus className="w-4 h-4" />
                  New Deal
                </button>
              </div>
            </div>
          </TourElement>

          {/* Contacts/Deals Grid */}
          <TourElement tourId="crm-pipeline">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading enterprise demo data...</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-7 gap-4 text-sm font-medium text-gray-600">
                      <div>Contact</div>
                      <div>Company</div>
                      <div>Deal Value</div>
                      <div>Stage</div>
                      <div>Probability</div>
                      <div>Contact Info</div>
                      <div>Actions</div>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-gray-100">
                    {contacts.map((contact) => (
                      <div key={contact.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-7 gap-4 items-center">
                          <div>
                            <p className="font-semibold text-gray-900">{contact.name}</p>
                            <p className="text-sm text-gray-500">Primary Contact</p>
                          </div>
                          <div>
                            <p className="text-gray-900">{contact.company}</p>
                            <p className="text-sm text-gray-500">Enterprise</p>
                          </div>
                          <div>
                            <p className="font-semibold text-green-600">{contact.dealValue}</p>
                            <p className="text-sm text-gray-500">Multi-year</p>
                          </div>
                          <div>
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {contact.stage}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{contact.probability}</p>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full" 
                                style={{ width: contact.probability }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">{contact.email}</p>
                            <p className="text-sm text-gray-500">{contact.phone}</p>
                          </div>
                          <div>
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              View Deal
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TourElement>

          {/* Performance Showcase */}
          <TourElement tourId="performance-metrics">
            <div className="mt-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold mb-2">🏆 Performance Benchmark</h3>
                  <p className="text-green-100">43% faster than Salesforce • 92% UAT Success Rate • A+ Grade</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">1.8s</p>
                  <p className="text-green-100">Avg Load Time</p>
                  <p className="text-sm text-green-200">vs 3.5s Salesforce</p>
                </div>
              </div>
            </div>
          </TourElement>
        </main>
      </div>
    </UniversalTourProvider>
  )
}