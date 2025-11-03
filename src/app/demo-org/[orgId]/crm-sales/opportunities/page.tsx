

/**
 * CRM Opportunities Pipeline
 * Smart Code: HERA.DEMO.CRM.OPPORTUNITIES.v1
 * 
 * Demo opportunities page for CRM Sales/Lead Management module
 */

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Filter,
  DollarSign,
  Calendar,
  TrendingUp,
  Target,
  MoreVertical,
  Users,
  Clock
} from 'lucide-react'

export default function OpportunitiesPage() {
  const params = useParams()
  const orgId = params?.orgId as string
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')

  // Demo opportunities data
  const opportunities = [
    {
      id: 'OPP-001',
      name: 'Acme ERP Implementation',
      company: 'Acme Corporation',
      contact: 'John Doe',
      stage: 'Proposal',
      amount: 250000,
      probability: 70,
      expectedClose: '2024-03-31',
      owner: 'Alice Johnson',
      created: '2024-01-15',
      lastActivity: '2 days ago',
      description: 'Complete ERP system implementation for growing technology company',
      nextSteps: 'Prepare technical proposal and pricing',
      competitorInfo: 'Competing against SAP and Oracle',
      tags: ['ERP', 'Technology', 'High-Value']
    },
    {
      id: 'OPP-002',
      name: 'Global Manufacturing Upgrade',
      company: 'Global Manufacturing Inc',
      contact: 'Sarah Wilson',
      stage: 'Negotiation',
      amount: 750000,
      probability: 60,
      expectedClose: '2024-04-30',
      owner: 'Bob Smith',
      created: '2024-01-10',
      lastActivity: '1 day ago',
      description: 'Manufacturing system upgrade and integration project',
      nextSteps: 'Finalize contract terms and implementation timeline',
      competitorInfo: 'No known competitors at this stage',
      tags: ['Manufacturing', 'Upgrade', 'Enterprise']
    },
    {
      id: 'OPP-003',
      name: 'RetailCo Digital Transformation',
      company: 'RetailCo',
      contact: 'Michael Torres',
      stage: 'Discovery',
      amount: 120000,
      probability: 45,
      expectedClose: '2024-05-15',
      owner: 'Alice Johnson',
      created: '2024-01-20',
      lastActivity: '5 hours ago',
      description: 'Digital transformation initiative for retail operations',
      nextSteps: 'Conduct detailed requirements analysis',
      competitorInfo: 'Early stage, competitors not yet identified',
      tags: ['Retail', 'Digital', 'Transformation']
    },
    {
      id: 'OPP-004',
      name: 'FinTech Compliance Solution',
      company: 'FinTech Solutions',
      contact: 'David Kim',
      stage: 'Qualification',
      amount: 85000,
      probability: 30,
      expectedClose: '2024-06-30',
      owner: 'Bob Smith',
      created: '2024-01-25',
      lastActivity: '1 week ago',
      description: 'Compliance and risk management solution for fintech startup',
      nextSteps: 'Schedule technical discovery call',
      competitorInfo: 'Budget constraints may be an issue',
      tags: ['FinTech', 'Compliance', 'Startup']
    }
  ]

  const stages = [
    { name: 'Qualification', color: 'bg-blue-100 text-blue-800', count: 1 },
    { name: 'Discovery', color: 'bg-yellow-100 text-yellow-800', count: 1 },
    { name: 'Proposal', color: 'bg-orange-100 text-orange-800', count: 1 },
    { name: 'Negotiation', color: 'bg-green-100 text-green-800', count: 1 },
    { name: 'Closed Won', color: 'bg-green-200 text-green-900', count: 0 },
    { name: 'Closed Lost', color: 'bg-red-100 text-red-800', count: 0 }
  ]

  const getStageColor = (stage: string) => {
    const stageObj = stages.find(s => s.name === stage)
    return stageObj?.color || 'bg-gray-100 text-gray-800'
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return 'text-green-600'
    if (probability >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const totalPipelineValue = opportunities.reduce((sum, opp) => sum + opp.amount, 0)
  const weightedValue = opportunities.reduce((sum, opp) => sum + (opp.amount * opp.probability / 100), 0)

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Pipeline</h1>
          <p className="text-gray-600">Manage opportunities and track sales progress</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'pipeline' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
          <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>New Opportunity</span>
          </button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
          <div className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Total Pipeline</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            ${totalPipelineValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Weighted Value</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            ${Math.round(weightedValue).toLocaleString()}
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Active Opportunities</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {opportunities.length}
          </div>
        </div>
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-600">Avg. Deal Size</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            ${Math.round(totalPipelineValue / opportunities.length).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search opportunities by name, company, or owner..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>All Stages</option>
              {stages.map(stage => (
                <option key={stage.name}>{stage.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex overflow-x-auto space-x-4 pb-4">
            {stages.map((stage) => (
              <div key={stage.name} className="min-w-80 flex-shrink-0">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">{stage.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${stage.color}`}>
                      {stage.count}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {opportunities
                      .filter(opp => opp.stage === stage.name)
                      .map((opportunity) => (
                        <div key={opportunity.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900 text-sm">{opportunity.name}</h4>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <MoreVertical className="h-3 w-3 text-gray-400" />
                            </button>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{opportunity.company}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>{opportunity.contact}</span>
                            <span>{opportunity.owner}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-900">${opportunity.amount.toLocaleString()}</span>
                            <span className={`text-xs font-medium ${getProbabilityColor(opportunity.probability)}`}>
                              {opportunity.probability}%
                            </span>
                          </div>
                          <div className="flex items-center text-xs text-gray-500 mt-2">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{opportunity.expectedClose}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opportunity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Probability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Close Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {opportunities.map((opportunity) => (
                  <tr key={opportunity.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{opportunity.name}</div>
                        <div className="text-sm text-gray-500">{opportunity.company}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStageColor(opportunity.stage)}`}>
                        {opportunity.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${opportunity.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getProbabilityColor(opportunity.probability)}`}>
                        {opportunity.probability}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {opportunity.expectedClose}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {opportunity.owner}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {opportunity.lastActivity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200/50">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Pipeline Insights</h3>
            <p className="text-sm text-gray-600">Recommendations to optimize your sales pipeline</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/70 p-4 rounded-lg">
            <div className="font-medium text-gray-900 mb-1">Next Best Action</div>
            <div className="text-sm text-gray-600">Focus on Acme Corp proposal - high probability of closing this quarter</div>
          </div>
          <div className="bg-white/70 p-4 rounded-lg">
            <div className="font-medium text-gray-900 mb-1">Risk Alert</div>
            <div className="text-sm text-gray-600">FinTech opportunity has been stale for 1 week - schedule follow-up</div>
          </div>
          <div className="bg-white/70 p-4 rounded-lg">
            <div className="font-medium text-gray-900 mb-1">Forecast</div>
            <div className="text-sm text-gray-600">Predicted to close $370K this quarter based on current pipeline</div>
          </div>
        </div>
      </div>
    </div>
  )
}