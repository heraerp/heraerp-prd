/**
 * HERA Smart Code Validation Service v2
 * Smart Code: HERA.PLATFORM.CONFIG.VALIDATION.SMART_CODE.SERVICE.v2
 * 
 * Provides comprehensive validation for HERA DNA Smart Codes across all domains
 * Supports Finance DNA v2 and Platform/APP_CONFIG domains
 */

export interface SmartCodeValidationResult {
  isValid: boolean
  domain: 'ACCOUNTING' | 'PLATFORM' | 'UNKNOWN'
  segments: string[]
  errorCode?: string
  errorMessage?: string
  suggestions?: string[]
}

export interface SmartCodePattern {
  domain: string
  regex: RegExp
  minSegments: number
  maxSegments: number
  requiredPrefixes: string[]
  description: string
  examples: string[]
}

/**
 * HERA Smart Code Validation Patterns v2
 * Based on Finance DNA v2 Smart Code Registry
 */
export const SMART_CODE_PATTERNS: Record<string, SmartCodePattern> = {
  ACCOUNTING: {
    domain: 'ACCOUNTING',
    regex: /^HERA\.ACCOUNTING\.[A-Z]+(\.[A-Z]+)*\.v2$/,
    minSegments: 5,
    maxSegments: 10,
    requiredPrefixes: ['HERA', 'ACCOUNTING'],
    description: 'Finance DNA v2 Smart Codes for accounting operations',
    examples: [
      'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2',
      'HERA.ACCOUNTING.POLICY.RULE.ENTITY.v2',
      'HERA.ACCOUNTING.REPORT.TRIAL.BALANCE.v2'
    ]
  },
  
  PLATFORM: {
    domain: 'PLATFORM',
    regex: /^HERA\.PLATFORM\.[A-Z]+(\.[A-Z_]+)*\.v2$/,
    minSegments: 6,
    maxSegments: 12,
    requiredPrefixes: ['HERA', 'PLATFORM', 'CONFIG'],
    description: 'Platform Smart Codes for Universal App Builder and system configuration',
    examples: [
      'HERA.PLATFORM.CONFIG.APP.ENTITY.v2',
      'HERA.PLATFORM.CONFIG.APP.FISH_EXPORTS.v2',
      'HERA.PLATFORM.CONFIG.VALIDATION.SCHEMA.v2',
      'HERA.PLATFORM.CONFIG.LOADER.DYNAMIC.v2',
      'HERA.PLATFORM.CONFIG.AUDIT.CHANGE.v2'
    ]
  }
}

/**
 * APP_CONFIG specific Smart Code validation patterns
 */
export const APP_CONFIG_SMART_CODE_FAMILIES = {
  ENTITY: 'HERA.PLATFORM.CONFIG.APP.ENTITY.v2',
  DATA_DEFINITION: 'HERA.PLATFORM.CONFIG.APP.DATA.DEFINITION.v2',
  DATA_METADATA: 'HERA.PLATFORM.CONFIG.APP.DATA.METADATA.v2',
  DATA_NAVIGATION: 'HERA.PLATFORM.CONFIG.APP.DATA.NAVIGATION.v2',
  VALIDATION_SCHEMA: 'HERA.PLATFORM.CONFIG.VALIDATION.SCHEMA.v2',
  VALIDATION_INDUSTRY: 'HERA.PLATFORM.CONFIG.VALIDATION.INDUSTRY.v2',
  LOADER_DYNAMIC: 'HERA.PLATFORM.CONFIG.LOADER.DYNAMIC.v2',
  LOADER_INHERITANCE: 'HERA.PLATFORM.CONFIG.LOADER.INHERITANCE.v2',
  AUDIT_CHANGE: 'HERA.PLATFORM.CONFIG.AUDIT.CHANGE.v2',
  AUDIT_DEPLOYMENT: 'HERA.PLATFORM.CONFIG.AUDIT.DEPLOYMENT.v2'
}

/**
 * Smart Code Validation Service
 */
export class SmartCodeValidationService {
  
  /**
   * Validate a Smart Code against all known patterns
   */
  static validateSmartCode(smartCode: string): SmartCodeValidationResult {
    if (!smartCode || typeof smartCode !== 'string') {
      return {
        isValid: false,
        domain: 'UNKNOWN',
        segments: [],
        errorCode: 'INVALID_INPUT',
        errorMessage: 'Smart code must be a non-empty string'
      }
    }

    const segments = smartCode.split('.')
    
    // Basic format validation
    if (segments.length < 4) {
      return {
        isValid: false,
        domain: 'UNKNOWN',
        segments,
        errorCode: 'TOO_SHORT',
        errorMessage: 'Smart code must have at least 4 segments',
        suggestions: ['Add more descriptive segments', 'Follow HERA.DOMAIN.MODULE.FUNCTION.TYPE.v2 pattern']
      }
    }

    // Validate HERA prefix
    if (segments[0] !== 'HERA') {
      return {
        isValid: false,
        domain: 'UNKNOWN',
        segments,
        errorCode: 'INVALID_PREFIX',
        errorMessage: 'Smart code must start with HERA',
        suggestions: ['Start with HERA prefix']
      }
    }

    // Validate version suffix
    const version = segments[segments.length - 1]
    if (version !== 'v2') {
      return {
        isValid: false,
        domain: 'UNKNOWN',
        segments,
        errorCode: 'INVALID_VERSION',
        errorMessage: 'Smart code must end with v2',
        suggestions: ['Use v2 version suffix', 'Update from legacy v1 codes']
      }
    }

    // Determine domain
    const domain = segments[1]
    
    if (domain === 'ACCOUNTING') {
      return this.validateAccountingSmartCode(smartCode, segments)
    } else if (domain === 'PLATFORM') {
      return this.validatePlatformSmartCode(smartCode, segments)
    } else {
      return {
        isValid: false,
        domain: 'UNKNOWN',
        segments,
        errorCode: 'UNSUPPORTED_DOMAIN',
        errorMessage: `Unsupported domain: ${domain}`,
        suggestions: ['Use ACCOUNTING or PLATFORM domain', 'Check Smart Code Registry for valid patterns']
      }
    }
  }

  /**
   * Validate ACCOUNTING domain Smart Codes
   */
  private static validateAccountingSmartCode(smartCode: string, segments: string[]): SmartCodeValidationResult {
    const pattern = SMART_CODE_PATTERNS.ACCOUNTING
    
    if (!pattern.regex.test(smartCode)) {
      return {
        isValid: false,
        domain: 'ACCOUNTING',
        segments,
        errorCode: 'INVALID_ACCOUNTING_FORMAT',
        errorMessage: 'Invalid ACCOUNTING domain format',
        suggestions: [
          'Use only uppercase letters',
          'Follow HERA.ACCOUNTING.MODULE.FUNCTION.TYPE.v2 pattern',
          'Examples: ' + pattern.examples.join(', ')
        ]
      }
    }

    if (segments.length < pattern.minSegments) {
      return {
        isValid: false,
        domain: 'ACCOUNTING',
        segments,
        errorCode: 'TOO_SHORT_ACCOUNTING',
        errorMessage: `ACCOUNTING smart codes must have at least ${pattern.minSegments} segments`,
        suggestions: ['Add more descriptive segments for accounting operations']
      }
    }

    return {
      isValid: true,
      domain: 'ACCOUNTING',
      segments
    }
  }

  /**
   * Validate PLATFORM domain Smart Codes (APP_CONFIG)
   */
  private static validatePlatformSmartCode(smartCode: string, segments: string[]): SmartCodeValidationResult {
    const pattern = SMART_CODE_PATTERNS.PLATFORM
    
    if (!pattern.regex.test(smartCode)) {
      return {
        isValid: false,
        domain: 'PLATFORM',
        segments,
        errorCode: 'INVALID_PLATFORM_FORMAT',
        errorMessage: 'Invalid PLATFORM domain format',
        suggestions: [
          'Use only uppercase letters and underscores',
          'Follow HERA.PLATFORM.CONFIG.MODULE.FUNCTION.TYPE.v2 pattern',
          'Examples: ' + pattern.examples.join(', ')
        ]
      }
    }

    // PLATFORM specific validation - must have CONFIG as third segment
    if (segments[2] !== 'CONFIG') {
      return {
        isValid: false,
        domain: 'PLATFORM',
        segments,
        errorCode: 'MISSING_CONFIG_MODULE',
        errorMessage: 'PLATFORM smart codes must use CONFIG module',
        suggestions: ['Use HERA.PLATFORM.CONFIG.* pattern']
      }
    }

    // Additional validation for APP_CONFIG entities
    if (segments[3] === 'APP' || segments[3] === 'VALIDATION' || segments[3] === 'LOADER' || segments[3] === 'AUDIT') {
      return this.validateAppConfigSmartCode(smartCode, segments)
    }

    // General PLATFORM length check for non-APP_CONFIG codes
    if (segments.length < pattern.minSegments) {
      return {
        isValid: false,
        domain: 'PLATFORM',
        segments,
        errorCode: 'TOO_SHORT_PLATFORM',
        errorMessage: `PLATFORM smart codes must have at least ${pattern.minSegments} segments`,
        suggestions: ['Add more descriptive segments for platform operations']
      }
    }

    return {
      isValid: true,
      domain: 'PLATFORM',
      segments
    }
  }

  /**
   * Validate APP_CONFIG specific Smart Codes
   */
  private static validateAppConfigSmartCode(smartCode: string, segments: string[]): SmartCodeValidationResult {
    // APP_CONFIG smart codes should have at least 6 segments: HERA.PLATFORM.CONFIG.APP.TYPE.v2
    if (segments.length < 6) {
      return {
        isValid: false,
        domain: 'PLATFORM',
        segments,
        errorCode: 'TOO_SHORT_APP_CONFIG',
        errorMessage: 'APP_CONFIG smart codes must have at least 6 segments',
        suggestions: [
          'Use HERA.PLATFORM.CONFIG.APP.{TYPE}.v2 pattern',
          'Add specific type like ENTITY, DATA, VALIDATION, etc.'
        ]
      }
    }

    // Validate known APP_CONFIG patterns
    const validAppConfigPrefixes = [
      'HERA.PLATFORM.CONFIG.APP.ENTITY',
      'HERA.PLATFORM.CONFIG.APP.DATA',
      'HERA.PLATFORM.CONFIG.VALIDATION',
      'HERA.PLATFORM.CONFIG.LOADER',
      'HERA.PLATFORM.CONFIG.AUDIT'
    ]

    // Validate known APP_CONFIG patterns
    const smartCodePrefix = segments.slice(0, 4).join('.')
    let isValidPrefix = false
    
    if (smartCodePrefix === 'HERA.PLATFORM.CONFIG.APP') {
      // For APP-specific codes, validate the 5th segment
      if (segments.length >= 6) {
        const appType = segments[4]
        // Allow specific types or known industry patterns
        const validAppTypes = ['ENTITY', 'DATA']
        const knownIndustries = ['FISH_EXPORTS', 'RETAIL', 'HEALTHCARE', 'MANUFACTURING']
        isValidPrefix = validAppTypes.includes(appType) || knownIndustries.includes(appType)
      }
    } else {
      // For non-APP codes (VALIDATION, LOADER, AUDIT), check against known prefixes
      isValidPrefix = validAppConfigPrefixes.some(prefix => 
        prefix.startsWith(smartCodePrefix)
      )
    }

    if (!isValidPrefix) {
      return {
        isValid: false,
        domain: 'PLATFORM',
        segments,
        errorCode: 'INVALID_APP_CONFIG_TYPE',
        errorMessage: 'Invalid APP_CONFIG smart code type',
        suggestions: [
          'Use valid APP_CONFIG types: ENTITY, DATA, VALIDATION, LOADER, AUDIT',
          'Examples: ' + Object.values(APP_CONFIG_SMART_CODE_FAMILIES).slice(0, 3).join(', ')
        ]
      }
    }

    return {
      isValid: true,
      domain: 'PLATFORM',
      segments
    }
  }

  /**
   * Generate Smart Code for APP_CONFIG entities
   */
  static generateAppConfigSmartCode(configType: 'ENTITY' | 'DATA' | 'VALIDATION' | 'LOADER' | 'AUDIT', 
                                   subType?: string, 
                                   industry?: string): string {
    const base = 'HERA.PLATFORM.CONFIG.APP'
    
    switch (configType) {
      case 'ENTITY':
        return industry ? 
          `${base}.${industry.toUpperCase().replace(/-/g, '_')}.v2` :
          `${base}.ENTITY.v2`
        
      case 'DATA':
        return subType ? 
          `${base}.DATA.${subType.toUpperCase()}.v2` :
          `${base}.DATA.DEFINITION.v2`
          
      case 'VALIDATION':
        return subType ?
          `HERA.PLATFORM.CONFIG.VALIDATION.${subType.toUpperCase()}.v2` :
          `HERA.PLATFORM.CONFIG.VALIDATION.SCHEMA.v2`
          
      case 'LOADER':
        return subType ?
          `HERA.PLATFORM.CONFIG.LOADER.${subType.toUpperCase()}.v2` :
          `HERA.PLATFORM.CONFIG.LOADER.DYNAMIC.v2`
          
      case 'AUDIT':
        return subType ?
          `HERA.PLATFORM.CONFIG.AUDIT.${subType.toUpperCase()}.v2` :
          `HERA.PLATFORM.CONFIG.AUDIT.CHANGE.v2`
          
      default:
        return `${base}.ENTITY.v2`
    }
  }

  /**
   * Validate and suggest Smart Code for APP_CONFIG operations
   */
  static validateAndSuggestAppConfigSmartCode(operation: {
    entityType: 'APP_CONFIG'
    industry?: string
    operationType?: 'CREATE' | 'UPDATE' | 'DELETE' | 'VALIDATE' | 'LOAD'
    dataType?: 'DEFINITION' | 'METADATA' | 'NAVIGATION'
  }): SmartCodeValidationResult & { suggestedSmartCode?: string } {
    
    let suggestedSmartCode: string
    
    if (operation.operationType === 'VALIDATE') {
      suggestedSmartCode = this.generateAppConfigSmartCode('VALIDATION', 'SCHEMA')
    } else if (operation.operationType === 'LOAD') {
      suggestedSmartCode = this.generateAppConfigSmartCode('LOADER', 'DYNAMIC')
    } else if (operation.dataType) {
      suggestedSmartCode = this.generateAppConfigSmartCode('DATA', operation.dataType)
    } else if (operation.industry) {
      suggestedSmartCode = this.generateAppConfigSmartCode('ENTITY', undefined, operation.industry)
    } else {
      suggestedSmartCode = this.generateAppConfigSmartCode('ENTITY')
    }

    const validation = this.validateSmartCode(suggestedSmartCode)
    
    return {
      ...validation,
      suggestedSmartCode
    }
  }

  /**
   * Batch validate multiple Smart Codes
   */
  static batchValidateSmartCodes(smartCodes: string[]): Record<string, SmartCodeValidationResult> {
    const results: Record<string, SmartCodeValidationResult> = {}
    
    for (const smartCode of smartCodes) {
      results[smartCode] = this.validateSmartCode(smartCode)
    }
    
    return results
  }

  /**
   * Get all valid APP_CONFIG Smart Code families
   */
  static getAppConfigSmartCodeFamilies(): Record<string, string> {
    return { ...APP_CONFIG_SMART_CODE_FAMILIES }
  }

  /**
   * Check if Smart Code belongs to APP_CONFIG domain
   */
  static isAppConfigSmartCode(smartCode: string): boolean {
    // APP_CONFIG includes not just APP entities but also VALIDATION, LOADER, and AUDIT
    return (smartCode.startsWith('HERA.PLATFORM.CONFIG.') && smartCode.endsWith('.v2')) &&
           (smartCode.includes('.APP.') || 
            smartCode.includes('.VALIDATION.') || 
            smartCode.includes('.LOADER.') || 
            smartCode.includes('.AUDIT.'))
  }

  /**
   * Extract industry from APP_CONFIG Smart Code
   */
  static extractIndustryFromAppConfigSmartCode(smartCode: string): string | null {
    if (!this.isAppConfigSmartCode(smartCode)) {
      return null
    }
    
    const segments = smartCode.split('.')
    if (segments.length >= 6 && segments[4] !== 'ENTITY' && segments[4] !== 'DATA') {
      return segments[4].toLowerCase().replace(/_/g, '-')
    }
    
    return null
  }
}

/**
 * Convenience function for quick Smart Code validation
 */
export function validateSmartCode(smartCode: string): SmartCodeValidationResult {
  return SmartCodeValidationService.validateSmartCode(smartCode)
}

/**
 * Convenience function for APP_CONFIG Smart Code generation
 */
export function generateAppConfigSmartCode(industry: string, type: 'entity' | 'data' | 'validation' = 'entity'): string {
  switch (type) {
    case 'entity':
      return SmartCodeValidationService.generateAppConfigSmartCode('ENTITY', undefined, industry)
    case 'data':
      return SmartCodeValidationService.generateAppConfigSmartCode('DATA', 'DEFINITION')
    case 'validation':
      return SmartCodeValidationService.generateAppConfigSmartCode('VALIDATION', 'SCHEMA')
    default:
      return SmartCodeValidationService.generateAppConfigSmartCode('ENTITY', undefined, industry)
  }
}

/**
 * Type guard for Smart Code validation result
 */
export function isValidSmartCode(result: SmartCodeValidationResult): result is SmartCodeValidationResult & { isValid: true } {
  return result.isValid === true
}

export default SmartCodeValidationService