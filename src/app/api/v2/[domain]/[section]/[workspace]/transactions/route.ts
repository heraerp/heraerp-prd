/**
 * HERA Universal API v2 - Transaction CRUD Router
 * Smart Code: HERA.API.V2.UNIVERSAL.TRANSACTIONS.v1
 * 
 * Universal transaction management for all domain/section/workspace combinations
 * Maps to hera_txn_crud_v1 with automatic Smart Code generation and Finance DNA integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiV2 } from '@/lib/client/fetchV2'

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = await params
  const { searchParams } = new URL(request.url)
  const transactionType = searchParams.get('transactionType')
  
  console.log(`🔍 Universal Transaction GET: ${domain}/${section}/${workspace}/transactions/${transactionType || 'all'}`)

  try {
    // Get transactions via Universal API
    const { data, error } = await apiV2.post('transactions', {
      operation: 'read',
      transaction_type: transactionType?.toUpperCase() || null,
      organization_id: searchParams.get('organizationId'),
      filters: {
        workspace_context: { domain, section, workspace },
        limit: parseInt(searchParams.get('limit') || '50'),
        offset: parseInt(searchParams.get('offset') || '0')
      },
      include_lines: searchParams.get('include_lines') === 'true'
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: data?.transactions || [],
      metadata: {
        count: data?.count || 0,
        domain,
        section,
        workspace,
        transactionType: transactionType || 'all'
      }
    })
  } catch (error) {
    console.error('Universal Transaction GET Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = params
  
  try {
    const body = await request.json()
    const { operation, transactionType, transactionData, lines, organizationId } = body
    
    console.log(`🔍 Universal Transaction POST: ${domain}/${section}/${workspace}/transactions/${transactionType}`)

    // Generate contextual Smart Code
    const smartCode = generateTransactionSmartCode(domain, section, workspace, transactionType)
    
    // Create transaction with Finance DNA integration
    const { data, error } = await apiV2.post('transactions', {
      operation: operation || 'create',
      transaction_type: transactionType.toUpperCase(),
      smart_code: smartCode,
      organization_id: organizationId,
      transaction_data: {
        ...transactionData,
        transaction_type: transactionType.toUpperCase(),
        smart_code: smartCode,
        workspace_context: { domain, section, workspace }
      },
      lines: lines || [],
      options: {
        auto_post_gl: true, // Enable Finance DNA auto-posting
        validate_balance: true,
        fiscal_period_check: true
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: data?.transaction,
      metadata: {
        domain,
        section,
        workspace,
        transactionType,
        smartCode,
        autoPosted: data?.gl_posted || false
      }
    })
  } catch (error) {
    console.error('Universal Transaction POST Error:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = params
  
  try {
    const body = await request.json()
    const { transactionId, updates, organizationId } = body
    
    console.log(`🔍 Universal Transaction PUT: ${domain}/${section}/${workspace}/transactions/${transactionId}`)

    const { data, error } = await apiV2.post('transactions', {
      operation: 'update',
      transaction_id: transactionId,
      organization_id: organizationId,
      transaction_data: updates.transaction_data || {},
      lines: updates.lines || [],
      options: {
        auto_post_gl: true,
        validate_balance: true
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: data?.transaction,
      metadata: { domain, section, workspace }
    })
  } catch (error) {
    console.error('Universal Transaction PUT Error:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = params
  const { searchParams } = new URL(request.url)
  const transactionId = searchParams.get('transactionId')
  const organizationId = searchParams.get('organizationId')
  
  console.log(`🔍 Universal Transaction DELETE: ${domain}/${section}/${workspace}/transactions/${transactionId}`)

  try {
    const { data, error } = await apiV2.post('transactions', {
      operation: 'delete',
      transaction_id: transactionId,
      organization_id: organizationId,
      options: {
        reverse_gl: true // Reverse GL entries when deleting
      }
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: true,
      metadata: { domain, section, workspace, reversed: data?.gl_reversed || false }
    })
  } catch (error) {
    console.error('Universal Transaction DELETE Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}

/**
 * Generate Smart Code for transactions based on route context
 */
function generateTransactionSmartCode(domain: string, section: string, workspace: string, transactionType: string): string {
  // HERA.{DOMAIN}.{SECTION}.{WORKSPACE}.TXN.{TYPE}.v1
  return `HERA.${domain.toUpperCase()}.${section.toUpperCase()}.${workspace.toUpperCase()}.TXN.${transactionType.toUpperCase()}.v1`
}