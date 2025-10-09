/**
 * HERA Universal Finance Event API Endpoint
 *
 * POST /api/v2/transactions/post
 *
 * Accepts Universal Finance Events (UFE) and processes them through
 * the Auto-Posting Engine (APE) to generate balanced GL entries.
 *
 * This is the main entry point for the Modern Digital Accountant (MDA) system.
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { z } from 'zod'
import { UniversalFinanceEventSchema, UFEProcessingResult } from '@/types/universal-finance-event'
import { processUniversalFinanceEvent } from '@/server/finance/autoPostingEngine'
import { heraCode } from '@/lib/smart-codes'

/**
 * Enhanced request schema with v2 API requirements
 */
const UFERequestSchema = z
  .object({
    apiVersion: z.literal('v2').describe('Must be v2 for this endpoint')
  })
  .merge(UniversalFinanceEventSchema)

/**
 * Response schema for UFE processing
 */
const UFEResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      transaction_id: z.string().uuid().optional(),
      journal_entry_id: z.string().uuid().optional(),
      posting_period: z.string().optional(),
      gl_lines: z
        .array(
          z.object({
            account_code: z.string(),
            account_name: z.string(),
            debit_amount: z.number().optional(),
            credit_amount: z.number().optional(),
            description: z.string()
          })
        )
        .optional()
    })
    .optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
      validation_errors: z.array(z.string()).optional(),
      posting_errors: z.array(z.string()).optional()
    })
    .optional(),
  metadata: z.object({
    api_version: z.literal('v2'),
    processing_time_ms: z.number(),
    smart_code: z.string(),
    organization_id: z.string().uuid(),
    processed_at: z.string().datetime()
  })
})

/**
 * Extract organization ID from JWT token
 */
async function getOrganizationFromJWT(authHeader: string): Promise<{
  organizationId?: string
  userId?: string
  error?: string
}> {
  try {
    if (!authHeader.startsWith('Bearer ')) {
      return { error: 'Invalid authorization header format' }
    }

    const token = authHeader.substring(7)

    // For development, accept a demo token format
    if (token.startsWith('demo-token-salon-')) {
      // Extract org info from demo token
      const parts = token.split('-')
      if (parts.length >= 4) {
        return {
          organizationId: 'demo-salon-org-uuid',
          userId: 'demo-user-uuid'
        }
      }
    }

    // In production, decode JWT and extract organization_id
    // For now, return demo values
    return {
      organizationId: 'demo-salon-org-uuid',
      userId: 'demo-user-uuid'
    }
  } catch (error) {
    return { error: 'JWT token validation failed' }
  }
}

/**
 * Validate organization access and permissions
 */
async function validateOrganizationAccess(
  jwtOrgId: string,
  requestOrgId: string,
  userId: string
): Promise<{ isValid: boolean; error?: string }> {
  // Ensure request organization matches JWT organization
  if (jwtOrgId !== requestOrgId) {
    return {
      isValid: false,
      error: 'Organization ID mismatch - cannot access data for different organization'
    }
  }

  // In production, check user permissions for finance operations
  // For now, allow all operations for demo
  return { isValid: true }
}

/**
 * Audit log finance operation
 */
async function auditFinanceOperation(
  organizationId: string,
  userId: string,
  operation: string,
  ufe: any,
  result: UFEProcessingResult
) {
  try {
    const { apiV2 } = await import('@/lib/client/fetchV2')

    // Create audit transaction
    await apiV2.post('transactions', {
      organization_id: organizationId,
      transaction_type: 'audit_log',
      transaction_date: new Date().toISOString().split('T')[0],
      total_amount: 0,
      smart_code: heraCode('HERA.SALON.FINANCE.AUDIT.UFE_PROCESS.V1'),
      description: `Finance operation: ${operation}`,
      source_entity_id: userId,
      metadata: {
        operation_type: operation,
        ufe_smart_code: ufe.smart_code,
        processing_result: result.success ? 'success' : 'failed',
        transaction_amount: ufe.total_amount,
        currency: ufe.transaction_currency_code,
        source_channel: ufe.business_context.channel,
        audit_timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('[UFE API] Audit logging failed:', error)
    // Don't fail the operation if audit logging fails
  }
}

/**
 * POST /api/v2/transactions/post
 * Process Universal Finance Event through Auto-Posting Engine
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  let organizationId = ''
  let smartCode = ''

  try {
    // 1. Validate API version header
    const headersList = headers()
    const apiVersion = headersList.get('x-hera-api-version')

    if (apiVersion !== 'v2') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_API_VERSION',
            message: 'This endpoint requires x-hera-api-version: v2 header'
          },
          metadata: {
            api_version: 'v2',
            processing_time_ms: Date.now() - startTime,
            smart_code: 'HERA.SALON.FINANCE.ERROR.API_VERSION.V1',
            organization_id: '',
            processed_at: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    // 2. Validate authorization
    const authHeader = headersList.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_AUTHORIZATION',
            message: 'Authorization header required'
          },
          metadata: {
            api_version: 'v2',
            processing_time_ms: Date.now() - startTime,
            smart_code: 'HERA.SALON.FINANCE.ERROR.AUTH_MISSING.V1',
            organization_id: '',
            processed_at: new Date().toISOString()
          }
        },
        { status: 401 }
      )
    }

    const authResult = await getOrganizationFromJWT(authHeader)
    if (authResult.error || !authResult.organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: authResult.error || 'Invalid authorization token'
          },
          metadata: {
            api_version: 'v2',
            processing_time_ms: Date.now() - startTime,
            smart_code: 'HERA.SALON.FINANCE.ERROR.AUTH_INVALID.V1',
            organization_id: '',
            processed_at: new Date().toISOString()
          }
        },
        { status: 401 }
      )
    }

    const jwtOrgId = authResult.organizationId
    const userId = authResult.userId!

    // 3. Parse and validate request body
    let requestBody: any
    try {
      requestBody = await request.json()
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON'
          },
          metadata: {
            api_version: 'v2',
            processing_time_ms: Date.now() - startTime,
            smart_code: 'HERA.SALON.FINANCE.ERROR.INVALID_JSON.V1',
            organization_id: jwtOrgId,
            processed_at: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    // 4. Validate UFE schema
    let ufe: any
    try {
      ufe = UFERequestSchema.parse(requestBody)
      organizationId = ufe.organization_id
      smartCode = ufe.smart_code
    } catch (zodError) {
      const validationErrors =
        zodError instanceof z.ZodError
          ? zodError.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          : ['Schema validation failed']

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_FAILED',
            message: 'Universal Finance Event validation failed',
            validation_errors: validationErrors
          },
          metadata: {
            api_version: 'v2',
            processing_time_ms: Date.now() - startTime,
            smart_code: 'HERA.SALON.FINANCE.ERROR.VALIDATION.V1',
            organization_id: jwtOrgId,
            processed_at: new Date().toISOString()
          }
        },
        { status: 400 }
      )
    }

    // 5. Validate organization access
    const accessValidation = await validateOrganizationAccess(jwtOrgId, organizationId, userId)
    if (!accessValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCESS_DENIED',
            message: accessValidation.error || 'Access denied to organization data'
          },
          metadata: {
            api_version: 'v2',
            processing_time_ms: Date.now() - startTime,
            smart_code: 'HERA.SALON.FINANCE.ERROR.ACCESS_DENIED.V1',
            organization_id: organizationId,
            processed_at: new Date().toISOString()
          }
        },
        { status: 403 }
      )
    }

    // 6. Process UFE through Auto-Posting Engine
    console.log(`[UFE API] Processing UFE for org ${organizationId}: ${smartCode}`)

    const processingResult = await processUniversalFinanceEvent(organizationId, ufe)

    // 7. Audit log the operation
    await auditFinanceOperation(organizationId, userId, 'UFE_PROCESS', ufe, processingResult)

    // 8. Return result
    const processingTime = Date.now() - startTime

    if (processingResult.success) {
      return NextResponse.json({
        success: true,
        data: {
          transaction_id: processingResult.transaction_id,
          journal_entry_id: processingResult.journal_entry_id,
          posting_period: processingResult.posting_period,
          gl_lines: processingResult.gl_lines
        },
        metadata: {
          api_version: 'v2',
          processing_time_ms: processingTime,
          smart_code: smartCode,
          organization_id: organizationId,
          processed_at: new Date().toISOString()
        }
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROCESSING_FAILED',
            message: processingResult.message || 'UFE processing failed',
            validation_errors: processingResult.validation_errors,
            posting_errors: processingResult.posting_errors
          },
          metadata: {
            api_version: 'v2',
            processing_time_ms: processingTime,
            smart_code: smartCode,
            organization_id: organizationId,
            processed_at: new Date().toISOString()
          }
        },
        { status: 422 }
      )
    }
  } catch (error) {
    console.error('[UFE API] Unexpected error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error processing UFE',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        metadata: {
          api_version: 'v2',
          processing_time_ms: Date.now() - startTime,
          smart_code: smartCode || 'HERA.SALON.FINANCE.ERROR.INTERNAL.V1',
          organization_id: organizationId,
          processed_at: new Date().toISOString()
        }
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v2/transactions/post
 * Return API documentation and examples
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/v2/transactions/post',
    method: 'POST',
    description: 'Process Universal Finance Events through Auto-Posting Engine',
    version: 'v2',
    documentation: {
      headers: {
        'x-hera-api-version': 'v2 (required)',
        authorization: 'Bearer <jwt_token> (required)',
        'content-type': 'application/json'
      },
      request_schema: {
        apiVersion: 'v2',
        organization_id: 'uuid',
        transaction_type: 'TX.FINANCE.{KIND}.V1',
        smart_code: 'HERA.SALON.FINANCE.TXN.{KIND}.{SUBKIND}.V1',
        transaction_date: 'YYYY-MM-DD',
        total_amount: 'positive number',
        transaction_currency_code: 'AED|USD|GBP|EUR',
        base_currency_code: 'AED|USD|GBP|EUR',
        exchange_rate: 'positive number (default: 1.0)',
        business_context: {
          channel: 'MCP|POS|BANK|MANUAL|IMPORT',
          note: 'optional description'
        },
        metadata: {
          ingest_source: 'system identifier',
          original_ref: 'optional source reference'
        },
        lines: '[] (must be empty - APE generates lines)'
      },
      examples: {
        expense: {
          apiVersion: 'v2',
          organization_id: 'demo-salon-org-uuid',
          transaction_type: 'TX.FINANCE.EXPENSE.V1',
          smart_code: 'HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1',
          transaction_date: '2025-10-05',
          total_amount: 15000,
          transaction_currency_code: 'AED',
          base_currency_code: 'AED',
          exchange_rate: 1.0,
          business_context: {
            channel: 'MCP',
            note: 'October payroll'
          },
          metadata: {
            ingest_source: 'MCP_Bank',
            original_ref: 'BNK:123/45'
          },
          lines: []
        },
        pos_eod: {
          apiVersion: 'v2',
          organization_id: 'demo-salon-org-uuid',
          transaction_type: 'TX.FINANCE.POS_EOD.V1',
          smart_code: 'HERA.SALON.FINANCE.TXN.POS.DAILY_SUMMARY.V1',
          transaction_date: '2025-10-05',
          total_amount: 10000,
          transaction_currency_code: 'AED',
          base_currency_code: 'AED',
          exchange_rate: 1.0,
          business_context: {
            channel: 'POS',
            branch_id: 'downtown-branch-uuid',
            is_eod_summary: true
          },
          metadata: {
            ingest_source: 'POS',
            original_ref: 'EOD-2025-10-05'
          },
          totals: {
            gross_sales: 10000,
            vat: 500,
            tips: 300,
            fees: 100,
            cash_collected: 2500,
            card_settlement: 7400
          },
          lines: []
        }
      },
      response_schema: {
        success: 'boolean',
        data: {
          transaction_id: 'uuid (if success)',
          journal_entry_id: 'uuid (if success)',
          posting_period: 'YYYY-MM (if success)',
          gl_lines: 'array of generated GL lines (if success)'
        },
        error: {
          code: 'error classification',
          message: 'human readable error',
          validation_errors: 'array of validation issues',
          posting_errors: 'array of posting issues'
        },
        metadata: {
          api_version: 'v2',
          processing_time_ms: 'number',
          smart_code: 'smart code from request',
          organization_id: 'organization uuid',
          processed_at: 'ISO datetime'
        }
      }
    },
    smart_codes: {
      expenses: [
        'HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1',
        'HERA.SALON.FINANCE.TXN.EXPENSE.COMMISSION.V1',
        'HERA.SALON.FINANCE.TXN.EXPENSE.RENT.V1',
        'HERA.SALON.FINANCE.TXN.EXPENSE.UTILITIES.V1',
        'HERA.SALON.FINANCE.TXN.EXPENSE.SUPPLIES.V1',
        'HERA.SALON.FINANCE.TXN.EXPENSE.MARKETING.V1',
        'HERA.SALON.FINANCE.TXN.EXPENSE.INSURANCE.V1',
        'HERA.SALON.FINANCE.TXN.EXPENSE.MAINTENANCE.V1'
      ],
      revenue: [
        'HERA.SALON.FINANCE.TXN.REVENUE.SERVICE.V1',
        'HERA.SALON.FINANCE.TXN.REVENUE.PRODUCT.V1',
        'HERA.SALON.FINANCE.TXN.REVENUE.PACKAGE.V1'
      ],
      pos: [
        'HERA.SALON.FINANCE.TXN.POS.DAILY_SUMMARY.V1',
        'HERA.SALON.FINANCE.TXN.POS.CASH_SALE.V1',
        'HERA.SALON.FINANCE.TXN.POS.CARD_SALE.V1'
      ],
      banking: [
        'HERA.SALON.FINANCE.TXN.BANK.FEE.V1',
        'HERA.SALON.FINANCE.TXN.BANK.TRANSFER.V1',
        'HERA.SALON.FINANCE.TXN.BANK.DEPOSIT.V1'
      ]
    }
  })
}
