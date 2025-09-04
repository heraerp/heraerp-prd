/**
 * Salon API Client
 * Uses DNA-compliant API endpoints
 * All operations go through MCP via the DNA SDK
 */

export interface SalonDashboardData {
  appointments: number;
  customers: number;
  todayRevenue: number;
  products: number;
  recentAppointments: any[];
  topServices: any[];
  staffMembers: any[];
}

export class SalonApiClient {
  private baseUrl = '/api/v1/salon/dna';

  /**
   * Fetch dashboard data
   */
  async getDashboardData(organizationId: string): Promise<SalonDashboardData> {
    // Only fetch on client side to avoid SSR issues
    if (typeof window === 'undefined') {
      return {
        appointments: 0,
        customers: 0,
        todayRevenue: 0,
        products: 0,
        recentAppointments: [],
        topServices: [],
        staffMembers: []
      };
    }
    
    try {
      const response = await fetch(`${this.baseUrl}?org_id=${organizationId}&action=dashboard`);
      
      if (!response.ok) {
        console.error('Dashboard API response not OK:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Return default data on error to prevent app crash
      return {
        appointments: 0,
        customers: 0,
        todayRevenue: 0,
        products: 0,
        recentAppointments: [],
        topServices: [],
        staffMembers: []
      };
    }
  }

  /**
   * Fetch customers
   */
  async getCustomers(organizationId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}?org_id=${organizationId}&action=customers`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch customers');
    }

    return result.data;
  }

  /**
   * Fetch appointments
   */
  async getAppointments(organizationId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}?org_id=${organizationId}&action=appointments`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch appointments');
    }

    return result.data;
  }

  /**
   * Fetch staff members
   */
  async getStaffMembers(organizationId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}?org_id=${organizationId}&action=staff`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch staff');
    }

    return result.data;
  }

  /**
   * Fetch services
   */
  async getServices(organizationId: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}?org_id=${organizationId}&action=services`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch services');
    }

    return result.data;
  }

  /**
   * Create appointment
   */
  async createAppointment(organizationId: string, data: {
    customerId: string;
    staffId: string;
    serviceIds: string[];
    appointmentDate: Date;
    notes?: string;
  }): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId,
        action: 'create-appointment',
        data
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to create appointment');
    }

    return result.data.id;
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    organizationId: string, 
    appointmentId: string, 
    status: 'scheduled' | 'checkedin' | 'inprogress' | 'completed' | 'cancelled'
  ): Promise<void> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organizationId,
        action: 'update-appointment-status',
        data: {
          appointmentId,
          status
        }
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to update appointment status');
    }
  }
}

// Export singleton instance
export const salonApiClient = new SalonApiClient();