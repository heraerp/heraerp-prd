# Default Organization Setup for Development

This guide explains how to use the default organization ID feature for streamlined development when users don't have organizations associated with their accounts.

## Configuration

A default salon organization has been configured in `.env.local`:

```bash
# Default Organization ID for development (salon organization)
NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=550e8400-e29b-41d4-a716-446655440000
```

This points to "Dubai Luxury Salon & Spa" - a pre-configured salon organization in the database.

## How It Works

1. **MultiOrgAuthProvider Enhancement**: The authentication provider now checks for the default organization ID when a user has no organizations:
   - If user has organizations: Normal flow
   - If user has no organizations AND default ID is set: Uses the default organization
   - This allows immediate access to the salon without manual organization association

2. **Direct Salon Access**: The `/salon` page now works with or without organization context:
   - With organization context: Uses the current organization
   - Without context: Falls back to the default organization ID

## Access Methods

You can now access the salon dashboard through multiple routes:

1. **Direct Access**: `http://localhost:3001/salon`
2. **Salon Direct**: `http://localhost:3001/salon-direct` (auto-detects salon org)
3. **Subdomain**: `http://localhost:3001/~salon/salon` (if configured)

## Associate User with Organization (Optional)

If you want to properly associate a user with the salon organization:

```bash
cd mcp-server
node associate-user-to-salon.js user@example.com
```

This script will:
- Find the user in Supabase auth
- Create a user entity if needed
- Create organization membership relationship
- Enable full multi-tenant features

## Benefits

1. **Faster Development**: No need to manually create organizations for each test user
2. **Consistent Testing**: Always test with the same well-configured salon
3. **Easy Onboarding**: New developers can start immediately without setup
4. **Fallback Safety**: Works even when organization creation fails

## Important Notes

- This is a **development-only** feature
- In production, users must be properly associated with organizations
- The default organization ID is only used when no organizations are found
- All data created will be associated with the default organization

## Troubleshooting

If the salon dashboard shows "No organization context":
1. Check that `.env.local` has the `NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID` variable
2. Restart the Next.js development server to load new environment variables
3. Clear browser localStorage: `localStorage.clear()` in console
4. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+F5)