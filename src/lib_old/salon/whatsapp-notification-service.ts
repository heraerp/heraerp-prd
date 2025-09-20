/**
 * HERA WhatsApp Notification Service - Universal Architecture
 *
 * Sends WhatsApp notifications for appointment confirmations, reminders, etc.
 * Uses the Sacred 6-Table architecture for storing notification logs
 */

import { universalApi } from '@/lib/universal-api'
import { formatDate } from '@/lib/date-utils'
import { formatWhatsAppTemplate, validateTemplateParameters } from './whatsapp-templates'

// Smart Code definitions for WhatsApp notifications
export const WHATSAPP_SMART_CODES = {
  // Notification types
  APPOINTMENT_CONFIRMATION: 'HERA.SALON.WHATSAPP.APPOINTMENT.CONFIRM.V1',
  APPOINTMENT_REMINDER: 'HERA.SALON.WHATSAPP.APPOINTMENT.REMIND.V1',
  APPOINTMENT_CANCELLATION: 'HERA.SALON.WHATSAPP.APPOINTMENT.CANCEL.V1',
  APPOINTMENT_RESCHEDULED: 'HERA.SALON.WHATSAPP.APPOINTMENT.RESCHEDULE.V1',

  // Notification status
  NOTIFICATION_SENT: 'HERA.SALON.WHATSAPP.STATUS.SENT.V1',
  NOTIFICATION_DELIVERED: 'HERA.SALON.WHATSAPP.STATUS.DELIVERED.V1',
  NOTIFICATION_FAILED: 'HERA.SALON.WHATSAPP.STATUS.FAILED.V1'
} as const

export interface WhatsAppMessageData {
  to: string // Phone number with country code (e.g., +971501234567)
  templateName: string
  languageCode?: string // Default: 'en'
  parameters?: Record<string, string>
}

export class WhatsAppNotificationService {
  constructor(private api: typeof universalApi) {}

  /**
   * Send appointment confirmation via WhatsApp
   */
  async sendAppointmentConfirmation(
    appointment: any,
    customerPhone: string,
    organizationId: string
  ) {
    try {
      // Format appointment details
      const appointmentDate = formatDate(
        new Date(appointment.metadata.appointment_date),
        'EEEE, MMMM d, yyyy'
      )
      const appointmentTime = appointment.metadata.appointment_time
      const serviceName = appointment.metadata.service_name
      const staffName = appointment.metadata.staff_name
      const salonName = 'Hair Talkz Salon' // This would come from organization data

      // Prepare WhatsApp message data
      const messageData: WhatsAppMessageData = {
        to: customerPhone,
        templateName: 'appointment_confirmation',
        languageCode: 'en',
        parameters: {
          customer_name: appointment.metadata.customer_name,
          salon_name: salonName,
          service_name: serviceName,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          staff_name: staffName,
          appointment_id: appointment.reference_number
        }
      }

      // Call WhatsApp API (this would integrate with your WhatsApp Business API)
      const response = await this.sendWhatsAppMessage(messageData)

      // Log the notification in universal_transactions
      await this.api.createTransaction(
        {
          transaction_type: 'whatsapp_notification',
          smart_code: WHATSAPP_SMART_CODES.APPOINTMENT_CONFIRMATION,
          reference_number: `WA-${Date.now()}`,
          reference_entity_id: appointment.id,
          transaction_date: new Date().toISOString(),
          total_amount: 0, // Notifications don't have amounts
          from_entity_id: appointment.to_entity_id, // From staff/salon
          to_entity_id: appointment.from_entity_id, // To customer
          metadata: {
            notification_type: 'appointment_confirmation',
            appointment_id: appointment.id,
            customer_phone: customerPhone,
            message_id: response.messageId,
            template_name: messageData.templateName,
            status: 'sent',
            sent_at: new Date().toISOString(),
            message_parameters: messageData.parameters
          }
        },
        organizationId
      )

      return {
        success: true,
        messageId: response.messageId,
        data: response
      }
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error)

      // Log failed notification attempt
      await this.api
        .createTransaction(
          {
            transaction_type: 'whatsapp_notification',
            smart_code: WHATSAPP_SMART_CODES.NOTIFICATION_FAILED,
            reference_number: `WA-FAILED-${Date.now()}`,
            reference_entity_id: appointment.id,
            transaction_date: new Date().toISOString(),
            total_amount: 0,
            from_entity_id: appointment.to_entity_id,
            to_entity_id: appointment.from_entity_id,
            metadata: {
              notification_type: 'appointment_confirmation',
              appointment_id: appointment.id,
              customer_phone: customerPhone,
              error: error instanceof Error ? error.message : 'Unknown error',
              failed_at: new Date().toISOString()
            }
          },
          organizationId
        )
        .catch(console.error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp notification'
      }
    }
  }

  /**
   * Send appointment reminder via WhatsApp
   */
  async sendAppointmentReminder(
    appointment: any,
    customerPhone: string,
    organizationId: string,
    hoursBeforeAppointment: number = 24
  ) {
    try {
      const appointmentDate = formatDate(
        new Date(appointment.metadata.appointment_date),
        'EEEE, MMMM d, yyyy'
      )
      const appointmentTime = appointment.metadata.appointment_time
      const serviceName = appointment.metadata.service_name
      const staffName = appointment.metadata.staff_name
      const salonName = 'Hair Talkz Salon'

      const messageData: WhatsAppMessageData = {
        to: customerPhone,
        templateName: 'appointment_reminder',
        languageCode: 'en',
        parameters: {
          customer_name: appointment.metadata.customer_name,
          salon_name: salonName,
          service_name: serviceName,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          staff_name: staffName,
          hours_before: hoursBeforeAppointment.toString()
        }
      }

      const response = await this.sendWhatsAppMessage(messageData)

      await this.api.createTransaction(
        {
          transaction_type: 'whatsapp_notification',
          smart_code: WHATSAPP_SMART_CODES.APPOINTMENT_REMINDER,
          reference_number: `WA-REMIND-${Date.now()}`,
          reference_entity_id: appointment.id,
          transaction_date: new Date().toISOString(),
          total_amount: 0,
          from_entity_id: appointment.to_entity_id,
          to_entity_id: appointment.from_entity_id,
          metadata: {
            notification_type: 'appointment_reminder',
            appointment_id: appointment.id,
            customer_phone: customerPhone,
            message_id: response.messageId,
            template_name: messageData.templateName,
            status: 'sent',
            sent_at: new Date().toISOString(),
            reminder_hours_before: hoursBeforeAppointment,
            message_parameters: messageData.parameters
          }
        },
        organizationId
      )

      return {
        success: true,
        messageId: response.messageId,
        data: response
      }
    } catch (error) {
      console.error('Error sending WhatsApp reminder:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp reminder'
      }
    }
  }

  /**
   * Send appointment cancellation notification via WhatsApp
   */
  async sendAppointmentCancellation(
    appointment: any,
    customerPhone: string,
    organizationId: string,
    cancellationReason?: string
  ) {
    try {
      const appointmentDate = formatDate(
        new Date(appointment.metadata.appointment_date),
        'EEEE, MMMM d, yyyy'
      )
      const appointmentTime = appointment.metadata.appointment_time
      const serviceName = appointment.metadata.service_name
      const salonName = 'Hair Talkz Salon'

      const messageData: WhatsAppMessageData = {
        to: customerPhone,
        templateName: 'appointment_cancellation',
        languageCode: 'en',
        parameters: {
          customer_name: appointment.metadata.customer_name,
          salon_name: salonName,
          service_name: serviceName,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          cancellation_reason: cancellationReason || 'as requested',
          appointment_id: appointment.reference_number
        }
      }

      const response = await this.sendWhatsAppMessage(messageData)

      await this.api.createTransaction(
        {
          transaction_type: 'whatsapp_notification',
          smart_code: WHATSAPP_SMART_CODES.APPOINTMENT_CANCELLATION,
          reference_number: `WA-CANCEL-${Date.now()}`,
          reference_entity_id: appointment.id,
          transaction_date: new Date().toISOString(),
          total_amount: 0,
          from_entity_id: appointment.to_entity_id,
          to_entity_id: appointment.from_entity_id,
          metadata: {
            notification_type: 'appointment_cancellation',
            appointment_id: appointment.id,
            customer_phone: customerPhone,
            message_id: response.messageId,
            template_name: messageData.templateName,
            status: 'sent',
            sent_at: new Date().toISOString(),
            cancellation_reason: cancellationReason,
            message_parameters: messageData.parameters
          }
        },
        organizationId
      )

      return {
        success: true,
        messageId: response.messageId,
        data: response
      }
    } catch (error) {
      console.error('Error sending WhatsApp cancellation:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp cancellation'
      }
    }
  }

  /**
   * Internal method to send WhatsApp message
   * This would integrate with your WhatsApp Business API provider
   */
  private async sendWhatsAppMessage(data: WhatsAppMessageData): Promise<any> {
    // This is a placeholder implementation
    // In production, this would call your WhatsApp Business API endpoint

    // For now, we'll simulate the API call
    console.log('Sending WhatsApp message:', {
      to: data.to,
      template: data.templateName,
      parameters: data.parameters
    })

    // Simulate API response
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    }

    // Real implementation would look like:
    // const response = await fetch('https://your-whatsapp-api.com/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     messaging_product: 'whatsapp',
    //     to: data.to,
    //     type: 'template',
    //     template: {
    //       name: data.templateName,
    //       language: { code: data.languageCode || 'en' },
    //       components: [
    //         {
    //           type: 'body',
    //           parameters: Object.entries(data.parameters || {}).map(([key, value]) => ({
    //             type: 'text',
    //             text: value
    //           }))
    //         }
    //       ]
    //     }
    //   })
    // })
    // return await response.json()
  }

  /**
   * Get notification history for an appointment
   */
  async getAppointmentNotifications(appointmentId: string, organizationId: string) {
    const response = await this.api.getTransactions(organizationId)

    if (response.success && response.data) {
      const notifications = response.data.filter(
        (txn: any) =>
          txn.transaction_type === 'whatsapp_notification' &&
          (txn.metadata as any)?.appointment_id === appointmentId
      )
      return notifications
    }

    return []
  }

  /**
   * Get customer phone number from entity
   */
  async getCustomerPhone(customerId: string, organizationId: string) {
    const customerResponse = await this.api.getEntities('customer', organizationId)

    if (customerResponse.success && customerResponse.data) {
      const customer = customerResponse.data.find((c: any) => c.id === customerId)
      if (customer) {
        // Check metadata for phone
        const phone = (customer.metadata as any)?.phone || (customer.metadata as any)?.mobile

        // If not in metadata, check dynamic fields
        if (!phone) {
          const dynamicFields = await this.api.getDynamicFields(customerId, organizationId)
          if (dynamicFields.success && dynamicFields.data) {
            const phoneField = dynamicFields.data.find(
              (f: any) => f.field_name === 'phone' || f.field_name === 'mobile'
            )
            return phoneField?.field_value_text
          }
        }

        return phone
      }
    }

    return null
  }
}

// Export singleton instance
export const whatsAppService = new WhatsAppNotificationService(universalApi)
