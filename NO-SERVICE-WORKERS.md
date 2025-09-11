# Service Workers are DISABLED in HERA

Service workers have been completely removed from HERA because they interfere with database connections and API calls.

## Quick Fix for Existing Service Worker Issues

If you're experiencing "Failed to fetch" errors:

1. **Visit**: http://localhost:3000/unregister-sw.html
2. **Wait**: 2 seconds for automatic cleanup
3. **Done**: The app will redirect and work properly

## Manual Cleanup (if needed)

1. Open Chrome DevTools (F12)
2. Go to Application → Service Workers
3. Click "Unregister" on any workers
4. Go to Application → Clear Storage
5. Click "Clear site data"

## What Was Removed

- All service worker files (`sw.js`, `sw-killswitch.js`, etc.)
- Service worker registration code
- PWA functionality
- Offline capabilities

## Why?

Service workers intercept ALL network requests, including Supabase database calls. This causes:
- "Failed to fetch" errors
- "net::ERR_FAILED" errors  
- Database connection failures
- API call failures

## For Developers

- Do NOT add service workers back
- Do NOT register service workers
- Use regular HTTP caching instead
- For offline needs, use localStorage/IndexedDB directly