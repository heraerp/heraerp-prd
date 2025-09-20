# HERA Authorization Flow - Demo vs Real Users

## Complete Authorization Architecture Diagram

```mermaid
graph TB
    %% Supabase Auth Layer
    subgraph "🔐 Supabase Authentication Layer"
        SA[Supabase Auth]
        DemoSession[Demo Anonymous Session<br/>user_id: demo|salon-receptionist]
        RealSession[Real User Session<br/>user_id: auth0|abc123def]
    end

    %% HERA Platform Organization (Global Identity)
    subgraph "🏛️ HERA Platform Organization<br/>ID: 00000000-0000-0000-0000-000000000000"
        PlatformOrg[Platform Organization<br/>Global Identity Management]
        
        subgraph "👥 User Entities (Platform Org)"
            DemoUserEntity[Demo User Entity<br/>ID: demo-user-123<br/>entity_type: user<br/>Smart Code: HERA.SEC.PLATFORM.SYSTEM.USER.v1<br/>metadata.supabase_user_id: demo|salon-receptionist]
            
            RealUserEntity[Real User Entity<br/>ID: real-user-456<br/>entity_type: user<br/>Smart Code: HERA.SEC.PLATFORM.SYSTEM.USER.v1<br/>metadata.supabase_user_id: auth0|abc123def]
        end
        
        PlatformSystemUser[Platform System User<br/>ID: 7a9c69d0-7db5-4b35-bbbf-c3285b0ca19e<br/>Cross-org operations]
    end

    %% Hair Talkz Salon Organization
    subgraph "💇 Hair Talkz Salon Organization<br/>ID: 0fd09e31-d257-4329-97eb-7d7f522ed6f0"
        SalonOrg[Salon Organization<br/>Business Operations]
        
        SalonAnchor[Organization Anchor<br/>ID: 9c62b61a-144b-459b-a660-3d8d2f152bed<br/>entity_type: org_anchor<br/>Smart Code: HERA.SEC.ORG.ANCHOR.MEMBERSHIP.v1]
        
        subgraph "🔗 Membership Relationships (Salon Scoped)"
            DemoMembership[Demo User Membership<br/>from_entity_id: demo-user-123<br/>to_entity_id: salon-anchor<br/>relationship_type: membership<br/>Smart Code: HERA.SEC.MEMBERSHIP.DEMO.v1<br/>relationship_data: {role, scopes}]
            
            RealMembership[Real User Membership<br/>from_entity_id: real-user-456<br/>to_entity_id: salon-anchor<br/>relationship_type: membership<br/>Smart Code: HERA.SEC.MEMBERSHIP.PROD.v1<br/>relationship_data: {role, scopes}]
        end
        
        subgraph "💼 Business Entities (Salon Scoped)"
            Appointments[Appointments<br/>Smart Code: HERA.SALON.SERVICE.APPOINTMENT.v1]
            Services[Services<br/>Smart Code: HERA.SALON.SERVICE.CATALOG.v1]
            Customers[Customers<br/>Smart Code: HERA.SALON.CRM.CUSTOMER.v1]
            FinanceGL[GL Accounts<br/>Smart Code: HERA.SALON.FIN.GL.ACCOUNT.v1]
        end
    end

    %% Role Definitions with Dynamic Data
    subgraph "🛡️ Role & Scope Configuration"
        subgraph "Demo User Roles"
            DemoReceptionist[Demo Receptionist Role<br/>relationship_data.role: HERA.SEC.ROLE.RECEPTIONIST.DEMO.v1<br/>relationship_data.scopes: [<br/>  read:HERA.SALON.SERVICE.APPOINTMENT,<br/>  write:HERA.SALON.SERVICE.APPOINTMENT,<br/>  read:HERA.SALON.CRM.CUSTOMER<br/>]]
        end
        
        subgraph "Real User Roles"
            RealManager[Real Manager Role<br/>relationship_data.role: HERA.SEC.ROLE.MANAGER.PROD.v1<br/>relationship_data.scopes: [<br/>  read:HERA.SALON.SERVICE.*,<br/>  write:HERA.SALON.SERVICE.*,<br/>  read:HERA.SALON.CRM.*,<br/>  write:HERA.SALON.CRM.*,<br/>  read:HERA.SALON.FIN.GL.*<br/>]]
            
            RealOwner[Real Owner Role<br/>relationship_data.role: HERA.SEC.ROLE.OWNER.PROD.v1<br/>relationship_data.scopes: [<br/>  admin:HERA.SALON.*,<br/>  read:HERA.SALON.FIN.*,<br/>  write:HERA.SALON.FIN.*<br/>]]
            
            RealStylist[Real Stylist Role<br/>relationship_data.role: HERA.SEC.ROLE.STYLIST.PROD.v1<br/>relationship_data.scopes: [<br/>  read:HERA.SALON.SERVICE.APPOINTMENT,<br/>  write:HERA.SALON.SERVICE.APPOINTMENT,<br/>  read:HERA.SALON.SERVICE.CATALOG<br/>]]
        end
    end

    %% Session & Authorization Flow
    subgraph "🔄 Session Authorization Flow"
        SessionStart[Session Start]
        ResolveIdentity[Resolve User Identity<br/>Supabase user_id → Platform user entity]
        ResolveMembership[Resolve Organization Membership<br/>Query core_relationships]
        ExtractRoleScopes[Extract Role & Scopes<br/>From relationship_data JSON]
        SetSessionContext[Set Session Context<br/>app.org_id, app.user_id, app.scopes]
        RLSEnforcement[RLS Policy Enforcement<br/>Filter all queries by context]
    end

    %% API Access Patterns
    subgraph "📋 API Access Control Examples"
        subgraph "Demo User Access"
            DemoAppointments[✅ Can read/write appointments<br/>❌ Cannot access GL accounts<br/>❌ Cannot see financial data]
        end
        
        subgraph "Real Manager Access"
            ManagerAppointments[✅ Can read/write appointments<br/>✅ Can read GL accounts<br/>❌ Cannot write financial transactions]
        end
        
        subgraph "Real Owner Access"
            OwnerAppointments[✅ Full appointment access<br/>✅ Full financial access<br/>✅ Can manage users & settings]
        end
    end

    %% Transaction Audit Trail
    subgraph "📊 Audit Trail (universal_transactions)"
        LoginTransaction[Session Login Transaction<br/>Smart Code: HERA.SEC.SESSION.LOGIN.v1<br/>actor_entity_id: user-entity-id<br/>organization_id: salon-org-id]
        
        OrgSwitchTransaction[Organization Switch Transaction<br/>Smart Code: HERA.SEC.SESSION.ORG.SWITCH.v1<br/>Lines contain: from_org, to_org, scopes]
    end

    %% Flow Connections
    SA --> DemoSession
    SA --> RealSession
    
    DemoSession --> DemoUserEntity
    RealSession --> RealUserEntity
    
    DemoUserEntity --> DemoMembership
    RealUserEntity --> RealMembership
    
    DemoMembership --> SalonAnchor
    RealMembership --> SalonAnchor
    
    DemoMembership --> DemoReceptionist
    RealMembership --> RealManager
    RealMembership --> RealOwner
    RealMembership --> RealStylist
    
    SessionStart --> ResolveIdentity
    ResolveIdentity --> ResolveMembership
    ResolveMembership --> ExtractRoleScopes
    ExtractRoleScopes --> SetSessionContext
    SetSessionContext --> RLSEnforcement
    
    RLSEnforcement --> DemoAppointments
    RLSEnforcement --> ManagerAppointments
    RLSEnforcement --> OwnerAppointments
    
    SetSessionContext --> LoginTransaction
    SetSessionContext --> OrgSwitchTransaction

    %% Styling
    classDef platformOrg fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef salonOrg fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef userEntity fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef membership fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef role fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef session fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef access fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px

    class PlatformOrg,PlatformSystemUser platformOrg
    class SalonOrg,SalonAnchor salonOrg
    class DemoUserEntity,RealUserEntity userEntity
    class DemoMembership,RealMembership membership
    class DemoReceptionist,RealManager,RealOwner,RealStylist role
    class SessionStart,ResolveIdentity,ResolveMembership,ExtractRoleScopes,SetSessionContext,RLSEnforcement session
    class DemoAppointments,ManagerAppointments,OwnerAppointments access
```

## Key Architecture Principles

### 1. **Identity Bridge Pattern**
- Supabase Auth provides authentication (WHO)
- HERA Platform org stores global user identities
- `metadata.supabase_user_id` bridges the two systems

### 2. **Tenant-Scoped Membership**
- Memberships are relationships stored in the target organization
- Each membership has role + scopes in `relationship_data` JSON
- Perfect tenant isolation through `organization_id`

### 3. **Demo vs Real - Same Architecture**
- Demo users: `supabase_user_id: demo|salon-receptionist`
- Real users: `supabase_user_id: auth0|abc123def` 
- Everything else identical - same tables, same patterns

### 4. **Role-Based Access Control**
- Roles stored as data, not hardcoded
- Scopes follow smart code patterns
- Dynamic permission evaluation

### 5. **Complete Audit Trail**
- All session events logged as transactions
- Smart codes provide business context
- Perfect traceability for compliance

## Example API Flow

```typescript
// 1. User logs in via Supabase
const { user } = await supabase.auth.getUser()
// user.id = "demo|salon-receptionist" or "auth0|abc123def"

// 2. Resolve HERA identity
const userEntity = await findUserEntity(user.id)
// Returns: Platform org user entity with supabase_user_id in metadata

// 3. Resolve organization membership
const membership = await findMembership(userEntity.id, salonOrgId)
// Returns: Relationship with role/scopes in relationship_data

// 4. Set session context
await setSessionContext({
  org_id: salonOrgId,
  user_id: userEntity.id,
  scopes: membership.relationship_data.scopes
})

// 5. All subsequent queries automatically filtered by RLS
const appointments = await supabase
  .from('core_entities')
  .select('*')
  .eq('entity_type', 'appointment')
// RLS automatically adds: AND organization_id = 'salon-org-id'
// Scope check: user must have 'read:HERA.SALON.SERVICE.APPOINTMENT'
```

This architecture provides:
- ✅ Perfect tenant isolation
- ✅ Flexible role management  
- ✅ Complete audit trails
- ✅ Demo and production parity
- ✅ Enterprise security compliance
- ✅ Zero schema changes required