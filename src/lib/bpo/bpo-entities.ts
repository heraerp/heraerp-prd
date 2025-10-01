// HERA BPO Invoice Workflow - Universal Entity Model
// Using HERA's 7-table universal architecture

export interface BPOInvoiceEntity {
  // Core entity properties (maps to core_entities)
  entity_id: string
  entity_type: 'bpo_invoice'
  entity_name: string // Invoice number/reference
  entity_code: string // Unique invoice code
  status: BPOInvoiceStatus
  organization_id: string
  client_id?: string
  smart_code: string // HERA.BPO.INVOICE.{STATUS}.v1

  // Basic invoice metadata
  created_at: Date
  updated_at: Date
  created_by: string
  assigned_to?: string

  // Core invoice data (stored in core_dynamic_data)
  invoice_number?: string
  vendor_name?: string
  invoice_date?: Date
  due_date?: Date
  total_amount?: number
  currency?: string
  po_number?: string
  description?: string

  // Workflow data
  submitted_date?: Date
  processing_start_date?: Date
  completed_date?: Date
  verification_date?: Date
  approval_date?: Date

  // Processing metadata
  priority: BPOPriority
  complexity: BPOComplexity
  sla_deadline?: Date
  processing_time_hours?: number

  // Quality metrics
  error_count?: number
  revision_count?: number
  quality_score?: number

  // Attachment references
  original_invoice_url?: string
  processed_document_url?: string
  supporting_documents?: string[]

  // Communication thread ID
  communication_thread_id?: string
}

export type BPOInvoiceStatus =
  | 'submitted' // HO uploaded invoice
  | 'queued' // Waiting in BO work queue
  | 'in_progress' // BO currently processing
  | 'verification' // Under BO quality review
  | 'query_raised' // BO has questions for HO
  | 'query_resolved' // HO responded to query
  | 'completed' // BO processing complete
  | 'approved' // HO approved final result
  | 'rejected' // HO rejected, needs rework
  | 'on_hold' // Temporarily paused
  | 'escalated' // Escalated to supervisor

export type BPOPriority = 'low' | 'medium' | 'high' | 'urgent'
export type BPOComplexity = 'simple' | 'standard' | 'complex' | 'expert'

// User roles in the BPO system
export type BPOUserRole = 'head-office' | 'back-office' | 'supervisor' | 'admin'

// Communication entity for invoice threads
export interface BPOCommunicationEntity {
  entity_id: string
  entity_type: 'bpo_communication'
  entity_name: string // Thread title
  smart_code: 'HERA.BPO.COMM.THREAD.V1'

  // Core properties
  invoice_id: string
  thread_status: 'active' | 'resolved' | 'closed'
  priority: BPOPriority

  // Participants
  head_office_user_id: string
  back_office_user_id: string
  created_by: string

  // Metadata
  created_at: Date
  last_message_at?: Date
  message_count?: number
  unread_count_ho?: number
  unread_count_bo?: number
}

// Message entity for individual messages
export interface BPOMessageEntity {
  entity_id: string
  entity_type: 'bpo_message'
  entity_name: string // Message subject/preview
  smart_code: 'HERA.BPO.COMM.MESSAGE.V1'

  // Core properties
  thread_id: string
  sender_id: string
  sender_role: BPOUserRole
  message_content: string
  message_type: 'text' | 'query' | 'response' | 'status_update' | 'attachment'

  // Metadata
  created_at: Date
  read_at?: Date
  is_read: boolean

  // Attachments
  attachments?: string[]
}

// Workflow state tracking using universal_transactions
export interface BPOWorkflowTransaction {
  transaction_id: string
  transaction_type: 'bpo_status_change'
  smart_code: string // HERA.BPO.WORKFLOW.{ACTION}.v1

  // Core transaction data
  invoice_id: string
  from_status: BPOInvoiceStatus
  to_status: BPOInvoiceStatus
  changed_by: string
  change_reason?: string

  // Timing data
  transaction_date: Date
  processing_duration?: number // Minutes spent in previous status

  // SLA tracking
  sla_target?: Date
  sla_met: boolean

  // Quality metrics
  quality_notes?: string
  error_details?: string
}

// SLA configuration
export interface BPOSLAConfig {
  complexity: BPOComplexity
  priority: BPOPriority
  target_hours: number
  escalation_hours: number
  warning_hours: number
}

// Default SLA matrix
export const BPO_SLA_MATRIX: BPOSLAConfig[] = [
  // Simple invoices
  {
    complexity: 'simple',
    priority: 'low',
    target_hours: 24,
    escalation_hours: 48,
    warning_hours: 20
  },
  {
    complexity: 'simple',
    priority: 'medium',
    target_hours: 12,
    escalation_hours: 24,
    warning_hours: 10
  },
  {
    complexity: 'simple',
    priority: 'high',
    target_hours: 6,
    escalation_hours: 12,
    warning_hours: 5
  },
  {
    complexity: 'simple',
    priority: 'urgent',
    target_hours: 2,
    escalation_hours: 4,
    warning_hours: 1.5
  },

  // Standard invoices
  {
    complexity: 'standard',
    priority: 'low',
    target_hours: 48,
    escalation_hours: 72,
    warning_hours: 40
  },
  {
    complexity: 'standard',
    priority: 'medium',
    target_hours: 24,
    escalation_hours: 48,
    warning_hours: 20
  },
  {
    complexity: 'standard',
    priority: 'high',
    target_hours: 12,
    escalation_hours: 24,
    warning_hours: 10
  },
  {
    complexity: 'standard',
    priority: 'urgent',
    target_hours: 4,
    escalation_hours: 8,
    warning_hours: 3
  },

  // Complex invoices
  {
    complexity: 'complex',
    priority: 'low',
    target_hours: 72,
    escalation_hours: 120,
    warning_hours: 60
  },
  {
    complexity: 'complex',
    priority: 'medium',
    target_hours: 48,
    escalation_hours: 72,
    warning_hours: 40
  },
  {
    complexity: 'complex',
    priority: 'high',
    target_hours: 24,
    escalation_hours: 48,
    warning_hours: 20
  },
  {
    complexity: 'complex',
    priority: 'urgent',
    target_hours: 8,
    escalation_hours: 16,
    warning_hours: 6
  },

  // Expert invoices
  {
    complexity: 'expert',
    priority: 'low',
    target_hours: 120,
    escalation_hours: 168,
    warning_hours: 96
  },
  {
    complexity: 'expert',
    priority: 'medium',
    target_hours: 72,
    escalation_hours: 120,
    warning_hours: 60
  },
  {
    complexity: 'expert',
    priority: 'high',
    target_hours: 48,
    escalation_hours: 72,
    warning_hours: 40
  },
  {
    complexity: 'expert',
    priority: 'urgent',
    target_hours: 12,
    escalation_hours: 24,
    warning_hours: 10
  }
]

// Smart codes for different BPO workflow actions
export const BPO_SMART_CODES = {
  // Invoice lifecycle
  INVOICE_SUBMITTED: 'HERA.BPO.INVOICE.SUBMITTED.V1',
  INVOICE_QUEUED: 'HERA.BPO.INVOICE.QUEUED.V1',
  INVOICE_PROCESSING: 'HERA.BPO.INVOICE.PROCESSING.V1',
  INVOICE_VERIFICATION: 'HERA.BPO.INVOICE.VERIFICATION.V1',
  INVOICE_COMPLETED: 'HERA.BPO.INVOICE.COMPLETED.V1',
  INVOICE_APPROVED: 'HERA.BPO.INVOICE.APPROVED.V1',
  INVOICE_REJECTED: 'HERA.BPO.INVOICE.REJECTED.V1',

  // Query management
  QUERY_RAISED: 'HERA.BPO.QUERY.RAISED.V1',
  QUERY_RESPONDED: 'HERA.BPO.QUERY.RESPONDED.V1',
  QUERY_RESOLVED: 'HERA.BPO.QUERY.RESOLVED.V1',

  // Communication
  MESSAGE_SENT: 'HERA.BPO.COMM.MESSAGE.SENT.V1',
  THREAD_CREATED: 'HERA.BPO.COMM.THREAD.CREATED.V1',
  THREAD_CLOSED: 'HERA.BPO.COMM.THREAD.CLOSED.V1',

  // Escalations
  SLA_WARNING: 'HERA.BPO.SLA.WARNING.V1',
  SLA_BREACH: 'HERA.BPO.SLA.BREACH.V1',
  ESCALATION_TRIGGERED: 'HERA.BPO.ESCALATION.TRIGGERED.V1',

  // Quality metrics
  QUALITY_CHECK: 'HERA.BPO.QUALITY.CHECK.V1',
  ERROR_LOGGED: 'HERA.BPO.ERROR.LOGGED.V1',
  REVISION_REQUESTED: 'HERA.BPO.REVISION.REQUESTED.V1'
} as const

// KPI calculation functions
export interface BPOKPIs {
  totalInvoices: number
  averageProcessingTime: number
  slaCompliance: number
  errorRate: number
  qualityScore: number

  // By status
  statusBreakdown: Record<BPOInvoiceStatus, number>

  // By priority
  priorityBreakdown: Record<BPOPriority, number>

  // By complexity
  complexityBreakdown: Record<BPOComplexity, number>

  // Trending data
  dailyVolume: Array<{ date: string; count: number }>
  processingTrends: Array<{ date: string; avgHours: number }>
  qualityTrends: Array<{ date: string; score: number }>
}

// Utility functions for SLA management
export function getSLAConfig(complexity: BPOComplexity, priority: BPOPriority): BPOSLAConfig {
  return (
    BPO_SLA_MATRIX.find(
      config => config.complexity === complexity && config.priority === priority
    ) || BPO_SLA_MATRIX[0]
  )
}

export function calculateSLADeadline(
  submittedDate: Date,
  complexity: BPOComplexity,
  priority: BPOPriority
): Date {
  const config = getSLAConfig(complexity, priority)
  const deadline = new Date(submittedDate)
  deadline.setHours(deadline.getHours() + config.target_hours)
  return deadline
}

export function getSLAStatus(
  submittedDate: Date,
  complexity: BPOComplexity,
  priority: BPOPriority,
  currentDate: Date = new Date()
): 'safe' | 'warning' | 'breach' | 'escalation' {
  const config = getSLAConfig(complexity, priority)
  const hoursElapsed = (currentDate.getTime() - submittedDate.getTime()) / (1000 * 60 * 60)

  if (hoursElapsed >= config.escalation_hours) return 'escalation'
  if (hoursElapsed >= config.target_hours) return 'breach'
  if (hoursElapsed >= config.warning_hours) return 'warning'
  return 'safe'
}

export function getStatusColor(status: BPOInvoiceStatus): string {
  const colors: Record<BPOInvoiceStatus, string> = {
    submitted: 'bg-blue-100 text-blue-700',
    queued: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-purple-100 text-purple-700',
    verification: 'bg-orange-100 text-orange-700',
    query_raised: 'bg-red-100 text-red-700',
    query_resolved: 'bg-green-100 text-green-700',
    completed: 'bg-green-100 text-green-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    on_hold: 'bg-gray-100 text-gray-700',
    escalated: 'bg-red-200 text-red-800'
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

export function getPriorityColor(priority: BPOPriority): string {
  const colors: Record<BPOPriority, string> = {
    low: 'bg-gray-100 text-gray-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700'
  }
  return colors[priority]
}
