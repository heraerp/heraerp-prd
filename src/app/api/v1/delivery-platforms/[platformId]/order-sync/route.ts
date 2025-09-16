import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabase-admin'

// Steve Jobs Principle: "Focus and simplicity"
// Universal order synchronization that maintains consistency across all platforms

interface OrderStatusUpdate {
  platform_order_id: string
  status: string
  estimated_time?: string
  tracking_info?: {
    driver_name?: string
    driver_phone?: string
    location?: { lat: number; lng: number }
    estimated_delivery_time?: string
  }
  reason?: string // For cancellations or delays
}

// Platform-specific status mappers
const statusMappers = {
  deliveroo: {
    // HERA status -> Deliveroo status
    pending: 'accepted',
    processing: 'preparation_started',
    approved: 'ready_for_collection',
    completed: 'delivered',
    cancelled: 'cancelled'
  },

  swiggy: {
    // HERA status -> Swiggy status
    pending: 'ACCEPTED',
    processing: 'FOOD_PREPARATION',
    approved: 'READY_FOR_PICKUP',
    completed: 'DELIVERED',
    cancelled: 'CANCELLED'
  },

  ubereats: {
    // HERA status -> Uber Eats status
    pending: 'accepted',
    processing: 'finished',
    approved: 'ready_for_pickup',
    completed: 'delivered',
    cancelled: 'cancelled'
  },

  // Generic mapper for custom platforms
  generic: {
    pending: 'accepted',
    processing: 'preparing',
    approved: 'ready',
    completed: 'completed',
    cancelled: 'cancelled'
  }
}

// Platform-specific API call simulators (in production, these would make actual HTTP requests)
const platformAPIs = {
  deliveroo: async (orderUpdate: OrderStatusUpdate, platformConfig: any) => {
    // Simulate Deliveroo API call
    console.log(
      `📞 Deliveroo API: Updating order ${orderUpdate.platform_order_id} to ${orderUpdate.status}`
    )

    const apiPayload = {
      status: statusMappers.deliveroo[orderUpdate.status as keyof typeof statusMappers.deliveroo],
      estimated_ready_time: orderUpdate.estimated_time,
      reason: orderUpdate.reason
    }

    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 200))

    return {
      success: Math.random() > 0.1, // 90% success rate
      platform_response: {
        order_id: orderUpdate.platform_order_id,
        status: apiPayload.status,
        updated_at: new Date().toISOString()
      }
    }
  },

  swiggy: async (orderUpdate: OrderStatusUpdate, platformConfig: any) => {
    console.log(
      `📞 Swiggy API: Updating order ${orderUpdate.platform_order_id} to ${orderUpdate.status}`
    )

    const apiPayload = {
      orderId: orderUpdate.platform_order_id,
      orderStatus: statusMappers.swiggy[orderUpdate.status as keyof typeof statusMappers.swiggy],
      estimatedTime: orderUpdate.estimated_time,
      driverInfo: orderUpdate.tracking_info
    }

    await new Promise(resolve => setTimeout(resolve, 300))

    return {
      success: Math.random() > 0.15, // 85% success rate
      platform_response: {
        orderId: orderUpdate.platform_order_id,
        status: 'SUCCESS',
        message: 'Order status updated successfully'
      }
    }
  },

  ubereats: async (orderUpdate: OrderStatusUpdate, platformConfig: any) => {
    console.log(
      `📞 Uber Eats API: Updating order ${orderUpdate.platform_order_id} to ${orderUpdate.status}`
    )

    const apiPayload = {
      current_state:
        statusMappers.ubereats[orderUpdate.status as keyof typeof statusMappers.ubereats],
      estimated_ready_for_pickup_at: orderUpdate.estimated_time,
      cancellation_reason: orderUpdate.reason
    }

    await new Promise(resolve => setTimeout(resolve, 250))

    return {
      success: Math.random() > 0.05, // 95% success rate
      platform_response: {
        id: orderUpdate.platform_order_id,
        current_state: apiPayload.current_state,
        last_updated_at: new Date().toISOString()
      }
    }
  },

  generic: async (orderUpdate: OrderStatusUpdate, platformConfig: any) => {
    console.log(
      `📞 Generic API: Updating order ${orderUpdate.platform_order_id} to ${orderUpdate.status}`
    )

    await new Promise(resolve => setTimeout(resolve, 150))

    return {
      success: Math.random() > 0.2, // 80% success rate
      platform_response: {
        order_id: orderUpdate.platform_order_id,
        status: orderUpdate.status,
        updated_at: new Date().toISOString()
      }
    }
  }
}

// POST /api/v1/delivery-platforms/[platformId]/order-sync - Sync order status to platform
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ platformId: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin()

  const params = await context.params
  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const platformId = params.platformId
    const orderUpdate: OrderStatusUpdate = await request.json()

    console.log(
      `🔄 Order Sync: Updating order ${orderUpdate.platform_order_id} to ${orderUpdate.status} on platform ${platformId}`
    )

    // Get platform configuration
    const { data: platform, error: platformError } = await supabaseAdmin
      .from('core_entities')
      .select(
        `
        *,
        dynamic_data:core_dynamic_data(
          field_name,
          field_value,
          field_value_boolean,
          field_type
        )
      `
      )
      .eq('id', platformId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'delivery_platform')
      .single()

    if (platformError || !platform) {
      console.error('❌ Platform not found:', platformError)
      return NextResponse.json({ success: false, message: 'Platform not found' }, { status: 404 })
    }

    // Extract platform properties
    const platformProps =
      platform.dynamic_data?.reduce((acc: any, prop: any) => {
        let value = prop.field_value
        if (prop.field_type === 'boolean' && prop.field_value_boolean !== null) {
          value = prop.field_value_boolean
        }
        acc[prop.field_name] = value
        return acc
      }, {}) || {}

    // Check if platform is active
    if (!platformProps.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: 'Platform is not active'
        },
        { status: 400 }
      )
    }

    // Find the order in HERA system
    const { data: heraOrder, error: orderError } = await supabaseAdmin
      .from('universal_transactions')
      .select('id, status, metadata')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'order')
      .eq('metadata->>platform_order_id', orderUpdate.platform_order_id)
      .single()

    if (orderError || !heraOrder) {
      console.error('❌ Order not found in HERA system:', orderError)
      return NextResponse.json(
        { success: false, message: 'Order not found in system' },
        { status: 404 }
      )
    }

    // Validate status transition
    const validTransitions = {
      pending: ['processing', 'cancelled'],
      processing: ['approved', 'cancelled'],
      approved: ['completed', 'cancelled'],
      completed: [], // Final state
      cancelled: [] // Final state
    }

    const currentStatus = heraOrder.status
    const newStatus = orderUpdate.status

    if (
      !validTransitions[currentStatus as keyof typeof validTransitions]?.includes(
        newStatus as never
      ) &&
      currentStatus !== newStatus
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status transition from ${currentStatus} to ${newStatus}`
        },
        { status: 400 }
      )
    }

    // Call platform API to update status
    const platformAPI =
      platformAPIs[platformProps.platform_type as keyof typeof platformAPIs] || platformAPIs.generic
    const apiResult = await platformAPI(orderUpdate, platformProps)

    if (!apiResult.success) {
      console.error(`❌ Platform API call failed for order ${orderUpdate.platform_order_id}`)

      // Log the failure but don't fail the request completely
      await supabaseAdmin.from('core_dynamic_data').upsert(
        {
          organization_id: organizationId,
          entity_id: platformId,
          field_name: 'last_sync_error',
          field_value: JSON.stringify({
            timestamp: new Date().toISOString(),
            order_id: orderUpdate.platform_order_id,
            error: 'Platform API call failed'
          }),
          field_type: 'text'
        },
        {
          onConflict: 'organization_id,entity_id,field_name'
        }
      )

      return NextResponse.json(
        {
          success: false,
          message: 'Failed to update order status on platform',
          details: 'Platform API returned an error'
        },
        { status: 502 }
      )
    }

    // Update order status in HERA system
    const updatedMetadata = {
      ...heraOrder.metadata,
      last_platform_sync: new Date().toISOString(),
      platform_sync_status: 'synced',
      platform_response: apiResult.platform_response,
      ...(orderUpdate.tracking_info && { tracking_info: orderUpdate.tracking_info })
    }

    const { error: updateError } = await supabaseAdmin
      .from('universal_transactions')
      .update({
        status: newStatus,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', heraOrder.id)

    if (updateError) {
      console.error('❌ Failed to update order in HERA system:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update order in system' },
        { status: 500 }
      )
    }

    // Update platform sync statistics
    await supabaseAdmin.from('core_dynamic_data').upsert(
      {
        organization_id: organizationId,
        entity_id: platformId,
        field_name: 'last_order_sync',
        field_value: new Date().toISOString(),
        field_type: 'text'
      },
      {
        onConflict: 'organization_id,entity_id,field_name'
      }
    )

    const response = {
      success: true,
      message: `Order ${orderUpdate.platform_order_id} status updated to ${newStatus}`,
      data: {
        hera_order_id: heraOrder.id,
        platform_order_id: orderUpdate.platform_order_id,
        platform_name: platform.entity_name,
        status_transition: `${currentStatus} → ${newStatus}`,
        platform_response: apiResult.platform_response,
        sync_timestamp: new Date().toISOString()
      }
    }

    console.log(`✅ Order sync completed: ${orderUpdate.platform_order_id} updated to ${newStatus}`)
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Order sync error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/v1/delivery-platforms/[platformId]/order-sync - Bulk order status sync
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ platformId: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin()

  const params = await context.params
  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const platformId = params.platformId
    const { order_updates }: { order_updates: OrderStatusUpdate[] } = await request.json()

    console.log(
      `🔄 Bulk Order Sync: Processing ${order_updates.length} order updates for platform ${platformId}`
    )

    // Get platform configuration
    const { data: platform, error: platformError } = await supabaseAdmin
      .from('core_entities')
      .select(
        `
        *,
        dynamic_data:core_dynamic_data(
          field_name,
          field_value,
          field_value_boolean,
          field_type
        )
      `
      )
      .eq('id', platformId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'delivery_platform')
      .single()

    if (platformError || !platform) {
      console.error('❌ Platform not found:', platformError)
      return NextResponse.json({ success: false, message: 'Platform not found' }, { status: 404 })
    }

    const syncResults = {
      total_orders: order_updates.length,
      successful_syncs: 0,
      failed_syncs: 0,
      skipped_syncs: 0,
      errors: [] as string[],
      details: [] as any[]
    }

    // Process each order update
    for (const orderUpdate of order_updates) {
      try {
        // Create a new request for each order (reusing the single order logic)
        const singleUpdateRequest = new Request(request.url.replace('/order-sync', '/order-sync'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderUpdate)
        })

        const singleResult = await POST(singleUpdateRequest as NextRequest, {
          params: Promise.resolve(params)
        })
        const resultData = await singleResult.json()

        if (resultData.success) {
          syncResults.successful_syncs++
          syncResults.details.push({
            platform_order_id: orderUpdate.platform_order_id,
            status: 'success',
            data: resultData.data
          })
        } else {
          syncResults.failed_syncs++
          syncResults.errors.push(`${orderUpdate.platform_order_id}: ${resultData.message}`)
          syncResults.details.push({
            platform_order_id: orderUpdate.platform_order_id,
            status: 'failed',
            error: resultData.message
          })
        }
      } catch (error) {
        syncResults.failed_syncs++
        syncResults.errors.push(`${orderUpdate.platform_order_id}: ${error}`)
        syncResults.details.push({
          platform_order_id: orderUpdate.platform_order_id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Update bulk sync statistics
    await supabaseAdmin.from('core_dynamic_data').upsert(
      {
        organization_id: organizationId,
        entity_id: platformId,
        field_name: 'last_bulk_sync',
        field_value: JSON.stringify({
          timestamp: new Date().toISOString(),
          results: syncResults
        }),
        field_type: 'text'
      },
      {
        onConflict: 'organization_id,entity_id,field_name'
      }
    )

    const response = {
      success: syncResults.failed_syncs === 0,
      message: `Bulk sync completed: ${syncResults.successful_syncs} successful, ${syncResults.failed_syncs} failed`,
      data: {
        platform_id: platformId,
        platform_name: platform.entity_name,
        sync_summary: syncResults,
        recommendations:
          syncResults.failed_syncs > 0
            ? [
                'Review individual order errors',
                'Check platform API connectivity',
                'Retry failed orders individually'
              ]
            : ['All orders synchronized successfully', 'Monitor for new order updates']
      }
    }

    console.log(
      `✅ Bulk order sync completed: ${syncResults.successful_syncs}/${syncResults.total_orders} orders synced`
    )
    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Bulk order sync error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/v1/delivery-platforms/[platformId]/order-sync - Get order sync status and pending updates
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platformId: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin()

  const params = await context.params
  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const platformId = params.platformId
    const { searchParams } = new URL(request.url)
    const includeOrders = searchParams.get('include_orders') === 'true'

    console.log(`📊 Order Sync Status: Getting sync status for platform ${platformId}`)

    // Get platform with sync data
    const { data: platform, error: platformError } = await supabaseAdmin
      .from('core_entities')
      .select(
        `
        *,
        dynamic_data:core_dynamic_data(
          field_name,
          field_value,
          field_type
        )
      `
      )
      .eq('id', platformId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'delivery_platform')
      .single()

    if (platformError || !platform) {
      return NextResponse.json({ success: false, message: 'Platform not found' }, { status: 404 })
    }

    // Get orders from this platform that might need sync
    const { data: platformOrders, error: ordersError } = await supabaseAdmin
      .from('universal_transactions')
      .select('id, status, transaction_number, total_amount, created_at, updated_at, metadata')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'order')
      .eq('metadata->>delivery_platform_id', platformId)
      .order('created_at', { ascending: false })
      .limit(includeOrders ? 50 : 10)

    if (ordersError) {
      console.error('❌ Error fetching platform orders:', ordersError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch platform orders' },
        { status: 500 }
      )
    }

    // Analyze orders for sync status
    const orderAnalysis = {
      total_orders: platformOrders?.length || 0,
      pending_sync: 0,
      synced_orders: 0,
      failed_sync: 0,
      orders_by_status: {
        pending: 0,
        processing: 0,
        approved: 0,
        completed: 0,
        cancelled: 0
      }
    }

    const ordersNeedingSync = []

    if (platformOrders) {
      for (const order of platformOrders) {
        // Count orders by status
        orderAnalysis.orders_by_status[
          order.status as keyof typeof orderAnalysis.orders_by_status
        ]++

        // Check sync status
        const syncStatus = (order.metadata as any)?.platform_sync_status
        const lastSync = (order.metadata as any)?.last_platform_sync

        if (!syncStatus || syncStatus === 'pending') {
          orderAnalysis.pending_sync++
          ordersNeedingSync.push({
            id: order.id,
            platform_order_id: (order.metadata as any)?.platform_order_id,
            status: order.status,
            created_at: order.created_at,
            sync_needed: 'initial_sync'
          })
        } else if (syncStatus === 'failed') {
          orderAnalysis.failed_sync++
          ordersNeedingSync.push({
            id: order.id,
            platform_order_id: (order.metadata as any)?.platform_order_id,
            status: order.status,
            created_at: order.created_at,
            sync_needed: 'retry_failed'
          })
        } else if (syncStatus === 'synced') {
          orderAnalysis.synced_orders++

          // Check if order was updated after last sync
          if (lastSync && new Date(order.updated_at) > new Date(lastSync)) {
            orderAnalysis.pending_sync++
            ordersNeedingSync.push({
              id: order.id,
              platform_order_id: (order.metadata as any)?.platform_order_id,
              status: order.status,
              created_at: order.created_at,
              sync_needed: 'status_update'
            })
          }
        }
      }
    }

    const response = {
      success: true,
      data: {
        platform_id: platformId,
        platform_name: platform.entity_name,
        sync_overview: orderAnalysis,
        orders_needing_sync: ordersNeedingSync,
        ...(includeOrders && {
          recent_orders: platformOrders?.map(order => ({
            id: order.id,
            platform_order_id: (order.metadata as any)?.platform_order_id,
            transaction_code: order.transaction_code,
            status: order.status,
            total_amount: order.total_amount,
            created_at: order.created_at,
            sync_status: (order.metadata as any)?.platform_sync_status || 'unknown',
            last_sync: (order.metadata as any)?.last_platform_sync || null
          }))
        }),
        recommendations: [
          ...(orderAnalysis.pending_sync > 0
            ? [`${orderAnalysis.pending_sync} orders need sync`]
            : []),
          ...(orderAnalysis.failed_sync > 0
            ? [`${orderAnalysis.failed_sync} orders have sync failures`]
            : []),
          ...(ordersNeedingSync.length === 0 ? ['All orders are synchronized'] : [])
        ]
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Order sync status error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
