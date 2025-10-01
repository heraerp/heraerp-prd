/**
 * HERA WhatsApp Client
 * Client-side utilities for WhatsApp Business integration
 * Smart Code: HERA.WHATSAPP.CLIENT.v1
 */

import { universalApi } from '@/lib/universal-api'

export interface WhatsAppAccount {
  id: string
  organization_id: string
  phone_number: string
  business_id: string
  display_name: string
  verified: boolean
}

export interface WhatsAppFlow {
  id: string
  name: string
  type: 'booking' | 'support' | 'feedback' | 'custom'
  steps: WhatsAppFlowStep[]
  conversion_rate?: number
}

export interface WhatsAppFlowStep {
  step_number: number
  step_name: string
  message_type: 'text' | 'interactive' | 'template' | 'flow'
  ui_component?: string
  title: string
  options?: any[]
}

export interface WhatsAppTemplate {
  id: string
  name: string
  category: 'utility' | 'marketing' | 'authentication'
  language: string
  status: 'pending' | 'approved' | 'rejected'
  components: any[]
}

export interface WhatsAppAnalytics {
  total_conversations: number
  total_messages: number
  response_rate: number
  conversion_rate: number
  avg_response_time: string
  peak_hours: { hour: number; count: number }[]
}

/**
 * WhatsApp Client for HERA
 */
export class WhatsAppClient {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Get WhatsApp account for organization
   */
  async getWhatsAppAccount(): Promise<WhatsAppAccount | null> {
    try {
      const response = await universalApi.query('core_entities', {
        entity_type: 'whatsapp_account',
        organization_id: this.organizationId
      })

      if (response.data && response.data.length > 0) {
        const entity = response.data[0]
        return {
          id: entity.id,
          organization_id: entity.organization_id,
          phone_number: (entity.metadata as any)?.whatsapp_number || '',
          business_id: (entity.metadata as any)?.business_id || '',
          display_name: entity.entity_name,
          verified: (entity.metadata as any)?.verified || false
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching WhatsApp account:', error)
      return null
    }
  }

  /**
   * Create WhatsApp account
   */
  async createWhatsAppAccount(data: {
    phone_number: string
    display_name: string
    business_id?: string
  }): Promise<WhatsAppAccount | null> {
    try {
      const entity = await universalApi.createEntity({
        entity_type: 'whatsapp_account',
        entity_name: data.display_name,
        entity_code: `WA-${this.organizationId.slice(0, 8)}`,
        organization_id: this.organizationId,
        smart_code: 'HERA.WHATSAPP.ACCOUNT.BUSINESS.V1',
        metadata: {
          whatsapp_number: data.phone_number,
          business_id: data.business_id || `WABA-${Date.now()}`,
          verified: false,
          setup_date: new Date().toISOString()
        }
      })

      if (entity) {
        return {
          id: entity.id,
          organization_id: entity.organization_id,
          phone_number: data.phone_number,
          business_id: data.business_id || entity.metadata.business_id,
          display_name: data.display_name,
          verified: false
        }
      }
      return null
    } catch (error) {
      console.error('Error creating WhatsApp account:', error)
      return null
    }
  }

  /**
   * Get WhatsApp flows
   */
  async getWhatsAppFlows(): Promise<WhatsAppFlow[]> {
    try {
      const response = await universalApi.query('core_entities', {
        entity_type: 'whatsapp_flow',
        organization_id: this.organizationId
      })

      if (response.data) {
        return response.data.map(entity => ({
          id: entity.id,
          name: entity.entity_name,
          type: (entity.metadata as any)?.flow_type || 'custom',
          steps: (entity.metadata as any)?.steps || [],
          conversion_rate: (entity.metadata as any)?.conversion_rate
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching WhatsApp flows:', error)
      return []
    }
  }

  /**
   * Get WhatsApp templates
   */
  async getWhatsAppTemplates(): Promise<WhatsAppTemplate[]> {
    try {
      const response = await universalApi.query('core_entities', {
        entity_type: 'whatsapp_template',
        organization_id: this.organizationId
      })

      if (response.data) {
        return response.data.map(entity => ({
          id: entity.id,
          name: entity.entity_name,
          category: (entity.metadata as any)?.category || 'utility',
          language: (entity.metadata as any)?.language || 'en',
          status: (entity.metadata as any)?.status || 'pending',
          components: (entity.metadata as any)?.components || []
        }))
      }
      return []
    } catch (error) {
      console.error('Error fetching WhatsApp templates:', error)
      return []
    }
  }

  /**
   * Get WhatsApp analytics
   */
  async getAnalytics(days: number = 30): Promise<WhatsAppAnalytics | null> {
    try {
      const response = await fetch('/api/v1/mcp/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'get-whatsapp-analytics',
          params: {
            organization_id: this.organizationId,
            start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            end_date: new Date().toISOString().split('T')[0]
          }
        })
      })

      const result = await response.json()
      if (result.success && result.data) {
        return result.data.summary
      }
      return null
    } catch (error) {
      console.error('Error fetching WhatsApp analytics:', error)
      return null
    }
  }

  /**
   * Create booking flow
   */
  async createBookingFlow(
    options: {
      serviceTypes?: string[]
      requireDeposit?: boolean
      enableStylistSelection?: boolean
    } = {}
  ): Promise<any> {
    try {
      const response = await fetch('/api/v1/mcp/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'create-booking-flow',
          params: {
            organization_id: this.organizationId,
            ...options
          }
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Error creating booking flow:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Send WhatsApp message (for testing/demo)
   */
  async sendMessage(
    to: string,
    message: string,
    type: 'text' | 'interactive' = 'text'
  ): Promise<boolean> {
    try {
      const transaction = await universalApi.createTransaction({
        transaction_type: 'whatsapp_message',
        transaction_code: `WA-MSG-${Date.now()}`,
        organization_id: this.organizationId,
        total_amount: 0,
        smart_code: 'HERA.WHATSAPP.MSG.OUTBOUND.V1',
        metadata: {
          to: to,
          message: message,
          message_type: type,
          timestamp: new Date().toISOString()
        }
      })

      return !!transaction
    } catch (error) {
      console.error('Error sending WhatsApp message:', error)
      return false
    }
  }

  /**
   * Get customer journey
   */
  async getCustomerJourney(customerId?: string): Promise<any> {
    try {
      const response = await fetch('/api/v1/mcp/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'get-customer-journey',
          params: {
            organization_id: this.organizationId,
            customer_id: customerId,
            timeframe: 30
          }
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Error fetching customer journey:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Export a factory function
export function createWhatsAppClient(organizationId: string): WhatsAppClient {
  return new WhatsAppClient(organizationId)
}
