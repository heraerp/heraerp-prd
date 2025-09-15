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
    const [transactionsResult, entitiesResult, linesResult, relationshipsResult] =
      await Promise.all([
        // Get all transactions for production orders
        supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false }),

        // Get all entities (products, work centers, status entities)
        supabase.from('core_entities').select('*').eq('organization_id', organizationId),

        // Get transaction lines for production details
        supabase
          .from('universal_transaction_lines')
          .select('*')
          .eq('organization_id', organizationId),

        // Get relationships for status tracking
        supabase.from('core_relationships').select('*').eq('organization_id', organizationId)
      ])

    if (transactionsResult.error) throw transactionsResult.error
    if (entitiesResult.error) throw entitiesResult.error
    if (linesResult.error) throw linesResult.error
    if (relationshipsResult.error) throw relationshipsResult.error

    return NextResponse.json({
      transactions: transactionsResult.data || [],
      entities: entitiesResult.data || [],
      lines: linesResult.data || [],
      relationships: relationshipsResult.data || []
    })
  } catch (error) {
    console.error('Production API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
