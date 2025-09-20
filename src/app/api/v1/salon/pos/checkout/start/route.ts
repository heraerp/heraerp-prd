import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { executeHeraPlaybook } from '@/lib/hera/execute-playbook'

// Validation schema for checkout start request
const StartCheckoutSchema = z.object({
  cart_id: z.string().uuid('Cart ID must be a valid UUID'),
  customer_id: z.string().uuid('Customer ID must be a valid UUID').optional(),
  appointment_id: z.string().uuid('Appointment ID must be a valid UUID').optional(),
  metadata: z.record(z.any()).optional().default({})
})

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json()
    const validatedPayload = StartCheckoutSchema.parse(body)

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

    // Execute checkout start procedure
    const result = await executeHeraPlaybook({
      smart_code: 'HERA.SALON.POS.CHECKOUT.START.V1',
      organization_id: organizationId,
      payload: validatedPayload,
      idempotency_key: idempotencyKey || undefined,
      context: {
        api_endpoint: '/api/v1/salon/pos/checkout/start',
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

    // Return successful checkout start response
    return NextResponse.json({
      success: true,
      checkout_id: result.data.checkout_id,
      checkout_status: result.data.checkout_status,
      cart_locked: result.data.cart_locked,
      cart_totals: result.data.cart_totals,
      expires_at: result.data.expires_at,
      metadata: {
        procedure_execution_id: result.execution_id,
        procedure_duration_ms: result.duration_ms
      }
    })

  } catch (error) {
    console.error('Checkout start error:', error)

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
        message: 'An unexpected error occurred during checkout start',
        details: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
      },
      { status: 500 }
    )
  }
}

// Map procedure error codes to HTTP status codes
function getStatusCodeFromError(errorCode: string): number {
  const errorMap: Record<string, number> = {
    'CART_NOT_FOUND': 404,
    'CART_ALREADY_IN_CHECKOUT': 409,
    'CART_EMPTY': 400,
    'CART_NOT_READY': 400,
    'CHECKOUT_ALREADY_EXISTS': 409,
    'CHECKOUT_CREATION_FAILED': 500,
    'CART_LOCK_FAILED': 500,
    'INVENTORY_VALIDATION_FAILED': 400,
    'PRICING_VALIDATION_FAILED': 400
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