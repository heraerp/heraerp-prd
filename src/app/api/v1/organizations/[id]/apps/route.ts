import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Available apps catalog
const HERA_APPS = {
  salon: {
    id: 'salon',
    name: 'Salon Management',
    description: 'Complete salon operations with appointment booking, staff management, and inventory',
    category: 'Industry Specific',
    pricing: { monthly: 49, yearly: 490 },
    features: ['appointments', 'staff-management', 'inventory', 'reporting'],
    default_config: {
      currency: 'USD',
      appointment_duration: 60,
      working_hours: { start: '09:00', end: '18:00' }
    }
  },
  restaurant: {
    id: 'restaurant',
    name: 'Restaurant POS',
    description: 'Full restaurant management with menu, orders, inventory, and kitchen operations',
    category: 'Industry Specific',
    pricing: { monthly: 99, yearly: 990 },
    features: ['menu-management', 'order-tracking', 'kitchen-display', 'inventory'],
    default_config: {
      currency: 'USD',
      tax_rate: 0.08,
      service_charge: 0.10
    }
  },
  budgeting: {
    id: 'budgeting',
    name: 'Universal Budgeting',
    description: 'Enterprise budgeting and forecasting for any business type',
    category: 'Financial',
    pricing: { monthly: 39, yearly: 390 },
    features: ['budget-planning', 'variance-analysis', 'forecasting', 'reporting'],
    default_config: {
      fiscal_year_start: 'january',
      budget_periods: 'monthly'
    }
  },
  financial: {
    id: 'financial',
    name: 'Financial Management',
    description: 'Complete accounting with GL, AR, AP, and financial reporting',
    category: 'Financial',
    pricing: { monthly: 79, yearly: 790 },
    features: ['general-ledger', 'accounts-receivable', 'accounts-payable', 'reporting'],
    default_config: {
      accounting_method: 'accrual',
      currency: 'USD'
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Get auth token from headers
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authorization.replace('Bearer ', '')

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user has access to this organization
    const { data: membership } = await supabase
      .from('core_relationships')
      .select('metadata')
      .match({
        relationship_type: 'member_of',
        to_entity_id: id
      })
      .eq('from_entity_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get installed apps
    const { data: installedApps, error } = await supabase
      .from('core_relationships')
      .select(`
        *,
        app:to_entity_id(
          id,
          entity_name,
          entity_code,
          metadata
        )
      `)
      .eq('from_entity_id', id)
      .eq('relationship_type', 'has_installed')

    if (error) {
      throw error
    }

    // Format installed apps
    const installed = installedApps?.map(rel => ({
      id: rel.app?.entity_code?.toLowerCase() || rel.to_entity_id,
      name: rel.app?.entity_name,
      status: rel.metadata?.status || 'active',
      installed_at: rel.metadata?.installed_at || rel.created_at,
      config: rel.metadata?.config || {},
      subscription: rel.metadata?.subscription || { plan: 'trial' }
    })) || []

    // Get available apps (not installed)
    const installedIds = installed.map(app => app.id)
    const available = Object.entries(HERA_APPS)
      .filter(([id]) => !installedIds.includes(id))
      .map(([id, app]) => ({
        ...app,
        id
      }))

    return NextResponse.json({
      installed_apps: installed,
      available_apps: available,
      total_installed: installed.length,
      total_available: available.length
    })

  } catch (error) {
    console.error('Get apps error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Get auth token from headers
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authorization.replace('Bearer ', '')

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user has admin/owner access to this organization
    const { data: membership } = await supabase
      .from('core_relationships')
      .select('metadata')
      .match({
        relationship_type: 'member_of',
        to_entity_id: id
      })
      .eq('from_entity_id', user.id)
      .single()

    const userRole = membership?.metadata?.role
    if (!userRole || !['owner', 'admin'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to install apps' },
        { status: 403 }
      )
    }

    // Get request body
    const body = await request.json()
    const { app_id, config = {} } = body

    // Validate app exists
    if (!HERA_APPS[app_id as keyof typeof HERA_APPS]) {
      return NextResponse.json(
        { error: 'Invalid app ID' },
        { status: 400 }
      )
    }

    const appInfo = HERA_APPS[app_id as keyof typeof HERA_APPS]

    // Merge default config with provided config
    const appConfig = {
      ...appInfo.default_config,
      ...config
    }

    // Install app for organization
    const { data, error } = await supabase.rpc('install_app_for_organization', {
      p_org_id: id,
      p_app_id: app_id,
      p_app_config: appConfig
    })

    if (error || !data?.success) {
      console.error('Error installing app:', error || data)
      return NextResponse.json(
        { error: data?.error || 'Failed to install app' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      app_id: app_id,
      message: `${appInfo.name} installed successfully`,
      next_step: `/org/${id}/${app_id}`
    }, { status: 201 })

  } catch (error) {
    console.error('Install app error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Get auth token from headers
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authorization.replace('Bearer ', '')

    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user has owner access to this organization
    const { data: membership } = await supabase
      .from('core_relationships')
      .select('metadata')
      .match({
        relationship_type: 'member_of',
        to_entity_id: id
      })
      .eq('from_entity_id', user.id)
      .single()

    const userRole = membership?.metadata?.role
    if (userRole !== 'owner') {
      return NextResponse.json(
        { error: 'Only organization owners can uninstall apps' },
        { status: 403 }
      )
    }

    // Get app_id from query params
    const { searchParams } = new URL(request.url)
    const appId = searchParams.get('app_id')

    if (!appId) {
      return NextResponse.json(
        { error: 'Missing app_id parameter' },
        { status: 400 }
      )
    }

    // Find and delete the app relationship
    const { error } = await supabase
      .from('core_relationships')
      .delete()
      .match({
        from_entity_id: id,
        relationship_type: 'has_installed'
      })
      .eq('metadata->>app_id', appId)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `App ${appId} uninstalled successfully`
    })

  } catch (error) {
    console.error('Uninstall app error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}