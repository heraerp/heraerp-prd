# HERA Dynamic Page Loading Developer Guide

**Smart Code**: `HERA.PLATFORM.DOCS.DYNAMIC_LOADING.DEVELOPER_GUIDE.v1`
**Version**: 2.4
**Last Updated**: 2025-11-13

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Principles](#architecture-principles)
3. [The Relationship Chain](#the-relationship-chain)
4. [Dashboard Domain Loading](#dashboard-domain-loading)
5. [Domain to Section Loading](#domain-to-section-loading)
6. [Section to Workspace Loading](#section-to-workspace-loading)
7. [Data Flow Diagrams](#data-flow-diagrams)
8. [API Implementation](#api-implementation)
9. [Component System](#component-system)
10. [Practical Examples](#practical-examples)
11. [Troubleshooting](#troubleshooting)

---

## Overview

HERA's dynamic page loading system is built on a **relationship-driven architecture** where the entire user interface is generated from database entities connected through the `core_relationships` table. This eliminates hardcoded routes and enables zero-code workspace creation.

### Key Concepts

- **Database-Driven**: All pages, navigation, and content are defined in the database
- **Relationship-Based**: Entity hierarchy built using `APP_HAS_DOMAIN` relationships
- **Sacred Six Compliant**: Uses `core_entities`, `core_relationships`, and `core_dynamic_data`
- **Universal Components**: Same components work across all business domains
- **Zero-Code Configuration**: New workspaces created without deployment

---

## Architecture Principles

### The 3-Level Navigation Hierarchy

```
Level 1: Dashboard (/retail/dashboard)
    ↓ (discovers via APP_HAS_DOMAIN relationship)
Level 2: Domain Pages (/retail/domains/[domain])
    ↓ (discovers via HAS_SECTION relationship)
Level 3: Section Workspaces (/retail/domains/[domain]/sections/[section])
    ↓ (discovers via HAS_WORKSPACE relationship)
CRUD Operations: Dynamic routes based on workspace cards
```

### Entity Type Hierarchy

```yaml
Platform Organization (00000000-0000-0000-0000-000000000000):

  APP (Core Application Entity):
    - entity_code: "hera_retail"
    - entity_name: "HERA Retail Suite"
    - entity_type: "APP"

    APP_DOMAIN (Linked via APP_HAS_DOMAIN):
      - entity_code: "crm"
      - entity_name: "Customer Relationship Management"
      - entity_type: "APP_DOMAIN"
      - relationship_type: "APP_HAS_DOMAIN"

      APP_SECTION (Linked via HAS_SECTION):
        - entity_code: "leads"
        - entity_name: "Lead Management"
        - entity_type: "APP_SECTION"
        - relationship_type: "HAS_SECTION"

        APP_WORKSPACE (Linked via HAS_WORKSPACE):
          - entity_code: "main"
          - entity_name: "Lead Management Workspace"
          - entity_type: "APP_WORKSPACE"
          - relationship_type: "HAS_WORKSPACE"
```

---

## The Relationship Chain

### Understanding APP_HAS_DOMAIN

The `APP_HAS_DOMAIN` relationship is the **foundation** of dynamic page loading. It connects applications to their business domains.

#### Database Structure

```sql
-- Core relationship that enables domain discovery
SELECT
    app.entity_code as app_code,
    app.entity_name as app_name,
    domain.entity_code as domain_code,
    domain.entity_name as domain_name,
    rel.relationship_type
FROM core_relationships rel
JOIN core_entities app ON rel.source_entity_id = app.id
JOIN core_entities domain ON rel.target_entity_id = domain.id
WHERE
    app.entity_type = 'APP'
    AND domain.entity_type = 'APP_DOMAIN'
    AND rel.relationship_type = 'APP_HAS_DOMAIN'
    AND app.organization_id = '00000000-0000-0000-0000-000000000000';
```

#### Relationship Types

| Relationship Type | Source Entity | Target Entity | Purpose |
|------------------|---------------|---------------|---------|
| `APP_HAS_DOMAIN` | APP | APP_DOMAIN | Links app to domains |
| `HAS_SECTION` | APP_DOMAIN | APP_SECTION | Links domain to sections |
| `HAS_WORKSPACE` | APP_SECTION | APP_WORKSPACE | Links section to workspaces |

---

## Dashboard Domain Loading

### Step 1: Dashboard Initialization

**Route**: `/retail/dashboard`

**Component**: `RetailDashboardPage`

```typescript
// src/app/retail/dashboard/page.tsx
export default function RetailDashboardPage() {
  const { organization, user } = useHERAAuth()

  // Load all domains available to this user
  const domains = useDomainLoader({
    app_code: 'hera_retail',
    organization_id: organization.id,
    user_id: user.id
  })

  return (
    <DashboardLayout>
      <DomainGrid domains={domains} />
    </DashboardLayout>
  )
}
```

### Step 2: Domain Discovery Query

The system queries for domains using the `APP_HAS_DOMAIN` relationship:

```typescript
// src/lib/loaders/domainLoader.ts
export async function loadDomainsForApp(appCode: string, orgId: string) {
  // 1. Find the APP entity
  const { data: appEntity } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name')
    .eq('entity_type', 'APP')
    .eq('entity_code', appCode)
    .eq('organization_id', PLATFORM_ORG_ID)
    .single()

  // 2. Find all APP_DOMAIN entities via APP_HAS_DOMAIN relationship
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select(`
      target_entity_id,
      relationship_type,
      core_entities!target_entity_id (
        id,
        entity_code,
        entity_name,
        smart_code,
        core_dynamic_data (
          field_name,
          field_value_text,
          field_value_json
        )
      )
    `)
    .eq('source_entity_id', appEntity.id)
    .eq('relationship_type', 'APP_HAS_DOMAIN')

  // 3. Transform to domain objects with configuration
  return relationships.map(rel => ({
    domain_code: rel.core_entities.entity_code,
    domain_name: rel.core_entities.entity_name,
    smart_code: rel.core_entities.smart_code,
    icon: extractDynamicField(rel.core_entities.core_dynamic_data, 'icon'),
    color: extractDynamicField(rel.core_entities.core_dynamic_data, 'color'),
    description: extractDynamicField(rel.core_entities.core_dynamic_data, 'description'),
    order_priority: extractDynamicField(rel.core_entities.core_dynamic_data, 'order_priority')
  }))
}
```

### Step 3: Dashboard Rendering

```typescript
// The dashboard now has all available domains
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {domains.map(domain => (
    <DomainCard
      key={domain.domain_code}
      icon={domain.icon}          // From core_dynamic_data
      color={domain.color}         // From core_dynamic_data
      title={domain.domain_name}   // From core_entities
      description={domain.description}  // From core_dynamic_data
      href={`/retail/domains/${domain.domain_code}`}
    />
  ))}
</div>
```

**Example Output**:
```json
[
  {
    "domain_code": "crm",
    "domain_name": "Customer Relationship Management",
    "smart_code": "HERA.PLATFORM.DOMAIN.CRM.v1",
    "icon": "Users",
    "color": "#3b82f6",
    "description": "Customer relationship management and sales operations",
    "order_priority": 1
  },
  {
    "domain_code": "finance",
    "domain_name": "Finance & Accounting",
    "smart_code": "HERA.PLATFORM.DOMAIN.FINANCE.v1",
    "icon": "DollarSign",
    "color": "#10b981",
    "description": "Financial management and accounting operations",
    "order_priority": 2
  }
]
```

---

## Domain to Section Loading

### Step 1: Domain Page Route

**Route**: `/retail/domains/[domain]/page.tsx`

**Dynamic Route Handler**:

```typescript
// src/app/retail/domains/[domain]/page.tsx
export default async function DomainPage({
  params
}: {
  params: { domain: string }
}) {
  const { domain } = params

  // Load domain entity and its sections
  const domainData = await loadDomainWithSections(domain)

  return (
    <DomainLayout domainData={domainData}>
      <DomainOverview />
      <SectionGrid sections={domainData.sections} />
    </DomainLayout>
  )
}
```

### Step 2: Section Discovery via HAS_SECTION

```typescript
// src/lib/loaders/sectionLoader.ts
export async function loadDomainWithSections(domainCode: string) {
  // 1. Find APP_DOMAIN entity by code
  const { data: domainEntity } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'APP_DOMAIN')
    .eq('entity_code', domainCode)
    .eq('organization_id', PLATFORM_ORG_ID)
    .single()

  if (!domainEntity) {
    throw new Error(`Domain not found: ${domainCode}`)
  }

  // 2. Find all APP_SECTION entities via HAS_SECTION relationship
  const { data: sectionRelationships } = await supabase
    .from('core_relationships')
    .select(`
      target_entity_id,
      relationship_type,
      core_entities!target_entity_id (
        id,
        entity_code,
        entity_name,
        smart_code,
        core_dynamic_data (
          field_name,
          field_value_text,
          field_value_json
        )
      )
    `)
    .eq('source_entity_id', domainEntity.id)
    .eq('relationship_type', 'HAS_SECTION')
    .order('created_at', { ascending: true })

  // 3. Aggregate domain configuration
  const domainConfig = aggregateDynamicData(domainEntity.id)

  // 4. Build complete domain object with sections
  return {
    domain: {
      code: domainEntity.entity_code,
      name: domainEntity.entity_name,
      smart_code: domainEntity.smart_code,
      ...domainConfig
    },
    sections: sectionRelationships.map(rel => ({
      section_code: rel.core_entities.entity_code,
      section_name: rel.core_entities.entity_name,
      smart_code: rel.core_entities.smart_code,
      ...aggregateDynamicData(rel.core_entities.id)
    }))
  }
}
```

### Step 3: Section Grid Rendering

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {domainData.sections.map(section => (
    <SectionCard
      key={section.section_code}
      icon={section.icon}
      title={section.section_name}
      description={section.description}
      workspace_type={section.workspace_type}
      href={`/retail/domains/${domain}/sections/${section.section_code}`}
    />
  ))}
</div>
```

---

## Section to Workspace Loading

### Step 1: Section Workspace Route

**Route**: `/retail/domains/[domain]/sections/[section]/page.tsx`

```typescript
// src/app/retail/domains/[domain]/sections/[section]/page.tsx
export default async function SectionPage({
  params
}: {
  params: { domain: string; section: string }
}) {
  const { domain, section } = params

  // Load complete workspace configuration
  const workspaceData = await loadWorkspaceData(domain, section, 'main')

  return (
    <UniversalSAPWorkspace
      domain={domain}
      section={section}
      workspace="main"
      initialData={workspaceData}
    />
  )
}
```

### Step 2: Workspace Discovery via HAS_WORKSPACE

```typescript
// src/lib/loaders/workspaceLoader.ts
export async function loadWorkspaceData(
  domainCode: string,
  sectionCode: string,
  workspaceCode: string = 'main'
) {
  // 1. Find APP_DOMAIN entity
  const { data: domainEntity } = await supabase
    .from('core_entities')
    .select('id')
    .eq('entity_type', 'APP_DOMAIN')
    .eq('entity_code', domainCode)
    .eq('organization_id', PLATFORM_ORG_ID)
    .single()

  // 2. Find APP_SECTION entity via HAS_SECTION relationship
  const { data: sectionRel } = await supabase
    .from('core_relationships')
    .select('target_entity_id')
    .eq('source_entity_id', domainEntity.id)
    .eq('relationship_type', 'HAS_SECTION')
    .limit(1)
    .single()

  const { data: sectionEntity } = await supabase
    .from('core_entities')
    .select('id, entity_code')
    .eq('id', sectionRel.target_entity_id)
    .eq('entity_code', sectionCode)
    .single()

  // 3. Find APP_WORKSPACE entity via HAS_WORKSPACE relationship
  const { data: workspaceRel } = await supabase
    .from('core_relationships')
    .select(`
      target_entity_id,
      core_entities!target_entity_id (
        id,
        entity_code,
        entity_name,
        smart_code,
        core_dynamic_data (
          field_name,
          field_value_text,
          field_value_json
        )
      )
    `)
    .eq('source_entity_id', sectionEntity.id)
    .eq('relationship_type', 'HAS_WORKSPACE')
    .single()

  const workspaceEntity = workspaceRel.core_entities

  // 4. Build workspace configuration
  const workspaceConfig = buildWorkspaceConfig(workspaceEntity)

  return {
    workspace: {
      code: workspaceEntity.entity_code,
      name: workspaceEntity.entity_name,
      smart_code: workspaceEntity.smart_code,
      layout: workspaceConfig.layout || 'universal_sap',
      theme_color: workspaceConfig.theme_color || '#10b981'
    },
    layout_config: {
      default_nav_code: workspaceConfig.default_nav || 'overview',
      nav_items: workspaceConfig.nav_items || []
    },
    sections: buildWorkspaceSections(workspaceConfig)
  }
}

function buildWorkspaceConfig(workspaceEntity: any) {
  const dynamicData = workspaceEntity.core_dynamic_data || []

  const config: any = {}

  dynamicData.forEach((field: any) => {
    if (field.field_value_json) {
      config[field.field_name] = JSON.parse(field.field_value_json)
    } else if (field.field_value_text) {
      config[field.field_name] = field.field_value_text
    }
  })

  return config
}
```

### Step 3: Workspace Card Configuration

The workspace configuration includes **workspace cards** that define the actual functionality:

```typescript
function buildWorkspaceSections(workspaceConfig: any) {
  const navItems = workspaceConfig.nav_items || []
  const sections = []

  // For each navigation item, find matching cards
  for (const navItem of navItems) {
    const cardField = `cards_${navItem.code}`
    const cards = workspaceConfig[cardField] || []

    sections.push({
      nav_code: navItem.code,
      nav_label: navItem.label,
      nav_icon: navItem.icon,
      cards: cards.map(card => ({
        view_slug: card.view_slug,
        card_title: card.card_title,
        card_description: card.card_description,
        card_type: card.card_type,  // entities, transactions, workflows, relationships, analytics
        icon: card.icon,
        color: card.color,
        priority: card.priority,
        metadata: card.metadata || {}
      }))
    })
  }

  return sections
}
```

---

## Data Flow Diagrams

### Complete Loading Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User Navigates to Dashboard (/retail/dashboard)             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Query APP entity (entity_type = 'APP', entity_code = 'retail')│
│    Result: app_entity_id = uuid-1234                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Query core_relationships                                     │
│    WHERE source_entity_id = uuid-1234                           │
│    AND relationship_type = 'APP_HAS_DOMAIN'                     │
│    Returns: [crm_domain, finance_domain, inventory_domain]     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Render Domain Grid on Dashboard                             │
│    User clicks "CRM" domain card                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Navigate to /retail/domains/crm                             │
│    Find APP_DOMAIN entity (entity_code = 'crm')                │
│    Result: crm_domain_id = uuid-5678                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Query core_relationships                                     │
│    WHERE source_entity_id = uuid-5678                           │
│    AND relationship_type = 'HAS_SECTION'                        │
│    Returns: [leads_section, accounts_section, contacts_section]│
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Render Section Grid on Domain Page                          │
│    User clicks "Leads" section card                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. Navigate to /retail/domains/crm/sections/leads              │
│    Find APP_SECTION entity (entity_code = 'leads')             │
│    Result: leads_section_id = uuid-9012                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. Query core_relationships                                     │
│    WHERE source_entity_id = uuid-9012                           │
│    AND relationship_type = 'HAS_WORKSPACE'                      │
│    Returns: main_workspace                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 10. Load Workspace Configuration from core_dynamic_data        │
│     - nav_items: [{code: 'overview'}, {code: 'leads'}]         │
│     - cards_overview: [entities-leads, workflows-qual, ...]    │
│     - cards_leads: [entities-leads, transactions-activities]   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 11. Render UniversalSAPWorkspace                               │
│     - Left sidebar: Navigation items                            │
│     - Main content: Workspace cards                             │
│     User clicks "Lead Database" card (type: entities)          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ 12. Dynamic Route Generation                                    │
│     card.card_type = 'entities'                                 │
│     card.metadata.entity_type = 'LEAD'                          │
│     Generated route: /crm/leads/main/entities/LEAD             │
│     Component: UniversalEntityListShell                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Implementation

### API Route Structure

```
/src/app/api/v2/
  [domain]/
    [section]/
      [workspace]/
        route.ts          ← Main workspace data loader
```

### Complete API Route Implementation

```typescript
// src/app/api/v2/[domain]/[section]/[workspace]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string; section: string; workspace: string } }
) {
  const { domain, section, workspace } = params
  const supabase = createClient()

  try {
    // Step 1: Find APP_DOMAIN entity
    const { data: domainEntity, error: domainError } = await supabase
      .from('core_entities')
      .select('id, entity_code, entity_name, smart_code')
      .eq('entity_type', 'APP_DOMAIN')
      .eq('entity_code', domain)
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .single()

    if (domainError || !domainEntity) {
      return NextResponse.json(
        { error: 'Domain not found', domain },
        { status: 404 }
      )
    }

    // Step 2: Find APP_SECTION entity via HAS_SECTION relationship
    const { data: sectionRel, error: sectionRelError } = await supabase
      .from('core_relationships')
      .select('target_entity_id')
      .eq('source_entity_id', domainEntity.id)
      .eq('relationship_type', 'HAS_SECTION')

    if (sectionRelError || !sectionRel || sectionRel.length === 0) {
      return NextResponse.json(
        { error: 'No sections found for domain', domain },
        { status: 404 }
      )
    }

    // Find the specific section by code
    const sectionIds = sectionRel.map(r => r.target_entity_id)
    const { data: sectionEntity, error: sectionError } = await supabase
      .from('core_entities')
      .select('id, entity_code, entity_name, smart_code')
      .in('id', sectionIds)
      .eq('entity_code', section)
      .single()

    if (sectionError || !sectionEntity) {
      return NextResponse.json(
        { error: 'Section not found', section },
        { status: 404 }
      )
    }

    // Step 3: Find APP_WORKSPACE entity via HAS_WORKSPACE relationship
    const { data: workspaceRel, error: workspaceRelError } = await supabase
      .from('core_relationships')
      .select('target_entity_id')
      .eq('source_entity_id', sectionEntity.id)
      .eq('relationship_type', 'HAS_WORKSPACE')

    if (workspaceRelError || !workspaceRel || workspaceRel.length === 0) {
      return NextResponse.json(
        { error: 'No workspaces found for section', section },
        { status: 404 }
      )
    }

    // Find the specific workspace by code
    const workspaceIds = workspaceRel.map(r => r.target_entity_id)
    const { data: workspaceEntity, error: workspaceError } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_code,
        entity_name,
        smart_code,
        core_dynamic_data (
          field_name,
          field_value_text,
          field_value_json
        )
      `)
      .in('id', workspaceIds)
      .eq('entity_code', workspace)
      .single()

    if (workspaceError || !workspaceEntity) {
      return NextResponse.json(
        { error: 'Workspace not found', workspace },
        { status: 404 }
      )
    }

    // Step 4: Build workspace configuration from dynamic data
    const workspaceConfig = buildWorkspaceConfiguration(
      workspaceEntity.core_dynamic_data
    )

    // Step 5: Return complete workspace data
    return NextResponse.json({
      success: true,
      workspace: {
        code: workspaceEntity.entity_code,
        name: workspaceEntity.entity_name,
        smart_code: workspaceEntity.smart_code,
        layout: workspaceConfig.layout || 'universal_sap',
        theme_color: workspaceConfig.theme_color || '#10b981',
        subtitle: workspaceConfig.subtitle
      },
      layout_config: {
        default_nav_code: workspaceConfig.default_nav || 'overview',
        nav_items: workspaceConfig.nav_items || []
      },
      sections: buildSections(workspaceConfig)
    })

  } catch (error) {
    console.error('Workspace API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

function buildWorkspaceConfiguration(dynamicData: any[]) {
  const config: Record<string, any> = {}

  for (const field of dynamicData) {
    if (field.field_value_json) {
      try {
        config[field.field_name] = JSON.parse(field.field_value_json)
      } catch (e) {
        config[field.field_name] = field.field_value_json
      }
    } else if (field.field_value_text) {
      config[field.field_name] = field.field_value_text
    }
  }

  return config
}

function buildSections(config: Record<string, any>) {
  const navItems = config.nav_items || []
  const sections = []

  for (const navItem of navItems) {
    const cardFieldName = `cards_${navItem.code}`
    const cards = config[cardFieldName] || []

    sections.push({
      nav_code: navItem.code,
      nav_label: navItem.label,
      nav_icon: navItem.icon,
      cards: cards
    })
  }

  return sections
}
```

---

## Component System

### UniversalSAPWorkspace Component

This is the main component that renders the dynamic workspace:

```typescript
// src/components/workspace/UniversalSAPWorkspace.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface UniversalSAPWorkspaceProps {
  domain: string
  section: string
  workspace: string
  initialData?: WorkspaceData
}

export const UniversalSAPWorkspace: React.FC<UniversalSAPWorkspaceProps> = ({
  domain,
  section,
  workspace,
  initialData
}) => {
  const router = useRouter()
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(initialData || null)
  const [activeNavCode, setActiveNavCode] = useState<string>('overview')
  const [loading, setLoading] = useState(!initialData)

  useEffect(() => {
    if (!initialData) {
      loadWorkspaceData()
    }
  }, [domain, section, workspace])

  const loadWorkspaceData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v2/${domain}/${section}/${workspace}`)
      const data = await response.json()

      if (data.success) {
        setWorkspaceData(data)
        setActiveNavCode(data.layout_config.default_nav_code)
      }
    } catch (error) {
      console.error('Failed to load workspace:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (card: WorkspaceCard) => {
    // Generate dynamic route based on card type
    const route = generateCardRoute(domain, section, workspace, card)
    router.push(route)
  }

  if (loading) {
    return <WorkspaceSkeleton />
  }

  if (!workspaceData) {
    return <WorkspaceError message="Failed to load workspace" />
  }

  const currentSection = workspaceData.sections.find(
    s => s.nav_code === activeNavCode
  )

  return (
    <div className="h-screen flex flex-col">
      {/* SAP Fiori Header */}
      <WorkspaceHeader
        title={workspaceData.workspace.name}
        subtitle={workspaceData.workspace.subtitle}
        breadcrumbs={[
          { label: 'Dashboard', href: '/retail/dashboard' },
          { label: domain, href: `/retail/domains/${domain}` },
          { label: section, href: `/retail/domains/${domain}/sections/${section}` }
        ]}
      />

      <div className="flex h-[calc(100vh-80px)]">
        {/* Dynamic Navigation Sidebar */}
        <WorkspaceNavigation
          items={workspaceData.layout_config.nav_items}
          activeCode={activeNavCode}
          onNavigate={setActiveNavCode}
        />

        {/* Dynamic Content Area with Cards */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentSection?.cards.map(card => (
              <WorkspaceCard
                key={card.view_slug}
                card={card}
                onClick={() => handleCardClick(card)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Dynamic route generation based on card type
function generateCardRoute(
  domain: string,
  section: string,
  workspace: string,
  card: WorkspaceCard
): string {
  const base = `/${domain}/${section}/${workspace}`

  switch (card.card_type) {
    case 'entities':
      const entityType = card.metadata?.entity_type || 'items'
      return `${base}/entities/${entityType}`

    case 'transactions':
      const transactionType = card.metadata?.transaction_type || 'general'
      return `${base}/transactions/${transactionType}`

    case 'workflows':
      return `${base}/workflows/${card.view_slug}`

    case 'relationships':
      return `${base}/relationships/${card.view_slug}`

    case 'analytics':
      return `${base}/analytics/${card.view_slug}`

    default:
      return `${base}/${card.view_slug}`
  }
}
```

---

## Practical Examples

### Example 1: Creating a Complete CRM Domain

```sql
-- Step 1: Create APP_DOMAIN entity
INSERT INTO core_entities (
  id,
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  organization_id,
  created_by,
  updated_by
) VALUES (
  gen_random_uuid(),
  'APP_DOMAIN',
  'crm',
  'Customer Relationship Management',
  'HERA.PLATFORM.DOMAIN.CRM.v1',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
) RETURNING id;
-- Assume returned id: 'aaa-bbb-ccc'

-- Step 2: Add domain configuration
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_text) VALUES
('aaa-bbb-ccc', 'icon', 'text', 'Users'),
('aaa-bbb-ccc', 'color', 'text', '#3b82f6'),
('aaa-bbb-ccc', 'description', 'text', 'Customer relationship management and sales operations');

-- Step 3: Link domain to app via APP_HAS_DOMAIN relationship
INSERT INTO core_relationships (
  source_entity_id,  -- App entity ID (find via: SELECT id FROM core_entities WHERE entity_type = 'APP' AND entity_code = 'hera_retail')
  target_entity_id,  -- Domain entity ID (aaa-bbb-ccc)
  relationship_type,
  organization_id,
  created_by,
  updated_by
) VALUES (
  (SELECT id FROM core_entities WHERE entity_type = 'APP' AND entity_code = 'hera_retail' LIMIT 1),
  'aaa-bbb-ccc',
  'APP_HAS_DOMAIN',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);

-- Step 4: Create APP_SECTION entity
INSERT INTO core_entities (
  id,
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  organization_id,
  created_by,
  updated_by
) VALUES (
  gen_random_uuid(),
  'APP_SECTION',
  'leads',
  'Lead Management',
  'HERA.CRM.SECTION.LEADS.v1',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
) RETURNING id;
-- Assume returned id: 'ddd-eee-fff'

-- Step 5: Link section to domain via HAS_SECTION relationship
INSERT INTO core_relationships (
  source_entity_id,  -- Domain entity ID (aaa-bbb-ccc)
  target_entity_id,  -- Section entity ID (ddd-eee-fff)
  relationship_type,
  organization_id,
  created_by,
  updated_by
) VALUES (
  'aaa-bbb-ccc',
  'ddd-eee-fff',
  'HAS_SECTION',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);

-- Step 6: Create APP_WORKSPACE entity
INSERT INTO core_entities (
  id,
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  organization_id,
  created_by,
  updated_by
) VALUES (
  gen_random_uuid(),
  'APP_WORKSPACE',
  'main',
  'Lead Management Workspace',
  'HERA.CRM.LEADS.WORKSPACE.MAIN.v1',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
) RETURNING id;
-- Assume returned id: 'ggg-hhh-iii'

-- Step 7: Link workspace to section via HAS_WORKSPACE relationship
INSERT INTO core_relationships (
  source_entity_id,  -- Section entity ID (ddd-eee-fff)
  target_entity_id,  -- Workspace entity ID (ggg-hhh-iii)
  relationship_type,
  organization_id,
  created_by,
  updated_by
) VALUES (
  'ddd-eee-fff',
  'ggg-hhh-iii',
  'HAS_WORKSPACE',
  '00000000-0000-0000-0000-000000000000',
  'system',
  'system'
);

-- Step 8: Add workspace configuration
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_text) VALUES
('ggg-hhh-iii', 'layout', 'text', 'universal_sap'),
('ggg-hhh-iii', 'default_nav', 'text', 'overview'),
('ggg-hhh-iii', 'theme_color', 'text', '#10b981');

-- Step 9: Add navigation items as JSON
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
('ggg-hhh-iii', 'nav_items', 'json', '[
  {"code": "overview", "label": "Overview", "icon": "Home"},
  {"code": "leads", "label": "Lead Management", "icon": "Target"},
  {"code": "analytics", "label": "Analytics", "icon": "BarChart3"}
]');

-- Step 10: Add workspace cards for each navigation section
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json) VALUES
('ggg-hhh-iii', 'cards_overview', 'json', '[
  {
    "view_slug": "entities-leads",
    "card_title": "Lead Database",
    "card_description": "Manage all sales leads",
    "card_type": "entities",
    "icon": "Users",
    "color": "#3b82f6",
    "priority": 1,
    "metadata": {
      "entity_type": "LEAD",
      "smart_code": "HERA.CRM.LEAD.ENTITY.v1"
    }
  }
]');
```

**Result**: The following routes are now automatically available:
- `/retail/dashboard` - Shows CRM domain card
- `/retail/domains/crm` - Shows Leads section card
- `/retail/domains/crm/sections/leads` - Shows Lead Management workspace
- `/crm/leads/main/entities/LEAD` - Entity management for leads

---

## Troubleshooting

### Issue: Domain not appearing on dashboard

**Diagnosis Query**:
```sql
-- Check if APP_HAS_DOMAIN relationship exists
SELECT
  app.entity_code as app,
  domain.entity_code as domain,
  rel.relationship_type
FROM core_relationships rel
JOIN core_entities app ON rel.source_entity_id = app.id
JOIN core_entities domain ON rel.target_entity_id = domain.id
WHERE
  app.entity_type = 'APP'
  AND domain.entity_type = 'APP_DOMAIN'
  AND app.organization_id = '00000000-0000-0000-0000-000000000000';
```

**Fix**: Ensure APP_HAS_DOMAIN relationship is created.

### Issue: Section not loading on domain page

**Diagnosis Query**:
```sql
-- Check if HAS_SECTION relationship exists
SELECT
  domain.entity_code as domain,
  section.entity_code as section,
  rel.relationship_type
FROM core_relationships rel
JOIN core_entities domain ON rel.source_entity_id = domain.id
JOIN core_entities section ON rel.target_entity_id = section.id
WHERE
  domain.entity_type = 'APP_DOMAIN'
  AND section.entity_type = 'APP_SECTION'
  AND domain.entity_code = 'crm';
```

**Fix**: Ensure HAS_SECTION relationship is created between domain and section.

### Issue: Workspace cards not appearing

**Diagnosis Query**:
```sql
-- Check workspace dynamic data configuration
SELECT
  ce.entity_code,
  cdd.field_name,
  cdd.field_value_json
FROM core_entities ce
LEFT JOIN core_dynamic_data cdd ON ce.id = cdd.entity_id
WHERE
  ce.entity_type = 'APP_WORKSPACE'
  AND ce.entity_code = 'main'
  AND (cdd.field_name LIKE 'cards_%' OR cdd.field_name = 'nav_items');
```

**Fix**: Ensure `nav_items` and corresponding `cards_{nav_code}` fields exist in `core_dynamic_data`.

---

## Summary

HERA's dynamic page loading system is powered by:

1. **APP_HAS_DOMAIN** - Links applications to business domains
2. **HAS_SECTION** - Links domains to functional sections
3. **HAS_WORKSPACE** - Links sections to workspace interfaces
4. **core_dynamic_data** - Stores all configuration as flexible JSON

This relationship-driven architecture enables:
- ✅ Zero-code workspace creation
- ✅ Database-driven navigation
- ✅ Universal components across all domains
- ✅ Sacred Six compliance
- ✅ Organization-specific customization
- ✅ Complete audit trails

**The power of this system**: Create a complete enterprise workspace by simply inserting entities and relationships into the database. No code deployment required.

---

## Related Documentation

- [HERA Universal CRUD Operations Reference](/docs/UNIVERSAL-CRUD-OPERATIONS-REFERENCE.md)
- [Sacred Six Schema Reference](/docs/schema/hera-sacred-six-schema.yaml)
- [HERA Smart Code Guide](/docs/playbooks/_shared/SMART_CODE_GUIDE.md)
- [UniversalSAPWorkspace Component](/src/components/workspace/UniversalSAPWorkspace.tsx)
- [API v2 Documentation](/docs/api/v2/HERA_TRANSACTIONS_RPC_GUIDE.md)

---

**End of Developer Guide**
