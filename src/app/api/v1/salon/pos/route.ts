import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      organizationId, 
      customerId, 
      items, 
      paymentSplits, 
      subtotal, 
      vatAmount, 
      totalAmount,
      discountAmount 
    } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Create sale transaction
    const transactionData = {
      organization_id: organizationId,
      transaction_type: 'sale',
      transaction_date: new Date().toISOString(),
      transaction_code: `SALE-${Date.now()}`,
      smart_code: 'HERA.SALON.POS.SALE.v1',
      total_amount: totalAmount,
      from_entity_id: customerId || null,
      metadata: {
        subtotal,
        vat_amount: vatAmount,
        vat_rate: 0.05,
        discount_amount: discountAmount,
        payment_splits: paymentSplits,
        pos_terminal: 'salon_main',
        cashier: 'current_user' // In real app, get from auth
      }
    }

    const transaction = await universalApi.createTransaction(transactionData)

    // Create transaction lines for each item
    const lineItems = items.map((item: any, index: number) => ({
      transaction_id: transaction.id,
      line_number: index + 1,
      line_entity_id: item.id,
      line_entity_type: item.type,
      quantity: item.quantity,
      unit_price: item.price,
      line_amount: item.price * item.quantity,
      discount_amount: item.discountAmount || 0,
      vat_amount: item.vatAmount || 0,
      metadata: {
        item_name: item.name,
        staff_member: item.staff,
        duration_minutes: item.duration,
        discount_type: item.discountType,
        discount_value: item.discount
      }
    }))

    // In real implementation, would batch insert
    for (const lineItem of lineItems) {
      await universalApi.createTransactionLine(lineItem)
    }

    // Create payment records for each split
    for (const payment of paymentSplits) {
      const paymentData = {
        organization_id: organizationId,
        transaction_type: 'payment',
        transaction_date: new Date().toISOString(),
        transaction_code: `PAY-${Date.now()}-${payment.method}`,
        smart_code: `HERA.SALON.POS.PAYMENT.${payment.method.toUpperCase()}.v1`,
        total_amount: payment.amount,
        from_entity_id: customerId || null,
        to_entity_id: transaction.id, // Link to sale transaction
        metadata: {
          payment_method: payment.method,
          reference: payment.reference,
          sale_transaction_id: transaction.id
        }
      }

      await universalApi.createTransaction(paymentData)
    }

    // Update inventory for products
    const productItems = items.filter((item: any) => item.type === 'product')
    for (const product of productItems) {
      // Create inventory movement
      const movementData = {
        organization_id: organizationId,
        transaction_type: 'inventory_movement',
        transaction_date: new Date().toISOString(),
        transaction_code: `INV-OUT-${Date.now()}`,
        smart_code: 'HERA.SALON.INV.SALE.OUT.v1',
        total_amount: product.quantity, // Quantity as amount
        from_entity_id: product.id, // Product entity
        to_entity_id: transaction.id, // Sale transaction
        metadata: {
          movement_type: 'sale',
          quantity: product.quantity,
          unit_price: product.price,
          location: 'main_store'
        }
      }

      await universalApi.createTransaction(movementData)
    }

    // Generate receipt data
    const receipt = {
      transactionId: transaction.id,
      transactionCode: transaction.transaction_code,
      date: new Date().toISOString(),
      items,
      subtotal,
      vatAmount,
      totalAmount,
      discountAmount,
      paymentSplits,
      customer: customerId ? { id: customerId } : null,
      organization: {
        name: 'Luxury Salon & Spa',
        address: 'Dubai Mall, Downtown Dubai',
        phone: '+971 4 123 4567',
        taxNumber: 'TRN: 100123456789003'
      }
    }

    return NextResponse.json({
      success: true,
      transaction,
      receipt
    })

  } catch (error: any) {
    console.error('POS transaction error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process sale' },
      { status: 500 }
    )
  }
}

// GET endpoint for fetching POS data (services, products, customers)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const dataType = searchParams.get('type') // services, products, customers

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    universalApi.setOrganizationId(organizationId)

    switch (dataType) {
      case 'services':
        const services = await universalApi.getEntities({
          entity_type: 'salon_service',
          filters: { status: 'active' }
        })
        return NextResponse.json({ services })

      case 'products':
        const products = await universalApi.getEntities({
          entity_type: 'salon_product_item',
          filters: { status: 'active' }
        })
        
        // Get current stock levels
        for (const product of products) {
          const stockData = await universalApi.getDynamicFields(product.id)
          product.stock = stockData.find(f => f.field_name === 'current_stock')?.field_value_number || 0
        }
        
        return NextResponse.json({ products })

      case 'customers':
        const customers = await universalApi.getEntities({
          entity_type: 'customer',
          filters: { status: 'active' }
        })
        
        // Get customer tier and visit count
        for (const customer of customers) {
          const dynamicData = await universalApi.getDynamicFields(customer.id)
          customer.tier = dynamicData.find(f => f.field_name === 'loyalty_tier')?.field_value_text || 'Bronze'
          customer.visits = dynamicData.find(f => f.field_name === 'visit_count')?.field_value_number || 0
        }
        
        return NextResponse.json({ customers })

      default:
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error fetching POS data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: 500 }
    )
  }
}