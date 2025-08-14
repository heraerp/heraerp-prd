import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/v1/test-transactions - Test transaction queries with debug info
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    console.log('🧪 Testing transactions query...')

    // Test basic transactions query
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'order')
      .order('transaction_date', { ascending: false })
      .limit(5)

    if (transactionsError) {
      console.error('❌ Transactions query error:', transactionsError)
      return NextResponse.json({
        success: false,
        error: 'transactions_error',
        details: transactionsError
      })
    }

    console.log('✅ Transactions found:', transactions?.length || 0)

    // Test transaction lines query
    if (transactions && transactions.length > 0) {
      const transactionIds = transactions.map(t => t.id)
      
      const { data: lines, error: linesError } = await supabaseAdmin
        .from('universal_transaction_lines')
        .select(`
          *,
          entity:core_entities!universal_transaction_lines_entity_id_fkey(
            id, 
            entity_name, 
            entity_code
          )
        `)
        .in('transaction_id', transactionIds)
        .order('line_order', { ascending: true })

      if (linesError) {
        console.error('❌ Transaction lines query error:', linesError)
        return NextResponse.json({
          success: false,
          error: 'lines_error',
          details: linesError
        })
      }

      console.log('✅ Transaction lines found:', lines?.length || 0)

      return NextResponse.json({
        success: true,
        message: 'Test successful!',
        data: {
          transactions_count: transactions.length,
          lines_count: lines?.length || 0,
          sample_transaction: transactions[0],
          sample_lines: lines?.slice(0, 3) || [],
          debug: {
            organization_id: organizationId,
            query_time: new Date().toISOString()
          }
        }
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'No transactions found - you may need to seed data first',
        data: {
          transactions_count: 0,
          lines_count: 0,
          suggestion: 'Visit /api/v1/seed-all to create sample data'
        }
      })
    }

  } catch (error) {
    console.error('🚨 Test transactions error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'server_error',
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}