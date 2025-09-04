# Dashboard Error Fixes

## Errors Fixed:

### 1. API Method Name Error
**Error**: `salonApiClient.getDashboard is not a function`
**Fix**: Changed method name from `getDashboard` to `getDashboardData`

### 2. Infinite Re-render Loop
**Error**: `Too many re-renders. React limits the number of renders to prevent an infinite loop`
**Fixes Applied**:
- Added `useCallback` to wrap `fetchDashboardData` function
- Added proper dependencies to prevent recreation on every render
- Added `!data.loading` check to prevent multiple simultaneous fetches
- Removed duplicate `fetchDashboardData` call from organization change effect
- Updated dependency arrays to prevent infinite loops

## Code Changes:

1. **Import useCallback**:
   ```typescript
   import React, { useEffect, useState, useRef, useCallback } from 'react'
   ```

2. **Wrapped fetchDashboardData with useCallback**:
   ```typescript
   const fetchDashboardData = useCallback(withErrorHandler(async () => {
     // ... function body
   }), [organizationId])
   ```

3. **Updated useEffect with proper dependencies**:
   ```typescript
   useEffect(() => {
     if (organizationId && !data.loading) {
       fetchDashboardData()
     }
   }, [organizationId, fetchDashboardData, data.loading])
   ```

4. **Removed duplicate fetch call** from organization change handler

## Result:
- Dashboard now loads without infinite re-renders
- API calls work correctly with the proper method name
- Navigation is functional with page-based routing