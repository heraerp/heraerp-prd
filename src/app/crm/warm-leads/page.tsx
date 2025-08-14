'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  TrendingUp, 
  Download,
  Filter,
  Plus,
  Eye,
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  BarChart3
} from 'lucide-react'

interface WarmLead {
  id: string
  email: string
  workspace_id: string
  organization_id: string
  organization_name: string
  created_at: string
  identified_at: string
  modules_used: string[]
  interactions_count: number
  data_size: number
  last_activity: string
  lead_score: number
  lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'cold'
  contact_attempts: number
  notes: string[]
  source: string
  engagement_level: 'low' | 'medium' | 'high'
  conversion_probability: number
}

export default function WarmLeadsPage() {
  const [leads, setLeads] = useState<WarmLead[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<WarmLead | null>(null)
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    minScore: ''
  })
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    loadLeads()
    loadStats()
  }, [filters])

  const loadLeads = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('action', 'list')
      
      if (filters.status) params.append('status', filters.status)
      if (filters.source) params.append('source', filters.source)
      if (filters.minScore) params.append('min_score', filters.minScore)

      const response = await fetch(`/api/v1/crm/warm-leads?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setLeads(result.data)
      }
    } catch (error) {
      console.error('Failed to load leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/v1/crm/warm-leads?action=stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const updateLeadStatus = async (leadId: string, status: string) => {
    try {
      const response = await fetch('/api/v1/crm/warm-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_lead',
          id: leadId,
          updates: { lead_status: status, contact_attempts: status === 'contacted' ? 1 : 0 }
        })
      })

      if (response.ok) {
        loadLeads()
        loadStats()
      }
    } catch (error) {
      console.error('Failed to update lead:', error)
    }
  }

  const addNote = async (leadId: string) => {
    if (!newNote.trim()) return

    try {
      const response = await fetch('/api/v1/crm/warm-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_note',
          leadId,
          note: newNote
        })
      })

      if (response.ok) {
        setNewNote('')
        loadLeads()
        // Update selected lead if it's the one we added note to
        if (selectedLead?.id === leadId) {
          const updatedLead = leads.find(l => l.id === leadId)
          if (updatedLead) setSelectedLead(updatedLead)
        }
      }
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }

  const exportLeads = async () => {
    try {
      const response = await fetch('/api/v1/crm/warm-leads?action=export')
      const result = await response.json()
      
      if (result.success) {
        // Create and download CSV
        const csvContent = convertToCSV(result.data)
        downloadCSV(csvContent, `hera-warm-leads-${new Date().toISOString().split('T')[0]}.csv`)
      }
    } catch (error) {
      console.error('Failed to export leads:', error)
    }
  }

  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    )
    
    return [headers, ...rows].join('\n')
  }

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      converted: 'bg-purple-100 text-purple-800',
      cold: 'bg-gray-100 text-gray-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getEngagementColor = (level: string) => {
    const colors = {
      high: 'text-green-600',
      medium: 'text-yellow-600',
      low: 'text-red-600'
    }
    return colors[level as keyof typeof colors] || 'text-gray-600'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p>Loading warm leads...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">HERA Warm Leads</h1>
            <p className="text-gray-600">Progressive authentication leads ready for outreach</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={exportLeads} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Import Leads
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Leads</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.total_warm_leads}</p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">New Leads</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.new_leads}</p>
                  </div>
                  <Mail className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">High Engagement</p>
                    <p className="text-3xl font-bold text-green-600">{stats.high_engagement}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg. Score</p>
                    <p className="text-3xl font-bold text-purple-600">{Math.round(stats.average_lead_score)}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-500" />
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="converted">Converted</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.source} onValueChange={(value) => setFilters({...filters, source: value})}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Sources</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="crm">CRM</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="jewelry">Jewelry</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                </SelectContent>
              </Select>
              
              <Input 
                type="number" 
                placeholder="Min Score" 
                className="w-32"
                value={filters.minScore}
                onChange={(e) => setFilters({...filters, minScore: e.target.value})}
              />
              
              <Button onClick={() => setFilters({status: '', source: '', minScore: ''})} variant="outline">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>Warm Leads ({leads.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leads.map((lead) => (
                <div key={lead.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{lead.email}</h3>
                        <p className="text-sm text-gray-600">{lead.organization_name}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(lead.lead_status)}>
                          {lead.lead_status}
                        </Badge>
                        <Badge variant="outline">
                          Score: {lead.lead_score}
                        </Badge>
                        <Badge variant="outline">
                          {lead.source}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right text-sm">
                        <p className={`font-medium ${getEngagementColor(lead.engagement_level)}`}>
                          {lead.engagement_level.toUpperCase()} Engagement
                        </p>
                        <p className="text-gray-500">
                          {lead.conversion_probability.toFixed(0)}% conversion
                        </p>
                        <p className="text-gray-400">
                          {new Date(lead.last_activity).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedLead(lead)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Lead Details: {lead.email}</DialogTitle>
                            <DialogDescription>
                              Progressive authentication lead from {lead.source} module
                            </DialogDescription>
                          </DialogHeader>
                          
                          {selectedLead && (
                            <div className="space-y-6">
                              {/* Lead Info */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Contact Information</h4>
                                  <p><strong>Email:</strong> {selectedLead.email}</p>
                                  <p><strong>Organization:</strong> {selectedLead.organization_name}</p>
                                  <p><strong>Source:</strong> {selectedLead.source}</p>
                                  <p><strong>Identified:</strong> {new Date(selectedLead.identified_at).toLocaleString()}</p>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold mb-2">Engagement Metrics</h4>
                                  <p><strong>Lead Score:</strong> {selectedLead.lead_score}/100</p>
                                  <p><strong>Interactions:</strong> {selectedLead.interactions_count}</p>
                                  <p><strong>Modules Used:</strong> {selectedLead.modules_used.length}</p>
                                  <p><strong>Data Size:</strong> {(selectedLead.data_size / 1024).toFixed(1)}KB</p>
                                </div>
                              </div>
                              
                              {/* Modules Used */}
                              <div>
                                <h4 className="font-semibold mb-2">Modules Used</h4>
                                <div className="flex flex-wrap gap-2">
                                  {selectedLead.modules_used.map((module, index) => (
                                    <Badge key={index} variant="secondary">{module}</Badge>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Status Update */}
                              <div>
                                <h4 className="font-semibold mb-2">Update Status</h4>
                                <div className="flex space-x-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => updateLeadStatus(selectedLead.id, 'contacted')}
                                    variant={selectedLead.lead_status === 'contacted' ? 'default' : 'outline'}
                                  >
                                    Mark Contacted
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => updateLeadStatus(selectedLead.id, 'qualified')}
                                    variant={selectedLead.lead_status === 'qualified' ? 'default' : 'outline'}
                                  >
                                    Mark Qualified
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    onClick={() => updateLeadStatus(selectedLead.id, 'converted')}
                                    variant={selectedLead.lead_status === 'converted' ? 'default' : 'outline'}
                                  >
                                    Mark Converted
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Notes */}
                              <div>
                                <h4 className="font-semibold mb-2">Notes</h4>
                                <div className="space-y-2 mb-4">
                                  {selectedLead.notes.map((note, index) => (
                                    <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                                      {note}
                                    </div>
                                  ))}
                                </div>
                                
                                <div className="flex space-x-2">
                                  <Textarea 
                                    placeholder="Add a note..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    className="flex-1"
                                  />
                                  <Button onClick={() => addNote(selectedLead.id)}>
                                    <MessageSquare className="w-4 h-4 mr-1" />
                                    Add Note
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span>{lead.modules_used.join(', ')}</span>
                      <span>{lead.interactions_count} interactions</span>
                    </div>
                    <span>Last activity: {new Date(lead.last_activity).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              
              {leads.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No warm leads found matching your filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}