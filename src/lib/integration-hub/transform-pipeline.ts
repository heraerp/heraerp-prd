import type { 
  TransformOperation, 
  FieldMapping, 
  ValidationRule,
  SchemaField 
} from '@/types/integration-hub'

export interface TransformResult {
  success: boolean
  data?: any
  errors?: string[]
  warnings?: string[]
  stats?: {
    recordsProcessed: number
    recordsTransformed: number
    recordsSkipped: number
    transformationTime: number
  }
}

export class TransformPipeline {
  private operations: TransformOperation[] = []
  private fieldMappings: FieldMapping[] = []
  private validationRules: ValidationRule[] = []

  constructor(
    operations?: TransformOperation[],
    fieldMappings?: FieldMapping[],
    validationRules?: ValidationRule[]
  ) {
    this.operations = operations || []
    this.fieldMappings = fieldMappings || []
    this.validationRules = validationRules || []
  }

  // Execute the full transformation pipeline
  async execute(data: any): Promise<TransformResult> {
    const startTime = Date.now()
    const errors: string[] = []
    const warnings: string[] = []
    let transformedData = data
    let recordsProcessed = 0
    let recordsTransformed = 0
    let recordsSkipped = 0

    try {
      // Apply pre-validation if rules exist
      if (this.validationRules.length > 0) {
        const validation = this.validateData(transformedData)
        if (!validation.valid) {
          errors.push(...validation.errors)
          return {
            success: false,
            errors,
            stats: {
              recordsProcessed: Array.isArray(data) ? data.length : 1,
              recordsTransformed: 0,
              recordsSkipped: Array.isArray(data) ? data.length : 1,
              transformationTime: Date.now() - startTime
            }
          }
        }
      }

      // Apply field mappings
      if (this.fieldMappings.length > 0) {
        transformedData = this.applyFieldMappings(transformedData)
      }

      // Apply transform operations
      if (this.operations.length > 0) {
        transformedData = await this.applyTransformOperations(transformedData)
      }

      // Count processed records
      if (Array.isArray(transformedData)) {
        recordsProcessed = data.length
        recordsTransformed = transformedData.length
        recordsSkipped = recordsProcessed - recordsTransformed
      } else {
        recordsProcessed = 1
        recordsTransformed = transformedData ? 1 : 0
        recordsSkipped = transformedData ? 0 : 1
      }

      return {
        success: true,
        data: transformedData,
        warnings,
        stats: {
          recordsProcessed,
          recordsTransformed,
          recordsSkipped,
          transformationTime: Date.now() - startTime
        }
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown transformation error')
      return {
        success: false,
        errors,
        stats: {
          recordsProcessed,
          recordsTransformed,
          recordsSkipped,
          transformationTime: Date.now() - startTime
        }
      }
    }
  }

  // Apply field mappings
  private applyFieldMappings(data: any): any {
    if (Array.isArray(data)) {
      return data.map(record => this.mapSingleRecord(record))
    }
    return this.mapSingleRecord(data)
  }

  // Map a single record
  private mapSingleRecord(record: any): any {
    const mappedRecord: any = {}

    this.fieldMappings.forEach(mapping => {
      const sourceValue = this.getNestedValue(record, mapping.source_field)
      
      if (sourceValue !== undefined || mapping.default_value !== undefined) {
        const value = sourceValue !== undefined ? sourceValue : mapping.default_value
        
        if (mapping.transform) {
          const transformedValue = this.applyTransform(value, mapping.transform)
          this.setNestedValue(mappedRecord, mapping.target_field, transformedValue)
        } else {
          this.setNestedValue(mappedRecord, mapping.target_field, value)
        }
      }
    })

    return mappedRecord
  }

  // Apply transform operations
  private async applyTransformOperations(data: any): Promise<any> {
    let result = data

    // Sort operations by order
    const sortedOps = [...this.operations].sort((a, b) => a.order - b.order)

    for (const operation of sortedOps) {
      result = await this.applyTransform(result, operation)
    }

    return result
  }

  // Apply a single transform
  private applyTransform(data: any, operation: TransformOperation): any {
    switch (operation.type) {
      case 'filter':
        return this.transformFilter(data, operation.config)
      
      case 'map':
        return this.transformMap(data, operation.config)
      
      case 'merge':
        return this.transformMerge(data, operation.config)
      
      case 'split':
        return this.transformSplit(data, operation.config)
      
      case 'validate':
        return this.transformValidate(data, operation.config)
      
      case 'enrich':
        return this.transformEnrich(data, operation.config)
      
      case 'redact':
        return this.transformRedact(data, operation.config)
      
      default:
        return data
    }
  }

  // Transform implementations
  private transformFilter(data: any, config: any): any {
    if (Array.isArray(data)) {
      return data.filter(item => this.evaluateCondition(item, config))
    }
    return this.evaluateCondition(data, config) ? data : null
  }

  private transformMap(data: any, config: any): any {
    const mapFunction = this.getMapFunction(config.type)
    
    if (Array.isArray(data)) {
      return data.map(item => mapFunction(item, config))
    }
    
    return mapFunction(data, config)
  }

  private getMapFunction(type: string): (data: any, config: any) => any {
    const mapFunctions: Record<string, (data: any, config: any) => any> = {
      uppercase: (data) => typeof data === 'string' ? data.toUpperCase() : data,
      lowercase: (data) => typeof data === 'string' ? data.toLowerCase() : data,
      trim: (data) => typeof data === 'string' ? data.trim() : data,
      date_format: (data, config) => {
        if (!data) return data
        const date = new Date(data)
        if (config.format === 'iso') return date.toISOString()
        if (config.format === 'date') return date.toISOString().split('T')[0]
        if (config.format === 'time') return date.toTimeString().split(' ')[0]
        return date.toISOString()
      },
      number: (data) => data !== null && data !== undefined ? Number(data) : null,
      boolean: (data) => Boolean(data),
      concat: (data, config) => {
        if (config.fields && Array.isArray(config.fields)) {
          return config.fields
            .map((field: string) => this.getNestedValue(data, field))
            .filter(v => v !== null && v !== undefined)
            .join(config.separator || ' ')
        }
        return data
      },
      template: (data, config) => {
        if (config.template) {
          return config.template.replace(/\{\{(\w+)\}\}/g, (_: string, field: string) => {
            return this.getNestedValue(data, field) || ''
          })
        }
        return data
      }
    }

    return mapFunctions[type] || ((data) => data)
  }

  private transformMerge(data: any, config: any): any {
    if (Array.isArray(data) && config.with && Array.isArray(config.with)) {
      // Merge multiple arrays
      return [...data, ...config.with]
    }
    
    if (typeof data === 'object' && config.with && typeof config.with === 'object') {
      // Merge objects
      return { ...data, ...config.with }
    }
    
    return data
  }

  private transformSplit(data: any, config: any): any {
    if (typeof data === 'string' && config.separator) {
      const parts = data.split(config.separator)
      
      if (config.limit) {
        return parts.slice(0, config.limit)
      }
      
      return parts
    }
    
    if (Array.isArray(data) && config.batch_size) {
      // Split array into batches
      const batches = []
      for (let i = 0; i < data.length; i += config.batch_size) {
        batches.push(data.slice(i, i + config.batch_size))
      }
      return batches
    }
    
    return data
  }

  private transformValidate(data: any, config: any): any {
    const validation = this.validateSingleRecord(data, config)
    
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }
    
    return data
  }

  private transformEnrich(data: any, config: any): any {
    let enriched = data
    
    // Add timestamp
    if (config.add_timestamp) {
      const timestampField = config.timestamp_field || 'enriched_at'
      if (Array.isArray(enriched)) {
        enriched = enriched.map(item => ({
          ...item,
          [timestampField]: new Date().toISOString()
        }))
      } else {
        enriched = {
          ...enriched,
          [timestampField]: new Date().toISOString()
        }
      }
    }
    
    // Add static fields
    if (config.add_fields && typeof config.add_fields === 'object') {
      if (Array.isArray(enriched)) {
        enriched = enriched.map(item => ({
          ...item,
          ...config.add_fields
        }))
      } else {
        enriched = {
          ...enriched,
          ...config.add_fields
        }
      }
    }
    
    // Add computed fields
    if (config.computed_fields && Array.isArray(config.computed_fields)) {
      config.computed_fields.forEach((field: any) => {
        if (field.name && field.expression) {
          const value = this.evaluateExpression(enriched, field.expression)
          if (Array.isArray(enriched)) {
            enriched = enriched.map(item => ({
              ...item,
              [field.name]: value
            }))
          } else {
            enriched = {
              ...enriched,
              [field.name]: value
            }
          }
        }
      })
    }
    
    return enriched
  }

  private transformRedact(data: any, config: any): any {
    const redact = (value: any, path: string): any => {
      if (config.fields && config.fields.includes(path)) {
        return '***REDACTED***'
      }
      
      if (config.patterns && typeof value === 'string') {
        let redacted = value
        
        config.patterns.forEach((pattern: any) => {
          if (pattern.type === 'ssn') {
            redacted = redacted.replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '***-**-****')
          } else if (pattern.type === 'email') {
            redacted = redacted.replace(
              /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
              (match) => {
                const [local, domain] = match.split('@')
                return `${local.substring(0, 2)}***@${domain}`
              }
            )
          } else if (pattern.type === 'credit_card') {
            redacted = redacted.replace(
              /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
              '**** **** **** ****'
            )
          } else if (pattern.type === 'phone') {
            redacted = redacted.replace(
              /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
              '(***) ***-****'
            )
          } else if (pattern.regex) {
            redacted = redacted.replace(
              new RegExp(pattern.regex, pattern.flags || 'g'),
              pattern.replacement || '***'
            )
          }
        })
        
        return redacted
      }
      
      return value
    }
    
    const redactObject = (obj: any, parentPath = ''): any => {
      if (Array.isArray(obj)) {
        return obj.map((item, index) => 
          redactObject(item, `${parentPath}[${index}]`)
        )
      }
      
      if (obj !== null && typeof obj === 'object') {
        const redacted: any = {}
        
        Object.keys(obj).forEach(key => {
          const path = parentPath ? `${parentPath}.${key}` : key
          redacted[key] = redactObject(obj[key], path)
        })
        
        return redacted
      }
      
      return redact(obj, parentPath)
    }
    
    return redactObject(data)
  }

  // Validation
  private validateData(data: any): { valid: boolean; errors: string[] } {
    if (Array.isArray(data)) {
      const errors: string[] = []
      data.forEach((record, index) => {
        const validation = this.validateSingleRecord(record, this.validationRules)
        if (!validation.valid) {
          errors.push(...validation.errors.map(err => `Record ${index + 1}: ${err}`))
        }
      })
      return { valid: errors.length === 0, errors }
    }
    
    return this.validateSingleRecord(data, this.validationRules)
  }

  private validateSingleRecord(
    record: any, 
    rules: ValidationRule[] | any
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const rulesToValidate = Array.isArray(rules) ? rules : this.validationRules

    rulesToValidate.forEach((rule: ValidationRule) => {
      const value = this.getNestedValue(record, rule.field)
      
      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            errors.push(rule.error_message || `${rule.field} is required`)
          }
          break
          
        case 'format':
          if (value && rule.config.pattern) {
            const regex = new RegExp(rule.config.pattern)
            if (!regex.test(value)) {
              errors.push(rule.error_message || `${rule.field} has invalid format`)
            }
          }
          break
          
        case 'range':
          if (value !== undefined && value !== null) {
            if (rule.config.min !== undefined && value < rule.config.min) {
              errors.push(rule.error_message || `${rule.field} is below minimum value`)
            }
            if (rule.config.max !== undefined && value > rule.config.max) {
              errors.push(rule.error_message || `${rule.field} is above maximum value`)
            }
          }
          break
          
        case 'custom':
          if (rule.config.validator) {
            // Custom validation function would be defined elsewhere
            // For now, just pass
          }
          break
      }
    })
    
    return { valid: errors.length === 0, errors }
  }

  // Helpers
  private getNestedValue(obj: any, path: string): any {
    if (!path) return obj
    
    return path.split('.').reduce((current, prop) => {
      if (current === null || current === undefined) return undefined
      
      // Handle array notation
      const arrayMatch = prop.match(/^(.+)\[(\d+)\]$/)
      if (arrayMatch) {
        const [, arrayProp, index] = arrayMatch
        return current[arrayProp]?.[parseInt(index)]
      }
      
      return current[prop]
    }, obj)
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    
    const target = keys.reduce((current, key) => {
      // Handle array notation
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/)
      if (arrayMatch) {
        const [, arrayProp, index] = arrayMatch
        if (!current[arrayProp]) current[arrayProp] = []
        if (!current[arrayProp][parseInt(index)]) current[arrayProp][parseInt(index)] = {}
        return current[arrayProp][parseInt(index)]
      }
      
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    
    target[lastKey] = value
  }

  private evaluateCondition(record: any, config: any): boolean {
    if (!config || !config.conditions) return true
    
    const conditions = Array.isArray(config.conditions) ? config.conditions : [config]
    const operator = config.operator || 'and'
    
    if (operator === 'and') {
      return conditions.every((condition: any) => 
        this.evaluateSingleCondition(record, condition)
      )
    } else if (operator === 'or') {
      return conditions.some((condition: any) => 
        this.evaluateSingleCondition(record, condition)
      )
    }
    
    return this.evaluateSingleCondition(record, config)
  }

  private evaluateSingleCondition(record: any, condition: any): boolean {
    const value = this.getNestedValue(record, condition.field)
    
    switch (condition.operator) {
      case 'eq':
      case '=':
      case '==':
        return value === condition.value
        
      case 'ne':
      case '!=':
      case '<>':
        return value !== condition.value
        
      case 'gt':
      case '>':
        return value > condition.value
        
      case 'gte':
      case '>=':
        return value >= condition.value
        
      case 'lt':
      case '<':
        return value < condition.value
        
      case 'lte':
      case '<=':
        return value <= condition.value
        
      case 'contains':
      case 'includes':
        return value?.includes?.(condition.value) || false
        
      case 'not_contains':
      case 'not_includes':
        return !value?.includes?.(condition.value) || false
        
      case 'starts_with':
        return value?.startsWith?.(condition.value) || false
        
      case 'ends_with':
        return value?.endsWith?.(condition.value) || false
        
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value)
        
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value)
        
      case 'between':
        return value >= condition.value[0] && value <= condition.value[1]
        
      case 'regex':
        return new RegExp(condition.value, condition.flags).test(value)
        
      case 'exists':
        return value !== null && value !== undefined
        
      case 'not_exists':
        return value === null || value === undefined
        
      default:
        return true
    }
  }

  private evaluateExpression(data: any, expression: string): any {
    // Simple expression evaluator
    // In production, use a proper expression library
    
    if (expression.startsWith('=')) {
      // Simple field reference
      const field = expression.substring(1)
      return this.getNestedValue(data, field)
    }
    
    if (expression.includes('+')) {
      // Simple concatenation
      const parts = expression.split('+').map(p => p.trim())
      return parts.map(part => {
        if (part.startsWith('"') && part.endsWith('"')) {
          return part.slice(1, -1)
        }
        return this.getNestedValue(data, part) || ''
      }).join('')
    }
    
    // Default: return as-is
    return expression
  }
}