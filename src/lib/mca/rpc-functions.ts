/**
 * HERA MCA RPC Functions
 * GDPR-first consent management and automation workflows
 * 
 * Smart Code: HERA.CRM.MCA.RPC.CORE.V1
 */

import { supabase } from '@/lib/supabase/client'

// Types for MCA RPC Functions
export interface ConsentCheckParams {
  contact_id: string
  channel: 'email' | 'sms' | 'whatsapp' | 'push'
  purpose: string
  organization_id: string
}

export interface ConsentCheckResult {
  can_message: boolean
  reason: string
  consent_status: 'given' | 'revoked' | 'suppressed' | 'not_found'
  legal_basis: 'consent' | 'contract' | 'legitimate_interest' | null
  expires_at: string | null
}

export interface SegmentCompileParams {
  segment_id: string
  organization_id: string
  test_mode?: boolean
  limit?: number
}

export interface SegmentCompileResult {
  audience_count: number
  sample_contacts: Array<{
    contact_id: string
    entity_name: string
    email?: string
  }>
  compilation_time_ms: number
  sql_query: string
}

export interface CampaignDispatchParams {
  campaign_id: string
  organization_id: string
  test_mode?: boolean
  batch_size?: number
}

export interface CampaignDispatchResult {
  dispatch_id: string
  total_recipients: number
  messages_queued: number
  errors: Array<{
    contact_id: string
    error: string
  }>
}

/**
 * Consent Gate RPC - GDPR Compliance Check
 * Validates if a contact can be messaged based on consent preferences
 */
export async function checkConsentPermission(params: ConsentCheckParams): Promise<ConsentCheckResult> {
  try {
    const { data, error } = await supabase.rpc('crm_can_message_v1', {
      p_contact_id: params.contact_id,
      p_channel: params.channel,
      p_purpose: params.purpose,
      p_organization_id: params.organization_id
    })

    if (error) {
      console.error('❌ Consent check RPC error:', error)
      return {
        can_message: false,
        reason: `RPC Error: ${error.message}`,
        consent_status: 'not_found',
        legal_basis: null,
        expires_at: null
      }
    }

    return data as ConsentCheckResult
  } catch (error) {
    console.error('❌ Consent check failed:', error)
    return {
      can_message: false,
      reason: 'System error during consent validation',
      consent_status: 'not_found',
      legal_basis: null,
      expires_at: null
    }
  }
}

/**
 * Segment Compiler RPC - DSL to SQL Conversion
 * Compiles segment filters into executable SQL and returns audience count
 */
export async function compileSegment(params: SegmentCompileParams): Promise<SegmentCompileResult> {
  try {
    const { data, error } = await supabase.rpc('crm_compile_segment_v1', {
      p_segment_id: params.segment_id,
      p_organization_id: params.organization_id,
      p_test_mode: params.test_mode || false,
      p_limit: params.limit || 100
    })

    if (error) {
      console.error('❌ Segment compilation RPC error:', error)
      throw new Error(`Segment compilation failed: ${error.message}`)
    }

    return data as SegmentCompileResult
  } catch (error) {
    console.error('❌ Segment compilation failed:', error)
    throw error
  }
}

/**
 * Campaign Dispatch RPC - Message Pipeline
 * Initiates campaign dispatch with consent validation and provider routing
 */
export async function dispatchCampaign(params: CampaignDispatchParams): Promise<CampaignDispatchResult> {
  try {
    const { data, error } = await supabase.rpc('crm_dispatch_campaign_v1', {
      p_campaign_id: params.campaign_id,
      p_organization_id: params.organization_id,
      p_test_mode: params.test_mode || false,
      p_batch_size: params.batch_size || 1000
    })

    if (error) {
      console.error('❌ Campaign dispatch RPC error:', error)
      throw new Error(`Campaign dispatch failed: ${error.message}`)
    }

    return data as CampaignDispatchResult
  } catch (error) {
    console.error('❌ Campaign dispatch failed:', error)
    throw error
  }
}

/**
 * GDPR Right to be Forgotten (RTBF) RPC
 * Executes data erasure for contact across all MCA entities
 */
export async function executeRTBF(contact_id: string, organization_id: string): Promise<{
  success: boolean
  entities_affected: string[]
  rtbf_transaction_id: string
}> {
  try {
    const { data, error } = await supabase.rpc('crm_rtbf_execute_v1', {
      p_contact_id: contact_id,
      p_organization_id: organization_id,
      p_retention_reason: 'GDPR Article 17 - Right to Erasure'
    })

    if (error) {
      console.error('❌ RTBF execution RPC error:', error)
      throw new Error(`RTBF execution failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('❌ RTBF execution failed:', error)
    throw error
  }
}

/**
 * Delivery Event Tracker RPC
 * Processes webhook events from providers (email, SMS, WhatsApp)
 */
export async function trackDeliveryEvent(event: {
  message_id: string
  provider: string
  event_type: 'QUEUED' | 'SENT' | 'DELIVERED' | 'BOUNCE' | 'SPAM' | 'BLOCKED' | 'READ' | 'CLICK' | 'UNSUBSCRIBE'
  timestamp: string
  contact_id?: string
  campaign_id?: string
  metadata?: Record<string, any>
  organization_id: string
}): Promise<{ transaction_id: string }> {
  try {
    const { data, error } = await supabase.rpc('crm_track_delivery_v1', {
      p_message_id: event.message_id,
      p_provider: event.provider,
      p_event_type: event.event_type,
      p_timestamp: event.timestamp,
      p_contact_id: event.contact_id,
      p_campaign_id: event.campaign_id,
      p_metadata: event.metadata || {},
      p_organization_id: event.organization_id
    })

    if (error) {
      console.error('❌ Delivery tracking RPC error:', error)
      throw new Error(`Delivery tracking failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('❌ Delivery tracking failed:', error)
    throw error
  }
}

/**
 * Consent Preference Management
 * Creates or updates consent preferences with full audit trail
 */
export async function updateConsentPreference(consent: {
  contact_id: string
  purpose: string
  status: 'given' | 'revoked'
  legal_basis: 'consent' | 'contract' | 'legitimate_interest'
  source: 'web_form' | 'import' | 'api' | 'whatsapp_optin' | 'email_link'
  evidence: Record<string, any>
  expires_at?: string
  organization_id: string
}): Promise<{ consent_id: string; transaction_id: string }> {
  try {
    const { data, error } = await supabase.rpc('crm_consent_update_v1', {
      p_contact_id: consent.contact_id,
      p_purpose: consent.purpose,
      p_status: consent.status,
      p_legal_basis: consent.legal_basis,
      p_source: consent.source,
      p_evidence: consent.evidence,
      p_expires_at: consent.expires_at,
      p_organization_id: consent.organization_id
    })

    if (error) {
      console.error('❌ Consent update RPC error:', error)
      throw new Error(`Consent update failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('❌ Consent update failed:', error)
    throw error
  }
}

/**
 * Channel Identity Verification
 * Validates and verifies communication addresses (email, phone, etc.)
 */
export async function verifyChannelIdentity(identity: {
  contact_id: string
  channel_type: 'email' | 'sms' | 'whatsapp'
  address: string
  verification_method: 'email_link' | 'sms_code' | 'whatsapp_code'
  organization_id: string
}): Promise<{ 
  identity_id: string
  verification_status: 'pending' | 'verified' | 'failed'
  verification_token?: string
}> {
  try {
    const { data, error } = await supabase.rpc('crm_verify_identity_v1', {
      p_contact_id: identity.contact_id,
      p_channel_type: identity.channel_type,
      p_address: identity.address,
      p_verification_method: identity.verification_method,
      p_organization_id: identity.organization_id
    })

    if (error) {
      console.error('❌ Identity verification RPC error:', error)
      throw new Error(`Identity verification failed: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('❌ Identity verification failed:', error)
    throw error
  }
}