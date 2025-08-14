'use client'

import React, { useState, useEffect } from 'react'
import { BPOManagementSidebar } from '@/components/bpo-progressive/BPOManagementSidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileText, Clock, AlertTriangle, CheckCircle, User,
  Filter, Search, RefreshCw, Play, Pause, Flag,
  DollarSign, Calendar, Building, Eye, MessageSquare,
  ArrowUpRight, TrendingUp, Target, Sparkles
} from 'lucide-react'
import { BPOInvoiceEntity, BPOInvoiceStatus, BPOPriority, BPOComplexity, getStatusColor, getPriorityColor, getSLAStatus } from '@/lib/bpo/bpo-entities'

// Mock invoices for demonstration
const mockInvoices: BPOInvoiceEntity[] = [
  {
    entity_id: 'inv-001',
    entity_type: 'bpo_invoice',
    entity_name: 'INV-2024-001',
    entity_code: 'INV-001',
    status: 'queued',
    organization_id: 'org-acme-corp',
    smart_code: 'HERA.BPO.INVOICE.QUEUED.v1',
    created_at: new Date('2024-08-11T08:30:00'),
    updated_at: new Date('2024-08-11T08:30:00'),
    created_by: 'ho-user-1',
    invoice_number: 'INV-2024-001',
    vendor_name: 'Office Supplies Inc.',
    invoice_date: new Date('2024-08-10'),
    total_amount: 2450.00,
    currency: 'USD',
    priority: 'medium',
    complexity: 'standard',
    submitted_date: new Date('2024-08-11T08:30:00'),
    sla_deadline: new Date('2024-08-12T08:30:00')
  },
  {
    entity_id: 'inv-002',
    entity_type: 'bpo_invoice',
    entity_name: 'INV-2024-002',
    entity_code: 'INV-002',
    status: 'in_progress',
    organization_id: 'org-techstart',
    smart_code: 'HERA.BPO.INVOICE.PROCESSING.v1',
    created_at: new Date('2024-08-11T09:15:00'),
    updated_at: new Date('2024-08-11T10:45:00'),
    created_by: 'ho-user-2',
    assigned_to: 'bo-user-1',
    invoice_number: 'INV-2024-002',
    vendor_name: 'Software Licensing Corp',
    invoice_date: new Date('2024-08-09'),
    total_amount: 15750.00,
    currency: 'USD',
    priority: 'high',
    complexity: 'complex',
    submitted_date: new Date('2024-08-11T09:15:00'),
    processing_start_date: new Date('2024-08-11T10:45:00'),
    sla_deadline: new Date('2024-08-11T21:15:00')
  },
  {
    entity_id: 'inv-003',
    entity_type: 'bpo_invoice',
    entity_name: 'INV-2024-003',
    entity_code: 'INV-003',
    status: 'verification',
    organization_id: 'org-retail-chain',
    smart_code: 'HERA.BPO.INVOICE.VERIFICATION.v1',
    created_at: new Date('2024-08-10T14:20:00'),
    updated_at: new Date('2024-08-11T11:30:00'),
    created_by: 'ho-user-3',
    assigned_to: 'bo-user-2',
    invoice_number: 'INV-2024-003',
    vendor_name: 'Marketing Agency Ltd',
    invoice_date: new Date('2024-08-08'),
    total_amount: 8900.00,
    currency: 'USD',
    priority: 'urgent',
    complexity: 'expert',
    submitted_date: new Date('2024-08-10T14:20:00'),
    processing_start_date: new Date('2024-08-11T09:00:00'),
    sla_deadline: new Date('2024-08-11T02:20:00') // Overdue
  },
  {
    entity_id: 'inv-004',
    entity_type: 'bpo_invoice',
    entity_name: 'INV-2024-004',
    entity_code: 'INV-004',
    status: 'query_raised',
    organization_id: 'org-manufacturing',
    smart_code: 'HERA.BPO.QUERY.RAISED.v1',
    created_at: new Date('2024-08-11T07:00:00'),
    updated_at: new Date('2024-08-11T11:15:00'),
    created_by: 'ho-user-4',
    assigned_to: 'bo-user-1',
    invoice_number: 'INV-2024-004',
    vendor_name: 'Industrial Equipment Co',
    invoice_date: new Date('2024-08-07'),
    total_amount: 45200.00,
    currency: 'USD',
    priority: 'high',
    complexity: 'complex',
    submitted_date: new Date('2024-08-11T07:00:00'),
    processing_start_date: new Date('2024-08-11T08:30:00'),
    sla_deadline: new Date('2024-08-12T07:00:00')
  },
  {
    entity_id: 'inv-005',
    entity_type: 'bpo_invoice',
    entity_name: 'INV-2024-005',
    entity_code: 'INV-005',
    status: 'queued',
    organization_id: 'org-consulting',
    smart_code: 'HERA.BPO.INVOICE.QUEUED.v1',
    created_at: new Date('2024-08-11T11:45:00'),
    updated_at: new Date('2024-08-11T11:45:00'),
    created_by: 'ho-user-5',
    invoice_number: 'INV-2024-005',
    vendor_name: 'Legal Services Partnership',
    invoice_date: new Date('2024-08-11'),
    total_amount: 12500.00,
    currency: 'USD',
    priority: 'low',
    complexity: 'simple',
    submitted_date: new Date('2024-08-11T11:45:00'),
    sla_deadline: new Date('2024-08-12T11:45:00')
  }
]

export default function BPOWorkQueuePage() {
  const [invoices, setInvoices] = useState<BPOInvoiceEntity[]>(mockInvoices)
  const [filteredInvoices, setFilteredInvoices] = useState<BPOInvoiceEntity[]>(mockInvoices)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<BPOInvoiceStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<BPOPriority | 'all'>('all')
  const [assignedToMe, setAssignedToMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Current user (simplified)
  const currentUserId = 'bo-user-1'

  // Apply filters
  useEffect(() => {
    let filtered = invoices

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.vendor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.entity_code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter)
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.priority === priorityFilter)
    }

    // Assigned to me filter
    if (assignedToMe) {
      filtered = filtered.filter(invoice => invoice.assigned_to === currentUserId)
    }

    // Sort by priority and SLA deadline
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority || 'medium']
      const bPriority = priorityOrder[b.priority || 'medium']
      
      if (aPriority !== bPriority) return bPriority - aPriority
      
      if (a.sla_deadline && b.sla_deadline) {
        return a.sla_deadline.getTime() - b.sla_deadline.getTime()
      }
      
      return 0
    })

    setFilteredInvoices(filtered)
  }, [invoices, searchTerm, statusFilter, priorityFilter, assignedToMe])

  // Claim invoice
  const claimInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.entity_id === invoiceId 
        ? { ...invoice, assigned_to: currentUserId, status: 'in_progress', processing_start_date: new Date() }
        : invoice
    ))
  }

  // Release invoice
  const releaseInvoice = (invoiceId: string) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.entity_id === invoiceId 
        ? { ...invoice, assigned_to: undefined, status: 'queued', processing_start_date: undefined }
        : invoice
    ))
  }

  // Statistics
  const stats = {
    total: filteredInvoices.length,
    queued: filteredInvoices.filter(i => i.status === 'queued').length,
    inProgress: filteredInvoices.filter(i => i.status === 'in_progress').length,
    verification: filteredInvoices.filter(i => i.status === 'verification').length,
    queries: filteredInvoices.filter(i => i.status === 'query_raised').length,
    myItems: filteredInvoices.filter(i => i.assigned_to === currentUserId).length,
    overdue: filteredInvoices.filter(i => i.sla_deadline && i.sla_deadline < new Date()).length
  }

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
                  Back Office Work Queue
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Processing Center
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1">Invoice processing and verification workflow</p>
              </div>
              
              <Button onClick={() => setIsLoading(!isLoading)} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Queue
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-7 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-blue-600 mb-1">Total Items</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-blue-900">{stats.total}</span>
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                <p className="text-sm text-yellow-600 mb-1">Queued</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-yellow-900">{stats.queued}</span>
                  <Clock className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm text-purple-600 mb-1">In Progress</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-purple-900">{stats.inProgress}</span>
                  <Play className="w-4 h-4 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <p className="text-sm text-orange-600 mb-1">Verification</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-orange-900">{stats.verification}</span>
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                </div>
              </div>
              
              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <p className="text-sm text-red-600 mb-1">Queries</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-red-900">{stats.queries}</span>
                  <MessageSquare className="w-4 h-4 text-red-500" />
                </div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-sm text-green-600 mb-1">My Items</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-green-900">{stats.myItems}</span>
                  <User className="w-4 h-4 text-green-500" />
                </div>
              </div>
              
              <div className="bg-red-100 rounded-xl p-4 border border-red-200">
                <p className="text-sm text-red-700 mb-1">Overdue</p>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-red-900">{stats.overdue}</span>
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="px-8 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search invoices, vendors, or PO numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value: BPOInvoiceStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem className="hera-select-item" value="all">All Status</SelectItem>
                <SelectItem className="hera-select-item" value="queued">Queued</SelectItem>
                <SelectItem className="hera-select-item" value="in_progress">In Progress</SelectItem>
                <SelectItem className="hera-select-item" value="verification">Verification</SelectItem>
                <SelectItem className="hera-select-item" value="query_raised">Query Raised</SelectItem>
                <SelectItem className="hera-select-item" value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={(value: BPOPriority | 'all') => setPriorityFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem className="hera-select-item" value="all">All Priorities</SelectItem>
                <SelectItem className="hera-select-item" value="urgent">Urgent</SelectItem>
                <SelectItem className="hera-select-item" value="high">High</SelectItem>
                <SelectItem className="hera-select-item" value="medium">Medium</SelectItem>
                <SelectItem className="hera-select-item" value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant={assignedToMe ? "default" : "outline"}
              onClick={() => setAssignedToMe(!assignedToMe)}
              className="whitespace-nowrap"
            >
              <User className="w-4 h-4 mr-2" />
              My Items Only
            </Button>
          </div>
        </div>

        {/* Invoice List */}
        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-4">
            {filteredInvoices.map((invoice) => {
              const slaStatus = getSLAStatus(
                invoice.submitted_date || new Date(),
                invoice.complexity || 'standard',
                invoice.priority || 'medium'
              )
              
              return (
                <Card key={invoice.entity_id} className="p-6 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">{invoice.invoice_number}</h3>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status.replace('_', ' ')}
                            </Badge>
                            <Badge className={getPriorityColor(invoice.priority || 'medium')}>
                              {invoice.priority}
                            </Badge>
                            {slaStatus === 'breach' || slaStatus === 'escalation' ? (
                              <Badge className="bg-red-100 text-red-700">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {slaStatus === 'escalation' ? 'Escalated' : 'SLA Breach'}
                              </Badge>
                            ) : slaStatus === 'warning' ? (
                              <Badge className="bg-orange-100 text-orange-700">
                                <Clock className="w-3 h-3 mr-1" />
                                SLA Warning
                              </Badge>
                            ) : null}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                            <div>
                              <span className="font-medium">Vendor:</span> {invoice.vendor_name}
                            </div>
                            <div>
                              <span className="font-medium">Amount:</span> {invoice.currency} {invoice.total_amount?.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Submitted:</span> {invoice.submitted_date?.toLocaleDateString()}
                            </div>
                            <div>
                              <span className="font-medium">SLA:</span> {invoice.sla_deadline?.toLocaleString()}
                            </div>
                          </div>
                          
                          {invoice.assigned_to && (
                            <div className="text-sm text-blue-600 mb-2">
                              Assigned to: {invoice.assigned_to === currentUserId ? 'You' : invoice.assigned_to}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {invoice.status === 'queued' && !invoice.assigned_to && (
                            <Button 
                              onClick={() => claimInvoice(invoice.entity_id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Claim
                            </Button>
                          )}
                          
                          {invoice.assigned_to === currentUserId && invoice.status === 'in_progress' && (
                            <>
                              <Button variant="outline" onClick={() => releaseInvoice(invoice.entity_id)}>
                                <Pause className="w-4 h-4 mr-2" />
                                Release
                              </Button>
                              <Button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                <Eye className="w-4 h-4 mr-2" />
                                Process
                              </Button>
                            </>
                          )}
                          
                          {invoice.status === 'query_raised' && (
                            <Button variant="outline" className="border-red-300 text-red-600">
                              <MessageSquare className="w-4 h-4 mr-2" />
                              View Query
                            </Button>
                          )}
                          
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4 mr-2" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
            
            {filteredInvoices.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No invoices found</h3>
                <p className="text-gray-500">Try adjusting your filters or search terms</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}