import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// SAP connector types
interface SAPConfig {
  systemType: 'S4HANA_CLOUD' | 'S4HANA_ONPREM' | 'ECC' | 'B1'
  baseUrl?: string
  credentials: any
  companyCode: string
}

interface PostingRequest {
  transaction_id: string
  organization_id: string
  smart_code: string
}

serve(async (req) => {
  try {
    // Parse request
    const { transaction_id, organization_id, smart_code } = await req.json() as PostingRequest

    console.log(`Processing SAP posting for transaction ${transaction_id}`)

    // Fetch transaction with lines
    const { data: transaction, error: txError } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(*)
      `)
      .eq('id', transaction_id)
      .single()

    if (txError || !transaction) {
      throw new Error('Transaction not found')
    }

    // Validate transaction
    const validation = validateTransaction(transaction)
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    // Get SAP configuration
    const sapConfig = await getSAPConfig(organization_id)

    // Post to SAP based on system type
    let sapDocument
    switch (sapConfig.systemType) {
      case 'S4HANA_CLOUD':
        sapDocument = await postToS4HANACloud(transaction, sapConfig)
        break
      default:
        throw new Error(`Unsupported SAP system type: ${sapConfig.systemType}`)
    }

    // Update transaction with SAP reference
    await supabase
      .from('universal_transactions')
      .update({
        transaction_status: 'posted',
        metadata: {
          ...transaction.metadata,
          sap_document_number: sapDocument.documentNumber,
          sap_fiscal_year: sapDocument.fiscalYear,
          sap_posted_at: new Date().toISOString()
        }
      })
      .eq('id', transaction_id)

    // Create audit trail
    await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id,
        entity_id: transaction_id,
        field_name: 'sap_posting_audit',
        field_value_json: {
          posted_at: new Date().toISOString(),
          sap_document: sapDocument,
          edge_function_version: '1.0'
        },
        smart_code: 'HERA.AUDIT.SAP.POST.v1'
      })

    return new Response(
      JSON.stringify({
        success: true,
        transaction_id,
        sap_document_number: sapDocument.documentNumber,
        sap_fiscal_year: sapDocument.fiscalYear
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('SAP posting error:', error)

    // Log error to database
    if (req.method === 'POST') {
      const { transaction_id, organization_id } = await req.json()
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id,
          entity_id: transaction_id,
          field_name: 'sap_posting_error',
          field_value_text: error.message,
          field_value_json: {
            error_details: error,
            timestamp: new Date().toISOString()
          },
          smart_code: 'HERA.ERP.FI.ERROR.POST.v1'
        })
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Validation function
function validateTransaction(transaction: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check GL balance
  const lines = transaction.universal_transaction_lines || []
  const totalDebits = lines.reduce((sum: number, line: any) => sum + (line.debit_amount || 0), 0)
  const totalCredits = lines.reduce((sum: number, line: any) => sum + (line.credit_amount || 0), 0)

  if (Math.abs(totalDebits - totalCredits) > 0.01) {
    errors.push(`Document not balanced. Debits: ${totalDebits}, Credits: ${totalCredits}`)
  }

  // Check required fields
  if (!transaction.transaction_date) {
    errors.push('Transaction date is required')
  }

  if (!transaction.smart_code) {
    errors.push('Smart code is required')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// Get SAP configuration
async function getSAPConfig(organizationId: string): Promise<SAPConfig> {
  const { data: configData, error } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_text, field_value_json')
    .eq('organization_id', organizationId)
    .eq('smart_code', 'HERA.ERP.FI.CONFIG.v1')

  if (error || !configData || configData.length === 0) {
    throw new Error('SAP configuration not found')
  }

  const config: any = {}
  configData.forEach(field => {
    if (field.field_name === 'sap_system_type') {
      config.systemType = field.field_value_text
    } else if (field.field_name === 'sap_url') {
      config.baseUrl = field.field_value_text
    } else if (field.field_name === 'company_code') {
      config.companyCode = field.field_value_text
    } else if (field.field_name === 'credentials') {
      config.credentials = field.field_value_json
    }
  })

  return config as SAPConfig
}

// Post to S/4HANA Cloud
async function postToS4HANACloud(transaction: any, config: SAPConfig): Promise<any> {
  // Get OAuth token
  const tokenResponse = await fetch(`${config.baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${config.credentials.clientId}:${config.credentials.clientSecret}`)}`
    },
    body: 'grant_type=client_credentials&scope=API_JOURNAL_ENTRY_SRV'
  })

  if (!tokenResponse.ok) {
    throw new Error('Failed to get OAuth token')
  }

  const tokenData = await tokenResponse.json()

  // Prepare SAP document
  const sapDoc = {
    CompanyCode: config.companyCode,
    DocumentDate: transaction.transaction_date,
    PostingDate: transaction.posting_date || transaction.transaction_date,
    DocumentType: getDocumentType(transaction.smart_code),
    Reference: transaction.transaction_code,
    HeaderText: transaction.description || '',
    DocumentCurrency: transaction.currency || 'USD',
    JournalEntryItems: mapTransactionLines(transaction.universal_transaction_lines || [])
  }

  // Post to SAP
  const response = await fetch(
    `${config.baseUrl}/sap/opu/odata4/sap/api_journal_entry_srv/srvd_a2x/v1/JournalEntry`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(sapDoc)
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message?.value || 'SAP posting failed')
  }

  const result = await response.json()

  return {
    documentNumber: result.AccountingDocument,
    fiscalYear: result.FiscalYear,
    companyCode: result.CompanyCode,
    postingDate: result.PostingDate
  }
}

// Helper functions
function getDocumentType(smartCode: string): string {
  const mapping: Record<string, string> = {
    'HERA.ERP.FI.JE.POST.v1': 'SA',
    'HERA.ERP.FI.AP.INVOICE.v1': 'KR',
    'HERA.ERP.FI.AR.INVOICE.v1': 'DR',
    'HERA.ERP.FI.AP.PAYMENT.v1': 'KZ',
    'HERA.ERP.FI.AR.RECEIPT.v1': 'DZ'
  }
  return mapping[smartCode] || 'SA'
}

function mapTransactionLines(lines: any[]): any[] {
  return lines.map((line, index) => ({
    GLAccount: line.gl_account_code,
    AmountInTransactionCurrency: line.debit_amount ? 
      line.debit_amount : 
      -Math.abs(line.credit_amount || 0),
    DebitCreditCode: line.debit_amount ? 'S' : 'H',
    DocumentItemText: line.description || '',
    CostCenter: line.cost_center,
    ProfitCenter: line.profit_center,
    TaxCode: line.tax_code || '',
    ItemNumber: index + 1
  }))
}