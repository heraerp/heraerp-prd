import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { setupSalonBusiness } from '@/lib/salon/salon-setup'
import { headers } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const supabase = createClient(supabaseUrl, supabaseKey)

interface SetupRequest {
  organizationId?: string
  organization_id?: string
  organizationName?: string
  business_name?: string
  ownerEmail?: string
  owner_email?: string
  subdomain?: string
}

export async function POST(request: NextRequest) {
  try {
    // Get auth header
    const headersList = await headers()
    const authorization = headersList.get('authorization')
    
    const body: SetupRequest = await request.json()
    
    // Support both naming conventions
    const organizationId = body.organizationId || body.organization_id || ''
    const organizationName = body.organizationName || body.business_name || ''
    const ownerEmail = body.ownerEmail || body.owner_email || ''
    const subdomain = body.subdomain || ''

    if (!organizationId || !organizationName) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId and organizationName' },
        { status: 400 }
      )
    }

    console.log('🏪 Setting up new salon:', organizationName)

    // For server-side execution, we need to configure the universal API with absolute URL
    const host = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_APP_URL || 'localhost:3001'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}/api/v1/universal`
    
    // Use the unified salon setup function with proper configuration
    const result = await setupSalonBusiness({
      organizationId,
      organizationName,
      subdomain,
      ownerEmail,
      baseUrl
    })

    console.log('✅ Salon setup completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Salon setup completed successfully',
      data: result
    })

  } catch (error) {
    console.error('❌ Error setting up salon:', error)
    return NextResponse.json(
      { error: 'Failed to setup salon', details: error }, 
      { status: 500 }
    )
  }
}