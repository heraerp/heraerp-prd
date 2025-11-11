# HERA Salon - Customers Feature Guide

**Version**: 1.0
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.FEATURES.CUSTOMERS.v1`

> **Complete technical reference for customer management, LTV tracking, and VIP designation**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Page Components](#page-components)
4. [Hooks Reference](#hooks-reference)
5. [Data Model](#data-model)
6. [Common Patterns](#common-patterns)
7. [Common Tasks](#common-tasks)
8. [API Reference](#api-reference)
9. [Testing](#testing)
10. [Known Issues](#known-issues)
11. [Related Documentation](#related-documentation)

---

## 🎯 Overview

### Purpose

The Customers feature provides enterprise-grade customer relationship management with:
- **Customer CRUD Operations**: Create, read, update, delete customers
- **Lifetime Value (LTV) Tracking**: Automatic calculation from POS transactions
- **VIP Designation**: Premium customer identification and badges
- **Smart Delete System**: Automatic fallback to archive when customers have transaction history
- **Dual View Modes**: Grid and list views with responsive design
- **Advanced Filtering**: Search, archive toggle, sorting by name/LTV/visits

### Key Features

✅ **Customer Database Management**
- Entity-based storage in Sacred Six `core_entities` table
- Dynamic fields for phone, email, VIP status, notes, birthday, loyalty points
- Automatic LTV calculation from POS sales
- Cross-tab synchronization for real-time updates

✅ **Smart Status Workflow**
- **Active**: Regular customers (default)
- **Archived**: Soft-deleted customers (reversible)
- **Deleted**: Customers with transaction history (cannot be hard-deleted)

✅ **VIP Customer Program**
- Toggle VIP status with gold badges
- Preferred stylist assignment
- Higher priority in UI display

✅ **Enterprise Delete System**
- Automatic detection of transaction references
- Graceful fallback from hard delete → soft delete
- Clear error messages for foreign key constraints

---

## 🏗️ Architecture

### File Structure

```
/src/app/salon/customers/
├── page.tsx                           # Main customers page (905 lines)

/src/components/salon/customers/
├── CustomerList.tsx                   # List/grid view component (567 lines)
├── CustomerModal.tsx                  # Create/edit modal (not shown, lazy loaded)

/src/hooks/
├── useHeraCustomers.ts                # Customer data hook (514 lines)
├── useUniversalEntityV1.ts            # Base entity CRUD (orchestrator pattern)
└── entityPresets.ts                   # Customer preset configuration
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CUSTOMERS PAGE                               │
│  /src/app/salon/customers/page.tsx                                  │
│                                                                      │
│  1. SecuredSalonProvider → organizationId context                   │
│  2. useHeraCustomers hook → Fetch customers with filters            │
│  3. State management → Search, sort, archive, view mode             │
│  4. CustomerList component → Display grid/list view                 │
│  5. CustomerModal (lazy) → Create/edit forms                        │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    USEHERACUSTOMERS HOOK                            │
│  /src/hooks/useHeraCustomers.ts                                     │
│                                                                      │
│  - Wraps useUniversalEntityV1 with customer-specific logic          │
│  - Filters: search, archive, branch, VIP                            │
│  - CRUD helpers: create, update, delete, archive, restore           │
│  - LTV tracking: Auto-refresh on POS updates                        │
│  - Smart delete: Auto-fallback to archive on FK constraints         │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                  USEUNIVERSALENTITYV1 HOOK                          │
│  /src/hooks/useUniversalEntityV1.ts (Orchestrator RPC Pattern)     │
│                                                                      │
│  - Calls hera_entities_crud_v2 RPC function                         │
│  - Organization filtering (multi-tenant isolation)                  │
│  - Dynamic fields + relationships in single payload                 │
│  - Actor stamping (created_by, updated_by)                          │
│  - 60% fewer API calls vs old pattern                               │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE (SACRED SIX)                            │
│                                                                      │
│  core_entities:                                                     │
│    - entity_type = 'CUSTOMER'                                       │
│    - entity_name (customer name)                                    │
│    - smart_code = 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1'         │
│    - status (active | archived | deleted)                           │
│    - organization_id (tenant isolation)                             │
│                                                                      │
│  core_dynamic_data:                                                 │
│    - phone, email, vip, notes, birthday                             │
│    - loyalty_points, lifetime_value                                 │
│                                                                      │
│  core_relationships:                                                │
│    - REFERRED_BY (customer → customer)                              │
│    - PREFERRED_STYLIST (customer → stylist)                         │
│    - CUSTOMER_OF (customer → branch)                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Mobile-First Responsive Design

**Desktop Experience (SAP Fiori)**:
- Wide table layout with all columns
- Hover effects and dropdown menus
- Keyboard shortcuts and bulk actions

**Mobile Experience (Native App)**:
- Grid cards with touch-friendly targets (44px minimum)
- Active state animations (active:scale-95)
- Bottom spacing for comfortable scrolling
- Premium mobile header with add button

---

## 🧩 Page Components

### Main Page Component

**File**: `/src/app/salon/customers/page.tsx`

**Purpose**: Customer database page with CRUD operations and dual view modes

**Key Features**:
- ✅ KPI cards: Total customers, VIP count, active count, average LTV
- ✅ Search bar with real-time filtering
- ✅ Active/All toggle (tab-based filtering)
- ✅ Sort dropdown (name, LTV, visits)
- ✅ Grid/List view toggle
- ✅ Enterprise error handling with detailed logging
- ✅ Smart delete with automatic archive fallback

**Component Structure**:

```tsx
export default function SalonCustomersPage() {
  return (
    <StatusToastProvider>
      <SalonCustomersPageContent />
    </StatusToastProvider>
  )
}

function SalonCustomersPageContent() {
  const { organizationId } = useSecuredSalonContext()
  const { showSuccess, showError, showLoading, removeToast } = useSalonToast()

  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [sortBy, setSortBy] = useState('name_asc')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<CustomerEntity | null>(null)

  // Fetch customers with filters
  const {
    customers,
    allCustomers,
    isLoading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    archiveCustomer,
    restoreCustomer,
    getCustomerStats,
    refetch: refetchCustomers
  } = useHeraCustomers({
    includeArchived,
    searchQuery,
    organizationId
  })

  // LTV sync: Force refetch on page mount to get latest values
  React.useEffect(() => {
    const timer = setTimeout(() => {
      refetchCustomers()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // ... CRUD handlers, filtering, sorting
}
```

**File Path**: `/src/app/salon/customers/page.tsx:101`

**Key Props**: None (uses context providers)

---

### KPI Cards Section

**Purpose**: Display customer statistics at a glance

**Implementation**:

```tsx
// File: /src/app/salon/customers/page.tsx:582
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
  <SalonLuxeKPICard
    title={includeArchived ? "Total Customers" : "Active Customers"}
    value={totalDisplayed}
    icon={Users}
    color={COLORS.emerald}
    description={includeArchived ? "Active + Archived" : "Current active base"}
    animationDelay={0}
  />
  <SalonLuxeKPICard
    title="VIP Customers"
    value={stats.vipCustomers}
    icon={Star}
    color={COLORS.gold}
    description="Premium members"
    animationDelay={100}
    percentageBadge={
      stats.totalCustomers > 0
        ? `${((stats.vipCustomers / stats.totalCustomers) * 100).toFixed(0)}%`
        : undefined
    }
  />
  <SalonLuxeKPICard
    title={includeArchived ? "Active" : "Search Results"}
    value={activeCount}
    icon={UserPlus}
    color={COLORS.emerald}
    description={includeArchived ? "Active customers" : `Showing ${totalDisplayed} results`}
    animationDelay={200}
  />
  <SalonLuxeKPICard
    title="Avg Lifetime Value"
    value={Math.round(stats.averageLifetimeValue).toLocaleString()}
    icon={TrendingUp}
    color={COLORS.gold}
    description="Per customer (currency)"
    animationDelay={300}
  />
</div>
```

**Responsive Behavior**:
- Mobile: 2 columns
- Tablet: 2 columns
- Desktop: 4 columns

---

### Filter and Search Toolbar

**Purpose**: Real-time filtering and view mode controls

**Implementation**:

```tsx
// File: /src/app/salon/customers/page.tsx:654
{/* Search Bar */}
<div className="relative">
  <input
    type="text"
    placeholder="Search customers by name, email, or phone..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="w-full px-4 py-3 rounded-lg text-sm"
    style={{
      backgroundColor: COLORS.charcoalLight,
      color: COLORS.champagne,
      border: `1px solid ${COLORS.bronze}30`
    }}
  />
  {searchQuery && (
    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
      <X className="w-4 h-4" />
    </button>
  )}
</div>

{/* Active/All Toggle */}
<div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: COLORS.charcoalLight }}>
  <button
    onClick={() => setIncludeArchived(false)}
    className="px-3 py-1.5 rounded-md text-xs font-medium"
    style={{
      backgroundColor: !includeArchived ? COLORS.gold + '20' : 'transparent',
      color: !includeArchived ? COLORS.gold : COLORS.lightText
    }}
  >
    Active
  </button>
  <button
    onClick={() => setIncludeArchived(true)}
    className="px-3 py-1.5 rounded-md text-xs font-medium"
    style={{
      backgroundColor: includeArchived ? COLORS.gold + '20' : 'transparent',
      color: includeArchived ? COLORS.gold : COLORS.lightText
    }}
  >
    All
  </button>
</div>
```

**File Path**: `/src/app/salon/customers/page.tsx:654-710`

**Filter Behavior**:
- **Active Tab**: Shows only `status='active'` customers (excludes archived and deleted)
- **All Tab**: Shows `status='active'` AND `status='archived'` (still excludes deleted)
- Search query filters name, email, phone in real-time
- Sort dropdown applies secondary sorting within filtered results

---

### CustomerList Component

**File**: `/src/components/salon/customers/CustomerList.tsx`

**Purpose**: Dual-mode customer display (grid/list) with actions menu

**Props**:

```tsx
interface CustomerListProps {
  customers: CustomerEntity[]
  viewMode?: 'list' | 'grid'
  onEdit: (customer: CustomerEntity) => void
  onDelete: (customer: CustomerEntity) => void
  onArchive: (customer: CustomerEntity) => void
  onRestore: (customer: CustomerEntity) => void
}
```

**List View Features**:
- Table layout with sortable columns
- Columns: Customer (name + VIP badge), Contact (email/phone), Status, LTV, Joined, Actions
- Hover effects reveal actions dropdown
- Row alternating colors for readability

**Grid View Features**:
- Responsive card layout (1/2/3/4 columns)
- Large touch-friendly cards (mobile-first)
- VIP badges in top-right corner
- LTV displayed prominently below contact info
- Actions buttons at card footer

**Implementation Example** (Grid View):

```tsx
// File: /src/components/salon/customers/CustomerList.tsx:362
function CustomerGridView({ customers, onEdit, onDelete, onArchive, onRestore }: CustomerListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {customers.map((customer, index) => {
        const isVIP = customer.dynamic_fields?.vip?.value || customer.vip
        const lifetimeValue = customer.lifetime_value || customer.dynamic_fields?.lifetime_value?.value || 0

        return (
          <Card
            key={customer.id || `customer-${index}`}
            className="group relative overflow-hidden hover:scale-[1.02]"
            style={{
              backgroundColor: COLORS.charcoal + 'f5',
              border: `1px solid ${isVIP ? COLORS.gold : COLORS.bronze}40`,
              boxShadow: `0 4px 16px rgba(0,0,0,0.3)`
            }}
          >
            {/* VIP Badge */}
            {isVIP && (
              <Badge className="absolute top-2 right-2" style={{ backgroundColor: COLORS.gold + '20' }}>
                <Star className="h-3 w-3 mr-1" />
                VIP
              </Badge>
            )}

            <CardContent className="p-4">
              {/* Avatar & Name */}
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-lg" style={{ backgroundColor: COLORS.gold + '20' }}>
                  <User className="h-5 w-5" style={{ color: COLORS.gold }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: COLORS.champagne }}>
                    {customer.entity_name}
                  </p>
                  <p className="text-[10px]" style={{ color: COLORS.lightText }}>
                    Member since {format(new Date(customer.created_at), 'MMM yyyy')}
                  </p>
                </div>
              </div>

              {/* LTV Display */}
              <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: COLORS.bronze + '20' }}>
                <span className="text-[10px] uppercase" style={{ color: COLORS.bronze }}>LTV:</span>
                <span className="text-xs font-semibold" style={{ color: COLORS.gold }}>
                  {lifetimeValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button onClick={() => onEdit(customer)}>
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                {/* Archive/Restore/Delete buttons */}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

**File Path**: `/src/components/salon/customers/CustomerList.tsx:362-566`

---

## 🎣 Hooks Reference

### useHeraCustomers Hook

**File**: `/src/hooks/useHeraCustomers.ts` (514 lines)

**Purpose**: Customer-specific wrapper over Universal Entity v2 with LTV tracking and smart delete

**Signature**:

```tsx
export interface UseHeraCustomersOptions {
  organizationId?: string
  includeArchived?: boolean
  searchQuery?: string
  loyaltyFilter?: string
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    status?: string
    search?: string
    branch_id?: string
    vip_only?: boolean
  }
}

export function useHeraCustomers(options?: UseHeraCustomersOptions): {
  customers: CustomerEntity[]
  allCustomers: CustomerEntity[]
  isLoading: boolean
  error: any
  refetch: () => void
  createCustomer: (data: CustomerFormData) => Promise<any>
  updateCustomer: (id: string, data: Partial<CustomerFormData>) => Promise<any>
  archiveCustomer: (id: string) => Promise<any>
  restoreCustomer: (id: string) => Promise<any>
  deleteCustomer: (id: string, reason?: string) => Promise<{ success: boolean, archived: boolean, message?: string }>
  updateLoyaltyPoints: (customerId: string, points: number) => Promise<any>
  addLoyaltyPoints: (customerId: string, pointsToAdd: number) => Promise<any>
  updateLifetimeValue: (customerId: string, value: number) => Promise<any>
  toggleVipStatus: (customerId: string) => Promise<any>
  linkPreferredStylist: (customerId: string, stylistId: string) => Promise<any>
  getCustomerStats: () => CustomerStats
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}
```

**File Path**: `/src/hooks/useHeraCustomers.ts:1`

---

### Key Implementation Details

**1. LTV Cache Invalidation**:

```tsx
// File: /src/hooks/useHeraCustomers.ts:119
useEffect(() => {
  const handleLTVUpdate = (event: CustomEvent) => {
    const { organizationId } = event.detail
    if (organizationId === options?.organizationId) {
      refetch() // Auto-refresh when LTV updates from POS
    }
  }

  window.addEventListener('hera:customer:ltv:updated', handleLTVUpdate as EventListener)
  return () => {
    window.removeEventListener('hera:customer:ltv:updated', handleLTVUpdate as EventListener)
  }
}, [options?.organizationId, refetch])
```

**Purpose**: Automatically refetch customers when LTV is updated from POS page

**Event**: `hera:customer:ltv:updated` (dispatched by customer LTV service)

**File Path**: `/src/hooks/useHeraCustomers.ts:119-132`

---

**2. Tab-Based Status Filtering**:

```tsx
// File: /src/hooks/useHeraCustomers.ts:134
const filteredCustomers = useMemo(() => {
  if (!customers) return customers as CustomerEntity[]

  let filtered = customers as CustomerEntity[]

  // Active tab: Show only status='active' (exclude 'archived' and 'deleted')
  if (!options?.includeArchived) {
    filtered = filtered.filter(customer => {
      if (customer.status === 'archived' || customer.status === 'deleted') {
        return false
      }
      return true
    })
  } else {
    // All tab: Show 'active' and 'archived' (exclude 'deleted' only)
    filtered = filtered.filter(customer => {
      if (customer.status === 'deleted') {
        return false
      }
      return true
    })
  }

  // Additional filters: search, branch, VIP
  // ...

  return filtered
}, [customers, options?.includeArchived, options?.searchQuery, /* ... */])
```

**Purpose**: Implement Products page pattern for status filtering with deleted exclusion

**File Path**: `/src/hooks/useHeraCustomers.ts:134-217`

---

**3. Smart Delete with Automatic Archive Fallback**:

```tsx
// File: /src/hooks/useHeraCustomers.ts:345
const deleteCustomer = async (
  id: string,
  reason?: string
): Promise<{
  success: boolean
  archived: boolean
  message?: string
}> => {
  const customer = (customers as CustomerEntity[])?.find(c => c.id === id)
  if (!customer) throw new Error('Customer not found')

  try {
    // Attempt hard delete first
    await baseDelete({
      entity_id: id,
      hard_delete: true,
      cascade: true,
      reason: reason || 'Permanently delete customer'
    })

    return {
      success: true,
      archived: false
    }
  } catch (error: any) {
    // Detect foreign key constraint error
    const isFKConstraint =
      error.message?.includes('409') ||
      error.message?.includes('Conflict') ||
      error.message?.includes('referenced') ||
      error.message?.includes('foreign key')

    if (isFKConstraint) {
      // Automatic fallback to archive
      try {
        await baseUpdate({
          entity_id: id,
          entity_name: customer.entity_name,
          status: 'archived'
        })

        return {
          success: true,
          archived: true,
          message: 'Customer is used in appointments or transactions and cannot be deleted. It has been archived instead.'
        }
      } catch (archiveError: any) {
        throw new Error(`Failed to delete or archive customer: ${archiveError.message}`)
      }
    }

    // Different error - re-throw it
    throw error
  }
}
```

**Purpose**: Enterprise-grade delete with graceful fallback when customers have transaction history

**Behavior**:
1. Try hard delete first
2. If foreign key constraint (customer referenced in transactions), automatically archive instead
3. Return detailed result indicating whether hard delete or archive occurred
4. Show appropriate user feedback message

**File Path**: `/src/hooks/useHeraCustomers.ts:345-406`

---

**4. Customer Statistics Calculation**:

```tsx
// File: /src/hooks/useHeraCustomers.ts:466
const getCustomerStats = () => {
  const allCustomers = (customers as CustomerEntity[]) || []

  const vipCount = allCustomers.filter(
    c => c.vip === true || c.dynamic_fields?.vip?.value === true
  ).length

  const totalLoyaltyPoints = allCustomers.reduce(
    (sum, c) => sum + (c.loyalty_points || c.dynamic_fields?.loyalty_points?.value || 0),
    0
  )

  const totalLifetimeValue = allCustomers.reduce(
    (sum, c) => sum + (c.lifetime_value || c.dynamic_fields?.lifetime_value?.value || 0),
    0
  )

  return {
    totalCustomers: allCustomers.length,
    vipCustomers: vipCount,
    regularCustomers: allCustomers.length - vipCount,
    totalLoyaltyPoints,
    averageLoyaltyPoints: allCustomers.length > 0 ? totalLoyaltyPoints / allCustomers.length : 0,
    totalLifetimeValue,
    averageLifetimeValue: allCustomers.length > 0 ? totalLifetimeValue / allCustomers.length : 0
  }
}
```

**Purpose**: Calculate aggregate statistics for KPI cards

**Returns**:
- Total customers count
- VIP customers count
- Regular customers count
- Total loyalty points
- Average loyalty points per customer
- Total lifetime value
- Average lifetime value per customer

**File Path**: `/src/hooks/useHeraCustomers.ts:466-490`

---

## 💾 Data Model

### CustomerEntity Interface

```tsx
export interface CustomerEntity {
  // Core entity fields
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: 'active' | 'archived' | 'deleted'

  // Dynamic fields (nested structure from database)
  dynamic_fields?: {
    phone?: { value: string }
    email?: { value: string }
    vip?: { value: boolean }
    notes?: { value: string }
    birthday?: { value: string }
    loyalty_points?: { value: number }
    lifetime_value?: { value: number }
  }

  // Flattened fields for easier access (populated by hook)
  phone?: string
  email?: string
  vip?: boolean
  notes?: string
  birthday?: string
  loyalty_points?: number
  lifetime_value?: number

  // Relationships
  relationships?: {
    referred_by?: { to_entity: any }
    preferred_stylist?: { to_entity: any }
    customer_of?: any // Branch relationships (can be array or single)
  }

  // Audit fields
  created_at: string
  updated_at: string
}
```

**File Path**: `/src/hooks/useHeraCustomers.ts:35-65`

---

### Sacred Six Storage

**Table: `core_entities`**

```sql
INSERT INTO core_entities (
  entity_type,
  entity_name,
  smart_code,
  status,
  organization_id,
  created_by,
  updated_by
) VALUES (
  'CUSTOMER',
  'John Doe',
  'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1',
  'active',
  '00000000-0000-0000-0000-000000000001',
  'user-uuid',
  'user-uuid'
)
```

**Table: `core_dynamic_data`**

```sql
-- Phone field
INSERT INTO core_dynamic_data (
  entity_id,
  field_name,
  field_value_text,
  field_type,
  smart_code,
  organization_id
) VALUES (
  'customer-uuid',
  'phone',
  '+971501234567',
  'text',
  'HERA.SALON.CUSTOMER.FIELD.PHONE.V1',
  'org-uuid'
)

-- Email field
INSERT INTO core_dynamic_data (
  entity_id,
  field_name,
  field_value_text,
  field_type,
  smart_code,
  organization_id
) VALUES (
  'customer-uuid',
  'email',
  'john@example.com',
  'email',
  'HERA.SALON.CUSTOMER.FIELD.EMAIL.V1',
  'org-uuid'
)

-- VIP status
INSERT INTO core_dynamic_data (
  entity_id,
  field_name,
  field_value_boolean,
  field_type,
  smart_code,
  organization_id
) VALUES (
  'customer-uuid',
  'vip',
  true,
  'boolean',
  'HERA.SALON.CUSTOMER.FIELD.VIP.V1',
  'org-uuid'
)

-- Lifetime value
INSERT INTO core_dynamic_data (
  entity_id,
  field_name,
  field_value_number,
  field_type,
  smart_code,
  organization_id
) VALUES (
  'customer-uuid',
  'lifetime_value',
  4250.00,
  'number',
  'HERA.SALON.CUSTOMER.FIELD.LIFETIME_VALUE.V1',
  'org-uuid'
)
```

**Table: `core_relationships`**

```sql
-- Preferred stylist
INSERT INTO core_relationships (
  source_entity_id,
  target_entity_id,
  relationship_type,
  organization_id
) VALUES (
  'customer-uuid',
  'stylist-uuid',
  'PREFERRED_STYLIST',
  'org-uuid'
)

-- Customer of branch
INSERT INTO core_relationships (
  source_entity_id,
  target_entity_id,
  relationship_type,
  organization_id
) VALUES (
  'customer-uuid',
  'branch-uuid',
  'CUSTOMER_OF',
  'org-uuid'
)

-- Referred by another customer
INSERT INTO core_relationships (
  source_entity_id,
  target_entity_id,
  relationship_type,
  organization_id
) VALUES (
  'customer-uuid',
  'referrer-customer-uuid',
  'REFERRED_BY',
  'org-uuid'
)
```

---

### Customer Preset Configuration

**File**: `/src/hooks/entityPresets.ts`

```tsx
export const CUSTOMER_PRESET = {
  dynamicFields: [
    {
      name: 'phone',
      type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.V1'
    },
    {
      name: 'email',
      type: 'email',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.V1'
    },
    {
      name: 'vip',
      type: 'boolean',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.VIP.V1'
    },
    {
      name: 'notes',
      type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.NOTES.V1'
    },
    {
      name: 'birthday',
      type: 'date',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.BIRTHDAY.V1'
    },
    {
      name: 'loyalty_points',
      type: 'number',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.LOYALTY_POINTS.V1'
    },
    {
      name: 'lifetime_value',
      type: 'number',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.LIFETIME_VALUE.V1'
    }
  ],
  relationships: [
    {
      type: 'REFERRED_BY',
      target_entity_type: 'CUSTOMER'
    },
    {
      type: 'PREFERRED_STYLIST',
      target_entity_type: 'STYLIST'
    },
    {
      type: 'CUSTOMER_OF',
      target_entity_type: 'BRANCH'
    }
  ]
}
```

---

## 🎨 Common Patterns

### 1. Creating a Customer

```tsx
const { createCustomer } = useHeraCustomers({ organizationId })

const handleCreateCustomer = async () => {
  try {
    await createCustomer({
      name: 'Jane Smith',
      phone: '+971501234567',
      email: 'jane@example.com',
      vip: true,
      notes: 'Prefers morning appointments',
      birthday: '1990-05-15',
      loyalty_points: 100,
      lifetime_value: 0, // Will be updated automatically from POS
      preferred_stylist_id: 'stylist-uuid',
      branch_id: 'branch-uuid'
    })

    console.log('✅ Customer created successfully')
  } catch (error) {
    console.error('❌ Failed to create customer:', error)
  }
}
```

**Result**: Customer entity stored in `core_entities` with all dynamic fields in `core_dynamic_data` and relationships in `core_relationships`.

---

### 2. Updating Customer Information

```tsx
const { updateCustomer } = useHeraCustomers({ organizationId })

const handleUpdateCustomer = async (customerId: string) => {
  try {
    await updateCustomer(customerId, {
      name: 'Jane Smith-Updated',
      vip: true,
      notes: 'Updated preference: afternoon appointments only'
    })

    console.log('✅ Customer updated successfully')
  } catch (error) {
    console.error('❌ Failed to update customer:', error)
  }
}
```

**Behavior**: Only provided fields are updated. Dynamic fields and relationships are patched independently.

---

### 3. Smart Delete (with Automatic Archive Fallback)

```tsx
const { deleteCustomer } = useHeraCustomers({ organizationId })

const handleDeleteCustomer = async (customerId: string) => {
  try {
    const result = await deleteCustomer(customerId, 'Customer requested deletion')

    if (result.archived) {
      console.log('⚠️ Customer archived instead of deleted (has transaction history)')
      console.log('Message:', result.message)
    } else {
      console.log('✅ Customer permanently deleted')
    }
  } catch (error) {
    console.error('❌ Failed to delete customer:', error)
  }
}
```

**Behavior**:
1. Attempts hard delete first
2. If customer has appointments or transactions (foreign key constraint), automatically archives instead
3. Returns detailed result with `archived` flag and message
4. Shows appropriate UI feedback

---

### 4. Toggling VIP Status

```tsx
const { toggleVipStatus } = useHeraCustomers({ organizationId })

const handleToggleVIP = async (customerId: string) => {
  try {
    await toggleVipStatus(customerId)
    console.log('✅ VIP status toggled')
  } catch (error) {
    console.error('❌ Failed to toggle VIP status:', error)
  }
}
```

---

### 5. Updating Lifetime Value (LTV)

```tsx
const { updateLifetimeValue } = useHeraCustomers({ organizationId })

const handleUpdateLTV = async (customerId: string, newLTV: number) => {
  try {
    await updateLifetimeValue(customerId, newLTV)
    console.log('✅ LTV updated successfully')

    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('hera:customer:ltv:updated', {
      detail: { organizationId, customerId, newLTV }
    }))
  } catch (error) {
    console.error('❌ Failed to update LTV:', error)
  }
}
```

**LTV Auto-Refresh**: When this event is dispatched, the customers page automatically refetches data to show updated LTV.

---

### 6. Filtering Customers by Branch

```tsx
const { customers } = useHeraCustomers({
  organizationId,
  filters: {
    branch_id: 'branch-uuid', // Only customers associated with this branch
    include_relationships: true // REQUIRED for branch filtering to work
  }
})

// Result: Only customers with CUSTOMER_OF relationship to specified branch
```

---

### 7. Filtering VIP Customers Only

```tsx
const { customers } = useHeraCustomers({
  organizationId,
  filters: {
    vip_only: true // Only customers with vip = true
  }
})
```

---

## 🔧 Common Tasks

### Task 1: Add a New Customer Field

**Scenario**: Add a "preferred_language" field to customers

**Steps**:

1. **Update Customer Preset** (`/src/hooks/entityPresets.ts`):

```tsx
export const CUSTOMER_PRESET = {
  dynamicFields: [
    // ... existing fields
    {
      name: 'preferred_language',
      type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.PREFERRED_LANGUAGE.V1'
    }
  ]
}
```

2. **Update CustomerEntity Interface** (`/src/hooks/useHeraCustomers.ts:35`):

```tsx
export interface CustomerEntity {
  // ... existing fields
  dynamic_fields?: {
    // ... existing dynamic fields
    preferred_language?: { value: string }
  }
  // Flattened fields
  preferred_language?: string
  // ...
}
```

3. **Update createCustomer Helper** (`/src/hooks/useHeraCustomers.ts:220`):

```tsx
const createCustomer = async (data: {
  name: string
  // ... existing fields
  preferred_language?: string
}) => {
  // Field mapping is automatic via preset
}
```

4. **Update CustomerModal Form** (lazy loaded component):

```tsx
<input
  type="text"
  name="preferred_language"
  placeholder="Preferred Language"
  value={formData.preferred_language || ''}
  onChange={handleChange}
/>
```

5. **Test**:

```bash
# Create customer with new field
const customer = await createCustomer({
  name: 'Test Customer',
  preferred_language: 'Arabic'
})

# Verify field in database
SELECT * FROM core_dynamic_data WHERE field_name = 'preferred_language';
```

**Result**: New field automatically stored in `core_dynamic_data` with smart code validation.

---

### Task 2: Implement Customer Merge Functionality

**Scenario**: Merge duplicate customers into a single record

**Implementation**:

```tsx
// Add to useHeraCustomers hook
const mergeCustomers = async (
  targetCustomerId: string,
  sourceCustomerId: string
): Promise<void> => {
  const target = customers?.find(c => c.id === targetCustomerId)
  const source = customers?.find(c => c.id === sourceCustomerId)

  if (!target || !source) {
    throw new Error('One or both customers not found')
  }

  try {
    // 1. Update all transactions to point to target customer
    await apiV2.post('transactions/bulk-update', {
      filter: { source_entity_id: sourceCustomerId },
      updates: { source_entity_id: targetCustomerId },
      organization_id: organizationId
    })

    // 2. Merge lifetime values
    const mergedLTV = (target.lifetime_value || 0) + (source.lifetime_value || 0)
    await updateLifetimeValue(targetCustomerId, mergedLTV)

    // 3. Merge loyalty points
    const mergedPoints = (target.loyalty_points || 0) + (source.loyalty_points || 0)
    await updateLoyaltyPoints(targetCustomerId, mergedPoints)

    // 4. Copy any missing contact info from source
    const updates: any = {}
    if (!target.email && source.email) updates.email = source.email
    if (!target.phone && source.phone) updates.phone = source.phone
    if (Object.keys(updates).length > 0) {
      await updateCustomer(targetCustomerId, updates)
    }

    // 5. Archive source customer
    await archiveCustomer(sourceCustomerId)

    console.log('✅ Customers merged successfully')
  } catch (error) {
    console.error('❌ Failed to merge customers:', error)
    throw error
  }
}

return {
  // ... existing exports
  mergeCustomers
}
```

**Usage**:

```tsx
const { mergeCustomers } = useHeraCustomers({ organizationId })

const handleMerge = async () => {
  await mergeCustomers('target-customer-id', 'duplicate-customer-id')
  showSuccess('Customers merged successfully')
}
```

---

### Task 3: Export Customers to CSV

**Implementation**:

```tsx
const exportCustomersToCSV = () => {
  const { customers } = useHeraCustomers({ organizationId, includeArchived: true })

  const csvHeaders = ['Name', 'Email', 'Phone', 'VIP', 'Lifetime Value', 'Joined Date', 'Status']

  const csvRows = customers.map(customer => [
    customer.entity_name,
    customer.email || '',
    customer.phone || '',
    customer.vip ? 'Yes' : 'No',
    customer.lifetime_value?.toFixed(2) || '0.00',
    customer.created_at ? format(new Date(customer.created_at), 'yyyy-MM-dd') : '',
    customer.status
  ])

  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n')

  // Download CSV
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `customers_export_${format(new Date(), 'yyyy-MM-dd')}.csv`
  link.click()
}
```

---

### Task 4: Implement Customer Import from CSV

**Implementation**:

```tsx
const importCustomersFromCSV = async (file: File) => {
  const { createCustomer } = useHeraCustomers({ organizationId })

  const text = await file.text()
  const rows = text.split('\n').slice(1) // Skip header

  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  }

  for (const row of rows) {
    const [name, email, phone, vip] = row.split(',')

    try {
      await createCustomer({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        vip: vip.trim().toLowerCase() === 'yes'
      })
      results.success++
    } catch (error: any) {
      results.failed++
      results.errors.push(`${name}: ${error.message}`)
    }
  }

  console.log('Import results:', results)
  return results
}
```

---

## 📡 API Reference

### RPC Function: hera_entities_crud_v2

**Used By**: useUniversalEntityV1 hook (called by useHeraCustomers)

**Function Signature**:

```sql
CREATE OR REPLACE FUNCTION hera_entities_crud_v2(
  p_action TEXT,                    -- 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
  p_actor_user_id UUID,             -- WHO is acting
  p_organization_id UUID,           -- WHERE (tenant boundary)
  p_entity JSONB,                   -- Entity payload
  p_dynamic JSONB,                  -- Dynamic fields
  p_relationships JSONB,            -- Relationships
  p_options JSONB                   -- Additional options
) RETURNS JSONB
```

**Example Payload** (Create Customer):

```json
{
  "p_action": "CREATE",
  "p_actor_user_id": "user-uuid",
  "p_organization_id": "org-uuid",
  "p_entity": {
    "entity_type": "CUSTOMER",
    "entity_name": "John Doe",
    "smart_code": "HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1",
    "status": "active"
  },
  "p_dynamic": {
    "phone": {
      "value": "+971501234567",
      "type": "text",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.PHONE.V1"
    },
    "email": {
      "value": "john@example.com",
      "type": "email",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.EMAIL.V1"
    },
    "vip": {
      "value": true,
      "type": "boolean",
      "smart_code": "HERA.SALON.CUSTOMER.FIELD.VIP.V1"
    }
  },
  "p_relationships": {
    "PREFERRED_STYLIST": ["stylist-uuid"],
    "CUSTOMER_OF": ["branch-uuid"]
  },
  "p_options": {}
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "entity": {
      "id": "new-customer-uuid",
      "entity_type": "CUSTOMER",
      "entity_name": "John Doe",
      "smart_code": "HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1",
      "status": "active",
      "organization_id": "org-uuid",
      "created_at": "2025-01-07T12:00:00Z",
      "updated_at": "2025-01-07T12:00:00Z",
      "created_by": "user-uuid",
      "updated_by": "user-uuid"
    },
    "dynamic_fields": [ ... ],
    "relationships": [ ... ]
  }
}
```

---

### REST Endpoint: /api/v2/entities

**Alternative API** (if not using RPC directly):

**POST /api/v2/entities** (Create Customer):

```typescript
const response = await fetch('/api/v2/entities', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-Organization-Id': organizationId
  },
  body: JSON.stringify({
    entity_type: 'CUSTOMER',
    entity_name: 'John Doe',
    smart_code: 'HERA.SALON.CUSTOMER.ENTITY.CUSTOMER.V1',
    dynamic_fields: {
      phone: {
        value: '+971501234567',
        type: 'text',
        smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.V1'
      }
    }
  })
})
```

**GET /api/v2/entities** (List Customers):

```typescript
const response = await fetch(
  `/api/v2/entities?entity_type=CUSTOMER&organization_id=${organizationId}&include_dynamic=true`,
  {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Organization-Id': organizationId
    }
  }
)
```

---

## 🧪 Testing

### E2E Test Structure

**File**: `/tests/e2e/salon/customers.spec.ts` (not shown, should be created)

**Test Cases**:

```typescript
import { test, expect } from '@playwright/test'

test.describe('Customers Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/salon/customers')
  })

  test('should load customers page with KPI cards', async ({ page }) => {
    await expect(page.locator('text=Total Customers')).toBeVisible()
    await expect(page.locator('text=VIP Customers')).toBeVisible()
    await expect(page.locator('text=Avg Lifetime Value')).toBeVisible()
  })

  test('should search customers by name', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search customers"]')
    await searchInput.fill('John')
    await expect(page.locator('text=John Doe')).toBeVisible()
  })

  test('should toggle between Active and All tabs', async ({ page }) => {
    // Click All tab
    await page.locator('button:has-text("All")').click()

    // Verify archived customers are visible
    await expect(page.locator('text=Archived').first()).toBeVisible()

    // Click Active tab
    await page.locator('button:has-text("Active")').click()

    // Verify only active customers
    await expect(page.locator('text=Archived')).not.toBeVisible()
  })

  test('should create a new customer', async ({ page }) => {
    await page.locator('button:has-text("Add Customer")').click()

    // Fill form
    await page.locator('input[name="name"]').fill('Test Customer')
    await page.locator('input[name="email"]').fill('test@example.com')
    await page.locator('input[name="phone"]').fill('+971501234567')

    await page.locator('button:has-text("Save")').click()

    // Verify success toast
    await expect(page.locator('text=Customer created successfully')).toBeVisible()

    // Verify customer appears in list
    await expect(page.locator('text=Test Customer')).toBeVisible()
  })

  test('should toggle VIP status', async ({ page }) => {
    // Find first customer row
    const firstCustomer = page.locator('[data-testid="customer-row"]').first()

    // Open actions menu
    await firstCustomer.locator('button[aria-label="Actions"]').click()

    // Click "Toggle VIP"
    await page.locator('text=Toggle VIP').click()

    // Verify VIP badge appears
    await expect(firstCustomer.locator('text=VIP')).toBeVisible()
  })

  test('should archive and restore customer', async ({ page }) => {
    const firstCustomer = page.locator('[data-testid="customer-row"]').first()
    const customerName = await firstCustomer.locator('[data-testid="customer-name"]').textContent()

    // Archive customer
    await firstCustomer.locator('button[aria-label="Actions"]').click()
    await page.locator('text=Archive').click()
    await expect(page.locator('text=Customer archived')).toBeVisible()

    // Switch to All tab to see archived
    await page.locator('button:has-text("All")').click()

    // Verify archived badge
    await expect(page.locator(`text=${customerName}`).locator('..').locator('text=Archived')).toBeVisible()

    // Restore customer
    await page.locator(`text=${customerName}`).locator('..').locator('button[aria-label="Actions"]').click()
    await page.locator('text=Restore').click()
    await expect(page.locator('text=Customer restored')).toBeVisible()
  })

  test('should handle smart delete with automatic archive fallback', async ({ page }) => {
    // Create customer with transaction history
    // (This would require creating an appointment or sale first)

    // Attempt delete
    const firstCustomer = page.locator('[data-testid="customer-row"]').first()
    await firstCustomer.locator('button[aria-label="Actions"]').click()
    await page.locator('text=Delete').click()

    // Confirm delete
    await page.locator('button:has-text("Delete Customer")').click()

    // Verify fallback to archive message
    await expect(page.locator('text=Customer is used in appointments or transactions')).toBeVisible()
    await expect(page.locator('text=It has been archived instead')).toBeVisible()
  })

  test('should switch between grid and list views', async ({ page }) => {
    // Start in grid view
    await expect(page.locator('[data-testid="customer-grid"]')).toBeVisible()

    // Switch to list view
    await page.locator('button[title="List View"]').click()
    await expect(page.locator('table')).toBeVisible()

    // Switch back to grid view
    await page.locator('button[title="Grid View"]').click()
    await expect(page.locator('[data-testid="customer-grid"]')).toBeVisible()
  })
})
```

---

### Unit Test Examples

**Testing useHeraCustomers Hook**:

```typescript
import { renderHook, waitFor } from '@testing-library/react'
import { useHeraCustomers } from '@/hooks/useHeraCustomers'

describe('useHeraCustomers', () => {
  it('should filter customers by search query', async () => {
    const { result } = renderHook(() =>
      useHeraCustomers({
        organizationId: 'test-org',
        searchQuery: 'john'
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.customers).toHaveLength(1)
    expect(result.current.customers[0].entity_name).toContain('John')
  })

  it('should exclude deleted customers from both Active and All tabs', async () => {
    const { result } = renderHook(() =>
      useHeraCustomers({
        organizationId: 'test-org',
        includeArchived: true // All tab
      })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const hasDeletedCustomer = result.current.customers.some(
      c => c.status === 'deleted'
    )
    expect(hasDeletedCustomer).toBe(false)
  })

  it('should calculate customer statistics correctly', async () => {
    const { result } = renderHook(() =>
      useHeraCustomers({ organizationId: 'test-org' })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const stats = result.current.getCustomerStats()
    expect(stats.totalCustomers).toBeGreaterThan(0)
    expect(stats.vipCustomers).toBeGreaterThanOrEqual(0)
    expect(stats.averageLifetimeValue).toBeGreaterThanOrEqual(0)
  })

  it('should handle smart delete with archive fallback', async () => {
    const { result } = renderHook(() =>
      useHeraCustomers({ organizationId: 'test-org' })
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Mock customer with transactions
    const customerWithTransactions = result.current.customers[0]

    const deleteResult = await result.current.deleteCustomer(
      customerWithTransactions.id
    )

    expect(deleteResult.success).toBe(true)
    expect(deleteResult.archived).toBe(true)
    expect(deleteResult.message).toContain('transaction history')
  })
})
```

---

## ⚠️ Known Issues

### Issue 1: Birthday Date Format Inconsistency

**Problem**: HTML `<input type="date">` requires `yyyy-MM-dd` format, but PostgreSQL stores ISO format `2025-10-15T00:00:00+00:00`.

**Symptom**: Birthday field shows empty even when value exists in database.

**Solution**: Date format helper functions (implemented in hook):

```tsx
// File: /src/hooks/useHeraCustomers.ts:22
function formatDateForInput(isoDate: string | null | undefined): string {
  if (!isoDate) return ''
  return isoDate.split('T')[0] // Extract yyyy-MM-dd from ISO
}

function formatDateForDatabase(inputDate: string | null | undefined): string | null {
  if (!inputDate || inputDate === '') return null
  return inputDate // HTML input already provides yyyy-MM-dd
}

// Applied in filteredCustomers memo
filtered = filtered.map(customer => ({
  ...customer,
  birthday: formatDateForInput(customer.birthday || customer.dynamic_fields?.birthday?.value)
}))
```

**File Path**: `/src/hooks/useHeraCustomers.ts:22-33, 157-161`

**Status**: ✅ Fixed

---

### Issue 2: allCustomers Already Filtered by Status

**Problem**: When `includeArchived=false`, the hook filters to `status='active'` only, so `allCustomers.filter(c => c.status === 'archived')` returns zero.

**Symptom**: Archived count KPI always shows 0 even when archived customers exist.

**Solution**: Use `customers` array (filtered results) for both active and archived counts, not `allCustomers`.

```tsx
// File: /src/app/salon/customers/page.tsx:207
const activeCount = useMemo(
  () => customers.filter(c => c.status === 'active').length,
  [customers]
)

const archivedCount = useMemo(
  () => customers.filter(c => c.status === 'archived').length,
  [customers]
)
```

**File Path**: `/src/app/salon/customers/page.tsx:207-214`

**Status**: ✅ Fixed

---

### Issue 3: LTV Not Refreshing After POS Sale

**Problem**: LTV updates in POS, but Customers page doesn't reflect new values until manual refresh.

**Solution**: Implemented LTV cache invalidation via custom event listener.

```tsx
// POS page dispatches event after LTV update
window.dispatchEvent(new CustomEvent('hera:customer:ltv:updated', {
  detail: { organizationId, customerId, newLTV }
}))

// Customers page listens for event and refetches
useEffect(() => {
  const handleLTVUpdate = (event: CustomEvent) => {
    if (event.detail.organizationId === organizationId) {
      refetchCustomers()
    }
  }
  window.addEventListener('hera:customer:ltv:updated', handleLTVUpdate)
  return () => window.removeEventListener('hera:customer:ltv:updated', handleLTVUpdate)
}, [organizationId, refetchCustomers])
```

**File Path**: `/src/hooks/useHeraCustomers.ts:119-132`

**Status**: ✅ Implemented

---

## 📖 Related Documentation

### Feature Documentation
- [DASHBOARD.md](./DASHBOARD.md) - Dashboard KPIs and period filtering
- [POINT-OF-SALE.md](./POINT-OF-SALE.md) - POS system and LTV calculation
- [APPOINTMENTS.md](./APPOINTMENTS.md) - Appointment scheduling and customer selection
- [SERVICES.md](./SERVICES.md) - Service catalog for customer bookings
- [PRODUCTS.md](./PRODUCTS.md) - Product catalog for customer purchases

### Technical Reference
- [HOOKS.md](./HOOKS.md) - Custom hooks reference (useUniversalEntityV1 pattern)
- [DATA-MODELS.md](./DATA-MODELS.md) - Sacred Six schema and Smart Codes
- [API-ROUTES.md](./API-ROUTES.md) - RPC functions and REST endpoints
- [SHARED-COMPONENTS.md](./SHARED-COMPONENTS.md) - Reusable UI components

### System Documentation
- [DEVELOPER-GUIDE.md](../DEVELOPER-GUIDE.md) - Main developer guide
- [COMPLETE-DEVELOPER-REFERENCE.md](../COMPLETE-DEVELOPER-REFERENCE.md) - Consolidated reference

---

## 🎯 Success Metrics

A customer management feature is production-ready when:

- ✅ **All CRUD operations work**: Create, read, update, delete with proper error handling
- ✅ **Mobile responsive**: Grid/list views work on 375px+ screens
- ✅ **LTV tracking accurate**: Auto-updates from POS with event synchronization
- ✅ **Smart delete safe**: Automatic archive fallback prevents data integrity issues
- ✅ **VIP designation clear**: Gold badges and premium UI treatment
- ✅ **Search performant**: Real-time filtering without lag
- ✅ **E2E tests pass**: All customer workflows covered
- ✅ **Documentation complete**: This guide reflects actual implementation

---

<div align="center">

**Built with HERA DNA** | **Customers Module v1.0** | **Enterprise Ready**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md) | [Dashboard →](./DASHBOARD.md) | [Point of Sale →](./POINT-OF-SALE.md)

</div>
