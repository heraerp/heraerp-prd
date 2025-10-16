/**
 * MCA Consent Update API Endpoint
 * GDPR-compliant consent preference management
 * 
 * Smart Code: HERA.CRM.MCA.API.CONSENT.UPDATE.V1
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { updateConsentPreference } from '@/lib/mca/rpc-functions'
import { z } from 'zod'

// Request validation schema
const ConsentUpdateSchema = z.object({
  contact_id: z.string().uuid('Contact ID must be a valid UUID'),
  purpose: z.string().min(1, 'Purpose is required'),
  status: z.enum(['given', 'revoked']),
  legal_basis: z.enum(['consent', 'contract', 'legitimate_interest']),
  source: z.enum(['web_form', 'import', 'api', 'whatsapp_optin', 'email_link']),
  evidence: z.record(z.any()).optional().default({}),
  expires_at: z.string().datetime().optional(),
  organization_id: z.string().uuid('Organization ID must be a valid UUID')
})

/**
 * POST /api/v2/mca/consent/update
 * Creates or updates consent preferences with full audit trail
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
    const validation = ConsentUpdateSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validation.error.errors 
        },
        { status: 400 }
      )
    }

    const consentData = validation.data

    // Organization access validation
    const { data: orgAccess } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('id', consentData.organization_id)
      .single()

    if (!orgAccess) {
      return NextResponse.json(
        { error: 'Forbidden - Organization access denied' },
        { status: 403 }
      )
    }

    // Add session context to evidence
    const evidenceWithContext = {
      ...consentData.evidence,
      user_id: session.user.id,
      user_agent: request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      timestamp: new Date().toISOString()
    }

    // Execute consent update via RPC
    const result = await updateConsentPreference({
      ...consentData,
      evidence: evidenceWithContext
    })

    return NextResponse.json({
      success: true,
      data: {
        consent_id: result.consent_id,
        transaction_id: result.transaction_id,
        status: consentData.status,
        updated_at: new Date().toISOString(),
        updated_by: session.user.id
      }
    })

  } catch (error) {
    console.error('❌ Consent update API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}