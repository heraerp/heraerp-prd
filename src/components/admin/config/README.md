# HERA Admin Configuration Components

This directory contains admin UI components for managing Universal Configuration Rules using HERA's glassmorphism design system with dark mode support.

## Components

### RulesList

A comprehensive table view component for displaying and managing configuration rules.

**Features:**

- Advanced search and filtering capabilities
- Sortable columns with visual indicators
- Performance metrics (success rate, application count, errors)
- Rule status and priority management
- Action buttons for view, edit, and delete operations
- Summary statistics cards
- Glassmorphism design with backdrop blur effects
- Full dark mode support

**Usage:**

```tsx
import { RulesList } from '@/components/admin/config'
;<RulesList
  onEditRule={rule => console.log('Edit:', rule)}
  onDeleteRule={ruleId => console.log('Delete:', ruleId)}
  onViewRule={rule => console.log('View:', rule)}
  onCreateRule={() => console.log('Create new rule')}
/>
```

### RuleEditor

A comprehensive form component for creating and editing configuration rules.

**Features:**

- Tabbed interface (Basic Info, Conditions, Actions, Configuration)
- Dynamic condition and action builders
- Real-time smart code generation
- Form validation with error display
- Advanced configuration options
- Glassmorphism cards with smooth animations
- Full accessibility support

**Usage:**

```tsx
import { RuleEditor } from '@/components/admin/config'
;<RuleEditor
  rule={existingRule} // Optional for editing
  onSave={rule => console.log('Save:', rule)}
  onCancel={() => console.log('Cancel')}
/>
```

### RulePreview

An advanced preview and testing component for configuration rules.

**Features:**

- Rule overview with visual condition/action display
- Interactive testing with custom data input
- Real-time execution simulation
- Detailed results with condition evaluation
- Execution logs and performance metrics
- Test history tracking
- JSON formatting and validation

**Usage:**

```tsx
import { RulePreview } from '@/components/admin/config'
;<RulePreview rule={ruleToPreview} onClose={() => console.log('Close preview')} />
```

## Design System

All components follow HERA's glassmorphism design system with:

### Glass Effects

- `backdrop-blur-xl` for glass morphism effect
- Semi-transparent backgrounds: `bg-white/50 dark:bg-gray-900/50`
- Subtle borders: `border-white/20 dark:border-gray-700/30`
- Layered depth with box shadows

### Dark Mode Support

- Automatic theme switching with proper contrast
- HERA DNA text color fixes: `!text-gray-900 dark:!text-gray-100`
- Dark mode optimized glass effects
- Consistent component theming

### Color System

- **Primary**: Blue-to-cyan gradients (`from-blue-600 to-cyan-600`)
- **Status Colors**:
  - Active: Emerald (`bg-emerald-100 text-emerald-800`)
  - Warning: Amber (`bg-amber-100 text-amber-800`)
  - Error: Red (`bg-red-100 text-red-800`)
  - Info: Blue (`bg-blue-100 text-blue-800`)

### Typography

- Proper text contrast with `!important` modifiers where needed
- HERA brand font stack with Inter fallback
- Semantic heading hierarchy
- Monospace font for code elements

## Universal Configuration Rules

### Rule Structure

```typescript
interface ConfigRule {
  id?: string
  name: string
  category: string
  type: 'validation' | 'transformation' | 'business_logic' | 'integration'
  scope: 'global' | 'organization' | 'entity_type' | 'specific'
  status: 'active' | 'inactive' | 'draft' | 'deprecated'
  priority: number // 1-10 priority scale
  description: string
  smart_code: string // HERA smart code format
  conditions: ConditionArray
  actions: ActionArray
  configuration: ConfigObject
}
```

### Smart Code Format

Rules follow HERA's smart code convention:

```
HERA.{CATEGORY}.{TYPE}.{NAME}.v{VERSION}
```

Example: `HERA.CRM.VALIDATION.CREDIT.LIMIT.v1`

### Condition Operators

- **Comparison**: `==`, `!=`, `>`, `<`, `>=`, `<=`
- **String**: `contains`, `starts_with`, `ends_with`, `regex`
- **List**: `in`, `not_in`

### Action Types

- **validate**: Data validation actions
- **transform**: Data transformation operations
- **calculate**: Mathematical calculations
- **notify**: Notification triggers
- **log**: Logging operations
- **execute**: Custom code execution

## Integration

These components integrate with HERA's universal architecture:

### Multi-Tenant Support

- Organization-based rule scoping
- Proper data isolation
- Context-aware rule application

### Universal API Integration

- RESTful endpoints for CRUD operations
- Real-time validation and testing
- Performance monitoring integration

### Smart Code Integration

- Automatic smart code generation
- Business intelligence context
- Cross-module rule relationships

## Performance Considerations

### Optimization Features

- Lazy loading for large rule sets
- Virtualized table rows for performance
- Debounced search and filtering
- Optimistic UI updates

### Monitoring Integration

- Rule execution performance tracking
- Success rate analytics
- Error rate monitoring
- Application count metrics

## Accessibility

All components follow WCAG AA guidelines:

- Proper ARIA labels and roles
- Keyboard navigation support
- High contrast mode compatibility
- Screen reader optimization
- Focus management and visual indicators

## Testing

Components include comprehensive testing capabilities:

- Unit tests for all component logic
- Integration tests with mock API
- Accessibility testing with axe-core
- Visual regression testing
- Performance benchmarking

## Browser Support

- Modern browsers with ES2020 support
- Backdrop-filter support for glass effects
- CSS Grid and Flexbox support
- Dark mode media query support

---

Built with ❤️ using HERA's universal architecture and glassmorphism design system.
