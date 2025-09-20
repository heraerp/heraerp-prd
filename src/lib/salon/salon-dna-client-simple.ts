/**
 * Salon DNA Client - Simplified Version
 * Uses direct Supabase connection for server-side operations
 */

import { createClient } from '@supabase/supabase-js'

export interface SalonDashboardData {
  appointments: number
  customers: number
  todayRevenue: number
  products: number
  recentAppointments: any[]
  topServices: any[]
  staffMembers: any[]
}

export class SimpleSalonDNAClient {
  private organizationId: string
  private supabase: any

  constructor(organizationId: string) {
    this.organizationId = organizationId

    // Initialize Supabase client for server-side operations
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )
  }

  /**
   * Fetch dashboard data with simplified implementation
   */
  async getDashboardData(): Promise<SalonDashboardData> {
    try {
      // Fetch all data in parallel using simple queries
      const [customers, products, appointments, sales, staff, services] = await Promise.all([
        this.getCustomers(),
        this.getProducts(),
        this.getTodayAppointments(),
        this.getTodaySales(),
        this.getStaffMembers(),
        this.getServices()
      ])

      // Debug logging
      console.log('Salon Data Debug:', {
        customers: customers.length,
        products: products.length,
        appointments: appointments.length,
        sales: sales.length,
        staff: staff.length,
        services: services.length
      })

      // Calculate today's revenue from sales
      const todayRevenue = sales.reduce((sum: number, sale: any) => {
        return sum + (parseFloat(sale.total_amount) || 0)
      }, 0)

      return {
        appointments: appointments.length,
        customers: customers.length,
        todayRevenue,
        products: products.length,
        recentAppointments: appointments.slice(0, 4),
        topServices: services.slice(0, 3),
        staffMembers: staff
      }
    } catch (error) {
      console.error('SimpleSalonDNAClient: Error fetching dashboard data:', error)
      throw error
    }
  }

  /**
   * Get all customers using direct Supabase connection
   */
  async getCustomers(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'customer')

      if (error) {
        console.error('Failed to fetch customers:', error)
        return []
      }

      console.log('Customers found:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Error fetching customers:', error)
      return []
    }
  }

  /**
   * Get all products using direct Supabase connection
   */
  async getProducts(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.organizationId)
        .in('entity_type', ['product', 'service', 'service_category', 'product_category'])

      if (error) {
        console.error('Failed to fetch products:', error)
        return []
      }

      console.log('Products/Services found:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(): Promise<any[]> {
    try {
      // Get appointments from core_entities
      const { data, error } = await this.supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'appointment')

      if (error) {
        console.error('Failed to fetch appointments:', error)
        return []
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Filter for today's appointments
      const appointments = (data || []).filter((apt: any) => {
        if (!(apt.metadata as any)?.appointment_date) return false
        const aptDate = new Date(apt.metadata.appointment_date)
        aptDate.setHours(0, 0, 0, 0)
        return aptDate.getTime() === today.getTime()
      })

      console.log('Today appointments found:', appointments.length)

      // Enrich appointments with customer, service, and staff details
      const enrichedAppointments = await Promise.all(
        appointments.map(async (apt: any) => {
          const [customer, service, staff] = await Promise.all([
            (apt.metadata as any)?.customer_id
              ? this.getEntityById(apt.metadata.customer_id)
              : null,
            (apt.metadata as any)?.service_id ? this.getEntityById(apt.metadata.service_id) : null,
            (apt.metadata as any)?.stylist_id ? this.getEntityById(apt.metadata.stylist_id) : null
          ])

          return {
            ...apt,
            customer,
            service,
            staff,
            time: (apt.metadata as any)?.appointment_time || 'Not set',
            status: (apt.metadata as any)?.status || 'scheduled'
          }
        })
      )

      return enrichedAppointments
    } catch (error) {
      console.error('Error fetching appointments:', error)
      return []
    }
  }

  /**
   * Helper to get entity by ID
   */
  async getEntityById(entityId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('core_entities')
        .select('*')
        .eq('id', entityId)
        .single()

      return error ? null : data
    } catch {
      return null
    }
  }

  /**
   * Get recent sales using direct Supabase connection
   */
  async getTodaySales(): Promise<any[]> {
    try {
      // Get recent sales (last 7 days for demo purposes)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data, error } = await this.supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', this.organizationId)
        .in('transaction_type', ['sale', 'service', 'product_sale', 'service_sale'])
        .gte('transaction_date', sevenDaysAgo.toISOString())

      if (error) {
        console.error('Failed to fetch sales:', error)
        return []
      }

      console.log('Recent sales found:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('Error fetching sales:', error)
      return []
    }
  }

  /**
   * Get all staff members using direct Supabase connection
   */
  async getStaffMembers(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', this.organizationId)
        .eq('entity_type', 'employee')

      if (error) {
        console.error('Failed to fetch staff:', error)
        return []
      }

      console.log('Staff members found:', data?.length || 0)

      // Add some basic enrichment
      return (data || []).map((member: any) => ({
        ...member,
        rating: 4.5 + Math.random() * 0.5, // Mock rating
        specialties: ['Hair Styling'], // Mock specialties
        available: Math.random() > 0.3 // Mock availability
      }))
    } catch (error) {
      console.error('Error fetching staff:', error)
      return []
    }
  }

  /**
   * Get all services
   */
  async getServices(): Promise<any[]> {
    try {
      const response = await fetch(
        `/api/v1/universal?action=read&table=core_entities&organization_id=${this.organizationId}`
      )
      const result = await response.json()

      if (!result.success) {
        console.error('Failed to fetch services:', result.error)
        return []
      }

      // Filter for services
      const services = (result.data || []).filter((entity: any) => entity.entity_type === 'service')

      // Add some basic enrichment
      return services.map((service: any) => ({
        ...service,
        price: 100 + Math.random() * 400, // Mock price
        duration: '1-2 hours', // Mock duration
        category: 'Hair Care' // Mock category
      }))
    } catch (error) {
      console.error('Error fetching services:', error)
      return []
    }
  }

  /**
   * Create new appointment (simplified)
   */
  async createAppointment(params: {
    customerId: string
    staffId: string
    serviceIds: string[]
    appointmentDate: Date
    notes?: string
  }): Promise<string> {
    try {
      const response = await fetch('/api/v1/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create',
          table: 'universal_transactions',
          data: {
            organization_id: this.organizationId,
            transaction_type: 'appointment',
            transaction_date: params.appointmentDate.toISOString(),
            total_amount: 0, // Will be calculated
            smart_code: 'HERA.SALON.APPT.TXN.BOOKING.V1',
            metadata: {
              customer_id: params.customerId,
              staff_id: params.staffId,
              service_ids: params.serviceIds,
              notes: params.notes,
              status: 'scheduled'
            }
          },
          organization_id: this.organizationId
        })
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to create appointment')
      }

      return result.data.id
    } catch (error) {
      console.error('Error creating appointment:', error)
      throw error
    }
  }

  /**
   * Update appointment status (simplified)
   */
  async updateAppointmentStatus(
    appointmentId: string,
    newStatus: 'scheduled' | 'checkedin' | 'inprogress' | 'completed' | 'cancelled'
  ): Promise<void> {
    try {
      const response = await fetch('/api/v1/universal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'update',
          table: 'universal_transactions',
          id: appointmentId,
          data: {
            metadata: {
              status: newStatus,
              updated_at: new Date().toISOString()
            }
          },
          organization_id: this.organizationId
        })
      })

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Failed to update appointment status')
      }
    } catch (error) {
      console.error('Error updating appointment status:', error)
      throw error
    }
  }
}

// Export convenience function
export function createSimpleSalonDNAClient(organizationId: string): SimpleSalonDNAClient {
  return new SimpleSalonDNAClient(organizationId)
}
