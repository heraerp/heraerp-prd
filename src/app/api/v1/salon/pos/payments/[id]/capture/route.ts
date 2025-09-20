import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { executeHeraPlaybook } from '@/lib/hera/execute-playbook'

// Validation schema for payment capture request
const PaymentCaptureSchema = z.object({
  capture_amount: z.number().positive('Capture amount must be positive').optional(),
  idempotency_key: z.string().optional()
})

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate payment intent ID from URL
    const paymentIntentId = params.id
    if (!paymentIntentId || !isValidUUID(paymentIntentId)) {
      return NextResponse.json(
        {
          error: 'INVALID_PAYMENT_INTENT_ID',
          message: 'Payment intent ID must be a valid UUID',
          details: {}
        },
        { status: 400 }
      )
    }

    // Parse and validate request body (optional for capture)
    let validatedPayload = {}
    const contentType = request.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const body = await request.json()
      validatedPayload = PaymentCaptureSchema.parse(body)
    }

    // Get organization ID from middleware context
    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json(
        { 
          error: 'ORGANIZATION_CONTEXT_MISSING',
          message: 'Organization context is required for payment operations',
          details: 'Ensure middleware is properly configured'
        },
        { status: 400 }
      )
    }

    // Get idempotency key from headers or payload
    const idempotencyKey = request.headers.get('idempotency-key') || 
                          (validatedPayload as any).idempotency_key

    // Prepare payload for procedure execution
    const payload = {
      payment_intent_id: paymentIntentId,
      ...validatedPayload
    }

    // Execute payment capture procedure
    const result = await executeHeraPlaybook({
      smart_code: 'HERA.SALON.PAYMENT.CAPTURE.V1',
      organization_id: organizationId,
      payload,
      idempotency_key: idempotencyKey || undefined,
      context: {
        api_endpoint: `/api/v1/salon/pos/payments/${paymentIntentId}/capture`,
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

    // Return successful payment capture response
    return NextResponse.json({
      success: true,
      payment_id: result.data.payment_id,
      payment_intent_id: paymentIntentId,
      method: result.data.method,
      amount_captured: result.data.amount_captured,
      status: result.data.status,
      gateway_transaction_id: result.data.gateway_transaction_id,
      captured_at: result.data.captured_at,
      metadata: {
        procedure_execution_id: result.execution_id,
        procedure_duration_ms: result.duration_ms
      }
    })

  } catch (error) {
    console.error('Payment capture error:', error)

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
        message: 'An unexpected error occurred during payment capture',
        details: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
      },
      { status: 500 }
    )
  }
}

// Map procedure error codes to HTTP status codes
function getStatusCodeFromError(errorCode: string): number {
  const errorMap: Record<string, number> = {
    'INTENT_NOT_FOUND': 404,
    'INTENT_NOT_CAPTURABLE': 400,
    'AMOUNT_MISMATCH': 400,
    'PAYMENT_GATEWAY_FAILURE': 502,
    'INSUFFICIENT_GIFT_CARD_BALANCE': 400,
    'INSUFFICIENT_DEPOSIT_BALANCE': 400,
    'DUPLICATE_CAPTURE': 409,
    'CAPTURE_PROCESSING_ERROR': 500
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