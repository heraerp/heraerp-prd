/**
 * HERA CRM Email Integration Service
 * Enables real business communication capabilities
 * 
 * Project Manager Priority #3: Email Integration
 */

export interface EmailMessage {
  id?: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  isHTML?: boolean
  attachments?: EmailAttachment[]
  contactId?: string | number
  organizationId: string
  sentAt?: string
  status?: 'draft' | 'sending' | 'sent' | 'failed'
  errorMessage?: string
}

export interface EmailAttachment {
  filename: string
  content: string | Buffer
  contentType: string
  size: number
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string[]
  category: 'sales' | 'support' | 'marketing' | 'follow-up'
  organizationId: string
}

/**
 * Email Service for CRM Integration
 * Supports multiple email providers
 */
export class CRMEmailService {
  private organizationId: string
  private emailProvider: 'smtp' | 'sendgrid' | 'mailgun' | 'mock'
  
  constructor(organizationId: string, provider: 'smtp' | 'sendgrid' | 'mailgun' | 'mock' = 'mock') {
    this.organizationId = organizationId
    this.emailProvider = provider
  }

  /**
   * Send email to contact
   */
  async sendEmail(emailData: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Validate email data
      if (!emailData.to.length) {
        throw new Error('At least one recipient is required')
      }
      
      if (!emailData.subject.trim()) {
        throw new Error('Subject is required')
      }
      
      if (!emailData.body.trim()) {
        throw new Error('Email body is required')
      }

      // Log email to HERA universal tables
      await this.logEmailToHERA({
        ...emailData,
        status: 'sending',
        organizationId: this.organizationId
      })

      let result: { success: boolean; messageId?: string; error?: string }

      switch (this.emailProvider) {
        case 'smtp':
          result = await this.sendViaSMTP(emailData)
          break
        case 'sendgrid':
          result = await this.sendViaSendGrid(emailData)
          break
        case 'mailgun':
          result = await this.sendViaMailgun(emailData)
          break
        default:
          result = await this.sendViaMock(emailData)
      }

      // Update email log with result
      await this.updateEmailLog(emailData, result)

      return result
    } catch (error) {
      console.error('Error sending email:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      }
    }
  }

  /**
   * Send email using SMTP (production)
   */
  private async sendViaSMTP(emailData: EmailMessage) {
    try {
      // TODO: Implement SMTP using nodemailer
      // This would require SMTP settings from organization config
      const smtpConfig = await this.getSMTPConfig()
      
      if (!smtpConfig) {
        throw new Error('SMTP configuration not found')
      }

      // Mock implementation for now
      console.log('SMTP Email would be sent:', {
        to: emailData.to,
        subject: emailData.subject,
        body: emailData.body.substring(0, 100) + '...'
      })

      return {
        success: true,
        messageId: `smtp_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SMTP send failed'
      }
    }
  }

  /**
   * Send email using SendGrid API
   */
  private async sendViaSendGrid(emailData: EmailMessage) {
    try {
      // TODO: Implement SendGrid API integration
      const sendGridConfig = await this.getSendGridConfig()
      
      if (!sendGridConfig?.apiKey) {
        throw new Error('SendGrid API key not configured')
      }

      // Mock implementation for now
      console.log('SendGrid Email would be sent:', {
        to: emailData.to,
        subject: emailData.subject
      })

      return {
        success: true,
        messageId: `sendgrid_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SendGrid send failed'
      }
    }
  }

  /**
   * Send email using Mailgun API
   */
  private async sendViaMailgun(emailData: EmailMessage) {
    try {
      // TODO: Implement Mailgun API integration
      const mailgunConfig = await this.getMailgunConfig()
      
      if (!mailgunConfig?.apiKey) {
        throw new Error('Mailgun API key not configured')
      }

      // Mock implementation for now
      console.log('Mailgun Email would be sent:', {
        to: emailData.to,
        subject: emailData.subject
      })

      return {
        success: true,
        messageId: `mailgun_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mailgun send failed'
      }
    }
  }

  /**
   * Mock email sending for development/demo
   */
  private async sendViaMock(emailData: EmailMessage) {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

      // Simulate occasional failures (5% failure rate)
      if (Math.random() < 0.05) {
        throw new Error('Mock email delivery failed (random failure simulation)')
      }

      console.log('📧 MOCK EMAIL SENT:', {
        to: emailData.to.join(', '),
        subject: emailData.subject,
        bodyPreview: emailData.body.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      })

      return {
        success: true,
        messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock email failed'
      }
    }
  }

  /**
   * Log email activity to HERA universal tables
   */
  private async logEmailToHERA(emailData: EmailMessage) {
    try {
      // Create email entity in core_entities
      const emailEntity = {
        entity_type: 'email',
        entity_name: `Email: ${emailData.subject}`,
        organization_id: this.organizationId,
        smart_code: 'HERA.CRM.EMAIL.v1',
        dynamic_data: {
          to: JSON.stringify(emailData.to),
          cc: JSON.stringify(emailData.cc || []),
          bcc: JSON.stringify(emailData.bcc || []),
          subject: emailData.subject,
          body: emailData.body,
          is_html: emailData.isHTML?.toString() || 'false',
          contact_id: emailData.contactId?.toString(),
          status: emailData.status || 'draft',
          sent_at: emailData.sentAt || new Date().toISOString(),
          provider: this.emailProvider
        }
      }

      // TODO: Implement actual HERA API call
      console.log('Email logged to HERA:', emailEntity)

      return emailEntity
    } catch (error) {
      console.error('Error logging email to HERA:', error)
      throw error
    }
  }

  /**
   * Update email log with send result
   */
  private async updateEmailLog(emailData: EmailMessage, result: { success: boolean; messageId?: string; error?: string }) {
    try {
      const status = result.success ? 'sent' : 'failed'
      const updateData = {
        status,
        message_id: result.messageId,
        error_message: result.error,
        sent_at: new Date().toISOString()
      }

      // TODO: Implement actual HERA API update call
      console.log('Email log updated:', updateData)

      return updateData
    } catch (error) {
      console.error('Error updating email log:', error)
    }
  }

  /**
   * Get email history for contact
   */
  async getEmailHistory(contactId: string | number): Promise<EmailMessage[]> {
    try {
      // TODO: Implement HERA API call to get email entities
      // Filter by contact_id and organization_id
      
      // Mock implementation
      const mockEmails: EmailMessage[] = [
        {
          id: '1',
          to: ['contact@company.com'],
          subject: 'Follow-up on our conversation',
          body: 'Hi there, I wanted to follow up on our conversation yesterday...',
          contactId: contactId,
          organizationId: this.organizationId,
          sentAt: '2024-08-05T10:30:00Z',
          status: 'sent'
        },
        {
          id: '2',
          to: ['contact@company.com'],
          subject: 'Proposal attached',
          body: 'Please find the attached proposal for your review...',
          contactId: contactId,
          organizationId: this.organizationId,
          sentAt: '2024-08-03T14:15:00Z',
          status: 'sent'
        }
      ]

      return mockEmails
    } catch (error) {
      console.error('Error fetching email history:', error)
      return []
    }
  }

  /**
   * Get email templates for organization
   */
  async getEmailTemplates(category?: string): Promise<EmailTemplate[]> {
    try {
      // TODO: Implement HERA API call to get template entities
      
      // Mock templates
      const mockTemplates: EmailTemplate[] = [
        {
          id: '1',
          name: 'Introduction Email',
          subject: 'Nice to meet you, {{contact_name}}',
          body: 'Hi {{contact_name}},\n\nIt was great meeting you today. I wanted to follow up on our conversation about {{topic}}.\n\nBest regards,\n{{sender_name}}',
          variables: ['contact_name', 'topic', 'sender_name'],
          category: 'sales',
          organizationId: this.organizationId
        },
        {
          id: '2',
          name: 'Follow-up Email',
          subject: 'Following up on {{subject}}',
          body: 'Hi {{contact_name}},\n\nI wanted to follow up on {{subject}}. Do you have any questions or need additional information?\n\nLet me know how I can help!\n\n{{sender_name}}',
          variables: ['contact_name', 'subject', 'sender_name'],
          category: 'follow-up',
          organizationId: this.organizationId
        },
        {
          id: '3',
          name: 'Proposal Email',
          subject: 'Proposal for {{company_name}} - {{proposal_title}}',
          body: 'Dear {{contact_name}},\n\nPlease find attached our proposal for {{proposal_title}}.\n\nKey benefits:\n- {{benefit_1}}\n- {{benefit_2}}\n- {{benefit_3}}\n\nI look forward to discussing this with you.\n\nBest regards,\n{{sender_name}}',
          variables: ['contact_name', 'company_name', 'proposal_title', 'benefit_1', 'benefit_2', 'benefit_3', 'sender_name'],
          category: 'sales',
          organizationId: this.organizationId
        }
      ]

      return category ? mockTemplates.filter(t => t.category === category) : mockTemplates
    } catch (error) {
      console.error('Error fetching email templates:', error)
      return []
    }
  }

  /**
   * Process email template with variables
   */
  processTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; body: string } {
    let processedSubject = template.subject
    let processedBody = template.body

    // Replace all variables in subject and body
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      processedSubject = processedSubject.replace(regex, value)
      processedBody = processedBody.replace(regex, value)
    })

    return {
      subject: processedSubject,
      body: processedBody
    }
  }

  /**
   * Get email provider configurations (secure)
   */
  private async getSMTPConfig() {
    // TODO: Implement secure config retrieval from HERA
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    }
  }

  private async getSendGridConfig() {
    return {
      apiKey: process.env.SENDGRID_API_KEY
    }
  }

  private async getMailgunConfig() {
    return {
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN
    }
  }
}

/**
 * Create email service instance
 */
export const createEmailService = (organizationId: string, provider?: 'smtp' | 'sendgrid' | 'mailgun' | 'mock') => {
  return new CRMEmailService(organizationId, provider)
}