/**
 * Production Data Loading Pattern - HERA DNA Component
 *
 * Provides standardized data loading for production modules across all industries.
 * Eliminates repetitive data loading code and ensures consistent patterns.
 *
 * Usage:
 * const production = useProductionData(organizationId)
 *
 * Acceleration: 50x (eliminates 90% of data loading boilerplate)
 */

import {
  useUniversalData,
  universalFilters,
  universalSorters
} from './universal-api-loading-pattern'

export interface ProductionStats {
  activeOrders: number
  plannedQuantity: number
  completedToday: number
  workCenterUtilization: number
}

export interface ProductionProgress {
  completedQty: number
  totalQty: number
  progress: number
  activeOperation?: any
}

export interface ProductionData {
  // Core data
  productionOrders: any[]
  workCenters: any[]
  products: any[]
  rawMaterials: any[]
  transactionLines: any[]
  relationships: any[]
  statusEntities: any[]

  // Loading states
  ordersLoading: boolean
  centersLoading: boolean

  // Computed data
  stats: ProductionStats
  activeOrders: any[]

  // Helper functions
  getOrderStatus: (orderId: string) => string
  getOrderProgress: (orderId: string, orderAmount: number) => ProductionProgress
  getWorkCenterOrder: (workCenterId: string) => any | null
}

/**
 * Universal Production Data Hook
 *
 * Loads all production-related data using consistent patterns.
 * Returns computed statistics and helper functions.
 */
export function useProductionData(organizationId: string): ProductionData {
  // Load production orders
  const { data: productionOrders = [], loading: ordersLoading } = useUniversalData({
    table: 'universal_transactions',
    filter: t =>
      t.transaction_type === 'production_order' && t.smart_code?.includes('HERA.MFG.PROD'),
    sort: universalSorters.byCreatedDesc,
    organizationId,
    enabled: !!organizationId
  })

  // Load work centers
  const { data: workCenters = [], loading: centersLoading } = useUniversalData({
    table: 'core_entities',
    filter: universalFilters.byEntityType('work_center'),
    organizationId,
    enabled: !!organizationId
  })

  // Load products
  const { data: products = [] } = useUniversalData({
    table: 'core_entities',
    filter: universalFilters.byEntityType('product'),
    organizationId,
    enabled: !!organizationId
  })

  // Load raw materials
  const { data: rawMaterials = [] } = useUniversalData({
    table: 'core_entities',
    filter: universalFilters.byEntityType('raw_material'),
    organizationId,
    enabled: !!organizationId
  })

  // Load transaction lines for progress tracking
  const { data: transactionLines = [] } = useUniversalData({
    table: 'universal_transaction_lines',
    organizationId,
    enabled: !!organizationId
  })

  // Load relationships for status tracking
  const { data: relationships = [] } = useUniversalData({
    table: 'core_relationships',
    filter: r => r.relationship_type === 'has_status',
    organizationId,
    enabled: !!organizationId
  })

  // Load status entities
  const { data: statusEntities = [] } = useUniversalData({
    table: 'core_entities',
    filter: universalFilters.byEntityType('workflow_status'),
    organizationId,
    enabled: !!organizationId
  })

  // Helper function to get order status
  const getOrderStatus = (orderId: string): string => {
    const statusRel = relationships.find(r => r.from_entity_id === orderId)
    const status = statusRel ? statusEntities.find(s => s.id === statusRel.to_entity_id) : null
    return status?.entity_code || 'STATUS-PLANNED'
  }

  // Helper function to calculate production progress
  const getOrderProgress = (orderId: string, orderAmount: number): ProductionProgress => {
    const orderLines = transactionLines.filter(l => l.transaction_id === orderId)
    const completedQty = orderLines.reduce(
      (sum, line) => sum + ((line.metadata as any)?.completed_quantity || 0),
      0
    )
    const progress = orderAmount ? (completedQty / orderAmount) * 100 : 0
    const activeOperation = orderLines.find(l => (l.metadata as any)?.status === 'in_progress')

    return {
      completedQty,
      totalQty: orderAmount,
      progress: Math.round(progress),
      activeOperation
    }
  }

  // Helper function to get active order for work center
  const getWorkCenterOrder = (workCenterId: string): any | null => {
    const activeOrders = productionOrders.filter(order => {
      const statusCode = getOrderStatus(order.id)
      return statusCode === 'STATUS-IN_PROGRESS'
    })

    return activeOrders.find(order => order.target_entity_id === workCenterId) || null
  }

  // Calculate active orders
  const activeOrders = productionOrders.filter(order => {
    const statusCode = getOrderStatus(order.id)
    return statusCode === 'STATUS-IN_PROGRESS'
  })

  // Calculate production statistics
  const stats: ProductionStats = {
    activeOrders: activeOrders.length,

    plannedQuantity: productionOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),

    completedToday: productionOrders.filter(o => {
      const completedDate = new Date((o.metadata as any)?.completed_date || '')
      const today = new Date()
      return completedDate.toDateString() === today.toDateString()
    }).length,

    workCenterUtilization:
      workCenters.length > 0 ? Math.round((activeOrders.length / workCenters.length) * 100) : 0
  }

  return {
    // Core data
    productionOrders,
    workCenters,
    products,
    rawMaterials,
    transactionLines,
    relationships,
    statusEntities,

    // Loading states
    ordersLoading,
    centersLoading,

    // Computed data
    stats,
    activeOrders,

    // Helper functions
    getOrderStatus,
    getOrderProgress,
    getWorkCenterOrder
  }
}

/**
 * Production Smart Codes - Standard patterns for all industries
 */
export const PRODUCTION_SMART_CODES = {
  // Production Orders
  PRODUCTION_ORDER: 'HERA.MFG.PROD.ORDER.V1',
  PRODUCTION_BATCH: 'HERA.MFG.PROD.BATCH.V1',

  // Work Centers (Industry-agnostic)
  WORKCENTER_CUTTING: 'HERA.MFG.WORKCENTER.CUTTING.V1',
  WORKCENTER_ASSEMBLY: 'HERA.MFG.WORKCENTER.ASSEMBLY.V1',
  WORKCENTER_FINISHING: 'HERA.MFG.WORKCENTER.FINISHING.V1',
  WORKCENTER_MIXING: 'HERA.MFG.WORKCENTER.MIXING.V1',
  WORKCENTER_PACKAGING: 'HERA.MFG.WORKCENTER.PACKAGING.V1',
  WORKCENTER_TESTING: 'HERA.MFG.WORKCENTER.TESTING.V1',

  // Materials
  MATERIAL_WOOD: 'HERA.MFG.MATERIAL.WOOD.V1',
  MATERIAL_METAL: 'HERA.MFG.MATERIAL.METAL.V1',
  MATERIAL_FABRIC: 'HERA.MFG.MATERIAL.FABRIC.V1',
  MATERIAL_CHEMICAL: 'HERA.MFG.MATERIAL.CHEMICAL.V1',
  MATERIAL_HARDWARE: 'HERA.MFG.MATERIAL.HARDWARE.V1',
  MATERIAL_PACKAGING: 'HERA.MFG.MATERIAL.PACKAGING.V1',

  // Operations
  OPERATION_EXEC: 'HERA.MFG.EXEC.OPERATION.V1',
  MACHINE_LOG: 'HERA.MFG.MACHINE.LOG.V1',
  QUALITY_CHECK: 'HERA.MFG.QUALITY.CHECK.V1',

  // BOM & Routing
  BOM_COMPONENT: 'HERA.MFG.BOM.COMPONENT.V1',
  ROUTING_STEP: 'HERA.MFG.ROUTING.STEP.V1',

  // Status Management
  STATUS_WORKFLOW: 'HERA.MFG.PROD.STATUS.V1',

  // Material Requisition
  MATERIAL_REQ: 'HERA.MFG.MATERIAL.REQ.V1',
  MATERIAL_ISSUE: 'HERA.MFG.MATERIAL.ISSUE.V1'
} as const

/**
 * Standard Production Entity Types
 */
export const PRODUCTION_ENTITY_TYPES = {
  WORK_CENTER: 'work_center',
  PRODUCT: 'product',
  RAW_MATERIAL: 'raw_material',
  RECIPE: 'recipe',
  WORKFLOW_STATUS: 'workflow_status',
  BOM: 'bill_of_materials',
  ROUTING: 'routing'
} as const

/**
 * Standard Production Transaction Types
 */
export const PRODUCTION_TRANSACTION_TYPES = {
  PRODUCTION_ORDER: 'production_order',
  PRODUCTION_BATCH: 'production_batch',
  MACHINE_LOG: 'machine_log',
  MATERIAL_REQUISITION: 'material_requisition',
  MATERIAL_ISSUE: 'material_issue',
  QUALITY_INSPECTION: 'quality_inspection',
  MAINTENANCE_LOG: 'maintenance_log'
} as const

/**
 * Industry-Specific Configuration Templates
 */
export const PRODUCTION_INDUSTRY_CONFIGS = {
  FURNITURE: {
    workCenterTypes: ['cutting', 'assembly', 'finishing', 'quality_check'],
    materialTypes: ['wood', 'fabric', 'hardware', 'finish'],
    operationSequence: ['cutting', 'preparation', 'assembly', 'finishing', 'quality_check'],
    smartCodePrefix: 'FURNITURE',
    batchRequired: false,
    serialTracking: true
  },

  FOOD: {
    workCenterTypes: ['mixing', 'cooking', 'cooling', 'packaging'],
    materialTypes: ['ingredient', 'packaging_material', 'additive'],
    operationSequence: ['preparation', 'mixing', 'cooking', 'cooling', 'packaging'],
    smartCodePrefix: 'FOOD',
    batchRequired: true,
    expiryTracking: true,
    temperatureControl: true
  },

  PHARMACEUTICAL: {
    workCenterTypes: ['mixing', 'tablet_press', 'coating', 'packaging'],
    materialTypes: ['api', 'excipient', 'packaging_material'],
    operationSequence: ['weighing', 'mixing', 'compression', 'coating', 'packaging'],
    smartCodePrefix: 'PHARMA',
    batchRequired: true,
    serialTracking: true,
    complianceRequired: true
  },

  AUTOMOTIVE: {
    workCenterTypes: ['stamping', 'welding', 'painting', 'assembly'],
    materialTypes: ['metal', 'plastic', 'rubber', 'electronic'],
    operationSequence: ['stamping', 'welding', 'painting', 'assembly', 'testing'],
    smartCodePrefix: 'AUTO',
    batchRequired: false,
    serialTracking: true,
    qualityRequired: true
  },

  TEXTILE: {
    workCenterTypes: ['weaving', 'dyeing', 'printing', 'cutting', 'sewing'],
    materialTypes: ['yarn', 'fabric', 'dye', 'chemical'],
    operationSequence: ['weaving', 'dyeing', 'printing', 'cutting', 'sewing'],
    smartCodePrefix: 'TEXTILE',
    batchRequired: true,
    colorTracking: true
  }
} as const

/**
 * Production Status Workflow - Standard across all industries
 */
export const PRODUCTION_STATUS_WORKFLOW = [
  { code: 'STATUS-PLANNED', name: 'Planned', color: 'gray' },
  { code: 'STATUS-RELEASED', name: 'Released', color: 'blue' },
  { code: 'STATUS-IN_PROGRESS', name: 'In Progress', color: 'yellow' },
  { code: 'STATUS-COMPLETED', name: 'Completed', color: 'green' },
  { code: 'STATUS-CANCELLED', name: 'Cancelled', color: 'red' },
  { code: 'STATUS-ON_HOLD', name: 'On Hold', color: 'orange' }
] as const

/**
 * Work Center Status Types
 */
export const WORK_CENTER_STATUS = {
  ACTIVE: 'active',
  IDLE: 'idle',
  MAINTENANCE: 'maintenance',
  DOWN: 'down'
} as const

/**
 * Helper function to generate production transaction code
 */
export function generateProductionCode(
  type: 'order' | 'batch' | 'log',
  industryPrefix: string = 'MFG'
): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')

  const typeMap = {
    order: 'PRD',
    batch: 'BCH',
    log: 'LOG'
  }

  return `${typeMap[type]}-${industryPrefix}-${year}${month}${day}-${random}`
}

/**
 * Helper function to calculate work center utilization
 */
export function calculateWorkCenterUtilization(workCenters: any[], activeOrders: any[]): number {
  if (workCenters.length === 0) return 0

  const busyWorkCenters = workCenters.filter(wc =>
    activeOrders.some(order => order.target_entity_id === wc.id)
  ).length

  return Math.round((busyWorkCenters / workCenters.length) * 100)
}

/**
 * Helper function to get next operation in sequence
 */
export function getNextOperation(
  currentOperation: string,
  industryConfig: (typeof PRODUCTION_INDUSTRY_CONFIGS)[keyof typeof PRODUCTION_INDUSTRY_CONFIGS]
): string | null {
  const currentIndex = industryConfig.operationSequence.indexOf(currentOperation)
  if (currentIndex === -1 || currentIndex === industryConfig.operationSequence.length - 1) {
    return null
  }
  return industryConfig.operationSequence[currentIndex + 1]
}
