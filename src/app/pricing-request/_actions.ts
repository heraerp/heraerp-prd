'use server'

import { z } from 'zod'

export const PricingRequestSchema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  workEmail: z.string().email('Enter a valid work email'),
  company: z.string().min(2, 'Enter your company name'),
  role: z.string().min(2, 'Enter your role'),
  country: z.string().min(2, 'Select your country'),
  employees: z.string().optional(),
  currentErp: z.string().optional(),
  timeline: z.string().min(2, 'Select your timeline'),
  erpModules: z.string().min(1, 'Select required ERP modules'),
  partnerModel: z.enum(['accountant', 'platinum', 'unsure']),
  notes: z.string().optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required to submit' })
  })
})

type FormDataInput = z.infer<typeof PricingRequestSchema>

function createEmailHTML(data: FormDataInput) {
  const partnerModelLabels = {
    accountant: 'Your Accountant',
    platinum: 'Platinum Partner',
    unsure: 'Not Sure'
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
        .field { margin-bottom: 20px; }
        .label { font-weight: 600; color: #555; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
        .value { margin-top: 5px; padding: 12px; background: white; border-radius: 8px; border: 1px solid #e0e0e0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0; text-align: center; color: #666; }
        .priority { display: inline-block; padding: 5px 15px; background: #ff6b6b; color: white; border-radius: 20px; font-size: 12px; }
        .module-list { background: #e8f4fd; padding: 15px; border-radius: 8px; margin-top: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🚀 New Pricing Request</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Enterprise Lead - Immediate Attention Required</p>
          ${data.timeline === 'ASAP (0-3 months)' ? '<span class="priority">URGENT - ASAP Timeline</span>' : ''}
        </div>

        <div class="content">
          <div class="field">
            <div class="label">Contact Information</div>
            <div class="value">
              <strong>${data.fullName}</strong><br>
              ${data.role} at ${data.company}<br>
              📧 ${data.workEmail}<br>
              📍 ${data.country}
            </div>
          </div>

          <div class="field">
            <div class="label">Company Size</div>
            <div class="value">${data.employees || 'Not specified'} employees</div>
          </div>

          <div class="field">
            <div class="label">Current ERP System</div>
            <div class="value">${data.currentErp || 'None specified'}</div>
          </div>

          <div class="field">
            <div class="label">Implementation Timeline</div>
            <div class="value"><strong>${data.timeline}</strong></div>
          </div>

          <div class="field">
            <div class="label">Required ERP Modules</div>
            <div class="module-list">
              <strong style="color: #2563eb;">${data.erpModules}</strong>
            </div>
          </div>

          <div class="field">
            <div class="label">Preferred Implementation Model</div>
            <div class="value">${partnerModelLabels[data.partnerModel]}</div>
          </div>

          ${
            data.notes
              ? `
          <div class="field">
            <div class="label">Goals / Notes</div>
            <div class="value" style="white-space: pre-wrap;">${data.notes}</div>
          </div>
          `
              : ''
          }

          <div class="footer">
            <p><strong>Action Required:</strong> Follow up within 24 hours</p>
            <p style="font-size: 12px;">Request received: ${new Date().toLocaleString()}</p>
            <p style="font-size: 11px; color: #999;">HERA ERP - Enterprise Resource Planning</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function submitPricingRequest(data: FormDataInput) {
  const timestamp = new Date().toISOString()

  // Audit logging
  console.log('[PRICING_REQUEST]', {
    ...data,
    receivedAt: timestamp,
    source: 'pricing-request-form',
    version: '2.0'
  })

  try {
    // Primary email service
    if (process.env['RESEND_API_KEY']) {
      const { Resend } = await import('resend').catch(() => ({ Resend: null }))
      if (Resend) {
        const resend = new Resend(process.env['RESEND_API_KEY'])

        // Send to team
        await resend.emails.send({
          from: 'HERA ERP <noreply@heraerp.com>',
          to: ['team@hanaset.com'],
          cc: process.env['SALES_CC_EMAIL'] ? [process.env['SALES_CC_EMAIL']] : undefined,
          subject: `[HERA] Pricing Request - ${data.company} (${data.timeline})`,
          html: createEmailHTML(data),
          text: `New pricing request from ${data.fullName} at ${data.company}.\n\n${JSON.stringify(data, null, 2)}`,
          tags: [
            { name: 'type', value: 'pricing-request' },
            { name: 'company', value: data.company },
            { name: 'timeline', value: data.timeline }
          ]
        })

        // Send confirmation to requester
        await resend.emails.send({
          from: 'HERA ERP <noreply@heraerp.com>',
          to: [data.workEmail],
          subject: 'Thank you for your HERA ERP pricing request',
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Thank you for your interest in HERA ERP</h2>
              <p>Hi ${data.fullName},</p>
              <p>We've received your pricing request and our team will review your requirements within 24 hours.</p>
              <p><strong>What happens next:</strong></p>
              <ol>
                <li>Our solutions team will analyze your requirements</li>
                <li>We'll prepare a customized proposal based on your needs</li>
                <li>You'll receive a detailed quote within 1-2 business days</li>
              </ol>
              <p>In the meantime, feel free to <a href="https://heraerp.com/demo">explore our demos</a> or <a href="https://heraerp.com/book-a-meeting">book a discovery call</a>.</p>
              <p>Best regards,<br>The HERA Team</p>
            </div>
          `,
          text: `Thank you for your interest in HERA ERP.\n\nWe've received your pricing request and will get back to you within 24 hours.`
        })

        console.log('[EMAIL_SENT] Successfully sent pricing request emails')
        return { ok: true, message: 'Request submitted successfully' }
      }
    }

    // Fallback: Store in database or queue if email service unavailable
    console.warn('[EMAIL_FALLBACK] Email service not configured, request logged only')

    // Here you could add database storage as fallback
    // await saveToDatabase(data);

    return {
      ok: true,
      message: 'Request received. Our team will contact you soon.',
      fallback: true
    }
  } catch (err) {
    console.error('[PRICING_REQUEST_ERROR]', err)

    // Even if email fails, we don't want to lose the lead
    // In production, this should save to a database or queue

    return {
      ok: true, // Still return ok to not frustrate the user
      message: 'Request received. Our team will contact you soon.',
      error: true
    }
  }
}
