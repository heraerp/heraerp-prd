import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Ice cream demo organization ID (must match the one in demo-org-resolver.ts)
const ICE_CREAM_ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

export async function POST(request: NextRequest) {
  try {
    // Initialize Supabase client with service role for admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 1. Create organization
    const { error: orgError } = await supabase
      .from('core_organizations')
      .upsert({
        id: ICE_CREAM_ORG_ID,
        organization_name: 'Kochi Ice Cream Manufacturing',
        organization_type: 'manufacturing',
        metadata: {
          industry: 'ice_cream',
          location: 'Kochi, Kerala',
          established: '2020',
          demo: true
        }
      })
    
    if (orgError && orgError.code !== '23505') {
      throw orgError
    }
    
    // 2. Create sample products
    const products = [
      { code: 'ICE-001', name: 'Belgian Chocolate', category: 'premium', price: 350 },
      { code: 'ICE-002', name: 'Madagascar Vanilla', category: 'premium', price: 320 },
      { code: 'ICE-101', name: 'Classic Vanilla', category: 'classic', price: 180 },
      { code: 'ICE-102', name: 'Rich Chocolate', category: 'classic', price: 190 },
      { code: 'ICE-201', name: 'Kerala Coconut', category: 'tropical', price: 220 },
    ]
    
    for (const product of products) {
      await supabase
        .from('core_entities')
        .upsert({
          organization_id: ICE_CREAM_ORG_ID,
          entity_type: 'product',
          entity_code: product.code,
          entity_name: product.name,
          metadata: {
            category: product.category,
            price_per_liter: product.price
          }
        })
    }
    
    // 3. Create sample outlets
    const outlets = [
      { code: 'OUTLET-001', name: 'Marine Drive Store', area: 'Marine Drive' },
      { code: 'OUTLET-002', name: 'Fort Kochi Outlet', area: 'Fort Kochi' },
      { code: 'OUTLET-003', name: 'Lulu Mall Kiosk', area: 'Edappally' },
    ]
    
    for (const outlet of outlets) {
      await supabase
        .from('core_entities')
        .upsert({
          organization_id: ICE_CREAM_ORG_ID,
          entity_type: 'location',
          entity_code: outlet.code,
          entity_name: outlet.name,
          metadata: {
            location_type: 'retail_outlet',
            area: outlet.area,
            city: 'Kochi'
          }
        })
    }
    
    // 4. Create a sample transaction
    const { data: txn } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: ICE_CREAM_ORG_ID,
        transaction_type: 'sale',
        transaction_code: `DEMO-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 1500,
        transaction_status: 'completed',
        metadata: { demo: true }
      })
      .select()
      .single()
    
    return NextResponse.json({
      success: true,
      message: 'Ice cream demo data created successfully',
      organizationId: ICE_CREAM_ORG_ID,
      stats: {
        products: products.length,
        outlets: outlets.length,
        transactions: 1
      }
    })
    
  } catch (error: any) {
    console.error('Error creating demo data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create demo data' },
      { status: 500 }
    )
  }
}