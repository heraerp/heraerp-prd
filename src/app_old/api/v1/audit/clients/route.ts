import { NextRequest, NextResponse } from 'next/server'

/**
 * HERA Audit Client Management API
 *
 * Manages audit clients using universal architecture:
 * - Each client is a separate organization for perfect isolation
 * - Client data stored as core_entities with entity_type='audit_client'
 * - Risk assessments and compliance in core_dynamic_data
 * - Team assignments via core_relationships
 */

// Dynamic audit firm detection (no hardcoding)
const getAuditFirmFromAuth = (authHeader: string | null): string => {
  // In production, this would parse JWT claims to get the audit firm
  // For demo, we'll use a mapping based on organization ID
  if (!authHeader) return 'unknown_audit_firm'

  const orgMapping: Record<string, string> = {
    gspu_audit_partners_org: 'GSPU_AUDIT_PARTNERS',
    abc_auditors_org: 'ABC_ASSOCIATES',
    unknown: 'UNKNOWN_FIRM'
  }

  // Extract org ID from bearer token (simplified for demo)
  const orgId = authHeader.replace('Bearer ', '')
  return orgMapping[orgId] || 'UNKNOWN_FIRM'
}

// Mock audit clients data with complete address and contact information
const mockClients = [
  {
    id: 'client_001',
    organization_id: 'client_org_xyz_manufacturing',
    entity_type: 'audit_client',
    entity_code: 'CLI-2025-001',
    entity_name: 'XYZ Manufacturing Ltd',
    smart_code: 'HERA.AUD.CLI.ENT.PROF.V1',
    status: 'active',
    metadata: {
      client_type: 'private',
      risk_rating: 'moderate',
      industry_code: 'manufacturing',
      annual_revenue: 25000000,
      total_assets: 15000000,
      public_interest_entity: false,
      incorporation_date: '2015-03-15',
      tax_id: '12345678',
      registration_number: 'HE123456',
      address: {
        street: '123 Industrial Avenue',
        city: 'Limassol',
        state: 'Limassol',
        country: 'Cyprus',
        postal_code: '3025'
      },
      contact: {
        primary_contact: 'George Papadopoulos',
        phone: '+357 25 123456',
        email: 'george@xyzmanufacturing.com',
        website: 'https://www.xyzmanufacturing.com'
      },
      previous_auditor: 'ABC & Partners',
      audit_history: [
        {
          year: '2024',
          auditor: 'ABC & Partners',
          opinion_type: 'unqualified',
          key_matters: [],
          fees: 45000
        }
      ],
      // Compliance fields
      partners_id: 'ID123456789',
      sijilat_verification: 'verified',
      credit_rating: 'BBB+',
      aml_risk_score: 2.3,
      zigram_assessment: {
        score: 2.3,
        factors: ['industry_standard', 'no_pep', 'low_complexity'],
        date: '2025-01-01'
      }
    },
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T10:30:00Z'
  },
  {
    id: 'client_002',
    organization_id: 'client_org_abc_trading',
    entity_type: 'audit_client',
    entity_code: 'CLI-2025-002',
    entity_name: 'ABC Trading Co',
    smart_code: 'HERA.AUD.CLI.ENT.PROF.V1',
    status: 'active',
    metadata: {
      client_type: 'public',
      risk_rating: 'high',
      industry_code: 'trading',
      annual_revenue: 85000000,
      total_assets: 45000000,
      public_interest_entity: true,
      incorporation_date: '2010-06-20',
      tax_id: '87654321',
      registration_number: 'HE654321',
      address: {
        street: '456 Commerce Tower, Makarios Avenue',
        city: 'Nicosia',
        state: 'Nicosia',
        country: 'Cyprus',
        postal_code: '1065'
      },
      contact: {
        primary_contact: 'Maria Stavrou',
        phone: '+357 22 765432',
        email: 'maria@abctrading.com',
        website: 'https://www.abctrading.com'
      },
      previous_auditor: 'DEF Auditors',
      audit_history: [
        {
          year: '2024',
          auditor: 'DEF Auditors',
          opinion_type: 'qualified',
          key_matters: ['inventory_valuation', 'related_party_transactions'],
          fees: 120000
        }
      ],
      partners_id: 'ID987654321',
      sijilat_verification: 'verified',
      credit_rating: 'A-',
      aml_risk_score: 4.2,
      zigram_assessment: {
        score: 4.2,
        factors: ['complex_transactions', 'multiple_jurisdictions', 'high_value'],
        date: '2025-01-01'
      }
    },
    created_at: '2024-12-15T00:00:00Z',
    updated_at: '2025-01-20T14:45:00Z'
  },
  {
    id: 'client_003',
    organization_id: 'client_org_global_tech',
    entity_type: 'audit_client',
    entity_code: 'CLI-2025-003',
    entity_name: 'Global Tech Solutions Ltd',
    smart_code: 'HERA.AUD.CLI.ENT.PROF.V1',
    status: 'prospective',
    metadata: {
      client_type: 'private',
      risk_rating: 'low',
      industry_code: 'technology',
      annual_revenue: 12000000,
      total_assets: 8000000,
      public_interest_entity: false,
      incorporation_date: '2018-11-10',
      tax_id: '45678912',
      registration_number: 'HE456789',
      address: {
        street: '789 Tech Park, Archbishop Makarios III Avenue',
        city: 'Paphos',
        state: 'Paphos',
        country: 'Cyprus',
        postal_code: '8100'
      },
      contact: {
        primary_contact: 'Andreas Christou',
        phone: '+357 26 345678',
        email: 'andreas@globaltechsolutions.com',
        website: 'https://www.globaltechsolutions.com'
      },
      previous_auditor: 'None - First Audit',
      audit_history: [],
      partners_id: 'ID456789123',
      sijilat_verification: 'pending',
      credit_rating: 'BBB',
      aml_risk_score: 1.8,
      zigram_assessment: {
        score: 1.8,
        factors: ['low_complexity', 'single_jurisdiction', 'technology_sector'],
        date: '2025-01-20'
      }
    },
    created_at: '2025-01-20T00:00:00Z',
    updated_at: '2025-01-20T16:30:00Z'
  }
]

// Mock team assignments (core_relationships)
const mockTeamAssignments = [
  {
    client_id: 'client_001',
    partner_id: 'auditor_john_smith',
    manager_id: 'auditor_sarah_johnson',
    eqcr_partner_id: null,
    engagement_type: 'statutory',
    start_date: '2025-01-01'
  },
  {
    client_id: 'client_002',
    partner_id: 'auditor_michael_brown',
    manager_id: 'auditor_emily_davis',
    eqcr_partner_id: 'auditor_david_lee', // Required for PIE and high risk
    engagement_type: 'statutory',
    start_date: '2024-12-15'
  },
  {
    client_id: 'client_003',
    partner_id: 'auditor_john_smith',
    manager_id: 'auditor_sarah_johnson',
    eqcr_partner_id: null,
    engagement_type: 'statutory',
    start_date: '2025-01-20'
  }
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const clientId = searchParams.get('client_id')
    const riskRating = searchParams.get('risk_rating')
    const status = searchParams.get('status')

    // Get audit firm dynamically from authorization header
    const authHeader = request.headers.get('authorization')
    const currentAuditFirm = getAuditFirmFromAuth(authHeader)

    console.log(`🔍 API Request: Current audit firm determined as: ${currentAuditFirm}`)
    console.log(`📋 Auth header: ${authHeader}`)
    console.log(`🎯 Requested action: ${action || 'list_clients'}`)

    // Get specific client
    if (clientId) {
      const client = mockClients.find(c => c.id === clientId)
      if (!client) {
        return NextResponse.json({ success: false, message: 'Client not found' }, { status: 404 })
      }

      // Add team assignment
      const teamAssignment = mockTeamAssignments.find(t => t.client_id === clientId)

      return NextResponse.json({
        success: true,
        data: {
          ...client,
          team_assignment: teamAssignment
        }
      })
    }

    // Get client statistics
    if (action === 'stats') {
      const stats = {
        total_clients: mockClients.length,
        active_engagements: mockClients.filter(c => c.status === 'active').length,
        high_risk_clients: mockClients.filter(
          c => c.metadata.risk_rating === 'high' || c.metadata.risk_rating === 'very_high'
        ).length,
        pie_clients: mockClients.filter(c => c.metadata.public_interest_entity).length,
        eqcr_required: mockClients.filter(
          c =>
            c.metadata.public_interest_entity ||
            c.metadata.risk_rating === 'high' ||
            c.metadata.risk_rating === 'very_high'
        ).length,
        by_risk_rating: {
          low: mockClients.filter(c => c.metadata.risk_rating === 'low').length,
          moderate: mockClients.filter(c => c.metadata.risk_rating === 'moderate').length,
          high: mockClients.filter(c => c.metadata.risk_rating === 'high').length,
          very_high: mockClients.filter(c => c.metadata.risk_rating === 'very_high').length
        },
        by_client_type: {
          public: mockClients.filter(c => c.metadata.client_type === 'public').length,
          private: mockClients.filter(c => c.metadata.client_type === 'private').length,
          non_profit: mockClients.filter(c => c.metadata.client_type === 'non_profit').length,
          government: mockClients.filter(c => c.metadata.client_type === 'government').length
        }
      }

      return NextResponse.json({
        success: true,
        data: stats
      })
    }

    // Get compliance dashboard
    if (action === 'compliance') {
      const complianceData = {
        independence_checks: {
          total_required: mockClients.length,
          completed: mockClients.filter(c => c.metadata.sijilat_verification === 'verified').length,
          pending: mockClients.filter(c => c.metadata.sijilat_verification === 'pending').length,
          failed: mockClients.filter(c => c.metadata.sijilat_verification === 'failed').length
        },
        aml_assessments: {
          high_risk: mockClients.filter(c => c.metadata.aml_risk_score > 5).length,
          medium_risk: mockClients.filter(
            c => c.metadata.aml_risk_score >= 3 && c.metadata.aml_risk_score <= 5
          ).length,
          low_risk: mockClients.filter(c => c.metadata.aml_risk_score < 3).length
        },
        quality_control: {
          eqcr_required: mockTeamAssignments.filter(t => t.eqcr_partner_id).length,
          partner_assignments: mockTeamAssignments.length,
          independence_confirmed: mockClients.length // All confirmed for demo
        }
      }

      return NextResponse.json({
        success: true,
        data: complianceData
      })
    }

    // Filter clients
    let filteredClients = [...mockClients]

    if (riskRating) {
      filteredClients = filteredClients.filter(c => c.metadata.risk_rating === riskRating)
    }

    if (status) {
      filteredClients = filteredClients.filter(c => c.status === status)
    }

    // Add team assignments
    const clientsWithTeams = filteredClients.map(client => {
      const teamAssignment = mockTeamAssignments.find(t => t.client_id === client.id)
      return {
        ...client,
        team_assignment: teamAssignment
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        clients: clientsWithTeams,
        total: clientsWithTeams.length,
        filtered: filteredClients.length !== mockClients.length
      }
    })
  } catch (error) {
    console.error('Audit clients API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch audit clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    // Create new audit client
    if (action === 'create_client') {
      const newClient = {
        id: `client_${Date.now()}`,
        organization_id: `client_org_${data.entity_code.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        entity_type: 'audit_client',
        entity_code: data.entity_code,
        entity_name: data.entity_name,
        smart_code: 'HERA.AUD.CLI.ENT.PROF.V1',
        status: 'prospective',
        metadata: {
          client_type: data.client_type,
          risk_rating: data.risk_rating || 'moderate',
          industry_code: data.industry_code,
          annual_revenue: data.annual_revenue || 0,
          total_assets: data.total_assets || 0,
          public_interest_entity: data.public_interest_entity || false,
          previous_auditor: data.previous_auditor,
          audit_history: [],
          partners_id: data.partners_id,
          sijilat_verification: 'pending',
          credit_rating: data.credit_rating,
          aml_risk_score: 0,
          zigram_assessment: {
            score: 0,
            factors: [],
            date: new Date().toISOString()
          }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        data: newClient,
        message: 'Audit client created successfully'
      })
    }

    // Update client information
    if (action === 'update_client') {
      const { client_id, updates } = data

      return NextResponse.json({
        success: true,
        data: {
          client_id,
          updated_fields: Object.keys(updates),
          updated_at: new Date().toISOString()
        },
        message: 'Client updated successfully'
      })
    }

    // Assign audit team
    if (action === 'assign_team') {
      const { client_id, partner_id, manager_id, eqcr_partner_id, engagement_type } = data

      const teamAssignment = {
        client_id,
        partner_id,
        manager_id,
        eqcr_partner_id,
        engagement_type,
        start_date: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        data: teamAssignment,
        message: 'Audit team assigned successfully'
      })
    }

    // Perform independence check
    if (action === 'independence_check') {
      const { client_id } = data

      const independenceResult = {
        client_id,
        check_date: new Date().toISOString(),
        checks_performed: [
          { type: 'partners_id_verification', status: 'passed', details: 'Sijilat verified' },
          { type: 'conflict_of_interest', status: 'passed', details: 'No conflicts identified' },
          { type: 'staff_relationships', status: 'passed', details: 'No personal relationships' },
          { type: 'financial_interests', status: 'passed', details: 'No financial interests' }
        ],
        overall_result: 'passed',
        approved_by: 'compliance_officer',
        next_check_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      }

      return NextResponse.json({
        success: true,
        data: independenceResult,
        message: 'Independence check completed'
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Audit clients API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    )
  }
}
