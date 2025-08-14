# HERA Auto-Documentation System

An intelligent documentation system that automatically keeps your developer and user documentation up-to-date with every code change. Built on HERA's universal architecture, this system ensures your documentation never falls behind your development.

## 🚀 Key Features

### ✅ Automatic Documentation Generation
- **Code Analysis**: Intelligently analyzes new files, API routes, components, and features
- **AI-Powered Content**: Generates comprehensive documentation using AI analysis
- **Multi-Format Output**: Creates both developer and user-facing documentation
- **HERA Integration**: Stores all documentation in your existing HERA database

### ✅ Git Integration
- **Pre-commit Hooks**: Analyzes changes and generates documentation before commits
- **Post-commit Sync**: Automatically syncs generated docs to HERA database
- **Merge Handling**: Rebuilds documentation after merges
- **Commit Message Enhancement**: Adds documentation context to commit messages

### ✅ Automated Maintenance
- **Health Monitoring**: Regular checks for outdated or broken documentation
- **Link Validation**: Ensures all documentation links remain valid
- **Version Updates**: Automatically updates version references
- **Cleanup Tasks**: Removes old and duplicate documentation files

## 🛠️ Installation & Setup

### 1. Install Git Hooks
```bash
npm run docs:setup-hooks
```

This command:
- Creates `.githooks` directory with automated hooks
- Configures Git to use the custom hooks
- Sets up pre-commit, post-commit, and post-merge automation

### 2. Test the System
```bash
# Generate documentation for existing files
npm run docs:generate

# Sync to HERA database
npm run docs:sync

# Run health check
npm run docs:health
```

### 3. Configure Environment (Optional)
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
AI_DOCUMENTATION_ENABLED=true
DOC_AUTO_SYNC=true
```

## 📋 Available Commands

### Core Documentation Commands
```bash
# Generate documentation from code changes
npm run docs:generate

# Sync generated docs to HERA database
npm run docs:sync

# AI-powered documentation generation
npm run docs:ai-generate [file-path]
```

### Maintenance Commands
```bash
# Run complete maintenance suite
npm run docs:full-maintenance

# Check documentation health
npm run docs:health

# Validate all documentation links
npm run docs:validate

# Clean up old documentation files
npm run docs:cleanup

# Run custom maintenance task
npm run docs:maintenance [task-name]
```

### Setup Commands
```bash
# Set up Git hooks for automation
npm run docs:setup-hooks
```

## 🔄 How It Works

### 1. Code Change Detection
When you make changes to your codebase, the system automatically detects:

- **New API Routes** (`src/app/api/*/route.ts`)
- **New Components** (`src/components/*.tsx`)
- **New Pages** (`src/app/*/page.tsx`)
- **Database Changes** (`database/*.sql`)
- **Feature Additions** (marked with `@feature` comments)

### 2. Intelligent Analysis
The code analyzer examines each file for:

```typescript
// API Route Analysis
- HTTP methods (GET, POST, PUT, DELETE)
- Authentication requirements
- Request/response formats
- Error handling patterns
- HERA operations used

// Component Analysis
- Props and interfaces
- Hooks and state management
- Event handlers
- Styling patterns
- Accessibility features

// Feature Analysis
- Business functionality
- User-facing features
- Integration points
- Database operations
```

### 3. AI-Powered Generation
For each detected change, the system generates:

**Developer Documentation:**
- Technical implementation details
- API specifications with examples
- Component usage guides
- Architecture explanations
- Code examples and snippets

**User Documentation:**
- Feature overviews in plain language
- Step-by-step usage guides
- UI interaction instructions
- Troubleshooting guides
- FAQ sections

### 4. HERA Database Integration
Generated documentation is stored using HERA's universal architecture:

```typescript
// Documentation Organization
core_organizations → "HERA Developer Docs", "HERA User Docs"

// Documentation Pages
core_entities → doc_page entities with metadata

// Content Storage
core_dynamic_data → Markdown content, descriptions, metadata

// Navigation Structure
core_relationships → Hierarchical navigation trees

// Change Tracking
universal_transactions → Documentation updates and sync history
```

## 🎯 Workflow Examples

### Example 1: Adding a New API Route

1. **Create API file**: `src/app/api/users/route.ts`
2. **Git commit**: System detects new API route
3. **Auto-generation**: Creates comprehensive API documentation
4. **HERA sync**: Stores documentation in database
5. **User access**: Available at `/docs/dev/api-users`

### Example 2: Adding a New Component

1. **Create component**: `src/components/UserCard.tsx`
2. **Git commit**: System analyzes component structure
3. **Dual documentation**: 
   - Developer guide: Props, usage, technical details
   - User guide: What the component does, how users interact
4. **Navigation update**: Automatically added to component library

### Example 3: Feature Development

1. **Add feature comment**: `/** @feature User Profile Management */`
2. **Implement feature**: Multiple files (API, components, pages)
3. **Commit changes**: System detects cohesive feature
4. **Comprehensive docs**: 
   - Technical architecture documentation
   - User guide with screenshots and workflows
   - Integration instructions

## 🔧 Customization

### Custom Templates
Create custom documentation templates in `scripts/doc-templates/`:

```markdown
# API Template (api-template.md)
# {{title}}

## Overview
{{description}}

## Authentication
{{auth_details}}

## Endpoints
{{endpoints}}
```

### AI Integration
To integrate with AI services (OpenAI, Claude, etc.), modify `scripts/ai-doc-generator.js`:

```javascript
async generateWithAI(prompt, type) {
  // Replace with your AI service integration
  const response = await openai.completions.create({
    model: "gpt-4",
    prompt: prompt,
    max_tokens: 2000
  })
  
  return response.choices[0].text
}
```

### Custom Analysis Rules
Extend the code analyzer in `scripts/code-analyzer.js`:

```javascript
// Add custom patterns
this.patterns.customFeatures = /\/\*\*\s*\n\s*\*\s*@myfeature\s+([^\n]*)/g

// Add custom analysis
extractCustomFeatures(content) {
  // Your custom analysis logic
}
```

## 📊 Monitoring & Analytics

### Documentation Health Dashboard
Access comprehensive analytics at `/docs/analytics`:

- **Page Views**: Most accessed documentation
- **Search Analytics**: What users search for
- **Content Performance**: Engagement metrics
- **Maintenance Status**: Health indicators

### Maintenance Reports
Automated maintenance generates reports:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "checks": [
    {
      "name": "Link Validation",
      "status": "passed",
      "details": "All 127 links validated successfully"
    }
  ],
  "recommendations": [
    "Update API documentation for deprecated endpoints",
    "Add user guides for recently added features"
  ]
}
```

## 🚨 Troubleshooting

### Common Issues

**Git hooks not running:**
```bash
# Re-run setup
npm run docs:setup-hooks

# Check Git configuration
git config core.hooksPath
```

**Documentation not syncing:**
```bash
# Check sync status
npm run docs:health

# Manual sync
npm run docs:sync

# Check API connectivity
curl http://localhost:3000/api/v1/entities
```

**Generated docs missing:**
```bash
# Check generated-docs directory
ls -la generated-docs/

# Run generation manually
npm run docs:generate

# Check for errors
npm run docs:generate 2>&1 | grep -i error
```

### Debug Mode
Enable verbose logging:

```bash
DEBUG=docs:* npm run docs:generate
```

## 🎉 Benefits

### For Developers
- **Zero Documentation Debt**: Never fall behind on documentation
- **Consistent Quality**: AI ensures comprehensive, well-structured docs
- **Time Savings**: Eliminates manual documentation writing
- **Better Code Reviews**: Documentation context in commits

### For Users
- **Always Current**: Documentation matches actual features
- **Comprehensive Coverage**: Both technical and user-friendly content
- **Integrated Experience**: Documentation lives within the application
- **Searchable Content**: Full-text search across all documentation

### For Organizations
- **Audit Compliance**: Complete change history via HERA transactions
- **Knowledge Preservation**: Automated capture of domain knowledge
- **Onboarding Efficiency**: New team members have up-to-date docs
- **Reduced Support**: Better documentation reduces support tickets

## 🔮 Future Enhancements

### Planned Features
- **Visual Documentation**: Automatic screenshot generation
- **Interactive Examples**: Live code examples with runnable snippets
- **Multi-language Support**: Generate docs in multiple languages
- **Video Generation**: AI-generated walkthrough videos
- **Integration Testing**: Automated API documentation testing

### AI Enhancements
- **Context Awareness**: Better understanding of business domain
- **Style Learning**: Learns your organization's documentation style
- **Quality Scoring**: Automated documentation quality assessment
- **User Feedback Integration**: Learns from user documentation feedback

---

**🎯 Result: Your documentation is now a living, breathing part of your codebase that evolves with every change, ensuring your team and users always have access to current, comprehensive, and high-quality documentation.**

**🚀 Get Started**: Run `npm run docs:setup-hooks` and start building - your documentation will take care of itself!