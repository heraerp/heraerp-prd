# 🏗️ HERA Industry Module Builder Template

## Overview
This template provides a standardized approach for building new industry modules in HERA, ensuring consistent implementation of the COA-first architecture and adherence to the Sacred Six tables pattern.

## 🎯 Pre-Requisites Checklist

Before starting a new industry module, ensure you have:

- [ ] Industry analysis complete (competitors, market needs, workflows)
- [ ] Business entity types identified (customer types, products, services)
- [ ] Transaction types defined (sales, purchases, specific workflows)
- [ ] Smart code patterns designed
- [ ] COA template requirements gathered
- [ ] Demo organization strategy planned

## 📋 9-Phase Build Process (COA-First)

### Phase 1: Foundation Setup (Chart of Accounts First) 🏛️
**Purpose**: Establish the financial backbone before any other components

```typescript
// 1. Create COA template for the industry
const coaTemplate = {
  industry: 'your_industry',
  country: 'AE', // Default to UAE
  template: {
    // Revenue accounts
    '4000': { name: 'Revenue', type: 'revenue', parent: null },
    '4100': { name: 'Sales Revenue', type: 'revenue', parent: '4000' },
    // ... complete COA structure
  }
}

// 2. Setup business with COA
await universalApi.setupBusiness({
  organizationName: "Demo Business",
  businessType: "your_industry",
  country: "AE",
  // This automatically creates COA from template
})

// 3. Verify COA creation
const coa = await universalApi.getChartOfAccounts(organizationId)
console.log(`Created ${coa.length} GL accounts`)
```

### Phase 2: Core Navigation & Layout 🧭
**Purpose**: Create industry-specific navigation structure

```typescript
// Create navigation configuration
export const industryNavigation = [
  {
    name: 'Dashboard',
    href: '/industry',
    icon: LayoutDashboard
  },
  {
    name: 'Core Feature 1',
    href: '/industry/feature1',
    icon: FeatureIcon
  },
  // ... industry-specific navigation
]
```

### Phase 3: Entity Configuration 📊
**Purpose**: Define industry-specific entities

```typescript
// Entity types configuration
export const industryEntityTypes = {
  customer: {
    smartCodePattern: 'HERA.INDUSTRY.CUSTOMER.*',
    requiredFields: ['name', 'contact', 'credit_limit'],
    customFields: ['industry_specific_field']
  },
  product: {
    smartCodePattern: 'HERA.INDUSTRY.PRODUCT.*',
    requiredFields: ['name', 'sku', 'price'],
    customFields: ['specifications', 'certifications']
  }
}
```

### Phase 4: Transaction Flows 💼
**Purpose**: Implement industry-specific transactions

```typescript
// Transaction type definitions
export const transactionTypes = {
  sale: {
    smartCode: 'HERA.INDUSTRY.SALE.v1',
    glPostingRules: {
      debit: ['1100'], // Cash/Bank
      credit: ['4100'] // Sales Revenue
    }
  },
  purchase: {
    smartCode: 'HERA.INDUSTRY.PURCHASE.v1',
    glPostingRules: {
      debit: ['1300'], // Inventory
      credit: ['2100'] // Accounts Payable
    }
  }
}
```

### Phase 5: Dashboard & Analytics 📈
**Purpose**: Industry-specific KPIs and metrics

```typescript
// Dashboard metrics configuration
export const dashboardMetrics = {
  revenue: {
    query: 'SUM transactions WHERE type=sale',
    display: 'currency',
    trend: 'monthly'
  },
  customerCount: {
    query: 'COUNT entities WHERE type=customer',
    display: 'number',
    trend: 'cumulative'
  }
  // ... industry KPIs
}
```

### Phase 6: Forms & CRUD Operations ✏️
**Purpose**: Industry-specific data entry forms

```typescript
// Form configurations
export const industryForms = {
  customerForm: {
    fields: [
      { name: 'entity_name', label: 'Customer Name', required: true },
      { name: 'credit_limit', label: 'Credit Limit', type: 'currency' }
      // ... industry fields
    ],
    validation: industryValidationSchema
  }
}
```

### Phase 7: Reporting Suite 📊
**Purpose**: Industry-specific reports

```typescript
// Report configurations
export const industryReports = [
  {
    id: 'monthly_sales',
    name: 'Monthly Sales Report',
    glAccounts: ['4100', '4110'], // Sales accounts
    format: 'table',
    period: 'monthly'
  },
  {
    id: 'inventory_valuation',
    name: 'Inventory Valuation',
    glAccounts: ['1300'], // Inventory accounts
    format: 'summary',
    realtime: true
  }
]
```

### Phase 8: Integration & Automation 🤖
**Purpose**: External integrations and automation

```typescript
// Integration configurations
export const integrations = {
  paymentGateway: {
    enabled: true,
    glPosting: {
      success: { debit: '1100', credit: '4100' },
      fees: { debit: '5200', credit: '1100' }
    }
  },
  autoJournal: {
    enabled: true,
    rules: industryAutoJournalRules
  }
}
```

### Phase 9: Production Deployment 🚀
**Purpose**: Final deployment and optimization

```typescript
// Deployment checklist
export const deploymentChecklist = {
  dataValidation: [
    'Verify all GL accounts created',
    'Check transaction posting rules',
    'Validate report accuracy'
  ],
  performance: [
    'Index optimization',
    'Query performance testing',
    'Load testing'
  ],
  documentation: [
    'User guides',
    'API documentation',
    'Training materials'
  ]
}
```

## 🔧 Module Structure Template

```
/src/app/{industry}/
├── page.tsx                    # Dashboard
├── layout.tsx                  # Industry layout
├── settings/
│   ├── page.tsx               # Settings dashboard
│   └── {industry}-data/       # Data management
│       └── page.tsx
├── {feature1}/                # Core features
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
└── reports/                   # Reporting
    ├── page.tsx
    └── [report]/
        └── page.tsx

/src/components/{industry}/
├── {Industry}Layout.tsx       # Industry layout component
├── {Industry}Navigation.tsx   # Navigation component
├── {Industry}PageHeader.tsx   # Page header component
├── {Industry}StatCard.tsx     # Stat card component
└── forms/                     # Industry forms
    ├── Customer{Industry}Form.tsx
    └── Product{Industry}Form.tsx

/src/lib/services/
└── {industry}-service.ts      # Business logic

/config/{industry}/
├── coa-template.ts           # COA configuration
├── entity-types.ts           # Entity configurations
├── transaction-types.ts      # Transaction configurations
└── smart-codes.ts            # Smart code patterns
```

## 🎨 UI/UX Patterns

### Theme Configuration
```typescript
export const industryTheme = {
  primaryColor: 'amber',      // Industry primary color
  secondaryColor: 'orange',    // Secondary color
  darkSidebar: true,          // Dark sidebar pattern
  sidebarWidth: 240,          // Standard width
  iconSet: 'lucide',          // Icon library
  gradients: {
    primary: 'from-amber-600 to-orange-600',
    secondary: 'from-purple-600 to-pink-600'
  }
}
```

### Component Patterns
```typescript
// Consistent component usage
<FurniturePageHeader
  title="Page Title"
  subtitle="Page description"
  actions={<Button>Action</Button>}
/>

<StatCardGrid>
  {stats.map(stat => (
    <IndustryStatCard key={stat.label} {...stat} />
  ))}
</StatCardGrid>
```

## 🔐 Security & Multi-Tenancy

### Organization Context
```typescript
// Always use organization context
const { organizationId, orgLoading } = useIndustryOrg()

// Set context for API calls
universalApi.setOrganizationId(organizationId)

// Filter all queries by organization
const entities = await universalApi.read({
  table: 'core_entities',
  filter: { organization_id: organizationId }
})
```

### Permission Patterns
```typescript
// Role-based access
const canEditFinancials = hasPermission('financial:write')
const canViewReports = hasPermission('reports:read')
```

## 📊 Smart Code Patterns

### Industry Smart Codes
```
HERA.{INDUSTRY}.{MODULE}.{ENTITY}.{ACTION}.v1

Examples:
HERA.SALON.BOOKING.APPOINTMENT.CREATE.v1
HERA.RESTAURANT.ORDER.TABLE.RESERVE.v1
HERA.FURNITURE.TENDER.BID.SUBMIT.v1
```

### GL Posting Integration
```typescript
// Every transaction must have GL posting rules
const glPostingRules = {
  'HERA.INDUSTRY.SALE.v1': {
    debit: ['1100'],  // Cash account
    credit: ['4100']  // Sales revenue
  }
}
```

## 🚀 Quick Start Command

Create a new industry module:

```bash
# Use this template to scaffold a new industry
npx hera-industry-builder create \
  --industry="retail" \
  --name="Retail Management" \
  --coa-template="retail" \
  --demo-org="Best Buy Demo"
```

## ✅ Quality Checklist

Before considering the module complete:

- [ ] COA template creates successfully
- [ ] All transactions post to GL accounts
- [ ] Financial reports generate correctly
- [ ] Multi-tenant isolation verified
- [ ] Smart codes cover all operations
- [ ] Demo data creates realistic scenarios
- [ ] UI follows HERA design patterns
- [ ] Performance tested with 10k+ records
- [ ] Documentation complete
- [ ] Error handling comprehensive

## 🎯 Success Metrics

A successful industry module should achieve:

- **Setup Time**: < 30 seconds for complete business setup
- **COA Accuracy**: 100% of transactions post correctly
- **User Adoption**: 80%+ feature utilization
- **Performance**: < 2s page loads with 10k records
- **Stability**: 99.9% uptime in production

## 📚 References

- [HERA Universal Architecture](./UNIVERSAL-ARCHITECTURE.md)
- [Sacred Six Tables](./SACRED-SIX-TABLES.md)
- [Smart Code System](./SMART-CODE-SYSTEM.md)
- [COA Templates](./COA-TEMPLATES.md)
- [Multi-Tenant Security](./MULTI-TENANT-SECURITY.md)