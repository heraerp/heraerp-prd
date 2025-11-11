# Settings Page Organization Data Diagnostic Guide

## Problem Statement
Organization data (name, legal_name, phone, email, address, trn) is not displaying in the settings page form fields when navigating to `/salon/settings`.

## Diagnostic Logging Added

I've added comprehensive diagnostic logging to understand the data flow without making any functional changes. The logging appears in three critical locations:

### 1. Settings Page (`/src/app/salon/settings/page.tsx` - Lines 110-126)

**What it shows:**
- Complete organization object structure
- All object keys present
- Individual property values (name, legal_name, phone, email, address, trn, etc.)
- Settings object contents

**Console Output Pattern:**
```
[Settings DEBUG] ============================================
[Settings DEBUG] Full organization object: { ... }
[Settings DEBUG] Object keys: ["id", "name", "legal_name", ...]
[Settings DEBUG] Property values: { name: "...", legal_name: "...", ... }
[Settings DEBUG] Settings object: { ... }
[Settings DEBUG] ============================================
```

### 2. SecuredSalonProvider - Dynamic Data Transformation (`/src/app/salon/SecuredSalonProvider.tsx` - Lines 1241-1245)

**What it shows:**
- Raw dynamic_data array from database
- Transformed settingsFromDynamic object
- Field names found during transformation

**Console Output Pattern:**
```
[loadOrganizationDetails DEBUG] ============================================
[loadOrganizationDetails DEBUG] Dynamic data array: [{ field_name: "...", field_value_text: "..." }, ...]
[loadOrganizationDetails DEBUG] Transformed settingsFromDynamic: { legal_name: "...", phone: "...", ... }
[loadOrganizationDetails DEBUG] Field names found: ["legal_name", "phone", "email", ...]
[loadOrganizationDetails DEBUG] ============================================
```

### 3. SecuredSalonProvider - Final Organization Object (`/src/app/salon/SecuredSalonProvider.tsx` - Lines 1305-1318)

**What it shows:**
- Final orgData object being returned to context
- Top-level properties confirmed

**Console Output Pattern:**
```
[loadOrganizationDetails DEBUG] ============================================
[loadOrganizationDetails DEBUG] Final orgData object being returned: { ... }
[loadOrganizationDetails DEBUG] Top-level properties: { id: "...", name: "...", legal_name: "...", ... }
[loadOrganizationDetails DEBUG] ============================================
```

## How to Test

### Step 1: Open Browser DevTools
1. Start the development server (if not running): `npm run dev`
2. Open your browser to `http://localhost:3000`
3. Open DevTools (F12 or Cmd+Option+I)
4. Go to the **Console** tab
5. Clear any existing logs (trash icon)

### Step 2: Navigate to Settings Page
1. Navigate to `/salon/settings` (or use the navigation menu)
2. Wait for page to fully load
3. Check console output

### Step 3: Analyze Console Output

**Look for these diagnostic sections:**

#### Section A: Settings Page Receives Organization Data
```
[Settings DEBUG] ============================================
[Settings DEBUG] Full organization object: { ... }
```

**Questions to answer:**
- Is the organization object empty `{}`?
- Does it have an `id` field?
- Are `legal_name`, `phone`, `email`, `address`, `trn` present?
- Are they `undefined`, `null`, or empty strings `""`?

#### Section B: Dynamic Data Transformation
```
[loadOrganizationDetails DEBUG] Dynamic data array: [ ... ]
[loadOrganizationDetails DEBUG] Transformed settingsFromDynamic: { ... }
```

**Questions to answer:**
- Is the dynamic_data array empty `[]`?
- If not empty, what field_name values are present?
- Are the values being extracted correctly?
- Do the field names match expectations (e.g., `legal_name`, `phone`, `email`)?

#### Section C: Final Organization Object
```
[loadOrganizationDetails DEBUG] Final orgData object being returned: { ... }
[loadOrganizationDetails DEBUG] Top-level properties: { ... }
```

**Questions to answer:**
- Is this the final object structure that settings page receives?
- Are all properties present at the top level?
- Are any values `undefined` or `null`?

## Interpretation Guide

### Scenario 1: Dynamic Data Array is Empty
**Console Output:**
```
[loadOrganizationDetails DEBUG] Dynamic data array: []
[loadOrganizationDetails DEBUG] Transformed settingsFromDynamic: {}
```

**Diagnosis:** Organization fields were never saved to `core_dynamic_data` table.

**Next Steps:**
1. Check if organization entity exists in database
2. Verify if dynamic fields were created when organization was set up
3. Manually save organization settings to populate fields

### Scenario 2: Field Names Don't Match
**Console Output:**
```
[loadOrganizationDetails DEBUG] Field names found: ["organization_name", "org_phone", ...]
```

**Diagnosis:** Field names in database don't match what settings page expects.

**Next Steps:**
1. Compare actual field names with expected names:
   - Expected: `legal_name`, `phone`, `email`, `address`, `trn`
   - Actual: (whatever appears in console)
2. Either:
   - Update field names in database, OR
   - Update field name mapping in code

### Scenario 3: Values Extracted But Not Reaching Form
**Console Output:**
```
[loadOrganizationDetails DEBUG] Transformed settingsFromDynamic: { legal_name: "ACME Legal", phone: "+971..." }
[Settings DEBUG] Property values: { legal_name: undefined, phone: undefined }
```

**Diagnosis:** Values are extracted correctly but not reaching settings page form.

**Next Steps:**
1. Check useEffect dependencies in settings page
2. Verify organization object structure matches what page expects
3. Check for timing issues (data arrives after form initializes)

### Scenario 4: Everything Looks Correct But Form is Empty
**Console Output:**
```
[loadOrganizationDetails DEBUG] Top-level properties: { legal_name: "ACME Legal", phone: "+971..." }
[Settings DEBUG] Property values: { legal_name: "ACME Legal", phone: "+971..." }
```

**Diagnosis:** Data is present but form state not updating.

**Next Steps:**
1. Check if useEffect is running (look for DEBUG logs)
2. Verify form state setters are being called
3. Check for React StrictMode double-render issues
4. Inspect form input `value` props

## What to Report Back

When you navigate to `/salon/settings`, please copy and paste:

1. **The complete console output** from all three DEBUG sections
2. **Screenshots of the console** showing the full object structures
3. **What you see in the form fields** (are they empty, showing default values, or showing data?)

## No Functional Changes Made

**IMPORTANT:** The diagnostic logging does NOT change any behavior:
- ✅ No data structures modified
- ✅ No business logic changed
- ✅ Only `console.log` statements added
- ✅ Safe to test in development environment

## Rollback (If Needed)

If you want to remove the diagnostic logging later, search for:
```
[Settings DEBUG]
[loadOrganizationDetails DEBUG]
```

And remove those console.log blocks.

## Status
✅ **Diagnostic logging successfully added**
⏳ **Awaiting test results and console output**
