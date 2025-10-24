'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Users,
  Building2,
  Globe,
  Phone,
  Mail,
  Calendar,
  Star,
  TrendingUp,
  MapPin,
  Filter,
  Search,
  Plus,
  Edit,
  Eye,
  Target,
  Award,
  Clock,
  DollarSign,
  Percent,
  CheckCircle,
  AlertCircle,
  Ship,
  Hotel,
  Crown,
  Plane,
  Coffee,
  TreePine
} from 'lucide-react'

interface Lead {
  id: string
  name: string
  company: string
  type: 'hotel' | 'export' | 'resort' | 'corporate' | 'government'
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  score: number
  value: number
  probability: number
  location: string
  phone: string
  email: string
  requirement: string
  lastContact: string
  nextFollowUp: string
  source: string
  assignedTo: string
  notes: string[]
  isExport: boolean
}

interface PipelineStage {
  status: string
  label: string
  count: number
  value: number
  color: string
  icon: React.ElementType
}

export default function LeadManagement() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewLeadForm, setShowNewLeadForm] = useState(false)

  // Kerala-focused sample leads
  const sampleLeads: Lead[] = [
    {
      id: '1',
      name: 'Priya Nair',
      company: 'ITC Grand Chola Chennai',
      type: 'hotel',
      status: 'proposal',
      score: 85,
      value: 2500000,
      probability: 75,
      location: 'Chennai, Tamil Nadu',
      phone: '+91 98765 43210',
      email: 'priya.nair@itchotels.in',
      requirement: '150 Executive Room Furniture Sets - Contemporary Design',
      lastContact: '2024-01-14',
      nextFollowUp: '2024-01-18',
      source: 'Hotel Industry Expo Kochi',
      assignedTo: 'Rajesh Kumar',
      notes: ['Interested in teak wood finish', 'Budget approved by management', 'Site visit scheduled'],
      isExport: false
    },
    {
      id: '2',
      name: 'Ahmed Al-Mahmoud',
      company: 'Dubai Furniture Importers LLC',
      type: 'export',
      status: 'negotiation',
      score: 92,
      value: 5500000,
      probability: 85,
      location: 'Dubai, UAE',
      phone: '+971 50 123 4567',
      email: 'ahmed@dubairniture.ae',
      requirement: 'Traditional Kerala Furniture Collection for Luxury Villas',
      lastContact: '2024-01-15',
      nextFollowUp: '2024-01-17',
      source: 'Export Portal Lead',
      assignedTo: 'Suresh Menon',
      notes: ['Prefers rosewood finish', 'Long-term partnership potential', 'First container order'],
      isExport: true
    },
    {
      id: '3',
      name: 'Maria Santos',
      company: 'Taj Kumarakom Resort & Spa',
      type: 'resort',
      status: 'qualified',
      score: 78,
      value: 1800000,
      probability: 60,
      location: 'Kumarakom, Kerala',
      phone: '+91 94474 88888',
      email: 'maria.santos@tajhotels.com',
      requirement: 'Lakeside Villa Furniture - Traditional Kerala Style',
      lastContact: '2024-01-12',
      nextFollowUp: '2024-01-19',
      source: 'Referral - Previous Client',
      assignedTo: 'Anitha Pillai',
      notes: ['Focus on water-resistant finish', 'Monsoon delivery timeline', 'Eco-friendly materials preferred'],
      isExport: false
    },
    {
      id: '4',
      name: 'James Wilson',
      company: 'Marriott International',
      type: 'hotel',
      status: 'contacted',
      score: 72,
      value: 3200000,
      probability: 45,
      location: 'Multiple Locations - India',
      phone: '+91 98765 11111',
      email: 'james.wilson@marriott.com',
      requirement: 'Standard Hotel Room Furniture for 5 Properties',
      lastContact: '2024-01-10',
      nextFollowUp: '2024-01-20',
      source: 'Cold Outreach',
      assignedTo: 'Rajesh Kumar',
      notes: ['Corporate procurement process', 'Timeline: 6 months', 'Quality standards strict'],
      isExport: false
    },
    {
      id: '5',
      name: 'Giuseppe Romano',
      company: 'European Furniture Gallery',
      type: 'export',
      status: 'new',
      score: 68,
      value: 4200000,
      probability: 30,
      location: 'Milan, Italy',
      phone: '+39 345 678 9012',
      email: 'giuseppe@efgallery.it',
      requirement: 'Handcrafted Kerala Furniture for European Market',
      lastContact: '2024-01-16',
      nextFollowUp: '2024-01-21',
      source: 'International Trade Fair',
      assignedTo: 'Suresh Menon',
      notes: ['Artisan craftwork emphasis', 'European quality standards', 'Sustainability certification needed'],
      isExport: true
    }
  ]

  const pipelineStages: PipelineStage[] = [
    { status: 'new', label: 'New Leads', count: 8, value: 12500000, color: 'blue', icon: Users },
    { status: 'contacted', label: 'Contacted', count: 12, value: 18750000, color: 'cyan', icon: Phone },
    { status: 'qualified', label: 'Qualified', count: 9, value: 22100000, color: 'green', icon: CheckCircle },
    { status: 'proposal', label: 'Proposal', count: 6, value: 15800000, color: 'amber', icon: Award },
    { status: 'negotiation', label: 'Negotiation', count: 4, value: 19200000, color: 'purple', icon: Target },
    { status: 'won', label: 'Won', count: 3, value: 8900000, color: 'emerald', icon: Crown }
  ]

  useEffect(() => {
    setLeads(sampleLeads)
  }, [])

  const filteredLeads = leads.filter(lead => {
    const matchesType = filterType === 'all' || lead.type === filterType
    const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         lead.requirement.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'new': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'contacted': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
      'qualified': 'bg-green-500/10 text-green-600 border-green-500/20',
      'proposal': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      'negotiation': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      'won': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      'lost': 'bg-red-500/10 text-red-600 border-red-500/20'
    }
    return colors[status] || colors.new
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      'hotel': Hotel,
      'export': Ship,
      'resort': TreePine,
      'corporate': Building2,
      'government': Award
    }
    return icons[type] || Building2
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-amber-500'
    return 'text-red-500'
  }

  const totalPipelineValue = pipelineStages.reduce((sum, stage) => sum + stage.value, 0)

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <Target className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Lead Management</h1>
                  <p className="text-lg text-gray-300">Kerala Furniture - Hotel & Export Focused</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                  <MapPin className="h-3 w-3 mr-1" />
                  Kerala Focus
                </Badge>
                <Button className="jewelry-glass-btn gap-2" onClick={() => setShowNewLeadForm(true)}>
                  <Plus className="h-4 w-4" />
                  New Lead
                </Button>
              </div>
            </div>
          </div>

          {/* Pipeline Overview */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold jewelry-text-luxury">Sales Pipeline</h2>
              <div className="text-sm text-gray-300">
                Total Pipeline Value: <span className="text-lg font-bold jewelry-text-gold">₹{totalPipelineValue.toLocaleString()}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {pipelineStages.map((stage) => (
                <div key={stage.status} className="jewelry-glass-card p-4 jewelry-scale-hover cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <stage.icon className={`h-5 w-5 text-${stage.color}-500`} />
                    <span className="text-sm font-medium jewelry-text-luxury">{stage.label}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold jewelry-text-luxury">{stage.count}</div>
                    <div className="text-sm text-gray-300">₹{(stage.value / 100000).toFixed(1)}L</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters and Search */}
          <div className="jewelry-glass-card p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input
                    placeholder="Search leads by name, company, or requirement..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 jewelry-glass-input"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('all')}
                  className="jewelry-glass-btn"
                >
                  All
                </Button>
                <Button
                  variant={filterType === 'hotel' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('hotel')}
                  className="jewelry-glass-btn gap-1"
                >
                  <Hotel className="h-4 w-4" />
                  Hotels
                </Button>
                <Button
                  variant={filterType === 'export' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('export')}
                  className="jewelry-glass-btn gap-1"
                >
                  <Ship className="h-4 w-4" />
                  Export
                </Button>
                <Button
                  variant={filterType === 'resort' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('resort')}
                  className="jewelry-glass-btn gap-1"
                >
                  <TreePine className="h-4 w-4" />
                  Resorts
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="list" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="list" className="jewelry-glass-btn">Lead List</TabsTrigger>
              <TabsTrigger value="kanban" className="jewelry-glass-btn">Kanban Board</TabsTrigger>
              <TabsTrigger value="analytics" className="jewelry-glass-btn">Analytics</TabsTrigger>
            </TabsList>

            {/* Lead List */}
            <TabsContent value="list" className="space-y-4">
              <div className="space-y-4">
                {filteredLeads.map((lead) => {
                  const TypeIcon = getTypeIcon(lead.type)
                  return (
                    <div key={lead.id} className="jewelry-glass-card p-6 jewelry-scale-hover cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <TypeIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold jewelry-text-luxury">{lead.name}</h3>
                              <Badge className={getStatusColor(lead.status)}>
                                {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                              </Badge>
                              {lead.isExport && (
                                <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                                  <Ship className="h-3 w-3 mr-1" />
                                  Export
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300">
                              <div>
                                <span className="font-medium">Company:</span> {lead.company}
                              </div>
                              <div>
                                <span className="font-medium">Location:</span> {lead.location}
                              </div>
                              <div>
                                <span className="font-medium">Value:</span> ₹{lead.value.toLocaleString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Score:</span>
                                <span className={getScoreColor(lead.score)}>{lead.score}</span>
                                <Star className={`h-3 w-3 ${getScoreColor(lead.score)}`} />
                              </div>
                            </div>
                            <div className="mt-3">
                              <p className="text-sm text-gray-300">{lead.requirement}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-300">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last Contact: {lead.lastContact}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Next Follow-up: {lead.nextFollowUp}
                              </div>
                              <div className="flex items-center gap-1">
                                <Percent className="h-3 w-3" />
                                Probability: {lead.probability}%
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" className="jewelry-glass-btn gap-1">
                            <Phone className="h-3 w-3" />
                            Call
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                            <Mail className="h-3 w-3" />
                            Email
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1">
                            <Eye className="h-3 w-3" />
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Kanban Board */}
            <TabsContent value="kanban" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 overflow-x-auto">
                {pipelineStages.slice(0, -1).map((stage) => (
                  <div key={stage.status} className="jewelry-glass-card p-4 min-w-[280px]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <stage.icon className={`h-4 w-4 text-${stage.color}-500`} />
                        <h3 className="font-medium jewelry-text-luxury">{stage.label}</h3>
                      </div>
                      <Badge className="bg-white/10">{stage.count}</Badge>
                    </div>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredLeads
                        .filter(lead => lead.status === stage.status)
                        .map(lead => {
                          const TypeIcon = getTypeIcon(lead.type)
                          return (
                            <div key={lead.id} className="p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors">
                              <div className="flex items-start gap-2 mb-2">
                                <TypeIcon className="h-4 w-4 jewelry-text-gold mt-1" />
                                <div className="flex-1">
                                  <h4 className="font-medium jewelry-text-luxury text-sm">{lead.name}</h4>
                                  <p className="text-xs text-gray-300">{lead.company}</p>
                                </div>
                              </div>
                              <div className="text-xs text-gray-300 mb-2">
                                ₹{(lead.value / 100000).toFixed(1)}L • {lead.probability}%
                              </div>
                              <div className="flex items-center justify-between">
                                <div className={`text-xs ${getScoreColor(lead.score)}`}>
                                  Score: {lead.score}
                                </div>
                                {lead.isExport && (
                                  <Ship className="h-3 w-3 text-purple-500" />
                                )}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lead Source Analysis */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Lead Sources</h3>
                  <div className="space-y-3">
                    {[
                      { source: 'Hotel Industry Expo Kochi', count: 12, percentage: 35 },
                      { source: 'Export Portal Leads', count: 8, percentage: 24 },
                      { source: 'Referrals', count: 7, percentage: 21 },
                      { source: 'Cold Outreach', count: 4, percentage: 12 },
                      { source: 'International Trade Fair', count: 3, percentage: 8 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium jewelry-text-luxury">{item.source}</div>
                          <div className="text-sm text-gray-300">{item.count} leads</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold jewelry-text-luxury">{item.percentage}%</div>
                          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Kerala Market Insights */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Kerala Market Insights</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <TrendingUp className="h-4 w-4" />
                        Hotel Sector Growth
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Kerala's hospitality sector growing 25% annually. Focus on boutique resorts.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-600 font-medium">
                        <Ship className="h-4 w-4" />
                        Export Advantage
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Kerala craftsmanship highly valued in Middle East. Average order ₹45L.
                      </p>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <div className="flex items-center gap-2 text-amber-600 font-medium">
                        <Clock className="h-4 w-4" />
                        Seasonal Pattern
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Peak tourism season (Oct-Mar) drives 60% of hotel orders.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">68%</div>
                  <div className="text-sm text-gray-300">Lead-to-Customer Rate</div>
                  <div className="text-xs text-gray-300 mt-1">Above industry 45%</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">₹2.8L</div>
                  <div className="text-sm text-gray-300">Average Deal Value</div>
                  <div className="text-xs text-gray-300 mt-1">Export: ₹4.5L, Domestic: ₹1.8L</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">18 days</div>
                  <div className="text-sm text-gray-300">Average Sales Cycle</div>
                  <div className="text-xs text-gray-300 mt-1">Export: 25 days, Hotels: 12 days</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">85%</div>
                  <div className="text-sm text-gray-300">Customer Satisfaction</div>
                  <div className="text-xs text-gray-300 mt-1">Based on post-delivery surveys</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}