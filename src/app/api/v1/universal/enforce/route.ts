/**
 * 🔐 HERA Universal Transaction Enforcement API
 * Smart Code: HERA.API.UNIVERSAL.ENFORCEMENT.v1
 *
 * Mandatory middleware for ALL transaction creation
 * Ensures COA and Document Number compliance
 */

import { NextRequest, NextResponse } from 'next/server'
import { enforceTransactionStandards } from '@/src/lib/coa-document-enforcement'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationId,
      transactionType,
      businessType = 'universal',
      lineItems = [],
      validateOnly = false
    } = body

    // Validate required parameters
    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 })
    }

    if (!transactionType) {
      return NextResponse.json({ error: 'transactionType is required' }, { status: 400 })
    }

    // Run enforcement checks
    const result = await enforceTransactionStandards(
      organizationId,
      transactionType,
      businessType,
      lineItems
    )

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          errors: result.errors,
          enforcement_failed: true,
          message: 'Transaction enforcement failed - COA or document number issues'
        },
        { status: 422 }
      )
    }

    // Return successful enforcement result
    return NextResponse.json({
      success: true,
      valid: true,
      enforcement_passed: true,
      document_numbers: result.documentNumbers,
      enhanced_line_items: result.enhancedLines,
      validation: {
        coa_exists: true,
        document_numbers_generated: true,
        gl_accounts_validated: lineItems.length > 0,
        auto_assignments_made: result.enhancedLines.length > lineItems.length
      },
      message: validateOnly
        ? 'Transaction passes all enforcement checks'
        : 'Transaction ready for processing with enforced standards'
    })
  } catch (error) {
    console.error('Transaction enforcement error:', error)
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: 'Transaction enforcement system error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Return enforcement system status and configuration
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')
  const businessType = searchParams.get('businessType') || 'universal'

  if (!organizationId) {
    return NextResponse.json({
      enforcement_system: {
        version: '1.0.0',
        smart_code: 'HERA.API.UNIVERSAL.ENFORCEMENT.v1',
        features: [
          'COA existence validation',
          'Document number generation',
          'GL account validation',
          'Auto-assignment of GL accounts',
          'Smart code integration',
          'Multi-tenant isolation'
        ],
        supported_business_types: [
          'universal',
          'salon',
          'restaurant',
          'healthcare',
          'retail',
          'manufacturing',
          'professional'
        ],
        document_number_formats: {
          journal_entry: 'JE-YYYY-MM-NNN',
          sale: 'INV-YYYYMMDD-NNN',
          purchase: 'PO-YYYY-NNNN',
          payment: 'PAY-YYYYMM-NNN',
          receipt: 'RCP-YYYYMM-NNN'
        }
      }
    })
  }

  try {
    // Return organization-specific enforcement status
    const { COADocumentEnforcer } = await import('@/lib/coa-document-enforcement')
    const enforcer = new COADocumentEnforcer(organizationId, businessType)

    const coaValidation = await enforcer.validateCOAExists()

    return NextResponse.json({
      organization_id: organizationId,
      business_type: businessType,
      enforcement_status: {
        coa_exists: coaValidation.organization_has_coa,
        coa_complete: coaValidation.valid,
        missing_accounts: coaValidation.missing_accounts,
        ready_for_transactions: coaValidation.valid,
        document_numbering: 'active'
      },
      last_checked: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        organization_id: organizationId,
        error: 'Unable to check enforcement status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
