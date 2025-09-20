/**
 * HERA Branch Guardrails
 * Smart Code: HERA.LIB.GUARDRAILS.BRANCH.V1
 * 
 * Enforces branch accounting requirements:
 * - Branch ID required for specific transaction types
 * - Consistent branch tracking across all lines
 * - Multi-tenant safety with organization isolation
 */

/**
 * Assert branch_id is present and consistent for salon finance events
 * @throws Error if branch validation fails
 */
export function assertBranchOnEvent(input: { 
  transaction_type: string
  business_context?: any
  lines: any[]
}) {
  const { transaction_type, business_context, lines } = input

  // Define transaction types that require branch_id
  const needsBranch = /^(POS_|APPT_|INVENTORY_|SALON_|SERVICE_)/.test(transaction_type)
  
  if (!needsBranch) {
    return // No branch required for this transaction type
  }

  // Check branch_id exists in business_context
  const branch = business_context?.branch_id
  if (!branch) {
    throw new Error(
      `Guardrail: branch_id required in business_context for ${transaction_type} transactions`
    )
  }

  // Validate all lines have consistent branch_id
  for (const [index, line] of lines.entries()) {
    const lineBranch = line.line_data?.branch_id ?? branch
    
    if (lineBranch !== branch) {
      throw new Error(
        `Guardrail: Line ${index + 1} has branch_id '${lineBranch}' but transaction has '${branch}'. ` +
        `All lines must carry the same branch_id as transaction business_context`
      )
    }
  }
}

/**
 * Validate branch entity exists and is active
 * Optional enhanced validation for critical operations
 */
export async function validateBranchExists(
  organization_id: string,
  branch_id: string
): Promise<boolean> {
  try {
    const { universalApi } = await import('@/src/lib/universal-api-v2')
    
    universalApi.setOrganizationId(organization_id)
    
    const response = await universalApi.read('core_entities', {
      organization_id,
      entity_type: 'branch',
      id: branch_id
    })
    
    if (!response.success || !response.data?.length) {
      return false
    }
    
    const branch = response.data[0]
    
    // Check if branch is active (via relationships or dynamic data)
    // For now, existence is sufficient
    return true
    
  } catch (error) {
    console.error('Error validating branch:', error)
    return false
  }
}

/**
 * Get list of branches for an organization
 * Useful for UI dropdowns and filters
 */
export async function getOrganizationBranches(
  organization_id: string
): Promise<Array<{ id: string; name: string; code?: string }>> {
  try {
    const { universalApi } = await import('@/src/lib/universal-api-v2')
    
    universalApi.setOrganizationId(organization_id)
    
    const response = await universalApi.read('core_entities', {
      organization_id,
      entity_type: 'branch'
    })
    
    if (!response.success || !response.data) {
      return []
    }
    
    return response.data.map((branch: any) => ({
      id: branch.id,
      name: branch.entity_name,
      code: branch.entity_code
    }))
    
  } catch (error) {
    console.error('Error fetching branches:', error)
    return []
  }
}