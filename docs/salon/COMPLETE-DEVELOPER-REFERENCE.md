# HERA Salon Module - Complete Developer Reference

> **Version**: 2.0 | **Last Updated**: January 2025 | **Status**: Production Ready

---

## 📚 Document Index

This consolidated reference brings together all documentation for the HERA Salon module, providing a comprehensive guide for developers, AI assistants, and technical stakeholders.

### 🎯 Quick Navigation

**Feature Documentation** (12 Guides)
- [Dashboard](#dashboard-module) - Revenue analytics, KPIs, appointment overview
- [Point of Sale](#point-of-sale-module) - Mobile-first checkout, payment processing
- [Appointments](#appointments-module) - Scheduling, availability, calendar management
- [Customers](#customers-module) - CRM, profiles, LTV tracking
- [Services](#services-module) - Service catalog, pricing, categories
- [Products](#products-module) - Inventory, retail sales, stock management
- [Inventory](#inventory-module) - Stock levels, transfers, purchase orders
- [Staff](#staff-management-module) - Team management, roles, commissions
- [Leave Management](#leave-management-module) - Time off, approvals, calendar
- [Reports](#reports-module) - Analytics, exports, business intelligence
- [Settings](#settings-module) - Configuration, preferences, integrations

**Technical Documentation** (9 Guides)
- [Hooks Reference](#hooks-reference) - Custom React hooks for data management
- [Data Models](#data-models) - Universal API v2, Sacred Six architecture
- [Authentication](#authentication) - Multi-tenant, actor-stamped operations
- [Mobile Layout](#mobile-layout) - Responsive design, iOS/Android patterns
- [Shared Components](#shared-components) - Reusable UI components
- [Performance](#performance-optimization) - Loading strategies, optimization
- [Testing](#testing-strategies) - Unit, integration, E2E testing
- [API Routes](#api-routes) - Universal API v2 endpoints, client SDK

**Master Guides**
- [Developer Guide](#developer-guide-overview) - Getting started, conventions
- [Architecture Overview](#architecture-overview) - System design, patterns

---

## 🚀 Quick Start

### For New Developers

**1. Read These First** (30 minutes):
- [Developer Guide Overview](#developer-guide-overview)
- [Architecture Overview](#architecture-overview)
- [Authentication](#authentication) - Understand multi-tenant context

**2. Set Up Your Environment** (15 minutes):
```bash
# Clone and install
git clone <repo-url>
cd heraerp-dev
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev

# Open http://localhost:3000
```

**3. Build Your First Feature** (60 minutes):
- Follow [Appointments Module](#appointments-module) as a reference implementation
- Use [Hooks Reference](#hooks-reference) for data management
- Follow [Mobile Layout](#mobile-layout) patterns for UI

**4. Test Your Code** (30 minutes):
- Write tests following [Testing Strategies](#testing-strategies)
- Run `npm test` for unit tests
- Run `npm run test:e2e` for E2E tests

### For AI Assistants (Claude/GPT)

**When working on the Salon module, follow this pattern**:

1. **Check Authentication Context**:
   ```typescript
   const { user, organization, isAuthenticated } = useHERAAuth()
   if (!isAuthenticated || !organization?.id) return <Alert>Please log in</Alert>
   ```

2. **Use Universal API v2**:
   ```typescript
   import { getEntities, upsertEntity } from '@/lib/universal-api-v2-client'

   const { data } = await getEntities('', {
     p_organization_id: organization.id,
     p_entity_type: 'CUSTOMER',
     p_include_dynamic: true
   })
   ```

3. **Follow Mobile-First Design**:
   - Start with mobile layout (320px-768px)
   - Enhance progressively for desktop (>768px)
   - Use responsive utilities: `className="text-xl md:text-3xl lg:text-4xl"`

4. **Implement Progressive Loading**:
   ```typescript
   const [loadStage, setLoadStage] = useState(1)

   useEffect(() => {
     [2, 3, 4, 5].forEach((stage, index) => {
       setTimeout(() => setLoadStage(stage), index * 300)
     })
   }, [])
   ```

5. **Write Tests**:
   - Unit tests for business logic
   - Component tests for UI behavior
   - E2E tests for critical user flows

**See [Architecture Patterns](#common-architecture-patterns) for complete reference.**

---

## 📖 Documentation Structure

### Core Philosophy

The HERA Salon module follows these principles:

1. **Universal API v2**: All data operations through Sacred Six tables
2. **Multi-Tenant by Design**: Organization-scoped, actor-stamped operations
3. **Mobile-First**: Responsive design optimized for touch interfaces
4. **Progressive Enhancement**: Start fast, load features incrementally
5. **Type Safety**: Full TypeScript coverage with strict mode
6. **Test Coverage**: 70% unit, 20% integration, 10% E2E

### Documentation Categories

**Feature Guides** - User-facing functionality:
- Business requirements and user stories
- Component architecture and file structure
- Data models and relationships
- User interface patterns
- Testing considerations

**Technical Guides** - Developer infrastructure:
- System architecture and design patterns
- API contracts and data flow
- Performance optimization strategies
- Testing frameworks and patterns
- Security and authentication

---

## 🏗️ Architecture Overview

### Sacred Six Architecture

HERA uses a universal data model with **six core tables** that handle all business entities:

```
┌─────────────────────┐
│ core_organizations  │ → Tenant isolation
└─────────────────────┘
           │
           ├─────────────────────────┐
           ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐
│   core_entities     │   │ universal_transactions│
│ (customers, staff,  │   │ (appointments, sales,│
│  services, products)│   │  payments, expenses) │
└─────────────────────┘   └─────────────────────┘
           │                         │
           ▼                         ▼
┌─────────────────────┐   ┌──────────────────────────┐
│ core_dynamic_data   │   │ universal_transaction_   │
│ (flexible attributes)│   │ lines (line items)       │
└─────────────────────┘   └──────────────────────────┘
           │
           ▼
┌─────────────────────┐
│ core_relationships  │
│ (entity connections)│
└─────────────────────┘
```

**Key Principles**:
- **No Schema Changes**: Never add tables or columns
- **Dynamic Fields**: Business attributes in `core_dynamic_data`
- **Smart Codes**: Every entity has HERA DNA code (e.g., `HERA.SALON.CUSTOMER.v1`)
- **Organization Isolation**: Sacred `organization_id` boundary
- **Actor Stamping**: Every write records WHO made the change

### Technology Stack

**Frontend**:
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript 5+ (strict mode)
- **UI Library**: React 18+ with Suspense
- **Styling**: Tailwind CSS 3+ (mobile-first)
- **State Management**: React Query v5 (server state)
- **Forms**: React Hook Form + Zod validation
- **Testing**: Vitest (unit) + Playwright (E2E)

**Backend**:
- **Database**: PostgreSQL (Supabase)
- **API Layer**: Universal API v2 (Next.js API routes)
- **RPC Functions**: Postgres functions (actor-stamped CRUD)
- **Authentication**: Supabase Auth (JWT tokens)
- **Real-time**: Supabase Realtime (WebSocket)

**Design System**:
- **Theme**: Luxe Salon (champagne/gold/charcoal palette)
- **Icons**: Lucide React (tree-shakeable)
- **Components**: Radix UI (accessible primitives)
- **Typography**: Inter (primary), Playfair Display (headings)

### Project Structure

```
heraerp-dev/
├── src/
│   ├── app/
│   │   ├── salon/                    # Salon module routes
│   │   │   ├── dashboard/
│   │   │   ├── pos/
│   │   │   ├── appointments/
│   │   │   ├── customers/
│   │   │   ├── services/
│   │   │   ├── products/
│   │   │   ├── inventory/
│   │   │   ├── staff/
│   │   │   ├── leave/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   └── api/
│   │       └── v2/                   # Universal API v2 endpoints
│   ├── components/
│   │   ├── salon/                    # Salon-specific components
│   │   │   ├── shared/               # Shared salon components
│   │   │   ├── dashboard/
│   │   │   ├── pos/
│   │   │   ├── appointments/
│   │   │   ├── customers/
│   │   │   └── ...                   # Feature-specific components
│   │   └── ui/                       # Base UI primitives
│   ├── hooks/
│   │   ├── useHeraCustomers.ts       # Customer management
│   │   ├── useHeraAppointments.ts    # Appointment scheduling
│   │   ├── useHeraServices.ts        # Service catalog
│   │   ├── useHeraProducts.ts        # Product management
│   │   └── ...                       # Feature-specific hooks
│   ├── lib/
│   │   ├── universal-api-v2-client.ts # Universal API SDK
│   │   ├── supabase/                 # Supabase client
│   │   └── utils/                    # Utility functions
│   └── types/
│       └── hera-database.types.ts    # TypeScript types
├── tests/
│   ├── unit/                         # Vitest unit tests
│   ├── integration/                  # Integration tests
│   └── e2e/                          # Playwright E2E tests
└── docs/
    └── salon/                        # This documentation
```

### Data Flow Architecture

**Read Operations**:
```
User Action → Component → React Query Hook → API v2 Client →
Next.js API Route → Supabase RPC Function → PostgreSQL →
Response Cache → Component Re-render
```

**Write Operations**:
```
User Action → Component → API v2 Client (with auth headers) →
Next.js API Route (verify auth) → Actor Context Resolution →
Supabase RPC Function (actor-stamped) → PostgreSQL (with RLS) →
Audit Trail → Cache Invalidation → Optimistic UI Update
```

**Authentication Flow**:
```
Login → Supabase Auth → JWT Token → Session Storage →
Organization Context → Actor Resolution →
API Requests (with Bearer token + x-hera-org header)
```

---

## 🎯 Feature Modules

### Dashboard Module

**Purpose**: Central command center showing salon performance metrics, today's appointments, revenue analytics, and quick actions.

**Key Features**:
- Real-time KPI cards (revenue, appointments, customers)
- Daily appointment timeline with status indicators
- Revenue trends with period-over-period comparison
- Staff performance metrics
- Quick action buttons (new appointment, POS)

**Technical Highlights**:
- **Progressive Loading**: 5-stage loading pattern (0ms, 300ms, 600ms, 900ms, 1200ms)
- **Performance**: Lighthouse score >90, LCP <2.5s
- **Caching**: React Query with 5-minute staleTime
- **Mobile-First**: Touch-friendly tiles, responsive grids

**File Location**: `/src/app/salon/dashboard/page.tsx`

**Key Components**:
- `SalonDashboardPage` - Main dashboard container
- `HeroMetrics` - KPI cards (Stage 1 - 0ms)
- `AppointmentAnalytics` - Daily timeline (Stage 2 - 300ms)
- `RevenueAnalytics` - Revenue charts (Stage 3 - 600ms)
- `StaffPerformance` - Staff metrics (Stage 4 - 900ms)
- `QuickActions` - Action buttons (Stage 5 - 1200ms)

**Data Dependencies**:
- `useHeraAppointments()` - Today's appointments
- `useHeraTransactions()` - Revenue data
- `useHeraCustomers()` - Customer counts
- `useHeraStaff()` - Staff performance

**Complete Documentation**: See [DASHBOARD.md](./feature/DASHBOARD.md)

---

### Point of Sale Module

**Purpose**: Mobile-first checkout experience for walk-ins and retail sales with cart management, payment processing, and receipt generation.

**Key Features**:
- Touch-optimized product/service selection
- Real-time cart calculations (subtotal, tax, total)
- Multiple payment methods (cash, card, split)
- Digital receipt generation
- Customer association and loyalty

**Technical Highlights**:
- **Mobile-First**: 44px touch targets, thumb-zone optimization
- **State Management**: React Hook Form with Zod validation
- **Payment Processing**: Integrated payment gateway support
- **Offline Support**: Local cart persistence with IndexedDB
- **Performance**: < 1s checkout flow completion

**File Location**: `/src/app/salon/pos/page.tsx`

**Key Components**:
- `POSCheckout` - Main POS interface
- `ProductServiceSelector` - Item selection grid
- `CartSummary` - Real-time cart display
- `PaymentDialog` - Payment method selection
- `ReceiptGenerator` - Digital receipt

**Data Dependencies**:
- `useHeraProducts()` - Product catalog with stock
- `useHeraServices()` - Service catalog with pricing
- `useHeraCustomers()` - Customer lookup
- Transaction creation via `upsertTransaction()`

**Complete Documentation**: See [POINT-OF-SALE.md](./feature/POINT-OF-SALE.md)

---

### Appointments Module

**Purpose**: Complete appointment scheduling system with calendar view, availability checking, staff assignment, and booking management.

**Key Features**:
- Interactive calendar (day/week/month views)
- Real-time availability checking
- Staff assignment with skills matching
- Customer booking history
- SMS/email reminders
- Status workflow (pending → confirmed → completed → no-show)

**Technical Highlights**:
- **Calendar Engine**: Custom-built with timezone support
- **Availability Algorithm**: Complex slot calculation with staff schedules
- **Real-time Updates**: Supabase Realtime for multi-user coordination
- **Mobile Optimization**: Touch-friendly date pickers, time slots
- **Performance**: Virtualized calendar for large date ranges

**File Location**: `/src/app/salon/appointments/page.tsx`

**Key Components**:
- `AppointmentCalendar` - Main calendar interface
- `AppointmentForm` - Booking creation/edit form
- `AvailabilityChecker` - Real-time slot availability
- `StaffSelector` - Staff assignment with skills
- `CustomerLookup` - Customer search and selection

**Data Dependencies**:
- `useHeraAppointments()` - Appointment CRUD operations
- `useHeraStaff()` - Staff availability and skills
- `useHeraServices()` - Service catalog with durations
- `useHeraCustomers()` - Customer profiles

**Complete Documentation**: See [APPOINTMENTS.md](./feature/APPOINTMENTS.md)

---

### Customers Module

**Purpose**: Comprehensive CRM system for customer profile management, visit history, LTV tracking, and relationship management.

**Key Features**:
- Customer profiles with contact information
- Visit history and service preferences
- Lifetime value (LTV) calculation
- Customer segmentation and tags
- Referral tracking
- Preferred stylist assignment
- Notes and custom fields

**Technical Highlights**:
- **LTV Calculation**: Real-time calculation service with caching
- **Search Performance**: Debounced search with fuzzy matching
- **Relationship Management**: PREFERRED_STYLIST, REFERRED_BY relationships
- **Data Privacy**: GDPR-compliant data handling
- **Mobile-First**: Card-based customer list, quick actions

**File Location**: `/src/app/salon/customers/page.tsx`

**Key Components**:
- `CustomerList` - Paginated customer grid with search
- `CustomerProfile` - Detailed customer view
- `CustomerForm` - Create/edit customer form
- `CustomerLTV` - LTV calculation display
- `VisitHistory` - Appointment and transaction history

**Data Dependencies**:
- `useHeraCustomers()` - Customer CRUD operations
- `useHeraTransactions()` - Purchase history for LTV
- `useHeraAppointments()` - Visit history
- Relationship queries for preferences

**Complete Documentation**: See [CUSTOMERS.md](./feature/CUSTOMERS.md)

---

### Services Module

**Purpose**: Service catalog management with pricing, durations, categories, and staff assignment capabilities.

**Key Features**:
- Service catalog with hierarchical categories
- Dynamic pricing (base price, variations)
- Duration management (standard, minimum, maximum)
- Staff skill mapping
- Service bundles and packages
- Commission rules per service
- Active/inactive status management

**Technical Highlights**:
- **Dynamic Pricing**: Flexible pricing in `core_dynamic_data`
- **Category Hierarchy**: Tree structure using relationships
- **Performance**: Lazy-loaded service list with infinite scroll
- **Validation**: Zod schemas for pricing and duration rules
- **Mobile-First**: Card-based service grid

**File Location**: `/src/app/salon/services/page.tsx`

**Key Components**:
- `ServiceList` - Service catalog grid with categories
- `ServiceForm` - Create/edit service form
- `ServicePricing` - Dynamic pricing configuration
- `ServiceStaffMapping` - Staff skill assignment
- `CategoryManager` - Category hierarchy management

**Data Dependencies**:
- `useHeraServices()` - Service CRUD operations
- `useHeraStaff()` - Staff for skill mapping
- Dynamic data queries for pricing/duration
- Relationship queries for categories

**Complete Documentation**: See [SERVICES.md](./feature/SERVICES.md)

---

### Products Module

**Purpose**: Retail product catalog management with inventory tracking, pricing, stock alerts, and multi-branch support.

**Key Features**:
- Product catalog with categories
- Multi-branch stock tracking
- Purchase price and retail price management
- Low stock alerts and reorder points
- Barcode/SKU management
- Supplier tracking
- Product images and descriptions

**Technical Highlights**:
- **Stock Tracking**: Real-time stock levels per branch
- **Multi-Branch**: Branch-specific stock via relationships
- **Price Management**: Dynamic pricing with cost tracking
- **Performance**: Optimized stock queries with GIN indexes
- **Mobile-First**: Product cards with stock badges

**File Location**: `/src/app/salon/products/page.tsx`

**Key Components**:
- `ProductList` - Product grid with stock indicators
- `ProductForm` - Create/edit product form
- `BranchStockManager` - Multi-branch stock management
- `ProductPricing` - Price and cost configuration
- `StockAlerts` - Low stock notification system

**Data Dependencies**:
- `useHeraProducts()` - Product CRUD operations
- `useHeraStockLevels()` - Stock tracking per branch
- Dynamic data for pricing and stock thresholds
- Relationship queries for suppliers and branches

**Complete Documentation**: See [PRODUCTS.md](./feature/PRODUCTS.md)

---

### Inventory Module

**Purpose**: Comprehensive inventory management with stock movements, transfers, purchase orders, and stock adjustments.

**Key Features**:
- Stock level tracking per branch
- Stock transfers between branches
- Purchase order management
- Stock adjustments (wastage, damage, theft)
- Stock take/audit functionality
- Supplier management
- Reorder automation

**Technical Highlights**:
- **Transaction-Based**: All movements via `universal_transactions`
- **Audit Trail**: Complete movement history with actor stamps
- **Multi-Branch**: Branch-specific stock with transfer support
- **Real-time**: Live stock updates with Supabase Realtime
- **Performance**: Optimized stock queries with materialized views

**File Location**: `/src/app/salon/inventory/page.tsx` (DRAFT)

**Key Components**:
- `InventoryDashboard` - Stock overview per branch
- `StockMovementForm` - Record stock movements
- `TransferManager` - Inter-branch transfers
- `PurchaseOrderForm` - PO creation and receiving
- `StockAudit` - Stock take functionality

**Data Dependencies**:
- `useUnifiedInventory()` - Unified stock management
- `useHeraProducts()` - Product catalog
- Transaction operations for movements
- Relationship queries for branches and suppliers

**Status**: ⚠️ **DRAFT** - Core functionality implemented, documentation in progress

**Complete Documentation**: See [INVENTORY.md](./feature/INVENTORY.md)

---

### Staff Management Module

**Purpose**: Team management with roles, permissions, schedules, commissions, and performance tracking.

**Key Features**:
- Staff profiles with contact information
- Role-based permissions (admin, manager, stylist, receptionist)
- Work schedules and availability
- Commission calculation and tracking
- Performance metrics (revenue, bookings, ratings)
- Skills and certifications
- Time clock (check-in/check-out)

**Technical Highlights**:
- **Role Management**: Entity-based roles with dynamic permissions
- **Commission Engine**: Automated calculation with multiple models
- **Schedule Management**: Recurring schedules with exceptions
- **Performance Dashboard**: Real-time metrics with period comparison
- **Mobile-First**: Quick actions for common staff tasks

**File Location**: `/src/app/salon/staff/page.tsx`

**Key Components**:
- `StaffList` - Staff directory with role badges
- `StaffProfile` - Detailed staff information
- `StaffForm` - Create/edit staff form
- `ScheduleManager` - Work schedule configuration
- `CommissionDashboard` - Commission tracking and reports

**Data Dependencies**:
- `useHeraStaff()` - Staff CRUD operations
- `useHeraTransactions()` - Revenue for commission calculation
- `useHeraAppointments()` - Booking counts and ratings
- Dynamic data for schedules and permissions

**Complete Documentation**: See [STAFF.md](./feature/STAFF.md)

---

### Leave Management Module

**Purpose**: Staff time-off management with leave requests, approvals, balances, and calendar integration.

**Key Features**:
- Leave request submission
- Multi-level approval workflow
- Leave balance tracking by type (vacation, sick, personal)
- Calendar integration with appointment conflicts
- Leave policy configuration
- Accrual rules and carry-over
- Team leave calendar

**Technical Highlights**:
- **Workflow Engine**: Multi-step approval using relationships
- **Conflict Detection**: Automatic check against appointments
- **Balance Calculation**: Real-time accrual with policy rules
- **Calendar Integration**: Blocked time slots in appointment system
- **Notifications**: Email/SMS alerts for requests and approvals

**File Location**: `/src/app/salon/leave/page.tsx`

**Key Components**:
- `LeaveRequestForm` - Leave request submission
- `LeaveApprovalQueue` - Manager approval interface
- `LeaveBalanceDashboard` - Balance tracking per staff
- `LeaveCalendar` - Team leave visualization
- `LeavePolicyManager` - Policy configuration

**Data Dependencies**:
- Leave entities (stored as `LEAVE_REQUEST` entity type)
- `useHeraStaff()` - Staff information
- `useHeraAppointments()` - Conflict detection
- Relationship queries for approval workflow

**Complete Documentation**: See [LEAVE-MANAGEMENT.md](./feature/LEAVE-MANAGEMENT.md)

---

### Reports Module

**Purpose**: Business intelligence and reporting with pre-built reports, custom queries, data exports, and scheduled delivery.

**Key Features**:
- Revenue reports (daily, weekly, monthly)
- Staff performance reports
- Customer analytics (LTV, retention, segmentation)
- Service popularity and profitability
- Product sales and inventory reports
- Custom report builder
- Export to PDF/Excel/CSV
- Scheduled email delivery

**Technical Highlights**:
- **Report Engine**: SQL query builder with parameter substitution
- **Chart Library**: Recharts for interactive visualizations
- **Export Pipeline**: Server-side PDF generation with Puppeteer
- **Scheduling**: Cron-based report delivery
- **Performance**: Materialized views for complex aggregations

**File Location**: `/src/app/salon/reports/page.tsx`

**Key Components**:
- `ReportDashboard` - Report library and quick access
- `ReportBuilder` - Custom report creation
- `ReportViewer` - Report display with charts and tables
- `ExportManager` - Export format selection and generation
- `ScheduleManager` - Scheduled report configuration

**Data Dependencies**:
- Aggregated queries across all entity types
- `useHeraTransactions()` - Financial data
- `useHeraAppointments()` - Service data
- `useHeraCustomers()` - Customer analytics

**Complete Documentation**: See [REPORTS.md](./feature/REPORTS.md)

---

### Settings Module

**Purpose**: System configuration, salon preferences, integrations, and administrative controls.

**Key Features**:
- Business profile (name, address, contact)
- Branch management
- Business hours and holidays
- Tax configuration
- Payment gateway integration
- SMS/email provider settings
- Appointment settings (buffer times, cancellation policy)
- User preferences and theme

**Technical Highlights**:
- **Dynamic Configuration**: Settings stored in `core_dynamic_data`
- **Validation**: Zod schemas for all setting types
- **Multi-Branch**: Branch-specific overrides
- **Integration Testing**: Mock providers for development
- **Audit Trail**: All setting changes tracked

**File Location**: `/src/app/salon/settings/page.tsx`

**Key Components**:
- `SettingsDashboard` - Settings category navigation
- `BusinessProfileForm` - Company information
- `BranchManager` - Multi-branch configuration
- `IntegrationSettings` - Third-party integrations
- `AppointmentSettings` - Booking rules configuration

**Data Dependencies**:
- Organization settings via `useHERAAuth().organization`
- Dynamic data queries for all settings
- Branch entities for multi-branch setup

**Complete Documentation**: See [SETTINGS.md](./feature/SETTINGS.md)

---

## 🔧 Technical Guides

### Hooks Reference

**Purpose**: Custom React hooks providing data management, business logic, and side effects for Salon features.

**Core Hooks**:

#### `useHERAAuth()`
Authentication context and organization management.

```typescript
const {
  user,                    // Actor identity (WHO)
  organization,            // Organization context (WHERE)
  isAuthenticated,         // Session status
  contextLoading,          // Loading state
  sessionType             // 'demo' | 'real'
} = useHERAAuth()
```

#### `useHeraCustomers(options?)`
Customer management with LTV tracking.

```typescript
const {
  customers,              // Customer entities with dynamic data
  isLoading,             // Loading state
  refetch,               // Manual refetch function
  createCustomer,        // Create new customer
  updateCustomer,        // Update existing customer
  deleteCustomer         // Soft delete customer
} = useHeraCustomers({
  organizationId: org.id,
  filters: {
    branch_id?: string,
    status?: 'active' | 'inactive',
    search?: string
  },
  includeArchived: false
})
```

#### `useHeraAppointments(options?)`
Appointment scheduling and management.

```typescript
const {
  appointments,          // Appointment entities with relationships
  isLoading,
  createAppointment,     // Create new booking
  updateAppointment,     // Update existing booking
  cancelAppointment,     // Cancel booking
  checkAvailability      // Check staff/time slot availability
} = useHeraAppointments({
  organizationId: org.id,
  dateRange: {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31')
  },
  filters: {
    staff_id?: string,
    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  }
})
```

#### `useHeraServices()`
Service catalog management.

```typescript
const {
  services,              // Service entities with pricing
  categories,            // Service categories (tree structure)
  isLoading,
  createService,         // Create new service
  updateService,         // Update existing service
  deleteService          // Soft delete service
} = useHeraServices({
  organizationId: org.id,
  includeInactive: false
})
```

#### `useHeraProducts()`
Product catalog and stock management.

```typescript
const {
  products,              // Product entities with stock levels
  stockLevels,           // Current stock per branch
  lowStockProducts,      // Products below reorder point
  isLoading,
  createProduct,         // Create new product
  updateProduct,         // Update existing product
  adjustStock            // Record stock movement
} = useHeraProducts({
  organizationId: org.id,
  branch_id?: string,
  includeOutOfStock: false
})
```

#### `useHeraStaff()`
Staff management and performance tracking.

```typescript
const {
  staff,                 // Staff entities with roles
  activeStaff,           // Currently active staff
  isLoading,
  createStaff,           // Create new staff member
  updateStaff,           // Update staff information
  deactivateStaff        // Deactivate staff member
} = useHeraStaff({
  organizationId: org.id,
  includeInactive: false
})
```

#### `useUniversalEntityV1(options)`
Low-level entity hook (used by feature-specific hooks).

```typescript
const {
  entities,              // Raw entities from API
  isLoading,
  error,
  refetch,
  createEntity,
  updateEntity,
  deleteEntity
} = useUniversalEntityV1({
  entity_type: 'CUSTOMER',
  organizationId: org.id,
  filters: {
    include_dynamic: true,
    include_relationships: true,
    status: 'active',
    limit: 100,
    offset: 0
  }
})
```

**Hook Patterns**:
- All hooks return `isLoading` for loading states
- All mutations return promises with success/error handling
- React Query caching with 5-minute staleTime
- Automatic cache invalidation on mutations
- Organization context enforced automatically

**Complete Documentation**: See [HOOKS.md](./technical/HOOKS.md)

---

### Data Models

**Purpose**: Understanding the HERA Sacred Six universal data architecture and how business entities map to database tables.

**Sacred Six Tables**:

#### 1. `core_organizations`
Tenant isolation boundary - every query must filter by organization_id.

```typescript
interface CoreOrganizations {
  id: string                      // UUID primary key
  organization_name: string       // Display name
  organization_code: string       // Unique code
  organization_type?: string      // 'salon' | 'spa' | 'clinic'
  settings?: any                  // JSON configuration
  status?: string                 // 'active' | 'inactive'
  created_at: string
  updated_at: string
}
```

#### 2. `core_entities`
Universal entity storage - customers, staff, services, products, etc.

```typescript
interface CoreEntities {
  id: string                      // UUID primary key
  organization_id: string         // REQUIRED - tenant isolation
  entity_type: string             // 'CUSTOMER' | 'SERVICE' | 'PRODUCT' | 'STAFF'
  entity_name: string             // Display name
  entity_code?: string            // Unique code within org+type
  smart_code?: string             // HERA DNA code
  metadata?: any                  // JSON metadata
  status?: string                 // 'active' | 'inactive' | 'deleted'
  created_at: string
  updated_at: string
  created_by?: string             // Actor user ID
  updated_by?: string             // Actor user ID
}
```

**Smart Code Examples**:
- Customer: `HERA.SALON.CUSTOMER.v1`
- Service: `HERA.SALON.SERVICE.HAIRCUT.v1`
- Product: `HERA.SALON.PRODUCT.RETAIL.v1`
- Staff: `HERA.SALON.STAFF.STYLIST.v1`

#### 3. `core_dynamic_data`
Flexible attributes for entities - prices, descriptions, stock levels, etc.

```typescript
interface CoreDynamicData {
  id: string                      // UUID primary key
  organization_id: string         // REQUIRED - tenant isolation
  entity_id: string               // Parent entity ID
  field_name: string              // Attribute name (e.g., 'price', 'duration')
  field_type?: string             // 'text' | 'number' | 'boolean' | 'date' | 'json'
  field_value_text?: string       // Text value
  field_value_number?: number     // Numeric value
  field_value_boolean?: boolean   // Boolean value
  field_value_date?: string       // Date value
  field_value_json?: any          // JSON value
  smart_code?: string             // Field-level HERA DNA code
  is_searchable?: boolean         // Include in search indexes
  is_required?: boolean           // Validation flag
  created_at: string
  updated_at?: string
}
```

**Field Examples**:
- Service price: `{ field_name: 'price', field_value_number: 50.00, field_type: 'number' }`
- Service duration: `{ field_name: 'duration_minutes', field_value_number: 60, field_type: 'number' }`
- Product stock: `{ field_name: 'stock_quantity', field_value_number: 100, field_type: 'number' }`

#### 4. `core_relationships`
Connections between entities - preferred stylist, referrals, categories, etc.

```typescript
interface CoreRelationships {
  id: string                      // UUID primary key
  organization_id: string         // REQUIRED - tenant isolation
  from_entity_id: string          // Source entity (e.g., customer)
  to_entity_id: string            // Target entity (e.g., stylist)
  relationship_type: string       // 'PREFERRED_STYLIST' | 'REFERRED_BY' | 'CATEGORY_OF'
  relationship_direction?: string // 'unidirectional' | 'bidirectional'
  relationship_data?: any         // JSON metadata
  is_active?: boolean             // Active status
  effective_date?: string         // Start date
  expiration_date?: string        // End date (null = indefinite)
  created_at?: string
  updated_at?: string
}
```

**Relationship Examples**:
- Preferred stylist: `{ from_entity_id: customer_id, to_entity_id: staff_id, relationship_type: 'PREFERRED_STYLIST' }`
- Referral: `{ from_entity_id: customer_a_id, to_entity_id: customer_b_id, relationship_type: 'REFERRED_BY' }`
- Service category: `{ from_entity_id: service_id, to_entity_id: category_id, relationship_type: 'CATEGORY_OF' }`

#### 5. `universal_transactions`
Transactional data - appointments, sales, payments, expenses.

```typescript
interface UniversalTransactions {
  id: string                      // UUID primary key
  organization_id: string         // REQUIRED - tenant isolation
  transaction_type: string        // 'appointment' | 'sale' | 'payment' | 'expense'
  transaction_code?: string       // Generated code (e.g., 'APT-2025-00001')
  transaction_date: string        // Transaction timestamp
  source_entity_id?: string       // Source entity (e.g., customer)
  target_entity_id?: string       // Target entity (e.g., staff, branch)
  total_amount?: number           // Total transaction value
  transaction_status?: string     // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  smart_code?: string             // HERA DNA code
  metadata?: any                  // JSON metadata
  created_at: string
  updated_at?: string
  created_by?: string             // Actor user ID
  updated_by?: string             // Actor user ID
}
```

**Transaction Examples**:
- Appointment: `{ transaction_type: 'appointment', source_entity_id: customer_id, target_entity_id: staff_id, transaction_date: '2025-01-15T10:00:00Z' }`
- POS Sale: `{ transaction_type: 'sale', source_entity_id: customer_id, total_amount: 150.00, transaction_status: 'completed' }`

#### 6. `universal_transaction_lines`
Line items for transactions - services rendered, products sold, payment splits.

```typescript
interface UniversalTransactionLines {
  id: string                      // UUID primary key
  organization_id: string         // REQUIRED - tenant isolation
  transaction_id: string          // Parent transaction ID
  line_number: number             // Line sequence (1, 2, 3...)
  entity_id?: string              // Related entity (service, product)
  line_type?: string              // 'SERVICE' | 'PRODUCT' | 'PAYMENT' | 'DISCOUNT'
  description?: string            // Line description
  quantity?: number               // Quantity (default: 1)
  unit_amount?: number            // Price per unit
  line_amount: number             // Total line amount (quantity * unit_amount)
  discount_amount?: number        // Discount applied
  tax_amount?: number             // Tax amount
  smart_code?: string             // Line-level HERA DNA code
  created_at: string
  updated_at: string
}
```

**Line Examples**:
- Service line: `{ line_type: 'SERVICE', entity_id: service_id, quantity: 1, unit_amount: 50.00, line_amount: 50.00 }`
- Product line: `{ line_type: 'PRODUCT', entity_id: product_id, quantity: 2, unit_amount: 25.00, line_amount: 50.00 }`
- Payment line: `{ line_type: 'PAYMENT', description: 'Cash Payment', line_amount: 100.00 }`

**Data Model Principles**:
- **No Schema Changes**: Never add tables or columns - use dynamic data
- **Organization Isolation**: Every query filters by `organization_id`
- **Actor Stamping**: All writes record `created_by` and `updated_by`
- **Smart Codes**: HERA DNA codes for business context
- **Soft Deletes**: Use `status = 'deleted'` instead of hard deletes
- **Audit Trail**: Complete history via `created_at`, `updated_at`, actor stamps

**Complete Documentation**: See [DATA-MODELS.md](./technical/DATA-MODELS.md)

---

### Authentication

**Purpose**: Multi-tenant authentication system with organization context, actor resolution, and secure API access.

**Authentication Architecture**:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Browser    │────▶│  Supabase    │────▶│  Next.js     │
│              │     │  Auth        │     │  API Routes  │
│ Login Form   │     │              │     │              │
│              │◀────│  JWT Token   │◀────│  Verify Auth │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                     │
       │                    │                     │
       ▼                    ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Session     │     │  Org Context │     │  Actor       │
│  Storage     │     │  Resolution  │     │  Resolution  │
│              │     │              │     │              │
│ access_token │     │ x-hera-org   │     │ created_by   │
│ refresh_token│     │ header       │     │ updated_by   │
└──────────────┘     └──────────────┘     └──────────────┘
```

**Authentication Flow**:

1. **User Login** (`/auth/login`):
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email: 'user@example.com',
     password: 'password'
   })

   if (data.session) {
     // Session stored in localStorage
     // JWT token available for API calls
   }
   ```

2. **Organization Selection** (`/auth/organizations`):
   ```typescript
   // User may belong to multiple organizations
   const organizations = await getUserOrganizations(user.id)

   // User selects organization
   const selectedOrg = organizations[0]

   // Organization ID stored in session metadata
   await supabase.auth.updateUser({
     data: { organization_id: selectedOrg.id }
   })

   // Redirect to salon dashboard
   router.push('/salon/dashboard')
   ```

3. **Protected Route Access**:
   ```typescript
   // Every protected page uses HERAAuthProvider
   const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()

   // Three-layer security check
   if (!isAuthenticated) return <Alert>Please log in</Alert>
   if (contextLoading) return <LoadingSpinner />
   if (!organization?.id) return <Alert>No organization context</Alert>

   // Render protected content
   return <SalonDashboard />
   ```

4. **API Request with Auth**:
   ```typescript
   // Client SDK automatically includes auth headers
   const { data } = await getEntities('', {
     p_organization_id: organization.id,
     p_entity_type: 'CUSTOMER'
   })

   // Request headers:
   // Authorization: Bearer <jwt_token>
   // x-hera-org: <organization_id>
   ```

5. **Server-Side Auth Verification**:
   ```typescript
   // API routes verify auth and resolve actor
   export async function POST(request: NextRequest) {
     const authResult = await verifyAuth(request)
     if (!authResult || !authResult.organizationId) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
     }

     const { organizationId, id: userId } = authResult
     const actor = await buildActorContext(supabase, userId, organizationId)

     // Use actor_user_id in RPC calls
     const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
       p_action: 'CREATE',
       p_actor_user_id: actor.actor_user_id,
       p_organization_id: organizationId,
       // ... rest of params
     })
   }
   ```

**Session Management**:

```typescript
// Stable session retrieval with retry
async function waitForStableSession(maxAttempts = 3): Promise<Session | null> {
  const baseDelay = 100
  const { supabase } = await import('@/lib/supabase/client')

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (session?.access_token) {
      return session
    }

    if (attempt < maxAttempts) {
      const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  return null
}
```

**Authentication Errors**:

```typescript
// Automatic 401 redirect to login
if (res.status === 401) {
  const returnUrl = encodeURIComponent(window.location.pathname)
  window.location.href = `/auth/login?returnUrl=${returnUrl}`
  throw new Error('REDIRECTING_TO_LOGIN')
}
```

**Actor Context**:

```typescript
// Actor resolution from JWT
async function buildActorContext(
  supabase: SupabaseClient,
  authUserId: string,
  organizationId: string
) {
  // Find USER entity for authenticated user
  const { data: userEntities } = await supabase
    .from('core_entities')
    .select('id')
    .eq('entity_type', 'USER')
    .eq('organization_id', organizationId)
    .eq('metadata->>auth_user_id', authUserId)
    .single()

  return {
    actor_user_id: userEntities?.id || authUserId,
    auth_user_id: authUserId,
    organization_id: organizationId
  }
}
```

**Security Principles**:
- **JWT Tokens**: Supabase-issued tokens with organization claims
- **Organization Isolation**: Sacred `organization_id` boundary enforced
- **Actor Stamping**: Every write records WHO made the change
- **Row-Level Security**: PostgreSQL RLS policies enforce multi-tenancy
- **HTTPS Only**: All API communication encrypted
- **Token Refresh**: Automatic refresh before expiration

**Complete Documentation**: See [AUTHENTICATION.md](./technical/AUTHENTICATION.md)

---

### Mobile Layout

**Purpose**: Mobile-first responsive design patterns ensuring excellent user experience on iOS and Android devices.

**Mobile-First Principles**:

1. **Touch Targets**: Minimum 44px (iOS HIG standard)
2. **Responsive Typography**: Scale from mobile to desktop
3. **Progressive Enhancement**: Mobile base, desktop enhancements
4. **Native Patterns**: iOS/Android familiar interactions
5. **Performance**: Fast loading, smooth scrolling

**Responsive Breakpoints**:

```typescript
// Tailwind breakpoints (mobile-first)
const breakpoints = {
  sm: '640px',   // Small devices (landscape phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (desktops)
  xl: '1280px',  // Extra large devices
  '2xl': '1536px' // 2K displays
}
```

**Mobile Header Pattern**:

```tsx
{/* iOS-style status bar spacer - MANDATORY on mobile */}
<div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

{/* Mobile app header - MANDATORY */}
<div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20">
  <div className="flex items-center justify-between p-4">
    <div className="flex items-center gap-3">
      {/* Rounded app icon */}
      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-gold" />
      </div>
      {/* Title and subtitle */}
      <div>
        <h1 className="text-lg font-bold text-champagne">Dashboard</h1>
        <p className="text-xs text-bronze">Michele's Salon</p>
      </div>
    </div>
    {/* Touch-friendly action button */}
    <button className="min-w-[44px] min-h-[44px] rounded-full bg-gold/10 flex items-center justify-center active:scale-95">
      <Bell className="w-5 h-5 text-gold" />
    </button>
  </div>
</div>
```

**Bottom Navigation (Mobile)**:

```tsx
{/* Mobile bottom navigation - iOS/Android tab bar */}
<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-charcoal border-t border-gold/20">
  <div className="grid grid-cols-5 gap-1 p-2">
    {tabs.map(tab => (
      <Link
        key={tab.href}
        href={tab.href}
        className={`
          flex flex-col items-center justify-center
          min-h-[56px] rounded-lg
          active:scale-95 transition-transform
          ${isActive ? 'bg-gold/20 text-gold' : 'text-bronze'}
        `}
      >
        <tab.icon className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">{tab.label}</span>
      </Link>
    ))}
  </div>
  {/* iPhone safe area */}
  <div className="h-[env(safe-area-inset-bottom)]" />
</nav>
```

**Responsive Grid Pattern**:

```tsx
{/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3-4 columns */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => (
    <Card key={item.id} className="min-h-[120px]">
      {/* Card content */}
    </Card>
  ))}
</div>
```

**Responsive Typography**:

```tsx
{/* Progressive text scaling */}
<h1 className="text-xl md:text-3xl lg:text-4xl font-bold">Page Title</h1>
<h2 className="text-lg md:text-2xl lg:text-3xl font-semibold">Section Title</h2>
<p className="text-sm md:text-base lg:text-lg">Body text</p>
```

**Touch-Friendly Buttons**:

```tsx
{/* Minimum 44px touch targets with active feedback */}
<button className="
  min-w-[44px] min-h-[44px]
  px-6 py-3
  bg-gold text-black
  rounded-xl font-bold
  active:scale-95 transition-transform
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Book Appointment
</button>
```

**Mobile Card Pattern**:

```tsx
{/* Touch-friendly card with vertical layout */}
<div className="
  md:hidden
  bg-charcoal rounded-xl p-4
  border border-gold/20
  active:scale-[0.98] transition-transform
  cursor-pointer
">
  <div className="flex items-start justify-between mb-3">
    <div className="flex items-center gap-3">
      <Avatar src={customer.avatar} className="w-12 h-12" />
      <div>
        <h3 className="font-semibold text-champagne">{customer.name}</h3>
        <p className="text-sm text-bronze">{customer.phone}</p>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-gold" />
  </div>
  <div className="flex gap-2">
    <span className="px-3 py-1 bg-gold/20 text-gold text-xs rounded-full">
      VIP
    </span>
    <span className="px-3 py-1 bg-emerald/20 text-emerald text-xs rounded-full">
      {customer.visit_count} visits
    </span>
  </div>
</div>
```

**Desktop Table Pattern**:

```tsx
{/* Desktop: data table, Mobile: hidden (show cards instead) */}
<div className="hidden md:block overflow-x-auto">
  <table className="w-full">
    <thead>
      <tr className="border-b border-gold/20">
        <th className="px-4 py-3 text-left text-sm font-semibold text-champagne">
          Customer
        </th>
        <th className="px-4 py-3 text-left text-sm font-semibold text-champagne">
          Phone
        </th>
        <th className="px-4 py-3 text-left text-sm font-semibold text-champagne">
          Last Visit
        </th>
        <th className="px-4 py-3 text-right text-sm font-semibold text-champagne">
          Total Spent
        </th>
      </tr>
    </thead>
    <tbody>
      {customers.map(customer => (
        <tr key={customer.id} className="border-b border-gold/20 hover:bg-gold/5">
          <td className="px-4 py-3 text-sm text-champagne">{customer.name}</td>
          <td className="px-4 py-3 text-sm text-bronze">{customer.phone}</td>
          <td className="px-4 py-3 text-sm text-bronze">{customer.last_visit}</td>
          <td className="px-4 py-3 text-sm text-right text-gold">${customer.ltv}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Performance Optimization**:

```tsx
// Lazy load heavy components on mobile
const HeavyComponent = lazy(() => import('./HeavyComponent'))

// Progressive image loading
<Image
  src="/salon-hero.jpg"
  alt="Salon"
  width={800}
  height={600}
  priority={false} // Lazy load below fold
  placeholder="blur" // Show blur while loading
  sizes="(max-width: 768px) 100vw, 50vw" // Responsive sizes
/>
```

**Mobile-First Checklist**:
- [ ] All touch targets >= 44px
- [ ] Active state feedback (active:scale-95)
- [ ] Responsive typography (text-xl md:text-3xl)
- [ ] Responsive grids (grid-cols-1 md:grid-cols-2)
- [ ] iOS-style mobile header with status bar spacer
- [ ] Bottom navigation for mobile (md:hidden)
- [ ] Sidebar hidden on mobile (hidden md:block)
- [ ] Bottom spacing for comfortable scrolling
- [ ] Performance targets met (< 1.5s initial load)

**Complete Documentation**: See [MOBILE-LAYOUT.md](./technical/MOBILE-LAYOUT.md)

---

### Shared Components

**Purpose**: Reusable UI components providing consistent design and behavior across the Salon module.

**Component Categories**:

#### Layout Components

**`SalonLuxePage`** - Page container with consistent padding and max-width:
```tsx
<SalonLuxePage
  title="Dashboard"
  description="Salon performance overview"
  maxWidth="full"  // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding="lg"     // 'none' | 'sm' | 'md' | 'lg'
>
  {children}
</SalonLuxePage>
```

**`SalonRoleBasedDarkSidebar`** - Desktop navigation sidebar:
```tsx
<SalonRoleBasedDarkSidebar
  userRole="manager"  // 'admin' | 'manager' | 'stylist' | 'receptionist'
  currentPath="/salon/dashboard"
/>
```

**`SalonMobileBottomNav`** - Mobile bottom tab bar:
```tsx
<SalonMobileBottomNav
  userRole="manager"
  currentPath="/salon/dashboard"
/>
```

#### Data Display Components

**`HERAStatsCard`** - KPI card with icon and trend:
```tsx
<HERAStatsCard
  title="Today's Revenue"
  value="$1,250.00"
  icon={<DollarSign />}
  trend={{ value: 15.3, direction: 'up' }}
  color="gold"  // 'gold' | 'emerald' | 'rose' | 'champagne'
/>
```

**`CustomerCard`** - Customer profile card:
```tsx
<CustomerCard
  customer={{
    id: 'cust-123',
    name: 'John Doe',
    phone: '+1 555 0100',
    email: 'john@example.com',
    avatar: '/avatars/john.jpg',
    ltv: 1250.00,
    visit_count: 12,
    tags: ['VIP', 'Frequent']
  }}
  onClick={() => router.push(`/salon/customers/${customer.id}`)}
/>
```

**`AppointmentCard`** - Appointment card with status:
```tsx
<AppointmentCard
  appointment={{
    id: 'apt-123',
    customer_name: 'Jane Smith',
    service_name: 'Haircut & Style',
    staff_name: 'Maria',
    start_time: '2025-01-15T10:00:00Z',
    duration_minutes: 60,
    status: 'confirmed'
  }}
  onAction={(action) => handleAppointmentAction(action)}
/>
```

#### Form Components

**`SearchInput`** - Debounced search input:
```tsx
<SearchInput
  placeholder="Search customers..."
  value={searchTerm}
  onChange={setSearchTerm}
  debounceMs={300}
/>
```

**`DateRangePicker`** - Date range selection:
```tsx
<DateRangePicker
  startDate={startDate}
  endDate={endDate}
  onChange={(start, end) => {
    setStartDate(start)
    setEndDate(end)
  }}
  maxDate={new Date()}
/>
```

**`StaffSelector`** - Staff selection dropdown:
```tsx
<StaffSelector
  selectedStaffId={staffId}
  onChange={setStaffId}
  filterBySkills={['haircut', 'coloring']}
  showAvailabilityIndicator={true}
/>
```

#### Modal Components

**`ConfirmationDialog`** - Confirmation modal:
```tsx
<ConfirmationDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Cancel Appointment"
  description="Are you sure you want to cancel this appointment?"
  onConfirm={handleCancel}
  confirmText="Yes, Cancel"
  confirmVariant="destructive"
/>
```

**`FormModal`** - Generic form modal:
```tsx
<FormModal
  open={isOpen}
  onOpenChange={setIsOpen}
  title="New Customer"
  submitLabel="Create Customer"
  onSubmit={handleSubmit}
>
  <CustomerForm ref={formRef} />
</FormModal>
```

#### Loading Components

**`LoadingSkeleton`** - Content skeleton:
```tsx
<LoadingSkeleton
  variant="card"  // 'card' | 'list' | 'table'
  count={3}
/>
```

**`PageLoadingSpinner`** - Full page loading:
```tsx
<PageLoadingSpinner message="Loading dashboard..." />
```

#### Status Components

**`StatusBadge`** - Status indicator:
```tsx
<StatusBadge
  status="confirmed"  // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  variant="salon"     // 'salon' | 'payment' | 'stock'
/>
```

**`EmptyState`** - Empty state message:
```tsx
<EmptyState
  icon={<Calendar />}
  title="No Appointments"
  description="You don't have any appointments scheduled for today."
  action={
    <button onClick={() => router.push('/salon/appointments/new')}>
      Book Appointment
    </button>
  }
/>
```

**Component Conventions**:
- All components are TypeScript with full type definitions
- Props follow consistent naming (e.g., `onOpenChange` not `setOpen`)
- Mobile-first responsive design built-in
- Accessible by default (ARIA labels, keyboard navigation)
- Dark theme support (Luxe Salon palette)
- Loading states and error handling included

**Complete Documentation**: See [SHARED-COMPONENTS.md](./technical/SHARED-COMPONENTS.md)

---

### Performance Optimization

**Purpose**: Strategies and patterns for achieving excellent performance on mobile and desktop, with focus on perceived speed and user experience.

**Performance Targets**:

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| **Lighthouse Mobile** | > 90 | < 80 |
| **Lighthouse Desktop** | > 95 | < 90 |
| **LCP (Largest Contentful Paint)** | < 2.5s | > 4.0s |
| **FID (First Input Delay)** | < 100ms | > 300ms |
| **CLS (Cumulative Layout Shift)** | < 0.1 | > 0.25 |
| **TTI (Time to Interactive)** | < 3.8s | > 7.3s |
| **Bundle Size (First Load JS)** | < 200kb | > 300kb |
| **API Response Time (p95)** | < 500ms | > 1000ms |

**Progressive Loading Pattern** (Dashboard Example):

```typescript
export default function DashboardContent() {
  const [loadStage, setLoadStage] = useState(1)

  // Progressive component loading - staged at 0ms, 300ms, 600ms, 900ms, 1200ms
  useEffect(() => {
    if (organizationId) {
      const stages = [2, 3, 4, 5]
      stages.forEach((stage, index) => {
        setTimeout(() => {
          setLoadStage(stage)
        }, index * 300) // Load each stage 300ms apart
      })
    }
  }, [organizationId])

  return (
    <div className="space-y-8">
      {/* Stage 1: Hero Metrics - Load immediately (0ms) */}
      {loadStage >= 1 && (
        <Suspense fallback={<FastSkeleton />}>
          <HeroMetrics />
        </Suspense>
      )}

      {/* Stage 2: Appointment Analytics - Load at 300ms */}
      {loadStage >= 2 && (
        <Suspense fallback={<ComponentSkeleton />}>
          <AppointmentAnalytics />
        </Suspense>
      )}

      {/* Stage 3: Revenue Analytics - Load at 600ms */}
      {loadStage >= 3 && (
        <Suspense fallback={<ComponentSkeleton />}>
          <RevenueAnalytics />
        </Suspense>
      )}

      {/* Stage 4: Staff Performance - Load at 900ms */}
      {loadStage >= 4 && (
        <Suspense fallback={<ComponentSkeleton />}>
          <StaffPerformance />
        </Suspense>
      )}

      {/* Stage 5: Quick Actions - Load at 1200ms */}
      {loadStage >= 5 && (
        <Suspense fallback={<ComponentSkeleton />}>
          <QuickActions />
        </Suspense>
      )}
    </div>
  )
}
```

**Code Splitting with React.lazy()**:

```typescript
// Split heavy components
const PageHeader = lazy(() => import('./PageHeader'))
const FilterBar = lazy(() => import('./FilterBar'))
const ContentGrid = lazy(() => import('./ContentGrid'))
const DataTable = lazy(() => import('./DataTable'))

// Use with Suspense boundaries
export default function Page() {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <PageHeader />
      </Suspense>

      <Suspense fallback={<FilterSkeleton />}>
        <FilterBar />
      </Suspense>

      <Suspense fallback={<ContentSkeleton />}>
        <ContentGrid />
      </Suspense>
    </>
  )
}
```

**React Query Caching Strategy**:

```typescript
// Global React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes - data stays fresh
      cacheTime: 10 * 60 * 1000,       // 10 minutes - cache persists
      refetchOnWindowFocus: false,     // Don't refetch on tab switch
      refetchOnReconnect: false,       // Don't refetch on reconnect
      retry: 1,                        // Retry once on failure
    },
  },
})

// Feature-specific hook with caching
export function useHeraCustomers(options?: UseHeraCustomersOptions) {
  return useQuery({
    queryKey: ['hera-customers', options?.organizationId, options?.filters],
    queryFn: async () => {
      const { data } = await getEntities('', {
        p_organization_id: options?.organizationId,
        p_entity_type: 'CUSTOMER',
        p_include_dynamic: true,
        // ⚡ PERFORMANCE: Only fetch relationships when filtering by branch
        // This significantly improves initial page load (60% faster)
        p_include_relationships: !!(options?.filters?.branch_id)
      })
      return data
    },
    enabled: !!options?.organizationId,
    staleTime: 5 * 60 * 1000,
    select: (data) => {
      // Transform data client-side to reduce server load
      return data.map(transformCustomerEntity)
    }
  })
}
```

**Optimistic Updates**:

```typescript
// Update UI immediately, rollback on error
const mutation = useMutation({
  mutationFn: (customer: Customer) => upsertEntity('', {
    p_organization_id: organizationId,
    p_entity_type: 'CUSTOMER',
    ...customer
  }),
  onMutate: async (newCustomer) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['hera-customers'] })

    // Snapshot previous value
    const previousCustomers = queryClient.getQueryData(['hera-customers'])

    // Optimistically update cache
    queryClient.setQueryData(['hera-customers'], (old: any[]) => {
      return [...old, { ...newCustomer, id: 'temp-id' }]
    })

    // Return context for rollback
    return { previousCustomers }
  },
  onError: (err, newCustomer, context) => {
    // Rollback on error
    queryClient.setQueryData(['hera-customers'], context.previousCustomers)
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ['hera-customers'] })
  }
})
```

**Bundle Optimization** (next.config.mjs):

```javascript
const nextConfig = {
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },

  experimental: {
    // Optimize package imports (tree-shaking)
    optimizePackageImports: [
      'lucide-react',              // Icons
      '@tanstack/react-query',     // Data fetching
      'recharts',                  // Charts
      '@radix-ui/react-dialog',    // Modals
      '@radix-ui/react-dropdown-menu',
      'date-fns',
      'zod',
      // ... 40+ packages
    ],
    webVitalsAttribution: ['CLS', 'LCP'],
    optimizeCss: true
  },

  images: {
    formats: ['image/avif', 'image/webp'], // Modern formats
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  webpack(config, { dev, isServer }) {
    // Client-only optimizations
    if (!dev && !isServer) {
      config.optimization = {
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            lib: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'lib',
              priority: 30,
              reuseExistingChunk: true
            },
            ui: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'ui',
              priority: 20,
              reuseExistingChunk: true
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 10,
              reuseExistingChunk: true
            },
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true
            }
          }
        }
      }
    }
  }
}
```

**Image Optimization**:

```tsx
import Image from 'next/image'

// Responsive image with modern formats
<Image
  src="/salon-hero.jpg"
  alt="Salon Interior"
  width={1200}
  height={800}
  priority={false}              // Lazy load below fold
  placeholder="blur"            // Blur placeholder while loading
  blurDataURL={blurDataURL}    // Base64 blur
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  quality={85}                  // Balance quality/size
  loading="lazy"
/>
```

**Component Memoization**:

```typescript
// Memoize expensive components
const CustomerCard = React.memo(function CustomerCard({ customer }) {
  return (
    <div className="customer-card">
      {/* ... card content ... */}
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison - only re-render if customer changes
  return prevProps.customer.id === nextProps.customer.id &&
         prevProps.customer.updated_at === nextProps.customer.updated_at
})

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateCustomerLTV(transactions, appointments)
}, [transactions, appointments])

// Memoize callbacks to prevent child re-renders
const handleClick = useCallback((customerId: string) => {
  router.push(`/salon/customers/${customerId}`)
}, [router])
```

**Performance Monitoring**:

```typescript
// Web Vitals tracking
export function reportWebVitals(metric: NextWebVitalsMetric) {
  if (metric.label === 'web-vital') {
    console.log(`${metric.name}: ${metric.value}`)

    // Send to analytics
    analytics.track('web_vital', {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      label: metric.label
    })
  }
}
```

**Performance Checklist**:
- [ ] Progressive loading implemented (5-stage pattern)
- [ ] Code splitting with React.lazy() for heavy components
- [ ] React Query caching configured (5min staleTime)
- [ ] Optimistic updates for mutations
- [ ] Bundle optimization in next.config.mjs
- [ ] Image optimization with Next/Image
- [ ] Component memoization for expensive renders
- [ ] Web Vitals monitoring enabled
- [ ] Lighthouse scores > 90 (mobile), > 95 (desktop)

**Complete Documentation**: See [PERFORMANCE.md](./technical/PERFORMANCE.md)

---

### Testing Strategies

**Purpose**: Comprehensive testing approach ensuring code quality, preventing regressions, and maintaining high reliability.

**Testing Pyramid**:

```
        ┌──────────────┐
        │     E2E      │ 10% - Critical user flows
        │   Playwright │ (Appointments, Checkout, Reports)
        └──────────────┘
       ┌────────────────┐
       │  Integration   │ 20% - Component + API flows
       │   React Query  │ (Forms, Dashboards, Lists)
       └────────────────┘
     ┌──────────────────────┐
     │       Unit           │ 70% - Business logic, utilities
     │       Vitest         │ (Calculations, Validations, Hooks)
     └──────────────────────┘
```

**Coverage Targets**:
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

**Unit Testing with Vitest**:

```typescript
// tests/unit/lib/salon/availability.test.ts
import { describe, it, expect } from 'vitest'
import { checkSlotAvailability, generateTimeSlots } from '@/lib/salon/availability'

describe('Appointment Availability', () => {
  describe('checkSlotAvailability', () => {
    it('should return true for slot within working hours with no conflicts', () => {
      const slotStart = new Date('2025-01-15T10:00:00')
      const slotEnd = new Date('2025-01-15T11:00:00')
      const busyBlocks: Array<{ start: string; end: string }> = []
      const workingHours = { start: '09:00', end: '18:00' }

      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours))
        .toBe(true)
    })

    it('should return false for slot overlapping with busy block', () => {
      const slotStart = new Date('2025-01-15T10:30:00')
      const slotEnd = new Date('2025-01-15T11:30:00')
      const busyBlocks = [
        { start: '2025-01-15T10:00:00Z', end: '2025-01-15T11:00:00Z' }
      ]
      const workingHours = { start: '09:00', end: '18:00' }

      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours))
        .toBe(false)
    })

    it('should return false for slot outside working hours', () => {
      const slotStart = new Date('2025-01-15T08:00:00')
      const slotEnd = new Date('2025-01-15T09:00:00')
      const busyBlocks: Array<{ start: string; end: string }> = []
      const workingHours = { start: '09:00', end: '18:00' }

      expect(checkSlotAvailability(slotStart, slotEnd, busyBlocks, workingHours))
        .toBe(false)
    })
  })

  describe('generateTimeSlots', () => {
    it('should generate 15-minute slots for full day', () => {
      const date = new Date('2025-01-15')
      const workingHours = { start: '09:00', end: '17:00' }
      const slots = generateTimeSlots(date, workingHours, 15)

      expect(slots).toHaveLength(32) // 8 hours * 4 slots per hour
      expect(slots[0]).toEqual({
        start: new Date('2025-01-15T09:00:00'),
        end: new Date('2025-01-15T09:15:00')
      })
    })
  })
})
```

**Component Testing with React Testing Library**:

```typescript
// tests/unit/components/salon/customers/CustomerCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CustomerCard } from '@/components/salon/customers/CustomerCard'

describe('CustomerCard', () => {
  const mockCustomer = {
    id: 'cust-123',
    name: 'John Doe',
    phone: '+1 555 0100',
    email: 'john@example.com',
    ltv: 1250.00,
    visit_count: 12,
    tags: ['VIP']
  }

  it('should render customer information', () => {
    render(<CustomerCard customer={mockCustomer} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('+1 555 0100')).toBeInTheDocument()
    expect(screen.getByText('$1,250.00')).toBeInTheDocument()
    expect(screen.getByText('12 visits')).toBeInTheDocument()
  })

  it('should call onClick when card is clicked', () => {
    const handleClick = vi.fn()
    render(<CustomerCard customer={mockCustomer} onClick={handleClick} />)

    fireEvent.click(screen.getByText('John Doe'))

    expect(handleClick).toHaveBeenCalledWith(mockCustomer.id)
  })

  it('should render VIP badge for VIP customers', () => {
    render(<CustomerCard customer={mockCustomer} />)

    expect(screen.getByText('VIP')).toBeInTheDocument()
  })
})
```

**E2E Testing with Playwright**:

```typescript
// tests/e2e/salon/appointments.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Salon Appointments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/salon/appointments')
    await page.waitForLoadState('networkidle')
  })

  test('should create new appointment', async ({ page }) => {
    // Click new appointment button
    await page.getByRole('button', { name: /new appointment/i }).click()

    // Fill appointment form
    await page.getByLabel(/customer/i).fill('John Doe')
    await page.getByRole('option', { name: 'John Doe' }).click()

    await page.getByLabel(/service/i).click()
    await page.getByRole('option', { name: 'Haircut & Style' }).click()

    await page.getByLabel(/staff/i).click()
    await page.getByRole('option', { name: 'Maria' }).click()

    await page.getByLabel(/date/i).fill('2025-01-15')
    await page.getByLabel(/time/i).fill('10:00')

    // Submit form
    await page.getByRole('button', { name: /book appointment/i }).click()

    // Verify success
    await expect(page.getByText(/appointment created/i)).toBeVisible()
    await expect(page.getByText('John Doe')).toBeVisible()
    await expect(page.getByText('Haircut & Style')).toBeVisible()
  })

  test('should display appointment in calendar', async ({ page }) => {
    // Navigate to calendar view
    await page.getByRole('button', { name: /calendar/i }).click()

    // Find appointment card
    const appointment = page.locator('[data-testid="appointment-card"]').first()
    await expect(appointment).toBeVisible()
    await expect(appointment.getByText(/john doe/i)).toBeVisible()
  })

  test('should cancel appointment', async ({ page }) => {
    // Click on appointment
    await page.locator('[data-testid="appointment-card"]').first().click()

    // Click cancel button
    await page.getByRole('button', { name: /cancel/i }).click()

    // Confirm cancellation
    await page.getByRole('button', { name: /yes, cancel/i }).click()

    // Verify cancellation
    await expect(page.getByText(/appointment cancelled/i)).toBeVisible()
  })
})
```

**API Testing with Playwright**:

```typescript
// tests/e2e/api/customers.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Customers API', () => {
  let authToken: string
  let orgId: string

  test.beforeAll(async ({ request }) => {
    // Get auth token
    const loginResponse = await request.post('/api/auth/login', {
      data: { email: 'test@example.com', password: 'password' }
    })
    const loginData = await loginResponse.json()
    authToken = loginData.access_token
    orgId = loginData.organization_id
  })

  test('should list customers', async ({ request }) => {
    const response = await request.get(`/api/v2/entities`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-hera-org': orgId
      },
      params: {
        p_entity_type: 'CUSTOMER',
        p_organization_id: orgId
      }
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThan(0)
  })

  test('should create customer', async ({ request }) => {
    const response = await request.post('/api/v2/entities', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-hera-org': orgId,
        'Content-Type': 'application/json'
      },
      data: {
        entity_type: 'CUSTOMER',
        entity_name: 'Test Customer',
        smart_code: 'HERA.SALON.CUSTOMER.v1',
        organization_id: orgId,
        dynamic_fields: [
          { field_name: 'phone', field_value: '+1 555 0100', field_type: 'text' },
          { field_name: 'email', field_value: 'test@example.com', field_type: 'email' }
        ]
      }
    })

    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.data.id).toBeTruthy()
  })

  test('should enforce organization isolation', async ({ request }) => {
    // Try to access another organization's data
    const response = await request.get(`/api/v2/entities`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'x-hera-org': 'wrong-org-id'
      },
      params: {
        p_entity_type: 'CUSTOMER',
        p_organization_id: 'wrong-org-id'
      }
    })

    expect(response.status()).toBe(401)
  })
})
```

**Test Commands**:

```bash
# Unit tests with Vitest
npm run test                    # Run all unit tests
npm run test:watch             # Watch mode
npm run test:coverage          # Generate coverage report

# E2E tests with Playwright
npm run test:e2e               # Run all E2E tests
npm run test:e2e:ui            # Run with Playwright UI
npm run test:e2e:debug         # Run in debug mode
npm run test:e2e:chrome        # Run in Chrome only
npm run test:e2e:mobile        # Run mobile tests

# CI pipeline
npm run test:ci                # Run all tests for CI
```

**Testing Checklist**:
- [ ] Unit tests for business logic (70% coverage)
- [ ] Component tests for UI behavior
- [ ] E2E tests for critical user flows
- [ ] API tests for endpoint validation
- [ ] Mobile tests for touch interactions
- [ ] Accessibility tests with Axe Core
- [ ] Performance tests with Lighthouse CI

**Complete Documentation**: See [TESTING.md](./technical/TESTING.md)

---

### API Routes

**Purpose**: Complete reference for HERA Universal API v2 endpoints, client SDK usage, authentication patterns, and error handling.

**API Architecture**:

HERA uses a **Universal API v2** architecture with these principles:

1. **RPC-First**: All operations through PostgreSQL RPC functions
2. **Organization-Scoped**: Multi-tenant isolation via `organization_id`
3. **Actor-Stamped**: Every write records WHO made the change
4. **Smart Code Validated**: HERA DNA pattern enforcement
5. **Type-Safe**: Full TypeScript support with generated types

**Authentication**:

```typescript
// All API requests require authentication
const authHeaders = await getAuthHeaders()

// Request headers:
// Authorization: Bearer <jwt_token>
// x-hera-org: <organization_id>
// x-hera-api-version: v2
```

**Automatic 401 Redirect**:

```typescript
// Client SDK automatically redirects on 401
if (res.status === 401) {
  const returnUrl = encodeURIComponent(window.location.pathname)
  window.location.href = `/auth/login?returnUrl=${returnUrl}`
  throw new Error('REDIRECTING_TO_LOGIN')
}
```

**Universal Entity API**:

```typescript
// GET /api/v2/entities - List entities
const { data } = await getEntities('', {
  p_organization_id: organization.id,
  p_entity_type: 'CUSTOMER',
  p_status: 'active',
  p_include_dynamic: true,
  p_include_relationships: false,
  p_limit: 100,
  p_offset: 0
})

// POST /api/v2/entities - Create entity
const result = await upsertEntity('', {
  entity_type: 'CUSTOMER',
  entity_name: 'John Doe',
  smart_code: 'HERA.SALON.CUSTOMER.v1',
  organization_id: organization.id,
  dynamic_fields: [
    {
      field_name: 'phone',
      field_value: '+1 555 0100',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
    },
    {
      field_name: 'email',
      field_value: 'john@example.com',
      field_type: 'email',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.EMAIL.v1'
    }
  ]
})

// PUT /api/v2/entities - Update entity
const updateResult = await upsertEntity('', {
  p_entity_id: 'cust-123',
  entity_name: 'John Smith',  // Updated name
  organization_id: organization.id,
  dynamic_fields: [
    {
      field_name: 'phone',
      field_value: '+1 555 0200',  // Updated phone
      field_type: 'text'
    }
  ]
})

// DELETE /api/v2/entities/[id] - Delete entity
await deleteEntity('', {
  entity_id: 'cust-123',
  organization_id: organization.id,
  hard_delete: false  // Soft delete (status='deleted')
})
```

**Universal Transaction API**:

```typescript
// POST /api/v2/transactions - Create transaction
const result = await createTransaction('', {
  transaction_type: 'appointment',
  smart_code: 'HERA.SALON.TXN.APPOINTMENT.v1',
  organization_id: organization.id,
  source_entity_id: customer_id,    // Customer
  target_entity_id: staff_id,       // Staff member
  transaction_date: '2025-01-15T10:00:00Z',
  total_amount: 50.00,
  transaction_status: 'confirmed',
  lines: [
    {
      line_number: 1,
      line_type: 'SERVICE',
      entity_id: service_id,
      description: 'Haircut & Style',
      quantity: 1,
      unit_amount: 50.00,
      line_amount: 50.00,
      smart_code: 'HERA.SALON.TXN.LINE.SERVICE.v1'
    }
  ]
})

// GET /api/v2/transactions - List transactions
const { data } = await getTransactions('', {
  p_organization_id: organization.id,
  p_transaction_type: 'appointment',
  p_date_from: '2025-01-01',
  p_date_to: '2025-01-31',
  p_status: 'confirmed',
  p_include_lines: true
})
```

**RPC Function API**:

```typescript
// POST /api/v2/rpc/[functionName] - Call RPC function
const { data, error } = await callRPC('hera_entities_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: user.id,
  p_organization_id: organization.id,
  p_entity: {
    entity_type: 'CUSTOMER',
    entity_name: 'Jane Smith',
    smart_code: 'HERA.SALON.CUSTOMER.v1'
  },
  p_dynamic: {
    phone: {
      field_type: 'text',
      field_value_text: '+1 555 0300',
      smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
    }
  },
  p_relationships: [],
  p_options: {}
}, organization.id)
```

**Error Handling**:

```typescript
// Error response format
interface APIError {
  error: string                // Error message
  code?: string                // Error code
  details?: any                // Additional error details
}

// Common error codes:
// 401 Unauthorized - Invalid token or expired session
// 403 Forbidden - Insufficient permissions
// 404 Not Found - Entity not found
// 409 Conflict - Duplicate entity_code
// 422 Unprocessable Entity - Validation error
// 500 Internal Server Error - Server error

// Example error handling
try {
  const result = await upsertEntity('', { ... })
} catch (error) {
  if (error.message === 'REDIRECTING_TO_LOGIN') {
    // Automatic redirect to login - no action needed
    return
  }

  if (error.code === 'DUPLICATE_ENTITY_CODE') {
    toast.error('A customer with this code already exists')
    return
  }

  toast.error('Failed to create customer')
  console.error(error)
}
```

**Pagination Pattern**:

```typescript
// Infinite scroll with React Query
function useInfiniteCustomers() {
  return useInfiniteQuery({
    queryKey: ['customers', organizationId],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await getEntities('', {
        p_organization_id: organizationId,
        p_entity_type: 'CUSTOMER',
        p_limit: 20,
        p_offset: pageParam
      })
      return { data, nextOffset: pageParam + 20 }
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    enabled: !!organizationId
  })
}
```

**API Checklist**:
- [ ] All requests include `Authorization` header with JWT token
- [ ] All requests include `x-hera-org` header with organization ID
- [ ] All entity creates include valid Smart Code
- [ ] All payloads include `organization_id` matching header
- [ ] Error handling includes 401 redirect logic
- [ ] Optimistic updates with rollback on error
- [ ] Loading states for all API operations

**Complete Documentation**: See [API-ROUTES.md](./technical/API-ROUTES.md)

---

## 🔥 Common Architecture Patterns

### Pattern 1: Protected Page with Data Fetching

**Use Case**: Standard page that requires authentication and loads data.

```typescript
'use client'

import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useHeraCustomers } from '@/hooks/useHeraCustomers'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { CustomerList } from '@/components/salon/customers/CustomerList'
import { lazy, Suspense, useState } from 'react'

// Lazy load heavy components
const CustomerForm = lazy(() => import('@/components/salon/customers/CustomerForm'))

export default function CustomersPage() {
  // 1. Authentication check
  const { user, organization, isAuthenticated, contextLoading } = useHERAAuth()

  // 2. Data fetching
  const { customers, isLoading, createCustomer } = useHeraCustomers({
    organizationId: organization?.id
  })

  // 3. UI state
  const [isFormOpen, setIsFormOpen] = useState(false)

  // 4. Three-layer security check
  if (!isAuthenticated) return <Alert>Please log in</Alert>
  if (contextLoading) return <LoadingSpinner />
  if (!organization?.id) return <Alert>No organization context</Alert>

  // 5. Render page
  return (
    <SalonLuxePage
      title="Customers"
      description="Manage customer profiles and relationships"
      maxWidth="full"
      padding="lg"
    >
      {/* Mobile header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Action bar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-champagne">Customers</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-6 py-3 bg-gold text-black rounded-xl font-bold active:scale-95"
        >
          New Customer
        </button>
      </div>

      {/* Customer list */}
      {isLoading ? (
        <LoadingSkeleton variant="list" count={5} />
      ) : (
        <CustomerList
          customers={customers}
          onCustomerClick={(id) => router.push(`/salon/customers/${id}`)}
        />
      )}

      {/* Form modal (lazy loaded) */}
      <Suspense fallback={null}>
        {isFormOpen && (
          <CustomerForm
            open={isFormOpen}
            onOpenChange={setIsFormOpen}
            onSubmit={createCustomer}
          />
        )}
      </Suspense>

      {/* Bottom spacing for mobile */}
      <div className="h-24 md:h-0" />
    </SalonLuxePage>
  )
}
```

### Pattern 2: Form with Optimistic Updates

**Use Case**: Create/update forms with immediate UI feedback.

```typescript
function CustomerForm({ customer, onSubmit, onClose }) {
  const { organization } = useHERAAuth()
  const queryClient = useQueryClient()

  // Form state with React Hook Form + Zod validation
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer || {
      name: '',
      phone: '',
      email: ''
    }
  })

  // Mutation with optimistic update
  const mutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      return upsertEntity('', {
        p_entity_id: customer?.id,
        entity_type: 'CUSTOMER',
        entity_name: data.name,
        smart_code: 'HERA.SALON.CUSTOMER.v1',
        organization_id: organization.id,
        dynamic_fields: [
          { field_name: 'phone', field_value: data.phone, field_type: 'text' },
          { field_name: 'email', field_value: data.email, field_type: 'email' }
        ]
      })
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['hera-customers'] })

      // Snapshot previous value
      const previous = queryClient.getQueryData(['hera-customers'])

      // Optimistically update cache
      queryClient.setQueryData(['hera-customers'], (old: any[]) => {
        if (customer?.id) {
          // Update existing
          return old.map(c => c.id === customer.id ? { ...c, ...newData } : c)
        } else {
          // Add new
          return [...old, { ...newData, id: 'temp-id' }]
        }
      })

      return { previous }
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['hera-customers'], context.previous)
      toast.error('Failed to save customer')
    },
    onSuccess: () => {
      toast.success('Customer saved successfully')
      onClose()
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['hera-customers'] })
    }
  })

  return (
    <FormModal
      open={true}
      onOpenChange={onClose}
      title={customer ? 'Edit Customer' : 'New Customer'}
      submitLabel="Save Customer"
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      isLoading={mutation.isLoading}
    >
      <form className="space-y-4">
        <Input
          label="Name"
          {...form.register('name')}
          error={form.formState.errors.name?.message}
        />
        <Input
          label="Phone"
          type="tel"
          {...form.register('phone')}
          error={form.formState.errors.phone?.message}
        />
        <Input
          label="Email"
          type="email"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
        />
      </form>
    </FormModal>
  )
}
```

### Pattern 3: Real-Time Dashboard with Progressive Loading

**Use Case**: Dashboard with multiple data sources and staged loading.

```typescript
export default function DashboardPage() {
  const { organization } = useHERAAuth()
  const [loadStage, setLoadStage] = useState(1)

  // Progressive loading stages
  useEffect(() => {
    if (organization?.id) {
      [2, 3, 4, 5].forEach((stage, index) => {
        setTimeout(() => setLoadStage(stage), index * 300)
      })
    }
  }, [organization?.id])

  return (
    <SalonLuxePage title="Dashboard" maxWidth="full">
      {/* Stage 1: Critical KPIs (0ms) */}
      {loadStage >= 1 && (
        <Suspense fallback={<KPISkeleton />}>
          <HeroMetrics />
        </Suspense>
      )}

      {/* Stage 2: Today's Appointments (300ms) */}
      {loadStage >= 2 && (
        <Suspense fallback={<ListSkeleton />}>
          <TodayAppointments />
        </Suspense>
      )}

      {/* Stage 3: Revenue Chart (600ms) */}
      {loadStage >= 3 && (
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />
        </Suspense>
      )}

      {/* Stage 4: Staff Performance (900ms) */}
      {loadStage >= 4 && (
        <Suspense fallback={<TableSkeleton />}>
          <StaffPerformance />
        </Suspense>
      )}

      {/* Stage 5: Quick Actions (1200ms) */}
      {loadStage >= 5 && (
        <Suspense fallback={<ActionsSkeleton />}>
          <QuickActions />
        </Suspense>
      )}
    </SalonLuxePage>
  )
}
```

### Pattern 4: Mobile-First Responsive Component

**Use Case**: Component that adapts to mobile and desktop layouts.

```typescript
function CustomerCard({ customer, onClick }) {
  return (
    <>
      {/* Mobile: Card Layout */}
      <div className="
        md:hidden
        bg-charcoal rounded-xl p-4
        border border-gold/20
        active:scale-[0.98] transition-transform
        cursor-pointer
      "
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar src={customer.avatar} className="w-12 h-12" />
            <div>
              <h3 className="font-semibold text-champagne">{customer.name}</h3>
              <p className="text-sm text-bronze">{customer.phone}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gold" />
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-gold/20 text-gold text-xs rounded-full">
            ${customer.ltv.toLocaleString()}
          </span>
          <span className="px-3 py-1 bg-emerald/20 text-emerald text-xs rounded-full">
            {customer.visit_count} visits
          </span>
        </div>
      </div>

      {/* Desktop: Table Row */}
      <tr className="
        hidden md:table-row
        border-b border-gold/20
        hover:bg-gold/5
        cursor-pointer
      "
        onClick={onClick}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <Avatar src={customer.avatar} className="w-8 h-8" />
            <span className="text-champagne">{customer.name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-bronze">{customer.phone}</td>
        <td className="px-4 py-3 text-bronze">{customer.email}</td>
        <td className="px-4 py-3 text-right text-gold">
          ${customer.ltv.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right text-bronze">
          {customer.visit_count}
        </td>
      </tr>
    </>
  )
}
```

### Pattern 5: Search with Debouncing

**Use Case**: Real-time search with performance optimization.

```typescript
function CustomerSearch() {
  const { organization } = useHERAAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  // Query with debounced search
  const { data: customers, isLoading } = useQuery({
    queryKey: ['hera-customers', organization?.id, debouncedSearch],
    queryFn: async () => {
      const { data } = await getEntities('', {
        p_organization_id: organization.id,
        p_entity_type: 'CUSTOMER',
        p_search: debouncedSearch,
        p_include_dynamic: true
      })
      return data
    },
    enabled: !!organization?.id && debouncedSearch.length >= 2,
    staleTime: 5 * 60 * 1000
  })

  return (
    <div>
      <SearchInput
        placeholder="Search customers..."
        value={searchTerm}
        onChange={setSearchTerm}
      />

      {isLoading && <LoadingSpinner />}

      {customers && (
        <CustomerList customers={customers} />
      )}

      {searchTerm.length >= 2 && !isLoading && customers?.length === 0 && (
        <EmptyState
          icon={<Search />}
          title="No Customers Found"
          description={`No results for "${searchTerm}"`}
        />
      )}
    </div>
  )
}
```

---

## 🎓 Best Practices Summary

### Code Quality

1. **TypeScript Strict Mode**: All code must pass strict type checking
2. **ESLint Compliance**: No ESLint errors allowed in production code
3. **Component Organization**: One component per file, clear naming
4. **File Structure**: Follow established directory conventions
5. **Code Comments**: Document complex logic and business rules

### Performance

1. **Progressive Loading**: Use 5-stage pattern for heavy pages
2. **Code Splitting**: Lazy load with React.lazy() and Suspense
3. **React Query Caching**: 5-minute staleTime, 10-minute cacheTime
4. **Optimistic Updates**: Update UI immediately, rollback on error
5. **Image Optimization**: Use Next/Image with responsive sizes

### Testing

1. **Testing Pyramid**: 70% unit, 20% integration, 10% E2E
2. **Coverage Targets**: 80% statements, 75% branches
3. **Test Behavior**: Test user-facing behavior, not implementation
4. **Mock External Deps**: Use MSW for API mocking
5. **E2E Critical Flows**: Test appointment booking, checkout, reports

### Security

1. **Authentication**: Three-layer check (authenticated → context loaded → org present)
2. **Organization Isolation**: Every API call includes organization_id
3. **Actor Stamping**: Every write includes created_by/updated_by
4. **Input Validation**: Zod schemas for all forms and API payloads
5. **Error Handling**: Never expose sensitive information in errors

### Mobile-First

1. **Touch Targets**: Minimum 44px for all interactive elements
2. **Active Feedback**: Use active:scale-95 for touch feedback
3. **Responsive Typography**: Progressive scaling (text-xl md:text-3xl)
4. **Bottom Navigation**: iOS/Android tab bar for mobile (md:hidden)
5. **Performance**: Target < 1.5s initial page load on 3G

---

## 📝 Version History

### v2.0 - January 2025 (Current)
- Complete developer documentation (20 comprehensive guides)
- Mobile-first responsive design standardization
- Performance optimization with progressive loading
- Comprehensive testing strategies (Vitest + Playwright)
- Universal API v2 client SDK documentation
- Authentication and multi-tenant architecture
- Shared components library reference

### v1.0 - December 2024
- Initial salon module implementation
- Dashboard, POS, Appointments, Customers
- Services, Products, Staff management
- Basic authentication and organization context

---

## 🤝 Contributing

### For Developers

When adding new features or fixing bugs:

1. **Read Relevant Documentation**: Start with feature-specific guide
2. **Follow Patterns**: Use established patterns from this reference
3. **Write Tests**: Unit tests (70%), integration tests (20%), E2E tests (10%)
4. **Test Performance**: Ensure Lighthouse scores > 90 (mobile), > 95 (desktop)
5. **Test Mobile**: Verify on iOS Safari and Chrome Mobile
6. **Update Documentation**: Update feature guide with changes

### For AI Assistants

When working on salon module tasks:

1. **Check Authentication**: Always start with `useHERAAuth()` three-layer check
2. **Use Universal API v2**: All data operations via `universal-api-v2-client`
3. **Follow Mobile-First**: Start with mobile layout, enhance for desktop
4. **Implement Progressive Loading**: Use 5-stage pattern for heavy pages
5. **Write Tests**: Include unit tests for business logic
6. **Document Changes**: Add code comments and update relevant guide

---

## 📚 Additional Resources

### Internal Documentation
- `/docs/salon/feature/*.md` - Feature-specific guides
- `/docs/salon/technical/*.md` - Technical reference guides
- `/docs/salon/DEVELOPER-GUIDE.md` - Master index
- `/docs/salon/MOBILE-FIRST-STANDARDIZATION-CHECKLIST.md` - Mobile implementation plan

### External Resources
- [Next.js Documentation](https://nextjs.org/docs) - Framework reference
- [React Query Documentation](https://tanstack.com/query/latest) - Data fetching
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - Styling reference
- [Playwright Documentation](https://playwright.dev/docs) - E2E testing
- [Vitest Documentation](https://vitest.dev/) - Unit testing

### Design Resources
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) - Mobile design standards
- [Material Design 3](https://m3.material.io/) - Android design patterns
- [Radix UI Documentation](https://www.radix-ui.com/docs) - Accessible components

---

## 🆘 Getting Help

### For Developers

**Common Issues**:
- Authentication errors → See [AUTHENTICATION.md](./technical/AUTHENTICATION.md)
- Performance issues → See [PERFORMANCE.md](./technical/PERFORMANCE.md)
- Test failures → See [TESTING.md](./technical/TESTING.md)
- API errors → See [API-ROUTES.md](./technical/API-ROUTES.md)

**Support Channels**:
- Technical lead for architecture questions
- Team chat for quick troubleshooting
- GitHub issues for bug reports

### For AI Assistants

**When Stuck**:
1. Review relevant feature documentation
2. Check common architecture patterns
3. Verify authentication context
4. Review error handling patterns
5. Check mobile-first implementation

**Quality Checklist**:
- [ ] TypeScript types correct
- [ ] Authentication implemented
- [ ] Mobile-first responsive
- [ ] Performance optimized
- [ ] Tests written
- [ ] Documentation updated

---

## 🎯 Success Metrics

### Code Quality Metrics
- TypeScript strict mode: 100% compliance
- ESLint errors: 0
- Test coverage: >80% statements
- Build time: <60 seconds

### Performance Metrics
- Lighthouse Mobile: >90
- Lighthouse Desktop: >95
- LCP: <2.5s
- FID: <100ms
- CLS: <0.1

### User Experience Metrics
- Time to Interactive: <3.8s
- First Contentful Paint: <1.8s
- Mobile page load: <1.5s
- API response time (p95): <500ms

---

## 📄 License

HERA Salon Module © 2025. All rights reserved.

This documentation is confidential and proprietary. Unauthorized distribution is prohibited.

---

**Generated**: January 2025
**Maintainer**: HERA Development Team
**Version**: 2.0

**For the latest documentation, see**: `/docs/salon/`
