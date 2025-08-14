'use client'

import React, { useState } from 'react'
import { BPOManagementSidebar } from '@/components/bpo-progressive/BPOManagementSidebar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Shield, Search, Calendar, User, FileText, Eye,
  Download, Filter, Clock, Activity, ArrowUpRight,
  Building, MessageSquare, CheckCircle, AlertTriangle,
  Sparkles, RotateCcw, Archive, Settings, RefreshCw
} from 'lucide-react'
import { BPOWorkflowTransaction, BPO_SMART_CODES } from '@/lib/bpo/bpo-entities'

// Mock audit trail data
const auditTrail: Array<BPOWorkflowTransaction & {
  user_name: string
  invoice_number: string
  vendor_name: string
  details?: string
}> = [
  {
    transaction_id: 'txn-001',
    transaction_type: 'bpo_status_change',
    smart_code: BPO_SMART_CODES.INVOICE_PROCESSING,
    invoice_id: 'inv-001',
    invoice_number: 'INV-2024-001',
    vendor_name: 'Office Supplies Inc.',
    from_status: 'queued',
    to_status: 'in_progress',
    changed_by: 'bo-user-1',
    user_name: 'Priya Sharma',
    transaction_date: new Date('2024-08-11T10:45:00'),
    processing_duration: 120,
    sla_target: new Date('2024-08-12T08:30:00'),
    sla_met: true,
    details: 'Invoice claimed from queue and processing started'
  },
  {
    transaction_id: 'txn-002',
    transaction_type: 'bpo_status_change',
    smart_code: BPO_SMART_CODES.QUERY_RAISED,
    invoice_id: 'inv-001',
    invoice_number: 'INV-2024-001',
    vendor_name: 'Office Supplies Inc.',
    from_status: 'in_progress',
    to_status: 'query_raised',
    changed_by: 'bo-user-1',
    user_name: 'Priya Sharma',
    change_reason: 'PO number format verification needed',
    transaction_date: new Date('2024-08-11T11:15:00'),
    processing_duration: 30,
    sla_target: new Date('2024-08-12T08:30:00'),
    sla_met: true,
    details: 'Query raised regarding unusual PO number format'
  },
  {
    transaction_id: 'txn-003',
    transaction_type: 'bpo_status_change',
    smart_code: BPO_SMART_CODES.QUERY_RESOLVED,
    invoice_id: 'inv-001',
    invoice_number: 'INV-2024-001',
    vendor_name: 'Office Supplies Inc.',
    from_status: 'query_raised',
    to_status: 'in_progress',
    changed_by: 'ho-user-1',
    user_name: 'Sarah Johnson',
    change_reason: 'PO format confirmed as correct',
    transaction_date: new Date('2024-08-11T11:30:00'),
    sla_target: new Date('2024-08-12T08:30:00'),
    sla_met: true,
    details: 'Head office confirmed new PO numbering system'
  },
  {
    transaction_id: 'txn-004',
    transaction_type: 'bpo_status_change',
    smart_code: BPO_SMART_CODES.INVOICE_SUBMITTED,
    invoice_id: 'inv-004',
    invoice_number: 'INV-2024-004',
    vendor_name: 'Industrial Equipment Co',
    from_status: 'submitted',
    to_status: 'queued',
    changed_by: 'system',
    user_name: 'System',
    transaction_date: new Date('2024-08-11T07:00:00'),
    sla_target: new Date('2024-08-12T07:00:00'),
    sla_met: true,
    details: 'Invoice automatically queued for processing'
  },
  {
    transaction_id: 'txn-005',
    transaction_type: 'bpo_status_change',
    smart_code: BPO_SMART_CODES.SLA_WARNING,
    invoice_id: 'inv-003',
    invoice_number: 'INV-2024-003',
    vendor_name: 'Marketing Agency Ltd',
    from_status: 'verification',
    to_status: 'verification',
    changed_by: 'system',
    user_name: 'SLA Monitor',
    transaction_date: new Date('2024-08-11T11:00:00'),
    sla_target: new Date('2024-08-11T02:20:00'),
    sla_met: false,
    details: 'SLA warning triggered - approaching deadline'
  },
  {
    transaction_id: 'txn-006',
    transaction_type: 'bpo_status_change',
    smart_code: BPO_SMART_CODES.INVOICE_COMPLETED,
    invoice_id: 'inv-005',
    invoice_number: 'INV-2024-005',
    vendor_name: 'Legal Services Partnership',
    from_status: 'verification',
    to_status: 'completed',
    changed_by: 'bo-user-2',
    user_name: 'James Wilson',
    transaction_date: new Date('2024-08-11T12:15:00'),
    processing_duration: 180,
    sla_target: new Date('2024-08-12T11:45:00'),
    sla_met: true,
    quality_notes: 'All documentation verified and approved',
    details: 'Invoice processing completed successfully'
  },
  {
    transaction_id: 'txn-007',
    transaction_type: 'bpo_status_change',
    smart_code: BPO_SMART_CODES.ERROR_LOGGED,
    invoice_id: 'inv-002',
    invoice_number: 'INV-2024-002',
    vendor_name: 'Software Licensing Corp',
    from_status: 'in_progress',
    to_status: 'in_progress',
    changed_by: 'bo-user-1',
    user_name: 'Priya Sharma',
    error_details: 'Currency mismatch detected - USD vs EUR',
    transaction_date: new Date('2024-08-11T09:30:00'),
    sla_target: new Date('2024-08-11T21:15:00'),
    sla_met: true,
    details: 'Error detected and logged for correction'
  },
  {
    transaction_id: 'txn-008',
    transaction_type: 'bpo_status_change',
    smart_code: BPO_SMART_CODES.ESCALATION_TRIGGERED,
    invoice_id: 'inv-003',
    invoice_number: 'INV-2024-003',
    vendor_name: 'Marketing Agency Ltd',
    from_status: 'verification',
    to_status: 'escalated',
    changed_by: 'system',
    user_name: 'SLA Monitor',
    change_reason: 'SLA breach detected',
    transaction_date: new Date('2024-08-11T12:00:00'),
    sla_target: new Date('2024-08-11T02:20:00'),
    sla_met: false,
    details: 'Invoice escalated due to SLA breach'
  }
]

export default function BPOAuditPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<string | 'all'>('all')
  const [selectedUser, setSelectedUser] = useState<string | 'all'>('all')
  const [actionFilter, setActionFilter] = useState<string | 'all'>('all')
  const [dateRange, setDateRange] = useState('7d')
  const [selectedTransaction, setSelectedTransaction] = useState<typeof auditTrail[0] | null>(null)

  // Filter audit trail
  const filteredAudit = auditTrail.filter(entry => {
    const matchesSearch = !searchTerm || 
      entry.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesInvoice = selectedInvoice === 'all' || entry.invoice_id === selectedInvoice
    const matchesUser = selectedUser === 'all' || entry.changed_by === selectedUser
    const matchesAction = actionFilter === 'all' || entry.smart_code === actionFilter
    
    return matchesSearch && matchesInvoice && matchesUser && matchesAction
  })

  // Get unique values for filters
  const uniqueInvoices = Array.from(new Set(auditTrail.map(e => ({ id: e.invoice_id, number: e.invoice_number }))))
  const uniqueUsers = Array.from(new Set(auditTrail.map(e => ({ id: e.changed_by, name: e.user_name }))))
  const uniqueActions = Array.from(new Set(auditTrail.map(e => e.smart_code)))

  const getActionIcon = (smartCode: string) => {
    if (smartCode.includes('SUBMITTED')) return <FileText className="w-4 h-4 text-blue-600" />
    if (smartCode.includes('PROCESSING')) return <Activity className="w-4 h-4 text-purple-600" />
    if (smartCode.includes('COMPLETED')) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (smartCode.includes('QUERY')) return <MessageSquare className="w-4 h-4 text-orange-600" />
    if (smartCode.includes('ERROR')) return <AlertTriangle className="w-4 h-4 text-red-600" />
    if (smartCode.includes('SLA')) return <Clock className="w-4 h-4 text-red-600" />
    if (smartCode.includes('ESCALATION')) return <ArrowUpRight className="w-4 h-4 text-red-700" />
    return <Activity className="w-4 h-4 text-gray-600" />
  }

  const getActionColor = (smartCode: string) => {
    if (smartCode.includes('SUBMITTED')) return 'bg-blue-100 text-blue-700'
    if (smartCode.includes('PROCESSING')) return 'bg-purple-100 text-purple-700'
    if (smartCode.includes('COMPLETED')) return 'bg-green-100 text-green-700'
    if (smartCode.includes('QUERY')) return 'bg-orange-100 text-orange-700'
    if (smartCode.includes('ERROR')) return 'bg-red-100 text-red-700'
    if (smartCode.includes('SLA')) return 'bg-red-100 text-red-700'
    if (smartCode.includes('ESCALATION')) return 'bg-red-200 text-red-800'
    return 'bg-gray-100 text-gray-700'
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
                  Audit Trail & Compliance
                  <Badge className="bg-gradient-to-r from-gray-600 to-gray-700 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Complete Traceability
                  </Badge>
                </h1>
                <p className="text-gray-600 mt-1">Complete transaction history and compliance tracking</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Audit Log
                </Button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Total Events</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">{filteredAudit.length}</p>
              </div>

              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">SLA Compliant</span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {filteredAudit.filter(e => e.sla_met).length}
                </p>
              </div>

              <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-700">SLA Breaches</span>
                </div>
                <p className="text-2xl font-bold text-red-900">
                  {filteredAudit.filter(e => !e.sla_met).length}
                </p>
              </div>

              <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Avg Duration</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">
                  {Math.round(filteredAudit.reduce((sum, e) => sum + (e.processing_duration || 0), 0) / filteredAudit.length || 0)}m
                </p>
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
                placeholder="Search audit trail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedInvoice} onValueChange={setSelectedInvoice}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by invoice" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem className="hera-select-item" value="all">All Invoices</SelectItem>
                {uniqueInvoices.map(invoice => (
                  <SelectItem 
                    key={invoice.id} 
                    className="hera-select-item" 
                    value={invoice.id}
                  >
                    {invoice.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem className="hera-select-item" value="all">All Users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem 
                    key={user.id} 
                    className="hera-select-item" 
                    value={user.id}
                  >
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem className="hera-select-item" value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem 
                    key={action} 
                    className="hera-select-item" 
                    value={action}
                  >
                    {action.split('.').pop()?.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Audit Trail */}
        <main className="flex-1 overflow-auto p-8">
          <div className="space-y-1">
            {filteredAudit.map((entry) => (
              <Card key={entry.transaction_id} className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">
                      {getActionIcon(entry.smart_code)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{entry.invoice_number}</h3>
                        <Badge className={getActionColor(entry.smart_code)}>
                          {entry.smart_code.split('.').pop()?.replace('_', ' ')}
                        </Badge>
                        {!entry.sla_met && (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            SLA Miss
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{entry.details}</p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Building className="w-3 h-3" />
                          {entry.vendor_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.user_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {entry.transaction_date.toLocaleString()}
                        </div>
                        {entry.processing_duration && (
                          <div className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {entry.processing_duration}m duration
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTransaction(entry)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                  </div>
                </div>

                {entry.error_details && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-700">Error Details</span>
                    </div>
                    <p className="text-sm text-red-700">{entry.error_details}</p>
                  </div>
                )}

                {entry.quality_notes && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-700">Quality Notes</span>
                    </div>
                    <p className="text-sm text-green-700">{entry.quality_notes}</p>
                  </div>
                )}
              </Card>
            ))}
            
            {filteredAudit.length === 0 && (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No audit entries found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>

          {/* Transaction Detail Modal would go here */}
          {selectedTransaction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <Card className="max-w-2xl w-full max-h-96 overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedTransaction(null)}
                    >
                      ×
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Transaction ID:</span>
                        <p className="text-gray-900">{selectedTransaction.transaction_id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Smart Code:</span>
                        <p className="text-gray-900">{selectedTransaction.smart_code}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Invoice:</span>
                        <p className="text-gray-900">{selectedTransaction.invoice_number}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Changed By:</span>
                        <p className="text-gray-900">{selectedTransaction.user_name}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Status Change:</span>
                        <p className="text-gray-900">
                          {selectedTransaction.from_status} → {selectedTransaction.to_status}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">SLA Status:</span>
                        <p className={`font-medium ${selectedTransaction.sla_met ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedTransaction.sla_met ? 'Met' : 'Missed'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}