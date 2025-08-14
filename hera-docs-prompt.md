# Claude CLI Prompt: Build HERA Universal Documentation System

Please build a comprehensive documentation system for my Next.js application using HERA's existing 6-table universal architecture. This is NOT a separate CMS - it's documentation built ON TOP of the existing HERA system.

## 🏗️ HERA Architecture Integration

### Use Existing HERA Universal Tables:
1. **core_organizations** → Documentation projects (Dev Guide, User Guide)
2. **core_entities** → Pages, sections, navigation items
3. **core_dynamic_data** → Markdown content, metadata, SEO data
4. **core_relationships** → Navigation hierarchy, cross-references
5. **universal_transactions** → Content updates, publishing events
6. **universal_transaction_lines** → Detailed change tracking

### Use Existing HERA API Endpoints:
- POST `/api/v1/organizations` (create doc projects)
- POST `/api/v1/entities` (create pages, sections)
- POST `/api/v1/dynamic-data` (store content, metadata)
- POST `/api/v1/relationships` (build navigation)
- POST `/api/v1/transactions` (track content changes)
- GET `/api/v1/universal/search` (documentation search)
- GET `/api/v1/analytics` (documentation usage stats)

## 📊 Data Structure Examples

### Documentation Organization:
```typescript
{
  organization_type: "documentation",
  organization_name: "MyApp Developer Docs",
  settings: {
    doc_type: "developer", // or "user"
    access_level: "internal",
    theme: "technical",
    auto_generate_nav: true
  }
}
```

### Documentation Page Entity:
```typescript
{
  entity_type: "doc_page",
  entity_name: "API Development Guide",
  entity_code: "api-development",
  metadata: {
    section: "development",
    audience: "developers",
    difficulty: "intermediate",
    status: "published"
  }
}
```

### Page Content (Dynamic Data):
```typescript
{
  field_name: "content",
  field_type: "text",
  field_value: "# API Development Guide\n\nThis guide covers authentication, error handling...",
  ai_enhanced_value: "Auto-generated summary and SEO description"
}
```

### Navigation Structure (Relationships):
```typescript
{
  relationship_type: "navigation_parent",
  source_entity_id: "setup_section_uuid",
  target_entity_id: "api_guide_page_uuid",
  relationship_data: {
    nav_order: 3,
    display_in_sidebar: true,
    show_children: true
  }
}
```

## 🎨 Next.js Implementation Requirements

### Route Structure:
- `/docs` - Documentation hub/landing page
- `/docs/dev/[...slug]` - Developer guide dynamic routes
- `/docs/user/[...slug]` - User guide dynamic routes
- Dynamic routing using HERA API data
- ISR (Incremental Static Regeneration) for performance

### Components to Build:
```
components/docs/
├── DocLayout.jsx (main layout using existing theme system)
├── DocNavigation.jsx (dev vs user navigation)
├── DocSearch.jsx (integrated HERA universal search)
├── DocBreadcrumb.jsx (relationship-based breadcrumbs)
├── DocContent.jsx (markdown rendering with syntax highlighting)
├── DocMeta.jsx (last updated, author, edit links)
├── DocGuideSelector.jsx (switch between dev/user guides)
└── DocAnalytics.jsx (page view tracking)
```

### API Integration Functions:
```typescript
// lib/hera-docs.js
export async function getDocPage(slug: string, docType: 'dev' | 'user') {
  // Fetch page entity and dynamic content
}

export async function getDocNavigation(docType: 'dev' | 'user') {
  // Build navigation tree from relationships
}

export async function searchDocs(query: string, docType?: string) {
  // Use HERA universal search with doc filtering
}

export async function trackDocView(pageId: string) {
  // Create transaction for analytics
}
```

## 📋 Documentation Structure

### Developer Guide (`/docs/dev/`):
- **Setup & Installation** - Environment setup, dependencies
- **Architecture Overview** - HERA 6-table system, project structure
- **Database Development** - Working with universal tables
- **API Development** - Creating endpoints, authentication
- **Component Development** - Building UI components
- **Testing Guide** - Unit tests, integration tests
- **Deployment Guide** - Production deployment, CI/CD
- **Contributing** - Git workflow, code standards

### User Guide (`/docs/user/`):
- **Getting Started** - Account setup, first steps
- **Dashboard Overview** - UI walkthrough, navigation
- **Core Features** - Step-by-step feature guides
- **Account Management** - Profile, settings, security
- **Data Management** - Import/export, backup
- **Troubleshooting** - Common issues, solutions
- **FAQ** - Frequently asked questions
- **Mobile Guide** - Mobile app usage

## 🔧 Key Features to Implement

### Content Management:
- Markdown content stored in core_dynamic_data
- Real-time content updates via HERA transactions
- Version control through transaction history
- Multi-author support with proper attribution

### Navigation System:
- Hierarchical navigation via core_relationships
- Separate nav trees for developer and user guides
- Cross-linking between guide types
- Breadcrumb navigation based on relationships

### Search Functionality:
- Full-text search using HERA's universal search
- Filter by guide type (developer/user)
- Search result highlighting
- Search analytics tracking

### Analytics & Tracking:
- Page view tracking via universal_transactions
- Popular content identification
- User journey analysis
- Content performance metrics

### Integration Features:
- Use existing app's theme system and design tokens
- Same authentication and authorization
- Consistent navigation and header
- Mobile-responsive design matching app

## 🌟 Implementation Guidelines

### Theme Integration:
- Extract and reuse existing CSS variables
- Match current typography and spacing
- Use existing component patterns
- Implement dark/light mode if app supports it

### Performance Optimization:
- ISR for fast page loads
- Code splitting for documentation routes
- Image optimization for screenshots
- Caching strategies for navigation and search

### SEO & Accessibility:
- Meta tags and structured data
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility

### Content Creation Workflow:
- Admin interface for content editing (optional)
- Markdown file import functionality
- Bulk content operations
- Content preview before publishing

## 📝 Sample Implementation

### Dynamic Documentation Page:
```typescript
// pages/docs/[...slug].js
export default function DocumentationPage({ page, navigation, docType }) {
  return (
    <DocLayout navigation={navigation} docType={docType}>
      <DocBreadcrumb path={page.breadcrumb} />
      <article className="doc-content">
        <h1>{page.title}</h1>
        <DocMeta
          lastUpdated={page.lastUpdated}
          author={page.author}
          editUrl={page.editUrl}
        />
        <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
      </article>
      <DocNavigation type="page" current={page.id} />
    </DocLayout>
  );
}

export async function getStaticProps({ params }) {
  const slug = params.slug.join('/');
  const docType = params.slug[0]; // 'dev' or 'user'

  const page = await getDocPage(slug, docType);
  const navigation = await getDocNavigation(docType);

  return {
    props: { page, navigation, docType },
    revalidate: 60 // ISR
  };
}
```

## 🎯 Expected Deliverables

1. **Complete Next.js Implementation**
   - All routes and components
   - API integration functions
   - Theme integration

2. **Sample Documentation Content**
   - Developer guide structure with sample pages
   - User guide structure with sample pages
   - Navigation hierarchies for both guides

3. **HERA Data Setup Scripts**
   - Organization creation for doc projects
   - Sample page entities and content
   - Navigation relationship setup

4. **Admin Interface (Optional)**
   - Content editing forms
   - Navigation management
   - Analytics dashboard

5. **Integration Instructions**
   - Setup steps for existing Next.js apps
   - Environment configuration
   - Deployment considerations

## 🚀 Revolutionary Benefits

- **Zero Additional Infrastructure** - Documentation lives in existing HERA system
- **Perfect Integration** - Same APIs, authentication, and theme
- **Universal Search** - Leverage existing search capabilities
- **Real-time Updates** - Content changes via HERA transactions
- **Enterprise Features** - Audit trails, permissions, analytics built-in
- **Infinite Flexibility** - Add new content types via dynamic data
- **AI-Powered** - Smart search, content suggestions, auto-categorization

Build this as a seamless extension of the existing application, not a separate system. The documentation should feel like a native part of the app because it literally is - powered by the same universal 6-table architecture.