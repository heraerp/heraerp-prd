/**
 * HERA Cost Calculation Engine
 *
 * Advanced activity-based costing engine with BOM integration
 * Supports multiple costing methods and real-time calculations
 */

import { universalApi } from '@/src/lib/universal-api'

export interface CostCalculationRequest {
  product_id: string
  organization_id: string
  costing_method: 'standard' | 'average' | 'activity_based' | 'marginal'
  include_bom: boolean
  include_overhead: boolean
  calculation_date?: string
}

export interface CostComponent {
  type: 'material' | 'labor' | 'overhead' | 'other'
  category: string
  description: string
  quantity: number
  unit_cost: number
  total_cost: number
  source: string
  smart_code: string
}

export interface CostCalculationResult {
  product_id: string
  calculation_id: string
  calculation_date: string
  costing_method: string
  cost_components: CostComponent[]
  summary: {
    direct_material: number
    direct_labor: number
    manufacturing_overhead: number
    total_manufacturing_cost: number
    admin_overhead?: number
    selling_overhead?: number
    total_cost: number
  }
  profitability: {
    selling_price: number
    gross_margin: number
    gross_margin_percentage: number
    contribution_margin?: number
    net_margin?: number
  }
  smart_codes_used: string[]
  confidence_score: number
}

export class CostCalculationEngine {
  private organizationId: string
  private bomCache: Map<string, any> = new Map()
  private costPoolCache: Map<string, any> = new Map()

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Calculate product cost with full BOM explosion
   */
  async calculateProductCost(request: CostCalculationRequest): Promise<CostCalculationResult> {
    const calculationId = `calc_${Date.now()}`
    const startTime = Date.now()

    try {
      // Step 1: Get BOM data if requested
      let bomCosts: CostComponent[] = []
      if (request.include_bom) {
        bomCosts = await this.calculateBOMCosts(request.product_id)
      }

      // Step 2: Calculate direct labor
      const laborCosts = await this.calculateLaborCosts(request.product_id)

      // Step 3: Calculate overhead if requested
      let overheadCosts: CostComponent[] = []
      if (request.include_overhead) {
        overheadCosts = await this.calculateOverheadCosts(
          request.product_id,
          request.costing_method
        )
      }

      // Step 4: Get product pricing
      const pricing = await this.getProductPricing(request.product_id)

      // Step 5: Combine all costs
      const allCosts = [...bomCosts, ...laborCosts, ...overheadCosts]

      // Step 6: Calculate summary
      const summary = this.calculateCostSummary(allCosts)

      // Step 7: Calculate profitability
      const profitability = this.calculateProfitability(summary, pricing)

      // Step 8: Determine confidence score
      const confidenceScore = this.calculateConfidenceScore(allCosts, Date.now() - startTime)

      return {
        product_id: request.product_id,
        calculation_id: calculationId,
        calculation_date: request.calculation_date || new Date().toISOString(),
        costing_method: request.costing_method,
        cost_components: allCosts,
        summary,
        profitability,
        smart_codes_used: this.getUsedSmartCodes(allCosts),
        confidence_score: confidenceScore
      }
    } catch (error) {
      console.error('Cost calculation failed:', error)
      throw new Error(
        `Failed to calculate cost: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Calculate BOM costs with multi-level explosion
   */
  private async calculateBOMCosts(productId: string): Promise<CostComponent[]> {
    // Check cache first
    if (this.bomCache.has(productId)) {
      return this.bomCache.get(productId)
    }

    // Get BOM structure from universal API
    const bomData = await universalApi.readRecords('core_relationships', {
      filters: {
        source_entity_id: productId,
        relationship_type: 'bom_component'
      }
    })

    const costs: CostComponent[] = []

    // Process each BOM component
    for (const component of bomData.data || []) {
      // Get component details
      const componentEntity = await universalApi.getEntity(component.target_entity_id)

      // Get component cost from dynamic data
      const costData = await universalApi.getDynamicFields(component.target_entity_id, [
        'standard_cost',
        'last_purchase_price',
        'average_cost'
      ])

      const unitCost = parseFloat(costData.standard_cost || costData.average_cost || '0')
      const quantity = component.relationship_data?.quantity || 1

      costs.push({
        type: 'material',
        category: 'direct_material',
        description: componentEntity.entity_name,
        quantity,
        unit_cost: unitCost,
        total_cost: unitCost * quantity,
        source: 'bom_explosion',
        smart_code: 'HERA.COST.PROD.MATERIAL.v1'
      })

      // Recursively calculate sub-components
      if (component.relationship_data?.has_sub_bom) {
        const subCosts = await this.calculateBOMCosts(component.target_entity_id)
        costs.push(
          ...subCosts.map(sc => ({
            ...sc,
            quantity: sc.quantity * quantity,
            total_cost: sc.total_cost * quantity
          }))
        )
      }
    }

    // Cache results
    this.bomCache.set(productId, costs)

    return costs
  }

  /**
   * Calculate labor costs based on routing
   */
  private async calculateLaborCosts(productId: string): Promise<CostComponent[]> {
    // Get routing/operations data
    const routingData = await universalApi.readRecords('core_relationships', {
      filters: {
        source_entity_id: productId,
        relationship_type: 'production_routing'
      }
    })

    const costs: CostComponent[] = []

    for (const operation of routingData.data || []) {
      const operationDetails = await universalApi.getDynamicFields(operation.target_entity_id, [
        'operation_name',
        'standard_hours',
        'labor_rate',
        'efficiency_factor'
      ])

      const hours = parseFloat(operationDetails.standard_hours || '0')
      const rate = parseFloat(operationDetails.labor_rate || '0')
      const efficiency = parseFloat(operationDetails.efficiency_factor || '1')

      costs.push({
        type: 'labor',
        category: 'direct_labor',
        description: operationDetails.operation_name || 'Production Operation',
        quantity: hours / efficiency,
        unit_cost: rate,
        total_cost: (hours / efficiency) * rate,
        source: 'routing',
        smart_code: 'HERA.COST.PROD.LABOR.v1'
      })
    }

    return costs
  }

  /**
   * Calculate overhead costs using activity-based costing
   */
  private async calculateOverheadCosts(
    productId: string,
    method: string
  ): Promise<CostComponent[]> {
    if (method !== 'activity_based') {
      // Simple overhead allocation
      return this.calculateSimpleOverhead(productId)
    }

    // Get cost pools
    const costPools = await this.getCostPools()
    const costs: CostComponent[] = []

    for (const pool of costPools) {
      // Get activity driver consumption for this product
      const driverConsumption = await this.getDriverConsumption(productId, pool.id)

      if (driverConsumption > 0) {
        costs.push({
          type: 'overhead',
          category: 'manufacturing_overhead',
          description: pool.pool_name,
          quantity: driverConsumption,
          unit_cost: pool.rate_per_unit,
          total_cost: driverConsumption * pool.rate_per_unit,
          source: 'activity_based_costing',
          smart_code: 'HERA.COST.PROD.OVERHEAD.v1'
        })
      }
    }

    return costs
  }

  /**
   * Simple overhead allocation method
   */
  private async calculateSimpleOverhead(productId: string): Promise<CostComponent[]> {
    // Get product's direct costs as allocation base
    const directCosts = await this.getDirectCosts(productId)
    const overheadRate = 0.35 // 35% of direct costs

    return [
      {
        type: 'overhead',
        category: 'manufacturing_overhead',
        description: 'Manufacturing Overhead (35% of direct costs)',
        quantity: 1,
        unit_cost: directCosts * overheadRate,
        total_cost: directCosts * overheadRate,
        source: 'percentage_allocation',
        smart_code: 'HERA.COST.PROD.OVERHEAD.v1'
      }
    ]
  }

  /**
   * Get cost pools for ABC costing
   */
  private async getCostPools(): Promise<any[]> {
    // Check cache
    if (this.costPoolCache.has('all_pools')) {
      return this.costPoolCache.get('all_pools')
    }

    // Get from API
    const response = await fetch(
      `/api/v1/profitability?action=list&entity_type=cost_pools&organization_id=${this.organizationId}`
    )
    const data = await response.json()

    if (data.success) {
      this.costPoolCache.set('all_pools', data.data)
      return data.data
    }

    return []
  }

  /**
   * Get activity driver consumption for a product
   */
  private async getDriverConsumption(productId: string, poolId: string): Promise<number> {
    // This would typically query activity driver consumption data
    // For now, return mock data
    const mockConsumption: Record<string, number> = {
      pool_001: 0.5, // Machine hours
      pool_002: 0.02, // Setup count
      pool_003: 0.1 // Quality inspections
    }

    return mockConsumption[poolId] || 0
  }

  /**
   * Get direct costs for overhead allocation base
   */
  private async getDirectCosts(productId: string): Promise<number> {
    const bomCosts = await this.calculateBOMCosts(productId)
    const laborCosts = await this.calculateLaborCosts(productId)

    const materialTotal = bomCosts.reduce((sum, c) => sum + c.total_cost, 0)
    const laborTotal = laborCosts.reduce((sum, c) => sum + c.total_cost, 0)

    return materialTotal + laborTotal
  }

  /**
   * Get product pricing information
   */
  private async getProductPricing(productId: string): Promise<any> {
    const pricingData = await universalApi.getDynamicFields(productId, [
      'selling_price',
      'list_price',
      'minimum_price'
    ])

    return {
      selling_price: parseFloat(pricingData.selling_price || pricingData.list_price || '0'),
      minimum_price: parseFloat(pricingData.minimum_price || '0')
    }
  }

  /**
   * Calculate cost summary from components
   */
  private calculateCostSummary(components: CostComponent[]): any {
    const summary = {
      direct_material: 0,
      direct_labor: 0,
      manufacturing_overhead: 0,
      total_manufacturing_cost: 0,
      admin_overhead: 0,
      selling_overhead: 0,
      total_cost: 0
    }

    components.forEach(component => {
      switch (component.category) {
        case 'direct_material':
          summary.direct_material += component.total_cost
          break
        case 'direct_labor':
          summary.direct_labor += component.total_cost
          break
        case 'manufacturing_overhead':
          summary.manufacturing_overhead += component.total_cost
          break
        case 'admin_overhead':
          summary.admin_overhead += component.total_cost
          break
        case 'selling_overhead':
          summary.selling_overhead += component.total_cost
          break
      }
    })

    summary.total_manufacturing_cost =
      summary.direct_material + summary.direct_labor + summary.manufacturing_overhead

    summary.total_cost =
      summary.total_manufacturing_cost + summary.admin_overhead + summary.selling_overhead

    return summary
  }

  /**
   * Calculate profitability metrics
   */
  private calculateProfitability(summary: any, pricing: any): any {
    const selling_price = pricing.selling_price
    const gross_margin = selling_price - summary.total_manufacturing_cost
    const gross_margin_percentage = (gross_margin / selling_price) * 100

    const contribution_margin = selling_price - (summary.direct_material + summary.direct_labor)
    const net_margin = selling_price - summary.total_cost

    return {
      selling_price,
      gross_margin,
      gross_margin_percentage,
      contribution_margin,
      net_margin
    }
  }

  /**
   * Calculate confidence score for the calculation
   */
  private calculateConfidenceScore(components: CostComponent[], elapsedTime: number): number {
    let score = 100

    // Deduct for missing components
    if (components.length === 0) score -= 50

    // Deduct for slow calculation
    if (elapsedTime > 5000) score -= 10

    // Deduct for old data
    const hasOldData = components.some(c => {
      // Check if component data is old (mock check)
      return false
    })
    if (hasOldData) score -= 15

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Get list of smart codes used in calculation
   */
  private getUsedSmartCodes(components: CostComponent[]): string[] {
    const codes = new Set<string>()

    components.forEach(c => codes.add(c.smart_code))

    // Add calculation method smart code
    codes.add('HERA.COST.PROD.CALC.v1')

    return Array.from(codes)
  }

  /**
   * Perform variance analysis between actual and standard costs
   */
  async performVarianceAnalysis(
    productId: string,
    actualCosts: CostCalculationResult,
    standardCosts: CostCalculationResult
  ): Promise<any> {
    const variances = {
      material_price_variance: 0,
      material_quantity_variance: 0,
      labor_rate_variance: 0,
      labor_efficiency_variance: 0,
      overhead_volume_variance: 0,
      total_variance: 0,
      variance_analysis: []
    }

    // Calculate variances by component
    actualCosts.cost_components.forEach(actualComp => {
      const standardComp = standardCosts.cost_components.find(
        sc => sc.description === actualComp.description
      )

      if (standardComp) {
        const priceVar = (actualComp.unit_cost - standardComp.unit_cost) * actualComp.quantity
        const qtyVar = (actualComp.quantity - standardComp.quantity) * standardComp.unit_cost

        variances.variance_analysis.push({
          component: actualComp.description,
          type: actualComp.type,
          price_variance: priceVar,
          quantity_variance: qtyVar,
          total_variance: priceVar + qtyVar,
          smart_code: 'HERA.COST.VAR.PRICE.v1'
        })

        // Aggregate by type
        if (actualComp.type === 'material') {
          variances.material_price_variance += priceVar
          variances.material_quantity_variance += qtyVar
        } else if (actualComp.type === 'labor') {
          variances.labor_rate_variance += priceVar
          variances.labor_efficiency_variance += qtyVar
        } else if (actualComp.type === 'overhead') {
          variances.overhead_volume_variance += priceVar + qtyVar
        }
      }
    })

    variances.total_variance =
      variances.material_price_variance +
      variances.material_quantity_variance +
      variances.labor_rate_variance +
      variances.labor_efficiency_variance +
      variances.overhead_volume_variance

    return variances
  }
}

// Export singleton instance
export const createCostCalculationEngine = (organizationId: string) => {
  return new CostCalculationEngine(organizationId)
}
