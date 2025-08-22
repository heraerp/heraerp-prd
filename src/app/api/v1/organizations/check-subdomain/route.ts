import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const searchParams = request.nextUrl.searchParams
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json(
        { error: 'Subdomain parameter is required' },
        { status: 400 }
      )
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json(
        { 
          available: false,
          error: 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only. Minimum 1 character.' 
        },
        { status: 200 }
      )
    }

    // Reserved subdomains
    const reserved = ['app', 'www', 'api', 'admin', 'dashboard', 'help', 'support', 'blog', 'dev', 'staging', 'production']
    if (reserved.includes(subdomain)) {
      return NextResponse.json(
        { 
          available: false,
          error: 'This subdomain is reserved' 
        },
        { status: 200 }
      )
    }

    // Check if subdomain exists in database
    console.log('Checking subdomain availability for:', subdomain)
    const { data: result, error } = await supabase.rpc('check_subdomain_availability', {
      p_subdomain: subdomain
    })

    console.log('RPC result:', result)
    console.log('RPC error:', error)

    if (error) {
      console.error('Error checking subdomain:', error)
      // If the function doesn't exist, fall back to direct query
      const { data: orgs, error: queryError } = await supabase
        .from('core_entities')
        .select('id')
        .eq('entity_type', 'organization')
        .eq('metadata->>subdomain', subdomain)
        .limit(1)

      if (queryError) {
        console.error('Error querying subdomain:', queryError)
        return NextResponse.json(
          { error: 'Failed to check subdomain availability' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        available: !orgs || orgs.length === 0
      })
    }

    return NextResponse.json({
      available: result?.available || false,
      reason: result?.reason
    })
  } catch (error) {
    console.error('Error checking subdomain availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}