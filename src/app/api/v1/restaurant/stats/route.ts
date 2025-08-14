import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/v1/restaurant/stats - Get restaurant dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Verify authentication (in production, get from JWT)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID

    // Get today's date range
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    // Get today's orders
    const { data: todaysOrders, error: ordersError } = await supabaseAdmin
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'order')
      .gte('transaction_date', startOfDay.toISOString())
      .lt('transaction_date', endOfDay.toISOString())

    if (ordersError) {
      console.error('Error fetching today\'s orders:', ordersError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch order statistics' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalOrders = todaysOrders.length
    const totalRevenue = todaysOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    
    // Count unique customers (from transaction_data)
    const uniqueCustomers = new Set()
    todaysOrders.forEach(order => {
      try {
        const data = typeof order.transaction_data === 'string' 
          ? JSON.parse(order.transaction_data) 
          : order.transaction_data
        if (data?.customer_id) {
          uniqueCustomers.add(data.customer_id)
        }
      } catch (e) {
        // Ignore parsing errors
      }
    })

    // Calculate average order time (mock calculation based on order status)
    const completedOrders = todaysOrders.filter(order => order.status === 'completed')
    let avgOrderTime = 18 // Default average

    if (completedOrders.length > 0) {
      // In a real implementation, you'd track preparation times
      // For now, use a simple calculation based on order complexity
      const totalItems = completedOrders.reduce((sum, order) => {
        // Count line items for this order (approximation)
        return sum + Math.ceil(order.total_amount / 15) // Rough estimate
      }, 0)
      avgOrderTime = Math.round(totalItems / completedOrders.length * 3) + 12 // Base prep time
    }

    // Get recent orders for dashboard
    const { data: recentOrders, error: recentError } = await supabaseAdmin
      .from('universal_transactions')
      .select(`
        *,
        lines:universal_transaction_lines(
          quantity,
          menu_item:core_entities!universal_transaction_lines_entity_id_fkey(entity_name)
        )
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'order')
      .order('transaction_date', { ascending: false })
      .limit(5)

    if (recentError) {
      console.error('Error fetching recent orders:', recentError)
    }

    // Format recent orders
    const formattedRecentOrders = recentOrders?.map(order => {
      interface TransactionData {
        table_id?: string
        order_type?: string
        customer_name?: string
        table_number?: string
        [key: string]: unknown
      }
      
      let transactionData: TransactionData = {}
      try {
        transactionData = typeof order.transaction_data === 'string' 
          ? JSON.parse(order.transaction_data) 
          : order.transaction_data || {}
      } catch (e) {
        // Ignore parsing errors
      }

      // Get item names
      const itemNames = order.lines?.map((line: { quantity: number; menu_item?: { entity_name?: string } }) => 
        `${line.quantity}x ${line.menu_item?.entity_name || 'Item'}`
      ).join(', ') || 'No items'

      // Calculate time ago
      const orderTime = new Date(order.transaction_date)
      const diffMs = Date.now() - orderTime.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      let timeAgo = 'Just now'
      if (diffMins >= 1) {
        timeAgo = diffMins === 1 ? '1 min ago' : `${diffMins} mins ago`
      }

      return {
        id: order.reference_number,
        table: transactionData.table_id ? 
          transactionData.table_id.replace('table_', 'Table ').replace('_', ' ') : 
          (transactionData.order_type === 'takeout' ? 'Takeout' : 'Delivery'),
        items: itemNames.length > 50 ? itemNames.substring(0, 47) + '...' : itemNames,
        total: order.total_amount,
        status: order.status,
        time: timeAgo
      }
    }) || []

    return NextResponse.json({
      success: true,
      data: {
        todaysStats: {
          revenue: Number(totalRevenue.toFixed(2)),
          orders: totalOrders,
          customers: uniqueCustomers.size,
          avgOrderTime: avgOrderTime
        },
        recentOrders: formattedRecentOrders
      }
    })

  } catch (error) {
    console.error('Restaurant stats API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}