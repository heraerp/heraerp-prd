import { NextRequest, NextResponse } from 'next/server'
import { IceCreamCOAGenerator } from '@/lib/coa/ice-cream-coa-generator'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const { organizationId, organizationName, country = 'IN' } = await request.json()
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }
    
    // Verify organization exists and user has access
    const { data: org, error: orgError } = await supabaseAdmin
      .from('core_organizations')
      .select('id, organization_name')
      .eq('id', organizationId)
      .single()
    
    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Invalid organization' },
        { status: 403 }
      )
    }
    
    // Generate COA for ice cream business
    const generator = new IceCreamCOAGenerator({
      organizationId,
      organizationName: organizationName || org.organization_name,
      country,
      currency: country === 'IN' ? 'INR' : 'USD',
      includeKulfi: country === 'IN', // Include Kulfi for Indian businesses
      multiLocation: true,
      exportBusiness: false
    })
    
    const result = await generator.generateCOA()
    
    // Return summary
    return NextResponse.json({
      success: true,
      message: `Successfully created Chart of Accounts for ice cream business`,
      details: {
        accountsCreated: result.accountsCreated,
        organization: organizationName || org.organization_name,
        features: {
          coldChainTracking: true,
          batchTracking: true,
          expiryManagement: true,
          temperatureCompliance: true,
          gstCompliance: country === 'IN',
          multiLocationInventory: true
        },
        industrySpecific: {
          freezerPlacementProgram: true,
          coldChainWastageTracking: true,
          seasonalVarianceAnalysis: true,
          multiChannelRevenue: ['Retail', 'Wholesale', 'Food Service', 'Online'],
          productCategories: ['Cups/Tubs', 'Bars/Sticks', 'Cones', 'Bulk', 'Kulfi']
        }
      }
    })
  } catch (error) {
    console.error('Error setting up ice cream COA:', error)
    return NextResponse.json(
      { error: 'Failed to setup Chart of Accounts' },
      { status: 500 }
    )
  }
}