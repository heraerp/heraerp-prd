import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RepriceRequest {
  discount?: {
    type: 'percent' | 'amount'
    value: number
    reason: string
  }
  tip?: {
    method: 'card' | 'cash'
    amount: number
  }
  options?: {
    tax_smart_code?: string
    force_refresh?: boolean
  }
}

interface PricingSummary {
  subtotal: number
  discounts: number
  tax: number
  tip: number
  total: number
  line_count: number
  notes: string
}

interface RepriceResponse {
  pricing_summary: PricingSummary
  lines_changed: string[]
}

/**
 * POST /api/v1/salon/pos/carts/:id/reprice
 * 
 * Reprice cart with optional discount/tip application
 * All pricing logic handled by HERA.SALON.POS.CART.REPRICE.V1 procedure
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: cartId } = await params
    const headersList = await headers()
    const idempotencyKey = headersList.get('idempotency-key')
    
    if (!idempotencyKey) {
      return NextResponse.json(
        { error: 'Idempotency-Key header required for reprice operations' },
        { status: 400 }
      )
    }

    // Parse request body
    let body: RepriceRequest = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is acceptable for reprice-only operation
    }

    // Validate cart exists and get organization
    const { data: cart, error: cartError } = await supabase
      .from('universal_transactions')
      .select('id, organization_id, transaction_status, metadata')
      .eq('id', cartId)
      .eq('transaction_type', 'SALE')  // Match exact case from database
      .single()

    if (cartError || !cart) {
      return NextResponse.json(
        { error: 'Cart not found', cart_id: cartId },
        { status: 404 }
      )
    }

    if (cart.transaction_status !== 'pending') {
      return NextResponse.json(
        { error: 'Cart is not available for repricing', status: cart.transaction_status },
        { status: 400 }
      )
    }

    // Check for duplicate idempotency key
    const existingOperation = await checkIdempotencyKey(
      cart.organization_id,
      cartId,
      idempotencyKey
    )
    
    if (existingOperation) {
      // Return cached result for duplicate request
      return NextResponse.json(existingOperation.result)
    }

    // Validate request payload
    const validationError = validateRepriceRequest(body)
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      )
    }

    // Execute reprice procedure
    const repriceResult = await executeRepriceProcedure(
      cart.organization_id,
      cartId,
      body,
      idempotencyKey
    )

    if (!repriceResult.success) {
      return NextResponse.json(
        { error: repriceResult.error, details: repriceResult.details },
        { status: 400 }
      )
    }

    // Cache result for idempotency
    await cacheIdempotencyResult(
      cart.organization_id,
      cartId,
      idempotencyKey,
      repriceResult.data
    )

    return NextResponse.json(repriceResult.data)

  } catch (error) {
    console.error('Reprice API error:', error)
    return NextResponse.json(
      { error: 'Internal server error during reprice operation' },
      { status: 500 }
    )
  }
}

/**
 * Validate reprice request payload
 */
function validateRepriceRequest(body: RepriceRequest): string | null {
  // Validate discount
  if (body.discount) {
    const { type, value, reason } = body.discount
    
    if (!['percent', 'amount'].includes(type)) {
      return 'Discount type must be "percent" or "amount"'
    }
    
    if (typeof value !== 'number' || value < 0) {
      return 'Discount value must be a positive number'
    }
    
    if (type === 'percent' && value > 100) {
      return 'Percent discount cannot exceed 100%'
    }
    
    if (!reason || typeof reason !== 'string') {
      return 'Discount reason is required'
    }
  }

  // Validate tip
  if (body.tip) {
    const { method, amount } = body.tip
    
    if (!['card', 'cash'].includes(method)) {
      return 'Tip method must be "card" or "cash"'
    }
    
    if (typeof amount !== 'number' || amount <= 0) {
      return 'Tip amount must be a positive number'
    }
  }

  return null
}

/**
 * Execute the reprice procedure via universal transaction system
 */
async function executeRepriceProcedure(
  organizationId: string,
  cartId: string,
  payload: RepriceRequest,
  idempotencyKey: string
) {
  try {
    // Create procedure execution transaction
    const { data: execution, error: execError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'procedure_execution',
        transaction_code: `REPRICE-${cartId}-${Date.now()}`,
        smart_code: 'HERA.SALON.POS.CART.REPRICE.V1',
        total_amount: 0,
        transaction_status: 'executing',
        metadata: {
          procedure: 'HERA.SALON.POS.CART.REPRICE.V1',
          cart_id: cartId,
          payload,
          idempotency_key: idempotencyKey,
          execution_start: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (execError) {
      return { success: false, error: 'Failed to start reprice execution', details: execError }
    }

    // Simulate procedure execution (in production, this would call the actual procedure runner)
    const mockResult = await simulateRepriceProcedure(organizationId, cartId, payload)

    // Update execution status
    await supabase
      .from('universal_transactions')
      .update({
        transaction_status: 'completed',
        metadata: {
          ...execution.metadata,
          execution_end: new Date().toISOString(),
          result: mockResult
        }
      })
      .eq('id', execution.id)

    return { success: true, data: mockResult }

  } catch (error) {
    return { success: false, error: 'Procedure execution failed', details: error }
  }
}

/**
 * Optimized reprice procedure execution
 * Batched reads, cached policies, single pricing update
 */
async function simulateRepriceProcedure(
  organizationId: string,
  cartId: string,
  payload: RepriceRequest
): Promise<RepriceResponse> {
  // Batch: Get all cart lines and org policy in parallel
  const [{ data: lines }, orgPolicy] = await Promise.all([
    supabase
      .from('universal_transaction_lines')
      .select('entity_id, line_type, line_amount, line_number, smart_code')
      .eq('transaction_id', cartId)
      .order('line_number'),
    import('@/lib/cache/org-policy-cache').then(m => m.getOrgPolicy(organizationId))
  ])

  let subtotal = 0
  let discounts = 0
  let tax = 0
  let tip = 0
  const linesChanged: string[] = []

  // Calculate base subtotal from service and product lines (optimized filter)
  if (lines) {
    subtotal = lines
      .filter(line => line.line_type === 'service' || line.line_type === 'product')
      .reduce((sum, line) => sum + (line.line_amount || 0), 0)
  }

  // Apply discount if provided
  if (payload.discount) {
    const discountAmount = payload.discount.type === 'percent'
      ? subtotal * (payload.discount.value / 100)
      : payload.discount.value

    discounts = Math.round(discountAmount * 100) / 100

    // Create/update discount line
    const discountSmartCode = payload.discount.type === 'percent'
      ? 'HERA.SALON.POS.ADJUST.DISCOUNT.CART.PCT.V1'
      : 'HERA.SALON.POS.ADJUST.DISCOUNT.CART.AMT.V1'

    await upsertCartLine(cartId, 'DISCOUNT', discountSmartCode, -discounts, {
      discount_type: payload.discount.type,
      discount_value: payload.discount.value,
      discount_reason: payload.discount.reason
    })

    linesChanged.push('ln_discount_cart')
  }

  // Apply tip if provided
  if (payload.tip) {
    tip = payload.tip.amount

    const tipSmartCode = payload.tip.method === 'card'
      ? 'HERA.SALON.TIP.CARD.V1'
      : 'HERA.SALON.TIP.CASH.V1'

    await upsertCartLine(cartId, 'TIP', tipSmartCode, tip, {
      tip_method: payload.tip.method
    })

    linesChanged.push('ln_tip')
  }

  // Calculate tax using cached org policy (VAT on taxable base, tips excluded)
  const taxableBase = subtotal - discounts
  const taxRate = orgPolicy.vatRate
  tax = Math.round(taxableBase * taxRate * 100) / 100

  const total = subtotal - discounts + tax + tip
  const lineCount = (lines?.length || 0) + linesChanged.length

  // Batch: Update tax line and cart pricing summary in parallel
  const [taxResult, _] = await Promise.all([
    upsertCartLine(cartId, 'TAX', 'HERA.SALON.TAX.UK.VAT.STANDARD.V1', tax, {
      tax_rate_pct: Math.round(taxRate * 100),
      taxable_base: taxableBase
    }),
    supabase
      .from('universal_transactions')
      .update({
        total_amount: total,
        metadata: {
          pricing_summary: {
            subtotal,
            discounts,
            tax,
            tip,
            total,
            line_count: lineCount,
            last_reprice_at: new Date().toISOString()
          }
        }
      })
      .eq('id', cartId)
  ])

  linesChanged.push('ln_tax')

  return {
    pricing_summary: {
      subtotal,
      discounts,
      tax,
      tip,
      total,
      line_count: lineCount,
      notes: 'VAT 20% on services/retail only; tips excluded'
    },
    lines_changed: linesChanged
  }
}

/**
 * Upsert a cart line (discount, tip, or tax)
 */
async function upsertCartLine(
  cartId: string,
  lineType: string,
  smartCode: string,
  amount: number,
  metadata: any
) {
  // Check if line already exists
  const { data: existingLine } = await supabase
    .from('universal_transaction_lines')
    .select('id')
    .eq('transaction_id', cartId)
    .eq('line_type', lineType)
    .eq('smart_code', smartCode)
    .single()

  if (existingLine) {
    // Update existing line
    await supabase
      .from('universal_transaction_lines')
      .update({
        line_amount: amount,
        line_data: metadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingLine.id)
  } else {
    // Create new line
    const { data: lines } = await supabase
      .from('universal_transaction_lines')
      .select('line_number')
      .eq('transaction_id', cartId)
      .order('line_number', { ascending: false })
      .limit(1)

    const nextLineNumber = (lines?.[0]?.line_number || 0) + 1

    await supabase
      .from('universal_transaction_lines')
      .insert({
        transaction_id: cartId,
        line_number: nextLineNumber,
        line_type: lineType,
        line_description: `${lineType} line`,
        quantity: 1,
        unit_price: amount,
        line_amount: amount,
        smart_code: smartCode,
        line_data: metadata
      })
  }
}

/**
 * Check for existing idempotency key
 */
async function checkIdempotencyKey(
  organizationId: string,
  cartId: string,
  idempotencyKey: string
) {
  const { data } = await supabase
    .from('universal_transactions')
    .select('metadata')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'procedure_execution')
    .eq('smart_code', 'HERA.SALON.POS.CART.REPRICE.V1')
    .eq('metadata->>cart_id', cartId)
    .eq('metadata->>idempotency_key', idempotencyKey)
    .eq('transaction_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data?.metadata?.result ? { result: data.metadata.result } : null
}

/**
 * Cache idempotency result
 */
async function cacheIdempotencyResult(
  organizationId: string,
  cartId: string,
  idempotencyKey: string,
  result: any
) {
  // Result is already cached in the execution transaction metadata
  // This is a placeholder for additional caching if needed
}