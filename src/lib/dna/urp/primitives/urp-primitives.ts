/**
 * Universal Report Pattern (URP) Primitives
 * Smart Code: HERA.DNA.URP.PRIMITIVES.v1
 * 
 * Core building blocks for all HERA reports
 */

import { universalApi } from '@/lib/universal-api'
import type {
  CoreEntities,
  CoreDynamicData,
  CoreRelationships,
  UniversalTransactions,
  UniversalTransactionLines
} from '@/types/hera-database.types'

export interface URPContext {
  organizationId: string
  smartCodePrefix?: string
  cacheEnabled?: boolean
  cacheTTL?: number
}

export interface EntityResolverOptions {
  entityType?: string
  entityIds?: string[]
  smartCodePattern?: string
  includeDynamicData?: boolean
  includeDeleted?: boolean
  limit?: number
  offset?: number
}

export interface HierarchyBuilderOptions {
  entities: CoreEntities[]
  relationshipType: string
  maxDepth?: number
  rootEntityId?: string
  includeOrphans?: boolean
}

export interface TransactionFactsOptions {
  transactionType?: string
  smartCodePattern?: string
  dateFrom?: Date
  dateTo?: Date
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year'
  includeLines?: boolean
  aggregations?: ('sum' | 'avg' | 'min' | 'max' | 'count')[]
}

export interface DynamicJoinOptions {
  leftTable: string
  rightTable: string
  joinConditions: Array<{
    leftField: string
    rightField: string
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<='
  }>
  smartCodeMatch?: boolean
}

export interface RollupBalanceOptions {
  transactions: UniversalTransactions[]
  balanceType: 'running' | 'period' | 'cumulative'
  startDate?: Date
  openingBalance?: number
  groupBy?: string
}

export interface PresentationFormatOptions {
  data: any
  format: 'json' | 'table' | 'excel' | 'pdf' | 'csv'
  template?: string
  locale?: string
  currency?: string
  customFormatters?: Record<string, (value: any) => string>
}

/**
 * Entity Resolver - Primitive 1
 * Fetches entities with all related dynamic data
 */
export class EntityResolver {
  constructor(private context: URPContext) {}

  async resolve(options: EntityResolverOptions): Promise<CoreEntities[]> {
    console.log('🔍 EntityResolver.resolve() called with options:', options)
    console.log('🔧 Setting organization ID:', this.context.organizationId)
    
    universalApi.setOrganizationId(this.context.organizationId)
    
    console.log('🚀 Fetching entities from core_entities table...')
    
    // Fetch entities using the read method
    const result = await universalApi.read({ table: 'core_entities' })
    
    console.log('📊 Universal API read result:')
    console.log('- Data type:', typeof result?.data)
    console.log('- Data is array:', Array.isArray(result?.data))
    console.log('- Data length:', result?.data?.length || 'N/A')
    console.log('- Error:', result?.error)
    
    let entities = result?.data || []
    console.log('🔢 Total entities retrieved:', entities.length)
    
    // Apply filters
    if (options.entityType) {
      console.log('🔍 Filtering by entity type:', options.entityType)
      const beforeCount = entities.length
      entities = entities.filter(e => e.entity_type === options.entityType)
      console.log(`📊 Filtered from ${beforeCount} to ${entities.length} entities`)
      
      if (entities.length > 0) {
        console.log('📋 Sample filtered entity:', {
          id: entities[0].id,
          entity_code: entities[0].entity_code,
          entity_name: entities[0].entity_name,
          entity_type: entities[0].entity_type
        })
      }
    }
    
    if (options.entityIds?.length) {
      entities = entities.filter(e => options.entityIds!.includes(e.id))
    }
    
    if (options.smartCodePattern) {
      const pattern = new RegExp(options.smartCodePattern.replace('*', '.*'))
      entities = entities.filter(e => e.smart_code && pattern.test(e.smart_code))
    }
    
    if (!options.includeDeleted) {
      entities = entities.filter(e => e.status !== 'deleted')
    }
    
    // Add dynamic data if requested
    if (options.includeDynamicData && entities.length > 0) {
      const dynamicDataResult = await universalApi.read({ table: 'core_dynamic_data' })
      const dynamicData = dynamicDataResult?.data || []
      const entityIds = entities.map(e => e.id)
      const relevantData = dynamicData.filter(d => entityIds.includes(d.entity_id))
      
      // Attach dynamic data to entities
      entities = entities.map(entity => ({
        ...entity,
        dynamicData: relevantData.filter(d => d.entity_id === entity.id)
      }))
    }
    
    // Apply pagination
    if (options.offset !== undefined || options.limit !== undefined) {
      const start = options.offset || 0
      const end = options.limit ? start + options.limit : undefined
      entities = entities.slice(start, end)
    }
    
    return entities
  }
}

/**
 * Hierarchy Builder - Primitive 2
 * Constructs hierarchical structures from relationships
 */
export class HierarchyBuilder {
  constructor(private context: URPContext) {}

  async build(options: HierarchyBuilderOptions): Promise<any> {
    universalApi.setOrganizationId(this.context.organizationId)
    
    const relResult = await universalApi.read({ table: 'core_relationships' })
    const relationships = relResult?.data || []
    const relevantRels = relationships.filter(r => 
      r.relationship_type === options.relationshipType &&
      r.organization_id === this.context.organizationId
    )
    
    // Build adjacency map
    const childrenMap = new Map<string, string[]>()
    const parentMap = new Map<string, string>()
    
    relevantRels.forEach(rel => {
      if (!childrenMap.has(rel.from_entity_id)) {
        childrenMap.set(rel.from_entity_id, [])
      }
      childrenMap.get(rel.from_entity_id)!.push(rel.to_entity_id)
      parentMap.set(rel.to_entity_id, rel.from_entity_id)
    })
    
    // Build hierarchy recursively
    const buildNode = (entityId: string, depth: number = 0): any => {
      if (options.maxDepth && depth >= options.maxDepth) {
        return null
      }
      
      const entity = options.entities.find(e => e.id === entityId)
      if (!entity) return null
      
      const children = childrenMap.get(entityId) || []
      
      return {
        ...entity,
        level: depth,
        children: children
          .map(childId => buildNode(childId, depth + 1))
          .filter(Boolean)
      }
    }
    
    // Find root entities
    let rootEntities: CoreEntities[] = []
    
    if (options.rootEntityId) {
      const root = options.entities.find(e => e.id === options.rootEntityId)
      if (root) rootEntities = [root]
    } else {
      // Find entities without parents
      rootEntities = options.entities.filter(e => !parentMap.has(e.id))
    }
    
    const hierarchy = rootEntities.map(e => buildNode(e.id))
    
    // Include orphans if requested
    if (options.includeOrphans) {
      const includedIds = new Set<string>()
      const collectIds = (node: any) => {
        if (node) {
          includedIds.add(node.id)
          node.children?.forEach(collectIds)
        }
      }
      hierarchy.forEach(collectIds)
      
      const orphans = options.entities.filter(e => !includedIds.has(e.id))
      hierarchy.push(...orphans.map(e => ({ ...e, level: 0, children: [] })))
    }
    
    return hierarchy
  }
}

/**
 * Transaction Facts - Primitive 3
 * Aggregates transaction data
 */
export class TransactionFacts {
  constructor(private context: URPContext) {}

  async aggregate(options: TransactionFactsOptions): Promise<any> {
    universalApi.setOrganizationId(this.context.organizationId)
    
    // Fetch transactions
    const txnResult = await universalApi.read({ table: 'universal_transactions' })
    let transactions = txnResult?.data || []
    
    // Apply filters
    if (options.transactionType) {
      transactions = transactions.filter(t => t.transaction_type === options.transactionType)
    }
    
    if (options.smartCodePattern) {
      const pattern = new RegExp(options.smartCodePattern.replace('*', '.*'))
      transactions = transactions.filter(t => t.smart_code && pattern.test(t.smart_code))
    }
    
    if (options.dateFrom || options.dateTo) {
      transactions = transactions.filter(t => {
        const txnDate = new Date(t.transaction_date)
        if (options.dateFrom && txnDate < options.dateFrom) return false
        if (options.dateTo && txnDate > options.dateTo) return false
        return true
      })
    }
    
    // Group transactions
    const groups = new Map<string, UniversalTransactions[]>()
    
    transactions.forEach(txn => {
      let groupKey: string
      
      if (options.groupBy) {
        const date = new Date(txn.transaction_date)
        switch (options.groupBy) {
          case 'day':
            groupKey = date.toISOString().split('T')[0]
            break
          case 'week':
            const weekStart = new Date(date)
            weekStart.setDate(date.getDate() - date.getDay())
            groupKey = weekStart.toISOString().split('T')[0]
            break
          case 'month':
            groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            break
          case 'quarter':
            groupKey = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`
            break
          case 'year':
            groupKey = String(date.getFullYear())
            break
          default:
            groupKey = 'all'
        }
      } else {
        groupKey = 'all'
      }
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(txn)
    })
    
    // Calculate aggregations
    const results: any[] = []
    
    for (const [groupKey, groupTxns] of groups) {
      const result: any = {
        group: groupKey,
        transactions: groupTxns.length
      }
      
      if (options.aggregations?.includes('sum')) {
        result.totalAmount = groupTxns.reduce((sum, t) => sum + (t.total_amount || 0), 0)
      }
      
      if (options.aggregations?.includes('avg')) {
        result.avgAmount = result.totalAmount / groupTxns.length
      }
      
      if (options.aggregations?.includes('min')) {
        result.minAmount = Math.min(...groupTxns.map(t => t.total_amount || 0))
      }
      
      if (options.aggregations?.includes('max')) {
        result.maxAmount = Math.max(...groupTxns.map(t => t.total_amount || 0))
      }
      
      if (options.aggregations?.includes('count')) {
        result.count = groupTxns.length
      }
      
      // Include line items if requested
      if (options.includeLines) {
        result.lineItems = await this.fetchLineItems(groupTxns.map(t => t.id))
      }
      
      results.push(result)
    }
    
    return results
  }
  
  private async fetchLineItems(transactionIds: string[]): Promise<UniversalTransactionLines[]> {
    const linesResult = await universalApi.read({ table: 'universal_transaction_lines' })
    const allLines = linesResult?.data || []
    return allLines.filter(line => transactionIds.includes(line.transaction_id))
  }
}

/**
 * Dynamic Join - Primitive 4
 * Joins data across tables without SQL
 */
export class DynamicJoin {
  constructor(private context: URPContext) {}

  async join(options: DynamicJoinOptions): Promise<any[]> {
    universalApi.setOrganizationId(this.context.organizationId)
    
    // Fetch data from both tables
    const leftData = await this.fetchTableData(options.leftTable)
    const rightData = await this.fetchTableData(options.rightTable)
    
    // Perform join
    const results: any[] = []
    
    leftData.forEach(leftRow => {
      const matches = rightData.filter(rightRow => {
        return options.joinConditions.every(condition => {
          const leftValue = this.getFieldValue(leftRow, condition.leftField)
          const rightValue = this.getFieldValue(rightRow, condition.rightField)
          
          switch (condition.operator || '=') {
            case '=': return leftValue === rightValue
            case '!=': return leftValue !== rightValue
            case '>': return leftValue > rightValue
            case '<': return leftValue < rightValue
            case '>=': return leftValue >= rightValue
            case '<=': return leftValue <= rightValue
            default: return false
          }
        })
      })
      
      matches.forEach(rightRow => {
        results.push({
          ...leftRow,
          joined: rightRow
        })
      })
    })
    
    // Smart code matching if enabled
    if (options.smartCodeMatch) {
      return results.filter(row => {
        const leftCode = row.smart_code
        const rightCode = row.joined?.smart_code
        if (!leftCode || !rightCode) return false
        
        // Match smart code prefixes
        const leftPrefix = leftCode.split('.').slice(0, 3).join('.')
        const rightPrefix = rightCode.split('.').slice(0, 3).join('.')
        return leftPrefix === rightPrefix
      })
    }
    
    return results
  }
  
  private async fetchTableData(tableName: string): Promise<any[]> {
    const result = await universalApi.read({ table: tableName })
    return result?.data || []
  }
  
  private getFieldValue(row: any, field: string): any {
    // Handle nested fields (e.g., metadata.field)
    const parts = field.split('.')
    let value = row
    
    for (const part of parts) {
      value = value?.[part]
    }
    
    return value
  }
}

/**
 * Rollup & Balance - Primitive 5
 * Calculates running balances and totals
 */
export class RollupBalance {
  constructor(private context: URPContext) {}

  calculate(options: RollupBalanceOptions): any[] {
    const { transactions, balanceType, startDate, openingBalance = 0, groupBy } = options
    
    // Sort transactions by date
    const sorted = [...transactions].sort((a, b) => 
      new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
    )
    
    // Filter by start date if provided
    const filtered = startDate 
      ? sorted.filter(t => new Date(t.transaction_date) >= startDate)
      : sorted
    
    const results: any[] = []
    let runningBalance = openingBalance
    const periodBalances = new Map<string, number>()
    
    filtered.forEach((txn, index) => {
      const amount = txn.total_amount || 0
      
      let balance: number
      switch (balanceType) {
        case 'running':
          runningBalance += amount
          balance = runningBalance
          break
          
        case 'period':
          const periodKey = groupBy ? this.getPeriodKey(txn.transaction_date, groupBy) : 'all'
          const currentPeriodBalance = periodBalances.get(periodKey) || 0
          periodBalances.set(periodKey, currentPeriodBalance + amount)
          balance = periodBalances.get(periodKey)!
          break
          
        case 'cumulative':
          balance = filtered.slice(0, index + 1).reduce((sum, t) => sum + (t.total_amount || 0), openingBalance)
          break
          
        default:
          balance = amount
      }
      
      results.push({
        ...txn,
        balance,
        balanceType,
        periodKey: groupBy ? this.getPeriodKey(txn.transaction_date, groupBy) : undefined
      })
    })
    
    return results
  }
  
  private getPeriodKey(date: string, groupBy: string): string {
    const d = new Date(date)
    
    switch (groupBy) {
      case 'day': return d.toISOString().split('T')[0]
      case 'month': return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      case 'year': return String(d.getFullYear())
      default: return 'all'
    }
  }
}

/**
 * Presentation Formatter - Primitive 6
 * Formats data for output
 */
export class PresentationFormatter {
  constructor(private context: URPContext) {}

  format(options: PresentationFormatOptions): any {
    const { data, format, locale = 'en-US', currency = 'USD', customFormatters = {} } = options
    
    switch (format) {
      case 'json':
        return this.formatJSON(data, customFormatters)
        
      case 'table':
        return this.formatTable(data, locale, currency, customFormatters)
        
      case 'csv':
        return this.formatCSV(data, customFormatters)
        
      case 'excel':
        return this.formatExcel(data, locale, currency, customFormatters)
        
      case 'pdf':
        return this.formatPDF(data, locale, currency, options.template)
        
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }
  
  private formatJSON(data: any, formatters: Record<string, Function>): any {
    const applyFormatters = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(applyFormatters)
      }
      
      if (obj && typeof obj === 'object') {
        const formatted: any = {}
        
        for (const [key, value] of Object.entries(obj)) {
          if (formatters[key]) {
            formatted[key] = formatters[key](value)
          } else {
            formatted[key] = applyFormatters(value)
          }
        }
        
        return formatted
      }
      
      return obj
    }
    
    return applyFormatters(data)
  }
  
  private formatTable(data: any[], locale: string, currency: string, formatters: Record<string, Function>): any {
    if (!Array.isArray(data) || data.length === 0) return { headers: [], rows: [] }
    
    // Extract headers
    const headers = Object.keys(data[0])
    
    // Format rows
    const rows = data.map(row => {
      return headers.map(header => {
        let value = row[header]
        
        // Apply custom formatter if available
        if (formatters[header]) {
          value = formatters[header](value)
        } else if (typeof value === 'number') {
          // Auto-format numbers
          if (header.toLowerCase().includes('amount') || header.toLowerCase().includes('balance')) {
            value = new Intl.NumberFormat(locale, {
              style: 'currency',
              currency
            }).format(value)
          } else {
            value = new Intl.NumberFormat(locale).format(value)
          }
        } else if (value instanceof Date) {
          value = new Intl.DateTimeFormat(locale).format(value)
        }
        
        return value
      })
    })
    
    return { headers, rows }
  }
  
  private formatCSV(data: any[], formatters: Record<string, Function>): string {
    const { headers, rows } = this.formatTable(data, 'en-US', 'USD', formatters)
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    
    return csv
  }
  
  private formatExcel(data: any[], locale: string, currency: string, formatters: Record<string, Function>): any {
    // This would integrate with a library like ExcelJS
    // For now, return structured data
    return {
      worksheets: [{
        name: 'Report',
        data: this.formatTable(data, locale, currency, formatters)
      }]
    }
  }
  
  private formatPDF(data: any, locale: string, currency: string, template?: string): any {
    // This would integrate with a PDF generation library
    // For now, return structured data
    return {
      template: template || 'default',
      locale,
      currency,
      data
    }
  }
}