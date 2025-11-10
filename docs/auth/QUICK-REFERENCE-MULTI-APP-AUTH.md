# HERA Multi-App Auth - Quick Reference

**File:** `/src/lib/auth/role-normalizer.ts`

---

## 🚀 Add New App (5 Steps)

### 1️⃣ Add App Type (Line ~36)
```typescript
export type AppCode = 'salon' | 'cashew' | 'isp' | 'furniture' | 'restaurant' | 'retail' | 'YOUR_APP'
```

### 2️⃣ Add Routing Rules (Line ~245)
```typescript
YOUR_APP: {
  owner: '/your-app/dashboard',
  manager: '/your-app/manager',
  receptionist: '/your-app/reception',
  accountant: '/your-app/accounting',
  stylist: '/your-app/specialist',
  staff: '/your-app/staff',
  user: '/your-app'
}
```

### 3️⃣ Add Display Names (Line ~146)
```typescript
YOUR_APP: {
  owner: 'Your App Owner',
  manager: 'Your App Manager',
  receptionist: 'Your App Receptionist',
  accountant: 'Accountant',
  stylist: 'Specialist',
  staff: 'Staff Member',
  user: 'User'
}
```

### 4️⃣ Add URL Detection (Line ~358)
```typescript
if (pathname.startsWith('/your-app')) appCode = 'your-app'
```

### 5️⃣ Add to Validator (Line ~417)
```typescript
const validApps: AppCode[] = ['salon', 'cashew', 'isp', 'furniture', 'restaurant', 'retail', 'YOUR_APP']
```

---

## 📊 Current Apps Reference

| App | Owner Route | Manager Route | Receptionist Route |
|-----|------------|---------------|-------------------|
| `salon` | `/salon/dashboard` | `/salon/receptionist` | `/salon/receptionist` |
| `cashew` | `/cashew/dashboard` | `/cashew/operations` | `/cashew/reception` |
| `isp` | `/isp/dashboard` | `/isp/network-ops` | `/isp/customer-service` |
| `furniture` | `/furniture/admin` | `/furniture/store-manager` | `/furniture/pos` |
| `restaurant` | `/restaurant/owner-dashboard` | `/restaurant/floor-manager` | `/restaurant/host-stand` |
| `retail` | `/retail/dashboard` | `/retail/manager` | `/retail/pos` |

---

## 🔧 Common Tasks

### Change Dashboard Route
```typescript
// Line ~245
salon: {
  owner: '/salon/NEW-ROUTE',  // ← Change this
}
```

### Change Display Name
```typescript
// Line ~146
salon: {
  owner: 'New Title',  // ← Change this
}
```

### Add New Role
```typescript
// Step 1: Add to AppRole type (Line ~31)
export type AppRole = 'owner' | 'manager' | 'receptionist' | 'accountant' | 'stylist' | 'staff' | 'user' | 'NEW_ROLE'

// Step 2: Add to ROLE_MAPPING (Line ~54)
'org_new_role': 'NEW_ROLE',

// Step 3: Add to ALL apps in APP_ROUTING_RULES (Line ~245)
salon: {
  // ... existing roles ...
  NEW_ROLE: '/salon/new-role',
}

// Step 4: Add to ALL apps in appSpecificNames (Line ~146)
salon: {
  // ... existing names ...
  NEW_ROLE: 'New Role Title',
}
```

---

## 💻 Usage Examples

### Basic Usage
```typescript
import { getRoleRedirectPath, getRoleDisplayName } from '@/lib/auth/role-normalizer'

// Get redirect path
const path = getRoleRedirectPath('owner', 'salon') // '/salon/dashboard'

// Get display name
const name = getRoleDisplayName('owner', 'salon') // 'Salon Owner'
```

### In Login Handler
```typescript
const result = await login(email, password)
const role = result.role as AppRole
const appCode = 'salon' // or detect from context

// Get app-specific redirect
const redirectPath = getRoleRedirectPath(role, appCode)
router.push(redirectPath)

// Show app-specific role name
const displayName = getRoleDisplayName(role, appCode)
console.log(`Welcome, ${displayName}`)
```

### Auto-Detect App
```typescript
// Auto-detects from window.location.pathname
const path = getRoleRedirectPath(role) // Detects app automatically
```

---

## 🧪 Testing Checklist

- [ ] Login as owner → Goes to owner dashboard
- [ ] Login as manager → Goes to manager dashboard
- [ ] Login as receptionist → Goes to receptionist dashboard
- [ ] Display names show correctly
- [ ] Console logs show correct app detection
- [ ] TypeScript compiles without errors
- [ ] Invalid roles default to 'user'
- [ ] Invalid apps fallback to 'salon'

---

## 🐛 Quick Fixes

### Wrong Dashboard Redirect
```typescript
// Check Line ~245 in APP_ROUTING_RULES
YOUR_APP: {
  YOUR_ROLE: '/correct/path',  // ← Fix this
}
```

### Wrong Display Name
```typescript
// Check Line ~146 in appSpecificNames
YOUR_APP: {
  YOUR_ROLE: 'Correct Title',  // ← Fix this
}
```

### TypeScript Error
- ✅ Added to `AppCode` type? (Line ~36)
- ✅ Added to `APP_ROUTING_RULES`? (Line ~245)
- ✅ Added to `appSpecificNames`? (Line ~146)
- ✅ Added to `isValidAppCode()`? (Line ~417)

---

## 📁 File Locations

| What | Where |
|------|-------|
| Main config | `/src/lib/auth/role-normalizer.ts` |
| Salon login | `/src/app/salon/auth/page.tsx` |
| Central login | `/src/app/auth/login/page.tsx` |
| Auth provider | `/src/components/auth/HERAAuthProvider.tsx` |

---

## 🎯 One-Minute Template

```typescript
// Copy this template to add a new app quickly

// 1. Type (Line ~36)
export type AppCode = /* ... */ | 'NEW_APP'

// 2. Routes (Line ~245)
NEW_APP: {
  owner: '/new-app/dashboard',
  manager: '/new-app/manager',
  receptionist: '/new-app/reception',
  accountant: '/new-app/accounting',
  stylist: '/new-app/specialist',
  staff: '/new-app/staff',
  user: '/new-app'
}

// 3. Names (Line ~146)
NEW_APP: {
  owner: 'App Owner',
  manager: 'App Manager',
  receptionist: 'App Receptionist',
  accountant: 'Accountant',
  stylist: 'Specialist',
  staff: 'Staff',
  user: 'User'
}

// 4. URL (Line ~358)
if (pathname.startsWith('/new-app')) appCode = 'new-app'

// 5. Validator (Line ~417)
const validApps: AppCode[] = [/* ... */, 'NEW_APP']
```

**Done! Test with:**
```typescript
getRoleRedirectPath('owner', 'NEW_APP') // Should return your route
getRoleDisplayName('owner', 'NEW_APP')  // Should return your name
```

---

**Need more details?** See full guide: `HERA-MULTI-APP-AUTH-DEVELOPER-GUIDE.md`
