import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Use service role key to bypass RLS
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

    // Fetch all data in parallel
    const [productsResult, categoriesResult, dynamicDataResult, inventoryResult] =
      await Promise.all([
        // Get all products
        supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('entity_type', 'product')
          .order('created_at', { ascending: false }),

        // Get categories
        supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('entity_type', 'category'),

        // Get dynamic data for products
        supabase.from('core_dynamic_data').select('*').eq('organization_id', organizationId),

        // Get inventory transactions
        supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', organizationId)
          .in('transaction_type', ['goods_receipt', 'stock_movement', 'inventory_adjustment'])
      ])

    if (productsResult.error) throw productsResult.error
    if (categoriesResult.error) throw categoriesResult.error
    if (dynamicDataResult.error) throw dynamicDataResult.error
    if (inventoryResult.error) throw inventoryResult.error

    return NextResponse.json({
      products: productsResult.data || [],
      categories: categoriesResult.data || [],
      dynamicData: dynamicDataResult.data || [],
      inventoryTransactions: inventoryResult.data || []
    })
  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
