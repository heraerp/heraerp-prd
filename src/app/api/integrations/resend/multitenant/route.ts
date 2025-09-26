import { NextRequest, NextResponse } from 'next/server'
import { multiTenantResendService } from '@/lib/services/multitenant-resend-service'
import { isDemoMode, guardDemoOperation } from '@/lib/demo-guard'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get connector status and statistics
export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get('x-organization-id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Get connector configuration
    const connector = await multiTenantResendService.getOrganizationConnector(organizationId)
    if (!connector) {
      return NextResponse.json(
        {
          error: 'Resend connector not configured',
          setup_required: true,
          setup_url: `/organizations/${organizationId}/integrations/resend/setup`
        },
        { status: 404 }
      )
    }

    // Get email statistics
    const stats = await multiTenantResendService.getEmailStatistics(organizationId)

    // Validate current configuration
    const validation = await multiTenantResendService.validateConfiguration(organizationId)

    return NextResponse.json({
      connector: {
        id: connector.id,
        status: connector.status,
        from_email: connector.from_email,
        rate_limit: connector.rate_limit
      },
      validation,
      statistics: stats,
      demo_mode: isDemoMode(organizationId)
    })
  } catch (error: any) {
    console.error('Error getting connector status:', error)
    return NextResponse.json(
      { error: 'Failed to get connector status', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Send email through organization's Resend connector
export async function POST(req: NextRequest) {
  try {
    const organizationId = req.headers.get('x-organization-id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const body = await req.json()
    const { to, subject, html, text, from, cc, bcc, reply_to, attachments, tags, headers } = body

    // Validate required fields
    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and (html or text)' },
        { status: 400 }
      )
    }

    // Check demo mode
    const demoCheckResult = await guardDemoOperation({
      orgId: organizationId,
      operation: 'send_email',
      requestPath: req.nextUrl.pathname
    })

    if (!demoCheckResult.allowed) {
      // In demo mode, simulate sending but don't actually send
      return NextResponse.json(
        {
          success: true,
          messageId: `demo_${Date.now()}`,
          demo_mode: true,
          message: 'Email simulated in demo mode - not actually sent'
        },
        {
          headers: { 'X-Demo-Mode': 'true' }
        }
      )
    }

    // Send email using multi-tenant service
    const result = await multiTenantResendService.sendEmail(organizationId, {
      to,
      subject,
      html,
      text,
      from,
      cc,
      bcc,
      reply_to,
      attachments,
      tags,
      headers
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      organizationId
    })
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    )
  }
}

// PUT - Test connection
export async function PUT(req: NextRequest) {
  try {
    const organizationId = req.headers.get('x-organization-id')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Test connection
    const testResult = await multiTenantResendService.testConnection(organizationId)

    return NextResponse.json(testResult, {
      status: testResult.success ? 200 : 400
    })
  } catch (error: any) {
    console.error('Error testing connection:', error)
    return NextResponse.json(
      { error: 'Failed to test connection', details: error.message },
      { status: 500 }
    )
  }
}
