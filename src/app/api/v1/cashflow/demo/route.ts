// ================================================================================
// HERA CASHFLOW DEMO API ENDPOINT
// Setup and manage demo data for cashflow testing
// Smart Code: HERA.API.CF.DEMO.ROUTE.v1
// ================================================================================

import { NextRequest, NextResponse } from 'next/server'
import { setupHairSalonCashflowDemo, CashflowDemoDataGenerator } from '@/lib/cashflow/demo-data-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, organization_id } = body

    if (!organization_id) {
      return NextResponse.json({
        success: false,
        error: 'organization_id is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'setup_hair_salon_demo':
        return await handleSetupHairSalonDemo(body)
        
      case 'generate_demo_data':
        return await handleGenerateDemoData(body)
        
      case 'create_scenario':
        return await handleCreateScenario(body)
        
      case 'setup_gl_accounts':
        return await handleSetupGLAccounts(body)

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: setup_hair_salon_demo, generate_demo_data, create_scenario, setup_gl_accounts'
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Cashflow demo API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// ================================================================================
// REQUEST HANDLERS
// ================================================================================

async function handleSetupHairSalonDemo(body: any) {
  const { organization_id } = body

  console.log(`🎭 Setting up complete Hair Talkz demo for org: ${organization_id}`)

  const result = await setupHairSalonCashflowDemo(organization_id)

  return NextResponse.json({
    success: true,
    data: result,
    message: 'Hair Talkz cashflow demo setup completed successfully',
    demo_info: {
      business_name: 'Hair Talkz Salon',
      industry: 'salon',
      demo_duration: '6 months',
      features_demonstrated: [
        'Direct and indirect cashflow statements',
        'Operating, investing, and financing activities',
        'Seasonal business patterns',
        'Equipment purchases and financing',
        'Staff management cashflow impact',
        'Industry benchmarking',
        'Multi-currency support (AED)',
        'Real-time cashflow forecasting'
      ]
    }
  })
}

async function handleGenerateDemoData(body: any) {
  const { 
    organization_id, 
    months = 6,
    business_type = 'salon'
  } = body

  const generator = new CashflowDemoDataGenerator(organization_id)
  
  let result
  
  if (business_type === 'salon') {
    result = await generator.generateHairSalonDemoData(months)
  } else {
    return NextResponse.json({
      success: false,
      error: `Demo data generation for ${business_type} not yet implemented`
    }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    data: result,
    message: `Demo data generated for ${months} months`
  })
}

async function handleCreateScenario(body: any) {
  const { 
    organization_id, 
    scenario_type,
    description 
  } = body

  if (!scenario_type) {
    return NextResponse.json({
      success: false,
      error: 'scenario_type is required. Options: peak_season, slow_season, equipment_purchase, new_stylist'
    }, { status: 400 })
  }

  const generator = new CashflowDemoDataGenerator(organization_id)
  const result = await generator.createScenarioTransactions(scenario_type)

  return NextResponse.json({
    success: true,
    data: result,
    message: `${scenario_type} scenario created successfully`
  })
}

async function handleSetupGLAccounts(body: any) {
  const { organization_id } = body

  const generator = new CashflowDemoDataGenerator(organization_id)
  const result = await generator.setupHairSalonGLAccounts()

  return NextResponse.json({
    success: true,
    data: result,
    message: 'GL accounts setup completed successfully'
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'demo_info':
        return NextResponse.json({
          success: true,
          data: {
            available_demos: [
              {
                business_type: 'salon',
                name: 'Hair Talkz Salon',
                description: 'Complete hair salon with seasonal patterns, equipment purchases, and staff management',
                duration: '6 months',
                transactions: '800+',
                scenarios: ['peak_season', 'slow_season', 'equipment_purchase', 'new_stylist']
              }
            ],
            demo_features: [
              'Realistic transaction volumes and amounts',
              'Industry-specific seasonal patterns',
              'Equipment financing scenarios',
              'Staff management cashflow impacts',
              'Operating, investing, and financing activities',
              'Direct and indirect cashflow methods',
              'Multi-currency support',
              'Industry benchmarking data'
            ]
          },
          message: 'Demo information retrieved successfully'
        })

      case 'scenario_options':
        return NextResponse.json({
          success: true,
          data: {
            scenarios: [
              {
                type: 'peak_season',
                name: 'Peak Season',
                description: 'Wedding and prom season with higher service revenue and product sales',
                impact: 'Positive cashflow, increased inventory purchases'
              },
              {
                type: 'slow_season',
                name: 'Slow Season',
                description: 'Post-holiday quiet period with promotional campaigns',
                impact: 'Reduced revenue, increased marketing spend'
              },
              {
                type: 'equipment_purchase',
                name: 'Equipment Purchase',
                description: 'Major equipment purchase with financing',
                impact: 'Investing activity, loan proceeds, monthly payments'
              },
              {
                type: 'new_stylist',
                name: 'New Stylist',
                description: 'Hiring additional stylist with recruitment and equipment costs',
                impact: 'Initial outflow, increased revenue potential'
              }
            ]
          },
          message: 'Scenario options retrieved successfully'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: demo_info, scenario_options'
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Cashflow demo GET error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 })
  }
}