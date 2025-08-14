'use server'

import { NextRequest, NextResponse } from 'next/server'
import { getHeraAPI } from '@/lib/hera-api'

/**
 * HERA Partner Registration API
 * Smart Code: HERA.PAR.REG.ENT.REGISTRATION.v1
 * 
 * META BREAKTHROUGH: Using HERA to manage HERA's own partner system
 * Partners are entities in core_entities with specialized metadata
 * Revenue sharing tracked via universal_transactions
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      partner_data, 
      registration_type = 'new_partner',
      auto_approve = false 
    } = body

    if (!partner_data) {
      return NextResponse.json(
        { error: 'partner_data is required' },
        { status: 400 }
      )
    }

    const heraApi = getHeraAPI()
    
    // Generate unique partner code
    const partnerCode = `PARTNER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    
    // Create partner entity in universal structure
    const newPartner = await heraApi.createEntity({
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945', // HERA System Org
      entity_type: 'partner',
      entity_name: partner_data.company_name || `${partner_data.first_name} ${partner_data.last_name}`,
      entity_code: partnerCode,
      smart_code: 'HERA.PAR.REG.ENT.REGISTRATION.v1',
      status: auto_approve ? 'active' : 'pending_approval',
      metadata: {
        partner_type: partner_data.partner_type || 'implementation',
        specializations: partner_data.specializations || [],
        geographic_coverage: partner_data.geographic_coverage || [],
        business_model: partner_data.business_model || 'reseller',
        expected_volume: partner_data.expected_volume || 'small',
        revenue_share_percent: 50, // Standard 50% share
        tier: 'silver', // Start at silver tier
        certification_status: 'pending',
        onboarding_status: 'registered',
        registration_date: new Date().toISOString(),
        contact_info: {
          primary_contact: partner_data.primary_contact,
          email: partner_data.email,
          phone: partner_data.phone,
          website: partner_data.website,
          address: partner_data.address
        },
        business_info: {
          company_name: partner_data.company_name,
          company_size: partner_data.company_size,
          years_in_business: partner_data.years_in_business,
          existing_customers: partner_data.existing_customers || 0,
          technology_stack: partner_data.technology_stack || []
        },
        agreements: {
          partner_agreement_signed: partner_data.agreement_signed || false,
          signed_date: partner_data.agreement_signed ? new Date().toISOString() : null,
          terms_version: '1.0',
          revenue_share_agreed: true
        }
      }
    })

    // Create onboarding checklist as dynamic data
    const onboardingTasks = [
      { task: 'Complete Partner Agreement', status: partner_data.agreement_signed ? 'completed' : 'pending' },
      { task: 'Business Verification', status: 'pending' },
      { task: 'Training Enrollment', status: 'pending' },
      { task: 'Demo Environment Setup', status: 'pending' },
      { task: 'First Customer Onboarding', status: 'pending' },
      { task: 'Certification Achievement', status: 'pending' }
    ]

    await heraApi.setDynamicData(newPartner.id, {
      onboarding_checklist: JSON.stringify(onboardingTasks),
      onboarding_progress: '1/6',
      next_onboarding_step: 'business_verification',
      expected_go_live: calculateGoLiveDate(),
      partner_portal_access: false,
      demo_environment_created: false
    })

    // Create partner welcome transaction
    await heraApi.createTransaction({
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
      transaction_type: 'partner_registration',
      transaction_subtype: 'new_partner_welcome',
      entity_id: newPartner.id,
      transaction_data: {
        partner_code: partnerCode,
        registration_source: partner_data.source || 'website',
        referral_partner: partner_data.referral_partner || null,
        estimated_monthly_revenue: calculateEstimatedRevenue(partner_data),
        registration_ip: request.headers.get('x-forwarded-for') || 'unknown'
      },
      smart_code: 'HERA.PAR.REG.TXN.WELCOME.v1'
    })

    // If auto-approved, trigger onboarding process
    if (auto_approve) {
      await initiatePartnerOnboarding(newPartner.id, heraApi)
    }

    // Send welcome email (would integrate with email service)
    const welcomeEmail = {
      to: partner_data.email,
      template: 'partner_welcome',
      data: {
        partner_name: partner_data.first_name,
        company_name: partner_data.company_name,
        partner_code: partnerCode,
        portal_url: `https://partners.hera.com/${partnerCode.toLowerCase()}`,
        next_steps: onboardingTasks.filter(t => t.status === 'pending').slice(0, 3)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        partner_id: newPartner.id,
        partner_code: partnerCode,
        status: newPartner.status,
        onboarding_progress: '1/6',
        next_steps: onboardingTasks.filter(t => t.status === 'pending').slice(0, 3),
        portal_access: auto_approve,
        estimated_go_live: calculateGoLiveDate(),
        revenue_share: 50
      },
      message: auto_approve ? 
        'Partner registered and approved! Welcome to HERA!' : 
        'Partner registered successfully. Approval pending.',
      smart_code: 'HERA.PAR.REG.ENT.REGISTRATION.v1',
      welcome_email: welcomeEmail,
      meta_breakthrough: 'Partner registration managed by HERA universal architecture'
    })

  } catch (error) {
    console.error('Partner registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register partner', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const partnerCode = searchParams.get('partner_code')
    const status = searchParams.get('status')
    
    const heraApi = getHeraAPI()
    
    if (partnerCode) {
      // Get specific partner details
      const partner = await heraApi.getEntity(partnerCode, 'partner')
      const onboardingData = await heraApi.getDynamicData(partner.id, [
        'onboarding_checklist',
        'onboarding_progress',
        'next_onboarding_step'
      ])
      
      return NextResponse.json({
        success: true,
        data: {
          ...partner,
          onboarding: onboardingData
        },
        smart_code: 'HERA.PAR.REG.ENT.REGISTRATION.v1'
      })
    }
    
    // Get all partners with optional status filter
    const partners = await heraApi.getEntities('partner', {
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
      ...(status && { status }),
      include_dynamic_data: true,
      order_by: 'created_at DESC'
    })

    const partnersWithStats = await Promise.all(partners.map(async partner => {
      // Get partner customer count and revenue
      const customers = await heraApi.getRelationships(partner.id, ['manages_customer'])
      const revenueTransactions = await heraApi.getTransactions({
        entity_id: partner.id,
        transaction_type: 'partner_commission',
        date_range: 'current_month'
      })

      const monthlyCommission = revenueTransactions.reduce((sum, txn) => 
        sum + parseFloat(txn.transaction_data?.commission_amount || 0), 0
      )

      return {
        ...partner,
        stats: {
          customer_count: customers.length,
          monthly_commission: monthlyCommission,
          monthly_revenue: monthlyCommission * 2, // Commission is 50%
          tier: partner.metadata?.tier || 'silver',
          certification: partner.metadata?.certification_status || 'pending'
        }
      }
    }))

    return NextResponse.json({
      success: true,
      data: partnersWithStats,
      summary: {
        total_partners: partners.length,
        active_partners: partners.filter(p => p.status === 'active').length,
        pending_approval: partners.filter(p => p.status === 'pending_approval').length,
        total_monthly_commissions: partnersWithStats.reduce((sum, p) => sum + p.stats.monthly_commission, 0)
      },
      smart_code: 'HERA.PAR.REG.ENT.REGISTRATION.v1'
    })

  } catch (error) {
    console.error('Partner retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve partners', details: error.message },
      { status: 500 }
    )
  }
}

// Helper functions
function calculateGoLiveDate(): string {
  const goLive = new Date()
  goLive.setDate(goLive.getDate() + 2) // 48-hour onboarding
  return goLive.toISOString().split('T')[0]
}

function calculateEstimatedRevenue(partnerData: any): number {
  const volumeMultiplier = {
    small: 10,    // 10 customers * $50 = $500/month
    medium: 50,   // 50 customers * $100 = $5,000/month
    large: 200,   // 200 customers * $200 = $40,000/month
    enterprise: 1000 // 1000 customers * $300 = $300,000/month
  }
  
  const expectedVolume = partnerData.expected_volume || 'small'
  const avgCustomerValue = partnerData.avg_customer_value || 100
  
  return (volumeMultiplier[expectedVolume] || 10) * avgCustomerValue * 0.5 // 50% commission
}

async function initiatePartnerOnboarding(partnerId: string, heraApi: any) {
  // Create demo environment
  await heraApi.setDynamicData(partnerId, {
    demo_environment_created: true,
    demo_url: `https://demo-${partnerId.toLowerCase()}.hera.com`,
    partner_portal_access: true,
    portal_credentials_sent: true
  })
  
  // Schedule onboarding calls
  await heraApi.createTransaction({
    organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
    transaction_type: 'partner_onboarding',
    transaction_subtype: 'schedule_created',
    entity_id: partnerId,
    transaction_data: {
      onboarding_call_1: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      onboarding_call_2: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after
      demo_environment_ready: true
    },
    smart_code: 'HERA.PAR.ONB.TXN.SCHEDULE.v1'
  })
}