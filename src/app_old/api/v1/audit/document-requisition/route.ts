import { NextRequest, NextResponse } from 'next/server'
import { DOCUMENT_CATEGORIES } from '@/types/audit.types'

/**
 * HERA Audit Document Requisition API
 *
 * Manages document requisitions using universal architecture:
 * - Document requisitions as universal_transactions with smart_code='HERA.AUD.DOC.TXN.REQ.v1'
 * - Document line items as universal_transaction_lines
 * - Document metadata in core_dynamic_data
 * - Status tracking and workflow management
 */

const AUDIT_FIRM_ORG_ID = '719dfed1-09b4-4ca8-bfda-f682460de945'

// Mock document requisitions
const mockRequisitions = [
  {
    id: 'req_001',
    organization_id: AUDIT_FIRM_ORG_ID,
    transaction_type: 'document_requisition',
    smart_code: 'HERA.AUD.DOC.TXN.REQ.v1',
    reference_number: 'DOC-REQ-2025-001',
    transaction_date: '2025-01-10',
    entity_from: AUDIT_FIRM_ORG_ID,
    entity_to: 'client_org_xyz_manufacturing',
    total_amount: 0, // Non-financial transaction
    currency: 'USD',
    status: 'sent',
    workflow_state: 'document_collection',
    metadata: {
      client_id: 'client_001',
      client_name: 'XYZ Manufacturing Ltd',
      audit_year: '2025',
      due_date: '2025-01-31',
      total_documents: 31,
      documents_received: 18,
      documents_approved: 12,
      completion_percentage: 39,
      categories: ['A', 'B', 'C', 'D', 'E', 'F'],
      sent_date: '2025-01-10',
      reminder_sent_dates: ['2025-01-20'],
      client_portal_access: true
    },
    smart_code_metadata: {
      framework: 'GSPU_2025',
      document_format: 'excel_requisition',
      retention_years: 7,
      compliance_standards: ['ISA', 'PCAOB']
    }
  }
]

// Generate document line items based on GSPU categories
const generateDocumentLineItems = (requisitionId: string, clientId: string, dueDate: string) => {
  const lineItems: any[] = []
  let lineNumber = 1

  Object.entries(DOCUMENT_CATEGORIES).forEach(([categoryKey, category]) => {
    category.items.forEach((item, index) => {
      // Mock some documents as received/approved for demo
      const mockStatuses = ['pending', 'received', 'approved', 'under_review']
      const randomStatus = mockStatuses[Math.floor(Math.random() * mockStatuses.length)]

      lineItems.push({
        transaction_id: requisitionId,
        organization_id: AUDIT_FIRM_ORG_ID,
        entity_id: `doc_${categoryKey.toLowerCase()}_${item.code.toLowerCase().replace('.', '_')}`,
        line_description: `${item.code} - ${item.name}`,
        quantity: 1,
        unit_price: 0,
        discount_amount: 0,
        line_number: lineNumber++,
        line_type: 'document_request',
        line_category: '',
        unit_amount: 0,
        tax_amount: 0,
        total_amount: 0,
        metadata: {
          document_code: item.code,
          document_name: item.name,
          category: categoryKey,
          subcategory: item.code.split('.')[1],
          priority: item.priority,
          status: index < 2 ? 'approved' : index < 4 ? 'received' : 'pending', // Mock progression
          due_date: dueDate,
          received_date:
            index < 4
              ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
              : null,
          reviewed_by: index < 2 ? 'auditor_sarah_johnson' : null,
          approved_by: index < 2 ? 'auditor_john_smith' : null,
          file_attachments:
            index < 4
              ? [
                  {
                    id: `file_${Date.now()}_${index}`,
                    filename: `${item.code.replace('.', '_')}.pdf`,
                    file_path: `/uploads/documents/${requisitionId}/`,
                    file_size: Math.floor(Math.random() * 5000000) + 100000,
                    mime_type: 'application/pdf',
                    uploaded_date: new Date(
                      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
                    ).toISOString(),
                    uploaded_by: 'client_user',
                    version: 1,
                    checksum: `sha256_${Math.random().toString(36).substring(7)}`
                  }
                ]
              : [],
          validation_rules: ['file_size_max_10mb', 'format_pdf_or_excel', 'current_year_data'],
          retention_period_years: 7,
          audit_area: getAuditArea(item.code),
          critical_for_opinion: item.priority === 'critical'
        }
      })
    })
  })

  return lineItems
}

const getAuditArea = (documentCode: string): string => {
  const areaMapping: Record<string, string> = {
    'D.1': 'revenue',
    'D.3': 'cost_of_sales',
    'D.4': 'payroll',
    'D.7': 'fixed_assets',
    'D.8': 'inventory',
    'D.9': 'accounts_receivable',
    'D.11': 'cash_bank',
    'D.12': 'accounts_payable',
    'D.16': 'loans_borrowings',
    'D.17': 'loans_borrowings',
    'E.1': 'tax',
    'E.2': 'tax',
    'E.3': 'tax',
    'F.1': 'related_parties',
    'F.2': 'related_parties',
    'F.3': 'related_parties',
    'F.4': 'related_parties'
  }
  return areaMapping[documentCode] || 'general'
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const requisitionId = searchParams.get('requisition_id')
    const clientId = searchParams.get('client_id')
    const status = searchParams.get('status')

    // Get specific requisition with line items
    if (requisitionId) {
      const requisition = mockRequisitions.find(r => r.id === requisitionId)
      if (!requisition) {
        return NextResponse.json(
          { success: false, message: 'Document requisition not found' },
          { status: 404 }
        )
      }

      const lineItems = generateDocumentLineItems(
        requisitionId,
        requisition.metadata.client_id,
        requisition.metadata.due_date
      )

      return NextResponse.json({
        success: true,
        data: {
          requisition,
          line_items: lineItems,
          categories: DOCUMENT_CATEGORIES
        }
      })
    }

    // Get requisition statistics
    if (action === 'stats') {
      const stats = {
        total_requisitions: mockRequisitions.length,
        active_requisitions: mockRequisitions.filter(r => r.status === 'sent').length,
        completed_requisitions: mockRequisitions.filter(r => r.status === 'complete').length,
        overdue_requisitions: mockRequisitions.filter(
          r => r.status !== 'complete' && new Date(r.metadata.due_date) < new Date()
        ).length,
        documents_pending: mockRequisitions.reduce(
          (sum, r) => sum + (r.metadata.total_documents - r.metadata.documents_received),
          0
        ),
        documents_received: mockRequisitions.reduce(
          (sum, r) => sum + r.metadata.documents_received,
          0
        ),
        documents_approved: mockRequisitions.reduce(
          (sum, r) => sum + r.metadata.documents_approved,
          0
        ),
        average_completion: Math.round(
          mockRequisitions.reduce((sum, r) => sum + r.metadata.completion_percentage, 0) /
            mockRequisitions.length
        )
      }

      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    // Get document categories and templates
    if (action === 'categories') {
      return NextResponse.json({
        success: true,
        data: {
          categories: DOCUMENT_CATEGORIES,
          total_documents: Object.values(DOCUMENT_CATEGORIES).reduce(
            (sum, cat) => sum + cat.items.length,
            0
          ),
          framework: 'GSPU_2025',
          compliance_standards: ['ISA_230', 'ISA_500', 'PCAOB_AS_1215']
        }
      })
    }

    // Filter requisitions
    let filteredRequisitions = [...mockRequisitions]

    if (clientId) {
      filteredRequisitions = filteredRequisitions.filter(r => r.metadata.client_id === clientId)
    }

    if (status) {
      filteredRequisitions = filteredRequisitions.filter(r => r.status === status)
    }

    return NextResponse.json({
      success: true,
      data: {
        requisitions: filteredRequisitions,
        total: filteredRequisitions.length
      }
    })
  } catch (error) {
    console.error('Document requisition API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch document requisitions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    // Create new document requisition
    if (action === 'create_requisition') {
      const newRequisition = {
        id: `req_${Date.now()}`,
        organization_id: AUDIT_FIRM_ORG_ID,
        transaction_type: 'document_requisition',
        smart_code: 'HERA.AUD.DOC.TXN.REQ.v1',
        reference_number: `DOC-REQ-${data.audit_year}-${String(mockRequisitions.length + 1).padStart(3, '0')}`,
        transaction_date: new Date().toISOString().split('T')[0],
        entity_from: AUDIT_FIRM_ORG_ID,
        entity_to: data.client_organization_id,
        total_amount: 0,
        currency: 'USD',
        status: 'draft',
        workflow_state: 'requisition_preparation',
        metadata: {
          client_id: data.client_id,
          client_name: data.client_name,
          audit_year: data.audit_year,
          due_date: data.due_date,
          total_documents: Object.values(DOCUMENT_CATEGORIES).reduce(
            (sum, cat) => sum + cat.items.length,
            0
          ),
          documents_received: 0,
          documents_approved: 0,
          completion_percentage: 0,
          categories: Object.keys(DOCUMENT_CATEGORIES),
          client_portal_access: data.client_portal_access || false
        },
        smart_code_metadata: {
          framework: 'GSPU_2025',
          document_format: 'excel_requisition',
          retention_years: 7,
          compliance_standards: ['ISA', 'PCAOB']
        }
      }

      return NextResponse.json({
        success: true,
        data: newRequisition,
        message: 'Document requisition created successfully'
      })
    }

    // Send requisition to client
    if (action === 'send_requisition') {
      const { requisition_id } = data

      return NextResponse.json({
        success: true,
        data: {
          requisition_id,
          status: 'sent',
          workflow_state: 'client_notification',
          sent_date: new Date().toISOString(),
          notification_methods: ['email', 'client_portal']
        },
        message: 'Document requisition sent to client successfully'
      })
    }

    // Update document status
    if (action === 'update_document_status') {
      const { requisition_id, document_id, status, notes, reviewed_by } = data

      return NextResponse.json({
        success: true,
        data: {
          requisition_id,
          document_id,
          status,
          updated_date: new Date().toISOString(),
          updated_by: reviewed_by,
          notes
        },
        message: 'Document status updated successfully'
      })
    }

    // Upload document file
    if (action === 'upload_document') {
      const { requisition_id, document_id, file_info } = data

      const fileAttachment = {
        id: `file_${Date.now()}`,
        filename: file_info.filename,
        file_path: `/uploads/documents/${requisition_id}/`,
        file_size: file_info.file_size,
        mime_type: file_info.mime_type,
        uploaded_date: new Date().toISOString(),
        uploaded_by: file_info.uploaded_by,
        version: 1,
        checksum: `sha256_${Math.random().toString(36).substring(7)}`
      }

      return NextResponse.json({
        success: true,
        data: {
          requisition_id,
          document_id,
          file_attachment: fileAttachment,
          status: 'received'
        },
        message: 'Document uploaded successfully'
      })
    }

    // Send reminder to client
    if (action === 'send_reminder') {
      const { requisition_id, reminder_type, custom_message } = data

      return NextResponse.json({
        success: true,
        data: {
          requisition_id,
          reminder_type,
          sent_date: new Date().toISOString(),
          custom_message,
          delivery_status: 'sent'
        },
        message: 'Reminder sent to client successfully'
      })
    }

    // Generate requisition report
    if (action === 'generate_report') {
      const { requisition_id, format } = data

      return NextResponse.json({
        success: true,
        data: {
          requisition_id,
          report_format: format,
          report_url: `/api/v1/audit/reports/requisition/${requisition_id}.${format}`,
          generated_date: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        message: 'Requisition report generated successfully'
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Document requisition API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    )
  }
}
