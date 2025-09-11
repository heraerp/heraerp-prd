import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create Supabase service client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Simple in-memory cache (5 minutes)
const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('org_id')

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
  }

  // Check cache first
  const cacheKey = `icecream_dashboard_${organizationId}`
  const cached = cache.get(cacheKey)
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log('API: Returning cached data for org:', organizationId)
    return NextResponse.json(cached.data)
  }

  try {
    console.log('API: Fetching fresh ice cream data for org:', organizationId)

    // Use Promise.all for parallel execution and limit data
    const [products, outlets, transactions] = await Promise.all([
      // Get only essential product fields
      supabase
        .from('core_entities')
        .select('id, entity_name, entity_code, metadata')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'product')
        .limit(50),
      
      // Get only outlet locations
      supabase
        .from('core_entities')
        .select('id, entity_name, entity_code, metadata')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'location')
        .like('entity_code', 'OUTLET%')
        .limit(20),
      
      // Get only recent transactions without lines
      supabase
        .from('universal_transactions')
        .select('id, transaction_type, transaction_code, total_amount, transaction_date, metadata')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(15)
    ])

    if (products.error) {
      console.error('API: Error fetching products:', products.error)
    }

    if (outlets.error) {
      console.error('API: Error fetching outlets:', outlets.error)
    }

    if (transactions.error) {
      console.error('API: Error fetching transactions:', transactions.error)
    }

    // Calculate production metrics
    const productionTxns = transactions.data?.filter(t => t.transaction_type === 'production_batch') || []
    
    // Calculate efficiency from production transactions
    let totalEfficiency = 0
    productionTxns.forEach(txn => {
      if ((txn.metadata as any)?.yield_variance_percent) {
        totalEfficiency += (100 + parseFloat(txn.metadata.yield_variance_percent))
      }
    })
    const avgEfficiency = productionTxns.length > 0 ? totalEfficiency / productionTxns.length : 97.93

    // Simplified inventory levels (reduce data size)
    const inventoryLevels = (products.data || []).slice(0, 10).map(product => ({
      id: product.id,
      name: product.entity_name,
      current: Math.floor(Math.random() * 500) + 100, // Placeholder
      minimum: 50,
      status: 'normal'
    }))

    const dashboardData = {
      totalProducts: products.data?.length || 0,
      activeProduction: productionTxns.length || 0,
      pendingQC: transactions.data?.filter(t => t.transaction_type === 'quality_check').length || 0,
      totalOutlets: outlets.data?.length || 0,
      recentTransactions: (transactions.data || []).slice(0, 5), // Only show 5 recent
      inventoryLevels,
      productionEfficiency: avgEfficiency
    }

    console.log('API: Dashboard data:', {
      products: dashboardData.totalProducts,
      outlets: dashboardData.totalOutlets,
      transactions: dashboardData.recentTransactions.length,
      productionTxns: dashboardData.activeProduction
    })

    // Cache the result
    cache.set(cacheKey, {
      data: dashboardData,
      timestamp: Date.now()
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