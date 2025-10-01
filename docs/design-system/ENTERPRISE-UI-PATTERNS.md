# Enterprise UI Design Patterns for HERA

This document defines the enterprise-grade UI patterns that should be applied to all pages in HERA, especially new pages. These patterns ensure proper color contrast, accessibility, and professional appearance.

## Table of Contents
1. [Color System](#color-system)
2. [Typography](#typography)
3. [Card Design](#card-design)
4. [Interactive Elements](#interactive-elements)
5. [Page Layout](#page-layout)
6. [Status Indicators](#status-indicators)
7. [Code Examples](#code-examples)

## Color System

### Text Colors
Always use explicit light/dark mode colors for better contrast:

```tsx
// Primary Text
className="text-gray-900 dark:text-gray-100"

// Secondary Text  
className="text-gray-700 dark:text-gray-300"

// Tertiary Text
className="text-gray-600 dark:text-gray-400"

// Headings
className="text-gray-900 dark:text-gray-100"

// Descriptions
className="text-gray-700 dark:text-gray-300"
```

### Background Colors
```tsx
// Page Background
className="bg-gray-50 dark:bg-gray-950"

// Card Background
className="bg-white dark:bg-gray-900"

// Hover States
className="hover:bg-gray-100 dark:hover:bg-gray-800"
```

### Border Colors
```tsx
// Default Borders
className="border-gray-200 dark:border-gray-700"

// Active/Selected Borders
className="border-blue-300 dark:border-blue-700"
```

## Typography

### Headings
```tsx
// Page Title
<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Page Title</h1>

// Page Subtitle
<p className="text-gray-600 dark:text-gray-400 mt-1">
  Page description text
</p>

// Section Headers
<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Section Title</h2>

// Card Titles
<CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
  Card Title
</CardTitle>

// Small Headers (Stats, etc)
<h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
  METRIC NAME
</h3>
```

### Body Text
```tsx
// Regular Text
<p className="text-gray-700 dark:text-gray-300">Body text content</p>

// Small Text
<span className="text-sm text-gray-600 dark:text-gray-400">Supporting text</span>

// Feature Lists
<li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
  <span className="font-semibold text-gray-600 dark:text-gray-400">•</span>
  <span>Feature description</span>
</li>
```

## Card Design

### Basic Card
```tsx
<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
  <CardHeader>
    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
      Card Title
    </CardTitle>
    <CardDescription className="text-gray-700 dark:text-gray-300">
      Card description text
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Interactive Card
```tsx
<Card className={cn(
  "relative overflow-hidden transition-all duration-200 hover:shadow-lg",
  "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
  isActive && "ring-2 ring-blue-500/20 border-blue-300 dark:border-blue-700"
)}>
  {/* Card content */}
</Card>
```

### Stat Card
```tsx
<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
      Metric Name
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
      <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">123</span>
      <span className="text-sm text-gray-600 dark:text-gray-400">units</span>
    </div>
  </CardContent>
</Card>
```

## Interactive Elements

### Buttons
```tsx
// Primary Button (with vendor color)
<Button className={cn(
  "font-semibold",
  vendorColor, // e.g., "bg-blue-600"
  darkVendorColor, // e.g., "dark:bg-blue-700"
  "text-white hover:opacity-90"
)}>
  Primary Action
</Button>

// Secondary Button
<Button
  variant="outline"
  className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
>
  Secondary Action
</Button>

// Ghost Button
<Button
  variant="ghost"
  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
>
  Ghost Action
</Button>
```

### Dropdowns
```tsx
<DropdownMenuContent align="end" className="w-48">
  <DropdownMenuItem className="text-gray-700 dark:text-gray-300">
    <Icon className="h-4 w-4 mr-2" />
    Menu Item
  </DropdownMenuItem>
  <DropdownMenuItem className="text-red-600 dark:text-red-400">
    <Icon className="h-4 w-4 mr-2" />
    Destructive Action
  </DropdownMenuItem>
</DropdownMenuContent>
```

### Form Elements
```tsx
// Input
<Input 
  className="bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100"
/>

// Label
<Label className="text-gray-700 dark:text-gray-300">Field Label</Label>

// Help Text
<p className="text-sm text-gray-600 dark:text-gray-400">
  Helper text for the field
</p>
```

## Page Layout

### Basic Page Structure
```tsx
export default function PageName() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Page Title
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Page description
              </p>
            </div>
            <Button variant="outline" className="...">
              Action
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Cards or content */}
        </div>
      </div>
    </div>
  )
}
```

## Status Indicators

### Status Badges
```tsx
// Success
<Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
  <CheckCircle className="h-3 w-3" />
  Connected
</Badge>

// Warning
<Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
  <Clock className="h-3 w-3" />
  Pending
</Badge>

// Error
<Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
  <XCircle className="h-3 w-3" />
  Error
</Badge>

// Info
<Badge className="gap-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800">
  <Info className="h-3 w-3" />
  Information
</Badge>
```

### Alert/Info Cards
```tsx
<Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-blue-200 dark:border-blue-800">
  <CardHeader>
    <div className="flex items-start gap-3">
      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
        <AlertCircle className="h-5 w-5 text-blue-700 dark:text-blue-300" />
      </div>
      <div className="space-y-1">
        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Information Title
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          Information description
        </CardDescription>
      </div>
    </div>
  </CardHeader>
  <CardContent>
    <ul className="space-y-3 text-sm">
      <li className="flex items-start gap-3">
        <span className="text-blue-600 dark:text-blue-400 font-semibold mt-0.5">→</span>
        <span className="text-gray-700 dark:text-gray-300">
          Information point
        </span>
      </li>
    </ul>
  </CardContent>
</Card>
```

## Code Examples

### Complete Component Example
```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function EnterpriseCard({ 
  title, 
  description, 
  status,
  children 
}: {
  title: string
  description: string
  status: 'active' | 'pending' | 'error'
  children: React.ReactNode
}) {
  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <Badge className="gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            Active
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            Pending
          </Badge>
        )
      case 'error':
        return (
          <Badge className="gap-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
            Error
          </Badge>
        )
    }
  }

  return (
    <Card className={cn(
      "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
      "transition-all duration-200 hover:shadow-lg"
    )}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-300 mt-1">
              {description}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="text-gray-700 dark:text-gray-300">
        {children}
      </CardContent>
    </Card>
  )
}
```

## Quick Reference

### Always Use These Classes

| Element | Light Mode | Dark Mode | Combined Class |
|---------|------------|-----------|----------------|
| Page Background | `bg-gray-50` | `dark:bg-gray-950` | `bg-gray-50 dark:bg-gray-950` |
| Card Background | `bg-white` | `dark:bg-gray-900` | `bg-white dark:bg-gray-900` |
| Primary Text | `text-gray-900` | `dark:text-gray-100` | `text-gray-900 dark:text-gray-100` |
| Secondary Text | `text-gray-700` | `dark:text-gray-300` | `text-gray-700 dark:text-gray-300` |
| Muted Text | `text-gray-600` | `dark:text-gray-400` | `text-gray-600 dark:text-gray-400` |
| Borders | `border-gray-200` | `dark:border-gray-700` | `border-gray-200 dark:border-gray-700` |

### Key Principles

1. **Explicit Colors**: Always specify both light and dark mode colors
2. **Sufficient Contrast**: Use 700/300 or 900/100 combinations for text
3. **Consistent Borders**: Use gray-200/700 for default, blue-300/700 for active
4. **Hover States**: Always include hover states for interactive elements
5. **Professional Spacing**: Use consistent padding and margins
6. **Semantic Colors**: Use emerald for success, amber for warning, red for error

## Migration Guide

When updating existing pages:

1. Replace `text-muted-foreground` with explicit `text-gray-600 dark:text-gray-400`
2. Add backgrounds to cards: `bg-white dark:bg-gray-900`
3. Update borders from `gray-800` to `gray-700` in dark mode
4. Ensure all text has sufficient contrast (minimum 700/300)
5. Add page background wrapper with `bg-gray-50 dark:bg-gray-950`

Remember: The goal is to create a professional, accessible, and consistent user experience across all pages in HERA.