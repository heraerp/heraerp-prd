/**
 * POS Cart Repricing Endpoint - Migrated to Playbook Pattern
 * 
 * This endpoint demonstrates the strangler fig migration pattern:
 * - Feature flag controls playbook vs legacy execution
 * - UI remains unchanged
 * - Instant rollback capability
 */

import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { runPlaybook, isPlaybookModeEnabled, logPlaybookExecution } from '@/lib/playbook-adapter'

// Legacy implementation (to be removed after successful migration)
async function repriceLegacy(
  cartId: string,
  payload: any,
  context: { organizationId: string; userId: string }
) {
  const supabase = await createSupabaseServerClient()
  
  // Legacy direct database operations
  const { data: cart, error: cartError } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      lines:universal_transaction_lines(*)
    `)
    .eq('id', cartId)
    .eq('organization_id', context.organizationId)
    .eq('transaction_type', 'cart')
    .eq('transaction_status', 'active')
    .single()
    
  if (cartError || !cart) {
    return NextResponse.json(
      { error: 'Cart not found' },
      { status: 404 }
    )
  }
  
  // Legacy repricing logic...
  let subtotal = 0
  let discountAmount = 0
  
  for (const line of cart.lines) {
    // Simple repricing - would be more complex in reality
    subtotal += line.line_amount
  }
  
  // Apply simple discount
  if (payload.promotion_codes?.includes('SAVE10')) {
    discountAmount = subtotal * 0.10
  }
  
  const totalAmount = subtotal - discountAmount
  
  // Update cart totals
  const { data: updated, error: updateError } = await supabase
    .from('universal_transactions')
    .update({
      total_amount: totalAmount,
      metadata: {
        ...cart.metadata,
        subtotal,
        discount_amount: discountAmount,
        repriced_at: new Date().toISOString()
      }
    })
    .eq('id', cartId)
    .select()
    .single()
    
  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update cart' },
      { status: 500 }
    )
  }
  
  return NextResponse.json(updated)
}

// Main handler with playbook migration
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cartId = params.id
  const payload = await request.json()
  
  // Get auth context
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Get organization context (from user metadata or session)
  const organizationId = user.user_metadata?.organization_id || 
    request.headers.get('X-Organization-ID') || 
    payload.organization_id
    
  if (!organizationId) {
    return NextResponse.json(
      { error: 'Organization context required' },
      { status: 400 }
    )
  }
  
  // Check if playbook mode is enabled for this organization
  const usePlaybook = await isPlaybookModeEnabled('pos_cart', organizationId)
  
  if (usePlaybook) {
    // NEW PATH: Use playbook/procedure
    const startTime = Date.now()
    
    const result = await runPlaybook(
      'HERA.SALON.POS.CART.REPRICE.V1',
      {
        cart_id: cartId,
        promotion_codes: payload.promotion_codes,
        membership_id: payload.membership_id,
        organization_id: organizationId
      },
      {
        organizationId,
        userId: user.id,
        idempotencyKey: request.headers.get('Idempotency-Key') || undefined,
        correlationId: request.headers.get('X-Correlation-ID') || undefined
      }
    )
    
    // Log execution for monitoring
    logPlaybookExecution(
      'HERA.SALON.POS.CART.REPRICE.V1',
      result.success,
      Date.now() - startTime,
      {
        organizationId,
        correlationId: result.metadata?.correlation_id,
        error: result.error
      }
    )
    
    if (!result.success) {
      // Handle specific error codes
      const statusCode = result.error?.code === 'CART_NOT_FOUND' ? 404 :
                        result.error?.code === 'CART_ALREADY_CHECKED_OUT' ? 400 :
                        result.error?.code === 'INVALID_PROMOTION_CODE' ? 400 :
                        500
                        
      return NextResponse.json(
        { 
          error: result.error?.message || 'Failed to reprice cart',
          code: result.error?.code,
          details: result.error?.details
        },
        { status: statusCode }
      )
    }
    
    // Return successful response with correlation ID
    return NextResponse.json(result.data, {
      headers: {
        'X-Correlation-ID': result.metadata?.correlation_id || '',
        'X-Idempotency-Key': result.metadata?.idempotency_key || '',
        'X-Playbook-Mode': 'true' // Indicate playbook was used
      }
    })
  } else {
    // LEGACY PATH: Direct database operations
    const response = await repriceLegacy(cartId, payload, { organizationId, userId: user.id })
    
    // Add header to indicate legacy mode
    if (response.ok) {
      response.headers.set('X-Playbook-Mode', 'false')
    }
    
    return response
  }
}

// OPTIONS endpoint for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Organization-ID, Idempotency-Key, X-Correlation-ID',
    },
  })
}