import { universalApi } from '@/lib/universal-api'

interface EmailAddress {
  email: string
  name?: string
}

interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType?: string
}

interface SendEmailParams {
  from: string | EmailAddress
  to: string[] | EmailAddress[]
  cc?: string[] | EmailAddress[]
  bcc?: string[] | EmailAddress[]
  subject: string
  html?: string
  text?: string
  attachments?: EmailAttachment[]
  replyTo?: string | EmailAddress
  tags?: Array<{ name: string; value: string }>
}

interface ResendResponse {
  id: string
  from: string
  to: string[]
  created_at: string
}

export class ResendEmailService {
  private apiKey: string
  private baseUrl = 'https://api.resend.com'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Send an email via Resend API
   */
  async sendEmail(params: SendEmailParams): Promise<ResendResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/emails`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: params.from,
          to: params.to,
          cc: params.cc,
          bcc: params.bcc,
          subject: params.subject,
          html: params.html,
          text: params.text,
          attachments: params.attachments,
          reply_to: params.replyTo,
          tags: params.tags
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Resend API Error: ${response.status} - ${errorData.message || 'Unknown error'}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Resend Email Service Error:', error)
      throw error
    }
  }

  /**
   * Send a batch of emails
   */
  async sendBatch(emails: SendEmailParams[]): Promise<ResendResponse[]> {
    try {
      const response = await fetch(`${this.baseUrl}/emails/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(emails)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Resend Batch API Error: ${response.status} - ${errorData.message || 'Unknown error'}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Resend Batch Email Service Error:', error)
      throw error
    }
  }

  /**
   * Get email delivery status
   */
  async getEmailStatus(emailId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/emails/${emailId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get email status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Get Email Status Error:', error)
      throw error
    }
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/domains`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.error('API Key Validation Error:', error)
      return false
    }
  }
}

/**
 * Factory function to create ResendEmailService with customer's API key
 */
export async function createResendService(organizationId: string, accountId?: string): Promise<ResendEmailService> {
  universalApi.setOrganizationId(organizationId)
  
  let apiKey: string
  
  if (accountId) {
    // Get API key for specific account
    const dynamicData = await universalApi.getDynamicData(accountId)
    apiKey = dynamicData.resend_api_key
  } else {
    // Get default account
    const accounts = await universalApi.getEntities('email_account', { status: 'active' })
    const defaultAccount = accounts.find(account => (account.metadata as any)?.is_default) || accounts[0]
    
    if (!defaultAccount) {
      throw new Error('No email account configured. Please set up an email account first.')
    }
    
    const dynamicData = await universalApi.getDynamicData(defaultAccount.id)
    apiKey = dynamicData.resend_api_key
  }
  
  if (!apiKey) {
    throw new Error('No Resend API key found. Please configure your email account.')
  }
  
  return new ResendEmailService(apiKey)
}

/**
 * Universal email sending function that integrates with HERA architecture
 */
export async function sendUniversalEmail(
  organizationId: string,
  emailData: SendEmailParams & {
    accountId?: string
    templateId?: string
    trackOpens?: boolean
    trackClicks?: boolean
  }
): Promise<{ success: boolean; emailId?: string; resendId?: string; error?: string }> {
  try {
    universalApi.setOrganizationId(organizationId)
    
    // Create ResendEmailService instance
    const resendService = await createResendService(organizationId, emailData.accountId)
    
    // If template is specified, merge template data
    if (emailData.templateId) {
      const templateData = await universalApi.getDynamicData(emailData.templateId)
      emailData.subject = emailData.subject || templateData.subject
      emailData.html = emailData.html || templateData.body_html
      emailData.text = emailData.text || templateData.body_text
    }
    
    // Send via Resend
    const resendResponse = await resendService.sendEmail(emailData)
    
    // Create email entity in HERA
    const emailEntity = {
      entity_type: 'email' as const,
      entity_name: emailData.subject,
      entity_code: `EMAIL-${Date.now()}`,
      organization_id: organizationId,
      status: 'sent' as const,
      metadata: {
        resend_id: resendResponse.id,
        sent_at: new Date().toISOString(),
        from_account: emailData.accountId || 'default'
      }
    }
    
    const createdEmail = await universalApi.createEntity(emailEntity)
    
    // Store email details in dynamic data
    await universalApi.setDynamicField(createdEmail.id, 'to_addresses', JSON.stringify(emailData.to))
    await universalApi.setDynamicField(createdEmail.id, 'subject', emailData.subject)
    
    if (emailData.html) {
      await universalApi.setDynamicField(createdEmail.id, 'body_html', emailData.html)
    }
    
    if (emailData.text) {
      await universalApi.setDynamicField(createdEmail.id, 'body_text', emailData.text)
    }
    
    if (emailData.cc) {
      await universalApi.setDynamicField(createdEmail.id, 'cc_addresses', JSON.stringify(emailData.cc))
    }
    
    if (emailData.bcc) {
      await universalApi.setDynamicField(createdEmail.id, 'bcc_addresses', JSON.stringify(emailData.bcc))
    }
    
    if (emailData.attachments) {
      await universalApi.setDynamicField(createdEmail.id, 'attachments', JSON.stringify(emailData.attachments))
    }
    
    // Record transaction
    await universalApi.createTransaction({
      transaction_type: 'email_send',
      organization_id: organizationId,
      reference_number: createdEmail.entity_code,
      related_entity_id: createdEmail.id,
      metadata: {
        resend_id: resendResponse.id,
        to_count: Array.isArray(emailData.to) ? emailData.to.length : 1,
        subject: emailData.subject,
        provider: 'resend'
      }
    })
    
    return {
      success: true,
      emailId: createdEmail.id,
      resendId: resendResponse.id
    }
    
  } catch (error) {
    console.error('Universal Email Sending Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Email template processing with variable substitution
 */
export function processEmailTemplate(
  template: string,
  variables: Record<string, any>
): string {
  let processed = template
  
  // Replace {{variable}} placeholders
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
    processed = processed.replace(regex, String(variables[key] || ''))
  })
  
  return processed
}

/**
 * Email analytics and tracking utilities
 */
export class EmailAnalytics {
  private organizationId: string
  
  constructor(organizationId: string) {
    this.organizationId = organizationId
    universalApi.setOrganizationId(organizationId)
  }
  
  async getEmailMetrics(timeRange: 'day' | 'week' | 'month' | 'year' = 'month') {
    const transactions = await universalApi.getTransactions('email_send', { limit: 1000 })
    
    const now = new Date()
    const filterDate = new Date()
    
    switch (timeRange) {
      case 'day':
        filterDate.setDate(now.getDate() - 1)
        break
      case 'week':
        filterDate.setDate(now.getDate() - 7)
        break
      case 'month':
        filterDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1)
        break
    }
    
    const filteredTransactions = transactions.filter(t => 
      new Date(t.created_at || '') >= filterDate
    )
    
    const totalSent = filteredTransactions.length
    const uniqueRecipients = new Set()
    
    filteredTransactions.forEach(t => {
      if ((t.metadata as any)?.to_count) {
        for (let i = 0; i < t.metadata.to_count; i++) {
          uniqueRecipients.add(`${t.related_entity_id}-${i}`)
        }
      }
    })
    
    return {
      total_sent: totalSent,
      unique_recipients: uniqueRecipients.size,
      time_range: timeRange,
      // Mock analytics data - would come from Resend webhooks in production
      delivered: Math.floor(totalSent * 0.98),
      bounced: Math.floor(totalSent * 0.02),
      opened: Math.floor(totalSent * 0.68),
      clicked: Math.floor(totalSent * 0.24),
      unsubscribed: Math.floor(totalSent * 0.008)
    }
  }
}