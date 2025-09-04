# Testing Salon Demo

Due to service worker issues, please follow these steps:

## Option 1: Clear Service Worker and Test (Recommended)
1. Visit http://localhost:3000/unregister-sw.html
   - This will automatically unregister all service workers and clear caches
   - It will redirect to /salon-demo after 3 seconds

## Option 2: Use Alternative Page Without Service Worker Issues
1. Visit http://localhost:3000/salon-demo-v2
   - This uses a regular API endpoint instead of server actions
   - Should work without service worker conflicts

## Option 3: Manual Service Worker Cleanup
1. Open Chrome DevTools (F12)
2. Go to Application tab → Service Workers
3. Click "Unregister" on any registered workers
4. Go to Application → Storage → Clear site data
5. Refresh and try again

## What the Salon Builder Does:
- Creates a new organization with subdomain (e.g., hair-talkz-marina.lvh.me:3000)
- Sets up 3 pre-configured services with pricing
- Creates 2 professional stylists with specializations  
- Provisions the organization for the salon app
- Redirects to the salon management dashboard

## Service Worker Status:
The service worker has been temporarily disabled in the code to prevent the Response conversion errors. Once you test the salon builder successfully, we can re-enable it with proper fixes.

## URLs Created:
When you build a salon, it will be accessible at:
- Subdomain: http://[your-slug].lvh.me:3000/salon-data
- Or path: http://localhost:3000/org/[your-slug]/salon-data