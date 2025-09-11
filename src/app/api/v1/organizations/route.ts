import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Only create client if we have the required environment variables
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      )
    }

    // Get auth token from headers
    const headersList = await headers()
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

    // Special handling for demo users
    const demoUsers: Record<string, any> = {
      'demo@keralafurniture.com': {
        id: 'f0af4ced-9d12-4a55-a649-b484368db249',
        name: 'Kerala Furniture Works',
        settings: {
          subdomain: 'furniture',
          industry: 'furniture',
          country: 'AE'
        }
      },
      'demo@hairtalkz.com': {
        id: 'c2f7b7a3-7e3d-4c47-9f2e-d3f8a9c2e5f6',
        name: 'Hair Talkz Salon & Spa',
        settings: {
          subdomain: 'salon',
          industry: 'salon',
          country: 'AE'
        }
      },
      'demo@mariosrestaurant.com': {
        id: 'a5d9c8f7-8f5e-4b7c-9e3f-f2d8a7c9e4b5',
        name: 'Mario\'s Authentic Italian',
        settings: {
          subdomain: 'restaurant',
          industry: 'restaurant',
          country: 'AE'
        }
      },
      'demo@techvantage.com': {
        id: 'e7f9a5c3-5d8e-4f9c-8b3e-d5f7a9c8e2f4',
        name: 'TechVantage Solutions',
        settings: {
          subdomain: 'crm',
          industry: 'crm',
          country: 'AE'
        }
      }
    }
    
    if (user.email && demoUsers[user.email]) {
      return NextResponse.json({
        success: true,
        organizations: [demoUsers[user.email]]
      })
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

    // Check if this is the universal demo user
    if (user.email === 'demo@heraerp.com') {
      // Return pre-configured demo organizations
      const demoOrgs = [
        {
          id: '519d9c67-6fa4-4c73-9c56-6d132a6649c1',
          name: 'Bella Beauty Salon (Demo)',
          type: 'salon',
          subdomain: 'demo-salon',
          subscription_plan: 'demo',
          role: 'owner',
          permissions: ['*'],
          is_active: true
        },
        {
          id: '6c3bc585-eec9-40a2-adc5-a89bfb398a16',
          name: 'Kochi Ice Cream Manufacturing (Demo)',
          type: 'icecream',
          subdomain: 'demo-icecream',
          subscription_plan: 'demo',
          role: 'owner',
          permissions: ['*'],
          is_active: true
        },
        {
          id: '3740d358-f283-47e8-8055-852b67eee1a6',
          name: "Mario's Restaurant (Demo)",
          type: 'restaurant',
          subdomain: 'demo-restaurant',
          subscription_plan: 'demo',
          role: 'owner',
          permissions: ['*'],
          is_active: true
        },
        {
          id: '037aac11-2323-4a71-8781-88a8454c9695',
          name: 'Dr. Smith Family Practice (Demo)',
          type: 'healthcare',
          subdomain: 'demo-healthcare',
          subscription_plan: 'demo',
          role: 'owner',
          permissions: ['*'],
          is_active: true
        }
      ]
      
      return NextResponse.json({
        success: true,
        organizations: demoOrgs
      })
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
    // Check if Supabase client is initialized
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      )
    }

    // Get auth token from headers
    const headersList = await headers()
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
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
    if (!subdomainRegex.test(subdomain)) {
      console.error('Invalid subdomain format:', subdomain)
      return NextResponse.json(
        { error: 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only. Minimum 1 character.' },
        { status: 400 }
      )
    }

    // Check subdomain availability
    console.log('Checking subdomain availability for:', subdomain)
    const { data: availabilityCheck, error: availabilityError } = await supabase.rpc('check_subdomain_availability', {
      p_subdomain: subdomain
    })

    console.log('Availability check result:', availabilityCheck)
    console.log('Availability check error:', availabilityError)

    if (availabilityError) {
      console.error('Error checking subdomain availability:', availabilityError)
      // Fall back to direct check if RPC fails
      const { data: existingOrgs } = await supabase
        .from('core_entities')
        .select('id')
        .eq('entity_type', 'organization')
        .eq('metadata->>subdomain', subdomain)
        .limit(1)
      
      if (existingOrgs && existingOrgs.length > 0) {
        return NextResponse.json(
          { 
            error: 'Subdomain not available',
            reason: 'taken'
          },
          { status: 400 }
        )
      }
    } else if (!availabilityCheck?.available) {
      return NextResponse.json(
        { 
          error: 'Subdomain not available',
          reason: availabilityCheck?.reason || 'unknown'
        },
        { status: 400 }
      )
    }

    // Create organization with owner
    console.log('Creating organization with params:', {
      p_org_name: organization_name,
      p_subdomain: subdomain,
      p_owner_id: user.id,
      p_owner_email: user.email,
      p_owner_name: owner_name,
      p_org_type: organization_type
    })

    const { data, error } = await supabase.rpc('create_organization_with_owner', {
      p_org_name: organization_name,
      p_subdomain: subdomain,
      p_owner_id: user.id,
      p_owner_email: user.email!,
      p_owner_name: owner_name,
      p_org_type: organization_type
    })

    console.log('Create organization result:', data)
    console.log('Create organization error:', error)

    if (error || !data?.success) {
      console.error('Error creating organization:', error || data?.error)
      return NextResponse.json(
        { error: data?.error || error?.message || 'Failed to create organization' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      organization: data.organization,
      user: data.user,
      next_step: `/auth/organizations/${data.organization.id}/apps`
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
    // Check if Supabase client is initialized
    if (!supabase) {
      return new NextResponse(null, { status: 500 })
    }

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