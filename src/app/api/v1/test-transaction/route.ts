import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { type = 'sale' } = await request.json()
    
    // Test organization ID
    const organizationId = '550e8400-e29b-41d4-a716-446655440000'
    
    console.log('Testing universal transaction creation...')
    
    // Step 1: Create a simple transaction
    const transactionData = {
      organization_id: organizationId,
      transaction_type: type,
      transaction_code: `TEST-${Date.now().toString().slice(-6)}`,
      transaction_date: new Date().toISOString(),
      total_amount: 1000,
      transaction_currency_code: 'USD',
      base_currency_code: 'USD',
      exchange_rate: 1.0,
      smart_code: 'HERA.TEST.TXN.v1',
      metadata: {
        test: true,
        created_by: 'Test API',
        description: 'Testing universal transaction creation'
      }
    }
    
    console.log('Creating transaction:', JSON.stringify(transactionData, null, 2))
    
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('universal_transactions')
      .insert(transactionData)
      .select()
      .single()
    
    if (txError) {
      console.error('Transaction creation error:', txError)
      return NextResponse.json({
        success: false,
        error: 'Transaction creation failed',
        details: txError
      }, { status: 500 })
    }
    
    console.log('Transaction created successfully:', transaction.id)
    
    // Step 2: Try to create a simple line item
    const lineData = {
      organization_id: organizationId,
      transaction_id: transaction.id,
      line_number: 1,
      line_type: 'item',
      description: 'Test line item',
      quantity: 1,
      unit_amount: 1000,
      line_amount: 1000,
      smart_code: 'HERA.TEST.LINE.v1'
    }
    
    console.log('Creating line item:', JSON.stringify(lineData, null, 2))
    
    const { data: line, error: lineError } = await supabaseAdmin
      .from('universal_transaction_lines')
      .insert(lineData)
      .select()
      .single()
    
    if (lineError) {
      console.error('Line creation error:', lineError)
      return NextResponse.json({
        success: false,
        message: 'Transaction created but line item failed',
        transaction: transaction,
        lineError: lineError,
        attemptedLineData: lineData
      })
    }
    
    console.log('Line item created successfully:', line.id)
    
    return NextResponse.json({
      success: true,
      message: 'Universal transaction and line created successfully!',
      transaction: transaction,
      line: line
    })
    
  } catch (error) {
    console.error('Test transaction error:', error)
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : error
    }, { status: 500 })
  }
}

// GET endpoint to show test instructions
export async function GET() {
  return NextResponse.json({
    message: 'Universal Transaction Test Endpoint',
    usage: 'POST to this endpoint to test creating a universal transaction',
    example: {
      method: 'POST',
      body: {
        type: 'sale' // or 'purchase', 'journal_entry', etc.
      }
    },
    test_url: '/api/v1/test-transaction'
  })
}