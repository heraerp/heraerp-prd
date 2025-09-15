import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const { data, error } = await supabaseAdmin
      .from('core_organizations')
      .select('id, organization_name')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Database connection error',
        details: error.message
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Digital Accountant API is working',
      database_connected: true,
      organization_count: data?.length || 0
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
