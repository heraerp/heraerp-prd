import { universalApi } from '@/lib/universal-api'
import { createNormalizedEntity } from '@/lib/services/entity-normalization-service'
import type { 
  DataMapping, 
  FieldMapping, 
  TransformOperation, 
  ValidationRule,
  SchemaField 
} from '@/types/integration-hub'

export class MappingEngine {
  // Create a new mapping configuration
  static async createMapping(
    organizationId: string,
    connectorId: string,
    name: string,
    resource: string,
    fieldMappings: FieldMapping[],
    transformOperations?: TransformOperation[],
    validationRules?: ValidationRule[]
  ): Promise<DataMapping> {
    const mapping = await createNormalizedEntity(
      organizationId,
      'integration_mapping',
      name,
      {
        entity_code: `MAP-${resource.toUpperCase()}-${Date.now()}`,
        smart_code: `HERA.INTEGRATIONS.MAPPING.${resource.toUpperCase()}.v1`,
        connector_id: connectorId,
        resource,
        field_mappings: fieldMappings,
        transform_operations: transformOperations || [],
        validation_rules: validationRules || []
      }
    )

    return mapping.data as DataMapping
  }

  // Apply field mappings to transform source data to target format
  static applyFieldMappings(
    sourceData: any,
    fieldMappings: FieldMapping[]
  ): any {
    const targetData: any = {}

    fieldMappings.forEach(mapping => {
      const sourceValue = this.getNestedValue(sourceData, mapping.source_field)
      
      if (sourceValue !== undefined || mapping.default_value !== undefined) {
        const value = sourceValue !== undefined ? sourceValue : mapping.default_value
        
        if (mapping.transform) {
          const transformedValue = this.applyTransform(value, mapping.transform)
          this.setNestedValue(targetData, mapping.target_field, transformedValue)
        } else {
          this.setNestedValue(targetData, mapping.target_field, value)
        }
      }
    })

    return targetData
  }

  // Apply transform operations in sequence
  static applyTransformPipeline(
    data: any,
    operations: TransformOperation[]
  ): any {
    let result = data

    // Sort operations by order
    const sortedOps = [...operations].sort((a, b) => a.order - b.order)

    sortedOps.forEach(operation => {
      result = this.applyTransform(result, operation)
    })

    return result
  }

  // Apply a single transform operation
  static applyTransform(data: any, operation: TransformOperation): any {
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
  private static transformFilter(data: any, config: any): any {
    if (Array.isArray(data)) {
      return data.filter(item => this.evaluateCondition(item, config.condition))
    }
    return this.evaluateCondition(data, config.condition) ? data : null
  }

  private static transformMap(data: any, config: any): any {
    if (config.type === 'uppercase') {
      return typeof data === 'string' ? data.toUpperCase() : data
    }
    if (config.type === 'lowercase') {
      return typeof data === 'string' ? data.toLowerCase() : data
    }
    if (config.type === 'trim') {
      return typeof data === 'string' ? data.trim() : data
    }
    if (config.type === 'date_format' && data) {
      return new Date(data).toISOString()
    }
    if (config.type === 'number' && data !== null) {
      return Number(data)
    }
    if (config.type === 'boolean') {
      return Boolean(data)
    }
    if (config.type === 'custom' && config.function) {
      // Custom transformation function (would be defined elsewhere)
      return data
    }
    return data
  }

  private static transformMerge(data: any, config: any): any {
    if (Array.isArray(data) && config.fields) {
      return data.map(item => ({
        ...item,
        [config.target_field]: config.fields
          .map((field: string) => item[field])
          .filter(Boolean)
          .join(config.separator || ' ')
      }))
    }
    return data
  }

  private static transformSplit(data: any, config: any): any {
    if (typeof data === 'string' && config.separator) {
      return data.split(config.separator)
    }
    return data
  }

  private static transformValidate(data: any, config: any): any {
    const validationErrors: string[] = []

    if (config.required && !data) {
      validationErrors.push('Required field is missing')
    }

    if (config.format === 'email' && data) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data)) {
        validationErrors.push('Invalid email format')
      }
    }

    if (config.format === 'phone' && data) {
      const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}$/
      if (!phoneRegex.test(data)) {
        validationErrors.push('Invalid phone format')
      }
    }

    if (config.min_length && data && data.length < config.min_length) {
      validationErrors.push(`Minimum length is ${config.min_length}`)
    }

    if (config.max_length && data && data.length > config.max_length) {
      validationErrors.push(`Maximum length is ${config.max_length}`)
    }

    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`)
    }

    return data
  }

  private static transformEnrich(data: any, config: any): any {
    // Add additional fields
    if (config.add_fields) {
      return { ...data, ...config.add_fields }
    }

    // Add timestamp
    if (config.add_timestamp) {
      return { ...data, [config.timestamp_field || 'timestamp']: new Date().toISOString() }
    }

    return data
  }

  private static transformRedact(data: any, config: any): any {
    if (config.fields && Array.isArray(config.fields)) {
      const redacted = { ...data }
      config.fields.forEach((field: string) => {
        if (redacted[field]) {
          redacted[field] = '***REDACTED***'
        }
      })
      return redacted
    }

    // Redact patterns (e.g., SSN, credit card)
    if (config.patterns && typeof data === 'string') {
      let result = data
      if (config.patterns.includes('ssn')) {
        result = result.replace(/\d{3}-\d{2}-\d{4}/g, '***-**-****')
      }
      if (config.patterns.includes('credit_card')) {
        result = result.replace(/\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/g, '**** **** **** ****')
      }
      return result
    }

    return data
  }

  // Validate data against rules
  static validateData(
    data: any,
    rules: ValidationRule[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    rules.forEach(rule => {
      const value = this.getNestedValue(data, rule.field)

      switch (rule.type) {
        case 'required':
          if (!value && value !== 0 && value !== false) {
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
          // Custom validation logic would go here
          break
      }
    })

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Auto-generate field mappings based on field name similarity
  static autoGenerateMappings(
    sourceFields: SchemaField[],
    targetFields: SchemaField[]
  ): FieldMapping[] {
    const mappings: FieldMapping[] = []

    sourceFields.forEach(sourceField => {
      // Try exact match first
      let targetField = targetFields.find(
        tf => tf.name.toLowerCase() === sourceField.name.toLowerCase()
      )

      // Try partial match
      if (!targetField) {
        targetField = targetFields.find(tf => 
          tf.name.toLowerCase().includes(sourceField.name.toLowerCase()) ||
          sourceField.name.toLowerCase().includes(tf.name.toLowerCase())
        )
      }

      // Try common aliases
      if (!targetField) {
        const aliases = this.getFieldAliases(sourceField.name)
        targetField = targetFields.find(tf => 
          aliases.includes(tf.name.toLowerCase())
        )
      }

      if (targetField && this.areTypesCompatible(sourceField.type, targetField.type)) {
        mappings.push({
          id: `map-${sourceField.name}-${targetField.name}`,
          source_field: sourceField.name,
          target_field: targetField.name,
          is_key: this.isKeyField(sourceField.name)
        })
      }
    })

    return mappings
  }

  // Helper methods
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj)
  }

  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((curr, key) => {
      if (!curr[key]) curr[key] = {}
      return curr[key]
    }, obj)
    target[lastKey] = value
  }

  private static evaluateCondition(data: any, condition: any): boolean {
    if (condition.field && condition.operator && condition.value !== undefined) {
      const fieldValue = this.getNestedValue(data, condition.field)
      
      switch (condition.operator) {
        case 'eq': return fieldValue === condition.value
        case 'ne': return fieldValue !== condition.value
        case 'gt': return fieldValue > condition.value
        case 'lt': return fieldValue < condition.value
        case 'contains': return fieldValue?.includes?.(condition.value)
        case 'in': return condition.value?.includes?.(fieldValue)
        default: return true
      }
    }
    return true
  }

  private static getFieldAliases(fieldName: string): string[] {
    const aliasMap: Record<string, string[]> = {
      email: ['email_address', 'emailaddress', 'mail', 'e_mail'],
      phone: ['phone_number', 'phonenumber', 'telephone', 'tel', 'mobile'],
      name: ['full_name', 'fullname', 'display_name', 'displayname'],
      first_name: ['firstname', 'fname', 'given_name', 'givenname'],
      last_name: ['lastname', 'lname', 'surname', 'family_name'],
      company: ['company_name', 'companyname', 'organization', 'org'],
      address: ['street_address', 'streetaddress', 'addr'],
      city: ['town', 'locality'],
      state: ['province', 'region'],
      zip: ['zip_code', 'zipcode', 'postal_code', 'postalcode', 'postcode']
    }

    const lowerFieldName = fieldName.toLowerCase()
    return aliasMap[lowerFieldName] || []
  }

  private static areTypesCompatible(sourceType: string, targetType: string): boolean {
    if (sourceType === targetType) return true

    const compatibilityMap: Record<string, string[]> = {
      string: ['string', 'number', 'boolean'],
      number: ['string', 'number'],
      boolean: ['string', 'boolean', 'number'],
      date: ['string', 'date'],
      array: ['array'],
      object: ['object']
    }

    return compatibilityMap[sourceType]?.includes(targetType) || false
  }

  private static isKeyField(fieldName: string): boolean {
    const keyFields = ['id', 'email', 'email_address', 'external_id', 'uuid', 'guid']
    return keyFields.includes(fieldName.toLowerCase())
  }
}