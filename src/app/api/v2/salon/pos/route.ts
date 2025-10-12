/**
 * HERA Salon: Secured POS API
 *
 * Provides secure point-of-sale operations with comprehensive audit logging
 * and role-based transaction processing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { withSecurity } from '@/lib/security/security-middleware'
import type { SecurityContext } from '@/lib/security/database-context'

/**
 * GET /api/v2/salon/pos
 * Fetch POS data based on user permissions
 */
async function handleGetSalonPOS(req: NextRequest, context: SecurityContext) {
  try {
    const { searchParams } = new URL(req.url)
    const cartId = searchParams.get('cart_id')
    const action = searchParams.get('action') || 'dashboard'

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Determine user permissions
    const canProcessPayments = ['owner', 'manager', 'receptionist'].includes(context.role)
    const canViewAllTransactions = ['owner', 'manager', 'accountant'].includes(context.role)
    const canManageInventory = ['owner', 'manager'].includes(context.role)

    let responseData = {}

    switch (action) {
      case 'dashboard':
        // Fetch active carts for this organization
        const { data: activeCarts, error: cartsError } = await supabase
          .from('universal_transactions')
          .select(
            `
            id,
            transaction_number,
            total_amount,
            metadata,
            created_at,
            created_by
          `
          )
          .eq('organization_id', context.orgId)
          .eq('transaction_type', 'pos_cart')
          .in('metadata->status', ['active', 'pending'])
          .order('created_at', { ascending: false })
          .limit(10)

        if (cartsError) throw cartsError

        // Fetch services available for sale
        const { data: services, error: servicesError } = await supabase
          .from('core_entities')
          .select(
            `
            id,
            entity_name,
            entity_code,
            metadata
          `
          )
          .eq('organization_id', context.orgId)
          .eq('entity_type', 'service')
          .eq('status', 'active')
          .order('entity_name')

        if (servicesError) throw servicesError

        // Fetch products available for sale (if user can manage inventory)
        let products = []
        if (canManageInventory) {
          const { data: productData, error: productsError } = await supabase
            .from('core_entities')
            .select(
              `
              id,
              entity_name,
              entity_code,
              metadata
            `
            )
            .eq('organization_id', context.orgId)
            .eq('entity_type', 'product')
            .eq('status', 'active')
            .order('entity_name')

          if (productsError) {
            console.error('Error fetching products:', productsError)
          } else {
            products = productData || []
          }
        }

        responseData = {
          activeCarts: activeCarts || [],
          services: services || [],
          products,
          permissions: {
            canProcessPayments,
            canViewAllTransactions,
            canManageInventory
          }
        }
        break

      case 'cart':
        if (!cartId) {
          return NextResponse.json({ error: 'Cart ID is required' }, { status: 400 })
        }

        // Fetch specific cart with line items
        const { data: cart, error: cartError } = await supabase
          .from('universal_transactions')
          .select(
            `
            id,
            transaction_number,
            total_amount,
            metadata,
            created_at,
            created_by
          `
          )
          .eq('id', cartId)
          .eq('organization_id', context.orgId)
          .single()

        if (cartError) throw cartError

        // Fetch cart line items
        const { data: lineItems, error: lineItemsError } = await supabase
          .from('universal_transaction_lines')
          .select(
            `
            id,
            line_number,
            line_entity_id,
            quantity,
            unit_price,
            line_amount,
            metadata
          `
          )
          .eq('transaction_id', cartId)
          .eq('organization_id', context.orgId)
          .order('line_number')

        if (lineItemsError) throw lineItemsError

        responseData = {
          cart,
          lineItems: lineItems || []
        }
        break

      case 'recent_transactions':
        if (!canViewAllTransactions) {
          return NextResponse.json(
            { error: 'Insufficient permissions to view transaction history' },
            { status: 403 }
          )
        }

        const { data: recentTransactions, error: transactionsError } = await supabase
          .from('universal_transactions')
          .select(
            `
            id,
            transaction_number,
            transaction_type,
            total_amount,
            metadata,
            created_at
          `
          )
          .eq('organization_id', context.orgId)
          .in('transaction_type', ['pos_sale', 'pos_refund'])
          .order('created_at', { ascending: false })
          .limit(20)

        if (transactionsError) throw transactionsError

        responseData = {
          transactions: recentTransactions || []
        }
        break

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      context: {
        action,
        user_role: context.role,
        organization_id: context.orgId
      }
    })
  } catch (error) {
    console.error('Salon POS API error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch POS data',
        code: 'POS_FETCH_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v2/salon/pos
 * Handle POS operations with role-based security
 */
async function handlePostSalonPOS(req: NextRequest, context: SecurityContext) {
  try {
    const body = await req.json()
    const { action, data } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    // Role-based action permissions
    const actionPermissions = {
      create_cart: ['owner', 'manager', 'receptionist'],
      add_item: ['owner', 'manager', 'receptionist', 'stylist'],
      remove_item: ['owner', 'manager', 'receptionist'],
      update_quantity: ['owner', 'manager', 'receptionist'],
      apply_discount: ['owner', 'manager'],
      process_payment: ['owner', 'manager', 'receptionist'],
      void_transaction: ['owner', 'manager'],
      process_refund: ['owner', 'manager']
    }

    const allowedRoles = actionPermissions[action]
    if (!allowedRoles || !allowedRoles.includes(context.role)) {
      return NextResponse.json(
        {
          error: 'Insufficient permissions for this POS action',
          code: 'POS_ACTION_FORBIDDEN',
          required_roles: allowedRoles
        },
        { status: 403 }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    let result = null

    switch (action) {
      case 'create_cart':
        // Create new POS cart
        const cartCode = `CART-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        const { data: newCart, error: cartError } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: context.orgId,
            transaction_type: 'pos_cart',
            transaction_number: cartCode,
            smart_code: 'HERA.SALON.POS.CART.ACTIVE.V1',
            total_amount: 0,
            created_by: context.userId,
            metadata: {
              status: 'active',
              created_by_role: context.role,
              customer_id: data.customerId || null,
              notes: data.notes || ''
            }
          })
          .select()
          .single()

        if (cartError) throw cartError
        result = { cart: newCart }
        break

      case 'add_item':
        if (!data.cartId || !data.itemId) {
          throw new Error('Cart ID and Item ID are required')
        }

        // Fetch item details
        const { data: item, error: itemError } = await supabase
          .from('core_entities')
          .select('*')
          .eq('id', data.itemId)
          .eq('organization_id', context.orgId)
          .single()

        if (itemError) throw itemError

        // Get current cart to update total
        const { data: currentCart, error: currentCartError } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('id', data.cartId)
          .eq('organization_id', context.orgId)
          .single()

        if (currentCartError) throw currentCartError

        // Get next line number
        const { data: existingLines, error: linesError } = await supabase
          .from('universal_transaction_lines')
          .select('line_number')
          .eq('transaction_id', data.cartId)
          .order('line_number', { ascending: false })
          .limit(1)

        if (linesError) throw linesError

        const nextLineNumber = existingLines.length > 0 ? existingLines[0].line_number + 1 : 1
        const unitPrice = (item.metadata as any)?.price || 0
        const quantity = data.quantity || 1
        const lineAmount = unitPrice * quantity

        // Add line item
        const { data: newLineItem, error: lineItemError } = await supabase
          .from('universal_transaction_lines')
          .insert({
            transaction_id: data.cartId,
            organization_id: context.orgId,
            line_number: nextLineNumber,
            line_entity_id: data.itemId,
            quantity,
            unit_price: unitPrice,
            line_amount: lineAmount,
            smart_code: `HERA.SALON.POS.LINE.${item.entity_type.toUpperCase()}.V1`,
            metadata: {
              item_name: item.entity_name,
              item_type: item.entity_type,
              added_by: context.userId,
              added_by_role: context.role
            }
          })
          .select()
          .single()

        if (lineItemError) throw lineItemError

        // Update cart total
        const newTotal = (currentCart.total_amount || 0) + lineAmount
        const { data: updatedCart, error: updateCartError } = await supabase
          .from('universal_transactions')
          .update({ total_amount: newTotal })
          .eq('id', data.cartId)
          .eq('organization_id', context.orgId)
          .select()
          .single()

        if (updateCartError) throw updateCartError

        result = {
          lineItem: newLineItem,
          cart: updatedCart,
          item: {
            id: item.id,
            name: item.entity_name,
            type: item.entity_type
          }
        }
        break

      case 'process_payment':
        if (!data.cartId || !data.paymentAmount) {
          throw new Error('Cart ID and payment amount are required')
        }

        // Convert cart to sale transaction
        const { data: cart, error: getCartError } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('id', data.cartId)
          .eq('organization_id', context.orgId)
          .single()

        if (getCartError) throw getCartError

        const saleCode = `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

        // Create sale transaction
        const { data: saleTransaction, error: saleError } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: context.orgId,
            transaction_type: 'pos_sale',
            transaction_number: saleCode,
            smart_code: 'HERA.SALON.POS.SALE.COMPLETED.V1',
            total_amount: cart.total_amount,
            created_by: context.userId,
            metadata: {
              ...cart.metadata,
              status: 'completed',
              payment_method: data.paymentMethod || 'cash',
              payment_amount: data.paymentAmount,
              change_given: Math.max(0, data.paymentAmount - cart.total_amount),
              processed_by: context.userId,
              processed_by_role: context.role,
              original_cart_id: data.cartId
            }
          })
          .select()
          .single()

        if (saleError) throw saleError

        // Copy line items to sale transaction
        const { data: cartLines, error: cartLinesError } = await supabase
          .from('universal_transaction_lines')
          .select('*')
          .eq('transaction_id', data.cartId)

        if (cartLinesError) throw cartLinesError

        if (cartLines && cartLines.length > 0) {
          const saleLines = cartLines.map(line => ({
            ...line,
            id: undefined, // Let database generate new ID
            transaction_id: saleTransaction.id,
            created_at: undefined,
            updated_at: undefined
          }))

          const { error: saleLinesError } = await supabase
            .from('universal_transaction_lines')
            .insert(saleLines)

          if (saleLinesError) throw saleLinesError
        }

        // Mark original cart as completed
        const { error: completeCartError } = await supabase
          .from('universal_transactions')
          .update({
            metadata: {
              ...cart.metadata,
              status: 'completed',
              converted_to_sale: saleTransaction.id
            }
          })
          .eq('id', data.cartId)

        if (completeCartError) throw completeCartError

        result = {
          sale: saleTransaction,
          originalCart: data.cartId,
          payment: {
            amount: data.paymentAmount,
            method: data.paymentMethod || 'cash',
            change: Math.max(0, data.paymentAmount - cart.total_amount)
          }
        }
        break

      default:
        return NextResponse.json({ error: `Unknown POS action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      audit: {
        user_id: context.userId,
        user_role: context.role,
        organization_id: context.orgId,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Salon POS action error:', error)

    return NextResponse.json(
      {
        error: 'Failed to execute POS action',
        code: 'POS_ACTION_FAILED',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

// Apply security middleware with strict POS permissions
export const GET = withSecurity(handleGetSalonPOS, {
  allowedRoles: ['owner', 'admin', 'manager', 'user'], // All authenticated users can view
  enableAuditLogging: true,
  enableRateLimit: true
})

export const POST = withSecurity(handlePostSalonPOS, {
  allowedRoles: ['owner', 'admin', 'manager', 'user'], // Role validation happens internally
  enableAuditLogging: true,
  enableRateLimit: true
})
