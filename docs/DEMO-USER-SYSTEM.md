# ⚠️ PARTIALLY OUTDATED: HERA Demo User System

**⚠️ THIS DOCUMENTATION NEEDS UPDATES**

**Current System**: Please refer to `/docs/UNIFIED-DEMO-MODULE-SELECTOR.md` for the current demo implementation.

**What Changed**: The auto-login approach described here has been replaced with a tile-based selector at `/auth/login`. Demo users now access modules by clicking tiles rather than visiting direct URLs.

**Migration Date**: 2025-01-11

---

# HERA Demo User System (NEEDS UPDATE)

## Overview

HERA now uses a **demo user authentication system** instead of path-based organization assignment. This provides a more secure and realistic demo experience that mirrors production authentication flow.

## Key Changes

### Before (Path-based)
- `/salon` → Automatically assigned to salon organization
- `/icecream` → Automatically assigned to ice cream organization
- No real authentication or user context

### After (Demo Users)
- `/salon` → Auto-login with `demo-salon@heraerp.com`
- `/icecream` → Auto-login with `demo-icecream@heraerp.com`
- Full authentication with real user context and organization

## Demo Users

| Business Type | Email | Password | Organization Name | Subdomain |
|--------------|-------|----------|------------------|-----------|
| Salon | demo-salon@heraerp.com | DemoSalon2025! | Bella Beauty Salon (Demo) | demo-salon |
| Ice Cream | demo-icecream@heraerp.com | DemoIceCream2025! | Kochi Ice Cream Manufacturing (Demo) | demo-icecream |
| Restaurant | demo-restaurant@heraerp.com | DemoRestaurant2025! | Mario's Restaurant (Demo) | demo-restaurant |
| Healthcare | demo-healthcare@heraerp.com | DemoHealthcare2025! | Dr. Smith Family Practice (Demo) | demo-healthcare |

## Setup Instructions

### 1. Run the Setup Script

```bash
# Install dependencies if needed
npm install

# Run the setup script
npx tsx scripts/setup-demo-users.ts
```

This will create:
- Demo users in Supabase Auth
- Demo organizations in core_organizations
- User memberships with owner role
- User entities in core_entities

### 2. How It Works

1. **User visits demo route** (e.g., `/salon`)
2. **DemoAuthHandler detects demo route** and triggers auto-login
3. **Demo user is authenticated** via Supabase
4. **Organization context is set** via MultiOrgAuthProvider
5. **User sees demo interface** with full functionality

### 3. Development URLs

```bash
# Local development
http://localhost:3000/salon        # Auto-login as Bella Beauty Salon
http://localhost:3000/icecream     # Auto-login as Kochi Ice Cream
http://localhost:3000/restaurant   # Auto-login as Mario's Restaurant
http://localhost:3000/healthcare   # Auto-login as Dr. Smith's Practice

# Production demo URLs
https://demo-salon.heraerp.com
https://demo-icecream.heraerp.com
https://demo-restaurant.heraerp.com
https://demo-healthcare.heraerp.com

# Regular organization access
https://mario.heraerp.com         # Real Mario's organization
https://bella.heraerp.com         # Real Bella organization
```

## Architecture Components

### 1. Demo Authentication Service (`/src/lib/auth/demo-auth.ts`)
- Manages demo user credentials
- Auto-login functionality
- Demo route detection

### 2. Demo Auth Handler (`/src/components/auth/DemoAuthHandler.tsx`)
- React component that wraps the app
- Automatically logs in demo users based on route
- Shows loading state during authentication

### 3. Updated Middleware (`middleware.ts`)
- Allows demo routes to pass through without rewriting
- Handles demo-specific subdomains in production
- Maintains backward compatibility with existing orgs

### 4. Enhanced MultiOrgAuthProvider
- Works seamlessly with demo users
- Sets correct organization context
- Handles organization switching

## Benefits

1. **Real Authentication Flow**: Demo users go through actual login process
2. **Secure Multi-tenancy**: Each demo has its own organization with proper isolation
3. **Production-like Experience**: Same auth flow as real users
4. **Easy Testing**: Test multi-org features with different demo accounts
5. **No Code in Routes**: Apps don't need to handle demo logic

## Customization

### Adding New Demo Apps

1. Update `DEMO_USERS` in `/src/lib/auth/demo-auth.ts`
2. Add route to `DEMO_ROUTES` in `middleware.ts`
3. Run setup script to create user and organization

### Custom Demo Data

Each demo organization can have its own:
- Products/Services
- Transactions
- Settings
- Custom branding

## Security Notes

- Demo users have limited permissions
- Demo organizations are marked with `demo: true` metadata
- Demo data can be easily cleaned up
- No impact on production organizations

## Troubleshooting

### Demo not auto-logging in?
1. Check browser console for errors
2. Verify demo user exists in Supabase
3. Clear localStorage and cookies
4. Try manual login at `/auth/login`

### Wrong organization?
1. Check `currentOrganization` in React DevTools
2. Verify organization exists for demo user
3. Check user memberships table

### Performance issues?
1. Demo login is cached after first attempt
2. Check Supabase connection
3. Verify no conflicting auth state