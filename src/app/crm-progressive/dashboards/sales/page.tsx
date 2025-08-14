'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Target, DollarSign, TrendingUp, BarChart3, Users, Trophy,
  Calendar, Clock, Filter, Plus, ChevronRight, Briefcase,
  TrendingDown, Activity, PieChart, Home, CheckSquare
} from 'lucide-react'
import Link from 'next/link'
import { CRMLayout } from '@/components/layout/crm-layout'

const stages = [
  { value: 'lead', label: 'Lead', color: 'bg-gray-500', textColor: 'text-gray-600' },
  { value: 'qualified', label: 'Qualified', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { value: 'discovery', label: 'Discovery', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { value: 'proposal', label: 'Proposal', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-purple-500', textColor: 'text-purple-600' },
  { value: 'closed_won', label: 'Closed Won', color: 'bg-green-500', textColor: 'text-green-600' },
  { value: 'closed_lost', label: 'Closed Lost', color: 'bg-red-500', textColor: 'text-red-600' }
]

const opportunities = [
  {
    id: 1,
    name: 'Tech Solutions - Q1 Implementation',
    contact: 'Sarah Johnson',
    company: 'Tech Solutions Inc',
    stage: 'proposal',
    value: 25000,
    closeDate: '2024-02-15',
    probability: 75,
    owner: 'John Smith',
    daysInStage: 5
  },
  {
    id: 2,
    name: 'StartupCo - Pilot Program',
    contact: 'Mike Chen',
    company: 'StartupCo',
    stage: 'discovery',
    value: 5000,
    closeDate: '2024-03-01',
    probability: 25,
    owner: 'Jane Doe',
    daysInStage: 12
  },
  {
    id: 3,
    name: 'Global Enterprises - Enterprise License',
    contact: 'Emily Rodriguez',
    company: 'Global Enterprises',
    stage: 'negotiation',
    value: 50000,
    closeDate: '2024-01-30',
    probability: 90,
    owner: 'John Smith',
    daysInStage: 3
  },
  {
    id: 4,
    name: 'Retail Corp - Annual Contract',
    contact: 'David Lee',
    company: 'Retail Corp',
    stage: 'qualified',
    value: 35000,
    closeDate: '2024-02-28',
    probability: 40,
    owner: 'Jane Doe',
    daysInStage: 8
  },
  {
    id: 5,
    name: 'Finance Plus - Software Upgrade',
    contact: 'Lisa Wang',
    company: 'Finance Plus',
    stage: 'lead',
    value: 15000,
    closeDate: '2024-03-15',
    probability: 20,
    owner: 'Mike Johnson',
    daysInStage: 2
  }
]

export default function SalesDashboard() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  
  // Calculate metrics
  const totalPipeline = opportunities.reduce((sum, opp) => sum + opp.value, 0)
  const weightedPipeline = opportunities.reduce((sum, opp) => sum + (opp.value * opp.probability / 100), 0)
  const avgDealSize = totalPipeline / opportunities.length
  const winRate = 0.68 // Would be calculated from historical data
  
  // Sales metrics by stage
  const stageMetrics = stages.map(stage => {
    const stageOpps = opportunities.filter(opp => opp.stage === stage.value)
    return {
      ...stage,
      count: stageOpps.length,
      totalValue: stageOpps.reduce((sum, opp) => sum + opp.value, 0),
      opportunities: stageOpps
    }
  })

  // Top performers (mock data)
  const topPerformers = [
    { name: 'John Smith', deals: 12, revenue: 185000, winRate: 0.75 },
    { name: 'Jane Doe', deals: 8, revenue: 98000, winRate: 0.62 },
    { name: 'Mike Johnson', deals: 5, revenue: 45000, winRate: 0.58 }
  ]

  return (
    <CRMLayout>
      <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Link href="/crm-progressive" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Home className="h-4 w-4" />
            CRM Hub
          </Link>
          <span className="text-gray-400">→</span>
          <span className="text-gray-600">Sales Dashboard</span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Pipeline management and revenue tracking</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/crm-progressive/dashboards/main">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Executive View</span>
                <span className="sm:hidden">Executive</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/crm-progressive/dashboards/tasks">
                <CheckSquare className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Tasks</span>
                <span className="sm:hidden">Tasks</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">New Deal</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>

        {/* Revenue Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Pipeline</p>
                  <p className="text-2xl font-bold">${totalPipeline.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{opportunities.length} deals</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Weighted Pipeline</p>
                  <p className="text-2xl font-bold">${weightedPipeline.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">By probability</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <PieChart className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Deal Size</p>
                  <p className="text-2xl font-bold">${avgDealSize.toLocaleString()}</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +15% vs last month
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Win Rate</p>
                  <p className="text-2xl font-bold">{(winRate * 100).toFixed(0)}%</p>
                  <p className="text-xs text-gray-500 mt-1">Last 90 days</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pipeline Stages */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Sales Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
              {stageMetrics.map((stage, index) => (
                <div
                  key={stage.value}
                  className={`rounded-lg p-4 cursor-pointer transition-all ${
                    selectedStage === stage.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                  } ${(stage.value === 'closed_won' || stage.value === 'closed_lost') ? 'bg-gray-50' : 'bg-white border'}`}
                  onClick={() => setSelectedStage(stage.value)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-semibold text-sm ${stage.textColor}`}>
                      {stage.label}
                    </h3>
                    <Badge className={`${stage.color} text-white`}>
                      {stage.count}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold mb-1">
                    ${(stage.totalValue / 1000).toFixed(0)}K
                  </p>
                  <Progress 
                    value={(stage.totalValue / totalPipeline) * 100} 
                    className="h-2"
                  />
                  
                  {/* Mini opportunity cards */}
                  <div className="mt-3 space-y-2">
                    {stage.opportunities.slice(0, 2).map(opp => (
                      <div key={opp.id} className="text-xs p-2 bg-gray-50 rounded">
                        <p className="font-medium truncate">{opp.name}</p>
                        <p className="text-gray-500">${(opp.value / 1000).toFixed(0)}K</p>
                      </div>
                    ))}
                    {stage.opportunities.length > 2 && (
                      <p className="text-xs text-center text-gray-500">
                        +{stage.opportunities.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed View and Top Performers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Opportunity Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Active Opportunities
                </CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/crm?tab=opportunities">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opportunities.map(opp => {
                    const stage = stages.find(s => s.value === opp.stage)
                    if (!stage) return null
                    return (
                      <div key={opp.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold">{opp.name}</h4>
                            <p className="text-sm text-gray-600">{opp.company} • {opp.contact}</p>
                          </div>
                          <Badge className={`${stage.color} text-white`}>
                            {stage.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                          <div>
                            <p className="text-gray-500">Value</p>
                            <p className="font-semibold">${opp.value.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Close Date</p>
                            <p className="font-semibold">{opp.closeDate}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Probability</p>
                            <p className="font-semibold">{opp.probability}%</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Days in Stage</p>
                            <p className="font-semibold">{opp.daysInStage}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm text-gray-500">Owner: {opp.owner}</span>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{performer.name}</h4>
                      {index === 0 && <Badge className="bg-yellow-500">🏆 #1</Badge>}
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Revenue</span>
                        <span className="font-semibold">${performer.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Deals Closed</span>
                        <span className="font-semibold">{performer.deals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Win Rate</span>
                        <span className="font-semibold">{(performer.winRate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Sales Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span>Deal moved to Negotiation</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">Global Enterprises • 1 hour ago</p>
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Plus className="h-4 w-4" />
                    <span>New opportunity created</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">Retail Corp • 3 hours ago</p>
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-purple-600">
                    <Calendar className="h-4 w-4" />
                    <span>Demo scheduled</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-6">Tech Solutions • 5 hours ago</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </CRMLayout>
  )
}