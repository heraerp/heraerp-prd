import { useDemoGuard } from '@/hooks/use-demo-guard'
import type { OrgId } from '@/types/common'

interface SendEmailParams {
  to: string
  subject: string
  body: string
  templateId?: string
  organizationId: OrgId
}

interface SendSMSParams {
  to: string
  message: string
  organizationId: OrgId
}

export class CivicFlowCommunicationService {
  private demoGuard: ReturnType<typeof useDemoGuard> | null = null

  setDemoGuard(guard: ReturnType<typeof useDemoGuard>) {
    this.demoGuard = guard
  }

  async sendEmail(params: SendEmailParams): Promise<boolean> {
    const { to, subject, body, organizationId } = params

    // Check demo mode
    if (this.demoGuard?.isDemoMode) {
      await this.demoGuard.blockExternalComm('email', to)
      console.log('[DEMO MODE] Email blocked:', { to, subject })
      return true // Simulate success
    }

    // In production, this would call actual email service
    try {
      // await externalEmailService.send({ to, subject, body });
      console.log('Email sent:', { to, subject })
      return true
    } catch (error) {
      console.error('Failed to send email:', error)
      return false
    }
  }

  async sendSMS(params: SendSMSParams): Promise<boolean> {
    const { to, message, organizationId } = params

    // Check demo mode
    if (this.demoGuard?.isDemoMode) {
      await this.demoGuard.blockExternalComm('sms', to)
      console.log('[DEMO MODE] SMS blocked:', { to, message })
      return true // Simulate success
    }

    // In production, this would call actual SMS service
    try {
      // await externalSMSService.send({ to, message });
      console.log('SMS sent:', { to, message })
      return true
    } catch (error) {
      console.error('Failed to send SMS:', error)
      return false
    }
  }

  async sendWebhook(url: string, payload: any, organizationId: OrgId): Promise<boolean> {
    // Check demo mode
    if (this.demoGuard?.isDemoMode) {
      await this.demoGuard.blockExternalComm('webhook', url)
      console.log('[DEMO MODE] Webhook blocked:', { url, payload })
      return true // Simulate success
    }

    // In production, this would make actual webhook call
    try {
      // await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
      console.log('Webhook sent:', { url })
      return true
    } catch (error) {
      console.error('Failed to send webhook:', error)
      return false
    }
  }
}

// Singleton instance
export const civicFlowComm = new CivicFlowCommunicationService()
