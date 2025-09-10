/**
 * 🚀 HERA Provisioning API
 * 
 * API endpoints for tenant provisioning
 * - POST: Create new tenant
 * - PUT: Update tenant modules
 * - DELETE: Deprovision tenant
 * - GET: Check subdomain availability
 */

import { NextRequest, NextResponse } from 'next/server'
import { provisioningService, type ProvisioningRequest } from '@/lib/services/provisioning'
import { entitlementsService } from '@/lib/services/entitlements'
import { resolveTenant } from '@/lib/middleware/tenant-resolver'
import { createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

/**
 * POST /api/v1/provisioning
 * Create a new tenant
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json() as ProvisioningRequest

    // Validate required fields
    if (!body.organizationName || !body.subdomain || !body.industryType || !body.ownerEmail || !body.ownerName) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['organizationName', 'subdomain', 'industryType', 'ownerEmail', 'ownerName']
        },
        { status: 400 }
      )
    }

    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(body.subdomain)) {
      return NextResponse.json(
        { error: 'Subdomain must contain only lowercase letters, numbers, and hyphens' },
        { status: 400 }
      )
    }

    // Provision the tenant
    const result = await provisioningService.provisionTenant(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Provisioning failed' },
        { status: 400 }
      )
    }

    // Return success with tenant details
    return NextResponse.json({
      success: true,
      organizationId: result.organizationId,
      subdomain: result.subdomain,
      modules: result.modules,
      accessUrl: `https://${result.subdomain}.heraerp.com`,
      message: 'Tenant provisioned successfully'
    })

  } catch (error) {
    console.error('[Provisioning API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/provisioning
 * Update tenant modules
 */
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { organizationId, action, moduleSmartCode } = body

    if (!organizationId || !action || !moduleSmartCode) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, action, moduleSmartCode' },
        { status: 400 }
      )
    }

    // Check if user has permission to modify this organization
    const { data: membershipData } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('from_entity_id', user.id)
      .eq('relationship_type', 'MEMBER_OF')
      .single()

    if (!membershipData) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this organization' },
        { status: 403 }
      )
    }

    let result: any
    
    switch (action) {
      case 'grant':
        result = await entitlementsService.grantModuleAccess({
          organizationId,
          moduleSmartCode,
          grantedBy: user.email || user.id,
          trialDays: body.trialDays
        })
        break

      case 'revoke':
        result = await entitlementsService.revokeModuleAccess(organizationId, moduleSmartCode)
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "grant" or "revoke"' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Operation failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Module ${action}ed successfully`
    })

  } catch (error) {
    console.error('[Provisioning API] Update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/provisioning
 * Deprovision a tenant
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get organization ID from query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId required' },
        { status: 400 }
      )
    }

    // Check if user is owner of the organization
    const { data: ownerData } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'employee')
      .eq('metadata->>role', 'owner')
      .eq('metadata->>email', user.email)
      .single()

    if (!ownerData) {
      return NextResponse.json(
        { error: 'Only organization owner can deprovision' },
        { status: 403 }
      )
    }

    // Deprovision the tenant
    const result = await provisioningService.deprovisionTenant(organizationId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Deprovisioning failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Tenant deprovisioned successfully'
    })

  } catch (error) {
    console.error('[Provisioning API] Delete error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/v1/provisioning
 * Check subdomain availability or get tenant info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')
    const checkAvailability = searchParams.get('checkAvailability') === 'true'

    if (!subdomain) {
      return NextResponse.json(
        { error: 'subdomain parameter required' },
        { status: 400 }
      )
    }

    // Check availability
    if (checkAvailability) {
      const available = await provisioningService.checkSubdomainAvailability(subdomain)
      return NextResponse.json({
        subdomain,
        available,
        message: available ? 'Subdomain is available' : 'Subdomain is already taken'
      })
    }

    // Get tenant info
    const tenant = await resolveTenant(subdomain)
    
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      organizationId: tenant.organizationId,
      organizationName: tenant.organizationName,
      subdomain: tenant.subdomain,
      modules: tenant.modules.map(m => ({
        name: m.moduleName,
        smartCode: m.smartCode,
        version: m.version,
        enabled: m.enabled,
        expiresAt: m.expiresAt
      })),
      settings: tenant.settings
    })

  } catch (error) {
    console.error('[Provisioning API] Get error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}