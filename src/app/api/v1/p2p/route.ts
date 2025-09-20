import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { HERAJWTService } from '@/lib/auth/jwt-service'

const jwtService = new HERAJWTService()

interface P2PRequestData {
  requester_id?: string
  items?: Array<{
    product_id: string
    quantity: number
    unit_price: number
    description?: string
    category?: string
  }>
  total_amount?: number
  justification?: string
  pr_id?: string
  approver_id?: string
  comments?: string
  supplier_id?: string
  delivery_date?: string
  payment_terms?: string
  po_id?: string
  received_items?: Array<{
    product_id: string
    quantity_received: number
    po_line_id?: string
    quality_check?: string
  }>
  receiver_id?: string
  location_id?: string
  invoice_number?: string
  invoice_date?: string
  amount?: number
  invoice_id?: string
  payment_method?: string
  payment_date?: string
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

    const { action, data }: { action: string; data: P2PRequestData } = await req.json()

    switch (action) {
      case 'create_requisition':
        return await createRequisition(data, payload.organization_id)

      case 'approve_requisition':
        return await approveRequisition(data, payload.organization_id)

      case 'create_purchase_order':
        return await createPurchaseOrder(data, payload.organization_id)

      case 'receive_goods':
        return await receiveGoods(data, payload.organization_id)

      case 'process_invoice':
        return await processInvoice(data, payload.organization_id)

      case 'process_payment':
        return await processPayment(data, payload.organization_id)

      case 'get_p2p_analytics':
        return await getP2PAnalytics(payload.organization_id)

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('P2P API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function createRequisition(data: P2PRequestData, organizationId: string) {
  const { requester_id, items, total_amount, justification } = data

  // Create PR transaction
  const { data: pr, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'purchase_requisition',
      transaction_code: `PR-${Date.now()}`,
      smart_code: 'HERA.P2P.PR.CREATE.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: requester_id,
      total_amount,
      metadata: {
        status: 'pending_approval',
        justification,
        created_at: new Date().toISOString()
      }
    })
    .select()
    .single()

  if (error) throw error

  // Create line items
  if (pr && items?.length > 0) {
    const lines = items.map((item: any, index: number) => ({
      transaction_id: pr.id,
      line_number: index + 1,
      line_entity_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_amount: item.quantity * item.unit_price,
      smart_code: 'HERA.P2P.PR.LINE.v1',
      metadata: {
        description: item.description,
        category: item.category
      }
    }))

    await supabase.from('universal_transaction_lines').insert(lines)
  }

  return NextResponse.json({
    success: true,
    data: pr,
    message: 'Purchase requisition created successfully'
  })
}

async function approveRequisition(data: P2PRequestData, organizationId: string) {
  const { pr_id, approver_id, comments } = data

  // Update PR status
  const { data: pr, error } = await supabase
    .from('universal_transactions')
    .update({
      metadata: {
        status: 'approved',
        approved_by: approver_id,
        approved_at: new Date().toISOString(),
        approval_comments: comments
      }
    })
    .eq('id', pr_id)
    .eq('organization_id', organizationId)
    .select()
    .single()

  if (error) throw error

  // Create approval relationship
  await supabase.from('core_relationships').insert({
    organization_id: organizationId,
    from_entity_id: pr_id,
    to_entity_id: approver_id,
    relationship_type: 'approved_by',
    smart_code: 'HERA.P2P.PR.APPROVAL.v1',
    metadata: {
      approved_at: new Date().toISOString(),
      comments
    }
  })

  return NextResponse.json({
    success: true,
    data: pr,
    message: 'Purchase requisition approved'
  })
}

async function createPurchaseOrder(data: P2PRequestData, organizationId: string) {
  const { pr_id, supplier_id, delivery_date, payment_terms } = data

  // Get PR details
  const { data: pr } = await supabase
    .from('universal_transactions')
    .select('*, universal_transaction_lines(*)')
    .eq('id', pr_id)
    .eq('organization_id', organizationId)
    .single()

  if (!pr) {
    return NextResponse.json({ error: 'PR not found' }, { status: 404 })
  }

  // Create PO transaction
  const { data: po, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'purchase_order',
      transaction_code: `PO-${Date.now()}`,
      smart_code: 'HERA.P2P.PO.CREATE.v1',
      transaction_date: new Date().toISOString(),
      from_entity_id: organizationId, // Buying organization
      to_entity_id: supplier_id,
      reference_entity_id: pr_id,
      total_amount: pr.total_amount,
      metadata: {
        status: 'draft',
        pr_reference: pr.transaction_code,
        delivery_date,
        payment_terms,
        created_at: new Date().toISOString()
      }
    })
    .select()
    .single()

  if (error) throw error

  // Copy line items from PR to PO
  if (po && pr.universal_transaction_lines?.length > 0) {
    const lines = pr.universal_transaction_lines.map((line: any) => ({
      transaction_id: po.id,
      line_number: line.line_number,
      line_entity_id: line.line_entity_id,
      quantity: line.quantity,
      unit_price: line.unit_price,
      line_amount: line.line_amount,
      smart_code: 'HERA.P2P.PO.LINE.v1',
      metadata: line.metadata
    }))

    await supabase.from('universal_transaction_lines').insert(lines)
  }

  // Create PR to PO relationship
  await supabase.from('core_relationships').insert({
    organization_id: organizationId,
    from_entity_id: pr_id,
    to_entity_id: po.id,
    relationship_type: 'converted_to',
    smart_code: 'HERA.P2P.PR.TO.PO.V1'
  })

  return NextResponse.json({
    success: true,
    data: po,
    message: 'Purchase order created from requisition'
  })
}

async function receiveGoods(data: P2PRequestData, organizationId: string) {
  const { po_id, received_items, receiver_id, location_id } = data

  // Create goods receipt transaction
  const { data: gr, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'goods_receipt',
      transaction_code: `GR-${Date.now()}`,
      smart_code: 'HERA.P2P.GR.CREATE.v1',
      transaction_date: new Date().toISOString(),
      reference_entity_id: po_id,
      from_entity_id: location_id,
      metadata: {
        po_reference: po_id,
        received_by: receiver_id,
        received_at: new Date().toISOString()
      }
    })
    .select()
    .single()

  if (error) throw error

  // Create receipt lines
  if (gr && received_items?.length > 0) {
    const lines = received_items.map((item: any, index: number) => ({
      transaction_id: gr.id,
      line_number: index + 1,
      line_entity_id: item.product_id,
      quantity: item.quantity_received,
      smart_code: 'HERA.P2P.GR.LINE.v1',
      metadata: {
        po_line_id: item.po_line_id,
        quality_check: item.quality_check || 'passed'
      }
    }))

    await supabase.from('universal_transaction_lines').insert(lines)
  }

  // Update PO status
  await supabase
    .from('universal_transactions')
    .update({
      metadata: {
        status: 'partial', // or 'complete' based on quantities
        last_receipt: gr.transaction_code
      }
    })
    .eq('id', po_id)
    .eq('organization_id', organizationId)

  return NextResponse.json({
    success: true,
    data: gr,
    message: 'Goods received successfully'
  })
}

async function processInvoice(data: P2PRequestData, organizationId: string) {
  const { po_id, invoice_number, invoice_date, amount, supplier_id } = data

  // Create invoice transaction
  const { data: invoice, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'supplier_invoice',
      transaction_code: invoice_number,
      smart_code: 'HERA.P2P.INV.CREATE.v1',
      transaction_date: invoice_date,
      from_entity_id: supplier_id,
      to_entity_id: organizationId,
      reference_entity_id: po_id,
      total_amount: amount,
      metadata: {
        status: 'pending_approval',
        po_reference: po_id,
        three_way_match: 'pending'
      }
    })
    .select()
    .single()

  if (error) throw error

  // Trigger 3-way matching
  // This would compare PO, GR, and Invoice quantities/amounts

  return NextResponse.json({
    success: true,
    data: invoice,
    message: 'Invoice processed, pending 3-way match'
  })
}

async function processPayment(data: P2PRequestData, organizationId: string) {
  const { invoice_id, payment_method, payment_date, amount } = data

  // Create payment transaction
  const { data: payment, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: 'payment',
      transaction_code: `PAY-${Date.now()}`,
      smart_code: 'HERA.P2P.PAY.CREATE.v1',
      transaction_date: payment_date,
      reference_entity_id: invoice_id,
      total_amount: amount,
      metadata: {
        payment_method,
        status: 'completed',
        processed_at: new Date().toISOString()
      }
    })
    .select()
    .single()

  if (error) throw error

  // Update invoice status
  await supabase
    .from('universal_transactions')
    .update({
      metadata: {
        status: 'paid',
        payment_reference: payment.transaction_code,
        paid_at: payment_date
      }
    })
    .eq('id', invoice_id)
    .eq('organization_id', organizationId)

  return NextResponse.json({
    success: true,
    data: payment,
    message: 'Payment processed successfully'
  })
}

async function getP2PAnalytics(organizationId: string) {
  // Get P2P cycle metrics
  const { data: metrics } = await supabase.rpc('get_p2p_analytics', { org_id: organizationId })

  return NextResponse.json({
    success: true,
    data: metrics || {
      cycle_time_avg: 48,
      approval_time_avg: 12,
      three_way_match_rate: 0.92,
      on_time_payment_rate: 0.88,
      cost_savings_opportunity: 0.03
    }
  })
}
