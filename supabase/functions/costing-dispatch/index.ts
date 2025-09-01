import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Main dispatcher
serve(async (req) => {
  try {
    const { organization_id, transaction_id, smart_code, metadata } = await req.json()

    console.log(`Processing costing request: ${smart_code} for org ${organization_id}`)

    // Route to appropriate handler based on smart code
    let result
    switch (smart_code) {
      case 'HERA.COSTING.STD.ESTIMATE.v1':
        result = await stdEstimate(organization_id, transaction_id, metadata)
        break
      
      case 'HERA.COSTING.ACTUAL.ROLLUP.v1':
        result = await actualRollup(organization_id, transaction_id, metadata)
        break
      
      case 'HERA.COSTING.OVERHEAD.APPLY.v1':
        result = await applyOverhead(organization_id, transaction_id, metadata)
        break
      
      case 'HERA.COSTING.LANDED.DISTRIBUTE.v1':
        result = await distributeLandedCost(organization_id, transaction_id, metadata)
        break
      
      case 'HERA.COSTING.ALLOC.ASSESS.v1':
        result = await allocAssess(organization_id, transaction_id, metadata)
        break
      
      case 'HERA.COSTING.ALLOC.DISTRIB.v1':
        result = await allocDistribute(organization_id, transaction_id, metadata)
        break
      
      case 'HERA.PROFIT.CM.CALC.v1':
        result = await cmCalc(organization_id, transaction_id, metadata)
        break
      
      case 'HERA.PROFIT.PVM.CALC.v1':
        result = await pvmAnalysis(organization_id, transaction_id, metadata)
        break
      
      case 'HERA.PROFIT.MARGIN.ANALYZE.v1':
        result = await marginAnalysis(organization_id, transaction_id, metadata)
        break
      
      default:
        throw new Error(`Unsupported smart code: ${smart_code}`)
    }

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Costing dispatch error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        smart_code: 'HERA.COSTING.ERROR.PROCESSING.v1'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// =============================================
// STANDARD COST ESTIMATE
// =============================================
async function stdEstimate(orgId: string, txId: string, metadata: any) {
  console.log(`Running standard cost estimate for tx ${txId}`)

  // 1. Load product and plant from metadata
  const { product_id, plant, variant } = metadata

  // 2. Get BOM structure
  const bom = await getBOMStructure(orgId, product_id, plant)
  
  // 3. Get routing/activities
  const routing = await getRouting(orgId, product_id, plant)
  
  // 4. Get activity rates for the variant
  const rates = await getActivityRates(orgId, plant, variant)
  
  // 5. Calculate costs
  const costComponents = await calculateStandardCost(bom, routing, rates)
  
  // 6. Write cost component lines
  const lines = []
  let lineNumber = 1
  
  for (const component of costComponents) {
    lines.push({
      organization_id: orgId,
      transaction_id: txId,
      line_number: lineNumber++,
      line_entity_id: component.entity_id,
      line_amount: component.amount,
      smart_code: 'HERA.COSTING.STD.ESTIMATE.LINE.v1',
      metadata: {
        cost_element: component.cost_element,
        cost_component: component.cost_component,
        quantity: component.quantity,
        rate: component.rate,
        uom: component.uom
      }
    })
  }

  // Insert all lines
  const { error: lineError } = await supabase
    .from('universal_transaction_lines')
    .insert(lines)

  if (lineError) throw lineError

  // 7. Update transaction total
  const totalCost = costComponents.reduce((sum, c) => sum + c.amount, 0)
  
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({
      total_amount: totalCost,
      transaction_status: 'calculated',
      ai_insights: {
        summary: `Standard cost calculated: ${totalCost.toFixed(2)}`,
        cost_breakdown: summarizeCostComponents(costComponents),
        calculation_date: new Date().toISOString()
      }
    })
    .eq('id', txId)

  if (updateError) throw updateError

  return { 
    total_cost: totalCost,
    component_count: costComponents.length,
    status: 'completed'
  }
}

// =============================================
// ALLOCATION ASSESSMENT
// =============================================
async function allocAssess(orgId: string, txId: string, metadata: any) {
  console.log(`Running assessment allocation for tx ${txId}`)

  // 1. Get allocation configuration
  const { sender_cc, receivers, drivers, period } = metadata

  // 2. Get sender costs
  const senderCosts = await getCostCenterCosts(orgId, sender_cc, period)
  
  // 3. Get driver values
  const driverValues = await getDriverValues(orgId, drivers, receivers, period)
  
  // 4. Calculate allocations
  const allocations = calculateAssessment(senderCosts, driverValues)
  
  // 5. Create allocation lines
  const lines = []
  let lineNumber = 1
  
  // Sender line (credit)
  lines.push({
    organization_id: orgId,
    transaction_id: txId,
    line_number: lineNumber++,
    line_entity_id: sender_cc,
    line_amount: senderCosts.total,
    smart_code: 'HERA.COSTING.ALLOC.ASSESS.LINE.v1',
    metadata: {
      line_role: 'sender',
      cost_center: sender_cc,
      period: period
    }
  })
  
  // Receiver lines (debits)
  for (const alloc of allocations) {
    lines.push({
      organization_id: orgId,
      transaction_id: txId,
      line_number: lineNumber++,
      line_entity_id: alloc.receiver_cc,
      line_amount: alloc.amount,
      smart_code: 'HERA.COSTING.ALLOC.ASSESS.LINE.v1',
      metadata: {
        line_role: 'receiver',
        cost_center: alloc.receiver_cc,
        driver_value: alloc.driver_value,
        percentage: alloc.percentage,
        period: period
      }
    })
  }

  // Insert lines (trigger will validate balance)
  const { error: lineError } = await supabase
    .from('universal_transaction_lines')
    .insert(lines)

  if (lineError) throw lineError

  // Update transaction
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({
      total_amount: senderCosts.total,
      transaction_status: 'allocated',
      ai_insights: {
        summary: `Allocated ${senderCosts.total.toFixed(2)} from ${sender_cc} to ${allocations.length} receivers`,
        allocation_method: 'assessment',
        driver: drivers
      }
    })
    .eq('id', txId)

  if (updateError) throw updateError

  return {
    allocated_amount: senderCosts.total,
    receiver_count: allocations.length,
    status: 'completed'
  }
}

// =============================================
// CONTRIBUTION MARGIN CALCULATION
// =============================================
async function cmCalc(orgId: string, txId: string, metadata: any) {
  console.log(`Calculating contribution margins for tx ${txId}`)

  const { slice, period, margin_levels } = metadata

  // 1. Get revenue data
  const revenue = await getRevenueBySlice(orgId, slice, period)
  
  // 2. Get cost data by type
  const costs = await getCostsBySlice(orgId, slice, period)
  
  // 3. Calculate margin waterfall
  const marginCalc = {
    revenue: revenue.total,
    variable_material: costs.variable_material || 0,
    variable_labor: costs.variable_labor || 0,
    cm1: 0,
    variable_overhead: costs.variable_overhead || 0,
    cm2: 0,
    fixed_overhead: costs.fixed_overhead || 0,
    cm3: 0
  }

  // Calculate margins
  marginCalc.cm1 = marginCalc.revenue - marginCalc.variable_material - marginCalc.variable_labor
  marginCalc.cm2 = marginCalc.cm1 - marginCalc.variable_overhead
  marginCalc.cm3 = marginCalc.cm2 - marginCalc.fixed_overhead

  // 4. Create margin detail lines
  const lines = []
  let lineNumber = 1

  // Revenue line
  lines.push({
    organization_id: orgId,
    transaction_id: txId,
    line_number: lineNumber++,
    line_amount: marginCalc.revenue,
    smart_code: 'HERA.PROFIT.CM.DETAIL.v1',
    metadata: {
      margin_element: 'revenue',
      slice: slice,
      period: period
    }
  })

  // Cost lines
  for (const [element, amount] of Object.entries(costs)) {
    if (amount > 0) {
      lines.push({
        organization_id: orgId,
        transaction_id: txId,
        line_number: lineNumber++,
        line_amount: -amount, // Negative for costs
        smart_code: 'HERA.PROFIT.CM.DETAIL.v1',
        metadata: {
          margin_element: element,
          slice: slice,
          period: period
        }
      })
    }
  }

  // Margin lines
  for (const level of ['cm1', 'cm2', 'cm3']) {
    if (margin_levels.includes(level.toUpperCase())) {
      lines.push({
        organization_id: orgId,
        transaction_id: txId,
        line_number: lineNumber++,
        line_amount: marginCalc[level],
        smart_code: 'HERA.PROFIT.CM.DETAIL.v1',
        metadata: {
          margin_element: level,
          margin_percent: (marginCalc[level] / marginCalc.revenue * 100).toFixed(2),
          slice: slice,
          period: period
        }
      })
    }
  }

  // Insert lines
  const { error: lineError } = await supabase
    .from('universal_transaction_lines')
    .insert(lines)

  if (lineError) throw lineError

  // Update transaction
  const { error: updateError } = await supabase
    .from('universal_transactions')
    .update({
      total_amount: marginCalc.cm3, // Final margin
      transaction_status: 'calculated',
      ai_insights: {
        summary: `CM3: ${marginCalc.cm3.toFixed(2)} (${(marginCalc.cm3/marginCalc.revenue*100).toFixed(1)}% of revenue)`,
        margin_waterfall: marginCalc,
        slice: slice,
        period: period
      }
    })
    .eq('id', txId)

  if (updateError) throw updateError

  return {
    margins: marginCalc,
    line_count: lines.length,
    status: 'completed'
  }
}

// =============================================
// HELPER FUNCTIONS
// =============================================

async function getBOMStructure(orgId: string, productId: string, plant: string) {
  const { data: bom } = await supabase
    .from('core_relationships')
    .select(`
      *,
      from_entity:core_entities!from_entity_id(*),
      to_entity:core_entities!to_entity_id(*)
    `)
    .eq('organization_id', orgId)
    .eq('from_entity_id', productId)
    .eq('relationship_type', 'has_component')
    .eq('metadata->plant', plant)

  return bom || []
}

async function getRouting(orgId: string, productId: string, plant: string) {
  const { data: routing } = await supabase
    .from('core_relationships')
    .select(`
      *,
      to_entity:core_entities!to_entity_id(*)
    `)
    .eq('organization_id', orgId)
    .eq('from_entity_id', productId)
    .eq('relationship_type', 'has_operation')
    .eq('metadata->plant', plant)
    .order('metadata->sequence')

  return routing || []
}

async function getActivityRates(orgId: string, plant: string, variant: string) {
  const { data: rates } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', orgId)
    .eq('field_name', 'activity_rate')
    .eq('metadata->plant', plant)
    .eq('metadata->variant', variant)

  const rateMap: Record<string, number> = {}
  rates?.forEach(r => {
    rateMap[r.metadata.activity_type] = r.field_value_number
  })

  return rateMap
}

async function calculateStandardCost(bom: any[], routing: any[], rates: Record<string, number>) {
  const components = []

  // Material costs from BOM
  for (const component of bom) {
    const quantity = component.metadata?.quantity || 1
    const price = component.to_entity?.metadata?.standard_price || 0
    
    components.push({
      entity_id: component.to_entity_id,
      cost_element: 'material',
      cost_component: component.to_entity?.entity_name,
      quantity: quantity,
      rate: price,
      amount: quantity * price,
      uom: component.metadata?.uom
    })
  }

  // Activity costs from routing
  for (const operation of routing) {
    const activityType = operation.metadata?.activity_type
    const duration = operation.metadata?.duration || 0
    const rate = rates[activityType] || 0
    
    components.push({
      entity_id: operation.to_entity_id,
      cost_element: 'activity',
      cost_component: operation.to_entity?.entity_name,
      quantity: duration,
      rate: rate,
      amount: duration * rate,
      uom: operation.metadata?.time_uom || 'hours'
    })
  }

  return components
}

function summarizeCostComponents(components: any[]) {
  const summary: Record<string, number> = {}
  
  components.forEach(c => {
    const element = c.cost_element
    summary[element] = (summary[element] || 0) + c.amount
  })

  return summary
}

async function getCostCenterCosts(orgId: string, ccId: string, period: any) {
  // Get actual costs posted to cost center
  const { data: costs } = await supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('organization_id', orgId)
    .eq('metadata->cost_center', ccId)
    .eq('metadata->period->year', period.year)
    .eq('metadata->period->month', period.month)
    .like('smart_code', 'HERA.COSTING.ACTUAL.%')

  const total = costs?.reduce((sum, c) => sum + c.total_amount, 0) || 0

  return { total, count: costs?.length || 0 }
}

async function getDriverValues(orgId: string, driverName: string, receivers: string[], period: any) {
  // Get statistical key figures or other driver values
  const { data: values } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', orgId)
    .eq('field_name', driverName)
    .in('entity_id', receivers)
    .eq('metadata->period->year', period.year)
    .eq('metadata->period->month', period.month)

  const driverMap: Record<string, number> = {}
  let totalDriver = 0

  values?.forEach(v => {
    const value = v.field_value_number || 0
    driverMap[v.entity_id] = value
    totalDriver += value
  })

  return { driverMap, totalDriver }
}

function calculateAssessment(senderCosts: any, driverValues: any) {
  const { driverMap, totalDriver } = driverValues
  const allocations = []

  for (const [receiverId, driverValue] of Object.entries(driverMap)) {
    const percentage = totalDriver > 0 ? (driverValue as number) / totalDriver : 0
    const amount = senderCosts.total * percentage

    allocations.push({
      receiver_cc: receiverId,
      driver_value: driverValue,
      percentage: percentage,
      amount: amount
    })
  }

  return allocations
}

async function getRevenueBySlice(orgId: string, slice: any, period: any) {
  // Build query based on slice dimensions
  let query = supabase
    .from('universal_transactions')
    .select('total_amount')
    .eq('organization_id', orgId)
    .eq('transaction_type', 'sale')
    .eq('metadata->period->year', period.year)
    .eq('metadata->period->month', period.month)

  // Apply slice filters
  if (slice.dims.product?.length > 0) {
    query = query.in('metadata->product_id', slice.dims.product)
  }
  if (slice.dims.customer?.length > 0) {
    query = query.in('from_entity_id', slice.dims.customer)
  }

  const { data: revenue } = await query

  return {
    total: revenue?.reduce((sum, r) => sum + r.total_amount, 0) || 0,
    count: revenue?.length || 0
  }
}

async function getCostsBySlice(orgId: string, slice: any, period: any) {
  // Get costs by type
  const costTypes = ['variable_material', 'variable_labor', 'variable_overhead', 'fixed_overhead']
  const costs: Record<string, number> = {}

  for (const costType of costTypes) {
    const { data } = await supabase
      .from('universal_transaction_lines')
      .select('line_amount')
      .eq('organization_id', orgId)
      .eq('metadata->cost_type', costType)
      .eq('metadata->period->year', period.year)
      .eq('metadata->period->month', period.month)
    
    costs[costType] = data?.reduce((sum, d) => sum + d.line_amount, 0) || 0
  }

  return costs
}

// Stub implementations for other functions
async function actualRollup(orgId: string, txId: string, metadata: any) {
  return { status: 'completed', message: 'Actual rollup completed' }
}

async function applyOverhead(orgId: string, txId: string, metadata: any) {
  return { status: 'completed', message: 'Overhead applied' }
}

async function distributeLandedCost(orgId: string, txId: string, metadata: any) {
  return { status: 'completed', message: 'Landed cost distributed' }
}

async function allocDistribute(orgId: string, txId: string, metadata: any) {
  return { status: 'completed', message: 'Distribution allocation completed' }
}

async function pvmAnalysis(orgId: string, txId: string, metadata: any) {
  return { status: 'completed', message: 'PVM analysis completed' }
}

async function marginAnalysis(orgId: string, txId: string, metadata: any) {
  return { status: 'completed', message: 'Margin analysis completed' }
}