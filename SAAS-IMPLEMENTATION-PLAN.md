# 🚀 HERA SaaS Implementation Plan

## Current State → Target State

### Current State ✅
- Single application at localhost:3000
- Basic Supabase authentication
- Login redirects to /setup
- App selection page exists
- Multiple progressive apps available

### Target State 🎯
- Multi-tenant SaaS platform
- Organization-based subdomains
- Central authentication hub
- App marketplace and provisioning
- Complete user journey from signup to app usage

## 📋 Implementation Phases

### Phase 1: Authentication Infrastructure (Priority: HIGH)

#### 1.1 Update Authentication Flow
```typescript
// Update DualAuthProvider to handle organizations
interface AuthContext {
  user: User
  organizations: Organization[]
  currentOrganization: Organization | null
  switchOrganization: (orgId: string) => Promise<void>
  createOrganization: (data: OrgData) => Promise<Organization>
}
```

**Files to modify:**
- `/src/components/auth/DualAuthProvider.tsx`
- `/src/lib/auth/organization-context.ts` (new)
- `/src/hooks/useOrganization.ts` (new)

#### 1.2 Create Organization Management APIs
```typescript
// New API routes needed
POST   /api/v1/organizations          // Create organization
GET    /api/v1/organizations          // List user's organizations
GET    /api/v1/organizations/:id      // Get organization details
PUT    /api/v1/organizations/:id      // Update organization
POST   /api/v1/organizations/:id/apps // Install app for organization
DELETE /api/v1/organizations/:id/apps/:appId // Uninstall app
```

**Files to create:**
- `/src/app/api/v1/organizations/route.ts`
- `/src/app/api/v1/organizations/[id]/route.ts`
- `/src/app/api/v1/organizations/[id]/apps/route.ts`

### Phase 2: Subdomain Architecture (Priority: HIGH)

#### 2.1 Middleware for Subdomain Detection
```typescript
// middleware.ts
import { NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const currentHost = hostname.replace(':3000', '')
  
  // Extract subdomain
  const subdomain = currentHost.split('.')[0]
  
  // Route based on subdomain
  if (subdomain === 'app') {
    // Central auth routes
    return NextResponse.rewrite(new URL(`/auth${request.nextUrl.pathname}`, request.url))
  }
  
  if (subdomain && subdomain !== 'www' && subdomain !== 'localhost') {
    // Organization routes
    request.headers.set('x-hera-subdomain', subdomain)
    return NextResponse.rewrite(new URL(`/org${request.nextUrl.pathname}`, request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
```

**Files to create:**
- `/src/middleware.ts`
- `/src/app/auth/layout.tsx` (central auth layout)
- `/src/app/org/layout.tsx` (organization layout)

#### 2.2 Update Routes Structure
```
/src/app/
├── page.tsx                    # Marketing homepage
├── auth/                       # Central auth (app.heraerp.com)
│   ├── login/
│   ├── signup/
│   ├── organizations/
│   └── onboarding/
├── org/                        # Organization apps (*.heraerp.com)
│   ├── page.tsx               # Org dashboard
│   ├── salon/
│   ├── restaurant/
│   ├── budgeting/
│   └── settings/
└── api/
    └── v1/
        ├── auth/
        ├── organizations/
        └── universal/
```

### Phase 3: Organization Onboarding (Priority: MEDIUM)

#### 3.1 Create Signup Flow
```typescript
// Signup steps:
1. Email/Password (Supabase Auth)
2. Verify Email
3. Personal Information
4. Create First Organization
   - Organization Name
   - Industry Type
   - Choose Subdomain
5. Select Initial Apps
6. Provision & Redirect
```

**Components to create:**
- `/src/components/auth/SignupWizard.tsx`
- `/src/components/auth/OrganizationSetup.tsx`
- `/src/components/auth/AppSelector.tsx`
- `/src/components/auth/SubdomainChecker.tsx`

#### 3.2 Provisioning Engine
```typescript
async function provisionOrganization(data: {
  name: string
  subdomain: string
  industry: string
  initialApps: string[]
  ownerId: string
}) {
  // 1. Create organization entity
  const org = await createOrganizationEntity(data)
  
  // 2. Create owner relationship
  await createOwnerRelationship(data.ownerId, org.id)
  
  // 3. Generate initial COA based on industry
  await generateChartOfAccounts(org.id, data.industry)
  
  // 4. Install selected apps
  for (const appId of data.initialApps) {
    await installApp(org.id, appId)
  }
  
  // 5. Create sample data if requested
  if (data.includeSampleData) {
    await generateSampleData(org.id, data.industry)
  }
  
  return org
}
```

### Phase 4: App Management (Priority: MEDIUM)

#### 4.1 App Marketplace
```typescript
// App catalog with metadata
const HERA_APP_CATALOG = {
  salon: {
    id: 'salon',
    name: 'Salon Management',
    category: 'Industry Specific',
    pricing: { monthly: 49, yearly: 490 },
    features: [...],
    requirements: {
      minUsers: 1,
      industries: ['beauty', 'wellness']
    }
  },
  // ... other apps
}
```

**Pages to create:**
- `/src/app/org/apps/page.tsx` (installed apps)
- `/src/app/org/apps/marketplace/page.tsx` (available apps)
- `/src/app/org/apps/[appId]/settings/page.tsx` (app settings)

### Phase 5: Multi-Org Support (Priority: LOW)

#### 5.1 Organization Switcher
```typescript
// Header component with org switcher
function OrganizationSwitcher() {
  const { organizations, currentOrganization, switchOrganization } = useAuth()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {currentOrganization.name}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {organizations.map(org => (
          <DropdownMenuItem onClick={() => switchOrganization(org.id)}>
            {org.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/auth/organizations/new')}>
          Create Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

## 🛠️ Technical Requirements

### Environment Variables
```env
# Add to .env.local
NEXT_PUBLIC_APP_DOMAIN=heraerp.com
NEXT_PUBLIC_AUTH_SUBDOMAIN=app
NEXT_PUBLIC_ENABLE_SUBDOMAINS=true

# For local development
NEXT_PUBLIC_LOCAL_SUBDOMAINS=true
NEXT_PUBLIC_LOCAL_DOMAIN=localhost:3000
```

### Database Migrations
```sql
-- Add subdomain to organizations
ALTER TABLE core_entities 
ADD COLUMN subdomain TEXT UNIQUE 
WHERE entity_type = 'organization';

-- Add indexes for performance
CREATE INDEX idx_org_subdomain ON core_entities(subdomain) 
WHERE entity_type = 'organization';
```

### Deployment Configuration
```javascript
// vercel.json
{
  "rewrites": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "app.heraerp.com"
        }
      ],
      "destination": "/auth/:path*"
    }
  ]
}
```

## 📅 Timeline

### Week 1-2: Foundation
- [ ] Update authentication provider
- [ ] Create organization APIs
- [ ] Implement subdomain routing
- [ ] Test multi-tenant isolation

### Week 3-4: User Experience
- [ ] Build signup wizard
- [ ] Create organization dashboard
- [ ] Implement app marketplace
- [ ] Add provisioning engine

### Week 5-6: Production Ready
- [ ] Add billing integration
- [ ] Implement usage tracking
- [ ] Create admin dashboard
- [ ] Add monitoring/analytics

### Week 7-8: Polish & Scale
- [ ] Performance optimization
- [ ] Edge deployment setup
- [ ] Documentation
- [ ] Launch preparation

## 🎯 Success Metrics

1. **User can sign up and create organization** < 2 minutes
2. **Organization provisioning time** < 30 seconds
3. **App installation time** < 10 seconds
4. **Zero data leakage** between organizations
5. **Support 10,000+ organizations** without performance degradation

## 🚦 Next Immediate Steps

1. Create organization management APIs
2. Implement subdomain routing middleware
3. Update authentication to support organizations
4. Create basic organization dashboard
5. Test end-to-end flow locally

This plan transforms HERA from a single-app platform to a true multi-tenant SaaS ERP that can scale to thousands of organizations while maintaining the simplicity of the universal 6-table architecture.