import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { HERAJWTService } from '@/src/lib/auth/jwt-service'

const jwtService = new HERAJWTService()

interface O2CRequestData {
  action: string
  order_id?: string
  invoice_id?: string
  customer_id?: string
  data?: any
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    // Verify JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { valid, payload } = await jwtService.validateToken(token)
    if (!valid || !payload?.organization_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { action, order_id, invoice_id, customer_id, data }: O2CRequestData = await req.json()

    switch (action) {
      // Order Management
      case 'create_order':
        return await createOrder(data, payload.organization_id)

      case 'approve_order':
        return await approveOrder(order_id!, payload.organization_id)

      case 'fulfill_order':
        return await fulfillOrder(order_id!, data, payload.organization_id)

      case 'ship_order':
        return await shipOrder(order_id!, data, payload.organization_id)

      // Invoicing
      case 'create_invoice':
        return await createInvoice(data, payload.organization_id)

      case 'send_invoice':
        return await sendInvoice(invoice_id!, data, payload.organization_id)

      case 'cancel_invoice':
        return await cancelInvoice(invoice_id!, data, payload.organization_id)

      // Payments
      case 'record_payment':
        return await recordPayment(data, payload.organization_id)

      case 'refund_payment':
        return await refundPayment(data, payload.organization_id)

      // Credit Management
      case 'check_credit':
        return await checkCredit(customer_id!, data, payload.organization_id)

      case 'update_credit_limit':
        return await updateCreditLimit(customer_id!, data, payload.organization_id)

      // Collections
      case 'run_dunning':
        return await runDunningProcess(payload.organization_id)

      case 'send_collection_notice':
        return await sendCollectionNotice(data, payload.organization_id)

      // Analytics & AI
      case 'get_revenue_analytics':
        return await getRevenueAnalytics(data, payload.organization_id)

      case 'predict_cash_flow':
        return await predictCashFlow(data, payload.organization_id)

      case 'optimize_pricing':
        return await optimizePricing(data, payload.organization_id)

      case 'detect_anomalies':
        return await detectAnomalies(payload.organization_id)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('O2C API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Order Management Functions
async function createOrder(data: any, organizationId: string) {
  const { customer_id, items, delivery_date, payment_terms = 'NET30', sales_rep_id, notes } = data

  // Generate order number
  const orderNumber = `SO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`

  // Calculate total
  const totalAmount = items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.unit_price,
    0
  )

  // Create order transaction
  const { data: order, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'sales_order',
      transaction_code: orderNumber,
      smart_code: 'HERA.O2C.ORDER.CREATE.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: customer_id,
      total_amount: totalAmount,
      metadata: {
        delivery_date:
          delivery_date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        payment_terms,
        sales_rep_id,
        notes,
        status: 'draft',
        items: items
      }
    })
    .select()
    .single()

  if (error) throw error

  // Create line items
  for (let i = 0; i < items.length; i++) {
    await supabase.from('universal_transaction_lines').insert({
      transaction_id: order.id,
      line_number: i + 1,
      line_entity_id: items[i].product_id,
      quantity: items[i].quantity,
      unit_price: items[i].unit_price,
      line_amount: items[i].quantity * items[i].unit_price,
      metadata: {
        product_name: items[i].product_name,
        discount: items[i].discount || 0
      }
    })
  }

  // The trigger will handle credit check automatically

  return NextResponse.json({
    success: true,
    data: order,
    message: 'Order created successfully'
  })
}

async function approveOrder(orderId: string, organizationId: string) {
  // Update order status
  const { data, error } = await supabase
    .from('universal_transactions')
    .update({
      metadata: supabase.sql`metadata || jsonb_build_object('status', 'approved', 'approved_date', '${new Date().toISOString()}', 'approved_by', 'API')`
    })
    .eq('id', orderId)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({
    success: true,
    data,
    message: 'Order approved successfully'
  })
}

async function fulfillOrder(orderId: string, data: any, organizationId: string) {
  const { pick_location, picker_id } = data

  // Create picking transaction
  const { data: picking, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'order_picking',
      transaction_code: `PICK-${orderId.slice(-8)}`,
      smart_code: 'HERA.O2C.FULFILL.PICK.v1',
      transaction_date: new Date().toISOString(),
      reference_entity_id: orderId,
      metadata: {
        picker: picker_id,
        pick_date: new Date().toISOString(),
        location: pick_location,
        status: 'completed'
      }
    })
    .select()
    .single()

  if (error) throw error

  // Update order fulfillment status
  await supabase
    .from('universal_transactions')
    .update({
      metadata: supabase.sql`metadata || jsonb_build_object('fulfillment_status', 'picked')`
    })
    .eq('id', orderId)

  return NextResponse.json({
    success: true,
    data: picking,
    message: 'Order fulfillment started'
  })
}

async function shipOrder(orderId: string, data: any, organizationId: string) {
  const { carrier, tracking_number, ship_date } = data

  // Get order details
  const { data: order } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', orderId)
    .eq('organization_id', organizationId)
    .single()

  if (!order) throw new Error('Order not found')

  // Create shipment transaction
  const { data: shipment, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'order_shipment',
      transaction_code: `SHIP-${order.transaction_code}`,
      smart_code: 'HERA.O2C.FULFILL.SHIP.v1',
      transaction_date: ship_date || new Date().toISOString(),
      reference_entity_id: orderId,
      from_entity_id: order.from_entity_id,
      metadata: {
        carrier,
        tracking_number,
        ship_date: ship_date || new Date().toISOString(),
        estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'in_transit'
      }
    })
    .select()
    .single()

  if (error) throw error

  // Update order status
  await supabase
    .from('universal_transactions')
    .update({
      metadata: supabase.sql`metadata || jsonb_build_object('fulfillment_status', 'shipped', 'tracking_number', '${tracking_number}')`
    })
    .eq('id', orderId)

  return NextResponse.json({
    success: true,
    data: shipment,
    message: 'Order shipped successfully'
  })
}

// Invoicing Functions
async function createInvoice(data: any, organizationId: string) {
  const { customer_id, order_id, line_items, due_date, terms } = data

  // Generate invoice number
  const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`

  // Calculate total
  const totalAmount = line_items.reduce((sum: number, item: any) => sum + item.amount, 0)

  // Create invoice
  const { data: invoice, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'customer_invoice',
      transaction_code: invoiceNumber,
      smart_code: 'HERA.O2C.INVOICE.CREATE.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: customer_id,
      reference_entity_id: order_id,
      total_amount: totalAmount,
      metadata: {
        invoice_number: invoiceNumber,
        invoice_date: new Date().toISOString(),
        due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        terms: terms || 'NET30',
        status: 'pending'
      }
    })
    .select()
    .single()

  if (error) throw error

  // Create line items
  for (let i = 0; i < line_items.length; i++) {
    await supabase.from('universal_transaction_lines').insert({
      transaction_id: invoice.id,
      line_number: i + 1,
      line_amount: line_items[i].amount,
      metadata: {
        description: line_items[i].description,
        quantity: line_items[i].quantity,
        unit_price: line_items[i].unit_price
      }
    })
  }

  return NextResponse.json({
    success: true,
    data: invoice,
    message: 'Invoice created successfully'
  })
}

async function sendInvoice(invoiceId: string, data: any, organizationId: string) {
  const { send_method = 'email', recipient_email } = data

  // Update invoice with sent information
  const { data: invoice, error } = await supabase
    .from('universal_transactions')
    .update({
      metadata: supabase.sql`metadata || jsonb_build_object(
        'sent_date', '${new Date().toISOString()}',
        'send_method', '${send_method}',
        'recipient_email', '${recipient_email || ''}'
      )`
    })
    .eq('id', invoiceId)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) throw error

  // Create send record
  await supabase.from('universal_transactions').insert({
    organization_id: organizationId,
    transaction_type: 'invoice_transmission',
    transaction_code: `SEND-${invoice.transaction_code}`,
    smart_code: 'HERA.O2C.INVOICE.SEND.v1',
    transaction_date: new Date().toISOString(),
    reference_entity_id: invoiceId,
    metadata: {
      send_method,
      recipient: recipient_email,
      status: 'sent'
    }
  })

  return NextResponse.json({
    success: true,
    data: invoice,
    message: `Invoice sent via ${send_method}`
  })
}

async function cancelInvoice(invoiceId: string, data: any, organizationId: string) {
  const { reason, credit_memo = true } = data

  // Update invoice status
  const { data: invoice, error } = await supabase
    .from('universal_transactions')
    .update({
      metadata: supabase.sql`metadata || jsonb_build_object(
        'status', 'cancelled',
        'cancelled_date', '${new Date().toISOString()}',
        'cancellation_reason', '${reason}'
      )`
    })
    .eq('id', invoiceId)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) throw error

  // Create credit memo if requested
  if (credit_memo) {
    const creditMemoNumber = `CM-${invoice.transaction_code.slice(4)}`

    await supabase.from('universal_transactions').insert({
      organization_id: organizationId,
      transaction_type: 'credit_memo',
      transaction_code: creditMemoNumber,
      smart_code: 'HERA.O2C.INVOICE.CANCEL.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: invoice.from_entity_id,
      reference_entity_id: invoiceId,
      total_amount: -invoice.total_amount, // Negative amount
      metadata: {
        original_invoice: invoice.transaction_code,
        reason,
        status: 'issued'
      }
    })
  }

  return NextResponse.json({
    success: true,
    data: invoice,
    message: 'Invoice cancelled successfully'
  })
}

// Payment Functions
async function recordPayment(data: any, organizationId: string) {
  const { customer_id, amount, payment_method, reference, invoice_id } = data

  // Generate payment code
  const paymentCode = `PAY-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-6)}`

  // Create payment transaction
  const { data: payment, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'customer_payment',
      transaction_code: paymentCode,
      smart_code: 'HERA.O2C.PAYMENT.RECEIVE.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: customer_id,
      reference_entity_id: invoice_id,
      total_amount: amount,
      metadata: {
        payment_method,
        reference,
        payment_date: new Date().toISOString(),
        status: 'completed'
      }
    })
    .select()
    .single()

  if (error) throw error

  // The trigger will handle automatic payment application

  return NextResponse.json({
    success: true,
    data: payment,
    message: 'Payment recorded successfully'
  })
}

async function refundPayment(data: any, organizationId: string) {
  const { payment_id, amount, reason, refund_method } = data

  // Get original payment
  const { data: originalPayment } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', payment_id)
    .eq('organization_id', organizationId)
    .single()

  if (!originalPayment) throw new Error('Payment not found')

  // Create refund transaction
  const refundCode = `REF-${originalPayment.transaction_code.slice(4)}`

  const { data: refund, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'customer_refund',
      transaction_code: refundCode,
      smart_code: 'HERA.O2C.PAYMENT.REFUND.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: originalPayment.from_entity_id,
      reference_entity_id: payment_id,
      total_amount: -amount, // Negative amount
      metadata: {
        original_payment: originalPayment.transaction_code,
        refund_reason: reason,
        refund_method: refund_method || (originalPayment.metadata as any)?.payment_method,
        refund_date: new Date().toISOString(),
        status: 'processed'
      }
    })
    .select()
    .single()

  if (error) throw error

  return NextResponse.json({
    success: true,
    data: refund,
    message: 'Refund processed successfully'
  })
}

// Credit Management Functions
async function checkCredit(customerId: string, data: any, organizationId: string) {
  const { order_amount } = data

  // Get customer credit info
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', customerId)
    .eq('organization_id', organizationId)
    .single()

  if (!customer) throw new Error('Customer not found')

  // Calculate outstanding amount
  const { data: outstandingInvoices } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('from_entity_id', customerId)
    .eq('transaction_type', 'customer_invoice')
    .eq('organization_id', organizationId)
    .neq('metadata->status', 'paid')
    .neq('metadata->status', 'cancelled')

  const outstandingAmount =
    outstandingInvoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0

  const creditLimit = (customer.metadata as any)?.credit_limit || 0
  const availableCredit = Math.max(creditLimit - outstandingAmount, 0)

  // Call edge function for detailed evaluation if needed
  if (order_amount && order_amount > 0) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/o2c-dispatch`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'evaluate_credit',
          data: { customer_id: customerId, order_amount, organization_id: organizationId }
        })
      }
    )

    const result = await response.json()
    return NextResponse.json({
      success: true,
      data: result.data
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      credit_limit: creditLimit,
      outstanding_amount: outstandingAmount,
      available_credit: availableCredit,
      credit_score: (customer.metadata as any)?.credit_score,
      risk_rating: (customer.metadata as any)?.risk_rating,
      credit_status: (customer.metadata as any)?.credit_status || 'active'
    }
  })
}

async function updateCreditLimit(customerId: string, data: any, organizationId: string) {
  const { new_limit, reason, approved_by } = data

  // Get current customer data
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', customerId)
    .eq('organization_id', organizationId)
    .single()

  if (!customer) throw new Error('Customer not found')

  const oldLimit = (customer.metadata as any)?.credit_limit || 0

  // Update credit limit
  const { data: updated, error } = await supabase
    .from('core_entities')
    .update({
      metadata: {
        ...customer.metadata,
        credit_limit: new_limit,
        credit_limit_history: [
          ...((customer.metadata as any)?.credit_limit_history || []),
          {
            date: new Date().toISOString(),
            old_limit: oldLimit,
            new_limit: new_limit,
            reason,
            approved_by
          }
        ]
      }
    })
    .eq('id', customerId)
    .select()
    .single()

  if (error) throw error

  // Create audit record
  await supabase.from('universal_transactions').insert({
    organization_id: organizationId,
    transaction_type: 'credit_limit_change',
    transaction_code: `CREDIT-${customerId.slice(-8)}-${Date.now()}`,
    smart_code: 'HERA.O2C.CREDIT.LIMIT.v1',
    transaction_date: new Date().toISOString(),
    from_entity_id: customerId,
    metadata: {
      old_limit: oldLimit,
      new_limit: new_limit,
      change_amount: new_limit - oldLimit,
      reason,
      approved_by
    }
  })

  return NextResponse.json({
    success: true,
    data: updated,
    message: 'Credit limit updated successfully'
  })
}

// Collection Functions
async function runDunningProcess(organizationId: string) {
  // Execute the dunning function from triggers
  const { data, error } = await supabase.rpc('o2c_auto_dunning', {})

  if (error) throw error

  return NextResponse.json({
    success: true,
    message: 'Dunning process completed',
    data: { processed: true }
  })
}

async function sendCollectionNotice(data: any, organizationId: string) {
  const { customer_id, invoice_ids, notice_type } = data

  // Create collection notice
  const noticeCode = `NOTICE-${Date.now()}`

  const { data: notice, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'dunning_notice',
      transaction_code: noticeCode,
      smart_code: 'HERA.O2C.COLLECTION.DUNNING.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: customer_id,
      metadata: {
        notice_type,
        invoice_ids,
        sent_date: new Date().toISOString(),
        template: notice_type
      }
    })
    .select()
    .single()

  if (error) throw error

  // Update invoices with dunning info
  for (const invoiceId of invoice_ids) {
    await supabase
      .from('universal_transactions')
      .update({
        metadata: supabase.sql`metadata || jsonb_build_object(
          'last_dunning_date', '${new Date().toISOString()}',
          'dunning_level', COALESCE((metadata->>'dunning_level')::int, 0) + 1
        )`
      })
      .eq('id', invoiceId)
      .eq('organization_id', organizationId)
  }

  return NextResponse.json({
    success: true,
    data: notice,
    message: 'Collection notice sent'
  })
}

// Analytics Functions
async function getRevenueAnalytics(data: any, organizationId: string) {
  const { period = 'MTD', start_date, end_date } = data

  // Call edge function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/o2c-dispatch`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'analyze_revenue',
        data: { organization_id: organizationId, period, start_date, end_date }
      })
    }
  )

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to get analytics')
  }

  return NextResponse.json({
    success: true,
    data: result.data
  })
}

async function predictCashFlow(data: any, organizationId: string) {
  const { days = 90 } = data

  // Call edge function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/o2c-dispatch`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'forecast_cash_flow',
        data: { organization_id: organizationId, days }
      })
    }
  )

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to predict cash flow')
  }

  return NextResponse.json({
    success: true,
    data: result.data
  })
}

async function optimizePricing(data: any, organizationId: string) {
  const { customer_id, items } = data

  // Call edge function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/o2c-dispatch`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'calculate_pricing',
        data: { customer_id, items, organization_id: organizationId }
      })
    }
  )

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to optimize pricing')
  }

  return NextResponse.json({
    success: true,
    data: result.data
  })
}

async function detectAnomalies(organizationId: string) {
  // Call edge function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/o2c-dispatch`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'detect_anomalies',
        data: { organization_id: organizationId }
      })
    }
  )

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.error || 'Failed to detect anomalies')
  }

  return NextResponse.json({
    success: true,
    data: result.data
  })
}

// GET endpoint for retrieving O2C data
export async function GET(req: NextRequest) {
  try {
    // Verify JWT
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const { valid, payload } = await jwtService.validateToken(token)
    if (!valid || !payload?.organization_id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const customer_id = searchParams.get('customer_id')
    const days = searchParams.get('days')

    let query = supabase
      .from('universal_transactions')
      .select(
        `
        *,
        customer:core_entities!from_entity_id(*),
        lines:universal_transaction_lines(*)
      `
      )
      .eq('organization_id', payload.organization_id)

    // Filter by type
    if (type) {
      query = query.eq('transaction_type', type)
    } else {
      // Default to O2C transaction types
      query = query.in('transaction_type', [
        'sales_order',
        'customer_invoice',
        'customer_payment',
        'customer_refund',
        'credit_memo'
      ])
    }

    // Filter by status
    if (status) {
      query = query.eq('metadata->status', status)
    }

    // Filter by customer
    if (customer_id) {
      query = query.eq('from_entity_id', customer_id)
    }

    // Filter by date range
    if (days) {
      const daysAgo = new Date()
      daysAgo.setDate(daysAgo.getDate() - parseInt(days))
      query = query.gte('transaction_date', daysAgo.toISOString())
    }

    // Order by date descending
    query = query.order('transaction_date', { ascending: false })
    query = query.limit(100)

    const { data, error } = await query

    if (error) throw error

    // Calculate summary metrics
    const summary = {
      total_orders: data?.filter(t => t.transaction_type === 'sales_order').length || 0,
      total_invoices: data?.filter(t => t.transaction_type === 'customer_invoice').length || 0,
      total_payments: data?.filter(t => t.transaction_type === 'customer_payment').length || 0,
      order_value:
        data
          ?.filter(t => t.transaction_type === 'sales_order')
          .reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0,
      invoice_value:
        data
          ?.filter(t => t.transaction_type === 'customer_invoice')
          .reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0,
      payment_value:
        data
          ?.filter(t => t.transaction_type === 'customer_payment')
          .reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
    }

    return NextResponse.json({
      success: true,
      data,
      summary
    })
  } catch (error) {
    console.error('O2C GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
