'use client'

/**
 * MCA GDPR Compliance Audit Center
 * Mobile-First Enterprise Page for Privacy & Legal Audit Tracking
 * 
 * Module: MCA
 * Entity: COMPLIANCE_REQUEST
 * Smart Code: HERA.CRM.MCA.PAGE.COMPLIANCE_AUDIT.V1
 * Path: /crm/mca/settings/compliance
 * Description: GDPR/CCPA compliance management with DSAR, RTBF, and consent audit trails
 */

import React, { useState, useCallback, useEffect } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileFilters, type FilterField } from '@/components/mobile/MobileFilters'
import { MobileDataTable, type TableColumn, type TableRecord } from '@/components/mobile/MobileDataTable'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { 
  AlertCircle,
  AlertTriangle,
  Archive,
  CheckCircle,
  Clock,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Lock,
  MoreVertical,
  PieChart,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  TrendingUp,
  Upload,
  User,
  UserX,
  X,
  Zap
} from 'lucide-react'

/**
 * Compliance Request Entity Interface
 * Extends TableRecord for HERA compliance
 */
interface ComplianceRequest extends TableRecord {
  id: string
  entity_id?: string
  entity_name: string
  smart_code: string
  status?: string
  
  // Dynamic fields (stored in core_dynamic_data)
  request_id?: string
  request_type?: string
  contact_id?: string
  contact_name?: string
  requested_at?: string
  completed_at?: string
  processor?: string
  evidence_link?: string
  legal_basis?: string
  
  // System fields
  created_at?: string
  updated_at?: string
  created_by?: string
  updated_by?: string
}

/**
 * HERA Compliance Audit Smart Codes
 */
const COMPLIANCE_SMART_CODES = {
  PAGE: 'HERA.CRM.MCA.PAGE.COMPLIANCE_AUDIT.V1',
  ENTITY: 'HERA.CRM.MCA.ENTITY.COMPLIANCE_REQUEST.V1',
  FIELD_REQUEST_ID: 'HERA.CRM.MCA.DYN.COMPLIANCE_REQUEST.V1.REQUEST_ID.V1',
  FIELD_REQUEST_TYPE: 'HERA.CRM.MCA.DYN.COMPLIANCE_REQUEST.V1.REQUEST_TYPE.V1',
  FIELD_CONTACT_ID: 'HERA.CRM.MCA.DYN.COMPLIANCE_REQUEST.V1.CONTACT_ID.V1',
  FIELD_PROCESSOR: 'HERA.CRM.MCA.DYN.COMPLIANCE_REQUEST.V1.PROCESSOR.V1',
  FIELD_EVIDENCE_LINK: 'HERA.CRM.MCA.DYN.COMPLIANCE_REQUEST.V1.EVIDENCE_LINK.V1',
  
  // Transaction smart codes for GDPR events
  EVENT_CONSENT_GIVEN: 'HERA.CRM.MCA.EVENT.CONSENT_GIVEN.V1',
  EVENT_CONSENT_REVOKED: 'HERA.CRM.MCA.EVENT.CONSENT_REVOKED.V1',
  EVENT_RTBF_EXECUTED: 'HERA.CRM.MCA.EVENT.RTBF_EXECUTED.V1',
  EVENT_DSAR_COMPLETED: 'HERA.CRM.MCA.EVENT.DSAR_COMPLETED.V1'
} as const

/**
 * Compliance Audit Main Page Component
 * Enterprise-grade GDPR/CCPA compliance management
 */
export default function ComplianceAuditPage() {
  const { currentOrganization, isAuthenticated, user } = useHERAAuth()
  const [selectedRequests, setSelectedRequests] = useState<(string | number)[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showExecuteModal, setShowExecuteModal] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<ComplianceRequest | null>(null)
  const [filters, setFilters] = useState({
    date_range: '30d',
    status: '',
    request_type: '',
    organization: ''
  })

  // Mock compliance request data (in production, this would use useUniversalEntity with universal_transactions)
  const complianceRequests: ComplianceRequest[] = [
    {
      id: '1',
      entity_id: '1',
      entity_name: 'DSAR Request - John Doe',
      smart_code: 'HERA.CRM.MCA.ENTITY.COMPLIANCE_REQUEST.V1',
      request_id: 'DSAR-2024-001',
      request_type: 'DSAR',
      contact_id: 'contact_123',
      contact_name: 'John Doe',
      requested_at: '2024-10-12T09:00:00Z',
      completed_at: '2024-10-14T15:30:00Z',
      processor: 'Privacy Officer',
      evidence_link: 'https://evidence.example.com/dsar-001.pdf',
      legal_basis: 'GDPR Art. 15',
      status: 'completed',
      created_at: '2024-10-12T09:00:00Z'
    },
    {
      id: '2',
      entity_id: '2',
      entity_name: 'RTBF Request - Jane Smith',
      smart_code: 'HERA.CRM.MCA.ENTITY.COMPLIANCE_REQUEST.V1',
      request_id: 'RTBF-2024-002',
      request_type: 'RTBF',
      contact_id: 'contact_456',
      contact_name: 'Jane Smith',
      requested_at: '2024-10-13T14:20:00Z',
      processor: 'Data Protection Team',
      legal_basis: 'GDPR Art. 17',
      status: 'pending',
      created_at: '2024-10-13T14:20:00Z'
    },
    {
      id: '3',
      entity_id: '3',
      entity_name: 'Consent Audit - Mike Johnson',
      smart_code: 'HERA.CRM.MCA.ENTITY.COMPLIANCE_REQUEST.V1',
      request_id: 'CONSENT-2024-003',
      request_type: 'Consent',
      contact_id: 'contact_789',
      contact_name: 'Mike Johnson',
      requested_at: '2024-10-14T11:45:00Z',
      processor: 'Compliance Manager',
      legal_basis: 'GDPR Art. 6(1)(a)',
      status: 'in_progress',
      created_at: '2024-10-14T11:45:00Z'
    }
  ]

  // Calculate KPIs
  const activeDSARRequests = complianceRequests.filter(r => r.request_type === 'DSAR' && r.status !== 'completed').length
  const pendingRTBFExecutions = complianceRequests.filter(r => r.request_type === 'RTBF' && r.status === 'pending').length
  const completedExports = complianceRequests.filter(r => r.status === 'completed').length
  const consentViolations = complianceRequests.filter(r => r.request_type === 'Consent' && r.status === 'violation').length

  const kpis = [
    {
      title: 'Active DSAR Requests',
      value: activeDSARRequests.toString(),
      change: '+2',
      trend: 'up' as const,
      icon: FileText
    },
    {
      title: 'Pending RTBF Executions',
      value: pendingRTBFExecutions.toString(),
      change: '-1',
      trend: 'down' as const,
      icon: UserX
    },
    {
      title: 'Completed Exports',
      value: completedExports.toString(),
      change: '+5',
      trend: 'up' as const,
      icon: Download
    },
    {
      title: 'Consent Violations',
      value: consentViolations.toString(),
      change: '0',
      trend: 'neutral' as const,
      icon: AlertTriangle
    }
  ]

  // Chart data for RTBF Requests Over Time
  const rtbfOverTime = [
    { date: '10/07', requests: 3 },
    { date: '10/08', requests: 1 },
    { date: '10/09', requests: 4 },
    { date: '10/10', requests: 2 },
    { date: '10/11', requests: 6 },
    { date: '10/12', requests: 3 },
    { date: '10/13', requests: 5 },
    { date: '10/14', requests: 2 }
  ]

  // Chart data for Consent Change Reasons
  const consentChangeReasons = [
    { reason: 'Marketing Opt-out', count: 45, color: '#e74c3c' },
    { reason: 'Privacy Concerns', count: 32, color: '#f39c12' },
    { reason: 'Service Cancellation', count: 28, color: '#3498db' },
    { reason: 'Legal Request', count: 12, color: '#2ecc71' },
    { reason: 'Other', count: 8, color: '#95a5a6' }
  ]

  // Enhanced table columns
  const columns: TableColumn[] = [
    { key: 'request_id', label: 'Request ID', sortable: true },
    { key: 'request_type', label: 'Type', sortable: true },
    { key: 'contact_name', label: 'Contact', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'requested_at', label: 'Requested At', sortable: true },
    { key: 'completed_at', label: 'Completed At', sortable: true },
    { key: 'processor', label: 'Processor', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false }
  ]

  // Enhanced filter fields
  const filterFields: FilterField[] = [
    { key: 'date_range', label: 'Date Range', type: 'select', options: [
      { value: '7d', label: 'Last 7 days' },
      { value: '30d', label: 'Last 30 days' },
      { value: '90d', label: 'Last 90 days' },
      { value: 'custom', label: 'Custom range' }
    ]},
    { key: 'status', label: 'Status', type: 'select', options: [
      { value: '', label: 'All Status' },
      { value: 'pending', label: 'Pending' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'completed', label: 'Completed' },
      { value: 'violation', label: 'Violation' }
    ]},
    { key: 'request_type', label: 'Type', type: 'select', options: [
      { value: '', label: 'All Types' },
      { value: 'DSAR', label: 'DSAR' },
      { value: 'RTBF', label: 'Right to be Forgotten' },
      { value: 'Consent', label: 'Consent Audit' }
    ]}
  ]

  // Helper functions
  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'DSAR': return <FileText className="h-4 w-4" />
      case 'RTBF': return <UserX className="h-4 w-4" />
      case 'Consent': return <Shield className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'violation': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'DSAR': return 'text-blue-600 bg-blue-100'
      case 'RTBF': return 'text-red-600 bg-red-100'
      case 'Consent': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Handler functions
  const handleExecuteRTBF = async (request: ComplianceRequest) => {
    setCurrentRequest(request)
    setShowExecuteModal(true)
  }

  const handleExportDataPackage = async (requestId: string) => {
    console.log('Exporting data package for request:', requestId)
    // In production, this would trigger the data export process
  }

  const handleGenerateDPIA = async () => {
    console.log('Generating DPIA report')
    // In production, this would generate a Data Protection Impact Assessment report
  }

  // Enterprise security checks
  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p>Please log in to access Compliance Audit Center.</p>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="p-4 text-center">
        <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
        <p>No organization context found. Please select an organization.</p>
      </div>
    )
  }

  return (
    <MobilePageLayout
      title="Compliance Audit Center"
      subtitle={`${complianceRequests.length} privacy requests managed`}
      primaryColor="#c0392b"
      accentColor="#a93226"
      showBackButton={true}
    >
      {/* Enterprise KPI Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <MobileCard key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="text-center">
              <kpi.icon className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">{kpi.title}</p>
              <p className="text-xl font-bold" style={{ color: '#c0392b' }}>{kpi.value}</p>
              <p className={`text-xs font-medium ${kpi.trend === 'up' ? 'text-green-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                {kpi.change}
              </p>
            </div>
          </MobileCard>
        ))}
      </div>

      {/* Enhanced Filters */}
      <MobileFilters
        fields={filterFields}
        values={filters}
        onChange={setFilters}
        className="mb-6"
      />

      {/* Compliance Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* RTBF Requests Over Time */}
        <MobileCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">RTBF Requests Over Time</h3>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="h-32 flex items-end justify-between space-x-2">
            {rtbfOverTime.map((day, index) => (
              <div key={index} className="flex flex-col items-center space-y-1">
                <div 
                  className="w-8 bg-red-500 rounded-t"
                  style={{ height: `${(day.requests / 8) * 100}px` }}
                  title={`${day.requests} requests`}
                ></div>
                <span className="text-xs text-gray-500 transform -rotate-45">{day.date}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-600">Average: 3.3 requests/day</span>
          </div>
        </MobileCard>

        {/* Consent Change Reasons */}
        <MobileCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Consent Change Reasons</h3>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {consentChangeReasons.map((reason, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: reason.color }}
                  ></div>
                  <span className="text-sm font-medium">{reason.reason}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        backgroundColor: reason.color, 
                        width: `${(reason.count / 50) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{reason.count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t text-center">
            <span className="text-sm text-gray-600">Total: 125 consent changes this month</span>
          </div>
        </MobileCard>
      </div>

      {/* Compliance Requests Table */}
      <MobileDataTable
        data={complianceRequests}
        columns={columns}
        selectedRows={selectedRequests}
        onRowSelect={setSelectedRequests}
        showBulkActions={selectedRequests.length > 0}
        bulkActions={[
          {
            label: 'Export Selected',
            action: async () => {
              console.log('Bulk exporting requests:', selectedRequests)
              setSelectedRequests([])
            },
            variant: 'default'
          }
        ]}
        mobileCardRender={(request) => (
          <MobileCard key={request.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-gray-100">
                  {getRequestTypeIcon(request.request_type || '')}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-base">{request.request_id}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRequestTypeColor(request.request_type || '')}`}>
                      {request.request_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{request.contact_name}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status || '')}`}>
                {request.status}
              </span>
            </div>
            
            {/* Request details */}
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Legal Basis:</span>
                <span className="font-medium">{request.legal_basis}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Processor:</span>
                <span className="font-medium">{request.processor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Requested:</span>
                <span className="text-xs">
                  {request.requested_at ? new Date(request.requested_at).toLocaleString() : 'N/A'}
                </span>
              </div>
              {request.completed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed:</span>
                  <span className="text-xs text-green-600">
                    {new Date(request.completed_at).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center pt-3 border-t">
              <div className="flex space-x-2">
                {request.request_type === 'RTBF' && request.status === 'pending' && (
                  <button
                    onClick={() => handleExecuteRTBF(request)}
                    className="flex items-center space-x-1 px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    <UserX className="h-3 w-3" />
                    <span>Execute RTBF</span>
                  </button>
                )}
                {request.request_type === 'DSAR' && (
                  <button
                    onClick={() => handleExportDataPackage(request.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                  >
                    <Download className="h-3 w-3" />
                    <span>Export</span>
                  </button>
                )}
                {request.evidence_link && (
                  <a
                    href={request.evidence_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Evidence</span>
                  </a>
                )}
              </div>
              <span className="text-xs text-gray-500">
                Created: {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </MobileCard>
        )}
      />

      {/* Floating Action Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-6 right-6 text-white rounded-full p-4 shadow-lg transition-colors z-50 hover:shadow-xl"
        style={{ backgroundColor: '#c0392b' }}
        title="New Compliance Action"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* New Compliance Action Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">New Compliance Action</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">Initiate a new privacy compliance action or audit.</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    console.log('Creating new DSAR request')
                    setShowAddModal(false)
                  }}
                  className="flex flex-col items-center p-4 border-2 border-blue-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <FileText className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="font-medium">DSAR Request</span>
                  <span className="text-sm text-gray-500 text-center">Data Subject Access Request</span>
                </button>
                <button
                  onClick={() => {
                    console.log('Creating new RTBF request')
                    setShowAddModal(false)
                  }}
                  className="flex flex-col items-center p-4 border-2 border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  <UserX className="h-8 w-8 text-red-600 mb-2" />
                  <span className="font-medium">RTBF Request</span>
                  <span className="text-sm text-gray-500 text-center">Right to be Forgotten</span>
                </button>
                <button
                  onClick={() => handleGenerateDPIA()}
                  className="flex flex-col items-center p-4 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <Shield className="h-8 w-8 text-green-600 mb-2" />
                  <span className="font-medium">DPIA Report</span>
                  <span className="text-sm text-gray-500 text-center">Data Protection Impact Assessment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Execute RTBF Modal */}
      {showExecuteModal && currentRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Execute Right to be Forgotten</h3>
              <button onClick={() => setShowExecuteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="text-center py-4">
              <UserX className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Execute data deletion for {currentRequest.contact_name}?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This action will permanently delete all personal data associated with this contact. 
                This process cannot be undone and will be logged for audit purposes.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-yellow-800">Warning</p>
                    <p className="text-sm text-yellow-700">
                      Ensure legal basis review is complete and all retention periods have expired.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowExecuteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    console.log('Executing RTBF for request:', currentRequest.id)
                    setShowExecuteModal(false)
                    setCurrentRequest(null)
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Execute RTBF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MobilePageLayout>
  )
}