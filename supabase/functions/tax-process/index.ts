import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TaxProcessRequest {
  organization_id: string
  transaction_id?: string
  action: 'process_return' | 'validate_compliance' | 'detect_anomalies' | 'calculate_tax' | 'aggregate_return'
  metadata?: Record<string, any>
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body: TaxProcessRequest = await req.json()
    const { organization_id, transaction_id, action, metadata } = body

    console.log(`Processing tax action: ${action} for org: ${organization_id}`)

    switch (action) {
      case 'process_return':
        return await processReturn(supabase, organization_id, transaction_id!, metadata)
      
      case 'validate_compliance':
        return await validateCompliance(supabase, organization_id, metadata)
      
      case 'detect_anomalies':
        return await detectAnomalies(supabase, organization_id, metadata)
      
      case 'calculate_tax':
        return await calculateTax(supabase, organization_id, transaction_id!, metadata)
      
      case 'aggregate_return':
        return await aggregateReturn(supabase, organization_id, metadata)
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

  } catch (error) {
    console.error('Tax processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

// Process tax return filing
async function processReturn(
  supabase: any,
  orgId: string,
  transactionId: string,
  metadata: any
) {
  console.log(`Processing tax return ${transactionId}`)

  // Get return details
  const { data: returnTx, error: txError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('organization_id', orgId)
    .single()

  if (txError || !returnTx) {
    throw new Error('Tax return not found')
  }

  const returnType = returnTx.smart_code
  const period = metadata?.period || returnTx.metadata?.period
  const jurisdiction = metadata?.jurisdiction || returnTx.metadata?.jurisdiction

  // Aggregate tax data for the period
  let aggregatedData
  
  if (returnType === 'HERA.TAX.GST.RETURN.v1') {
    aggregatedData = await aggregateGSTData(supabase, orgId, period)
  } else if (returnType === 'HERA.TAX.VAT.RETURN.v1') {
    aggregatedData = await aggregateVATData(supabase, orgId, period)
  } else if (returnType === 'HERA.TAX.WHT.REPORT.v1') {
    aggregatedData = await aggregateWHTData(supabase, orgId, period)
  }

  // Create return line items
  if (aggregatedData && aggregatedData.length > 0) {
    const lines = aggregatedData.map((item, index) => ({
      organization_id: orgId,
      transaction_id: transactionId,
      line_number: index + 1,
      line_entity_id: item.tax_jurisdiction_id,
      line_amount: item.tax_amount,
      smart_code: 'HERA.TAX.RETURN.LINE.v1',
      metadata: {
        tax_code: item.tax_code,
        tax_rate: item.tax_rate,
        taxable_amount: item.taxable_amount,
        transaction_count: item.transaction_count
      }
    }))

    const { error: lineError } = await supabase
      .from('universal_transaction_lines')
      .insert(lines)

    if (lineError) {
      console.error('Error creating return lines:', lineError)
    }
  }

  // Update return status
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({
      metadata: {
        ...returnTx.metadata,
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
        line_count: aggregatedData?.length || 0,
        total_tax: aggregatedData?.reduce((sum, item) => sum + item.tax_amount, 0) || 0
      }
    })
    .eq('id', transactionId)
    .eq('organization_id', orgId)

  if (updateError) {
    throw new Error('Failed to update return status')
  }

  return new Response(
    JSON.stringify({
      success: true,
      return_id: transactionId,
      lines_created: aggregatedData?.length || 0,
      total_tax: aggregatedData?.reduce((sum, item) => sum + item.tax_amount, 0) || 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Validate tax compliance
async function validateCompliance(
  supabase: any,
  orgId: string,
  metadata: any
) {
  console.log(`Validating compliance for org ${orgId}`)

  const checkDate = metadata?.check_date || new Date().toISOString().split('T')[0]
  const taxTypes = metadata?.tax_types || ['GST', 'VAT', 'WHT']

  // Check for missing returns
  const missingReturns = []
  
  for (const taxType of taxTypes) {
    // Get filing calendar
    const { data: calendar, error: calError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('organization_id', orgId)
      .eq('field_name', 'tax_filing_due')
      .eq('smart_code', 'HERA.TAX.CAL.DUE.v1')
      .filter('metadata->tax_type', 'eq', taxType)
      .filter('metadata->due_date', 'lte', checkDate)

    if (!calError && calendar) {
      for (const due of calendar) {
        // Check if return filed
        const { data: filed } = await supabase
          .from('universal_transactions')
          .select('id')
          .eq('organization_id', orgId)
          .like('smart_code', `HERA.TAX.${taxType}.RETURN.%`)
          .filter('metadata->period', 'eq', due.metadata.period)
          .single()

        if (!filed) {
          missingReturns.push({
            tax_type: taxType,
            period: due.metadata.period,
            due_date: due.metadata.due_date,
            days_overdue: calculateDaysOverdue(due.metadata.due_date, checkDate)
          })
        }
      }
    }
  }

  // Check for compliance issues
  const complianceIssues = []

  // Check tax code validity
  const { data: invalidCodes } = await supabase
    .from('universal_transactions')
    .select('id, transaction_code, metadata')
    .eq('organization_id', orgId)
    .not('metadata->tax_code', 'is', null)
    .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  for (const tx of invalidCodes || []) {
    const { data: validCode } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'tax_code')
      .eq('entity_code', tx.metadata.tax_code)
      .single()

    if (!validCode) {
      complianceIssues.push({
        type: 'invalid_tax_code',
        transaction_id: tx.id,
        transaction_code: tx.transaction_code,
        tax_code: tx.metadata.tax_code
      })
    }
  }

  // Create compliance report
  const { data: report, error: reportError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: orgId,
      transaction_type: 'compliance_check',
      transaction_code: `COMPLY-${Date.now()}`,
      smart_code: 'HERA.TAX.COMPLY.CHECK.v1',
      total_amount: 0,
      metadata: {
        check_date: checkDate,
        missing_returns: missingReturns,
        compliance_issues: complianceIssues,
        compliance_score: calculateComplianceScore(missingReturns, complianceIssues)
      }
    })
    .select()
    .single()

  if (reportError) {
    throw new Error('Failed to create compliance report')
  }

  return new Response(
    JSON.stringify({
      success: true,
      report_id: report.id,
      missing_returns: missingReturns.length,
      compliance_issues: complianceIssues.length,
      compliance_score: report.metadata.compliance_score
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Detect tax anomalies using AI
async function detectAnomalies(
  supabase: any,
  orgId: string,
  metadata: any
) {
  console.log(`Detecting anomalies for org ${orgId}`)

  const checkPeriod = metadata?.check_period || 30
  const thresholds = metadata?.thresholds || {
    variance_percent: 100,
    amount_threshold: 10000,
    frequency_deviation: 2
  }

  const anomalies = []

  // Check for unusual tax credits
  const { data: avgCredits } = await supabase
    .rpc('calculate_average', {
      p_org_id: orgId,
      p_table: 'universal_transactions',
      p_column: 'total_amount',
      p_filter: { transaction_type: 'tax_credit' },
      p_days: 90
    })

  const { data: recentCredits } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', orgId)
    .eq('transaction_type', 'tax_credit')
    .gte('transaction_date', new Date(Date.now() - checkPeriod * 24 * 60 * 60 * 1000).toISOString())

  for (const credit of recentCredits || []) {
    const variance = ((credit.total_amount - avgCredits) / avgCredits) * 100
    
    if (variance > thresholds.variance_percent) {
      anomalies.push({
        type: 'unusual_credit',
        transaction_id: credit.id,
        expected_value: avgCredits,
        actual_value: credit.total_amount,
        variance_percent: variance,
        confidence_score: calculateConfidenceScore(variance),
        ai_recommendation: 'Review supporting documentation for large credit claim'
      })
    }
  }

  // Check for rate mismatches
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      lines:universal_transaction_lines!inner(*)
    `)
    .eq('organization_id', orgId)
    .gte('transaction_date', new Date(Date.now() - checkPeriod * 24 * 60 * 60 * 1000).toISOString())
    .eq('lines.smart_code', 'HERA.TAX.AUTO.CALC.LINE.v1')

  for (const tx of transactions || []) {
    for (const line of tx.lines) {
      const expectedRate = await getExpectedTaxRate(supabase, orgId, line.metadata.tax_code, tx.transaction_date)
      
      if (expectedRate && Math.abs(line.metadata.tax_rate - expectedRate) > 0.1) {
        anomalies.push({
          type: 'rate_mismatch',
          transaction_id: tx.id,
          line_id: line.id,
          expected_value: expectedRate,
          actual_value: line.metadata.tax_rate,
          variance_percent: ((line.metadata.tax_rate - expectedRate) / expectedRate) * 100,
          confidence_score: 0.9,
          ai_recommendation: 'Verify tax rate applied matches current regulations'
        })
      }
    }
  }

  // Store anomalies
  if (anomalies.length > 0) {
    for (const anomaly of anomalies) {
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: orgId,
          entity_id: anomaly.transaction_id,
          field_name: 'tax_anomaly',
          field_value_json: anomaly,
          smart_code: 'HERA.TAX.AI.ANOMALY.v1'
        })
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      anomalies_detected: anomalies.length,
      anomalies: anomalies,
      ai_insights: generateAIInsights(anomalies)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Calculate tax for transaction
async function calculateTax(
  supabase: any,
  orgId: string,
  transactionId: string,
  metadata: any
) {
  console.log(`Calculating tax for transaction ${transactionId}`)

  // This is handled by the database trigger, but we can provide additional logic
  const { data: transaction } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('id', transactionId)
    .eq('organization_id', orgId)
    .single()

  if (!transaction) {
    throw new Error('Transaction not found')
  }

  const taxCode = metadata?.tax_code || transaction.metadata?.tax_code
  const taxEngine = metadata?.tax_engine || 'native'

  let taxResult

  if (taxEngine === 'avalara') {
    // Integration with Avalara
    taxResult = await calculateAvalaraTax(transaction, taxCode)
  } else if (taxEngine === 'vertex') {
    // Integration with Vertex
    taxResult = await calculateVertexTax(transaction, taxCode)
  } else {
    // Native calculation
    taxResult = await calculateNativeTax(supabase, orgId, transaction, taxCode)
  }

  // Update transaction with tax
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({
      metadata: {
        ...transaction.metadata,
        tax_calculated: true,
        tax_engine: taxEngine,
        ...taxResult
      }
    })
    .eq('id', transactionId)
    .eq('organization_id', orgId)

  if (updateError) {
    throw new Error('Failed to update transaction with tax')
  }

  return new Response(
    JSON.stringify({
      success: true,
      transaction_id: transactionId,
      tax_result: taxResult
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Aggregate return data
async function aggregateReturn(
  supabase: any,
  orgId: string,
  metadata: any
) {
  const taxType = metadata.tax_type
  const periodStart = metadata.period_start
  const periodEnd = metadata.period_end

  console.log(`Aggregating ${taxType} data for ${periodStart} to ${periodEnd}`)

  // Call the database function
  const { data, error } = await supabase
    .rpc('hera_tax__aggregate_return', {
      p_org_id: orgId,
      p_tax_type: taxType,
      p_period_start: periodStart,
      p_period_end: periodEnd
    })

  if (error) {
    throw new Error(`Failed to aggregate return data: ${error.message}`)
  }

  return new Response(
    JSON.stringify({
      success: true,
      aggregated_data: data,
      summary: {
        total_taxable: data.reduce((sum, item) => sum + item.taxable_amount, 0),
        total_tax: data.reduce((sum, item) => sum + item.tax_amount, 0),
        line_count: data.length
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Helper functions
async function aggregateGSTData(supabase: any, orgId: string, period: any) {
  const { data } = await supabase
    .rpc('hera_tax__aggregate_return', {
      p_org_id: orgId,
      p_tax_type: 'GST',
      p_period_start: period.start,
      p_period_end: period.end
    })
  return data
}

async function aggregateVATData(supabase: any, orgId: string, period: any) {
  const { data } = await supabase
    .rpc('hera_tax__aggregate_return', {
      p_org_id: orgId,
      p_tax_type: 'VAT',
      p_period_start: period.start,
      p_period_end: period.end
    })
  return data
}

async function aggregateWHTData(supabase: any, orgId: string, period: any) {
  const { data } = await supabase
    .from('universal_transactions')
    .select(`
      *,
      lines:universal_transaction_lines!inner(*)
    `)
    .eq('organization_id', orgId)
    .eq('lines.smart_code', 'HERA.TAX.WHT.DEDUCT.v1')
    .gte('transaction_date', period.start)
    .lte('transaction_date', period.end)

  return data?.map(tx => ({
    deduction_type: tx.lines[0].metadata.deduction_type,
    tax_amount: tx.lines[0].line_amount,
    transaction_count: 1,
    entity_id: tx.from_entity_id
  }))
}

function calculateDaysOverdue(dueDate: string, checkDate: string): number {
  const due = new Date(dueDate)
  const check = new Date(checkDate)
  const diffTime = check.getTime() - due.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

function calculateComplianceScore(missingReturns: any[], issues: any[]): number {
  const baseScore = 100
  const missingPenalty = missingReturns.length * 10
  const issuePenalty = issues.length * 5
  return Math.max(0, baseScore - missingPenalty - issuePenalty)
}

function calculateConfidenceScore(variance: number): number {
  if (variance > 200) return 0.95
  if (variance > 150) return 0.85
  if (variance > 100) return 0.75
  return 0.65
}

async function getExpectedTaxRate(supabase: any, orgId: string, taxCode: string, date: string) {
  const { data } = await supabase
    .from('core_dynamic_data')
    .select('field_value_number')
    .eq('organization_id', orgId)
    .eq('field_name', 'tax_rate')
    .eq('metadata->tax_code', taxCode)
    .lte('metadata->effective_date', date)
    .order('metadata->effective_date', { ascending: false })
    .limit(1)
    .single()

  return data?.field_value_number
}

function generateAIInsights(anomalies: any[]): any {
  const insights = {
    risk_level: anomalies.length > 5 ? 'high' : anomalies.length > 2 ? 'medium' : 'low',
    recommendations: [],
    patterns: []
  }

  // Analyze patterns
  const creditAnomalies = anomalies.filter(a => a.type === 'unusual_credit')
  if (creditAnomalies.length > 0) {
    insights.patterns.push('Multiple unusual tax credit claims detected')
    insights.recommendations.push('Review tax credit eligibility criteria and supporting documentation')
  }

  const rateAnomalies = anomalies.filter(a => a.type === 'rate_mismatch')
  if (rateAnomalies.length > 0) {
    insights.patterns.push('Tax rate discrepancies found in multiple transactions')
    insights.recommendations.push('Update tax rate configuration and verify compliance with current regulations')
  }

  return insights
}

async function calculateNativeTax(supabase: any, orgId: string, transaction: any, taxCode: string) {
  const rate = await getExpectedTaxRate(supabase, orgId, taxCode, transaction.transaction_date)
  
  if (!rate) {
    return {
      tax_amount: 0,
      tax_rate: 0,
      tax_code: taxCode,
      calculation_method: 'native',
      error: 'Tax rate not found'
    }
  }

  const taxAmount = transaction.total_amount * (rate / 100)
  
  return {
    tax_amount: Math.round(taxAmount * 100) / 100,
    tax_rate: rate,
    tax_code: taxCode,
    calculation_method: 'native'
  }
}

// Placeholder functions for external tax engines
async function calculateAvalaraTax(transaction: any, taxCode: string) {
  // Implementation would call Avalara API
  return {
    tax_amount: 0,
    tax_rate: 0,
    tax_code: taxCode,
    calculation_method: 'avalara',
    error: 'Avalara integration not configured'
  }
}

async function calculateVertexTax(transaction: any, taxCode: string) {
  // Implementation would call Vertex API
  return {
    tax_amount: 0,
    tax_rate: 0,
    tax_code: taxCode,
    calculation_method: 'vertex',
    error: 'Vertex integration not configured'
  }
}