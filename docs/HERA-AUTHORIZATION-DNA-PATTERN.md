# 🧬 HERA Authorization DNA Pattern
**Universal Authentication System for All Industries**

## 🎯 Pattern Overview

The HERA Authorization DNA Pattern is a universal authentication system that works across all industries and demo applications. It eliminates the traditional authentication complexity by using HERA's Sacred Six tables and smart codes.

## 🏛️ Architecture Components

### 1. **Identity Bridge System**
Maps external authentication providers to HERA entities:
```typescript
// Supabase User ID → HERA Entity (stored in Platform org)
{
  entity_type: 'user',
  organization_id: '00000000-0000-0000-0000-000000000000', // Platform org
  metadata: {
    supabase_user_id: 'demo|salon-receptionist',
    provider: 'demo',
    industry: 'salon'
  },
  smart_code: 'HERA.SEC.DEMO.USER.SALON.v1'
}
```

### 2. **Organization Anchor Pattern**
Each organization has an anchor entity for membership relationships:
```typescript
{
  entity_type: 'org_anchor',
  organization_id: 'target-org-uuid',
  entity_name: 'Organization Membership Anchor',
  smart_code: 'HERA.SEC.ORG.ANCHOR.MEMBERSHIP.v1'
}
```

### 3. **Membership Authorization**
Role and scope authorization via relationships:
```typescript
{
  from_entity_id: 'user-entity-id',      // Platform user
  to_entity_id: 'org-anchor-id',         // Target org anchor
  relationship_type: 'membership',
  organization_id: 'target-org-uuid',    // Target organization
  relationship_data: {
    role: 'HERA.SEC.ROLE.RECEPTIONIST.DEMO.v1',
    scopes: [
      'read:HERA.SALON.SERVICE.APPOINTMENT',
      'write:HERA.SALON.SERVICE.APPOINTMENT',
      'read:HERA.SALON.CRM.CUSTOMER'
    ]
  },
  smart_code: 'HERA.SEC.MEMBERSHIP.DEMO.SALON.v1'
}
```

## 🎭 Demo User Configuration Template

### Universal Demo User Pattern
```typescript
export const DEMO_USERS = {
  'salon-receptionist': {
    supabase_user_id: 'demo|salon-receptionist',
    organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    redirect_path: '/salon/dashboard',
    session_duration: 30 * 60 * 1000,
    role: 'HERA.SEC.ROLE.RECEPTIONIST.DEMO.v1',
    scopes: [
      'read:HERA.SALON.SERVICE.APPOINTMENT',
      'write:HERA.SALON.SERVICE.APPOINTMENT',
      'read:HERA.SALON.CRM.CUSTOMER',
      'write:HERA.SALON.CRM.CUSTOMER',
      'read:HERA.SALON.SERVICE.CATALOG',
      'read:HERA.SALON.INVENTORY.PRODUCT'
    ]
  },
  'restaurant-manager': {
    supabase_user_id: 'demo|restaurant-manager',
    organization_id: '3740d358-f283-47e8-8055-852b67eee1a6',
    redirect_path: '/restaurant/dashboard',
    session_duration: 30 * 60 * 1000,
    role: 'HERA.SEC.ROLE.MANAGER.DEMO.v1',
    scopes: [
      'read:HERA.REST.POS.ORDER',
      'write:HERA.REST.POS.ORDER',
      'read:HERA.REST.INVENTORY.PRODUCT',
      'write:HERA.REST.INVENTORY.PRODUCT',
      'read:HERA.REST.FIN.REVENUE'
    ]
  },
  'healthcare-nurse': {
    supabase_user_id: 'demo|healthcare-nurse',
    organization_id: '037aac11-2323-4a71-8781-88a8454c9695',
    redirect_path: '/healthcare/dashboard',
    session_duration: 30 * 60 * 1000,
    role: 'HERA.SEC.ROLE.NURSE.DEMO.v1',
    scopes: [
      'read:HERA.HLTH.PAT.RECORD',
      'write:HERA.HLTH.PAT.RECORD',
      'read:HERA.HLTH.APPOINTMENT',
      'write:HERA.HLTH.APPOINTMENT'
    ]
  }
}
```

## 🔧 Implementation Components

### 1. **Server-Side Demo API** (`/api/v1/demo/initialize`)
```typescript
// Handles RLS bypass using service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Critical for RLS bypass
)

export async function POST(request: NextRequest) {
  const { demoType } = await request.json()
  
  // 1. Resolve identity bridge
  // 2. Validate membership
  // 3. Create session cookies
  // 4. Return user data
}
```

### 2. **Client-Side Demo Service**
```typescript
class DemoAuthService {
  async initializeDemoSession(demoType: DemoUserType): Promise<DemoAuthResult> {
    // Calls server-side API to bypass RLS
    const response = await fetch('/api/v1/demo/initialize', {
      method: 'POST',
      body: JSON.stringify({ demoType })
    })
    
    return response.json()
  }
}
```

### 3. **Universal Auth Provider**
```typescript
export function HERAAuthProvider({ children }: HERAAuthProviderProps) {
  // Handles both demo and real user sessions
  // Provides legacy compatibility
  // Manages session expiry
  // Integrates with existing UI components
}
```

## 🎯 Smart Code Patterns

### Authentication Smart Codes
```typescript
// User Identity
'HERA.SEC.DEMO.USER.{INDUSTRY}.v1'        // Demo users
'HERA.SEC.REAL.USER.{INDUSTRY}.v1'        // Real users
'HERA.SEC.PLATFORM.SYSTEM.USER.v1'       // Platform system user

// Organization Anchors
'HERA.SEC.ORG.ANCHOR.MEMBERSHIP.v1'      // Universal anchor

// Membership Relationships
'HERA.SEC.MEMBERSHIP.DEMO.{INDUSTRY}.v1'  // Demo memberships
'HERA.SEC.MEMBERSHIP.REAL.{INDUSTRY}.v1'  // Real memberships

// Roles
'HERA.SEC.ROLE.{ROLE}.DEMO.v1'           // Demo roles
'HERA.SEC.ROLE.{ROLE}.REAL.v1'           // Real roles
```

### Scope Patterns
```typescript
// Read/Write Pattern
'read:HERA.{INDUSTRY}.{MODULE}.{ENTITY}'
'write:HERA.{INDUSTRY}.{MODULE}.{ENTITY}'

// Industry Examples
'read:HERA.SALON.SERVICE.APPOINTMENT'     // Salon appointments
'write:HERA.REST.INVENTORY.PRODUCT'       // Restaurant inventory  
'read:HERA.HLTH.PAT.RECORD'              // Healthcare records
'write:HERA.MFG.PRODUCTION.ORDER'        // Manufacturing orders
```

## 🚀 Industry Templates

### Salon Template
```typescript
{
  industry: 'salon',
  demo_user_types: ['receptionist', 'stylist', 'manager', 'owner'],
  common_scopes: [
    'read:HERA.SALON.SERVICE.APPOINTMENT',
    'read:HERA.SALON.CRM.CUSTOMER',
    'read:HERA.SALON.SERVICE.CATALOG',
    'read:HERA.SALON.INVENTORY.PRODUCT'
  ],
  restricted_scopes: ['read:HERA.SALON.FIN.GL.ACCOUNT'],
  session_duration: 30 * 60 * 1000
}
```

### Restaurant Template
```typescript
{
  industry: 'restaurant',
  demo_user_types: ['cashier', 'server', 'cook', 'manager', 'owner'],
  common_scopes: [
    'read:HERA.REST.POS.ORDER',
    'read:HERA.REST.MENU.ITEM',
    'read:HERA.REST.CRM.CUSTOMER'
  ],
  restricted_scopes: ['write:HERA.REST.FIN.GL.ACCOUNT'],
  session_duration: 30 * 60 * 1000
}
```

### Healthcare Template  
```typescript
{
  industry: 'healthcare',
  demo_user_types: ['nurse', 'doctor', 'receptionist', 'admin'],
  common_scopes: [
    'read:HERA.HLTH.PAT.RECORD',
    'read:HERA.HLTH.APPOINTMENT',
    'write:HERA.HLTH.VITAL.SIGNS'
  ],
  restricted_scopes: ['read:HERA.HLTH.FIN.INSURANCE'],
  session_duration: 45 * 60 * 1000 // Longer for healthcare
}
```

### Manufacturing Template
```typescript
{
  industry: 'manufacturing',
  demo_user_types: ['operator', 'supervisor', 'planner', 'manager'],
  common_scopes: [
    'read:HERA.MFG.PRODUCTION.ORDER',
    'write:HERA.MFG.QUALITY.CHECK',
    'read:HERA.MFG.INVENTORY.MATERIAL'
  ],
  restricted_scopes: ['write:HERA.MFG.FIN.COSTING'],
  session_duration: 60 * 60 * 1000 // Longer for manufacturing shifts
}
```

## 🔐 Security Features

### 1. **Multi-Layer Authorization**
- **Layer 1**: Organization isolation (sacred organization_id boundary)
- **Layer 2**: Role-based permissions (relationship_data.role)
- **Layer 3**: Scope-based access (relationship_data.scopes array)

### 2. **Session Management**
- **Automatic Expiry**: Configurable session duration per industry
- **Extension Logic**: Auto-extend if membership valid
- **Cookie Security**: HttpOnly in production, SameSite protection
- **Clean Expiry**: Automatic cleanup of expired sessions

### 3. **RLS Bypass Strategy**
- **Server-Side APIs**: Use service role key for initial setup
- **Client Restrictions**: Client-side code never has service role access
- **Identity Bridge**: Safe resolution of external IDs to HERA entities

## 📱 Client Integration

### React Hook Usage
```typescript
function MyComponent() {
  const {
    user,
    organization, 
    isAuthenticated,
    scopes,
    hasScope,
    sessionType,
    timeRemaining,
    initializeDemo,
    logout
  } = useHERAAuth()
  
  if (!isAuthenticated) {
    return <AuthRequired />
  }
  
  return (
    <div>
      <h1>Welcome {user.name}</h1>
      <p>Organization: {organization.name}</p>
      
      {hasScope('read:HERA.SALON.SERVICE.APPOINTMENT') && (
        <AppointmentList />
      )}
      
      {sessionType === 'demo' && (
        <DemoNotice timeRemaining={timeRemaining} />
      )}
    </div>
  )
}
```

### Legacy Compatibility
```typescript
// Existing code continues to work
const { currentOrganization, isAuthenticated } = useMultiOrgAuth()

// New code uses enhanced hooks  
const { organization, isAuthenticated, hasScope } = useHERAAuth()
```

## 🛠️ Setup Scripts

### Create Demo User Infrastructure
```bash
cd mcp-server

# Create platform and demo user
node create-platform-production.js

# Create salon demo user  
node setup-salon-demo-user.js

# Test complete flow
node test-demo-salon-flow.js
```

### Extend to New Industry
```bash
# Copy salon pattern for new industry
node create-demo-user-pattern.js --industry restaurant --role manager
node create-demo-user-pattern.js --industry healthcare --role nurse  
node create-demo-user-pattern.js --industry manufacturing --role operator
```

## 🔄 Migration Path

### From MultiOrgAuthProvider to HERAAuthProvider
```typescript
// Step 1: Update imports
- import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
+ import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

// Step 2: Update hook usage (field mapping)
- const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
+ const { organization: currentOrganization, isAuthenticated, isLoading: contextLoading } = useHERAAuth()

// Step 3: Update root layout
- <MultiOrgAuthProvider>
+ <HERAAuthProvider>
```

## 🎯 Benefits

### For Developers
- **Universal Pattern**: Same authentication works across all industries
- **Zero Schema Changes**: Uses existing Sacred Six tables
- **Legacy Compatible**: Existing components continue working
- **Type Safe**: Full TypeScript support with intelligent error handling

### For Users  
- **Instant Access**: 30-second demo sessions across all industries
- **Proper Authorization**: Realistic role-based permissions
- **Professional Experience**: Same UX as production systems
- **Seamless Transitions**: Easy upgrade from demo to real accounts

### For Business
- **Rapid Deployment**: New industry demos in minutes, not months
- **Cost Effective**: Zero infrastructure changes required
- **Scalable**: Handles unlimited demo users and organizations
- **Secure**: Enterprise-grade security with perfect multi-tenant isolation

## 🚀 Next Industries to Implement

1. **Professional Services** (Consulting, Legal, Accounting)
2. **Retail & E-commerce** (POS, Inventory, Online stores)
3. **Education** (Schools, Universities, Training centers)
4. **Construction** (Project management, Equipment, Scheduling)
5. **Real Estate** (Property management, Listings, Transactions)
6. **Transportation** (Fleet management, Logistics, Scheduling)
7. **Hospitality** (Hotels, Restaurants, Event management)
8. **Agriculture** (Farm management, Crop tracking, Supply chain)

## 📋 Implementation Checklist

### New Industry Setup
- [ ] Create industry-specific demo user configuration
- [ ] Define role hierarchy and permission scopes
- [ ] Create demo organization with sample data
- [ ] Setup organization anchor and membership relationships
- [ ] Configure industry-specific session duration and restrictions
- [ ] Create demo route handler (`/demo/{industry}`)
- [ ] Test complete authentication flow
- [ ] Validate scope-based authorization
- [ ] Verify session expiry and cleanup
- [ ] Document industry-specific features

### Quality Assurance
- [ ] Multi-tenant isolation verified
- [ ] RLS enforcement confirmed
- [ ] Session security validated
- [ ] Performance benchmarks met
- [ ] Cross-browser compatibility tested
- [ ] Mobile responsiveness verified
- [ ] Accessibility compliance checked
- [ ] Error handling comprehensive

This pattern ensures that **every new HERA demo application benefits from the same robust, secure, and scalable authentication system** without any additional development effort.