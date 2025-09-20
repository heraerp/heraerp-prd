import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { executeHeraPlaybook } from '@/lib/hera/execute-playbook'

// Validation schema for payment intent request
const PaymentIntentSchema = z.object({
  checkout_id: z.string().uuid('Checkout ID must be a valid UUID'),
  method: z.enum(['card', 'cash', 'giftcard', 'deposit'], {
    errorMap: () => ({ message: 'Payment method must be card, cash, giftcard, or deposit' })
  }),
  amount: z.number().positive('Payment amount must be positive'),
  metadata: z.record(z.any()).optional().default({})
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedPayload = PaymentIntentSchema.parse(body)

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

    // Get idempotency key from headers
    const idempotencyKey = request.headers.get('idempotency-key')

    // Execute payment intent creation procedure
    const result = await executeHeraPlaybook({
      smart_code: 'HERA.SALON.PAYMENT.INTENT.CREATE.V1',
      organization_id: organizationId,
      payload: validatedPayload,
      idempotency_key: idempotencyKey || undefined,
      context: {
        api_endpoint: '/api/v1/salon/pos/payments/intent',
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

    // Return successful payment intent response
    return NextResponse.json({
      success: true,
      payment_intent_id: result.data.payment_intent_id,
      method: result.data.method,
      amount: result.data.amount,
      status: result.data.status,
      client_secret: result.data.client_secret, // For card payments
      gateway_provider: result.data.gateway_provider,
      expires_at: result.data.expires_at,
      metadata: {
        procedure_execution_id: result.execution_id,
        procedure_duration_ms: result.duration_ms
      }
    })

  } catch (error) {
    console.error('Payment intent error:', error)

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
        message: 'An unexpected error occurred during payment intent creation',
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
    'CHECKOUT_NOT_OPEN': 400,
    'INVALID_PAYMENT_METHOD': 400,
    'INVALID_PAYMENT_AMOUNT': 400,
    'PAYMENT_GATEWAY_ERROR': 502,
    'IDEMPOTENCY_CONFLICT': 409,
    'DUPLICATE_INTENT': 409
  }

  return errorMap[errorCode] || 500
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