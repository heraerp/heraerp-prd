# HERA Multi-App Authentication - Developer Guide

**Version:** 2.0
**Last Updated:** 2025-01-04
**Status:** Production Ready ✅

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Adding a New App](#adding-a-new-app)
5. [Modifying Existing Apps](#modifying-existing-apps)
6. [Advanced Customization](#advanced-customization)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)
9. [Best Practices](#best-practices)

---

## 🎯 Overview

HERA's Multi-App Authentication system provides enterprise-grade role-based access control across multiple applications. The system is designed for:

- **Zero Code Changes** when adding new apps
- **Centralized Configuration** for all routing rules
- **Type-Safe** TypeScript implementation
- **App-Aware** role display names
- **Auto-Detection** of app context

### Current Supported Apps

| App Code | Name | Description |
|----------|------|-------------|
| `salon` | Salon/Spa | Beauty salon management |
| `cashew` | Cashew Processing | Cashew factory & inventory |
| `isp` | Internet Service Provider | ISP network management |
| `furniture` | Furniture Retail | Furniture store & warehouse |
| `restaurant` | Restaurant/Food Service | Restaurant operations |
| `retail` | General Retail | Generic retail operations |

---

## 🏗️ Architecture

### Core Components

```
/src/lib/auth/
  └── role-normalizer.ts         ⭐ MAIN FILE - All configuration here

/src/app/
  ├── auth/login/page.tsx         Multi-app login (auto-detects app)
  └── salon/auth/page.tsx         Salon-specific login

/src/components/auth/
  └── HERAAuthProvider.tsx        Authentication context provider
```

### Key Functions

| Function | Purpose |
|----------|---------|
| `normalizeRole()` | Convert HERA RBAC role → app role |
| `getRoleRedirectPath()` | Get dashboard URL for role + app |
| `getRoleDisplayName()` | Get app-specific role display name |
| `getAppCodeFromOrganization()` | Detect app from organization |
| `isValidAppCode()` | Validate app code |

---

## 🚀 Quick Start

### 1. Understanding the Flow

```
User Login → Normalize Role → Detect App → Get Redirect Path → Navigate
```

**Example:**
```typescript
// User logs in with email/password
const result = await login('user@cashew.com', 'password')

// Role normalized: 'ORG_OWNER' → 'owner'
const role = normalizeRole(result.role) // 'owner'

// App detected: 'cashew'
const app = getAppCodeFromOrganization(result.organizationId) // 'cashew'

// Redirect path retrieved
const path = getRoleRedirectPath(role, app) // '/cashew/dashboard'

// User navigated to correct dashboard
router.push(path)
```

### 2. Basic Usage

```typescript
import {
  normalizeRole,
  getRoleRedirectPath,
  getRoleDisplayName,
  type AppRole,
  type AppCode
} from '@/lib/auth/role-normalizer'

// Normalize a role
const role = normalizeRole('ORG_EMPLOYEE') // 'receptionist'

// Get redirect path for salon app
const path = getRoleRedirectPath('owner', 'salon') // '/salon/dashboard'

// Get display name for cashew app
const name = getRoleDisplayName('stylist', 'cashew') // 'Quality Inspector'
```

---

## ➕ Adding a New App

### Step 1: Add App Code to Type

**File:** `/src/lib/auth/role-normalizer.ts`
**Line:** ~36

```typescript
/**
 * Supported HERA application codes
 */
export type AppCode =
  | 'salon'
  | 'cashew'
  | 'isp'
  | 'furniture'
  | 'restaurant'
  | 'retail'
  | 'hotel'  // ← ADD YOUR NEW APP HERE
```

---

### Step 2: Add Routing Rules

**File:** `/src/lib/auth/role-normalizer.ts`
**Line:** ~245 (inside `APP_ROUTING_RULES`)

```typescript
const APP_ROUTING_RULES: Record<AppCode, Record<AppRole, string>> = {
  // ... existing apps ...

  // ========================
  // HOTEL APP (NEW)
  // ========================
  hotel: {
    owner: '/hotel/dashboard',           // Hotel owner analytics
    manager: '/hotel/operations',        // General manager view
    receptionist: '/hotel/front-desk',   // Front desk operations
    accountant: '/hotel/accounting',     // Financial management
    stylist: '/hotel/concierge',         // Concierge services
    staff: '/hotel/housekeeping',        // Housekeeping staff
    user: '/hotel/guest'                 // Guest portal
  }
}
```

**💡 Tips:**
- Map each role to a specific dashboard route
- Use consistent URL patterns (`/{app}/{dashboard}`)
- Add comments explaining each role's purpose
- Consider what each role actually does in your app context

---

### Step 3: Add Display Names

**File:** `/src/lib/auth/role-normalizer.ts`
**Line:** ~146 (inside `getRoleDisplayName()`)

```typescript
const appSpecificNames: Record<AppCode, Record<AppRole, string>> = {
  // ... existing apps ...

  hotel: {
    owner: 'Hotel Owner',
    manager: 'General Manager',
    receptionist: 'Front Desk Agent',
    accountant: 'Accountant',
    stylist: 'Concierge',
    staff: 'Housekeeping Staff',
    user: 'Guest'
  }
}
```

**💡 Tips:**
- Use terminology natural to your industry
- Keep names concise (2-3 words max)
- Match your app's UX language
- Consider localization if needed

---

### Step 4: Add URL Detection

**File:** `/src/lib/auth/role-normalizer.ts`
**Line:** ~358 (inside `getRoleRedirectPath()`)

```typescript
if (!app && typeof window !== 'undefined') {
  const pathname = window.location.pathname

  // Extract app code from URL path
  if (pathname.startsWith('/salon')) appCode = 'salon'
  else if (pathname.startsWith('/cashew')) appCode = 'cashew'
  else if (pathname.startsWith('/isp')) appCode = 'isp'
  else if (pathname.startsWith('/furniture')) appCode = 'furniture'
  else if (pathname.startsWith('/restaurant')) appCode = 'restaurant'
  else if (pathname.startsWith('/retail')) appCode = 'retail'
  else if (pathname.startsWith('/hotel')) appCode = 'hotel'  // ← ADD THIS
}
```

---

### Step 5: Add to Validator

**File:** `/src/lib/auth/role-normalizer.ts`
**Line:** ~417 (inside `isValidAppCode()`)

```typescript
export function isValidAppCode(app: string): app is AppCode {
  const validApps: AppCode[] = [
    'salon',
    'cashew',
    'isp',
    'furniture',
    'restaurant',
    'retail',
    'hotel'  // ← ADD THIS
  ]
  return validApps.includes(app as AppCode)
}
```

---

### Step 6: Create App Login Page (Optional)

**File:** `/src/app/hotel/auth/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { getRoleRedirectPath, getRoleDisplayName, type AppRole } from '@/lib/auth/role-normalizer'

export default function HotelAuthPage() {
  const { login } = useHERAAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Login and get role data
      const result = await login(email, password, { clearFirst: true })
      const role = result.role as AppRole

      // Get display name for hotel context
      const displayName = getRoleDisplayName(role, 'hotel')
      console.log(`✅ Signing in as: ${displayName}`)

      // Redirect to hotel-specific dashboard
      const redirectPath = getRoleRedirectPath(role, 'hotel')
      router.push(redirectPath)

    } catch (err) {
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1>Hotel Management Login</h1>
      <form onSubmit={handleSignIn}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
```

---

### Step 7: Test Your New App

```bash
# 1. Start development server
npm run dev

# 2. Navigate to your new app login
http://localhost:3000/hotel/auth

# 3. Login with test credentials

# 4. Verify redirect to correct dashboard
# owner → /hotel/dashboard
# receptionist → /hotel/front-desk
# etc.
```

---

## ✏️ Modifying Existing Apps

### Change Dashboard Route

**File:** `/src/lib/auth/role-normalizer.ts`
**Location:** `APP_ROUTING_RULES` object

```typescript
salon: {
  owner: '/salon/dashboard',           // ← Change this
  manager: '/salon/manager-dashboard', // ← or this
  receptionist: '/salon/receptionist',
  // ...
}
```

### Change Display Name

**File:** `/src/lib/auth/role-normalizer.ts`
**Location:** `getRoleDisplayName()` function

```typescript
salon: {
  owner: 'Salon Owner',
  manager: 'Operations Manager',  // ← Changed from 'Salon Manager'
  receptionist: 'Front Desk',
  // ...
}
```

### Add New Role Mapping

If you need to add a new role entirely:

**Step 1:** Add to `AppRole` type
```typescript
export type AppRole =
  | 'owner'
  | 'manager'
  | 'receptionist'
  | 'accountant'
  | 'stylist'
  | 'staff'
  | 'user'
  | 'supervisor'  // ← NEW ROLE
```

**Step 2:** Add to RBAC mapping
```typescript
const ROLE_MAPPING: Record<string, AppRole> = {
  // ... existing mappings ...
  'org_supervisor': 'supervisor',  // ← NEW MAPPING
  'supervisor': 'supervisor',
}
```

**Step 3:** Add routing rules for ALL apps
```typescript
const APP_ROUTING_RULES: Record<AppCode, Record<AppRole, string>> = {
  salon: {
    // ... existing roles ...
    supervisor: '/salon/supervisor',  // ← ADD TO EVERY APP
  },
  cashew: {
    // ... existing roles ...
    supervisor: '/cashew/supervisor',
  },
  // ... etc for all apps
}
```

**Step 4:** Add display names for ALL apps
```typescript
salon: {
  // ... existing names ...
  supervisor: 'Shift Supervisor',
},
cashew: {
  // ... existing names ...
  supervisor: 'Production Supervisor',
},
```

---

## 🔧 Advanced Customization

### Database-Driven Routing (Future Enhancement)

Instead of hardcoded routing rules, you can store them in the database:

**Table:** `core_organizations.settings` (JSONB column)

```json
{
  "routing_rules": {
    "owner": "/custom/owner-dashboard",
    "manager": "/custom/manager-view",
    "receptionist": "/custom/front-desk"
  }
}
```

**Implementation:**
```typescript
export async function getRoleRedirectPath(
  role: AppRole,
  app?: AppCode,
  organizationId?: string
): Promise<string> {
  // Try to fetch from database first
  if (organizationId) {
    const customRoutes = await fetchCustomRoutes(organizationId)
    if (customRoutes && customRoutes[role]) {
      return customRoutes[role]
    }
  }

  // Fallback to hardcoded rules
  return APP_ROUTING_RULES[app || 'salon'][role] || `/${app}`
}
```

### Per-Organization Role Overrides

Allow organizations to customize role names:

```typescript
export async function getRoleDisplayName(
  role: AppRole,
  app?: AppCode,
  organizationId?: string
): Promise<string> {
  // Try custom names first
  if (organizationId) {
    const customNames = await fetchCustomRoleNames(organizationId)
    if (customNames && customNames[role]) {
      return customNames[role]
    }
  }

  // Fallback to standard names
  return appSpecificNames[app || 'salon'][role] || 'Team Member'
}
```

### Multi-Language Support

```typescript
const displayNames: Record<string, Record<AppCode, Record<AppRole, string>>> = {
  en: {
    salon: {
      owner: 'Salon Owner',
      manager: 'Salon Manager',
      // ...
    }
  },
  es: {
    salon: {
      owner: 'Propietario de Salón',
      manager: 'Gerente de Salón',
      // ...
    }
  },
  ar: {
    salon: {
      owner: 'مالك الصالون',
      manager: 'مدير الصالون',
      // ...
    }
  }
}

export function getRoleDisplayName(
  role: AppRole,
  app?: AppCode,
  locale: string = 'en'
): string {
  return displayNames[locale][app || 'salon'][role] || 'Team Member'
}
```

---

## 🧪 Testing Guide

### Unit Tests

**File:** `/tests/auth/role-normalizer.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import {
  normalizeRole,
  getRoleRedirectPath,
  getRoleDisplayName,
  isValidAppCode
} from '@/lib/auth/role-normalizer'

describe('Role Normalizer', () => {
  describe('normalizeRole', () => {
    it('should normalize HERA RBAC roles', () => {
      expect(normalizeRole('ORG_OWNER')).toBe('owner')
      expect(normalizeRole('ORG_EMPLOYEE')).toBe('receptionist')
      expect(normalizeRole('org_accountant')).toBe('accountant')
    })

    it('should handle invalid roles', () => {
      expect(normalizeRole('INVALID_ROLE')).toBe('user')
      expect(normalizeRole(null)).toBe('user')
      expect(normalizeRole(undefined)).toBe('user')
    })
  })

  describe('getRoleRedirectPath', () => {
    it('should return correct paths for salon app', () => {
      expect(getRoleRedirectPath('owner', 'salon')).toBe('/salon/dashboard')
      expect(getRoleRedirectPath('receptionist', 'salon')).toBe('/salon/receptionist')
      expect(getRoleRedirectPath('accountant', 'salon')).toBe('/salon/accountant')
    })

    it('should return correct paths for cashew app', () => {
      expect(getRoleRedirectPath('owner', 'cashew')).toBe('/cashew/dashboard')
      expect(getRoleRedirectPath('receptionist', 'cashew')).toBe('/cashew/reception')
      expect(getRoleRedirectPath('stylist', 'cashew')).toBe('/cashew/quality')
    })

    it('should return correct paths for furniture app', () => {
      expect(getRoleRedirectPath('owner', 'furniture')).toBe('/furniture/admin')
      expect(getRoleRedirectPath('receptionist', 'furniture')).toBe('/furniture/pos')
    })
  })

  describe('getRoleDisplayName', () => {
    it('should return app-specific display names', () => {
      expect(getRoleDisplayName('stylist', 'salon')).toBe('Stylist')
      expect(getRoleDisplayName('stylist', 'cashew')).toBe('Quality Inspector')
      expect(getRoleDisplayName('stylist', 'isp')).toBe('Field Technician')
      expect(getRoleDisplayName('stylist', 'furniture')).toBe('Sales Associate')
    })
  })

  describe('isValidAppCode', () => {
    it('should validate app codes', () => {
      expect(isValidAppCode('salon')).toBe(true)
      expect(isValidAppCode('cashew')).toBe(true)
      expect(isValidAppCode('invalid')).toBe(false)
    })
  })
})
```

### Integration Tests

```typescript
describe('Multi-App Authentication Flow', () => {
  it('should redirect salon owner to salon dashboard', async () => {
    const result = await login('owner@salon.com', 'password')
    const path = getRoleRedirectPath(result.role, 'salon')
    expect(path).toBe('/salon/dashboard')
  })

  it('should redirect cashew employee to cashew reception', async () => {
    const result = await login('employee@cashew.com', 'password')
    const path = getRoleRedirectPath(result.role, 'cashew')
    expect(path).toBe('/cashew/reception')
  })

  it('should redirect isp field tech to isp field-tech dashboard', async () => {
    const result = await login('tech@isp.com', 'password')
    const role = normalizeRole('ORG_STYLIST') // Maps to field tech in ISP
    const path = getRoleRedirectPath(role, 'isp')
    expect(path).toBe('/isp/field-tech')
  })
})
```

### Manual Testing Checklist

- [ ] Login as owner in each app → Verify correct dashboard
- [ ] Login as manager in each app → Verify correct dashboard
- [ ] Login as receptionist in each app → Verify correct dashboard
- [ ] Login as accountant in each app → Verify correct dashboard
- [ ] Login as stylist/specialist in each app → Verify correct dashboard
- [ ] Login as staff in each app → Verify correct dashboard
- [ ] Check role display names show correctly in UI
- [ ] Check console logs show correct app detection
- [ ] Test with invalid roles → Should default to user
- [ ] Test with invalid app codes → Should fallback to salon

---

## 🐛 Troubleshooting

### Issue: User redirected to wrong dashboard

**Symptoms:**
- Owner redirects to receptionist page
- Manager gets owner dashboard

**Solution:**
1. Check `APP_ROUTING_RULES` for correct role mapping
2. Verify app code is being detected correctly
3. Check console logs for actual role and app values

```typescript
console.log('✅ Multi-app role-based redirect:', {
  role,           // Should show normalized role
  app: appCode,   // Should show correct app code
  path: redirectPath  // Should show correct path
})
```

---

### Issue: Role display name shows wrong title

**Symptoms:**
- Stylist shows as "Stylist" in ISP app (should be "Field Technician")

**Solution:**
Check `appSpecificNames` object in `getRoleDisplayName()` function.

```typescript
// Make sure app-specific name is defined
isp: {
  stylist: 'Field Technician',  // ← Check this exists
}
```

---

### Issue: TypeScript errors after adding new app

**Symptoms:**
```
Type '"hotel"' is not assignable to type 'AppCode'
```

**Solution:**
Make sure you added the app to ALL required locations:
1. ✅ `AppCode` type definition
2. ✅ `APP_ROUTING_RULES` object
3. ✅ `appSpecificNames` object in `getRoleDisplayName()`
4. ✅ URL detection in `getRoleRedirectPath()`
5. ✅ `isValidAppCode()` array

---

### Issue: "Unknown app" warning in console

**Symptoms:**
```
[RoleNormalizer] Unknown app 'xyz', using salon fallback
```

**Solution:**
The app code is not recognized. Check:
1. App code matches exactly (case-sensitive)
2. App is added to `AppCode` type
3. App is added to `isValidAppCode()` validator
4. URL pattern matches in auto-detection

---

### Issue: User gets "Access Restricted" message

**Symptoms:**
- User logs in successfully
- Sees "Access Restricted" screen
- Eventually redirects to correct page

**Solution:**
This means the initial redirect went to wrong page. Check:
1. `getRoleRedirectPath()` is called with correct app parameter
2. Role normalization is working correctly
3. RBAC rules in `SalonRouteGuard.tsx` allow the role

```typescript
// In login handler
const role = result.role as AppRole
const appCode = 'salon' // ← Make sure this is correct
const redirectPath = getRoleRedirectPath(role, appCode)
```

---

## ✅ Best Practices

### 1. Always Use App-Aware Functions

**❌ BAD:**
```typescript
const path = '/salon/dashboard' // Hardcoded
const name = 'Salon Owner'      // Hardcoded
```

**✅ GOOD:**
```typescript
const path = getRoleRedirectPath(role, app)
const name = getRoleDisplayName(role, app)
```

### 2. Provide App Context Explicitly

**❌ RISKY:**
```typescript
// Relies on auto-detection from URL
const path = getRoleRedirectPath(role)
```

**✅ SAFE:**
```typescript
// Explicit app context
const path = getRoleRedirectPath(role, 'salon')
```

### 3. Log App Context for Debugging

```typescript
console.log('✅ Authentication context:', {
  role,
  app: appCode,
  displayName: getRoleDisplayName(role, appCode),
  redirectPath: getRoleRedirectPath(role, appCode)
})
```

### 4. Validate App Codes

```typescript
if (!isValidAppCode(appCode)) {
  console.error(`Invalid app code: ${appCode}`)
  appCode = 'salon' // Fallback
}
```

### 5. Use TypeScript Types

```typescript
import type { AppRole, AppCode } from '@/lib/auth/role-normalizer'

function handleRedirect(role: AppRole, app: AppCode) {
  // Type-safe function
  const path = getRoleRedirectPath(role, app)
  router.push(path)
}
```

### 6. Centralize App Detection

Create a helper function:

```typescript
export function detectAppFromContext(
  availableApps: Array<{ code: string }>,
  pathname: string
): AppCode {
  // Priority 1: Available apps from API
  if (availableApps && availableApps.length > 0) {
    const appCode = availableApps[0].code.toLowerCase()
    if (isValidAppCode(appCode)) {
      return appCode as AppCode
    }
  }

  // Priority 2: URL path
  if (pathname.startsWith('/salon')) return 'salon'
  if (pathname.startsWith('/cashew')) return 'cashew'
  if (pathname.startsWith('/isp')) return 'isp'
  if (pathname.startsWith('/furniture')) return 'furniture'
  if (pathname.startsWith('/restaurant')) return 'restaurant'
  if (pathname.startsWith('/retail')) return 'retail'

  // Default fallback
  return 'salon'
}
```

### 7. Document Custom Routes

```typescript
const APP_ROUTING_RULES: Record<AppCode, Record<AppRole, string>> = {
  hotel: {
    owner: '/hotel/dashboard',           // Full hotel analytics
    manager: '/hotel/operations',        // Daily operations management
    receptionist: '/hotel/front-desk',   // Check-in/out operations
    accountant: '/hotel/accounting',     // Revenue & billing
    stylist: '/hotel/concierge',         // Concierge services
    staff: '/hotel/housekeeping',        // Housekeeping schedules
    user: '/hotel/guest'                 // Guest portal & bookings
  }
}
```

---

## 📚 Reference

### Complete File Structure

```
/src/lib/auth/role-normalizer.ts         ⭐ MAIN CONFIGURATION FILE
  ├── AppRole type                        Standard roles across apps
  ├── AppCode type                        Supported app codes
  ├── HERARBACRole type                   Database RBAC roles
  ├── ROLE_MAPPING                        RBAC → App role mapping
  ├── APP_ROUTING_RULES                   Role → Dashboard routes
  ├── normalizeRole()                     Normalize RBAC roles
  ├── getRoleDisplayName()                Get app-specific display names
  ├── isElevatedRole()                    Check elevated permissions
  ├── getRoleRedirectPath()               Get role-specific redirect
  ├── getAppCodeFromOrganization()        Detect app from organization
  ├── isValidAppCode()                    Validate app code
  └── isValidAppRole()                    Validate app role
```

### Quick Reference Table

| What | Where | Line |
|------|-------|------|
| Add new app type | `AppCode` type | ~36 |
| Add routing rules | `APP_ROUTING_RULES` | ~245 |
| Add display names | `appSpecificNames` in `getRoleDisplayName()` | ~146 |
| Add URL detection | Auto-detection in `getRoleRedirectPath()` | ~358 |
| Add app validator | `isValidAppCode()` | ~417 |

---

## 🎓 Examples

### Complete Example: Adding "Healthcare" App

```typescript
// Step 1: Add to AppCode type (Line ~36)
export type AppCode =
  | 'salon'
  | 'cashew'
  | 'isp'
  | 'furniture'
  | 'restaurant'
  | 'retail'
  | 'healthcare'  // ✅ NEW

// Step 2: Add routing rules (Line ~245)
const APP_ROUTING_RULES: Record<AppCode, Record<AppRole, string>> = {
  // ... existing apps ...

  healthcare: {
    owner: '/healthcare/admin',              // Hospital administrator
    manager: '/healthcare/department-head',  // Department manager
    receptionist: '/healthcare/registration', // Patient registration
    accountant: '/healthcare/billing',       // Medical billing
    stylist: '/healthcare/doctor',           // Doctor/physician
    staff: '/healthcare/nurse',              // Nursing staff
    user: '/healthcare/patient'              // Patient portal
  }
}

// Step 3: Add display names (Line ~146)
const appSpecificNames: Record<AppCode, Record<AppRole, string>> = {
  // ... existing apps ...

  healthcare: {
    owner: 'Hospital Administrator',
    manager: 'Department Head',
    receptionist: 'Registration Clerk',
    accountant: 'Medical Biller',
    stylist: 'Doctor',
    staff: 'Nurse',
    user: 'Patient'
  }
}

// Step 4: Add URL detection (Line ~358)
if (pathname.startsWith('/healthcare')) appCode = 'healthcare'

// Step 5: Add to validator (Line ~417)
const validApps: AppCode[] = [
  'salon', 'cashew', 'isp', 'furniture', 'restaurant', 'retail', 'healthcare'
]
```

**Test it:**
```typescript
getRoleRedirectPath('stylist', 'healthcare') // '/healthcare/doctor' ✅
getRoleDisplayName('stylist', 'healthcare')  // 'Doctor' ✅
```

---

## 📞 Support

If you encounter issues or have questions:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Review console logs for detailed error messages
3. Check TypeScript errors - they're usually helpful
4. Verify all 5 steps were completed when adding new apps
5. Test with known working apps (salon) to isolate issues

---

## 📝 Changelog

### Version 2.0 (2025-01-04)
- ✅ Multi-app support added
- ✅ 6 apps supported out of the box
- ✅ App-aware display names
- ✅ Auto app detection
- ✅ Type-safe implementation

### Version 1.0 (2024)
- Initial salon-only implementation

---

## 📄 License

Internal HERA ERP documentation. Confidential.

---

**🎉 You're ready to manage HERA's multi-app authentication system!**

For questions or improvements to this guide, contact the HERA development team.
