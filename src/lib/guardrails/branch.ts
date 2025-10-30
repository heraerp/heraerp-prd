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
 * ✅ Uses RPC API v2 (client-safe, no direct Supabase queries)
 */
export async function validateBranchExists(
  organization_id: string,
  branch_id: string
): Promise<boolean> {
  try {
    const { getEntities } = await import('@/lib/universal-api-v2-client')

    const branches = await getEntities('', {
      p_organization_id: organization_id,
      p_entity_type: 'BRANCH',
      p_status: null // Check all branches regardless of status
    })

    // Check if the specific branch ID exists
    const branch = branches.find((b: any) => b.id === branch_id)

    if (!branch) {
      console.log('[validateBranchExists] Branch not found:', branch_id)
      return false
    }

    console.log('[validateBranchExists] Branch found:', {
      id: branch.id,
      name: branch.entity_name
    })

    // Check if branch is active (via relationships or dynamic data)
    // For now, existence is sufficient
    return true
  } catch (error) {
    console.error('Error validating branch:', error)
    return false
  }
}

/**
 * Get list of branches for an organization with dynamic fields
 * Useful for UI dropdowns and filters
 * ✅ Uses RPC API v2 (client-safe, no direct Supabase queries)
 * ✅ Includes opening_time and closing_time dynamic fields
 */
export async function getOrganizationBranches(
  organization_id: string
): Promise<
  Array<{
    id: string
    name: string
    code?: string
    metadata?: any
    opening_time?: string
    closing_time?: string
  }>
> {
  try {
    const { getEntities } = await import('@/lib/universal-api-v2-client')

    const branches = await getEntities('', {
      p_organization_id: organization_id,
      p_entity_type: 'BRANCH',
      p_include_dynamic: true, // Include dynamic fields
      p_status: 'active' // Only active branches
    })

    // Map to expected format with dynamic fields
    return branches.map((branch: any) => {
      const result: any = {
        id: branch.id,
        name: branch.entity_name,
        code: branch.entity_code,
        metadata: branch.metadata
      }

      // ✅ Transform dynamic_fields array to top-level properties
      if (Array.isArray(branch.dynamic_fields)) {
        console.log('[getOrganizationBranches] 🔧 Transforming dynamic_fields for branch:', branch.entity_name)
        branch.dynamic_fields.forEach((field: any) => {
          const value = field.field_value_text ||
                       field.field_value_number ||
                       field.field_value_boolean ||
                       field.field_value_date ||
                       field.field_value_json ||
                       null

          if (field.field_name && value !== null) {
            result[field.field_name] = value
            console.log(`[getOrganizationBranches]   - ${field.field_name} = ${value}`)
          }
        })
      }
      // ✅ FALLBACK: Check metadata for opening/closing times (legacy support)
      else if (branch.metadata && typeof branch.metadata === 'object') {
        console.log('[getOrganizationBranches] ⚠️ No dynamic_fields array, checking metadata')
        if (branch.metadata.opening_time) {
          result.opening_time = branch.metadata.opening_time
          console.log(`[getOrganizationBranches]   - opening_time from metadata = ${branch.metadata.opening_time}`)
        }
        if (branch.metadata.closing_time) {
          result.closing_time = branch.metadata.closing_time
          console.log(`[getOrganizationBranches]   - closing_time from metadata = ${branch.metadata.closing_time}`)
        }
      }

      return result
    })
  } catch (error) {
    console.error('[getOrganizationBranches] Error fetching branches:', error)
    return []
  }
}
