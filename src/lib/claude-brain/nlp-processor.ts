/**
 * Claude Brain - Natural Language Processing Layer
 * Converts business language into structured HERA operations
 * 
 * Built on Master CRUD v2 for sub-100ms operation execution
 */

import {
  NLPProcessor,
  BusinessIntent,
  ExtractedEntity,
  SuggestedOperation,
  BusinessContext,
  IntentCategory,
  ActionType
} from '@/types/claude-brain.types'
import {
  CreateEntityCompleteRequest,
  UpdateEntityCompleteRequest,
  DeleteEntityCompleteRequest,
  QueryEntityCompleteRequest
} from '@/types/master-crud-v2.types'

/**
 * Business Language Patterns
 * Maps common business phrases to HERA operations
 */
const INTENT_PATTERNS = {
  // Entity Creation
  create: [
    /create|add|new|register|setup|establish/i,
    /make a new|add a new|create a new/i,
    /I need to add|I want to create|can you create/i
  ],
  
  // Entity Updates  
  update: [
    /update|change|modify|edit|revise|alter/i,
    /set the|change the|update the/i,
    /I need to update|I want to change|can you update/i
  ],
  
  // Entity Deletion
  delete: [
    /delete|remove|cancel|deactivate|archive/i,
    /get rid of|take out|eliminate/i,
    /I need to delete|I want to remove|can you delete/i
  ],
  
  // Entity Queries
  query: [
    /show|find|search|list|get|display|view/i,
    /what are|who are|where are|how many/i,
    /I need to see|I want to find|can you show me/i
  ],
  
  // Analytics & Reports
  analyze: [
    /analyze|report|summary|insights|trends|performance/i,
    /how is|what's the trend|performance of|compared to/i,
    /I need analytics|I want insights|can you analyze/i
  ],
  
  // Business Intelligence
  insight: [
    /recommend|suggest|optimize|improve|best|advice/i,
    /what should I|how can I improve|what's the best/i,
    /I need recommendations|I want suggestions|can you advise/i
  ]
}

/**
 * Entity Type Recognition
 * Maps business terms to HERA entity types
 */
const ENTITY_PATTERNS = {
  customer: [
    /customer|client|buyer|purchaser|consumer/i,
    /account|company|organization|business/i
  ],
  
  product: [
    /product|item|good|merchandise|inventory/i,
    /service|offering|solution/i
  ],
  
  order: [
    /order|purchase|transaction|sale|invoice/i,
    /quote|estimate|proposal/i
  ],
  
  employee: [
    /employee|staff|worker|team member|personnel/i,
    /user|person|individual/i
  ],
  
  lead: [
    /lead|prospect|potential customer|opportunity/i,
    /inquiry|interest|contact/i
  ],
  
  contact: [
    /contact|person|individual|representative/i,
    /phone|email|address/i
  ],
  
  appointment: [
    /appointment|meeting|booking|reservation/i,
    /schedule|calendar|event/i
  ],
  
  vendor: [
    /vendor|supplier|provider|partner/i,
    /contractor|freelancer|agency/i
  ]
}

/**
 * Business Field Recognition
 * Maps common business terms to dynamic data fields
 */
const FIELD_PATTERNS = {
  email: /email|e-mail|electronic mail/i,
  phone: /phone|telephone|mobile|cell|number/i,
  address: /address|location|street|city|state|zip/i,
  name: /name|title|label|called/i,
  price: /price|cost|amount|fee|rate|charge/i,
  quantity: /quantity|amount|count|number|qty/i,
  description: /description|details|info|information/i,
  status: /status|state|condition|situation/i,
  priority: /priority|importance|urgency|level/i,
  category: /category|type|kind|classification/i,
  industry: /industry|sector|vertical|business type/i,
  revenue: /revenue|income|sales|earnings/i,
  date: /date|time|when|schedule/i
}

/**
 * Smart Code Patterns
 * Maps business context to HERA smart codes
 */
const SMART_CODE_MAPPING = {
  'customer.retail': 'HERA.RETAIL.CUSTOMER.ENTITY.PROFILE.V1',
  'customer.crm': 'HERA.CRM.CUSTOMER.ENTITY.PROFILE.V1',
  'customer.b2b': 'HERA.CRM.ACCOUNT.ENTITY.CORPORATE.V1',
  
  'product.retail': 'HERA.RETAIL.PRODUCT.ENTITY.CATALOG.V1',
  'product.ecommerce': 'HERA.ECOM.PRODUCT.ENTITY.CATALOG.V1',
  'product.manufacturing': 'HERA.MFG.PRODUCT.ENTITY.BOM.V1',
  
  'order.pos': 'HERA.RETAIL.ORDER.TRANSACTION.POS.V1',
  'order.ecommerce': 'HERA.ECOM.ORDER.TRANSACTION.ONLINE.V1',
  'order.b2b': 'HERA.CRM.ORDER.TRANSACTION.B2B.V1',
  
  'lead.crm': 'HERA.CRM.LEAD.ENTITY.PROSPECT.V1',
  'lead.marketing': 'HERA.MKT.LEAD.ENTITY.CAMPAIGN.V1',
  
  'appointment.salon': 'HERA.SALON.APPOINTMENT.ENTITY.BOOKING.V1',
  'appointment.healthcare': 'HERA.HEALTH.APPOINTMENT.ENTITY.VISIT.V1'
}

/**
 * NLP Processor Implementation
 */
export class HeraNLPProcessor implements NLPProcessor {
  private confidenceThreshold = 0.7
  
  /**
   * Extract business intent from natural language
   */
  async extractIntent(query: string, context: BusinessContext): Promise<BusinessIntent> {
    const normalizedQuery = query.toLowerCase().trim()
    
    // Detect intent category
    const intentScores = this.scoreIntents(normalizedQuery)
    const topIntent = this.getTopIntent(intentScores)
    
    if (topIntent.confidence < this.confidenceThreshold) {
      return {
        category: 'query', // Default to query if unsure
        operation: 'general_query',
        confidence: topIntent.confidence,
        parameters: { query: normalizedQuery },
        requiresConfirmation: true
      }
    }
    
    // Extract operation parameters
    const parameters = await this.extractParameters(normalizedQuery, topIntent.category, context)
    
    return {
      category: topIntent.category,
      operation: this.mapToOperation(topIntent.category, parameters),
      confidence: topIntent.confidence,
      parameters,
      requiresConfirmation: this.shouldRequireConfirmation(topIntent.category, parameters)
    }
  }

  /**
   * Extract business entities from natural language
   */
  async extractEntities(query: string, context: BusinessContext): Promise<ExtractedEntity[]> {
    const entities: ExtractedEntity[] = []
    const normalizedQuery = query.toLowerCase()
    
    // Extract entity types
    for (const [entityType, patterns] of Object.entries(ENTITY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedQuery)) {
          entities.push({
            type: 'entity_type',
            value: entityType,
            confidence: 0.8,
            context: this.extractEntityContext(query, pattern),
            smartCode: this.generateSmartCode(entityType, context)
          })
        }
      }
    }
    
    // Extract field names and values
    for (const [fieldName, pattern] of Object.entries(FIELD_PATTERNS)) {
      const match = normalizedQuery.match(pattern)
      if (match) {
        const value = this.extractFieldValue(query, fieldName, match.index || 0)
        if (value) {
          entities.push({
            type: 'field',
            value: `${fieldName}:${value}`,
            confidence: 0.7,
            context: this.extractFieldContext(query, match.index || 0)
          })
        }
      }
    }
    
    // Extract business identifiers (emails, phone numbers, names)
    entities.push(...this.extractIdentifiers(query))
    
    // Extract numeric values
    entities.push(...this.extractNumericValues(query))
    
    return entities.filter(entity => entity.confidence >= 0.6)
  }

  /**
   * Generate Master CRUD v2 operations from intent and entities
   */
  async generateOperations(intent: BusinessIntent, entities: ExtractedEntity[]): Promise<SuggestedOperation[]> {
    const operations: SuggestedOperation[] = []
    
    switch (intent.category) {
      case 'create':
        operations.push(await this.generateCreateOperation(intent, entities))
        break
        
      case 'update':
        operations.push(await this.generateUpdateOperation(intent, entities))
        break
        
      case 'delete':
        operations.push(await this.generateDeleteOperation(intent, entities))
        break
        
      case 'query':
        operations.push(await this.generateQueryOperation(intent, entities))
        break
        
      case 'analyze':
        operations.push(await this.generateAnalyticsOperation(intent, entities))
        break
        
      case 'insight':
        operations.push(await this.generateInsightOperation(intent, entities))
        break
    }
    
    return operations.filter(op => op.confidence >= 0.6)
  }

  /**
   * Validate natural language query for business context
   */
  async validateQuery(query: string): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = []
    
    // Check query length
    if (query.length < 3) {
      issues.push('Query too short - please provide more details')
    }
    
    if (query.length > 500) {
      issues.push('Query too long - please be more specific')
    }
    
    // Check for business context
    const hasBusinessContext = this.hasBusinessContext(query)
    if (!hasBusinessContext) {
      issues.push('Query lacks business context - specify what type of data or operation you need')
    }
    
    // Check for potentially harmful operations
    const hasSensitiveOperation = this.hasSensitiveOperation(query)
    if (hasSensitiveOperation) {
      issues.push('Query contains sensitive operations that require explicit confirmation')
    }
    
    // Check for clear intent
    const intentScores = this.scoreIntents(query.toLowerCase())
    const maxScore = Math.max(...Object.values(intentScores))
    if (maxScore < 0.5) {
      issues.push('Unclear intent - please specify what you want to do (create, update, find, analyze, etc.)')
    }
    
    return {
      isValid: issues.length === 0,
      issues
    }
  }

  // Private helper methods
  private scoreIntents(query: string): Record<IntentCategory, number> {
    const scores: Record<IntentCategory, number> = {
      create: 0,
      update: 0,
      delete: 0,
      query: 0,
      analyze: 0,
      report: 0,
      insight: 0
    }
    
    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          scores[intent as IntentCategory] += 0.3
        }
      }
    }
    
    // Boost scores based on business context
    if (query.includes('new') || query.includes('add')) scores.create += 0.2
    if (query.includes('change') || query.includes('update')) scores.update += 0.2
    if (query.includes('remove') || query.includes('delete')) scores.delete += 0.2
    if (query.includes('show') || query.includes('find')) scores.query += 0.2
    if (query.includes('analyze') || query.includes('report')) scores.analyze += 0.2
    if (query.includes('suggest') || query.includes('recommend')) scores.insight += 0.2
    
    return scores
  }

  private getTopIntent(scores: Record<IntentCategory, number>): { category: IntentCategory; confidence: number } {
    let topCategory: IntentCategory = 'query'
    let maxScore = 0
    
    for (const [category, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        topCategory = category as IntentCategory
      }
    }
    
    return { category: topCategory, confidence: Math.min(maxScore, 1.0) }
  }

  private async extractParameters(query: string, intent: IntentCategory, context: BusinessContext): Promise<Record<string, any>> {
    const parameters: Record<string, any> = {}
    
    // Extract entity type
    const entityType = this.extractEntityType(query)
    if (entityType) {
      parameters.entityType = entityType
    }
    
    // Extract field values
    const fields = this.extractFieldValues(query)
    if (Object.keys(fields).length > 0) {
      parameters.dynamicData = fields
    }
    
    // Extract filters for queries
    if (intent === 'query') {
      parameters.filters = this.extractQueryFilters(query)
      parameters.limit = this.extractLimit(query) || 10
    }
    
    // Extract confirmation requirements
    if (intent === 'delete') {
      parameters.requiresConfirmation = true
      parameters.deleteMode = query.includes('permanently') ? 'hard' : 'soft'
    }
    
    return parameters
  }

  private mapToOperation(intent: IntentCategory, parameters: Record<string, any>): string {
    switch (intent) {
      case 'create':
        return `create_${parameters.entityType || 'entity'}`
      case 'update':
        return `update_${parameters.entityType || 'entity'}`
      case 'delete':
        return `delete_${parameters.entityType || 'entity'}`
      case 'query':
        return `query_${parameters.entityType || 'entities'}`
      case 'analyze':
        return `analyze_${parameters.entityType || 'data'}`
      case 'insight':
        return `insights_${parameters.entityType || 'business'}`
      default:
        return 'general_query'
    }
  }

  private shouldRequireConfirmation(intent: IntentCategory, parameters: Record<string, any>): boolean {
    // Always require confirmation for deletions
    if (intent === 'delete') return true
    
    // Require confirmation for bulk operations
    if (parameters.limit && parameters.limit > 50) return true
    
    // Require confirmation for sensitive operations
    if (parameters.entityType === 'financial' || parameters.entityType === 'payment') return true
    
    return false
  }

  private extractEntityType(query: string): string | null {
    const normalizedQuery = query.toLowerCase()
    
    for (const [entityType, patterns] of Object.entries(ENTITY_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(normalizedQuery)) {
          return entityType
        }
      }
    }
    
    return null
  }

  private extractFieldValues(query: string): Record<string, any> {
    const fields: Record<string, any> = {}
    
    // Extract email addresses
    const emailMatch = query.match(/[\w.-]+@[\w.-]+\.\w+/g)
    if (emailMatch) {
      fields.email = emailMatch[0]
    }
    
    // Extract phone numbers
    const phoneMatch = query.match(/[\+]?[1-9]?[\d\s\-\(\)]{10,}/g)
    if (phoneMatch) {
      fields.phone = phoneMatch[0].replace(/\D/g, '')
    }
    
    // Extract prices/amounts
    const priceMatch = query.match(/\$[\d,]+\.?\d*/g)
    if (priceMatch) {
      fields.price = parseFloat(priceMatch[0].replace(/[$,]/g, ''))
    }
    
    // Extract names (quoted strings)
    const nameMatch = query.match(/"([^"]+)"|'([^']+)'/g)
    if (nameMatch) {
      fields.name = nameMatch[0].replace(/['"]/g, '')
    }
    
    return fields
  }

  private extractQueryFilters(query: string): Record<string, any> {
    const filters: Record<string, any> = {}
    
    // Extract status filters
    if (query.includes('active')) filters.status = ['active']
    if (query.includes('inactive')) filters.status = ['inactive']
    if (query.includes('deleted')) filters.status = ['deleted']
    
    // Extract date filters
    if (query.includes('today')) {
      const today = new Date().toISOString().split('T')[0]
      filters.createdAfter = today
    }
    
    if (query.includes('this week')) {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      filters.createdAfter = weekAgo
    }
    
    return filters
  }

  private extractLimit(query: string): number | null {
    // Extract numeric limits
    const limitMatch = query.match(/\b(\d+)\s*(item|record|result|customer|product)s?\b/i)
    if (limitMatch) {
      return parseInt(limitMatch[1])
    }
    
    // Extract word-based limits
    if (query.includes('all')) return 1000
    if (query.includes('few')) return 5
    if (query.includes('some')) return 10
    if (query.includes('many')) return 50
    
    return null
  }

  private generateSmartCode(entityType: string, context: BusinessContext): string {
    const industryKey = context.industry?.toLowerCase() || 'universal'
    const contextKey = `${entityType}.${industryKey}`
    
    return SMART_CODE_MAPPING[contextKey] || 
           SMART_CODE_MAPPING[`${entityType}.crm`] ||
           `HERA.UNIVERSAL.${entityType.toUpperCase()}.ENTITY.PROFILE.V1`
  }

  private extractEntityContext(query: string, pattern: RegExp): string {
    const match = query.match(pattern)
    if (!match) return ''
    
    const startIndex = Math.max(0, (match.index || 0) - 20)
    const endIndex = Math.min(query.length, (match.index || 0) + (match[0].length) + 20)
    
    return query.substring(startIndex, endIndex).trim()
  }

  private extractFieldContext(query: string, index: number): string {
    const startIndex = Math.max(0, index - 15)
    const endIndex = Math.min(query.length, index + 15)
    
    return query.substring(startIndex, endIndex).trim()
  }

  private extractFieldValue(query: string, fieldName: string, index: number): string | null {
    // Look for values after the field name
    const afterField = query.substring(index + fieldName.length)
    
    // Common patterns for field values
    const patterns = [
      /is\s+"([^"]+)"/i,     // is "value"
      /:\s*"([^"]+)"/i,      // : "value"
      /=\s*"([^"]+)"/i,      // = "value"
      /is\s+(\S+)/i,         // is value
      /:\s*(\S+)/i,          // : value
      /=\s*(\S+)/i           // = value
    ]
    
    for (const pattern of patterns) {
      const match = afterField.match(pattern)
      if (match) {
        return match[1]
      }
    }
    
    return null
  }

  private extractIdentifiers(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = []
    
    // Extract email addresses
    const emailMatches = query.match(/[\w.-]+@[\w.-]+\.\w+/g)
    if (emailMatches) {
      for (const email of emailMatches) {
        entities.push({
          type: 'identifier',
          value: email,
          confidence: 0.9,
          context: 'email_address'
        })
      }
    }
    
    // Extract phone numbers
    const phoneMatches = query.match(/[\+]?[1-9]?[\d\s\-\(\)]{10,}/g)
    if (phoneMatches) {
      for (const phone of phoneMatches) {
        entities.push({
          type: 'identifier',
          value: phone.replace(/\D/g, ''),
          confidence: 0.8,
          context: 'phone_number'
        })
      }
    }
    
    return entities
  }

  private extractNumericValues(query: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = []
    
    // Extract monetary amounts
    const moneyMatches = query.match(/\$[\d,]+\.?\d*/g)
    if (moneyMatches) {
      for (const amount of moneyMatches) {
        entities.push({
          type: 'numeric',
          value: amount.replace(/[$,]/g, ''),
          confidence: 0.8,
          context: 'monetary_amount'
        })
      }
    }
    
    // Extract percentages
    const percentMatches = query.match(/\d+\.?\d*%/g)
    if (percentMatches) {
      for (const percent of percentMatches) {
        entities.push({
          type: 'numeric',
          value: percent.replace('%', ''),
          confidence: 0.8,
          context: 'percentage'
        })
      }
    }
    
    return entities
  }

  private hasBusinessContext(query: string): boolean {
    const businessTerms = [
      'customer', 'product', 'order', 'sale', 'invoice', 'payment',
      'employee', 'vendor', 'lead', 'opportunity', 'account', 'contact',
      'revenue', 'profit', 'cost', 'price', 'inventory', 'stock'
    ]
    
    const normalizedQuery = query.toLowerCase()
    return businessTerms.some(term => normalizedQuery.includes(term))
  }

  private hasSensitiveOperation(query: string): boolean {
    const sensitiveTerms = [
      'delete all', 'remove all', 'purge', 'wipe', 'destroy',
      'financial', 'payment', 'credit card', 'bank account',
      'password', 'access', 'permission', 'admin'
    ]
    
    const normalizedQuery = query.toLowerCase()
    return sensitiveTerms.some(term => normalizedQuery.includes(term))
  }

  // Operation generators
  private async generateCreateOperation(intent: BusinessIntent, entities: ExtractedEntity[]): Promise<SuggestedOperation> {
    const entityType = entities.find(e => e.type === 'entity_type')?.value || 'entity'
    const fields = entities.filter(e => e.type === 'field')
    
    const dynamicData: Record<string, any> = {}
    for (const field of fields) {
      const [fieldName, fieldValue] = field.value.split(':')
      dynamicData[fieldName] = fieldValue
    }
    
    return {
      type: 'master_crud',
      operation: 'createEntityComplete',
      parameters: {
        entityType,
        entityName: dynamicData.name || `New ${entityType}`,
        dynamicData,
        smartCode: entities.find(e => e.smartCode)?.smartCode
      },
      confidence: intent.confidence,
      rationale: `Create new ${entityType} with provided details`,
      estimatedTimeMs: 80
    }
  }

  private async generateUpdateOperation(intent: BusinessIntent, entities: ExtractedEntity[]): Promise<SuggestedOperation> {
    const entityType = entities.find(e => e.type === 'entity_type')?.value || 'entity'
    const identifier = entities.find(e => e.type === 'identifier')?.value
    
    return {
      type: 'master_crud',
      operation: 'updateEntityComplete',
      parameters: {
        entityId: identifier || 'NEEDS_ID',
        dynamicData: { upsert: intent.parameters.dynamicData || {} }
      },
      confidence: identifier ? intent.confidence : intent.confidence * 0.7,
      rationale: `Update ${entityType} with new information`,
      estimatedTimeMs: 75
    }
  }

  private async generateDeleteOperation(intent: BusinessIntent, entities: ExtractedEntity[]): Promise<SuggestedOperation> {
    const entityType = entities.find(e => e.type === 'entity_type')?.value || 'entity'
    const identifier = entities.find(e => e.type === 'identifier')?.value
    
    return {
      type: 'master_crud',
      operation: 'deleteEntityComplete',
      parameters: {
        entityId: identifier || 'NEEDS_ID',
        deleteMode: intent.parameters.deleteMode || 'soft',
        cascadeRelationships: true,
        cascadeDynamicData: true
      },
      confidence: identifier ? intent.confidence : intent.confidence * 0.6,
      rationale: `Delete ${entityType} and related data`,
      estimatedTimeMs: 60
    }
  }

  private async generateQueryOperation(intent: BusinessIntent, entities: ExtractedEntity[]): Promise<SuggestedOperation> {
    const entityType = entities.find(e => e.type === 'entity_type')?.value
    
    return {
      type: 'master_crud',
      operation: 'queryEntityComplete',
      parameters: {
        entityType,
        includeDynamicData: true,
        includeRelationships: false,
        limit: intent.parameters.limit || 10,
        filters: intent.parameters.filters || {}
      },
      confidence: intent.confidence,
      rationale: `Find ${entityType || 'entities'} matching criteria`,
      estimatedTimeMs: 50
    }
  }

  private async generateAnalyticsOperation(intent: BusinessIntent, entities: ExtractedEntity[]): Promise<SuggestedOperation> {
    const entityType = entities.find(e => e.type === 'entity_type')?.value || 'business'
    
    return {
      type: 'analytics',
      operation: 'generateBusinessAnalytics',
      parameters: {
        entityType,
        timeframe: '30_days',
        metrics: ['count', 'trends', 'performance'],
        includeInsights: true
      },
      confidence: intent.confidence,
      rationale: `Analyze ${entityType} data and trends`,
      estimatedTimeMs: 150
    }
  }

  private async generateInsightOperation(intent: BusinessIntent, entities: ExtractedEntity[]): Promise<SuggestedOperation> {
    const context = entities.find(e => e.type === 'entity_type')?.value || 'business'
    
    return {
      type: 'analytics',
      operation: 'generateBusinessInsights',
      parameters: {
        context,
        focus: ['opportunities', 'optimizations', 'recommendations'],
        includeActionable: true
      },
      confidence: intent.confidence,
      rationale: `Generate actionable insights for ${context} optimization`,
      estimatedTimeMs: 200
    }
  }
}

// Export singleton instance
export const heraNLPProcessor = new HeraNLPProcessor()