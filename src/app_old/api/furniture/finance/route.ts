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
    const [entitiesResult, transactionLinesResult, dynamicDataResult] = await Promise.all([
      // Get all entities (GL accounts primarily)
      supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .order('entity_code', { ascending: true }),

      // Get transaction lines for balance calculation
      supabase
        .from('universal_transaction_lines')
        .select('*')
        .eq('organization_id', organizationId),

      // Get dynamic data for additional account properties
      supabase.from('core_dynamic_data').select('*').eq('organization_id', organizationId)
    ])

    if (entitiesResult.error) throw entitiesResult.error
    if (transactionLinesResult.error) throw transactionLinesResult.error
    if (dynamicDataResult.error) throw dynamicDataResult.error

    return NextResponse.json({
      entities: entitiesResult.data || [],
      transactionLines: transactionLinesResult.data || [],
      dynamicData: dynamicDataResult.data || []
    })
  } catch (error) {
    console.error('Finance API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
