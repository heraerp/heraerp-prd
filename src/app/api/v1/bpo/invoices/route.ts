import { NextRequest, NextResponse } from 'next/server'
import {
  BPOInvoiceEntity,
  BPOInvoiceStatus,
  BPOPriority,
  BPOComplexity,
  BPO_SMART_CODES
} from '@/src/lib/bpo/bpo-entities'

// Mock invoice storage
let mockInvoices: BPOInvoiceEntity[] = [
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
    total_amount: 2450.0,
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
    total_amount: 15750.0,
    currency: 'USD',
    priority: 'high',
    complexity: 'complex',
    submitted_date: new Date('2024-08-11T09:15:00'),
    processing_start_date: new Date('2024-08-11T10:45:00'),
    sla_deadline: new Date('2024-08-11T21:15:00')
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')
    const status = searchParams.get('status') as BPOInvoiceStatus
    const priority = searchParams.get('priority') as BPOPriority
    const assignedTo = searchParams.get('assignedTo')
    const organizationId = searchParams.get('organizationId')

    let filteredInvoices = mockInvoices

    // Apply filters
    if (invoiceId) {
      const invoice = mockInvoices.find(inv => inv.entity_id === invoiceId)
      if (!invoice) {
        return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
      }
      return NextResponse.json({
        success: true,
        data: invoice
      })
    }

    if (status) {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === status)
    }

    if (priority) {
      filteredInvoices = filteredInvoices.filter(inv => inv.priority === priority)
    }

    if (assignedTo) {
      filteredInvoices = filteredInvoices.filter(inv => inv.assigned_to === assignedTo)
    }

    if (organizationId) {
      filteredInvoices = filteredInvoices.filter(inv => inv.organization_id === organizationId)
    }

    // Sort by priority and SLA deadline
    filteredInvoices.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const aPriority = priorityOrder[a.priority || 'medium']
      const bPriority = priorityOrder[b.priority || 'medium']

      if (aPriority !== bPriority) return bPriority - aPriority

      if (a.sla_deadline && b.sla_deadline) {
        return a.sla_deadline.getTime() - b.sla_deadline.getTime()
      }

      return 0
    })

    return NextResponse.json({
      success: true,
      data: filteredInvoices,
      count: filteredInvoices.length,
      total: mockInvoices.length
    })
  } catch (error) {
    console.error('Error retrieving BPO invoices:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve invoices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'create_invoice') {
      // Create new invoice
      const newInvoice: BPOInvoiceEntity = {
        entity_id: `inv-${Date.now()}`,
        entity_type: 'bpo_invoice',
        entity_name: data.invoice_number,
        entity_code: `INV-${Date.now()}`,
        status: 'submitted',
        organization_id: data.organization_id,
        smart_code: BPO_SMART_CODES.INVOICE_SUBMITTED,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: data.created_by,
        invoice_number: data.invoice_number,
        vendor_name: data.vendor_name,
        invoice_date: data.invoice_date ? new Date(data.invoice_date) : undefined,
        due_date: data.due_date ? new Date(data.due_date) : undefined,
        total_amount: parseFloat(data.total_amount),
        currency: data.currency || 'USD',
        po_number: data.po_number,
        description: data.description,
        priority: data.priority || 'medium',
        complexity: data.complexity || 'standard',
        submitted_date: new Date(),
        original_invoice_url: data.original_invoice_url,
        supporting_documents: data.supporting_documents || []
      }

      // Calculate SLA deadline based on complexity and priority
      const slaHours = getSLAHours(newInvoice.complexity, newInvoice.priority)
      newInvoice.sla_deadline = new Date(Date.now() + slaHours * 60 * 60 * 1000)

      mockInvoices.push(newInvoice)

      return NextResponse.json({
        success: true,
        data: newInvoice,
        message: 'Invoice created successfully'
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 })
  } catch (error) {
    console.error('Error creating BPO invoice:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { invoice_id, action, data } = body

    const invoiceIndex = mockInvoices.findIndex(inv => inv.entity_id === invoice_id)
    if (invoiceIndex === -1) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    const invoice = mockInvoices[invoiceIndex]

    if (action === 'claim') {
      // Claim invoice for processing
      invoice.assigned_to = data.user_id
      invoice.status = 'in_progress'
      invoice.processing_start_date = new Date()
      invoice.smart_code = BPO_SMART_CODES.INVOICE_PROCESSING
      invoice.updated_at = new Date()

      return NextResponse.json({
        success: true,
        data: invoice,
        message: 'Invoice claimed successfully'
      })
    }

    if (action === 'release') {
      // Release invoice back to queue
      invoice.assigned_to = undefined
      invoice.status = 'queued'
      invoice.processing_start_date = undefined
      invoice.smart_code = BPO_SMART_CODES.INVOICE_QUEUED
      invoice.updated_at = new Date()

      return NextResponse.json({
        success: true,
        data: invoice,
        message: 'Invoice released to queue'
      })
    }

    if (action === 'update_status') {
      // Update invoice status
      const oldStatus = invoice.status
      invoice.status = data.status as BPOInvoiceStatus
      invoice.updated_at = new Date()

      // Update smart code based on new status
      const smartCodes: Record<BPOInvoiceStatus, string> = {
        submitted: BPO_SMART_CODES.INVOICE_SUBMITTED,
        queued: BPO_SMART_CODES.INVOICE_QUEUED,
        in_progress: BPO_SMART_CODES.INVOICE_PROCESSING,
        verification: BPO_SMART_CODES.INVOICE_VERIFICATION,
        query_raised: BPO_SMART_CODES.QUERY_RAISED,
        query_resolved: BPO_SMART_CODES.QUERY_RESOLVED,
        completed: BPO_SMART_CODES.INVOICE_COMPLETED,
        approved: BPO_SMART_CODES.INVOICE_APPROVED,
        rejected: BPO_SMART_CODES.INVOICE_REJECTED,
        on_hold: 'HERA.BPO.INVOICE.ON_HOLD.v1',
        escalated: BPO_SMART_CODES.ESCALATION_TRIGGERED
      }

      invoice.smart_code = smartCodes[invoice.status] || invoice.smart_code

      // Set completion dates
      if (invoice.status === 'completed') {
        invoice.completed_date = new Date()
      }
      if (invoice.status === 'verification') {
        invoice.verification_date = new Date()
      }
      if (invoice.status === 'approved') {
        invoice.approval_date = new Date()
      }

      return NextResponse.json({
        success: true,
        data: invoice,
        message: `Invoice status updated from ${oldStatus} to ${invoice.status}`
      })
    }

    if (action === 'update_details') {
      // Update invoice details
      Object.assign(invoice, data, { updated_at: new Date() })

      return NextResponse.json({
        success: true,
        data: invoice,
        message: 'Invoice details updated successfully'
      })
    }

    return NextResponse.json({ success: false, error: 'Invalid action specified' }, { status: 400 })
  } catch (error) {
    console.error('Error updating BPO invoice:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 })
    }

    const invoiceIndex = mockInvoices.findIndex(inv => inv.entity_id === invoiceId)
    if (invoiceIndex === -1) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    const deletedInvoice = mockInvoices.splice(invoiceIndex, 1)[0]

    return NextResponse.json({
      success: true,
      data: deletedInvoice,
      message: 'Invoice deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting BPO invoice:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete invoice',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Helper function to calculate SLA hours based on complexity and priority
function getSLAHours(
  complexity: BPOComplexity = 'standard',
  priority: BPOPriority = 'medium'
): number {
  const slaMatrix: Record<BPOComplexity, Record<BPOPriority, number>> = {
    simple: { urgent: 2, high: 6, medium: 12, low: 24 },
    standard: { urgent: 4, high: 12, medium: 24, low: 48 },
    complex: { urgent: 8, high: 24, medium: 48, low: 72 },
    expert: { urgent: 12, high: 48, medium: 72, low: 120 }
  }

  return slaMatrix[complexity][priority]
}
