// ================================================================================
// HERA UNIVERSAL CASHFLOW API ENDPOINT
// RESTful API for cashflow statement generation and analysis
// Smart Code: HERA.API.CF.ROUTE.v1
// ================================================================================

import { NextRequest, NextResponse } from 'next/server'
import { universalCashflowAPI } from '@/lib/cashflow/cashflow-engine'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json({
        success: false,
        error: 'organization_id is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'generate_statement':
        return await handleGenerateStatement(searchParams, organizationId)
        
      case 'generate_forecast':
        return await handleGenerateForecast(searchParams, organizationId)
        
      case 'analyze_trends':
        return await handleAnalyzeTrends(searchParams, organizationId)
        
      case 'health_check':
        return NextResponse.json({
          success: true,
          message: 'HERA Cashflow API is operational',
          version: '1.0.0',
          capabilities: [
            'Direct method cashflow statements',
            'Indirect method cashflow statements', 
            'Multi-currency support',
            'Cashflow forecasting',
            'Trend analysis',
            'Industry benchmarking'
          ]
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: generate_statement, generate_forecast, analyze_trends, health_check'
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Cashflow API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, organization_id } = body

    if (!organization_id) {
      return NextResponse.json({
        success: false,
        error: 'organization_id is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'setup_tracking':
        return await handleSetupTracking(body)
        
      case 'bulk_generate':
        return await handleBulkGenerate(body)
        
      case 'custom_analysis':
        return await handleCustomAnalysis(body)

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: setup_tracking, bulk_generate, custom_analysis'
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Cashflow API POST error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// ================================================================================
// GET REQUEST HANDLERS
// ================================================================================

async function handleGenerateStatement(searchParams: URLSearchParams, organizationId: string) {
  const startDate = searchParams.get('start_date')
  const endDate = searchParams.get('end_date')
  const method = (searchParams.get('method') as 'direct' | 'indirect') || 'direct'
  const currency = searchParams.get('currency') || 'AED'

  if (!startDate || !endDate) {
    return NextResponse.json({
      success: false,
      error: 'start_date and end_date are required'
    }, { status: 400 })
  }

  const statement = await universalCashflowAPI.generateCashflowStatement({
    organizationId,
    startDate,
    endDate,
    method,
    currency
  })

  return NextResponse.json({
    success: true,
    data: statement,
    message: `${method} method cashflow statement generated successfully`,
    meta: {
      period: `${startDate} to ${endDate}`,
      method,
      currency,
      generated_at: new Date().toISOString()
    }
  })
}

async function handleGenerateForecast(searchParams: URLSearchParams, organizationId: string) {
  const forecastMonths = parseInt(searchParams.get('forecast_months') || '12')
  const baselineMonths = parseInt(searchParams.get('baseline_months') || '6')
  const currency = searchParams.get('currency') || 'AED'

  const forecasts = await universalCashflowAPI.generateCashflowForecast({
    organizationId,
    forecastMonths,
    baselineMonths,
    currency
  })

  return NextResponse.json({
    success: true,
    data: forecasts,
    message: `${forecastMonths}-month cashflow forecast generated successfully`,
    meta: {
      forecast_periods: forecastMonths,
      baseline_periods: baselineMonths,
      currency,
      generated_at: new Date().toISOString()
    }
  })
}

async function handleAnalyzeTrends(searchParams: URLSearchParams, organizationId: string) {
  const periods = parseInt(searchParams.get('periods') || '6')
  const currency = searchParams.get('currency') || 'AED'

  const analysis = await universalCashflowAPI.analyzeCashflowTrends({
    organizationId,
    periods,
    currency
  })

  return NextResponse.json({
    success: true,
    data: analysis,
    message: `Cashflow trend analysis completed for ${periods} periods`,
    meta: {
      periods_analyzed: periods,
      currency,
      analyzed_at: new Date().toISOString()
    }
  })
}

// ================================================================================
// POST REQUEST HANDLERS  
// ================================================================================

async function handleSetupTracking(body: any) {
  const { organization_id, industry } = body

  const result = await universalCashflowAPI.setupCashflowTracking(organization_id, industry)

  return NextResponse.json({
    success: true,
    data: result,
    message: 'Cashflow tracking setup completed successfully'
  })
}

async function handleBulkGenerate(body: any) {
  const { 
    organization_id, 
    periods, 
    method = 'direct', 
    currency = 'AED' 
  } = body

  const results = []
  const currentDate = new Date()

  for (let i = 0; i < periods.length; i++) {
    const period = periods[i]
    
    try {
      const statement = await universalCashflowAPI.generateCashflowStatement({
        organizationId: organization_id,
        startDate: period.start_date,
        endDate: period.end_date,
        method,
        currency
      })

      results.push({
        period: `${period.start_date} to ${period.end_date}`,
        statement,
        success: true
      })
    } catch (error: any) {
      results.push({
        period: `${period.start_date} to ${period.end_date}`,
        error: error.message,
        success: false
      })
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      statements: results,
      total_periods: periods.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    },
    message: `Bulk cashflow generation completed for ${periods.length} periods`
  })
}

async function handleCustomAnalysis(body: any) {
  const {
    organization_id,
    analysis_type,
    parameters
  } = body

  let analysisResult

  switch (analysis_type) {
    case 'liquidity_analysis':
      analysisResult = await performLiquidityAnalysis(organization_id, parameters)
      break
      
    case 'cash_conversion_cycle':
      analysisResult = await calculateCashConversionCycle(organization_id, parameters)
      break
      
    case 'seasonal_analysis':
      analysisResult = await performSeasonalAnalysis(organization_id, parameters)
      break
      
    case 'benchmark_comparison':
      analysisResult = await performBenchmarkComparison(organization_id, parameters)
      break

    default:
      return NextResponse.json({
        success: false,
        error: 'Invalid analysis_type. Supported: liquidity_analysis, cash_conversion_cycle, seasonal_analysis, benchmark_comparison'
      }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    data: analysisResult,
    message: `${analysis_type} completed successfully`
  })
}

// ================================================================================
// CUSTOM ANALYSIS FUNCTIONS
// ================================================================================

async function performLiquidityAnalysis(organizationId: string, parameters: any) {
  // Generate recent cashflow data
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const statement = await universalCashflowAPI.generateCashflowStatement({
    organizationId,
    startDate,
    endDate,
    method: 'direct',
    currency: parameters.currency || 'AED'
  })

  // Calculate liquidity ratios
  const operatingCF = statement.operating_activities.find(a => a.is_total)?.amount || 0
  const currentCashPosition = statement.cash_ending
  const avgDailyCashBurn = Math.abs(operatingCF) / 90

  return {
    current_cash_position: currentCashPosition,
    operating_cashflow_90d: operatingCF,
    avg_daily_cash_burn: avgDailyCashBurn,
    cash_runway_days: avgDailyCashBurn > 0 ? currentCashPosition / avgDailyCashBurn : null,
    liquidity_status: currentCashPosition > 0 && operatingCF > 0 ? 'healthy' : 
                     currentCashPosition > 0 ? 'stable' : 'at_risk',
    recommendations: generateLiquidityRecommendations(currentCashPosition, operatingCF, avgDailyCashBurn)
  }
}

async function calculateCashConversionCycle(organizationId: string, parameters: any) {
  // This would calculate Days Sales Outstanding (DSO), Days Inventory Outstanding (DIO), 
  // and Days Payable Outstanding (DPO) to determine cash conversion cycle
  
  return {
    cash_conversion_cycle_days: 45, // Placeholder
    days_sales_outstanding: 30,
    days_inventory_outstanding: 25,
    days_payable_outstanding: 10,
    industry_benchmark: 50,
    performance_vs_benchmark: 'above_average',
    recommendations: [
      'Consider offering early payment discounts to reduce DSO',
      'Optimize inventory management to reduce DIO',
      'Negotiate extended payment terms with suppliers'
    ]
  }
}

async function performSeasonalAnalysis(organizationId: string, parameters: any) {
  // Analyze cashflow patterns across different months/quarters
  const months = parameters.months || 12
  const monthlyData = []

  for (let i = 0; i < months; i++) {
    const endDate = new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const startDate = new Date(Date.now() - (i + 1) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    try {
      const statement = await universalCashflowAPI.generateCashflowStatement({
        organizationId,
        startDate,
        endDate,
        method: 'direct',
        currency: parameters.currency || 'AED'
      })

      monthlyData.push({
        period: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        operating_cf: statement.operating_activities.find(a => a.is_total)?.amount || 0,
        net_change: statement.net_change_in_cash,
        cash_ending: statement.cash_ending
      })
    } catch (error) {
      // Handle errors gracefully
      monthlyData.push({
        period: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
        operating_cf: 0,
        net_change: 0,
        cash_ending: 0,
        error: 'Data not available'
      })
    }
  }

  return {
    monthly_data: monthlyData.reverse(),
    seasonal_patterns: analyzeSeasonalPatterns(monthlyData),
    peak_months: identifyPeakMonths(monthlyData),
    low_months: identifyLowMonths(monthlyData),
    recommendations: generateSeasonalRecommendations(monthlyData)
  }
}

async function performBenchmarkComparison(organizationId: string, parameters: any) {
  // Compare organization's cashflow metrics against industry benchmarks
  const industry = parameters.industry || 'general'
  
  const benchmarks = getIndustryBenchmarks(industry)
  
  // Get organization's actual metrics
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const statement = await universalCashflowAPI.generateCashflowStatement({
    organizationId,
    startDate,
    endDate,
    method: 'direct',
    currency: parameters.currency || 'AED'
  })

  const operatingCF = statement.operating_activities.find(a => a.is_total)?.amount || 0

  return {
    organization_metrics: {
      annual_operating_cf: operatingCF,
      cash_position: statement.cash_ending,
      net_change_in_cash: statement.net_change_in_cash
    },
    industry_benchmarks: benchmarks,
    comparison: {
      operating_cf_vs_benchmark: operatingCF / benchmarks.avg_operating_cf,
      cash_position_vs_benchmark: statement.cash_ending / benchmarks.avg_cash_position,
      overall_score: calculateOverallScore(statement, benchmarks)
    },
    recommendations: generateBenchmarkRecommendations(statement, benchmarks)
  }
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

function generateLiquidityRecommendations(cashPosition: number, operatingCF: number, dailyBurn: number): string[] {
  const recommendations = []
  
  if (cashPosition < 0) {
    recommendations.push('Critical: Negative cash position requires immediate attention')
    recommendations.push('Consider emergency financing options or accelerated collections')
  }
  
  if (operatingCF < 0) {
    recommendations.push('Operating cashflow is negative - review pricing and cost structure')
    recommendations.push('Focus on improving collections and managing payables')
  }
  
  const runwayDays = dailyBurn > 0 ? cashPosition / dailyBurn : null
  if (runwayDays && runwayDays < 90) {
    recommendations.push(`Cash runway of ${Math.round(runwayDays)} days is concerning`)
    recommendations.push('Implement aggressive cash management strategies')
  }
  
  return recommendations
}

function analyzeSeasonalPatterns(monthlyData: any[]): any {
  // Simple seasonal analysis
  const q1Avg = monthlyData.slice(0, 3).reduce((sum, d) => sum + d.operating_cf, 0) / 3
  const q2Avg = monthlyData.slice(3, 6).reduce((sum, d) => sum + d.operating_cf, 0) / 3
  const q3Avg = monthlyData.slice(6, 9).reduce((sum, d) => sum + d.operating_cf, 0) / 3
  const q4Avg = monthlyData.slice(9, 12).reduce((sum, d) => sum + d.operating_cf, 0) / 3

  return {
    q1_average: q1Avg,
    q2_average: q2Avg,
    q3_average: q3Avg,
    q4_average: q4Avg,
    strongest_quarter: getStrongestQuarter([q1Avg, q2Avg, q3Avg, q4Avg]),
    weakest_quarter: getWeakestQuarter([q1Avg, q2Avg, q3Avg, q4Avg])
  }
}

function identifyPeakMonths(monthlyData: any[]): any[] {
  return monthlyData
    .sort((a, b) => b.operating_cf - a.operating_cf)
    .slice(0, 3)
    .map(d => ({ period: d.period, operating_cf: d.operating_cf }))
}

function identifyLowMonths(monthlyData: any[]): any[] {
  return monthlyData
    .sort((a, b) => a.operating_cf - b.operating_cf)
    .slice(0, 3)
    .map(d => ({ period: d.period, operating_cf: d.operating_cf }))
}

function generateSeasonalRecommendations(monthlyData: any[]): string[] {
  return [
    'Plan cash reserves for traditionally weaker months',
    'Consider seasonal financing facilities',
    'Adjust inventory and staffing based on seasonal patterns',
    'Implement promotional strategies during peak periods'
  ]
}

function getIndustryBenchmarks(industry: string): any {
  // Industry benchmark data (would typically come from external sources)
  const benchmarks: Record<string, any> = {
    restaurant: {
      avg_operating_cf: 120000,
      avg_cash_position: 45000,
      avg_cash_conversion_days: 5
    },
    retail: {
      avg_operating_cf: 200000,
      avg_cash_position: 80000,
      avg_cash_conversion_days: 35
    },
    healthcare: {
      avg_operating_cf: 300000,
      avg_cash_position: 120000,
      avg_cash_conversion_days: 45
    },
    salon: {
      avg_operating_cf: 80000,
      avg_cash_position: 25000,
      avg_cash_conversion_days: 3
    },
    general: {
      avg_operating_cf: 150000,
      avg_cash_position: 60000,
      avg_cash_conversion_days: 30
    }
  }

  return benchmarks[industry] || benchmarks.general
}

function calculateOverallScore(statement: any, benchmarks: any): number {
  const operatingCF = statement.operating_activities.find((a: any) => a.is_total)?.amount || 0
  const cashPosition = statement.cash_ending

  const operatingScore = Math.min((operatingCF / benchmarks.avg_operating_cf) * 50, 50)
  const cashScore = Math.min((cashPosition / benchmarks.avg_cash_position) * 50, 50)

  return Math.max(0, operatingScore + cashScore)
}

function generateBenchmarkRecommendations(statement: any, benchmarks: any): string[] {
  const recommendations = []
  const operatingCF = statement.operating_activities.find((a: any) => a.is_total)?.amount || 0
  
  if (operatingCF < benchmarks.avg_operating_cf) {
    recommendations.push('Operating cashflow is below industry average - focus on improving operational efficiency')
  }
  
  if (statement.cash_ending < benchmarks.avg_cash_position) {
    recommendations.push('Cash position is below industry benchmark - consider building cash reserves')
  }
  
  return recommendations
}

function getStrongestQuarter(quarters: number[]): string {
  const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4']
  const maxIndex = quarters.indexOf(Math.max(...quarters))
  return quarterNames[maxIndex]
}

function getWeakestQuarter(quarters: number[]): string {
  const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4']
  const minIndex = quarters.indexOf(Math.min(...quarters))
  return quarterNames[minIndex]
}