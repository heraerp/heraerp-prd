/**
 * HERA Product Costing v2: Guardrails Engine
 * 
 * Policy-as-data guardrails system for Product Costing v2 with BOM cycle detection,
 * standard cost validation, dimensional completeness, and production posting rules.
 * 
 * Smart Code: HERA.COST.PRODUCT.GUARDRAILS.V2
 */

import {
  type Product,
  type ProductCreateRequest,
  type ProductUpdateRequest,
  type ProductValidationError,
  type ValidationResult,
  type BOMComponent,
  type RoutingActivity,
  type StandardCostComponents,
  validateProductCode,
  validateProductType,
  validateStandardCostComponents,
  validateEffectiveDates,
  validateBOMComponent,
  validateRoutingActivity,
  detectBOMCycle,
  hasSelfConsumption,
  requiresStandardCostVersion,
  PRODUCT_COSTING_ERROR_CODES
} from './productcosting-v2-standard'

// ============================================================================
// Policy Definitions
// ============================================================================

export interface ProductStructurePolicy {
  policy: 'PRODUCT_STRUCTURE_V2'
  rules: {
    unique_product_code_per_org: { enforce: boolean }
    valid_type: { values: string[] }
    std_cost_version_required_for_finished: { enforce: boolean }
    components_positive: { enforce: boolean }
    valid_effective_dates: { enforce: boolean }
    require_gl_mapping_for_finished: { enforce: boolean }
  }
}

export interface BOMRoutingPolicy {
  policy: 'BOM_ROUTING_V2'
  rules: {
    no_self_consumption: { enforce: boolean }
    no_cycles_bom: { enforce: boolean }
    std_hours_non_negative: { enforce: boolean }
    qty_per_positive: { enforce: boolean }
    max_bom_levels: { value: number }
    max_routing_activities: { value: number }
  }
}

export interface COADimensionalRequirementsPolicy {
  policy: 'COA_DIM_REQUIREMENTS_V2'
  ranges: Array<{
    range: string
    requires: string[]
    optional: string[]
  }>
}

export interface VarianceHandlingPolicy {
  policy: 'VARIANCE_HANDLING_V2'
  rules: {
    variance_accounts_present: { enforce: boolean }
    wip_accounts_present: { enforce: boolean }
    variance_settlement_required_at_close: { enforce: boolean }
    variance_threshold_percent: { value: number }
  }
}

export interface ProductionPostingPolicy {
  policy: 'PRODUCTION_POSTING_V2'
  rules: {
    require_cost_center_for_labor: { enforce: boolean }
    require_profit_center_for_cogs: { enforce: boolean }
    require_product_for_inventory: { enforce: boolean }
    allow_negative_inventory: { enforce: boolean }
    require_approval_for_variances: { threshold: number }
  }
}

// ============================================================================
// Default Policies
// ============================================================================

const DEFAULT_PRODUCT_STRUCTURE_POLICY: ProductStructurePolicy = {
  policy: 'PRODUCT_STRUCTURE_V2',
  rules: {
    unique_product_code_per_org: { enforce: true },
    valid_type: { values: ['FINISHED', 'SEMI', 'RAW', 'SERVICE'] },
    std_cost_version_required_for_finished: { enforce: true },
    components_positive: { enforce: true },
    valid_effective_dates: { enforce: true },
    require_gl_mapping_for_finished: { enforce: false } // Optional for now
  }
}

const DEFAULT_BOM_ROUTING_POLICY: BOMRoutingPolicy = {
  policy: 'BOM_ROUTING_V2',
  rules: {
    no_self_consumption: { enforce: true },
    no_cycles_bom: { enforce: true },
    std_hours_non_negative: { enforce: true },
    qty_per_positive: { enforce: true },
    max_bom_levels: { value: 10 },
    max_routing_activities: { value: 50 }
  }
}

const DEFAULT_COA_DIMENSIONAL_POLICY: COADimensionalRequirementsPolicy = {
  policy: 'COA_DIM_REQUIREMENTS_V2',
  ranges: [
    {
      range: '5xxx', // COGS accounts
      requires: ['product', 'profit_center'],
      optional: ['region', 'channel', 'project', 'cost_center']
    },
    {
      range: '1xxx', // Inventory accounts
      requires: ['product'],
      optional: ['profit_center', 'cost_center']
    },
    {
      range: '6xxx', // Expense accounts for overhead
      requires: ['cost_center'],
      optional: ['profit_center', 'product']
    }
  ]
}

const DEFAULT_VARIANCE_HANDLING_POLICY: VarianceHandlingPolicy = {
  policy: 'VARIANCE_HANDLING_V2',
  rules: {
    variance_accounts_present: { enforce: true },
    wip_accounts_present: { enforce: true },
    variance_settlement_required_at_close: { enforce: true },
    variance_threshold_percent: { value: 5.0 } // 5% variance threshold
  }
}

const DEFAULT_PRODUCTION_POSTING_POLICY: ProductionPostingPolicy = {
  policy: 'PRODUCTION_POSTING_V2',
  rules: {
    require_cost_center_for_labor: { enforce: true },
    require_profit_center_for_cogs: { enforce: true },
    require_product_for_inventory: { enforce: true },
    allow_negative_inventory: { enforce: false },
    require_approval_for_variances: { threshold: 1000.00 } // $1000 threshold
  }
}

// ============================================================================
// Guardrails Engine
// ============================================================================

export class ProductCostingGuardrailsEngine {
  private productStructurePolicy: ProductStructurePolicy
  private bomRoutingPolicy: BOMRoutingPolicy
  private coaDimensionalPolicy: COADimensionalRequirementsPolicy
  private varianceHandlingPolicy: VarianceHandlingPolicy
  private productionPostingPolicy: ProductionPostingPolicy

  constructor(
    productStructurePolicy?: ProductStructurePolicy,
    bomRoutingPolicy?: BOMRoutingPolicy,
    coaDimensionalPolicy?: COADimensionalRequirementsPolicy,
    varianceHandlingPolicy?: VarianceHandlingPolicy,
    productionPostingPolicy?: ProductionPostingPolicy
  ) {
    this.productStructurePolicy = productStructurePolicy || DEFAULT_PRODUCT_STRUCTURE_POLICY
    this.bomRoutingPolicy = bomRoutingPolicy || DEFAULT_BOM_ROUTING_POLICY
    this.coaDimensionalPolicy = coaDimensionalPolicy || DEFAULT_COA_DIMENSIONAL_POLICY
    this.varianceHandlingPolicy = varianceHandlingPolicy || DEFAULT_VARIANCE_HANDLING_POLICY
    this.productionPostingPolicy = productionPostingPolicy || DEFAULT_PRODUCTION_POSTING_POLICY
  }

  /**
   * Validate product create request
   */
  validateProductCreate(
    request: ProductCreateRequest,
    organizationId: string,
    existingProducts: Product[] = []
  ): ValidationResult {
    const errors: ProductValidationError[] = []

    // Basic field validation
    const codeValidation = validateProductCode(request.product_code)
    if (!codeValidation.valid) {
      errors.push(...codeValidation.errors)
    }

    const typeValidation = validateProductType(request.product_type)
    if (!typeValidation.valid) {
      errors.push(...typeValidation.errors)
    }

    // Policy: Unique product code per organization
    if (this.productStructurePolicy.rules.unique_product_code_per_org.enforce) {
      const duplicateCode = existingProducts.find(p => 
        p.product_code === request.product_code && p.status === 'ACTIVE'
      )
      if (duplicateCode) {
        errors.push({
          code: 'ERR_PROD_DUPLICATE_CODE',
          message: `Product code ${request.product_code} already exists in organization`,
          field: 'product_code',
          value: request.product_code
        })
      }
    }

    // Policy: Standard cost version required for finished goods
    if (this.productStructurePolicy.rules.std_cost_version_required_for_finished.enforce) {
      if (requiresStandardCostVersion(request.product_type) && !request.std_cost_components) {
        errors.push({
          code: 'ERR_PROD_STDCOST_REQUIRED',
          message: 'Standard cost components required for finished and semi-finished products',
          field: 'std_cost_components'
        })
      }
    }

    // Policy: Validate standard cost components if provided
    if (request.std_cost_components) {
      if (this.productStructurePolicy.rules.components_positive.enforce) {
        const costValidation = validateStandardCostComponents(request.std_cost_components)
        if (!costValidation.valid) {
          errors.push(...costValidation.errors)
        }
      }
    }

    // Policy: Valid effective dates
    if (this.productStructurePolicy.rules.valid_effective_dates.enforce) {
      if (request.effective_from || request.effective_to) {
        const datesValidation = validateEffectiveDates(request.effective_from, request.effective_to)
        if (!datesValidation.valid) {
          errors.push(...datesValidation.errors)
        }
      }
    }

    // Policy: GL mapping required for finished goods (if enforced)
    if (this.productStructurePolicy.rules.require_gl_mapping_for_finished.enforce) {
      if (requiresStandardCostVersion(request.product_type) && !request.gl_mapping) {
        errors.push({
          code: 'ERR_PROD_GL_MAPPING_REQUIRED',
          message: 'GL account mapping required for finished and semi-finished products',
          field: 'gl_mapping'
        })
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate product update request
   */
  validateProductUpdate(
    request: ProductUpdateRequest,
    existingProduct: Product,
    organizationId: string,
    allProducts: Product[] = []
  ): ValidationResult {
    const errors: ProductValidationError[] = []

    // Validate updated fields if provided
    if (request.product_code) {
      const codeValidation = validateProductCode(request.product_code)
      if (!codeValidation.valid) {
        errors.push(...codeValidation.errors)
      }

      // Check uniqueness if code is changing
      if (request.product_code !== existingProduct.product_code) {
        if (this.productStructurePolicy.rules.unique_product_code_per_org.enforce) {
          const duplicateCode = allProducts.find(p => 
            p.product_code === request.product_code && 
            p.status === 'ACTIVE' && 
            p.id !== existingProduct.id
          )
          if (duplicateCode) {
            errors.push({
              code: 'ERR_PROD_DUPLICATE_CODE',
              message: `Product code ${request.product_code} already exists in organization`,
              field: 'product_code',
              value: request.product_code
            })
          }
        }
      }
    }

    if (request.product_type) {
      const typeValidation = validateProductType(request.product_type)
      if (!typeValidation.valid) {
        errors.push(...typeValidation.errors)
      }
    }

    if (request.std_cost_components) {
      if (this.productStructurePolicy.rules.components_positive.enforce) {
        const costValidation = validateStandardCostComponents(request.std_cost_components)
        if (!costValidation.valid) {
          errors.push(...costValidation.errors)
        }
      }
    }

    if (request.effective_from !== undefined || request.effective_to !== undefined) {
      if (this.productStructurePolicy.rules.valid_effective_dates.enforce) {
        const datesValidation = validateEffectiveDates(request.effective_from, request.effective_to)
        if (!datesValidation.valid) {
          errors.push(...datesValidation.errors)
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate BOM structure
   */
  validateBOM(
    productId: string,
    components: BOMComponent[],
    existingBOMMap: Map<string, string[]> = new Map()
  ): ValidationResult {
    const errors: ProductValidationError[] = []

    // Policy: No self-consumption
    if (this.bomRoutingPolicy.rules.no_self_consumption.enforce) {
      if (hasSelfConsumption(productId, components)) {
        errors.push({
          code: 'ERR_BOM_SELF_CONSUMPTION',
          message: 'Product cannot consume itself in BOM',
          field: 'bom_components'
        })
      }
    }

    // Policy: No cycles in BOM
    if (this.bomRoutingPolicy.rules.no_cycles_bom.enforce) {
      // Create updated BOM map for cycle detection
      const updatedBOMMap = new Map(existingBOMMap)
      updatedBOMMap.set(productId, components.map(c => c.component_id))

      if (detectBOMCycle(productId, updatedBOMMap)) {
        errors.push({
          code: 'ERR_BOM_CYCLE',
          message: 'BOM structure would create a cycle',
          field: 'bom_components'
        })
      }
    }

    // Validate individual components
    for (let i = 0; i < components.length; i++) {
      const component = components[i]
      const componentValidation = validateBOMComponent(component)
      if (!componentValidation.valid) {
        errors.push(...componentValidation.errors.map(error => ({
          ...error,
          field: `bom_components[${i}].${error.field}`
        })))
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate routing structure
   */
  validateRouting(
    productId: string,
    activities: RoutingActivity[]
  ): ValidationResult {
    const errors: ProductValidationError[] = []

    // Policy: Standard hours non-negative
    if (this.bomRoutingPolicy.rules.std_hours_non_negative.enforce) {
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i]
        const activityValidation = validateRoutingActivity(activity)
        if (!activityValidation.valid) {
          errors.push(...activityValidation.errors.map(error => ({
            ...error,
            field: `routing_activities[${i}].${error.field}`
          })))
        }
      }
    }

    // Policy: Maximum routing activities
    if (activities.length > this.bomRoutingPolicy.rules.max_routing_activities.value) {
      errors.push({
        code: 'ERR_ROUTING_TOO_MANY_ACTIVITIES',
        message: `Routing cannot have more than ${this.bomRoutingPolicy.rules.max_routing_activities.value} activities`,
        field: 'routing_activities',
        value: activities.length
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate product archive eligibility
   */
  validateProductArchive(
    product: Product,
    allProducts: Product[],
    hasTransactions: boolean = false,
    hasActiveOrders: boolean = false
  ): ValidationResult {
    const errors: ProductValidationError[] = []

    // Check if product is used in other BOMs
    const usedInBOMs = allProducts.some(p => 
      p.status === 'ACTIVE' && p.id !== product.id
      // Note: Would need to check actual BOM relationships here
    )

    if (usedInBOMs) {
      errors.push({
        code: 'ERR_PROD_IN_USE',
        message: 'Product is used in other BOMs and cannot be archived',
        field: 'status'
      })
    }

    // Check if product has open transactions
    if (hasTransactions) {
      errors.push({
        code: 'ERR_PROD_IN_USE',
        message: 'Product has open transactions and cannot be archived',
        field: 'status'
      })
    }

    // Check if product has active orders
    if (hasActiveOrders) {
      errors.push({
        code: 'ERR_PROD_IN_USE',
        message: 'Product has active orders and cannot be archived',
        field: 'status'
      })
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate posting completeness for inventory transactions
   */
  validateInventoryPostingCompleteness(posting: {
    gl_account_code: string
    product_id?: string
    profit_center_id?: string
    cost_center_id?: string
    amount: number
  }): ValidationResult {
    const errors: ProductValidationError[] = []

    const accountCode = posting.gl_account_code
    const accountRange = this.getAccountRange(accountCode)

    // Find policy for this account range
    const policy = this.coaDimensionalPolicy.ranges.find(r => r.range === accountRange)
    if (!policy) {
      return { valid: true, errors: [] } // No policy, allow posting
    }

    // Check required dimensions
    for (const requiredDim of policy.requires) {
      switch (requiredDim) {
        case 'product':
          if (!posting.product_id) {
            errors.push({
              code: 'ERR_POSTING_PRODUCT_REQUIRED',
              message: `Product dimension required for ${accountRange} account postings`,
              field: 'product_id'
            })
          }
          break
        case 'profit_center':
          if (!posting.profit_center_id) {
            errors.push({
              code: 'ERR_POSTING_PROFIT_CENTER_REQUIRED',
              message: `Profit center dimension required for ${accountRange} account postings`,
              field: 'profit_center_id'
            })
          }
          break
        case 'cost_center':
          if (!posting.cost_center_id) {
            errors.push({
              code: 'ERR_POSTING_COST_CENTER_REQUIRED',
              message: `Cost center dimension required for ${accountRange} account postings`,
              field: 'cost_center_id'
            })
          }
          break
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Validate variance calculation
   */
  validateVarianceCalculation(variance: {
    product_id: string
    variance_amount: number
    variance_type: string
    variance_account?: string
  }): ValidationResult {
    const errors: ProductValidationError[] = []

    // Policy: Variance accounts must be present
    if (this.varianceHandlingPolicy.rules.variance_accounts_present.enforce) {
      if (!variance.variance_account) {
        errors.push({
          code: 'ERR_VAR_ACCOUNT_REQUIRED',
          message: 'Variance account required for variance postings',
          field: 'variance_account'
        })
      }
    }

    // Policy: Check variance threshold
    const thresholdPercent = this.varianceHandlingPolicy.rules.variance_threshold_percent.value
    if (Math.abs(variance.variance_amount) > 0) {
      // Note: Would need standard cost to calculate percentage
      // For now, just validate that variance is reasonable
      if (Math.abs(variance.variance_amount) > 10000) { // $10k threshold
        errors.push({
          code: 'ERR_VAR_AMOUNT_HIGH',
          message: 'Variance amount exceeds reasonable threshold',
          field: 'variance_amount',
          value: variance.variance_amount
        })
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Get account range from account code
   */
  private getAccountRange(accountCode: string): string {
    if (accountCode.startsWith('1')) return '1xxx'
    if (accountCode.startsWith('2')) return '2xxx'
    if (accountCode.startsWith('3')) return '3xxx'
    if (accountCode.startsWith('4')) return '4xxx'
    if (accountCode.startsWith('5')) return '5xxx'
    if (accountCode.startsWith('6')) return '6xxx'
    if (accountCode.startsWith('7')) return '7xxx'
    if (accountCode.startsWith('8')) return '8xxx'
    if (accountCode.startsWith('9')) return '9xxx'
    return 'other'
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Apply product costing guardrails with default policies
 */
export async function applyProductCostingGuardrails(
  operation: 'create' | 'update' | 'archive',
  data: ProductCreateRequest | ProductUpdateRequest | Product,
  organizationId: string,
  existingProducts: Product[] = []
): Promise<ValidationResult> {
  const engine = new ProductCostingGuardrailsEngine()

  switch (operation) {
    case 'create':
      return engine.validateProductCreate(data as ProductCreateRequest, organizationId, existingProducts)
    
    case 'update':
      // For update, we need the existing product - assume it's the first in the array for now
      const existingProduct = existingProducts[0]
      if (!existingProduct) {
        return {
          valid: false,
          errors: [{
            code: 'ERR_PROD_NOT_FOUND',
            message: 'Existing product not found for update validation',
            field: 'product_id'
          }]
        }
      }
      return engine.validateProductUpdate(data as ProductUpdateRequest, existingProduct, organizationId, existingProducts)
    
    case 'archive':
      return engine.validateProductArchive(data as Product, existingProducts)
    
    default:
      return {
        valid: false,
        errors: [{
          code: 'ERR_INVALID_OPERATION',
          message: 'Invalid operation type',
          field: 'operation'
        }]
      }
  }
}

/**
 * Validate BOM posting requirements
 */
export function validateBOMPosting(
  productId: string,
  components: BOMComponent[],
  existingBOMMap?: Map<string, string[]>
): ValidationResult {
  const engine = new ProductCostingGuardrailsEngine()
  return engine.validateBOM(productId, components, existingBOMMap)
}

/**
 * Validate routing posting requirements
 */
export function validateRoutingPosting(
  productId: string,
  activities: RoutingActivity[]
): ValidationResult {
  const engine = new ProductCostingGuardrailsEngine()
  return engine.validateRouting(productId, activities)
}

/**
 * Validate posting dimensional completeness
 */
export function validatePostingDimensionalCompleteness(posting: {
  gl_account_code: string
  product_id?: string
  profit_center_id?: string
  cost_center_id?: string
  amount: number
}): ValidationResult {
  const engine = new ProductCostingGuardrailsEngine()
  return engine.validateInventoryPostingCompleteness(posting)
}

/**
 * Batch validate products
 */
export async function batchValidateProducts(
  products: ProductCreateRequest[],
  organizationId: string,
  existingProducts: Product[] = []
): Promise<{ valid: boolean; results: ValidationResult[] }> {
  const results: ValidationResult[] = []
  let allValid = true

  for (const product of products) {
    const result = await applyProductCostingGuardrails('create', product, organizationId, existingProducts)
    results.push(result)
    if (!result.valid) {
      allValid = false
    }
  }

  return { valid: allValid, results }
}

export default {
  ProductCostingGuardrailsEngine,
  applyProductCostingGuardrails,
  validateBOMPosting,
  validateRoutingPosting,
  validatePostingDimensionalCompleteness,
  batchValidateProducts,
  DEFAULT_PRODUCT_STRUCTURE_POLICY,
  DEFAULT_BOM_ROUTING_POLICY,
  DEFAULT_COA_DIMENSIONAL_POLICY,
  DEFAULT_VARIANCE_HANDLING_POLICY,
  DEFAULT_PRODUCTION_POSTING_POLICY
}