/**
 * 🧬 HERA Universal API
 * 
 * This is the main Universal API interface that delegates to the enterprise-grade v2 implementation.
 * Maintains backwards compatibility while providing standardized responses across all 6 sacred tables.
 */

// Re-export v2 implementation
export * from './universal-api-v2'
export { universalApi } from './universal-api-v2'

// Legacy type exports for backwards compatibility
export interface WizardStepData {
  organization_id: string
  wizard_session_id: string
  step: string
  data: any
  metadata?: {
    ingest_source: string
    step_completion_time: string
  }
}

export interface ActivateOrganizationData {
  organization_id: string
  wizard_data: any
  wizard_session_id: string
}

export interface COATemplateRequest {
  industry: string
  country: string
  currency: string
}