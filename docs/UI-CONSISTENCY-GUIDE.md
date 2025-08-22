# UI Consistency Guide - Enterprise Standards

## 🎯 Core Principle: One Pattern, Used Everywhere

This guide ensures every developer uses the same enterprise-grade UI patterns, maintaining consistency across HERA.

## 1. 🏗️ Component Hierarchy

### Always Use These Components (Never Create Duplicates)

```typescript
// ✅ CORRECT - Use existing components
import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CurrencyDisplay, CurrencyInput } from '@/components/ui/currency-input'

// ❌ WRONG - Creating custom implementations
const MyCustomDialog = () => { ... } // Don't do this!
const CustomCurrencyInput = () => { ... } // Use CurrencyInput instead!
```

## 2. 📐 Modal/Dialog Standards

### Always Use This Pattern for Modals

```typescript
// ENTERPRISE MODAL PATTERN (Copy this!)
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px] max-h-[85vh] overflow-hidden flex flex-col">
    <DialogHeader className="flex-shrink-0">
      <DialogTitle>Title Here</DialogTitle>
      <DialogDescription>
        Description of what this modal does
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-1 -mx-1">
        <div className="space-y-6 pb-4">
          {/* Form fields go here */}
        </div>
      </div>

      {/* Sticky Footer */}
      <DialogFooter className="flex-shrink-0 border-t pt-4 mt-2 bg-background sticky bottom-0">
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Modal Size Guidelines

| Content Type | Class to Use | Max Width |
|-------------|--------------|-----------|
| Simple form (1-5 fields) | `max-w-md` | 448px |
| Standard form (6-10 fields) | `sm:max-w-[700px]` | 700px |
| Complex form (10+ fields) | `sm:max-w-[700px] lg:max-w-[900px]` | 900px |
| Full-screen content | `max-w-[95vw]` | 95% viewport |

## 3. 📝 Form Field Organization

### Group Related Fields with Sections

```typescript
// ALWAYS group fields logically
<div className="space-y-6">
  {/* Section 1: Basic Information */}
  <div className="space-y-4">
    <h3 className="text-sm font-semibold text-muted-foreground">
      Basic Information
    </h3>
    <div className="space-y-4">
      {/* Fields */}
    </div>
  </div>

  {/* Section 2: Financial Settings */}
  <div className="space-y-4 pt-4 border-t">
    <h3 className="text-sm font-semibold text-muted-foreground">
      Financial Settings
    </h3>
    <div className="space-y-4">
      {/* Fields */}
    </div>
  </div>
</div>
```

## 4. 💰 Currency Handling

### NEVER Hardcode Currency Symbols

```typescript
// ❌ WRONG - Hardcoded currency
<span>${amount}</span>
<Input placeholder="Price ($)" />

// ✅ CORRECT - Dynamic currency
import { CurrencyDisplay, CurrencyInput } from '@/components/ui/currency-input'
import { useOrganizationCurrency } from '@/hooks/use-organization-currency'

<CurrencyDisplay value={amount} />
<CurrencyInput 
  value={price} 
  onChange={(value) => setPrice(value)} 
/>
```

## 5. 🎨 Configuration Pages Pattern

### Use UniversalConfigManager for ALL Configuration Pages

```typescript
// STANDARD CONFIGURATION PAGE TEMPLATE
'use client'

import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { CONFIG_TYPES } from '@/lib/universal-config/config-factory'

export default function ConfigurationPage() {
  return (
    <div className="container mx-auto p-6">
      <UniversalConfigManager
        config={CONFIG_TYPES.YOUR_TYPE}
        apiEndpoint="/api/v1/your-endpoint"
        additionalFields={[
          // Group 1: Basic fields
          {
            name: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Enter description'
          },
          // Group 2: Settings
          {
            name: 'is_active',
            label: 'Active',
            type: 'checkbox',
            defaultValue: true
          }
        ]}
        customColumns={[
          {
            key: 'status',
            header: 'Status',
            render: (item) => (
              <Badge variant={item.is_active ? 'default' : 'secondary'}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Badge>
            )
          }
        ]}
        showAnalytics={true}
        analyticsConfig={{
          title: 'Analytics',
          metrics: [
            {
              label: 'Total Items',
              value: (items) => items.length
            }
          ]
        }}
      />
    </div>
  )
}
```

## 6. 📊 Table Standards

### Always Use This Table Pattern

```typescript
// ENTERPRISE TABLE PATTERN
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

<Card>
  <CardContent className="p-0">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center py-8">
              <Spinner />
            </TableCell>
          </TableRow>
        ) : items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={3} className="text-center py-8">
              No items found
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                <Badge>{item.status}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

## 7. 🔄 Loading States

### Consistent Loading Patterns

```typescript
// LOADING PATTERN 1: Full Page
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// LOADING PATTERN 2: Inline
{loading ? (
  <div className="animate-pulse">Loading...</div>
) : (
  <YourContent />
)}

// LOADING PATTERN 3: Button
<Button disabled={isSubmitting}>
  {isSubmitting ? (
    <>
      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      Processing...
    </>
  ) : (
    'Submit'
  )}
</Button>
```

## 8. 🎯 Form Validation & Error Handling

### Standard Error Display

```typescript
// Field-level errors
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input 
    id="email" 
    type="email"
    className={errors.email ? 'border-destructive' : ''}
  />
  {errors.email && (
    <p className="text-sm text-destructive">{errors.email}</p>
  )}
</div>

// Toast notifications for actions
import { useToast } from '@/components/ui/use-toast'

const { toast } = useToast()

// Success
toast({
  title: 'Success',
  description: 'Item created successfully',
})

// Error
toast({
  title: 'Error',
  description: 'Failed to create item',
  variant: 'destructive',
})
```

## 9. 📱 Responsive Design

### Mobile-First Approach

```typescript
// RESPONSIVE GRID PATTERN
<div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>

// RESPONSIVE SPACING
<div className="p-4 md:p-6 lg:p-8">
  {/* Content */}
</div>

// RESPONSIVE TEXT
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Title
</h1>
```

## 10. 🎨 Color & Theme Consistency

### Use Semantic Colors

```typescript
// ✅ CORRECT - Semantic colors
<div className="bg-background text-foreground">
  <div className="bg-muted text-muted-foreground">
    <Button variant="destructive">Delete</Button>
  </div>
</div>

// ❌ WRONG - Hardcoded colors
<div className="bg-white text-black">
  <div className="bg-gray-100 text-gray-600">
    <Button className="bg-red-500">Delete</Button>
  </div>
</div>
```

## 11. 🔧 Enforcement Tools

### 1. ESLint Rules

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-imports': ['error', {
      patterns: ['*/components/ui/*'],
      message: 'Import from @/components/ui instead'
    }],
    'no-hardcoded-currency': ['error'],
  }
}
```

### 2. Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run ui:validate"
    }
  },
  "scripts": {
    "ui:validate": "node scripts/validate-ui-patterns.js"
  }
}
```

### 3. Component Generator

```bash
# Generate consistent components
npm run generate:page -- --name="staff-schedule" --type="config"
npm run generate:modal -- --name="edit-appointment" --fields=5
```

## 12. 📋 Checklist for Every UI Component

Before committing any UI code, verify:

- [ ] Uses existing UI components (no duplicates)
- [ ] Follows modal pattern for dialogs
- [ ] Groups form fields with sections
- [ ] Uses CurrencyInput/Display for money
- [ ] Has proper loading states
- [ ] Shows error states correctly
- [ ] Is mobile responsive
- [ ] Uses semantic colors (not hardcoded)
- [ ] Has proper TypeScript types
- [ ] Includes accessibility attributes

## 13. 🚨 Common Mistakes to Avoid

### 1. Creating Custom Modals
```typescript
// ❌ WRONG
const MyModal = ({ children }) => (
  <div className="fixed inset-0 bg-black/50">
    {children}
  </div>
)

// ✅ CORRECT
import { Dialog, DialogContent } from '@/components/ui/dialog'
```

### 2. Inconsistent Spacing
```typescript
// ❌ WRONG - Mixed spacing
<div className="space-y-2">
  <div className="mb-4">...</div>
  <div style={{ marginBottom: '8px' }}>...</div>
</div>

// ✅ CORRECT - Consistent spacing
<div className="space-y-4">
  <div>...</div>
  <div>...</div>
</div>
```

### 3. Hardcoded Sizes
```typescript
// ❌ WRONG
<Dialog style={{ width: '800px' }}>

// ✅ CORRECT
<DialogContent className="sm:max-w-[800px]">
```

## 14. 🎯 Quick Reference

```typescript
// IMPORT THESE ALWAYS
import { UniversalConfigManager } from '@/components/universal-config/UniversalConfigManager'
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { CurrencyInput, CurrencyDisplay } from '@/components/ui/currency-input'
import { useOrganizationCurrency } from '@/hooks/use-organization-currency'

// PATTERNS TO MEMORIZE
// 1. Modal: max-h-[85vh] overflow-hidden flex flex-col
// 2. Form: flex-1 overflow-y-auto for content, sticky footer
// 3. Loading: animate-spin border-4 border-primary border-t-transparent
// 4. Currency: Always use CurrencyInput/Display components
// 5. Sections: space-y-6 with h3 headers for grouping
```

## Conclusion

Consistency is achieved through:
1. **Using existing components** - Never recreate what exists
2. **Following patterns** - Copy from this guide
3. **Automated validation** - Tools catch mistakes
4. **Code reviews** - Team ensures standards
5. **Documentation** - This guide as reference

**Remember**: When in doubt, find an existing example in the codebase and copy its pattern!