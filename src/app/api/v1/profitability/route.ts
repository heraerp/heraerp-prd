/**
 * HERA Profitability & Cost Accounting API
 * 
 * Comprehensive API for profit center management, cost accounting,
 * and profitability analysis with BOM integration
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

// Mock data for development
const MOCK_DATA = {
  profit_centers: [
    {
      id: 'pc_001',
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
      center_code: 'PC001',
      center_name: 'Manufacturing Division',
      center_type: 'production',
      parent_center_id: null,
      cost_allocation_basis: 'machine_hours',
      status: 'active',
      smart_code: 'HERA.PROF.PC.MFG.v1',
      metrics: {
        revenue: 2450000,
        direct_costs: 1450000,
        allocated_costs: 426000,
        profit: 574000,
        margin_percentage: 23.4
      }
    },
    {
      id: 'pc_002',
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
      center_code: 'PC002',
      center_name: 'Sales & Distribution',
      center_type: 'sales',
      parent_center_id: null,
      cost_allocation_basis: 'revenue',
      status: 'active',
      smart_code: 'HERA.PROF.PC.SALES.v1',
      metrics: {
        revenue: 1850000,
        direct_costs: 925000,
        allocated_costs: 370000,
        profit: 555000,
        margin_percentage: 30.0
      }
    }
  ],
  
  product_costs: [
    {
      id: 'cost_001',
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
      product_id: 'prod_001',
      product_name: 'Premium Widget A',
      bom_id: 'bom_001',
      costing_method: 'standard',
      smart_code: 'HERA.COST.PROD.CALC.v1',
      cost_components: {
        direct_material: 45.50,
        direct_labor: 22.30,
        manufacturing_overhead: 18.75,
        total_cost: 86.55
      },
      pricing: {
        selling_price: 125.00,
        gross_margin: 38.45,
        gross_margin_pct: 30.8
      },
      last_updated: '2024-12-15T10:00:00Z'
    }
  ],
  
  cost_pools: [
    {
      id: 'pool_001',
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
      pool_name: 'Machine Hours Pool',
      pool_type: 'activity',
      cost_driver: 'machine_hours',
      total_cost: 450000,
      total_driver_units: 3600,
      rate_per_unit: 125.00,
      allocation_method: 'activity_based',
      smart_code: 'HERA.COST.POOL.MH.v1',
      status: 'active'
    },
    {
      id: 'pool_002',
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
      pool_name: 'Setup Costs Pool',
      pool_type: 'activity',
      cost_driver: 'number_of_setups',
      total_cost: 180000,
      total_driver_units: 120,
      rate_per_unit: 1500.00,
      allocation_method: 'activity_based',
      smart_code: 'HERA.COST.POOL.SETUP.v1',
      status: 'active'
    }
  ],
  
  profitability_analysis: {
    by_product: [
      {
        product_id: 'prod_001',
        product_name: 'Premium Widget A',
        revenue: 625000,
        direct_costs: 432750,
        allocated_overhead: 93750,
        net_profit: 98500,
        profit_margin: 15.8,
        units_sold: 5000
      }
    ],
    by_customer: [
      {
        customer_id: 'cust_001',
        customer_name: 'TechCorp Industries',
        revenue: 450000,
        cost_to_serve: 315000,
        profit: 135000,
        profit_margin: 30.0,
        customer_segment: 'enterprise'
      }
    ]
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const entityType = searchParams.get('entity_type')
    const organizationId = searchParams.get('organization_id')
    const id = searchParams.get('id')

    console.log('🎯 Profitability API GET:', { action, entityType, organizationId, id })

    switch (action) {
      case 'list':
        return listEntities(entityType, organizationId)
      
      case 'get':
        if (!id) {
          return NextResponse.json({
            success: false,
            error: 'ID parameter required for get action'
          }, { status: 400 })
        }
        return getEntity(entityType, id, organizationId)
      
      case 'analyze':
        return performAnalysis(searchParams)
      
      case 'calculate_cost':
        return calculateProductCost(searchParams)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: ['list', 'get', 'analyze', 'calculate_cost']
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Profitability API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data, organization_id } = body

    console.log('🎯 Profitability API POST:', { action, organization_id })

    switch (action) {
      case 'create_profit_center':
        return createProfitCenter(data, organization_id)
      
      case 'create_cost_pool':
        return createCostPool(data, organization_id)
      
      case 'allocate_costs':
        return allocateCosts(data, organization_id)
      
      case 'update_product_cost':
        return updateProductCost(data, organization_id)
      
      case 'run_profitability_analysis':
        return runProfitabilityAnalysis(data, organization_id)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available_actions: [
            'create_profit_center',
            'create_cost_pool',
            'allocate_costs',
            'update_product_cost',
            'run_profitability_analysis'
          ]
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Profitability API POST error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// Helper functions
async function listEntities(entityType: string | null, organizationId: string | null) {
  if (!entityType) {
    return NextResponse.json({
      success: false,
      error: 'entity_type parameter required'
    }, { status: 400 })
  }

  // Return mock data for now
  const mockResults: any = {
    profit_centers: MOCK_DATA.profit_centers,
    product_costs: MOCK_DATA.product_costs,
    cost_pools: MOCK_DATA.cost_pools
  }

  const data = mockResults[entityType] || []
  
  return NextResponse.json({
    success: true,
    entity_type: entityType,
    data: organizationId 
      ? data.filter((item: any) => item.organization_id === organizationId)
      : data,
    count: data.length,
    mode: 'mock'
  })
}

async function getEntity(entityType: string | null, id: string, organizationId: string | null) {
  if (!entityType) {
    return NextResponse.json({
      success: false,
      error: 'entity_type parameter required'
    }, { status: 400 })
  }

  // Find in mock data
  const mockResults: any = {
    profit_centers: MOCK_DATA.profit_centers,
    product_costs: MOCK_DATA.product_costs,
    cost_pools: MOCK_DATA.cost_pools
  }

  const entities = mockResults[entityType] || []
  const entity = entities.find((e: any) => e.id === id)

  if (!entity) {
    return NextResponse.json({
      success: false,
      error: 'Entity not found'
    }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    data: entity
  })
}

async function performAnalysis(searchParams: URLSearchParams) {
  const analysisType = searchParams.get('analysis_type')
  const dimension = searchParams.get('dimension')
  
  if (!analysisType) {
    return NextResponse.json({
      success: false,
      error: 'analysis_type parameter required'
    }, { status: 400 })
  }

  // Return mock analysis data
  const analysisData = {
    analysis_type: analysisType,
    dimension: dimension || 'all',
    period: 'current_month',
    data: dimension === 'product' 
      ? MOCK_DATA.profitability_analysis.by_product
      : dimension === 'customer'
      ? MOCK_DATA.profitability_analysis.by_customer
      : {
        by_product: MOCK_DATA.profitability_analysis.by_product,
        by_customer: MOCK_DATA.profitability_analysis.by_customer
      },
    summary: {
      total_revenue: 4950000,
      total_costs: 3613000,
      total_profit: 1337000,
      overall_margin: 27.0
    },
    generated_at: new Date().toISOString()
  }

  return NextResponse.json({
    success: true,
    ...analysisData
  })
}

async function calculateProductCost(searchParams: URLSearchParams) {
  const productId = searchParams.get('product_id')
  const includeBom = searchParams.get('include_bom') === 'true'
  
  if (!productId) {
    return NextResponse.json({
      success: false,
      error: 'product_id parameter required'
    }, { status: 400 })
  }

  // Mock cost calculation with BOM integration
  const costData = {
    product_id: productId,
    calculation_date: new Date().toISOString(),
    costing_method: 'standard_with_abc',
    cost_breakdown: {
      direct_material: {
        from_bom: true,
        components: [
          { item: 'Raw Material A', quantity: 2, unit_cost: 15.50, total: 31.00 },
          { item: 'Component B', quantity: 1, unit_cost: 14.50, total: 14.50 }
        ],
        total: 45.50
      },
      direct_labor: {
        operations: [
          { operation: 'Assembly', hours: 0.75, rate: 24.00, total: 18.00 },
          { operation: 'Testing', hours: 0.18, rate: 24.00, total: 4.30 }
        ],
        total: 22.30
      },
      overhead_allocation: {
        cost_pools: [
          { pool: 'Machine Hours', driver_units: 0.5, rate: 125.00, allocation: 62.50 },
          { pool: 'Setup Costs', driver_units: 0.02, rate: 1500.00, allocation: 30.00 }
        ],
        total: 92.50
      }
    },
    total_cost: 160.30,
    smart_codes_used: [
      'HERA.COST.PROD.CALC.v1',
      'HERA.COST.PROD.MATERIAL.v1',
      'HERA.COST.PROD.LABOR.v1',
      'HERA.COST.PROD.OVERHEAD.v1'
    ]
  }

  return NextResponse.json({
    success: true,
    ...costData
  })
}

async function createProfitCenter(data: any, organizationId: string) {
  // Validate required fields
  if (!data.center_name || !data.center_type) {
    return NextResponse.json({
      success: false,
      error: 'Missing required fields: center_name, center_type'
    }, { status: 400 })
  }

  // Mock creation
  const newProfitCenter = {
    id: `pc_${Date.now()}`,
    organization_id: organizationId,
    center_code: data.center_code || `PC${Date.now()}`,
    center_name: data.center_name,
    center_type: data.center_type,
    parent_center_id: data.parent_center_id || null,
    cost_allocation_basis: data.cost_allocation_basis || 'direct',
    status: 'active',
    smart_code: 'HERA.PROF.PC.CREATE.v1',
    created_at: new Date().toISOString(),
    created_by: 'current_user'
  }

  return NextResponse.json({
    success: true,
    data: newProfitCenter,
    message: 'Profit center created successfully'
  })
}

async function createCostPool(data: any, organizationId: string) {
  // Validate required fields
  if (!data.pool_name || !data.cost_driver) {
    return NextResponse.json({
      success: false,
      error: 'Missing required fields: pool_name, cost_driver'
    }, { status: 400 })
  }

  // Mock creation
  const newCostPool = {
    id: `pool_${Date.now()}`,
    organization_id: organizationId,
    pool_name: data.pool_name,
    pool_type: data.pool_type || 'activity',
    cost_driver: data.cost_driver,
    total_cost: data.total_cost || 0,
    allocation_method: 'activity_based',
    smart_code: 'HERA.COST.POOL.CREATE.v1',
    status: 'active',
    created_at: new Date().toISOString()
  }

  return NextResponse.json({
    success: true,
    data: newCostPool,
    message: 'Cost pool created successfully'
  })
}

async function allocateCosts(data: any, organizationId: string) {
  // Mock cost allocation process
  const allocationResult = {
    allocation_id: `alloc_${Date.now()}`,
    organization_id: organizationId,
    allocation_period: data.period || new Date().toISOString().slice(0, 7),
    allocation_method: data.method || 'activity_based',
    smart_code: 'HERA.COST.ALLOC.ABC.v1',
    allocations: [
      {
        cost_pool: 'Machine Hours Pool',
        total_allocated: 450000,
        allocation_count: 24,
        average_allocation: 18750
      },
      {
        cost_pool: 'Setup Costs Pool',
        total_allocated: 180000,
        allocation_count: 12,
        average_allocation: 15000
      }
    ],
    status: 'completed',
    processed_at: new Date().toISOString()
  }

  return NextResponse.json({
    success: true,
    data: allocationResult,
    message: 'Cost allocation completed successfully'
  })
}

async function updateProductCost(data: any, organizationId: string) {
  if (!data.product_id) {
    return NextResponse.json({
      success: false,
      error: 'product_id required'
    }, { status: 400 })
  }

  // Mock update
  const updatedCost = {
    product_id: data.product_id,
    organization_id: organizationId,
    previous_cost: 86.55,
    new_cost: data.new_cost || 92.30,
    cost_change: 5.75,
    change_percentage: 6.6,
    updated_components: data.components || {
      direct_material: 48.00,
      direct_labor: 23.50,
      overhead: 20.80
    },
    smart_code: 'HERA.COST.PROD.CALC.v1',
    updated_at: new Date().toISOString(),
    updated_by: 'current_user'
  }

  return NextResponse.json({
    success: true,
    data: updatedCost,
    message: 'Product cost updated successfully'
  })
}

async function runProfitabilityAnalysis(data: any, organizationId: string) {
  const analysisType = data.analysis_type || 'comprehensive'
  
  // Mock comprehensive profitability analysis
  const analysisResults = {
    analysis_id: `analysis_${Date.now()}`,
    organization_id: organizationId,
    analysis_type: analysisType,
    period: data.period || 'current_month',
    smart_codes_used: [
      'HERA.PROF.ANAL.PROD.v1',
      'HERA.PROF.ANAL.CUST.v1',
      'HERA.PROF.ANAL.SEG.v1'
    ],
    results: {
      by_profit_center: MOCK_DATA.profit_centers.map(pc => ({
        center: pc.center_name,
        revenue: pc.metrics.revenue,
        profit: pc.metrics.profit,
        margin: pc.metrics.margin_percentage,
        rank: 1
      })),
      by_product: MOCK_DATA.profitability_analysis.by_product,
      by_customer: MOCK_DATA.profitability_analysis.by_customer,
      insights: [
        {
          type: 'opportunity',
          description: 'Product B shows 15% lower margin than similar products',
          impact: 45000,
          recommendation: 'Review pricing strategy or reduce material costs'
        },
        {
          type: 'trend',
          description: 'Manufacturing overhead increased 8% month-over-month',
          impact: 32000,
          recommendation: 'Investigate machine efficiency and maintenance schedule'
        }
      ]
    },
    generated_at: new Date().toISOString()
  }

  return NextResponse.json({
    success: true,
    data: analysisResults,
    message: 'Profitability analysis completed successfully'
  })
}