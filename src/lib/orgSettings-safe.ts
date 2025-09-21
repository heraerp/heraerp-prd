/**
 * Safe Organization Settings API
 * Handles RLS errors gracefully during migration
 */

import { universalApi } from './universal-api-v2'
import { Organization } from '@/types/organization'

// Default policies to use when RLS blocks access
const DEFAULT_POLICIES = {
  SALES_POLICY: {
    allow_negative_quantity: false,
    allow_backorders: false,
    require_customer: true,
    auto_reserve_inventory: true,
    payment_terms_days: 30,
    default_tax_rate: 0.05
  },
  INVENTORY_POLICY: {
    track_inventory: true,
    allow_negative_stock: false,
    reorder_point_multiplier: 2,
    safety_stock_days: 7,
    auto_reorder: false
  },
  NOTIFICATION_POLICY: {
    email_on_order: true,
    email_on_payment: true,
    email_on_low_stock: true,
    sms_enabled: false,
    notification_email: 'admin@example.com'
  },
  SYSTEM_SETTINGS: {
    timezone: 'UTC',
    date_format: 'YYYY-MM-DD',
    currency: 'USD',
    language: 'en',
    fiscal_year_start: 1
  },
  ROLE_GRANTS: {
    admin: ['all'],
    manager: ['read', 'write'],
    user: ['read'],
    guest: []
  }
}

export async function getSafeOrgPolicy(organizationId: string, policyName: string): Promise<any> {
  try {
    console.log(`💰 Getting ${policyName} policy:`, { organizationId })

    const result = await universalApi.getDynamicData(organizationId, `${policyName}.v1`)

    // If we got data, return it
    if (result.success && result.data?.field_value_json) {
      return result.data.field_value_json
    }

    // Return defaults if no data (due to RLS or missing record)
    console.log(`📦 Using default ${policyName} policy (RLS safe mode)`)
    return DEFAULT_POLICIES[policyName as keyof typeof DEFAULT_POLICIES] || {}
  } catch (error) {
    console.warn(`⚠️ Failed to get ${policyName} policy, using defaults:`, error)
    return DEFAULT_POLICIES[policyName as keyof typeof DEFAULT_POLICIES] || {}
  }
}

// Export convenient functions for each policy type
export const getSalesPolicy = (orgId: string) => getSafeOrgPolicy(orgId, 'SALES_POLICY')
export const getInventoryPolicy = (orgId: string) => getSafeOrgPolicy(orgId, 'INVENTORY_POLICY')
export const getNotificationPolicy = (orgId: string) =>
  getSafeOrgPolicy(orgId, 'NOTIFICATION_POLICY')
export const getSystemSettings = (orgId: string) => getSafeOrgPolicy(orgId, 'SYSTEM_SETTINGS')
export const getRoleGrants = (orgId: string) => getSafeOrgPolicy(orgId, 'ROLE_GRANTS')
