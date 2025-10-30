'use client'

/**
 * CRM Sales Dashboard
 * Smart Code: HERA.DEMO.CRM.DASHBOARD.v1
 * 
 * Demo dashboard for CRM Sales/Lead Management module
 */

import React from 'react'
import { useParams } from 'next/navigation'
import { 
  TrendingUp, 
  Users, 
  Target, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Award
} from 'lucide-react'

export default function CRMDashboard() {
  const params = useParams()
  const orgId = params?.orgId as string

  // Demo metrics
  const metrics = [
    {
      title: 'Total Revenue',
      value: '$1,247,500',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Active Leads',
      value: '247',
      change: '+8.2%',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Opportunities',
      value: '38',
      change: '-2.1%',
      trend: 'down',
      icon: Target,
      color: 'orange'
    },
    {
      title: 'Conversion Rate',
      value: '24.8%',
      change: '+4.3%',
      trend: 'up',
      icon: Award,
      color: 'purple'
    }
  ]

  const recentActivity = [
    {
      id: 1,
      type: 'lead',
      title: 'New lead from TechStart Inc',
      description: 'Emily Chen submitted contact form',
      time: '2 hours ago',
      status: 'new'
    },
    {
      id: 2,
      type: 'opportunity',
      title: 'Acme Corp opportunity updated',
      description: 'Moved to proposal stage - $250K',
      time: '4 hours ago',
      status: 'progress'
    },
    {
      id: 3,
      type: 'quote',
      title: 'Quote generated for Global Mfg',
      description: 'Manufacturing upgrade quote sent',
      time: '6 hours ago',
      status: 'sent'
    },
    {
      id: 4,
      type: 'customer',
      title: 'RetailCo converted to customer',
      description: 'Michael Torres signed contract',
      time: '1 day ago',
      status: 'success'
    }
  ]

  const topLeads = [
    {
      name: 'Emily Chen',
      company: 'TechStart Inc',
      score: 85,
      value: '$45,000',
      stage: 'Qualified'
    },
    {
      name: 'Michael Torres',
      company: 'RetailCo',
      score: 92,
      value: '$120,000',
      stage: 'Negotiation'
    },
    {
      name: 'Sarah Wilson',
      company: 'Global Manufacturing',
      score: 78,
      value: '$750,000',
      stage: 'Proposal'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
          <p className="text-gray-600">Sales performance and pipeline overview</p>
        </div>
        <div className="text-sm text-gray-500">
          Demo Organization: {orgId}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const TrendIcon = metric.trend === 'up' ? ArrowUpRight : ArrowDownRight
          
          return (
            <div key={metric.title} className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg bg-${metric.color}-100`}>
                  <Icon className={`h-6 w-6 text-${metric.color}-600`} />
                </div>
                <div className={`flex items-center text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <TrendIcon className="h-4 w-4 mr-1" />
                  {metric.change}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                <div className="text-sm text-gray-600">{metric.title}</div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === 'new' ? 'bg-blue-500' :
                  activity.status === 'progress' ? 'bg-orange-500' :
                  activity.status === 'sent' ? 'bg-purple-500' :
                  'bg-green-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Leads */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-gray-200/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Leads</h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {topLeads.map((lead, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{lead.name}</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      lead.score >= 90 ? 'bg-green-100 text-green-700' :
                      lead.score >= 80 ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {lead.score}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{lead.company}</p>
                  <p className="text-xs text-gray-500">{lead.stage}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{lead.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Demo Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Demo Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors text-left">
            <div className="font-medium text-gray-900">Create New Lead</div>
            <div className="text-sm text-gray-600">Add a lead using the Master Data Wizard</div>
          </button>
          <button className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors text-left">
            <div className="font-medium text-gray-900">Generate Quote</div>
            <div className="text-sm text-gray-600">Create AI-powered quotes for opportunities</div>
          </button>
          <button className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors text-left">
            <div className="font-medium text-gray-900">View Pipeline</div>
            <div className="text-sm text-gray-600">Manage sales opportunities and stages</div>
          </button>
        </div>
      </div>
    </div>
  )
}