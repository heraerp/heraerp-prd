import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { executeHeraPlaybook } from '@/lib/hera/execute-playbook'

// Validation schema for payment refund request
const PaymentRefundSchema = z.object({
  amount: z.number().positive('Refund amount must be positive'),
  reason: z.string().min(1, 'Refund reason is required'),
  return_id: z.string().uuid('Return ID must be a valid UUID').optional(),
  adjustment_id: z.string().uuid('Adjustment ID must be a valid UUID').optional()
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate payment ID from URL
    const paymentId = params.id
    if (!paymentId || !isValidUUID(paymentId)) {
      return NextResponse.json(
        {
          error: 'INVALID_PAYMENT_ID',
          message: 'Payment ID must be a valid UUID',
          details: {}
        },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedPayload = PaymentRefundSchema.parse(body)

    // Get organization ID from middleware context
    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json(
        {
          error: 'ORGANIZATION_CONTEXT_MISSING',
          message: 'Organization context is required for refund operations',
          details: 'Ensure middleware is properly configured'
        },
        { status: 400 }
      )
    }

    // Get idempotency key from headers
    const idempotencyKey = request.headers.get('idempotency-key')

    // Prepare payload for procedure execution
    const procedurePayload = {
      payment_id: paymentId,
      ...validatedPayload
    }

    // Execute payment refund procedure
    const result = await executeHeraPlaybook({
      smart_code: 'HERA.SALON.PAYMENT.REFUND.PROCESS.V1',
      organization_id: organizationId,
      payload: procedurePayload,
      idempotency_key: idempotencyKey || undefined,
      context: {
        api_endpoint: `/api/v1/salon/pos/payments/${paymentId}/refund`,
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

    // Return payment refund response
    return NextResponse.json({
      success: true,
      refund_id: result.data.refund_id,
      payment_id: paymentId,
      refund_details: {
        amount: validatedPayload.amount,
        method: result.data.refund_method,
        reason: validatedPayload.reason,
        status: result.data.refund_status,
        processed_at: result.data.processed_at
      },
      original_payment: {
        payment_id: paymentId,
        original_amount: result.data.original_amount,
        previously_refunded: result.data.previously_refunded,
        available_for_refund: result.data.available_for_refund
      },
      gateway_details: result.data.gateway_details || null,
      associations: {
        return_id: validatedPayload.return_id || null,
        adjustment_id: validatedPayload.adjustment_id || null,
        sale_id: result.data.original_sale_id
      },
      metadata: {
        procedure_execution_id: result.execution_id,
        procedure_duration_ms: result.duration_ms,
        idempotent: result.data.idempotent_match || false
      }
    })
  } catch (error) {
    console.error('Payment refund error:', error)

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
        message: 'An unexpected error occurred during payment refund',
        details: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
      },
      { status: 500 }
    )
  }
}

// Map procedure error codes to HTTP status codes
function getStatusCodeFromError(errorCode: string): number {
  const errorMap: Record<string, number> = {
    PAYMENT_NOT_FOUND: 404,
    PAYMENT_NOT_CAPTURED: 400,
    REFUND_AMOUNT_EXCEEDED: 400,
    GATEWAY_REFUND_FAILED: 502,
    INSUFFICIENT_CASH_DRAWER: 400,
    GIFT_CARD_REACTIVATION_FAILED: 500,
    DUPLICATE_REFUND: 409,
    REFUND_WINDOW_EXCEEDED: 400,
    REFUND_PROCESSING_ERROR: 500
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
