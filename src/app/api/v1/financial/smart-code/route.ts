import { NextRequest, NextResponse } from 'next/server'
import { financialSmartCode } from '@/src/services/FinancialSmartCodeService'

/**
 * Financial Smart Code API - HERA Smart Code Integration for Financial Module
 *
 * Endpoints:
 * - POST: Generate smart codes for financial entities/transactions
 * - GET: Search and validate financial smart codes
 *
 * Smart Code Pattern: HERA.FIN.{SUB}.{FUNCTION}.{TYPE}.{VERSION}
 */

// POST /api/v1/financial/smart-code - Generate Financial Smart Code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'generate'

    switch (action) {
      case 'generate':
        return await handleGenerateSmartCode(body)

      case 'validate':
        return await handleValidateSmartCode(body)

      case 'business_rules':
        return await handleGetBusinessRules(body)

      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Financial Smart Code API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// Handle smart code generation
async function handleGenerateSmartCode(body: any) {
  const { organizationId, businessContext, description, existingCode } = body

  // Validation
  if (!organizationId || !businessContext) {
    return NextResponse.json(
      { success: false, message: 'Missing required fields: organizationId, businessContext' },
      { status: 400 }
    )
  }

  console.log('🧬 Generating Financial Smart Code via API:', businessContext)

  try {
    const result = await financialSmartCode.generateSmartCode({
      organizationId,
      businessContext: {
        ...businessContext,
        module: 'FIN' // Ensure it's always FIN
      },
      description,
      existingCode
    })

    return NextResponse.json({
      success: true,
      data: {
        generatedSmartCode: result.generatedSmartCode,
        metadata: result.metadata,
        similarCodes: result.similarCodes,
        validation: result.validation,
        smartCodePrinciple:
          'HERA Smart Code: Intelligent business logic embedded in every transaction'
      },
      message: 'Financial Smart Code generated successfully'
    })
  } catch (error) {
    console.error('❌ Failed to generate Financial Smart Code:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }
}

// Handle smart code validation
async function handleValidateSmartCode(body: any) {
  const { smartCode, organizationId, validationLevel = 'L4_INTEGRATION' } = body

  if (!smartCode || !organizationId) {
    return NextResponse.json(
      { success: false, message: 'Missing required fields: smartCode, organizationId' },
      { status: 400 }
    )
  }

  console.log('🔍 Validating Financial Smart Code:', smartCode, 'Level:', validationLevel)

  try {
    const validation = await financialSmartCode.validateSmartCode(
      smartCode,
      organizationId,
      validationLevel
    )

    return NextResponse.json({
      success: true,
      data: {
        smartCode,
        validation,
        validationLevel,
        recommendations: validation.suggestions,
        businessRules: validation.businessRules
      },
      message: `Smart code validation completed at ${validationLevel} level`
    })
  } catch (error) {
    console.error('❌ Smart code validation failed:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }
}

// Handle business rules retrieval
async function handleGetBusinessRules(body: any) {
  const { smartCode } = body

  if (!smartCode) {
    return NextResponse.json(
      { success: false, message: 'Missing required field: smartCode' },
      { status: 400 }
    )
  }

  try {
    const businessRules = await financialSmartCode.getBusinessRules(smartCode)

    return NextResponse.json({
      success: true,
      data: {
        smartCode,
        businessRules: businessRules.rules,
        compliance: businessRules.compliance,
        totalRules: businessRules.rules.length,
        requiredRules: businessRules.rules.filter(r => r.required).length
      },
      message: 'Business rules retrieved successfully'
    })
  } catch (error) {
    console.error('❌ Failed to get business rules:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }
}

// GET /api/v1/financial/smart-code - Search Financial Smart Codes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'search'
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: 'Organization ID is required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'search':
        return await handleSearchSmartCodes(searchParams)

      case 'templates':
        return await handleGetSystemTemplates(searchParams)

      case 'analytics':
        return await handleGetSmartCodeAnalytics(searchParams)

      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Financial Smart Code GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// Handle smart code search
async function handleSearchSmartCodes(searchParams: URLSearchParams) {
  const organizationId = searchParams.get('organization_id')!
  const pattern = searchParams.get('pattern') || 'HERA.FIN.%.%.%.%'
  const subModule = searchParams.get('sub_module')
  const functionType = searchParams.get('function_type')
  const entityType = searchParams.get('entity_type')
  const includeSystem = searchParams.get('include_system') === 'true'

  console.log('🔍 Searching Financial Smart Codes:', pattern)

  try {
    const result = await financialSmartCode.searchSmartCodes(organizationId, pattern, {
      subModule: subModule as any,
      functionType: functionType as any,
      entityType,
      includeSystem
    })

    return NextResponse.json({
      success: true,
      data: {
        codes: result.codes,
        totalCount: result.totalCount,
        searchTime: result.searchTime,
        searchPattern: pattern,
        filters: {
          subModule,
          functionType,
          entityType,
          includeSystem
        }
      },
      message: `Found ${result.totalCount} financial smart codes in ${result.searchTime}ms`
    })
  } catch (error) {
    console.error('❌ Smart code search failed:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }
}

// Handle system templates retrieval
async function handleGetSystemTemplates(searchParams: URLSearchParams) {
  const organizationId = searchParams.get('organization_id')!

  try {
    // Get system-level financial smart codes (templates)
    const result = await financialSmartCode.searchSmartCodes(
      '719dfed1-09b4-4ca8-bfda-f682460de945', // HERA System Organization
      'HERA.FIN.%.%.%.%',
      { includeSystem: true }
    )

    // Group by sub-module
    const groupedTemplates = result.codes.reduce(
      (acc, code) => {
        if (!acc[code.subModule]) {
          acc[code.subModule] = []
        }
        acc[code.subModule].push(code)
        return acc
      },
      {} as Record<string, typeof result.codes>
    )

    return NextResponse.json({
      success: true,
      data: {
        templates: groupedTemplates,
        totalTemplates: result.totalCount,
        subModules: Object.keys(groupedTemplates),
        systemPrinciple: 'HERA System Templates: Pre-built smart codes for rapid implementation'
      },
      message: `Found ${result.totalCount} system templates`
    })
  } catch (error) {
    console.error('❌ Failed to get system templates:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }
}

// Handle smart code analytics
async function handleGetSmartCodeAnalytics(searchParams: URLSearchParams) {
  const organizationId = searchParams.get('organization_id')!

  try {
    // Get all financial smart codes for the organization
    const result = await financialSmartCode.searchSmartCodes(organizationId, 'HERA.FIN.%.%.%.%')

    // Calculate analytics
    const analytics = {
      totalCodes: result.totalCount,
      bySubModule: {} as Record<string, number>,
      byFunctionType: {} as Record<string, number>,
      byEntityType: {} as Record<string, number>,
      recentActivity: result.codes.slice(0, 10), // Most recent 10
      systemAdoption: {
        usingSmartCodes: result.totalCount > 0,
        adoptionRate: result.totalCount > 0 ? 100 : 0, // Simplified
        recommendedCodes: []
      }
    }

    // Group analytics
    result.codes.forEach(code => {
      analytics.bySubModule[code.subModule] = (analytics.bySubModule[code.subModule] || 0) + 1
      analytics.byFunctionType[code.functionType] =
        (analytics.byFunctionType[code.functionType] || 0) + 1
      analytics.byEntityType[code.entityType] = (analytics.byEntityType[code.entityType] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        searchTime: result.searchTime,
        generatedAt: new Date().toISOString(),
        insights: [
          `Most used sub-module: ${Object.keys(analytics.bySubModule)[0] || 'None'}`,
          `Most used function type: ${Object.keys(analytics.byFunctionType)[0] || 'None'}`,
          `Smart code adoption: ${analytics.systemAdoption.adoptionRate}%`
        ]
      },
      message: 'Smart code analytics generated successfully'
    })
  } catch (error) {
    console.error('❌ Failed to generate analytics:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 400 })
  }
}
