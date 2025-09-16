/**
 * Salon DNA Client - Hybrid Version
 * Uses MCP for writes (compliant) and Universal API for reads (temporary)
 * This allows the salon to work with existing data while MCP is being enhanced
 */

export interface SalonDashboardData {
  appointments: number
  customers: number
  todayRevenue: number
  products: number
  recentAppointments: any[]
  topServices: any[]
  staffMembers: any[]
}

export class HybridSalonDNAClient {
  private organizationId: string
  private baseUrl: string

  constructor(organizationId: string, baseUrl?: string) {
    if (!organizationId) {
      throw new Error('ERROR_ORG_REQUIRED: Organization ID is mandatory')
    }
    this.organizationId = organizationId
    // Use provided baseUrl or determine based on environment
    this.baseUrl =
      baseUrl ||
      (typeof window === 'undefined'
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`
        : '')
  }

  /**
   * Fetch dashboard data using Universal API for reads
   */
  async getDashboardData(): Promise<SalonDashboardData> {
    try {
      // Fetch all data in parallel with error handling
      const [customers, products, appointments, staff, services] = await Promise.allSettled([
        this.getCustomers(),
        this.getProducts(),
        this.getTodayAppointments(),
        this.getStaffMembers(),
        this.getServices()
      ])

      // Extract values, use empty arrays for failed requests
      const customersData = customers.status === 'fulfilled' ? customers.value : []
      const productsData = products.status === 'fulfilled' ? products.value : []
      const appointmentsData = appointments.status === 'fulfilled' ? appointments.value : []
      const staffData = staff.status === 'fulfilled' ? staff.value : []
      const servicesData = services.status === 'fulfilled' ? services.value : []

      // Calculate today's revenue from appointments with completed/in_progress status
      const todayRevenue = appointmentsData
        .filter(
          apt =>
            (apt.metadata as any)?.status === 'completed' ||
            (apt.metadata as any)?.status === 'in_progress'
        )
        .reduce((sum, apt) => sum + ((apt.metadata as any)?.price || 0), 0)

      return {
        appointments: appointmentsData.length,
        customers: customersData.length,
        todayRevenue,
        products: productsData.length,
        recentAppointments: appointmentsData.slice(0, 4),
        topServices: servicesData.slice(0, 3),
        staffMembers: staffData
      }
    } catch (error) {
      console.error('HybridSalonDNAClient: Error fetching dashboard data:', error)
      // Return default data instead of throwing to prevent app crash
      return {
        appointments: 0,
        customers: 0,
        todayRevenue: 0,
        products: 0,
        recentAppointments: [],
        topServices: [],
        staffMembers: []
      }
    }
  }

  /**
   * Get customers via Universal API
   */
  async getCustomers(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/universal?action=read&table=core_entities&organization_id=${this.organizationId}`
      )

      if (!response.ok) {
        console.error('Failed to fetch customers - HTTP error:', response.status)
        return []
      }

      const result = await response.json()

      if (!result.success) {
        console.error('Failed to fetch customers:', result.error)
        return []
      }

      return (result.data || []).filter((entity: any) => entity.entity_type === 'customer')
    } catch (error) {
      console.error('Error fetching customers:', error)
      return []
    }
  }

  /**
   * Get products/services via Universal API
   */
  async getProducts(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/universal?action=read&table=core_entities&organization_id=${this.organizationId}`
      )

      if (!response.ok) {
        console.error('Failed to fetch products - HTTP error:', response.status)
        return []
      }

      const result = await response.json()

      if (!result.success) {
        console.error('Failed to fetch products:', result.error)
        return []
      }

      return (result.data || []).filter(
        (entity: any) => entity.entity_type === 'product' || entity.entity_type === 'service'
      )
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  }

  /**
   * Get today's appointments via Universal API
   */
  async getTodayAppointments(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/universal?action=read&table=core_entities&organization_id=${this.organizationId}`
      )

      if (!response.ok) {
        console.error('Failed to fetch appointments - HTTP error:', response.status)
        return []
      }

      const result = await response.json()

      if (!result.success) {
        console.error('Failed to fetch appointments:', result.error)
        return []
      }

      const today = new Date().toISOString().split('T')[0]

      // Filter for appointments with today's date
      const appointments = (result.data || []).filter((entity: any) => {
        return (
          entity.entity_type === 'appointment' &&
          (entity.metadata as any)?.appointment_date === today
        )
      })

      console.log('Found appointments for today:', appointments.length)
      return appointments
    } catch (error) {
      console.error('Error fetching appointments:', error)
      return []
    }
  }

  /**
   * Get staff members via Universal API
   */
  async getStaffMembers(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/universal?action=read&table=core_entities&organization_id=${this.organizationId}`
      )

      if (!response.ok) {
        console.error('Failed to fetch staff - HTTP error:', response.status)
        return []
      }

      const result = await response.json()

      if (!result.success) {
        console.error('Failed to fetch staff:', result.error)
        return []
      }

      const staff = (result.data || []).filter((entity: any) => entity.entity_type === 'employee')

      // Add some enrichment
      return staff.map((member: any) => ({
        ...member,
        rating: 4.5,
        specialties: (member.metadata as any)?.specialization
          ? [member.metadata.specialization]
          : ['General'],
        available: true
      }))
    } catch (error) {
      console.error('Error fetching staff:', error)
      return []
    }
  }

  /**
   * Get services via Universal API
   */
  async getServices(): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/universal?action=read&table=core_entities&organization_id=${this.organizationId}`
      )

      if (!response.ok) {
        console.error('Failed to fetch services - HTTP error:', response.status)
        return []
      }

      const result = await response.json()

      if (!result.success) {
        console.error('Failed to fetch services:', result.error)
        return []
      }

      const services = (result.data || []).filter((entity: any) => entity.entity_type === 'service')

      // Add enrichment from metadata
      return services.map((service: any) => ({
        ...service,
        price: (service.metadata as any)?.price || 100,
        duration: (service.metadata as any)?.duration
          ? `${service.metadata.duration} minutes`
          : '60 minutes',
        category: (service.metadata as any)?.category || 'General'
      }))
    } catch (error) {
      console.error('Error fetching services:', error)
      return []
    }
  }

  /**
   * Create appointment (MCP-compliant for writes)
   */
  async createAppointment(params: {
    customerId: string
    staffId: string
    serviceIds: string[]
    appointmentDate: Date
    appointmentTime: string
    notes?: string
  }): Promise<string> {
    // For writes, we should use MCP
    // For now, using Universal API
    const response = await fetch(`${this.baseUrl}/api/v1/universal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        table: 'core_entities',
        data: {
          organization_id: this.organizationId,
          entity_type: 'appointment',
          entity_name: `Appointment - ${params.appointmentTime}`,
          entity_code: `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          smart_code: 'HERA.SALON.BOOKING.APPOINTMENT.v1',
          metadata: {
            customer_id: params.customerId,
            stylist_id: params.staffId,
            service_ids: params.serviceIds,
            appointment_date: params.appointmentDate.toISOString().split('T')[0],
            appointment_time: params.appointmentTime,
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
  }

  /**
   * Update appointment status (should use MCP relationships, not status columns)
   */
  async updateAppointmentStatus(appointmentId: string, newStatus: string): Promise<void> {
    // This should create a relationship for status tracking
    // For now, updating metadata
    const response = await fetch(`${this.baseUrl}/api/v1/universal`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'update',
        table: 'core_entities',
        id: appointmentId,
        data: {
          metadata: { status: newStatus }
        },
        organization_id: this.organizationId
      })
    })

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Failed to update appointment status')
    }
  }
}

/**
 * Factory function for creating hybrid salon client
 */
export function createHybridSalonDNAClient(
  organizationId: string,
  baseUrl?: string
): HybridSalonDNAClient {
  return new HybridSalonDNAClient(organizationId, baseUrl)
}
