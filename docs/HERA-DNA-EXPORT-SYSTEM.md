# HERA DNA Export System Documentation
## Unified Component Library with Tree-Shaking Support

---

## 🎯 Overview

The **HERA DNA Export System** provides a centralized, organized way to import and use all HERA DNA components with full TypeScript support, tree-shaking optimization, and developer-friendly organization.

### Key Features
- 🌳 **Tree-Shaking Optimized** - Import only what you need
- 📦 **Categorized Exports** - Components organized by purpose
- 🔄 **Dynamic Loading** - Lazy load components on demand
- 📝 **Full TypeScript** - Complete type definitions exported
- 🔧 **Registry System** - Component discovery and metadata
- 📱 **Mobile-First** - Separate mobile component exports
- 🏢 **Enterprise Ready** - Business logic components included

---

## 🚀 Quick Start

### Import Individual Components
```typescript
// Core UI Components
import { StatCardDNA, HeraButtonDNA, HeraSidebarDNA } from '@/lib/dna'

// Business Logic Components  
import { 
  UniversalSearch, 
  SmartCodePicker, 
  EntityQuickView 
} from '@/lib/dna'

// Mobile Components
import { BottomSheet, PullToRefresh } from '@/lib/dna'

// Enterprise Components
import { EnterpriseDataTable, EnterpriseDashboard } from '@/lib/dna'
```

### Import by Category
```typescript
// Import all mobile components
import * as Mobile from '@/lib/dna/components/mobile'

// Usage
<Mobile.BottomSheet isOpen={isOpen}>
  <Mobile.PullToRefresh onRefresh={handleRefresh}>
    <Content />
  </Mobile.PullToRefresh>
</Mobile.BottomSheet>
```

### Import Component Types
```typescript
import type { 
  StatCardDNAProps,
  UniversalSearchProps,
  BottomSheetHandle,
  SmartCode
} from '@/lib/dna'
```

---

## 📋 Component Categories

### Core UI Components
Essential building blocks for HERA applications:

```typescript
import {
  StatCardDNA,           // Statistics display cards
  MiniStatCardDNA,       // Compact stat cards
  HeraButtonDNA,         // Enhanced button component
  HeraInputDNA,          // Styled input component
  HeraSidebarDNA,        // Navigation sidebar
  GlassmorphicDarkLayout,// Glassmorphism layout
  ThemeProviderDNA       // Theme management
} from '@/lib/dna'
```

### Enterprise Components
Business-grade components for enterprise applications:

```typescript
import {
  EnterpriseCard,        // Enterprise card layout
  EnterpriseDashboard,   // Dashboard framework
  EnterpriseStatsCard,   // Business metrics card
  EnterpriseDataTable    // Advanced data table
} from '@/lib/dna'
```

### Business Logic Components
Components that handle specific business workflows:

```typescript
import {
  UniversalTransactionFlow, // Multi-step transaction wizard
  UniversalSearch,          // AI-powered global search
  EntityQuickView,          // Entity preview on hover
  SmartCodePicker          // Business classification selector
} from '@/lib/dna'
```

### Mobile Components
Mobile-optimized interaction patterns:

```typescript
import {
  BottomSheet,           // Mobile bottom sheet
  PullToRefresh,         // Pull-to-refresh gesture
  useBottomSheet         // Bottom sheet hook
} from '@/lib/dna'
```

### Specialized Components
Purpose-built components for specific use cases:

```typescript
import {
  ChatInterfaceDNA,      // Chat interface
  DocumentNumberingDNA,  // Document numbering
  AssessmentDashboardDNA,// Assessment dashboard
  ProductionUIPattern    // Production UI pattern
} from '@/lib/dna'
```

---

## 🔄 Dynamic Loading

### Component Registry
The export system includes a registry for dynamic component loading:

```typescript
import { loadDNAComponent, HERA_DNA_REGISTRY } from '@/lib/dna'

// Dynamic import
const StatCard = await loadDNAComponent('stat-card')

// Available component keys
console.log(Object.keys(HERA_DNA_REGISTRY))
// ['stat-card', 'bottom-sheet', 'universal-search', ...]
```

### Lazy Loading Example
```typescript
import { lazy, Suspense } from 'react'
import { loadDNAComponent } from '@/lib/dna'

// Create lazy component
const LazyBottomSheet = lazy(() => loadDNAComponent('bottom-sheet'))

// Use with Suspense
<Suspense fallback={<div>Loading...</div>}>
  <LazyBottomSheet isOpen={isOpen}>
    <Content />
  </LazyBottomSheet>
</Suspense>
```

---

## 📊 Component Metadata

### Get Component Information
```typescript
import { 
  getComponentMetadata, 
  getComponentsByCategory,
  HERA_DNA_CATEGORIES 
} from '@/lib/dna'

// Get component metadata
const metadata = getComponentMetadata('StatCardDNA')
console.log(metadata)
// {
//   name: 'StatCardDNA',
//   category: 'CORE_UI',
//   version: '1.0.0',
//   smartCode: 'HERA.DNA.EXPORT.UNIFIED.SYSTEM.v1'
// }

// Get all mobile components
const mobileComponents = getComponentsByCategory('MOBILE')
console.log(mobileComponents)
// ['BottomSheet', 'PullToRefresh']

// View all categories
console.log(HERA_DNA_CATEGORIES)
```

### Component Discovery
```typescript
import { HERA_DNA_INFO } from '@/lib/dna'

console.log(HERA_DNA_INFO)
// {
//   name: 'HERA DNA Component Library',
//   version: '1.0.0',
//   components: {
//     total: 25,
//     categories: ['CORE_UI', 'ENTERPRISE', 'BUSINESS_LOGIC', 'MOBILE', 'SPECIALIZED']
//   }
// }
```

---

## 🎨 Usage Patterns

### Basic Component Usage
```typescript
import { StatCardDNA, UniversalSearch } from '@/lib/dna'

const Dashboard = () => {
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCardDNA
        title="Total Sales"
        value="$125,000"
        trend="+12%"
        icon={DollarSign}
      />
      
      <UniversalSearch
        onSelect={(result) => {
          console.log('Selected:', result)
        }}
      />
    </div>
  )
}
```

### Mobile-First Pattern
```typescript
import { BottomSheet, PullToRefresh, useBottomSheet } from '@/lib/dna'

const MobileApp = () => {
  const { isOpen, open, close } = useBottomSheet()
  
  return (
    <div>
      <PullToRefresh onRefresh={async () => {
        await refreshData()
      }}>
        <DataList />
      </PullToRefresh>
      
      <BottomSheet isOpen={isOpen} onClose={close}>
        <DetailView />
      </BottomSheet>
    </div>
  )
}
```

### Enterprise Dashboard
```typescript
import { 
  EnterpriseDashboard, 
  EnterpriseDataTable, 
  EnterpriseStatsCard 
} from '@/lib/dna'

const BusinessDashboard = () => {
  return (
    <EnterpriseDashboard
      header={
        <div className="grid grid-cols-4 gap-4">
          <EnterpriseStatsCard
            title="Revenue"
            value="$2.4M"
            change="+18%"
          />
          {/* More stats... */}
        </div>
      }
    >
      <EnterpriseDataTable
        data={businessData}
        columns={tableColumns}
        onRowClick={handleRowClick}
      />
    </EnterpriseDashboard>
  )
}
```

---

## 🔧 Advanced Features

### Module Exports
The system also exports specialized modules:

```typescript
// Financial modules
import * as FinancialModules from '@/lib/dna/modules/financial'

// ERP modules
import * as ERPModules from '@/lib/dna/modules/erp'

// Pattern exports
import * as Patterns from '@/lib/dna/patterns'
```

### Theme Integration
```typescript
import { ThemeProviderDNA } from '@/lib/dna'

const App = () => {
  return (
    <ThemeProviderDNA theme="glassmorphic-dark">
      <YourApp />
    </ThemeProviderDNA>
  )
}
```

### Smart Code Integration
```typescript
import { HERA_DNA_SMART_CODES } from '@/lib/dna'

console.log(HERA_DNA_SMART_CODES)
// {
//   EXPORT_SYSTEM: 'HERA.DNA.EXPORT.UNIFIED.SYSTEM.v1',
//   COMPONENT_REGISTRY: 'HERA.DNA.REGISTRY.COMPONENT.SYSTEM.v1',
//   DYNAMIC_LOADING: 'HERA.DNA.LOADER.DYNAMIC.IMPORT.v1'
// }
```

---

## 📱 Mobile-Specific Exports

### Dedicated Mobile Index
```typescript
// Import from mobile-specific index
import { BottomSheet, PullToRefresh } from '@/lib/dna/components/mobile'

// Or import mobile registry
import { MOBILE_COMPONENTS } from '@/lib/dna/components/mobile'
```

### Mobile Component Hook
```typescript
import { useBottomSheet } from '@/lib/dna'

const MobileComponent = () => {
  const bottomSheet = useBottomSheet()
  
  return (
    <div>
      <button onClick={bottomSheet.open}>
        Show Details
      </button>
      
      <BottomSheet {...bottomSheet}>
        <MobileContent />
      </BottomSheet>
    </div>
  )
}
```

---

## 🚀 Performance Optimization

### Tree-Shaking Benefits
```typescript
// ✅ Good - Only imports what you need
import { StatCardDNA } from '@/lib/dna'

// ❌ Avoid - Imports everything
import * as HeraDNA from '@/lib/dna'
```

### Bundle Size Optimization
```typescript
// Use dynamic imports for large components
const LazyDataTable = lazy(() => 
  import('@/lib/dna').then(module => ({ 
    default: module.EnterpriseDataTable 
  }))
)
```

### Code Splitting
```typescript
// Split by feature
const MobileComponents = lazy(() => import('@/lib/dna/components/mobile'))
const EnterpriseComponents = lazy(() => import('@/lib/dna/components/enterprise'))
```

---

## 🔍 Troubleshooting

### Common Import Issues

1. **Component not found**
   ```typescript
   // Check available components
   import { HERA_DNA_CATEGORIES } from '@/lib/dna'
   console.log(HERA_DNA_CATEGORIES)
   ```

2. **Type errors**
   ```typescript
   // Import types explicitly
   import type { StatCardDNAProps } from '@/lib/dna'
   ```

3. **Tree-shaking not working**
   ```typescript
   // Use specific imports
   import { StatCardDNA } from '@/lib/dna/components/ui/stat-card-dna'
   ```

### Debug Information
```typescript
import { getComponentMetadata, HERA_DNA_INFO } from '@/lib/dna'

// Check system info
console.log('DNA Info:', HERA_DNA_INFO)

// Check component metadata
console.log('Component:', getComponentMetadata('StatCardDNA'))
```

---

## 🎯 Best Practices

1. **Use Specific Imports**
   ```typescript
   // Preferred
   import { StatCardDNA, BottomSheet } from '@/lib/dna'
   
   // Avoid unless needed
   import * as HeraDNA from '@/lib/dna'
   ```

2. **Leverage Categories**
   ```typescript
   // For related components
   import { 
     BottomSheet, 
     PullToRefresh 
   } from '@/lib/dna/components/mobile'
   ```

3. **Use Dynamic Loading for Large Components**
   ```typescript
   // For components used conditionally
   const HeavyComponent = lazy(() => loadDNAComponent('enterprise-data-table'))
   ```

4. **Type Safety**
   ```typescript
   // Always import types
   import type { ComponentProps } from '@/lib/dna'
   ```

---

This unified export system makes HERA DNA components easy to discover, import, and use while maintaining excellent performance through tree-shaking and providing comprehensive TypeScript support.