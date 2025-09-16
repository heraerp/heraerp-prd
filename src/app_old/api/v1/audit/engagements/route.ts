import { NextRequest, NextResponse } from 'next/server'

interface CreateEngagementRequest {
  action: 'create_engagement'
  data: {
    // Client Information
    client_name: string
    client_code: string
    client_type: 'public' | 'private' | 'non_profit' | 'government'
    industry: string
    annual_revenue: string
    total_assets: string
    public_interest_entity: boolean
    previous_auditor: string

    // Engagement Details
    engagement_type: 'statutory' | 'voluntary' | 'special' | 'review'
    audit_year: string
    year_end_date: string
    planned_start_date: string
    target_completion_date: string
    estimated_hours: string
    estimated_fees: string

    // Risk Assessment
    risk_rating: 'low' | 'moderate' | 'high' | 'very_high'
    risk_factors: string
    materiality_planning: string
    materiality_performance: string

    // Team Assignment
    engagement_partner: string
    audit_manager: string
    eqcr_partner: string
    additional_team_members: string[]

    // Compliance
    independence_confirmed: boolean
    conflict_check_completed: boolean
    aml_assessment_done: boolean
    compliance_approval: boolean
  }
}

// Mock engagement data for demonstration - Steve Jobs approach: Cyprus as test client
const mockEngagements = [
  {
    id: 'eng_001',
    client_name: 'Cyprus Trading Ltd',
    client_code: 'CLI-2025-001',
    client_type: 'private',
    year_end_date: '2025-12-31',
    audit_year: '2025',
    estimated_fees: 75000,
    estimated_hours: 500,
    risk_rating: 'moderate',
    status: 'active',
    phase: 2,
    completion: 35,
    engagement_partner: 'john_smith',
    audit_manager: 'sarah_johnson',
    engagement_type: 'statutory',
    planned_start_date: '2025-01-15',
    target_completion_date: '2025-04-30',
    created_date: '2025-01-15'
  },
  {
    id: 'eng_002',
    client_name: 'Mediterranean Shipping Co',
    client_code: 'CLI-2025-002',
    client_type: 'public',
    year_end_date: '2025-12-31',
    audit_year: '2025',
    estimated_fees: 250000,
    estimated_hours: 1800,
    risk_rating: 'high',
    status: 'planning',
    phase: 1,
    completion: 15,
    engagement_partner: 'michael_brown',
    audit_manager: 'emily_davis',
    engagement_type: 'statutory',
    planned_start_date: '2025-02-01',
    target_completion_date: '2025-05-15',
    created_date: '2025-01-10'
  },
  {
    id: 'eng_003',
    client_name: 'Nicosia Tech Solutions',
    client_code: 'CLI-2025-003',
    client_type: 'private',
    year_end_date: '2025-12-31',
    audit_year: '2025',
    estimated_fees: 45000,
    estimated_hours: 300,
    risk_rating: 'low',
    status: 'review',
    phase: 3,
    completion: 75,
    engagement_partner: 'john_smith',
    audit_manager: 'sarah_johnson',
    engagement_type: 'voluntary',
    planned_start_date: '2024-11-01',
    target_completion_date: '2025-02-28',
    created_date: '2024-10-15'
  }
]

export async function POST(request: NextRequest) {
  try {
    const body: CreateEngagementRequest = await request.json()

    if (body.action === 'create_engagement') {
      // Generate new engagement ID and unique organization ID for this GSPU audit client
      const engagementId = `eng_${Date.now()}`
      const clientOrgId = `gspu_client_${body.data.client_code.toLowerCase().replace(/[^a-z0-9]/g, '_')}_org`

      // Create new engagement object
      const newEngagement = {
        id: engagementId,

        // Core engagement details
        entity_type: 'audit_engagement',
        entity_code: body.data.client_code,
        entity_name: `${body.data.client_name} - FY${body.data.audit_year || new Date().getFullYear()}`,
        organization_id: clientOrgId, // Each GSPU audit client gets their own organization
        smart_code: 'HERA.AUD.ENG.ENT.MASTER.v1',
        status: 'planning',

        // Client information
        client_name: body.data.client_name,
        client_code: body.data.client_code,
        client_type: body.data.client_type,
        industry: body.data.industry,
        annual_revenue: parseFloat(body.data.annual_revenue) || 0,
        total_assets: parseFloat(body.data.total_assets) || 0,
        public_interest_entity: body.data.public_interest_entity,
        previous_auditor: body.data.previous_auditor,

        // Engagement details
        engagement_type: body.data.engagement_type,
        audit_year: body.data.audit_year,
        year_end_date: body.data.year_end_date,
        planned_start_date: body.data.planned_start_date,
        target_completion_date: body.data.target_completion_date,
        estimated_hours: parseFloat(body.data.estimated_hours) || 0,
        estimated_fees: parseFloat(body.data.estimated_fees) || 0,

        // Risk assessment
        risk_rating: body.data.risk_rating,
        risk_factors: body.data.risk_factors,
        materiality_planning: parseFloat(body.data.materiality_planning) || 0,
        materiality_performance: parseFloat(body.data.materiality_performance) || 0,

        // Team assignment
        engagement_partner: body.data.engagement_partner,
        audit_manager: body.data.audit_manager,
        eqcr_partner: body.data.eqcr_partner,
        eqcr_required:
          body.data.public_interest_entity ||
          body.data.risk_rating === 'high' ||
          body.data.risk_rating === 'very_high',

        // Compliance
        independence_confirmed: body.data.independence_confirmed,
        conflict_check_completed: body.data.conflict_check_completed,
        aml_assessment_done: body.data.aml_assessment_done,
        compliance_approval: body.data.compliance_approval,

        // Metadata
        created_date: new Date().toISOString(),
        created_by: 'current_user',
        phase: 1, // Client Engagement & Acceptance
        completion_percentage: 10,

        // GSPU Client tracking
        gspu_client_id: body.data.client_code, // Internal GSPU client reference
        audit_firm: 'GSPU_AUDIT_PARTNERS', // GSPU is the audit firm using HERA

        // Universal transaction for engagement creation
        transaction_data: {
          transaction_type: 'engagement_creation',
          smart_code: 'HERA.AUD.ENG.TXN.CREATE.v1',
          reference_number: body.data.client_code,
          total_amount: parseFloat(body.data.estimated_fees) || 0,
          metadata: {
            client_name: body.data.client_name,
            audit_year: body.data.audit_year,
            risk_rating: body.data.risk_rating,
            organization_id: clientOrgId, // Include org ID in transaction metadata
            gspu_client_id: body.data.client_code,
            audit_firm: 'GSPU_AUDIT_PARTNERS',
            eqcr_required:
              body.data.public_interest_entity ||
              body.data.risk_rating === 'high' ||
              body.data.risk_rating === 'very_high'
          }
        }
      }

      // Add to mock data (in production, this would be saved to database)
      const newMockEngagement: any = {
        id: engagementId,
        client_name: body.data.client_name,
        client_code: body.data.client_code,
        audit_year: body.data.audit_year,
        status: 'planning',
        partner: body.data.engagement_partner,
        manager: body.data.audit_manager,
        gspu_client_id: body.data.client_code,
        audit_firm: 'GSPU_AUDIT_PARTNERS',
        created_date: new Date().toISOString().split('T')[0],
        organization_id: clientOrgId
      }

      mockEngagements.push(newMockEngagement)

      return NextResponse.json({
        success: true,
        message: 'Engagement created successfully',
        data: newEngagement
      })
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Invalid action specified'
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error creating engagement:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create engagement',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const id = searchParams.get('id')

    // Get specific engagement by ID
    if (id) {
      const engagement = mockEngagements.find(e => e.id === id)
      if (!engagement) {
        return NextResponse.json(
          {
            success: false,
            message: 'Engagement not found'
          },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: { engagement }
      })
    }

    // List all engagements (default behavior for Steve Jobs simplicity)
    const engagements = mockEngagements.map(eng => ({
      ...eng,
      entity_type: 'audit_engagement',
      organization_id: '719dfed1-09b4-4ca8-bfda-f682460de945',
      smart_code: 'HERA.AUD.ENG.ENT.MASTER.v1'
    }))

    return NextResponse.json({
      success: true,
      data: {
        engagements: engagements,
        total: engagements.length,
        stats: {
          total_engagements: mockEngagements.length,
          active_engagements: mockEngagements.filter(e => e.status === 'active').length,
          planning_phase: mockEngagements.filter(e => e.status === 'planning').length,
          review_phase: mockEngagements.filter(e => e.status === 'review').length,
          completed: mockEngagements.filter(e => e.status === 'completed').length
        }
      }
    })
  } catch (error) {
    console.error('Error fetching engagements:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch engagements'
      },
      { status: 500 }
    )
  }
}
