/**
 * HERA Universal Tile System - Data Masking Service
 * Smart Code: HERA.SECURITY.DATA.MASKING.v1
 * 
 * Field-level security and data masking for sensitive information
 */

export interface MaskingRule {
  fieldName: string
  maskingType: 'partial' | 'full' | 'hash' | 'aggregate' | 'none'
  roles: string[]
  conditions?: Array<{
    field: string
    operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains'
    value: any
  }>
}

export interface MaskingPolicy {
  organizationId: string
  dataType: string
  rules: MaskingRule[]
  defaultMask: 'none' | 'full'
  auditMasking: boolean
}

/**
 * Data Masking Service
 * Handles field-level security and data obfuscation
 */
export class DataMaskingService {
  private policies: Map<string, MaskingPolicy> = new Map()

  constructor() {
    this.initializeDefaultPolicies()
  }

  /**
   * Initialize default masking policies for financial data
   */
  private initializeDefaultPolicies(): void {
    // Financial data masking policy
    const financialPolicy: MaskingPolicy = {
      organizationId: '*', // Global policy
      dataType: 'financial',
      defaultMask: 'none',
      auditMasking: true,
      rules: [
        // Revenue data masking
        {
          fieldName: 'revenue_breakdown',
          maskingType: 'aggregate',
          roles: ['viewer'],
          conditions: [
            { field: 'data_classification', operator: '=', value: 'detailed' }
          ]
        },
        {
          fieldName: 'individual_transactions',
          maskingType: 'full',
          roles: ['viewer', 'analyst']
        },
        {
          fieldName: 'customer_specific_data',
          maskingType: 'full',
          roles: ['viewer', 'analyst', 'auditor']
        },
        {
          fieldName: 'customer_names',
          maskingType: 'partial',
          roles: ['auditor']
        },
        
        // KPI data masking
        {
          fieldName: 'target_details',
          maskingType: 'full',
          roles: ['viewer']
        },
        {
          fieldName: 'comparative_data',
          maskingType: 'aggregate',
          roles: ['viewer']
        },
        
        // Cash flow masking
        {
          fieldName: 'detailed_cash_flows',
          maskingType: 'aggregate',
          roles: ['viewer']
        },
        {
          fieldName: 'bank_account_details',
          maskingType: 'full',
          roles: ['viewer', 'analyst', 'auditor']
        },
        
        // Personal identifiable information
        {
          fieldName: 'personal_data',
          maskingType: 'full',
          roles: ['auditor']
        },
        {
          fieldName: 'email_addresses',
          maskingType: 'partial',
          roles: ['viewer', 'analyst']
        },
        {
          fieldName: 'phone_numbers',
          maskingType: 'partial',
          roles: ['viewer', 'analyst']
        }
      ]
    }

    this.policies.set('financial', financialPolicy)

    // Analytical data masking policy
    const analyticalPolicy: MaskingPolicy = {
      organizationId: '*',
      dataType: 'analytics',
      defaultMask: 'none',
      auditMasking: true,
      rules: [
        {
          fieldName: 'user_behavior_data',
          maskingType: 'hash',
          roles: ['viewer']
        },
        {
          fieldName: 'performance_metrics',
          maskingType: 'aggregate',
          roles: ['viewer']
        }
      ]
    }

    this.policies.set('analytics', analyticalPolicy)
  }

  /**
   * Apply masking to data based on user role and data type
   */
  public maskData<T extends Record<string, any>>(
    data: T,
    dataType: string,
    userRole: string,
    organizationId: string,
    additionalContext?: Record<string, any>
  ): T {
    const policy = this.getPolicy(dataType, organizationId)
    if (!policy) {
      return data // No masking policy found
    }

    const maskedData = { ...data }

    // Apply masking rules
    for (const rule of policy.rules) {
      if (this.shouldApplyRule(rule, userRole, maskedData, additionalContext)) {
        maskedData[rule.fieldName] = this.applyMasking(
          maskedData[rule.fieldName],
          rule.maskingType,
          rule.fieldName
        )
      }
    }

    return maskedData
  }

  /**
   * Apply masking to financial tile data
   */
  public maskFinancialTileData(
    tileData: any,
    tileType: 'revenue' | 'kpi' | 'cashflow',
    userRole: string,
    organizationId: string
  ): any {
    if (!tileData) return tileData

    const maskedData = { ...tileData }

    switch (tileType) {
      case 'revenue':
        maskedData = this.maskRevenueData(maskedData, userRole)
        break
      case 'kpi':
        maskedData = this.maskKPIData(maskedData, userRole)
        break
      case 'cashflow':
        maskedData = this.maskCashFlowData(maskedData, userRole)
        break
    }

    return this.maskData(maskedData, 'financial', userRole, organizationId)
  }

  /**
   * Mask revenue-specific data
   */
  private maskRevenueData(data: any, userRole: string): any {
    const masked = { ...data }

    switch (userRole) {
      case 'viewer':
        // Show aggregated data only
        if (masked.breakdown) {
          masked.breakdown = masked.breakdown.map((item: any) => ({
            ...item,
            value: this.aggregateValue(item.value),
            detail: '[Hidden]'
          }))
        }
        masked.detailedMetrics = '[Aggregated View Only]'
        break
        
      case 'analyst':
        // Hide customer-specific data
        if (masked.breakdown) {
          masked.breakdown = masked.breakdown.map((item: any) => ({
            ...item,
            customerData: '[Restricted]'
          }))
        }
        break
        
      case 'auditor':
        // Hide personal identifiable information
        if (masked.breakdown) {
          masked.breakdown = masked.breakdown.map((item: any) => ({
            ...item,
            customerName: this.maskString(item.customerName, 'partial'),
            contactInfo: '[Redacted for Audit]'
          }))
        }
        break
    }

    return masked
  }

  /**
   * Mask KPI-specific data
   */
  private maskKPIData(data: any, userRole: string): any {
    const masked = { ...data }

    if (userRole === 'viewer') {
      // Hide target details and comparative data
      delete masked.targetDetails
      delete masked.comparativeData
      delete masked.benchmarkData
      
      // Round values for privacy
      if (typeof masked.value === 'number') {
        masked.value = Math.round(masked.value * 10) / 10
      }
    }

    return masked
  }

  /**
   * Mask cash flow-specific data
   */
  private maskCashFlowData(data: any, userRole: string): any {
    const masked = { ...data }

    switch (userRole) {
      case 'viewer':
        // Show only high-level aggregates
        masked.detailedFlows = '[Aggregated View]'
        if (masked.operating) {
          masked.operating = this.aggregateCashFlowCategory(masked.operating)
        }
        if (masked.investing) {
          masked.investing = this.aggregateCashFlowCategory(masked.investing)
        }
        if (masked.financing) {
          masked.financing = this.aggregateCashFlowCategory(masked.financing)
        }
        break
        
      case 'analyst':
        // Hide bank account details
        delete masked.bankAccountDetails
        delete masked.accountNumbers
        break
        
      case 'auditor':
        // Show all financial data but hide personal info
        delete masked.personalAccountInfo
        break
    }

    return masked
  }

  /**
   * Check if a masking rule should be applied
   */
  private shouldApplyRule(
    rule: MaskingRule,
    userRole: string,
    data: Record<string, any>,
    additionalContext?: Record<string, any>
  ): boolean {
    // Check if role matches
    if (!rule.roles.includes(userRole)) {
      return false
    }

    // Check conditions if specified
    if (rule.conditions) {
      for (const condition of rule.conditions) {
        if (!this.evaluateCondition(condition, data, additionalContext)) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Evaluate a masking condition
   */
  private evaluateCondition(
    condition: { field: string; operator: string; value: any },
    data: Record<string, any>,
    additionalContext?: Record<string, any>
  ): boolean {
    const fieldValue = data[condition.field] || additionalContext?.[condition.field]
    
    switch (condition.operator) {
      case '=':
        return fieldValue === condition.value
      case '!=':
        return fieldValue !== condition.value
      case '>':
        return fieldValue > condition.value
      case '<':
        return fieldValue < condition.value
      case '>=':
        return fieldValue >= condition.value
      case '<=':
        return fieldValue <= condition.value
      case 'contains':
        return String(fieldValue).includes(String(condition.value))
      case 'not_contains':
        return !String(fieldValue).includes(String(condition.value))
      default:
        return false
    }
  }

  /**
   * Apply specific masking transformation
   */
  private applyMasking(value: any, maskingType: string, fieldName: string): any {
    if (value === null || value === undefined) {
      return value
    }

    switch (maskingType) {
      case 'full':
        return '[Restricted]'
      
      case 'partial':
        return this.maskString(String(value), 'partial')
      
      case 'hash':
        return this.hashValue(String(value))
      
      case 'aggregate':
        if (typeof value === 'number') {
          return this.aggregateValue(value)
        }
        return '[Aggregated]'
      
      case 'none':
      default:
        return value
    }
  }

  /**
   * Mask string with partial visibility
   */
  private maskString(str: string, type: 'partial' | 'email' | 'phone'): string {
    if (!str || str.length === 0) return str

    switch (type) {
      case 'partial':
        if (str.length <= 4) return '***'
        return str.charAt(0) + '*'.repeat(str.length - 2) + str.charAt(str.length - 1)
      
      case 'email':
        const [local, domain] = str.split('@')
        if (!domain) return this.maskString(str, 'partial')
        return this.maskString(local, 'partial') + '@' + domain
      
      case 'phone':
        return str.replace(/\d(?=\d{4})/g, '*')
      
      default:
        return this.maskString(str, 'partial')
    }
  }

  /**
   * Hash value for anonymization
   */
  private hashValue(value: string): string {
    // Simple hash function (in production, use crypto library)
    let hash = 0
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `#${Math.abs(hash).toString(16)}`
  }

  /**
   * Aggregate numeric value for privacy
   */
  private aggregateValue(value: number): number {
    // Round to nearest significant figures
    if (value > 1000000) {
      return Math.round(value / 100000) * 100000 // Round to 100k
    } else if (value > 100000) {
      return Math.round(value / 10000) * 10000 // Round to 10k
    } else if (value > 10000) {
      return Math.round(value / 1000) * 1000 // Round to 1k
    } else {
      return Math.round(value / 100) * 100 // Round to 100
    }
  }

  /**
   * Aggregate cash flow category data
   */
  private aggregateCashFlowCategory(category: any): any {
    if (!category) return category

    return {
      net: category.net ? this.aggregateValue(category.net) : 0,
      inflow: category.inflow ? this.aggregateValue(category.inflow) : '[Aggregated]',
      outflow: category.outflow ? this.aggregateValue(category.outflow) : '[Aggregated]',
      details: '[Summary View Only]'
    }
  }

  /**
   * Get masking policy for data type and organization
   */
  private getPolicy(dataType: string, organizationId: string): MaskingPolicy | undefined {
    // First try organization-specific policy
    const orgSpecificKey = `${dataType}_${organizationId}`
    if (this.policies.has(orgSpecificKey)) {
      return this.policies.get(orgSpecificKey)
    }

    // Fall back to global policy
    return this.policies.get(dataType)
  }

  /**
   * Add or update masking policy
   */
  public setPolicy(policy: MaskingPolicy): void {
    const key = policy.organizationId === '*' ? policy.dataType : `${policy.dataType}_${policy.organizationId}`
    this.policies.set(key, policy)
  }

  /**
   * Get field-level permissions for user role
   */
  public getFieldPermissions(
    dataType: string,
    userRole: string,
    organizationId: string
  ): Record<string, 'full' | 'masked' | 'hidden'> {
    const policy = this.getPolicy(dataType, organizationId)
    if (!policy) return {}

    const permissions: Record<string, 'full' | 'masked' | 'hidden'> = {}

    for (const rule of policy.rules) {
      if (rule.roles.includes(userRole)) {
        switch (rule.maskingType) {
          case 'full':
            permissions[rule.fieldName] = 'hidden'
            break
          case 'partial':
          case 'hash':
          case 'aggregate':
            permissions[rule.fieldName] = 'masked'
            break
          case 'none':
            permissions[rule.fieldName] = 'full'
            break
        }
      } else {
        permissions[rule.fieldName] = 'full'
      }
    }

    return permissions
  }
}

/**
 * Global data masking service instance
 */
export const globalDataMaskingService = new DataMaskingService()

/**
 * React Hook for Data Masking
 */
export function useDataMasking() {
  return {
    maskData: globalDataMaskingService.maskData.bind(globalDataMaskingService),
    maskFinancialTileData: globalDataMaskingService.maskFinancialTileData.bind(globalDataMaskingService),
    getFieldPermissions: globalDataMaskingService.getFieldPermissions.bind(globalDataMaskingService)
  }
}

export default DataMaskingService