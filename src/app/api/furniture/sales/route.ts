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
    const [transactionsResult, entitiesResult, linesResult] = await Promise.all([
      supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false }),

      supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .in('entity_type', ['customer', 'product']),

      supabase.from('universal_transaction_lines').select('*').eq('organization_id', organizationId)
    ])

    if (transactionsResult.error) throw transactionsResult.error
    if (entitiesResult.error) throw entitiesResult.error
    if (linesResult.error) throw linesResult.error

    // Filter sales transactions
    const salesTransactions =
      transactionsResult.data?.filter(t =>
        ['sales_order', 'sales_invoice', 'sale', 'proforma_invoice', 'quote'].includes(
          t.transaction_type
        )
      ) || []

    return NextResponse.json({
      transactions: salesTransactions,
      entities: entitiesResult.data || [],
      lines: linesResult.data || []
    })
  } catch (error) {
    console.error('Sales API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
