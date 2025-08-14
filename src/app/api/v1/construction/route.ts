// UK Construction Management Universal API
// Handles all construction business operations using HERA universal tables

import { NextRequest, NextResponse } from 'next/server'

// Mock HERA API for construction management
const constructionApi = {
  // Universal entity management for construction
  async createEntity(entityData: any) {
    return {
      id: `entity_${Date.now()}`,
      entity_type: entityData.entity_type,
      entity_name: entityData.entity_name,
      entity_code: entityData.entity_code || `${entityData.entity_type.toUpperCase()}-${Date.now()}`,
      organization_id: entityData.organization_id,
      status: 'active',
      created_at: new Date().toISOString(),
      smart_code: entityData.smart_code || `HERA.CONST.${entityData.entity_type.toUpperCase()}.v1`
    }
  },

  // Universal transaction management
  async createTransaction(transactionData: any) {
    return {
      id: `txn_${Date.now()}`,
      transaction_type: transactionData.transaction_type,
      reference_number: transactionData.reference_number,
      total_amount: transactionData.total_amount || 0,
      metadata: transactionData.metadata,
      created_at: new Date().toISOString()
    }
  },

  // Dynamic data storage
  async storeDynamicData(entityId: string, fields: any[]) {
    return fields.map(field => ({
      id: `dynamic_${Date.now()}_${Math.random()}`,
      entity_id: entityId,
      field_name: field.field_name,
      field_value: field.field_value,
      created_at: new Date().toISOString()
    }))
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  try {
    if (type === 'customers') {
      return NextResponse.json({
        success: true,
        data: {
          customers: Array.from({ length: 10 }, (_, i) => ({
            id: `customer_${i + 1}`,
            entity_type: 'construction_customer',
            entity_name: `Customer ${i + 1}`,
            status: ['lead', 'active', 'completed'][i % 3],
            contact_details: {
              phone: `+44 7${Math.floor(Math.random() * 1000000000)}`,
              email: `customer${i + 1}@example.com`,
              address: `${i + 1} Sample Street, London`
            },
            project_interest: ['loft_conversion', 'extension', 'interior_decoration'][i % 3],
            created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
          }))
        }
      })
    }

    if (type === 'projects') {
      return NextResponse.json({
        success: true,
        data: {
          projects: Array.from({ length: 8 }, (_, i) => ({
            id: `project_${i + 1}`,
            entity_type: 'construction_project',
            entity_name: `Project ${i + 1}`,
            project_type: ['loft_conversion', 'extension', 'interior_decoration'][i % 3],
            status: ['planning', 'in_progress', 'completed'][i % 3],
            budget: Math.floor(Math.random() * 50000) + 15000,
            start_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            estimated_end_date: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
            customer_id: `customer_${Math.floor(Math.random() * 10) + 1}`,
            address: `${i + 1} Project Street, London`
          }))
        }
      })
    }

    if (type === 'quotes') {
      return NextResponse.json({
        success: true,
        data: {
          quotes: Array.from({ length: 12 }, (_, i) => ({
            id: `quote_${i + 1}`,
            entity_type: 'construction_quote',
            quote_number: `QUO-2025-${String(i + 1).padStart(3, '0')}`,
            customer_id: `customer_${Math.floor(Math.random() * 10) + 1}`,
            project_type: ['loft_conversion', 'extension', 'interior_decoration'][i % 3],
            total_amount: Math.floor(Math.random() * 40000) + 10000,
            vat_amount: Math.floor((Math.random() * 40000 + 10000) * 0.2),
            status: ['draft', 'sent', 'approved', 'rejected'][i % 4],
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
          }))
        }
      })
    }

    if (type === 'team') {
      return NextResponse.json({
        success: true,
        data: {
          team: [
            {
              id: 'team_1',
              entity_type: 'construction_team_member',
              name: 'John Smith',
              role: 'admin',
              title: 'Company Owner',
              skills: ['Project Management', 'Customer Relations'],
              phone: '+44 7123456789',
              availability: 'Full Time'
            },
            {
              id: 'team_2',
              entity_type: 'construction_team_member',
              name: 'Mike Johnson',
              role: 'worker',
              title: 'Site Foreman',
              skills: ['Carpentry', 'General Building'],
              phone: '+44 7987654321',
              availability: 'Full Time'
            },
            {
              id: 'team_3',
              entity_type: 'construction_team_member',
              name: 'Dave Wilson',
              role: 'subcontractor',
              title: 'Electrician',
              skills: ['Electrical Installation'],
              phone: '+44 7555123456',
              availability: 'Available'
            }
          ]
        }
      })
    }

    // Default: Return construction dashboard data
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalCustomers: 10,
          activeProjects: 5,
          pendingQuotes: 8,
          monthlyRevenue: 45000,
          teamMembers: 6
        },
        recentActivity: [
          { type: 'new_lead', message: 'New lead: Kitchen Extension', time: '2 hours ago' },
          { type: 'quote_approved', message: 'Quote approved: Loft Conversion', time: '4 hours ago' },
          { type: 'project_completed', message: 'Project completed: Interior Decoration', time: '1 day ago' }
        ],
        upcomingTasks: [
          { task: 'Site survey for new extension', due: 'Tomorrow', priority: 'high' },
          { task: 'Material delivery coordination', due: 'This week', priority: 'medium' },
          { task: 'Final inspection scheduling', due: 'Next week', priority: 'low' }
        ]
      }
    })

  } catch (error) {
    console.error('Construction API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, data } = body

    if (type === 'customer') {
      // Create customer entity in universal tables
      const customer = await constructionApi.createEntity({
        entity_type: 'construction_customer',
        entity_name: data.name,
        organization_id: data.organization_id || 'construction_org_1'
      })

      // Store custom customer fields
      const dynamicFields = [
        { field_name: 'phone', field_value: data.phone },
        { field_name: 'email', field_value: data.email },
        { field_name: 'address', field_value: data.address },
        { field_name: 'project_interest', field_value: data.project_interest },
        { field_name: 'lead_source', field_value: data.lead_source || 'website' },
        { field_name: 'communication_preference', field_value: data.communication_preference || 'email' }
      ]

      await constructionApi.storeDynamicData(customer.id, dynamicFields)

      // Create audit trail transaction
      await constructionApi.createTransaction({
        transaction_type: 'customer_created',
        reference_number: customer.entity_code,
        metadata: {
          customer_name: data.name,
          lead_source: data.lead_source,
          created_by: 'system'
        }
      })

      return NextResponse.json({
        success: true,
        data: customer,
        message: 'Customer created successfully'
      })
    }

    if (type === 'project') {
      // Create project entity
      const project = await constructionApi.createEntity({
        entity_type: 'construction_project',
        entity_name: data.title,
        organization_id: data.organization_id || 'construction_org_1'
      })

      // Store project details
      const dynamicFields = [
        { field_name: 'project_type', field_value: data.project_type },
        { field_name: 'customer_id', field_value: data.customer_id },
        { field_name: 'budget', field_value: data.budget.toString() },
        { field_name: 'start_date', field_value: data.start_date },
        { field_name: 'estimated_end_date', field_value: data.estimated_end_date },
        { field_name: 'address', field_value: data.address },
        { field_name: 'description', field_value: data.description }
      ]

      await constructionApi.storeDynamicData(project.id, dynamicFields)

      return NextResponse.json({
        success: true,
        data: project,
        message: 'Project created successfully'
      })
    }

    if (type === 'quote') {
      // Create quote entity
      const quote = await constructionApi.createEntity({
        entity_type: 'construction_quote',
        entity_name: `Quote for ${data.project_type}`,
        organization_id: data.organization_id || 'construction_org_1'
      })

      // Store quote details
      const dynamicFields = [
        { field_name: 'customer_id', field_value: data.customer_id },
        { field_name: 'project_type', field_value: data.project_type },
        { field_name: 'line_items', field_value: JSON.stringify(data.line_items) },
        { field_name: 'subtotal', field_value: data.subtotal.toString() },
        { field_name: 'vat_amount', field_value: data.vat_amount.toString() },
        { field_name: 'total_amount', field_value: data.total_amount.toString() },
        { field_name: 'valid_until', field_value: data.valid_until }
      ]

      await constructionApi.storeDynamicData(quote.id, dynamicFields)

      return NextResponse.json({
        success: true,
        data: quote,
        message: 'Quote created successfully'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request type'
    }, { status: 400 })

  } catch (error) {
    console.error('Construction API POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}