/**
 * Universal COA Generation API Endpoint
 * 
 * RESTful API for generating complete Chart of Accounts implementations
 * for any business type using HERA's universal architecture
 */

import { NextRequest, NextResponse } from 'next/server'
import { UniversalCOAGenerator, quickSetupCOA, generateDemoImplementations, type BusinessRequirements } from '@/lib/universal-coa-generator'
import { universalApi } from '@/lib/universal-api'

// Initialize the COA generator
const coaGenerator = new UniversalCOAGenerator()

/**
 * POST /api/v1/coa/generate
 * Generate complete COA implementation for a business
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.business_name || !body.industry) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: business_name and industry are required'
      }, { status: 400 })
    }

    // Prepare business requirements
    const requirements: BusinessRequirements = {
      business_name: body.business_name,
      industry: body.industry,
      country: body.country || 'usa',
      business_size: body.business_size || 'small',
      special_requirements: body.special_requirements || [],
      existing_system: body.existing_system,
      go_live_date: body.go_live_date
    }

    // Generate the COA
    console.log(`🏗️ Generating COA for ${requirements.business_name} (${requirements.industry})`)
    const generatedCOA = await coaGenerator.generateCOA(requirements)

    // Optionally create the organization and accounts in the database
    if (body.create_in_database) {
      await createCOAInDatabase(generatedCOA)
    }

    return NextResponse.json({
      success: true,
      data: generatedCOA,
      message: `Successfully generated COA for ${requirements.business_name}`,
      summary: {
        organization_id: generatedCOA.organization_id,
        total_accounts: generatedCOA.coa_structure.final_accounts.length,
        posting_rules: generatedCOA.posting_rules.length,
        implementation_steps: generatedCOA.implementation_plan.length,
        validation_status: generatedCOA.validation_results.every(r => r.status !== 'fail') ? 'passed' : 'failed',
        estimated_setup_time: calculateTotalSetupTime(generatedCOA.implementation_plan)
      }
    })

  } catch (error) {
    console.error('COA generation failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate COA',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET /api/v1/coa/generate?type=quick&business_name=X&industry=Y
 * Quick COA setup for common business types
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    if (type === 'quick') {
      const businessName = searchParams.get('business_name')
      const industry = searchParams.get('industry')
      const country = searchParams.get('country') || 'usa'

      if (!businessName || !industry) {
        return NextResponse.json({
          success: false,
          error: 'Missing required parameters: business_name and industry'
        }, { status: 400 })
      }

      console.log(`⚡ Quick COA setup for ${businessName} (${industry})`)
      const coa = await quickSetupCOA(businessName, industry, country)

      return NextResponse.json({
        success: true,
        data: coa,
        message: `Quick COA setup completed for ${businessName}`,
        summary: {
          setup_time: '30 seconds',
          accounts_created: coa.coa_structure.final_accounts.length,
          ready_for_use: true
        }
      })

    } else if (type === 'demo') {
      console.log('🎯 Generating demo implementations for multiple industries')
      const demos = await generateDemoImplementations()

      return NextResponse.json({
        success: true,
        data: demos,
        message: 'Demo implementations generated successfully',
        summary: {
          total_demos: demos.length,
          successful: demos.filter(d => d.status === 'success').length,
          failed: demos.filter(d => d.status === 'error').length
        }
      })

    } else {
      // Return available options
      return NextResponse.json({
        success: true,
        available_endpoints: {
          quick_setup: '/api/v1/coa/generate?type=quick&business_name=X&industry=Y',
          demo_implementations: '/api/v1/coa/generate?type=demo',
          full_generation: 'POST /api/v1/coa/generate with business requirements'
        },
        supported_industries: [
          'restaurant',
          'healthcare', 
          'manufacturing',
          'professional_services',
          'retail'
        ],
        supported_countries: [
          'usa',
          'india'
        ]
      })
    }

  } catch (error) {
    console.error('COA generation request failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process COA generation request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Create the generated COA in the database using HERA's universal architecture
 */
async function createCOAInDatabase(generatedCOA: any) {
  try {
    // Set the organization context
    universalApi.setOrganizationId(generatedCOA.organization_id)

    // 1. Create organization entity
    const organization = await universalApi.createEntity({
      entity_type: 'organization',
      entity_name: generatedCOA.business_info.business_name,
      entity_code: generatedCOA.organization_id,
      smart_code: `HERA.${generatedCOA.business_info.industry.toUpperCase()}.ORG.ENT.v1`,
      status: 'active'
    })

    // 2. Create GL account entities
    const accountPromises = generatedCOA.coa_structure.final_accounts.map(async (account: any) => {
      return universalApi.createEntity({
        entity_type: 'gl_account',
        entity_name: account.name,
        entity_code: account.code,
        smart_code: account.smart_code,
        status: 'active'
      })
    })

    const createdAccounts = await Promise.all(accountPromises)

    // 3. Set dynamic properties for each account
    for (let i = 0; i < createdAccounts.length; i++) {
      const account = generatedCOA.coa_structure.final_accounts[i]
      const createdAccount = createdAccounts[i]
      
      await Promise.all([
        universalApi.setDynamicField(createdAccount.entity_id, 'account_type', account.type),
        universalApi.setDynamicField(createdAccount.entity_id, 'account_subtype', account.subtype),
        universalApi.setDynamicField(createdAccount.entity_id, 'normal_balance', account.normal_balance),
        universalApi.setDynamicField(createdAccount.entity_id, 'required', account.required),
        universalApi.setDynamicField(createdAccount.entity_id, 'description', account.description),
        universalApi.setDynamicField(createdAccount.entity_id, 'industry_specific', account.industry_specific || false)
      ])
    }

    // 4. Create posting rule entities
    for (const rule of generatedCOA.posting_rules) {
      await universalApi.createEntity({
        entity_type: 'posting_rule',
        entity_name: rule.rule_id,
        entity_code: rule.rule_id,
        smart_code: rule.smart_code_pattern,
        status: 'active'
      })
    }

    console.log(`✅ Successfully created COA in database for ${generatedCOA.business_info.business_name}`)
    console.log(`   - Organization: ${organization.entity_id}`)
    console.log(`   - GL Accounts: ${createdAccounts.length}`)
    console.log(`   - Posting Rules: ${generatedCOA.posting_rules.length}`)

  } catch (error) {
    console.error('Failed to create COA in database:', error)
    throw error
  }
}

/**
 * Calculate total estimated setup time from implementation plan
 */
function calculateTotalSetupTime(implementationPlan: any[]): string {
  // Convert time estimates to hours for calculation
  let totalMinutes = 0
  
  implementationPlan.forEach(step => {
    const timeStr = step.estimated_time.toLowerCase()
    if (timeStr.includes('minute')) {
      totalMinutes += parseInt(timeStr) || 0
    } else if (timeStr.includes('hour')) {
      totalMinutes += (parseInt(timeStr) || 0) * 60
    } else if (timeStr.includes('day')) {
      totalMinutes += (parseInt(timeStr) || 0) * 480 // 8 hour work day
    }
  })

  // Convert back to human readable format
  if (totalMinutes < 60) {
    return `${totalMinutes} minutes`
  } else if (totalMinutes < 480) {
    const hours = Math.round(totalMinutes / 60 * 10) / 10
    return `${hours} hours`
  } else {
    const days = Math.round(totalMinutes / 480 * 10) / 10
    return `${days} days`
  }
}