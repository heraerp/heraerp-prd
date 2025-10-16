/**
 * MCA Consent Check API Endpoint
 * GDPR-compliant consent validation for multi-channel messaging
 * 
 * Smart Code: HERA.CRM.MCA.API.CONSENT.CHECK.V1
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { checkConsentPermission } from '@/lib/mca/rpc-functions'
import { z } from 'zod'

// Request validation schema
const ConsentCheckSchema = z.object({
  contact_id: z.string().uuid('Contact ID must be a valid UUID'),
  channel: z.enum(['email', 'sms', 'whatsapp', 'push']),
  purpose: z.string().min(1, 'Purpose is required'),
  organization_id: z.string().uuid('Organization ID must be a valid UUID')
})

/**
 * POST /api/v2/mca/consent/check
 * Validates consent for messaging a specific contact
 */
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Authentication check
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = ConsentCheckSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const { contact_id, channel, purpose, organization_id } = validation.data

    // Organization access validation
    const { data: orgAccess } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('id', organization_id)
      .single()

    if (!orgAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Organization access denied' },
        { status: 403 }
      )
    }

    // Execute consent check via RPC
    const consentResult = await checkConsentPermission({
      contact_id,
      channel,
      purpose,
      organization_id
    })

    // Log consent check for audit trail
    const { error: logError } = await supabase
      .from('universal_transactions')
      .insert({
        transaction_type: 'CONSENT_CHECK',
        transaction_number: `CONSENT-${Date.now()}`,
        smart_code: 'HERA.CRM.MCA.EVENT.CONSENT.CHECKED.V1',
        source_entity_id: contact_id,
        organization_id,
        total_amount: 0,
        metadata: {
          channel,
          purpose,
          result: consentResult.can_message,
          reason: consentResult.reason,
          user_id: session.user.id
        }
      })

    if (logError) {
      console.warn('⚠️ Failed to log consent check:', logError)
    }

    return NextResponse.json({
      success: true,
      data: {
        ...consentResult,
        checked_at: new Date().toISOString(),
        checked_by: session.user.id
      }
    })

  } catch (error) {
    console.error('❌ Consent check API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}