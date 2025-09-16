import { NextRequest, NextResponse } from 'next/server'
import { guardrailAutoFix } from '@/lib/guardrails/auto-fix-service'
import { heraMetrics } from '@/lib/observability/metrics'
import { heraLogger } from '@/lib/observability/logger'
import { normalizeSmartCode, isValidSmartCode } from '@/lib/guardrails/smart-code-normalizer'
import { checkPeriodPostingAllowed } from '@/lib/guardrails/period-close-validator'
import { validateGLBalance, normalizeGLAccount } from '@/lib/guardrails/gl-balance-validator'

/**
 * POST /api/v1/guardrails/validate
 * Validate payload with guardrails (dry-run mode)
 */
export async function POST(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || 'unknown'
  const startTime = Date.now()

  try {
    const { table, payload, organization_id } = await request.json()

    if (!table || !payload) {
      return NextResponse.json(
        {
          type: 'https://hera.app/errors/bad-request',
          title: 'Invalid Request',
          status: 400,
          detail: 'table and payload are required'
        },
        { status: 400 }
      )
    }

    // Set organization context if provided
    if (organization_id) {
      guardrailAutoFix.setOrganizationContext(organization_id)
    }

    // Additional guardrail validations
    const guardrailErrors = []

    // 1. Smart code validation
    if (payload.smart_code) {
      try {
        payload.smart_code = normalizeSmartCode(payload.smart_code)
      } catch (error) {
        guardrailErrors.push({
          field: 'smart_code',
          message: 'Invalid smart code format. Use lowercase v (e.g., HERA.FIN.GL.JE.v1)',
          attempted_value: payload.smart_code
        })
      }
    }

    // 2. Entity type normalization
    if (table === 'core_entities' && payload.entity_type === 'gl_account') {
      payload.entity_type = normalizeGLAccount(payload.entity_type)
      guardrailErrors.push({
        field: 'entity_type',
        message: "Normalized 'gl_account' to 'account' per guardrail",
        fix_applied: true
      })
    }

    // 3. Period close validation for transactions
    if (table === 'universal_transactions' && payload.transaction_date) {
      const periodCheck = await checkPeriodPostingAllowed({
        organizationId: organization_id,
        transactionDate: payload.transaction_date,
        transactionType: payload.transaction_type || 'unknown',
        smartCode: payload.smart_code || ''
      })

      if (!periodCheck.allowed) {
        guardrailErrors.push({
          field: 'transaction_date',
          message: periodCheck.reason,
          severity: 'error'
        })
      }
    }

    // 4. GL balance validation
    if (
      table === 'universal_transactions' &&
      payload.smart_code?.includes('.GL.') &&
      payload.lines
    ) {
      const balanceCheck = validateGLBalance(payload.lines, payload.smart_code)

      if (!balanceCheck.is_balanced) {
        guardrailErrors.push({
          field: 'lines',
          message: 'GL entries must be balanced',
          details: balanceCheck.errors,
          severity: 'error'
        })
      }
    }

    // 5. Organization ID requirement
    if (!payload.organization_id) {
      guardrailErrors.push({
        field: 'organization_id',
        message: 'organization_id is required for all operations',
        severity: 'error'
      })
    }

    // Run auto-fix in dry-run mode
    const result = await guardrailAutoFix.autoFixPayload(table, payload, {
      user_id: request.headers.get('x-user-id') || undefined,
      session_org_id: organization_id,
      request_type: 'validate_dry_run'
    })

    const duration = Date.now() - startTime

    // Record metrics
    if (result.fixed) {
      heraMetrics.recordGuardrailAutofix(organization_id || 'unknown', table, 'dry_run')

      result.fixes_applied.forEach(fix => {
        heraMetrics.recordGuardrailAutofix(organization_id || 'unknown', table, fix.fix_type)
      })
    }

    heraMetrics.recordGuardrailValidation(
      table,
      result.validation_passed ? 'allowed' : 'blocked',
      duration
    )

    // Log validation
    heraLogger.info(
      'Guardrail validation completed',
      {
        table,
        fixes_applied: result.fixes_applied.length,
        validation_passed: result.validation_passed,
        duration_ms: duration
      },
      requestId
    )

    // Combine all errors
    const allErrors = [
      ...guardrailErrors.filter(e => e.severity === 'error'),
      ...(result.validation_passed
        ? []
        : [
            {
              field: 'validation',
              message: 'Payload validation failed after auto-fix attempts',
              fixes_attempted: result.fixes_applied
            }
          ])
    ]

    const isValid = allErrors.length === 0 && result.validation_passed

    return NextResponse.json({
      valid: isValid,
      fixes_applied: result.fixes_applied.length,
      corrected_payload: result.corrected,
      errors: allErrors,
      guardrail_violations: guardrailErrors,
      guardrail_id: requestId,
      ai_confidence:
        result.fixes_applied.length > 0
          ? result.fixes_applied.reduce((sum, f) => sum + f.confidence, 0) /
            result.fixes_applied.length
          : 1.0
    })
  } catch (error) {
    const duration = Date.now() - startTime

    heraLogger.error(
      'Guardrail validation failed',
      error as Error,
      {
        duration_ms: duration
      },
      requestId
    )

    heraMetrics.recordGuardrailBlock(
      request.headers.get('x-organization-id') || 'unknown',
      'unknown',
      'validation_error'
    )

    return NextResponse.json(
      {
        type: 'https://hera.app/errors/guardrail-error',
        title: 'Validation Error',
        status: 500,
        detail: 'Failed to validate payload',
        guardrail_id: requestId
      },
      { status: 500 }
    )
  }
}
