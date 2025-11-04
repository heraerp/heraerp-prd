# 🔍 Organization Selector Diagnostic Guide

**Date**: 2025-01-15
**Status**: 🟡 **DIAGNOSTIC MODE ACTIVATED**
**Issue**: User reports clicking "Salon" org loads "Cashew" org data

---

## 🎯 Purpose

This document guides you through diagnosing organization data issues in the organization selector page.

**User's Report**:
> "when I click on salon it loads with cashew org - check if it has the correct user role also"

**What We're Investigating**:
1. Does each organization tile have its own correct org ID?
2. Does each organization have the correct apps array?
3. Is the correct organization data being passed when clicked?
4. Is the switchOrganization function receiving the correct org ID?
5. Does each organization have the correct user role?

---

## 🛠️ Diagnostic Logging Added

### Location: `/src/app/auth/organizations/page.tsx`

### 1. **Page Load Diagnostics** (Lines 31-55)

**When Organizations Array Loads**:
```
🔍 [ORG PAGE] ====================== ORGANIZATIONS DATA ======================
🔍 [ORG PAGE] Total organizations loaded: X

🔍 [ORG PAGE] Organization 1/X:
  - ID: uuid-here
  - Name: Hair Talkz Salon
  - Code: SALON
  - Type: salon
  - Primary Role: ORG_OWNER
  - User Role: ORG_OWNER
  - All Roles: [...]
  - Apps: [{code: 'SALON', name: 'Salon Management', ...}]
  - Apps Count: 1
  - First App: {code: 'SALON', name: 'Salon Management', ...}
  - Settings: {...}
  - Joined At: 2024-xx-xx

... (repeats for each organization)

🔍 [ORG PAGE] ====================== END ORGANIZATIONS DATA ======================
```

**What to Look For**:
- ✅ Each organization should have a unique ID
- ✅ Each organization should have its own correct apps array
- ✅ "Hair Talkz Salon" should have `apps: [{code: 'SALON', ...}]`
- ✅ "Cashew Financial Services" should have `apps: [{code: 'CASHEW', ...}]`
- ❌ If "Hair Talkz Salon" has `apps: [{code: 'CASHEW', ...}]` → **DATA CORRUPTION**

### 2. **Click Event Diagnostics** (Lines 57-89)

**When User Clicks an Organization**:
```
🏢 [ORG SELECTOR] ======================
🏢 [ORG SELECTOR] Selecting organization: Hair Talkz Salon
🏢 [ORG SELECTOR] Full org object: {...}
🏢 [ORG SELECTOR] Org ID: uuid-here
🏢 [ORG SELECTOR] Org Code: SALON
🏢 [ORG SELECTOR] Org Name: Hair Talkz Salon
🏢 [ORG SELECTOR] Org Type: salon
🏢 [ORG SELECTOR] Primary Role: ORG_OWNER
🏢 [ORG SELECTOR] User Role: ORG_OWNER
🏢 [ORG SELECTOR] All Roles: [...]
🏢 [ORG SELECTOR] Apps: [{code: 'SALON', ...}]
🏢 [ORG SELECTOR] Settings: {...}
🏢 [ORG SELECTOR] ======================

📱 [ORG SELECTOR] Apps for selected organization:
  orgId: uuid-here
  orgName: Hair Talkz Salon
  apps: [{code: 'SALON', ...}]
  appsCount: 1
  firstAppCode: SALON
  firstAppName: Salon Management

✅ Redirecting to Salon Management -> /salon/dashboard
```

**What to Look For**:
- ✅ Org Code should match the clicked organization
- ✅ Apps array should match the clicked organization
- ✅ firstAppCode should match the intended app
- ❌ If you click "Salon" but see `firstAppCode: CASHEW` → **SELECTOR BUG**

### 3. **HERAAuth Context Switch Diagnostics**

**From HERAAuthProvider.tsx** (switchOrganization function):
```
🔄 [HERAAuth] Switching to organization: uuid-here
🔍 [HERAAuth] Available organizations: [{id: '...', name: '...'}]
✅ [HERAAuth] Role extracted from organizations array:
  orgId: uuid-here
  orgName: Hair Talkz Salon
  orgCode: SALON
  primaryRole: ORG_OWNER
  extractedRole: owner
  allRoles: [...]
  apps: ['SALON']

✅ [HERAAuth] Updated localStorage with new organization and role:
  orgId: uuid-here
  orgName: Hair Talkz Salon
  orgCode: SALON
  role: owner
  allLocalStorageKeys: {...}

✅ [HERAAuth] Switch complete - context updated
```

**What to Look For**:
- ✅ orgId should match the clicked organization
- ✅ orgCode should match the clicked organization
- ✅ apps array should match the clicked organization
- ❌ If you click "Salon" but see `orgCode: CASHEW` → **CONTEXT SWITCH BUG**

---

## 🧪 Testing Instructions

### Step 1: Open Browser Console
1. Open your browser (Chrome/Firefox/Safari)
2. Press **F12** (or Cmd+Option+I on Mac)
3. Click on **Console** tab
4. Clear the console (click the 🚫 icon)

### Step 2: Navigate to Login
1. Go to `http://localhost:3000/auth/login`
2. Click **"Login as Demo User"**
3. Wait for redirect to `/auth/organizations`

### Step 3: Review Page Load Diagnostics
Look for the section:
```
🔍 [ORG PAGE] ====================== ORGANIZATIONS DATA ======================
```

**Check Each Organization**:
- [ ] Does "Hair Talkz Salon" have `apps: [{code: 'SALON', ...}]`?
- [ ] Does "Cashew Financial Services" have `apps: [{code: 'CASHEW', ...}]`?
- [ ] Does each organization have a unique ID?
- [ ] Does each organization have the correct primary_role?

### Step 4: Test Organization Selection
1. Click on **"Hair Talkz Salon"** tile
2. Look for the section:
```
🏢 [ORG SELECTOR] ======================
```

**Verify**:
- [ ] Does `Org Name` show "Hair Talkz Salon"?
- [ ] Does `Org Code` show "SALON"?
- [ ] Does `Apps` show `[{code: 'SALON', ...}]`?
- [ ] Does `firstAppCode` show "SALON"?
- [ ] Does it redirect to `/salon/dashboard`?

### Step 5: Check Context Switch
Look for the section:
```
🔄 [HERAAuth] Switching to organization: ...
```

**Verify**:
- [ ] Does `orgName` match the clicked organization?
- [ ] Does `orgCode` match the clicked organization?
- [ ] Does `apps` array match the clicked organization?
- [ ] Does localStorage get updated with correct org ID?

### Step 6: Verify App Load
After redirect to dashboard:
- [ ] Does the page show the correct organization name in header?
- [ ] Does the page show the correct app (Salon vs Cashew)?
- [ ] Does the page show the correct user role?

---

## 🚨 Common Issues & Solutions

### Issue 1: Organizations Have Wrong Apps
**Symptom**: "Hair Talkz Salon" shows `apps: [{code: 'CASHEW', ...}]`

**Root Cause**: Data corruption in API response from `hera_auth_introspect_v1`

**Solution**:
1. Check database: Verify organization-to-app relationships
2. Check RPC function: Verify `hera_auth_introspect_v1` returns correct apps
3. Check API endpoint: Verify `/api/v2/auth/resolve-membership` parses apps correctly

**SQL to Check**:
```sql
SELECT
  o.id as org_id,
  o.entity_name as org_name,
  o.code as org_code,
  r.relationship_type,
  a.code as app_code,
  a.entity_name as app_name
FROM core_organizations o
LEFT JOIN core_relationships r ON r.source_entity_id = o.id
  AND r.relationship_type = 'ORG_HAS_APP'
LEFT JOIN core_entities a ON a.id = r.target_entity_id
WHERE o.code IN ('SALON', 'CASHEW')
ORDER BY o.code, a.code;
```

### Issue 2: Correct Org Clicked But Wrong Org Loaded
**Symptom**: Click "Salon" but logs show `orgCode: CASHEW`

**Root Cause**: Organization selector passing wrong org object

**Solution**:
1. Check console logs: Does `🏢 [ORG SELECTOR]` show correct org?
2. If YES → Issue is in `switchOrganization` function
3. If NO → Issue is in organization selector mapping

### Issue 3: Organization Switch Works But Wrong App Loads
**Symptom**: Context updates correctly but wrong app dashboard loads

**Root Cause**: App routing logic using wrong data source

**Solution**:
1. Check redirect path: `const appPath = \`/\${firstApp.code.toLowerCase()}/dashboard\``
2. Verify `firstApp.code` matches the clicked organization's app
3. Check if multiple apps exist and wrong one is selected as "first"

### Issue 4: User Role Missing or Incorrect
**Symptom**: User role shows as "user" instead of "owner" or "manager"

**Root Cause**: Role extraction failing in organizations array

**Solution**:
1. Check console: Does `Primary Role` show correct value (e.g., `ORG_OWNER`)?
2. Check extraction: `extractedRole: owner` should appear in logs
3. Verify localStorage: `salonRole` should be set correctly

---

## 📊 Expected Console Output (Good State)

### **Page Load**:
```
🔍 [ORG PAGE] ====================== ORGANIZATIONS DATA ======================
🔍 [ORG PAGE] Total organizations loaded: 2

🔍 [ORG PAGE] Organization 1/2:
  - ID: a1b2c3d4-...
  - Name: Hair Talkz Salon
  - Code: SALON
  - Type: salon
  - Primary Role: ORG_OWNER
  - User Role: ORG_OWNER
  - All Roles: ['ORG_OWNER']
  - Apps: [{code: 'SALON', name: 'Salon Management', ...}]
  - Apps Count: 1
  - First App: {code: 'SALON', name: 'Salon Management', ...}

🔍 [ORG PAGE] Organization 2/2:
  - ID: e5f6g7h8-...
  - Name: Cashew Financial Services
  - Code: CASHEW
  - Type: finance
  - Primary Role: ORG_OWNER
  - User Role: ORG_OWNER
  - All Roles: ['ORG_OWNER']
  - Apps: [{code: 'CASHEW', name: 'Financial Management', ...}]
  - Apps Count: 1
  - First App: {code: 'CASHEW', name: 'Financial Management', ...}

🔍 [ORG PAGE] ====================== END ORGANIZATIONS DATA ======================
```

### **Organization Click** (Salon):
```
🏢 [ORG SELECTOR] ======================
🏢 [ORG SELECTOR] Selecting organization: Hair Talkz Salon
🏢 [ORG SELECTOR] Org ID: a1b2c3d4-...
🏢 [ORG SELECTOR] Org Code: SALON
🏢 [ORG SELECTOR] Apps: [{code: 'SALON', ...}]
🏢 [ORG SELECTOR] ======================

📱 [ORG SELECTOR] Apps for selected organization:
  orgId: a1b2c3d4-...
  orgName: Hair Talkz Salon
  apps: [{code: 'SALON', ...}]
  firstAppCode: SALON

✅ Redirecting to Salon Management -> /salon/dashboard

🔄 [HERAAuth] Switching to organization: a1b2c3d4-...
✅ [HERAAuth] Role extracted from organizations array:
  orgCode: SALON
  extractedRole: owner
  apps: ['SALON']

✅ [HERAAuth] Updated localStorage with new organization and role
✅ [HERAAuth] Switch complete - context updated
```

---

## 📝 Reporting Results

**After testing, please provide**:

1. **Screenshot of console logs** showing:
   - 🔍 [ORG PAGE] section (organizations data)
   - 🏢 [ORG SELECTOR] section (clicked org data)
   - 🔄 [HERAAuth] section (context switch)

2. **Description of behavior**:
   - Which organization did you click?
   - Which app dashboard loaded?
   - Did the data match expectations?

3. **Specific observations**:
   - Do organizations have correct apps arrays?
   - Does the clicked org have correct data?
   - Does the context switch work correctly?

---

## 🎯 Success Criteria

**✅ System is working correctly when**:
1. Each organization tile displays its own correct apps
2. Clicking "Salon" org shows `Apps: [{code: 'SALON', ...}]` in console
3. Clicking "Salon" redirects to `/salon/dashboard`
4. Clicking "Cashew" shows `Apps: [{code: 'CASHEW', ...}]` in console
5. Clicking "Cashew" redirects to `/cashew/dashboard`
6. User role is correctly extracted and displayed for each org

---

## 🔧 Quick Fix Commands

If you need to rebuild and test:

```bash
# Rebuild the application
npm run build

# Start development server
npm run dev

# Clear browser cache and localStorage
# In browser console:
localStorage.clear()
location.reload()
```

---

**Last Updated**: 2025-01-15
**Status**: 🟡 **DIAGNOSTIC MODE ACTIVATED - AWAITING TEST RESULTS**
