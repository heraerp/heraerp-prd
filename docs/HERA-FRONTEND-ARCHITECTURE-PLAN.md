# HERA ERP Frontend Architecture Plan
## Universal Business UI Framework

---

## 🎯 Vision & Principles

### Core Philosophy
**"One Universal UI System, Infinite Business Possibilities"**

Just as HERA uses 6 universal tables for all business data, the frontend uses universal UI patterns that adapt to any industry while maintaining consistency and elegance.

### Design Principles
1. **Universal Components First** - Build once, use everywhere
2. **Industry Adaptation** - Smart customization without code duplication
3. **Mobile-First Responsive** - Perfect on all devices
4. **Real-Time Performance** - Instant updates via WebSockets
5. **Offline-First PWA** - Work anywhere, sync when connected
6. **AI-Native Interface** - Intelligent assistance built-in

---

## 🏗️ Frontend Architecture

### 1. **Technology Stack**
```typescript
// Core Framework
- Next.js 15.4.2 (App Router)
- React 19.1.0
- TypeScript 5.8.3 (strict mode)

// State Management
- Zustand 5.0.6 (global state)
- TanStack Query 5.83.0 (server state)
- Universal API Client (type-safe)

// UI Framework
- Tailwind CSS 4.1.11
- Shadcn/ui (New York style)
- HERA DNA Component Library
- Lucide React Icons

// Real-Time & Offline
- WebSocket connections
- Service Workers (PWA)
- IndexedDB (offline storage)
```

### 2. **Universal Component Architecture**

```
src/
├── components/
│   ├── universal/              # Universal business components
│   │   ├── EntityManager/      # CRUD for any entity type
│   │   ├── TransactionFlow/    # Universal transaction handling
│   │   ├── SmartTable/         # Intelligent data grids
│   │   ├── DynamicForm/        # Smart form generation
│   │   └── Dashboard/          # Configurable dashboards
│   │
│   ├── dna/                    # HERA DNA patterns
│   │   ├── layouts/           # Industry layout templates
│   │   ├── workflows/         # Business process flows
│   │   ├── cards/            # Stat and metric cards
│   │   └── navigation/       # Smart navigation
│   │
│   └── industry/              # Industry-specific overrides
│       ├── salon/
│       ├── restaurant/
│       ├── healthcare/
│       └── manufacturing/
```

---

## 📐 Universal UI Patterns

### 1. **Entity Management Pattern**
Universal CRUD interface that works with any entity type:

```typescript
<UniversalEntityManager
  entityType="customer"
  smartCode="HERA.CRM.CUST.ENT.PROF.v1"
  columns={['entity_name', 'email', 'phone', 'credit_limit']}
  actions={['create', 'edit', 'delete', 'duplicate']}
  filters={['status', 'created_date', 'tags']}
/>
```

### 2. **Transaction Flow Pattern**
Handles any business transaction with proper validation:

```typescript
<UniversalTransactionFlow
  transactionType="sale"
  smartCode="HERA.RETAIL.SALE.TXN.ORDER.v1"
  steps={['items', 'customer', 'payment', 'confirm']}
  validation={saleValidationRules}
  onComplete={handleTransactionComplete}
/>
```

### 3. **Dashboard Grid Pattern**
Configurable dashboard with drag-and-drop widgets:

```typescript
<UniversalDashboard
  layout="industry-default"
  widgets={[
    { type: 'stat-card', data: revenueStats },
    { type: 'chart', data: salesTrend },
    { type: 'table', data: recentTransactions },
    { type: 'ai-insights', context: businessMetrics }
  ]}
/>
```

---

## 🎨 Design System

### 1. **Color Semantics**
```scss
// Base semantic colors (CSS variables)
--color-primary: oklch(0.57 0.192 250);      // Actions
--color-success: oklch(0.64 0.12 160);       // Positive
--color-warning: oklch(0.69 0.12 85);        // Attention
--color-danger: oklch(0.58 0.192 280);       // Critical

// Surface hierarchy
--color-surface-0: rgba(0, 0, 0, 0.02);      // Base
--color-surface-1: rgba(0, 0, 0, 0.05);      // Cards
--color-surface-2: rgba(0, 0, 0, 0.08);      // Elevated
--color-surface-3: rgba(0, 0, 0, 0.12);      // Modals

// Industry accent colors
--color-salon: #CE8A73;                       // Warm beauty
--color-restaurant: #D97706;                  // Food warmth
--color-healthcare: #059669;                  // Medical trust
--color-manufacturing: #3B82F6;               // Industrial blue
```

### 2. **Responsive Breakpoints**
```scss
// Mobile-first approach
sm: 640px   // Mobile landscape
md: 768px   // Tablet portrait
lg: 1024px  // Tablet landscape
xl: 1280px  // Desktop
2xl: 1536px // Wide desktop
```

### 3. **Component Sizing**
```typescript
// Consistent sizing system
const sizes = {
  xs: 'h-8 text-xs',      // Compact
  sm: 'h-9 text-sm',      // Default mobile
  md: 'h-10 text-base',   // Default desktop
  lg: 'h-11 text-lg',     // Emphasis
  xl: 'h-12 text-xl'      // Headers
}
```

---

## 🗺️ Navigation Architecture

### 1. **Universal Navigation Structure**
```typescript
const navigationStructure = {
  // Always present
  universal: [
    { icon: Home, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Entities', path: '/entities' },
    { icon: Receipt, label: 'Transactions', path: '/transactions' },
    { icon: TrendingUp, label: 'Analytics', path: '/analytics' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ],
  
  // Industry-specific additions
  industryModules: {
    salon: [
      { icon: Calendar, label: 'Appointments', path: '/appointments' },
      { icon: Scissors, label: 'Services', path: '/services' }
    ],
    restaurant: [
      { icon: UtensilsCrossed, label: 'Menu', path: '/menu' },
      { icon: Grid3x3, label: 'Tables', path: '/tables' }
    ],
    healthcare: [
      { icon: Heart, label: 'Patients', path: '/patients' },
      { icon: Clipboard, label: 'Records', path: '/records' }
    ]
  }
}
```

### 2. **Smart Routing Pattern**
```typescript
// Routes adapt based on organization context
/[org-slug]/                    # Organization dashboard
/[org-slug]/entities/[type]     # Entity management
/[org-slug]/transactions/[type] # Transaction flows
/[org-slug]/analytics/[report]  # Analytics views
/[org-slug]/[industry-module]   # Industry-specific
```

---

## 📱 Industry-Specific Dashboards

### 1. **Salon Dashboard**
```typescript
const salonDashboard = {
  hero: {
    title: "Today's Schedule",
    metrics: ['appointments', 'revenue', 'utilization']
  },
  widgets: [
    'AppointmentCalendar',
    'StaffPerformance',
    'ServicePopularity',
    'ProductInventory'
  ],
  quickActions: [
    'Book Appointment',
    'Check In Client',
    'Process Payment'
  ]
}
```

### 2. **Restaurant Dashboard**
```typescript
const restaurantDashboard = {
  hero: {
    title: "Live Orders",
    metrics: ['tables', 'orders', 'kitchen_time']
  },
  widgets: [
    'TableLayout',
    'KitchenDisplay',
    'OrderQueue',
    'DailySales'
  ],
  quickActions: [
    'New Order',
    'Reserve Table',
    'View Menu'
  ]
}
```

### 3. **Healthcare Dashboard**
```typescript
const healthcareDashboard = {
  hero: {
    title: "Patient Care",
    metrics: ['appointments', 'waiting', 'completed']
  },
  widgets: [
    'AppointmentQueue',
    'PatientRecords',
    'PrescriptionAlerts',
    'BillingStatus'
  ],
  quickActions: [
    'New Patient',
    'Start Consultation',
    'Write Prescription'
  ]
}
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Setup Next.js 15 with TypeScript
- [ ] Configure Tailwind + HERA design tokens
- [ ] Implement universal layout components
- [ ] Create base navigation structure
- [ ] Setup state management (Zustand + TanStack Query)

### Phase 2: Universal Components (Week 3-4)
- [ ] Build UniversalEntityManager
- [ ] Build UniversalTransactionFlow
- [ ] Build UniversalDashboard
- [ ] Create SmartTable with virtualization
- [ ] Implement DynamicForm generator

### Phase 3: Industry Modules (Week 5-6)
- [ ] Salon appointment system
- [ ] Restaurant POS interface
- [ ] Healthcare patient management
- [ ] Manufacturing production tracking
- [ ] Retail inventory management

### Phase 4: Advanced Features (Week 7-8)
- [ ] Real-time updates (WebSockets)
- [ ] Offline mode (Service Workers)
- [ ] AI assistant integration
- [ ] Mobile app shell (PWA)
- [ ] Performance optimization

---

## 🎯 Key Frontend Features

### 1. **Smart Code Intelligence**
Every UI component understands smart codes and adapts behavior:
```typescript
// Component automatically configures based on smart code
<UniversalForm 
  smartCode="HERA.SALON.APPT.TXN.BOOK.v1"
  // Automatically shows: service selection, staff, time slots
/>
```

### 2. **Real-Time Collaboration**
Multiple users see live updates:
- Appointment bookings appear instantly
- Inventory changes reflect immediately  
- Transaction status updates in real-time

### 3. **AI-Powered Assistance**
Built-in AI helps users:
- Suggests optimal pricing
- Recommends inventory levels
- Predicts busy periods
- Automates routine tasks

### 4. **Offline Resilience**
Full functionality without internet:
- Queue transactions locally
- Access critical data offline
- Automatic sync when connected
- Conflict resolution built-in

---

## 📊 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Paint | <1.5s | Lighthouse |
| Time to Interactive | <3.5s | Lighthouse |
| Bundle Size | <500KB | Webpack |
| API Response | <200ms | Server timing |
| Offline Load | <2s | Service Worker |

---

## 🔧 Development Guidelines

### 1. **Component Creation**
```typescript
// Always start with universal pattern
const UniversalComponent = ({ 
  smartCode,
  entityType,
  industryOverrides 
}) => {
  // Base implementation
  const baseConfig = getUniversalConfig(smartCode)
  
  // Apply industry customization
  const config = mergeConfigs(baseConfig, industryOverrides)
  
  // Render with proper semantics
  return <div data-smart-code={smartCode}>...</div>
}
```

### 2. **State Management**
```typescript
// Zustand store pattern
const useUniversalStore = create((set, get) => ({
  // Organization context
  currentOrg: null,
  
  // Entity cache
  entities: {},
  
  // Transaction queue
  pendingTransactions: [],
  
  // Actions
  setOrganization: (org) => set({ currentOrg: org }),
  queueTransaction: (txn) => set(state => ({
    pendingTransactions: [...state.pendingTransactions, txn]
  }))
}))
```

### 3. **API Integration**
```typescript
// Always use Universal API client
const { data, error, isLoading } = useQuery({
  queryKey: ['entities', entityType, filters],
  queryFn: () => universalApi.queryEntities({
    entity_type: entityType,
    ...filters
  }),
  staleTime: 30000 // 30 seconds
})
```

---

## 🎨 UI Component Examples

### 1. **Universal Stat Card**
```typescript
<StatCardDNA
  label="Today's Revenue"
  value={revenue}
  change="+12% from yesterday"
  trend="up"
  icon={TrendingUp}
  smartCode="HERA.ANALYTICS.REVENUE.TODAY.v1"
/>
```

### 2. **Entity Quick Create**
```typescript
<QuickCreate
  entityType="customer"
  fields={['name', 'email', 'phone']}
  onSuccess={(entity) => {
    toast.success(`Customer ${entity.name} created`)
    router.push(`/customers/${entity.id}`)
  }}
/>
```

### 3. **Transaction Timeline**
```typescript
<TransactionTimeline
  transactions={recentTransactions}
  groupBy="date"
  showDetails={['amount', 'customer', 'items']}
  onTransactionClick={handleViewTransaction}
/>
```

---

## 🚦 Success Metrics

### Development Success
- [ ] All universal components completed
- [ ] Industry modules implemented
- [ ] Mobile responsiveness verified
- [ ] Offline mode functional
- [ ] Performance targets met

### Business Success  
- [ ] User can complete transaction in <3 clicks
- [ ] Dashboard loads in <2 seconds
- [ ] Works perfectly on mobile
- [ ] AI suggestions improve efficiency 20%+
- [ ] Zero training required for basic operations

---

## 🎯 Next Steps

1. **Review and Approve Plan**
2. **Create Component Library Designs**
3. **Build Universal Components First**
4. **Implement Industry Dashboards**
5. **Add Advanced Features**

This architecture ensures HERA's frontend matches the elegance and universality of its backend, providing a world-class user experience that works for any business type while maintaining consistency and performance.

Ready to start building? 🚀