/**
 * HERA Product Costing v2: Standard Definitions and Interfaces
 * 
 * Complete TypeScript interface system for Product Costing v2 with BOM management,
 * routing/activity support, WIP & variance accounting, and production posting flows.
 * 
 * Smart Code: HERA.COST.PRODUCT.STANDARD.V2
 */

// ============================================================================
// Core Types and Interfaces
// ============================================================================

export interface Product {
  id: string
  organization_id: string
  entity_type: 'PRODUCT'
  entity_name: string
  entity_code: string
  status: 'ACTIVE' | 'ARCHIVED'
  smart_code: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  
  // Dynamic data fields
  product_code: string
  product_type: 'FINISHED' | 'SEMI' | 'RAW' | 'SERVICE'
  uom: string
  std_cost_version?: string
  std_cost_components?: StandardCostComponents
  effective_from?: string
  effective_to?: string
  gl_mapping?: GLMapping
}

export interface ActivityType {
  id: string
  organization_id: string
  entity_type: 'ACTIVITY_TYPE'
  entity_name: string
  entity_code: string
  status: 'ACTIVE' | 'ARCHIVED'
  smart_code: string
  
  // Dynamic data fields
  activity_code: string
  rate_per_hour: number
  uom: string
  cost_component: 'labor' | 'overhead' | 'subcontract'
  work_center_id?: string
}

export interface WorkCenter {
  id: string
  organization_id: string
  entity_type: 'WORK_CENTER'
  entity_name: string
  entity_code: string
  status: 'ACTIVE' | 'ARCHIVED'
  smart_code: string
  
  // Dynamic data fields
  work_center_code: string
  capacity_hours_per_day?: number
  overhead_rate_per_hour?: number
  cost_center_id?: string
}

export interface StandardCostComponents {
  material: number
  labor: number
  overhead: number
  subcontract?: number
  freight?: number
  other?: number
}

export interface GLMapping {
  wip_account?: string
  fg_account?: string
  cogs_account?: string
  material_variance_account?: string
  labor_variance_account?: string
  overhead_variance_account?: string
}

export interface BOMComponent {
  component_id: string
  component_code: string
  component_name: string
  qty_per: number
  scrap_pct: number
  uom: string
  cost_per_unit?: number
  extended_cost?: number
}

export interface RoutingActivity {
  activity_id: string
  activity_code: string
  activity_name: string
  std_hours: number
  rate_per_hour: number
  work_center_id?: string
  work_center_code?: string
  sequence?: number
  extended_cost?: number
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface ProductCreateRequest {
  entity_name: string
  product_code: string
  product_type: 'FINISHED' | 'SEMI' | 'RAW' | 'SERVICE'
  uom: string
  std_cost_version?: string
  std_cost_components?: StandardCostComponents
  effective_from?: string
  effective_to?: string
  gl_mapping?: GLMapping
  metadata?: Record<string, any>
}

export interface ProductUpdateRequest {
  entity_name?: string
  product_code?: string
  product_type?: 'FINISHED' | 'SEMI' | 'RAW' | 'SERVICE'
  uom?: string
  std_cost_version?: string
  std_cost_components?: StandardCostComponents
  effective_from?: string
  effective_to?: string
  gl_mapping?: GLMapping
  metadata?: Record<string, any>
}

export interface ProductResponse extends Product {
  bom_components?: BOMComponent[]
  routing_activities?: RoutingActivity[]
  total_std_cost?: number
  cost_rollup?: StandardCostComponents
  audit_txn_id?: string
}

export interface BOMUpsertRequest {
  product_id: string
  components: Array<{
    component_id: string
    qty_per: number
    scrap_pct?: number
    sequence?: number
    effective_from?: string
    effective_to?: string
  }>
}

export interface RoutingUpsertRequest {
  product_id: string
  activities: Array<{
    activity_id: string
    std_hours: number
    work_center_id?: string
    sequence?: number
    effective_from?: string
    effective_to?: string
  }>
}

// ============================================================================
// Production Posting Types
// ============================================================================

export interface ProductionConfirmation {
  product_id: string
  quantity_produced: number
  work_center_id?: string
  activity_confirmations: Array<{
    activity_id: string
    actual_hours: number
    rate_per_hour?: number
    variance_reason?: string
  }>
  component_consumptions: Array<{
    component_id: string
    actual_qty: number
    cost_per_unit?: number
    variance_reason?: string
  }>
  posting_date: string
  reference_number?: string
}

export interface InventoryMovement {
  product_id: string
  movement_type: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT'
  quantity: number
  cost_per_unit?: number
  from_location?: string
  to_location?: string
  reference_number?: string
  posting_date: string
}

export interface VarianceCalculation {
  product_id: string
  period: string
  material_usage_variance: number
  material_price_variance: number
  labor_efficiency_variance: number
  labor_rate_variance: number
  overhead_volume_variance: number
  overhead_efficiency_variance: number
  total_variance: number
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ProductValidationError {
  code: string
  message: string
  field?: string
  value?: any
}

export interface ValidationResult {
  valid: boolean
  errors: ProductValidationError[]
  warnings?: ProductValidationError[]
}

// ============================================================================
// Smart Code Registry
// ============================================================================

export const PRODUCT_COSTING_SMART_CODES = {
  // Entities
  ENTITY_PRODUCT: 'HERA.COST.PRODUCT.ENTITY.PRODUCT.v2',
  ENTITY_ACTIVITY_TYPE: 'HERA.COST.PRODUCT.ENTITY.ACTIVITY_TYPE.v2',
  ENTITY_WORK_CENTER: 'HERA.COST.PRODUCT.ENTITY.WORK_CENTER.v2',
  
  // Dynamic Data - Product
  DYN_PRODUCT_CODE: 'HERA.COST.PRODUCT.DYN.CODE.v2',
  DYN_PRODUCT_TYPE: 'HERA.COST.PRODUCT.DYN.TYPE.v2',
  DYN_UOM: 'HERA.COST.PRODUCT.DYN.UOM.v2',
  DYN_STDCOST_VERSION: 'HERA.COST.PRODUCT.DYN.STDCOST_VERSION.v2',
  DYN_STDCOST_COMPONENTS: 'HERA.COST.PRODUCT.DYN.STDCOST_COMPONENTS.v2',
  DYN_EFFECTIVE_FROM: 'HERA.COST.PRODUCT.DYN.EFFECTIVE_FROM.v2',
  DYN_EFFECTIVE_TO: 'HERA.COST.PRODUCT.DYN.EFFECTIVE_TO.v2',
  DYN_GL_MAPPING: 'HERA.COST.PRODUCT.DYN.GL_MAPPING.v2',
  
  // Dynamic Data - Activity
  DYN_ACTIVITY_CODE: 'HERA.COST.ACTIVITY.DYN.CODE.v2',
  DYN_RATE_PER_HOUR: 'HERA.COST.ACTIVITY.DYN.RATE_PER_HOUR.v2',
  DYN_COST_COMPONENT: 'HERA.COST.ACTIVITY.DYN.COST_COMPONENT.v2',
  
  // Dynamic Data - Work Center
  DYN_WORK_CENTER_CODE: 'HERA.COST.WORKCENTER.DYN.CODE.v2',
  DYN_CAPACITY_HOURS: 'HERA.COST.WORKCENTER.DYN.CAPACITY_HOURS.v2',
  DYN_OVERHEAD_RATE: 'HERA.COST.WORKCENTER.DYN.OVERHEAD_RATE.v2',
  
  // Relationships
  REL_BOM: 'HERA.COST.PRODUCT.REL.BOM.v2',
  REL_ROUTING: 'HERA.COST.PRODUCT.REL.ROUTING.v2',
  REL_ALTERNATE: 'HERA.COST.PRODUCT.REL.ALTERNATE.v2',
  REL_SUBSTITUTION: 'HERA.COST.PRODUCT.REL.SUBSTITUTION.v2',
  
  // Transactions - Master Data
  TXN_CREATE: 'HERA.COST.PRODUCT.TXN.CREATE.v2',
  TXN_UPDATE: 'HERA.COST.PRODUCT.TXN.UPDATE.v2',
  TXN_ARCHIVE: 'HERA.COST.PRODUCT.TXN.ARCHIVE.v2',
  TXN_REL_UPSERT: 'HERA.COST.PRODUCT.TXN.REL_UPSERT.v2',
  TXN_FIELD_SET: 'HERA.COST.PRODUCT.TXN.FIELD_SET.v2',
  
  // Transactions - Production Posting
  TXN_INV_MOVE: 'HERA.INV.MOVE.TXN.POST.v2',
  TXN_PROD_CONF: 'HERA.COST.PRODCONF.TXN.POST.v2',
  TXN_OVERHEAD_APPLY: 'HERA.COST.OVERHEAD.APPLY.v2',
  TXN_WIP_CALC: 'HERA.COST.WIP.CALC.v2',
  TXN_VAR_CALC: 'HERA.COST.VAR.CALC.v2',
  TXN_VAR_SETTLE: 'HERA.COST.VAR.SETTLE.v2',
  TXN_STDCOST_REVALUE: 'HERA.COST.STDCOST.REVALUE.v2'
} as const

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate product code format
 */
export function validateProductCode(productCode: string): ValidationResult {
  const errors: ProductValidationError[] = []
  
  if (!productCode || typeof productCode !== 'string') {
    errors.push({
      code: 'ERR_PROD_CODE_REQUIRED',
      message: 'Product code is required',
      field: 'product_code'
    })
    return { valid: false, errors }
  }
  
  const trimmed = productCode.trim()
  if (trimmed.length < 3 || trimmed.length > 50) {
    errors.push({
      code: 'ERR_PROD_CODE_LENGTH',
      message: 'Product code must be between 3 and 50 characters',
      field: 'product_code',
      value: productCode
    })
  }
  
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    errors.push({
      code: 'ERR_PROD_CODE_FORMAT',
      message: 'Product code can only contain letters, numbers, hyphens, and underscores',
      field: 'product_code',
      value: productCode
    })
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Validate product type
 */
export function validateProductType(productType: string): ValidationResult {
  const errors: ProductValidationError[] = []
  const validTypes = ['FINISHED', 'SEMI', 'RAW', 'SERVICE']
  
  if (!validTypes.includes(productType)) {
    errors.push({
      code: 'ERR_PROD_INVALID_TYPE',
      message: `Product type must be one of: ${validTypes.join(', ')}`,
      field: 'product_type',
      value: productType
    })
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Validate standard cost components
 */
export function validateStandardCostComponents(components: StandardCostComponents): ValidationResult {
  const errors: ProductValidationError[] = []
  
  if (!components || typeof components !== 'object') {
    errors.push({
      code: 'ERR_PROD_STDCOST_INVALID',
      message: 'Standard cost components must be an object',
      field: 'std_cost_components'
    })
    return { valid: false, errors }
  }
  
  // Check required components
  const requiredComponents = ['material', 'labor', 'overhead']
  for (const component of requiredComponents) {
    if (!(component in components)) {
      errors.push({
        code: 'ERR_PROD_STDCOST_MISSING_COMPONENT',
        message: `Missing required cost component: ${component}`,
        field: 'std_cost_components',
        value: component
      })
    }
  }
  
  // Check all components are non-negative numbers
  for (const [component, value] of Object.entries(components)) {
    if (typeof value !== 'number' || value < 0) {
      errors.push({
        code: 'ERR_PROD_STDCOST_NEGATIVE',
        message: `Cost component ${component} must be a non-negative number`,
        field: 'std_cost_components',
        value: { component, value }
      })
    }
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Validate effective dates
 */
export function validateEffectiveDates(effectiveFrom?: string, effectiveTo?: string): ValidationResult {
  const errors: ProductValidationError[] = []
  
  if (effectiveFrom && effectiveTo) {
    const fromDate = new Date(effectiveFrom)
    const toDate = new Date(effectiveTo)
    
    if (fromDate >= toDate) {
      errors.push({
        code: 'ERR_PROD_INVALID_DATE_RANGE',
        message: 'Effective to date must be after effective from date',
        field: 'effective_dates',
        value: { effectiveFrom, effectiveTo }
      })
    }
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Validate BOM component
 */
export function validateBOMComponent(component: { component_id: string; qty_per: number; scrap_pct?: number }): ValidationResult {
  const errors: ProductValidationError[] = []
  
  if (!component.component_id) {
    errors.push({
      code: 'ERR_BOM_COMPONENT_ID_REQUIRED',
      message: 'Component ID is required',
      field: 'component_id'
    })
  }
  
  if (typeof component.qty_per !== 'number' || component.qty_per <= 0) {
    errors.push({
      code: 'ERR_BOM_QTY_INVALID',
      message: 'Quantity per must be a positive number',
      field: 'qty_per',
      value: component.qty_per
    })
  }
  
  if (component.scrap_pct !== undefined && (typeof component.scrap_pct !== 'number' || component.scrap_pct < 0 || component.scrap_pct > 1)) {
    errors.push({
      code: 'ERR_BOM_SCRAP_INVALID',
      message: 'Scrap percentage must be between 0 and 1',
      field: 'scrap_pct',
      value: component.scrap_pct
    })
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Validate routing activity
 */
export function validateRoutingActivity(activity: { activity_id: string; std_hours: number }): ValidationResult {
  const errors: ProductValidationError[] = []
  
  if (!activity.activity_id) {
    errors.push({
      code: 'ERR_ROUTING_ACTIVITY_ID_REQUIRED',
      message: 'Activity ID is required',
      field: 'activity_id'
    })
  }
  
  if (typeof activity.std_hours !== 'number' || activity.std_hours < 0) {
    errors.push({
      code: 'ERR_ROUTING_HOURS_INVALID',
      message: 'Standard hours must be a non-negative number',
      field: 'std_hours',
      value: activity.std_hours
    })
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Validate smart code format
 */
export function validateSmartCode(smartCode: string): ValidationResult {
  const errors: ProductValidationError[] = []
  const smartCodeRegex = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/
  
  if (!smartCodeRegex.test(smartCode)) {
    errors.push({
      code: 'ERR_PROD_INVALID_SMART_CODE',
      message: 'Smart code format is invalid',
      field: 'smart_code',
      value: smartCode
    })
  }
  
  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Business Logic Functions
// ============================================================================

/**
 * Calculate total standard cost from components
 */
export function calculateTotalStandardCost(components: StandardCostComponents): number {
  return (components.material || 0) + 
         (components.labor || 0) + 
         (components.overhead || 0) + 
         (components.subcontract || 0) + 
         (components.freight || 0) + 
         (components.other || 0)
}

/**
 * Calculate extended BOM cost
 */
export function calculateBOMExtendedCost(components: BOMComponent[]): number {
  return components.reduce((total, component) => {
    const extendedQty = component.qty_per * (1 + (component.scrap_pct || 0))
    const extendedCost = extendedQty * (component.cost_per_unit || 0)
    return total + extendedCost
  }, 0)
}

/**
 * Calculate routing extended cost
 */
export function calculateRoutingExtendedCost(activities: RoutingActivity[]): number {
  return activities.reduce((total, activity) => {
    const extendedCost = activity.std_hours * activity.rate_per_hour
    return total + extendedCost
  }, 0)
}

/**
 * Check if product requires standard cost version
 */
export function requiresStandardCostVersion(productType: string): boolean {
  return productType === 'FINISHED' || productType === 'SEMI'
}

/**
 * Check for BOM cycles
 */
export function detectBOMCycle(
  productId: string, 
  bomMap: Map<string, string[]>, 
  visited = new Set<string>(), 
  recursionStack = new Set<string>()
): boolean {
  if (recursionStack.has(productId)) {
    return true // Cycle detected
  }
  
  if (visited.has(productId)) {
    return false // Already processed this path
  }
  
  visited.add(productId)
  recursionStack.add(productId)
  
  const components = bomMap.get(productId) || []
  for (const componentId of components) {
    if (detectBOMCycle(componentId, bomMap, visited, recursionStack)) {
      return true
    }
  }
  
  recursionStack.delete(productId)
  return false
}

/**
 * Check for self-consumption in BOM
 */
export function hasSelfConsumption(productId: string, components: BOMComponent[]): boolean {
  return components.some(component => component.component_id === productId)
}

/**
 * Validate product is active for given date
 */
export function isProductValidForDate(product: Product, date: Date = new Date()): boolean {
  const dateStr = date.toISOString().split('T')[0]
  
  if (product.status !== 'ACTIVE') {
    return false
  }
  
  if (product.effective_from && dateStr < product.effective_from) {
    return false
  }
  
  if (product.effective_to && dateStr > product.effective_to) {
    return false
  }
  
  return true
}

// ============================================================================
// Standard Templates
// ============================================================================

export const STANDARD_PRODUCT_TEMPLATES = {
  salon: {
    product_types: {
      retail_product: {
        entity_name: 'Professional Hair Treatment',
        product_type: 'FINISHED' as const,
        uom: 'EA',
        std_cost_components: {
          material: 8.50,
          labor: 0.00,
          overhead: 0.85,
          freight: 0.65
        }
      },
      service: {
        entity_name: 'Hair Cut & Style',
        product_type: 'SERVICE' as const,
        uom: 'HR',
        std_cost_components: {
          material: 2.50,
          labor: 45.00,
          overhead: 8.50,
          freight: 0.00
        }
      }
    },
    activities: {
      stylist_labor: {
        entity_name: 'Stylist Labor',
        rate_per_hour: 45.00,
        cost_component: 'labor' as const
      }
    }
  },
  
  restaurant: {
    product_types: {
      menu_item: {
        entity_name: 'Signature Pasta Dish',
        product_type: 'FINISHED' as const,
        uom: 'EA',
        std_cost_components: {
          material: 12.50,
          labor: 8.00,
          overhead: 3.20,
          freight: 0.30
        }
      },
      ingredient: {
        entity_name: 'Premium Olive Oil',
        product_type: 'RAW' as const,
        uom: 'LT',
        std_cost_components: {
          material: 28.00,
          labor: 0.00,
          overhead: 1.40,
          freight: 2.60
        }
      }
    },
    activities: {
      kitchen_prep: {
        entity_name: 'Kitchen Preparation',
        rate_per_hour: 25.00,
        cost_component: 'labor' as const
      }
    }
  },
  
  manufacturing: {
    product_types: {
      finished_good: {
        entity_name: 'Precision Component A-1',
        product_type: 'FINISHED' as const,
        uom: 'EA',
        std_cost_components: {
          material: 45.60,
          labor: 23.40,
          overhead: 18.20,
          subcontract: 5.80
        }
      },
      semi_finished: {
        entity_name: 'Machined Casting',
        product_type: 'SEMI' as const,
        uom: 'EA',
        std_cost_components: {
          material: 32.10,
          labor: 15.30,
          overhead: 12.70,
          subcontract: 0.00
        }
      }
    },
    activities: {
      machining: {
        entity_name: 'CNC Machining',
        rate_per_hour: 85.00,
        cost_component: 'labor' as const
      },
      assembly: {
        entity_name: 'Manual Assembly',
        rate_per_hour: 35.00,
        cost_component: 'labor' as const
      }
    }
  }
}

// ============================================================================
// Error Codes
// ============================================================================

export const PRODUCT_COSTING_ERROR_CODES = {
  // Product validation errors
  ERR_PROD_CODE_REQUIRED: 'Product code is required',
  ERR_PROD_CODE_LENGTH: 'Product code length invalid',
  ERR_PROD_CODE_FORMAT: 'Product code format invalid',
  ERR_PROD_DUPLICATE_CODE: 'Duplicate product code',
  ERR_PROD_INVALID_TYPE: 'Invalid product type',
  ERR_PROD_STDCOST_REQUIRED: 'Standard cost required for finished goods',
  ERR_PROD_STDCOST_INVALID: 'Invalid standard cost components',
  ERR_PROD_STDCOST_MISSING_COMPONENT: 'Missing required cost component',
  ERR_PROD_STDCOST_NEGATIVE: 'Negative cost component',
  ERR_PROD_INVALID_DATE_RANGE: 'Invalid effective date range',
  ERR_PROD_NOT_FOUND: 'Product not found',
  ERR_PROD_INVALID_SMART_CODE: 'Invalid smart code format',
  
  // BOM validation errors
  ERR_BOM_COMPONENT_ID_REQUIRED: 'Component ID required',
  ERR_BOM_QTY_INVALID: 'Invalid quantity per',
  ERR_BOM_SCRAP_INVALID: 'Invalid scrap percentage',
  ERR_BOM_CYCLE: 'BOM cycle detected',
  ERR_BOM_SELF_CONSUMPTION: 'Self-consumption not allowed',
  
  // Routing validation errors
  ERR_ROUTING_ACTIVITY_ID_REQUIRED: 'Activity ID required',
  ERR_ROUTING_HOURS_INVALID: 'Invalid standard hours',
  ERR_ROUTING_NEGATIVE_VALUE: 'Negative value not allowed',
  
  // General errors
  ERR_PROD_CREATE_FAILED: 'Product creation failed',
  ERR_PROD_UPDATE_FAILED: 'Product update failed',
  ERR_PROD_ARCHIVE_FAILED: 'Product archive failed',
  ERR_PROD_IN_USE: 'Product in use, cannot archive',
  ERR_PROD_GUARDRAILS_FAILED: 'Guardrails validation failed'
} as const

export default {
  PRODUCT_COSTING_SMART_CODES,
  STANDARD_PRODUCT_TEMPLATES,
  PRODUCT_COSTING_ERROR_CODES,
  validateProductCode,
  validateProductType,
  validateStandardCostComponents,
  validateEffectiveDates,
  validateBOMComponent,
  validateRoutingActivity,
  validateSmartCode,
  calculateTotalStandardCost,
  calculateBOMExtendedCost,
  calculateRoutingExtendedCost,
  requiresStandardCostVersion,
  detectBOMCycle,
  hasSelfConsumption,
  isProductValidForDate
}