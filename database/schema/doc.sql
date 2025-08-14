-- HERA Auto-Documentation System Database Sync (FIXED)
-- This script adds the auto-documentation system documentation to your HERA database
-- NOTE: This script must be run by an authenticated user with proper permissions

-- First create a client in core_clients table (using ACTUAL schema)
INSERT INTO core_clients (
    id,
    client_name,
    client_code,
    client_type,
    status,
    client_settings,
    ai_insights,
    ai_classification,
    ai_confidence
)
SELECT 
    gen_random_uuid(),
    'HERA System Client',
    'HERA-SYSTEM',
    'system',
    'active',
    '{
        "system_client": true,
        "access_level": "system",
        "auto_generated": true
    }'::jsonb,
    '{
        "classification": "system_client",
        "confidence": 1.0
    }'::jsonb,
    'system_client',
    1.0
WHERE NOT EXISTS (
    SELECT 1 FROM core_clients 
    WHERE client_name = 'HERA System Client'
);

-- Create system organization with the client reference
INSERT INTO core_organizations (
    id,
    organization_name,
    organization_code,
    organization_type,
    client_id,
    status,
    settings,
    ai_insights,
    ai_classification,
    ai_confidence
)
SELECT 
    gen_random_uuid(),
    'HERA System Organization',
    gen_random_uuid(),
    'system',
    c.id,
    'active',
    '{
        "doc_type": "system",
        "access_level": "internal",
        "system": true,
        "client_name": "HERA System Client"
    }'::jsonb,
    '{
        "classification": "system_organization",
        "confidence": 1.0
    }'::jsonb,
    'system_organization',
    1.0
FROM core_clients c
WHERE c.client_name = 'HERA System Client'
AND NOT EXISTS (
    SELECT 1 FROM core_organizations 
    WHERE organization_name = 'HERA System Organization'
);

-- Create developer documentation organization using system org as parent and same client
INSERT INTO core_organizations (
    id,
    organization_name,
    organization_code,
    organization_type,
    client_id,
    status,
    settings,
    ai_insights,
    ai_classification,
    ai_confidence
)
SELECT 
    gen_random_uuid(),
    'HERA Developer Documentation',
    sys_org.id,
    'documentation',
    sys_org.client_id,
    'active',
    jsonb_build_object(
        'doc_type', 'developer',
        'access_level', 'internal',
        'theme', 'technical',
        'auto_generated', true,
        'system', 'auto-documentation',
        'parent_org', sys_org.id::text,
        'client_name', 'HERA System Client'
    ),
    '{
        "classification": "documentation_organization",
        "confidence": 1.0
    }'::jsonb,
    'documentation_organization',
    1.0
FROM core_organizations sys_org
WHERE sys_org.organization_name = 'HERA System Organization'
AND NOT EXISTS (
    SELECT 1 FROM core_organizations 
    WHERE organization_name = 'HERA Developer Documentation'
);

-- Insert Auto-Documentation System page
INSERT INTO core_entities (
    id,
    entity_type,
    entity_name,
    entity_code,
    organization_id,
    status,
    metadata,
    ai_confidence,
    ai_classification,
    created_by,
    updated_by,
    created_at,
    updated_at,
    version
)
SELECT 
    gen_random_uuid(),
    'doc_page',
    'Auto-Documentation System',
    'auto-documentation-system',
    o.id,
    'active',
    '{
        "doc_type": "dev",
        "section": "Systems",
        "status": "published",
        "auto_generated": true,
        "priority": "high",
        "order": 1
    }'::jsonb,
    1.0,
    'system_documentation',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW(),
    1
FROM core_organizations o
WHERE o.organization_name = 'HERA Developer Documentation'
AND NOT EXISTS (
    SELECT 1 FROM core_entities 
    WHERE entity_code = 'auto-documentation-system' 
    AND entity_type = 'doc_page'
    AND organization_id = o.id
);

-- Insert content for Auto-Documentation System
INSERT INTO core_dynamic_data (
    id,
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value,
    ai_enhanced_value,
    ai_confidence,
    validation_status,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.organization_id,
    e.id,
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
    'Auto-generated comprehensive documentation for the HERA Auto-Documentation System',
    0.95,
    'valid',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'auto-documentation-system' 
AND e.entity_type = 'doc_page'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data 
    WHERE entity_id = e.id AND field_name = 'content'
);

-- Insert description for Auto-Documentation System
INSERT INTO core_dynamic_data (
    id,
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value,
    ai_enhanced_value,
    ai_confidence,
    validation_status,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.organization_id,
    e.id,
    'description',
    'text',
    'Comprehensive solution that automatically generates and maintains documentation for your codebase',
    'AI-powered documentation system that keeps code documentation current automatically',
    0.98,
    'valid',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'auto-documentation-system' 
AND e.entity_type = 'doc_page'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data 
    WHERE entity_id = e.id AND field_name = 'description'
);

-- Insert Documentation Search API page
INSERT INTO core_entities (
    id,
    entity_type,
    entity_name,
    entity_code,
    organization_id,
    status,
    metadata,
    ai_confidence,
    ai_classification,
    created_by,
    updated_by,
    created_at,
    updated_at,
    version
)
SELECT 
    gen_random_uuid(),
    'doc_page',
    'Documentation Search API',
    'api-docs-search',
    o.id,
    'active',
    '{
        "doc_type": "dev",
        "section": "API Reference",
        "status": "published",
        "auto_generated": true,
        "order": 2
    }'::jsonb,
    1.0,
    'api_documentation',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW(),
    1
FROM core_organizations o
WHERE o.organization_name = 'HERA Developer Documentation'
AND NOT EXISTS (
    SELECT 1 FROM core_entities 
    WHERE entity_code = 'api-docs-search' 
    AND entity_type = 'doc_page'
    AND organization_id = o.id
);

-- Insert content for Documentation Search API
INSERT INTO core_dynamic_data (
    id,
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value,
    ai_enhanced_value,
    ai_confidence,
    validation_status,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.organization_id,
    e.id,
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
    'Complete API documentation for HERA documentation search functionality',
    0.92,
    'valid',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'api-docs-search' 
AND e.entity_type = 'doc_page'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data 
    WHERE entity_id = e.id AND field_name = 'content'
);

-- Insert DocLayout Component page
INSERT INTO core_entities (
    id,
    entity_type,
    entity_name,
    entity_code,
    organization_id,
    status,
    metadata,
    ai_confidence,
    ai_classification,
    created_by,
    updated_by,
    created_at,
    updated_at,
    version
)
SELECT 
    gen_random_uuid(),
    'doc_page',
    'DocLayout Component',
    'component-doc-layout',
    o.id,
    'active',
    '{
        "doc_type": "dev",
        "section": "Components",
        "status": "published",
        "auto_generated": true,
        "order": 3
    }'::jsonb,
    1.0,
    'component_documentation',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW(),
    1
FROM core_organizations o
WHERE o.organization_name = 'HERA Developer Documentation'
AND NOT EXISTS (
    SELECT 1 FROM core_entities 
    WHERE entity_code = 'component-doc-layout' 
    AND entity_type = 'doc_page'
    AND organization_id = o.id
);

-- Insert content for DocLayout Component
INSERT INTO core_dynamic_data (
    id,
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value,
    ai_enhanced_value,
    ai_confidence,
    validation_status,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.organization_id,
    e.id,
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
    'Comprehensive React component documentation with usage examples and props',
    0.94,
    'valid',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'component-doc-layout' 
AND e.entity_type = 'doc_page'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data 
    WHERE entity_id = e.id AND field_name = 'content'
);

-- Insert Git Hooks Automation Feature page
INSERT INTO core_entities (
    id,
    entity_type,
    entity_name,
    entity_code,
    organization_id,
    status,
    metadata,
    ai_confidence,
    ai_classification,
    created_by,
    updated_by,
    created_at,
    updated_at,
    version
)
SELECT 
    gen_random_uuid(),
    'doc_page',
    'Git Hooks Automation',
    'feature-git-hooks-automation',
    o.id,
    'active',
    '{
        "doc_type": "dev",
        "section": "Features",
        "status": "published",
        "auto_generated": true,
        "order": 4
    }'::jsonb,
    1.0,
    'feature_documentation',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW(),
    1
FROM core_organizations o
WHERE o.organization_name = 'HERA Developer Documentation'
AND NOT EXISTS (
    SELECT 1 FROM core_entities 
    WHERE entity_code = 'feature-git-hooks-automation' 
    AND entity_type = 'doc_page'
    AND organization_id = o.id
);

-- Insert content for Git Hooks Automation Feature
INSERT INTO core_dynamic_data (
    id,
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value,
    ai_enhanced_value,
    ai_confidence,
    validation_status,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e.organization_id,
    e.id,
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
    'Detailed documentation for automated Git hooks integration with HERA documentation system',
    0.96,
    'valid',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW()
FROM core_entities e
WHERE e.entity_code = 'feature-git-hooks-automation' 
AND e.entity_type = 'doc_page'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data 
    WHERE entity_id = e.id AND field_name = 'content'
);

-- Create navigation relationships between documentation pages
INSERT INTO core_relationships (
    id,
    organization_id,
    source_entity_id,
    target_entity_id,
    relationship_type,
    relationship_strength,
    relationship_data,
    is_bidirectional,
    hierarchy_level,
    workflow_state,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e1.organization_id,
    e1.id,
    e2.id,
    'navigation_next',
    1.0,
    '{"nav_order": 1, "section_order": 1}'::jsonb,
    false,
    0,
    'active',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW()
FROM core_entities e1, core_entities e2
WHERE e1.entity_code = 'auto-documentation-system' 
AND e1.entity_type = 'doc_page'
AND e2.entity_code = 'api-docs-search' 
AND e2.entity_type = 'doc_page'
AND e1.organization_id = e2.organization_id
AND NOT EXISTS (
    SELECT 1 FROM core_relationships 
    WHERE source_entity_id = e1.id AND target_entity_id = e2.id
);

INSERT INTO core_relationships (
    id,
    organization_id,
    source_entity_id,
    target_entity_id,
    relationship_type,
    relationship_strength,
    relationship_data,
    is_bidirectional,
    hierarchy_level,
    workflow_state,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e1.organization_id,
    e1.id,
    e2.id,
    'navigation_next',
    1.0,
    '{"nav_order": 2, "section_order": 2}'::jsonb,
    false,
    0,
    'active',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW()
FROM core_entities e1, core_entities e2
WHERE e1.entity_code = 'api-docs-search' 
AND e1.entity_type = 'doc_page'
AND e2.entity_code = 'component-doc-layout' 
AND e2.entity_type = 'doc_page'
AND e1.organization_id = e2.organization_id
AND NOT EXISTS (
    SELECT 1 FROM core_relationships 
    WHERE source_entity_id = e1.id AND target_entity_id = e2.id
);

INSERT INTO core_relationships (
    id,
    organization_id,
    source_entity_id,
    target_entity_id,
    relationship_type,
    relationship_strength,
    relationship_data,
    is_bidirectional,
    hierarchy_level,
    workflow_state,
    created_by,
    updated_by,
    created_at,
    updated_at
)
SELECT 
    gen_random_uuid(),
    e1.organization_id,
    e1.id,
    e2.id,
    'navigation_next',
    1.0,
    '{"nav_order": 3, "section_order": 3}'::jsonb,
    false,
    0,
    'active',
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW()
FROM core_entities e1, core_entities e2
WHERE e1.entity_code = 'component-doc-layout' 
AND e1.entity_type = 'doc_page'
AND e2.entity_code = 'feature-git-hooks-automation' 
AND e2.entity_type = 'doc_page'
AND e1.organization_id = e2.organization_id
AND NOT EXISTS (
    SELECT 1 FROM core_relationships 
    WHERE source_entity_id = e1.id AND target_entity_id = e2.id
);

-- Create sync transaction for audit trail
INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    reference_number,
    source_entity_id,
    target_entity_id,
    total_amount,
    currency,
    status,
    workflow_state,
    metadata,
    ai_insights,
    created_by,
    updated_by,
    created_at,
    updated_at,
    version
) 
SELECT 
    gen_random_uuid(),
    o.id,
    'documentation_sync',
    'DOC-SYNC-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
    NOW()::date,
    'AUTO-DOC-INITIAL-SYNC',
    NULL,
    NULL,
    0.00,
    'USD',
    'completed',
    'active',
    '{
        "sync_type": "initial_setup",
        "pages_created": 4,
        "sections": ["Systems", "API Reference", "Components", "Features"],
        "automated": true,
        "source": "auto-documentation-system",
        "documentation_type": "developer"
    }'::jsonb,
    '{
        "confidence": 1.0,
        "classification": "system_documentation_sync",
        "insights": "Successfully created comprehensive developer documentation structure"
    }'::jsonb,
    '00000000-0000-0000-0000-000000000000'::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID,
    NOW(),
    NOW(),
    1
FROM core_organizations o
WHERE o.organization_name = 'HERA Developer Documentation'
AND NOT EXISTS (
    SELECT 1 FROM universal_transactions 
    WHERE reference_number = 'AUTO-DOC-INITIAL-SYNC' AND organization_id = o.id
);

-- Verify the sync with detailed output
SELECT 
    '✅ HERA Auto-Documentation System sync completed successfully!' as status,
    json_agg(
        json_build_object(
            'page', e.entity_name,
            'code', e.entity_code,
            'section', e.metadata->>'section',
            'created', e.created_at
        ) ORDER BY (e.metadata->>'order')::int
    ) as pages_created
FROM core_organizations o
JOIN core_entities e ON e.organization_id = o.id
WHERE o.organization_name = 'HERA Developer Documentation'
  AND e.entity_type = 'doc_page';