# Furniture Module Organization Context

## Overview

The HERA Furniture Module uses a consistent organization context across all pages to ensure proper data isolation and multi-tenancy support. This document explains how organization handling works throughout the module.

## Organization Resolution Logic

The furniture module determines which organization to use through this priority:

1. **Authenticated Organization** - If user is logged in, uses `currentOrganization` from auth context
2. **Demo Organization** - If not authenticated, uses demo org from URL path (e.g., `/~demo-furniture`)
3. **Fallback Organization** - Default to the furniture demo org ID: `e3a9ff9e-bb83-43a8-b062-b85e7a2b4258`

## Implementation

### 1. Layout Wrapper

All furniture pages are wrapped with `FurnitureOrgProvider` in `/src/app/furniture/layout.tsx`:

```tsx
<FurnitureDarkLayout>
  <FurnitureOrgProvider>
    {children}
  </FurnitureOrgProvider>
</FurnitureDarkLayout>
```

### 2. Using Organization Context

In any furniture page or component:

```tsx
import { useFurnitureOrg } from '@/components/furniture/FurnitureOrgContext'

export default function FurniturePage() {
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()
  
  // Show loading while org is being determined
  if (orgLoading) {
    return <FurnitureOrgLoading />
  }
  
  // Use organizationId for API calls
  universalApi.setOrganizationId(organizationId)
}
```

### 3. Context Provider Features

The `FurnitureOrgProvider` provides:

- `organizationId` - The resolved organization ID
- `organizationName` - Display name of the organization
- `orgLoading` - Loading state while determining organization

### 4. Consistent Loading Component

Use `FurnitureOrgLoading` for consistent loading UI:

```tsx
if (orgLoading) {
  return <FurnitureOrgLoading />
}
```

## Benefits

1. **Consistency** - All pages use the same organization resolution logic
2. **Demo Support** - Works for both authenticated and demo users
3. **Clean Code** - No need to duplicate organization logic in each page
4. **Type Safety** - Fully typed context with TypeScript
5. **Loading States** - Consistent loading UI across all pages

## Pages Using This Pattern

- `/furniture` - Main dashboard
- `/furniture/products` - Products overview
- `/furniture/products/catalog` - Product catalog
- All other furniture module pages

## Migration Guide

To update an existing furniture page:

1. Remove local organization state and logic
2. Import and use `useFurnitureOrg()`
3. Replace loading checks with `orgLoading`
4. Use `organizationId` from context for API calls