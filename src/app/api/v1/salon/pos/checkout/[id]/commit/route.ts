import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { executeHeraPlaybook } from '@/lib/hera/execute-playbook'

// Validation schema for checkout commit request
const CheckoutCommitSchema = z.object({
  sale_metadata: z.record(z.any()).optional().default({}),
  commission_base: z.enum(['before_line_discount', 'after_line_discount', 'after_all_discounts']).optional().default('after_line_discount'),
  force_negative_stock: z.boolean().optional().default(false),
  posting_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Posting date must be YYYY-MM-DD format').optional(),
  journal_memo: z.string().optional().default('POS Sale Transaction')
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate checkout ID from URL
    const checkoutId = params.id
    if (!checkoutId || !isValidUUID(checkoutId)) {
      return NextResponse.json(
        {
          error: 'INVALID_CHECKOUT_ID',
          message: 'Checkout ID must be a valid UUID',
          details: {}
        },
        { status: 400 }
      )
    }

    // Parse and validate request body (optional for commit)
    let validatedPayload = {}
    const contentType = request.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const body = await request.json()
      validatedPayload = CheckoutCommitSchema.parse(body)
    }

    // Get organization ID from middleware context
    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json(
        { 
          error: 'ORGANIZATION_CONTEXT_MISSING',
          message: 'Organization context is required for checkout operations',
          details: 'Ensure middleware is properly configured'
        },
        { status: 400 }
      )
    }

    // Get idempotency key from headers
    const idempotencyKey = request.headers.get('idempotency-key')

    // Prepare payload for procedure execution
    const payload = {
      checkout_id: checkoutId,
      ...validatedPayload
    }

    // Execute checkout commit orchestration (multiple procedures)
    const result = await executeHeraPlaybook({
      smart_code: 'HERA.SALON.POS.ORCH.CHECKOUT_COMMIT.V1', // This will be the orchestration
      organization_id: organizationId,
      payload,
      idempotency_key: idempotencyKey || undefined,
      context: {
        api_endpoint: `/api/v1/salon/pos/checkout/${checkoutId}/commit`,
        request_method: 'POST',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Handle procedure execution result
    if (!result.success) {
      const statusCode = getStatusCodeFromError(result.error_code)
      return NextResponse.json(
        {
          error: result.error_code,
          message: result.error_message,
          details: result.error_details || {}
        },
        { status: statusCode }
      )
    }

    // Return comprehensive checkout commit response
    return NextResponse.json({
      success: true,
      sale_id: result.data.sale_id,
      checkout_id: checkoutId,
      sale_total: result.data.sale_total,
      payments_total: result.data.payments_total,
      line_count: result.data.line_count,
      inventory_committed: result.data.inventory_committed,
      commissions_calculated: result.data.commissions_calculated,
      gl_journal_posted: result.data.gl_journal_posted,
      sale_status: result.data.sale_status,
      committed_at: result.data.committed_at,
      breakdown: {
        sale_commit: {
          duration_ms: result.data.sale_commit_duration_ms,
          status: result.data.sale_commit_status
        },
        inventory_commit: {
          duration_ms: result.data.inventory_commit_duration_ms,
          products_affected: result.data.inventory_products_affected,
          total_quantity_decremented: result.data.inventory_total_decremented
        },
        commission_calc: {
          duration_ms: result.data.commission_calc_duration_ms,
          staff_members_paid: result.data.commission_staff_count,
          total_commission_amount: result.data.commission_total_amount
        },
        gl_posting: {
          duration_ms: result.data.gl_posting_duration_ms,
          journal_entry_id: result.data.journal_entry_id,
          journal_balance_amount: result.data.journal_balance_amount,
          account_count: result.data.gl_account_count
        }
      },
      metadata: {
        orchestration_execution_id: result.execution_id,
        total_duration_ms: result.duration_ms,
        procedure_count: result.data.procedure_count || 4
      }
    })

  } catch (error) {
    console.error('Checkout commit error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid request payload',
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'INVALID_JSON',
          message: 'Request body must be valid JSON',
          details: {}
        },
        { status: 400 }
      )
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred during checkout commit',
        details: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
      },
      { status: 500 }
    )
  }
}

// Map procedure error codes to HTTP status codes
function getStatusCodeFromError(errorCode: string): number {
  const errorMap: Record<string, number> = {
    'CHECKOUT_NOT_FOUND': 404,
    'CHECKOUT_NOT_READY': 400,
    'PAYMENT_TOTAL_MISMATCH': 400,
    'CART_NOT_LOCKED': 400,
    'SALE_CREATION_FAILED': 500,
    'LINE_COPY_FAILED': 500,
    'CART_CLOSE_FAILED': 500,
    'SALE_NOT_COMMITTED': 400,
    'INSUFFICIENT_STOCK': 400,
    'PRODUCT_NOT_FOUND': 404,
    'INVENTORY_UPDATE_FAILED': 500,
    'COMMISSION_CALCULATION_ERROR': 500,
    'FINANCE_DNA_NOT_ACTIVE': 400,
    'GL_MAPPING_NOT_FOUND': 400,
    'JOURNAL_NOT_BALANCED': 500,
    'GL_ACCOUNT_NOT_FOUND': 404,
    'JOURNAL_CREATION_FAILED': 500
  }

  return errorMap[errorCode] || 500
}

// Utility function to validate UUID format
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'METHOD_NOT_ALLOWED', message: 'GET method not supported' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'METHOD_NOT_ALLOWED', message: 'PUT method not supported' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'METHOD_NOT_ALLOWED', message: 'DELETE method not supported' },
    { status: 405 }
  )
}