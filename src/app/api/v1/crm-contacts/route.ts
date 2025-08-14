import { NextRequest, NextResponse } from 'next/server'

// CRM Contacts API - Using HERA Universal Architecture
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id') || 'demo_org'
    
    // Demo CRM contacts data
    const contacts = [
      {
        id: 1,
        entity_type: 'crm_contact',
        entity_name: 'Sarah Johnson',
        entity_code: 'CONT-001',
        organization_id: organizationId,
        dynamic_fields: {
          company: 'Tech Solutions Inc',
          email: 'sarah@techsolutions.com',
          phone: '(555) 123-4567',
          status: 'customer',
          last_contact: '2024-01-15',
          deal_value: 25000,
          tags: ['Hot Lead', 'Enterprise'],
          lead_source: 'Website',
          notes: 'Interested in enterprise solution'
        }
      },
      {
        id: 2,
        entity_type: 'crm_contact',
        entity_name: 'Mike Chen',
        entity_code: 'CONT-002',
        organization_id: organizationId,
        dynamic_fields: {
          company: 'StartupCo',
          email: 'mike@startupco.com',
          phone: '(555) 987-6543',
          status: 'prospect',
          last_contact: '2024-01-10',
          deal_value: 5000,
          tags: ['Cold Lead'],
          lead_source: 'Referral',
          notes: 'Following up on initial inquiry'
        }
      },
      {
        id: 3,
        entity_type: 'crm_contact',
        entity_name: 'Emily Rodriguez',
        entity_code: 'CONT-003',
        organization_id: organizationId,
        dynamic_fields: {
          company: 'Global Enterprises',
          email: 'emily@global.com',
          phone: '(555) 456-7890',
          status: 'customer',
          last_contact: '2024-01-18',
          deal_value: 50000,
          tags: ['VIP', 'Renewal'],
          lead_source: 'Trade Show',
          notes: 'Long-term strategic partner'
        }
      }
    ]

    return NextResponse.json({
      success: true,
      data: contacts,
      count: contacts.length,
      message: 'CRM contacts retrieved successfully'
    })

  } catch (error) {
    console.error('CRM Contacts API error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, name, company, email, phone, status, tags, notes } = body

    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Create new contact using HERA universal architecture
    const newContact = {
      id: Date.now(),
      entity_type: 'crm_contact',
      entity_name: name,
      entity_code: `CONT-${Date.now().toString().slice(-6)}`,
      organization_id: organization_id || 'demo_org',
      status: 'active',
      created_at: new Date().toISOString(),
      dynamic_fields: {
        company,
        email,
        phone,
        status: status || 'prospect',
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        notes,
        last_contact: new Date().toISOString().split('T')[0],
        deal_value: 0,
        lead_source: 'Manual Entry'
      }
    }

    return NextResponse.json({
      success: true,
      data: newContact,
      message: 'Contact created successfully'
    })

  } catch (error) {
    console.error('Create contact error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create contact' },
      { status: 500 }
    )
  }
}