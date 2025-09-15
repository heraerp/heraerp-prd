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

    console.log('API: Fetching HR data for org:', organizationId)

    // Fetch all entities (employees, departments, etc)
    const { data: entities, error: entitiesError } = await supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)

    if (entitiesError) {
      console.error('API: Entities error:', entitiesError)
      return NextResponse.json({ error: entitiesError.message }, { status: 500 })
    }

    console.log('API: Total entities found:', entities?.length || 0)
    console.log(
      'API: Employee entities:',
      entities?.filter(e => e.entity_type === 'employee').length || 0
    )

    // Fetch all transactions (attendance, leave requests, payroll, etc)
    const { data: transactions, error: transactionsError } = await supabaseAdmin
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)

    if (transactionsError) {
      console.error('API: Transactions error:', transactionsError)
      return NextResponse.json({ error: transactionsError.message }, { status: 500 })
    }

    console.log('API: Transactions found:', transactions?.length || 0)

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
      entities: entities || [],
      transactions: transactions || [],
      dynamicData: dynamicData || []
    })
  } catch (error) {
    console.error('API: Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
