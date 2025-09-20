import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface SmartCodeValidationRequest {
  smart_code: string
  validation_level?: 'L1_SYNTAX' | 'L2_SEMANTIC' | 'L3_PERFORMANCE' | 'L4_INTEGRATION'
  organization_id?: string
}

interface SmartCodeValidationResponse {
  is_valid: boolean
  validation_level: string
  smart_code: string
  errors: string[]
  warnings: string[]
  suggestions: string[]
  performance_metrics?: {
    validation_time_ms: number
    complexity_score: number
  }
  metadata?: {
    module: string
    sub_module: string
    function_type: string
    entity_type: string
    version: string
  }
}

// Smart code format: HERA.{MODULE}.{SUB}.{FUNCTION}.{TYPE}.{VERSION}
const SMART_CODE_PATTERN =
  /^HERA\.([A-Z]{2,6})\.([A-Z]{2,6})\.([A-Z]{2,6})\.([A-Z]{2,6})\.v([0-9]+)$/

// Valid modules from HERA system
const VALID_MODULES = [
  'FIN',
  'INV',
  'CRM',
  'HR',
  'SCM',
  'SLS',
  'PROJ',
  'REPT',
  'AUDT',
  'AI',
  'REST',
  'HLTH',
  'MFG',
  'PROF',
  'SYSTEM',
  'LEGAL',
  'EDU',
  'RETAIL'
]

const VALID_SUB_MODULES = [
  'GL',
  'AR',
  'AP',
  'FA',
  'RCV',
  'ISS',
  'ADJ',
  'VAL',
  'CUS',
  'VEN',
  'LEA',
  'PAY',
  'BEN',
  'ATT',
  'PUR',
  'ORD',
  'SHP',
  'QTY',
  'OPP',
  'QUO',
  'TSK',
  'MIL',
  'FIN',
  'OPR',
  'SAL',
  'AUD',
  'RPT',
  'AI',
  'ML',
  'TEMPLATE',
  'ENGINE',
  'ADAPTER',
  'IMPL',
  'ENT',
  'TXN',
  'DAG',
  'VAL'
]

const VALID_FUNCTIONS = [
  'ENT',
  'TXN',
  'RPT',
  'VAL',
  'CFG',
  'API',
  'UI',
  'DAG',
  'ML',
  'AI',
  'CALC',
  'PROC',
  'FLOW',
  'RULE',
  'TEMP',
  'IMPL',
  'TEST',
  'DOC'
]

const VALID_TYPES = [
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'LIST',
  'SEARCH',
  'CALC',
  'PROC',
  'VAL',
  'CFG',
  'SYNC',
  'BATCH',
  'REAL',
  'SCHED',
  'TEMP',
  'BOM',
  'PRC',
  'HEALTH',
  'REST',
  'MFG',
  'ORDER',
  'PAYMENT',
  'CUSTOMER',
  'PRODUCT',
  'FRAMEWORK',
  'DAG_CALC',
  'VALIDATION',
  'RESTAURANT',
  'MANUFACTURING'
]

function validateL1Syntax(smartCode: string): { valid: boolean; errors: string[]; metadata?: any } {
  const errors: string[] = []

  if (!smartCode) {
    errors.push('Smart code is required')
    return { valid: false, errors }
  }

  const match = smartCode.match(SMART_CODE_PATTERN)
  if (!match) {
    errors.push(
      'Invalid smart code format. Expected: HERA.{MODULE}.{SUB}.{FUNCTION}.{TYPE}.{VERSION}'
    )
    return { valid: false, errors }
  }

  const [, module, subModule, functionType, entityType, version] = match

  if (!VALID_MODULES.includes(module)) {
    errors.push(`Invalid module '${module}'. Valid modules: ${VALID_MODULES.join(', ')}`)
  }

  if (!VALID_SUB_MODULES.includes(subModule)) {
    errors.push(
      `Invalid sub-module '${subModule}'. Valid sub-modules: ${VALID_SUB_MODULES.join(', ')}`
    )
  }

  if (!VALID_FUNCTIONS.includes(functionType)) {
    errors.push(
      `Invalid function type '${functionType}'. Valid functions: ${VALID_FUNCTIONS.join(', ')}`
    )
  }

  if (!VALID_TYPES.includes(entityType)) {
    errors.push(`Invalid entity type '${entityType}'. Valid types: ${VALID_TYPES.join(', ')}`)
  }

  const versionNum = parseInt(version)
  if (versionNum < 1 || versionNum > 999) {
    errors.push('Version must be between v1 and v999')
  }

  return {
    valid: errors.length === 0,
    errors,
    metadata:
      errors.length === 0
        ? {
            module,
            sub_module: subModule,
            function_type: functionType,
            entity_type: entityType,
            version: `v${version}`
          }
        : undefined
  }
}

async function validateL2Semantic(
  smartCode: string,
  organizationId?: string
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Check if smart code already exists in the organization
    if (organizationId) {
      const { data: existingCodes } = await supabase
        .from('core_entities')
        .select('smart_code, entity_name')
        .eq('organization_id', organizationId)
        .eq('smart_code', smartCode)

      if (existingCodes && existingCodes.length > 0) {
        warnings.push(`Smart code already exists in organization: ${existingCodes[0].entity_name}`)
      }
    }

    // Check for business logic consistency
    const parts = smartCode.split('.')
    if (parts.length >= 5) {
      const module = parts[1]
      const subModule = parts[2]
      const functionType = parts[3]

      // Validate module and sub-module compatibility
      const moduleSubModuleRules: Record<string, string[]> = {
        REST: ['CRM', 'INV', 'FIN', 'GL', 'REPT'],
        HLTH: ['CRM', 'PAT', 'TRT', 'BIL', 'SCH'],
        MFG: ['INV', 'BOM', 'RTG', 'WO', 'QC'],
        FIN: ['GL', 'AR', 'AP', 'FA', 'RPT'],
        SYSTEM: ['TEMPLATE', 'ENGINE', 'ADAPTER', 'IMPL']
      }

      if (moduleSubModuleRules[module] && !moduleSubModuleRules[module].includes(subModule)) {
        warnings.push(`Sub-module '${subModule}' is uncommon for module '${module}'`)
      }

      // Validate function type compatibility
      if (functionType === 'TXN' && !['CREATE', 'UPDATE', 'PROC', 'CALC'].includes(parts[4])) {
        warnings.push(`Entity type '${parts[4]}' may not be suitable for transaction functions`)
      }
    }
  } catch (error) {
    errors.push('Error during semantic validation: ' + (error as Error).message)
  }

  return { valid: errors.length === 0, errors, warnings }
}

function validateL3Performance(smartCode: string): {
  valid: boolean
  errors: string[]
  warnings: string[]
  metrics: any
} {
  const errors: string[] = []
  const warnings: string[] = []
  const startTime = Date.now()

  // Performance validation rules
  const complexityScore = smartCode.length + smartCode.split('.').length * 2

  if (smartCode.length > 100) {
    warnings.push('Smart code length exceeds recommended 100 characters')
  }

  if (smartCode.split('.').length > 6) {
    warnings.push('Smart code has too many segments, may impact performance')
  }

  // Check for performance anti-patterns
  if (smartCode.includes('BATCH') && smartCode.includes('REAL')) {
    warnings.push('Combining BATCH and REAL-time operations may cause performance issues')
  }

  const validationTime = Date.now() - startTime

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      validation_time_ms: validationTime,
      complexity_score: complexityScore,
      recommended_cache_ttl: complexityScore > 50 ? 300 : 600,
      estimated_execution_time_ms: complexityScore * 2
    }
  }
}

async function validateL4Integration(
  smartCode: string,
  organizationId?: string
): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // Check for integration dependencies
    const parts = smartCode.split('.')

    if (parts.length >= 5) {
      const module = parts[1]
      const functionType = parts[3]

      // Check if required system components exist
      if (module === 'SYSTEM') {
        // Validate system-level integrations
        if (organizationId) {
          const { data: systemComponents } = await supabase
            .from('core_entities')
            .select('smart_code')
            .eq('organization_id', '719dfed1-09b4-4ca8-bfda-f682460de945') // HERA System Org
            .ilike('smart_code', 'HERA.SYSTEM.%')

          if (!systemComponents || systemComponents.length === 0) {
            warnings.push('No system components found in HERA System Organization')
          }
        }
      }

      // Check for API endpoint availability
      if (functionType === 'API') {
        warnings.push('API endpoints require separate validation of actual endpoint availability')
      }

      // Check for DAG calculation dependencies
      if (smartCode.includes('DAG') || smartCode.includes('CALC')) {
        if (organizationId) {
          const { data: dagEngine } = await supabase
            .from('core_entities')
            .select('smart_code')
            .eq('organization_id', '719dfed1-09b4-4ca8-bfda-f682460de945')
            .eq('entity_code', 'ENGINE-DAG-UNI-001')

          if (!dagEngine || dagEngine.length === 0) {
            errors.push('DAG calculation engine not found in system organization')
          }
        }
      }
    }
  } catch (error) {
    errors.push('Error during integration validation: ' + (error as Error).message)
  }

  return { valid: errors.length === 0, errors, warnings }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body: SmartCodeValidationRequest = await request.json()
    const { smart_code, validation_level = 'L2_SEMANTIC', organization_id } = body

    const startTime = Date.now()
    let response: SmartCodeValidationResponse = {
      is_valid: false,
      validation_level,
      smart_code,
      errors: [],
      warnings: [],
      suggestions: []
    }

    // L1 Syntax Validation (always required)
    const l1Result = validateL1Syntax(smart_code)
    response.errors.push(...l1Result.errors)
    response.metadata = l1Result.metadata

    if (!l1Result.valid) {
      response.suggestions.push('Fix syntax errors before proceeding to semantic validation')
      return NextResponse.json(response, { status: 400 })
    }

    // L2 Semantic Validation
    if (
      validation_level === 'L2_SEMANTIC' ||
      validation_level === 'L3_PERFORMANCE' ||
      validation_level === 'L4_INTEGRATION'
    ) {
      const l2Result = await validateL2Semantic(smart_code, organization_id)
      response.errors.push(...l2Result.errors)
      response.warnings.push(...l2Result.warnings)

      if (!l2Result.valid) {
        response.suggestions.push('Review business logic and module compatibility')
        return NextResponse.json(response, { status: 400 })
      }
    }

    // L3 Performance Validation
    if (validation_level === 'L3_PERFORMANCE' || validation_level === 'L4_INTEGRATION') {
      const l3Result = validateL3Performance(smart_code)
      response.errors.push(...l3Result.errors)
      response.warnings.push(...l3Result.warnings)
      response.performance_metrics = l3Result.metrics

      if (!l3Result.valid) {
        response.suggestions.push('Optimize smart code for better performance')
        return NextResponse.json(response, { status: 400 })
      }
    }

    // L4 Integration Validation
    if (validation_level === 'L4_INTEGRATION') {
      const l4Result = await validateL4Integration(smart_code, organization_id)
      response.errors.push(...l4Result.errors)
      response.warnings.push(...l4Result.warnings)

      if (!l4Result.valid) {
        response.suggestions.push(
          'Ensure all required system components and dependencies are available'
        )
        return NextResponse.json(response, { status: 400 })
      }
    }

    // If we get here, validation passed
    response.is_valid = true
    response.performance_metrics = {
      ...response.performance_metrics,
      validation_time_ms: Date.now() - startTime
    }

    if (response.warnings.length === 0) {
      response.suggestions.push('Smart code validation passed successfully')
    } else {
      response.suggestions.push(
        'Smart code is valid but consider addressing warnings for optimal performance'
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Smart code validation error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error during validation',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()

  return NextResponse.json({
    endpoint: '/api/v1/smart-code/validate',
    description: 'HERA Smart Code 4-Level Validation System',
    validation_levels: [
      {
        level: 'L1_SYNTAX',
        description: 'Format and syntax validation',
        target_time: '<10ms'
      },
      {
        level: 'L2_SEMANTIC',
        description: 'Business logic and semantic validation',
        target_time: '<50ms'
      },
      {
        level: 'L3_PERFORMANCE',
        description: 'Performance and efficiency validation',
        target_time: '<100ms'
      },
      {
        level: 'L4_INTEGRATION',
        description: 'Cross-system integration validation',
        target_time: '<200ms'
      }
    ],
    example_request: {
      smart_code: 'HERA.REST.CRM.TXN.ORDER.V1',
      validation_level: 'L2_SEMANTIC',
      organization_id: 'optional-uuid'
    }
  })
}
