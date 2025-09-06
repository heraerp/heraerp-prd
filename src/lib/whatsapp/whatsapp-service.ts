/**
 * WhatsApp Service for sending messages
 */

export class WhatsAppService {
  private accessToken: string
  private phoneNumberId: string
  private webhookToken: string
  private organizationId: string

  constructor(
    accessToken: string,
    phoneNumberId: string,
    webhookToken: string,
    organizationId: string
  ) {
    this.accessToken = accessToken
    this.phoneNumberId = phoneNumberId
    this.webhookToken = webhookToken
    this.organizationId = organizationId
  }

  async sendTextMessage(to: string, message: string): Promise<any> {
    try {
      console.log(`📤 Sending WhatsApp message to ${to}`)
      
      // Remove any non-digit characters and ensure it starts with country code
      const cleanNumber = to.replace(/\D/g, '')
      
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanNumber,
            type: 'text',
            text: {
              preview_url: false,
              body: message
            }
          })
        }
      )

      const result = await response.json()
      
      if (!response.ok) {
        console.error('❌ WhatsApp API error:', result)
        throw new Error(result.error?.message || 'Failed to send message')
      }

      console.log('✅ WhatsApp message sent successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Error sending WhatsApp message:', error)
      throw error
    }
  }

  async sendInteractiveMessage(to: string, interactive: any): Promise<any> {
    try {
      console.log(`📤 Sending WhatsApp interactive message to ${to}`)
      
      const cleanNumber = to.replace(/\D/g, '')
      
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanNumber,
            type: 'interactive',
            interactive
          })
        }
      )

      const result = await response.json()
      
      if (!response.ok) {
        console.error('❌ WhatsApp API error:', result)
        throw new Error(result.error?.message || 'Failed to send interactive message')
      }

      console.log('✅ WhatsApp interactive message sent successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Error sending WhatsApp interactive message:', error)
      throw error
    }
  }

  async sendTemplateMessage(to: string, templateName: string, parameters: any[] = []): Promise<any> {
    try {
      console.log(`📤 Sending WhatsApp template message to ${to}`)
      
      const cleanNumber = to.replace(/\D/g, '')
      
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: cleanNumber,
            type: 'template',
            template: {
              name: templateName,
              language: {
                code: 'en'
              },
              components: parameters.length > 0 ? [
                {
                  type: 'body',
                  parameters
                }
              ] : undefined
            }
          })
        }
      )

      const result = await response.json()
      
      if (!response.ok) {
        console.error('❌ WhatsApp API error:', result)
        throw new Error(result.error?.message || 'Failed to send template message')
      }

      console.log('✅ WhatsApp template message sent successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Error sending WhatsApp template message:', error)
      throw error
    }
  }
}