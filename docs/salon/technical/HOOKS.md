# HERA Salon - Hooks Technical Reference

**Version**: 1.0 (Production Ready)
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.TECHNICAL.HOOKS.v1`

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Hook Architecture](#hook-architecture)
3. [Universal Hooks](#universal-hooks)
4. [Feature-Specific Hooks](#feature-specific-hooks)
5. [Utility Hooks](#utility-hooks)
6. [Hook Patterns](#hook-patterns)
7. [Best Practices](#best-practices)
8. [Common Patterns](#common-patterns)
9. [Performance Optimization](#performance-optimization)
10. [Testing Hooks](#testing-hooks)

---

## 🎯 Overview

HERA Salon uses a **three-tier hook architecture** for data management:

1. **Universal Hooks** (Foundation) - RPC-based CRUD for entities and transactions
2. **Feature-Specific Hooks** (Abstraction) - Domain logic wrappers for features
3. **Utility Hooks** (Helpers) - Authentication, filtering, UI state management

### Design Principles

- **RPC-First**: All data operations through `hera_entities_crud_v1` and `hera_txn_crud_v1`
- **React Query**: Server state management with smart caching
- **Type Safety**: Full TypeScript type inference
- **Actor-Stamped**: All mutations include actor (WHO) and organization (WHERE)
- **Optimistic Updates**: Instant UI feedback with error rollback

---

## 🏗️ Hook Architecture

### Three-Tier Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│                  (React Components)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               FEATURE-SPECIFIC HOOKS (Tier 3)                │
│                                                              │
│  useHeraCustomers  useHeraServices  useHeraAppointments     │
│  useHeraProducts   useHeraStaff     useHeraLeave            │
│                                                              │
│  • Domain logic encapsulation                               │
│  • Enriched data (relationships, dynamic fields)            │
│  • Business rule validation                                 │
│  • Convenience methods                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               UNIVERSAL HOOKS (Tier 2)                       │
│                                                              │
│  useUniversalEntityV1    useUniversalTransactionV1          │
│                                                              │
│  • Generic CRUD operations                                  │
│  • RPC function orchestration                               │
│  • React Query integration                                  │
│  • Caching & invalidation                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  RPC LAYER (Tier 1)                          │
│                                                              │
│  hera_entities_crud_v1      hera_txn_crud_v1                │
│                                                              │
│  • Database operations                                      │
│  • Actor stamping                                           │
│  • Organization isolation                                   │
│  • Audit trail                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🌐 Universal Hooks

### useUniversalEntityV1

**Purpose**: Generic entity CRUD operations with RPC orchestration

**File**: `/src/hooks/useUniversalEntityV1.ts`

**Usage**:

```typescript
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1'

const {
  entities,           // Fetched entities array
  isLoading,          // Loading state
  error,              // Error state
  refetch,            // Manual refetch
  createEntity,       // Create mutation
  updateEntity,       // Update mutation
  deleteEntity        // Delete mutation
} = useUniversalEntityV1({
  entity_type: 'CUSTOMER',      // Required: Entity type
  organizationId: 'org-uuid',   // Required: Organization context
  filters: {
    status: 'active',           // Optional: Status filter
    limit: 100,                 // Optional: Result limit
    list_mode: 'FULL'           // Optional: FULL | HEADERS
  },
  cacheConfig: {
    staleTime: 30000,           // Optional: 30s cache freshness
    refetchOnMount: 'always'    // Optional: Always refetch on mount
  }
})

// Create entity
await createEntity({
  entity_type: 'CUSTOMER',
  entity_name: 'John Doe',
  smart_code: 'HERA.SALON.CUSTOMER.ENTITY.v1',
  dynamic_fields: {
    email: {
      type: 'text',
      value: 'john@example.com',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1'
    }
  }
})

// Update entity
await updateEntity({
  entity_id: 'entity-uuid',
  entity_name: 'Jane Doe',
  dynamic_fields: {
    phone: {
      type: 'text',
      value: '+971501234567',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
    }
  }
})

// Delete entity
await deleteEntity({
  entity_id: 'entity-uuid',
  hard_delete: false  // Soft delete by default
})
```

**Key Features**:
- ✅ Automatic React Query caching
- ✅ Optimistic updates with rollback
- ✅ Actor stamping via RPC
- ✅ Organization isolation
- ✅ Dynamic field transformation
- ✅ Relationship inclusion

---

### useUniversalTransactionV1

**Purpose**: Generic transaction CRUD operations with RPC orchestration

**File**: `/src/hooks/useUniversalTransactionV1.ts`

**Usage**:

```typescript
import { useUniversalTransactionV1 } from '@/hooks/useUniversalTransactionV1'

const {
  transactions,       // Fetched transactions array
  isLoading,          // Loading state
  error,              // Error state
  refetch,            // Manual refetch
  createTransaction,  // Create mutation
  updateTransaction,  // Update mutation
  deleteTransaction   // Delete mutation
} = useUniversalTransactionV1({
  organizationId: 'org-uuid',   // Required: Organization context
  filters: {
    transaction_type: 'APPOINTMENT',  // Optional: Filter by type
    smart_code: 'HERA.SALON.APPOINTMENT.v1',  // Optional: Filter by smart code
    limit: 100,                       // Optional: Result limit
    include_lines: true               // Optional: Include transaction lines
  }
})

// Create transaction
await createTransaction({
  transaction_type: 'APPOINTMENT',
  transaction_code: 'APT-2025-001',
  smart_code: 'HERA.SALON.APPOINTMENT.v1',
  source_entity_id: 'customer-uuid',
  target_entity_id: 'staff-uuid',
  total_amount: 500.00,
  metadata: {
    appointment_date: '2025-06-01T10:00:00Z',
    duration_minutes: 60
  },
  lines: [
    {
      line_number: 1,
      line_type: 'SERVICE',
      entity_id: 'service-uuid',
      quantity: 1,
      unit_amount: 500.00,
      line_amount: 500.00
    }
  ]
})

// Update transaction
await updateTransaction({
  transaction_id: 'txn-uuid',
  transaction_status: 'completed',
  metadata: {
    completed_at: new Date().toISOString()
  }
})

// Delete transaction
await deleteTransaction({
  transaction_id: 'txn-uuid'
})
```

**Key Features**:
- ✅ Transaction + lines in single RPC call
- ✅ Metadata enrichment
- ✅ Status workflow support
- ✅ Line item management
- ✅ Audit trail preservation

---

## 🎨 Feature-Specific Hooks

### useHeraCustomers

**Purpose**: Customer entity management with LTV tracking

**File**: `/src/hooks/useHeraCustomers.ts` (514 lines)

**Usage**:

```typescript
import { useHeraCustomers } from '@/hooks/useHeraCustomers'

const {
  customers,          // Customer entities with LTV
  isLoading,
  createCustomer,
  updateCustomer,
  deleteCustomer,     // Smart delete with archive fallback
  archiveCustomer,
  restoreCustomer
} = useHeraCustomers({
  organizationId: 'org-uuid',
  filters: {
    status: 'active',
    includeArchived: false
  }
})

// Create customer with LTV tracking
await createCustomer({
  entity_name: 'John Doe',
  email: 'john@example.com',
  phone: '+971501234567',
  initial_ltv: 0.00
})
```

**Unique Features**:
- LTV (Lifetime Value) calculation
- VIP designation logic
- Smart delete with FK detection
- Tab-based status filtering (Active/All)
- Search by name, email, phone

**Data Enrichment**:
```typescript
// Automatic LTV tracking
{
  id: 'customer-uuid',
  entity_name: 'John Doe',
  email: 'john@example.com',
  phone: '+971501234567',
  ltv: 5420.50,           // ✅ Calculated from transactions
  is_vip: true,           // ✅ Derived from LTV threshold
  total_visits: 24        // ✅ Count of appointments
}
```

---

### useHeraServices

**Purpose**: Service catalog management with categories

**File**: `/src/hooks/useHeraServices.ts` (446 lines)

**Usage**:

```typescript
import { useHeraServices } from '@/hooks/useHeraServices'

const {
  services,           // Service entities with categories
  categories,         // Service categories
  isLoading,
  createService,
  updateService,
  deleteService,
  archiveService,
  restoreService
} = useHeraServices({
  organizationId: 'org-uuid',
  filters: {
    category: 'hair',
    includeArchived: false,
    branch: 'branch-uuid'
  }
})

// Create service with category
await createService({
  entity_name: 'Haircut',
  price: 150.00,
  duration_minutes: 30,
  category_id: 'category-uuid',
  available_at_branches: ['branch-1', 'branch-2']
})
```

**Unique Features**:
- Category-based organization
- Branch availability tracking (AVAILABLE_AT relationships)
- Duration and pricing management
- Excel/CSV import support
- Performance: Fetch once, filter client-side

---

### useHeraAppointments

**Purpose**: Appointment transaction management with 8-state workflow

**File**: `/src/hooks/useHeraAppointments.ts` (659 lines)

**Usage**:

```typescript
import { useHeraAppointments } from '@/hooks/useHeraAppointments'

const {
  appointments,       // Appointment transactions
  isLoading,
  createAppointment,
  updateAppointment,
  updateStatus,       // Status workflow validation
  cancelAppointment,
  deleteAppointment
} = useHeraAppointments({
  organizationId: 'org-uuid',
  branchId: 'branch-uuid',
  filters: {
    status: 'booked',
    date: '2025-06-01'
  }
})

// Create appointment with services
await createAppointment({
  customer_id: 'customer-uuid',
  staff_id: 'staff-uuid',
  appointment_date: '2025-06-01T10:00:00Z',
  services: [
    {
      service_id: 'service-uuid',
      price: 150.00,
      duration_minutes: 30
    }
  ],
  status: 'booked'
})

// Update status with validation
await updateStatus(appointmentId, 'checked_in')  // Validates forward-only transitions
```

**Unique Features**:
- 8-state lifecycle validation (draft → booked → checked_in → in_progress → payment_pending → completed)
- Service enrichment from serviceMap
- Duration calculation from services
- POS integration for payment
- Calendar view support

**Status Workflow**:
```typescript
const VALID_TRANSITIONS = {
  draft: ['booked', 'checked_in', 'in_progress', 'payment_pending', 'completed', 'cancelled'],
  booked: ['checked_in', 'in_progress', 'payment_pending', 'completed', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'payment_pending', 'completed', 'cancelled', 'no_show'],
  in_progress: ['payment_pending', 'completed', 'cancelled'],
  payment_pending: ['completed', 'cancelled'],
  completed: [],  // Terminal
  cancelled: [],  // Terminal
  no_show: []     // Terminal
}
```

---

### useHeraProducts

**Purpose**: Product catalog management with inventory integration

**File**: `/src/hooks/useHeraProducts.ts` (501 lines)

**Usage**:

```typescript
import { useHeraProducts } from '@/hooks/useHeraProducts'

const {
  products,           // Product entities with stock info
  isLoading,
  createProduct,
  updateProduct,
  deleteProduct,
  archiveProduct,
  restoreProduct
} = useHeraProducts({
  organizationId: 'org-uuid',
  filters: {
    category: 'retail',
    includeArchived: false,
    branch: 'branch-uuid'
  }
})

// Create product with pricing
await createProduct({
  entity_name: 'L\'Oreal Shampoo 500ml',
  barcode_primary: '8901030789526',
  sku: 'LOR-SHP-500',
  cost_price: 75.00,
  selling_price: 150.00,
  category_id: 'category-uuid',
  is_retail: true,
  is_backbar: false
})
```

**Unique Features**:
- Barcode management (primary, GTIN, SKU, alternate)
- Enterprise Import/Export system (declarative config)
- Deduplication system
- Transaction-driven inventory
- Branch-specific stock filtering
- Retail vs Backbar classification

---

### useHeraStaff

**Purpose**: Staff entity management with compliance tracking

**File**: `/src/hooks/useHeraStaff.ts` (393 lines)

**Usage**:

```typescript
import { useHeraStaff } from '@/hooks/useHeraStaff'

const {
  staff,              // Staff entities with roles
  isLoading,
  createStaff,
  updateStaff,
  deleteStaff,        // Smart delete with archive fallback
  archiveStaff,
  restoreStaff
} = useHeraStaff({
  organizationId: 'org-uuid',
  filters: {
    role: 'stylist',
    includeArchived: false,
    branch: 'branch-uuid'
  }
})

// Create staff with compliance tracking
await createStaff({
  entity_name: 'Jane Smith',
  email: 'jane@salon.com',
  phone: '+971501234567',
  role: 'stylist',
  visa_exp_date: '2026-12-31',
  insurance_exp_date: '2025-12-31',
  passport_exp_date: '2028-06-15'
})
```

**Unique Features**:
- Compliance tracking (visa, insurance, passport expiry)
- 30-day warning system (critical/warning classification)
- Role assignment via STAFF_HAS_ROLE relationships
- Multi-branch assignment
- Sensitive field filtering (hourly_cost hidden from non-managers)

---

### useHeraLeave

**Purpose**: Leave request transaction management with balance calculation

**File**: `/src/hooks/useHeraLeave.ts` (1,164 lines)

**Usage**:

```typescript
import { useHeraLeave } from '@/hooks/useHeraLeave'

const {
  requests,           // Leave request transactions
  policies,           // Leave policy entities
  staff,              // Staff entities
  balances,           // Calculated leave balances
  isLoading,
  createRequest,
  updateRequest,
  deleteRequest,
  approveRequest,
  rejectRequest,
  cancelRequest,
  createPolicy,
  updatePolicy,
  deletePolicy        // Smart delete with archive fallback
} = useHeraLeave({
  organizationId: 'org-uuid',
  branchId: 'branch-uuid',
  year: 2025,
  includeArchived: false
})

// Create leave request
await createRequest({
  staff_id: 'staff-uuid',
  manager_id: 'manager-uuid',
  leave_type: 'ANNUAL',
  start_date: '2025-06-01',
  end_date: '2025-06-05',
  reason: 'Family vacation',
  status: 'submitted'
})

// Approve leave request
await approveRequest('request-uuid', 'Approved. Enjoy!')
```

**Unique Features**:
- Real-time leave balance calculation (client-side)
- Prorated entitlements (IMMEDIATE vs MONTHLY accrual)
- Half-day leave support (0.5-day increments)
- Leave policy management
- Approver name storage in metadata (eliminates USER entity lookup)

---

### useSalonDashboard

**Purpose**: Dashboard KPI calculations with period filtering

**File**: `/src/hooks/useSalonDashboard.ts` (1,127 lines)

**Usage**:

```typescript
import { useSalonDashboard } from '@/hooks/useSalonDashboard'

const {
  kpis,               // Calculated KPIs
  isLoading,
  refetch
} = useSalonDashboard({
  organizationId: 'org-uuid',
  branchId: 'branch-uuid',
  period: 'last7Days'  // today | last7Days | last30Days | yearToDate | allTime
})

// KPI structure
{
  totalRevenue: 125420.50,
  totalAppointments: 342,
  totalCustomers: 1250,
  averageTicket: 366.73,
  // ... more KPIs
}
```

**Unique Features**:
- Period-aware calculations (respects dashboard filter)
- GL Journal revenue extraction
- Customer LTV aggregation
- Appointment status metrics
- Real-time recalculation

---

### useSalonPOS

**Purpose**: Point of Sale cart state management

**File**: `/src/hooks/useSalonPOS.ts`

**Usage**:

```typescript
import { useSalonPOS } from '@/hooks/useSalonPOS'

const {
  cart,               // Current cart state
  addItem,
  removeItem,
  updateQuantity,
  applyDiscount,
  addTip,
  calculateTotals,
  clearCart,
  processPayment
} = useSalonPOS({
  organizationId: 'org-uuid',
  branchId: 'branch-uuid'
})

// Add service to cart
addItem({
  type: 'service',
  id: 'service-uuid',
  name: 'Haircut',
  price: 150.00,
  quantity: 1
})

// Process payment
await processPayment({
  customer_id: 'customer-uuid',
  payment_method: 'card',
  amount_paid: 500.00
})
```

**Unique Features**:
- Cart state persistence (localStorage)
- Real-time totals calculation (subtotal, discount, VAT, tips)
- Multiple payment method support
- GL Journal posting integration
- Appointment handoff via sessionStorage

---

## 🛠️ Utility Hooks

### useSecuredSalonContext

**Purpose**: Organization context and authentication

**File**: `/src/app/salon/SecuredSalonProvider.tsx`

**Usage**:

```typescript
import { useSecuredSalonContext } from '@/app/salon/SecuredSalonProvider'

const {
  organizationId,     // Current organization UUID
  organization,       // Organization entity with dynamic fields
  salonRole,          // Salon role (owner/receptionist/stylist)
  user,               // User entity
  isLoading,          // Context loading state
  branches            // Available branches
} = useSecuredSalonContext()
```

**Key Features**:
- Automatic organization context loading
- Dynamic field flattening (organization.name from core_dynamic_data)
- Branch list caching
- User session management

---

### useHERAAuth

**Purpose**: Actor-based authentication

**File**: `/src/components/auth/HERAAuthProvider.tsx`

**Usage**:

```typescript
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

const {
  user,               // Actor identity (WHO)
  organization,       // Organization context (WHERE)
  isAuthenticated,    // Session status
  contextLoading,     // Loading state
  sessionType         // 'demo' | 'real'
} = useHERAAuth()
```

---

### useSalonToast

**Purpose**: Enterprise toast notifications

**File**: `/src/components/salon/ui/StatusToastProvider.tsx`

**Usage**:

```typescript
import { useSalonToast } from '@/components/salon/ui/StatusToastProvider'

const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

// Success toast
showSuccess('Saved successfully', 'Customer has been updated')

// Error toast
showError('Save failed', 'Please check the form and try again')

// Loading toast (returns ID for removal)
const loadingId = showLoading('Saving...', 'Please wait')
// ... async operation
removeToast(loadingId)
```

---

## 📐 Hook Patterns

### Pattern 1: Orchestrator RPC Hook

**Purpose**: Wrap RPC function with React Query caching

```typescript
export function useEntityCRUD({ organizationId }: { organizationId: string }) {
  // READ operation with React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['entities', organizationId],
    queryFn: async () => {
      const result = await callRPC('hera_entities_crud_v1', {
        p_action: 'READ',
        p_organization_id: organizationId,
        p_options: { limit: 100 }
      })
      return result.data
    },
    staleTime: 30000,  // 30 seconds
    cacheTime: 5 * 60 * 1000  // 5 minutes
  })

  // CREATE mutation
  const createMutation = useMutation({
    mutationFn: async (entityData: any) => {
      return await callRPC('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: user.id,
        p_organization_id: organizationId,
        p_entity: entityData,
        p_dynamic: {},
        p_relationships: [],
        p_options: {}
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['entities', organizationId])
    }
  })

  return {
    entities: data?.items || [],
    isLoading,
    error,
    refetch,
    createEntity: createMutation.mutateAsync
  }
}
```

---

### Pattern 2: Feature Wrapper Hook

**Purpose**: Add domain logic on top of universal hook

```typescript
export function useHeraCustomers({ organizationId, filters }: Options) {
  // Use universal hook for base CRUD
  const {
    entities,
    isLoading,
    createEntity,
    updateEntity,
    deleteEntity
  } = useUniversalEntityV1({
    entity_type: 'CUSTOMER',
    organizationId,
    filters
  })

  // Domain-specific transformation
  const customers = useMemo(() => {
    return entities.map(entity => ({
      ...entity,
      // ✅ Enrich with LTV calculation
      ltv: calculateCustomerLTV(entity.id),
      // ✅ Derive VIP status
      is_vip: entity.ltv > 10000,
      // ✅ Format phone number
      phone_formatted: formatPhone(entity.phone)
    }))
  }, [entities])

  // Domain-specific mutation wrapper
  const createCustomer = async (data: CreateCustomerInput) => {
    // ✅ Validation
    if (!data.email || !data.phone) {
      throw new Error('Email and phone required')
    }

    // ✅ Smart Code injection
    const entityData = {
      entity_type: 'CUSTOMER',
      entity_name: data.name,
      smart_code: 'HERA.SALON.CUSTOMER.ENTITY.v1',
      dynamic_fields: {
        email: {
          type: 'text',
          value: data.email,
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1'
        },
        phone: {
          type: 'text',
          value: data.phone,
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
        }
      }
    }

    return await createEntity(entityData)
  }

  return {
    customers,          // Enriched data
    isLoading,
    createCustomer,     // Domain-specific wrapper
    updateEntity,
    deleteEntity
  }
}
```

---

### Pattern 3: Client-Side Calculation Hook

**Purpose**: Calculate derived data from fetched entities

```typescript
export function useLeaveBalances({
  staff,
  policies,
  requests,
  year
}: {
  staff: StaffMember[]
  policies: LeavePolicy[]
  requests: LeaveRequest[]
  year: number
}) {
  const balances = useMemo(() => {
    const balanceMap: Record<string, LeaveBalance> = {}

    staff.forEach(member => {
      const policy = policies.find(p => p.leave_type === 'ANNUAL')
      if (!policy) return

      // Calculate prorated entitlement
      const entitlement = calculateProratedEntitlement(
        member.hire_date,
        year,
        policy.annual_entitlement,
        policy.accrual_method
      )

      // Calculate used days
      const usedDays = requests
        .filter(r => r.staff_id === member.id && r.status === 'approved')
        .reduce((sum, r) => sum + r.total_days, 0)

      // Calculate pending days
      const pendingDays = requests
        .filter(r => r.staff_id === member.id && r.status === 'submitted')
        .reduce((sum, r) => sum + r.total_days, 0)

      balanceMap[member.id] = {
        staff_id: member.id,
        staff_name: member.entity_name,
        entitlement,
        used_days: usedDays,
        pending_days: pendingDays,
        remaining_days: entitlement - usedDays,
        available_days: entitlement - usedDays - pendingDays
      }
    })

    return balanceMap
  }, [staff, policies, requests, year])

  return { balances }
}
```

---

## ✅ Best Practices

### 1. Always Use Actor Context

```typescript
// ❌ WRONG - No actor context
const createEntity = async (data: any) => {
  return await callRPC('hera_entities_crud_v1', {
    p_action: 'CREATE',
    p_entity: data
  })
}

// ✅ CORRECT - Include actor and organization
const createEntity = async (data: any) => {
  const { user } = useHERAAuth()
  const { organizationId } = useSecuredSalonContext()

  return await callRPC('hera_entities_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: user.id,        // WHO
    p_organization_id: organizationId, // WHERE
    p_entity: data,
    p_options: {}
  })
}
```

---

### 2. Smart Query Key Design

```typescript
// ✅ CORRECT - Hierarchical query keys
const queryKey = [
  'entities',           // Entity type
  organizationId,       // Organization context
  'CUSTOMER',           // Specific entity type
  { status: 'active' }  // Filters
]

// Enables targeted invalidation
queryClient.invalidateQueries(['entities', organizationId, 'CUSTOMER'])
```

---

### 3. Optimistic Updates with Rollback

```typescript
const updateMutation = useMutation({
  mutationFn: updateEntity,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['entities'])

    // Snapshot previous value
    const previousData = queryClient.getQueryData(['entities'])

    // Optimistically update
    queryClient.setQueryData(['entities'], (old: any) => {
      return old.map((item: any) =>
        item.id === newData.id ? { ...item, ...newData } : item
      )
    })

    // Return rollback context
    return { previousData }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['entities'], context?.previousData)
  },
  onSettled: () => {
    // Refetch to sync with server
    queryClient.invalidateQueries(['entities'])
  }
})
```

---

### 4. Memoize Expensive Calculations

```typescript
// ✅ CORRECT - Memoize derived data
const enrichedCustomers = useMemo(() => {
  return customers.map(customer => ({
    ...customer,
    ltv: calculateLTV(customer.id),        // Expensive calculation
    is_vip: customer.ltv > 10000
  }))
}, [customers])  // Only recalculate when customers change

// ❌ WRONG - Recalculate on every render
const enrichedCustomers = customers.map(customer => ({
  ...customer,
  ltv: calculateLTV(customer.id)
}))
```

---

### 5. Handle Loading and Error States

```typescript
function CustomerList() {
  const { customers, isLoading, error } = useHeraCustomers({ organizationId })

  // ✅ Handle loading
  if (isLoading) {
    return <LoadingSpinner />
  }

  // ✅ Handle error
  if (error) {
    return <ErrorAlert message={error.message} />
  }

  // ✅ Handle empty state
  if (customers.length === 0) {
    return <EmptyState message="No customers found" />
  }

  // Render data
  return <CustomerTable customers={customers} />
}
```

---

## ⚡ Performance Optimization

### 1. Smart Cache Configuration

```typescript
// Short staleTime for frequently changing data
const { appointments } = useQuery({
  queryKey: ['appointments'],
  queryFn: fetchAppointments,
  staleTime: 0,              // Always fetch fresh
  refetchOnMount: 'always'
})

// Long staleTime for rarely changing data
const { services } = useQuery({
  queryKey: ['services'],
  queryFn: fetchServices,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  cacheTime: 30 * 60 * 1000  // 30 minutes
})
```

---

### 2. Selective Data Fetching

```typescript
// ✅ CORRECT - Fetch only what you need
const { entities } = useUniversalEntityV1({
  entity_type: 'CUSTOMER',
  organizationId,
  filters: {
    limit: 100,
    list_mode: 'HEADERS'  // Only headers, no dynamic fields
  }
})

// ❌ WRONG - Fetch everything
const { entities } = useUniversalEntityV1({
  entity_type: 'CUSTOMER',
  organizationId,
  filters: {
    limit: 10000,
    list_mode: 'FULL',      // Full data including dynamic fields
    include_relationships: true
  }
})
```

---

### 3. Parallel Data Fetching

```typescript
function Dashboard() {
  // ✅ Fetch data in parallel
  const { customers } = useHeraCustomers({ organizationId })
  const { appointments } = useHeraAppointments({ organizationId })
  const { services } = useHeraServices({ organizationId })

  // All queries run in parallel via React Query
}
```

---

## 🧪 Testing Hooks

### Unit Test Pattern

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useHeraCustomers } from '@/hooks/useHeraCustomers'

describe('useHeraCustomers', () => {
  test('Fetches and enriches customers', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )

    const { result } = renderHook(
      () => useHeraCustomers({ organizationId: 'test-org' }),
      { wrapper }
    )

    // Wait for loading to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Verify data
    expect(result.current.customers).toHaveLength(10)
    expect(result.current.customers[0]).toHaveProperty('ltv')
    expect(result.current.customers[0]).toHaveProperty('is_vip')
  })
})
```

---

## 📚 Additional Resources

### Related Documentation

- [DATA-MODELS.md](./DATA-MODELS.md) - Sacred Six schema reference
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Auth patterns
- [API-ROUTES.md](./API-ROUTES.md) - RPC function reference

### External Documentation

- [React Query Documentation](https://tanstack.com/query/latest)
- [React Hooks Documentation](https://react.dev/reference/react)

---

<div align="center">

**Built with HERA DNA** | **Hooks Technical Reference v1.0**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md)

**For Support**: Check documentation or contact HERA development team

</div>
