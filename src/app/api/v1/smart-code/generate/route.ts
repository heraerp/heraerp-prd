import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

interface SmartCodeGenerationRequest {
  organization_id: string
  business_context: {
    industry: 'restaurant' | 'healthcare' | 'manufacturing' | 'professional' | 'retail' | 'legal' | 'education' | 'system'
    module: string
    sub_module: string
    function_type: string
    entity_type: string
    business_description?: string
  }
  options?: {
    version?: number
    auto_validate?: boolean
    validation_level?: 'L1_SYNTAX' | 'L2_SEMANTIC' | 'L3_PERFORMANCE' | 'L4_INTEGRATION'
  }
}

interface SmartCodeGenerationResponse {
  generated_smart_code: string
  is_valid: boolean
  validation_results?: any
  metadata: {
    industry: string
    module: string
    sub_module: string
    function_type: string
    entity_type: string
    version: string
    generated_at: string
    organization_id: string
  }
  suggestions: string[]
  similar_codes?: string[]
}

// Industry to module mapping
const INDUSTRY_MODULE_MAP: Record<string, string> = {
  'restaurant': 'REST',
  'healthcare': 'HLTH', 
  'manufacturing': 'MFG',
  'professional': 'PROF',
  'retail': 'RETAIL',
  'legal': 'LEGAL',
  'education': 'EDU',
  'system': 'SYSTEM'
}

// Common business context mappings
const BUSINESS_CONTEXT_MAP: Record<string, { sub_module: string; function_type: string; entity_type: string }> = {
  // Restaurant contexts
  'menu_item_management': { sub_module: 'CRM', function_type: 'ENT', entity_type: 'PRODUCT' },
  'customer_orders': { sub_module: 'CRM', function_type: 'TXN', entity_type: 'ORDER' },
  'payment_processing': { sub_module: 'FIN', function_type: 'TXN', entity_type: 'PAYMENT' },
  'inventory_tracking': { sub_module: 'INV', function_type: 'TXN', entity_type: 'ADJ' },
  'food_costing': { sub_module: 'FIN', function_type: 'CALC', entity_type: 'BOM' },
  
  // Healthcare contexts
  'patient_management': { sub_module: 'CRM', function_type: 'ENT', entity_type: 'CUSTOMER' },
  'treatment_records': { sub_module: 'CRM', function_type: 'TXN', entity_type: 'TREATMENT' },
  'insurance_billing': { sub_module: 'FIN', function_type: 'TXN', entity_type: 'BILLING' },
  'appointment_scheduling': { sub_module: 'CRM', function_type: 'TXN', entity_type: 'APPOINTMENT' },
  
  // Manufacturing contexts
  'bom_management': { sub_module: 'INV', function_type: 'ENT', entity_type: 'BOM' },
  'work_orders': { sub_module: 'MFG', function_type: 'TXN', entity_type: 'WORK_ORDER' },
  'quality_control': { sub_module: 'QC', function_type: 'TXN', entity_type: 'INSPECTION' },
  'cost_rollup': { sub_module: 'FIN', function_type: 'CALC', entity_type: 'COST' },
  
  // System contexts
  'template_management': { sub_module: 'TEMPLATE', function_type: 'ENT', entity_type: 'TEMP' },
  'dag_calculation': { sub_module: 'ENGINE', function_type: 'CALC', entity_type: 'DAG_CALC' },
  'validation_engine': { sub_module: 'ENGINE', function_type: 'VAL', entity_type: 'VALIDATION' },
  'industry_adapter': { sub_module: 'ADAPTER', function_type: 'ENT', entity_type: 'RESTAURANT' }
}

function generateSmartCode(request: SmartCodeGenerationRequest): string {
  const { business_context, options } = request
  const { industry, module, sub_module, function_type, entity_type } = business_context
  
  const industryModule = INDUSTRY_MODULE_MAP[industry] || module.toUpperCase()
  const version = options?.version || 1
  
  return `HERA.${industryModule}.${sub_module.toUpperCase()}.${function_type.toUpperCase()}.${entity_type.toUpperCase()}.v${version}`
}

async function findSimilarCodes(smartCode: string, organizationId: string): Promise<string[]> {
  try {
    const parts = smartCode.split('.')
    const module = parts[1]
    const subModule = parts[2]
    
    const { data: similarCodes } = await supabase
      .from('core_entities')
      .select('smart_code')
      .eq('organization_id', organizationId)
      .ilike('smart_code', `HERA.${module}.${subModule}%`)
      .neq('smart_code', smartCode)
      .limit(5)
    
    return similarCodes?.map(item => item.smart_code) || []
  } catch (error) {
    console.error('Error finding similar codes:', error)
    return []
  }
}

async function validateGeneratedCode(smartCode: string, organizationId: string, validationLevel: string): Promise<any> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/smart-code/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        smart_code: smartCode,
        validation_level: validationLevel,
        organization_id: organizationId
      })
    })
    
    return await response.json()
  } catch (error) {
    console.error('Error validating generated code:', error)
    return { is_valid: false, errors: ['Failed to validate generated code'] }
  }
}

function generateSuggestions(request: SmartCodeGenerationRequest, generatedCode: string): string[] {
  const suggestions: string[] = []
  const { business_context } = request
  
  // Industry-specific suggestions
  switch (business_context.industry) {
    case 'restaurant':
      suggestions.push('Consider using HERA.REST.INV.TXN.RCV.v1 for inventory receiving')
      suggestions.push('Use HERA.REST.FIN.CALC.BOM.v1 for recipe costing')
      break
    case 'healthcare':
      suggestions.push('Consider HERA.HLTH.CRM.ENT.PAT.v1 for patient records')
      suggestions.push('Use HERA.HLTH.FIN.TXN.CLM.v1 for insurance claims')
      break
    case 'manufacturing':
      suggestions.push('Consider HERA.MFG.INV.ENT.BOM.v1 for bill of materials')
      suggestions.push('Use HERA.MFG.FIN.CALC.COST.v1 for cost calculations')
      break
    case 'system':
      suggestions.push('System codes require HERA System Organization (719dfed1-09b4-4ca8-bfda-f682460de945)')
      suggestions.push('Consider versioning strategy for system templates')
      break
  }
  
  // Context-based suggestions
  if (business_context.function_type === 'TXN') {
    suggestions.push('Transaction codes should have corresponding line item codes')
  }
  
  if (business_context.function_type === 'CALC') {
    suggestions.push('Calculation codes may require DAG engine dependencies')
  }
  
  suggestions.push(`Generated code: ${generatedCode}`)
  suggestions.push('Validate with higher levels (L3/L4) for production use')
  
  return suggestions
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    const body: SmartCodeGenerationRequest = await request.json()
    const { organization_id, business_context, options = {} } = body

    // Validate required fields
    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    if (!business_context.industry || !business_context.module) {
      return NextResponse.json(
        { error: 'business_context.industry and business_context.module are required' },
        { status: 400 }
      )
    }

    // Auto-detect context if business_description is provided
    let finalContext = business_context
    if (business_context.business_description) {
      const description = business_context.business_description.toLowerCase()
      
      for (const [context, mapping] of Object.entries(BUSINESS_CONTEXT_MAP)) {
        if (description.includes(context.replace('_', ' '))) {
          finalContext = {
            ...business_context,
            sub_module: business_context.sub_module || mapping.sub_module,
            function_type: business_context.function_type || mapping.function_type,
            entity_type: business_context.entity_type || mapping.entity_type
          }
          break
        }
      }
    }

    // Generate the smart code
    const generatedSmartCode = generateSmartCode({
      ...body,
      business_context: finalContext
    })

    // Find similar codes
    const similarCodes = await findSimilarCodes(generatedSmartCode, organization_id)

    // Auto-validate if requested
    let validationResults = undefined
    let isValid = true
    
    if (options.auto_validate !== false) {
      const validationLevel = options.validation_level || 'L2_SEMANTIC'
      validationResults = await validateGeneratedCode(generatedSmartCode, organization_id, validationLevel)
      isValid = validationResults.is_valid
    }

    // Generate suggestions
    const suggestions = generateSuggestions(body, generatedSmartCode)

    const response: SmartCodeGenerationResponse = {
      generated_smart_code: generatedSmartCode,
      is_valid: isValid,
      validation_results: validationResults,
      metadata: {
        industry: finalContext.industry,
        module: INDUSTRY_MODULE_MAP[finalContext.industry] || finalContext.module,
        sub_module: finalContext.sub_module,
        function_type: finalContext.function_type,
        entity_type: finalContext.entity_type,
        version: `v${options.version || 1}`,
        generated_at: new Date().toISOString(),
        organization_id
      },
      suggestions,
      similar_codes: similarCodes.length > 0 ? similarCodes : undefined
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Smart code generation error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error during generation',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()

  return NextResponse.json({
    endpoint: '/api/v1/smart-code/generate',
    description: 'HERA Smart Code Generation System',
    supported_industries: Object.keys(INDUSTRY_MODULE_MAP),
    business_contexts: Object.keys(BUSINESS_CONTEXT_MAP),
    example_request: {
      organization_id: 'uuid-here',
      business_context: {
        industry: 'restaurant',
        module: 'REST',
        sub_module: 'CRM',
        function_type: 'TXN',
        entity_type: 'ORDER',
        business_description: 'customer order processing'
      },
      options: {
        version: 1,
        auto_validate: true,
        validation_level: 'L2_SEMANTIC'
      }
    },
    example_response: {
      generated_smart_code: 'HERA.REST.CRM.TXN.ORDER.v1',
      is_valid: true,
      metadata: {
        industry: 'restaurant',
        module: 'REST',
        generated_at: '2025-07-31T12:00:00Z'
      },
      suggestions: [
        'Generated code: HERA.REST.CRM.TXN.ORDER.v1',
        'Consider using HERA.REST.INV.TXN.RCV.v1 for inventory receiving'
      ]
    }
  })
}