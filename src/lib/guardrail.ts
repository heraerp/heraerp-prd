/**
 * HERA Guardrail Validation Utilities
 * Enforces HERA DNA principles for API v2
 */

// Smart code regex pattern
export const SMARTCODE_REGEX = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[vV][0-9]+$/

/**
 * Validate a universal event against basic requirements
 */
export function validateEvent(data: any): boolean {
  // Basic validation without schema dependency
  const errors = preflight(data)
  ;(validateEvent as any).errors = errors.map(err => ({ message: err }))
  return errors.length === 0
}

/**
 * Guardrail preflight checks for universal events
 */
export function preflight(event: any): string[] {
  const errors: string[] = []

  // TABLE-ONLY-6: Check that only sacred tables are referenced
  // This is enforced at DB level, but we can check entity types
  const validEntityTypes = [
    'customer',
    'vendor',
    'product',
    'employee',
    'gl_account',
    'budget',
    'forecast',
    'location',
    'project',
    'development_task',
    'user',
    'ai_agent',
    'workflow_status',
    'expense_category'
  ]

  // ORG-FILTER-REQUIRED: Organization ID must be present
  if (!event.organization_id) {
    errors.push('ORG-FILTER-REQUIRED: organization_id is required')
  }

  // SMARTCODE-PRESENT: Smart code must be valid
  if (!event.smart_code || !SMARTCODE_REGEX.test(event.smart_code)) {
    errors.push('SMARTCODE-PRESENT: smart_code must match HERA pattern')
  }

  // TXN-HEADER-REQUIRED: Transaction header fields
  if (!event.transaction_type) {
    errors.push('TXN-HEADER-REQUIRED: transaction_type is required')
  }
  if (!event.transaction_date) {
    errors.push('TXN-HEADER-REQUIRED: transaction_date is required')
  }

  // TXN-LINE-REQUIRED: At least one line is required
  if (!event.lines || !Array.isArray(event.lines) || event.lines.length === 0) {
    errors.push('TXN-LINE-REQUIRED: at least one transaction line is required')
  }

  // GL-BALANCED: Check if this is a financial transaction that needs balancing
  if (event.smart_code?.includes('.FIN.') || event.smart_code?.includes('.GL.')) {
    const totalDebits =
      event.lines
        ?.filter((line: any) => line.line_type === 'debit')
        ?.reduce((sum: number, line: any) => sum + (line.line_amount || 0), 0) || 0

    const totalCredits =
      event.lines
        ?.filter((line: any) => line.line_type === 'credit')
        ?.reduce((sum: number, line: any) => sum + (line.line_amount || 0), 0) || 0

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      errors.push(`GL-BALANCED: debits (${totalDebits}) must equal credits (${totalCredits})`)
    }
  }

  return errors
}

/**
 * Validate entity upsert guardrails
 */
export function validateEntityUpsert(data: any): string[] {
  const errors: string[] = []

  if (!data.organization_id) {
    errors.push('organization_id is required')
  }

  if (!data.entity_type) {
    errors.push('entity_type is required')
  }

  if (!data.entity_name) {
    errors.push('entity_name is required')
  }

  if (!data.smart_code || !SMARTCODE_REGEX.test(data.smart_code)) {
    errors.push('smart_code must match HERA pattern')
  }

  return errors
}

/**
 * Validate relationship upsert guardrails
 */
export function validateRelationshipUpsert(data: any): string[] {
  const errors: string[] = []

  if (!data.organization_id) {
    errors.push('organization_id is required')
  }

  if (!data.from_entity_id) {
    errors.push('from_entity_id is required')
  }

  if (!data.to_entity_id) {
    errors.push('to_entity_id is required')
  }

  if (!data.relationship_type) {
    errors.push('relationship_type is required')
  }

  if (!data.smart_code || !SMARTCODE_REGEX.test(data.smart_code)) {
    errors.push('smart_code must match HERA pattern')
  }

  return errors
}
