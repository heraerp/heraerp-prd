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
    const [entitiesResult, dynamicDataResult, transactionsResult] = await Promise.all([
      // Get all entities (products, warehouses, etc.)
      supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),

      // Get dynamic data for stock levels, locations, etc.
      supabase.from('core_dynamic_data').select('*').eq('organization_id', organizationId),

      // Get inventory transactions
      supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('transaction_date', { ascending: false })
    ])

    if (entitiesResult.error) throw entitiesResult.error
    if (dynamicDataResult.error) throw dynamicDataResult.error
    if (transactionsResult.error) throw transactionsResult.error

    return NextResponse.json({
      entities: entitiesResult.data || [],
      dynamicData: dynamicDataResult.data || [],
      transactions: transactionsResult.data || []
    })
  } catch (error) {
    console.error('Inventory API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
