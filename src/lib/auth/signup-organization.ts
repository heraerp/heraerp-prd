/**
 * Organization Signup Utility
 * Complete signup flow for new users creating organizations
 * Uses HERA v2.3 RPC functions via API v2
 */

import { createClient } from '@supabase/supabase-js'

export interface SignupOrganizationParams {
  // User details
  email: string
  password: string
  name?: string

  // Organization details
  businessName: string
  industry?: string
  currency?: string
  selectedApp?: string

  // Additional settings
  theme?: Record<string, any>
}

export interface SignupOrganizationResult {
  success: boolean
  user?: {
    id: string
    email: string
  }
  organization?: {
    id: string
    organization_name: string
    organization_code: string
  }
  membership?: {
    role: string
    label: string | null
  }
  error?: string
}

/**
 * Complete signup flow:
 * 1. Create Supabase auth user
 * 2. Create organization (core_organizations + core_entities)
 * 3. Onboard user as owner (via hera_onboard_user_v1)
 */
export async function signupWithOrganization(
  params: SignupOrganizationParams
): Promise<SignupOrganizationResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    // Step 1: Create Supabase auth user
    console.log('📝 [SIGNUP] Step 1: Creating auth user...')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          full_name: params.name,
          business_name: params.businessName,
          industry: params.industry,
          currency: params.currency
        }
      }
    })

    if (authError || !authData.user) {
      console.error('❌ [SIGNUP] Auth user creation failed:', authError)
      return {
        success: false,
        error: authError?.message || 'Failed to create user'
      }
    }

    const userId = authData.user.id
    console.log('✅ [SIGNUP] Auth user created:', userId)

    // Get session for API calls
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      console.error('❌ [SIGNUP] No session after signup')
      return {
        success: false,
        error: 'Authentication failed - no session'
      }
    }

    // Step 2: Create organization via API v2
    console.log('🏢 [SIGNUP] Step 2: Creating organization...')

    const orgPayload = {
      organization_name: params.businessName,
      organization_type: 'business_unit' as const,
      industry_classification: params.industry || 'general',
      settings: {
        currency: params.currency || 'USD',
        selected_app: params.selectedApp || 'salon',
        created_via: 'signup',
        theme: params.theme || { preset: 'default' }
      },
      status: 'active',
      role: 'owner', // User will be onboarded as owner
      auto_onboard: true // Automatically onboard user
    }

    const orgResponse = await fetch('/api/v2/organizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify(orgPayload)
    })

    if (!orgResponse.ok) {
      const errorData = await orgResponse.json()
      console.error('❌ [SIGNUP] Organization creation failed:', errorData)

      // Cleanup: delete auth user if org creation fails
      await supabase.auth.admin.deleteUser(userId)

      return {
        success: false,
        error: errorData.error || 'Failed to create organization'
      }
    }

    const orgData = await orgResponse.json()
    console.log('✅ [SIGNUP] Organization created:', orgData.data.organization.id)

    return {
      success: true,
      user: {
        id: userId,
        email: params.email
      },
      organization: orgData.data.organization,
      membership: orgData.data.membership
    }
  } catch (error) {
    console.error('❌ [SIGNUP] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Server-side signup (for API routes / server components)
 * Uses service role key for admin operations
 */
export async function signupWithOrganizationServer(
  params: SignupOrganizationParams
): Promise<SignupOrganizationResult> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Step 1: Create auth user
    console.log('📝 [SERVER SIGNUP] Step 1: Creating auth user...')

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        full_name: params.name,
        business_name: params.businessName,
        industry: params.industry,
        currency: params.currency
      }
    })

    if (authError || !authData.user) {
      console.error('❌ [SERVER SIGNUP] Auth user creation failed:', authError)
      return {
        success: false,
        error: authError?.message || 'Failed to create user'
      }
    }

    const userId = authData.user.id
    console.log('✅ [SERVER SIGNUP] Auth user created:', userId)

    // Step 2a: Create organization record
    console.log('🏢 [SERVER SIGNUP] Step 2: Creating organization...')

    const orgCode = 'ORG-' + Date.now().toString(36).toUpperCase()
    const orgId = crypto.randomUUID()

    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .insert({
        id: orgId,
        organization_name: params.businessName,
        organization_code: orgCode,
        organization_type: 'business_unit',
        industry_classification: params.industry || 'general',
        settings: {
          currency: params.currency || 'USD',
          selected_app: params.selectedApp || 'salon',
          created_via: 'signup_server',
          theme: params.theme || { preset: 'default' }
        },
        status: 'active',
        created_by: userId,
        updated_by: userId
      })
      .select()
      .single()

    if (orgError) {
      console.error('❌ [SERVER SIGNUP] Organization creation failed:', orgError)

      // Cleanup
      await supabase.auth.admin.deleteUser(userId)

      return {
        success: false,
        error: orgError.message
      }
    }

    console.log('✅ [SERVER SIGNUP] Organization created:', org.id)

    // Step 2b: Create organization entity
    const normalizedOrgName = params.businessName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 15)

    const { error: orgEntityError } = await supabase
      .from('core_entities')
      .insert({
        id: orgId,
        organization_id: orgId,
        entity_type: 'ORG',
        entity_name: params.businessName,
        entity_code: orgCode,
        smart_code: `HERA.SALON.ENTITY.ORG.${normalizedOrgName}.v1`,
        smart_code_status: 'LIVE',
        status: 'active',
        created_by: userId,
        updated_by: userId
      })

    if (orgEntityError) {
      console.error('❌ [SERVER SIGNUP] Org entity creation failed:', orgEntityError)

      // Cleanup
      await supabase.from('core_organizations').delete().eq('id', orgId)
      await supabase.auth.admin.deleteUser(userId)

      return {
        success: false,
        error: orgEntityError.message
      }
    }

    console.log('✅ [SERVER SIGNUP] Organization entity created')

    // Step 3: Onboard user as owner
    console.log('👤 [SERVER SIGNUP] Step 3: Onboarding user as owner...')

    const { data: membershipData, error: membershipError } = await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: userId,
      p_organization_id: orgId,
      p_actor_user_id: userId,
      p_role: 'owner'
    })

    if (membershipError) {
      console.error('❌ [SERVER SIGNUP] User onboarding failed:', membershipError)

      // Cleanup
      await supabase.from('core_entities').delete().eq('id', orgId)
      await supabase.from('core_organizations').delete().eq('id', orgId)
      await supabase.auth.admin.deleteUser(userId)

      return {
        success: false,
        error: membershipError.message
      }
    }

    console.log('✅ [SERVER SIGNUP] User onboarded successfully')

    return {
      success: true,
      user: {
        id: userId,
        email: params.email
      },
      organization: {
        id: org.id,
        organization_name: org.organization_name,
        organization_code: org.organization_code
      },
      membership: {
        role: membershipData.role,
        label: membershipData.label
      }
    }
  } catch (error) {
    console.error('❌ [SERVER SIGNUP] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
