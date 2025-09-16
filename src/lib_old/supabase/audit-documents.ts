import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export interface AuditDocument {
  id: string
  organization_id: string
  client_id: string
  requisition_id: string
  entity_type: 'audit_document'
  entity_code: string
  entity_name: string
  smart_code: string
  status: 'pending' | 'received' | 'under_review' | 'approved' | 'rejected'
  document_code: string
  document_name: string
  category: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  priority: 'critical' | 'high' | 'medium' | 'low'
  due_date: string
  received_date?: string
  reviewed_date?: string
  file_attachments?: string[]
  review_notes?: string
  created_at: string
  updated_at: string
}

export interface DocumentRequisition {
  id: string
  organization_id: string
  client_id: string
  entity_type: 'document_requisition'
  entity_code: string
  entity_name: string
  smart_code: string
  status: 'draft' | 'sent' | 'in_progress' | 'completed'
  audit_year: string
  due_date: string
  sent_date?: string
  completed_date?: string
  total_documents: number
  documents_received: number
  completion_percentage: number
  created_at: string
  updated_at: string
}

class AuditDocumentService {
  /**
   * Create a new document requisition
   */
  async createRequisition(data: {
    client_id: string
    organization_id: string
    client_name: string
    audit_year: string
    due_date: string
  }): Promise<DocumentRequisition> {
    const requisitionCode = `REQ-${data.audit_year}-${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')}`

    // Insert into core_entities table (HERA universal architecture)
    // NOTE: organization_id represents the audit client (each GSPU client gets their own org)
    const { data: requisition, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: data.organization_id, // This is the GSPU audit client's organization
        entity_type: 'document_requisition',
        entity_code: requisitionCode,
        entity_name: `${data.client_name} - Document Requisition`,
        smart_code: 'HERA.AUD.DOC.ENT.REQ.v1',
        status: 'draft',
        metadata: {
          gspu_client_id: data.client_id, // Internal GSPU client reference
          audit_year: data.audit_year,
          due_date: data.due_date,
          total_documents: 31,
          documents_received: 0,
          completion_percentage: 0,
          audit_firm: 'GSPU_AUDIT_PARTNERS' // GSPU is the audit firm using HERA
        }
      })
      .select()
      .single()

    if (error) throw error

    // Store additional data in core_dynamic_data
    const dynamicDataEntries = [
      { entity_id: requisition.id, field_name: 'audit_year', field_value: data.audit_year },
      { entity_id: requisition.id, field_name: 'due_date', field_value: data.due_date },
      { entity_id: requisition.id, field_name: 'client_id', field_value: data.client_id }
    ]

    await supabase.from('core_dynamic_data').insert(dynamicDataEntries)

    return requisition as any
  }

  /**
   * Create all 31 GSPU documents for a requisition
   */
  async createGSPUDocuments(
    requisitionId: string,
    organizationId: string,
    clientId: string
  ): Promise<AuditDocument[]> {
    const documents = [
      // Section A: Company Formation Documents
      { code: 'A.1', name: 'Commercial registration certificate', priority: 'high' },
      { code: 'A.2', name: 'Memorandum of Association', priority: 'high' },
      { code: 'A.3', name: "Shareholders' CPR copy", priority: 'medium' },
      { code: 'A.4', name: "Shareholders' Passport copy", priority: 'medium' },

      // Section B: Financial Documents
      { code: 'B.1', name: 'Audited Financial Statements (Prior Year)', priority: 'critical' },
      { code: 'B.2', name: 'Financial Statements (Current Year)', priority: 'critical' },
      { code: 'B.3', name: 'Trial Balance (Current Year)', priority: 'high' },

      // Section C: Audit Planning Documents
      { code: 'C.1', name: 'Audit Materiality Check', priority: 'high' },
      { code: 'C.2', name: 'Audit Timeline for execution', priority: 'medium' },
      { code: 'C.3', name: 'Sampling percentage based on materiality', priority: 'medium' },
      { code: 'C.4', name: 'Working papers and query documentation', priority: 'low' },

      // Section D: Audit Execution Documents (17 items)
      { code: 'D.1', name: 'Revenue documentation', priority: 'critical' },
      { code: 'D.2', name: 'Other income details', priority: 'medium' },
      { code: 'D.3', name: 'Cost of Revenue', priority: 'high' },
      { code: 'D.4', name: 'Payroll documentation', priority: 'high' },
      { code: 'D.5', name: 'Utilities documentation', priority: 'medium' },
      { code: 'D.6', name: 'General and administrative expenses', priority: 'medium' },
      { code: 'D.7', name: 'Property, Plant and Equipment', priority: 'high' },
      { code: 'D.8', name: 'Inventory documentation', priority: 'high' },
      { code: 'D.9', name: 'Trade receivables', priority: 'high' },
      { code: 'D.10', name: 'Advances, deposits and prepayments', priority: 'medium' },
      { code: 'D.11', name: 'Cash and cash equivalent', priority: 'critical' },
      { code: 'D.12', name: 'Trade Payables', priority: 'high' },
      { code: 'D.13', name: 'Provisions (leave pay, indemnity, air fare)', priority: 'medium' },
      { code: 'D.14', name: 'Other payables', priority: 'medium' },
      { code: 'D.15', name: 'Accrued expenses calculation basis', priority: 'medium' },
      { code: 'D.16', name: 'Facility letters for short-term borrowings', priority: 'high' },
      { code: 'D.17', name: 'Loan documentation', priority: 'high' },

      // Section E: VAT Documentation
      { code: 'E.1', name: 'VAT registration certificate', priority: 'high' },
      { code: 'E.2', name: 'Quarterly VAT filings', priority: 'high' },
      { code: 'E.3', name: 'VAT calculation details', priority: 'medium' },

      // Section F: Related Parties Documentation
      { code: 'F.1', name: 'Related party details and relationships', priority: 'high' },
      { code: 'F.2', name: 'Outstanding balances with related parties', priority: 'high' },
      { code: 'F.3', name: 'Related party balance confirmations', priority: 'medium' },
      { code: 'F.4', name: 'Transaction details during the year', priority: 'medium' }
    ]

    const documentEntities = documents.map(doc => ({
      organization_id: organizationId, // GSPU audit client's organization
      entity_type: 'audit_document',
      entity_code: doc.code,
      entity_name: doc.name,
      smart_code: 'HERA.AUD.DOC.ENT.MASTER.v1',
      status: 'pending',
      metadata: {
        requisition_id: requisitionId,
        gspu_client_id: clientId, // Internal GSPU reference
        document_code: doc.code,
        category: doc.code.charAt(0),
        priority: doc.priority,
        retention_period_years: 7,
        audit_firm: 'GSPU_AUDIT_PARTNERS'
      }
    }))

    const { data: createdDocuments, error } = await supabase
      .from('core_entities')
      .insert(documentEntities)
      .select()

    if (error) throw error

    return createdDocuments as any
  }

  /**
   * Get requisition with documents
   */
  async getRequisition(requisitionId: string): Promise<{
    requisition: DocumentRequisition
    documents: AuditDocument[]
    statistics: any
  }> {
    // Get requisition
    const { data: requisition, error: reqError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', requisitionId)
      .eq('entity_type', 'document_requisition')
      .single()

    if (reqError) throw reqError

    // Get all documents for this requisition
    const { data: documents, error: docsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'audit_document')
      .contains('metadata', { requisition_id: requisitionId })

    if (docsError) throw docsError

    // Calculate statistics
    const statistics = {
      total_documents: documents.length,
      pending: documents.filter(d => d.status === 'pending').length,
      received: documents.filter(d => d.status === 'received').length,
      approved: documents.filter(d => d.status === 'approved').length,
      completion_percentage: Math.round(
        (documents.filter(d => d.status === 'approved').length / documents.length) * 100
      )
    }

    return {
      requisition: requisition as any,
      documents: documents as any,
      statistics
    }
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(
    documentId: string,
    status: AuditDocument['status'],
    notes?: string,
    fileAttachments?: string[]
  ): Promise<AuditDocument> {
    // Update the main entity
    const { data: updatedDoc, error } = await supabase
      .from('core_entities')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single()

    if (error) throw error

    // Store additional data in core_dynamic_data
    const dynamicDataEntries = []

    if (notes) {
      dynamicDataEntries.push({
        entity_id: documentId,
        field_name: 'review_notes',
        field_value: notes
      })
    }

    if (fileAttachments && fileAttachments.length > 0) {
      dynamicDataEntries.push({
        entity_id: documentId,
        field_name: 'file_attachments',
        field_value: JSON.stringify(fileAttachments)
      })
    }

    if (status === 'received') {
      dynamicDataEntries.push({
        entity_id: documentId,
        field_name: 'received_date',
        field_value: new Date().toISOString()
      })
    }

    if (dynamicDataEntries.length > 0) {
      await supabase.from('core_dynamic_data').upsert(dynamicDataEntries, {
        onConflict: 'entity_id,field_name'
      })
    }

    // Create universal transaction for audit trail
    await supabase.from('universal_transactions').insert({
      organization_id: updatedDoc.organization_id,
      transaction_type: 'document_status_update',
      smart_code: 'HERA.AUD.DOC.TXN.STATUS.v1',
      reference_number: documentId,
      total_amount: 0,
      metadata: {
        document_code: updatedDoc.entity_code,
        document_name: updatedDoc.entity_name,
        previous_status: 'pending', // In production, get from database
        new_status: status,
        notes: notes
      }
    })

    return updatedDoc as any
  }

  /**
   * Send requisition to client
   */
  async sendRequisition(requisitionId: string): Promise<DocumentRequisition> {
    const { data: updatedReq, error } = await supabase
      .from('core_entities')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString()
      })
      .eq('id', requisitionId)
      .select()
      .single()

    if (error) throw error

    // Store sent date
    await supabase.from('core_dynamic_data').upsert(
      {
        entity_id: requisitionId,
        field_name: 'sent_date',
        field_value: new Date().toISOString()
      },
      {
        onConflict: 'entity_id,field_name'
      }
    )

    // Create universal transaction
    await supabase.from('universal_transactions').insert({
      organization_id: updatedReq.organization_id,
      transaction_type: 'requisition_sent',
      smart_code: 'HERA.AUD.DOC.TXN.SEND.v1',
      reference_number: requisitionId,
      total_amount: 0,
      metadata: {
        client_id: updatedReq.metadata.client_id,
        total_documents: 31
      }
    })

    return updatedReq as any
  }

  /**
   * Upload document file
   */
  async uploadDocumentFile(
    documentId: string,
    file: File,
    organizationId: string
  ): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${organizationId}/${documentId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage.from('audit-documents').upload(fileName, file)

    if (error) throw error

    // Get public URL
    const { data: urlData } = supabase.storage.from('audit-documents').getPublicUrl(fileName)

    // Store file reference in core_dynamic_data
    await supabase.from('core_dynamic_data').upsert(
      {
        entity_id: documentId,
        field_name: 'file_url',
        field_value: urlData.publicUrl
      },
      {
        onConflict: 'entity_id,field_name'
      }
    )

    return urlData.publicUrl
  }
}

export const auditDocumentService = new AuditDocumentService()
