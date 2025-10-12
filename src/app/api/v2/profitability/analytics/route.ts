/**
 * HERA Profitability v2: Analytics API Endpoints
 * 
 * High-performance analytics endpoints for profitability analysis with
 * CODM reporting, variance analysis, and dimensional drill-down capabilities.
 * 
 * Smart Code: HERA.PROFITABILITY.ANALYTICS.API.V2
 */

import { NextRequest, NextResponse } from 'next/server'
import { assertV2, v2Body } from '@/lib/client/fetchV2'
import { callRPC } from '@/lib/db/rpc-client'
import { 
  type ProfitabilityQuery,
  validatePeriod,
  PROFITABILITY_ERROR_CODES,
  PROFITABILITY_SMART_CODES,
  formatPeriod
} from '@/lib/profitability/profitability-v2-standard'

// ============================================================================
// GET /api/v2/profitability/analytics - Advanced Analytics Queries
// ============================================================================

export async function GET(request: NextRequest) {
  const headers = assertV2(request)
  const { searchParams } = new URL(request.url)
  
  try {
    const organization_id = searchParams.get('organization_id')
    const analytics_type = searchParams.get('type') || 'summary'
    const period = searchParams.get('period')
    const compare_period = searchParams.get('compare_period')
    const segment = searchParams.get('segment')
    const currency = searchParams.get('currency') || 'AED'
    
    if (!organization_id) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
        message: 'organization_id is required',
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    let result: any
    
    switch (analytics_type) {
      case 'summary':
        result = await getProfitabilitySummary(organization_id, period, currency)
        break
        
      case 'codm':
        result = await getCODMAnalysis(organization_id, period, currency)
        break
        
      case 'variance':
        result = await getVarianceAnalysis(organization_id, period, compare_period, currency)
        break
        
      case 'product':
        result = await getProductProfitability(organization_id, period, currency)
        break
        
      case 'customer':
        result = await getCustomerProfitability(organization_id, period, currency)
        break
        
      case 'channel':
        result = await getChannelProfitability(organization_id, period, currency)
        break
        
      case 'trending':
        result = await getTrendingAnalysis(organization_id, period, currency)
        break
        
      case 'dimensional_completeness':
        result = await getDimensionalCompletenessReport(organization_id, period)
        break
        
      default:
        return NextResponse.json({
          error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
          message: `Unknown analytics type: ${analytics_type}`,
          apiVersion: 'v2'
        }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        analytics_type,
        organization_id,
        period,
        currency,
        generated_at: new Date().toISOString()
      },
      smart_code: PROFITABILITY_SMART_CODES.DIM_VALIDATE,
      apiVersion: 'v2'
    })
    
  } catch (error: any) {
    console.error('Profitability analytics error:', error)
    return NextResponse.json({
      error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
      message: error.message || 'Internal server error during analytics',
      apiVersion: 'v2'
    }, { status: 500 })
  }
}

// ============================================================================
// Analytics Helper Functions
// ============================================================================

async function getProfitabilitySummary(organization_id: string, period?: string, currency = 'AED') {
  const query = `
    SELECT 
      period,
      currency,
      SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END) as revenue,
      SUM(CASE WHEN account_group = 'COGS' THEN amount_net ELSE 0 END) as cogs,
      SUM(CASE WHEN account_group = 'OPEX' THEN amount_net ELSE 0 END) as opex,
      SUM(amount_net) as net_profit,
      COUNT(DISTINCT profit_center_id) as active_profit_centers,
      COUNT(DISTINCT cost_center_id) as active_cost_centers,
      COUNT(DISTINCT product_id) as active_products,
      COUNT(*) as transaction_count
    FROM fact_profitability_v2
    WHERE org_id = $1
      AND currency = $2
      ${period ? 'AND period = $3' : ''}
    GROUP BY period, currency
    ORDER BY period DESC
    LIMIT 12
  `
  
  const params = [organization_id, currency]
  if (period) params.push(period)
  
  const result = await callRPC('hera_universal_query_v2', {
    p_sql: query,
    p_params: params
  }, { mode: 'service' })
  
  return result.success ? result.data : []
}

async function getCODMAnalysis(organization_id: string, period?: string, currency = 'AED') {
  const query = `
    SELECT 
      codm_segment,
      profit_center_segment,
      SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END) as revenue,
      SUM(CASE WHEN account_group = 'COGS' THEN amount_net ELSE 0 END) as cogs,
      SUM(CASE WHEN account_group = 'OPEX' THEN amount_net ELSE 0 END) as opex,
      SUM(amount_net) as segment_profit,
      COUNT(DISTINCT profit_center_id) as profit_centers,
      AVG(CASE WHEN account_group = 'REVENUE' AND amount_net > 0 THEN amount_net END) as avg_revenue_transaction
    FROM fact_profitability_v2
    WHERE org_id = $1
      AND currency = $2
      AND pc_codm_included = true
      ${period ? 'AND period = $3' : ''}
    GROUP BY codm_segment, profit_center_segment
    ORDER BY segment_profit DESC
  `
  
  const params = [organization_id, currency]
  if (period) params.push(period)
  
  const result = await callRPC('hera_universal_query_v2', {
    p_sql: query,
    p_params: params
  }, { mode: 'service' })
  
  return result.success ? result.data : []
}

async function getVarianceAnalysis(organization_id: string, period?: string, compare_period?: string, currency = 'AED') {
  if (!period || !compare_period) {
    throw new Error('Both period and compare_period are required for variance analysis')
  }
  
  const query = `
    WITH current_period AS (
      SELECT 
        profit_center_code,
        product_code,
        account_group,
        SUM(amount_net) as current_amount
      FROM fact_profitability_v2
      WHERE org_id = $1 AND currency = $2 AND period = $3
      GROUP BY profit_center_code, product_code, account_group
    ),
    compare_period AS (
      SELECT 
        profit_center_code,
        product_code,
        account_group,
        SUM(amount_net) as compare_amount
      FROM fact_profitability_v2
      WHERE org_id = $1 AND currency = $2 AND period = $4
      GROUP BY profit_center_code, product_code, account_group
    )
    SELECT 
      c.profit_center_code,
      c.product_code,
      c.account_group,
      c.current_amount,
      COALESCE(p.compare_amount, 0) as compare_amount,
      c.current_amount - COALESCE(p.compare_amount, 0) as variance,
      CASE 
        WHEN COALESCE(p.compare_amount, 0) = 0 THEN NULL
        ELSE ((c.current_amount - COALESCE(p.compare_amount, 0)) / ABS(p.compare_amount)) * 100
      END as variance_pct
    FROM current_period c
    LEFT JOIN compare_period p USING (profit_center_code, product_code, account_group)
    WHERE ABS(c.current_amount - COALESCE(p.compare_amount, 0)) > 100
    ORDER BY ABS(variance) DESC
    LIMIT 50
  `
  
  const result = await callRPC('hera_universal_query_v2', {
    p_sql: query,
    p_params: [organization_id, currency, period, compare_period]
  }, { mode: 'service' })
  
  return result.success ? result.data : []
}

async function getProductProfitability(organization_id: string, period?: string, currency = 'AED') {
  const query = `
    SELECT 
      product_code,
      product_name,
      product_category,
      product_std_cost,
      SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END) as revenue,
      SUM(CASE WHEN account_group = 'COGS' THEN amount_net ELSE 0 END) as cogs,
      SUM(CASE WHEN account_group = 'OPEX' THEN amount_net ELSE 0 END) as allocated_opex,
      SUM(amount_net) as net_profit,
      SUM(qty) as total_quantity,
      COUNT(DISTINCT customer_id) as unique_customers,
      COUNT(*) as transaction_count,
      -- Profitability metrics
      CASE 
        WHEN SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END) > 0
        THEN (SUM(amount_net) / SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END)) * 100
        ELSE 0
      END as profit_margin_pct,
      CASE 
        WHEN SUM(qty) > 0
        THEN SUM(amount_net) / SUM(qty)
        ELSE 0
      END as profit_per_unit
    FROM fact_profitability_v2
    WHERE org_id = $1
      AND currency = $2
      AND product_id IS NOT NULL
      ${period ? 'AND period = $3' : ''}
    GROUP BY product_code, product_name, product_category, product_std_cost
    HAVING SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END) > 0
    ORDER BY net_profit DESC
    LIMIT 100
  `
  
  const params = [organization_id, currency]
  if (period) params.push(period)
  
  const result = await callRPC('hera_universal_query_v2', {
    p_sql: query,
    p_params: params
  }, { mode: 'service' })
  
  return result.success ? result.data : []
}

async function getCustomerProfitability(organization_id: string, period?: string, currency = 'AED') {
  const query = `
    SELECT 
      customer_code,
      customer_name,
      customer_segment,
      customer_tier,
      SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END) as revenue,
      SUM(CASE WHEN account_group = 'COGS' THEN amount_net ELSE 0 END) as cogs,
      SUM(CASE WHEN account_group = 'OPEX' THEN amount_net ELSE 0 END) as allocated_opex,
      SUM(amount_net) as net_profit,
      COUNT(DISTINCT product_id) as unique_products,
      COUNT(DISTINCT DATE(txn_date)) as active_days,
      COUNT(*) as transaction_count,
      -- Customer lifetime metrics
      CASE 
        WHEN COUNT(*) > 0
        THEN SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END) / COUNT(*)
        ELSE 0
      END as avg_transaction_value,
      CASE 
        WHEN SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END) > 0
        THEN (SUM(amount_net) / SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END)) * 100
        ELSE 0
      END as profit_margin_pct
    FROM fact_profitability_v2
    WHERE org_id = $1
      AND currency = $2
      AND customer_id IS NOT NULL
      ${period ? 'AND period = $3' : ''}
    GROUP BY customer_code, customer_name, customer_segment, customer_tier
    HAVING SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END) > 0
    ORDER BY net_profit DESC
    LIMIT 100
  `
  
  const params = [organization_id, currency]
  if (period) params.push(period)
  
  const result = await callRPC('hera_universal_query_v2', {
    p_sql: query,
    p_params: params
  }, { mode: 'service' })
  
  return result.success ? result.data : []
}

async function getChannelProfitability(organization_id: string, period?: string, currency = 'AED') {
  const query = `
    SELECT 
      COALESCE(channel_code, 'DIRECT') as channel_code,
      COALESCE(channel_name, 'Direct Sales') as channel_name,
      region_code,
      SUM(CASE WHEN account_group = 'REVENUE' THEN amount_net ELSE 0 END) as revenue,
      SUM(CASE WHEN account_group = 'COGS' THEN amount_net ELSE 0 END) as cogs,
      SUM(CASE WHEN account_group = 'OPEX' THEN amount_net ELSE 0 END) as allocated_opex,
      SUM(amount_net) as net_profit,
      COUNT(DISTINCT customer_id) as unique_customers,
      COUNT(DISTINCT product_id) as unique_products,
      COUNT(*) as transaction_count,
      AVG(CASE WHEN account_group = 'REVENUE' THEN amount_net END) as avg_revenue_per_txn
    FROM fact_profitability_v2
    WHERE org_id = $1
      AND currency = $2
      ${period ? 'AND period = $3' : ''}
    GROUP BY COALESCE(channel_code, 'DIRECT'), COALESCE(channel_name, 'Direct Sales'), region_code
    ORDER BY revenue DESC
  `
  
  const params = [organization_id, currency]
  if (period) params.push(period)
  
  const result = await callRPC('hera_universal_query_v2', {
    p_sql: query,
    p_params: params
  }, { mode: 'service' })
  
  return result.success ? result.data : []
}

async function getTrendingAnalysis(organization_id: string, period?: string, currency = 'AED') {
  const query = `
    WITH monthly_trends AS (
      SELECT 
        period,
        account_group,
        SUM(amount_net) as amount,
        COUNT(*) as transaction_count
      FROM fact_profitability_v2
      WHERE org_id = $1
        AND currency = $2
        AND period >= TO_CHAR(CURRENT_DATE - INTERVAL '11 months', 'YYYY-MM')
      GROUP BY period, account_group
      ORDER BY period
    ),
    trend_calc AS (
      SELECT 
        period,
        account_group,
        amount,
        transaction_count,
        LAG(amount) OVER (PARTITION BY account_group ORDER BY period) as prev_amount,
        LAG(transaction_count) OVER (PARTITION BY account_group ORDER BY period) as prev_count
      FROM monthly_trends
    )
    SELECT 
      period,
      account_group,
      amount,
      transaction_count,
      prev_amount,
      CASE 
        WHEN prev_amount IS NOT NULL AND prev_amount != 0
        THEN ((amount - prev_amount) / ABS(prev_amount)) * 100
        ELSE NULL
      END as growth_rate_pct,
      CASE 
        WHEN prev_count IS NOT NULL AND prev_count != 0
        THEN ((transaction_count - prev_count) / CAST(prev_count AS DECIMAL)) * 100
        ELSE NULL
      END as volume_growth_pct
    FROM trend_calc
    ORDER BY account_group, period
  `
  
  const params = [organization_id, currency]
  
  const result = await callRPC('hera_universal_query_v2', {
    p_sql: query,
    p_params: params
  }, { mode: 'service' })
  
  return result.success ? result.data : []
}

async function getDimensionalCompletenessReport(organization_id: string, period?: string) {
  const query = `
    SELECT 
      account_group,
      is_dimensionally_complete,
      COUNT(*) as transaction_count,
      SUM(ABS(amount_net)) as total_amount,
      COUNT(CASE WHEN profit_center_id IS NULL THEN 1 END) as missing_profit_center,
      COUNT(CASE WHEN cost_center_id IS NULL THEN 1 END) as missing_cost_center,
      COUNT(CASE WHEN product_id IS NULL THEN 1 END) as missing_product,
      COUNT(CASE WHEN customer_id IS NULL THEN 1 END) as missing_customer,
      ROUND(
        (COUNT(CASE WHEN is_dimensionally_complete THEN 1 END) * 100.0 / COUNT(*)), 2
      ) as completeness_pct
    FROM fact_profitability_v2
    WHERE org_id = $1
      ${period ? 'AND period = $2' : ''}
    GROUP BY account_group, is_dimensionally_complete
    ORDER BY account_group, is_dimensionally_complete
  `
  
  const params = [organization_id]
  if (period) params.push(period)
  
  const result = await callRPC('hera_universal_query_v2', {
    p_sql: query,
    p_params: params
  }, { mode: 'service' })
  
  return result.success ? result.data : []
}

// ============================================================================
// POST /api/v2/profitability/analytics - Custom Analytics Query
// ============================================================================

export async function POST(request: NextRequest) {
  const headers = assertV2(request)
  
  try {
    const body = await v2Body(request)
    const { custom_query, organization_id, parameters } = body
    
    if (!custom_query || !organization_id) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
        message: 'custom_query and organization_id are required',
        apiVersion: 'v2'
      }, { status: 400 })
    }
    
    // Security: Only allow SELECT queries
    if (!custom_query.trim().toUpperCase().startsWith('SELECT')) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_DATA_ACCESS_DENIED,
        message: 'Only SELECT queries are allowed',
        apiVersion: 'v2'
      }, { status: 403 })
    }
    
    // Ensure organization_id is always first parameter for security
    const queryParams = [organization_id, ...(parameters || [])]
    
    const result = await callRPC('hera_universal_query_v2', {
      p_sql: custom_query,
      p_params: queryParams
    }, { mode: 'service' })
    
    if (!result.success) {
      return NextResponse.json({
        error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
        message: result.error || 'Custom query execution failed',
        apiVersion: 'v2'
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: {
        query_type: 'custom',
        organization_id,
        row_count: result.data?.length || 0,
        executed_at: new Date().toISOString()
      },
      smart_code: PROFITABILITY_SMART_CODES.DIM_VALIDATE,
      apiVersion: 'v2'
    })
    
  } catch (error: any) {
    console.error('Custom analytics query error:', error)
    return NextResponse.json({
      error: PROFITABILITY_ERROR_CODES.ERR_DATA_NOT_FOUND,
      message: error.message || 'Internal server error during custom query',
      apiVersion: 'v2'
    }, { status: 500 })
  }
}