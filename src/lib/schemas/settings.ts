// ================================================================================
// SETTINGS SCHEMAS - ZOD VALIDATION
// Smart Code: HERA.SCHEMAS.SETTINGS.v1
// Production-ready schemas for organization settings using Sacred Six only
// ================================================================================

import { z } from 'zod'

export const SalesPolicy = z.object({
  vat_rate: z
    .number()
    .min(0, 'VAT rate cannot be negative')
    .max(1, 'VAT rate cannot exceed 100%')
    .default(0.05),
  commission_rate: z
    .number()
    .min(0, 'Commission rate cannot be negative')
    .max(1, 'Commission rate cannot exceed 100%')
    .default(0.35),
  include_tips_in_commission: z.boolean().default(false),
  tips_enabled: z.boolean().default(true),
  auto_calculate_tax: z.boolean().default(true),
  tax_inclusive_pricing: z.boolean().default(false),
  discount_policy: z
    .object({
      max_discount_percent: z.number().min(0).max(100).default(20),
      requires_manager_approval: z.boolean().default(true),
      approval_threshold_percent: z.number().min(0).max(100).default(10)
    })
    .default({}),
  payment_methods: z
    .array(z.enum(['cash', 'card', 'digital_wallet', 'bank_transfer']))
    .default(['cash', 'card']),
  currency: z.string().length(3, 'Currency must be 3-letter code').default('AED'),
  updated_at: z.string().optional(),
  updated_by: z.string().optional()
})
export type SalesPolicy = z.infer<typeof SalesPolicy>

export const Branch = z.object({
  organization_id: z.string().uuid('Invalid organization ID'),
  entity_type: z.literal('branch').default('branch'),
  entity_code: z
    .string()
    .min(2, 'Branch code must be at least 2 characters')
    .regex(/^[A-Z0-9_]+$/, 'Branch code must be uppercase alphanumeric with underscores'),
  entity_name: z.string().min(2, 'Branch name must be at least 2 characters'),
  smart_code: z.string().startsWith('HERA.', 'Smart code must start with HERA.'),
  location: z
    .object({
      address: z.string().optional(),
      city: z.string().optional(),
      country: z.string().optional(),
      postal_code: z.string().optional(),
      coordinates: z
        .object({
          lat: z.number().optional(),
          lng: z.number().optional()
        })
        .optional()
    })
    .optional(),
  contact: z
    .object({
      phone: z.string().optional(),
      email: z.string().email().optional(),
      manager: z.string().optional()
    })
    .optional(),
  operating_hours: z
    .object({
      monday: z.string().optional(),
      tuesday: z.string().optional(),
      wednesday: z.string().optional(),
      thursday: z.string().optional(),
      friday: z.string().optional(),
      saturday: z.string().optional(),
      sunday: z.string().optional()
    })
    .optional(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional()
})
export type Branch = z.infer<typeof Branch>

export const UserRole = z.enum(['owner', 'manager', 'stylist', 'cashier', 'receptionist', 'admin'])
export type UserRole = z.infer<typeof UserRole>

export const RoleGrant = z.object({
  user_email: z.string().email('Invalid email address'),
  user_name: z.string().optional(),
  roles: z.array(UserRole).min(1, 'At least one role must be assigned'),
  branch_codes: z.array(z.string()).optional(), // Restrict to specific branches
  permissions: z.array(z.string()).optional(), // Custom permissions
  is_active: z.boolean().default(true),
  granted_by: z.string().optional(),
  granted_at: z.string().optional(),
  expires_at: z.string().optional()
})
export type RoleGrant = z.infer<typeof RoleGrant>

export const NotificationPolicy = z.object({
  // Appointment notifications
  appointment_confirmed: z
    .object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['email', 'sms', 'whatsapp', 'in_app'])).default(['email']),
      timing_minutes_before: z.number().min(0).max(1440).default(60) // 1 day max
    })
    .default({}),

  appointment_reminder: z
    .object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['email', 'sms', 'whatsapp', 'in_app'])).default(['sms']),
      timing_minutes_before: z.number().min(0).max(1440).default(60)
    })
    .default({}),

  appointment_cancelled: z
    .object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['email', 'sms', 'whatsapp', 'in_app'])).default(['email', 'sms'])
    })
    .default({}),

  // Payment notifications
  pos_payment_received: z
    .object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['email', 'sms', 'whatsapp', 'in_app'])).default(['email']),
      send_receipt: z.boolean().default(true)
    })
    .default({}),

  payment_failed: z
    .object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['email', 'sms', 'whatsapp', 'in_app'])).default(['email'])
    })
    .default({}),

  // Inventory notifications
  low_stock_alert: z
    .object({
      enabled: z.boolean().default(true),
      channels: z
        .array(z.enum(['email', 'sms', 'whatsapp', 'in_app']))
        .default(['email', 'in_app']),
      threshold_quantity: z.number().min(0).default(5),
      recipients: z.array(z.string().email()).optional()
    })
    .default({}),

  // Daily reports
  end_of_day_report: z
    .object({
      enabled: z.boolean().default(true),
      channels: z.array(z.enum(['email', 'sms', 'whatsapp', 'in_app'])).default(['email']),
      send_time: z.string().default('20:00'), // 8 PM
      recipients: z.array(z.string().email()).optional()
    })
    .default({}),

  // Marketing
  promotional_campaigns: z
    .object({
      enabled: z.boolean().default(false),
      channels: z.array(z.enum(['email', 'sms', 'whatsapp', 'in_app'])).default(['email'])
    })
    .default({}),

  updated_at: z.string().optional(),
  updated_by: z.string().optional()
})
export type NotificationPolicy = z.infer<typeof NotificationPolicy>

export const SystemSettings = z.object({
  organization_info: z
    .object({
      name: z.string(),
      code: z.string(),
      registration_number: z.string().optional(),
      tax_number: z.string().optional(),
      industry: z.string().optional(),
      established_date: z.string().optional(),
      website: z.string().url().optional(),
      logo_url: z.string().url().optional()
    })
    .optional(),

  feature_flags: z
    .object({
      finance_dna: z.boolean().default(true),
      auto_journal: z.boolean().default(true),
      commissions: z.boolean().default(true),
      whatsapp_integration: z.boolean().default(false),
      advanced_reporting: z.boolean().default(true),
      multi_currency: z.boolean().default(false),
      inventory_management: z.boolean().default(true),
      appointment_booking: z.boolean().default(true),
      staff_management: z.boolean().default(true),
      customer_portal: z.boolean().default(false)
    })
    .default({}),

  security_settings: z
    .object({
      session_timeout_minutes: z.number().min(15).max(480).default(120), // 2 hours
      password_policy: z
        .object({
          min_length: z.number().min(6).max(50).default(8),
          require_uppercase: z.boolean().default(true),
          require_lowercase: z.boolean().default(true),
          require_numbers: z.boolean().default(true),
          require_symbols: z.boolean().default(false)
        })
        .default({}),
      two_factor_auth: z
        .object({
          enabled: z.boolean().default(false),
          methods: z.array(z.enum(['sms', 'email', 'app'])).default(['email'])
        })
        .default({})
    })
    .default({}),

  backup_settings: z
    .object({
      auto_backup: z.boolean().default(true),
      backup_frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
      retention_days: z.number().min(7).max(365).default(30)
    })
    .default({}),

  updated_at: z.string().optional(),
  updated_by: z.string().optional()
})
export type SystemSettings = z.infer<typeof SystemSettings>

export const PermissionSet = z.object({
  // Core permissions
  can_view_dashboard: z.boolean().default(true),
  can_manage_appointments: z.boolean().default(false),
  can_manage_customers: z.boolean().default(false),
  can_process_payments: z.boolean().default(false),
  can_manage_inventory: z.boolean().default(false),

  // Financial permissions
  can_view_reports: z.boolean().default(false),
  can_export_data: z.boolean().default(false),
  can_manage_pricing: z.boolean().default(false),
  can_apply_discounts: z.boolean().default(false),
  can_refund_payments: z.boolean().default(false),

  // Administrative permissions
  can_manage_staff: z.boolean().default(false),
  can_manage_roles: z.boolean().default(false),
  can_manage_settings: z.boolean().default(false),
  can_manage_integrations: z.boolean().default(false),
  can_access_audit_logs: z.boolean().default(false),

  // Branch-specific permissions
  can_manage_all_branches: z.boolean().default(false),
  restricted_branches: z.array(z.string()).optional()
})
export type PermissionSet = z.infer<typeof PermissionSet>

// Role-based default permissions
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, PermissionSet> = {
  owner: {
    can_view_dashboard: true,
    can_manage_appointments: true,
    can_manage_customers: true,
    can_process_payments: true,
    can_manage_inventory: true,
    can_view_reports: true,
    can_export_data: true,
    can_manage_pricing: true,
    can_apply_discounts: true,
    can_refund_payments: true,
    can_manage_staff: true,
    can_manage_roles: true,
    can_manage_settings: true,
    can_manage_integrations: true,
    can_access_audit_logs: true,
    can_manage_all_branches: true
  },
  manager: {
    can_view_dashboard: true,
    can_manage_appointments: true,
    can_manage_customers: true,
    can_process_payments: true,
    can_manage_inventory: true,
    can_view_reports: true,
    can_export_data: true,
    can_manage_pricing: false,
    can_apply_discounts: true,
    can_refund_payments: true,
    can_manage_staff: false,
    can_manage_roles: false,
    can_manage_settings: false,
    can_manage_integrations: false,
    can_access_audit_logs: false,
    can_manage_all_branches: false
  },
  stylist: {
    can_view_dashboard: true,
    can_manage_appointments: true,
    can_manage_customers: true,
    can_process_payments: false,
    can_manage_inventory: false,
    can_view_reports: false,
    can_export_data: false,
    can_manage_pricing: false,
    can_apply_discounts: false,
    can_refund_payments: false,
    can_manage_staff: false,
    can_manage_roles: false,
    can_manage_settings: false,
    can_manage_integrations: false,
    can_access_audit_logs: false,
    can_manage_all_branches: false
  },
  cashier: {
    can_view_dashboard: true,
    can_manage_appointments: false,
    can_manage_customers: true,
    can_process_payments: true,
    can_manage_inventory: false,
    can_view_reports: false,
    can_export_data: false,
    can_manage_pricing: false,
    can_apply_discounts: false,
    can_refund_payments: false,
    can_manage_staff: false,
    can_manage_roles: false,
    can_manage_settings: false,
    can_manage_integrations: false,
    can_access_audit_logs: false,
    can_manage_all_branches: false
  },
  receptionist: {
    can_view_dashboard: true,
    can_manage_appointments: true,
    can_manage_customers: true,
    can_process_payments: false,
    can_manage_inventory: false,
    can_view_reports: false,
    can_export_data: false,
    can_manage_pricing: false,
    can_apply_discounts: false,
    can_refund_payments: false,
    can_manage_staff: false,
    can_manage_roles: false,
    can_manage_settings: false,
    can_manage_integrations: false,
    can_access_audit_logs: false,
    can_manage_all_branches: false
  },
  admin: {
    can_view_dashboard: true,
    can_manage_appointments: true,
    can_manage_customers: true,
    can_process_payments: true,
    can_manage_inventory: true,
    can_view_reports: true,
    can_export_data: true,
    can_manage_pricing: true,
    can_apply_discounts: true,
    can_refund_payments: true,
    can_manage_staff: true,
    can_manage_roles: true,
    can_manage_settings: true,
    can_manage_integrations: true,
    can_access_audit_logs: true,
    can_manage_all_branches: true
  }
}

// Smart code constants for settings
export const SETTINGS_SMART_CODES = {
  SALES_POLICY_UPDATE: 'HERA.ORG.SETTINGS.SALES_POLICY.UPDATE.V1',
  BRANCH_CREATE: 'HERA.ORG.BRANCH.CREATE.v1',
  BRANCH_UPDATE: 'HERA.ORG.BRANCH.UPDATE.v1',
  ROLE_GRANT: 'HERA.ORG.ROLES.GRANT.v1',
  ROLE_REVOKE: 'HERA.ORG.ROLES.REVOKE.v1',
  NOTIFICATION_POLICY_UPDATE: 'HERA.ORG.SETTINGS.NOTIFICATIONS.UPDATE.V1',
  SYSTEM_SETTINGS_UPDATE: 'HERA.ORG.SETTINGS.SYSTEM.UPDATE.V1'
} as const

// Dynamic data keys for Sacred Six storage
export const SETTINGS_DYNAMIC_DATA_KEYS = {
  SALES_POLICY: 'SALES_POLICY.v1',
  ROLE_GRANTS: 'ROLE_GRANTS.v1',
  NOTIFICATION_POLICY: 'NOTIFICATION_POLICY.v1',
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS.v1',
  FEATURE_FLAGS: 'FEATURE_FLAGS.v1'
} as const
