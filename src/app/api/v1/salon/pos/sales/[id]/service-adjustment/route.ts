import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { executeHeraPlaybook } from '@/lib/hera/execute-playbook'

// Validation schema for service adjustment request
const ServiceAdjustmentSchema = z.object({
  target_line_id: z.string().uuid('Target line ID must be a valid UUID'),
  adjustment: z.object({
    type: z.enum(['amount', 'percentage'], {
      errorMap: () => ({ message: 'Adjustment type must be amount or percentage' })
    }),
    value: z.number().negative('Adjustment value must be negative'),
    reason: z.string().min(1, 'Adjustment reason is required')
  }),
  manager_approval: z.object({
    manager_id: z.string().uuid('Manager ID must be a valid UUID'),
    approval_code: z.string().min(1, 'Approval code is required')
  }).optional(),
  adjustment_metadata: z.record(z.any()).optional().default({})
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
    const validatedPayload = ServiceAdjustmentSchema.parse(body)

    // Get organization ID from middleware context
    const organizationId = request.headers.get('x-organization-id')
    if (!organizationId) {
      return NextResponse.json(
        { 
          error: 'ORGANIZATION_CONTEXT_MISSING',
          message: 'Organization context is required for adjustment operations',
          details: 'Ensure middleware is properly configured'
        },
        { status: 400 }
      )
    }

    // Get idempotency key from headers
    const idempotencyKey = request.headers.get('idempotency-key')

    // Prepare payload for orchestration
    const orchestrationPayload = {
      sale_id: saleId,
      ...validatedPayload
    }

    // Execute service adjustment orchestration
    const result = await executeHeraPlaybook({
      smart_code: 'HERA.SALON.POS.ORCH.SERVICE_ADJUSTMENT.V1',
      organization_id: organizationId,
      payload: orchestrationPayload,
      idempotency_key: idempotencyKey || undefined,
      context: {
        api_endpoint: `/api/v1/salon/pos/sales/${saleId}/service-adjustment`,
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

    // Return service adjustment response
    return NextResponse.json({
      success: true,
      adjustment_id: result.data.adjustment_id,
      adjustment_details: {
        target_line_id: validatedPayload.target_line_id,
        original_amount: result.data.original_amount,
        adjustment_amount: result.data.adjustment_amount,
        adjusted_total: result.data.adjusted_total,
        reason: validatedPayload.adjustment.reason
      },
      tax_impact: {
        original_tax: result.data.original_tax,
        tax_reversed: result.data.tax_reversed,
        adjusted_tax: result.data.adjusted_tax
      },
      refund_details: {
        refund_payment_id: result.data.refund_payment_id,
        refund_amount: result.data.refund_amount,
        refund_method: result.data.refund_method
      },
      financial_impact: {
        service_revenue_reversed: result.data.service_revenue_reversed,
        tax_reversed: result.data.tax_reversed,
        gl_journal_posted: result.data.gl_journal_posted
      },
      metadata: {
        orchestration_execution_id: result.execution_id,
        total_duration_ms: result.duration_ms,
        manager_approved: !!validatedPayload.manager_approval
      }
    })

  } catch (error) {
    console.error('Service adjustment error:', error)

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
        message: 'An unexpected error occurred during service adjustment',
        details: process.env.NODE_ENV === 'development' ? { error: error.message } : {}
      },
      { status: 500 }
    )
  }
}

// Map procedure error codes to HTTP status codes
function getStatusCodeFromError(errorCode: string): number {
  const errorMap: Record<string, number> = {
    'SALE_NOT_FOUND': 404,
    'SALE_NOT_COMMITTED': 400,
    'SERVICE_LINE_NOT_FOUND': 404,
    'POSITIVE_ADJUSTMENT_ATTEMPTED': 400,
    'MANAGER_APPROVAL_REQUIRED': 403,
    'INVALID_APPROVAL_CODE': 403,
    'ADJUSTMENT_LIMIT_EXCEEDED': 400,
    'DUPLICATE_ADJUSTMENT': 409,
    'TAX_CALCULATION_ERROR': 500,
    'PAYMENT_NOT_FOUND': 404,
    'REFUND_AMOUNT_EXCEEDED': 400,
    'GATEWAY_REFUND_FAILED': 502,
    'GL_POSTING_FAILED': 500
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