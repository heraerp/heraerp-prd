# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production (includes version injection)
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Build Process
The build process includes automatic version injection via `scripts/inject-build-version.js`. The `prebuild` script ensures version metadata is updated before each build.

## Architecture Overview

HERA (Hierarchical Enterprise Resource Architecture) is a universal ERP platform built on a revolutionary 6-table database architecture that can handle any business complexity without schema changes.

### Core Philosophy
**"6 Tables. Infinite Business Capability. Zero Schema Changes. Forever."**

### Universal 6-Table Schema
1. **`core_organizations`** - WHO (Business Context & Multi-Tenant Isolation)
2. **`core_entities`** - WHAT (All Business Objects & Master Data)
3. **`core_dynamic_data`** - HOW (All Properties, Fields & Configurations)
4. **`core_relationships`** - WHY (All Connections, Hierarchies & Workflows)
5. **`universal_transactions`** - WHEN (All Business Transaction Headers)
6. **`universal_transaction_lines`** - DETAILS (All Transaction Line Items)

### Technology Stack
- **Next.js 15** with App Router and React 19
- **TypeScript 5.8.3** with strict mode
- **Tailwind CSS 4.1.11** with custom HERA design system
- **Supabase** for database and authentication
- **Zod 4.0.10** for validation schemas
- **React Hook Form** for form management
- **TanStack Query** for server state
- **Zustand** for client state management

### Project Structure
```
src/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API routes (minimal implementation)
│   ├── globals.css               # HERA design system
│   ├── layout.tsx                # Root layout with PWA
│   └── page.tsx                  # Default homepage
├── components/                   
│   ├── pwa/                      # PWA-specific components
│   └── ui/                       # Shadcn UI components
├── lib/                          # Core utilities
└── types/                        # TypeScript definitions
```

## Universal Patterns

### Sacred Organization Filtering
Every database operation MUST include `organization_id` filtering for multi-tenancy:
```sql
-- SACRED PATTERN: Always filter by organization_id
SELECT * FROM core_entities 
WHERE organization_id = $1 AND entity_type = 'product';
```

### Universal Entity Pattern
Use consistent entity structure across all business objects:
```typescript
const product = {
  entity_type: 'product',
  entity_name: 'Margherita Pizza',
  organization_id: 'restaurant_uuid'
}
```

### Universal Transaction Pattern
All business transactions follow the same structure:
```typescript
const order = {
  transaction_type: 'restaurant_order',
  line_items: [
    { entity_id: 'pizza_uuid', quantity: 2, unit_price: 18.50 }
  ]
}
```

## Authentication Architecture

### Current State
- **Dependencies**: NextAuth.js 4.24.11, Supabase auth adapters
- **RLS Policies**: Configured for `core_clients`, `core_entities`, `core_organizations`
- **JWT Claims**: Uses `organization_id`, `client_id`, `role` claims
- **Roles**: `super_admin`, `client_admin` with hierarchical access

### Implementation Status
- Database RLS policies configured but authentication middleware not implemented
- Empty auth-service directories suggest planned microservice architecture
- No active authentication flows or middleware.ts present

## Design System

### HERA Brand Colors (oklch)
- **Primary Blue**: `oklch(0.57 0.192 250)`
- **Cyan Secondary**: `oklch(0.68 0.12 200)`
- **Emerald Accent**: `oklch(0.64 0.12 160)`
- **Amber Gold**: `oklch(0.69 0.12 85)`
- **Purple**: `oklch(0.58 0.192 280)`

### CSS Classes
Use HERA-specific utility classes:
```css
.hera-card              /* Professional card layouts */
.hera-button            /* Primary action buttons */
.hera-input             /* Form inputs */
.hera-badge-*           /* Status indicators */
.hera-gradient-text     /* Brand gradient text */
```

## Validation Patterns

### Zod Schemas
Follow universal validation patterns:
```typescript
export const EntitySchema = z.object({
  entity_type: z.string().min(1, 'Entity type required'),
  entity_name: z.string().min(1, 'Entity name required'),
  organization_id: z.string().uuid('Valid organization ID required')
})
```

### Business Rules
- All transactions must have at least one line item
- Organization filtering is mandatory for all queries
- Entity types determine business object categorization

## AI-Native Features

### Built-in AI Fields
Every table includes AI enhancement fields:
- `ai_confidence` - Data quality scoring
- `ai_classification` - Smart categorization
- `ai_insights` - Business intelligence
- `ai_enhanced_value` - AI-improved data

## PWA Implementation

### Service Worker
- Cache management with versioning in `/public/sw.js`
- Auto-update mechanism with user notifications
- Offline support for core application routes

### Components
- `ServiceWorkerProvider.tsx` - Manages SW lifecycle and updates
- `InstallPrompt.tsx` - Native app installation prompts

## Development Guidelines

1. **Never Create Business-Specific Tables** - Use entity_type for categorization
2. **Always Include organization_id** - Mandatory for multi-tenant security
3. **Follow Universal Patterns** - Use the 6-table architecture consistently
4. **Maintain Type Safety** - Use Zod schemas for runtime validation
5. **Implement Progressive Enhancement** - Start with core, add AI features

## Current Limitations

- Most service directories are empty placeholders
- Authentication flows not implemented despite configured dependencies
- Database schema files exist but are empty
- Basic Next.js starter homepage still in use
- No active database connections or core business logic

## Business Examples

The universal architecture works for any business type:
- **Restaurant**: Menu items as entities, orders as transactions
- **Healthcare**: Patients as entities, treatments as transactions  
- **Manufacturing**: Products as entities, BOMs as transactions
- **Professional Services**: Clients as entities, invoices as transactions

This consistency enables rapid deployment across diverse business models using identical patterns.