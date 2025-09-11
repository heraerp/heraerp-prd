/**
 * HERA WhatsApp Campaign Service - Comprehensive Salon Notifications
 * 
 * Handles all WhatsApp marketing, promotional, and customer lifecycle notifications
 * Uses the Sacred 6-Table architecture for campaign tracking and analytics
 */

import { universalApi } from '@/lib/universal-api'
import { formatDate } from '@/lib/date-utils'
import { addDays, differenceInDays } from 'date-fns'

// Smart Code definitions for WhatsApp campaigns
export const WHATSAPP_CAMPAIGN_SMART_CODES = {
  // Marketing campaigns
  BIRTHDAY_CAMPAIGN: 'HERA.SALON.WHATSAPP.MARKETING.BIRTHDAY.v1',
  PROMOTION_CAMPAIGN: 'HERA.SALON.WHATSAPP.MARKETING.PROMOTION.v1',
  LOYALTY_CAMPAIGN: 'HERA.SALON.WHATSAPP.MARKETING.LOYALTY.v1',
  NEW_SERVICE_CAMPAIGN: 'HERA.SALON.WHATSAPP.MARKETING.NEW_SERVICE.v1',
  
  // Customer lifecycle
  WELCOME_NEW_CUSTOMER: 'HERA.SALON.WHATSAPP.LIFECYCLE.WELCOME.v1',
  POST_SERVICE_FOLLOWUP: 'HERA.SALON.WHATSAPP.LIFECYCLE.FOLLOWUP.v1',
  WINBACK_INACTIVE: 'HERA.SALON.WHATSAPP.LIFECYCLE.WINBACK.v1',
  MILESTONE_CELEBRATION: 'HERA.SALON.WHATSAPP.LIFECYCLE.MILESTONE.v1',
  
  // Operational notifications
  PAYMENT_CONFIRMATION: 'HERA.SALON.WHATSAPP.PAYMENT.CONFIRM.v1',
  RECEIPT_DELIVERY: 'HERA.SALON.WHATSAPP.PAYMENT.RECEIPT.v1',
  OUTSTANDING_PAYMENT: 'HERA.SALON.WHATSAPP.PAYMENT.REMINDER.v1',
  
  // Product notifications  
  PRODUCT_RECOMMENDATION: 'HERA.SALON.WHATSAPP.PRODUCT.RECOMMEND.v1',
  PRODUCT_RESTOCK: 'HERA.SALON.WHATSAPP.PRODUCT.RESTOCK.v1',
  PRODUCT_CARE_TIPS: 'HERA.SALON.WHATSAPP.PRODUCT.CARE.v1',
  
  // Emergency/urgent
  EMERGENCY_CLOSURE: 'HERA.SALON.WHATSAPP.EMERGENCY.CLOSURE.v1',
  STAFF_UNAVAILABLE: 'HERA.SALON.WHATSAPP.EMERGENCY.STAFF.v1',
} as const

export interface CampaignData {
  campaignType: string
  targetAudience: 'all' | 'vip' | 'new' | 'inactive' | 'birthday' | 'specific'
  customerIds?: string[]
  templateName: string
  scheduledAt?: Date
  parameters?: Record<string, string>
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export class WhatsAppCampaignService {
  constructor(private api: typeof universalApi) {}

  /**
   * Send birthday campaign with special offer
   */
  async sendBirthdayCampaign(organizationId: string) {
    try {
      // Get customers with birthdays in the next 7 days
      const customers = await this.getBirthdayCustomers(organizationId)
      
      const campaignResults = []
      
      for (const customer of customers) {
        if (!customer.phone) continue
        
        const messageData = {
          to: customer.phone,
          templateName: 'birthday_special',
          parameters: {
            customer_name: customer.name,
            salon_name: 'Hair Talkz Salon',
            birthday_offer: '25% off any service',
            valid_until: formatDate(addDays(new Date(), 30), 'MMMM d, yyyy'),
            promo_code: `BDAY${customer.id.substr(-4).toUpperCase()}`
          }
        }

        const result = await this.sendCampaignMessage(
          messageData,
          WHATSAPP_CAMPAIGN_SMART_CODES.BIRTHDAY_CAMPAIGN,
          customer.id,
          organizationId
        )
        
        campaignResults.push(result)
      }

      // Log campaign summary
      await this.logCampaignSummary(
        'birthday_campaign',
        customers.length,
        campaignResults.filter(r => r.success).length,
        organizationId
      )

      return {
        success: true,
        totalSent: campaignResults.filter(r => r.success).length,
        totalFailed: campaignResults.filter(r => !r.success).length,
        results: campaignResults
      }
    } catch (error) {
      console.error('Birthday campaign error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send post-service follow-up with care tips and review request
   */
  async sendPostServiceFollowup(
    appointmentId: string,
    organizationId: string,
    hoursAfter: number = 24
  ) {
    try {
      // Get appointment details
      const appointment = await this.getAppointmentById(appointmentId, organizationId)
      if (!appointment) {
        throw new Error('Appointment not found')
      }

      const customerPhone = await this.getCustomerPhone(appointment.from_entity_id, organizationId)
      if (!customerPhone) {
        throw new Error('Customer phone not found')
      }

      // Generate personalized care tips based on service
      const careTips = this.generateCareTips(appointment.metadata.service_name)

      const messageData = {
        to: customerPhone,
        templateName: 'post_service_followup',
        parameters: {
          customer_name: appointment.metadata.customer_name,
          service_name: appointment.metadata.service_name,
          staff_name: appointment.metadata.staff_name,
          care_tips: careTips,
          salon_name: 'Hair Talkz Salon',
          review_link: 'https://g.page/r/hair-talkz-salon/review',
          next_appointment_discount: '15% off your next visit'
        }
      }

      const result = await this.sendCampaignMessage(
        messageData,
        WHATSAPP_CAMPAIGN_SMART_CODES.POST_SERVICE_FOLLOWUP,
        appointment.from_entity_id,
        organizationId
      )

      return result
    } catch (error) {
      console.error('Post-service follow-up error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send promotional campaign to target audience
   */
  async sendPromotionalCampaign(campaignData: CampaignData, organizationId: string) {
    try {
      // Get target customers based on audience criteria
      const targetCustomers = await this.getTargetCustomers(campaignData.targetAudience, organizationId)
      
      const campaignResults = []
      
      for (const customer of targetCustomers) {
        if (!customer.phone) continue
        
        const messageData = {
          to: customer.phone,
          templateName: campaignData.templateName,
          parameters: {
            customer_name: customer.name,
            salon_name: 'Hair Talkz Salon',
            ...campaignData.parameters
          }
        }

        const result = await this.sendCampaignMessage(
          messageData,
          WHATSAPP_CAMPAIGN_SMART_CODES.PROMOTION_CAMPAIGN,
          customer.id,
          organizationId
        )
        
        campaignResults.push(result)
      }

      // Log campaign summary
      await this.logCampaignSummary(
        campaignData.campaignType,
        targetCustomers.length,
        campaignResults.filter(r => r.success).length,
        organizationId
      )

      return {
        success: true,
        campaignType: campaignData.campaignType,
        totalSent: campaignResults.filter(r => r.success).length,
        totalFailed: campaignResults.filter(r => !r.success).length,
        results: campaignResults
      }
    } catch (error) {
      console.error('Promotional campaign error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send win-back campaign to inactive customers
   */
  async sendWinBackCampaign(organizationId: string, inactiveDays: number = 90) {
    try {
      // Get customers who haven't visited in X days
      const inactiveCustomers = await this.getInactiveCustomers(organizationId, inactiveDays)
      
      const campaignResults = []
      
      for (const customer of inactiveCustomers) {
        if (!customer.phone) continue
        
        const lastVisitDays = differenceInDays(new Date(), new Date(customer.lastVisit))
        
        const messageData = {
          to: customer.phone,
          templateName: 'winback_offer',
          parameters: {
            customer_name: customer.name,
            salon_name: 'Hair Talkz Salon',
            last_visit_days: lastVisitDays.toString(),
            special_offer: '30% off your comeback visit',
            valid_until: formatDate(addDays(new Date(), 30), 'MMMM d, yyyy'),
            favorite_service: customer.favoriteService || 'your favorite service'
          }
        }

        const result = await this.sendCampaignMessage(
          messageData,
          WHATSAPP_CAMPAIGN_SMART_CODES.WINBACK_INACTIVE,
          customer.id,
          organizationId
        )
        
        campaignResults.push(result)
      }

      await this.logCampaignSummary(
        'winback_campaign',
        inactiveCustomers.length,
        campaignResults.filter(r => r.success).length,
        organizationId
      )

      return {
        success: true,
        totalSent: campaignResults.filter(r => r.success).length,
        totalFailed: campaignResults.filter(r => !r.success).length,
        results: campaignResults
      }
    } catch (error) {
      console.error('Win-back campaign error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send payment confirmation and digital receipt
   */
  async sendPaymentConfirmation(
    paymentId: string,
    organizationId: string
  ) {
    try {
      // Get payment details from universal_transactions
      const payment = await this.getPaymentById(paymentId, organizationId)
      if (!payment) {
        throw new Error('Payment not found')
      }

      const customerPhone = await this.getCustomerPhone(payment.from_entity_id, organizationId)
      if (!customerPhone) {
        throw new Error('Customer phone not found')
      }

      const messageData = {
        to: customerPhone,
        templateName: 'payment_confirmation',
        parameters: {
          customer_name: payment.metadata.customer_name,
          amount: `AED ${payment.total_amount.toFixed(2)}`,
          payment_method: payment.metadata.payment_method || 'Card',
          transaction_id: payment.reference_number,
          salon_name: 'Hair Talkz Salon',
          services: payment.metadata.services_summary || 'Salon Services',
          payment_date: formatDate(new Date(payment.transaction_date), 'MMMM d, yyyy'),
          receipt_link: `https://salon.heraerp.com/receipt/${payment.id}`
        }
      }

      const result = await this.sendCampaignMessage(
        messageData,
        WHATSAPP_CAMPAIGN_SMART_CODES.PAYMENT_CONFIRMATION,
        payment.from_entity_id,
        organizationId
      )

      return result
    } catch (error) {
      console.error('Payment confirmation error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Send emergency closure notification to all customers with appointments
   */
  async sendEmergencyClosure(
    closureDate: Date,
    reason: string,
    organizationId: string
  ) {
    try {
      // Get all appointments for the closure date
      const affectedAppointments = await this.getAppointmentsByDate(
        formatDate(closureDate, 'yyyy-MM-dd'),
        organizationId
      )

      const notificationResults = []

      for (const appointment of affectedAppointments) {
        const customerPhone = await this.getCustomerPhone(appointment.from_entity_id, organizationId)
        if (!customerPhone) continue

        const messageData = {
          to: customerPhone,
          templateName: 'emergency_closure',
          parameters: {
            customer_name: appointment.metadata.customer_name,
            salon_name: 'Hair Talkz Salon',
            closure_date: formatDate(closureDate, 'EEEE, MMMM d, yyyy'),
            closure_reason: reason,
            appointment_time: appointment.metadata.appointment_time,
            service_name: appointment.metadata.service_name,
            rescheduling_info: 'We will contact you within 24 hours to reschedule'
          }
        }

        const result = await this.sendCampaignMessage(
          messageData,
          WHATSAPP_CAMPAIGN_SMART_CODES.EMERGENCY_CLOSURE,
          appointment.from_entity_id,
          organizationId
        )

        notificationResults.push(result)
      }

      return {
        success: true,
        affectedAppointments: affectedAppointments.length,
        notificationsSent: notificationResults.filter(r => r.success).length,
        notificationsFailed: notificationResults.filter(r => !r.success).length
      }
    } catch (error) {
      console.error('Emergency closure notification error:', error)
      return { success: false, error: error.message }
    }
  }

  // Helper methods
  private async getBirthdayCustomers(organizationId: string) {
    // Implementation to get customers with birthdays
    return []
  }

  private async getTargetCustomers(audience: string, organizationId: string) {
    // Implementation to get customers based on audience criteria
    return []
  }

  private async getInactiveCustomers(organizationId: string, days: number) {
    // Implementation to get inactive customers
    return []
  }

  private async getAppointmentsByDate(date: string, organizationId: string) {
    // Implementation to get appointments by date
    return []
  }

  private async sendCampaignMessage(
    messageData: any,
    smartCode: string,
    customerId: string,
    organizationId: string
  ) {
    // Mock implementation - would integrate with actual WhatsApp API
    console.log(`📱 Sending ${smartCode} to ${messageData.to}`)
    return { success: true, messageId: `msg_${Date.now()}` }
  }

  private async logCampaignSummary(
    campaignType: string,
    totalTargets: number,
    totalSent: number,
    organizationId: string
  ) {
    // Log campaign results in universal_transactions
    await this.api.createTransaction({
      transaction_type: 'whatsapp_campaign_summary',
      smart_code: 'HERA.SALON.WHATSAPP.CAMPAIGN.SUMMARY.v1',
      reference_number: `CAMPAIGN-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      organization_id: organizationId,
      metadata: {
        campaign_type: campaignType,
        total_targets: totalTargets,
        total_sent: totalSent,
        total_failed: totalTargets - totalSent,
        success_rate: ((totalSent / totalTargets) * 100).toFixed(2),
        executed_at: new Date().toISOString()
      }
    }, organizationId)
  }

  private generateCareTips(serviceName: string): string {
    const careTipsMap = {
      'Hair Cut & Style': 'Use sulfate-free shampoo and deep condition weekly',
      'Hair Color': 'Avoid washing for 48 hours, use color-safe products',
      'Hair Treatment': 'Maintain with weekly hair masks and avoid heat styling',
      'Keratin Treatment': 'No washing for 72 hours, use keratin-safe products'
    }
    
    return careTipsMap[serviceName] || 'Follow your stylist\'s care instructions'
  }

  private async getCustomerPhone(customerId: string, organizationId: string) {
    // Implementation to get customer phone from entity data
    return '+971501234567' // Mock phone number
  }

  private async getAppointmentById(appointmentId: string, organizationId: string) {
    // Implementation to get appointment details
    return null
  }

  private async getPaymentById(paymentId: string, organizationId: string) {
    // Implementation to get payment details
    return null
  }
}

// Export singleton instance
export const whatsAppCampaignService = new WhatsAppCampaignService(universalApi)