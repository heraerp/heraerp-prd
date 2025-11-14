'use client'

import React, { useEffect, useState } from 'react'
import { SapNavbar } from '@/components/sap/SapNavbar'
import { Search, Filter, Eye, Sliders, Grid, BarChart, Table, ExternalLink, ChevronDown, Plus, Users, Target, Phone, Mail, Calendar, TrendingUp } from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { playbookCrmApi } from '@/lib/api/playbook-crm'
import { legacyCrmApi } from '@/lib/api/legacy-crm'
import { flags } from '@/lib/flags'

export default function CRMDashboardPage() {
  const { currentOrganization, isAuthenticated } = useHERAAuth()
  const [selectedItems, setSelectedItems] = React.useState<string[]>([])
  const [showAdvancedView, setShowAdvancedView] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [stats, setStats] = React.useState<any>(null)

  // Sample CRM data - to be replaced with real HERA API calls
  const leadsData = [
    {
      id: 'LEAD-001',
      name: 'Acme Corp',
      contact: 'John Smith',
      email: 'john@acme.com',
      phone: '+1-555-0123',
      value: 150000,
      stage: 'Qualification',
      probability: 75,
      source: 'Website',
      assignedTo: 'Sarah Wilson',
      lastActivity: '2024-01-15',
      status: 'Hot'
    },
    {
      id: 'LEAD-002', 
      name: 'TechStart Inc',
      contact: 'Maria Rodriguez',
      email: 'maria@techstart.com',
      phone: '+1-555-0456',
      value: 85000,
      stage: 'Prospecting',
      probability: 25,
      source: 'Referral',
      assignedTo: 'Mike Johnson',
      lastActivity: '2024-01-14',
      status: 'Warm'
    },
    {
      id: 'LEAD-003',
      name: 'Global Solutions',
      contact: 'David Chen',
      email: 'david@globalsol.com', 
      phone: '+1-555-0789',
      value: 220000,
      stage: 'Proposal',
      probability: 60,
      source: 'Cold Call',
      assignedTo: 'Sarah Wilson',
      lastActivity: '2024-01-13',
      status: 'Hot'
    },
    {
      id: 'LEAD-004',
      name: 'Startup Labs',
      contact: 'Lisa Park',
      email: 'lisa@startuplabs.io',
      phone: '+1-555-0321',
      value: 45000,
      stage: 'Negotiation',
      probability: 90,
      source: 'Trade Show',
      assignedTo: 'Mike Johnson',
      lastActivity: '2024-01-12',
      status: 'Hot'
    }
  ]

  // KPI data for scatter plot visualization
  const generateKPIData = () => {
    const data = []
    
    // Hot Leads (red)
    for (let i = 0; i < 12; i++) {
      data.push({
        x: Math.random() * 100,
        y: Math.random() * 120 + 30,
        status: 'hot',
        value: Math.random() * 200000 + 50000
      })
    }
    
    // Warm Leads (orange)
    for (let i = 0; i < 18; i++) {
      data.push({
        x: Math.random() * 100,
        y: Math.random() * 80 + 10,
        status: 'warm',
        value: Math.random() * 150000 + 20000
      })
    }
    
    // Cold Leads (blue)
    for (let i = 0; i < 25; i++) {
      data.push({
        x: Math.random() * 100,
        y: Math.random() * 60,
        status: 'cold',
        value: Math.random() * 100000
      })
    }
    
    return data
  }

  const kpiData = generateKPIData()

  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hot':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'Warm':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Cold':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Prospecting':
        return 'bg-gray-500'
      case 'Qualification':
        return 'bg-blue-500'
      case 'Proposal':
        return 'bg-yellow-500'
      case 'Negotiation':
        return 'bg-orange-500'
      case 'Closed Won':
        return 'bg-green-500'
      default:
        return 'bg-gray-400'
    }
  }

  // Load real CRM data when component mounts
  React.useEffect(() => {
    const loadCRMData = async () => {
      if (!currentOrganization?.id) return
      
      try {
        setIsLoading(true)
        const orgId = currentOrganization.id
        const api = flags['crm.playbook.enabled'] ? playbookCrmApi : legacyCrmApi
        
        // Load basic stats
        const [leads, opportunities] = await Promise.all([
          (api as any).leads?.({ orgId, page: 1, pageSize: 50 }) ?? { items: [], total: 0 },
          api.opportunities({ orgId, page: 1, pageSize: 50 })
        ])
        
        setStats({
          totalLeads: leads.total,
          totalOpportunities: opportunities.total,
          pipelineValue: opportunities.items.reduce((sum: number, opp: any) => sum + (opp.amount || 0), 0)
        })
      } catch (error) {
        console.error('Error loading CRM data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (isAuthenticated && currentOrganization) {
      loadCRMData()
    }
  }, [currentOrganization, isAuthenticated])

  return (
    <div className="sap-font min-h-screen bg-gray-50">
      {/* SAP Fiori Navbar */}
      <SapNavbar 
        title="HERA" 
        breadcrumb="CRM Dashboard"
        showBack={true}
        userInitials="EG"
        showSearch={true}
      />
      
      <main className="mt-12 min-h-[calc(100vh-48px)] bg-gray-50">
        {/* Page Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg font-medium text-gray-900">Sales Pipeline</span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
          
          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Lead Status:</label>
              <div className="relative">
                <select className="w-full border border-gray-300 rounded px-3 py-3 text-sm bg-white touch-manipulation">
                  <option value="">All Status</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Sales Stage:</label>
              <div className="relative">
                <select className="w-full border border-gray-300 rounded px-3 py-3 text-sm bg-white touch-manipulation">
                  <option value="">All Stages</option>
                  <option value="prospecting">Prospecting</option>
                  <option value="qualification">Qualification</option>
                  <option value="proposal">Proposal</option>
                  <option value="negotiation">Negotiation</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Assigned To:</label>
              <div className="relative">
                <select className="w-full border border-gray-300 rounded px-3 py-3 text-sm bg-white touch-manipulation">
                  <option value="">All Team Members</option>
                  <option value="sarah">Sarah Wilson</option>
                  <option value="mike">Mike Johnson</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600 font-medium">Lead Source:</label>
              <div className="relative">
                <select className="w-full border border-gray-300 rounded px-3 py-3 text-sm bg-white touch-manipulation">
                  <option value="">All Sources</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="cold-call">Cold Call</option>
                  <option value="trade-show">Trade Show</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
            <button className="text-blue-600 text-sm flex items-center justify-center gap-1 hover:text-blue-800 py-2 px-3 rounded border border-blue-200 hover:bg-blue-50 transition-colors">
              <Filter className="w-4 h-4" />
              Adapt Filters
            </button>
            <button className="bg-blue-600 text-white px-6 py-3 rounded text-sm hover:bg-blue-700 transition-colors font-medium">
              Go
            </button>
            <button className="bg-green-600 text-white px-6 py-3 rounded text-sm hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Lead
            </button>
          </div>
        </div>

        {/* CRM Analytics Chart Section */}
        <div className="px-3 sm:px-6 py-4 sm:py-6">
          <div className="bg-white rounded-lg border border-gray-200 mb-6 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-medium text-gray-900 text-lg">Sales Performance Analytics</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button 
                    onClick={() => setShowAdvancedView(!showAdvancedView)}
                    className={`text-sm px-3 py-2 rounded transition-colors ${
                      showAdvancedView 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-blue-600 hover:bg-blue-50 border border-blue-200'
                    }`}
                  >
                    Advanced Analytics
                  </button>
                  <span className="text-sm text-gray-500 hidden sm:block">Pipeline View</span>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Grid className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Search className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-blue-600 text-white rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <BarChart className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Table className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pipeline Analytics Chart */}
            <div className="p-3 sm:p-6">
              <div className="relative">
                <div className="hidden sm:block">
                  <svg width="100%" height="300" className="border border-gray-200 bg-gray-50 rounded">
                    {/* Grid lines */}
                    <defs>
                      <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    
                    {/* Y-axis labels */}
                    <text x="10" y="25" className="text-xs fill-gray-600">$250K</text>
                    <text x="10" y="85" className="text-xs fill-gray-600">$150K</text>
                    <text x="10" y="145" className="text-xs fill-gray-600">$100K</text>
                    <text x="10" y="205" className="text-xs fill-gray-600">$50K</text>
                    
                    {/* X-axis label */}
                    <text x="45" y="290" className="text-xs fill-gray-600">Lead Quality Score</text>
                    
                    {/* Center label */}
                    <text x="50%" y="160" className="text-sm fill-gray-400 text-anchor-middle">Deal Value vs Lead Score</text>
                    
                    {/* Scatter points for CRM data */}
                    {kpiData.map((point, index) => (
                      <circle
                        key={index}
                        cx={60 + point.x * 8}
                        cy={260 - point.y * 2}
                        r={point.value > 100000 ? 6 : 4}
                        fill={
                          point.status === 'hot' ? '#dc2626' :
                          point.status === 'warm' ? '#ea580c' :
                          '#2563eb'
                        }
                        opacity={0.7}
                        className="hover:opacity-100 cursor-pointer"
                      />
                    ))}
                  </svg>
                </div>
                
                {/* Mobile Chart Placeholder */}
                <div className="sm:hidden bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <BarChart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-2">Sales Analytics</p>
                  <p className="text-xs text-gray-500">Tap to view interactive pipeline chart</p>
                </div>
                
                {/* Legend */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">Hot Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">Warm Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-sm text-gray-600">Cold Leads</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CRM Leads Table */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-medium text-gray-900 text-lg">Active Leads ({leadsData.length})</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors">
                    Export Pipeline
                  </button>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-blue-600 text-white rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Table className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded min-w-[36px] min-h-[36px] flex items-center justify-center">
                      <Sliders className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-8 px-4 py-3 text-left">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(leadsData.map(lead => lead.id))
                          } else {
                            setSelectedItems([])
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Lead
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Probability
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      Assigned To
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leadsData.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded"
                          checked={selectedItems.includes(lead.id)}
                          onChange={() => handleItemSelect(lead.id)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                            {lead.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{lead.id}</div>
                          <div className="text-xs text-gray-500">Source: {lead.source}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white ${getStageColor(lead.stage)}`}>
                          {lead.stage}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{lead.contact}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ${lead.value.toLocaleString('en-US')}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all duration-500"
                              style={{ width: `${lead.probability}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 ml-2">{lead.probability}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 border text-xs font-medium rounded ${getStatusColor(lead.status)}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
                            {lead.assignedTo.split(' ').map(n => n[0]).join('')}
                          </div>
                          {lead.assignedTo}
                        </div>
                        <div className="text-xs text-gray-500">Last: {lead.lastActivity}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {leadsData.map((lead) => (
                <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        className="rounded mt-1"
                        checked={selectedItems.includes(lead.id)}
                        onChange={() => handleItemSelect(lead.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer text-sm">
                          {lead.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-1">{lead.id}</div>
                        <div className="text-xs text-gray-500">Contact: {lead.contact}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white ${getStageColor(lead.stage)}`}>
                        {lead.stage}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 border text-xs font-medium rounded ${getStatusColor(lead.status)}`}>
                        {lead.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Value</div>
                      <div className="text-gray-900 font-medium mt-1">${lead.value.toLocaleString('en-US')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Probability</div>
                      <div className="text-gray-900 mt-1">{lead.probability}%</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500 uppercase tracking-wide">Assigned To</div>
                      <div className="text-gray-900 mt-1 flex items-center gap-2">
                        <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
                          {lead.assignedTo.split(' ').map(n => n[0]).join('')}
                        </div>
                        {lead.assignedTo}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}