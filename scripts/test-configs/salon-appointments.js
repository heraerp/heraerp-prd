/**
 * Salon Appointments Test Configuration
 * 
 * Comprehensive test configuration for salon appointment CRUD operations
 */

module.exports = {
  moduleName: 'salon-appointments',
  entityType: 'appointment',
  displayName: 'Salon Appointment',
  smartCodePrefix: 'HERA.SALON.APPOINTMENT',
  
  // Dynamic fields specific to appointments
  dynamicFields: [
    {
      name: 'appointment_date',
      type: 'text',
      testValue: '2024-09-15',
      smartCode: 'HERA.SALON.APPOINTMENT.FIELD.DATE.v1'
    },
    {
      name: 'appointment_time',
      type: 'text',
      testValue: '14:30',
      smartCode: 'HERA.SALON.APPOINTMENT.FIELD.TIME.v1'
    },
    {
      name: 'duration_minutes',
      type: 'number',
      testValue: 90,
      smartCode: 'HERA.SALON.APPOINTMENT.FIELD.DURATION.v1'
    },
    {
      name: 'total_price',
      type: 'number',
      testValue: 250.00,
      smartCode: 'HERA.SALON.APPOINTMENT.FIELD.PRICE.v1'
    },
    {
      name: 'status',
      type: 'text',
      testValue: 'scheduled',
      smartCode: 'HERA.SALON.APPOINTMENT.FIELD.STATUS.v1'
    },
    {
      name: 'notes',
      type: 'text',
      testValue: 'First-time customer, prefers organic products',
      smartCode: 'HERA.SALON.APPOINTMENT.FIELD.NOTES.v1'
    }
  ],
  
  // Appointment relationships
  relationships: [
    {
      type: 'booked_for_customer',
      targetEntityType: 'customer',
      smartCode: 'HERA.SALON.REL.APPOINTMENT_CUSTOMER.v1'
    },
    {
      type: 'assigned_to_stylist',
      targetEntityType: 'employee',
      smartCode: 'HERA.SALON.REL.APPOINTMENT_STYLIST.v1'
    },
    {
      type: 'includes_service',
      targetEntityType: 'salon_service',
      smartCode: 'HERA.SALON.REL.APPOINTMENT_SERVICE.v1'
    },
    {
      type: 'has_status',
      targetEntityType: 'appointment_status',
      smartCode: 'HERA.SALON.REL.APPOINTMENT_STATUS.v1'
    }
  ],
  
  // Appointment transactions
  transactions: [
    {
      type: 'appointment_booking',
      smartCode: 'HERA.SALON.TXN.APPOINTMENT_BOOK.v1',
      hasLineItems: true
    },
    {
      type: 'appointment_payment',
      smartCode: 'HERA.SALON.TXN.APPOINTMENT_PAY.v1',
      hasLineItems: false
    },
    {
      type: 'appointment_cancellation',
      smartCode: 'HERA.SALON.TXN.APPOINTMENT_CANCEL.v1',
      hasLineItems: false
    }
  ],
  
  // Test data specific to appointments
  testData: {
    createData: {
      entity_type: 'appointment',
      entity_name: 'Hair Color & Cut - Jane Doe',
      entity_code: 'APT-2024-09-15-001',
      smart_code: 'HERA.SALON.APPOINTMENT.v1',
      metadata: {
        customer_name: 'Jane Doe',
        stylist_name: 'Sarah Johnson',
        services: ['Hair Color', 'Hair Cut'],
        booking_source: 'online'
      }
    },
    updateData: {
      entity_name: 'Hair Color & Cut - Jane Doe (Rescheduled)',
      metadata: {
        rescheduled: true,
        original_date: '2024-09-15',
        new_date: '2024-09-16'
      }
    },
    searchTerm: 'Jane Doe'
  }
};