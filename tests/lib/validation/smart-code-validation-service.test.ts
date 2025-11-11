/**
 * HERA Smart Code Validation Service Tests
 * Smart Code: HERA.PLATFORM.CONFIG.VALIDATION.SMART_CODE.TEST.v2
 * 
 * Comprehensive test suite for Smart Code validation across all domains
 */

import { describe, test, expect } from 'vitest'
import {
  SmartCodeValidationService,
  validateSmartCode,
  generateAppConfigSmartCode,
  isValidSmartCode,
  APP_CONFIG_SMART_CODE_FAMILIES,
  SMART_CODE_PATTERNS
} from '@/lib/validation/smart-code-validation-service'

describe('SmartCodeValidationService', () => {
  
  describe('Basic Validation', () => {
    test('should reject empty or invalid input', () => {
      expect(validateSmartCode('').isValid).toBe(false)
      expect(validateSmartCode(null as any).isValid).toBe(false)
      expect(validateSmartCode(undefined as any).isValid).toBe(false)
      expect(validateSmartCode(123 as any).isValid).toBe(false)
    })

    test('should reject smart codes without HERA prefix', () => {
      const result = validateSmartCode('PLATFORM.CONFIG.APP.ENTITY.v2')
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('INVALID_PREFIX')
      expect(result.suggestions).toContain('Start with HERA prefix')
    })

    test('should reject smart codes without v2 suffix', () => {
      const result = validateSmartCode('HERA.PLATFORM.CONFIG.APP.ENTITY.v1')
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('INVALID_VERSION')
      expect(result.suggestions).toContain('Use v2 version suffix')
    })

    test('should reject smart codes that are too short', () => {
      const result = validateSmartCode('HERA.PLATFORM.v2')
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('TOO_SHORT')
      expect(result.segments).toEqual(['HERA', 'PLATFORM', 'v2'])
    })

    test('should reject unsupported domains', () => {
      const result = validateSmartCode('HERA.UNSUPPORTED.MODULE.FUNCTION.v2')
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('UNSUPPORTED_DOMAIN')
      expect(result.domain).toBe('UNKNOWN')
    })
  })

  describe('ACCOUNTING Domain Validation', () => {
    test('should validate correct ACCOUNTING smart codes', () => {
      const validCodes = [
        'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2',
        'HERA.ACCOUNTING.POLICY.RULE.ENTITY.v2',
        'HERA.ACCOUNTING.REPORT.TRIAL.BALANCE.v2',
        'HERA.ACCOUNTING.FISCAL.PERIOD.ENTITY.v2'
      ]

      for (const code of validCodes) {
        const result = validateSmartCode(code)
        expect(result.isValid).toBe(true)
        expect(result.domain).toBe('ACCOUNTING')
        expect(result.segments).toEqual(code.split('.'))
      }
    })

    test('should reject invalid ACCOUNTING format', () => {
      const invalidCodes = [
        'HERA.ACCOUNTING.gl.txn.journal.v2', // lowercase
        'HERA.ACCOUNTING.GL-TXN.JOURNAL.v2', // hyphen instead of dot
        'HERA.ACCOUNTING.GL_TXN.JOURNAL.v2'  // underscore in wrong place
      ]

      for (const code of invalidCodes) {
        const result = validateSmartCode(code)
        expect(result.isValid).toBe(false)
        expect(result.domain).toBe('ACCOUNTING')
        expect(result.errorCode).toBe('INVALID_ACCOUNTING_FORMAT')
      }
    })

    test('should reject ACCOUNTING codes that are too short', () => {
      const result = validateSmartCode('HERA.ACCOUNTING.GL.v2')
      expect(result.isValid).toBe(false)
      expect(result.domain).toBe('ACCOUNTING')
      expect(result.errorCode).toBe('TOO_SHORT_ACCOUNTING')
    })
  })

  describe('PLATFORM Domain Validation', () => {
    test('should validate correct PLATFORM smart codes', () => {
      const validCodes = [
        'HERA.PLATFORM.CONFIG.APP.ENTITY.v2',
        'HERA.PLATFORM.CONFIG.APP.FISH_EXPORTS.v2',
        'HERA.PLATFORM.CONFIG.VALIDATION.SCHEMA.v2',
        'HERA.PLATFORM.CONFIG.LOADER.DYNAMIC.v2',
        'HERA.PLATFORM.CONFIG.AUDIT.CHANGE.v2'
      ]

      for (const code of validCodes) {
        const result = validateSmartCode(code)
        if (!result.isValid) {
          console.log(`Failed validation for ${code}:`, result.errorCode, result.errorMessage)
        }
        expect(result.isValid).toBe(true)
        expect(result.domain).toBe('PLATFORM')
        expect(result.segments).toEqual(code.split('.'))
      }
    })

    test('should reject invalid PLATFORM format', () => {
      const invalidCodes = [
        'HERA.PLATFORM.config.app.entity.v2', // lowercase
        'HERA.PLATFORM.CONFIG.APP-ENTITY.v2', // hyphen
      ]

      for (const code of invalidCodes) {
        const result = validateSmartCode(code)
        expect(result.isValid).toBe(false)
        expect(result.domain).toBe('PLATFORM')
        expect(result.errorCode).toBe('INVALID_PLATFORM_FORMAT')
      }
    })

    test('should reject PLATFORM codes without CONFIG module', () => {
      const result = validateSmartCode('HERA.PLATFORM.DIRECT.APP.ENTITY.v2')
      expect(result.isValid).toBe(false)
      expect(result.domain).toBe('PLATFORM')
      expect(result.errorCode).toBe('MISSING_CONFIG_MODULE')
    })

    test('should reject PLATFORM codes that are too short', () => {
      const result = validateSmartCode('HERA.PLATFORM.CONFIG.v2')
      expect(result.isValid).toBe(false)
      expect(result.domain).toBe('PLATFORM')
      expect(result.errorCode).toBe('TOO_SHORT_PLATFORM')
    })
  })

  describe('APP_CONFIG Specific Validation', () => {
    test('should validate all known APP_CONFIG smart code families', () => {
      const families = Object.values(APP_CONFIG_SMART_CODE_FAMILIES)
      
      for (const smartCode of families) {
        const result = validateSmartCode(smartCode)
        expect(result.isValid).toBe(true)
        expect(result.domain).toBe('PLATFORM')
        expect(SmartCodeValidationService.isAppConfigSmartCode(smartCode)).toBe(true)
      }
    })

    test('should validate industry-specific APP_CONFIG codes', () => {
      const industryCodes = [
        'HERA.PLATFORM.CONFIG.APP.FISH_EXPORTS.v2',
        'HERA.PLATFORM.CONFIG.APP.RETAIL.v2',
        'HERA.PLATFORM.CONFIG.APP.HEALTHCARE.v2',
        'HERA.PLATFORM.CONFIG.APP.MANUFACTURING.v2'
      ]

      for (const code of industryCodes) {
        const result = validateSmartCode(code)
        expect(result.isValid).toBe(true)
        expect(result.domain).toBe('PLATFORM')
      }
    })

    test('should reject APP_CONFIG codes that are too short', () => {
      const result = validateSmartCode('HERA.PLATFORM.CONFIG.APP.v2')
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('TOO_SHORT_APP_CONFIG')
    })

    test('should reject invalid APP_CONFIG types', () => {
      const result = validateSmartCode('HERA.PLATFORM.CONFIG.APP.INVALID_TYPE.v2')
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('INVALID_APP_CONFIG_TYPE')
    })

    test('should correctly identify APP_CONFIG smart codes', () => {
      expect(SmartCodeValidationService.isAppConfigSmartCode('HERA.PLATFORM.CONFIG.APP.ENTITY.v2')).toBe(true)
      expect(SmartCodeValidationService.isAppConfigSmartCode('HERA.ACCOUNTING.GL.TXN.JOURNAL.v2')).toBe(false)
      expect(SmartCodeValidationService.isAppConfigSmartCode('HERA.PLATFORM.CONFIG.VALIDATION.SCHEMA.v2')).toBe(true)
    })

    test('should extract industry from APP_CONFIG smart codes', () => {
      expect(SmartCodeValidationService.extractIndustryFromAppConfigSmartCode('HERA.PLATFORM.CONFIG.APP.FISH_EXPORTS.v2'))
        .toBe('fish-exports')
      expect(SmartCodeValidationService.extractIndustryFromAppConfigSmartCode('HERA.PLATFORM.CONFIG.APP.RETAIL.v2'))
        .toBe('retail')
      expect(SmartCodeValidationService.extractIndustryFromAppConfigSmartCode('HERA.PLATFORM.CONFIG.APP.ENTITY.v2'))
        .toBe(null)
      expect(SmartCodeValidationService.extractIndustryFromAppConfigSmartCode('HERA.ACCOUNTING.GL.TXN.v2'))
        .toBe(null)
    })
  })

  describe('Smart Code Generation', () => {
    test('should generate correct ENTITY smart codes', () => {
      expect(SmartCodeValidationService.generateAppConfigSmartCode('ENTITY'))
        .toBe('HERA.PLATFORM.CONFIG.APP.ENTITY.v2')
      
      expect(SmartCodeValidationService.generateAppConfigSmartCode('ENTITY', undefined, 'fish-exports'))
        .toBe('HERA.PLATFORM.CONFIG.APP.FISH_EXPORTS.v2')
    })

    test('should generate correct DATA smart codes', () => {
      expect(SmartCodeValidationService.generateAppConfigSmartCode('DATA'))
        .toBe('HERA.PLATFORM.CONFIG.APP.DATA.DEFINITION.v2')
      
      expect(SmartCodeValidationService.generateAppConfigSmartCode('DATA', 'METADATA'))
        .toBe('HERA.PLATFORM.CONFIG.APP.DATA.METADATA.v2')
    })

    test('should generate correct VALIDATION smart codes', () => {
      expect(SmartCodeValidationService.generateAppConfigSmartCode('VALIDATION'))
        .toBe('HERA.PLATFORM.CONFIG.VALIDATION.SCHEMA.v2')
      
      expect(SmartCodeValidationService.generateAppConfigSmartCode('VALIDATION', 'INDUSTRY'))
        .toBe('HERA.PLATFORM.CONFIG.VALIDATION.INDUSTRY.v2')
    })

    test('should generate correct LOADER smart codes', () => {
      expect(SmartCodeValidationService.generateAppConfigSmartCode('LOADER'))
        .toBe('HERA.PLATFORM.CONFIG.LOADER.DYNAMIC.v2')
      
      expect(SmartCodeValidationService.generateAppConfigSmartCode('LOADER', 'INHERITANCE'))
        .toBe('HERA.PLATFORM.CONFIG.LOADER.INHERITANCE.v2')
    })

    test('should generate correct AUDIT smart codes', () => {
      expect(SmartCodeValidationService.generateAppConfigSmartCode('AUDIT'))
        .toBe('HERA.PLATFORM.CONFIG.AUDIT.CHANGE.v2')
      
      expect(SmartCodeValidationService.generateAppConfigSmartCode('AUDIT', 'DEPLOYMENT'))
        .toBe('HERA.PLATFORM.CONFIG.AUDIT.DEPLOYMENT.v2')
    })

    test('convenience function should generate correct codes', () => {
      expect(generateAppConfigSmartCode('fish-exports', 'entity'))
        .toBe('HERA.PLATFORM.CONFIG.APP.FISH_EXPORTS.v2')
      
      expect(generateAppConfigSmartCode('retail', 'data'))
        .toBe('HERA.PLATFORM.CONFIG.APP.DATA.DEFINITION.v2')
        
      expect(generateAppConfigSmartCode('healthcare', 'validation'))
        .toBe('HERA.PLATFORM.CONFIG.VALIDATION.SCHEMA.v2')
    })
  })

  describe('Validation and Suggestion', () => {
    test('should validate and suggest for CREATE operations', () => {
      const result = SmartCodeValidationService.validateAndSuggestAppConfigSmartCode({
        entityType: 'APP_CONFIG',
        industry: 'fish-exports',
        operationType: 'CREATE'
      })

      expect(result.isValid).toBe(true)
      expect(result.suggestedSmartCode).toBe('HERA.PLATFORM.CONFIG.APP.FISH_EXPORTS.v2')
    })

    test('should validate and suggest for VALIDATE operations', () => {
      const result = SmartCodeValidationService.validateAndSuggestAppConfigSmartCode({
        entityType: 'APP_CONFIG',
        operationType: 'VALIDATE'
      })

      expect(result.isValid).toBe(true)
      expect(result.suggestedSmartCode).toBe('HERA.PLATFORM.CONFIG.VALIDATION.SCHEMA.v2')
    })

    test('should validate and suggest for LOAD operations', () => {
      const result = SmartCodeValidationService.validateAndSuggestAppConfigSmartCode({
        entityType: 'APP_CONFIG',
        operationType: 'LOAD'
      })

      expect(result.isValid).toBe(true)
      expect(result.suggestedSmartCode).toBe('HERA.PLATFORM.CONFIG.LOADER.DYNAMIC.v2')
    })

    test('should validate and suggest for data type operations', () => {
      const result = SmartCodeValidationService.validateAndSuggestAppConfigSmartCode({
        entityType: 'APP_CONFIG',
        dataType: 'NAVIGATION'
      })

      expect(result.isValid).toBe(true)
      expect(result.suggestedSmartCode).toBe('HERA.PLATFORM.CONFIG.APP.DATA.NAVIGATION.v2')
    })
  })

  describe('Batch Validation', () => {
    test('should validate multiple smart codes at once', () => {
      const smartCodes = [
        'HERA.ACCOUNTING.GL.TXN.JOURNAL.v2',
        'HERA.PLATFORM.CONFIG.APP.ENTITY.v2',
        'INVALID.CODE',
        'HERA.PLATFORM.CONFIG.VALIDATION.SCHEMA.v2'
      ]

      const results = SmartCodeValidationService.batchValidateSmartCodes(smartCodes)

      expect(results['HERA.ACCOUNTING.GL.TXN.JOURNAL.v2'].isValid).toBe(true)
      expect(results['HERA.PLATFORM.CONFIG.APP.ENTITY.v2'].isValid).toBe(true)
      expect(results['INVALID.CODE'].isValid).toBe(false)
      expect(results['HERA.PLATFORM.CONFIG.VALIDATION.SCHEMA.v2'].isValid).toBe(true)
    })
  })

  describe('Utility Functions', () => {
    test('isValidSmartCode type guard should work correctly', () => {
      const validResult = validateSmartCode('HERA.PLATFORM.CONFIG.APP.ENTITY.v2')
      const invalidResult = validateSmartCode('INVALID.CODE')

      expect(isValidSmartCode(validResult)).toBe(true)
      expect(isValidSmartCode(invalidResult)).toBe(false)

      if (isValidSmartCode(validResult)) {
        // TypeScript should know this is valid now
        expect(validResult.isValid).toBe(true)
        expect(validResult.domain).toBe('PLATFORM')
      }
    })

    test('should get all APP_CONFIG smart code families', () => {
      const families = SmartCodeValidationService.getAppConfigSmartCodeFamilies()
      
      expect(families).toHaveProperty('ENTITY')
      expect(families).toHaveProperty('DATA_DEFINITION')
      expect(families).toHaveProperty('VALIDATION_SCHEMA')
      expect(families.ENTITY).toBe('HERA.PLATFORM.CONFIG.APP.ENTITY.v2')
    })
  })

  describe('Pattern Definitions', () => {
    test('should have correct pattern definitions', () => {
      expect(SMART_CODE_PATTERNS.ACCOUNTING.domain).toBe('ACCOUNTING')
      expect(SMART_CODE_PATTERNS.ACCOUNTING.minSegments).toBe(5)
      expect(SMART_CODE_PATTERNS.ACCOUNTING.requiredPrefixes).toContain('HERA')
      expect(SMART_CODE_PATTERNS.ACCOUNTING.requiredPrefixes).toContain('ACCOUNTING')

      expect(SMART_CODE_PATTERNS.PLATFORM.domain).toBe('PLATFORM')
      expect(SMART_CODE_PATTERNS.PLATFORM.minSegments).toBe(6)
      expect(SMART_CODE_PATTERNS.PLATFORM.requiredPrefixes).toContain('HERA')
      expect(SMART_CODE_PATTERNS.PLATFORM.requiredPrefixes).toContain('PLATFORM')
      expect(SMART_CODE_PATTERNS.PLATFORM.requiredPrefixes).toContain('CONFIG')
    })

    test('pattern regexes should match their examples', () => {
      for (const pattern of Object.values(SMART_CODE_PATTERNS)) {
        for (const example of pattern.examples) {
          expect(pattern.regex.test(example)).toBe(true)
        }
      }
    })
  })

  describe('Edge Cases', () => {
    test('should handle smart codes with many segments', () => {
      const longCode = 'HERA.PLATFORM.CONFIG.APP.FISH_EXPORTS.LONG.NESTED.COMPLEX.ENTITY.TYPE.v2'
      const result = validateSmartCode(longCode)
      expect(result.isValid).toBe(true)
      expect(result.segments.length).toBe(11)
    })

    test('should handle mixed case input gracefully', () => {
      const result = validateSmartCode('Hera.Platform.Config.App.Entity.v2')
      expect(result.isValid).toBe(false)
      expect(result.errorCode).toBe('INVALID_PREFIX')
    })

    test('should handle smart codes with numbers', () => {
      const result = validateSmartCode('HERA.PLATFORM.CONFIG.APP.TYPE123.v2')
      expect(result.isValid).toBe(false) // Should reject numbers in segments
    })

    test('should handle smart codes with special characters', () => {
      const result = validateSmartCode('HERA.PLATFORM.CONFIG.APP.TYPE@SPECIAL.v2')
      expect(result.isValid).toBe(false) // Should reject special characters
    })
  })
})

describe('Smart Code Integration Tests', () => {
  test('all APP_CONFIG family codes should be valid', () => {
    for (const [familyName, smartCode] of Object.entries(APP_CONFIG_SMART_CODE_FAMILIES)) {
      const result = validateSmartCode(smartCode)
      expect(result.isValid).toBe(true)
      expect(result.domain).toBe('PLATFORM')
    }
  })

  test('generated codes should always be valid', () => {
    const industries = ['fish-exports', 'retail', 'healthcare', 'manufacturing']
    const types: Array<'ENTITY' | 'DATA' | 'VALIDATION' | 'LOADER' | 'AUDIT'> = ['ENTITY', 'DATA', 'VALIDATION', 'LOADER', 'AUDIT']
    
    for (const industry of industries) {
      for (const type of types) {
        const generatedCode = SmartCodeValidationService.generateAppConfigSmartCode(type, undefined, industry)
        const result = validateSmartCode(generatedCode)
        expect(result.isValid).toBe(true)
      }
    }
  })

  test('should handle real-world APP_CONFIG scenarios', () => {
    // Test fish exports configuration
    const fishExportsConfig = SmartCodeValidationService.validateAndSuggestAppConfigSmartCode({
      entityType: 'APP_CONFIG',
      industry: 'fish-exports',
      operationType: 'CREATE'
    })
    expect(fishExportsConfig.isValid).toBe(true)
    expect(fishExportsConfig.suggestedSmartCode).toBe('HERA.PLATFORM.CONFIG.APP.FISH_EXPORTS.v2')

    // Test retail data definition
    const retailDataConfig = SmartCodeValidationService.validateAndSuggestAppConfigSmartCode({
      entityType: 'APP_CONFIG',
      industry: 'retail',
      dataType: 'DEFINITION'
    })
    expect(retailDataConfig.isValid).toBe(true)
    expect(retailDataConfig.suggestedSmartCode).toBe('HERA.PLATFORM.CONFIG.APP.DATA.DEFINITION.v2')

    // Test validation operation
    const validationConfig = SmartCodeValidationService.validateAndSuggestAppConfigSmartCode({
      entityType: 'APP_CONFIG',
      operationType: 'VALIDATE'
    })
    expect(validationConfig.isValid).toBe(true)
    expect(validationConfig.suggestedSmartCode).toBe('HERA.PLATFORM.CONFIG.VALIDATION.SCHEMA.v2')
  })
})