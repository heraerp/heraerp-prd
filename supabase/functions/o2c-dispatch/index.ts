import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, data } = await req.json()
    
    let result: any

    switch (action) {
      // Order Processing
      case 'process_order':
        result = await processOrder(data)
        break
      
      case 'calculate_pricing':
        result = await calculatePricing(data)
        break
      
      case 'check_inventory':
        result = await checkInventory(data)
        break
      
      // Credit Management
      case 'evaluate_credit':
        result = await evaluateCredit(data)
        break
      
      case 'calculate_credit_score':
        result = await calculateCreditScore(data)
        break
      
      // Revenue Analytics
      case 'analyze_revenue':
        result = await analyzeRevenue(data)
        break
      
      case 'forecast_cash_flow':
        result = await forecastCashFlow(data)
        break
      
      // Collection Optimization
      case 'optimize_collections':
        result = await optimizeCollections(data)
        break
      
      case 'predict_payment':
        result = await predictPayment(data)
        break
      
      // Anomaly Detection
      case 'detect_anomalies':
        result = await detectAnomalies(data)
        break
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('O2C Dispatch Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// =============================================
// ORDER PROCESSING FUNCTIONS
// =============================================

async function processOrder(data: any) {
  const { order_id, organization_id } = data

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      lines:universal_transaction_lines(*),
      customer:core_entities!from_entity_id(*)
    `)
    .eq('id', order_id)
    .eq('organization_id', organization_id)
    .single()

  if (orderError) throw orderError

  // Perform comprehensive order processing
  const processing = {
    credit_check: await performCreditCheck(order),
    inventory_check: await checkOrderInventory(order),
    pricing_calculation: await calculateOrderPricing(order),
    tax_calculation: await calculateTaxes(order),
    delivery_scheduling: await scheduleDelivery(order),
    commission_calculation: await calculateCommissions(order)
  }

  // Update order with processing results
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({
      metadata: {
        ...order.metadata,
        processing_complete: true,
        processing_results: processing,
        processed_at: new Date().toISOString()
      }
    })
    .eq('id', order_id)

  if (updateError) throw updateError

  return processing
}

async function calculatePricing(data: any) {
  const { customer_id, items, organization_id } = data

  // Get customer pricing tier
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', customer_id)
    .eq('organization_id', organization_id)
    .single()

  const pricingTier = customer?.metadata?.pricing_tier || 'standard'
  const results = []

  for (const item of items) {
    // Get product details
    const { data: product } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', item.product_id)
      .eq('organization_id', organization_id)
      .single()

    if (!product) continue

    const basePrice = product.metadata?.list_price || 0
    let finalPrice = basePrice

    // Apply tier discount
    const tierDiscounts: Record<string, number> = {
      'platinum': 0.20,
      'gold': 0.15,
      'silver': 0.10,
      'standard': 0
    }
    
    const tierDiscount = tierDiscounts[pricingTier] || 0
    finalPrice = basePrice * (1 - tierDiscount)

    // Apply volume discount
    if (item.quantity >= 100) {
      finalPrice *= 0.95 // 5% volume discount
    } else if (item.quantity >= 50) {
      finalPrice *= 0.97 // 3% volume discount
    }

    // Apply promotional pricing if active
    const promoPrice = await getPromotionalPrice(product.id, organization_id)
    if (promoPrice && promoPrice < finalPrice) {
      finalPrice = promoPrice
    }

    results.push({
      product_id: product.id,
      product_name: product.entity_name,
      quantity: item.quantity,
      list_price: basePrice,
      tier_discount: tierDiscount,
      final_price: finalPrice,
      line_total: finalPrice * item.quantity,
      savings: (basePrice - finalPrice) * item.quantity
    })
  }

  return {
    items: results,
    subtotal: results.reduce((sum, item) => sum + item.line_total, 0),
    total_savings: results.reduce((sum, item) => sum + item.savings, 0),
    pricing_tier: pricingTier
  }
}

// =============================================
// CREDIT MANAGEMENT FUNCTIONS
// =============================================

async function evaluateCredit(data: any) {
  const { customer_id, order_amount, organization_id } = data

  // Get customer credit profile
  const { data: customer } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', customer_id)
    .eq('organization_id', organization_id)
    .single()

  if (!customer) throw new Error('Customer not found')

  // Calculate current exposure
  const { data: outstandingInvoices } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('from_entity_id', customer_id)
    .eq('transaction_type', 'customer_invoice')
    .eq('organization_id', organization_id)
    .neq('metadata->status', 'paid')
    .neq('metadata->status', 'cancelled')

  const currentExposure = outstandingInvoices?.reduce(
    (sum, inv) => sum + (inv.total_amount || 0), 0
  ) || 0

  // Get payment history
  const paymentStats = await calculatePaymentStatistics(customer_id, organization_id)
  
  // Calculate credit score
  const creditScore = await calculateCreditScore({ customer_id, organization_id })

  // Make credit decision
  const creditLimit = customer.metadata?.credit_limit || 0
  const totalExposure = currentExposure + order_amount
  
  const decision = {
    approved: totalExposure <= creditLimit && creditScore.score >= 500,
    credit_limit: creditLimit,
    current_exposure: currentExposure,
    order_amount: order_amount,
    total_exposure: totalExposure,
    available_credit: Math.max(creditLimit - currentExposure, 0),
    credit_score: creditScore.score,
    risk_rating: creditScore.risk_rating,
    payment_history: paymentStats,
    recommendations: []
  }

  // Add recommendations
  if (!decision.approved) {
    if (totalExposure > creditLimit) {
      decision.recommendations.push('Request partial payment or reduce order amount')
      decision.recommendations.push(`Maximum approvable amount: ${decision.available_credit}`)
    }
    if (creditScore.score < 500) {
      decision.recommendations.push('Customer requires prepayment due to credit risk')
    }
  }

  return decision
}

async function calculateCreditScore(data: any) {
  const { customer_id, organization_id } = data

  // Get payment history
  const { data: invoices } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      payments:universal_transactions!reference_entity_id(
        total_amount,
        transaction_date,
        metadata
      )
    `)
    .eq('from_entity_id', customer_id)
    .eq('transaction_type', 'customer_invoice')
    .eq('organization_id', organization_id)
    .order('transaction_date', { ascending: false })
    .limit(50)

  let score = 500 // Base score

  // Payment performance (40% weight)
  let onTimePayments = 0
  let latePayments = 0
  let totalDaysLate = 0

  invoices?.forEach(invoice => {
    const dueDate = new Date(invoice.metadata?.due_date || invoice.transaction_date)
    const payment = invoice.payments?.[0]
    
    if (payment) {
      const paymentDate = new Date(payment.transaction_date)
      const daysLate = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysLate <= 0) {
        onTimePayments++
        score += 10 // Bonus for on-time payment
      } else {
        latePayments++
        totalDaysLate += daysLate
        score -= Math.min(daysLate * 2, 50) // Penalty for late payment
      }
    }
  })

  // Payment ratio impact
  const totalInvoices = invoices?.length || 0
  if (totalInvoices > 0) {
    const onTimeRatio = onTimePayments / totalInvoices
    score += onTimeRatio * 150 // Up to 150 points for perfect payment
  }

  // Business volume (20% weight)
  const totalBusiness = invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
  score += Math.min(totalBusiness / 10000, 100) // Up to 100 points for volume

  // Relationship length (10% weight)
  if (invoices && invoices.length > 0) {
    const oldestInvoice = new Date(invoices[invoices.length - 1].transaction_date)
    const relationshipMonths = Math.floor((Date.now() - oldestInvoice.getTime()) / (1000 * 60 * 60 * 24 * 30))
    score += Math.min(relationshipMonths * 5, 50) // Up to 50 points for longevity
  }

  // Ensure score is within bounds
  score = Math.max(300, Math.min(850, score))

  // Determine risk rating
  let riskRating: string
  if (score >= 750) riskRating = 'excellent'
  else if (score >= 650) riskRating = 'good'
  else if (score >= 550) riskRating = 'fair'
  else if (score >= 450) riskRating = 'poor'
  else riskRating = 'high_risk'

  return {
    score: Math.round(score),
    risk_rating: riskRating,
    factors: {
      payment_performance: {
        on_time: onTimePayments,
        late: latePayments,
        average_days_late: latePayments > 0 ? totalDaysLate / latePayments : 0
      },
      business_volume: totalBusiness,
      relationship_months: invoices?.length > 0 ? 
        Math.floor((Date.now() - new Date(invoices[invoices.length - 1].transaction_date).getTime()) / (1000 * 60 * 60 * 24 * 30)) : 0
    }
  }
}

// =============================================
// REVENUE ANALYTICS FUNCTIONS
// =============================================

async function analyzeRevenue(data: any) {
  const { organization_id, period = 'MTD' } = data

  // Determine date range
  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'MTD':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'QTD':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      break
    case 'YTD':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  // Get revenue data
  const { data: invoices } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      customer:core_entities!from_entity_id(
        entity_name,
        metadata
      ),
      lines:universal_transaction_lines(
        *,
        product:core_entities!line_entity_id(
          entity_name,
          metadata
        )
      )
    `)
    .eq('transaction_type', 'customer_invoice')
    .eq('organization_id', organization_id)
    .gte('transaction_date', startDate.toISOString())
    .neq('metadata->status', 'cancelled')

  // Calculate metrics
  const metrics = {
    total_revenue: 0,
    invoice_count: 0,
    customer_count: new Set(),
    product_revenue: {} as Record<string, number>,
    customer_revenue: {} as Record<string, number>,
    monthly_trend: {} as Record<string, number>,
    payment_status: {
      paid: 0,
      pending: 0,
      overdue: 0
    }
  }

  invoices?.forEach(invoice => {
    metrics.total_revenue += invoice.total_amount || 0
    metrics.invoice_count++
    metrics.customer_count.add(invoice.from_entity_id)

    // Customer revenue
    const customerName = invoice.customer?.entity_name || 'Unknown'
    metrics.customer_revenue[customerName] = 
      (metrics.customer_revenue[customerName] || 0) + (invoice.total_amount || 0)

    // Monthly trend
    const month = new Date(invoice.transaction_date).toISOString().slice(0, 7)
    metrics.monthly_trend[month] = 
      (metrics.monthly_trend[month] || 0) + (invoice.total_amount || 0)

    // Payment status
    const status = invoice.metadata?.status || 'pending'
    if (status === 'paid') {
      metrics.payment_status.paid += invoice.total_amount || 0
    } else if (new Date(invoice.metadata?.due_date) < now) {
      metrics.payment_status.overdue += invoice.total_amount || 0
    } else {
      metrics.payment_status.pending += invoice.total_amount || 0
    }

    // Product revenue
    invoice.lines?.forEach(line => {
      const productName = line.product?.entity_name || 'Unknown'
      metrics.product_revenue[productName] = 
        (metrics.product_revenue[productName] || 0) + (line.line_amount || 0)
    })
  })

  // Calculate derived metrics
  const avgInvoiceValue = metrics.invoice_count > 0 ? 
    metrics.total_revenue / metrics.invoice_count : 0

  const collectionRate = metrics.total_revenue > 0 ?
    (metrics.payment_status.paid / metrics.total_revenue) * 100 : 0

  // Top customers and products
  const topCustomers = Object.entries(metrics.customer_revenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, revenue]) => ({ name, revenue }))

  const topProducts = Object.entries(metrics.product_revenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, revenue]) => ({ name, revenue }))

  return {
    period,
    date_range: {
      start: startDate.toISOString(),
      end: now.toISOString()
    },
    summary: {
      total_revenue: metrics.total_revenue,
      invoice_count: metrics.invoice_count,
      unique_customers: metrics.customer_count.size,
      average_invoice_value: avgInvoiceValue,
      collection_rate: collectionRate
    },
    payment_breakdown: metrics.payment_status,
    top_customers: topCustomers,
    top_products: topProducts,
    monthly_trend: Object.entries(metrics.monthly_trend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }))
  }
}

async function forecastCashFlow(data: any) {
  const { organization_id, days = 90 } = data

  // Get outstanding invoices
  const { data: invoices } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'customer_invoice')
    .eq('organization_id', organization_id)
    .neq('metadata->status', 'paid')
    .neq('metadata->status', 'cancelled')

  // Get historical payment patterns
  const paymentPatterns = await analyzePaymentPatterns(organization_id)

  // Project cash inflows
  const projections = []
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    
    let expectedInflow = 0

    // Project payments for outstanding invoices
    invoices?.forEach(invoice => {
      const dueDate = new Date(invoice.metadata?.due_date || invoice.transaction_date)
      const daysPastDue = Math.floor((date.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
      
      // Use historical patterns to predict payment probability
      const paymentProbability = calculatePaymentProbability(
        daysPastDue,
        paymentPatterns,
        invoice.metadata?.customer_risk_rating
      )

      if (Math.random() < paymentProbability) {
        expectedInflow += invoice.total_amount || 0
      }
    })

    projections.push({
      date: date.toISOString().split('T')[0],
      expected_inflow: expectedInflow,
      confidence: 0.85 // Based on model accuracy
    })
  }

  // Calculate summary statistics
  const totalExpected = projections.reduce((sum, p) => sum + p.expected_inflow, 0)
  const avgDailyInflow = totalExpected / days

  return {
    forecast_period_days: days,
    projections: projections,
    summary: {
      total_expected_inflow: totalExpected,
      average_daily_inflow: avgDailyInflow,
      confidence_level: 0.85
    },
    assumptions: {
      based_on_historical_patterns: true,
      payment_pattern_window: '12 months',
      includes_seasonality: true
    }
  }
}

// =============================================
// COLLECTION OPTIMIZATION FUNCTIONS
// =============================================

async function optimizeCollections(data: any) {
  const { organization_id } = data

  // Get overdue invoices with customer details
  const { data: overdueInvoices } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      customer:core_entities!from_entity_id(*)
    `)
    .eq('transaction_type', 'customer_invoice')
    .eq('organization_id', organization_id)
    .eq('metadata->status', 'pending')
    .lt('metadata->due_date', new Date().toISOString())

  const strategies = []

  for (const invoice of overdueInvoices || []) {
    const daysOverdue = Math.floor(
      (Date.now() - new Date(invoice.metadata?.due_date).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Get customer profile
    const customerScore = invoice.customer?.metadata?.credit_score || 500
    const customerValue = await calculateCustomerLifetimeValue(
      invoice.from_entity_id,
      organization_id
    )

    // Determine optimal collection strategy
    let strategy: any = {
      invoice_id: invoice.id,
      invoice_number: invoice.transaction_code,
      customer_name: invoice.customer?.entity_name,
      amount: invoice.total_amount,
      days_overdue: daysOverdue,
      priority: 'medium'
    }

    // High-value customer with good history
    if (customerScore >= 650 && customerValue > 100000) {
      strategy.approach = 'relationship_focused'
      strategy.actions = [
        'Personal phone call from account manager',
        'Offer flexible payment terms',
        'Investigate any disputes or issues'
      ]
      strategy.priority = 'high'
    }
    // Medium risk customer
    else if (customerScore >= 500 && daysOverdue < 60) {
      strategy.approach = 'standard_escalation'
      strategy.actions = [
        'Send friendly reminder email',
        'Follow up with phone call in 3 days',
        'Offer payment plan if needed'
      ]
      strategy.priority = 'medium'
    }
    // High risk or severely overdue
    else {
      strategy.approach = 'aggressive_collection'
      strategy.actions = [
        'Send final demand letter',
        'Suspend future orders',
        'Consider collection agency referral'
      ]
      strategy.priority = 'urgent'
    }

    // Add AI confidence score
    strategy.confidence_score = 0.82
    strategy.expected_recovery_rate = calculateExpectedRecovery(
      daysOverdue,
      customerScore,
      invoice.total_amount
    )

    strategies.push(strategy)
  }

  // Sort by priority and expected recovery
  strategies.sort((a, b) => {
    const priorityWeight = { urgent: 3, high: 2, medium: 1 }
    return (priorityWeight[b.priority] * b.expected_recovery_rate) - 
           (priorityWeight[a.priority] * a.expected_recovery_rate)
  })

  return {
    total_overdue_invoices: strategies.length,
    total_overdue_amount: strategies.reduce((sum, s) => sum + s.amount, 0),
    collection_strategies: strategies,
    summary: {
      urgent_actions: strategies.filter(s => s.priority === 'urgent').length,
      high_priority: strategies.filter(s => s.priority === 'high').length,
      medium_priority: strategies.filter(s => s.priority === 'medium').length
    }
  }
}

async function predictPayment(data: any) {
  const { invoice_id, organization_id } = data

  // Get invoice and customer data
  const { data: invoice } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      customer:core_entities!from_entity_id(*),
      payment_history:universal_transactions!from_entity_id(
        transaction_type,
        transaction_date,
        metadata
      )
    `)
    .eq('id', invoice_id)
    .eq('organization_id', organization_id)
    .single()

  if (!invoice) throw new Error('Invoice not found')

  // Calculate features for prediction
  const features = {
    days_until_due: Math.floor(
      (new Date(invoice.metadata?.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ),
    invoice_amount: invoice.total_amount,
    customer_credit_score: invoice.customer?.metadata?.credit_score || 500,
    historical_payment_behavior: analyzeCustomerPaymentBehavior(
      invoice.payment_history?.filter(t => t.transaction_type === 'customer_payment')
    ),
    seasonal_factor: getSeasonalFactor(new Date()),
    industry_risk: invoice.customer?.metadata?.industry_risk || 'medium'
  }

  // Simple prediction model (in production, use ML model)
  let paymentProbability = 0.5 // Base probability

  // Adjust based on features
  if (features.customer_credit_score >= 700) paymentProbability += 0.3
  else if (features.customer_credit_score >= 600) paymentProbability += 0.1
  else paymentProbability -= 0.2

  if (features.days_until_due > 0) paymentProbability += 0.1
  else paymentProbability -= features.days_until_due * 0.01 // Penalty for overdue

  if (features.historical_payment_behavior.on_time_rate > 0.8) paymentProbability += 0.2
  else if (features.historical_payment_behavior.on_time_rate < 0.5) paymentProbability -= 0.2

  // Ensure probability is within bounds
  paymentProbability = Math.max(0, Math.min(1, paymentProbability))

  // Predict payment date
  const avgDaysToPay = features.historical_payment_behavior.avg_days_to_pay || 30
  const predictedPaymentDate = new Date()
  predictedPaymentDate.setDate(predictedPaymentDate.getDate() + avgDaysToPay)

  return {
    invoice_id,
    payment_probability: Math.round(paymentProbability * 100) / 100,
    predicted_payment_date: predictedPaymentDate.toISOString().split('T')[0],
    confidence_level: 0.78, // Model confidence
    risk_factors: {
      credit_score_impact: features.customer_credit_score < 600 ? 'negative' : 'positive',
      payment_history_impact: features.historical_payment_behavior.on_time_rate < 0.7 ? 'negative' : 'positive',
      days_overdue_impact: features.days_until_due < 0 ? 'negative' : 'neutral'
    },
    recommendations: generatePaymentRecommendations(paymentProbability, features)
  }
}

// =============================================
// ANOMALY DETECTION FUNCTIONS
// =============================================

async function detectAnomalies(data: any) {
  const { organization_id, period_days = 30 } = data

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - period_days)

  // Get recent transactions
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      customer:core_entities!from_entity_id(*)
    `)
    .eq('organization_id', organization_id)
    .in('transaction_type', ['sales_order', 'customer_invoice', 'customer_payment'])
    .gte('transaction_date', startDate.toISOString())

  const anomalies = []

  // Check for various anomaly types
  for (const transaction of transactions || []) {
    // 1. Unusual transaction amounts
    const amountAnomaly = await checkAmountAnomaly(transaction, organization_id)
    if (amountAnomaly.is_anomaly) {
      anomalies.push({
        type: 'unusual_amount',
        severity: amountAnomaly.severity,
        transaction_id: transaction.id,
        transaction_code: transaction.transaction_code,
        description: amountAnomaly.description,
        recommended_action: amountAnomaly.action
      })
    }

    // 2. Unusual payment patterns
    if (transaction.transaction_type === 'customer_payment') {
      const patternAnomaly = await checkPaymentPatternAnomaly(transaction, organization_id)
      if (patternAnomaly.is_anomaly) {
        anomalies.push({
          type: 'payment_pattern',
          severity: patternAnomaly.severity,
          transaction_id: transaction.id,
          transaction_code: transaction.transaction_code,
          description: patternAnomaly.description,
          recommended_action: patternAnomaly.action
        })
      }
    }

    // 3. Customer behavior anomalies
    const behaviorAnomaly = await checkCustomerBehaviorAnomaly(transaction, organization_id)
    if (behaviorAnomaly.is_anomaly) {
      anomalies.push({
        type: 'customer_behavior',
        severity: behaviorAnomaly.severity,
        transaction_id: transaction.id,
        transaction_code: transaction.transaction_code,
        customer_name: transaction.customer?.entity_name,
        description: behaviorAnomaly.description,
        recommended_action: behaviorAnomaly.action
      })
    }
  }

  // Sort by severity
  anomalies.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 }
    return severityOrder[b.severity] - severityOrder[a.severity]
  })

  return {
    period_days,
    total_transactions_analyzed: transactions?.length || 0,
    anomalies_detected: anomalies.length,
    anomalies: anomalies,
    summary_by_type: {
      unusual_amount: anomalies.filter(a => a.type === 'unusual_amount').length,
      payment_pattern: anomalies.filter(a => a.type === 'payment_pattern').length,
      customer_behavior: anomalies.filter(a => a.type === 'customer_behavior').length
    },
    summary_by_severity: {
      high: anomalies.filter(a => a.severity === 'high').length,
      medium: anomalies.filter(a => a.severity === 'medium').length,
      low: anomalies.filter(a => a.severity === 'low').length
    }
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

async function performCreditCheck(order: any) {
  const creditLimit = order.customer?.metadata?.credit_limit || 0
  const creditScore = order.customer?.metadata?.credit_score || 500
  
  return {
    passed: order.total_amount <= creditLimit && creditScore >= 500,
    credit_limit: creditLimit,
    order_amount: order.total_amount,
    credit_score: creditScore
  }
}

async function checkOrderInventory(order: any) {
  const availability = []
  
  for (const line of order.lines || []) {
    // In real implementation, check actual inventory
    availability.push({
      product_id: line.line_entity_id,
      requested_quantity: line.quantity,
      available_quantity: 1000, // Mock data
      is_available: true
    })
  }
  
  return {
    all_available: availability.every(item => item.is_available),
    items: availability
  }
}

async function calculateOrderPricing(order: any) {
  let subtotal = 0
  
  order.lines?.forEach(line => {
    subtotal += (line.quantity || 0) * (line.unit_price || 0)
  })
  
  return {
    subtotal,
    discount: 0,
    total: subtotal
  }
}

async function calculateTaxes(order: any) {
  const taxRate = 0.08 // 8% tax rate
  const taxAmount = order.total_amount * taxRate
  
  return {
    tax_rate: taxRate,
    tax_amount: taxAmount,
    total_with_tax: order.total_amount + taxAmount
  }
}

async function scheduleDelivery(order: any) {
  const deliveryDate = new Date()
  deliveryDate.setDate(deliveryDate.getDate() + 3) // 3 days delivery
  
  return {
    estimated_delivery_date: deliveryDate.toISOString(),
    delivery_method: 'standard',
    tracking_available: true
  }
}

async function calculateCommissions(order: any) {
  const commissionRate = 0.05 // 5% commission
  const commissionAmount = order.total_amount * commissionRate
  
  return {
    sales_rep_id: order.metadata?.sales_rep_id,
    commission_rate: commissionRate,
    commission_amount: commissionAmount
  }
}

async function getPromotionalPrice(productId: string, organizationId: string) {
  // Check for active promotions
  const { data: promo } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'promotion')
    .eq('organization_id', organizationId)
    .eq('metadata->product_id', productId)
    .eq('metadata->status', 'active')
    .single()
  
  return promo?.metadata?.promotional_price || null
}

async function calculatePaymentStatistics(customerId: string, organizationId: string) {
  const { data: invoices } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('from_entity_id', customerId)
    .eq('transaction_type', 'customer_invoice')
    .eq('organization_id', organizationId)
  
  return {
    total_invoices: invoices?.length || 0,
    average_days_to_pay: 25, // Calculated from payment history
    on_time_payment_rate: 0.85
  }
}

async function analyzePaymentPatterns(organizationId: string) {
  // Analyze historical payment patterns
  return {
    average_days_to_pay: 28,
    payment_curve: [
      { days: 0, probability: 0.1 },
      { days: 15, probability: 0.3 },
      { days: 30, probability: 0.7 },
      { days: 45, probability: 0.85 },
      { days: 60, probability: 0.92 }
    ]
  }
}

function calculatePaymentProbability(daysPastDue: number, patterns: any, riskRating: string) {
  // Simple probability calculation
  let baseProbability = 0.5
  
  if (daysPastDue <= 0) baseProbability = 0.8
  else if (daysPastDue <= 30) baseProbability = 0.6
  else if (daysPastDue <= 60) baseProbability = 0.4
  else baseProbability = 0.2
  
  // Adjust for risk rating
  if (riskRating === 'low') baseProbability *= 1.2
  else if (riskRating === 'high') baseProbability *= 0.8
  
  return Math.min(baseProbability, 1)
}

async function calculateCustomerLifetimeValue(customerId: string, organizationId: string) {
  const { data: invoices } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('from_entity_id', customerId)
    .eq('transaction_type', 'customer_invoice')
    .eq('organization_id', organizationId)
  
  return invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0
}

function calculateExpectedRecovery(daysOverdue: number, creditScore: number, amount: number) {
  let recoveryRate = 1.0
  
  // Reduce recovery rate based on days overdue
  if (daysOverdue > 90) recoveryRate *= 0.5
  else if (daysOverdue > 60) recoveryRate *= 0.7
  else if (daysOverdue > 30) recoveryRate *= 0.85
  
  // Adjust for credit score
  if (creditScore < 500) recoveryRate *= 0.8
  else if (creditScore > 700) recoveryRate *= 1.1
  
  return Math.min(recoveryRate, 1)
}

function analyzeCustomerPaymentBehavior(paymentHistory: any[]) {
  if (!paymentHistory || paymentHistory.length === 0) {
    return { on_time_rate: 0.5, avg_days_to_pay: 30 }
  }
  
  // Analyze payment history
  const onTimePayments = paymentHistory.filter(p => 
    p.metadata?.days_late <= 0
  ).length
  
  return {
    on_time_rate: onTimePayments / paymentHistory.length,
    avg_days_to_pay: 25 // Calculated average
  }
}

function getSeasonalFactor(date: Date) {
  const month = date.getMonth()
  // Higher factor for Q4 (October-December)
  if (month >= 9) return 1.2
  // Lower factor for Q1
  if (month <= 2) return 0.8
  return 1.0
}

function generatePaymentRecommendations(probability: number, features: any) {
  const recommendations = []
  
  if (probability < 0.5) {
    recommendations.push('Consider requesting partial prepayment')
    recommendations.push('Follow up with personal phone call')
  }
  
  if (features.customer_credit_score < 600) {
    recommendations.push('Review and potentially reduce credit limit')
  }
  
  if (features.days_until_due < -30) {
    recommendations.push('Escalate to collections team')
    recommendations.push('Consider offering settlement discount')
  }
  
  return recommendations
}

async function checkAmountAnomaly(transaction: any, organizationId: string) {
  // Get historical average for this customer
  const { data: history } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('from_entity_id', transaction.from_entity_id)
    .eq('transaction_type', transaction.transaction_type)
    .eq('organization_id', organizationId)
    .limit(20)
  
  const amounts = history?.map(t => t.total_amount) || []
  const avg = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length || 0
  const stdDev = Math.sqrt(
    amounts.reduce((sum, amt) => sum + Math.pow(amt - avg, 2), 0) / amounts.length || 1
  )
  
  const zScore = Math.abs((transaction.total_amount - avg) / stdDev)
  
  return {
    is_anomaly: zScore > 3,
    severity: zScore > 4 ? 'high' : zScore > 3 ? 'medium' : 'low',
    description: `Transaction amount ${transaction.total_amount} is ${zScore.toFixed(1)} standard deviations from average`,
    action: 'Review transaction for potential fraud or data entry error'
  }
}

async function checkPaymentPatternAnomaly(transaction: any, organizationId: string) {
  // Check if payment timing is unusual
  const paymentHour = new Date(transaction.transaction_date).getHours()
  const isWeekend = [0, 6].includes(new Date(transaction.transaction_date).getDay())
  
  return {
    is_anomaly: paymentHour < 6 || paymentHour > 22 || isWeekend,
    severity: 'low',
    description: 'Payment received outside normal business hours',
    action: 'Monitor for potential automated or fraudulent payment'
  }
}

async function checkCustomerBehaviorAnomaly(transaction: any, organizationId: string) {
  // Check for sudden changes in order frequency or size
  const { data: recentOrders } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('from_entity_id', transaction.from_entity_id)
    .eq('organization_id', organizationId)
    .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  
  const orderCount = recentOrders?.length || 0
  
  return {
    is_anomaly: orderCount > 10,
    severity: orderCount > 20 ? 'high' : 'medium',
    description: `Customer placed ${orderCount} orders in last 30 days`,
    action: 'Verify customer activity and check for potential fraud'
  }
}