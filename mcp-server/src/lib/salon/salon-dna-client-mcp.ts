/**
 * Salon DNA Client - MCP ONLY Version
 * All operations go through MCP gateway
 * NO DIRECT DATABASE ACCESS
 */

import { HeraDNASDK } from '@/lib/dna-sdk';

export interface SalonDashboardData {
  appointments: number;
  customers: number;
  todayRevenue: number;
  products: number;
  recentAppointments: any[];
  topServices: any[];
  staffMembers: any[];
}

export class MCPSalonDNAClient {
  private organizationId: string;
  private dna: HeraDNASDK;

  constructor(organizationId: string) {
    if (!organizationId) {
      throw new Error('ERROR_ORG_REQUIRED: Organization ID is mandatory');
    }
    this.organizationId = organizationId;
    this.dna = new HeraDNASDK({ 
      organizationId,
      transport: 'MCP' // ALWAYS USE MCP
    });
  }

  /**
   * Fetch dashboard data using MCP-compliant reads
   */
  async getDashboardData(): Promise<SalonDashboardData> {
    try {
      // Use MCP batch read for all dashboard data
      const [customers, products, appointments, staff, services] = await Promise.all([
        this.getCustomers(),
        this.getProducts(), 
        this.getTodayAppointments(),
        this.getStaffMembers(),
        this.getServices()
      ]);

      // Calculate today's revenue from appointments
      const todayRevenue = appointments
        .filter(apt => apt.metadata?.status === 'completed' || apt.metadata?.status === 'in_progress')
        .reduce((sum, apt) => sum + (apt.metadata?.price || 0), 0);

      return {
        appointments: appointments.length,
        customers: customers.length,
        todayRevenue,
        products: products.length,
        recentAppointments: appointments.slice(0, 4),
        topServices: services.slice(0, 3),
        staffMembers: staff
      };
    } catch (error) {
      console.error('MCPSalonDNAClient: Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get customers via MCP
   */
  async getCustomers(): Promise<any[]> {
    return this.dna.entities.list({
      organization_id: this.organizationId,
      entity_type: 'customer',
      filters: { status: 'active' }
    }, { transport: 'MCP' });
  }

  /**
   * Get products/services via MCP
   */
  async getProducts(): Promise<any[]> {
    return this.dna.entities.list({
      organization_id: this.organizationId,
      entity_type: ['product', 'service'],
      filters: { status: 'active' }
    }, { transport: 'MCP' });
  }

  /**
   * Get today's appointments via MCP
   */
  async getTodayAppointments(): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const appointments = await this.dna.entities.list({
      organization_id: this.organizationId,
      entity_type: 'appointment',
      filters: {
        'metadata.appointment_date': today,
        status: 'active'
      }
    }, { transport: 'MCP' });

    // Enrich with related entities if needed
    return appointments;
  }

  /**
   * Get staff members via MCP
   */
  async getStaffMembers(): Promise<any[]> {
    return this.dna.entities.list({
      organization_id: this.organizationId,
      entity_type: 'employee',
      filters: { 
        status: 'active',
        'metadata.role': 'stylist'
      }
    }, { transport: 'MCP' });
  }

  /**
   * Get services via MCP
   */
  async getServices(): Promise<any[]> {
    return this.dna.entities.list({
      organization_id: this.organizationId,
      entity_type: 'service',
      filters: { status: 'active' }
    }, { transport: 'MCP' });
  }

  /**
   * Create appointment via MCP
   */
  async createAppointment(params: {
    customerId: string;
    staffId: string;
    serviceIds: string[];
    appointmentDate: Date;
    appointmentTime: string;
    notes?: string;
  }): Promise<string> {
    if (!this.organizationId) {
      throw new Error('ERROR_ORG_REQUIRED');
    }

    const appointmentId = `APT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create appointment entity
    const appointment = await this.dna.entities.create({
      organization_id: this.organizationId,
      entity_type: 'appointment',
      entity_name: `Appointment - ${params.appointmentTime}`,
      entity_code: appointmentId,
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
    }, { 
      transport: 'MCP',
      idempotencyKey: `CREATE_APPT:${appointmentId}`
    });

    // Create notification transaction
    await this.dna.transactions.create({
      organization_id: this.organizationId,
      transaction_type: 'NOTIFY',
      smart_code: 'HERA.SALON.NOTIFY.WHATSAPP.CONFIRM.v1',
      from_entity_id: params.customerId,
      to_entity_id: appointment.id,
      metadata: {
        template: 'appointment_confirmation',
        appointment_details: {
          date: params.appointmentDate,
          time: params.appointmentTime,
          services: params.serviceIds
        }
      }
    }, {
      transport: 'MCP',
      idempotencyKey: `NOTIFY_APPT:${appointmentId}`
    });

    return appointment.id;
  }

  /**
   * Update appointment status via MCP (using relationships, not status columns)
   */
  async updateAppointmentStatus(appointmentId: string, newStatus: string): Promise<void> {
    if (!this.organizationId) {
      throw new Error('ERROR_ORG_REQUIRED');
    }

    // Create status transition via relationship
    await this.dna.relationships.create({
      organization_id: this.organizationId,
      from_entity_id: appointmentId,
      to_entity_id: newStatus, // Assumes status entities exist
      relationship_type: 'has_status',
      smart_code: 'HERA.SALON.STATUS.TRANSITION.v1',
      metadata: {
        transitioned_at: new Date().toISOString(),
        previous_status: 'scheduled' // Would fetch this first in real impl
      }
    }, {
      transport: 'MCP',
      idempotencyKey: `STATUS_CHANGE:${appointmentId}:${Date.now()}`
    });

    // Emit audit transaction
    await this.dna.transactions.create({
      organization_id: this.organizationId,
      transaction_type: 'AUDIT',
      smart_code: 'HERA.SALON.AUDIT.STATUS_CHANGE.v1',
      reference_entity_id: appointmentId,
      metadata: {
        entity_type: 'appointment',
        action: 'status_change',
        new_status: newStatus
      }
    }, {
      transport: 'MCP',
      idempotencyKey: `AUDIT_STATUS:${appointmentId}:${Date.now()}`
    });
  }
}

/**
 * Factory function for creating MCP-compliant salon client
 */
export function createMCPSalonDNAClient(organizationId: string): MCPSalonDNAClient {
  return new MCPSalonDNAClient(organizationId);
}