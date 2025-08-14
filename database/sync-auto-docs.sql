-- HERA Auto-Documentation System Database Sync
-- This script adds the auto-documentation system documentation to your HERA database

-- First, ensure we have a developer documentation organization
INSERT INTO core_organizations (
  id,
  organization_name,
  organization_type,
  settings,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'HERA Developer Documentation',
  'documentation',
  '{
    "doc_type": "developer",
    "access_level": "internal",
    "theme": "technical",
    "auto_generated": true,
    "system": "auto-documentation"
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (organization_name) DO NOTHING;

-- Get the organization ID for use in subsequent inserts
WITH dev_org AS (
  SELECT id as org_id FROM core_organizations 
  WHERE organization_name = 'HERA Developer Documentation'
)

-- Insert Auto-Documentation System page
, auto_doc_page AS (
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
    'Auto-Documentation System',
    'auto-documentation-system',
    dev_org.org_id,
    '{
      "doc_type": "dev",
      "section": "Systems",
      "status": "published",
      "auto_generated": true,
      "priority": "high",
      "order": 1
    }'::jsonb,
    NOW(),
    NOW()
  FROM dev_org
  RETURNING id, organization_id
)

-- Insert content for Auto-Documentation System
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
  auto_doc_page.id,
  'content',
  'text',
  '# Auto-Documentation System

## Overview

The HERA Auto-Documentation System is a comprehensive solution that automatically generates and maintains documentation for your codebase. It analyzes code changes, generates intelligent documentation, and keeps your developer and user guides current with every project update.

## Key Components

### Documentation Generation Scripts
- **auto-generate-docs.js**: Main documentation generator that analyzes code changes and creates comprehensive documentation
- **code-analyzer.js**: Advanced code analysis engine that extracts patterns, structure, and functionality from source files
- **ai-doc-generator.js**: AI-powered content generation system for creating high-quality documentation
- **sync-docs-to-hera.js**: HERA database integration for storing and managing documentation
- **doc-maintenance.js**: Automated maintenance and health monitoring system

### Git Integration
- **setup-git-hooks.sh**: Automated Git hooks setup for seamless workflow integration
- **Pre-commit hooks**: Detect changes and generate documentation before commits
- **Post-commit hooks**: Sync generated documentation to HERA database
- **Post-merge hooks**: Rebuild documentation after merges

## Installation & Setup

### 1. Set Up Git Hooks
```bash
npm run docs:setup-hooks
```

### 2. Initialize Documentation
```bash
npm run docs:generate
npm run docs:sync
npm run docs:health
```

## Available Commands

- `npm run docs:generate`: Generate documentation from code changes
- `npm run docs:sync`: Sync generated docs to HERA database
- `npm run docs:health`: Check system health
- `npm run docs:validate`: Validate all documentation links
- `npm run docs:cleanup`: Remove old and duplicate files
- `npm run docs:full-maintenance`: Complete maintenance suite

## Benefits

- **Zero Documentation Debt**: Documentation automatically stays current
- **Consistent Quality**: AI ensures comprehensive, well-structured content
- **Time Savings**: Eliminates manual documentation writing
- **Better Code Reviews**: Documentation context included in commits
- **Integrated Workflow**: Seamless Git integration with no extra steps',
  auto_doc_page.organization_id,
  NOW(),
  NOW()
FROM auto_doc_page;

-- Insert description for Auto-Documentation System
WITH auto_doc_page AS (
  SELECT id, organization_id FROM core_entities 
  WHERE entity_code = 'auto-documentation-system' 
  AND entity_type = 'doc_page'
)
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
  auto_doc_page.id,
  'description',
  'text',
  'Comprehensive solution that automatically generates and maintains documentation for your codebase',
  auto_doc_page.organization_id,
  NOW(),
  NOW()
FROM auto_doc_page;

-- Insert Documentation Search API page
WITH dev_org AS (
  SELECT id as org_id FROM core_organizations 
  WHERE organization_name = 'HERA Developer Documentation'
), search_api_page AS (
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
    'Documentation Search API',
    'api-docs-search',
    dev_org.org_id,
    '{
      "doc_type": "dev",
      "section": "API Reference",
      "status": "published",
      "auto_generated": true,
      "order": 2
    }'::jsonb,
    NOW(),
    NOW()
  FROM dev_org
  RETURNING id, organization_id
)
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
  search_api_page.id,
  'content',
  'text',
  '# Documentation Search API

## Endpoints
- `GET /docs/search` - Search documentation with query parameters
- `POST /api/v1/universal/search` - Advanced search with filters

## Description
Provides comprehensive search functionality across all HERA documentation content. Integrates with HERA''s universal search architecture for fast, relevant results.

## Search Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query string |
| type | string | No | Filter by doc type (''dev'' or ''user'') |
| section | string | No | Filter by documentation section |

## Response Format
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "Page Title",
      "slug": "page-slug",
      "docType": "dev",
      "excerpt": "Search result excerpt...",
      "section": "API Reference"
    }
  ],
  "total": 15,
  "hasMore": true
}
```

## Usage Examples
```typescript
// Basic search
const results = await searchDocs(''API development'');

// Filtered search
const devResults = await searchDocs(''authentication'', ''dev'');
```',
  search_api_page.organization_id,
  NOW(),
  NOW()
FROM search_api_page;

-- Insert DocLayout Component page
WITH dev_org AS (
  SELECT id as org_id FROM core_organizations 
  WHERE organization_name = 'HERA Developer Documentation'
), layout_component_page AS (
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
    'DocLayout Component',
    'component-doc-layout',
    dev_org.org_id,
    '{
      "doc_type": "dev",
      "section": "Components",
      "status": "published",
      "auto_generated": true,
      "order": 3
    }'::jsonb,
    NOW(),
    NOW()
  FROM dev_org
  RETURNING id, organization_id
)
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
  layout_component_page.id,
  'content',
  'text',
  '# DocLayout Component

## Overview
Main layout container for the HERA documentation system. Provides responsive layout with header navigation, sidebar, and main content area.

## Usage
```typescript
import DocLayout from ''@/components/docs/DocLayout''

export default function DocumentationPage() {
  return (
    <DocLayout 
      navigation={navigation}
      docType="dev"
      currentPath="getting-started"
    >
      <article>
        <h1>Your Documentation Content</h1>
      </article>
    </DocLayout>
  )
}
```

## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| children | ReactNode | Yes | Main content to display |
| navigation | NavigationItem[] | Yes | Navigation tree structure |
| docType | ''dev'' \| ''user'' | Yes | Type of documentation |
| currentPath | string | No | Current page path for highlighting |

## Features
- **Responsive Design**: Mobile-first with collapsible sidebar
- **Header Components**: Logo, search, guide selector
- **Sidebar Navigation**: Hierarchical tree with active states
- **Content Area**: Main content with table of contents
- **Accessibility**: WCAG 2.1 AA compliant with keyboard navigation

## Styling
Uses HERA design system with brand colors, typography, and spacing scales.',
  layout_component_page.organization_id,
  NOW(),
  NOW()
FROM layout_component_page;

-- Insert Git Hooks Automation Feature page
WITH dev_org AS (
  SELECT id as org_id FROM core_organizations 
  WHERE organization_name = 'HERA Developer Documentation'
), git_hooks_page AS (
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
    'Git Hooks Automation',
    'feature-git-hooks-automation',
    dev_org.org_id,
    '{
      "doc_type": "dev",
      "section": "Features",
      "status": "published",
      "auto_generated": true,
      "order": 4
    }'::jsonb,
    NOW(),
    NOW()
  FROM dev_org
  RETURNING id, organization_id
)
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
  git_hooks_page.id,
  'content',
  'text',
  '# Git Hooks Automation Feature

## Overview
Provides seamless integration between your development workflow and the HERA documentation system. Automatically detects code changes, generates documentation, and keeps your documentation database synchronized.

## Installation
```bash
npm run docs:setup-hooks
```

## How It Works
The system installs Git hooks that trigger at key points:

1. **Pre-commit Hook**: Analyzes staged changes and generates documentation
2. **Post-commit Hook**: Syncs generated documentation to HERA database  
3. **Prepare-commit-msg Hook**: Enhances commit messages with documentation context
4. **Post-merge Hook**: Rebuilds documentation after merges

## Change Detection
Intelligently detects documentation-relevant changes:
- `src/app/api/*/route.ts` - API endpoints
- `src/components/*.tsx` - React components
- `src/app/*/page.tsx` - Application pages
- `database/*.sql` - Database schema changes

## Example Output
```bash
🔍 HERA: Analyzing changes for documentation updates...
📡 API route changed: src/app/api/users/route.ts
🧩 New component added: src/components/UserCard.tsx
📝 Running documentation analysis...
📚 Documentation updates generated in generated-docs/
```

## Benefits
- **Seamless Integration**: No changes to existing Git workflow
- **Automatic Documentation**: Never forget to document changes
- **Enhanced Commits**: Better commit messages with documentation context
- **Zero Maintenance**: System maintains itself automatically',
  git_hooks_page.organization_id,
  NOW(),
  NOW()
FROM git_hooks_page;

-- Create navigation relationships between documentation pages
WITH dev_org AS (
  SELECT id as org_id FROM core_organizations 
  WHERE organization_name = 'HERA Developer Documentation'
),
systems_section AS (
  SELECT id FROM core_entities 
  WHERE entity_code = 'auto-documentation-system' 
  AND entity_type = 'doc_page'
),
api_section AS (
  SELECT id FROM core_entities 
  WHERE entity_code = 'api-docs-search' 
  AND entity_type = 'doc_page'
),
components_section AS (
  SELECT id FROM core_entities 
  WHERE entity_code = 'component-doc-layout' 
  AND entity_type = 'doc_page'
),
features_section AS (
  SELECT id FROM core_entities 
  WHERE entity_code = 'feature-git-hooks-automation' 
  AND entity_type = 'doc_page'
)

-- Create sequential navigation relationships
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
  systems_section.id,
  api_section.id,
  'navigation_next',
  '{"nav_order": 1, "section_order": 1}'::jsonb,
  dev_org.org_id,
  NOW(),
  NOW()
FROM dev_org, systems_section, api_section

UNION ALL

SELECT 
  gen_random_uuid(),
  api_section.id,
  components_section.id,
  'navigation_next',
  '{"nav_order": 2, "section_order": 2}'::jsonb,
  dev_org.org_id,
  NOW(),
  NOW()
FROM dev_org, api_section, components_section

UNION ALL

SELECT 
  gen_random_uuid(),
  components_section.id,
  features_section.id,
  'navigation_next',
  '{"nav_order": 3, "section_order": 3}'::jsonb,
  dev_org.org_id,
  NOW(),
  NOW()
FROM dev_org, components_section, features_section;

-- Create sync transaction for audit trail
WITH dev_org AS (
  SELECT id as org_id FROM core_organizations 
  WHERE organization_name = 'HERA Developer Documentation'
)
INSERT INTO universal_transactions (
  id,
  transaction_type,
  description,
  transaction_data,
  organization_id,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'documentation_sync',
  'Auto-Documentation System - Initial documentation sync',
  '{
    "sync_type": "initial_setup",
    "pages_created": 4,
    "sections": ["Systems", "API Reference", "Components", "Features"],
    "automated": true,
    "source": "auto-documentation-system"
  }'::jsonb,
  dev_org.org_id,
  NOW(),
  NOW()
FROM dev_org;

-- Verify the sync
SELECT 
  e.entity_name,
  e.entity_code,
  e.metadata->>'section' as section,
  e.metadata->>'doc_type' as doc_type,
  e.created_at
FROM core_entities e
JOIN core_organizations o ON e.organization_id = o.id
WHERE o.organization_name = 'HERA Developer Documentation'
  AND e.entity_type = 'doc_page'
ORDER BY e.metadata->>'order';

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Successfully synced Auto-Documentation System to HERA database!';
  RAISE NOTICE '📝 Created 4 documentation pages in developer documentation';
  RAISE NOTICE '🔗 Added navigation relationships between pages';  
  RAISE NOTICE '📊 Created audit transaction for change tracking';
  RAISE NOTICE '🌐 Documentation available at /docs/dev/auto-documentation-system';
END $$;