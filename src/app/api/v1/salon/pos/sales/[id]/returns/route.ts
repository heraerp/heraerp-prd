import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { executeHeraPlaybook } from '@/lib/hera/execute-playbook'

// Validation schema for return request
const ReturnRequestSchema = z.object({
  lines: z
    .array(
      z.object({
        sale_line_id: z.string().uuid('Sale line ID must be a valid UUID'),
        qty: z.number().positive('Return quantity must be positive'),
        condition: z.enum(['good', 'damaged'], {
          errorMap: () => ({ message: 'Condition must be good or damaged' })
        }),
        reason: z.string().min(1, 'Return reason is required')
      })
    )
    .min(1, 'At least one line item is required for return'),
  refund: z.object({
    method: z.enum(['card', 'cash', 'giftcard'], {
      errorMap: () => ({ message: 'Refund method must be card, cash, or giftcard' })
    }),
    amount: z.number().positive('Refund amount must be positive')
  }),
  customer_id: z.string().uuid('Customer ID must be a valid UUID').optional(),
  return_metadata: z.record(z.any()).optional().default({})
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate sale ID from URL
    const saleId = params.id
    if (!saleId || !isValidUUID(saleId)) {
      return NextResponse.json(
        {
          error: 'INVALID_SALE_ID',
          message: 'Sale ID must be a valid UUID',
          details: {}
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedPayload = ReturnRequestSchema.parse(body)

    // Get organization ID from middleware context
    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json(
        {
          error: 'ORGANIZATION_CONTEXT_MISSING',
          message: 'Organization context is required for return operations',
          details: 'Ensure middleware is properly configured'
        },
        { status: 400 }
      )
    }

    // Get idempotency key from headers
    const idempotencyKey = request.headers.get('idempotency-key')

    // Determine if return has good or damaged items
    const hasGoodItems = validatedPayload.lines.some(line => line.condition === 'good')
    const hasDamagedItems = validatedPayload.lines.some(line => line.condition === 'damaged')

    // Prepare payload for orchestration
    const orchestrationPayload = {
      sale_id: saleId,
      ...validatedPayload,
      has_good_items: hasGoodItems,
      has_damaged_items: hasDamagedItems
    }

    // Execute return orchestration (multiple procedures)
    const result = await executeHeraPlaybook({
      smart_code: 'HERA.SALON.POS.ORCH.RETURN_RETAIL.V1',
      organization_id: organizationId,
      payload: orchestrationPayload,
      idempotency_key: idempotencyKey || undefined,
      context: {
        api_endpoint: `/api/v1/salon/pos/sales/${saleId}/returns`,
        request_method: 'POST',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    })

    // Handle orchestration execution result
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

    // Return comprehensive return response
    return NextResponse.json({
      success: true,
      return_id: result.data.return_id,
      refund_payment_id: result.data.refund_payment_id,
      return_summary: {
        total_items_returned: result.data.total_items_returned,
        good_items_restocked: result.data.good_items_restocked,
        damaged_items_written_off: result.data.damaged_items_written_off,
        return_subtotal: result.data.return_subtotal,
        tax_reversed: result.data.tax_reversed,
        total_refund_amount: result.data.total_refund_amount
      },
      inventory_impact: {
        restocked: result.data.inventory_restocked || [],
        written_off: result.data.inventory_written_off || []
      },
      financial_impact: {
        revenue_reversed: result.data.revenue_reversed,
        tax_reversed: result.data.tax_reversed,
        refund_processed: result.data.refund_processed,
        gl_journal_posted: result.data.gl_journal_posted
      },
      metadata: {
        orchestration_execution_id: result.execution_id,
        total_duration_ms: result.duration_ms,
        procedure_count: result.data.procedure_count || 5
      }
    })
  } catch (error) {
    console.error('Return processing error:', error)

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
        message: 'An unexpected error occurred during return processing',
        details: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
      },
      { status: 500 }
    )
  }
}

// Map procedure error codes to HTTP status codes
function getStatusCodeFromError(errorCode: string): number {
  const errorMap: Record<string, number> = {
    SALE_NOT_FOUND: 404,
    SALE_NOT_COMMITTED: 400,
    SALE_LINE_NOT_FOUND: 404,
    RETURN_QUANTITY_EXCEEDED: 400,
    RETURN_WINDOW_EXCEEDED: 400,
    NON_RETAIL_RETURN_ATTEMPTED: 400,
    DUPLICATE_RETURN: 409,
    RETURN_CREATION_FAILED: 500,
    PRODUCT_NOT_RESTOCKABLE: 400,
    LOCATION_NOT_FOUND: 404,
    RESTOCK_FAILED: 500,
    WRITE_OFF_FAILED: 500,
    TAX_CALCULATION_ERROR: 500,
    PAYMENT_NOT_FOUND: 404,
    REFUND_AMOUNT_EXCEEDED: 400,
    GATEWAY_REFUND_FAILED: 502,
    REFUND_WINDOW_EXCEEDED: 400,
    GL_POSTING_FAILED: 500
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
