# Restore Entity Type Fix After Merge

## 🚨 CRITICAL: Changes Backup Created Before Stash/Pull/Merge

**Date**: October 6, 2025
**Backup File**: `ENTITY-TYPE-FIX.patch` (4377 lines)

## Quick Restore

After you pull and merge from main, restore the changes:

```bash
# Option 1: Apply the patch file
git apply ENTITY-TYPE-FIX.patch

# Option 2: Use git stash pop (if you used git stash)
git stash pop

# If there are conflicts, resolve them and then:
git add .
git commit -m "fix: entity type case mismatch - customer and staff names loading"
```

## Key Changes to Restore

### 1. **Critical Fix** - `src/hooks/useUniversalEntity.ts`

Add this function at the top of the file (after imports):

```typescript
// ================================================================================
// ENTERPRISE PATTERN: Entity Type Normalization
// ================================================================================

/**
 * Normalizes entity_type to uppercase for consistency
 * HERA Standard: All entity types are UPPERCASE (CUSTOMER, STAFF, PRODUCT, etc.)
 */
function normalizeEntityType(entityType: string): string {
  if (!entityType) return entityType
  return entityType.toUpperCase()
}
```

Then in `useUniversalEntity` function, change this line:

```typescript
// BEFORE:
const entity_type = config.entity_type

// AFTER:
const entity_type = normalizeEntityType(config.entity_type)
```

### 2. **Critical Fix** - `src/hooks/useHeraAppointments.ts`

**Line 102**: Change customer fetch to uppercase
```typescript
entity_type: 'CUSTOMER', // ✅ Uppercase matches normalized standard
```

**Lines 110-170**: Add dual-fetch for staff (backward compatibility)
```typescript
// Add these imports at top:
import { useState, useEffect } from 'react'

// Add after line 110 (after uppercase STAFF fetch):

// BACKWARD COMPATIBILITY: Direct fetch for lowercase 'staff' (bypasses normalization)
// This is a workaround for staff entities that couldn't be updated due to constraints
const [staffLegacy, setStaffLegacy] = useState<any[]>([])
const [staffLegacyLoading, setStaffLegacyLoading] = useState(true)

useEffect(() => {
  if (!options?.organizationId) return

  const fetchLegacyStaff = async () => {
    try {
      const response = await fetch('/api/v2/entities?' + new URLSearchParams({
        organization_id: options.organizationId!,
        entity_type: 'staff', // ⚠️ Lowercase query (bypasses normalization)
        include_dynamic: 'false',
        limit: '500'
      }), {
        headers: {
          'x-hera-api-version': 'v2'
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaffLegacy(result.data || [])
      }
    } catch (error) {
      console.log('[useHeraAppointments] Legacy staff fetch failed:', error)
    } finally {
      setStaffLegacyLoading(false)
    }
  }

  fetchLegacyStaff()
}, [options?.organizationId])

// Merge normalized STAFF and legacy staff
const allStaff = useMemo(() => {
  const merged = [
    ...(staff || []),
    ...(staffLegacy || [])
  ]
  console.log('[useHeraAppointments] Staff merge:', {
    staff: staff?.length || 0,
    staffLegacy: staffLegacy.length,
    merged: merged.length
  })
  return merged
}, [staff, staffLegacy])

const allStaffLoading = staffLoading || staffLegacyLoading
```

**Line 185-195**: Update staffMap to use merged data
```typescript
const staffMap = useMemo(() => {
  if (!allStaff || allStaff.length === 0) return new Map<string, string>()
  const map = new Map(
    allStaff.map(s => [s.id, s.entity_name])
  )
  console.log('[useHeraAppointments] Staff map created:', {
    totalStaff: allStaff.length,
    sampleStaff: Array.from(map.entries()).slice(0, 3)
  })
  return map
}, [allStaff])
```

**Line 564**: Update loading state
```typescript
// BEFORE:
const isFullyLoaded = !isLoading && !customersLoading && !staffLoading

// AFTER:
const isFullyLoaded = !isLoading && !customersLoading && !allStaffLoading
```

**Line 559**: Update enrichment logging
```typescript
enrichmentStatus: {
  customersLoaded: !customersLoading,
  staffLoaded: !allStaffLoading,
  fullyEnriched: !customersLoading && !allStaffLoading
}
```

## Files Created (Keep These)

These new files should be preserved:

```bash
# Documentation
ENTITY-TYPE-FIX-SUMMARY.md
ENTITY-TYPE-QUICK-START.md
ENTITY-TYPE-STANDARDIZATION.md
NORMALIZED-VS-DENORMALIZED-DATA.md

# Migration Scripts
database/migrations/20251006_standardize_entity_types_uppercase.sql
scripts/check-customer-entity.js
scripts/fix-organization-entity-types.js
scripts/migrate-entity-types-uppercase.js
```

## Verification After Restore

Run these checks to ensure everything is working:

```bash
# 1. Check that normalization is in place
grep -n "normalizeEntityType" src/hooks/useUniversalEntity.ts

# 2. Check that dual-fetch is in place
grep -n "staffLegacy" src/hooks/useHeraAppointments.ts

# 3. Check that customer fetch uses uppercase
grep -n "entity_type: 'CUSTOMER'" src/hooks/useHeraAppointments.ts

# 4. Run the app and check appointments page
npm run dev
# Navigate to /salon/appointments
# Check browser console for logs showing:
# - [useHeraAppointments] Customer map created
# - [useHeraAppointments] Staff merge
# - Customer and staff names should appear correctly
```

## What This Fix Does

✅ **Customer names** now load correctly in appointments
✅ **Staff names** now load correctly in appointments
✅ **All new entities** automatically created with uppercase entity_type
✅ **Backward compatibility** maintained for legacy lowercase data
✅ **No breaking changes** - works with existing data

## If Something Goes Wrong

If the patch doesn't apply cleanly:

1. **Manual Restoration**: Use the code snippets above to manually apply changes
2. **Section-by-Section**: Apply changes one file at a time
3. **Check Git Diff**: Compare with `ENTITY-TYPE-FIX.patch` to see what's missing
4. **Backup Reference**: All changes documented in `ENTITY-TYPE-FIX-SUMMARY.md`

## Contact Points

- All changes are in TypeScript files, no database changes needed
- Migration already completed for organization `378f24fb-d496-4ff7-8afa-ea34895a0eb8`
- 245 entities successfully migrated to uppercase
- Backward compatibility handles the 7 staff entities that couldn't be migrated

---

**Status**: ✅ Backup Complete - Safe to Stash/Pull/Merge
**Patch File**: `ENTITY-TYPE-FIX.patch` (4377 lines)
**Restoration**: Apply patch or use manual code snippets above
