# HERA Salon - Services Feature Guide

**Version**: 1.0
**Last Updated**: 2025-01-07
**Smart Code**: `HERA.DOCS.SALON.FEATURES.SERVICES.v1`

> **Complete technical reference for service catalog management, categories, and pricing**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Page Components](#page-components)
4. [Hooks Reference](#hooks-reference)
5. [Data Model](#data-model)
6. [Common Patterns](#common-patterns)
7. [Excel Import/Export](#excel-importexport)
8. [Common Tasks](#common-tasks)
9. [API Reference](#api-reference)
10. [Known Issues](#known-issues)

---

## 🎯 Overview

### Purpose

The Services feature provides enterprise-grade service catalog management with:
- **Service CRUD Operations**: Create, read, update, delete services
- **Category Management**: Organize services into categories with color coding
- **Branch Availability**: Link services to specific locations via relationships
- **Excel Import/Export**: Bulk operations with professional templates
- **Smart Delete System**: Automatic fallback to archive when services are referenced
- **Dual View Modes**: Grid and list views with responsive design

### Key Features

✅ **Service Catalog Management**
- Entity-based storage in Sacred Six `core_entities` table
- Dynamic fields for pricing, duration, commission rates, descriptions
- Category relationships with color-coded badges
- Branch availability via `AVAILABLE_AT` relationships

✅ **Category System**
- Create and manage service categories
- Color-coded visual organization
- Service count tracking per category
- Category-based filtering

✅ **Enterprise Import/Export**
- Professional Excel templates with instructions
- CSV support for simple imports
- Batch service creation with validation
- Empty template validation with friendly UX

✅ **Smart Status Workflow**
- **Active**: Bookable services (default)
- **Archived**: Soft-deleted services (reversible)
- **Deleted**: Services with transaction history (cannot be hard-deleted)

---

## 🏗️ Architecture

### File Structure

```
/src/app/salon/services/
├── page.tsx                           # Main services page (2,108 lines)

/src/components/salon/services/
├── ServiceList.tsx                    # List/grid view component (489 lines)
├── ServiceModal.tsx                   # Create/edit modal (lazy loaded)
├── ServiceCategoryModal.tsx           # Category modal (lazy loaded)

/src/hooks/
├── useHeraServices.ts                 # Service data hook (446 lines)
├── useHeraServiceCategories.ts        # Category data hook
├── useUniversalEntityV1.ts            # Base entity CRUD (orchestrator pattern)
└── entityPresets.ts                   # Service preset configuration
```

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVICES PAGE                                │
│  /src/app/salon/services/page.tsx                                   │
│                                                                      │
│  1. SecuredSalonProvider → organizationId, currency, branches       │
│  2. useHeraServices → Fetch ALL services (no filters)               │
│  3. Client-side filtering → branch, category, search, archive       │
│  4. KPI calculations → Use unfiltered data for global metrics       │
│  5. ServiceList component → Display filtered results                │
│  6. ServiceModal (lazy) → Create/edit forms                         │
│  7. Import/Export modals → Bulk operations                          │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    USEHERASERVICES HOOK                             │
│  /src/hooks/useHeraServices.ts                                      │
│                                                                      │
│  - Wraps useUniversalEntityV1 with service-specific logic           │
│  - Category name enrichment from HAS_CATEGORY relationships         │
│  - Branch filtering via AVAILABLE_AT relationships                  │
│  - CRUD helpers: create, update, delete, archive, restore           │
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
│    - entity_type = 'SERVICE'                                        │
│    - entity_name (service name)                                     │
│    - entity_code (service code)                                     │
│    - smart_code = 'HERA.SALON.SERVICE.ENTITY.SERVICE.v1'           │
│    - status (active | archived | deleted)                           │
│    - organization_id (tenant isolation)                             │
│                                                                      │
│  core_dynamic_data:                                                 │
│    - price_market, duration_min, commission_rate                    │
│    - description, active, requires_booking                          │
│                                                                      │
│  core_relationships:                                                │
│    - HAS_CATEGORY (service → category)                              │
│    - AVAILABLE_AT (service → branch)                                │
│    - PERFORMED_BY_ROLE (service → role)                             │
│    - REQUIRES_PRODUCT (service → product)                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Performance Optimization Pattern

**Key Innovation**: Fetch once, filter client-side

```tsx
// File: /src/app/salon/services/page.tsx:236
// ✅ PERFORMANCE FIX: Fetch services ONCE with NO filters
const {
  services: allServices,
  isLoading,
  error
} = useHeraServices({
  organizationId,
  filters: {
    limit: 100 // Get all services
  }
})

// Derive filtered services for display (client-side filtering is fast)
const services = useMemo(() => {
  return allServices.filter(service => {
    // Apply tab, branch, category filters in memory
  })
}, [allServices, includeArchived, localBranchFilter, categoryFilter])

// KPIs always use ALL services for accurate global metrics
const totalServicesCount = allServices?.length || 0
const activeCount = allServices?.filter(s => s.status === 'active').length
```

**Benefits**:
- 50% fewer API calls (was fetching twice: once for KPIs, once for list)
- Faster UI updates (no server round-trip for filters)
- Consistent KPIs (always show global totals, not filtered counts)

**File Path**: `/src/app/salon/services/page.tsx:236-290`

---

## 🧩 Page Components

### Main Page Component

**File**: `/src/app/salon/services/page.tsx` (2,108 lines)

**Key Features**:
- ✅ KPI cards: Total services, active count, revenue potential, average duration
- ✅ Category management section with color-coded badges
- ✅ Unified filter banner (search, tabs, location, category, sort, view mode)
- ✅ Excel/CSV import with professional templates
- ✅ Excel export with branch name resolution
- ✅ Smart delete with automatic archive fallback
- ✅ Enterprise error logging and user feedback

**Component Structure**:

```tsx
export default function SalonServicesPage() {
  return (
    <StatusToastProvider>
      <SalonServicesPageContent />
    </StatusToastProvider>
  )
}

function SalonServicesPageContent() {
  const {
    organization,
    currency,
    selectedBranchId,
    availableBranches
  } = useSecuredSalonContext()

  // State management
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [localBranchFilter, setLocalBranchFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('name_asc')

  // Fetch ALL services once (no filters)
  const { services: allServices, isLoading, error } = useHeraServices({
    organizationId: organization?.id,
    filters: { limit: 100 }
  })

  // Client-side filtering
  const services = useMemo(() => {
    return allServices.filter(/* apply filters */)
  }, [allServices, includeArchived, localBranchFilter, categoryFilter])

  // ... CRUD handlers, import/export, filtering
}
```

**File Path**: `/src/app/salon/services/page.tsx:2101`

---

### KPI Cards Section

**Purpose**: Display service catalog statistics

**Implementation**:

```tsx
// File: /src/app/salon/services/page.tsx:1294
<div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
  <SalonLuxeKPICard
    title="Total Services"
    value={totalServicesCount}
    icon={Sparkles}
    color={COLORS.bronze}
    description="Across all categories"
    animationDelay={0}
  />
  <SalonLuxeKPICard
    title="Active Services"
    value={activeCount}
    icon={Sparkles}
    color={COLORS.emerald}
    description="Ready to book"
    animationDelay={100}
    badge={`${((activeCount / totalServicesCount) * 100).toFixed(0)}%`}
  />
  <SalonLuxeKPICard
    title="Revenue Potential"
    value={`${currency} ${totalRevenue.toLocaleString()}`}
    icon={TrendingUp}
    color={COLORS.gold}
    description="Total catalog value"
    animationDelay={200}
    highlight
  />
  <SalonLuxeKPICard
    title="Avg Duration"
    value={formatDuration(avgDuration)}
    icon={Clock}
    color={COLORS.plum}
    description="Per service"
    animationDelay={300}
  />
</div>
```

**KPI Calculations**:

```tsx
// File: /src/app/salon/services/page.tsx:1072
// Always use unfiltered data for global metrics
const totalServicesCount = useMemo(
  () => allServicesForKPIs?.length || 0,
  [allServicesForKPIs]
)

const activeCount = useMemo(
  () => allServicesForKPIs?.filter(s => s.status === 'active').length || 0,
  [allServicesForKPIs]
)

const totalRevenue = useMemo(
  () => allServicesForKPIs
    ?.filter(s => s.status === 'active')
    .reduce((sum, s) => sum + (s.price_market || s.price || 0), 0) || 0,
  [allServicesForKPIs]
)
```

**File Path**: `/src/app/salon/services/page.tsx:1072-1107`

---

### Category Management Section

**Purpose**: Visual category organization with edit/delete actions

**Implementation**:

```tsx
// File: /src/app/salon/services/page.tsx:1230
{serviceCategories.length > 0 && (
  <div className="mb-6">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4" style={{ color: COLORS.gold }} />
        <h3 className="text-sm font-semibold" style={{ color: COLORS.champagne }}>
          Categories ({serviceCategories.length})
        </h3>
      </div>
    </div>
    <div className="flex flex-wrap gap-2">
      {serviceCategories.map((category) => (
        <div
          key={category.id}
          className="group relative px-3 py-1.5 rounded-lg border"
          style={{
            backgroundColor: category.color + '15',
            borderColor: category.color + '40',
            color: COLORS.champagne
          }}
        >
          <div className="flex items-center gap-1.5">
            <button onClick={() => handleEditCategory(category)}>
              <Tag className="w-3 h-3" style={{ color: category.color }} />
              <span className="text-xs font-medium">{category.entity_name}</span>
              {category.service_count > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: category.color + '30' }}>
                  {category.service_count}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setCategoryToDelete(category)
                setCategoryDeleteDialogOpen(true)
              }}
              className="opacity-0 group-hover:opacity-100 hover:text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

**Features**:
- Color-coded visual organization
- Service count badges
- Click to edit category
- Hover to reveal delete button
- Prevents deletion if category has services

**File Path**: `/src/app/salon/services/page.tsx:1230-1291`

---

### Unified Filter Banner

**Purpose**: All filtering controls in one compact section

**Layout**:
```
┌────────────────────────────────────────────────┐
│ [Search Bar - Full Width]                     │
├────────────────────────────────────────────────┤
│ [Active/All Tabs] [Location] [Category]  [Sort] [Grid/List] │
└────────────────────────────────────────────────┘
```

**Implementation**:

```tsx
// File: /src/app/salon/services/page.tsx:1369
<div className="p-4 rounded-xl mb-6" style={{ backgroundColor: COLORS.charcoalLight }}>
  {/* Row 1: Search */}
  <div className="mb-4">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search services by name or code..."
        className="w-full pl-10 pr-10 py-2.5 rounded-lg"
      />
    </div>
  </div>

  {/* Row 2: Filters and Controls */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    {/* Left: Tabs, Location, Category */}
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <Tabs value={includeArchived ? 'all' : 'active'}>
        <TabsList>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="all">All Services</TabsTrigger>
        </TabsList>
      </Tabs>

      <Select value={localBranchFilter || '__ALL__'}>
        <SelectTrigger className="w-52">
          <MapPin className="h-4 w-4" />
          <SelectValue placeholder="All Locations" />
        </SelectTrigger>
        {/* ... branch options */}
      </Select>

      <Select value={categoryFilter || '__ALL__'}>
        <SelectTrigger className="w-52">
          <Tag className="h-4 w-4" />
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        {/* ... category options */}
      </Select>
    </div>

    {/* Right: Sort and View Mode */}
    <div className="flex items-center gap-3">
      <Select value={sortBy} onValueChange={setSortBy}>
        {/* name_asc, name_desc, price_asc, price_desc, duration_asc, duration_desc */}
      </Select>

      <div className="flex items-center gap-1">
        <button onClick={() => setViewMode('grid')}>
          <Grid3X3 className="w-5 h-5" />
        </button>
        <button onClick={() => setViewMode('list')}>
          <List className="w-5 h-5" />
        </button>
      </div>
    </div>
  </div>
</div>
```

**File Path**: `/src/app/salon/services/page.tsx:1369-1555`

---

## 🎣 Hooks Reference

### useHeraServices Hook

**File**: `/src/hooks/useHeraServices.ts` (446 lines)

**Purpose**: Service-specific wrapper over Universal Entity v2 with category enrichment

**Signature**:

```tsx
export interface UseHeraServicesOptions {
  organizationId?: string
  filters?: {
    include_dynamic?: boolean
    include_relationships?: boolean
    limit?: number
    offset?: number
    status?: string
    search?: string
    branch_id?: string
    category_id?: string
  }
}

export function useHeraServices(options?: UseHeraServicesOptions): {
  services: ServiceEntity[]
  isLoading: boolean
  error: any
  refetch: () => void
  createService: (data: ServiceFormData) => Promise<any>
  updateService: (id: string, data: Partial<ServiceFormData>) => Promise<any>
  archiveService: (id: string) => Promise<any>
  restoreService: (id: string) => Promise<any>
  deleteService: (id: string) => Promise<{ success: boolean, archived: boolean, message?: string }>
  linkCategory: (serviceId: string, categoryId: string) => Promise<any>
  linkPerformedByRoles: (serviceId: string, roleIds: string[]) => Promise<any>
  calculateServicePrice: (service: any) => { price: number, commission: number, net: number, commission_rate: number }
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
}
```

**File Path**: `/src/hooks/useHeraServices.ts:1`

---

### Key Implementation Details

**1. Category Name Enrichment**:

```tsx
// File: /src/hooks/useHeraServices.ts:106
const servicesWithCategory = useMemo(() => {
  return (services as ServiceEntity[]).map(service => {
    // Extract category ID from HAS_CATEGORY relationship
    const categoryRels = service.relationships?.HAS_CATEGORY
    let categoryId = null

    if (Array.isArray(categoryRels) && categoryRels.length > 0) {
      categoryId = categoryRels[0].to_entity_id || categoryRels[0].to_entity?.id
    }

    // Lookup category name from categories list
    if (categoryId && categories) {
      const category = categories.find(c => c.id === categoryId)
      categoryName = category?.entity_name || null
    }

    // Flatten dynamic fields
    const flattenedService = { ...service, category: categoryName }
    if (service.dynamic_fields) {
      Object.entries(service.dynamic_fields).forEach(([key, field]) => {
        if (field && 'value' in field) {
          flattenedService[key] = field.value
        }
      })
    }

    return flattenedService
  })
}, [services, categories])
```

**Purpose**: Enrich services with category names for display

**File Path**: `/src/hooks/useHeraServices.ts:106-149`

---

**2. Branch Filtering via AVAILABLE_AT Relationships**:

```tsx
// File: /src/hooks/useHeraServices.ts:152
const filteredServices = useMemo(() => {
  let filtered = servicesWithCategory

  // Filter by branch if specified
  if (options?.filters?.branch_id) {
    filtered = filtered.filter(s => {
      const availableAtRelationships = s.relationships?.AVAILABLE_AT
      if (!availableAtRelationships) return false

      if (Array.isArray(availableAtRelationships)) {
        return availableAtRelationships.some(
          rel => rel.to_entity?.id === options.filters?.branch_id ||
                 rel.to_entity_id === options.filters?.branch_id
        )
      } else {
        return availableAtRelationships.to_entity?.id === options.filters?.branch_id ||
               availableAtRelationships.to_entity_id === options.filters?.branch_id
      }
    })
  }

  // When branch_id is null: no filtering, return all organization services
  return filtered
}, [servicesWithCategory, options?.filters?.branch_id, options?.filters?.category_id])
```

**Purpose**: Filter services by branch availability relationship

**File Path**: `/src/hooks/useHeraServices.ts:152-202`

---

**3. Smart Delete with Archive Fallback**:

```tsx
// File: /src/hooks/useHeraServices.ts:335
const deleteService = async (id: string, reason?: string) => {
  const service = services.find(s => s.id === id)
  if (!service) throw new Error('Service not found')

  try {
    // Attempt hard delete first
    await baseDelete({
      entity_id: id,
      hard_delete: true,
      cascade: true,
      reason: reason || 'Permanently delete service'
    })

    return { success: true, archived: false }
  } catch (error: any) {
    // Check if error is due to foreign key constraint
    const is409Conflict =
      error.message?.includes('409') ||
      error.message?.includes('Conflict') ||
      error.message?.includes('referenced')

    if (is409Conflict) {
      // Fallback to soft delete (status='deleted')
      await baseUpdate({
        entity_id: id,
        entity_name: service.entity_name,
        status: 'deleted'
      })

      return {
        success: true,
        archived: true,
        message: 'Service is used in appointments or transactions and cannot be deleted. It has been marked as deleted instead.'
      }
    }

    throw error
  }
}
```

**Purpose**: Enterprise-grade delete with graceful fallback

**File Path**: `/src/hooks/useHeraServices.ts:335-390`

---

## 💾 Data Model

### ServiceEntity Interface

```tsx
export interface ServiceEntity {
  id: string
  entity_name: string
  entity_code?: string
  smart_code: string
  status: 'active' | 'archived' | 'deleted'

  // Dynamic fields (nested structure from database)
  dynamic_fields?: {
    price_market?: { value: number }
    duration_min?: { value: number }
    commission_rate?: { value: number }
    description?: { value: string }
    active?: { value: boolean }
    requires_booking?: { value: boolean }
  }

  // Flattened fields for easier access (populated by hook)
  price_market?: number
  duration_min?: number
  commission_rate?: number
  description?: string
  active?: boolean
  requires_booking?: boolean
  category?: string // Enriched from HAS_CATEGORY relationship

  // Relationships
  relationships?: {
    HAS_CATEGORY?: { to_entity_id: string, to_entity?: any }
    AVAILABLE_AT?: Array<{ to_entity_id: string, to_entity?: any }>
    PERFORMED_BY_ROLE?: Array<{ to_entity_id: string, to_entity?: any }>
    REQUIRES_PRODUCT?: Array<{ to_entity_id: string, to_entity?: any }>
  }

  created_at: string
  updated_at: string
}
```

**File Path**: `/src/hooks/useHeraServices.ts:14-33`

---

### Sacred Six Storage

**Table: `core_entities`**

```sql
INSERT INTO core_entities (
  entity_type,
  entity_name,
  entity_code,
  smart_code,
  status,
  organization_id
) VALUES (
  'SERVICE',
  'Premium Haircut',
  'SVC-001',
  'HERA.SALON.SERVICE.ENTITY.SERVICE.v1',
  'active',
  'org-uuid'
)
```

**Table: `core_dynamic_data`**

```sql
-- Price field
INSERT INTO core_dynamic_data (
  entity_id,
  field_name,
  field_value_number,
  field_type,
  smart_code,
  organization_id
) VALUES (
  'service-uuid',
  'price_market',
  150.00,
  'number',
  'HERA.SALON.SERVICE.FIELD.PRICE_MARKET.V1',
  'org-uuid'
)

-- Duration field
INSERT INTO core_dynamic_data (
  entity_id,
  field_name,
  field_value_number,
  field_type,
  smart_code,
  organization_id
) VALUES (
  'service-uuid',
  'duration_min',
  60,
  'number',
  'HERA.SALON.SERVICE.FIELD.DURATION_MIN.V1',
  'org-uuid'
)
```

**Table: `core_relationships`**

```sql
-- Category relationship
INSERT INTO core_relationships (
  source_entity_id,
  target_entity_id,
  relationship_type,
  organization_id
) VALUES (
  'service-uuid',
  'category-uuid',
  'HAS_CATEGORY',
  'org-uuid'
)

-- Branch availability (multiple branches)
INSERT INTO core_relationships (
  source_entity_id,
  target_entity_id,
  relationship_type,
  organization_id
) VALUES
  ('service-uuid', 'branch-1-uuid', 'AVAILABLE_AT', 'org-uuid'),
  ('service-uuid', 'branch-2-uuid', 'AVAILABLE_AT', 'org-uuid')
```

---

## 📊 Excel Import/Export

### Excel Template Download

**Purpose**: Professional template with instructions and validation

**Implementation**:

```tsx
// File: /src/app/salon/services/page.tsx:530
const handleDownloadTemplate = useCallback(async () => {
  // Dynamically import xlsx (browser-only)
  const XLSX = await import('xlsx')

  // Create workbook
  const wb = XLSX.utils.book_new()

  // ===== INSTRUCTIONS SHEET =====
  const instructionsData = [
    ['HERA Services Import Template'],
    [''],
    ['⚠️ IMPORTANT: CREATE CATEGORIES & BRANCHES FIRST'],
    ['INSTRUCTIONS:'],
    ['1. Fill in the "Services Data" sheet with your services'],
    ['2. Required field: Name (marked with *)'],
    ['3. Optional fields: Code, Category, Price, Duration, Status, Branches, Description, Requires Booking'],
    ['4. Category must match existing category names exactly'],
    ['5. Branch names must match existing branch names exactly'],
    ['6. Multiple branches: Separate with semicolon (e.g., "Main Branch; Downtown")'],
    ['7. Status: Enter "active" or "archived"'],
    ['8. Requires Booking: Enter "Yes" or "No"'],
    [''],
    ['AVAILABLE CATEGORIES:'],
    ...serviceCategories.map(cat => [cat.entity_name]),
    [''],
    ['AVAILABLE BRANCHES:'],
    ...availableBranches.map(branch => [branch.entity_name]),
    [''],
    ['EXAMPLE SERVICE:'],
    ['Name*', 'Code', 'Category', 'Price', 'Duration (min)', 'Status', 'Branches', 'Description', 'Requires Booking'],
    ['Premium Cut & Style', 'SVC-001', 'Hair', 150, 60, 'active', 'Main Branch; Downtown', 'Professional haircut', 'Yes']
  ]

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData)
  XLSX.utils.book_append_sheet(wb, instructionsSheet, 'Instructions')

  // ===== DATA SHEET (Headers only) =====
  const headers = ['Name*', 'Code', 'Category', 'Price', 'Duration (min)', 'Status', 'Branches', 'Description', 'Requires Booking']
  const dataSheet = XLSX.utils.aoa_to_sheet([headers])
  XLSX.utils.book_append_sheet(wb, dataSheet, 'Services Data')

  // Download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'services-import-template.xlsx'
  link.click()
}, [serviceCategories, availableBranches])
```

**Features**:
- Two-sheet workbook (Instructions + Data)
- Dynamic category/branch lists
- Example row with correct formatting
- Column width optimization

**File Path**: `/src/app/salon/services/page.tsx:530-648`

---

### Excel/CSV Import

**Purpose**: Bulk service creation with validation

**Implementation**:

```tsx
// File: /src/app/salon/services/page.tsx:651
const handleImport = useCallback(async (file: File) => {
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

  let headers = []
  let rows = []

  if (isExcel) {
    const XLSX = await import('xlsx')
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    // Read from "Services Data" sheet or first sheet
    const sheetName = workbook.SheetNames.includes('Services Data')
      ? 'Services Data'
      : workbook.SheetNames[0]

    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

    headers = jsonData[0]
    rows = jsonData.slice(1).filter(row => row.some(cell => cell !== ''))
  } else {
    // CSV parsing
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    headers = parseLine(lines[0])
    rows = lines.slice(1).map(parseLine)
  }

  // Find column indexes
  const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name'))
  const codeIdx = headers.findIndex(h => h.toLowerCase().includes('code'))
  const categoryIdx = headers.findIndex(h => h.toLowerCase().includes('category'))
  const priceIdx = headers.findIndex(h => h.toLowerCase().includes('price'))
  const durationIdx = headers.findIndex(h => h.toLowerCase().includes('duration'))
  const branchesIdx = headers.findIndex(h => h.toLowerCase().includes('branch'))

  // Process rows
  for (const row of rows) {
    const name = String(row[nameIdx] || '').trim()
    if (!name) continue

    // Parse category - find category ID by name
    let categoryId = undefined
    if (categoryIdx !== -1 && row[categoryIdx]) {
      const categoryName = String(row[categoryIdx]).trim()
      const category = serviceCategories.find(
        c => c.entity_name?.toLowerCase() === categoryName.toLowerCase()
      )
      categoryId = category?.id
    }

    // Parse branches - find branch IDs by names
    let branchIds = []
    if (branchesIdx !== -1 && row[branchesIdx]) {
      const branchNames = String(row[branchesIdx]).split(';').map(b => b.trim())
      branchIds = branchNames
        .map(bName => availableBranches.find(b => b.entity_name?.toLowerCase() === bName.toLowerCase())?.id)
        .filter(id => !!id)
    }

    // Default to all branches if none specified
    if (branchIds.length === 0) {
      branchIds = availableBranches.map(b => b.id)
    }

    await createService({
      name,
      code: codeIdx !== -1 ? String(row[codeIdx]).trim() : undefined,
      price_market: priceIdx !== -1 ? parseFloat(String(row[priceIdx] || '0')) : 0,
      duration_min: durationIdx !== -1 ? parseInt(String(row[durationIdx] || '0')) : 0,
      category_id: categoryId,
      branch_ids: branchIds
    })
  }
}, [serviceCategories, availableBranches, createService])
```

**Features**:
- Supports both Excel (.xlsx) and CSV
- Empty template validation (friendly UX)
- Category/branch name-to-ID mapping
- Default to all branches if none specified
- Progress indicator
- Detailed error reporting

**File Path**: `/src/app/salon/services/page.tsx:651-893`

---

### Excel Export

**Purpose**: Export all services with branch name resolution

**Implementation**:

```tsx
// File: /src/app/salon/services/page.tsx:896
const handleExport = useCallback(async () => {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  const headers = ['Name', 'Code', 'Category', 'Price', 'Duration (min)', 'Status', 'Branches', 'Description', 'Requires Booking']

  const rows = allServicesForKPIs.map(service => {
    // Extract branch names from AVAILABLE_AT relationships
    const availableAt = service.relationships?.AVAILABLE_AT || []
    const branchNames = Array.isArray(availableAt)
      ? availableAt
          .map(rel => {
            const branchId = rel.to_entity_id || rel.to_entity?.id
            return availableBranches.find(b => b.id === branchId)?.entity_name || ''
          })
          .filter(Boolean)
          .join('; ')
      : ''

    return [
      service.entity_name || '',
      service.entity_code || '',
      service.category || '',
      service.price_market || service.price || 0,
      service.duration_min || service.duration_minutes || 0,
      service.status || 'active',
      branchNames,
      service.description || '',
      service.requires_booking ? 'Yes' : 'No'
    ]
  })

  const wsData = [headers, ...rows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 30 }, { wch: 40 }, { wch: 18 }]

  XLSX.utils.book_append_sheet(wb, ws, 'Services Export')
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  // Download
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
  link.download = `services-export-${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
}, [allServicesForKPIs, availableBranches])
```

**Features**:
- Exports all services (not just filtered)
- Resolves branch IDs to names
- Professional column widths
- Timestamped filename

**File Path**: `/src/app/salon/services/page.tsx:896-991`

---

## 🔧 Common Tasks

### Task 1: Create a Service with Branch Availability

**Scenario**: Create a service available at specific branches

**Implementation**:

```tsx
const { createService } = useHeraServices({ organizationId })

const handleCreateService = async () => {
  await createService({
    name: 'Premium Haircut',
    code: 'SVC-001',
    price_market: 150.00,
    duration_min: 60,
    commission_rate: 0.5,
    description: 'Professional haircut with styling consultation',
    requires_booking: true,
    category_id: 'category-uuid',
    branch_ids: ['branch-1-uuid', 'branch-2-uuid'] // Multiple branches
  })
}
```

**Result**: Service created with AVAILABLE_AT relationships to specified branches

---

### Task 2: Filter Services by Branch

**Scenario**: Show only services available at a specific branch

**Implementation**:

```tsx
const { services } = useHeraServices({
  organizationId,
  filters: {
    branch_id: 'branch-uuid' // Only services with AVAILABLE_AT this branch
  }
})
```

---

### Task 3: Import Services from Excel

**Scenario**: Bulk import services with categories and branches

**Steps**:

1. Download template with current categories/branches
2. Fill in services data
3. Upload file

**Template Format**:

```csv
Name*,Code,Category,Price,Duration (min),Status,Branches,Description,Requires Booking
Premium Haircut,SVC-001,Hair,150,60,active,Main Branch; Downtown,Professional cut,Yes
Color Treatment,SVC-002,Hair,200,90,active,Main Branch,Full color service,Yes
```

**Result**: Services created with automatic category/branch ID mapping

---

## ⚠️ Known Issues

### Issue 1: SSR Crash with Static xlsx Import

**Problem**: `import * as XLSX from 'xlsx'` causes SSR crash (browser-only library)

**Symptom**: Next.js build fails with "Module not found" error

**Solution**: Dynamic import

```tsx
// ❌ WRONG - Causes SSR crash
import * as XLSX from 'xlsx'

// ✅ CORRECT - Dynamic import (browser-only)
const handleDownloadTemplate = async () => {
  const XLSX = await import('xlsx')
  // Use XLSX...
}
```

**File Path**: `/src/app/salon/services/page.tsx:22, 533, 665, 904`

**Status**: ✅ Fixed

---

### Issue 2: KPI Counts Not Matching Filtered List

**Problem**: When branch/category filter applied, KPIs still showed global totals (confusing UX)

**Solution**: Enterprise pattern - KPIs always show global metrics, filters control list only

```tsx
// ✅ ENTERPRISE PATTERN: KPIs = global metrics
const totalServicesCount = allServicesForKPIs?.length || 0

// Filters control list display only
const services = useMemo(() => {
  return allServices.filter(/* apply filters */)
}, [allServices, localBranchFilter, categoryFilter])
```

**Rationale**: Standard enterprise UX where dashboard KPIs show "big picture", filters provide "drill-down"

**File Path**: `/src/app/salon/services/page.tsx:1068-1107`

**Status**: ✅ Intentional design pattern

---

## 📖 Related Documentation

### Feature Documentation
- [DASHBOARD.md](./DASHBOARD.md) - Dashboard KPIs and period filtering
- [POINT-OF-SALE.md](./POINT-OF-SALE.md) - POS system and service selection
- [APPOINTMENTS.md](./APPOINTMENTS.md) - Appointment scheduling with services
- [CUSTOMERS.md](./CUSTOMERS.md) - Customer management
- [PRODUCTS.md](./PRODUCTS.md) - Product catalog (similar architecture)

### Technical Reference
- [HOOKS.md](./HOOKS.md) - Custom hooks reference (useUniversalEntityV1 pattern)
- [DATA-MODELS.md](./DATA-MODELS.md) - Sacred Six schema and Smart Codes
- [API-ROUTES.md](./API-ROUTES.md) - RPC functions and REST endpoints

### System Documentation
- [DEVELOPER-GUIDE.md](../DEVELOPER-GUIDE.md) - Main developer guide

---

## 🎯 Success Metrics

A service catalog feature is production-ready when:

- ✅ **All CRUD operations work**: Create, read, update, delete with proper error handling
- ✅ **Category system functional**: Create, edit, delete categories with service count validation
- ✅ **Branch filtering accurate**: Services filtered correctly by AVAILABLE_AT relationships
- ✅ **Excel import/export robust**: Template generation, bulk import, validation, error reporting
- ✅ **Smart delete safe**: Automatic archive fallback prevents data integrity issues
- ✅ **Mobile responsive**: Grid/list views work on 375px+ screens
- ✅ **KPIs accurate**: Global metrics calculated correctly from unfiltered data
- ✅ **E2E tests pass**: All service workflows covered

---

<div align="center">

**Built with HERA DNA** | **Services Module v1.0** | **Enterprise Ready**

[← Back to Developer Guide](../DEVELOPER-GUIDE.md) | [Customers →](./CUSTOMERS.md) | [Products →](./PRODUCTS.md)

</div>
