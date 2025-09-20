import { supabaseClient } from '@/lib/supabase-client'
import { SAPConnectorFactory } from './connectors/factory'
import { SAPValidationService } from './business-logic/validation'
import { SAPMappingService } from './business-logic/mapping'
import { UniversalTransaction, UniversalTransactionLine } from '@/types/hera-database.types'

export interface IntegrationResult {
  success: boolean
  transactionId: string
  sapDocumentNumber?: string
  sapFiscalYear?: string
  error?: string
  warnings?: string[]
}

export class SAPIntegrationService {
  // Main entry point for posting to SAP
  static async postTransaction(transactionId: string): Promise<IntegrationResult> {
    try {
      // 1. Fetch transaction with lines
      const { transaction, lines } = await this.fetchTransaction(transactionId)

      if (!transaction) {
        throw new Error('Transaction not found')
      }

      // 2. Validate transaction
      const validation = await SAPValidationService.validateTransaction(transaction, lines)

      if (!validation.valid) {
        return {
          success: false,
          transactionId,
          error: validation.errors.map(e => e.message).join(', '),
          warnings: validation.warnings.map(w => w.message)
        }
      }

      // 3. Check for duplicates
      const duplicateCheck = await this.checkForDuplicates(transaction)
      if (duplicateCheck.isDuplicate) {
        return {
          success: false,
          transactionId,
          error: 'Duplicate transaction detected',
          warnings: [`Confidence: ${(duplicateCheck.confidence * 100).toFixed(0)}%`]
        }
      }

      // 4. Get SAP connector
      const connector = await SAPConnectorFactory.create(transaction.organization_id)

      // 5. Post to SAP
      const sapDocument = await connector.postDocument(transaction)

      // 6. Update transaction with SAP reference
      await this.updateTransactionWithSAPRef(
        transactionId,
        sapDocument.documentNumber,
        sapDocument.fiscalYear
      )

      // 7. Create audit trail
      await this.createAuditTrail(transaction, sapDocument)

      return {
        success: true,
        transactionId,
        sapDocumentNumber: sapDocument.documentNumber,
        sapFiscalYear: sapDocument.fiscalYear,
        warnings: validation.warnings.map(w => w.message)
      }
    } catch (error: any) {
      console.error('SAP posting error:', error)

      // Log error to database
      await this.logError(transactionId, error)

      return {
        success: false,
        transactionId,
        error: error.message || 'Unknown error occurred'
      }
    }
  }

  // Batch posting
  static async postBatch(transactionIds: string[]): Promise<IntegrationResult[]> {
    const results: IntegrationResult[] = []

    // Process in parallel with concurrency limit
    const concurrency = 5
    for (let i = 0; i < transactionIds.length; i += concurrency) {
      const batch = transactionIds.slice(i, i + concurrency)
      const batchResults = await Promise.all(batch.map(id => this.postTransaction(id)))
      results.push(...batchResults)
    }

    return results
  }

  // Sync master data from SAP
  static async syncMasterData(
    organizationId: string,
    entityType: 'gl_account' | 'cost_center' | 'customer' | 'vendor'
  ): Promise<{
    success: boolean
    recordsSynced: number
    recordsFailed: number
    errors: string[]
  }> {
    try {
      const connector = await SAPConnectorFactory.create(organizationId)
      const result = await connector.syncMasterData(entityType)

      // Store synced data in core_entities
      // Implementation would go here...

      return {
        success: true,
        recordsSynced: result.recordsSync,
        recordsFailed: result.recordsFailed,
        errors: result.errors.map(e => e.error)
      }
    } catch (error: any) {
      return {
        success: false,
        recordsSynced: 0,
        recordsFailed: 0,
        errors: [error.message]
      }
    }
  }

  // Private helper methods
  private static async fetchTransaction(
    transactionId: string
  ): Promise<{ transaction: UniversalTransaction | null; lines: UniversalTransactionLine[] }> {
    // Fetch transaction
    const { data: transaction, error: txError } = await supabaseClient
      .from('universal_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (txError || !transaction) {
      return { transaction: null, lines: [] }
    }

    // Fetch lines
    const { data: lines, error: linesError } = await supabaseClient
      .from('universal_transaction_lines')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('line_number')

    return {
      transaction,
      lines: lines || []
    }
  }

  private static async checkForDuplicates(
    transaction: UniversalTransaction
  ): Promise<{ isDuplicate: boolean; confidence: number }> {
    // Fetch similar transactions from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentTransactions } = await supabaseClient
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', transaction.organization_id)
      .eq('transaction_type', transaction.transaction_type)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .neq('id', transaction.id)

    if (!recentTransactions || recentTransactions.length === 0) {
      return { isDuplicate: false, confidence: 0 }
    }

    const duplicateCheck = await SAPValidationService.checkDuplicate(
      transaction,
      recentTransactions
    )

    return {
      isDuplicate: duplicateCheck.isDuplicate,
      confidence: duplicateCheck.confidence
    }
  }

  private static async updateTransactionWithSAPRef(
    transactionId: string,
    sapDocumentNumber: string,
    sapFiscalYear: string
  ): Promise<void> {
    // Update transaction status and SAP reference
    const { error } = await supabaseClient
      .from('universal_transactions')
      .update({
        transaction_status: 'posted',
        metadata: {
          sap_document_number: sapDocumentNumber,
          sap_fiscal_year: sapFiscalYear,
          sap_posted_at: new Date().toISOString()
        }
      })
      .eq('id', transactionId)

    if (error) {
      console.error('Failed to update transaction:', error)
    }

    // Create relationship to track SAP posting
    await supabaseClient.from('core_relationships').insert({
      from_entity_id: transactionId,
      to_entity_id: transactionId, // Self-reference
      relationship_type: 'sap_posted',
      smart_code: 'HERA.ERP.FI.EVENT.POSTED.V1',
      metadata: {
        sap_document_number: sapDocumentNumber,
        sap_fiscal_year: sapFiscalYear,
        posted_at: new Date().toISOString()
      }
    })
  }

  private static async createAuditTrail(
    transaction: UniversalTransaction,
    sapDocument: any
  ): Promise<void> {
    // Create audit entry in core_dynamic_data
    await supabaseClient.from('core_dynamic_data').insert({
      organization_id: transaction.organization_id,
      entity_id: transaction.id,
      field_name: 'sap_posting_audit',
      field_value_json: {
        posted_at: new Date().toISOString(),
        sap_document: sapDocument,
        transaction_snapshot: transaction
      },
      smart_code: 'HERA.AUDIT.SAP.POST.v1'
    })
  }

  private static async logError(transactionId: string, error: any): Promise<void> {
    try {
      await supabaseClient.from('core_dynamic_data').insert({
        entity_id: transactionId,
        field_name: 'sap_posting_error',
        field_value_text: error.message || 'Unknown error',
        field_value_json: {
          error_details: error.sapError || {},
          stack_trace: error.stack,
          timestamp: new Date().toISOString()
        },
        smart_code: 'HERA.ERP.FI.ERROR.POST.V1'
      })
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }
  }

  // Utility methods
  static async getPostingStatus(transactionId: string): Promise<{
    status: 'pending' | 'posted' | 'error' | 'not_found'
    sapDocumentNumber?: string
    error?: string
  }> {
    const { data, error } = await supabaseClient
      .from('universal_transactions')
      .select('transaction_status, metadata')
      .eq('id', transactionId)
      .single()

    if (error || !data) {
      return { status: 'not_found' }
    }

    if ((data.metadata as any)?.sap_document_number) {
      return {
        status: 'posted',
        sapDocumentNumber: data.metadata.sap_document_number
      }
    }

    // Check for errors
    const { data: errorData } = await supabaseClient
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('entity_id', transactionId)
      .eq('field_name', 'sap_posting_error')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (errorData) {
      return {
        status: 'error',
        error: errorData.field_value_text
      }
    }

    return { status: 'pending' }
  }
}
