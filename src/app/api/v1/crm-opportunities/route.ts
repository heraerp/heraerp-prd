import { NextRequest, NextResponse } from 'next/server'

// CRM Opportunities API - Sales Pipeline Management
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || 'demo_org'

    // Demo opportunities data with sales stages
    const opportunities = [
      {
        id: 1,
        entity_type: 'crm_opportunity',
        entity_name: 'Tech Solutions - Q1 Implementation',
        entity_code: 'OPP-001',
        organization_id: organizationId,
        dynamic_fields: {
          contact_name: 'Sarah Johnson',
          company: 'Tech Solutions Inc',
          stage: 'proposal',
          deal_value: 25000,
          close_date: '2024-02-15',
          probability: 75,
          lead_source: 'Website',
          description: 'Enterprise software implementation for Q1',
          next_action: 'Schedule demo call',
          sales_rep: 'John Smith',
          last_activity: '2024-01-15'
        }
      },
      {
        id: 2,
        entity_type: 'crm_opportunity',
        entity_name: 'StartupCo - Pilot Program',
        entity_code: 'OPP-002',
        organization_id: organizationId,
        dynamic_fields: {
          contact_name: 'Mike Chen',
          company: 'StartupCo',
          stage: 'discovery',
          deal_value: 5000,
          close_date: '2024-03-01',
          probability: 25,
          lead_source: 'Referral',
          description: 'Small scale pilot program',
          next_action: 'Send proposal',
          sales_rep: 'Jane Doe',
          last_activity: '2024-01-10'
        }
      },
      {
        id: 3,
        entity_type: 'crm_opportunity',
        entity_name: 'Global Enterprises - Enterprise License',
        entity_code: 'OPP-003',
        organization_id: organizationId,
        dynamic_fields: {
          contact_name: 'Emily Rodriguez',
          company: 'Global Enterprises',
          stage: 'negotiation',
          deal_value: 50000,
          close_date: '2024-01-30',
          probability: 90,
          lead_source: 'Trade Show',
          description: 'Multi-year enterprise license agreement',
          next_action: 'Contract review',
          sales_rep: 'John Smith',
          last_activity: '2024-01-18'
        }
      }
    ]

    return NextResponse.json({
      success: true,
      data: opportunities,
      count: opportunities.length,
      total_pipeline_value: opportunities.reduce(
        (sum, opp) => sum + opp.dynamic_fields.deal_value,
        0
      ),
      weighted_pipeline: opportunities.reduce(
        (sum, opp) => sum + (opp.dynamic_fields.deal_value * opp.dynamic_fields.probability) / 100,
        0
      ),
      message: 'Opportunities retrieved successfully'
    })
  } catch (error) {
    console.error('CRM Opportunities API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch opportunities' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, name, contact, stage, value, close_date, probability, description } =
      body

    if (!name || !contact || !stage) {
      return NextResponse.json(
        { success: false, message: 'Name, contact, and stage are required' },
        { status: 400 }
      )
    }

    // Create new opportunity using HERA universal architecture
    const newOpportunity = {
      id: Date.now(),
      entity_type: 'crm_opportunity',
      entity_name: name,
      entity_code: `OPP-${Date.now().toString().slice(-6)}`,
      organization_id: organization_id || 'demo_org',
      status: 'active',
      created_at: new Date().toISOString(),
      dynamic_fields: {
        contact_name: contact,
        stage,
        deal_value: parseFloat(value) || 0,
        close_date,
        probability: parseInt(probability) || 50,
        description,
        created_date: new Date().toISOString().split('T')[0],
        sales_rep: 'System User',
        last_activity: new Date().toISOString().split('T')[0],
        next_action: 'Initial contact'
      }
    }

    return NextResponse.json({
      success: true,
      data: newOpportunity,
      message: 'Opportunity created successfully'
    })
  } catch (error) {
    console.error('Create opportunity error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create opportunity' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, stage, probability, next_action } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Opportunity ID is required' },
        { status: 400 }
      )
    }

    // Update opportunity stage - this would update the universal tables
    const updatedOpportunity = {
      id,
      updated_at: new Date().toISOString(),
      dynamic_fields: {
        stage,
        probability,
        next_action,
        last_activity: new Date().toISOString().split('T')[0]
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedOpportunity,
      message: 'Opportunity updated successfully'
    })
  } catch (error) {
    console.error('Update opportunity error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update opportunity' },
      { status: 500 }
    )
  }
}
