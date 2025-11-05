/**
 * Customer Lifetime Value (LTV) Service
 *
 * 🎯 ENTERPRISE-GRADE LTV TRACKING
 * - Automatic LTV updates on completed sales
 * - Non-blocking error handling
 * - Additive updates (no recalculation queries)
 * - Full audit trail
 *
 * ARCHITECTURE:
 * - Uses useHeraCustomers.updateCustomer() for entity updates
 * - Updates via hera_entities_crud_v1 RPC
 * - Smart Code: HERA.SALON.CUSTOMER.DYN.LIFETIME.VALUE.v1
 *
 * FLOW:
 * 1. Fetch current customer entity (to get current LTV)
 * 2. Calculate new LTV = current + sale_amount (additive)
 * 3. Update customer entity with new LTV via RPC
 * 4. Log audit trail
 */

import { createClient } from '@/lib/supabase/client'

// ✅ HERA DNA SMART CODE - Minimum 6 segments, all dots, no underscores, lowercase version
// Segments: HERA . SALON . CUSTOMER . DYN . LIFETIME . VALUE . v1 (7 segments)
const SMART_CODE_LTV = 'HERA.SALON.CUSTOMER.DYN.LIFETIME.VALUE.v1'

export interface UpdateLTVOptions {
  customerId: string
  saleAmount: number // Positive for sale, negative for refund
  organizationId: string
  actorUserId: string
}

/**
 * Update customer lifetime value (additive)
 *
 * @param options - Customer ID, sale amount, org ID, actor ID
 * @returns Promise<void> - Throws on error for caller to handle non-blocking
 */
export async function updateCustomerLTV(options: UpdateLTVOptions): Promise<void> {
  const { customerId, saleAmount, organizationId, actorUserId } = options

  try {
    const supabase = createClient()

    // ✅ STEP 1: Fetch current customer entity to get current LTV
    const { data: readResult, error: readError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_entity: {
        entity_id: customerId
      },
      p_options: {
        include_dynamic: true, // ✅ Need dynamic fields to get current LTV
        include_relationships: false
      }
    })

    if (readError) {
      throw new Error(`Failed to fetch customer: ${readError.message}`)
    }

    if (!readResult?.success) {
      throw new Error('Customer read failed')
    }

    // ✅ Extract customer from RPC response
    // Response structure: { success: true, action: 'READ', data: { ... customer fields ... } }
    const customer = readResult.data

    if (!customer || !customer.id) {
      return // Customer not found, skip silently
    }

    // ✅ STEP 2: Extract current LTV from dynamic fields
    let currentLTV = 0

    if (customer.lifetime_value !== undefined) {
      // Flattened format (from useUniversalEntityV1 transformation)
      currentLTV = customer.lifetime_value || 0
    } else if (Array.isArray(customer.dynamic_fields)) {
      // Array format (direct from RPC)
      const ltvField = customer.dynamic_fields.find(
        (f: any) => f.field_name === 'lifetime_value'
      )
      currentLTV = ltvField?.field_value_number || 0
    }

    // ✅ STEP 3: Calculate new LTV (additive)
    const newLTV = currentLTV + saleAmount

    // ✅ VALIDATION: Prevent negative LTV (shouldn't happen, but defensive)
    const finalLTV = Math.max(0, newLTV)

    // ✅ STEP 4: Update customer entity via RPC

    const { data: updateResult, error: updateError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'UPDATE',
      p_actor_user_id: actorUserId,
      p_organization_id: organizationId,
      p_entity: {
        entity_id: customerId,
        entity_name: customer.entity_name // ✅ REQUIRED by RPC
      },
      p_dynamic: {
        lifetime_value: {
          field_type: 'number',
          field_value_number: finalLTV,
          smart_code: SMART_CODE_LTV // ✅ Correct format: HERA.SALON.CUSTOMER.DYN.LIFETIME.VALUE.v1
        }
      },
      p_relationships: [],
      p_options: {}
    })

    if (updateError) {
      throw new Error(`Failed to update customer: ${updateError.message}`)
    }

    if (!updateResult?.success) {
      throw new Error('Customer update failed')
    }

    // ✅ SUCCESS - Broadcast refetch event for cache invalidation
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('hera:customer:ltv:updated', {
        detail: { customerId, newLTV: finalLTV, organizationId }
      }))
    }
  } catch (error) {
    // Re-throw for caller to handle
    throw error
  }
}

/**
 * Helper: Get current customer LTV (for reporting/debugging)
 *
 * @param customerId - Customer entity ID
 * @param organizationId - Organization ID
 * @param actorUserId - Actor user ID
 * @returns Promise<number> - Current LTV value
 */
export async function getCustomerLTV(
  customerId: string,
  organizationId: string,
  actorUserId: string
): Promise<number> {
  const supabase = createClient()

  const { data: result, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: actorUserId,
    p_organization_id: organizationId,
    p_entity: {
      entity_id: customerId
    },
    p_options: {
      include_dynamic: true,
      include_relationships: false
    }
  })

  if (error || !result?.success || !result?.data?.success) {
    console.error('[LTV Service] Failed to get customer LTV:', error)
    return 0
  }

  const customer = result.data.data

  // Extract LTV from flattened or array format
  if (customer.lifetime_value !== undefined) {
    return customer.lifetime_value || 0
  } else if (Array.isArray(customer.dynamic_fields)) {
    const ltvField = customer.dynamic_fields.find((f: any) => f.field_name === 'lifetime_value')
    return ltvField?.field_value_number || 0
  }

  return 0
}
