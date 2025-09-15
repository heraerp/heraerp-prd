/**
 * Organization types for HERA ERP
 */

export interface Organization {
  id: string
  organization_name: string
  organization_code: string
  organization_type:
    | 'restaurant'
    | 'healthcare'
    | 'retail'
    | 'manufacturing'
    | 'services'
    | 'education'
    | 'nonprofit'
    | 'government'
    | 'finance'
    | 'technology'
  industry_classification: string

  // Business Information
  legal_name?: string
  tax_id?: string
  registration_number?: string

  // Address Information
  address?: any
  timezone?: string
  locale?: string
  currency_code?: string

  // Subscription & Billing
  subscription_tier?: 'trial' | 'starter' | 'professional' | 'enterprise' | 'custom'
  billing_info?: any
  subscription_started_at?: string
  subscription_expires_at?: string

  // AI Insights
  ai_insights?: any
  ai_confidence?: number
  ai_last_updated?: string

  // Configuration & Settings
  settings?: any
  features_enabled?: any
  integrations?: any

  // Compliance & Security
  compliance_requirements?: any
  data_retention_days?: number
  encryption_enabled?: boolean
  audit_enabled?: boolean

  // Performance Metrics
  monthly_transaction_limit?: number
  storage_limit_gb?: number
  user_limit?: number

  // Status & Lifecycle
  status?: 'active' | 'suspended' | 'cancelled' | 'archived'
  onboarding_completed?: boolean
  setup_completed?: boolean

  // Audit Trail
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}
