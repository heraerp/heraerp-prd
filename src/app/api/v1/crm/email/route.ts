/**
 * HERA CRM Email API Endpoint
 * Handles email sending, templates, and history
 *
 * Project Manager Task: Email Integration Backend
 */

import { NextRequest, NextResponse } from 'next/server'
import { createEmailService, EmailMessage } from '@/src/lib/crm/email-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, organizationId, data } = body

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const emailService = createEmailService(organizationId)

    switch (action) {
      case 'send_email': {
        const { emailData } = data
        const result = await emailService.sendEmail(emailData as EmailMessage)
        return NextResponse.json(result)
      }

      case 'get_templates': {
        const { category } = data || {}
        const templates = await emailService.getEmailTemplates(category)
        return NextResponse.json({ success: true, templates })
      }

      case 'get_history': {
        const { contactId } = data
        if (!contactId) {
          return NextResponse.json(
            { success: false, error: 'Contact ID is required' },
            { status: 400 }
          )
        }
        const history = await emailService.getEmailHistory(contactId)
        return NextResponse.json({ success: true, emails: history })
      }

      case 'process_template': {
        const { templateId, variables } = data
        const templates = await emailService.getEmailTemplates()
        const template = templates.find(t => t.id === templateId)

        if (!template) {
          return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
        }

        const processed = emailService.processTemplate(template, variables || {})
        return NextResponse.json({ success: true, processed })
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('CRM Email API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const action = searchParams.get('action')

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const emailService = createEmailService(organizationId)

    switch (action) {
      case 'templates': {
        const category = searchParams.get('category')
        const templates = await emailService.getEmailTemplates(category || undefined)
        return NextResponse.json({ success: true, templates })
      }

      case 'history': {
        const contactId = searchParams.get('contactId')
        if (!contactId) {
          return NextResponse.json(
            { success: false, error: 'Contact ID is required' },
            { status: 400 }
          )
        }
        const history = await emailService.getEmailHistory(contactId)
        return NextResponse.json({ success: true, emails: history })
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('CRM Email API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    )
  }
}
