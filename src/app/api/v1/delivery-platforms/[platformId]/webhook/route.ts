import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/src/lib/supabase-admin'
import crypto from 'crypto'

// Steve Jobs Principle: "Simplicity is the ultimate sophistication"
// Universal webhook handler that elegantly processes orders from any delivery platform

interface DeliveryPlatformOrder {
  // Universal order structure that works with any platform
  platform_order_id: string
  platform_name: string
  customer: {
    name: string
    phone: string
    email?: string
  }
  delivery_address: {
    street: string
    city: string
    postal_code: string
    coordinates?: { lat: number; lng: number }
    instructions?: string
  }
  items: Array<{
    name: string
    quantity: number
    unit_price: number
    modifications?: string[]
    special_instructions?: string
  }>
  totals: {
    subtotal: number
    delivery_fee: number
    platform_fee: number
    tax: number
    total: number
  }
  delivery_info: {
    estimated_delivery_time: string
    delivery_instructions?: string
    contact_free?: boolean
  }
  payment: {
    method: string
    status: 'paid' | 'pending' | 'failed'
    transaction_id?: string
  }
  created_at: string
  status: 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
}

// Platform-specific parsers following Steve Jobs "It just works" principle
const platformParsers = {
  deliveroo: (payload: any): DeliveryPlatformOrder => ({
    platform_order_id: payload.order_id,
    platform_name: 'deliveroo',
    customer: {
      name: payload.customer?.name || 'Deliveroo Customer',
      phone: payload.customer?.phone || '',
      email: payload.customer?.email || ''
    },
    delivery_address: {
      street: payload.delivery_address?.street_address || '',
      city: payload.delivery_address?.city || '',
      postal_code: payload.delivery_address?.postal_code || '',
      coordinates: payload.delivery_address?.coordinates
        ? {
            lat: payload.delivery_address.coordinates.latitude,
            lng: payload.delivery_address.coordinates.longitude
          }
        : undefined,
      instructions: payload.delivery_notes || ''
    },
    items:
      payload.items?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price / 100, // Deliveroo uses cents
        modifications: item.modifications?.map((mod: any) => mod.name) || [],
        special_instructions: item.special_instructions || ''
      })) || [],
    totals: {
      subtotal: payload.subtotal / 100,
      delivery_fee: payload.delivery_fee / 100,
      platform_fee: payload.service_charge / 100,
      tax: payload.tax / 100,
      total: payload.total_price / 100
    },
    delivery_info: {
      estimated_delivery_time: payload.estimated_delivery_time,
      delivery_instructions: payload.delivery_notes || '',
      contact_free: payload.contactless_delivery || false
    },
    payment: {
      method: payload.payment_method || 'card',
      status: payload.payment_status === 'paid' ? 'paid' : 'pending'
    },
    created_at: payload.created_at || new Date().toISOString(),
    status: payload.status || 'confirmed'
  }),

  swiggy: (payload: any): DeliveryPlatformOrder => ({
    platform_order_id: payload.orderId,
    platform_name: 'swiggy',
    customer: {
      name: payload.user?.name || 'Swiggy Customer',
      phone: payload.user?.mobile || '',
      email: payload.user?.email || ''
    },
    delivery_address: {
      street: payload.deliveryAddress?.completeAddress || '',
      city: payload.deliveryAddress?.city || '',
      postal_code: payload.deliveryAddress?.pincode || '',
      coordinates:
        payload.deliveryAddress?.lat && payload.deliveryAddress?.lng
          ? {
              lat: payload.deliveryAddress.lat,
              lng: payload.deliveryAddress.lng
            }
          : undefined,
      instructions: payload.deliveryInstructions || ''
    },
    items:
      payload.orderItems?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        modifications: item.addons?.map((addon: any) => addon.name) || [],
        special_instructions: item.cookingInstructions || ''
      })) || [],
    totals: {
      subtotal: payload.itemTotal || 0,
      delivery_fee: payload.deliveryCharge || 0,
      platform_fee: payload.platformFee || 0,
      tax: payload.taxes || 0,
      total: payload.grandTotal || 0
    },
    delivery_info: {
      estimated_delivery_time: payload.estimatedDeliveryTime,
      delivery_instructions: payload.deliveryInstructions || '',
      contact_free: payload.contactlessDelivery || false
    },
    payment: {
      method: payload.paymentMode || 'online',
      status: payload.paymentStatus === 'SUCCESS' ? 'paid' : 'pending'
    },
    created_at: payload.orderTime || new Date().toISOString(),
    status: mapSwiggyStatus(payload.orderStatus)
  }),

  ubereats: (payload: any): DeliveryPlatformOrder => ({
    platform_order_id: payload.id,
    platform_name: 'ubereats',
    customer: {
      name: payload.eater?.first_name + ' ' + payload.eater?.last_name || 'Uber Eats Customer',
      phone: payload.eater?.phone || '',
      email: payload.eater?.email || ''
    },
    delivery_address: {
      street: payload.delivery_address?.street_address_1 || '',
      city: payload.delivery_address?.city || '',
      postal_code: payload.delivery_address?.postal_code || '',
      coordinates:
        payload.delivery_address?.latitude && payload.delivery_address?.longitude
          ? {
              lat: payload.delivery_address.latitude,
              lng: payload.delivery_address.longitude
            }
          : undefined,
      instructions: payload.special_delivery_instructions || ''
    },
    items:
      payload.cart?.items?.map((item: any) => ({
        name: item.title,
        quantity: item.quantity,
        unit_price: item.price / 100, // Uber Eats uses cents
        modifications:
          item.selected_modifier_groups?.flatMap(
            (group: any) => group.selected_items?.map((mod: any) => mod.title) || []
          ) || [],
        special_instructions: item.special_instructions || ''
      })) || [],
    totals: {
      subtotal: payload.cart?.subtotal / 100,
      delivery_fee: payload.cart?.delivery_fee / 100,
      platform_fee: payload.cart?.service_fee / 100,
      tax: payload.cart?.tax / 100,
      total: payload.cart?.total / 100
    },
    delivery_info: {
      estimated_delivery_time: payload.estimated_ready_for_pickup_at,
      delivery_instructions: payload.special_delivery_instructions || '',
      contact_free: payload.no_contact_delivery || false
    },
    payment: {
      method: payload.payment?.method || 'card',
      status: payload.payment?.status === 'PAID' ? 'paid' : 'pending'
    },
    created_at: payload.placed_at || new Date().toISOString(),
    status: mapUberEatsStatus(payload.current_state)
  }),

  // Generic parser for custom integrations
  generic: (payload: any): DeliveryPlatformOrder => payload
}

// Status mapping helpers
function mapSwiggyStatus(status: string): DeliveryPlatformOrder['status'] {
  const statusMap: Record<string, DeliveryPlatformOrder['status']> = {
    PLACED: 'confirmed',
    ACCEPTED: 'confirmed',
    FOOD_PREPARATION: 'preparing',
    READY_FOR_PICKUP: 'ready',
    OUT_FOR_DELIVERY: 'picked_up',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
  }
  return statusMap[status] || 'confirmed'
}

function mapUberEatsStatus(status: string): DeliveryPlatformOrder['status'] {
  const statusMap: Record<string, DeliveryPlatformOrder['status']> = {
    created: 'confirmed',
    accepted: 'confirmed',
    denied: 'cancelled',
    finished: 'preparing',
    ready_for_pickup: 'ready',
    courier_assigned: 'picked_up',
    delivered: 'delivered',
    cancelled: 'cancelled'
  }
  return statusMap[status] || 'confirmed'
}

// Verify webhook signature for security (Steve Jobs: "Privacy is a fundamental human right")
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  platform: string
): boolean {
  if (!secret || !signature) return false

  try {
    let expectedSignature = ''

    switch (platform) {
      case 'deliveroo':
        expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
        return `sha256=${expectedSignature}` === signature

      case 'swiggy':
        expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
        return expectedSignature === signature

      case 'ubereats':
        expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex')
        return `sha256=${expectedSignature}` === signature

      default:
        return true // Allow generic webhooks for development
    }
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error)
    return false
  }
}

// POST /api/v1/delivery-platforms/[platformId]/webhook - Universal webhook receiver
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ platformId: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin()

  const params = await context.params
  try {
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const platformId = params.platformId

    console.log(`🚀 Webhook: Receiving order from platform ${platformId}`)

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
      console.log('⚠️ Platform is inactive, ignoring webhook')
      return NextResponse.json({ success: true, message: 'Platform inactive' })
    }

    // Get request body and headers
    const body = await request.text()
    const signature =
      request.headers.get('x-signature') ||
      request.headers.get('x-swiggy-signature') ||
      request.headers.get('x-uber-signature') ||
      ''

    // Verify webhook signature
    if (platformProps.secret_key) {
      const isValid = verifyWebhookSignature(
        body,
        signature,
        platformProps.secret_key,
        platformProps.platform_type
      )
      if (!isValid && process.env.NODE_ENV === 'production') {
        console.error('❌ Invalid webhook signature')
        return NextResponse.json({ success: false, message: 'Invalid signature' }, { status: 401 })
      }
    }

    // Parse webhook payload
    let webhookData
    try {
      webhookData = JSON.parse(body)
    } catch (error) {
      console.error('❌ Invalid JSON payload:', error)
      return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 })
    }

    // Handle different webhook events
    const eventType = webhookData.event_type || webhookData.type || 'order_placed'

    if (!['order_placed', 'order_confirmed', 'order_updated'].includes(eventType)) {
      console.log(`ℹ️ Ignoring webhook event: ${eventType}`)
      return NextResponse.json({ success: true, message: 'Event ignored' })
    }

    // Parse order using platform-specific parser
    const parser =
      platformParsers[platformProps.platform_type as keyof typeof platformParsers] ||
      platformParsers.generic
    const parsedOrder = parser(eventType === 'order_updated' ? webhookData.order : webhookData)

    // Check if order already exists
    const { data: existingOrder } = await supabaseAdmin
      .from('universal_transactions')
      .select('id, status')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'order')
      .eq('metadata->>platform_order_id', parsedOrder.platform_order_id)
      .single()

    if (existingOrder && eventType !== 'order_updated') {
      console.log(`ℹ️ Order ${parsedOrder.platform_order_id} already exists`)
      return NextResponse.json({
        success: true,
        message: 'Order already exists',
        order_id: existingOrder.id
      })
    }

    // Convert platform order to HERA universal transaction
    const orderData = {
      organization_id: organizationId,
      transaction_type: 'order',
      transaction_code: `${platformProps.platform_type.toUpperCase()}-${parsedOrder.platform_order_id}`,
      transaction_date: new Date(parsedOrder.created_at).toISOString().split('T')[0],
      total_amount: parsedOrder.totals.total,
      tax_amount: parsedOrder.totals.tax,
      status: mapPlatformStatusToHERA(parsedOrder.status),
      description: `Order from ${parsedOrder.platform_name}`,
      metadata: {
        // Platform Information
        delivery_platform_id: platformId,
        platform_name: parsedOrder.platform_name,
        platform_order_id: parsedOrder.platform_order_id,

        // Fulfillment Type
        fulfillment_type: 'delivery',

        // Customer Information
        customer_name: parsedOrder.customer.name,
        customer_phone: parsedOrder.customer.phone,
        customer_email: parsedOrder.customer.email,

        // Delivery Information
        delivery_address: JSON.stringify(parsedOrder.delivery_address),
        delivery_instructions: parsedOrder.delivery_info.delivery_instructions,
        estimated_delivery_time: parsedOrder.delivery_info.estimated_delivery_time,
        contact_free_delivery: parsedOrder.delivery_info.contact_free,

        // Financial Information
        subtotal: parsedOrder.totals.subtotal,
        delivery_fee: parsedOrder.totals.delivery_fee,
        platform_fee: parsedOrder.totals.platform_fee,
        platform_commission: parsedOrder.totals.total * (platformProps.commission_rate || 0.15),

        // Payment Information
        payment_method: parsedOrder.payment.method,
        payment_status: parsedOrder.payment.status,
        payment_transaction_id: parsedOrder.payment.transaction_id,

        // Platform-specific data
        platform_data: JSON.stringify(webhookData)
      }
    }

    let orderId: string
    if (existingOrder) {
      // Update existing order
      const { error: updateError } = await supabaseAdmin
        .from('universal_transactions')
        .update({
          status: orderData.status,
          metadata: orderData.metadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOrder.id)

      if (updateError) {
        console.error('❌ Error updating order:', updateError)
        return NextResponse.json(
          { success: false, message: 'Failed to update order' },
          { status: 500 }
        )
      }

      orderId = existingOrder.id
      console.log(`✅ Order updated: ${parsedOrder.platform_order_id}`)
    } else {
      // Create new order
      const { data: newOrder, error: orderError } = await supabaseAdmin
        .from('universal_transactions')
        .insert(orderData)
        .select('id')
        .single()

      if (orderError) {
        console.error('❌ Error creating order:', orderError)
        return NextResponse.json(
          { success: false, message: 'Failed to create order' },
          { status: 500 }
        )
      }

      orderId = newOrder.id

      // Create order line items
      const lineItems = parsedOrder.items.map((item, index) => ({
        organization_id: organizationId,
        transaction_id: orderId,
        line_order: index + 1,
        line_description: item.name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_amount: item.quantity * item.unit_price,
        metadata: {
          modifications: item.modifications || [],
          special_instructions: item.special_instructions || '',
          platform_item_data: JSON.stringify(item)
        }
      }))

      if (lineItems.length > 0) {
        const { error: linesError } = await supabaseAdmin
          .from('universal_transaction_lines')
          .insert(lineItems)

        if (linesError) {
          console.error('❌ Error creating line items:', linesError)
        }
      }

      console.log(`✅ Order created: ${parsedOrder.platform_order_id} -> ${orderId}`)
    }

    // Auto-accept order if configured
    if (platformProps.auto_accept_orders && orderData.status === 'pending') {
      await supabaseAdmin
        .from('universal_transactions')
        .update({ status: 'processing' })
        .eq('id', orderId)
    }

    // Update platform sync status
    await supabaseAdmin.from('core_dynamic_data').upsert(
      {
        organization_id: organizationId,
        entity_id: platformId,
        field_name: 'last_sync_at',
        field_value: new Date().toISOString(),
        field_type: 'text'
      },
      {
        onConflict: 'organization_id,entity_id,field_name'
      }
    )

    const response = {
      success: true,
      message: existingOrder ? 'Order updated successfully' : 'Order received successfully',
      order_id: orderId,
      platform_order_id: parsedOrder.platform_order_id,
      status: orderData.status,
      total_amount: parsedOrder.totals.total
    }

    return NextResponse.json(response, { status: existingOrder ? 200 : 201 })
  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to map platform status to HERA status
function mapPlatformStatusToHERA(platformStatus: DeliveryPlatformOrder['status']): string {
  const statusMap: Record<DeliveryPlatformOrder['status'], string> = {
    confirmed: 'pending',
    preparing: 'processing',
    ready: 'approved',
    picked_up: 'processing',
    delivered: 'completed',
    cancelled: 'cancelled'
  }
  return statusMap[platformStatus] || 'pending'
}

// GET - Webhook verification for platforms that require it
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ platformId: string }> }
) {
  const supabaseAdmin = getSupabaseAdmin()

  const params = await context.params
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('hub.challenge')
  const verify_token = searchParams.get('hub.verify_token')

  // Return challenge for webhook verification
  if (challenge && verify_token) {
    console.log(`✅ Webhook verification for platform ${params.platformId}`)
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  }

  return NextResponse.json({ success: true, message: 'Webhook endpoint active' })
}
