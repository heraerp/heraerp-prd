# HERA Universal Documentation System

A revolutionary documentation system built on HERA's universal 6-table architecture. This is NOT a separate CMS - it's documentation living within your existing HERA application.

## 🏗️ Architecture Overview

The documentation system leverages HERA's existing universal tables:

- **core_organizations** → Documentation projects (Dev Guide, User Guide)
- **core_entities** → Pages, sections, navigation items  
- **core_dynamic_data** → Markdown content, metadata, SEO data
- **core_relationships** → Navigation hierarchy, cross-references
- **universal_transactions** → Content updates, publishing events
- **universal_transaction_lines** → Detailed change tracking

## 📁 Directory Structure

```
src/
├── app/
│   └── docs/
│       ├── page.tsx                    # Documentation home
│       ├── search/page.tsx             # Search results
│       ├── analytics/page.tsx          # Analytics dashboard
│       ├── [type]/                     # Dynamic routes
│       │   ├── page.tsx               # Guide index (dev/user)
│       │   └── [...slug]/page.tsx     # Dynamic documentation pages
│       ├── dev/page.tsx               # Developer guide home
│       └── user/page.tsx              # User guide home
├── components/
│   └── docs/
│       ├── DocLayout.tsx              # Main layout component
│       ├── DocNavigation.tsx          # Sidebar navigation
│       ├── DocSearch.tsx              # Search functionality
│       ├── DocContent.tsx             # Content rendering
│       ├── DocBreadcrumb.tsx          # Breadcrumb navigation
│       ├── DocMeta.tsx                # Page metadata
│       ├── DocGuideSelector.tsx       # Switch between guides
│       └── DocAnalytics.tsx           # Analytics tracking
├── lib/
│   └── hera-docs.ts                   # HERA API integration
└── api/
    └── v1/
        └── analytics/
            └── page-exit/route.ts     # Analytics endpoint
```

## 🚀 Features

### ✅ Complete Implementation
- **Dynamic Routing** - `/docs/dev/[...slug]` and `/docs/user/[...slug]`
- **Universal Search** - Full-text search across all documentation
- **Navigation System** - Hierarchical sidebar navigation
- **Content Management** - Markdown content with syntax highlighting
- **Analytics Tracking** - Page views, time on page, scroll depth
- **Responsive Design** - Mobile-optimized with PWA support
- **SEO Optimized** - Meta tags, structured data, semantic HTML

### 🎨 UI Components
- **DocLayout** - Main layout with sidebar and content area
- **DocNavigation** - Collapsible navigation tree
- **DocSearch** - Real-time search with keyboard navigation
- **DocContent** - Markdown rendering with table of contents
- **DocBreadcrumb** - Navigation breadcrumbs
- **DocMeta** - Author, date, reading time metadata

## 📊 Data Structure

### Documentation Organization
```typescript
{
  organization_type: "documentation",
  organization_name: "MyApp Developer Docs",
  settings: {
    doc_type: "developer",
    access_level: "internal", 
    theme: "technical",
    auto_generate_nav: true
  }
}
```

### Documentation Page Entity
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

### Page Content (Dynamic Data)
```typescript
{
  field_name: "content",
  field_type: "text", 
  field_value: "# API Development Guide\n\nThis guide covers...",
  ai_enhanced_value: "Auto-generated summary and SEO description"
}
```

## 🛠️ Setup Instructions

### 1. Database Setup
Run the database setup script to create sample documentation:

```bash
# Execute SQL setup
psql -d your_database -f database/docs-setup.sql

# Or use the Node.js setup script
node scripts/setup-docs-data.js
```

### 2. Environment Configuration
Ensure your `.env.local` includes:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
DATABASE_URL=your_database_connection_string
```

### 3. Dependencies
The system uses these additional packages:

```bash
npm install marked isomorphic-dompurify @types/marked
```

### 4. Start Development
```bash
npm run dev
```

Visit `http://localhost:3000/docs` to see the documentation system.

## 📝 Content Management

### Creating Documentation Pages

#### Via API (Programmatic)
```typescript
// Create page entity
const page = await createEntity({
  entity_type: 'doc_page',
  entity_name: 'Getting Started Guide',
  entity_code: 'getting-started',
  metadata: {
    doc_type: 'dev',
    section: 'Setup',
    order: 1,
    status: 'published'
  }
})

// Add markdown content
await createDynamicData({
  entity_id: page.id,
  field_name: 'content',
  field_type: 'text',
  field_value: '# Getting Started\n\nYour markdown content here...'
})
```

#### Via Database (Direct)
```sql
-- Create documentation page
INSERT INTO core_entities (entity_type, entity_name, entity_code, metadata)
VALUES ('doc_page', 'New Guide', 'new-guide', '{"doc_type": "dev", "status": "published"}');

-- Add content
INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value)
VALUES (page_id, 'content', 'text', '# Your Content Here');
```

### Navigation Structure
Use relationships to build navigation hierarchies:

```sql
INSERT INTO core_relationships (
  source_entity_id, 
  target_entity_id,
  relationship_type,
  relationship_data
) VALUES (
  parent_page_id,
  child_page_id, 
  'navigation_parent',
  '{"nav_order": 1, "display_in_sidebar": true}'
);
```

## 🔍 Search Functionality

The search system uses HERA's universal search with documentation-specific enhancements:

### Search Features
- **Full-text search** across all content
- **Filter by guide type** (dev/user)
- **Section filtering** 
- **Real-time suggestions**
- **Keyboard navigation**
- **Search analytics**

### Search API
```typescript
// Search all documentation
const results = await searchDocs("authentication")

// Search specific guide type
const devResults = await searchDocs("api setup", "dev")
```

## 📈 Analytics System

Track documentation usage via universal transactions:

### Tracked Metrics
- **Page Views** - Every page visit
- **Time on Page** - User engagement duration  
- **Scroll Depth** - How much users read
- **Search Queries** - What users search for
- **Popular Content** - Most accessed pages

### Analytics Dashboard
Visit `/docs/analytics` to view:
- Real-time usage statistics
- Popular pages and sections
- User engagement metrics
- Search analytics

## 🎯 Key Benefits

### 🔥 Revolutionary Advantages
- **Zero Additional Infrastructure** - Uses existing HERA system
- **Perfect Integration** - Same APIs, auth, and theme
- **Universal Search** - Leverages existing search capabilities  
- **Real-time Updates** - Content changes via HERA transactions
- **Enterprise Features** - Audit trails, permissions, analytics built-in
- **Infinite Flexibility** - Add new content types via dynamic data
- **AI-Powered** - Smart search, content suggestions, auto-categorization

### 💡 Business Value
- **Cost Effective** - No separate CMS to maintain
- **Consistent Experience** - Same UI/UX as main application
- **Single Source of Truth** - All data in one system
- **Audit Compliance** - Full change history via transactions
- **Multi-tenant Ready** - Separate docs per organization

## 🔧 Customization

### Theme Integration
The system automatically inherits your app's design system:
- HERA brand colors (`oklch` format)
- Custom utility classes (`.hera-card`, `.hera-button`)
- Dark/light mode support
- Responsive breakpoints

### Custom Components
Extend functionality by creating custom components:

```typescript
// Custom documentation widget
export function CustomDocWidget({ pageId }: { pageId: string }) {
  return (
    <div className="hera-card p-4">
      <h3>Custom Content</h3>
      {/* Your custom functionality */}
    </div>
  )
}
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Vercel Deployment
The system works seamlessly with Vercel:
- ISR (Incremental Static Regeneration) for performance
- Edge functions for search
- Automatic deployments

### Environment Variables
```bash
# Production environment
NEXT_PUBLIC_API_URL=https://your-domain.com
DATABASE_URL=your_production_db_url
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_secret
```

## 🤝 Contributing

### Adding New Features
1. Create components in `src/components/docs/`
2. Add API endpoints in `src/app/api/v1/`
3. Update HERA integration in `src/lib/hera-docs.ts`
4. Add documentation for new features

### Content Guidelines
- Use clear, concise language
- Include code examples
- Add screenshots for UI features
- Keep content up-to-date

## 📚 Sample Content

The system includes comprehensive sample content:

### Developer Guide
- Getting Started - Environment setup and core concepts
- Architecture Overview - HERA 6-table system deep dive
- Database Development - Working with universal tables
- API Development - Building robust APIs
- Testing Guide - Comprehensive testing strategies

### User Guide  
- Getting Started - Account setup and basic navigation
- Dashboard Overview - UI walkthrough and customization
- Core Features - Essential platform features
- Account Management - Profile and security settings

## 🏆 Best Practices

### Content Organization
- Use clear section hierarchies
- Maintain consistent naming conventions
- Include cross-references between guides
- Regular content audits and updates

### Performance Optimization
- Implement ISR for frequently accessed pages
- Use lazy loading for large content
- Optimize images and assets
- Monitor Core Web Vitals

### SEO Optimization
- Include meta descriptions
- Use semantic HTML structure
- Implement structured data
- Create XML sitemaps

---

**Built with ❤️ on HERA's Universal Architecture**

This documentation system demonstrates the power and flexibility of HERA's universal 6-table design - proving that you can build any business application, including sophisticated content management, without ever changing your database schema.