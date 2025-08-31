# PWA Cache Fix Guide - Solving Old Version Loading Issues

## Problem
Progressive Web Apps (PWAs) aggressively cache content for offline support, which can cause users to see old versions of your app even after deployments.

## Solution Overview
We've implemented a comprehensive cache-busting and auto-update system with the following components:

### 1. **Enhanced Service Worker (sw-v2.js)**
- Network-first strategy for all resources
- Aggressive cache invalidation
- Automatic skip waiting on updates
- Minimal caching (only offline fallback)

### 2. **Auto Update Checker Component**
- Checks for updates every 30 seconds
- Shows update notification when new version available
- Force reload with cache clearing
- Version endpoint polling

### 3. **Version API Endpoint**
- `/api/version` - Always returns fresh version info
- No caching headers
- Used by auto-update checker

### 4. **Build-time Version Injection**
- Automatic version stamping during build
- Updates service worker cache names
- Injects version into manifest.json

## Implementation Details

### Service Worker Strategy
```javascript
// Network First for everything
- Try network first with 5 second timeout
- Fall back to cache only if offline
- Skip cache for API calls, JSON, and dynamic content
- Immediate activation (skipWaiting)
- Take control of all clients (claim)
```

### Auto Update Flow
1. User loads app
2. AutoUpdateChecker polls `/api/version` every 30 seconds
3. If version mismatch detected:
   - Show update notification
   - Clear all caches
   - Unregister old service worker
   - Force reload page

### Cache Headers (via vercel.json)
- Service workers: `no-cache, no-store, must-revalidate`
- Manifest.json: `no-cache, no-store, must-revalidate`
- API routes: No caching

## User Actions to Force Update

### For End Users
1. **Auto Update**: Wait for update notification and click "Update Now"
2. **Manual Refresh**: 
   - Chrome/Edge: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Firefox: Ctrl+F5 (Cmd+Shift+R on Mac)
   - Safari: Cmd+Option+R
3. **Clear Site Data**:
   - Chrome: DevTools > Application > Clear Storage
   - Firefox: DevTools > Storage > Clear All
   - Safari: Develop > Empty Caches

### For Developers
1. Run build with automatic version injection:
   ```bash
   npm run build
   ```

2. Clear browser caches before deployment:
   ```bash
   npm run clear-cache
   ```

3. Test update flow locally:
   - Change version in `version.ts`
   - Rebuild and serve
   - Check if update notification appears

## Best Practices

### 1. **Always Use Versioned Assets**
- Next.js automatically versions JS/CSS with hashes
- Add version query params to critical resources
- Use cache-busting for manifest.json

### 2. **Service Worker Updates**
- Keep service worker file small
- Use network-first for critical resources
- Implement skip waiting for immediate updates

### 3. **User Communication**
- Show clear update notifications
- Provide manual update button
- Auto-reload after critical updates

### 4. **Testing**
- Test in incognito/private mode
- Use Chrome DevTools > Application tab
- Check "Update on reload" during development
- Test with slow network conditions

## Troubleshooting

### Update Not Showing
1. Check browser console for errors
2. Verify service worker is registered
3. Check `/api/version` returns current version
4. Clear browser data and retry

### Service Worker Not Updating
1. Check registration in DevTools
2. Manually unregister old worker
3. Clear all site data
4. Hard refresh (Ctrl+Shift+R)

### Cache Still Serving Old Content
1. Check Network tab for cached responses
2. Verify cache headers in responses
3. Clear specific caches in DevTools
4. Use incognito mode to test

## Architecture Benefits

### Reliability
- Graceful fallback for offline
- Network-first ensures freshness
- Automatic update detection

### Performance
- Minimal caching overhead
- Fast update propagation
- Efficient cache management

### User Experience
- Clear update notifications
- One-click updates
- No manual intervention needed

## Future Enhancements
1. Differential updates (only changed files)
2. Background sync for offline changes
3. Progressive enhancement for slow networks
4. A/B testing for update strategies