/**
 * Salon DNA Client
 * Full HERA DNA SDK implementation for salon operations
 * All operations use MCP and enforce HERA principles
 */

import {
  HeraDNAClient,
  createOrganizationId,
  createSmartCode,
  createEntityId,
  createTransactionId,
  DNA,
  type SmartCode,
  type OrganizationId,
  type EntityId,
  type TransactionId
} from '@hera/dna-sdk';

// Salon-specific smart codes
export const SALON_SMART_CODES = {
  // Customer Management
  CUSTOMER_CREATE: createSmartCode('HERA.SALON.CUST.ENT.PROF.v1'),
  CUSTOMER_VIP: createSmartCode('HERA.SALON.CUST.ENT.VIP.v1'),
  CUSTOMER_LOYALTY: createSmartCode('HERA.SALON.CUST.DYN.LOYALTY.v1'),
  
  // Service Management
  SERVICE_HAIR_CUT: createSmartCode('HERA.SALON.SVC.ENT.HAIRCUT.v1'),
  SERVICE_COLOR: createSmartCode('HERA.SALON.SVC.ENT.COLOR.v1'),
  SERVICE_TREATMENT: createSmartCode('HERA.SALON.SVC.ENT.TREATMENT.v1'),
  SERVICE_BRIDAL: createSmartCode('HERA.SALON.SVC.ENT.BRIDAL.v1'),
  SERVICE_PRICE: createSmartCode('HERA.SALON.SVC.DYN.PRICE.v1'),
  SERVICE_DURATION: createSmartCode('HERA.SALON.SVC.DYN.DURATION.v1'),
  
  // Staff Management
  STAFF_STYLIST: createSmartCode('HERA.SALON.STAFF.ENT.STYLIST.v1'),
  STAFF_COLORIST: createSmartCode('HERA.SALON.STAFF.ENT.COLORIST.v1'),
  STAFF_MANAGER: createSmartCode('HERA.SALON.STAFF.ENT.MANAGER.v1'),
  STAFF_RATING: createSmartCode('HERA.SALON.STAFF.DYN.RATING.v1'),
  STAFF_SPECIALTIES: createSmartCode('HERA.SALON.STAFF.DYN.SPECIALTY.v1'),
  
  // Appointment Management
  APPOINTMENT_BOOKING: createSmartCode('HERA.SALON.APPT.TXN.BOOKING.v1'),
  APPOINTMENT_WALKIN: createSmartCode('HERA.SALON.APPT.TXN.WALKIN.v1'),
  APPOINTMENT_SERVICE: createSmartCode('HERA.SALON.APPT.LINE.SERVICE.v1'),
  APPOINTMENT_STATUS: createSmartCode('HERA.SALON.APPT.REL.STATUS.v1'),
  
  // Sales & Payments
  SALE_SERVICE: createSmartCode('HERA.SALON.SALE.TXN.SERVICE.v1'),
  SALE_PRODUCT: createSmartCode('HERA.SALON.SALE.TXN.PRODUCT.v1'),
  PAYMENT_CASH: createSmartCode('HERA.SALON.PAY.TXN.CASH.v1'),
  PAYMENT_CARD: createSmartCode('HERA.SALON.PAY.TXN.CARD.v1'),
  
  // Product Management
  PRODUCT_SHAMPOO: createSmartCode('HERA.SALON.PROD.ENT.SHAMPOO.v1'),
  PRODUCT_TREATMENT: createSmartCode('HERA.SALON.PROD.ENT.TREATMENT.v1'),
  PRODUCT_STYLING: createSmartCode('HERA.SALON.PROD.ENT.STYLING.v1'),
  PRODUCT_STOCK: createSmartCode('HERA.SALON.PROD.DYN.STOCK.v1'),
  
  // Status Management
  STATUS_SCHEDULED: createSmartCode('HERA.SALON.STATUS.SCHEDULED.v1'),
  STATUS_CHECKEDIN: createSmartCode('HERA.SALON.STATUS.CHECKEDIN.v1'),
  STATUS_INPROGRESS: createSmartCode('HERA.SALON.STATUS.INPROGRESS.v1'),
  STATUS_COMPLETED: createSmartCode('HERA.SALON.STATUS.COMPLETED.v1'),
  STATUS_CANCELLED: createSmartCode('HERA.SALON.STATUS.CANCELLED.v1'),
  
  // Relationships
  REL_HAS_STATUS: createSmartCode('HERA.SALON.REL.HAS_STATUS.v1'),
  REL_ASSIGNED_TO: createSmartCode('HERA.SALON.REL.ASSIGNED_TO.v1'),
  REL_CUSTOMER_OF: createSmartCode('HERA.SALON.REL.CUSTOMER_OF.v1'),
} as const;

export interface SalonDashboardData {
  appointments: number;
  customers: number;
  todayRevenue: number;
  products: number;
  recentAppointments: any[];
  topServices: any[];
  staffMembers: any[];
}

export class SalonDNAClient {
  private client: HeraDNAClient;
  private orgId: OrganizationId;

  constructor(organizationId: string) {
    this.orgId = createOrganizationId(organizationId);
    this.client = new HeraDNAClient({
      organizationId: this.orgId,
      enableRuntimeGates: true,
      enableAudit: true
    });
  }

  /**
   * Fetch dashboard data with full DNA compliance
   */
  async getDashboardData(): Promise<SalonDashboardData> {
    try {
      // Fetch all data in parallel using DNA SDK
      const [customers, products, appointments, sales, staff, services] = await Promise.all([
        this.getCustomers(),
        this.getProducts(),
        this.getTodayAppointments(),
        this.getTodaySales(),
        this.getStaffMembers(),
        this.getServices()
      ]);

      // Calculate today's revenue
      const todayRevenue = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

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
      console.error('SalonDNAClient: Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Get all customers
   */
  async getCustomers(): Promise<any[]> {
    const result = await this.client.queryEntities({
      entityType: 'customer',
      filters: {
        'smart_code': SALON_SMART_CODES.CUSTOMER_CREATE
      },
      limit: 1000
    });
    return result;
  }

  /**
   * Get all products
   */
  async getProducts(): Promise<any[]> {
    const result = await this.client.queryEntities({
      entityType: 'product',
      filters: {
        'entity_name': { $like: '%product%' }
      },
      limit: 100
    });
    return result;
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Query appointments from entities (where we actually created them)
    const result = await this.client.queryEntities({
      entityType: 'appointment',
      filters: {
        'metadata.appointment_date': todayStr
      },
      limit: 50
    });
    
    // Enrich with customer, service, and staff details
    const enriched = await Promise.all(result.map(async (apt) => {
      const metadata = apt.metadata || {};
      return {
        ...apt,
        appointment_date: metadata.appointment_date,
        appointment_time: metadata.appointment_time,
        status: metadata.status || 'scheduled',
        price: metadata.price || 0,
        customer_id: metadata.customer_id,
        service_id: metadata.service_id,
        stylist_id: metadata.stylist_id
      };
    }));
    
    return enriched;
  }

  /**
   * Get today's sales
   */
  async getTodaySales(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const result = await this.client.queryTransactions({
      transactionType: 'sale',
      filters: {
        'transaction_date': { $gte: today.toISOString() }
      },
      includeLines: true,
      limit: 50
    });
    return result;
  }

  /**
   * Get all staff members
   */
  async getStaffMembers(): Promise<any[]> {
    const result = await this.client.queryEntities({
      entityType: 'employee',
      filters: {
        'smart_code': { 
          $in: [
            SALON_SMART_CODES.STAFF_STYLIST,
            SALON_SMART_CODES.STAFF_COLORIST,
            SALON_SMART_CODES.STAFF_MANAGER
          ]
        }
      },
      includeDynamicData: true,
      limit: 50
    });
    
    // Enrich with ratings and specialties
    const enriched = await Promise.all(result.map(async (staff) => {
      const dynamicData = await this.client.getDynamicFields(staff.id);
      return {
        ...staff,
        rating: dynamicData.find(d => d.field_name === 'rating')?.field_value_number || 0,
        specialties: dynamicData.find(d => d.field_name === 'specialties')?.field_value_json || [],
        available: dynamicData.find(d => d.field_name === 'available')?.field_value_boolean ?? true
      };
    }));
    
    return enriched;
  }

  /**
   * Get all services
   */
  async getServices(): Promise<any[]> {
    const result = await this.client.queryEntities({
      entityType: 'service',
      includeDynamicData: true,
      limit: 100
    });
    
    // Enrich with prices and durations
    const enriched = await Promise.all(result.map(async (service) => {
      const dynamicData = await this.client.getDynamicFields(service.id);
      return {
        ...service,
        price: dynamicData.find(d => d.field_name === 'price')?.field_value_number || 0,
        duration: dynamicData.find(d => d.field_name === 'duration')?.field_value_text || '1 hour',
        category: dynamicData.find(d => d.field_name === 'category')?.field_value_text || 'General'
      };
    }));
    
    return enriched;
  }

  /**
   * Create new appointment
   */
  async createAppointment(params: {
    customerId: EntityId;
    staffId: EntityId;
    serviceIds: EntityId[];
    appointmentDate: Date;
    notes?: string;
  }): Promise<TransactionId> {
    // Create appointment transaction
    const appointment = await DNA.transaction(this.orgId)
      .type('appointment')
      .smartCode(SALON_SMART_CODES.APPOINTMENT_BOOKING)
      .fromEntity(params.customerId)
      .toEntity(params.staffId)
      .transactionDate(params.appointmentDate)
      .withMetadata({
        notes: params.notes,
        status: 'scheduled',
        channel: 'web'
      })
      .build();

    // Add service line items
    await Promise.all(params.serviceIds.map((serviceId, index) => 
      DNA.transactionLine(this.orgId)
        .forTransaction(appointment.id)
        .lineNumber(index + 1)
        .lineEntity(serviceId)
        .smartCode(SALON_SMART_CODES.APPOINTMENT_SERVICE)
        .build()
    ));

    // Create initial status relationship
    const statusEntity = await this.getOrCreateStatusEntity('scheduled');
    await this.client.createRelationship({
      fromEntityId: appointment.id,
      toEntityId: statusEntity.id,
      relationshipType: 'has_status',
      smartCode: SALON_SMART_CODES.REL_HAS_STATUS
    });

    return appointment.id;
  }

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(
    appointmentId: TransactionId, 
    newStatus: 'scheduled' | 'checkedin' | 'inprogress' | 'completed' | 'cancelled'
  ): Promise<void> {
    // Get or create status entity
    const statusEntity = await this.getOrCreateStatusEntity(newStatus);
    
    // Remove existing status relationships
    const existingRelationships = await this.client.queryRelationships({
      fromEntityId: appointmentId,
      relationshipType: 'has_status'
    });
    
    await Promise.all(existingRelationships.map(rel => 
      this.client.deleteRelationship(rel.id)
    ));
    
    // Create new status relationship
    await this.client.createRelationship({
      fromEntityId: appointmentId,
      toEntityId: statusEntity.id,
      relationshipType: 'has_status',
      smartCode: SALON_SMART_CODES.REL_HAS_STATUS,
      metadata: {
        changed_at: new Date().toISOString()
      }
    });
  }

  /**
   * Helper to get or create status entity
   */
  private async getOrCreateStatusEntity(status: string): Promise<any> {
    // Check if status entity exists
    const existing = await this.client.queryEntities({
      entityType: 'workflow_status',
      filters: {
        entity_code: `SALON_STATUS_${status.toUpperCase()}`
      }
    });

    if (existing.length > 0) {
      return existing[0];
    }

    // Create status entity
    const smartCodeMap = {
      scheduled: SALON_SMART_CODES.STATUS_SCHEDULED,
      checkedin: SALON_SMART_CODES.STATUS_CHECKEDIN,
      inprogress: SALON_SMART_CODES.STATUS_INPROGRESS,
      completed: SALON_SMART_CODES.STATUS_COMPLETED,
      cancelled: SALON_SMART_CODES.STATUS_CANCELLED
    };

    const statusEntity = await this.client.createEntity({
      entityType: 'workflow_status',
      entityName: `${status.charAt(0).toUpperCase() + status.slice(1)} Status`,
      entityCode: `SALON_STATUS_${status.toUpperCase()}`,
      smartCode: smartCodeMap[status as keyof typeof smartCodeMap],
      metadata: {
        color: this.getStatusColor(status),
        icon: this.getStatusIcon(status)
      }
    });

    return statusEntity;
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      scheduled: '#3B82F6',
      checkedin: '#8B5CF6',
      inprogress: '#F59E0B',
      completed: '#10B981',
      cancelled: '#EF4444'
    };
    return colors[status] || '#6B7280';
  }

  private getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      scheduled: 'calendar',
      checkedin: 'user-check',
      inprogress: 'clock',
      completed: 'check-circle',
      cancelled: 'x-circle'
    };
    return icons[status] || 'circle';
  }
}

// Export convenience function
export function createSalonDNAClient(organizationId: string): SalonDNAClient {
  return new SalonDNAClient(organizationId);
}