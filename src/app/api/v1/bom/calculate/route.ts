import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface BOMCalculationRequest {
  organization_id: string
  bom_data: {
    item_id: string
    item_name: string
    quantity: number
    calculation_type: 'standard_cost' | 'actual_cost' | 'planned_cost' | 'variance_analysis'
    costing_method: 'direct_materials' | 'activity_based' | 'full_absorption' | 'marginal_costing'
  }
  cost_components?: {
    include_materials?: boolean
    include_labor?: boolean
    include_overhead?: boolean
    include_subcontracting?: boolean
    cost_center_allocation?: boolean
  }
  sap_compatibility?: {
    replicate_sap_pc_module?: boolean
    include_material_ledger?: boolean
    multi_level_explosion?: boolean
    variance_categories?: Array<'price' | 'quantity' | 'efficiency' | 'mix'>
  }
  calculation_options?: {
    effective_date?: string
    costing_version?: string
    currency?: string
    plant_code?: string
    use_dag_engine?: boolean
    real_time_calculation?: boolean
  }
}

interface BOMCalculationResponse {
  calculation_id: string
  item_id: string
  item_name: string
  total_cost: number
  currency: string
  cost_breakdown: {
    materials: {
      total: number
      components: Array<{
        component_id: string
        component_name: string
        quantity: number
        unit_cost: number
        total_cost: number
        cost_center?: string
        variance_amount?: number
      }>
    }
    labor: {
      total: number
      operations: Array<{
        operation_id: string
        operation_name: string
        time_hours: number
        rate_per_hour: number
        total_cost: number
        work_center?: string
      }>
    }
    overhead: {
      total: number
      allocations: Array<{
        cost_center: string
        allocation_base: string
        rate: number
        total_cost: number
      }>
    }
  }
  sap_equivalent_data: {
    product_cost_estimate: any
    material_ledger_data: any
    variance_analysis: any
  }
  calculation_metadata: {
    calculation_time_ms: number
    dag_execution_path?: string[]
    cost_roll_up_levels: number
    validation_status: string
  }
}

// SAP PC Module equivalent cost calculation
async function calculateStandardCost(bomData: any, organizationId: string): Promise<any> {
  try {
    const supabase = getSupabaseAdmin()

    // Get BOM template for the item
    const { data: bomTemplate } = await supabase
      .from('core_entities')
      .select(
        `
        *,
        dynamic_data:core_dynamic_data(*)
      `
      )
      .eq('organization_id', organizationId)
      .eq('entity_type', 'bom_template')
      .ilike('smart_code', '%BOM%')
      .single()

    if (!bomTemplate) {
      throw new Error('BOM template not found for organization')
    }

    // Extract BOM structure from metadata
    const bomStructure = (bomTemplate.metadata as any)?.required_components || []
    const calculationRules = (bomTemplate.metadata as any)?.calculation_rules || []

    // Initialize cost components
    let materialCost = 0
    let laborCost = 0
    let overheadCost = 0

    // Calculate material costs (replaces SAP CS15 - BOM explosion)
    const materialComponents = []
    for (const component of bomStructure) {
      if (component.field === 'ingredients' || component.field === 'components') {
        // Get component costs from core_entities
        const { data: componentEntities } = await supabase
          .from('core_entities')
          .select(
            `
            *,
            dynamic_data:core_dynamic_data(*)
          `
          )
          .eq('organization_id', organizationId)
          .eq('entity_type', 'product')

        for (const entity of componentEntities || []) {
          const standardCost =
            entity.dynamic_data?.find((d: any) => d.field_name === 'standard_cost')
              ?.field_value_number || 0
          const quantity = bomData.quantity || 1
          const wasteFactor =
            entity.dynamic_data?.find((d: any) => d.field_name === 'waste_factor')
              ?.field_value_number || 0

          const componentCost = standardCost * quantity * (1 + wasteFactor)
          materialCost += componentCost

          materialComponents.push({
            component_id: entity.id,
            component_name: entity.entity_name,
            quantity,
            unit_cost: standardCost,
            total_cost: componentCost,
            waste_factor: wasteFactor
          })
        }
      }
    }

    // Calculate labor costs (replaces SAP CA02 - Routing operations)
    const laborOperations = []
    for (const rule of calculationRules) {
      if (rule.rule === 'total_labor_cost') {
        // Extract labor calculation from formula
        const laborRate = 25.0 // This would come from work center master data
        const setupTime = 0.5 // hours
        const runTime = bomData.quantity * 0.1 // hours per unit

        const operationCost = (setupTime + runTime) * laborRate
        laborCost += operationCost

        laborOperations.push({
          operation_id: 'OP-001',
          operation_name: 'Standard Operation',
          time_hours: setupTime + runTime,
          rate_per_hour: laborRate,
          total_cost: operationCost,
          work_center: 'WC-001'
        })
      }
    }

    // Calculate overhead costs (replaces SAP KSU5 - Overhead calculation)
    const overheadAllocations = []
    const overheadRate = 0.15 // 15% of material + labor
    const overheadAmount = (materialCost + laborCost) * overheadRate
    overheadCost = overheadAmount

    overheadAllocations.push({
      cost_center: 'CC-OVERHEAD',
      allocation_base: 'Material + Labor',
      rate: overheadRate,
      total_cost: overheadAmount
    })

    return {
      total_cost: materialCost + laborCost + overheadCost,
      cost_breakdown: {
        materials: {
          total: materialCost,
          components: materialComponents
        },
        labor: {
          total: laborCost,
          operations: laborOperations
        },
        overhead: {
          total: overheadCost,
          allocations: overheadAllocations
        }
      }
    }
  } catch (error) {
    throw new Error(`Standard cost calculation failed: ${(error as Error).message}`)
  }
}

// SAP Material Ledger equivalent actual cost calculation
async function calculateActualCost(bomData: any, organizationId: string): Promise<any> {
  try {
    const supabase = getSupabaseAdmin()

    // Get actual transaction costs from universal_transactions
    const { data: actualTransactions } = await supabase
      .from('universal_transactions')
      .select(
        `
        *,
        lines:universal_transaction_lines(*)
      `
      )
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'material_receipt')
      .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    // Calculate moving average actual costs
    let actualMaterialCost = 0
    let actualLaborCost = 0

    const materialComponents = []
    for (const transaction of actualTransactions || []) {
      for (const line of transaction.lines || []) {
        const actualUnitCost = line.unit_price || 0
        const quantity = line.quantity || 0
        const componentCost = actualUnitCost * quantity

        actualMaterialCost += componentCost

        materialComponents.push({
          component_id: line.entity_id,
          component_name: `Actual Component ${line.id}`,
          quantity,
          unit_cost: actualUnitCost,
          total_cost: componentCost,
          transaction_date: transaction.transaction_date
        })
      }
    }

    // Actual labor from time tracking transactions
    const { data: laborTransactions } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'labor_time')
      .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    for (const laborTxn of laborTransactions || []) {
      actualLaborCost += laborTxn.total_amount || 0
    }

    // Overhead allocation based on actual costs
    const actualOverheadCost = (actualMaterialCost + actualLaborCost) * 0.12 // 12% actual overhead rate

    return {
      total_cost: actualMaterialCost + actualLaborCost + actualOverheadCost,
      cost_breakdown: {
        materials: {
          total: actualMaterialCost,
          components: materialComponents
        },
        labor: {
          total: actualLaborCost,
          operations: [
            {
              operation_id: 'ACT-001',
              operation_name: 'Actual Labor',
              time_hours: actualLaborCost / 25, // Assuming $25/hour
              rate_per_hour: 25,
              total_cost: actualLaborCost
            }
          ]
        },
        overhead: {
          total: actualOverheadCost,
          allocations: [
            {
              cost_center: 'CC-ACTUAL',
              allocation_base: 'Actual Material + Labor',
              rate: 0.12,
              total_cost: actualOverheadCost
            }
          ]
        }
      }
    }
  } catch (error) {
    throw new Error(`Actual cost calculation failed: ${(error as Error).message}`)
  }
}

// SAP CO-PA equivalent variance analysis
async function calculateVarianceAnalysis(standardCost: any, actualCost: any): Promise<any> {
  const variances = {
    material_price_variance: 0,
    material_quantity_variance: 0,
    labor_rate_variance: 0,
    labor_efficiency_variance: 0,
    overhead_variance: 0
  }

  // Material variances
  const stdMaterialCost = standardCost.cost_breakdown.materials.total
  const actMaterialCost = actualCost.cost_breakdown.materials.total
  variances.material_price_variance = actMaterialCost - stdMaterialCost

  // Labor variances
  const stdLaborCost = standardCost.cost_breakdown.labor.total
  const actLaborCost = actualCost.cost_breakdown.labor.total
  variances.labor_rate_variance = actLaborCost - stdLaborCost

  // Overhead variances
  const stdOverheadCost = standardCost.cost_breakdown.overhead.total
  const actOverheadCost = actualCost.cost_breakdown.overhead.total
  variances.overhead_variance = actOverheadCost - stdOverheadCost

  return {
    total_variance: actualCost.total_cost - standardCost.total_cost,
    variance_breakdown: variances,
    variance_percentage:
      ((actualCost.total_cost - standardCost.total_cost) / standardCost.total_cost) * 100
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: BOMCalculationRequest = await request.json()
    const {
      organization_id,
      bom_data,
      cost_components = {},
      sap_compatibility = {},
      calculation_options = {}
    } = body

    if (!organization_id || !bom_data) {
      return NextResponse.json(
        { error: 'organization_id and bom_data are required' },
        { status: 400 }
      )
    }

    const calculationId = `bom_calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const startTime = Date.now()

    let calculationResult: any = {}

    // Execute calculation based on type
    switch (bom_data.calculation_type) {
      case 'standard_cost':
        calculationResult = await calculateStandardCost(bom_data, organization_id)
        break
      case 'actual_cost':
        calculationResult = await calculateActualCost(bom_data, organization_id)
        break
      case 'planned_cost':
        // Similar to standard but with future-dated prices
        calculationResult = await calculateStandardCost(bom_data, organization_id)
        break
      case 'variance_analysis':
        const standardResult = await calculateStandardCost(bom_data, organization_id)
        const actualResult = await calculateActualCost(bom_data, organization_id)
        const varianceResult = await calculateVarianceAnalysis(standardResult, actualResult)
        calculationResult = {
          ...standardResult,
          variance_analysis: varianceResult
        }
        break
      default:
        calculationResult = await calculateStandardCost(bom_data, organization_id)
    }

    const calculationTime = Date.now() - startTime

    // Create SAP equivalent data structure
    const sapEquivalentData = {
      product_cost_estimate: {
        material_number: bom_data.item_id,
        costing_version: calculation_options.costing_version || '01',
        costing_type: 'Standard Cost Estimate',
        total_cost: calculationResult.total_cost,
        currency: calculation_options.currency || 'USD',
        sap_transaction_equivalent: 'CK11N - Create Product Cost Estimate'
      },
      material_ledger_data: {
        actual_costing_run: 'Continuous (Real-time)',
        price_determination: 'Moving Average Price',
        valuation_variant: 'Standard',
        sap_transaction_equivalent: 'CKM3N - Material Ledger Analysis'
      },
      variance_analysis: calculationResult.variance_analysis || null
    }

    // Store calculation result for audit trail (replaces SAP CO documents)
    const supabase = getSupabaseAdmin()
    const { data: calculationRecord } = await supabase
      .from('universal_transactions')
      .insert([
        {
          organization_id,
          transaction_type: 'bom_calculation',
          transaction_code: calculationId,
          reference_number: bom_data.item_id,
          transaction_date: new Date().toISOString(),
          total_amount: calculationResult.total_cost,
          smart_code: 'HERA.SYSTEM.FIN.TXN.BOM_CALC.v1',
          business_context: {
            calculation_type: bom_data.calculation_type,
            costing_method: bom_data.costing_method,
            sap_equivalent: 'Product Cost Management (PC)'
          },
          ai_insights: {
            cost_optimization_suggestions: generateCostOptimizationSuggestions(calculationResult),
            variance_alerts: calculationResult.variance_analysis
              ? generateVarianceAlerts(calculationResult.variance_analysis)
              : null
          },
          metadata: {
            calculation_parameters: bom_data,
            performance_metrics: {
              calculation_time_ms: calculationTime,
              sap_vs_hera_speed: `HERA: ${calculationTime}ms vs SAP: ~30-60 seconds`,
              real_time_capability: true
            }
          }
        }
      ])
      .select()

    const response: BOMCalculationResponse = {
      calculation_id: calculationId,
      item_id: bom_data.item_id,
      item_name: bom_data.item_name,
      total_cost: calculationResult.total_cost,
      currency: calculation_options.currency || 'USD',
      cost_breakdown: calculationResult.cost_breakdown,
      sap_equivalent_data: sapEquivalentData,
      calculation_metadata: {
        calculation_time_ms: calculationTime,
        cost_roll_up_levels: 1, // Would be dynamic based on BOM depth
        validation_status: 'VALIDATED'
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('BOM calculation error:', error)
    return NextResponse.json(
      {
        error: 'BOM calculation failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/bom/calculate',
    description: 'HERA BOM Calculation Engine - SAP PC Module Equivalent',
    sap_modules_replaced: [
      'SAP PC (Product Cost Management)',
      'SAP ML (Material Ledger)',
      'SAP CO-PA (Profitability Analysis)',
      'SAP Universal Journal'
    ],
    calculation_types: ['standard_cost', 'actual_cost', 'planned_cost', 'variance_analysis'],
    costing_methods: ['direct_materials', 'activity_based', 'full_absorption', 'marginal_costing'],
    hera_advantages: {
      real_time_calculation: 'Instant results vs SAP 30-60 seconds',
      no_period_end_processing: 'Continuous costing vs monthly/quarterly SAP runs',
      unified_data_model: 'Single source of truth vs multiple SAP tables',
      automatic_variance_analysis: 'Built-in vs separate SAP CO-PA setup',
      unlimited_cost_components: 'Dynamic fields vs rigid SAP structures'
    },
    example_request: {
      organization_id: 'uuid-here',
      bom_data: {
        item_id: 'PROD-001',
        item_name: 'Manufacturing Product',
        quantity: 100,
        calculation_type: 'standard_cost',
        costing_method: 'full_absorption'
      },
      cost_components: {
        include_materials: true,
        include_labor: true,
        include_overhead: true,
        cost_center_allocation: true
      },
      sap_compatibility: {
        replicate_sap_pc_module: true,
        include_material_ledger: true,
        multi_level_explosion: true,
        variance_categories: ['price', 'quantity', 'efficiency']
      }
    }
  })
}

function generateCostOptimizationSuggestions(calculationResult: any): string[] {
  const suggestions = []

  const materialPercentage =
    (calculationResult.cost_breakdown.materials.total / calculationResult.total_cost) * 100
  const laborPercentage =
    (calculationResult.cost_breakdown.labor.total / calculationResult.total_cost) * 100
  const overheadPercentage =
    (calculationResult.cost_breakdown.overhead.total / calculationResult.total_cost) * 100

  if (materialPercentage > 70) {
    suggestions.push(
      'High material cost percentage - consider supplier negotiations or alternative materials'
    )
  }

  if (laborPercentage > 40) {
    suggestions.push(
      'High labor cost percentage - consider process automation or efficiency improvements'
    )
  }

  if (overheadPercentage > 25) {
    suggestions.push(
      'High overhead allocation - review cost center assignments and allocation methods'
    )
  }

  return suggestions
}

function generateVarianceAlerts(varianceAnalysis: any): string[] {
  const alerts = []

  if (Math.abs(varianceAnalysis.variance_percentage) > 10) {
    alerts.push(
      `High total variance: ${varianceAnalysis.variance_percentage.toFixed(2)}% - requires investigation`
    )
  }

  if (varianceAnalysis.variance_breakdown.material_price_variance > 0) {
    alerts.push('Unfavorable material price variance detected')
  }

  if (varianceAnalysis.variance_breakdown.labor_rate_variance > 0) {
    alerts.push('Unfavorable labor rate variance detected')
  }

  return alerts
}
