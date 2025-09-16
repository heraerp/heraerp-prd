import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subdomain = searchParams.get('subdomain')

    if (!subdomain) {
      return NextResponse.json({ success: false, error: 'Subdomain is required' }, { status: 400 })
    }

    // Look up organization by subdomain in settings
    const { data: organization, error } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('settings->>subdomain', subdomain)
      .eq('status', 'active')
      .single()

    if (error || !organization) {
      return NextResponse.json({ success: false, error: 'Organization not found' }, { status: 404 })
    }

    // Format organization for response
    const formattedOrg = {
      id: organization.id,
      organization_name: organization.organization_name,
      organization_code: organization.organization_code,
      organization_type: organization.organization_type,
      settings: organization.settings,
      status: organization.status
    }

    return NextResponse.json({
      success: true,
      organization: formattedOrg
    })
  } catch (error) {
    console.error('Error fetching organization by subdomain:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
