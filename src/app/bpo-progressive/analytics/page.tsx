'use client'

import React, { useState } from 'react'
import { BPOManagementSidebar } from '@/components/bpo-progressive/BPOManagementSidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  BarChart3, TrendingUp, TrendingDown, Clock, AlertTriangle,
  CheckCircle, Users, FileText, DollarSign, Target,
  Download, RefreshCw, Calendar, Eye, Sparkles,
  Activity, Zap, Award, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { BPOKPIs } from '@/lib/bpo/bpo-entities'

// Mock KPI data
const mockKPIs: BPOKPIs = {
  totalInvoices: 1247,
  averageProcessingTime: 2.3,
  slaCompliance: 94.2,
  errorRate: 0.8,
  qualityScore: 96.5,
  
  statusBreakdown: {
    submitted: 89,
    queued: 156,
    in_progress: 234,
    verification: 78,
    query_raised: 43,
    query_resolved: 12,
    completed: 567,
    approved: 523,
    rejected: 18,
    on_hold: 15,
    escalated: 12
  },
  
  priorityBreakdown: {
    urgent: 87,
    high: 234,
    medium: 678,
    low: 248
  },
  
  complexityBreakdown: {
    simple: 423,
    standard: 578,
    complex: 198,
    expert: 48
  },
  
  dailyVolume: [
    { date: '2024-08-05', count: 45 },
    { date: '2024-08-06', count: 52 },
    { date: '2024-08-07', count: 38 },
    { date: '2024-08-08', count: 61 },
    { date: '2024-08-09', count: 43 },
    { date: '2024-08-10', count: 58 },
    { date: '2024-08-11', count: 67 }
  ],
  
  processingTrends: [
    { date: '2024-08-05', avgHours: 2.8 },
    { date: '2024-08-06', avgHours: 2.6 },
    { date: '2024-08-07', avgHours: 3.1 },
    { date: '2024-08-08', avgHours: 2.4 },
    { date: '2024-08-09', avgHours: 2.7 },
    { date: '2024-08-10', avgHours: 2.2 },
    { date: '2024-08-11', avgHours: 2.3 }
  ],
  
  qualityTrends: [
    { date: '2024-08-05', score: 95.2 },
    { date: '2024-08-06', score: 96.1 },
    { date: '2024-08-07', score: 94.8 },
    { date: '2024-08-08', score: 97.2 },
    { date: '2024-08-09', score: 95.9 },
    { date: '2024-08-10', score: 96.8 },
    { date: '2024-08-11', score: 96.5 }
  ]
}

// Team performance data
const teamPerformance = [
  {
    id: 'bo-user-1',
    name: 'Priya Sharma',
    role: 'Senior Processor',
    processed: 89,
    avgTime: 1.8,
    qualityScore: 98.2,
    slaCompliance: 99.1,
    efficiency: 'Excellent'
  },
  {
    id: 'bo-user-2',
    name: 'James Wilson',
    role: 'Quality Specialist',
    processed: 67,
    avgTime: 2.1,
    qualityScore: 99.5,
    slaCompliance: 98.7,
    efficiency: 'Excellent'
  },
  {
    id: 'bo-user-3',
    name: 'Maria Rodriguez',
    role: 'Processor',
    processed: 78,
    avgTime: 2.4,
    qualityScore: 95.8,
    slaCompliance: 96.4,
    efficiency: 'Good'
  },
  {
    id: 'bo-user-4',
    name: 'Kevin Chang',
    role: 'Junior Processor',
    processed: 45,
    avgTime: 3.2,
    qualityScore: 92.1,
    slaCompliance: 93.8,
    efficiency: 'Developing'
  }
]

// Client satisfaction scores
const clientSatisfaction = [
  { client: 'ACME Corp', score: 4.8, feedback: 'Excellent service quality' },
  { client: 'TechStart Inc', score: 4.6, feedback: 'Fast processing times' },
  { client: 'Retail Chain Ltd', score: 4.9, feedback: 'Outstanding communication' },
  { client: 'Manufacturing Co', score: 4.4, feedback: 'Good overall service' },
  { client: 'Consulting Group', score: 4.7, feedback: 'Very responsive team' }
]

export default function BPOAnalyticsPage() {
  const [dateRange, setDateRange] = useState('7d')
  const [viewType, setViewType] = useState<'overview' | 'team' | 'clients'>('overview')
  const [isLoading, setIsLoading] = useState(false)

  const kpis = mockKPIs

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex">
      <BPOManagementSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  Performance Analytics
                  <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Real-time Data
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1">KPI tracking, SLA monitoring, and performance insights</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="hera-select-content">
                    <SelectItem className="hera-select-item" value="1d">Today</SelectItem>
                    <SelectItem className="hera-select-item" value="7d">7 Days</SelectItem>
                    <SelectItem className="hera-select-item" value="30d">30 Days</SelectItem>
                    <SelectItem className="hera-select-item" value="90d">90 Days</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm" onClick={() => setIsLoading(!isLoading)}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2">
              <Button 
                variant={viewType === 'overview' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewType('overview')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Overview
              </Button>
              <Button 
                variant={viewType === 'team' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewType('team')}
              >
                <Users className="w-4 h-4 mr-2" />
                Team Performance
              </Button>
              <Button 
                variant={viewType === 'clients' ? 'default' : 'ghost'} 
                size="sm"
                onClick={() => setViewType('clients')}
              >
                <Award className="w-4 h-4 mr-2" />
                Client Satisfaction
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-8">
          {viewType === 'overview' && (
            <div className="space-y-8">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <FileText className="w-8 h-8 text-blue-600" />
                    <Badge className="bg-blue-600 text-white">Total</Badge>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{kpis.totalInvoices.toLocaleString()}</p>
                  <p className="text-sm text-blue-700">Invoices Processed</p>
                  <div className="flex items-center mt-2 text-sm text-blue-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +12% vs last period
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-8 h-8 text-green-600" />
                    <Badge className="bg-green-600 text-white">Speed</Badge>
                  </div>
                  <p className="text-3xl font-bold text-green-900">{kpis.averageProcessingTime}h</p>
                  <p className="text-sm text-green-700">Avg Processing Time</p>
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    -8% improvement
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-8 h-8 text-purple-600" />
                    <Badge className="bg-purple-600 text-white">SLA</Badge>
                  </div>
                  <p className="text-3xl font-bold text-purple-900">{kpis.slaCompliance}%</p>
                  <p className="text-sm text-purple-700">SLA Compliance</p>
                  <div className="flex items-center mt-2 text-sm text-purple-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +2.1% this week
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                    <Badge className="bg-orange-600 text-white">Quality</Badge>
                  </div>
                  <p className="text-3xl font-bold text-orange-900">{kpis.errorRate}%</p>
                  <p className="text-sm text-orange-700">Error Rate</p>
                  <div className="flex items-center mt-2 text-sm text-orange-600">
                    <TrendingDown className="w-4 h-4 mr-1" />
                    -0.2% reduction
                  </div>
                </Card>

                <Card className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="w-8 h-8 text-indigo-600" />
                    <Badge className="bg-indigo-600 text-white">Score</Badge>
                  </div>
                  <p className="text-3xl font-bold text-indigo-900">{kpis.qualityScore}%</p>
                  <p className="text-sm text-indigo-700">Quality Score</p>
                  <div className="flex items-center mt-2 text-sm text-indigo-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +1.2% improvement
                  </div>
                </Card>
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Invoice Status Distribution
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(kpis.statusBreakdown).map(([status, count]) => {
                      const percentage = (count / kpis.totalInvoices * 100).toFixed(1)
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span className="capitalize text-gray-700">{status.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{percentage}%</span>
                            <span className="font-semibold text-gray-900">{count}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-600" />
                    Priority & Complexity Mix
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">By Priority</h4>
                      <div className="space-y-2">
                        {Object.entries(kpis.priorityBreakdown).map(([priority, count]) => {
                          const percentage = (count / kpis.totalInvoices * 100).toFixed(1)
                          const colors = {
                            urgent: 'bg-red-500',
                            high: 'bg-orange-500',
                            medium: 'bg-blue-500',
                            low: 'bg-gray-500'
                          }
                          return (
                            <div key={priority} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${colors[priority as keyof typeof colors]}`}></div>
                                <span className="capitalize text-sm text-gray-700">{priority}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{count} ({percentage}%)</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">By Complexity</h4>
                      <div className="space-y-2">
                        {Object.entries(kpis.complexityBreakdown).map(([complexity, count]) => {
                          const percentage = (count / kpis.totalInvoices * 100).toFixed(1)
                          return (
                            <div key={complexity} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="capitalize text-sm text-gray-700">{complexity}</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{count} ({percentage}%)</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Trends */}
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Performance Trends (Last 7 Days)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Daily Volume</h4>
                    <div className="space-y-2">
                      {kpis.dailyVolume.map((day, index) => (
                        <div key={day.date} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 bg-blue-500 rounded" 
                              style={{ width: `${(day.count / Math.max(...kpis.dailyVolume.map(d => d.count))) * 60}px` }}
                            ></div>
                            <span className="font-medium text-gray-900 w-8 text-right">{day.count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Processing Time</h4>
                    <div className="space-y-2">
                      {kpis.processingTrends.map((day, index) => (
                        <div key={day.date} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 bg-green-500 rounded" 
                              style={{ width: `${(day.avgHours / Math.max(...kpis.processingTrends.map(d => d.avgHours))) * 60}px` }}
                            ></div>
                            <span className="font-medium text-gray-900 w-8 text-right">{day.avgHours}h</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Quality Score</h4>
                    <div className="space-y-2">
                      {kpis.qualityTrends.map((day, index) => (
                        <div key={day.date} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{new Date(day.date).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <div 
                              className="h-2 bg-purple-500 rounded" 
                              style={{ width: `${(day.score / 100) * 60}px` }}
                            ></div>
                            <span className="font-medium text-gray-900 w-12 text-right">{day.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {viewType === 'team' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {teamPerformance.map((member) => (
                  <Card key={member.id} className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {member.name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Processed</span>
                        <span className="font-semibold">{member.processed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Time</span>
                        <span className="font-semibold">{member.avgTime}h</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Quality</span>
                        <span className="font-semibold">{member.qualityScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">SLA</span>
                        <span className="font-semibold">{member.slaCompliance}%</span>
                      </div>
                      
                      <Badge className={`w-full justify-center ${
                        member.efficiency === 'Excellent' ? 'bg-green-100 text-green-700' :
                        member.efficiency === 'Good' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {member.efficiency}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {viewType === 'clients' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Client Satisfaction Scores</h3>
                <div className="space-y-4">
                  {clientSatisfaction.map((client) => (
                    <div key={client.client} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-gray-900">{client.client}</h4>
                        <p className="text-sm text-gray-600">{client.feedback}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={`text-lg ${i < Math.floor(client.score) ? 'text-yellow-400' : 'text-gray-300'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="font-bold text-lg text-gray-900">{client.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}