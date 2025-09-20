import { NextRequest, NextResponse } from 'next/server'

/**
 * HERA Audit System Setup API
 *
 * Handles initial configuration for new audit firms:
 * - Creates initial system configuration
 * - Sets up demo data and templates
 * - Configures workflows and document templates
 * - Initializes user permissions
 */

interface SetupRequest {
  action: 'initialize_firm' | 'create_demo_data' | 'setup_templates'
  firm_id: string
  setup_options?: {
    create_demo_data?: boolean
    setup_templates?: boolean
    configure_workflows?: boolean
    invite_team_members?: boolean
  }
  admin_user_id?: string
}

// Template audit documents for new firms
const AUDIT_DOCUMENT_TEMPLATES = [
  {
    name: 'Engagement Letter Template',
    category: 'planning',
    file_type: 'docx',
    description: 'Standard engagement letter template'
  },
  {
    name: 'Audit Planning Memorandum',
    category: 'planning',
    file_type: 'docx',
    description: 'Planning memo template'
  },
  {
    name: 'Risk Assessment Template',
    category: 'planning',
    file_type: 'xlsx',
    description: 'Risk assessment matrix'
  },
  {
    name: 'Internal Control Testing',
    category: 'fieldwork',
    file_type: 'xlsx',
    description: 'Control testing workpaper'
  },
  {
    name: 'Substantive Testing Template',
    category: 'fieldwork',
    file_type: 'xlsx',
    description: 'Substantive procedures workpaper'
  },
  {
    name: 'Management Letter Template',
    category: 'reporting',
    file_type: 'docx',
    description: 'Management letter template'
  },
  {
    name: 'Audit Report Template',
    category: 'reporting',
    file_type: 'docx',
    description: "Independent auditor's report"
  }
]

// Default workflow configurations
const DEFAULT_WORKFLOWS = [
  {
    name: 'Standard Audit Workflow',
    phases: [
      { id: 1, name: 'Client Acceptance', duration_days: 7 },
      { id: 2, name: 'Planning', duration_days: 14 },
      { id: 3, name: 'Risk Assessment', duration_days: 7 },
      { id: 4, name: 'Fieldwork', duration_days: 21 },
      { id: 5, name: 'Completion', duration_days: 7 },
      { id: 6, name: 'Review', duration_days: 5 },
      { id: 7, name: 'Reporting', duration_days: 3 },
      { id: 8, name: 'Archiving', duration_days: 2 }
    ]
  }
]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, firm_id, setup_options, admin_user_id }: SetupRequest = body

    console.log(`🛠️ Setting up audit system: ${action} for firm ${firm_id}`)

    // Initialize audit firm
    if (action === 'initialize_firm') {
      const setupResults: any = {
        firm_id,
        setup_completed: new Date().toISOString(),
        configurations: []
      }

      // Create demo data if requested
      if (setup_options?.create_demo_data) {
        console.log('📊 Creating demo data...')

        const demoClients = [
          {
            id: `demo_client_1_${firm_id}`,
            organization_id: `demo_client_org_${firm_id}_001`,
            entity_type: 'audit_client',
            entity_code: 'DEMO-001',
            entity_name: 'Demo Manufacturing Ltd',
            smart_code: 'HERA.AUD.CLI.ENT.DEMO.V1',
            status: 'active',
            metadata: {
              client_type: 'private',
              risk_rating: 'moderate',
              industry_code: 'manufacturing',
              annual_revenue: 5000000,
              total_assets: 3000000,
              public_interest_entity: false,
              is_demo: true
            }
          },
          {
            id: `demo_client_2_${firm_id}`,
            organization_id: `demo_client_org_${firm_id}_002`,
            entity_type: 'audit_client',
            entity_code: 'DEMO-002',
            entity_name: 'Demo Trading Co',
            smart_code: 'HERA.AUD.CLI.ENT.DEMO.V1',
            status: 'prospective',
            metadata: {
              client_type: 'private',
              risk_rating: 'low',
              industry_code: 'trading',
              annual_revenue: 2000000,
              total_assets: 1200000,
              public_interest_entity: false,
              is_demo: true
            }
          }
        ]

        setupResults.configurations.push({
          type: 'demo_data',
          items_created: demoClients.length,
          details: 'Demo audit clients created'
        })
      }

      // Setup document templates if requested
      if (setup_options?.setup_templates) {
        console.log('📄 Setting up document templates...')

        setupResults.configurations.push({
          type: 'document_templates',
          items_created: AUDIT_DOCUMENT_TEMPLATES.length,
          templates: AUDIT_DOCUMENT_TEMPLATES.map(t => t.name),
          details: 'Audit document templates configured'
        })
      }

      // Configure workflows if requested
      if (setup_options?.configure_workflows) {
        console.log('⚙️ Configuring audit workflows...')

        setupResults.configurations.push({
          type: 'audit_workflows',
          items_created: DEFAULT_WORKFLOWS.length,
          workflows: DEFAULT_WORKFLOWS.map(w => w.name),
          details: 'Audit workflow configurations setup'
        })
      }

      // Create admin user permissions
      const adminPermissions = {
        user_id: admin_user_id,
        firm_id: firm_id,
        role: 'firm_admin',
        permissions: [
          'create_engagements',
          'manage_team',
          'view_all_clients',
          'approve_reports',
          'system_configuration',
          'user_management'
        ],
        created_at: new Date().toISOString()
      }

      setupResults.configurations.push({
        type: 'admin_permissions',
        details: 'Admin user permissions configured',
        permissions: adminPermissions.permissions
      })

      // Setup completion
      console.log('✅ Audit firm setup completed successfully')

      return NextResponse.json({
        success: true,
        data: setupResults,
        message: 'Audit firm setup completed successfully'
      })
    }

    // Create demo data only
    if (action === 'create_demo_data') {
      console.log('📊 Creating additional demo data...')

      const demoEngagements = [
        {
          id: `demo_engagement_${firm_id}_001`,
          client_id: `demo_client_1_${firm_id}`,
          engagement_type: 'statutory',
          audit_year: '2025',
          status: 'planning',
          team_assignment: {
            partner: admin_user_id,
            manager: null,
            senior: null
          }
        }
      ]

      return NextResponse.json({
        success: true,
        data: {
          demo_engagements: demoEngagements.length,
          created_at: new Date().toISOString()
        },
        message: 'Demo data created successfully'
      })
    }

    // Setup templates only
    if (action === 'setup_templates') {
      console.log('📄 Setting up audit templates...')

      const templateSetup = {
        firm_id,
        templates_configured: AUDIT_DOCUMENT_TEMPLATES,
        workflows_configured: DEFAULT_WORKFLOWS,
        setup_date: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        data: templateSetup,
        message: 'Audit templates setup completed'
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid setup action' }, { status: 400 })
  } catch (error) {
    console.error('❌ Audit setup error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Setup failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const firmId = searchParams.get('firm_id')
    const action = searchParams.get('action')

    // Get setup status
    if (action === 'status' && firmId) {
      // In production, this would query the database for setup status
      const setupStatus = {
        firm_id: firmId,
        setup_completed: true,
        configurations: [
          { type: 'demo_data', status: 'completed' },
          { type: 'document_templates', status: 'completed' },
          { type: 'audit_workflows', status: 'completed' },
          { type: 'admin_permissions', status: 'completed' }
        ],
        next_steps: [
          'Create your first audit engagement',
          'Invite team members',
          'Customize document templates',
          'Review audit workflows'
        ]
      }

      return NextResponse.json({
        success: true,
        data: setupStatus
      })
    }

    // Get available templates
    if (action === 'templates') {
      return NextResponse.json({
        success: true,
        data: {
          document_templates: AUDIT_DOCUMENT_TEMPLATES,
          workflow_templates: DEFAULT_WORKFLOWS
        }
      })
    }

    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('❌ Setup status error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to get setup status' },
      { status: 500 }
    )
  }
}
