import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Get organization-specific Resend client
async function getResendClient(organizationId: string): Promise<Resend> {
  // Try to get organization-specific Resend API key
  const { data } = await supabase
    .from('core_dynamic_data')
    .select('field_value_text')
    .eq('entity_id', organizationId)
    .eq('field_name', 'resend_api_key')
    .single()

  if (data?.field_value_text) {
    // Use organization-specific API key
    return new Resend(data.field_value_text)
  }

  // Fallback to default API key
  if (!process.env.RESEND_API_KEY) {
    throw new Error('No Resend API key configured')
  }

  return new Resend(process.env.RESEND_API_KEY)
}

export interface SendEmailOptions {
  organizationId: string
  constituentId?: string
  from: string
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: Array<{
    filename: string
    content: Buffer | string
  }>
  metadata?: Record<string, any>
  templateData?: Record<string, any>
  smartCode?: string
}

export interface EmailTemplate {
  name: string
  subject: string
  html: string
  text?: string
  variables: string[]
}

// Common email templates
export const EMAIL_TEMPLATES = {
  ORGANIZATION_WELCOME: {
    name: 'organization_welcome',
    subject: 'Welcome to CivicFlow - {{organization_name}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to CivicFlow!</h1>
        <p>Dear {{contact_name}},</p>
        <p>We're thrilled to have {{organization_name}} join the CivicFlow community.</p>
        <p>Your organization profile has been created and you can now:</p>
        <ul>
          <li>Track engagement and communications</li>
          <li>Manage funding opportunities</li>
          <li>Coordinate events and programs</li>
          <li>Access resources and support</li>
        </ul>
        <p>If you have any questions, please don't hesitate to reach out.</p>
        <p>Best regards,<br>The CivicFlow Team</p>
      </div>
    `,
    variables: ['organization_name', 'contact_name']
  },
  EVENT_INVITATION: {
    name: 'event_invitation',
    subject: "You're Invited: {{event_name}}",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">You're Invited!</h1>
        <h2>{{event_name}}</h2>
        <p>Dear {{contact_name}},</p>
        <p>We would like to invite {{organization_name}} to participate in our upcoming event.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Date:</strong> {{event_date}}</p>
          <p><strong>Time:</strong> {{event_time}}</p>
          <p><strong>Location:</strong> {{event_location}}</p>
        </div>
        <p>{{event_description}}</p>
        <a href="{{registration_link}}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Register Now</a>
        <p style="margin-top: 20px;">We hope to see you there!</p>
      </div>
    `,
    variables: [
      'organization_name',
      'contact_name',
      'event_name',
      'event_date',
      'event_time',
      'event_location',
      'event_description',
      'registration_link'
    ]
  },
  GRANT_UPDATE: {
    name: 'grant_update',
    subject: 'Grant Application Update - {{grant_name}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Grant Application Update</h1>
        <p>Dear {{contact_name}},</p>
        <p>We have an update regarding your grant application for {{grant_name}}.</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Status:</strong> {{grant_status}}</p>
          <p><strong>Amount:</strong> {{grant_amount}}</p>
          <p><strong>Period:</strong> {{grant_period}}</p>
        </div>
        <p>{{update_message}}</p>
        <p>If you have any questions about this update, please contact your grant manager.</p>
        <p>Best regards,<br>The Grants Team</p>
      </div>
    `,
    variables: [
      'contact_name',
      'grant_name',
      'grant_status',
      'grant_amount',
      'grant_period',
      'update_message'
    ]
  }
}

// Replace template variables
function replaceTemplateVariables(template: string, data: Record<string, any>): string {
  let result = template
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, String(value))
  })
  return result
}

// Send email through Resend with CivicFlow integration
export async function sendEmail(options: SendEmailOptions) {
  try {
    const {
      organizationId,
      constituentId,
      from,
      to,
      subject,
      html,
      text,
      replyTo,
      cc,
      bcc,
      attachments,
      metadata = {},
      smartCode = 'HERA.PUBLICSECTOR.COMM.EMAIL.SEND.V1'
    } = options

    // Get organization-specific Resend client
    const resend = await getResendClient(organizationId)

    // Get organization-specific from address
    const { data: orgEmailData } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('entity_id', organizationId)
      .eq('field_name', 'resend_from_email')
      .single()

    const orgFromEmail = orgEmailData?.field_value_text
    const finalFromEmail = orgFromEmail || from

    // Create a tag to link the email to organization and constituent
    const tag = constituentId ? `${organizationId}:${constituentId}` : organizationId

    // Send email through Resend
    const { data, error } = await resend.emails.send({
      from: finalFromEmail,
      to,
      subject,
      html,
      text,
      replyTo,
      cc,
      bcc,
      attachments,
      tags: [
        {
          name: 'org_constituent',
          value: tag
        }
      ],
      headers: {
        'X-Organization-Id': organizationId,
        'X-Constituent-Id': constituentId || ''
      }
    })

    if (error) {
      throw error
    }

    // Record the email send in CivicFlow
    const { data: transaction } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'communication',
        transaction_code: `EMAIL-SEND-${Date.now()}`,
        smart_code: smartCode,
        transaction_date: new Date().toISOString(),
        status: 'completed',
        metadata: {
          resend_email_id: data?.id,
          channel: 'email',
          direction: 'outbound',
          from_email: from,
          to_emails: Array.isArray(to) ? to : [to],
          cc_emails: cc ? (Array.isArray(cc) ? cc : [cc]) : [],
          bcc_emails: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : [],
          subject,
          has_attachments: attachments && attachments.length > 0,
          attachment_count: attachments?.length || 0,
          constituent_id: constituentId,
          ...metadata
        }
      })
      .select()
      .single()

    // Create relationship to constituent if provided
    if (transaction && constituentId) {
      await supabase.from('core_relationships').insert({
        organization_id: organizationId,
        from_entity_id: transaction.id,
        to_entity_id: constituentId,
        relationship_type: 'communication_to_constituent',
        smart_code: 'HERA.PUBLICSECTOR.CRM.REL.COMM.CONSTITUENT.V1',
        metadata: {
          communication_type: 'email',
          channel: 'email',
          direction: 'outbound'
        }
      })
    }

    return {
      success: true,
      emailId: data?.id,
      transactionId: transaction?.id
    }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

// Send email using template
export async function sendTemplateEmail(
  templateName: keyof typeof EMAIL_TEMPLATES,
  options: Omit<SendEmailOptions, 'html' | 'text'> & { templateData: Record<string, any> }
) {
  const template = EMAIL_TEMPLATES[templateName]

  if (!template) {
    throw new Error(`Template ${templateName} not found`)
  }

  // Replace variables in subject and content
  const subject = replaceTemplateVariables(template.subject, options.templateData)
  const html = replaceTemplateVariables(template.html, options.templateData)
  const text = (template as any).text
    ? replaceTemplateVariables((template as any).text, options.templateData)
    : undefined

  // Send email with processed template
  return sendEmail({
    ...options,
    subject,
    html,
    text,
    smartCode: `HERA.PUBLICSECTOR.COMM.EMAIL.TEMPLATE.${templateName}.V1`
  })
}

// Batch send emails to multiple recipients
export async function sendBatchEmails(
  recipients: Array<{ email: string; constituentId?: string; data?: Record<string, any> }>,
  baseOptions: Omit<SendEmailOptions, 'to' | 'constituentId'>
) {
  const results = []

  for (const recipient of recipients) {
    try {
      const result = await sendEmail({
        ...baseOptions,
        to: recipient.email,
        constituentId: recipient.constituentId,
        metadata: {
          ...baseOptions.metadata,
          ...recipient.data
        }
      })
      results.push({ success: true, email: recipient.email, ...result })
    } catch (error) {
      results.push({ success: false, email: recipient.email, error: error.message })
    }
  }

  return results
}
