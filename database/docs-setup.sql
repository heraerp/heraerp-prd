-- HERA Documentation System Setup
-- This script creates sample documentation content using the universal 6-table architecture

-- Create documentation organizations
INSERT INTO core_organizations (
  id,
  organization_name,
  organization_type,
  settings,
  created_at,
  updated_at
) VALUES 
(
  gen_random_uuid(),
  'HERA Developer Documentation',
  'documentation',
  '{
    "doc_type": "developer",
    "access_level": "internal",
    "theme": "technical",
    "auto_generate_nav": true
  }'::jsonb,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'HERA User Documentation',
  'documentation',
  '{
    "doc_type": "user",
    "access_level": "public",
    "theme": "user-friendly",
    "auto_generate_nav": true
  }'::jsonb,
  NOW(),
  NOW()
);

-- Sample Developer Documentation Pages
WITH dev_org AS (
  SELECT id as org_id FROM core_organizations 
  WHERE organization_name = 'HERA Developer Documentation'
),
sample_pages AS (
  SELECT * FROM (VALUES
    ('getting-started', 'Getting Started', 'Setup', 1, '# Getting Started

Welcome to HERA development! This guide will help you set up your development environment and understand the core concepts.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/hera-erp.git
cd hera-erp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

## Next Steps

- [Architecture Overview](/docs/dev/architecture/overview)
- [Database Setup](/docs/dev/database/setup)
- [API Development](/docs/dev/api/development)'),

    ('architecture/overview', 'Architecture Overview', 'Architecture', 2, '# HERA Architecture Overview

HERA is built on a revolutionary universal 6-table database architecture that can handle any business complexity without requiring schema changes.

## Universal 6-Table Schema

### 1. core_organizations
Multi-tenant isolation with organization_id filtering throughout the application.

### 2. core_entities  
All business objects (products, customers, employees, etc.) are stored as entities with a universal entity_type classification.

### 3. core_dynamic_data
Unlimited custom fields for any entity through flexible key-value relationships.

### 4. core_relationships
Entity connections and workflow relationships enable complex business logic.

### 5. universal_transactions
All business transactions (sales, purchases, payments, transfers) follow a universal pattern.

### 6. universal_transaction_lines
Transaction line items and details provide complete audit trails.

## Design Principles

- **Multi-tenant by design**: Sacred organization_id filtering
- **Universal patterns**: Avoid business-specific database schemas  
- **AI-native preparation**: System designed for future AI classification
- **Audit everything**: Complete transaction history and relationships'),

    ('database/setup', 'Database Development', 'Database', 3, '# Database Development Guide

Learn how to work with HERA''s universal database architecture.

## Entity Management

All business objects use the `core_entities` table:

```sql
INSERT INTO core_entities (
  entity_type,
  entity_name,
  entity_code,
  organization_id
) VALUES (
  ''customer'',
  ''Acme Corporation'',
  ''ACME001'',
  $1
);
```

## Dynamic Fields

Add custom fields via `core_dynamic_data`:

```sql
INSERT INTO core_dynamic_data (
  entity_id,
  field_name,
  field_type,
  field_value,
  organization_id
) VALUES (
  $1, -- entity_id
  ''industry'',
  ''text'',
  ''Manufacturing'',
  $2 -- organization_id
);
```

## Relationships

Connect entities via `core_relationships`:

```sql
INSERT INTO core_relationships (
  source_entity_id,
  target_entity_id,
  relationship_type,
  relationship_data,
  organization_id
) VALUES (
  $1, -- customer_id
  $2, -- contact_id
  ''customer_contact'',
  ''{\"is_primary\": true}''::jsonb,
  $3 -- organization_id
);
```'),

    ('api/development', 'API Development', 'Development', 4, '# API Development Guide

Build robust APIs using HERA''s universal patterns.

## Entity Endpoints

### Create Entity
```typescript
POST /api/v1/entities
{
  "entity_type": "product",
  "entity_name": "Widget Pro",
  "entity_code": "WIDGET001",
  "metadata": {
    "category": "electronics",
    "status": "active"
  }
}
```

### Search Entities
```typescript
POST /api/v1/entities/search
{
  "entity_type": "customer",
  "filters": {
    "metadata.status": "active"
  },
  "include_dynamic_data": true,
  "limit": 20
}
```

## Universal Search

```typescript
POST /api/v1/universal/search
{
  "query": "widget",
  "entity_types": ["product", "customer"],
  "include_dynamic_data": true
}
```

## Authentication

All endpoints require JWT authentication with organization_id claims:

```typescript
const token = jwt.sign({
  user_id: "user_uuid",
  organization_id: "org_uuid",
  role: "user"
}, JWT_SECRET);
```'),

    ('testing/guide', 'Testing Guide', 'Testing', 5, '# Testing Guide

Comprehensive testing strategies for HERA applications.

## Unit Testing

Test individual functions and components:

```typescript
// entities.test.ts
import { createEntity } from "@/lib/entities"

describe("Entity Creation", () => {
  it("should create a new entity", async () => {
    const entity = await createEntity({
      entity_type: "product",
      entity_name: "Test Product",
      organization_id: "test-org"
    })
    
    expect(entity).toBeDefined()
    expect(entity.entity_type).toBe("product")
  })
})
```

## Integration Testing

Test API endpoints:

```typescript
// api.test.ts
import { POST } from "@/app/api/v1/entities/route"

describe("/api/v1/entities", () => {
  it("should create entity via API", async () => {
    const request = new Request("http://localhost/api/v1/entities", {
      method: "POST",
      body: JSON.stringify({
        entity_type: "customer",
        entity_name: "Test Customer"
      })
    })
    
    const response = await POST(request)
    expect(response.status).toBe(201)
  })
})
```

## E2E Testing

Use Playwright for end-to-end testing:

```typescript
// e2e/entities.spec.ts
import { test, expect } from "@playwright/test"

test("should create and view entity", async ({ page }) => {
  await page.goto("/entities/new")
  await page.fill("[data-testid=entity-name]", "Test Entity")
  await page.click("[data-testid=save-entity]")
  
  await expect(page.locator(".success-message")).toBeVisible()
})')
  ) AS t(slug, title, section, order_num, content)
)
INSERT INTO core_entities (
  id,
  entity_type,
  entity_name,
  entity_code,
  organization_id,
  metadata,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  'doc_page',
  t.title,
  t.slug,
  dev_org.org_id,
  jsonb_build_object(
    'doc_type', 'dev',
    'section', t.section,
    'order', t.order_num,
    'status', 'published'
  ),
  NOW(),
  NOW()
FROM sample_pages t, dev_org;

-- Add content to dynamic data for dev pages
INSERT INTO core_dynamic_data (
  id,
  entity_id,
  field_name,
  field_type,
  field_value,
  organization_id,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  e.id,
  'content',
  'text',
  CASE e.entity_code
    WHEN 'getting-started' THEN '# Getting Started

Welcome to HERA development! This guide will help you set up your development environment and understand the core concepts.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/hera-erp.git
cd hera-erp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
```

## Next Steps

- [Architecture Overview](/docs/dev/architecture/overview)
- [Database Setup](/docs/dev/database/setup)
- [API Development](/docs/dev/api/development)'
    WHEN 'architecture/overview' THEN '# HERA Architecture Overview

HERA is built on a revolutionary universal 6-table database architecture that can handle any business complexity without requiring schema changes.

## Universal 6-Table Schema

### 1. core_organizations
Multi-tenant isolation with organization_id filtering throughout the application.

### 2. core_entities  
All business objects (products, customers, employees, etc.) are stored as entities with a universal entity_type classification.

### 3. core_dynamic_data
Unlimited custom fields for any entity through flexible key-value relationships.

### 4. core_relationships
Entity connections and workflow relationships enable complex business logic.

### 5. universal_transactions
All business transactions (sales, purchases, payments, transfers) follow a universal pattern.

### 6. universal_transaction_lines
Transaction line items and details provide complete audit trails.

## Design Principles

- **Multi-tenant by design**: Sacred organization_id filtering
- **Universal patterns**: Avoid business-specific database schemas  
- **AI-native preparation**: System designed for future AI classification
- **Audit everything**: Complete transaction history and relationships'
    ELSE e.entity_name || ' content placeholder'
  END,
  (SELECT org_id FROM (SELECT id as org_id FROM core_organizations WHERE organization_name = 'HERA Developer Documentation') dev_org),
  NOW(),
  NOW()
FROM core_entities e
WHERE e.entity_type = 'doc_page' 
AND e.metadata->>'doc_type' = 'dev';

-- Sample User Documentation Pages  
WITH user_org AS (
  SELECT id as org_id FROM core_organizations 
  WHERE organization_name = 'HERA User Documentation'
)
INSERT INTO core_entities (
  id,
  entity_type,
  entity_name,
  entity_code,
  organization_id,
  metadata,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  'doc_page',
  t.title,
  t.slug,
  user_org.org_id,
  jsonb_build_object(
    'doc_type', 'user',
    'section', t.section,
    'order', t.order_num,
    'status', 'published'
  ),
  NOW(),
  NOW()
FROM (VALUES
  ('getting-started', 'Getting Started', 'Basics', 1),
  ('dashboard/overview', 'Dashboard Overview', 'Interface', 2),  
  ('features/core', 'Core Features', 'Features', 3),
  ('account/management', 'Account Management', 'Settings', 4),
  ('troubleshooting', 'Troubleshooting', 'Help', 5),
  ('faq', 'FAQ', 'Help', 6)
) AS t(slug, title, section, order_num), user_org;

-- Add navigation relationships for developer docs
WITH dev_pages AS (
  SELECT id, entity_code, metadata->>'section' as section
  FROM core_entities 
  WHERE entity_type = 'doc_page' 
  AND metadata->>'doc_type' = 'dev'
),
setup_section AS (
  SELECT id FROM dev_pages WHERE section = 'Setup' LIMIT 1
),
arch_section AS (
  SELECT id FROM dev_pages WHERE section = 'Architecture' LIMIT 1  
)
INSERT INTO core_relationships (
  id,
  source_entity_id,
  target_entity_id,
  relationship_type,
  relationship_data,
  organization_id,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  setup_section.id,
  arch_section.id,
  'navigation_next',
  '{"nav_order": 1, "display_in_sidebar": true}'::jsonb,
  (SELECT id FROM core_organizations WHERE organization_name = 'HERA Developer Documentation'),
  NOW(),
  NOW()
FROM setup_section, arch_section;