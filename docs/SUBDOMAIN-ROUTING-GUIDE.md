# Subdomain-Based Organization Routing

## Overview

HERA uses an intelligent routing system that automatically determines the organization context based on the subdomain and route:

### Demo Mode (Sales/Testing)
- **URL Pattern**: `localhost:3000/salon` or `app.heraerp.com/salon`
- **Organization**: Uses predefined demo organization IDs
- **Purpose**: Allow potential customers to try the system
- **Data**: Sample demo data that resets periodically

### Production Mode (Customer)
- **URL Pattern**: `customername.heraerp.com/salon`
- **Organization**: Uses the customer's actual organization
- **Purpose**: Real production usage
- **Data**: Customer's actual business data with RLS protection

## How It Works

### 1. Middleware Detection
The middleware (`src/middleware.ts`) detects:
- The hostname (e.g., `mario.heraerp.com`)
- The pathname (e.g., `/salon`)
- Whether it's a custom subdomain or demo route

### 2. Organization Context
Based on the URL, it determines:
- **Organization ID**: Which organization to use
- **Is Demo**: Whether this is demo mode
- **Subdomain**: The customer's subdomain (if any)

### 3. RLS (Row Level Security)
- All database queries automatically filter by `organization_id`
- Demo organizations see only demo data
- Customer organizations see only their data
- No data leakage between organizations

## Demo Organization IDs

```typescript
export const DEMO_ORGANIZATIONS = {
  salon: '550e8400-e29b-41d4-a716-446655440000',
  icecream: '550e8400-e29b-41d4-a716-446655440001',
  restaurant: '550e8400-e29b-41d4-a716-446655440002',
  healthcare: '550e8400-e29b-41d4-a716-446655440003',
  jewelry: '550e8400-e29b-41d4-a716-446655440004',
  // ... more apps
}
```

## Usage in Components

### Using the Hook
```typescript
import { useOrganizationContext } from '@/hooks/useOrganizationContext'

export function MyComponent() {
  const { organization, isLoading } = useOrganizationContext()
  
  if (isLoading) return <div>Loading...</div>
  
  // Use organization.organizationId for API calls
  const data = await api.getData(organization.organizationId)
  
  // Show demo indicator if needed
  if (organization.isDemo) {
    return <Badge>Demo Mode</Badge>
  }
}
```

### Priority Order
1. **Authenticated User**: If logged in, use their selected organization
2. **Custom Subdomain**: If on `mario.heraerp.com`, use Mario's organization
3. **Demo Route**: If on `/salon`, use demo salon organization

## Setting Up Customer Subdomains

### 1. Database Setup
Add the subdomain to the organization:
```sql
UPDATE core_organizations 
SET subdomain = 'mario' 
WHERE id = 'customer-org-id';
```

### 2. DNS Configuration
Point `*.heraerp.com` to your server

### 3. SSL Certificate
Use wildcard certificate for `*.heraerp.com`

### 4. Vercel/Deployment Configuration
Add wildcard domain in your hosting platform

## Example Scenarios

### Scenario 1: Demo User
- URL: `app.heraerp.com/salon`
- Organization: Demo Salon (ID: `550e8400-e29b-41d4-a716-446655440000`)
- Mode: Demo
- Data: Sample salon data

### Scenario 2: Mario's Salon
- URL: `mario.heraerp.com/salon`
- Organization: Mario's Salon (ID: `actual-mario-org-id`)
- Mode: Production
- Data: Mario's actual business data

### Scenario 3: ACME Ice Cream
- URL: `acme.heraerp.com/icecream`
- Organization: ACME Corp (ID: `actual-acme-org-id`)
- Mode: Production
- Data: ACME's ice cream manufacturing data

## Security Considerations

1. **RLS Enforcement**: Every query must include `organization_id`
2. **API Protection**: APIs validate organization context
3. **Cross-Organization Prevention**: Middleware prevents accessing other orgs
4. **Demo Isolation**: Demo data is completely isolated

## Testing

### Local Testing
```bash
# Demo mode
http://localhost:3000/salon

# Simulate subdomain locally
# Add to /etc/hosts:
127.0.0.1 mario.localhost
# Then access:
http://mario.localhost:3000/salon
```

### Production Testing
```bash
# Demo
https://app.heraerp.com/salon

# Customer
https://mario.heraerp.com/salon
```