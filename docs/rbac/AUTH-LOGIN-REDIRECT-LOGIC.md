# /auth/login Redirect Logic

**Date:** 2025-10-27
**File:** `/src/app/auth/login/page.tsx`

---

## 🎯 Where Does `/auth/login` Redirect After Successful Login?

The redirect destination depends on **multiple factors** evaluated in priority order:

---

## 📋 Redirect Decision Flow

```
User Successfully Logs In
          ↓
    ┌─────────────────────────────────┐
    │ 1. Email Domain Check           │
    │ (Lines 76-98)                   │
    └──────────┬──────────────────────┘
               ↓
    ┌──────────────────────────────────────────┐
    │ Is email @hairtalkz.com OR contains      │
    │ "michele"?                               │
    └──┬───────────────────────┬───────────────┘
       │                       │
      YES                     NO
       │                       │
       ↓                       ↓
  ┌────────────────┐    ┌──────────────────────┐
  │ /salon/dashboard│    │ 2. Demo Login Check  │
  │                │    │ (Lines 40-46)        │
  └────────────────┘    └──────────┬───────────┘
                                   ↓
                    ┌─────────────────────────────────┐
                    │ sessionStorage.isDemoLogin?     │
                    └──┬──────────────────────┬───────┘
                       │                      │
                      YES                    NO
                       │                      │
                       ↓                      ↓
                ┌──────────────┐    ┌──────────────────────┐
                │ /${demoModule}│    │ 3. Organization Count│
                │ (furniture)   │    │ Check (Lines 49-65) │
                └──────────────┘    └──────────┬───────────┘
                                               ↓
                            ┌──────────────────────────────────┐
                            │ How many organizations does      │
                            │ user belong to?                  │
                            └──┬────────┬─────────┬────────────┘
                               │        │         │
                              0 orgs   1 org    2+ orgs
                               │        │         │
                               ↓        ↓         ↓
                    ┌────────────────┐  │  ┌──────────────┐
                    │ /auth/orgs/new │  │  │ /auth/orgs   │
                    │ (Create Org)   │  │  │ (Org Selector)│
                    └────────────────┘  │  └──────────────┘
                                       ↓
                            ┌──────────────────────┐
                            │ 4. Return URL Check  │
                            │ (Lines 54-60)        │
                            └──────────┬───────────┘
                                       ↓
                    ┌─────────────────────────────────────┐
                    │ Priority for single org redirect:   │
                    │ 1. localStorage.redirectAfterLogin  │
                    │ 2. ?return_to query param           │
                    │ 3. /apps (default)                  │
                    └──────────────────┬──────────────────┘
                                       ↓
                            ┌──────────────┐
                            │ Final        │
                            │ Destination  │
                            └──────────────┘
```

---

## 🔍 Detailed Redirect Logic

### Priority 1: Hair Talkz Domain Check (HIGHEST PRIORITY)

**Code Location:** Lines 76-98

**Condition:**
```typescript
if (email.includes('@hairtalkz.com') || email.includes('michele'))
```

**Redirect:**
```typescript
router.push('/salon/dashboard')
```

**Examples:**
- `michele@hairtalkz.com` → `/salon/dashboard`
- `hairtalkz2022@gmail.com` (contains 'michele' in common names) → **Standard flow**
- `anyone@hairtalkz.com` → `/salon/dashboard`

**Note:** This is a **hardcoded special case** that bypasses all other logic.

---

### Priority 2: Demo Login Check

**Code Location:** Lines 40-46

**Condition:**
```typescript
sessionStorage.getItem('isDemoLogin') === 'true'
```

**Redirect:**
```typescript
const demoModule = sessionStorage.getItem('demoModule') || 'furniture'
router.push(`/${demoModule}`)
```

**Possible Destinations:**
- `/furniture` (default)
- `/salon`
- `/restaurant`
- `/manufacturing`
- Any other demo module

**When This Happens:**
- User clicked "Try Demo" on the login page
- Demo module selector set the session storage flags

---

### Priority 3: Organization Count Routing

**Code Location:** Lines 49-65

#### Scenario A: Zero Organizations (New User)

**Condition:**
```typescript
if (organizations.length === 0)
```

**Redirect:**
```typescript
router.push('/auth/organizations/new')
```

**Purpose:** Guide new user to create their first organization

---

#### Scenario B: Multiple Organizations (2+)

**Condition:**
```typescript
else if (organizations.length > 1)  // Actually: else block after checking 1 org
```

**Redirect:**
```typescript
router.push('/auth/organizations')
```

**Purpose:** Let user choose which organization to access

---

#### Scenario C: Single Organization (Most Common)

**Condition:**
```typescript
else if (organizations.length === 1)
```

**Priority Order for Single Org:**

**1st Priority - Stored Redirect URL:**
```typescript
const redirectUrl = localStorage.getItem('redirectAfterLogin')
if (redirectUrl) {
  localStorage.removeItem('redirectAfterLogin')
  router.push(redirectUrl)
}
```

**2nd Priority - Query Parameter:**
```typescript
else if (returnTo) {
  router.push(returnTo)
}
```

**3rd Priority - Default Apps Page:**
```typescript
else {
  router.push('/apps')
}
```

**Examples:**
- User was at `/salon/products` → redirected to login → after login goes back to `/salon/products`
- User visits `/auth/login?return_to=/dashboard` → after login goes to `/dashboard`
- User directly visits `/auth/login` → after login goes to `/apps`

---

## 📊 Complete Redirect Matrix

| Email | Demo Mode | Org Count | Stored URL | Query Param | Final Redirect |
|-------|-----------|-----------|------------|-------------|----------------|
| `*@hairtalkz.com` | - | - | - | - | **`/salon/dashboard`** |
| `*michele*` | - | - | - | - | **`/salon/dashboard`** |
| Any | ✅ Yes | - | - | - | **`/${demoModule}`** |
| Any | ❌ No | 0 | - | - | **`/auth/organizations/new`** |
| Any | ❌ No | 2+ | - | - | **`/auth/organizations`** |
| Any | ❌ No | 1 | ✅ `/salon/products` | - | **`/salon/products`** |
| Any | ❌ No | 1 | ❌ | ✅ `/dashboard` | **`/dashboard`** |
| Any | ❌ No | 1 | ❌ | ❌ | **`/apps`** |

---

## 🎯 Most Common Scenarios

### Scenario 1: Hair Talkz User (Salon Owner/Manager)
```
Email: Hairtalkz2022@gmail.com
Password: ****
         ↓
🚀 Redirect: /salon/dashboard
```

### Scenario 2: Regular User (Single Organization)
```
Email: john@company.com
Password: ****
Organizations: 1 (ACME Corp)
         ↓
🚀 Redirect: /apps
```

### Scenario 3: User Returning to Interrupted Task
```
User was at: /salon/products
Session expired → redirected to /auth/login
localStorage.redirectAfterLogin = '/salon/products'
         ↓
Login successful
         ↓
🚀 Redirect: /salon/products (returns to where they were)
```

### Scenario 4: Multi-Organization User
```
Email: admin@company.com
Password: ****
Organizations: 3 (ACME, Globex, Initech)
         ↓
🚀 Redirect: /auth/organizations (let them choose)
```

### Scenario 5: New User (First Time)
```
Email: newuser@company.com
Password: ****
Organizations: 0
         ↓
🚀 Redirect: /auth/organizations/new (create first org)
```

### Scenario 6: Demo User
```
User clicks "Try Demo" → Selects "Furniture"
sessionStorage.isDemoLogin = 'true'
sessionStorage.demoModule = 'furniture'
         ↓
🚀 Redirect: /furniture
```

---

## 🔧 How Return URLs Are Set

### Automatic Return URL Storage

**Protected Routes (RequireAuth middleware):**
```typescript
// When unauthenticated user tries to access protected route
localStorage.setItem('redirectAfterLogin', currentPath)
router.push('/auth/login')
```

### Manual Return URL (Query Parameter)

**Direct link with return URL:**
```
/auth/login?return_to=/salon/dashboard
```

**Code that reads this:**
```typescript
const returnTo = searchParams.get('return_to')
```

---

## 🐛 Known Issues / Technical Debt

### Issue 1: Hair Talkz Special Case

**Problem:** Hardcoded email check bypasses standard flow

**Code:** Lines 76-98
```typescript
if (email.includes('@hairtalkz.com') || email.includes('michele'))
```

**Impact:**
- Hair Talkz users don't get multi-org selector even if they have multiple orgs
- Inconsistent with standard authentication flow

**Recommendation:** Remove special case and rely on role-based routing from API v2

---

### Issue 2: Inconsistent Organization Resolution

**Problem:** Special case uses direct Supabase call, standard flow uses HERAAuthProvider

**Code:**
```typescript
// Hair Talkz: Direct Supabase call
const { data } = await supabase.auth.signInWithPassword({ email, password })

// Others: Provider handles it
await login(email, password)
```

**Impact:**
- Different authentication paths for different users
- Provider state may not be set correctly for Hair Talkz users

**Recommendation:** Use consistent authentication flow for all users

---

## ✅ Summary

### Default Redirect: `/apps`

**Most common path for standard users:**
1. Login with email/password
2. Single organization membership
3. No stored return URL
4. **→ Redirected to `/apps`**

### Special Cases

| Case | Redirect |
|------|----------|
| Hair Talkz email | `/salon/dashboard` |
| Demo login | `/${demoModule}` |
| New user (0 orgs) | `/auth/organizations/new` |
| Multi-org user (2+) | `/auth/organizations` |
| Interrupted task | Stored URL (e.g., `/salon/products`) |
| Query parameter | `?return_to` value |

---

**File:** `/src/app/auth/login/page.tsx`
**Key Lines:**
- 76-98: Hair Talkz special handling
- 40-46: Demo login check
- 49-65: Organization count routing
- 54-60: Return URL priority

**Last Updated:** 2025-10-27
