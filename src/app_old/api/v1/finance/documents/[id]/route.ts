/**
 * HERA Financial Document Details API
 * Smart Code: HERA.FIN.API.DOC.DETAIL.v1
 *
 * Retrieve detailed financial document with full audit trail
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization ID is required'
        },
        { status: 400 }
      )
    }

    // Get document with all details
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('universal_transactions')
      .select(
        `
        *,
        universal_transaction_lines (
          id,
          line_number,
          entity_id,
          line_type,
          description,
          quantity,
          unit_amount,
          line_amount,
          discount_amount,
          tax_amount,
          metadata,
          smart_code,
          created_at,
          updated_at
        ),
        source_entity:source_entity_id (
          id,
          entity_name,
          entity_code,
          entity_type
        ),
        target_entity:target_entity_id (
          id,
          entity_name,
          entity_code,
          entity_type
        )
      `
      )
      .eq('id', resolvedParams.id)
      .eq('organization_id', organizationId)
      .single()

    if (txError || !transaction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document not found'
        },
        { status: 404 }
      )
    }

    // Get GL account details for line items
    const accountIds =
      transaction.universal_transaction_lines
        ?.map((line: any) => line.entity_id || (line.metadata as any)?.account_id)
        .filter(Boolean) || []

    let accounts: any[] = []
    if (accountIds.length > 0) {
      const { data: accountData } = await supabaseAdmin
        .from('core_entities')
        .select('id, entity_code, entity_name, metadata')
        .in('id', accountIds)
        .eq('entity_type', 'gl_account')

      accounts = accountData || []
    }

    // Get posting history (audit trail)
    const { data: auditTrail } = await supabaseAdmin
      .from('universal_transactions')
      .select('id, transaction_type, transaction_code, created_at, metadata')
      .eq('organization_id', organizationId)
      .eq('metadata->original_document_id', resolvedParams.id)
      .eq('transaction_type', 'audit_log')
      .order('created_at', { ascending: false })

    // Transform to document format
    const document = {
      id: transaction.id,
      transaction_code: transaction.transaction_code,
      transaction_type: transaction.transaction_type,
      transaction_date: transaction.transaction_date,
      total_amount: transaction.total_amount,
      currency: transaction.transaction_currency_code || 'AED',
      status: (transaction.metadata as any)?.status || 'draft',
      description: transaction.description,
      reference_number: transaction.reference_number,
      smart_code: transaction.smart_code,
      created_by: transaction.created_by,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
      fiscal_year: transaction.fiscal_year || new Date(transaction.transaction_date).getFullYear(),
      fiscal_period: transaction.fiscal_period,
      posting_date: (transaction.metadata as any)?.posted_at || transaction.transaction_date,
      source_entity: transaction.source_entity,
      target_entity: transaction.target_entity,
      metadata: transaction.metadata,
      lines: transaction.universal_transaction_lines?.map((line: any, index: number) => {
        const account = accounts.find(
          a => a.id === (line.entity_id || (line.metadata as any)?.account_id)
        )
        return {
          id: line.id,
          line_number: line.line_number || index + 1,
          account_code:
            account?.entity_code || (line.metadata as any)?.account_code || line.entity_id,
          account_name:
            account?.entity_name || (line.metadata as any)?.account_name || line.description,
          description: line.description,
          debit_amount:
            (line.metadata as any)?.debit || (line.line_amount > 0 ? line.line_amount : 0),
          credit_amount:
            (line.metadata as any)?.credit ||
            (line.line_amount < 0 ? Math.abs(line.line_amount) : 0),
          quantity: line.quantity,
          unit_amount: line.unit_amount,
          line_amount: line.line_amount,
          cost_center: (line.metadata as any)?.cost_center,
          profit_center: (line.metadata as any)?.profit_center,
          smart_code: line.smart_code,
          created_at: line.created_at,
          updated_at: line.updated_at
        }
      }),
      audit_trail:
        auditTrail?.map(audit => ({
          id: audit.id,
          action: (audit.metadata as any)?.action || 'updated',
          timestamp: audit.created_at,
          user: (audit.metadata as any)?.user || 'System',
          changes: (audit.metadata as any)?.changes
        })) || []
    }

    return NextResponse.json({
      success: true,
      document
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
