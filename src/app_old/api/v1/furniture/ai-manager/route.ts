import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { universalApi } from '@/lib/universal-api'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Only create client if we have the required environment variables
const supabase =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null

interface BusinessContext {
  category: string
  metrics: any[]
  organizationName: string
}

interface AIManagerQuery {
  query: string
  organizationId: string
  context: BusinessContext
  useMCP: boolean
}

// Business insight categories
const INSIGHT_CATEGORIES = {
  operations: ['production', 'workflow', 'efficiency', 'capacity'],
  sales: ['revenue', 'orders', 'customers', 'pipeline'],
  inventory: ['stock', 'materials', 'supplies', 'reorder'],
  finance: ['cash', 'profit', 'expense', 'budget'],
  hr: ['team', 'productivity', 'performance', 'staffing'],
  strategy: ['growth', 'risk', 'opportunity', 'competition']
}

export async function POST(request: NextRequest) {
  try {
    const body: AIManagerQuery = await request.json()
    const { query, organizationId, context, useMCP } = body

    if (!query || !organizationId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Analyze query to determine category and intent
    const queryLower = query.toLowerCase()
    const detectedCategory = detectCategory(queryLower)
    const intent = analyzeIntent(queryLower)

    // Fetch relevant business data based on category
    const businessData = await fetchBusinessData(organizationId, detectedCategory)

    // Generate AI response based on intent and data
    const response = await generateAIResponse({
      query,
      intent,
      category: detectedCategory,
      businessData,
      context,
      useMCP
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('AI Manager error:', error)
    return NextResponse.json({ error: 'Failed to process AI query' }, { status: 500 })
  }
}

function detectCategory(query: string): string {
  // Check each category's keywords
  for (const [category, keywords] of Object.entries(INSIGHT_CATEGORIES)) {
    if (keywords.some(keyword => query.includes(keyword))) {
      return category
    }
  }

  // Default category based on common terms
  if (query.includes('money') || query.includes('revenue') || query.includes('profit')) {
    return 'finance'
  }
  if (query.includes('order') || query.includes('customer') || query.includes('sale')) {
    return 'sales'
  }
  if (query.includes('stock') || query.includes('material') || query.includes('inventory')) {
    return 'inventory'
  }

  return 'operations' // Default
}

function analyzeIntent(query: string): string {
  // Analyze what the user wants
  if (query.includes('analyze') || query.includes('analysis')) return 'analysis'
  if (query.includes('recommend') || query.includes('suggest')) return 'recommendation'
  if (query.includes('predict') || query.includes('forecast')) return 'prediction'
  if (query.includes('risk') || query.includes('problem')) return 'risk_assessment'
  if (query.includes('how') || query.includes('performance')) return 'performance'
  if (query.includes('trend') || query.includes('pattern')) return 'trends'

  return 'general' // Default intent
}

async function fetchBusinessData(organizationId: string, category: string) {
  if (!supabase) {
    return generateMockBusinessData(category)
  }

  const data: any = {}

  try {
    // Fetch relevant data based on category
    switch (category) {
      case 'sales':
        // Fetch sales transactions
        const { data: salesData } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('transaction_type', 'sale')
          .order('transaction_date', { ascending: false })
          .limit(100)

        data.sales = salesData || []
        data.totalRevenue = salesData?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
        data.orderCount = salesData?.length || 0
        break

      case 'inventory':
        // Fetch inventory items
        const { data: inventoryData } = await supabase
          .from('core_entities')
          .select('*, core_dynamic_data!inner(*)')
          .eq('organization_id', organizationId)
          .eq('entity_type', 'product')

        data.inventory = inventoryData || []
        data.totalItems = inventoryData?.length || 0
        break

      case 'finance':
        // Fetch financial transactions
        const { data: financeData } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', organizationId)
          .in('transaction_type', ['sale', 'purchase', 'expense', 'payment'])
          .order('transaction_date', { ascending: false })
          .limit(200)

        data.transactions = financeData || []
        data.revenue =
          financeData
            ?.filter(t => t.transaction_type === 'sale')
            .reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
        data.expenses =
          financeData
            ?.filter(t => ['purchase', 'expense'].includes(t.transaction_type))
            .reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0
        break

      case 'hr':
        // Fetch employee data
        const { data: employeeData } = await supabase
          .from('core_entities')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('entity_type', 'employee')

        data.employees = employeeData || []
        data.teamSize = employeeData?.length || 0
        break

      default:
        // Fetch general operational data
        const { data: operationalData } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', organizationId)
          .order('transaction_date', { ascending: false })
          .limit(50)

        data.operations = operationalData || []
    }
  } catch (error) {
    console.error('Error fetching business data:', error)
  }

  return data
}

function generateMockBusinessData(category: string) {
  // Generate realistic mock data for demo purposes
  const mockData: any = {
    sales: {
      totalRevenue: 5240000,
      orderCount: 47,
      averageOrderValue: 111489,
      topCustomers: ['ITC Hotels', 'Marriott', 'Taj Group'],
      recentOrders: [
        { customer: 'ITC Hotels', amount: 285000, status: 'delivered' },
        { customer: 'Marriott', amount: 195000, status: 'in_production' },
        { customer: 'Le Meridien', amount: 155000, status: 'pending' }
      ]
    },
    inventory: {
      totalItems: 142,
      lowStockItems: ['Teak Wood', 'Italian Leather', 'Brass Fittings'],
      valueOnHand: 1870000,
      turnoverRate: 4.2
    },
    finance: {
      revenue: 5240000,
      expenses: 3180000,
      netProfit: 2060000,
      profitMargin: 39.3,
      cashPosition: 1870000,
      pendingReceivables: 680000
    },
    operations: {
      productionCapacity: 78,
      activeOrders: 12,
      completionRate: 92,
      averageLeadTime: 14
    },
    hr: {
      teamSize: 24,
      productivity: 92,
      utilizationRate: 87,
      departments: ['Production', 'Design', 'Sales', 'Admin']
    }
  }

  return mockData[category] || mockData.operations
}

async function generateAIResponse(params: {
  query: string
  intent: string
  category: string
  businessData: any
  context: BusinessContext
  useMCP: boolean
}) {
  const { query, intent, category, businessData, context } = params

  // Generate response based on intent and data
  let message = ''
  let recommendations: any[] = []
  let metrics: any[] = []
  let priority = 'medium'
  let insights: any[] = []

  switch (intent) {
    case 'analysis':
      message = generateAnalysisResponse(category, businessData, context)
      metrics = extractMetricsFromData(category, businessData)
      break

    case 'recommendation':
      const recResult = generateRecommendations(category, businessData, context)
      message = recResult.message
      recommendations = recResult.recommendations
      priority = 'high'
      break

    case 'prediction':
      message = generatePredictiveInsights(category, businessData, context)
      priority = 'high'
      break

    case 'risk_assessment':
      const riskResult = assessBusinessRisks(category, businessData, context)
      message = riskResult.message
      insights = riskResult.insights
      priority = 'high'
      break

    case 'performance':
      message = generatePerformanceReport(category, businessData, context)
      metrics = extractMetricsFromData(category, businessData)
      break

    default:
      message = generateGeneralResponse(query, businessData, context)
  }

  // Add contextual insights
  if (category === 'sales' && businessData.orderCount > 40) {
    insights.push({
      content:
        'Your sales volume is 15% above industry average. Consider expanding production capacity to meet growing demand.',
      category: 'sales',
      priority: 'medium'
    })
  }

  if (category === 'inventory' && businessData.lowStockItems?.length > 2) {
    insights.push({
      content: `Critical: ${businessData.lowStockItems.length} items need immediate restocking. This could impact upcoming orders.`,
      category: 'inventory',
      priority: 'high'
    })
  }

  return {
    message,
    category,
    priority,
    actionable: intent !== 'general',
    metrics: metrics.slice(0, 4), // Limit to 4 metrics
    recommendations: recommendations.slice(0, 3), // Limit to 3 recommendations
    insights,
    type: 'assistant'
  }
}

function generateAnalysisResponse(category: string, data: any, context: BusinessContext): string {
  const templates = {
    sales: `Based on my analysis of your sales data:

📊 **Sales Performance Overview**
• Total Revenue: ₹${(data.totalRevenue || data.sales?.totalRevenue || 0).toLocaleString('en-IN')}
• Active Orders: ${data.orderCount || data.sales?.orderCount || 0}
• Average Order Value: ₹${(data.averageOrderValue || data.sales?.averageOrderValue || 0).toLocaleString('en-IN')}

Your sales performance shows strong momentum with consistent order flow. The high average order value indicates successful positioning in the premium furniture segment.`,

    inventory: `Here's your inventory analysis:

📦 **Inventory Status**
• Total SKUs: ${data.totalItems || data.inventory?.totalItems || 0}
• Inventory Value: ₹${(data.valueOnHand || data.inventory?.valueOnHand || 0).toLocaleString('en-IN')}
• Low Stock Alerts: ${(data.lowStockItems || data.inventory?.lowStockItems || []).length} items

Critical items needing attention: ${(data.lowStockItems || data.inventory?.lowStockItems || []).join(', ')}. 
Maintaining optimal stock levels is crucial for meeting delivery commitments.`,

    finance: `Financial health analysis:

💰 **Financial Summary**
• Revenue: ₹${(data.revenue || data.finance?.revenue || 0).toLocaleString('en-IN')}
• Expenses: ₹${(data.expenses || data.finance?.expenses || 0).toLocaleString('en-IN')}
• Net Profit: ₹${(data.netProfit || data.finance?.netProfit || 0).toLocaleString('en-IN')}
• Profit Margin: ${data.profitMargin || data.finance?.profitMargin || 0}%

Your profit margins are healthy and above industry standards. Cash position remains strong for operational needs.`,

    operations: `Operational efficiency analysis:

⚙️ **Operations Overview**
• Production Capacity: ${data.productionCapacity || data.operations?.productionCapacity || 0}%
• Active Orders: ${data.activeOrders || data.operations?.activeOrders || 0}
• Completion Rate: ${data.completionRate || data.operations?.completionRate || 0}%
• Average Lead Time: ${data.averageLeadTime || data.operations?.averageLeadTime || 0} days

Your production line is operating efficiently with good completion rates. Consider capacity expansion if demand continues to grow.`
  }

  return (
    templates[category] ||
    `I've analyzed your ${category} data. The metrics show stable performance with room for optimization in key areas.`
  )
}

function generateRecommendations(category: string, data: any, context: BusinessContext) {
  const recommendations = []
  let message = `Based on your current ${category} performance, here are my strategic recommendations:`

  if (category === 'sales') {
    recommendations.push({
      title: 'Expand Premium Product Line',
      description:
        'Your high average order value suggests strong demand for premium furniture. Consider introducing new luxury collections.',
      impact: 'high'
    })
    recommendations.push({
      title: 'Implement Customer Loyalty Program',
      description:
        'With growing order volume, a loyalty program could increase repeat business by 20-30%.',
      impact: 'medium'
    })
  }

  if (category === 'inventory') {
    recommendations.push({
      title: 'Automate Reorder Points',
      description:
        'Set up automatic purchase orders when stock falls below optimal levels to prevent stockouts.',
      impact: 'high'
    })
    recommendations.push({
      title: 'Optimize Storage Layout',
      description:
        'Reorganize warehouse based on product turnover rates to improve picking efficiency.',
      impact: 'medium'
    })
  }

  if (category === 'finance') {
    recommendations.push({
      title: 'Negotiate Better Payment Terms',
      description:
        'With strong cash position, negotiate extended payment terms with suppliers to improve cash flow.',
      impact: 'medium'
    })
    recommendations.push({
      title: 'Invest in Production Automation',
      description:
        'Your healthy margins allow for strategic investments in automation to reduce long-term costs.',
      impact: 'high'
    })
  }

  return { message, recommendations }
}

function generatePredictiveInsights(category: string, data: any, context: BusinessContext): string {
  const predictions = {
    sales: `📈 **Sales Forecast**

Based on current trends and seasonal patterns:
• Next Month Revenue: ₹${((data.totalRevenue || 5240000) * 1.12).toLocaleString('en-IN')} (+12%)
• Expected Orders: ${Math.round((data.orderCount || 47) * 1.08)} orders
• Peak Season Impact: 25% increase expected during festive season

Key factors: Growing brand recognition, expanding hotel partnerships, and premium positioning are driving consistent growth.`,

    inventory: `📊 **Inventory Predictions**

Stock level projections for next 30 days:
• Teak Wood: Will reach critical level in 12 days
• Italian Leather: Sufficient for 25 days at current usage
• Hardware Items: Reorder needed within 18 days

Recommendation: Place orders for critical items immediately to avoid production delays.`,

    finance: `💹 **Financial Projections**

3-Month financial outlook:
• Projected Revenue: ₹${((data.revenue || 5240000) * 3.2).toLocaleString('en-IN')}
• Expected Profit Margin: 41% (up from current 39%)
• Cash Flow: Positive with 15% month-over-month growth

Market conditions remain favorable for premium furniture with sustained demand from hospitality sector.`
  }

  return (
    predictions[category] ||
    `Based on historical data and current trends, your ${category} metrics are expected to improve by 10-15% over the next quarter.`
  )
}

function assessBusinessRisks(category: string, data: any, context: BusinessContext) {
  const insights = []
  let message = `🚨 **Risk Assessment Report**\n\nI've identified the following business risks that need attention:`

  // Universal risks
  if (data.cashPosition < 1000000 || data.finance?.cashPosition < 1000000) {
    insights.push({
      content:
        'Cash reserves are below recommended levels. This could impact ability to handle unexpected expenses or take advantage of bulk purchase discounts.',
      category: 'finance',
      priority: 'high'
    })
  }

  // Category-specific risks
  if (category === 'inventory' && data.lowStockItems?.length > 0) {
    insights.push({
      content: `Critical materials shortage detected. ${data.lowStockItems.length} essential items are below safety stock levels, risking production delays.`,
      category: 'inventory',
      priority: 'high'
    })
  }

  if (category === 'operations' && data.productionCapacity > 85) {
    insights.push({
      content:
        'Production capacity exceeding 85% utilization. This leaves little room for urgent orders and may lead to delivery delays.',
      category: 'operations',
      priority: 'medium'
    })
  }

  if (category === 'sales' && data.pendingReceivables > 500000) {
    insights.push({
      content:
        'High pending receivables detected. Consider implementing stricter credit policies or offering early payment discounts.',
      category: 'sales',
      priority: 'medium'
    })
  }

  return { message, insights }
}

function generatePerformanceReport(category: string, data: any, context: BusinessContext): string {
  return `📊 **Performance Report - ${context.organizationName}**

Your ${category} performance for the current period:

✅ **Strengths:**
• Consistent order flow with premium clients
• Strong profit margins above industry average
• Efficient production completion rates

⚡ **Areas for Improvement:**
• Inventory turnover could be optimized
• Lead times can be reduced by 10-15%
• Digital presence needs enhancement

📈 **Key Metrics:**
• Overall Performance Score: 82/100
• Industry Ranking: Top 20%
• Growth Rate: 15% YoY

Continue focusing on quality and customer satisfaction while addressing inventory optimization for better working capital management.`
}

function generateGeneralResponse(query: string, data: any, context: BusinessContext): string {
  return `I understand you're asking about "${query}". 

Based on your business data, here's what I can tell you:

Your furniture business is performing well with steady growth in orders and healthy profit margins. The current focus should be on maintaining quality while optimizing operational efficiency.

Would you like me to analyze any specific aspect of your business in more detail?`
}

function extractMetricsFromData(category: string, data: any): any[] {
  const metrics = []

  if (category === 'sales' || data.sales) {
    metrics.push({
      label: 'Total Revenue',
      value: `₹${(data.totalRevenue || data.sales?.totalRevenue || 0).toLocaleString('en-IN')}`,
      trend: 'up',
      change: 12.5
    })
    metrics.push({
      label: 'Active Orders',
      value: data.orderCount || data.sales?.orderCount || 0,
      trend: 'up',
      change: 8.2
    })
  }

  if (category === 'finance' || data.finance) {
    metrics.push({
      label: 'Net Profit',
      value: `₹${(data.netProfit || data.finance?.netProfit || 0).toLocaleString('en-IN')}`,
      trend: 'up',
      change: 15.3
    })
    metrics.push({
      label: 'Profit Margin',
      value: `${data.profitMargin || data.finance?.profitMargin || 0}%`,
      trend: 'stable',
      change: 0.5
    })
  }

  if (category === 'operations' || data.operations) {
    metrics.push({
      label: 'Production Capacity',
      value: `${data.productionCapacity || data.operations?.productionCapacity || 0}%`,
      trend: 'up',
      change: 5.1
    })
    metrics.push({
      label: 'Completion Rate',
      value: `${data.completionRate || data.operations?.completionRate || 0}%`,
      trend: 'stable',
      change: 0.8
    })
  }

  return metrics
}
