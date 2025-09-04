# HERA Salon Multi-Tenant Setup Guide

## Overview

This guide explains how to set up the Hair Talkz salon chain with proper multi-tenant authentication, head office hierarchy, and branch isolation.

## Organization Structure

```
Hair Talkz Group (Head Office)
├── Hair Talkz • Park Regis Kris Kin (Karama) - Branch 1
└── Hair Talkz • Mercure Gold (Al Mina Rd) - Branch 2
```

## Organization IDs

```javascript
const SALON_HIERARCHY = {
  headOffice: {
    id: "849b6efe-2bf0-438f-9c70-01835ac2fe15",
    code: "SALON-GROUP",
    name: "Hair Talkz Group",
    subdomain: "hairtalkz",
    type: "head_office"
  },
  branches: [
    {
      id: "e3a9ff9e-bb83-43a8-b062-b85e7a2b4258",
      code: "SALON-BR1",
      name: "Hair Talkz • Park Regis Kris Kin (Karama)",
      subdomain: "hairtalkz-karama",
      type: "branch",
      parentId: "849b6efe-2bf0-438f-9c70-01835ac2fe15"
    },
    {
      id: "0b1b37cd-4096-4718-8cd4-e370f234005b",
      code: "SALON-BR2",
      name: "Hair Talkz • Mercure Gold (Al Mina Rd)",
      subdomain: "hairtalkz-almina",
      type: "branch",
      parentId: "849b6efe-2bf0-438f-9c70-01835ac2fe15"
    }
  ]
}
```

## URL Structure

### Demo Pages (No Auth Required)
- `http://localhost:3000/salon` - Demo salon dashboard
- `http://localhost:3000/salon-data` - Demo with calendar
- `http://localhost:3000/hera-dna-calendar` - Universal calendar demo
- `http://localhost:3000/employee-manager` - Employee management demo

### Authenticated Pages (Auth Required)
- `http://localhost:3000/org/salon` - Authenticated salon dashboard
- `http://hairtalkz.localhost:3000/org/salon` - Head office access
- `http://hairtalkz-karama.localhost:3000/org/salon` - Branch 1 access
- `http://hairtalkz-almina.localhost:3000/org/salon` - Branch 2 access

### Production URLs
- `https://hairtalkz.heraerp.com` - Head office
- `https://hairtalkz-karama.heraerp.com` - Branch 1
- `https://hairtalkz-almina.heraerp.com` - Branch 2

## Features by Role

### Head Office Features
- View all branches in a consolidated dashboard
- Access calendar data from all branches
- Switch between branch views
- Generate cross-branch reports
- Manage branch configurations
- View total revenue across all locations

### Branch Features
- View only their own branch data
- Manage their own appointments
- Access their staff and inventory
- Cannot see other branch data
- Limited to single location view

## Authentication Flow

1. **Login**: Users go to `/auth/login`
2. **Organization Selection**: After login, select organization
3. **Role Detection**: System detects if user is head office or branch
4. **Access Control**: 
   - Head office users can view all data
   - Branch users see only their location

## Setting Up Organizations in Database

```sql
-- Create organizations in Supabase
INSERT INTO core_organizations (
  id, 
  organization_code, 
  organization_name,
  organization_type,
  metadata
) VALUES 
(
  '849b6efe-2bf0-438f-9c70-01835ac2fe15',
  'SALON-GROUP',
  'Hair Talkz Group',
  'head_office',
  '{"subdomain": "hairtalkz", "industry": "salon"}'
),
(
  'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
  'SALON-BR1',
  'Hair Talkz • Park Regis Kris Kin (Karama)',
  'branch',
  '{"subdomain": "hairtalkz-karama", "parentId": "849b6efe-2bf0-438f-9c70-01835ac2fe15"}'
),
(
  '0b1b37cd-4096-4718-8cd4-e370f234005b',
  'SALON-BR2',
  'Hair Talkz • Mercure Gold (Al Mina Rd)',
  'branch',
  '{"subdomain": "hairtalkz-almina", "parentId": "849b6efe-2bf0-438f-9c70-01835ac2fe15"}'
);
```

## Development Setup

### Local Subdomain Testing

Add to `/etc/hosts`:
```
127.0.0.1 hairtalkz.localhost
127.0.0.1 hairtalkz-karama.localhost
127.0.0.1 hairtalkz-almina.localhost
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_SUBDOMAINS=true
```

## Key Implementation Files

1. **`/src/app/org/salon/page.tsx`** - Authenticated salon dashboard
2. **`/src/app/salon-data/page.tsx`** - Demo salon (no auth)
3. **`/src/components/salon/SalonResourceCalendar.tsx`** - Calendar component
4. **`/src/middleware.ts`** - Subdomain routing logic

## Security Considerations

1. **Organization Isolation**: Each branch can only access its own data
2. **Head Office Privileges**: Only head office organization can view all branches
3. **API Security**: All API calls include organization_id for filtering
4. **Row Level Security**: Database RLS policies enforce organization boundaries

## Testing the Setup

### As Head Office User:
1. Login with head office credentials
2. Navigate to `/org/salon`
3. Should see:
   - Organization Access panel showing all 3 organizations
   - Calendar tab with branch filter
   - Branches tab with individual branch cards
   - Consolidated metrics

### As Branch User:
1. Login with branch credentials
2. Navigate to `/org/salon`
3. Should see:
   - Only their branch in Organization Access
   - Calendar showing only their appointments
   - No Branches tab
   - Branch-specific metrics only

## API Integration

The authenticated dashboard expects these API endpoints:

```typescript
// Dashboard stats
GET /api/v1/salon/dashboard
Headers: { 'organization-id': 'org-uuid' }

// For head office (returns all branch data)
// For branch (returns only that branch data)
```

## Troubleshooting

### User can't access salon dashboard
- Check if organization ID matches one in SALON_HIERARCHY
- Verify user is member of the organization
- Check authentication status

### Head office can't see branches
- Verify organization ID matches head office ID exactly
- Check if branches have correct parentId in metadata

### Subdomain not working locally
- Ensure /etc/hosts entries are added
- Check middleware.ts for subdomain handling
- Verify NEXT_PUBLIC_ENABLE_SUBDOMAINS=true

## Summary

This setup provides:
- ✅ Proper multi-tenant isolation
- ✅ Head office oversight capabilities
- ✅ Branch-level data security
- ✅ Role-based access control
- ✅ Subdomain routing support
- ✅ Production-ready authentication