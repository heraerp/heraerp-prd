# Salon Module - Code Example Templates

This directory contains reusable code examples and templates for common Salon module development patterns.

## Directory Structure

```
examples/
├── README.md                           # This file
├── pages/                             # Page templates
│   ├── protected-page.tsx             # Standard protected page template
│   ├── dashboard-page.tsx             # Dashboard with progressive loading
│   ├── crud-page.tsx                  # CRUD page with list and form
│   └── mobile-first-page.tsx          # Mobile-first responsive page
├── components/                        # Component templates
│   ├── data-table.tsx                 # Responsive data table
│   ├── mobile-card.tsx                # Mobile-optimized card
│   ├── form-modal.tsx                 # Modal with form
│   ├── search-input.tsx               # Debounced search input
│   └── status-badge.tsx               # Status indicator
├── hooks/                             # Custom hook templates
│   ├── use-entity-crud.tsx            # Entity CRUD hook
│   ├── use-debounced-search.tsx       # Debounced search hook
│   └── use-optimistic-mutation.tsx    # Optimistic update hook
├── tests/                             # Test templates
│   ├── unit-test.test.ts              # Unit test template
│   ├── component-test.test.tsx        # Component test template
│   ├── e2e-test.spec.ts               # E2E test template
│   └── api-test.spec.ts               # API test template
└── patterns/                          # Common patterns
    ├── authentication.tsx             # Auth patterns
    ├── progressive-loading.tsx        # Progressive loading pattern
    ├── infinite-scroll.tsx            # Infinite scroll pattern
    └── optimistic-updates.tsx         # Optimistic update pattern
```

## Usage

Each template includes:
- Complete TypeScript implementation
- Inline comments explaining key concepts
- Usage examples
- Related documentation links

### Quick Start

1. **Copy a template** from the relevant directory
2. **Customize** for your specific feature
3. **Follow the inline comments** for guidance
4. **Refer to documentation** for detailed explanations

### Example: Creating a New Protected Page

```bash
# Copy the protected page template
cp docs/salon/examples/pages/protected-page.tsx src/app/salon/my-feature/page.tsx

# Customize the template for your feature
# Follow inline comments for guidance
```

## Template Categories

### Page Templates

**protected-page.tsx** - Standard protected page with authentication
- Three-layer security check
- Organization context
- Data fetching with React Query
- Mobile-first layout

**dashboard-page.tsx** - Dashboard with progressive loading
- 5-stage progressive loading
- Multiple data sources
- KPI cards and charts
- Real-time updates

**crud-page.tsx** - CRUD page with list and form
- Entity list with search
- Create/Edit modal form
- Optimistic updates
- Delete confirmation

**mobile-first-page.tsx** - Mobile-optimized page
- Responsive grid layout
- Touch-friendly interactions
- Mobile header with bottom navigation
- Desktop enhancement

### Component Templates

**data-table.tsx** - Responsive data table
- Mobile: Hidden (use cards instead)
- Desktop: Full table with sorting
- Pagination support
- Loading states

**mobile-card.tsx** - Mobile-optimized card
- Touch-friendly (44px targets)
- Active state feedback
- Vertical layout for mobile
- Horizontal layout for desktop

**form-modal.tsx** - Modal with form
- React Hook Form integration
- Zod validation
- Loading states
- Error handling

**search-input.tsx** - Debounced search
- 300ms debounce
- Clear button
- Loading indicator
- Keyboard shortcuts

**status-badge.tsx** - Status indicator
- Color-coded statuses
- Responsive sizing
- Icon support
- Tooltip on hover

### Hook Templates

**use-entity-crud.tsx** - Entity CRUD operations
- Complete CRUD with Universal API v2
- React Query integration
- Optimistic updates
- Error handling

**use-debounced-search.tsx** - Debounced search
- Configurable delay
- Query management
- Loading states
- Empty states

**use-optimistic-mutation.tsx** - Optimistic updates
- Immediate UI update
- Rollback on error
- Cache invalidation
- Success/error handling

### Test Templates

**unit-test.test.ts** - Unit test for business logic
- Vitest configuration
- Pure function testing
- Edge case coverage
- Clear assertions

**component-test.test.tsx** - Component testing
- React Testing Library
- User interaction testing
- Accessibility checks
- Mock dependencies

**e2e-test.spec.ts** - End-to-end test
- Playwright configuration
- Complete user flow
- Cross-browser testing
- Mobile viewport testing

**api-test.spec.ts** - API testing
- Playwright API testing
- Request/response validation
- Error handling
- Authentication testing

### Pattern Templates

**authentication.tsx** - Auth patterns
- useHERAAuth() usage
- Three-layer security check
- 401 redirect handling
- Organization context

**progressive-loading.tsx** - Progressive loading
- 5-stage loading pattern
- Suspense boundaries
- Skeleton loaders
- Performance optimization

**infinite-scroll.tsx** - Infinite scroll
- React Query infinite query
- Intersection observer
- Loading indicators
- End detection

**optimistic-updates.tsx** - Optimistic updates
- Mutation with optimistic update
- Cache manipulation
- Rollback on error
- Success confirmation

## Best Practices

### When to Use Templates

✅ **Use templates when**:
- Starting a new feature
- Following established patterns
- Ensuring consistency
- Learning the codebase

❌ **Don't blindly copy**:
- Understand the code first
- Customize for your use case
- Remove unused functionality
- Update comments

### Customization Guide

1. **Replace placeholder names** (e.g., `MyFeature` → `Customers`)
2. **Update entity types** (e.g., `ENTITY_TYPE` → `CUSTOMER`)
3. **Customize dynamic fields** for your data model
4. **Update Smart Codes** to match your feature
5. **Remove unused sections** to keep code clean

### Code Quality Checklist

- [ ] TypeScript types are correct
- [ ] ESLint passes with no errors
- [ ] Tests are included and passing
- [ ] Mobile-first responsive design
- [ ] Performance optimized
- [ ] Accessibility compliant
- [ ] Documentation comments added

## Related Documentation

- [Complete Developer Reference](../COMPLETE-DEVELOPER-REFERENCE.md) - Master documentation
- [Developer Guide](../DEVELOPER-GUIDE.md) - Getting started guide
- [Performance Guide](../technical/PERFORMANCE.md) - Performance optimization
- [Testing Guide](../technical/TESTING.md) - Testing strategies
- [Mobile Layout Guide](../technical/MOBILE-LAYOUT.md) - Mobile-first design

## Contributing

### Adding New Templates

When adding new templates:

1. **Create the template file** in the appropriate directory
2. **Add comprehensive comments** explaining each section
3. **Include usage examples** at the top of the file
4. **Link to relevant documentation**
5. **Update this README** with the new template

### Template Structure

Every template should include:

```typescript
/**
 * [Template Name]
 *
 * Description: [Brief description of what this template does]
 *
 * Usage:
 * ```
 * [Usage example code]
 * ```
 *
 * Features:
 * - [Feature 1]
 * - [Feature 2]
 *
 * Related Documentation:
 * - [Link to relevant docs]
 *
 * @example
 * [Complete working example]
 */

// Template code with inline comments
```

## Support

For questions about templates:
1. Check the [Complete Developer Reference](../COMPLETE-DEVELOPER-REFERENCE.md)
2. Review feature-specific documentation
3. Ask the development team
4. Submit an issue with the `documentation` label

---

**Last Updated**: January 2025
**Maintainer**: HERA Development Team
