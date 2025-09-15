import { NextRequest, NextResponse } from 'next/server'
import { universalApi } from '@/lib/universal-api'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Test 1: Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    const hasSupabase = !!(supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder'))

    // Test 2: Try a simple query using Universal API
    const organizationId = 'f0af4ced-9d12-4a55-a649-b484368db249'
    universalApi.setOrganizationId(organizationId)

    let queryResult = null
    let queryError = null

    try {
      const result = await universalApi.read('core_organizations')
      queryResult = result.data
      queryError = result.error
    } catch (error) {
      queryError = error.message || 'Query failed'
    }

    return NextResponse.json({
      success: true,
      tests: {
        supabase_configured: hasSupabase,
        supabase_url_set: !!supabaseUrl,
        supabase_key_set: !!supabaseKey,
        universal_api_mock_mode: !hasSupabase,
        query_success: !queryError,
        query_error: queryError,
        organizations_found: queryResult?.length || 0
      },
      environment: {
        node_env: process.env.NODE_ENV,
        has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Test failed'
      },
      { status: 500 }
    )
  }
}
