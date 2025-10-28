# React Query Cache Issue - Leave Requests Showing 23 Items

## Problem
- Database has 0 transactions (verified)
- UI shows "Total Requests: 23" 
- We deleted all transactions yesterday

## Root Cause
**React Query is showing CACHED data from browser localStorage/memory**

## Solution: Clear Browser Cache

### Method 1: Hard Refresh (Fastest)
1. Open the app in browser
2. Press `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
3. This forces a full page reload bypassing cache

### Method 2: Clear React Query DevTools
1. Open React Query DevTools (bottom-left icon)
2. Click "Clear Cache" button
3. Or invalidate specific queries: `leave-requests`, `transactions-v1`

### Method 3: Clear Browser Storage (Most Complete)
1. Open Browser DevTools (F12)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click "Clear storage" or "Clear site data"
4. Reload page

### Method 4: Incognito/Private Window
1. Open app in incognito/private browsing mode
2. This starts with completely fresh cache
3. Should show 0 transactions

## Verification
After clearing cache, you should see:
- Total Requests: 0
- This year: 0  
- Pending: 0

## Why This Happened
React Query caches data for performance. When we deleted transactions via script:
- Database was updated ✅
- But browser cache wasn't invalidated ❌
- UI continued showing old cached data

## Prevention
When cleaning data via scripts, also:
1. Close browser tabs with the app open
2. Or hard refresh after running cleanup scripts
3. Or use invalidateQueries in the app
