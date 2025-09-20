/**
 * HERA Fiscal Year Close API Endpoint
 * Smart Code: HERA.FIN.API.CLOSE.YEAR.V1
 *
 * Handles year-end closing operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createFiscalCloseEngine } from '@/lib/dna/fiscal-year/fiscal-close-engine'
import { z } from 'zod'

// Request validation schema
const FiscalCloseRequestSchema = z.object({
  organization_id: z.string().uuid(),
  fiscal_year: z.number().int().min(2000).max(2099),
  close_as_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  retained_earnings_account_id: z.string().uuid(),
  current_year_earnings_account_id: z.string().uuid(),
  preview_only: z.boolean().optional().default(false),
  smart_code: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    // For now, we'll skip authentication check in this endpoint
    // In production, you should use the proper authentication from your app

    // Parse and validate request
    const body = await request.json()
    const validationResult = FiscalCloseRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const params = validationResult.data

    // Verify organization access
    // In production, check if user has access to the organization
    if (!params.organization_id) {
      return NextResponse.json({ error: 'Organization context required' }, { status: 400 })
    }

    // Create fiscal close engine
    const closeEngine = createFiscalCloseEngine(params.organization_id)

    // Execute year-end close
    const result = await closeEngine.executeYearEndClose({
      organization_id: params.organization_id,
      fiscal_year: params.fiscal_year,
      close_as_of: params.close_as_of,
      retained_earnings_account_id: params.retained_earnings_account_id,
      current_year_earnings_account_id: params.current_year_earnings_account_id,
      preview_only: params.preview_only,
      smart_code: params.smart_code
    })

    // Return appropriate response
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          journal_id: result.journal_id,
          transaction_code: result.transaction_code,
          total_revenue: result.total_revenue,
          total_expenses: result.total_expenses,
          net_income: result.net_income,
          closing_entries: result.closing_entries,
          preview_mode: params.preview_only
        }
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Fiscal close failed',
          validation_errors: result.validation_errors
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Fiscal close error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for checking close status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const fiscalYear = searchParams.get('fiscal_year')

    if (!organizationId || !fiscalYear) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Check authentication - simplified for now
    // In production, use proper authentication

    // In production, check the status of fiscal year close
    // For now, return mock data
    return NextResponse.json({
      success: true,
      data: {
        organization_id: organizationId,
        fiscal_year: parseInt(fiscalYear),
        status: 'open', // open | closing | closed
        last_close_date: null,
        last_close_journal: null
      }
    })
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
