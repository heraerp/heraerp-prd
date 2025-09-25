import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
  tags?: Array<{
    name: string;
    value: string;
  }>;
  organizationId?: string;
}

interface EmailResult {
  id: string;
  from: string;
  to: string | string[];
  created_at: string;
}

// Check if we're in demo mode
function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true' || !process.env.RESEND_API_KEY;
}

// Get organization-specific configuration
async function getOrgEmailConfig(organizationId: string) {
  const { data } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_text')
    .eq('entity_id', organizationId)
    .in('field_name', ['resend_from_email', 'resend_reply_to']);

  const config: Record<string, string> = {};
  data?.forEach(item => {
    config[item.field_name] = item.field_value_text;
  });

  return config;
}

export async function sendEmailViaResend(options: SendEmailOptions): Promise<EmailResult> {
  const {
    to,
    subject,
    html,
    text,
    from,
    replyTo,
    cc,
    bcc,
    attachments,
    tags,
    organizationId
  } = options;

  // Demo mode - return mock result
  if (isDemoMode()) {
    console.log('📧 Demo Mode: Simulating email send', {
      to,
      subject,
      preview: text?.substring(0, 100) || html?.substring(0, 100)
    });

    return {
      id: `demo_${Date.now()}`,
      from: from || 'noreply@heraerp.com',
      to,
      created_at: new Date().toISOString()
    };
  }

  try {
    // Initialize Resend with API key
    const resend = new Resend(process.env.RESEND_API_KEY!);

    // Get organization-specific email settings if provided
    let orgConfig = {};
    if (organizationId) {
      orgConfig = await getOrgEmailConfig(organizationId);
    }

    // Prepare email payload
    const emailPayload = {
      from: from || orgConfig['resend_from_email'] || 'noreply@heraerp.com',
      to,
      subject,
      html,
      text,
      reply_to: replyTo || orgConfig['resend_reply_to'],
      cc,
      bcc,
      attachments,
      tags: tags || []
    };

    // Add organization tag if provided
    if (organizationId) {
      emailPayload.tags.push({
        name: 'organization_id',
        value: organizationId
      });
    }

    // Send email via Resend
    const { data, error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error('Resend API error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from Resend API');
    }

    return {
      id: data.id,
      from: emailPayload.from,
      to,
      created_at: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error sending email via Resend:', error);
    throw error;
  }
}

// Batch send emails
export async function sendBatchEmailsViaResend(
  emails: Array<Omit<SendEmailOptions, 'organizationId'> & { organizationId?: string }>
): Promise<Array<EmailResult | { error: string; email: SendEmailOptions }>> {
  const results = [];

  for (const email of emails) {
    try {
      const result = await sendEmailViaResend(email);
      results.push(result);
    } catch (error) {
      results.push({
        error: error instanceof Error ? error.message : 'Unknown error',
        email
      });
    }
  }

  return results;
}

// Email templates
export const EMAIL_TEMPLATES = {
  WELCOME: {
    subject: 'Welcome to {{organization_name}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome!</h1>
        <p>Hi {{name}},</p>
        <p>Welcome to {{organization_name}}. We're excited to have you on board.</p>
        <p>If you have any questions, please don't hesitate to reach out.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `
  },
  NOTIFICATION: {
    subject: '{{notification_type}}: {{title}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">{{title}}</h2>
        <p>{{message}}</p>
        <p style="margin-top: 20px;">
          <a href="{{action_url}}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            {{action_text}}
          </a>
        </p>
      </div>
    `
  },
  REPORT: {
    subject: '{{report_type}} Report - {{date}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">{{report_type}} Report</h1>
        <p style="color: #6b7280;">Generated on {{date}}</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          {{content}}
        </div>
        <p style="font-size: 12px; color: #6b7280;">
          This is an automated report. For questions, contact support.
        </p>
      </div>
    `
  }
};

// Replace template variables
export function renderTemplate(template: { subject: string; html: string }, data: Record<string, any>) {
  let subject = template.subject;
  let html = template.html;

  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, String(value));
    html = html.replace(regex, String(value));
  });

  return { subject, html };
}