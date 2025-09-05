// HERA Analytics Chat API - Analytical Brain with Strict Guardrails
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// Initialize services lazily
let supabase: ReturnType<typeof createClient> | null = null
let anthropic: Anthropic | null = null

function getSupabase() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return supabase
}

function getAnthropic() {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    })
  }
  return anthropic
}

// Analytical thinking prompt
const ANALYTICS_SYSTEM_PROMPT = `You are the analytical brain for HERA's universal ERP/BI system.

You translate natural-language questions into validated smart codes and universal API calls that only operate over the six sacred tables:
1. core_organizations
2. core_entities  
3. core_dynamic_data
4. core_relationships
5. universal_transactions
6. universal_transaction_lines

NO OTHER TABLES EXIST. Guardrails forbid creating extra tables or columns.

Smart Code Policy:
- All business meaning is encoded in smart codes: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{N}
- Every row must have a valid smart_code
- Always validate codes before querying
- Prefer latest version codes

Available MCP Tools:
- search_smart_codes: Find codes by description
- validate_smart_code: Verify code validity
- query_entities: Fetch entities with filters
- query_transactions: Aggregated transaction queries
- search_relationships: Traverse entity relationships (max depth 2)
- post_transaction: Create balanced transactions

Decision Policy:
1. Intent → Codes: Search and validate smart codes first
2. Org Isolation: Always include organization_id
3. Aggregates First: Default to summaries with time.grain, group_by, metrics
4. Dynamic Fields: Use simple {field: value} filters
5. GL Invariants: Ensure debits = credits for GL transactions
6. Privacy: Avoid exposing PII/PHI

Output Format:
- Headline insight (1-2 sentences with numbers)
- Compact table or key metrics
- Narrative explanation of trends/anomalies
- Suggested next actions

Error Handling:
- ORG_FILTER_MISSING → Add organization_id
- SMART_CODE_INVALID → Search for valid alternatives
- GL_UNBALANCED → Adjust lines to balance
- TABLE_VIOLATION → Only 6 sacred tables allowed

Always be concise, analytical, and respect the guardrails.`

export async function POST(request: NextRequest) {
  try {
    const { message, organizationId, useAnalyticsBrain = true } = await request.json()
    
    if (!message || !organizationId) {
      return NextResponse.json(
        { error: 'Message and organizationId are required' },
        { status: 400 }
      )
    }
    
    // Use Claude for analytical processing
    if (useAnalyticsBrain && process.env.ANTHROPIC_API_KEY) {
      const completion = await getAnthropic()?.messages.create({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 1500,
        temperature: 0.2,
        system: ANALYTICS_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Organization ID: ${organizationId}
Query: ${message}

Analyze this query and provide insights using HERA's 6-table architecture.
If you need to search for smart codes or query data, describe the analytical approach.`
        }]
      })
      
      const responseText = completion.content[0].type === 'text' ? 
        completion.content[0].text : 'Unable to process request'
      
      // Extract analytical insights
      const insights = extractAnalyticalInsights(responseText)
      
      // If the response suggests queries, execute them
      if (insights.suggestedQueries) {
        const results = await executeAnalyticalQueries(organizationId, insights.suggestedQueries)
        
        // Convert results to business language
        const businessResponse = convertToBusinessLanguage(message, results)
        
        return NextResponse.json({
          success: true,
          message: businessResponse.summary,
          narrative: businessResponse.narrative,
          insights: businessResponse.insights,
          result: results, // Keep raw data for debugging
          nextActions: businessResponse.nextActions || insights.nextActions
        })
      }
      
      return NextResponse.json({
        success: true,
        message: responseText,
        analytical: true
      })
    }
    
    // Fallback pattern-based analytics
    return await handlePatternBasedAnalytics(message, organizationId)
    
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { 
        error: 'Analytics processing failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        guardrail: identifyGuardrailViolation(error)
      },
      { status: 500 }
    )
  }
}

function extractAnalyticalInsights(text: string) {
  // Parse Claude's analytical response
  const sections = text.split('\n\n')
  
  return {
    headline: sections[0] || 'Analysis complete',
    narrative: sections.find(s => s.length > 100) || '',
    suggestedQueries: extractSuggestedQueries(text),
    nextActions: sections.find(s => s.includes('Next') || s.includes('Drill'))?.split('\n') || []
  }
}

function extractSuggestedQueries(text: string) {
  // Extract query patterns from analytical response
  const queries = []
  const lowerText = text.toLowerCase()
  
  // Check if this is a forecast/prediction query
  if (lowerText.includes('forecast') || lowerText.includes('predict') || 
      lowerText.includes('next quarter') || lowerText.includes('next month') ||
      lowerText.includes('future') || lowerText.includes('projection')) {
    queries.push({
      type: 'forecast',
      method: 'revenue_projection',
      period: extractForecastPeriod(text),
      based_on: 'historical_data'
    })
    return queries
  }
  
  // Extract service-specific filters
  const servicePatterns = [
    { pattern: /haircut|hair cut/i, service: 'haircut' },
    { pattern: /color|colouring|coloring/i, service: 'color' },
    { pattern: /highlight/i, service: 'highlights' },
    { pattern: /treatment/i, service: 'treatment' },
    { pattern: /blowdry|blow dry/i, service: 'blowdry' },
    { pattern: /facial/i, service: 'facial' },
    { pattern: /nail|manicure|pedicure/i, service: 'nails' }
  ]
  
  let serviceFilter = null
  for (const { pattern, service } of servicePatterns) {
    if (pattern.test(text)) {
      serviceFilter = service
      break
    }
  }
  
  if (lowerText.includes('revenue') || lowerText.includes('sales')) {
    queries.push({
      type: 'transactions',
      filters: { 
        transaction_type: ['sale', 'appointment'],
        service: serviceFilter 
      },
      aggregation: { time_grain: 'month', metrics: ['sum', 'count'] }
    })
  }
  
  if (lowerText.includes('customer') || lowerText.includes('client')) {
    queries.push({
      type: 'entities',
      filters: { entity_type: 'customer' },
      limit: 50
    })
  }
  
  return queries.length > 0 ? queries : null
}

function extractForecastPeriod(text: string) {
  const lower = text.toLowerCase()
  if (lower.includes('next quarter')) return 'quarter'
  if (lower.includes('next month')) return 'month'
  if (lower.includes('next year')) return 'year'
  if (lower.includes('next week')) return 'week'
  return 'quarter' // default
}

async function generateRevenueForecast(organizationId: string, period: string = 'quarter') {
  // Get historical data for trend analysis
  const lookbackMonths = period === 'quarter' ? 6 : period === 'month' ? 3 : 12
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - lookbackMonths)
  
  const { data: historicalData, error } = await getSupabase()
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .in('transaction_type', ['sale', 'appointment', 'payment'])
    .gte('transaction_date', startDate.toISOString())
    .order('transaction_date', { ascending: true })
  
  if (error || !historicalData || historicalData.length === 0) {
    return {
      type: 'forecast',
      period: period,
      error: 'Insufficient historical data for forecast',
      suggestion: 'Need at least 3 months of transaction history'
    }
  }
  
  // Calculate monthly averages
  const monthlyTotals: Record<string, number> = {}
  historicalData.forEach(txn => {
    const monthKey = (txn.transaction_date as string).substring(0, 7) // YYYY-MM
    monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + ((txn.total_amount as number) || 0)
  })
  
  const monthlyValues = Object.values(monthlyTotals)
  const avgMonthlyRevenue = monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length
  
  // Calculate growth trend
  let growthRate = 0
  if (monthlyValues.length >= 2) {
    const firstMonth = monthlyValues[0]
    const lastMonth = monthlyValues[monthlyValues.length - 1]
    growthRate = ((lastMonth - firstMonth) / firstMonth) / (monthlyValues.length - 1)
  }
  
  // Generate forecast
  let forecastAmount = 0
  let forecastMonths = []
  const currentDate = new Date()
  
  if (period === 'month') {
    // Next month forecast
    forecastAmount = avgMonthlyRevenue * (1 + growthRate)
    forecastMonths = [{
      month: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 2).padStart(2, '0')}`,
      amount: forecastAmount
    }]
  } else if (period === 'quarter') {
    // Next quarter forecast
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date(currentDate)
      futureDate.setMonth(futureDate.getMonth() + i)
      const monthAmount = avgMonthlyRevenue * Math.pow(1 + growthRate, i)
      forecastAmount += monthAmount
      forecastMonths.push({
        month: `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`,
        amount: monthAmount
      })
    }
  } else if (period === 'year') {
    // Next year forecast
    for (let i = 1; i <= 12; i++) {
      const monthAmount = avgMonthlyRevenue * Math.pow(1 + growthRate, i)
      forecastAmount += monthAmount
    }
  }
  
  // Calculate confidence based on data consistency
  const variance = monthlyValues.reduce((acc, val) => {
    const diff = val - avgMonthlyRevenue
    return acc + (diff * diff)
  }, 0) / monthlyValues.length
  const stdDev = Math.sqrt(variance)
  const coefficientOfVariation = stdDev / avgMonthlyRevenue
  const confidence = Math.max(0, Math.min(95, 100 - (coefficientOfVariation * 100)))
  
  return {
    type: 'forecast',
    period: period,
    forecast_amount: forecastAmount,
    monthly_breakdown: forecastMonths,
    historical_avg: avgMonthlyRevenue,
    growth_rate: growthRate * 100,
    confidence: Math.round(confidence),
    based_on: {
      months_analyzed: monthlyValues.length,
      total_historical: monthlyValues.reduce((a, b) => a + b, 0),
      trend: growthRate > 0.05 ? 'growing' : growthRate < -0.05 ? 'declining' : 'stable'
    }
  }
}

async function executeAnalyticalQueries(organizationId: string, queries: any[]) {
  const results = []
  
  for (const query of queries) {
    try {
      if (query.type === 'forecast') {
        // Handle forecast queries
        const forecastResult = await generateRevenueForecast(organizationId, query.period)
        results.push(forecastResult)
      } else if (query.type === 'transactions') {
        let baseQuery = supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          
        // Apply transaction type filter
        if (query.filters?.transaction_type) {
          if (Array.isArray(query.filters.transaction_type)) {
            baseQuery = baseQuery.in('transaction_type', query.filters.transaction_type)
          } else {
            baseQuery = baseQuery.eq('transaction_type', query.filters.transaction_type)
          }
        }
        
        const { data, error } = await baseQuery.limit(200)
          
        if (!error && data) {
          // Apply service filter on metadata
          let filteredData = data
          if (query.filters?.service) {
            filteredData = data.filter(t => {
              const serviceName = ((t.metadata as any)?.service_name as string)?.toLowerCase() || ''
              return serviceName.includes(query.filters.service.toLowerCase())
            })
          }
          
          results.push({
            type: 'transactions',
            count: filteredData.length,
            total: filteredData.reduce((sum, t) => sum + ((t.total_amount as number) || 0), 0),
            data: aggregateData(filteredData, query.aggregation),
            filter_applied: query.filters?.service || 'none'
          })
        }
      } else if (query.type === 'entities') {
        const { data, error } = await getSupabase()
          .from('core_entities')
          .select('*, core_dynamic_data(*)')
          .eq('organization_id', organizationId)
          .eq('entity_type', query.filters.entity_type)
          .limit(query.limit || 50)
          
        if (!error && data) {
          results.push({
            type: 'entities',
            count: data.length,
            data: data.map(transformEntityWithDynamicData)
          })
        }
      }
    } catch (err) {
      console.error('Query execution error:', err)
    }
  }
  
  return results
}

function aggregateData(data: any[], aggregation: any) {
  if (!aggregation || !aggregation.time_grain) return data.slice(0, 10)
  
  // Simple time-based aggregation
  const groups: Record<string, any> = {}
  
  data.forEach(record => {
    const date = new Date(record.transaction_date)
    let key = ''
    
    switch (aggregation.time_grain) {
      case 'day':
        key = date.toISOString().split('T')[0]
        break
      case 'week':
        const week = Math.floor(date.getDate() / 7)
        key = `${date.getFullYear()}-W${week}`
        break
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      default:
        key = date.toISOString()
    }
    
    if (!groups[key]) {
      groups[key] = { period: key, count: 0, sum: 0 }
    }
    
    groups[key].count++
    groups[key].sum += record.total_amount || 0
  })
  
  return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period))
}

function transformEntityWithDynamicData(entity: any) {
  const fields: Record<string, any> = {}
  
  entity.core_dynamic_data?.forEach((field: any) => {
    fields[field.field_name] = field.field_value_text || 
                              field.field_value_number || 
                              field.field_value_boolean ||
                              field.field_value_date
  })
  
  return {
    id: entity.id,
    name: entity.entity_name,
    type: entity.entity_type,
    code: entity.entity_code,
    smart_code: entity.smart_code,
    ...fields
  }
}

async function handlePatternBasedAnalytics(message: string, organizationId: string) {
  const lower = message.toLowerCase()
  
  // Extract service filter
  let serviceFilter: string | null = null
  const services = ['haircut', 'color', 'highlight', 'treatment', 'blowdry', 'facial', 'nail']
  for (const service of services) {
    if (lower.includes(service)) {
      serviceFilter = service
      break
    }
  }
  
  // Revenue analysis
  if (lower.includes('revenue') || lower.includes('sales')) {
    const { data } = await getSupabase()
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .in('transaction_type', ['sale', 'appointment', 'payment'])
      .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(200)
    
    // Filter by service if specified
    let filteredData = data || []
    if (serviceFilter && data) {
      filteredData = data.filter(t => {
        const serviceName = ((t.metadata as any)?.service_name as string)?.toLowerCase() || ''
        return serviceName.includes(serviceFilter)
      })
    }
    
    const total = filteredData.reduce((sum, t) => sum + ((t.total_amount as number) || 0), 0)
    const count = filteredData.length
    
    // Convert to business language
    const businessResponse = convertToBusinessLanguage(message, [{
      type: 'transactions',
      count: count,
      total: total,
      filter_applied: serviceFilter,
      data: [{
        period: new Date().toISOString().substring(0, 7),
        count: count,
        sum: total
      }]
    }])
    
    return NextResponse.json({
      success: true,
      message: businessResponse.summary,
      narrative: businessResponse.narrative,
      insights: businessResponse.insights,
      result: {
        type: 'revenue_analysis',
        service_filter: serviceFilter,
        total_revenue: total,
        transaction_count: count,
        average_transaction: count > 0 ? total / count : 0,
        period: 'last_30_days',
        breakdown: serviceFilter ? null : groupByService(filteredData)
      },
      nextActions: businessResponse.nextActions
    })
  }
  
  // Customer analysis
  if (lower.includes('customer') || lower.includes('client')) {
    const { data } = await getSupabase()
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'customer')
      .limit(50)
    
    // Convert to business language
    const businessResponse = convertToBusinessLanguage(message, [{
      type: 'entities',
      count: data?.length || 0,
      data: data || []
    }])
    
    return NextResponse.json({
      success: true,
      message: businessResponse.summary,
      narrative: businessResponse.narrative,
      insights: businessResponse.insights,
      result: {
        type: 'customer_analysis',
        count: data?.length || 0,
        data: data?.slice(0, 10) || []
      },
      nextActions: businessResponse.nextActions
    })
  }
  
  // Default
  return NextResponse.json({
    success: false,
    error: 'Unable to analyze this query. Try asking about revenue, customers, or specific metrics.',
    suggestions: [
      'Show revenue trend last 3 months',
      'List top customers by value',
      'Analyze transaction patterns',
      'Check inventory levels'
    ]
  })
}

function groupByService(transactions: any[]) {
  const serviceGroups: Record<string, { count: number; total: number; service: string }> = {}
  
  transactions.forEach(t => {
    const serviceName = t.metadata?.service_name || 'Uncategorized'
    if (!serviceGroups[serviceName]) {
      serviceGroups[serviceName] = { count: 0, total: 0, service: serviceName }
    }
    serviceGroups[serviceName].count++
    serviceGroups[serviceName].total += t.total_amount || 0
  })
  
  // Filter out empty groups and sort by total
  return Object.values(serviceGroups)
    .filter(group => group.total > 0)
    .sort((a, b) => b.total - a.total)
}

function convertToBusinessLanguage(query: string, results: any[]) {
  const response = {
    summary: '',
    narrative: '',
    insights: [] as string[],
    nextActions: [] as string[]
  }
  
  // Analyze the query intent
  const queryLower = query.toLowerCase()
  const isRevenue = queryLower.includes('revenue') || queryLower.includes('sales')
  const isCustomer = queryLower.includes('customer') || queryLower.includes('client')
  const isForecast = queryLower.includes('forecast') || queryLower.includes('predict') || queryLower.includes('next')
  const hasTimeFrame = queryLower.includes('month') || queryLower.includes('week') || queryLower.includes('day')
  
  // Process results
  for (const result of results) {
    if (result.type === 'forecast') {
      // Handle forecast results
      if (result.error) {
        response.summary = result.error
        response.narrative = result.suggestion || 'Please ensure you have sufficient historical data for accurate forecasting.'
        response.nextActions.push('Generate more transaction data to enable forecasting')
        continue
      }
      
      const forecastAmount = result.forecast_amount || 0
      const confidence = result.confidence || 0
      const growthRate = result.growth_rate || 0
      const trend = result.based_on?.trend || 'stable'
      const periodLabel = result.period === 'quarter' ? 'next quarter' : 
                         result.period === 'month' ? 'next month' : 
                         result.period === 'year' ? 'next year' : result.period
      
      // Create business-friendly summary
      response.summary = `Based on your historical data, I forecast ${periodLabel}'s revenue to be $${forecastAmount.toLocaleString()} with ${confidence}% confidence.`
      
      // Add narrative context
      if (trend === 'growing') {
        response.narrative = `Your business shows a positive growth trend of ${Math.abs(growthRate).toFixed(1)}% per month. The forecast reflects this upward trajectory, suggesting continued business expansion.`
      } else if (trend === 'declining') {
        response.narrative = `Your business shows a declining trend of ${Math.abs(growthRate).toFixed(1)}% per month. The forecast accounts for this, but immediate action is recommended to reverse this trend.`
      } else {
        response.narrative = `Your business shows stable revenue patterns. The forecast assumes this consistency will continue.`
      }
      
      // Add insights
      response.insights.push(`Historical average: $${result.historical_avg.toLocaleString()} per month`)
      response.insights.push(`Growth trend: ${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}% monthly`)
      response.insights.push(`Based on ${result.based_on.months_analyzed} months of data`)
      
      if (confidence < 70) {
        response.insights.push('⚠️ Lower confidence due to inconsistent historical data')
      }
      
      // Monthly breakdown if available
      if (result.monthly_breakdown && result.monthly_breakdown.length > 0) {
        const monthlyDetails = result.monthly_breakdown
          .map(m => `${m.month}: $${Math.round(m.amount).toLocaleString()}`)
          .join(', ')
        response.insights.push(`Monthly forecast: ${monthlyDetails}`)
      }
      
      // Suggest actions based on forecast
      if (trend === 'growing') {
        response.nextActions.push('Scale operations to handle projected growth')
        response.nextActions.push('Consider increasing inventory/staff for higher demand')
      } else if (trend === 'declining') {
        response.nextActions.push('Analyze causes of revenue decline')
        response.nextActions.push('Implement marketing campaigns to boost sales')
        response.nextActions.push('Review pricing and service offerings')
      } else {
        response.nextActions.push('Explore growth opportunities to exceed forecast')
        response.nextActions.push('Monitor performance against forecast weekly')
      }
      
    } else if (result.type === 'transactions' && isRevenue) {
      const total = result.total || 0
      const count = result.count || 0
      const avg = count > 0 ? total / count : 0
      const serviceFilter = result.filter_applied && result.filter_applied !== 'none'
      
      // Create business-friendly summary
      if (serviceFilter) {
        response.summary = `Your ${serviceFilter} revenue for this period is $${total.toLocaleString()} from ${count} transactions, averaging $${Math.round(avg).toLocaleString()} per transaction.`
      } else {
        response.summary = `Your total revenue for this period is $${total.toLocaleString()} from ${count} transactions, averaging $${Math.round(avg).toLocaleString()} per transaction.`
      }
      
      // Add narrative context
      if (count === 0) {
        response.narrative = `No transactions were found for the specified criteria. This could mean no ${serviceFilter || 'sales'} occurred during this period.`
      } else if (avg > 150) {
        response.narrative = `The high average transaction value of $${Math.round(avg)} suggests premium services or bundled offerings are performing well.`
      } else if (avg < 50) {
        response.narrative = `The average transaction value of $${Math.round(avg)} indicates mostly lower-priced services. Consider upselling opportunities.`
      } else {
        response.narrative = `Transaction values are within typical range for salon services.`
      }
      
      // Add insights based on data patterns
      if (result.data && result.data.length > 0) {
        const periods = result.data
        const trend = analyzeTrend(periods)
        if (trend.growing) {
          response.insights.push(`Revenue is trending upward with ${trend.growthRate}% growth`)
        } else if (trend.declining) {
          response.insights.push(`Revenue has declined by ${Math.abs(trend.growthRate)}% - investigate potential causes`)
        }
      }
      
      // Add service breakdown if available
      if (result.breakdown && !serviceFilter) {
        const breakdown = result.breakdown
        if (breakdown && breakdown.length > 0 && breakdown[0].total > 0) {
          const topService = breakdown[0]
          response.insights.push(`${topService.service} is your top revenue generator at $${topService.total.toLocaleString()}`)
        } else {
          response.insights.push('Revenue is not yet categorized by service type')
        }
      }
      
      // Suggest next actions
      if (count < 50) {
        response.nextActions.push('Consider marketing campaigns to increase transaction volume')
      }
      if (avg < 75) {
        response.nextActions.push('Review service pricing and explore upselling opportunities')
      }
      if (serviceFilter && count > 20) {
        response.nextActions.push(`${serviceFilter} services are popular - ensure adequate staff training`)
      }
      
    } else if (result.type === 'entities' && isCustomer) {
      const count = result.count || 0
      response.summary = `You have ${count} customers in your database.`
      
      if (count < 100) {
        response.narrative = 'Building your customer base should be a priority. Focus on retention and referral programs.'
      } else if (count < 500) {
        response.narrative = 'Your customer base is growing. Implement loyalty programs to increase retention.'
      } else {
        response.narrative = 'You have a substantial customer base. Focus on segmentation for targeted marketing.'
      }
      
      response.insights.push(`Average customers per stylist: ${Math.round(count / 4)}`)
      response.nextActions.push('Analyze customer visit frequency to identify at-risk clients')
    }
  }
  
  // Fallback for empty results
  if (!response.summary) {
    response.summary = 'No data found matching your query criteria.'
    response.narrative = 'Try adjusting your search parameters or time frame.'
    response.nextActions.push('Verify data exists for the specified period')
  }
  
  return response
}

function analyzeTrend(periods: any[]) {
  if (periods.length < 2) {
    return { growing: false, declining: false, growthRate: 0 }
  }
  
  const firstPeriod = periods[0]
  const lastPeriod = periods[periods.length - 1]
  const growthRate = ((lastPeriod.sum - firstPeriod.sum) / firstPeriod.sum) * 100
  
  return {
    growing: growthRate > 5,
    declining: growthRate < -5,
    growthRate: Math.round(growthRate)
  }
}

function identifyGuardrailViolation(error: any): string | null {
  const message = error?.message || ''
  
  if (message.includes('organization')) return 'ORG_FILTER_MISSING'
  if (message.includes('smart_code')) return 'SMART_CODE_INVALID'
  if (message.includes('balance')) return 'GL_UNBALANCED'
  if (message.includes('table')) return 'TABLE_VIOLATION'
  
  return null
}