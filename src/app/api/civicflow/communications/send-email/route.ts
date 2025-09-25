import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendTemplateEmail, sendBatchEmails } from '@/lib/email/resend-client';
import { createClient } from '@supabase/supabase-js';

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('X-Organization-Id') || CIVICFLOW_ORG_ID;
    const body = await request.json();

    const {
      action = 'send', // send | sendTemplate | sendBatch
      recipients, // For single: string, for batch: array
      constituentId,
      subject,
      content, // Can be HTML or plain text
      contentType = 'html', // html | text
      template, // Template name if using sendTemplate
      templateData, // Data for template variables
      attachments,
      metadata,
      replyTo,
      cc,
      bcc,
    } = body;

    // Validate required fields
    if (!recipients) {
      return NextResponse.json(
        { error: 'Recipients are required' },
        { status: 400 }
      );
    }

    // Get organization's default from address
    const { data: orgData } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text')
      .eq('entity_id', orgId)
      .eq('field_name', 'default_email_from')
      .single();

    const fromAddress = orgData?.field_value_text || 
                       process.env.RESEND_FROM_EMAIL || 
                       'noreply@civicflow.org';

    let result;

    switch (action) {
      case 'sendTemplate':
        if (!template || !templateData) {
          return NextResponse.json(
            { error: 'Template and templateData are required for sendTemplate' },
            { status: 400 }
          );
        }

        result = await sendTemplateEmail(template, {
          organizationId: orgId,
          constituentId,
          from: fromAddress,
          to: recipients,
          templateData,
          replyTo,
          cc,
          bcc,
          metadata,
        });
        break;

      case 'sendBatch':
        if (!Array.isArray(recipients)) {
          return NextResponse.json(
            { error: 'Recipients must be an array for batch send' },
            { status: 400 }
          );
        }

        result = await sendBatchEmails(recipients, {
          organizationId: orgId,
          from: fromAddress,
          subject,
          html: contentType === 'html' ? content : undefined,
          text: contentType === 'text' ? content : undefined,
          replyTo,
          attachments,
          metadata,
        });
        break;

      case 'send':
      default:
        if (!subject || !content) {
          return NextResponse.json(
            { error: 'Subject and content are required' },
            { status: 400 }
          );
        }

        result = await sendEmail({
          organizationId: orgId,
          constituentId,
          from: fromAddress,
          to: recipients,
          subject,
          html: contentType === 'html' ? content : undefined,
          text: contentType === 'text' ? content : undefined,
          replyTo,
          cc,
          bcc,
          attachments,
          metadata,
        });
        break;
    }

    return NextResponse.json({
      success: true,
      result,
      message: 'Email sent successfully',
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve available templates
export async function GET() {
  return NextResponse.json({
    templates: [
      {
        name: 'ORGANIZATION_WELCOME',
        description: 'Welcome email for new organizations',
        variables: ['organization_name', 'contact_name'],
      },
      {
        name: 'EVENT_INVITATION',
        description: 'Event invitation email',
        variables: ['organization_name', 'contact_name', 'event_name', 'event_date', 'event_time', 'event_location', 'event_description', 'registration_link'],
      },
      {
        name: 'GRANT_UPDATE',
        description: 'Grant application status update',
        variables: ['contact_name', 'grant_name', 'grant_status', 'grant_amount', 'grant_period', 'update_message'],
      },
    ],
    usage: {
      send: {
        description: 'Send a single email',
        example: {
          action: 'send',
          recipients: 'recipient@example.com',
          subject: 'Test Email',
          content: '<p>Hello World</p>',
          contentType: 'html',
        },
      },
      sendTemplate: {
        description: 'Send email using a template',
        example: {
          action: 'sendTemplate',
          recipients: 'recipient@example.com',
          template: 'ORGANIZATION_WELCOME',
          templateData: {
            organization_name: 'Test Org',
            contact_name: 'John Doe',
          },
        },
      },
      sendBatch: {
        description: 'Send to multiple recipients',
        example: {
          action: 'sendBatch',
          recipients: [
            { email: 'user1@example.com', constituentId: 'id1' },
            { email: 'user2@example.com', constituentId: 'id2' },
          ],
          subject: 'Batch Email',
          content: 'Hello Everyone',
          contentType: 'text',
        },
      },
    },
  });
}