# 🏗️ HERA SaaS Architecture Overview

## 🌐 Multi-Tenant Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         heraerp.com                             │
│                    (Marketing & Landing)                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      app.heraerp.com                            │
│                  (Central Auth & Onboarding)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐         │
│  │   Sign Up   │  │    Login     │  │  Org Manager  │         │
│  │   /signup   │  │   /login     │  │ /organizations│         │
│  └─────────────┘  └──────────────┘  └───────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Organization Subdomains                      │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ acme.heraerp.com │  │ mario.heraerp.com│  │xyz.heraerp.com│ │
│  │  ┌────────────┐  │  │  ┌────────────┐  │  │ ┌──────────┐ │ │
│  │  │   /salon   │  │  │  │/restaurant │  │  │ │/budgeting│ │ │
│  │  │   /retail  │  │  │  │/budgeting  │  │  │ │/financial│ │ │
│  │  │/budgeting  │  │  │  │/financial  │  │  │ │  /salon  │ │ │
│  │  └────────────┘  │  │  └────────────┘  │  │ └──────────┘ │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 User Journey Flows

### New User Registration Flow
```
1. Marketing Site           →  2. Central Auth           →  3. Organization Setup
   heraerp.com                 app.heraerp.com              app.heraerp.com
   [Get Started]               [Sign Up Form]               [Business Setup]
                                    ↓                             ↓
                               [Email Verify]               [Choose Subdomain]
                                    ↓                             ↓
                               [Basic Profile]              [Select Apps]
                                                                  ↓
4. Provisioning            →  5. Organization Ready
   app.heraerp.com             acme.heraerp.com
   [Installing Apps...]        [Dashboard]
```

### Existing User Login Flow
```
1. Any Entry Point         →  2. Central Auth           →  3. Organization
   *.heraerp.com              app.heraerp.com              selected.heraerp.com
   [Not Authenticated]        [Login Form]                 [App Dashboard]
                                   ↓
                              [Select Org]
                              (if multiple)
```

## 📊 Data Model for Multi-Tenant SaaS

### Organization Hierarchy
```
User Account (Supabase Auth)
    │
    ├─→ User Entity (core_entities)
    │       │
    │       └─→ Member of → Organization A
    │       └─→ Member of → Organization B
    │       └─→ Member of → Organization C
    │
    └─→ Session Context
            └─→ Current Organization
                    └─→ Installed Apps
                            ├─→ Salon App
                            ├─→ Budgeting App
                            └─→ Financial App
```

### Relationship Examples
```sql
-- User "john@example.com" owns "ACME Corp"
{
  from_entity_id: "user-john-uuid",
  to_entity_id: "org-acme-uuid",
  relationship_type: "member_of",
  metadata: {
    role: "owner",
    permissions: ["*"],
    joined_at: "2024-01-01"
  }
}

-- ACME Corp has Salon App installed
{
  from_entity_id: "org-acme-uuid",
  to_entity_id: "app-salon-uuid",
  relationship_type: "has_installed",
  metadata: {
    installed_at: "2024-01-15",
    config: {
      currency: "USD",
      timezone: "America/New_York"
    },
    subscription: {
      plan: "professional",
      seats: 10
    }
  }
}
```

## 🔐 Authentication & Authorization

### Token Flow
```
1. Login at app.heraerp.com
       ↓
2. Generate Master JWT
   - User ID
   - Email
   - Organizations[]
       ↓
3. Select Organization
       ↓
4. Generate Org-Scoped JWT
   - Everything from Master
   - Current Org ID
   - Org Permissions
   - Installed Apps
       ↓
5. Set Cookie Domain=.heraerp.com
       ↓
6. Redirect to org.heraerp.com
```

### Security Boundaries
```
┌─────────────────────────────────────┐
│         Global Scope                │
│  - User Authentication              │
│  - Organization List                │
│  - Billing Account                  │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│      Organization Scope             │
│  - Organization Data                │
│  - Installed Apps                   │
│  - Organization Users               │
│  - App Configurations               │
└─────────────────────────────────────┘
                ↓
┌─────────────────────────────────────┐
│         App Scope                   │
│  - App-Specific Data                │
│  - App Permissions                  │
│  - App Settings                     │
└─────────────────────────────────────┘
```

## 🚀 Deployment Architecture

### Infrastructure Layout
```
┌─────────────────────────────────────────────────────┐
│                   Cloudflare                        │
│  - DNS for *.heraerp.com                          │
│  - SSL Certificates                                │
│  - DDoS Protection                                 │
│  - Edge Routing                                    │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                Vercel Edge Network                  │
│  - Subdomain Detection                             │
│  - Organization Context                            │
│  - Static Asset Serving                            │
│  - API Routes                                      │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                    Supabase                         │
│  - PostgreSQL (Multi-tenant)                       │
│  - Row Level Security                              │
│  - Auth Service                                    │
│  - Realtime Subscriptions                          │
└─────────────────────────────────────────────────────┘
```

## 💰 Pricing & Billing Model

### Subscription Tiers
```
┌────────────────┬────────────────┬────────────────┬────────────────┐
│     FREE       │   STARTER      │ PROFESSIONAL   │  ENTERPRISE    │
├────────────────┼────────────────┼────────────────┼────────────────┤
│ 1 Organization │ 3 Organizations│ 10 Organizations│  Unlimited     │
│ 2 Apps         │ 5 Apps         │ All Apps       │  All Apps      │
│ 2 Users        │ 10 Users       │ 50 Users       │  Unlimited     │
│ Community      │ Email Support  │ Priority       │  Dedicated     │
│ $0/month       │ $49/month      │ $199/month     │  Custom        │
└────────────────┴────────────────┴────────────────┴────────────────┘
```

### App-Based Pricing
```
Base Platform: $29/month/organization
+ Salon App: $20/month
+ Restaurant App: $40/month
+ Budgeting App: $15/month
+ Financial App: $30/month
+ Healthcare App: $50/month
= Total Monthly Cost
```

## 🎯 Key Benefits

1. **True Multi-Tenancy**: Complete data isolation per organization
2. **Instant App Deployment**: 30-second app provisioning
3. **Flexible Scaling**: Pay for what you use
4. **White-Label Ready**: Custom domains possible
5. **Universal Architecture**: Same 6 tables power everything
6. **Cross-App Integration**: Share data between apps seamlessly

## 🛠️ Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Central auth hub (app.heraerp.com)
- [ ] Subdomain routing middleware
- [ ] Organization management APIs
- [ ] JWT token architecture

### Phase 2: Core Features (Week 3-4)
- [ ] Organization creation flow
- [ ] App marketplace UI
- [ ] App provisioning engine
- [ ] Multi-org switcher

### Phase 3: Production Ready (Week 5-6)
- [ ] Billing integration
- [ ] Email notifications
- [ ] Admin dashboard
- [ ] Monitoring & analytics

### Phase 4: Scale (Week 7-8)
- [ ] Edge deployment
- [ ] Performance optimization
- [ ] White-label support
- [ ] API documentation