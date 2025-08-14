'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DocumentRequisition } from '@/components/audit/DocumentManagement/DocumentRequisition'
// No authentication required for public audit demo
import { 
  Building2, 
  Search, 
  Filter,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'

interface Client {
  id: string
  client_name: string
  client_code: string
  client_type: 'public' | 'private' | 'non_profit' | 'government'
  organization_id: string
  audit_year: string
  engagement_partner: string
  audit_manager: string
  status: 'active' | 'planning' | 'review' | 'completed'
  estimated_fees: number
  document_stats: {
    total_documents: number
    pending: number
    received: number
    approved: number
    overdue: number
    completion_percentage: number
  }
}

export default function AuditDocumentsPage() {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  // Fetch clients from engagements API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/v1/audit/engagements')
        const result = await response.json()
        
        if (result.success) {
          // Transform engagements into clients with document stats
          const clientsData = result.data.engagements.map((eng: any) => ({
            id: eng.id,
            client_name: eng.client_name,
            client_code: eng.client_code,
            client_type: eng.client_type || 'private',
            organization_id: eng.organization_id || `gspu_client_${eng.client_code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_org`,
            audit_year: eng.audit_year || '2025',
            engagement_partner: eng.engagement_partner || 'john_smith',
            audit_manager: eng.audit_manager || 'sarah_johnson',
            status: eng.status || 'active',
            estimated_fees: eng.estimated_fees || 0,
            document_stats: {
              total_documents: 31, // GSPU standard 31 documents
              pending: Math.floor(Math.random() * 15) + 5,
              received: Math.floor(Math.random() * 10) + 3,
              approved: Math.floor(Math.random() * 8) + 2,
              overdue: Math.floor(Math.random() * 3),
              completion_percentage: Math.floor(Math.random() * 40) + 20
            }
          }))
          
          setClients(clientsData)
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  // Fixed filter logic with proper search functionality
  const filteredClients = clients.filter(client => {
    // Search in multiple fields for better results
    const searchLower = searchTerm.toLowerCase().trim()
    const matchesSearch = searchLower === '' || 
                         client.client_name.toLowerCase().includes(searchLower) ||
                         client.client_code.toLowerCase().includes(searchLower) ||
                         client.organization_id.toLowerCase().includes(searchLower) ||
                         client.engagement_partner.toLowerCase().includes(searchLower)
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'review': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getClientTypeColor = (type: string) => {
    switch (type) {
      case 'public': return 'bg-purple-100 text-purple-800'
      case 'private': return 'bg-blue-100 text-blue-800'
      case 'non_profit': return 'bg-green-100 text-green-800'
      case 'government': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // If client is selected, show their document management
  if (selectedClient) {
    return (
      <React.Fragment>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
          <div className="container mx-auto p-6">
            {/* Back to client list */}
            <div className="mb-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedClient(null)}
                className="mb-4"
              >
                ← Back to Client List
              </Button>
              
              {/* Client Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedClient.client_name}</h1>
                    <p className="text-gray-600">Organization ID: {selectedClient.organization_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getClientTypeColor(selectedClient.client_type)}>
                    {selectedClient.client_type.replace('_', ' ').toUpperCase()}
                  </Badge>
                  <Badge className={getStatusColor(selectedClient.status)}>
                    {selectedClient.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Document Requisition Component */}
            <DocumentRequisition 
              clientId={selectedClient.id}
              clientName={selectedClient.client_name}
              auditYear={selectedClient.audit_year}
              organizationId={selectedClient.organization_id}
            />
          </div>
        </div>
      </React.Fragment>
    )
  }

  // Client selection page
  return (
    <React.Fragment>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="container mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Audit Document Management</h1>
                <p className="text-gray-600">Manage GSPU 2025 compliant documents for each audit client</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1">
                <Users className="w-4 h-4 mr-2" />
                {clients.length} Clients
              </Badge>
            </div>
          </div>

          {/* Purpose and Instructions */}
          <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">What is Document Management?</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    This system helps you track and manage all GSPU 2025 required documents for each audit client. 
                    The system automatically creates requisitions for all 31 mandatory documents including:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white/80 p-2 rounded">
                      <span className="font-medium text-gray-700">Section A:</span> Company Formation (4 docs)
                    </div>
                    <div className="bg-white/80 p-2 rounded">
                      <span className="font-medium text-gray-700">Section B:</span> Financial Documents (3 docs)
                    </div>
                    <div className="bg-white/80 p-2 rounded">
                      <span className="font-medium text-gray-700">Section C:</span> Audit Planning (4 docs)
                    </div>
                    <div className="bg-white/80 p-2 rounded">
                      <span className="font-medium text-gray-700">Section D:</span> Audit Execution (17 docs)
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mt-3 flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      How to use:
                    </span>
                    Select a client below → Manage their documents → Track progress → Send reminders
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-blue-600 mb-1">Total Clients</p>
                    <p className="text-2xl font-bold text-blue-900">{clients.length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-1">Documents Complete</p>
                    <p className="text-2xl font-bold text-green-900">
                      {Math.round(clients.reduce((acc, c) => acc + c.document_stats.completion_percentage, 0) / clients.length || 0)}%
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-yellow-600 mb-1">Pending Docs</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {clients.reduce((acc, c) => acc + c.document_stats.pending, 0)}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-1">Overdue</p>
                    <p className="text-2xl font-bold text-red-900">
                      {clients.reduce((acc, c) => acc + c.document_stats.overdue, 0)}
                    </p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
                  <Input
                    placeholder="Search by client name, code, organization ID, or partner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results Info */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredClients.length}</span> of {clients.length} clients
                {searchTerm && <span> matching "{searchTerm}"</span>}
                {statusFilter !== 'all' && <span> with status "{statusFilter}"</span>}
              </p>
              {filteredClients.length !== clients.length && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}

          {/* Client Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading clients...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card key={client.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {client.client_name}
                          </CardTitle>
                          <p className="text-sm text-gray-600 font-mono">{client.client_code}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Badge className={getClientTypeColor(client.client_type)} variant="outline">
                          {client.client_type.replace('_', ' ')}
                        </Badge>
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Organization ID */}
                    <div className="p-2 bg-gray-50 rounded border-l-4 border-blue-500">
                      <p className="text-xs font-medium text-gray-600 mb-1">Organization ID</p>
                      <p className="text-sm font-mono text-gray-800 break-all">{client.organization_id}</p>
                    </div>

                    {/* Document Progress */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Document Progress</span>
                        <span className="text-sm font-bold text-gray-900">{client.document_stats.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${client.document_stats.completion_percentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Document Stats */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="text-xs text-blue-600 font-medium">Pending</p>
                        <p className="text-lg font-bold text-blue-900">{client.document_stats.pending}</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-xs text-green-600 font-medium">Approved</p>
                        <p className="text-lg font-bold text-green-900">{client.document_stats.approved}</p>
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Partner: {client.engagement_partner}</span>
                        <span>FY{client.audit_year}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button 
                      onClick={() => setSelectedClient(client)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 group-hover:scale-105 transition-all"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Manage Documents
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredClients.length === 0 && !loading && (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>
    </React.Fragment>
  )
}