/**
 * HERA DNA SDK Constants
 * Shared constants and configurations
 */

// Export smart code regex pattern
export const SMART_CODE_REGEX = /^HERA\.[A-Z0-9]{2,15}(?:\.[A-Z0-9_]{2,30}){2,8}\.v[0-9]+$/;

// Export organization ID regex pattern  
export const ORGANIZATION_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Export entity types
export const ENTITY_TYPES = [
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
  'msg_template',
  'agent_queue'
] as const;

// Export transaction types
export const TRANSACTION_TYPES = [
  'sale',
  'purchase',
  'payment',
  'transfer',
  'journal_entry',
  'budget_line',
  'forecast_line',
  'MESSAGE_THREAD',
  'CAMPAIGN'
] as const;

// Export relationship types
export const RELATIONSHIP_TYPES = [
  'has_status',
  'parent_of',
  'reports_to',
  'customer_of',
  'vendor_of',
  'member_of',
  'assigned_to'
] as const;