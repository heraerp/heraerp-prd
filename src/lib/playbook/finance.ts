/**
 * HERA Playbook Finance API with Branch Accounting
 * Smart Code: HERA.LIB.PLAYBOOK.FINANCE.v1
 *
 * Provides financial posting operations with branch dimension:
 * - Enforces branch_id on relevant transactions
 * - Ensures consistent branch tracking across all lines
 * - Integrates with HERA guardrails
 */

import { universalApi } from '@/lib/universal-api-v2'
import { assertBranchOnEvent } from '@/lib/guardrails/branch'

// ================================================================================
// TYPE DEFINITIONS
// ================================================================================

export type BranchContext = {
  branch_id: string
}

export type PostEventInput = {
  organization_id: string
  transaction_type: string
  smart_code: string
  business_context?: Record<string, any>
  lines: Array<{
    line_number: number
    line_type: string
    line_amount: number
    smart_code: string
    line_data?: Record<string, any>
    entity_id?: string
    description?: string
    quantity?: number
    unit_amount?: number
    tax_amount?: number
  }>
  currency?: {
    transaction_currency_code?: string
    base_currency_code?: string
    exchange_rate?: number
  }
  transaction_date?: string
  reference_number?: string
  notes?: string
}

// ================================================================================
// BRANCH-AWARE FINANCIAL POSTING
// ================================================================================

/**
 * Post financial event with mandatory branch context
 * Ensures all lines carry the same branch_id as the transaction
 */
export async function postEventWithBranch(
  input: PostEventInput & { business_context: BranchContext }
) {
  const { business_context, lines, organization_id, transaction_type, smart_code } = input

  // Validate branch_id is present
  if (!business_context?.branch_id) {
    throw new Error('branch_id is required in business_context')
  }

  // Apply guardrail validation
  assertBranchOnEvent({
    transaction_type,
    business_context,
    lines
  })

  // Patch all lines to include branch_id
  const patchedLines = lines.map(l => ({
    ...l,
    line_data: {
      ...(l.line_data ?? {}),
      branch_id: business_context.branch_id
    }
  }))

  // Create the transaction with branch context
  return postEvent({
    ...input,
    lines: patchedLines,
    business_context: {
      ...business_context,
      branch_id: business_context.branch_id
    }
  })
}

/**
 * Core financial posting function
 * Creates transaction header and lines in universal tables
 */
export async function postEvent(input: PostEventInput) {
  const {
    organization_id,
    transaction_type,
    smart_code,
    business_context,
    lines,
    currency,
    transaction_date,
    reference_number,
    notes
  } = input

  try {
    // Set organization context
    universalApi.setOrganizationId(organization_id)

    // Calculate total amount from lines
    const total_amount = lines.reduce((sum, line) => sum + Math.abs(line.line_amount), 0)

    // Create transaction header
    const txnResponse = await universalApi.create('universal_transactions', {
      organization_id,
      transaction_type,
      transaction_code: reference_number || `${transaction_type}-${Date.now()}`,
      transaction_date: transaction_date || new Date().toISOString(),
      total_amount,
      smart_code,
      metadata: {
        ...business_context,
        currency,
        notes,
        posted_at: new Date().toISOString(),
        posted_by: 'PLAYBOOK_FINANCE'
      }
    })

    if (!txnResponse.success || !txnResponse.data) {
      throw new Error(`Failed to create transaction: ${txnResponse.error}`)
    }

    const transaction_id = txnResponse.data.id

    // Create transaction lines
    const linePromises = lines.map((line, idx) =>
      universalApi.create('universal_transaction_lines', {
        organization_id,
        transaction_id,
        line_number: line.line_number || idx + 1,
        line_type: line.line_type,
        line_amount: line.line_amount,
        line_entity_id: line.entity_id,
        quantity: line.quantity,
        unit_amount: line.unit_amount,
        smart_code: line.smart_code,
        metadata: {
          ...line.line_data,
          description: line.description,
          tax_amount: line.tax_amount
        }
      })
    )

    const lineResults = await Promise.all(linePromises)

    // Check all lines were created successfully
    const failedLines = lineResults.filter(r => !r.success)
    if (failedLines.length > 0) {
      console.error('Failed to create some transaction lines:', failedLines)
      throw new Error(`Failed to create ${failedLines.length} transaction lines`)
    }

    return {
      success: true,
      data: {
        transaction_id,
        lines_created: lineResults.length
      }
    }
  } catch (error) {
    console.error('Error posting financial event:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ================================================================================
// PLAYBOOK CLASS (for compatibility)
// ================================================================================

export class Playbook {
  static Finance = {
    postEvent,
    postEventWithBranch
  }
}
