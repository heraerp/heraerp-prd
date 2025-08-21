# 🎯 HERA User Flow Visual Guide

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ENTRY POINTS                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  heraerp.com              Direct Links           Search/Ads            │
│  ┌──────────┐            ┌─────────────┐       ┌──────────────┐      │
│  │ Homepage │            │ /budgeting  │       │ Google Ads   │      │
│  │          │            │ /salon      │       │ "ERP software"│      │
│  └────┬─────┘            └──────┬──────┘       └───────┬──────┘      │
│       │                         │                       │              │
└───────┼─────────────────────────┼───────────────────────┼──────────────┘
        │                         │                       │
        ▼                         ▼                       ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DECISION POINT                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                        /get-started                                     │
│  ┌─────────────────────────┴────────────────────────────┐             │
│  │                                                       │             │
│  │  🚀 Progressive Trial          🏢 Production Setup   │             │
│  │  • No signup required          • Full authentication │             │
│  │  • Instant access              • Multi-user support  │             │
│  │  • 30-day browser storage     • Cloud database      │             │
│  │  • Perfect for testing         • API access          │             │
│  │                                                       │             │
│  └──────────┬──────────────────────────┬────────────────┘             │
│             │                           │                              │
└─────────────┼───────────────────────────┼──────────────────────────────┘
              │                           │
              ▼                           ▼
┌──────────────────────────┐  ┌────────────────────────────────────────┐
│   PROGRESSIVE PATH       │  │         PRODUCTION PATH                │
├──────────────────────────┤  ├────────────────────────────────────────┤
│                          │  │                                        │
│ /dashboard-progressive   │  │  /auth/login ──┐                      │
│         │                │  │                 │                      │
│         ├─> /salon       │  │  /auth/register─┤                      │
│         ├─> /restaurant  │  │                 │                      │
│         ├─> /budgeting   │  │                 ▼                      │
│         └─> /healthcare  │  │          Email Verification            │
│                          │  │                 │                      │
│  Features:               │  │                 ▼                      │
│  • IndexedDB storage     │  │            /setup                      │
│  • Full functionality    │  │         (Choose Apps)                  │
│  • Sample data included  │  │                 │                      │
│  • Offline capable       │  │                 ▼                      │
│                          │  │     Organization Creation              │
│  ┌──────────────────┐    │  │                 │                      │
│  │ Upgrade Banner   │    │  │                 ▼                      │
│  │ "Convert to      │    │  │     Subdomain Assignment              │
│  │  Production"     │    │  │     (acme.heraerp.com)               │
│  └────────┬─────────┘    │  │                 │                      │
│           │              │  │                 ▼                      │
└───────────┼──────────────┘  └─────────────────┼──────────────────────┘
            │                                    │
            └────────────────┬───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION INSTANCE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  acme.heraerp.com                      mario.heraerp.com              │
│  ┌─────────────────┐                   ┌─────────────────┐            │
│  │  Dashboard      │                   │  Dashboard      │            │
│  │  ┌───────────┐  │                   │  ┌───────────┐  │            │
│  │  │  Apps:    │  │                   │  │  Apps:    │  │            │
│  │  │  • Salon  │  │                   │  │  • Rest.  │  │            │
│  │  │  • Budget │  │                   │  │  • Budget │  │            │
│  │  └───────────┘  │                   │  └───────────┘  │            │
│  └─────────────────┘                   └─────────────────┘            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## User State Transitions

```
┌─────────────┐     Sign Up      ┌─────────────┐     Verify      ┌─────────────┐
│  Anonymous  │ ───────────────> │ Registered  │ ──────────────> │  Verified   │
│   Visitor   │                  │    User     │                  │    User     │
└─────────────┘                  └─────────────┘                  └─────────────┘
       │                                                                  │
       │ Try Progressive                                                  │ Create Org
       ▼                                                                  ▼
┌─────────────┐     Convert      ┌─────────────┐                  ┌─────────────┐
│ Progressive │ ───────────────> │ Registered  │                  │    Owner    │
│    User     │                  │    User     │                  │  of Org     │
└─────────────┘                  └─────────────┘                  └─────────────┘
```

## Data Storage by User Type

```
┌──────────────────────────────────┬────────────────────────────────────┐
│      PROGRESSIVE USER            │        PRODUCTION USER             │
├──────────────────────────────────┼────────────────────────────────────┤
│                                  │                                    │
│  Browser (IndexedDB)             │  Cloud (Supabase)                 │
│  ┌────────────────┐              │  ┌────────────────────┐           │
│  │ Organizations  │              │  │ core_organizations │           │
│  │ Entities       │              │  │ core_entities      │           │
│  │ Transactions   │              │  │ universal_trans... │           │
│  │ Relationships  │              │  │ core_relationships │           │
│  └────────────────┘              │  └────────────────────┘           │
│                                  │                                    │
│  • Single user                   │  • Multi-user                     │
│  • 30-day expiry                 │  • Permanent storage              │
│  • No auth required              │  • Full authentication            │
│  • Offline capable               │  • Real-time sync                 │
│                                  │                                    │
└──────────────────────────────────┴────────────────────────────────────┘
```

## Conversion Flow: Progressive to Production

```
Progressive User                    Conversion Process                Production User
┌─────────────┐                    ┌─────────────────┐              ┌─────────────┐
│   Using     │                    │ 1. Click Upgrade│              │  Full HERA  │
│   Salon     │ ────────────────> │ 2. Create Acct  │ ──────────> │  on Custom  │
│   Demo      │                    │ 3. Migrate Data │              │  Subdomain  │
└─────────────┘                    │ 4. Assign Domain│              └─────────────┘
                                   └─────────────────┘
                                           │
                                           ▼
                                   Data Migration:
                                   • Copy entities
                                   • Copy transactions  
                                   • Preserve relationships
                                   • Clear browser storage
```

## Authentication States

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AUTH STATE MACHINE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ANONYMOUS ──────> AUTHENTICATED ──────> ORG_SELECTED ──────> APP_ACTIVE│
│      │                  │                      │                   │    │
│      │                  │                      │                   │    │
│      ▼                  ▼                      ▼                   ▼    │
│  Can access:        Can access:           Can access:         Can access:│
│  • Homepage         • /setup              • Org dashboard     • All apps │
│  • Progressive      • /organizations      • App marketplace   • Settings │
│  • Marketing        • Profile settings    • User management   • Data     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Quick Reference: Routes by User Type

| User Type | Available Routes | Storage | Features |
|-----------|-----------------|---------|----------|
| **Anonymous** | `/`, `/get-started`, `/dashboard-progressive/*` | None | Browse, try demos |
| **Progressive** | `/dashboard-progressive/*` | IndexedDB | Full app features, 30-day trial |
| **Authenticated** | `/setup`, `/profile`, `/organizations` | Supabase | Account management |
| **Org Member** | `org.heraerp.com/*` | Supabase | Full production features |

## Implementation Priority

```
        HIGH PRIORITY                    MEDIUM PRIORITY               LOW PRIORITY
┌──────────────────────┐        ┌──────────────────────┐      ┌──────────────────┐
│ 1. Fix current flows │        │ 4. Subdomain routing │      │ 7. White label   │
│ 2. Update redirects  │        │ 5. Data migration    │      │ 8. API docs      │
│ 3. Add upgrade CTA   │        │ 6. Billing setup     │      │ 9. Analytics     │
└──────────────────────┘        └──────────────────────┘      └──────────────────┘
```