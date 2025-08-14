import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'


// GET /api/v1/test-kitchen - Test kitchen display data flow
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    console.log('🍳 Testing Kitchen Display data flow...')

    // 1. Check if we have any transactions
    const { data: allTransactions, error: allError } = await supabaseAdmin
      .from('universal_transactions')
      .select('id, transaction_type, status, reference_number, transaction_date')
      .eq('organization_id', organizationId)
      .order('transaction_date', { ascending: false })
      .limit(10)

    console.log('📊 All transactions:', allTransactions?.length || 0, allTransactions)

    // 2. Check specifically for order transactions
    const { data: orderTransactions, error: ordersError } = await supabaseAdmin
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'order')
      .in('status', ['pending', 'processing', 'approved'])
      .order('transaction_date', { ascending: false })
      .limit(10)

    console.log('🍕 Order transactions:', orderTransactions?.length || 0)

    // 3. If we have orders, check their lines
    let orderLines = []
    if (orderTransactions && orderTransactions.length > 0) {
      const orderIds = orderTransactions.map(t => t.id)
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
        .in('transaction_id', orderIds)
        .order('line_order', { ascending: true })

      orderLines = lines || []
      console.log('📝 Order lines:', orderLines.length)
    }

    // 4. Check menu items
    const { data: menuItems, error: menuError } = await supabaseAdmin
      .from('core_entities')
      .select('id, entity_name, entity_code')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'menu_item')
      .limit(10)

    console.log('🍔 Menu items:', menuItems?.length || 0)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        summary: {
          total_transactions: allTransactions?.length || 0,
          order_transactions: orderTransactions?.length || 0,
          active_orders: orderTransactions?.filter(o => ['pending', 'processing', 'approved'].includes(o.status)).length || 0,
          order_lines: orderLines.length,
          menu_items: menuItems?.length || 0
        },
        sample_order: orderTransactions?.[0] || null,
        sample_lines: orderLines.slice(0, 3),
        sample_menu_items: menuItems?.slice(0, 5) || [],
        debug: {
          organization_id: organizationId,
          has_data: (orderTransactions?.length || 0) > 0,
          kitchen_should_show: orderTransactions?.filter(o => ['pending', 'processing', 'approved'].includes(o.status)).length || 0
        }
      }
    })

  } catch (error) {
    console.error('🚨 Test kitchen error:', error)
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