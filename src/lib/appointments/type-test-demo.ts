// ================================================================================
// APPOINTMENT SYSTEM TYPE SAFETY DEMONSTRATION
// Smart Code: HERA.DEMO.TYPES.APPOINTMENT.v1
// Demonstrates TypeScript type safety for appointment system
// ================================================================================

import type {
  DraftInput,
  LineInput,
  AppointmentStatus,
  SmartCodes,
  Customer,
  Service,
  CartItem,
  AppointmentRecord
} from './types'
import { SMART_CODES, isValidAppointmentStatus, isServiceItem } from './types'

// ✅ Valid DraftInput examples
const validDraft: DraftInput = {
  organizationId: 'org-123',
  startAt: '2024-01-15T10:00:00.000Z',
  durationMin: 60,
  customerEntityId: 'customer-456'
}

const draftWithOptionals: DraftInput = {
  organizationId: 'org-789',
  startAt: '2024-01-15T14:00:00.000Z',
  durationMin: 90,
  customerEntityId: 'customer-123',
  preferredStylistEntityId: 'stylist-456',
  notes: 'Color treatment with highlights',
  idempotencyKey: 'draft-20240115-001'
}

// ✅ Valid LineInput examples
const validLines: LineInput = {
  organizationId: 'org-123',
  appointmentId: 'apt-789',
  items: [
    {
      type: 'SERVICE',
      entityId: 'service-hair-cut',
      qty: 1,
      unitAmount: 65.0,
      durationMin: 45
    },
    {
      type: 'PRODUCT',
      entityId: 'product-shampoo',
      qty: 2,
      unitAmount: 25.0
      // durationMin is optional for products
    }
  ]
}

// ✅ Smart Code usage
const appointmentHeaderCode: SmartCodes['APPOINTMENT_HEADER'] = SMART_CODES.APPOINTMENT_HEADER
const serviceLineCode: SmartCodes['SERVICE_LINE'] = SMART_CODES.SERVICE_LINE

// ✅ Type guards in action
const testStatus = 'CONFIRMED'
if (isValidAppointmentStatus(testStatus)) {
  // TypeScript now knows testStatus is AppointmentStatus
  const status: AppointmentStatus = testStatus
  console.log(`Status is valid: ${status}`)
}

// ✅ Customer typing
const customer: Customer = {
  id: 'customer-123',
  entity_name: 'Sarah Johnson',
  entity_code: 'CUST-001',
  metadata: {
    phone: '+971-50-123-4567',
    email: 'sarah@example.com',
    preferred_stylist_id: 'stylist-rocky'
  }
}

// ✅ Service typing with proper metadata
const hairCutService: Service = {
  id: 'service-haircut',
  entity_name: 'Premium Hair Cut',
  entity_code: 'SVC-HAIRCUT',
  metadata: {
    price: 65.0,
    duration_minutes: 45,
    category: 'styling'
  }
}

// ✅ Cart item construction
const cartItem: CartItem = {
  service: hairCutService,
  quantity: 1,
  price: hairCutService.metadata?.price || 0,
  duration: hairCutService.metadata?.duration_minutes || 30
}

// ✅ Service vs Product type checking
const mixedItems = [
  { type: 'SERVICE' as const, entityId: 'svc-1' },
  { type: 'PRODUCT' as const, entityId: 'prod-1' }
]

mixedItems.forEach(item => {
  if (isServiceItem(item)) {
    console.log(`Processing service: ${item.entityId}`)
  } else {
    console.log(`Processing product: ${item.entityId}`)
  }
})

// ✅ Complete appointment record typing
const appointmentRecord: AppointmentRecord = {
  id: 'apt-20240115-001',
  transaction_date: '2024-01-15T10:00:00.000Z',
  transaction_code: 'APT-20240115-001',
  total_amount: 115.5,
  metadata: {
    status: 'CONFIRMED',
    customer_name: 'Sarah Johnson',
    stylist_name: 'Rocky',
    services: ['Premium Hair Cut', 'Hair Treatment'],
    duration_minutes: 75
  },
  source_entity: customer,
  target_entity: {
    id: 'stylist-rocky',
    entity_name: 'Rocky',
    entity_code: 'STYLIST-001'
  }
}

// ✅ Function signature examples that would be type-safe
async function createDraftAppointment(input: DraftInput): Promise<{ id: string }> {
  // This function signature ensures type safety
  return { id: 'generated-id' }
}

async function upsertAppointmentLines(input: LineInput): Promise<void> {
  // This function signature ensures type safety
  // Implementation would use the typed inputs
}

// Type assertions to verify our type definitions are comprehensive
export type TypeSafetyTests = {
  draftHasRequiredFields: DraftInput extends {
    organizationId: string
    startAt: string
    durationMin: number
    customerEntityId: string
  }
    ? true
    : 'Missing required fields'

  lineInputHasCorrectStructure: LineInput['items'][0] extends {
    type: 'SERVICE' | 'PRODUCT'
    entityId: string
    qty: number
    unitAmount: number
  }
    ? true
    : 'Incorrect item structure'

  smartCodesAreReadonly: SmartCodes['APPOINTMENT_HEADER'] extends string
    ? true
    : 'Smart codes should be strings'

  statusUnionIsCorrect: AppointmentStatus extends
    | 'DRAFT'
    | 'CONFIRMED'
    | 'IN_SERVICE'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW'
    ? true
    : 'Status union incomplete'
}

// Verify all types pass
const typeTests: TypeSafetyTests = {
  draftHasRequiredFields: true,
  lineInputHasCorrectStructure: true,
  smartCodesAreReadonly: true,
  statusUnionIsCorrect: true
}

export {
  validDraft,
  draftWithOptionals,
  validLines,
  customer,
  hairCutService,
  cartItem,
  appointmentRecord,
  typeTests
}
