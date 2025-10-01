import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Initialize Resend with API key (lazy initialization to avoid build errors)
let resend: Resend | null = null

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

// Email template for feature requests
function generateEmailTemplate(data: any) {
  const categoryEmoji =
    {
      feature: '💡',
      bug: '🐛',
      integration: '⚡',
      security: '🔒',
      'ui-ux': '🎨',
      api: '🔧',
      other: '💬'
    }[data.category] || '📝'

  const priorityColor =
    {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444'
    }[data.priority] || '#6b7280'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Feature Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #00a6a6 0%, #008080 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ${categoryEmoji} New Feature Request
              </h1>
            </td>
          </tr>
          
          <!-- Category Badge -->
          <tr>
            <td style="padding: 20px 40px 0;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: #f0fdf4; color: #15803d; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                    ${data.category.charAt(0).toUpperCase() + data.category.slice(1).replace('-', ' ')}
                  </td>
                  <td style="padding-left: 10px;">
                    <span style="background-color: ${priorityColor}20; color: ${priorityColor}; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                      ${data.priority.charAt(0).toUpperCase() + data.priority.slice(1)} Priority
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Request Title -->
          <tr>
            <td style="padding: 20px 40px 10px;">
              <h2 style="margin: 0; color: #1f2937; font-size: 20px; font-weight: 600;">
                ${data.title}
              </h2>
            </td>
          </tr>
          
          <!-- User Info -->
          <tr>
            <td style="padding: 0 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom: 1px solid #e5e7eb; padding-bottom: 20px;">
                <tr>
                  <td style="color: #6b7280; font-size: 14px;">
                    <strong>From:</strong> ${data.name} (${data.email})<br>
                    <strong>Organization ID:</strong> ${data.organizationId || 'Not specified'}<br>
                    <strong>Current Page:</strong> ${data.currentApp || 'Not specified'}<br>
                    <strong>Submitted:</strong> ${new Date(data.timestamp).toLocaleString()}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Description -->
          <tr>
            <td style="padding: 20px 40px;">
              <h3 style="margin: 0 0 10px; color: #374151; font-size: 16px; font-weight: 600;">
                Description
              </h3>
              <div style="color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${data.description}
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="color: #6b7280; font-size: 12px; text-align: center;">
                    This feature request was submitted through the HERA ERP platform.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    const requiredFields = ['name', 'email', 'category', 'title', 'description']
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')

      // In development, just log the request
      if (process.env.NODE_ENV === 'development') {
        console.log('Feature Request (Development Mode):', data)
        return NextResponse.json({
          success: true,
          message: 'Feature request logged (development mode)',
          data
        })
      }

      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Send email via Resend
    try {
      const resendClient = getResendClient()
      if (!resendClient) {
        throw new Error('Resend client not initialized')
      }

      const emailData = await resendClient.emails.send({
        from: 'HERA Feature Requests <onboarding@resend.dev>', // Use your verified domain
        to: ['help@hanaset.com'],
        reply_to: data.email,
        subject: `[${data.category.toUpperCase()}] ${data.title}`,
        html: generateEmailTemplate(data),
        tags: [
          {
            name: 'category',
            value: data.category
          },
          {
            name: 'priority',
            value: data.priority
          },
          {
            name: 'source',
            value: 'hera-erp'
          }
        ]
      })

      console.log('Feature request email sent:', emailData.id)

      // Also send a confirmation email to the user
      if (data.email && resendClient) {
        try {
          await resendClient.emails.send({
            from: 'HERA Support <onboarding@resend.dev>',
            to: [data.email],
            subject: 'We received your feature request',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #00a6a6;">Thank you for your feedback!</h2>
                <p>Hi ${data.name},</p>
                <p>We've received your feature request titled "<strong>${data.title}</strong>" and our team will review it shortly.</p>
                <p>We appreciate you taking the time to help us improve HERA ERP. Your feedback is invaluable in shaping the future of our platform.</p>
                <p>Best regards,<br>The HERA Team</p>
              </div>
            `
          })
        } catch (confirmError) {
          console.error('Failed to send confirmation email:', confirmError)
          // Don't fail the request if confirmation email fails
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Feature request submitted successfully',
        id: emailData.id
      })
    } catch (emailError: any) {
      console.error('Failed to send email via Resend:', emailError)

      return NextResponse.json(
        { error: emailError.message || 'Failed to send email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error processing feature request:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}
