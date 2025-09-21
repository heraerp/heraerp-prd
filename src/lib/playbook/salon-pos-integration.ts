'use client'

import { universalApi } from '@/lib/universal-api-v2'
import { postPosSaleWithCommission, postEventWithBranch } from '@/lib/playbook/finance-commissions'
import { heraCode, HERA_CODES } from '@/lib/smart-codes'

interface SalonPosIntegration {
  organizationId: string
}

interface PricingResult {
  unit_price: number
  base_price: number
  discounts?: Array<{
    type: 'percentage' | 'fixed'
    value: number
    description: string
  }>
  currency: string
  stylist_commission_rate?: number
}

interface StylistAssignment {
  service_id: string
  stylist_id: string
  stylist_name: string
  chair_id?: string
  chair_name?: string
  commission_rate: number
}

interface PosValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class SalonPosIntegrationService {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
    universalApi.setOrganizationId(organizationId)
  }

  /**
   * Get pricing for a service or product with playbook integration
   */
  async getServicePricing(
    serviceId: string,
    options: {
      customer_id?: string
      appointment_id?: string
      stylist_id?: string
      date?: string
      time?: string
    } = {}
  ): Promise<PricingResult> {
    try {
      // Load service entity
      const serviceResponse = await universalApi.getEntity(serviceId)

      if (!serviceResponse?.success || !serviceResponse.data) {
        console.log('Service not found for pricing lookup:', serviceId)
        return {
          unit_price: 0,
          base_price: 0,
          currency: 'AED'
        }
      }

      const service = serviceResponse.data

      // Check metadata for price first (most common)
      let basePrice = service.metadata?.price || service.metadata?.base_price || 0

      // If no price in metadata, check dynamic fields
      if (basePrice === 0) {
        const dynamicFields = await universalApi.getDynamicFields(serviceId)

        if (dynamicFields.success && dynamicFields.data) {
          const priceField = dynamicFields.data.find(
            f =>
              f.field_name === 'price' ||
              f.field_name === 'base_price' ||
              f.field_name === 'price_aed'
          )

          if (priceField) {
            basePrice = priceField.field_value_number || priceField.field_value_json?.base || 0
          }
        }
      }

      // Apply pricing rules
      let unitPrice = basePrice

      // Peak hours pricing (if we have dynamic field data)
      // Note: pricingFields is not defined anymore, skip peak hours for now

      // Customer-specific pricing (VIP discounts, etc.)
      if (options.customer_id) {
        const customerDiscount = await this.getCustomerPricingModifier(options.customer_id)
        if (customerDiscount) {
          unitPrice = unitPrice * (1 - customerDiscount.discount_percentage / 100)
        }
      }

      // Get stylist commission rate
      let stylistCommissionRate = 30 // Default 30%
      if (options.stylist_id) {
        const commissionData = await this.getStylistCommissionRate(options.stylist_id)
        stylistCommissionRate = commissionData.commission_rate
      }

      return {
        unit_price: Math.round(unitPrice * 100) / 100, // Round to 2 decimals
        base_price: basePrice,
        currency: service.metadata?.currency || 'AED',
        stylist_commission_rate: stylistCommissionRate
      }
    } catch (error) {
      console.error('Error getting service pricing:', error)
      return {
        unit_price: 0,
        base_price: 0,
        currency: 'AED'
      }
    }
  }

  /**
   * Get available stylists for a service
   */
  async getAvailableStylists(
    serviceId: string,
    dateTime?: string
  ): Promise<
    Array<{
      id: string
      name: string
      specialties: string[]
      commission_rate: number
      available: boolean
      next_available?: string
    }>
  > {
    try {
      // Load all stylists
      const stylistsResponse = await universalApi.getEntities({
        filters: {
          entity_type: 'employee'
        },
        organizationId: this.organizationId
      })

      if (!stylistsResponse?.data) return []

      const stylists = []
      for (const stylist of stylistsResponse.data) {
        // Load stylist dynamic data
        const stylistDataResponse = await universalApi.getDynamicFields(stylist.id)

        const stylistData = stylistDataResponse?.data || []
        const stylistFields: any = {}
        stylistData.forEach(field => {
          stylistFields[field.field_name] =
            field.field_value_text ||
            field.field_value_number ||
            field.field_value_date ||
            field.field_value_boolean
        })

        // Check if stylist is active and a stylist role
        if (stylistFields.role === 'stylist' && stylistFields.is_active !== false) {
          stylists.push({
            id: stylist.id,
            name: stylist.entity_name,
            specialties: stylistFields.specialties ? stylistFields.specialties.split(',') : [],
            commission_rate: stylistFields.commission_rate || 30,
            available: true, // Would check actual availability
            next_available: dateTime
          })
        }
      }

      return stylists
    } catch (error) {
      console.error('Error getting available stylists:', error)
      return []
    }
  }

  /**
   * Validate POS ticket before payment
   */
  async validatePosTicket(ticket: any): Promise<PosValidationResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Basic validations
      if (!ticket.lineItems || ticket.lineItems.length === 0) {
        errors.push('Ticket must have at least one item')
      }

      // Validate line items
      for (const item of ticket.lineItems || []) {
        if (!item.entity_id) {
          errors.push(`Line item missing entity_id`)
        }
        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Invalid quantity for ${item.entity_name}`)
        }
        if (!item.unit_price || item.unit_price < 0) {
          errors.push(`Invalid price for ${item.entity_name}`)
        }

        // Service-specific validations
        if (item.entity_type === 'service') {
          if (!item.stylist_id) {
            errors.push(`Service ${item.entity_name} must have an assigned stylist`)
          } else {
            // Validate stylist is available
            const isAvailable = await this.validateStylistAvailability(
              item.stylist_id,
              item.appointment_id
            )
            if (!isAvailable) {
              warnings.push(`Stylist for ${item.entity_name} may not be available`)
            }
          }
        }

        // Pricing validation - only for services and products, not for adjustments
        if (item.entity_type === 'service' || item.entity_type === 'product') {
          const expectedPricing = await this.getServicePricing(item.entity_id, {
            customer_id: ticket.customer_id,
            stylist_id: item.stylist_id
          })

          // Only warn if we found pricing and it doesn't match
          if (
            expectedPricing.unit_price > 0 &&
            Math.abs(item.unit_price - expectedPricing.unit_price) > 0.01
          ) {
            warnings.push(
              `Price mismatch for ${item.entity_name}: expected $${expectedPricing.unit_price}, got $${item.unit_price}`
            )
          }
        }
      }

      // Validate totals
      const calculatedSubtotal = ticket.lineItems.reduce(
        (sum: number, item: any) => sum + item.quantity * item.unit_price,
        0
      )

      const totals = this.calculateTicketTotals(ticket)
      if (Math.abs(totals.subtotal - calculatedSubtotal) > 0.01) {
        errors.push('Subtotal calculation mismatch')
      }

      // Customer validation
      if (ticket.customer_id) {
        const customerExists = await this.validateCustomerExists(ticket.customer_id)
        if (!customerExists) {
          errors.push('Selected customer does not exist')
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    } catch (error) {
      console.error('Error validating POS ticket:', error)
      return {
        isValid: false,
        errors: ['Validation failed due to system error'],
        warnings: []
      }
    }
  }

  /**
   * Process POS sale with complete playbook integration
   */
  async processPosTransaction(
    ticket: any,
    payments: any[],
    options: {
      branch_id: string
      cashier_id: string
      till_id?: string
    }
  ) {
    try {
      // Validate ticket first
      const validation = await this.validatePosTicket(ticket)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
      }

      const totals = this.calculateTicketTotals(ticket)

      // Prepare transaction data
      const transactionData = {
        organization_id: this.organizationId,
        transaction_type: 'sale',
        smart_code: heraCode('HERA.SALON.POS.SALE.HEADER.v1'),
        total_amount: totals.total,
        business_context: {
          branch_id: options.branch_id,
          source: 'POS',
          customer_id: ticket.customer_id,
          appointment_id: ticket.appointment_id,
          cashier_id: options.cashier_id,
          till_id: options.till_id,
          session_type: 'live'
        },
        line_items: [
          // Service and product lines
          ...ticket.lineItems.map((item: any, index: number) => ({
            line_entity_id: item.entity_id,
            line_number: index + 1,
            quantity: item.quantity,
            unit_price: item.unit_price,
            line_amount: item.line_amount,
            smart_code:
              item.entity_type === 'service'
                ? heraCode('HERA.SALON.POS.LINE.SERVICE.v1')
                : heraCode('HERA.SALON.POS.LINE.PRODUCT.v1'),
            line_data: {
              branch_id: options.branch_id,
              stylist_id: item.stylist_id,
              appointment_id: item.appointment_id,
              notes: item.notes,
              entity_type: item.entity_type,
              entity_name: item.entity_name
            }
          })),
          // Payment lines (negative to balance against service/product revenue)
          ...payments.map((payment, index) => ({
            line_number: ticket.lineItems.length + index + 1,
            line_amount: -payment.amount, // Negative to balance
            smart_code: this.getPaymentSmartCode(payment.type),
            line_data: {
              branch_id: options.branch_id,
              payment_method: payment.type,
              reference: payment.reference,
              card_type: payment.cardType,
              voucher_code: payment.voucherCode,
              till_id: options.till_id
            }
          })),
          // Discount lines
          ...(ticket.discounts || []).map((discount: any, index: number) => ({
            line_number: ticket.lineItems.length + payments.length + index + 1,
            line_amount: -discount.amount, // Negative for discount
            smart_code: heraCode('HERA.SALON.POS.LINE.DISCOUNT.v1'),
            line_data: {
              branch_id: options.branch_id,
              discount_type: discount.type,
              discount_description: discount.description,
              applied_to: discount.applied_to
            }
          })),
          // Tip lines
          ...(ticket.tips || []).map((tip: any, index: number) => ({
            line_number:
              ticket.lineItems.length +
              payments.length +
              (ticket.discounts?.length || 0) +
              index +
              1,
            line_amount: tip.amount,
            smart_code: heraCode('HERA.SALON.POS.LINE.TIP.v1'),
            line_data: {
              branch_id: options.branch_id,
              stylist_id: tip.stylist_id,
              payment_method: tip.method,
              tip_percentage: tip.percentage
            }
          })),
          // Tax line (if applicable)
          ...(totals.taxAmount > 0
            ? [
                {
                  line_number:
                    ticket.lineItems.length +
                    payments.length +
                    (ticket.discounts?.length || 0) +
                    (ticket.tips?.length || 0) +
                    1,
                  line_amount: totals.taxAmount,
                  smart_code: heraCode('HERA.SALON.POS.LINE.TAX.v1'),
                  line_data: {
                    branch_id: options.branch_id,
                    tax_rate: 0.05,
                    tax_type: 'VAT',
                    taxable_amount: totals.subtotal - totals.discountAmount
                  }
                }
              ]
            : [])
        ]
      }

      // Post the sale with commission calculation
      const result = await postPosSaleWithCommission(transactionData)

      if (!result.success) {
        throw new Error(result.error || 'Transaction posting failed')
      }

      // Update customer statistics if customer is attached
      if (ticket.customer_id) {
        await this.updateCustomerStatistics(ticket.customer_id, totals.total)
      }

      // Mark appointment as completed if linked
      if (ticket.appointment_id) {
        await this.updateAppointmentStatus(ticket.appointment_id, 'completed')
      }

      return {
        success: true,
        transaction_id: result.transaction_id,
        transaction_code: result.transaction_code,
        commission_lines: result.commission_lines
      }
    } catch (error) {
      console.error('Error processing POS transaction:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Helper methods
   */
  private calculateTicketTotals(ticket: any) {
    const subtotal = ticket.lineItems.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unit_price,
      0
    )

    const discountAmount = (ticket.discounts || []).reduce(
      (sum: number, discount: any) => sum + discount.amount,
      0
    )

    const tipAmount = (ticket.tips || []).reduce((sum: number, tip: any) => sum + tip.amount, 0)

    const taxRate = 0.05 // 5% VAT
    const taxableAmount = subtotal - discountAmount
    const taxAmount = taxableAmount * taxRate

    const total = subtotal - discountAmount + tipAmount + taxAmount

    return {
      subtotal,
      discountAmount,
      tipAmount,
      taxAmount,
      total: Math.max(0, total)
    }
  }

  private getPaymentSmartCode(paymentType: string): string {
    switch (paymentType) {
      case 'cash':
        return heraCode('HERA.SALON.POS.PAYMENT.CASH.v1')
      case 'card':
        return heraCode('HERA.SALON.POS.PAYMENT.CARD.v1')
      case 'voucher':
        return heraCode('HERA.SALON.POS.PAYMENT.VOUCHER.v1')
      default:
        return heraCode('HERA.SALON.POS.PAYMENT.OTHER.v1')
    }
  }

  private async getCustomerPricingModifier(customerId: string) {
    try {
      const customerDataResponse = await universalApi.getDynamicFields(customerId)

      const customerData = customerDataResponse?.data || []
      const customerFields: any = {}
      customerData.forEach(field => {
        customerFields[field.field_name] =
          field.field_value_text ||
          field.field_value_number ||
          field.field_value_date ||
          field.field_value_boolean
      })

      // VIP tier discounts
      const vipDiscounts: any = {
        vip: 10,
        premium: 15,
        platinum: 20
      }

      return {
        discount_percentage:
          customerFields.discount_percentage || vipDiscounts[customerFields.vip_tier] || 0
      }
    } catch (error) {
      console.error('Error getting customer pricing modifier:', error)
      return null
    }
  }

  private async getStylistCommissionRate(stylistId: string) {
    try {
      const stylistDataResponse = await universalApi.getDynamicFields(stylistId)

      const commissionData = stylistDataResponse?.data?.find(
        f => f.field_name === 'commission_rate'
      )
      return {
        commission_rate: commissionData?.field_value_number || 30
      }
    } catch (error) {
      console.error('Error getting stylist commission rate:', error)
      return { commission_rate: 30 }
    }
  }

  private async validateStylistAvailability(
    stylistId: string,
    appointmentId?: string
  ): Promise<boolean> {
    // Simplified validation - in production would check actual calendar
    return true
  }

  private async validateCustomerExists(customerId: string): Promise<boolean> {
    try {
      const customerResponse = await universalApi.getEntity(customerId)
      return customerResponse?.success && customerResponse.data?.entity_type === 'customer'
    } catch {
      return false
    }
  }

  private async updateCustomerStatistics(customerId: string, saleAmount: number) {
    try {
      // This would update customer's total_visits and total_spent
      // Implementation depends on your dynamic data update strategy
      console.log('Updating customer statistics:', { customerId, saleAmount })
    } catch (error) {
      console.error('Error updating customer statistics:', error)
    }
  }

  private async updateAppointmentStatus(appointmentId: string, status: string) {
    try {
      // This would update appointment status
      // Implementation depends on your dynamic data update strategy
      console.log('Updating appointment status:', { appointmentId, status })
    } catch (error) {
      console.error('Error updating appointment status:', error)
    }
  }
}

/**
 * Factory function to create salon POS integration service
 */
export function createSalonPosIntegration(organizationId: string): SalonPosIntegrationService {
  return new SalonPosIntegrationService(organizationId)
}

/**
 * React hook for salon POS integration
 */
export function useSalonPosIntegration(organizationId: string) {
  const service = new SalonPosIntegrationService(organizationId)

  return {
    getServicePricing: service.getServicePricing.bind(service),
    getAvailableStylists: service.getAvailableStylists.bind(service),
    validatePosTicket: service.validatePosTicket.bind(service),
    processPosTransaction: service.processPosTransaction.bind(service)
  }
}
