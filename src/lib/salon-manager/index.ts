/**
 * HERA Salon Manager Service
 * Comprehensive salon operations management using HERA Universal Architecture
 */

import { supabase } from '@/lib/supabase'
import { universalApi } from '@/lib/universal-api'
import {
  ISalonManagerService,
  AppointmentRequest,
  InventoryCheckResult,
  RevenueAnalysis,
  StaffPerformance,
  ClientInfo,
  ServiceInfo,
  SalonTransaction
} from './contracts'

export class SalonManagerService implements ISalonManagerService {
  private organizationId: string
  private userId: string

  constructor(organizationId: string, userId: string) {
    this.organizationId = organizationId
    this.userId = userId
    universalApi.setOrganizationId(organizationId)
  }

  /**
   * Book an appointment
   */
  async bookAppointment(request: AppointmentRequest): Promise<any> {
    try {
      // Find or create client
      let clientId = request.clientId
      if (!clientId && request.clientName) {
        const client = await this.findOrCreateClient(request.clientName, request.clientPhone)
        clientId = client.id
      }

      // Find stylist
      const stylist = await this.findStylist(request.stylistName)
      if (!stylist) {
        throw new Error(`Stylist ${request.stylistName} not found`)
      }

      // Find service
      const service = await this.findService(request.serviceName)
      if (!service) {
        throw new Error(`Service ${request.serviceName} not available`)
      }

      // Create appointment transaction
      const appointment = await universalApi.createTransaction({
        transaction_type: 'appointment',
        transaction_code: `APT-${Date.now().toString().slice(-6)}`,
        transaction_date: request.dateTime,
        from_entity_id: clientId,
        to_entity_id: stylist.id,
        total_amount: service.price,
        smart_code: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
        metadata: {
          service_id: service.id,
          service_name: service.name,
          duration_minutes: service.duration,
          status: 'scheduled',
          notes: request.notes,
          created_by: this.userId
        }
      })

      // Create appointment line for the service
      await universalApi.createTransactionLine({
        transaction_id: appointment.id,
        line_entity_id: service.id,
        line_number: 1,
        quantity: 1,
        unit_price: service.price,
        line_amount: service.price,
        smart_code: 'HERA.SALON.SERVICE.LINE.V1',
        metadata: {
          service_type: service.category,
          commission_rate: stylist.commission_rate || 0.3
        }
      })

      return {
        success: true,
        appointmentId: appointment.id,
        appointmentCode: appointment.transaction_code,
        message: `✅ **Appointment Confirmed!**\n\n📅 **Date & Time**: ${new Date(request.dateTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date(request.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}\n👤 **Client**: ${request.clientName}\n💇 **Service**: ${request.serviceName}\n✂️ **Stylist**: ${request.stylistName}\n💰 **Price**: $${service.price}\n\n**📋 Booking Reference**: ${appointment.transaction_code}\n\n*Please save this reference for your records.*`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Check inventory levels
   */
  async checkInventory(productName?: string): Promise<InventoryCheckResult> {
    const query = supabase
      .from('core_entities')
      .select('*, core_dynamic_data(*)')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'product')
      .eq('status', 'active')

    if (productName) {
      query.ilike('entity_name', `%${productName}%`)
    }

    const { data: products, error } = await query
    if (error) throw error

    const inventory =
      products?.map(product => {
        const stockField = product.core_dynamic_data?.find(
          (f: any) => f.field_name === 'current_stock'
        )
        const minField = product.core_dynamic_data?.find((f: any) => f.field_name === 'min_stock')
        const costField = product.core_dynamic_data?.find((f: any) => f.field_name === 'unit_cost')

        const currentStock = stockField?.field_value_number || 0
        const minStock = minField?.field_value_number || 5
        const unitCost = costField?.field_value_number || 0

        return {
          id: product.id,
          name: product.entity_name,
          code: product.entity_code,
          currentStock,
          minStock,
          unitCost,
          totalValue: currentStock * unitCost,
          isLow: currentStock <= minStock,
          category: (product.metadata as any)?.category || 'general'
        }
      }) || []

    return {
      products: inventory,
      summary: {
        totalProducts: inventory.length,
        totalValue: inventory.reduce((sum, p) => sum + p.totalValue, 0),
        lowStockItems: inventory.filter(p => p.isLow).length,
        outOfStock: inventory.filter(p => p.currentStock === 0).length
      }
    }
  }

  /**
   * Analyze revenue
   */
  async analyzeRevenue(period: string): Promise<RevenueAnalysis> {
    const { startDate, endDate } = this.getPeriodDates(period)

    // Get completed transactions
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select(
        `
        *,
        universal_transaction_lines(*)
      `
      )
      .eq('organization_id', this.organizationId)
      .in('transaction_type', ['sale', 'appointment'])
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString())
      .eq('metadata->status', 'completed')

    if (error) throw error

    // Analyze by service category
    const serviceRevenue = new Map<string, number>()
    const productRevenue = new Map<string, number>()
    let totalServices = 0
    let totalProducts = 0

    transactions?.forEach(txn => {
      txn.universal_transaction_lines?.forEach(line => {
        if ((line.metadata as any)?.service_type) {
          const current = serviceRevenue.get(line.metadata.service_type) || 0
          serviceRevenue.set(line.metadata.service_type, current + line.line_amount)
          totalServices += line.line_amount
        } else if ((line.metadata as any)?.product_category) {
          const current = productRevenue.get(line.metadata.product_category) || 0
          productRevenue.set(line.metadata.product_category, current + line.line_amount)
          totalProducts += line.line_amount
        }
      })
    })

    const totalRevenue = totalServices + totalProducts

    return {
      period,
      startDate,
      endDate,
      totalRevenue,
      serviceRevenue: totalServices,
      productRevenue: totalProducts,
      transactionCount: transactions?.length || 0,
      averageTicket: transactions?.length ? totalRevenue / transactions.length : 0,
      topServices: Array.from(serviceRevenue.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, revenue]) => ({ category, revenue })),
      topProducts: Array.from(productRevenue.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, revenue]) => ({ category, revenue }))
    }
  }

  /**
   * Analyze staff performance
   */
  async analyzeStaffPerformance(period: string): Promise<StaffPerformance[]> {
    const { startDate, endDate } = this.getPeriodDates(period)

    // Get all stylists
    const { data: stylists, error: stylistError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'employee')
      .eq('metadata->role', 'stylist')
      .eq('status', 'active')

    if (stylistError) throw stylistError

    const performances: StaffPerformance[] = []

    for (const stylist of stylists || []) {
      // Get transactions where stylist was the service provider
      const { data: transactions, error } = await supabase
        .from('universal_transactions')
        .select(
          `
          *,
          universal_transaction_lines(*)
        `
        )
        .eq('organization_id', this.organizationId)
        .eq('to_entity_id', stylist.id)
        .in('transaction_type', ['appointment', 'sale'])
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString())
        .eq('metadata->status', 'completed')

      if (error) continue

      let revenue = 0
      let commission = 0
      let serviceCount = 0
      const services = new Map<string, number>()

      transactions?.forEach(txn => {
        revenue += txn.total_amount || 0

        txn.universal_transaction_lines?.forEach(line => {
          serviceCount++
          const commissionRate = (line.metadata as any)?.commission_rate || 0.3
          commission += line.line_amount * commissionRate

          const serviceName = (line.metadata as any)?.service_name || 'Other'
          services.set(serviceName, (services.get(serviceName) || 0) + 1)
        })
      })

      performances.push({
        stylistId: stylist.id,
        stylistName: stylist.entity_name,
        period,
        revenue,
        commission,
        appointmentCount: transactions?.length || 0,
        serviceCount,
        averageTicket: transactions?.length ? revenue / transactions.length : 0,
        topServices: Array.from(services.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([service, count]) => ({ service, count }))
      })
    }

    return performances.sort((a, b) => b.revenue - a.revenue)
  }

  /**
   * Find available appointments
   */
  async findAvailableSlots(date: Date, serviceName?: string): Promise<any> {
    try {
      console.log('Finding available slots:', {
        date,
        serviceName,
        organizationId: this.organizationId
      })

      // Get all appointments for the date
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      // Query appointments - handle cases where metadata might be null
      let query = supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('transaction_type', 'appointment')
        .gte('transaction_date', startOfDay.toISOString())
        .lte('transaction_date', endOfDay.toISOString())

      // Only filter by cancelled status if metadata exists
      const { data: appointments, error } = await query

      if (error) {
        console.error('Error fetching appointments:', error)
        throw new Error(`Failed to fetch appointments: ${error.message}`)
      }

      // Get salon hours (default 9 AM to 7 PM)
      const slots = []
      for (let hour = 9; hour < 19; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotTime = new Date(date)
          slotTime.setHours(hour, minute, 0, 0)

          // Check if slot is taken (exclude cancelled appointments)
          const isTaken = appointments?.some(apt => {
            // Skip cancelled appointments
            if ((apt.metadata as any)?.status === 'cancelled') {
              return false
            }

            const aptTime = new Date(apt.transaction_date)
            const duration = (apt.metadata as any)?.duration_minutes || 60
            const aptEnd = new Date(aptTime.getTime() + duration * 60000)

            return slotTime >= aptTime && slotTime < aptEnd
          })

          if (!isTaken) {
            slots.push({
              time: slotTime.toISOString(),
              display: slotTime.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })
            })
          }
        }
      }

      return {
        date: date.toISOString().split('T')[0],
        availableSlots: slots,
        totalAvailable: slots.length
      }
    } catch (error) {
      console.error('Error in findAvailableSlots:', error)
      throw error
    }
  }

  /**
   * Find appointments by client name or ID
   */
  async findAppointments(query: string): Promise<any> {
    try {
      // Search for client first
      const { data: clients } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'customer')
        .ilike('entity_name', `%${query}%`)

      if (!clients || clients.length === 0) {
        return {
          success: false,
          message: `No client found matching "${query}"`
        }
      }

      // Get appointments for found clients
      const clientIds = clients.map(c => c.id)

      // First try to find today's and future appointments
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      let { data: appointments, error } = await supabase
        .from('universal_transactions')
        .select(
          `
          *,
          universal_transaction_lines(*),
          from_entity:core_entities!universal_transactions_from_entity_id_fkey(*),
          to_entity:core_entities!universal_transactions_to_entity_id_fkey(*)
        `
        )
        .eq('organization_id', this.organizationId)
        .eq('transaction_type', 'appointment')
        .in('from_entity_id', clientIds)
        .gte('transaction_date', today.toISOString())
        .order('transaction_date', { ascending: true })
        .limit(10)

      // If no future appointments, get recent past appointments
      if (!appointments || appointments.length === 0) {
        const result = await supabase
          .from('universal_transactions')
          .select(
            `
            *,
            universal_transaction_lines(*),
            from_entity:core_entities!universal_transactions_from_entity_id_fkey(*),
            to_entity:core_entities!universal_transactions_to_entity_id_fkey(*)
          `
          )
          .eq('organization_id', this.organizationId)
          .eq('transaction_type', 'appointment')
          .in('from_entity_id', clientIds)
          .order('transaction_date', { ascending: false })
          .limit(10)

        appointments = result.data
        error = result.error
      }

      if (error) throw error

      const appointmentDetails = appointments?.map(apt => ({
        id: apt.id,
        code: apt.transaction_code,
        date: new Date(apt.transaction_date),
        clientName: apt.from_entity?.entity_name,
        stylistName: apt.to_entity?.entity_name,
        serviceName: (apt.metadata as any)?.service_name,
        amount: apt.total_amount,
        status: (apt.metadata as any)?.status || 'scheduled',
        duration: (apt.metadata as any)?.duration_minutes || 60
      }))

      return {
        success: true,
        appointments: appointmentDetails || [],
        totalFound: appointmentDetails?.length || 0,
        message: `Found ${appointmentDetails?.length || 0} appointment(s) for "${query}"`
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * AI-powered analytics and recommendations
   */
  async getAIInsights(context: string): Promise<any> {
    try {
      const insights: any = {
        recommendations: [],
        patterns: [],
        predictions: []
      }

      // Analyze booking patterns
      const { data: recentBookings } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('transaction_type', 'appointment')
        .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('transaction_date', { ascending: false })

      if (recentBookings && recentBookings.length > 0) {
        // Analyze peak hours
        const hourCounts = new Map<number, number>()
        recentBookings.forEach(booking => {
          const hour = new Date(booking.transaction_date).getHours()
          hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
        })

        const peakHour = Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0]

        insights.patterns.push({
          type: 'peak_hours',
          description: `Most bookings occur at ${peakHour[0]}:00 (${peakHour[1]} bookings)`,
          confidence: 85
        })

        // Service popularity
        const serviceCounts = new Map<string, number>()
        recentBookings.forEach(booking => {
          const service = (booking.metadata as any)?.service_name
          if (service) {
            serviceCounts.set(service, (serviceCounts.get(service) || 0) + 1)
          }
        })

        const popularService = Array.from(serviceCounts.entries()).sort((a, b) => b[1] - a[1])[0]

        if (popularService) {
          insights.recommendations.push({
            type: 'promotion',
            title: 'Promote Popular Service',
            description: `${popularService[0]} is your most popular service. Consider bundle offers.`,
            confidence: 90
          })
        }
      }

      // Check inventory for recommendations
      const inventory = await this.checkInventory()
      if (inventory.summary.lowStockItems > 0) {
        insights.recommendations.push({
          type: 'inventory',
          title: 'Restock Alert',
          description: `${inventory.summary.lowStockItems} products are low on stock. Place orders soon.`,
          confidence: 100
        })
      }

      // Revenue predictions
      const revenue = await this.analyzeRevenue('this_month')
      const lastMonthRevenue = await this.analyzeRevenue('last_month')

      if (revenue.totalRevenue > 0 && lastMonthRevenue.totalRevenue > 0) {
        const growthRate =
          ((revenue.totalRevenue - lastMonthRevenue.totalRevenue) / lastMonthRevenue.totalRevenue) *
          100
        insights.predictions.push({
          type: 'revenue_forecast',
          description: `Revenue trending ${growthRate > 0 ? 'up' : 'down'} ${Math.abs(growthRate).toFixed(1)}% compared to last month`,
          projectedMonthEnd: revenue.totalRevenue * 1.5, // Simple projection
          confidence: 75
        })
      }

      // Birthday promotions
      const birthdays = await this.getClientBirthdays(new Date().getMonth() + 1)
      if (birthdays.totalBirthdays > 0) {
        insights.recommendations.push({
          type: 'marketing',
          title: 'Birthday Campaign Opportunity',
          description: `${birthdays.totalBirthdays} clients have birthdays this month. Send special offers!`,
          confidence: 95
        })
      }

      return {
        success: true,
        insights,
        generatedAt: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get client birthday list
   */
  async getClientBirthdays(month: number): Promise<any> {
    // Query dynamic data for birth dates
    const { data: birthdays, error } = await supabase
      .from('core_dynamic_data')
      .select(
        `
        *,
        core_entities!inner(*)
      `
      )
      .eq('organization_id', this.organizationId)
      .eq('field_name', 'birth_date')
      .eq('core_entities.entity_type', 'customer')
      .eq('core_entities.status', 'active')

    if (error) throw error

    const birthdayClients = birthdays
      ?.filter(record => {
        const birthDate = new Date(record.field_value_date)
        return birthDate.getMonth() + 1 === month
      })
      .map(record => ({
        clientId: record.entity_id,
        clientName: record.core_entities.entity_name,
        birthDate: record.field_value_date,
        dayOfMonth: new Date(record.field_value_date).getDate()
      }))

    return {
      month,
      monthName: new Date(2000, month - 1, 1).toLocaleString('en', { month: 'long' }),
      clients: birthdayClients?.sort((a, b) => a.dayOfMonth - b.dayOfMonth) || [],
      totalBirthdays: birthdayClients?.length || 0
    }
  }

  // Helper methods

  private async findOrCreateClient(name: string, phone?: string): Promise<any> {
    // Try to find existing client
    const { data: existing } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'customer')
      .ilike('entity_name', name)
      .single()

    if (existing) return existing

    // Create new client
    const client = await universalApi.createEntity({
      entity_type: 'customer',
      entity_name: name,
      entity_code: `CUST-${Date.now().toString().slice(-6)}`,
      smart_code: 'HERA.SALON.CUSTOMER.PROFILE.V1',
      metadata: {
        source: 'appointment_booking',
        created_by: this.userId
      }
    })

    // Add phone if provided
    if (phone) {
      await universalApi.setDynamicField(client.id, 'phone', phone)
    }

    return client
  }

  private async findStylist(name: string): Promise<any> {
    const { data: stylist } = await supabase
      .from('core_entities')
      .select('*, core_dynamic_data(*)')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'employee')
      .ilike('entity_name', `%${name}%`)
      .eq('status', 'active')
      .single()

    if (stylist) {
      const commissionField = stylist.core_dynamic_data?.find(
        (f: any) => f.field_name === 'commission_rate'
      )
      stylist.commission_rate = commissionField?.field_value_number || 0.3
    }

    return stylist
  }

  private async findService(name: string): Promise<ServiceInfo> {
    const { data: service } = await supabase
      .from('core_entities')
      .select('*, core_dynamic_data(*)')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'service')
      .ilike('entity_name', `%${name}%`)
      .eq('status', 'active')
      .single()

    if (!service) return null

    const priceField = service.core_dynamic_data?.find((f: any) => f.field_name === 'price')
    const durationField = service.core_dynamic_data?.find(
      (f: any) => f.field_name === 'duration_minutes'
    )

    return {
      id: service.id,
      name: service.entity_name,
      category: (service.metadata as any)?.category || 'general',
      price: priceField?.field_value_number || 0,
      duration: durationField?.field_value_number || 60
    }
  }

  private getPeriodDates(period: string): { startDate: Date; endDate: Date } {
    const now = new Date()
    let startDate: Date, endDate: Date

    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        endDate = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'yesterday':
        startDate = new Date(now.setDate(now.getDate() - 1))
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'this_week':
        const firstDay = now.getDate() - now.getDay()
        startDate = new Date(now.setDate(firstDay))
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date()
        break
      case 'last_week':
        const lastWeekStart = now.getDate() - now.getDay() - 7
        startDate = new Date(now.setDate(lastWeekStart))
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 6)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0))
        endDate = new Date()
    }

    return { startDate, endDate }
  }
}

// Export factory function
export function createSalonManagerService(
  organizationId: string,
  userId: string
): ISalonManagerService {
  return new SalonManagerService(organizationId, userId)
}
