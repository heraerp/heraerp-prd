import { NextRequest, NextResponse } from 'next/server'

/**
 * HERA Audit Firm Management API
 *
 * Manages audit firms using universal architecture:
 * - Audit firms are core_entities with entity_type='audit_firm'
 * - Firm details stored in core_dynamic_data
 * - No hardcoding - everything comes from database
 */

interface AuditFirm {
  id: string
  organization_id: string
  entity_type: string
  entity_code: string
  entity_name: string
  smart_code: string
  status: string
  metadata: {
    firm_type: 'big_four' | 'mid_tier' | 'small_practice' | 'sole_practitioner'
    license_number: string
    registration_country: string
    website: string
    established_year: number
    partner_count: number
    staff_count: number
    office_locations: string[]
    specializations: string[]
    quality_control_system: string
    peer_review_status: string
    insurance_coverage: number
  }
  created_at: string
  updated_at: string
}

// Mock audit firms data (in production, this comes from core_entities)
const mockAuditFirms: AuditFirm[] = [
  {
    id: 'firm_001',
    organization_id: 'gspu_audit_partners_org',
    entity_type: 'audit_firm',
    entity_code: 'GSPU',
    entity_name: 'GSPU Audit Partners',
    smart_code: 'HERA.AUD.FIRM.ENT.PROF.v1',
    status: 'active',
    metadata: {
      firm_type: 'mid_tier',
      license_number: 'AUD-BH-2019-001',
      registration_country: 'Bahrain',
      website: 'https://gspu.com',
      established_year: 2019,
      partner_count: 8,
      staff_count: 45,
      office_locations: ['Manama', 'Dubai', 'Riyadh'],
      specializations: [
        'statutory_audit',
        'financial_services',
        'real_estate',
        'manufacturing',
        'trading'
      ],
      quality_control_system: 'ISQC1',
      peer_review_status: 'satisfactory',
      insurance_coverage: 5000000
    },
    created_at: '2019-01-01T00:00:00Z',
    updated_at: '2025-01-01T12:00:00Z'
  },
  {
    id: 'firm_002',
    organization_id: 'abc_auditors_org',
    entity_type: 'audit_firm',
    entity_code: 'ABC',
    entity_name: 'ABC & Associates',
    smart_code: 'HERA.AUD.FIRM.ENT.PROF.v1',
    status: 'active',
    metadata: {
      firm_type: 'small_practice',
      license_number: 'AUD-BH-2015-003',
      registration_country: 'Bahrain',
      website: 'https://abc-auditors.com',
      established_year: 2015,
      partner_count: 3,
      staff_count: 18,
      office_locations: ['Manama'],
      specializations: ['statutory_audit', 'sme_audit', 'tax_advisory'],
      quality_control_system: 'ISQC1',
      peer_review_status: 'satisfactory',
      insurance_coverage: 1000000
    },
    created_at: '2015-03-15T00:00:00Z',
    updated_at: '2024-12-01T10:30:00Z'
  }
]

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const firmId = searchParams.get('firm_id')
    const firmCode = searchParams.get('firm_code')
    const action = searchParams.get('action')

    // Get specific firm by ID
    if (firmId) {
      const firm = mockAuditFirms.find(f => f.id === firmId)
      if (!firm) {
        return NextResponse.json(
          { success: false, message: 'Audit firm not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: firm
      })
    }

    // Get specific firm by code (e.g., GSPU)
    if (firmCode) {
      const firm = mockAuditFirms.find(f => f.entity_code === firmCode.toUpperCase())
      if (!firm) {
        return NextResponse.json(
          { success: false, message: 'Audit firm not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: firm
      })
    }

    // Get current firm context (from JWT or session)
    if (action === 'current') {
      // In production, this would come from JWT claims or session
      // For demo, we'll use GSPU as the logged-in firm
      const currentFirm = mockAuditFirms.find(f => f.entity_code === 'GSPU')

      return NextResponse.json({
        success: true,
        data: currentFirm
      })
    }

    // Get all audit firms
    return NextResponse.json({
      success: true,
      data: {
        firms: mockAuditFirms,
        total: mockAuditFirms.length
      }
    })
  } catch (error) {
    console.error('Audit firm API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch audit firm data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    // Register new audit firm
    if (action === 'register_firm') {
      const newFirm: AuditFirm = {
        id: `firm_${Date.now()}`,
        organization_id: `${data.entity_code.toLowerCase()}_audit_firm_org`,
        entity_type: 'audit_firm',
        entity_code: data.entity_code.toUpperCase(),
        entity_name: data.entity_name,
        smart_code: 'HERA.AUD.FIRM.ENT.PROF.v1',
        status: 'pending_approval',
        metadata: {
          firm_type: data.firm_type,
          license_number: data.license_number,
          registration_country: data.registration_country,
          website: data.website,
          established_year: data.established_year,
          partner_count: data.partner_count || 1,
          staff_count: data.staff_count || 1,
          office_locations: data.office_locations || [],
          specializations: data.specializations || [],
          quality_control_system: data.quality_control_system || 'ISQC1',
          peer_review_status: 'pending',
          insurance_coverage: data.insurance_coverage || 0
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        data: newFirm,
        message: 'Audit firm registered successfully'
      })
    }

    // Update firm information
    if (action === 'update_firm') {
      const { firm_id, updates } = data

      return NextResponse.json({
        success: true,
        data: {
          firm_id,
          updated_fields: Object.keys(updates),
          updated_at: new Date().toISOString()
        },
        message: 'Audit firm updated successfully'
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Audit firm API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to process request' },
      { status: 500 }
    )
  }
}
