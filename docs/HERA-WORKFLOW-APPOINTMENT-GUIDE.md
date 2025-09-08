# HERA Workflow - Salon Appointment Implementation Guide

## Overview

The HERA Workflow Engine provides a complete implementation of the end-to-end appointment prompt using the sacred 6-table architecture. This guide shows how to use the workflow system for salon appointments.

## Key Features

### 1. Status Management via Relationships
- No status columns - all statuses are entities
- Status transitions tracked via relationships with expiration dates
- Complete audit trail of all status changes

### 2. Payment Guardrails
- Blocks service start without approved payment
- Links appointments to payment transactions via relationships
- Supports preauth, deposit, and full payment workflows

### 3. Complete Lifecycle
- Booking → Check-in → Service → Completion → Review
- Exception handling for cancellations, disputes, and partial service
- Automatic notifications at each stage

## Implementation

### 1. Define the Workflow

```typescript
import { salonAppointmentWorkflow } from '@/lib/workflows/salon-appointment-workflow'
```

The workflow is already defined with:
- All status entities and smart codes
- Step-by-step process with guardrails
- Exception handlers for edge cases
- Payment verification at critical points

### 2. Create an Appointment

```typescript
import { universalApi } from '@/lib/universal-api'
import { executeAppointmentWorkflow } from '@/lib/workflows/salon-appointment-workflow'

// Create appointment entity
const appointment = await universalApi.createEntity({
  entity_type: 'appointment',
  entity_name: 'Appointment #A-001',
  smart_code: 'HERA.SALON.APPOINTMENT.ENTITY.BASE.v1',
  organization_id: organizationId,
  metadata: {
    client_id: clientId,
    service_id: serviceId,
    staff_id: staffId,
    scheduled_time: '2025-09-08T14:30:00Z',
    duration_minutes: 90
  }
})

// Start workflow
const workflowInstance = await executeAppointmentWorkflow(
  appointment.data.id,
  organizationId
)
```

### 3. Workflow Steps

#### Step 1: Initial Setup
```typescript
// Workflow automatically:
// 1. Creates status entities if not exist
// 2. Sets initial status to 'scheduled'
// 3. Sends confirmation WhatsApp/SMS
```

#### Step 2: Check-in Process
```typescript
// When client arrives:
// 1. Create check-in transaction
// 2. Process payment authorization
// 3. Update status to 'checked_in'
// 4. Create payment-appointment link
```

#### Step 3: Service Start (With Guardrail)
```typescript
// Workflow checks:
// - Is there an approved payment?
// - If NO: Block transition, request payment
// - If YES: Update status to 'in_progress'
```

#### Step 4: Service Completion
```typescript
// After service:
// 1. Update status to 'completed'
// 2. Capture payment
// 3. Create service delivery transaction with line items
```

#### Step 5: Review & Close
```typescript
// 24 hours later:
// 1. Send review request
// 2. Update status to 'review_pending'
// 3. After review or 7 days: Close appointment
```

## Exception Handling

### Client Cancellation
```typescript
// Triggered by: client.cancel action
// Workflow:
// 1. Update status to 'cancelled_by_client'
// 2. Calculate cancellation fee (20%)
// 3. Process refund or fee
// 4. Notify staff
```

### Payment Failure
```typescript
// Triggered by: payment.declined
// Workflow:
// 1. Block service start
// 2. Request alternative payment
// 3. 10-minute timeout for resolution
```

### Service Dispute
```typescript
// Triggered by: client.dispute
// Workflow:
// 1. Update status to 'disputed'
// 2. Notify manager (high priority)
// 3. Freeze payment pending resolution
```

## Guardrails

### 1. Payment Before Service
```typescript
{
  condition: 'status_transition FROM "checked_in" TO "in_progress"',
  rule: 'EXISTS approved_payment LINKED_TO appointment',
  action: 'block_transition',
  error_message: 'Cannot start service without approved payment'
}
```

### 2. No Backdating
```typescript
{
  condition: 'transaction_date < fiscal_period_start',
  rule: 'block_transaction',
  error_message: 'Cannot post to closed fiscal period'
}
```

### 3. Refund Integrity
```typescript
{
  condition: 'transaction_type == "PAYMENT.REFUND"',
  rule: 'MUST_HAVE reference_transaction_id',
  error_message: 'Refund must reference original payment'
}
```

## Smart Code Structure

```typescript
// Entity Smart Codes
HERA.SALON.APPOINTMENT.ENTITY.BASE.v1
HERA.SALON.APPOINTMENT.STATUS.{STATUS_NAME}.v1

// Relationship Smart Codes
HERA.SALON.APPOINTMENT.REL.APPOINTMENT_HAS_STATUS.v1
HERA.SALON.APPOINTMENT.REL.APPOINTMENT_LINKED_TO_PAYMENT.v1

// Transaction Smart Codes
HERA.SALON.APPOINTMENT.TXN.CHECKIN.v1
HERA.SALON.PAYMENT.TXN.PREAUTH.v1
HERA.SALON.PAYMENT.TXN.CAPTURE.v1
```

## Integration with HERA Components

### 1. With Universal API
```typescript
// All workflow actions use universalApi internally
// Ensures multi-tenant isolation
// Maintains audit trail
```

### 2. With WhatsApp Integration
```typescript
// Workflow triggers notifications:
// - Appointment confirmation
// - Check-in reminder
// - Service completion receipt
// - Review request
```

### 3. With Payment System
```typescript
// Workflow integrates with payment processing:
// - Preauthorization on check-in
// - Capture on completion
// - Refund/void on cancellation
```

## Benefits

1. **Zero Schema Changes**: Everything runs on 6 sacred tables
2. **Complete Audit Trail**: Every state change tracked
3. **Payment Safety**: Service blocked without payment
4. **Exception Handling**: All edge cases covered
5. **Extensible**: Easy to add new steps or modify flow

## Next Steps

1. **Add More Workflows**:
   - Inventory management
   - Staff scheduling
   - Customer onboarding

2. **Enhance Engine**:
   - Visual workflow designer
   - Real-time monitoring
   - Performance analytics

3. **Integration**:
   - Connect to actual payment gateways
   - Real WhatsApp API integration
   - Calendar system sync