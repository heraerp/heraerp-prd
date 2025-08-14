# Auto-Documentation System

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

### Documentation UI Components
- **DocLayout**: Main layout component with responsive sidebar navigation
- **DocNavigation**: Hierarchical navigation tree with collapsible sections
- **DocSearch**: Real-time search with keyboard navigation and filters
- **DocContent**: Markdown rendering with syntax highlighting and table of contents
- **DocBreadcrumb**: Navigation breadcrumbs for better user experience
- **DocMeta**: Page metadata including author, dates, and reading time

## Architecture

### Universal 6-Table Integration
The system leverages HERA's universal architecture:

1. **core_organizations**: Documentation projects (Developer Docs, User Docs)
2. **core_entities**: Documentation pages and sections
3. **core_dynamic_data**: Markdown content, metadata, and descriptions  
4. **core_relationships**: Navigation hierarchy and cross-references
5. **universal_transactions**: Content updates and publishing events
6. **universal_transaction_lines**: Detailed change tracking and audit trails

### Code Analysis Engine
The system analyzes multiple file types:

- **API Routes** (`src/app/api/*/route.ts`): Extracts endpoints, methods, authentication, validation
- **React Components** (`src/components/*.tsx`): Analyzes props, hooks, state, event handlers
- **Pages** (`src/app/*/page.tsx`): Identifies user-facing functionality and workflows
- **Database Changes** (`database/*.sql`): Tracks schema modifications and migrations
- **Feature Additions**: Detects new features through code patterns and comments

### AI-Powered Generation
The AI system generates:

**Developer Documentation:**
- Technical implementation details
- API specifications with examples
- Component usage guides with props documentation
- Architecture explanations and patterns
- Code examples and integration snippets

**User Documentation:**
- Feature overviews in plain language
- Step-by-step usage instructions
- UI interaction guides
- Troubleshooting sections
- FAQ and common tasks

## Installation & Setup

### 1. Set Up Git Hooks
```bash
npm run docs:setup-hooks
```

This configures:
- Pre-commit analysis and generation
- Post-commit HERA synchronization
- Post-merge documentation rebuilding
- Commit message enhancement with documentation context

### 2. Initialize Documentation
```bash
# Generate documentation for existing code
npm run docs:generate

# Sync to HERA database
npm run docs:sync

# Verify system health
npm run docs:health
```

### 3. Configure Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
AI_DOCUMENTATION_ENABLED=true
DOC_AUTO_SYNC=true
```

## Available Commands

### Core Documentation
- `npm run docs:generate`: Generate documentation from code changes
- `npm run docs:sync`: Sync generated docs to HERA database
- `npm run docs:ai-generate [file]`: AI-powered documentation for specific files

### Maintenance & Health
- `npm run docs:health`: Comprehensive system health check
- `npm run docs:validate`: Validate all documentation links
- `npm run docs:cleanup`: Remove old and duplicate files
- `npm run docs:full-maintenance`: Complete maintenance suite

### Setup & Configuration
- `npm run docs:setup-hooks`: Install and configure Git hooks

## Workflow Integration

### Automatic Generation Triggers
1. **New API Routes**: Detects new endpoints and generates complete API documentation
2. **New Components**: Creates component documentation with props, usage, and examples
3. **New Pages**: Generates user guides and developer implementation notes
4. **Feature Additions**: Identifies new features and creates comprehensive guides
5. **Database Changes**: Documents schema modifications and migration impacts

### Git Workflow Integration
1. **Developer makes changes** to API routes, components, or pages
2. **Pre-commit hook** analyzes changes and generates documentation
3. **Commit proceeds** with enhanced commit message including doc context
4. **Post-commit hook** syncs documentation to HERA database
5. **Documentation is live** and accessible at `/docs` immediately

### HERA Database Storage
Generated documentation is stored using HERA's universal patterns:

```sql
-- Documentation organization
INSERT INTO core_organizations (organization_name, organization_type, settings)
VALUES ('HERA Developer Documentation', 'documentation', 
        '{"doc_type": "developer", "auto_generated": true}');

-- Documentation page
INSERT INTO core_entities (entity_type, entity_name, entity_code, metadata)
VALUES ('doc_page', 'Auto-Documentation System', 'auto-documentation-system',
        '{"doc_type": "dev", "section": "Systems", "status": "published"}');

-- Page content
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value)
VALUES (page_id, 'content', 'text', '# Auto-Documentation System...');

-- Navigation structure
INSERT INTO core_relationships (source_entity_id, target_entity_id, relationship_type)
VALUES (parent_id, page_id, 'navigation_parent');
```

## Configuration & Customization

### Custom Templates
Create templates in `scripts/doc-templates/`:

```markdown
# {{title}}
Generated: {{timestamp}}

## Overview
{{description}}

## Implementation
{{technical_details}}

## Usage
{{usage_examples}}
```

### Analysis Rules
Extend code analysis in `scripts/code-analyzer.js`:

```javascript
// Add custom patterns
this.patterns.customFeatures = /\/\*\*\s*@myfeature\s([^\n]*)/g;

// Add custom extraction
extractCustomFeatures(content) {
  // Custom analysis logic
  return features;
}
```

### AI Integration
Integrate with AI services in `scripts/ai-doc-generator.js`:

```javascript
async generateWithAI(prompt, type) {
  // OpenAI integration
  const response = await openai.completions.create({
    model: "gpt-4",
    prompt: prompt,
    max_tokens: 2000
  });
  
  return response.choices[0].text;
}
```

## Benefits

### For Developers
- **Zero Documentation Debt**: Documentation automatically stays current
- **Consistent Quality**: AI ensures comprehensive, well-structured content
- **Time Savings**: Eliminates manual documentation writing
- **Better Code Reviews**: Documentation context included in commits
- **Integrated Workflow**: Seamless Git integration with no extra steps

### For Users
- **Always Current**: Documentation matches actual application features
- **Dual Format**: Both technical and user-friendly content available
- **Comprehensive Coverage**: All features documented automatically
- **Searchable**: Full-text search across all documentation
- **Integrated Experience**: Documentation lives within the application

### For Organizations
- **Audit Compliance**: Complete change history via HERA transactions
- **Knowledge Preservation**: Automated capture of institutional knowledge
- **Onboarding Efficiency**: New team members have up-to-date documentation
- **Reduced Support Load**: Better documentation reduces support tickets
- **Scalable Documentation**: System grows with your codebase

## Monitoring & Analytics

### Health Dashboard
Access comprehensive analytics at `/docs/analytics`:
- Page view statistics and trends
- Most accessed documentation sections
- Search query analytics
- Content performance metrics
- System health indicators

### Maintenance Reports
Automated reports include:
- Link validation results
- Content freshness analysis
- Sync status monitoring
- Performance metrics
- Recommendations for improvements

## Advanced Features

### Intelligent Content Generation
- **Context Awareness**: Understands business domain and technical patterns
- **Multi-format Output**: Generates both technical and user-friendly content
- **Code Example Generation**: Creates working code examples
- **Cross-reference Detection**: Automatically links related documentation

### Performance Optimization
- **Incremental Generation**: Only processes changed files
- **Efficient Sync**: Optimized database operations
- **Caching Strategies**: Intelligent content caching
- **Background Processing**: Non-blocking documentation updates

### Quality Assurance
- **Link Validation**: Ensures all internal and external links work
- **Content Validation**: Checks for completeness and accuracy
- **Version Consistency**: Maintains version references across all docs
- **Automated Testing**: Validates generated documentation

## Troubleshooting

### Common Issues

**Git hooks not executing:**
```bash
# Verify hooks are installed
ls -la .githooks/

# Check Git configuration
git config core.hooksPath

# Reinstall hooks
npm run docs:setup-hooks
```

**Documentation not syncing:**
```bash
# Check system health
npm run docs:health

# Manual sync
npm run docs:sync

# Verify API connectivity
curl -X POST http://localhost:3000/api/v1/entities/search
```

**Missing generated documentation:**
```bash
# Check for generated files
ls -la generated-docs/

# Run generation manually
npm run docs:generate

# Enable debug logging
DEBUG=docs:* npm run docs:generate
```

### Debug Mode
Enable verbose logging for troubleshooting:

```bash
# Enable debug output
export DEBUG=docs:*
npm run docs:generate

# Check system status
npm run docs:health

# Validate all components
npm run docs:validate
```

## Future Enhancements

### Planned Features
- **Visual Documentation**: Automatic screenshot generation for UI components
- **Interactive Examples**: Live code examples with runnable snippets
- **Multi-language Support**: Generate documentation in multiple languages
- **Video Generation**: AI-generated walkthrough videos
- **Advanced Analytics**: User behavior analysis and content optimization

### AI Improvements
- **Better Context Understanding**: Enhanced business domain awareness
- **Style Learning**: Learns and maintains your organization's documentation style
- **Quality Scoring**: Automated documentation quality assessment
- **User Feedback Integration**: Continuous improvement based on user interactions

---

*This documentation is automatically maintained by the HERA Auto-Documentation System. Last updated: 2024-01-15*