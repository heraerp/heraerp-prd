# Migration Example: Furniture Module

## Before (Current Structure)
```typescript
// src/app/furniture/finance/chart-of-accounts/page.tsx
import { ChartOfAccountsService } from '@/lib/furniture/chart-of-accounts-service'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import { useFurnitureOrg } from '@/components/furniture/FurnitureOrgContext'
```

## After (Enterprise Structure)
```typescript
// src/app/(modules)/furniture/finance/chart-of-accounts/page.tsx
import { ChartOfAccountsService } from '@furniture/services'
import { FurniturePageHeader } from '@furniture/components'
import { useFurnitureOrg } from '@furniture/hooks'
```

## Step-by-Step Migration

### 1. Move the Service
```bash
# Move service to new location
mv src/lib/furniture/chart-of-accounts-service.ts \
   src/modules/furniture/services/chart-of-accounts-service.ts

# Create barrel export
echo "export * from './chart-of-accounts-service'" >> \
   src/modules/furniture/services/index.ts
```

### 2. Move the Components
```bash
# Move components
mv src/components/furniture/FurniturePageHeader.tsx \
   src/modules/furniture/components/FurniturePageHeader.tsx

mv src/components/furniture/FurnitureOrgContext.tsx \
   src/modules/furniture/hooks/useFurnitureOrg.tsx
```

### 3. Update Imports Gradually
```typescript
// Option 1: Use compatibility imports (no code change needed)
// Add to src/lib/furniture/chart-of-accounts-service.ts
export * from '@furniture/services/chart-of-accounts-service'

// Option 2: Update imports directly
import { ChartOfAccountsService } from '@furniture/services'
```

## Benefits of This Approach

### 1. **Clear Module Boundaries**
```
src/modules/furniture/
├── components/          # UI components
├── services/           # Business logic
├── hooks/             # React hooks
├── types/             # TypeScript types
└── utils/             # Utilities
```

### 2. **Better Team Collaboration**
- Team A works on `@furniture/*`
- Team B works on `@salon/*`
- No merge conflicts

### 3. **Easier Testing**
```typescript
// Easy to mock entire modules
jest.mock('@furniture/services', () => ({
  ChartOfAccountsService: MockChartOfAccountsService
}))
```

### 4. **Better Code Splitting**
```typescript
// Lazy load entire modules
const FurnitureModule = lazy(() => import('@furniture/components'))
```

## Incremental Migration Path

### Week 1: Setup Structure
- Run the reorganization script
- Update tsconfig.json
- Create compatibility exports

### Week 2: Migrate Services
- Move all services to modules/*/services
- Update barrel exports
- Keep compatibility imports

### Week 3: Migrate Components
- Move components to modules/*/components
- Convert contexts to hooks
- Update imports in pages

### Week 4: Cleanup
- Remove compatibility imports
- Update all imports to new paths
- Remove old directories

## Common Patterns

### Service Pattern
```typescript
// src/modules/furniture/services/inventory-service.ts
export class InventoryService {
  constructor(private api: UniversalAPI) {}
  
  async getInventory(orgId: string) {
    // Business logic here
  }
}

// Export from barrel
// src/modules/furniture/services/index.ts
export * from './inventory-service'
```

### Hook Pattern
```typescript
// src/modules/furniture/hooks/useInventory.ts
export function useInventory(organizationId: string) {
  const [inventory, setInventory] = useState([])
  // Hook logic here
  return { inventory, loading, error }
}

// Export from barrel
// src/modules/furniture/hooks/index.ts
export * from './useInventory'
```

### Component Pattern
```typescript
// src/modules/furniture/components/InventoryList.tsx
export function InventoryList({ items }: InventoryListProps) {
  return <div>...</div>
}

// Export from barrel
// src/modules/furniture/components/index.ts
export * from './InventoryList'
```

## Import Codemod Script

```javascript
// scripts/update-imports.js
module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  // Update imports
  root.find(j.ImportDeclaration).forEach(path => {
    const value = path.node.source.value;
    
    // Update furniture imports
    if (value.includes('@/lib/furniture/')) {
      path.node.source.value = value.replace(
        '@/lib/furniture/',
        '@furniture/services/'
      );
    }
    
    if (value.includes('@/components/furniture/')) {
      path.node.source.value = value.replace(
        '@/components/furniture/',
        '@furniture/components/'
      );
    }
  });

  return root.toSource();
};
```

Run with: `npx jscodeshift -t scripts/update-imports.js src/`