'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Crown,
  Users,
  TrendingUp,
  TrendingDown,
  Star,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Building,
  Shield,
  Award,
  Target,
  Activity,
  Briefcase,
  Eye,
  Edit3,
  Plus,
  Filter,
  Search,
  Download,
  BarChart3,
  DollarSign,
  Percent,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  MessageSquare
} from 'lucide-react'

interface ProgressiveClientManagementProps {
  organizationId: string
}

// Enhanced Client Data with Relationship Management
const clientManagementData = {
  clients: [
    {
      id: 'CLIENT001',
      name: 'Harrison Technology Fund',
      type: 'Family Office',
      status: 'ultra_high_net_worth',
      tier: 'Private Wealth',
      aum: 1250000000,
      relationship_manager: 'Alexandra Sterling',
      assistant_rm: 'David Kim',
      inception_date: '2019-03-15',
      last_contact: '2024-08-05',
      next_scheduled: '2024-08-15',
      satisfaction_score: 9.6,
      risk_profile: 'Moderate Aggressive',
      performance_ytd: 12.8,
      performance_3yr: 18.4,
      revenue_ytd: 8750000,
      contact_info: {
        primary: 'james.harrison@harrisontech.com',
        phone: '+1-555-0123',
        address: 'San Francisco, CA'
      },
      portfolio_summary: {
        equity_allocation: 68.5,
        fixed_income: 18.2,
        alternatives: 10.8,
        cash: 2.5
      },
      recent_activity: [
        { date: '2024-08-05', type: 'Meeting', description: 'Quarterly Portfolio Review' },
        { date: '2024-08-01', type: 'Transaction', description: 'AI Technology Allocation Increase' },
        { date: '2024-07-28', type: 'Communication', description: 'Market Outlook Discussion' }
      ],
      goals: [
        { goal: 'Estate Planning Optimization', priority: 'high', status: 'in_progress' },
        { goal: 'ESG Portfolio Integration', priority: 'medium', status: 'planned' },
        { goal: 'Tax-Loss Harvesting', priority: 'high', status: 'active' }
      ]
    },
    {
      id: 'CLIENT002',
      name: 'The Morrison Family Trust',
      type: 'Multi-Generation Trust',
      status: 'high_net_worth',
      tier: 'Premier',
      aum: 485000000,
      relationship_manager: 'Michael Chen',
      assistant_rm: 'Sarah Rodriguez',
      inception_date: '2016-11-08',
      last_contact: '2024-08-06',
      next_scheduled: '2024-08-20',
      satisfaction_score: 9.1,
      risk_profile: 'Conservative Growth',
      performance_ytd: 8.9,
      performance_3yr: 14.2,
      revenue_ytd: 4250000,
      contact_info: {
        primary: 'margaret.morrison@morrisonfamily.org',
        phone: '+1-555-0456',
        address: 'Greenwich, CT'
      },
      portfolio_summary: {
        equity_allocation: 55.2,
        fixed_income: 32.8,
        alternatives: 8.5,
        cash: 3.5
      },
      recent_activity: [
        { date: '2024-08-06', type: 'Communication', description: 'Family Education Planning Discussion' },
        { date: '2024-08-02', type: 'Review', description: 'Trust Structure Optimization' },
        { date: '2024-07-30', type: 'Meeting', description: 'Next Generation Involvement Meeting' }
      ],
      goals: [
        { goal: 'Philanthropic Strategy Development', priority: 'high', status: 'active' },
        { goal: 'Next-Gen Financial Education', priority: 'medium', status: 'in_progress' },
        { goal: 'Sustainable Investment Integration', priority: 'low', status: 'planned' }
      ]
    },
    {
      id: 'CLIENT003',
      name: 'Steinberg Holdings LLC',
      type: 'Corporate Treasury',
      status: 'institutional',
      tier: 'Institutional',
      aum: 2100000000,
      relationship_manager: 'Sarah Williams',
      assistant_rm: 'Robert Chang',
      inception_date: '2018-01-22',
      last_contact: '2024-08-07',
      next_scheduled: '2024-08-12',
      satisfaction_score: 9.8,
      risk_profile: 'Balanced',
      performance_ytd: 10.4,
      performance_3yr: 16.7,
      revenue_ytd: 12500000,
      contact_info: {
        primary: 'treasury@steinbergholdings.com',
        phone: '+1-555-0789',
        address: 'New York, NY'
      },
      portfolio_summary: {
        equity_allocation: 62.8,
        fixed_income: 25.4,
        alternatives: 9.2,
        cash: 2.6
      },
      recent_activity: [
        { date: '2024-08-07', type: 'Transaction', description: 'Corporate Bond Ladder Implementation' },
        { date: '2024-08-04', type: 'Meeting', description: 'Treasury Committee Presentation' },
        { date: '2024-08-01', type: 'Analysis', description: 'Interest Rate Hedging Review' }
      ],
      goals: [
        { goal: 'Liquidity Management Optimization', priority: 'high', status: 'active' },
        { goal: 'ESG Mandate Implementation', priority: 'medium', status: 'in_progress' },
        { goal: 'Currency Hedging Strategy', priority: 'high', status: 'planned' }
      ]
    }
  ],
  meetingSchedule: [
    { 
      date: '2024-08-12', 
      time: '10:00 AM', 
      client: 'Steinberg Holdings LLC', 
      type: 'Treasury Committee', 
      priority: 'high' 
    },
    { 
      date: '2024-08-15', 
      time: '2:00 PM', 
      client: 'Harrison Technology Fund', 
      type: 'Portfolio Review', 
      priority: 'medium' 
    },
    { 
      date: '2024-08-20', 
      time: '11:00 AM', 
      client: 'The Morrison Family Trust', 
      type: 'Family Meeting', 
      priority: 'medium' 
    }
  ]
}

export function ProgressiveClientManagement({ organizationId }: ProgressiveClientManagementProps) {
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(2)}B`
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`
    }
    return `$${amount.toLocaleString()}`
  }

  const getPerformanceColor = (performance: number) => {
    if (performance > 10) return 'text-emerald-600'
    if (performance > 5) return 'text-blue-600'
    if (performance > 0) return 'text-amber-600'
    return 'text-red-600'
  }

  const getPerformanceIcon = (performance: number) => {
    return performance > 0 ? TrendingUp : TrendingDown
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Private Wealth': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'Institutional': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'Premier': return 'bg-emerald-100 text-emerald-700 border-emerald-300'
      default: return 'bg-slate-100 text-slate-700 border-slate-300'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700'
      case 'medium': return 'bg-amber-100 text-amber-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'planned': return 'bg-amber-100 text-amber-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const filteredClients = clientManagementData.clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.relationship_manager.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTier = filterTier === 'all' || client.tier.toLowerCase().includes(filterTier.toLowerCase())
    return matchesSearch && matchesTier
  })

  const renderClientOverview = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search clients..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="border border-slate-300 rounded-lg px-3 py-2"
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
          >
            <option value="all">All Tiers</option>
            <option value="private">Private Wealth</option>
            <option value="institutional">Institutional</option>
            <option value="premier">Premier</option>
          </select>
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            New Client
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Client Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const PerformanceIcon = getPerformanceIcon(client.performance_ytd)
          
          return (
            <Card key={client.id} className="hera-card hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="font-semibold text-slate-900">{client.name}</h3>
                      {client.status === 'ultra_high_net_worth' && (
                        <Crown className="h-4 w-4 text-amber-500 ml-2" />
                      )}
                    </div>
                    <Badge className={getTierColor(client.tier)}>
                      {client.tier}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center ${getPerformanceColor(client.performance_ytd)}`}>
                      <PerformanceIcon className="h-4 w-4 mr-1" />
                      <span className="font-semibold">+{client.performance_ytd}%</span>
                    </div>
                    <p className="text-xs text-slate-500">YTD</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* AUM and Revenue */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-slate-600">AUM</p>
                      <p className="font-semibold text-slate-900">{formatCurrency(client.aum)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">Revenue YTD</p>
                      <p className="font-semibold text-emerald-600">{formatCurrency(client.revenue_ytd)}</p>
                    </div>
                  </div>

                  {/* Relationship Manager */}
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">RM: {client.relationship_manager}</span>
                  </div>

                  {/* Satisfaction Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Satisfaction</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-amber-500 mr-1" />
                      <span className="font-semibold text-slate-900">{client.satisfaction_score}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Contact
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )

  const renderMeetingSchedule = () => (
    <Card className="hera-card">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 text-blue-500 mr-2" />
          Upcoming Meetings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clientManagementData.meetingSchedule.map((meeting, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-900">{meeting.date}</p>
                  <p className="text-xs text-slate-500">{meeting.time}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">{meeting.client}</h4>
                  <p className="text-sm text-slate-600">{meeting.type}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getPriorityColor(meeting.priority)}>
                  {meeting.priority}
                </Badge>
                <Button size="sm" variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hera-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Clients</p>
                <p className="text-3xl font-bold text-slate-900">
                  {clientManagementData.clients.length}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hera-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total AUM</p>
                <p className="text-3xl font-bold text-slate-900">$3.8B</p>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hera-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Avg Satisfaction</p>
                <p className="text-3xl font-bold text-slate-900">9.5</p>
              </div>
              <Star className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hera-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Revenue YTD</p>
                <p className="text-3xl font-bold text-slate-900">$25.5M</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {renderClientOverview()}
        </div>
        <div>
          {renderMeetingSchedule()}
        </div>
      </div>
    </div>
  )
}