import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Direct Supabase client with service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }
    
    console.log('API: Fetching products for org:', organizationId)
    
    // Fetch products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'product')
    
    if (productsError) {
      console.error('API: Products error:', productsError)
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }
    
    console.log('API: Products found:', products?.length || 0)
    
    // Fetch dynamic data
    const { data: dynamicData, error: dynamicError } = await supabaseAdmin
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', organizationId)
    
    if (dynamicError) {
      console.error('API: Dynamic data error:', dynamicError)
    }
    
    console.log('API: Dynamic data found:', dynamicData?.length || 0)
    
    return NextResponse.json({
      products: products || [],
      dynamicData: dynamicData || []
    })
  } catch (error) {
    console.error('API: Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}