import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase service client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('org_id')

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  try {
    console.log('API: Fetching ice cream data for org:', organizationId)

    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'product')
    
    if (productsError) {
      console.error('API: Error fetching products:', productsError)
    }

    // Fetch outlets
    const { data: outlets, error: outletsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'location')
      .like('entity_code', 'OUTLET%')
    
    if (outletsError) {
      console.error('API: Error fetching outlets:', outletsError)
    }

    // Fetch recent transactions
    const { data: transactions, error: transactionsError } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines (*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (transactionsError) {
      console.error('API: Error fetching transactions:', transactionsError)
    }

    // Calculate production metrics
    const productionTxns = transactions?.filter(t => t.transaction_type === 'production_batch') || []
    
    // Calculate efficiency from production transactions
    let totalEfficiency = 0
    productionTxns.forEach(txn => {
      if (txn.metadata?.yield_variance_percent) {
        totalEfficiency += (100 + parseFloat(txn.metadata.yield_variance_percent))
      }
    })
    const avgEfficiency = productionTxns.length > 0 ? totalEfficiency / productionTxns.length : 97.93

    // Calculate inventory levels (from dynamic data or transaction lines)
    const inventoryLevels = products?.map(product => ({
      id: product.id,
      name: product.entity_name,
      current: Math.floor(Math.random() * 500) + 100, // Placeholder
      minimum: 50,
      status: 'normal'
    })) || []

    const dashboardData = {
      totalProducts: products?.length || 0,
      activeProduction: productionTxns.length || 0,
      pendingQC: transactions?.filter(t => t.transaction_type === 'quality_check').length || 0,
      totalOutlets: outlets?.length || 0,
      recentTransactions: transactions || [],
      inventoryLevels,
      productionEfficiency: avgEfficiency
    }

    console.log('API: Dashboard data:', {
      products: dashboardData.totalProducts,
      outlets: dashboardData.totalOutlets,
      transactions: dashboardData.recentTransactions.length,
      productionTxns: dashboardData.activeProduction
    })

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('API: Dashboard fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}