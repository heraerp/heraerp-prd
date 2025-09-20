import { NextRequest, NextResponse } from 'next/server'
import { auditDocumentService } from '@/lib/supabase/audit-documents'
import { enhancedAuditDocumentService } from '@/lib/supabase/enhanced-audit-documents'

// Mock document data - used when Supabase is not available
const mockDocuments = [
  // Cyprus Trading Ltd Documents (organization: gspu_client_cli_2025_001_org)
  {
    id: 'doc_cyprus_001',
    requisition_id: 'req_cyprus_001',
    client_id: 'eng_001',
    organization_id: 'gspu_client_cli_2025_001_org',
    document_code: 'A.1.1',
    document_name: 'Certificate of Incorporation',
    category: 'A',
    priority: 'critical',
    status: 'approved',
    due_date: '2025-02-15',
    received_date: '2025-01-20',
    file_attachments: ['cyprus_incorporation_cert.pdf'],
    entity_type: 'audit_document',
    smart_code: 'HERA.AUD.DOC.ENT.MASTER.V1',
    created_date: '2025-01-15',
    metadata: {
      gspu_client_id: 'CLI-2025-001',
      audit_firm: 'GSPU_AUDIT_PARTNERS',
      document_type: 'Company Formation Documents',
      retention_period_years: 7,
      validation_rules: ['must_be_certified_copy'],
      file_size: 245760,
      uploaded_by: 'cyprus_user',
      uploaded_date: '2025-01-20T10:30:00Z'
    }
  },
  {
    id: 'doc_cyprus_002',
    requisition_id: 'req_cyprus_001',
    client_id: 'eng_001',
    organization_id: 'gspu_client_cli_2025_001_org',
    document_code: 'A.1.2',
    document_name: 'Memorandum and Articles of Association',
    category: 'A',
    priority: 'critical',
    status: 'under_review',
    due_date: '2025-02-15',
    received_date: '2025-01-22',
    file_attachments: ['cyprus_memorandum_articles.pdf'],
    entity_type: 'audit_document',
    smart_code: 'HERA.AUD.DOC.ENT.MASTER.V1',
    created_date: '2025-01-15',
    remarks: 'Need updated version with latest amendments',
    metadata: {
      gspu_client_id: 'CLI-2025-001',
      audit_firm: 'GSPU_AUDIT_PARTNERS',
      document_type: 'Company Formation Documents',
      retention_period_years: 7,
      validation_rules: ['must_be_current_version'],
      file_size: 156280,
      uploaded_by: 'cyprus_user',
      uploaded_date: '2025-01-22T14:15:00Z'
    }
  },
  {
    id: 'doc_cyprus_003',
    requisition_id: 'req_cyprus_001',
    client_id: 'eng_001',
    organization_id: 'gspu_client_cli_2025_001_org',
    document_code: 'B.2.1',
    document_name: 'Audited Financial Statements (Previous Year)',
    category: 'B',
    priority: 'high',
    status: 'received',
    due_date: '2025-02-20',
    received_date: '2025-01-25',
    file_attachments: ['cyprus_financials_2024.pdf'],
    entity_type: 'audit_document',
    smart_code: 'HERA.AUD.DOC.ENT.MASTER.V1',
    created_date: '2025-01-15',
    metadata: {
      gspu_client_id: 'CLI-2025-001',
      audit_firm: 'GSPU_AUDIT_PARTNERS',
      document_type: 'Financial Documents',
      retention_period_years: 7,
      validation_rules: ['must_be_signed_audited'],
      file_size: 892450,
      uploaded_by: 'cyprus_user',
      uploaded_date: '2025-01-25T09:45:00Z'
    }
  },
  {
    id: 'doc_cyprus_004',
    requisition_id: 'req_cyprus_001',
    client_id: 'eng_001',
    organization_id: 'gspu_client_cli_2025_001_org',
    document_code: 'D.4.5',
    document_name: 'Revenue Transaction Testing Sample',
    category: 'D',
    priority: 'medium',
    status: 'pending',
    due_date: '2025-03-01',
    file_attachments: [],
    entity_type: 'audit_document',
    smart_code: 'HERA.AUD.DOC.ENT.MASTER.V1',
    created_date: '2025-01-15',
    metadata: {
      gspu_client_id: 'CLI-2025-001',
      audit_firm: 'GSPU_AUDIT_PARTNERS',
      document_type: 'Audit Execution Documents',
      retention_period_years: 7,
      validation_rules: ['sample_size_minimum_25'],
      requested_date: '2025-01-15T00:00:00Z'
    }
  },
  // Mediterranean Shipping Co Documents (organization: gspu_client_cli_2025_002_org)
  {
    id: 'doc_med_001',
    requisition_id: 'req_med_001',
    client_id: 'eng_002',
    organization_id: 'gspu_client_cli_2025_002_org',
    document_code: 'A.1.1',
    document_name: 'Certificate of Incorporation',
    category: 'A',
    priority: 'critical',
    status: 'pending',
    due_date: '2025-02-25',
    file_attachments: [],
    entity_type: 'audit_document',
    smart_code: 'HERA.AUD.DOC.ENT.MASTER.V1',
    created_date: '2025-01-10',
    metadata: {
      gspu_client_id: 'CLI-2025-002',
      audit_firm: 'GSPU_AUDIT_PARTNERS',
      document_type: 'Company Formation Documents',
      retention_period_years: 7,
      validation_rules: ['must_be_certified_copy']
    }
  },
  // Generic client for backward compatibility
  {
    id: 'doc_generic_001',
    requisition_id: 'req_001',
    client_id: 'client_001',
    organization_id: 'client_001_org_id',
    document_code: 'A.1',
    document_name: 'Commercial registration certificate',
    category: 'A',
    priority: 'high',
    status: 'pending',
    due_date: '2025-08-16',
    entity_type: 'audit_document',
    smart_code: 'HERA.AUD.DOC.ENT.MASTER.V1',
    created_date: '2025-01-15',
    metadata: {
      gspu_client_id: 'client_001',
      audit_firm: 'GSPU_AUDIT_PARTNERS',
      document_type: 'Company Formation Documents',
      retention_period_years: 7,
      validation_rules: []
    }
  }
]

const mockRequisitions = [
  // Cyprus Trading Ltd Requisition
  {
    id: 'req_cyprus_001',
    client_id: 'eng_001',
    organization_id: 'gspu_client_cli_2025_001_org',
    entity_type: 'document_requisition',
    entity_code: 'REQ-2025-001',
    entity_name: 'Cyprus Trading Ltd - Document Requisition',
    smart_code: 'HERA.AUD.DOC.TXN.REQ.V1',
    status: 'sent',
    audit_year: '2025',
    due_date: '2025-02-28',
    created_date: '2025-01-15',
    metadata: {
      gspu_client_id: 'CLI-2025-001',
      audit_firm: 'GSPU_AUDIT_PARTNERS',
      total_documents: 31,
      documents_received: 3,
      completion_percentage: 10
    }
  },
  // Mediterranean Shipping Co Requisition
  {
    id: 'req_med_001',
    client_id: 'eng_002',
    organization_id: 'gspu_client_cli_2025_002_org',
    entity_type: 'document_requisition',
    entity_code: 'REQ-2025-002',
    entity_name: 'Mediterranean Shipping Co - Document Requisition',
    smart_code: 'HERA.AUD.DOC.TXN.REQ.V1',
    status: 'draft',
    audit_year: '2025',
    due_date: '2025-03-15',
    created_date: '2025-01-10',
    metadata: {
      gspu_client_id: 'CLI-2025-002',
      audit_firm: 'GSPU_AUDIT_PARTNERS',
      total_documents: 31,
      documents_received: 0,
      completion_percentage: 0
    }
  },
  // Nicosia Tech Solutions Requisition
  {
    id: 'req_nic_001',
    client_id: 'eng_003',
    organization_id: 'gspu_client_cli_2025_003_org',
    entity_type: 'document_requisition',
    entity_code: 'REQ-2025-003',
    entity_name: 'Nicosia Tech Solutions - Document Requisition',
    smart_code: 'HERA.AUD.DOC.TXN.REQ.V1',
    status: 'sent',
    audit_year: '2025',
    due_date: '2025-02-20',
    created_date: '2024-10-15',
    metadata: {
      gspu_client_id: 'CLI-2025-003',
      audit_firm: 'GSPU_AUDIT_PARTNERS',
      total_documents: 31,
      documents_received: 25,
      completion_percentage: 80
    }
  },
  // Generic client for backward compatibility
  {
    id: 'req_001',
    client_id: 'client_001',
    organization_id: 'client_001_org_id',
    entity_type: 'document_requisition',
    entity_code: 'REQ-2025-999',
    entity_name: 'XYZ Manufacturing Ltd - Document Requisition',
    smart_code: 'HERA.AUD.DOC.TXN.REQ.V1',
    status: 'draft',
    audit_year: '2025',
    due_date: '2025-08-16',
    created_date: '2025-01-15',
    metadata: {
      gspu_client_id: 'client_001',
      audit_firm: 'GSPU_AUDIT_PARTNERS',
      total_documents: 31,
      documents_received: 0,
      completion_percentage: 0
    }
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const clientId = searchParams.get('clientId')
    const requisitionId = searchParams.get('requisitionId')
    const organizationId = searchParams.get('organizationId')

    if (action === 'get_requisition') {
      // Get requisition details with organization filtering
      const requisition = mockRequisitions.find(
        r =>
          (r.client_id === clientId || r.id === requisitionId) &&
          (!organizationId || r.organization_id === organizationId)
      )

      if (!requisition) {
        return NextResponse.json(
          {
            success: false,
            message: 'Requisition not found'
          },
          { status: 404 }
        )
      }

      // Get all documents for this requisition
      const documents = mockDocuments.filter(d => d.requisition_id === requisition.id)

      return NextResponse.json({
        success: true,
        data: {
          requisition,
          documents,
          statistics: {
            total_documents: documents.length,
            pending: documents.filter(d => d.status === 'pending').length,
            received: documents.filter(d => d.status === 'received').length,
            approved: documents.filter(d => d.status === 'approved').length,
            overdue: documents.filter(
              d => d.status === 'pending' && new Date(d.due_date) < new Date()
            ).length
          }
        }
      })
    }

    if (action === 'list_documents') {
      // List all documents with filtering including organization isolation
      let filteredDocuments = mockDocuments

      // Multi-tenant filtering: Always filter by organization if provided
      if (organizationId) {
        filteredDocuments = filteredDocuments.filter(d => d.organization_id === organizationId)
      }

      if (clientId) {
        filteredDocuments = filteredDocuments.filter(d => d.client_id === clientId)
      }

      if (requisitionId) {
        filteredDocuments = filteredDocuments.filter(d => d.requisition_id === requisitionId)
      }

      return NextResponse.json({
        success: true,
        data: filteredDocuments,
        total: filteredDocuments.length
      })
    }

    if (action === 'search_documents') {
      // Enhanced search with filtering
      const filters = {
        organization_id: organizationId || undefined,
        client_id: clientId || undefined,
        requisition_id: requisitionId || undefined,
        status: searchParams.get('status') || undefined,
        category: searchParams.get('category') || undefined,
        priority: searchParams.get('priority') || undefined,
        search_term: searchParams.get('search') || undefined,
        has_files:
          searchParams.get('hasFiles') === 'true'
            ? true
            : searchParams.get('hasFiles') === 'false'
              ? false
              : undefined
      }

      try {
        const documents = await enhancedAuditDocumentService.searchDocuments(filters)
        return NextResponse.json({
          success: true,
          data: documents,
          total: documents.length,
          filters_applied: filters
        })
      } catch (error) {
        console.warn('Enhanced search failed, using mock data:', error)
        // Fallback to mock data search
        let filteredDocs = mockDocuments
        if (organizationId)
          filteredDocs = filteredDocs.filter(d => d.organization_id === organizationId)
        if (clientId) filteredDocs = filteredDocs.filter(d => d.client_id === clientId)

        return NextResponse.json({
          success: true,
          data: filteredDocs,
          total: filteredDocs.length,
          mode: 'mock'
        })
      }
    }

    if (action === 'get_document') {
      const documentId = searchParams.get('documentId')
      if (!documentId) {
        return NextResponse.json(
          {
            success: false,
            message: 'documentId parameter required'
          },
          { status: 400 }
        )
      }

      try {
        const document = await enhancedAuditDocumentService.getDocument(
          documentId,
          organizationId || undefined
        )
        if (!document) {
          return NextResponse.json(
            {
              success: false,
              message: 'Document not found'
            },
            { status: 404 }
          )
        }

        return NextResponse.json({
          success: true,
          data: document
        })
      } catch (error) {
        console.warn('Enhanced document fetch failed, using mock data:', error)
        const mockDoc = mockDocuments.find(d => d.id === documentId)
        if (mockDoc) {
          return NextResponse.json({
            success: true,
            data: mockDoc,
            mode: 'mock'
          })
        } else {
          return NextResponse.json(
            {
              success: false,
              message: 'Document not found'
            },
            { status: 404 }
          )
        }
      }
    }

    if (action === 'get_statistics') {
      if (!organizationId) {
        return NextResponse.json(
          {
            success: false,
            message: 'organizationId parameter required'
          },
          { status: 400 }
        )
      }

      try {
        const stats = await enhancedAuditDocumentService.getDocumentStatistics(
          organizationId,
          clientId || undefined
        )

        return NextResponse.json({
          success: true,
          data: stats
        })
      } catch (error) {
        console.warn('Enhanced statistics failed, using mock data:', error)
        // Fallback to mock statistics
        let filteredDocs = mockDocuments.filter(d => d.organization_id === organizationId)
        if (clientId) filteredDocs = filteredDocs.filter(d => d.client_id === clientId)

        const mockStats = {
          total: filteredDocs.length,
          pending: filteredDocs.filter(d => d.status === 'pending').length,
          received: filteredDocs.filter(d => d.status === 'received').length,
          under_review: filteredDocs.filter(d => d.status === 'under_review').length,
          approved: filteredDocs.filter(d => d.status === 'approved').length,
          rejected: filteredDocs.filter(d => d.status === 'rejected').length,
          overdue: filteredDocs.filter(
            d => d.status === 'pending' && new Date(d.due_date) < new Date()
          ).length,
          completion_percentage:
            filteredDocs.length > 0
              ? Math.round(
                  (filteredDocs.filter(d => d.status === 'approved').length / filteredDocs.length) *
                    100
                )
              : 0
        }

        return NextResponse.json({
          success: true,
          data: mockStats,
          mode: 'mock'
        })
      }
    }

    // Default: return summary statistics
    return NextResponse.json({
      success: true,
      data: {
        total_requisitions: mockRequisitions.length,
        total_documents: mockDocuments.length,
        pending_documents: mockDocuments.filter(d => d.status === 'pending').length,
        received_documents: mockDocuments.filter(d => d.status === 'received').length
      }
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch documents'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    if (action === 'create_requisition') {
      try {
        // Create new document requisition in Supabase
        // Each GSPU audit client gets their own organization_id for perfect data isolation
        const newRequisition = await auditDocumentService.createRequisition({
          client_id: data.client_id,
          organization_id: data.organization_id || `gspu_client_${data.client_id}_org`,
          client_name: data.client_name,
          audit_year: data.audit_year,
          due_date: data.due_date
        })

        // Create all 31 GSPU documents
        await auditDocumentService.createGSPUDocuments(
          newRequisition.id,
          newRequisition.organization_id,
          data.client_id
        )

        return NextResponse.json({
          success: true,
          message: 'Document requisition created successfully with all GSPU documents',
          data: newRequisition
        })
      } catch (error) {
        console.error('Supabase error, using mock data:', error)

        // Fallback to mock data
        const newRequisition = {
          id: `req_${Date.now()}`,
          client_id: data.client_id,
          organization_id: data.organization_id || `gspu_client_${data.client_id}_org`,
          entity_type: 'document_requisition',
          entity_code:
            data.entity_code ||
            `REQ-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
          entity_name: `${data.client_name} - Document Requisition`,
          smart_code: 'HERA.AUD.DOC.TXN.REQ.V1',
          status: 'draft',
          audit_year: data.audit_year,
          due_date: data.due_date,
          created_date: new Date().toISOString(),
          metadata: {
            gspu_client_id: data.client_id, // Internal GSPU client reference
            audit_firm: 'GSPU_AUDIT_PARTNERS', // GSPU is the audit firm using HERA
            total_documents: 31,
            documents_received: 0,
            completion_percentage: 0
          }
        }

        mockRequisitions.push(newRequisition)

        return NextResponse.json({
          success: true,
          message: 'Document requisition created successfully (mock mode)',
          data: newRequisition
        })
      }
    }

    if (action === 'create_document') {
      // Create new document using enhanced service
      try {
        const newDocument = await enhancedAuditDocumentService.createDocument({
          organization_id: data.organization_id,
          client_id: data.client_id,
          requisition_id: data.requisition_id,
          document_code: data.document_code,
          document_name: data.document_name,
          category: data.category,
          priority: data.priority,
          due_date: data.due_date
        })

        return NextResponse.json({
          success: true,
          message: 'Document created successfully',
          data: newDocument
        })
      } catch (error) {
        console.error('Enhanced document creation failed:', error)
        // Fallback to mock data creation
        const newDocument = {
          id: `doc_${Date.now()}`,
          organization_id: data.organization_id,
          client_id: data.client_id,
          requisition_id: data.requisition_id,
          document_code: data.document_code,
          document_name: data.document_name,
          category: data.category,
          priority: data.priority || 'medium',
          status: 'pending',
          due_date: data.due_date,
          entity_type: 'audit_document',
          smart_code: 'HERA.AUD.DOC.ENT.MASTER.V1',
          created_date: new Date().toISOString(),
          file_attachments: [],
          metadata: {
            gspu_client_id: data.client_id,
            audit_firm: 'GSPU_AUDIT_PARTNERS',
            document_type: 'Unknown',
            retention_period_years: 7,
            validation_rules: []
          }
        }

        mockDocuments.push(newDocument)

        return NextResponse.json({
          success: true,
          message: 'Document created successfully (mock mode)',
          data: newDocument
        })
      }
    }

    if (action === 'update_document_status') {
      // Enhanced document status update
      const {
        document_id,
        status,
        received_date,
        file_attachments,
        review_notes,
        rejection_reason
      } = data
      let updatedDocument: any = null
      let docIndex = -1

      try {
        const updates: any = {
          status,
          ...(received_date && { received_date }),
          ...(review_notes && { review_notes }),
          ...(rejection_reason && { rejection_reason })
        }

        if (status === 'under_review') {
          updates.reviewed_date = new Date().toISOString()
        } else if (status === 'approved') {
          updates.approved_date = new Date().toISOString()
        }

        updatedDocument = await enhancedAuditDocumentService.updateDocument(
          document_id,
          updates,
          data.organization_id
        )

        if (!updatedDocument) {
          throw new Error('Document not found or update failed')
        }

        return NextResponse.json({
          success: true,
          message: 'Document status updated successfully',
          data: updatedDocument
        })
      } catch (error) {
        console.warn('Enhanced update failed, using mock update:', error)
        // Fallback to mock update
        docIndex = mockDocuments.findIndex(d => d.id === document_id)
        if (docIndex === -1) {
          return NextResponse.json(
            {
              success: false,
              message: 'Document not found'
            },
            { status: 404 }
          )
        }

        // Update document
        const updatedDoc = {
          ...mockDocuments[docIndex],
          status,
          received_date: received_date || new Date().toISOString(),
          file_attachments: file_attachments || [],
          last_updated: new Date().toISOString()
        }

        // Add review notes as dynamic property if provided
        if (review_notes) {
          ;(updatedDoc as any).review_notes = review_notes
        }

        mockDocuments[docIndex] = updatedDoc
        updatedDocument = mockDocuments[docIndex]
      }

      // Create universal transaction for status update
      const transaction = {
        transaction_type: 'document_status_update',
        smart_code: 'HERA.AUD.DOC.TXN.STATUS.V1',
        reference_number: document_id,
        metadata: {
          previous_status: status,
          new_status: status,
          document_code: updatedDocument.document_code,
          document_name: updatedDocument.document_name
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Document status updated successfully',
        data: {
          document: updatedDocument,
          transaction
        }
      })
    }

    if (action === 'send_requisition') {
      // Send requisition to client
      const { requisition_id } = data

      const reqIndex = mockRequisitions.findIndex(r => r.id === requisition_id)
      if (reqIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            message: 'Requisition not found'
          },
          { status: 404 }
        )
      }

      // Update requisition status
      ;(mockRequisitions[reqIndex] as any).status = 'sent'
      ;(mockRequisitions[reqIndex] as any).sent_date = new Date().toISOString()

      // Create universal transaction for requisition sending
      const transaction = {
        transaction_type: 'requisition_sent',
        smart_code: 'HERA.AUD.DOC.TXN.SEND.V1',
        reference_number: requisition_id,
        total_amount: 0, // No monetary value
        metadata: {
          client_id: mockRequisitions[reqIndex].client_id,
          total_documents: 31,
          due_date: mockRequisitions[reqIndex].due_date
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Document requisition sent to client successfully',
        data: {
          requisition: mockRequisitions[reqIndex],
          transaction
        }
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid action specified'
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing document request:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process document request',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { document_id, status, notes, file_attachments } = body

    const docIndex = mockDocuments.findIndex(d => d.id === document_id)
    if (docIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document not found'
        },
        { status: 404 }
      )
    }

    // Update document with review notes and attachments
    const updatedDoc = {
      ...mockDocuments[docIndex],
      status,
      file_attachments: file_attachments || [],
      reviewed_date: new Date().toISOString(),
      last_updated: new Date().toISOString()
    }

    // Add review notes as dynamic property if provided
    if (notes) {
      ;(updatedDoc as any).review_notes = notes
    }

    mockDocuments[docIndex] = updatedDoc

    // Store in HERA universal tables as core_dynamic_data
    const dynamicData = [
      { field_name: 'review_notes', field_value: notes },
      { field_name: 'file_attachments', field_value: JSON.stringify(file_attachments) },
      { field_name: 'reviewed_date', field_value: new Date().toISOString() }
    ]

    return NextResponse.json({
      success: true,
      message: 'Document updated successfully',
      data: {
        document: mockDocuments[docIndex],
        dynamic_data: dynamicData
      }
    })
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update document'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const organizationId = searchParams.get('organizationId')

    if (!documentId || !organizationId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required parameters: documentId, organizationId'
        },
        { status: 400 }
      )
    }

    try {
      // Use enhanced service to delete document
      const deleteResult = await enhancedAuditDocumentService.deleteDocument(
        documentId,
        organizationId
      )

      if (!deleteResult.success) {
        return NextResponse.json(
          {
            success: false,
            message: deleteResult.error || 'Failed to delete document'
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Document and associated files deleted successfully',
        data: { document_id: documentId }
      })
    } catch (error) {
      console.warn('Enhanced delete failed, using mock delete:', error)

      // Fallback to mock delete
      const docIndex = mockDocuments.findIndex(
        d => d.id === documentId && d.organization_id === organizationId
      )
      if (docIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            message: 'Document not found'
          },
          { status: 404 }
        )
      }

      const deletedDocument = mockDocuments[docIndex]
      mockDocuments.splice(docIndex, 1)

      return NextResponse.json({
        success: true,
        message: 'Document deleted successfully (mock mode)',
        data: {
          document_id: documentId,
          deleted_document: deletedDocument
        }
      })
    }
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete document',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
