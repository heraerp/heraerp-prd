import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// Steve Jobs Principle: "Simplicity is the ultimate sophistication"
// Universal purchase order system that elegantly handles any type of procurement

// GET /api/v1/procurement/purchase-orders - List purchase orders with intelligent filtering
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const { searchParams } = new URL(request.url)
    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    
    // Steve Jobs: "Focus and simplicity" - smart defaults with powerful options
    const status = searchParams.get('status') || 'all'
    const supplier_id = searchParams.get('supplier_id') || null
    const include_lines = searchParams.get('include_lines') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    console.log('📋 Procurement: Loading purchase orders with intelligent filtering')

    // Universal architecture - POs are transactions with relationships to suppliers
    let query = supabaseAdmin
      .from('universal_transactions')
      .select(`
        *,
        ${include_lines ? `
        lines:universal_transaction_lines(
          id,
          line_order,
          entity_id,
          quantity,
          unit_price,
          line_amount,
          line_description,
          metadata
        ),
        ` : ''}
        supplier:core_entities!universal_transactions_source_entity_id_fkey(
          id,
          entity_name,
          entity_code
        )
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'purchase_order')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Add intelligent filtering
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (supplier_id) {
      // Filter by supplier through source_entity_id
      query = query.eq('source_entity_id', supplier_id)
    }

    const { data: purchaseOrders, error } = await query

    if (error) {
      console.error('❌ Error fetching purchase orders:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch purchase orders' },
        { status: 500 }
      )
    }

    // Transform to user-friendly format (Steve Jobs: "It just works")
    const transformedPOs = purchaseOrders.map((po: any) => {
      // Calculate totals from lines if included
      let totalAmount = po.total_amount || 0
      let totalItems = 0
      
      if (include_lines && po.lines) {
        totalAmount = po.lines.reduce((sum: number, line: any) => sum + (line.line_amount || 0), 0)
        totalItems = po.lines.reduce((sum: number, line: any) => sum + (line.quantity || 0), 0)
      }

      return {
        id: po.id,
        po_number: po.transaction_number,
        status: po.status,
        total_amount: totalAmount,
        created_at: po.created_at,
        updated_at: po.updated_at,
        expected_delivery: po.metadata?.expected_delivery || null,
        notes: po.description || '',
        
        // Supplier information
        supplier: po.supplier ? {
          id: po.supplier.id,
          name: po.supplier.entity_name,
          code: po.supplier.entity_code
        } : null,
        
        // Line items (if requested)
        ...(include_lines && {
          lines: po.lines?.map((line: any) => ({
            id: line.id,
            line_order: line.line_order,
            product_id: line.entity_id,
            quantity: line.quantity,
            unit_price: line.unit_price,
            line_amount: line.line_amount,
            product_name: line.metadata?.product_name || line.line_description || 'Unknown Product',
            product_code: line.metadata?.product_code || '',
            unit_of_measure: line.metadata?.unit_of_measure || 'each'
          })) || [],
          
          total_items: totalItems
        })
      }
    })

    // Steve Jobs: "Details are not details. They make the design."
    const response = {
      success: true,
      data: transformedPOs,
      meta: {
        total: transformedPOs.length,
        status_filter: status,
        supplier_filter: supplier_id,
        includes_lines: include_lines
      }
    }

    console.log(`✅ Loaded ${transformedPOs.length} purchase orders successfully`)
    return NextResponse.json(response)

  } catch (error) {
    console.error('❌ Purchase Orders API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/v1/procurement/purchase-orders - Create PO with Jobs-level attention to workflow
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const poData = await request.json()

    console.log('📋 Procurement: Creating new purchase order with universal architecture')

    // Steve Jobs: "Innovation distinguishes between a leader and a follower."
    // Validate required fields with helpful error messages
    if (!poData.supplier_id || !poData.lines || poData.lines.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Purchase order requires supplier and at least one line item',
          required_fields: ['supplier_id', 'lines']
        },
        { status: 400 }
      )
    }

    // Auto-generate PO number if not provided (Steve Jobs: "It just works")
    const poNumber = poData.po_number || 
      'PO-' + new Date().getFullYear() + '-' + 
      String(Date.now()).slice(-6)

    // Calculate total amount from lines
    const totalAmount = poData.lines.reduce((sum: number, line: any) => 
      sum + ((line.quantity || 0) * (line.unit_price || 0)), 0)

    // Create purchase order transaction using universal architecture
    const { data: purchaseOrder, error: poError } = await supabaseAdmin
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'purchase_order',
        transaction_number: poNumber,
        source_entity_id: poData.supplier_id, // Links to supplier entity
        status: poData.status || 'draft',
        total_amount: totalAmount,
        currency: poData.currency || 'USD',
        description: poData.notes || '',
        metadata: {
          expected_delivery: poData.expected_delivery,
          payment_terms: poData.payment_terms || 'NET30',
          delivery_address: poData.delivery_address,
          created_by: 'current_user_id' // TODO: Get from auth context
        }
      })
      .select()
      .single()

    if (poError) {
      console.error('❌ Error creating purchase order:', poError)
      return NextResponse.json(
        { success: false, message: 'Failed to create purchase order' },
        { status: 500 }
      )
    }

    // Supplier relationship is handled by source_entity_id foreign key

    // Create line items with elegant handling
    const lineItems = poData.lines.map((line: any, index: number) => ({
      organization_id: organizationId,
      transaction_id: purchaseOrder.id,
      line_order: index + 1,
      entity_id: line.product_id, // Links to product entity
      line_description: line.product_name || 'Product',
      quantity: line.quantity || 0,
      unit_price: line.unit_price || 0,
      line_amount: (line.quantity || 0) * (line.unit_price || 0),
      unit_of_measure: line.unit_of_measure || 'each',
      metadata: {
        product_name: line.product_name || '',
        product_code: line.product_code || '',
        unit_of_measure: line.unit_of_measure || 'each',
        expected_delivery: line.expected_delivery || poData.expected_delivery,
        notes: line.notes || ''
      }
    }))

    // Insert line items
    const { error: linesError } = await supabaseAdmin
      .from('universal_transaction_lines')
      .insert(lineItems)

    if (linesError) {
      console.error('❌ Error creating PO line items:', linesError)
      return NextResponse.json(
        { success: false, message: 'Failed to create purchase order line items' },
        { status: 500 }
      )
    }

    // Product relationships are handled by entity_id foreign key in transaction lines

    const response = {
      success: true,
      data: {
        id: purchaseOrder.id,
        po_number: purchaseOrder.transaction_number,
        status: purchaseOrder.status,
        total_amount: totalAmount,
        created_at: purchaseOrder.created_at,
        line_count: lineItems.length
      },
      message: `Purchase Order "${purchaseOrder.transaction_number}" created successfully`
    }

    console.log(`✅ Purchase Order created: ${purchaseOrder.transaction_number} ($${totalAmount.toFixed(2)})`)
    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('❌ Create purchase order API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/procurement/purchase-orders - Update PO with seamless workflow
export async function PUT(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const organizationId = '550e8400-e29b-41d4-a716-446655440000' // Demo org UUID
    const updateData = await request.json()

    if (!updateData.id) {
      return NextResponse.json(
        { success: false, message: 'Purchase Order ID is required for updates' },
        { status: 400 }
      )
    }

    console.log(`📋 Procurement: Updating purchase order ${updateData.id}`)

    // Steve Jobs: "Great things in business are never done by one person. They're done by a team."
    // Handle status changes that may require approval workflow
    const allowedStatusTransitions = {
      draft: ['submitted', 'cancelled'],
      submitted: ['approved', 'rejected', 'cancelled'],
      approved: ['processing', 'cancelled'],
      processing: ['completed', 'cancelled'],
      rejected: ['draft'],
      cancelled: [],
      completed: []
    }

    // Get current PO status
    const { data: currentPO, error: fetchError } = await supabaseAdmin
      .from('universal_transactions')
      .select('status')
      .eq('id', updateData.id)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'purchase_order')
      .single()

    if (fetchError) {
      console.error('❌ Error fetching current PO:', fetchError)
      return NextResponse.json(
        { success: false, message: 'Purchase order not found' },
        { status: 404 }
      )
    }

    // Validate status transition
    if (updateData.status && currentPO.status !== updateData.status) {
      const allowedStatuses = allowedStatusTransitions[currentPO.status as keyof typeof allowedStatusTransitions] || []
      if (!allowedStatuses.includes(updateData.status as never)) {
        return NextResponse.json(
          { 
            success: false, 
            message: `Cannot change status from ${currentPO.status} to ${updateData.status}`,
            allowed_statuses: allowedStatuses
          },
          { status: 400 }
        )
      }
    }

    // Update purchase order
    const transactionUpdates: any = {}
    if (updateData.status) transactionUpdates.status = updateData.status
    if (updateData.notes !== undefined) transactionUpdates.description = updateData.notes
    if (updateData.expected_delivery) {
      transactionUpdates.metadata = {
        ...(currentPO as any).metadata,
        expected_delivery: updateData.expected_delivery
      }
    }

    if (Object.keys(transactionUpdates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('universal_transactions')
        .update(transactionUpdates)
        .eq('id', updateData.id)
        .eq('organization_id', organizationId)
        .eq('transaction_type', 'purchase_order')

      if (updateError) {
        console.error('❌ Error updating purchase order:', updateError)
        return NextResponse.json(
          { success: false, message: 'Failed to update purchase order' },
          { status: 500 }
        )
      }
    }

    // Log status change for audit trail
    if (updateData.status && currentPO.status !== updateData.status) {
      console.log(`📋 PO ${updateData.id} status changed: ${currentPO.status} → ${updateData.status}`)
      
      // TODO: Add audit log entry
      // TODO: Send notifications for approved/rejected orders
      // TODO: Trigger automated processes for approved orders
    }

    console.log(`✅ Purchase Order ${updateData.id} updated successfully`)
    return NextResponse.json({
      success: true,
      message: 'Purchase order updated successfully'
    })

  } catch (error) {
    console.error('❌ Update purchase order API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}