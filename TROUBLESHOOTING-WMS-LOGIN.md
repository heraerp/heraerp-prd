# Troubleshooting WMS Login Issue

## Problem
`wms@heraerp.com` is loading the salon app instead of WMS app after login.

## Database Status: ✅ ALL CORRECT

### Verified Working:
1. ✅ WMS user has ONE organization: "HERA Waste Management Demo"
2. ✅ That organization has ONE app: WMS
3. ✅ `hera_auth_introspect_v1` returns `default_app: "WMS"`
4. ✅ User metadata points to correct organization
5. ✅ MEMBER_OF and HAS_ROLE relationships are correct
6. ✅ Login simulation shows correct redirect: `/wms/dashboard`

## Diagnostic Steps

### Step 1: Check what URL you actually see
When you log in with `wms@heraerp.com`, what URL do you see in the browser address bar?

- [ ] `/wms/dashboard` (correct)
- [ ] `/salon/dashboard` (wrong - being redirected)
- [ ] `/auth/organizations` (multiple orgs detected)
- [ ] Something else: ___________

### Step 2: Check browser console
Open browser DevTools (F12) → Console tab, then log in. Look for these messages:

```
✅ Login successful, received data:
✅ Multi-app role-based redirect:
```

What does it say for:
- `role`: ___________
- `app`: ___________
- `path`: ___________

### Step 3: Check Network tab
Open browser DevTools (F12) → Network tab, then log in. Look for:

1. POST to `/auth/v1/token?grant_type=password`
   - What is the response?

2. POST to any RPC calls like `hera_auth_introspect_v1`
   - What is the response?
   - How many organizations?
   - What apps?

3. Any redirects (304/302 status codes)
   - Where is it redirecting to?

### Step 4: Check localStorage
Open browser DevTools (F12) → Application tab → Local Storage

Look for keys like:
- `supabase.auth.token`
- `hera_current_app`
- `hera_organization_id`

What values do you see?

### Step 5: Clear ALL session data
```javascript
// Run this in browser console
localStorage.clear()
sessionStorage.clear()
document.cookie.split(";").forEach(c => {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
location.reload()
```

Then try logging in again.

## Possible Causes

### 1. Multiple Browser Tabs
- Close ALL tabs of the HERA app
- Open ONE new tab
- Go to `/auth/login`
- Log in fresh

### 2. Service Worker Cache
```javascript
// Run in browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister())
})
```

### 3. Next.js Route Cache
The issue might be in the app routing. Check:
- Is there a `/wms/dashboard/page.tsx` file?
- Is it being built correctly?

### 4. Environment Variable Mismatch
Check if `.env.local` has any overrides pointing to wrong organization:
```bash
grep -i "organization\|salon" .env.local
```

## Quick Fix Test

Try accessing WMS directly:
1. Go to: `http://localhost:3000/wms/dashboard` (or your domain)
2. Does it load WMS or redirect to salon?

If it redirects, the issue is in route middleware or the dashboard page itself.

## Expected vs Actual Flow

### ✅ Expected Flow:
1. User logs in at `/auth/login`
2. Login calls `hera_auth_introspect_v1` → returns WMS as default app
3. Login redirects to `/wms/dashboard`
4. WMS dashboard loads
5. User sees WMS interface

### ❌ What's Happening:
1. User logs in at `/auth/login`
2. ??? (need to check console/network)
3. User lands on `/salon/dashboard` (or `/wms` redirects to `/salon`)
4. Salon dashboard loads
5. User sees Salon interface

## Next Steps

Please provide the information from Step 1-4 above, and we can pinpoint exactly where the redirect is happening.

## Manual Override Test

Try this URL with explicit app context:
```
http://localhost:3000/wms/dashboard?app=wms&org=1fbab8d2-583c-44d2-8671-6d187c1ee755
```

Does this load WMS correctly?
