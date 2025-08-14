# DocLayout Component

## Overview
The DocLayout component is the main layout container for the HERA documentation system. It provides a responsive layout with header navigation, sidebar, and main content area, ensuring a consistent user experience across all documentation pages.

## Usage
```typescript
import DocLayout from '@/components/docs/DocLayout'

export default function DocumentationPage() {
  const navigation = await getDocNavigation('dev')
  
  return (
    <DocLayout 
      navigation={navigation}
      docType="dev"
      currentPath="getting-started"
    >
      <article>
        <h1>Your Documentation Content</h1>
        <p>Content goes here...</p>
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
| docType | 'dev' \| 'user' | Yes | Type of documentation |
| currentPath | string | No | Current page path for highlighting |

## Features

### Responsive Design
- **Mobile First**: Optimized for mobile devices with collapsible sidebar
- **Tablet Support**: Adaptive layout for tablet screens
- **Desktop**: Full sidebar navigation with content area

### Header Components
- **Logo/Brand**: HERA documentation branding
- **Global Search**: Integrated search functionality
- **Guide Selector**: Switch between developer and user guides
- **Mobile Menu**: Hamburger menu for mobile navigation

### Sidebar Navigation
- **Hierarchical Tree**: Nested navigation structure
- **Active State**: Highlights current page
- **Collapsible Sections**: Expandable/collapsible navigation groups
- **Quick Links**: Direct access to important sections

### Content Area
- **Main Content**: Primary documentation content
- **Table of Contents**: Auto-generated page TOC (desktop only)
- **Breadcrumb Navigation**: Shows current location in hierarchy

## Implementation Details

### State Management
```typescript
const [sidebarOpen, setSidebarOpen] = useState(false)
const pathname = usePathname()
```

### Responsive Behavior
- **Mobile**: Sidebar is hidden by default, opens as overlay
- **Tablet**: Sidebar toggles visibility
- **Desktop**: Sidebar is always visible

### Navigation Integration
The component integrates with HERA's navigation system:

```typescript
// Navigation structure from HERA
interface NavigationItem {
  id: string
  title: string
  slug: string
  children?: NavigationItem[]
}
```

### Styling
Uses HERA design system:
- **Brand Colors**: HERA primary, secondary, and accent colors
- **Typography**: Consistent heading and body text styles
- **Spacing**: HERA spacing scale and grid system
- **Dark Mode**: Supports light/dark theme switching

## Accessibility Features

### Keyboard Navigation
- **Tab Order**: Logical tab sequence through navigation
- **Keyboard Shortcuts**: Standard navigation shortcuts
- **Focus Management**: Proper focus handling for sidebar toggle

### Screen Reader Support
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: Descriptive labels for interactive elements
- **Skip Links**: Allow bypassing navigation to main content

### Visual Accessibility
- **Color Contrast**: WCAG 2.1 AA compliant color ratios
- **Focus Indicators**: Clear focus states for all interactive elements
- **Text Scaling**: Supports browser text scaling up to 200%

## Performance Optimizations

### Code Splitting
- **Lazy Loading**: Navigation components loaded on demand
- **Bundle Optimization**: Minimal initial bundle size
- **Tree Shaking**: Unused code eliminated

### Memory Management
- **Event Cleanup**: Proper cleanup of event listeners
- **State Optimization**: Minimal state updates
- **Re-render Prevention**: Optimized component updates

## Integration Examples

### With Next.js App Router
```typescript
// app/docs/layout.tsx
export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  )
}

// app/docs/[type]/[...slug]/page.tsx
export default async function DocumentationPage({ params }) {
  const navigation = await getDocNavigation(params.type)
  
  return (
    <DocLayout 
      navigation={navigation}
      docType={params.type}
      currentPath={params.slug.join('/')}
    >
      <DocumentContent />
    </DocLayout>
  )
}
```

### With Static Generation
```typescript
// Generate static pages with layout
export async function generateStaticParams() {
  const pages = await getAllDocPages()
  return pages.map(page => ({
    type: page.docType,
    slug: page.slug.split('/')
  }))
}
```

## Customization

### Theme Integration
```typescript
// Custom CSS variables
.doc-layout {
  --header-height: 3.5rem;
  --sidebar-width: 240px;
  --content-max-width: 1200px;
}
```

### Custom Navigation
```typescript
// Custom navigation component
<DocLayout
  navigation={customNavigation}
  docType="custom"
  renderNavigation={(nav) => <MyCustomNav items={nav} />}
>
  {children}
</DocLayout>
```

## Testing

### Unit Tests
```typescript
import { render, screen } from '@testing-library/react'
import DocLayout from './DocLayout'

test('renders navigation and content', () => {
  const mockNavigation = [
    { id: '1', title: 'Getting Started', slug: 'getting-started' }
  ]
  
  render(
    <DocLayout navigation={mockNavigation} docType="dev">
      <div>Test Content</div>
    </DocLayout>
  )
  
  expect(screen.getByText('Test Content')).toBeInTheDocument()
  expect(screen.getByText('Getting Started')).toBeInTheDocument()
})
```

### Integration Tests
```typescript
test('navigation highlights current page', async () => {
  // Test active state functionality
})

test('mobile menu toggles correctly', async () => {
  // Test responsive behavior
})
```

## Styling Guidelines

### CSS Classes
- `.doc-layout`: Main layout container
- `.doc-header`: Header section
- `.doc-sidebar`: Sidebar navigation
- `.doc-content`: Main content area
- `.doc-mobile-overlay`: Mobile overlay

### Responsive Breakpoints
- **Mobile**: `max-width: 768px`
- **Tablet**: `768px - 1024px`
- **Desktop**: `min-width: 1024px`

*This component uses the HERA design system and follows established patterns for consistency across the application.*