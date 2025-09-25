import { NextRequest, NextResponse } from 'next/server';
import { sendEmailViaResend, renderTemplate, EMAIL_TEMPLATES } from '@/lib/services/resend-service';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const organizationId = req.headers.get('x-organization-id') || process.env.DEFAULT_ORGANIZATION_ID;
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const {
      to,
      subject,
      html,
      text,
      template,
      templateData,
      from,
      replyTo,
      cc,
      bcc,
      attachments,
      tags
    } = body;

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient email (to) is required' },
        { status: 400 }
      );
    }

    // Prepare email content
    let emailSubject = subject;
    let emailHtml = html;
    let emailText = text;

    // If template is specified, render it
    if (template && templateData) {
      const templateObj = EMAIL_TEMPLATES[template as keyof typeof EMAIL_TEMPLATES];
      if (templateObj) {
        const rendered = renderTemplate(templateObj, templateData);
        emailSubject = rendered.subject;
        emailHtml = rendered.html;
      }
    }

    // Ensure we have either subject or template
    if (!emailSubject) {
      return NextResponse.json(
        { error: 'Email subject is required' },
        { status: 400 }
      );
    }

    // Ensure we have content
    if (!emailHtml && !emailText) {
      return NextResponse.json(
        { error: 'Email content (html or text) is required' },
        { status: 400 }
      );
    }

    // Log transaction before sending (QUEUED)
    const { data: queuedTxn, error: queueError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'communication',
        transaction_code: `EMAIL-QUEUE-${Date.now()}`,
        smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.QUEUED.V1',
        transaction_date: new Date().toISOString(),
        status: 'pending',
        metadata: {
          channel: 'email',
          provider: 'resend',
          to: Array.isArray(to) ? to : [to],
          subject: emailSubject,
          template,
          has_attachments: attachments && attachments.length > 0
        }
      })
      .select()
      .single();

    if (queueError) {
      console.error('Error logging queued transaction:', queueError);
    }

    try {
      // Send email via Resend
      const result = await sendEmailViaResend({
        to,
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
        from,
        replyTo,
        cc,
        bcc,
        attachments,
        tags,
        organizationId
      });

      // Log successful send transaction
      const { data: sentTxn, error: sentError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'communication',
          transaction_code: `EMAIL-SENT-${Date.now()}`,
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.SENT.V1',
          transaction_date: new Date().toISOString(),
          status: 'completed',
          reference_id: queuedTxn?.id,
          metadata: {
            channel: 'email',
            provider: 'resend',
            resend_email_id: result.id,
            to: Array.isArray(to) ? to : [to],
            from: result.from,
            subject: emailSubject,
            template,
            sent_at: result.created_at
          }
        })
        .select()
        .single();

      if (sentError) {
        console.error('Error logging sent transaction:', sentError);
      }

      // Update queued transaction to completed if it exists
      if (queuedTxn) {
        await supabase
          .from('universal_transactions')
          .update({
            status: 'completed',
            metadata: {
              ...queuedTxn.metadata,
              resend_email_id: result.id,
              sent_at: result.created_at
            }
          })
          .eq('id', queuedTxn.id);
      }

      return NextResponse.json({
        success: true,
        result: {
          id: result.id,
          from: result.from,
          to: result.to,
          created_at: result.created_at,
          transaction_id: sentTxn?.id
        },
        message: 'Email sent successfully'
      });

    } catch (sendError) {
      // Log failed send transaction
      const { error: failedError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'communication',
          transaction_code: `EMAIL-FAILED-${Date.now()}`,
          smart_code: 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.FAILED.V1',
          transaction_date: new Date().toISOString(),
          status: 'failed',
          reference_id: queuedTxn?.id,
          metadata: {
            channel: 'email',
            provider: 'resend',
            to: Array.isArray(to) ? to : [to],
            subject: emailSubject,
            error: sendError instanceof Error ? sendError.message : 'Unknown error',
            failed_at: new Date().toISOString()
          }
        });

      if (failedError) {
        console.error('Error logging failed transaction:', failedError);
      }

      // Update queued transaction to failed if it exists
      if (queuedTxn) {
        await supabase
          .from('universal_transactions')
          .update({
            status: 'failed',
            metadata: {
              ...queuedTxn.metadata,
              error: sendError instanceof Error ? sendError.message : 'Unknown error',
              failed_at: new Date().toISOString()
            }
          })
          .eq('id', queuedTxn.id);
      }

      throw sendError;
    }

  } catch (error) {
    console.error('Error in Resend send endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check connector status and available templates
export async function GET(req: NextRequest) {
  try {
    const organizationId = req.headers.get('x-organization-id') || process.env.DEFAULT_ORGANIZATION_ID;

    // Get connector status
    const { data: connector } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'connector')
      .eq('smart_code', 'HERA.INTEGRATION.CONNECTOR.RESEND.V1')
      .single();

    // Get connector configuration
    const { data: config } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text')
      .eq('entity_id', connector?.id)
      .in('field_name', ['status', 'from_email', 'provider']);

    const configMap: Record<string, string> = {};
    config?.forEach(item => {
      configMap[item.field_name] = item.field_value_text;
    });

    return NextResponse.json({
      connector: {
        id: connector?.id,
        name: connector?.entity_name,
        status: configMap.status || 'not_configured',
        provider: configMap.provider || 'resend',
        from_email: configMap.from_email || 'noreply@heraerp.com',
        has_api_key: !!process.env.RESEND_API_KEY,
        demo_mode: !process.env.RESEND_API_KEY
      },
      templates: Object.keys(EMAIL_TEMPLATES).map(key => ({
        id: key,
        name: key.toLowerCase().replace('_', ' '),
        variables: extractTemplateVariables(EMAIL_TEMPLATES[key as keyof typeof EMAIL_TEMPLATES])
      })),
      usage: {
        endpoint: '/api/integrations/resend/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Organization-Id': 'your-org-id'
        },
        examples: {
          simple: {
            to: 'user@example.com',
            subject: 'Test Email',
            text: 'This is a test email'
          },
          with_template: {
            to: 'user@example.com',
            template: 'WELCOME',
            templateData: {
              name: 'John Doe',
              organization_name: 'HERA Corp'
            }
          },
          advanced: {
            to: ['user1@example.com', 'user2@example.com'],
            subject: 'Important Update',
            html: '<h1>Update</h1><p>This is an important update.</p>',
            cc: 'manager@example.com',
            tags: [
              { name: 'campaign', value: 'q1-2024' }
            ]
          }
        }
      }
    });

  } catch (error) {
    console.error('Error getting Resend status:', error);
    return NextResponse.json(
      { error: 'Failed to get connector status' },
      { status: 500 }
    );
  }
}

// Helper to extract template variables
function extractTemplateVariables(template: { subject: string; html: string }): string[] {
  const variables = new Set<string>();
  const regex = /{{(\w+)}}/g;
  
  let match;
  while ((match = regex.exec(template.subject)) !== null) {
    variables.add(match[1]);
  }
  while ((match = regex.exec(template.html)) !== null) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
}