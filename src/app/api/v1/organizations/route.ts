import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
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

    // Get user's organizations
    const { data, error } = await supabase.rpc('get_user_organizations', {
      p_user_id: user.id
    })

    if (error) {
      console.error('Error fetching organizations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Organizations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json()
    const { 
      organization_name,
      organization_type = 'general',
      subdomain,
      owner_name = user.user_metadata?.name || user.email?.split('@')[0] || 'User'
    } = body

    // Validate required fields
    if (!organization_name || !subdomain) {
      return NextResponse.json(
        { error: 'Missing required fields: organization_name, subdomain' },
        { status: 400 }
      )
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        { error: 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.' },
        { status: 400 }
      )
    }

    // Check subdomain availability
    const { data: availabilityCheck, error: availabilityError } = await supabase.rpc('check_subdomain_availability', {
      p_subdomain: subdomain
    })

    if (availabilityError || !availabilityCheck?.available) {
      return NextResponse.json(
        { 
          error: 'Subdomain not available',
          reason: availabilityCheck?.reason || 'unknown'
        },
        { status: 400 }
      )
    }

    // Create organization with owner
    const { data, error } = await supabase.rpc('create_organization_with_owner', {
      p_org_name: organization_name,
      p_org_type: organization_type,
      p_subdomain: subdomain,
      p_owner_id: user.id,
      p_owner_email: user.email!,
      p_owner_name: owner_name
    })

    if (error || !data?.success) {
      console.error('Error creating organization:', error || data?.error)
      return NextResponse.json(
        { error: data?.error || 'Failed to create organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: data.organization,
      user: data.user,
      next_step: `/setup?org=${data.organization.id}`
    }, { status: 201 })

  } catch (error) {
    console.error('Create organization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Check subdomain availability endpoint
export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return new NextResponse(null, { status: 400 })
    }

    const { data, error } = await supabase.rpc('check_subdomain_availability', {
      p_subdomain: subdomain
    })

    if (error) {
      return new NextResponse(null, { status: 500 })
    }

    return new NextResponse(null, {
      status: data?.available ? 200 : 409,
      headers: {
        'X-Subdomain-Available': data?.available ? 'true' : 'false',
        'X-Subdomain-Reason': data?.reason || ''
      }
    })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}