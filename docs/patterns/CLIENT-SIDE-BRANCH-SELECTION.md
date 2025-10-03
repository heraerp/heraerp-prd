# Client-Side Branch Selection Pattern

## Overview

The Client-Side Branch Selection pattern is a production-proven approach in HERA for managing multi-location businesses. It allows users to select a branch/location from the UI, and all subsequent data operations are automatically scoped to that branch.

## Key Components

### 1. SecuredSalonProvider (or BranchProvider)

A React Context Provider that manages:
- Currently selected branch ID
- Available branches for the user
- Loading states
- Branch switching logic

### 2. Branch Selection UI

Typically implemented as a dropdown in the application header that:
- Shows available branches
- Displays current branch name
- Allows switching between branches
- Persists selection to localStorage

### 3. Automatic Data Filtering

All data queries automatically filter by the selected branch using:
- Relationship filters (`MEMBER_OF`, `AVAILABLE_AT`, etc.)
- Metadata filters (`location_id`)
- Header propagation (`x-hera-location-id`)

## Implementation Guide

### Step 1: Create the Branch Context

```typescript
// lib/contexts/BranchContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface Branch {
  id: string;
  name: string;
  organization_id: string;
  entity_type: 'LOCATION';
  metadata?: Record<string, any>;
}

interface BranchContextType {
  selectedBranchId: string | null;
  selectedBranch: Branch | null;
  availableBranches: Branch[];
  setSelectedBranchId: (branchId: string) => void;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function SecuredSalonProvider({ children }: { children: ReactNode }) {
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [availableBranches, setAvailableBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBranches() {
      try {
        const response = await fetch('/api/v2/entities?entity_type=LOCATION', {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'x-hera-api-version': 'v2'
          }
        });
        
        const data = await response.json();
        setAvailableBranches(data.entities || []);
        
        // Set default branch
        const savedBranchId = localStorage.getItem('selectedBranchId');
        const defaultBranchId = savedBranchId || data.entities[0]?.id;
        if (defaultBranchId) {
          setSelectedBranchId(defaultBranchId);
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBranches();
  }, []);

  const selectedBranch = availableBranches.find(
    branch => branch.id === selectedBranchId
  ) || null;

  const handleSetBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    localStorage.setItem('selectedBranchId', branchId);
  };

  const value = {
    selectedBranchId,
    selectedBranch,
    availableBranches,
    setSelectedBranchId: handleSetBranch,
    isLoading
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranchContext() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranchContext must be used within SecuredSalonProvider');
  }
  return context;
}
```

### Step 2: Create Branch Selector Component

```typescript
// components/BranchSelector.tsx
import { useBranchContext } from '@/lib/contexts/BranchContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function BranchSelector() {
  const { 
    selectedBranchId, 
    availableBranches, 
    setSelectedBranchId,
    isLoading 
  } = useBranchContext();

  if (isLoading) {
    return <div className="animate-pulse h-10 w-48 bg-gray-200 rounded" />;
  }

  if (availableBranches.length === 0) {
    return null;
  }

  return (
    <Select 
      value={selectedBranchId || ''} 
      onValueChange={setSelectedBranchId}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a branch" />
      </SelectTrigger>
      <SelectContent>
        {availableBranches.map(branch => (
          <SelectItem key={branch.id} value={branch.id}>
            {branch.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### Step 3: Wrap Application with Provider

```typescript
// app/layout.tsx
import { SecuredSalonProvider } from '@/lib/contexts/BranchContext';

export default function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <html lang="en">
      <body>
        <SecuredSalonProvider>
          <Header />
          <main>{children}</main>
        </SecuredSalonProvider>
      </body>
    </html>
  );
}
```

### Step 4: Use Branch Context in Pages

```typescript
// app/staff/page.tsx
import { useBranchContext } from '@/lib/contexts/BranchContext';
import { useQuery } from '@tanstack/react-query';

export default function StaffPage() {
  const { selectedBranchId, selectedBranch } = useBranchContext();

  const { data: staff, isLoading } = useQuery({
    queryKey: ['staff', selectedBranchId],
    queryFn: async () => {
      const response = await fetch(
        `/api/v2/entities?entity_type=STAFF&relationship_filter=MEMBER_OF:${selectedBranchId}`,
        {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
            'x-hera-api-version': 'v2',
            'x-hera-location-id': selectedBranchId || ''
          }
        }
      );
      return response.json();
    },
    enabled: !!selectedBranchId
  });

  if (!selectedBranchId) {
    return <div>Please select a branch</div>;
  }

  if (isLoading) {
    return <div>Loading staff...</div>;
  }

  return (
    <div>
      <h1>Staff at {selectedBranch?.name}</h1>
      <StaffList staff={staff?.entities || []} />
    </div>
  );
}
```

## Relationship Patterns

### Common Branch Relationships

| Relationship | From Entity | To Entity | Description |
|-------------|-------------|-----------|-------------|
| `MEMBER_OF` | STAFF | LOCATION | Staff member works at branch |
| `AVAILABLE_AT` | SERVICE | LOCATION | Service offered at branch |
| `STOCK_AT` | PRODUCT | LOCATION | Product inventory at branch |
| `BOOKED_AT` | APPOINTMENT | LOCATION | Appointment at branch |
| `LOCATED_AT` | EQUIPMENT | LOCATION | Equipment at branch |

### Creating Entities with Branch Relationships

```typescript
// When creating a new staff member
const createStaff = useMutation({
  mutationFn: async (staffData: CreateStaffData) => {
    const response = await fetch('/api/v2/entities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hera-api-version': 'v2',
        'x-hera-location-id': selectedBranchId || ''
      },
      body: JSON.stringify({
        p_entity_type: 'STAFF',
        p_entity_name: staffData.name,
        p_smart_code: 'HERA.SALON.CRM.ENT.STAFF.v1',
        p_dynamic_fields: {
          role: { value: staffData.role, type: 'text' },
          commission_rate: { value: staffData.commission, type: 'number' }
        },
        p_relationships: {
          MEMBER_OF: [selectedBranchId] // Automatically link to branch
        }
      })
    });
    return response.json();
  }
});
```

## Query Patterns

### 1. Relationship-Based Filtering

```typescript
// Get all staff at selected branch
const url = `/api/v2/entities?entity_type=STAFF&relationship_filter=MEMBER_OF:${branchId}`;

// Get all services available at branch
const url = `/api/v2/entities?entity_type=SERVICE&relationship_filter=AVAILABLE_AT:${branchId}`;

// Get appointments at branch for today
const url = `/api/v2/entities?entity_type=APPOINTMENT&relationship_filter=BOOKED_AT:${branchId}&date_filter=today`;
```

### 2. Metadata-Based Filtering

```typescript
// Filter by location_id in metadata
const url = `/api/v2/entities?entity_type=INVENTORY&metadata_filter=location_id:${branchId}`;
```

### 3. Transaction Filtering

```typescript
// Get transactions at branch (branch as target entity)
const url = `/api/v2/transactions?target_entity_id=${branchId}`;

// Or using metadata
const url = `/api/v2/transactions?metadata_filter=location_id:${branchId}`;
```

## Best Practices

### 1. Always Include Branch Context Header

```typescript
// Include in all API calls
headers: {
  'x-hera-location-id': selectedBranchId || ''
}
```

### 2. Handle Loading States

```typescript
const { selectedBranchId, isLoading: branchLoading } = useBranchContext();

if (branchLoading) {
  return <LoadingSpinner />;
}

if (!selectedBranchId) {
  return <SelectBranchPrompt />;
}
```

### 3. Invalidate Queries on Branch Change

```typescript
useEffect(() => {
  // Invalidate all queries when branch changes
  queryClient.invalidateQueries();
}, [selectedBranchId]);
```

### 4. Create Reusable Hooks

```typescript
// hooks/useBranchData.ts
export function useBranchStaff() {
  const { selectedBranchId } = useBranchContext();
  
  return useQuery({
    queryKey: ['staff', selectedBranchId],
    queryFn: () => fetchStaffForBranch(selectedBranchId),
    enabled: !!selectedBranchId
  });
}

export function useBranchServices() {
  const { selectedBranchId } = useBranchContext();
  
  return useQuery({
    queryKey: ['services', selectedBranchId],
    queryFn: () => fetchServicesForBranch(selectedBranchId),
    enabled: !!selectedBranchId
  });
}
```

## Security Considerations

### 1. Server-Side Validation

**CRITICAL**: Always validate on the server that the user has permission to access the requested branch.

```typescript
// api/v2/entities/route.ts
export async function GET(request: NextRequest) {
  const locationId = request.headers.get('x-hera-location-id');
  
  if (locationId) {
    // Verify user has access to this location
    const hasAccess = await verifyUserLocationAccess(userId, locationId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
  }
  
  // Continue with filtered query...
}
```

### 2. Branch Access Control

Implement proper RBAC for branch access:

```typescript
// Example branch access rules
const branchAccessRules = {
  'OWNER': '*', // Access to all branches
  'MANAGER': ['branch-id-1', 'branch-id-2'], // Specific branches
  'STAFF': ['branch-id-1'], // Single branch
};
```

### 3. Data Isolation

Ensure complete data isolation between branches:
- Use RLS policies in database
- Filter all queries by branch
- Validate branch ownership for updates/deletes

## Common Patterns

### 1. Dashboard with Branch Metrics

```typescript
function BranchDashboard() {
  const { selectedBranchId, selectedBranch } = useBranchContext();
  
  const { data: metrics } = useQuery({
    queryKey: ['metrics', selectedBranchId],
    queryFn: () => fetchBranchMetrics(selectedBranchId),
    enabled: !!selectedBranchId
  });

  return (
    <div>
      <h1>{selectedBranch?.name} Dashboard</h1>
      <MetricsGrid metrics={metrics} />
    </div>
  );
}
```

### 2. Branch-Specific Settings

```typescript
function BranchSettings() {
  const { selectedBranchId } = useBranchContext();
  
  const { data: settings } = useQuery({
    queryKey: ['settings', selectedBranchId],
    queryFn: () => fetchBranchSettings(selectedBranchId),
    enabled: !!selectedBranchId
  });

  return <SettingsForm settings={settings} branchId={selectedBranchId} />;
}
```

### 3. Multi-Branch Comparison

```typescript
function BranchComparison() {
  const { availableBranches } = useBranchContext();
  
  const { data: comparisonData } = useQuery({
    queryKey: ['comparison', availableBranches.map(b => b.id)],
    queryFn: () => fetchMultiBranchMetrics(availableBranches.map(b => b.id))
  });

  return <ComparisonChart data={comparisonData} branches={availableBranches} />;
}
```

## Troubleshooting

### Common Issues

1. **Branch not persisting on refresh**
   - Check localStorage implementation
   - Ensure provider wraps entire app

2. **Data not filtering by branch**
   - Verify relationship exists in database
   - Check query parameters are correct
   - Ensure header is being sent

3. **Performance issues with branch switching**
   - Implement proper query invalidation
   - Use optimistic updates where possible
   - Consider caching strategies

## Migration Guide

If migrating from prop-based branch passing:

1. Remove all branch prop drilling
2. Wrap app with SecuredSalonProvider
3. Replace props with useBranchContext() hook
4. Update queries to use branch context
5. Add branch relationships to existing data

## Related Documentation

- [Multi-Tenant Authentication Guide](../MULTI-TENANT-AUTH-GUIDE.md)
- [Universal API Documentation](../UNIVERSAL-API-V2.md)
- [Relationship Patterns](../patterns/RELATIONSHIP-PATTERNS.md)