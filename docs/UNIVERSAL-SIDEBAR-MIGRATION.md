# Universal Sidebar & Theme Migration Guide

## Overview
The Universal Sidebar provides a consistent, beautiful navigation experience across all HERA modules with customizable color themes inspired by the salon module's pink/purple gradient design.

## Quick Start

### 1. Use Universal Layout (Recommended)

Create a layout file for your module:

```tsx
// app/[module]/layout.tsx
'use client'

import { UniversalLayout } from '@/components/layout/UniversalLayout'
import { Heart, Calendar, Users } from 'lucide-react'
import { getModuleTheme } from '@/lib/theme/module-themes'

const theme = getModuleTheme('healthcare') // or 'salon', 'finance', 'restaurant', etc.

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Heart className="w-5 h-5" />,
    href: '/healthcare',
    badge: '5', // optional
    color: 'hover:bg-blue-100' // optional hover color
  },
  // ... more items
]

const quickActions = [
  {
    id: 'new-appointment',
    label: 'Book Appointment',
    icon: <Calendar className="w-5 h-5" />,
    href: '/healthcare/appointments?action=new',
    color: 'hover:bg-blue-100',
    description: 'Schedule patient appointment'
  },
  // ... more actions
]

export default function HealthcareLayout({ children }) {
  return (
    <UniversalLayout
      title="Health Pro"
      subtitle="Medical Center"
      icon={Heart}
      sidebarItems={sidebarItems}
      quickActions={quickActions}
      {...theme} // spreads brandGradient, accentGradient, backgroundGradient
      baseUrl="/healthcare"
    >
      {children}
    </UniversalLayout>
  )
}
```

### 2. Available Themes

| Module | Primary | Secondary | Use Case |
|--------|---------|-----------|----------|
| `salon` | Pink | Purple | Beauty, Fashion, Cosmetics |
| `healthcare` | Blue | Cyan | Medical, Health, Wellness |
| `finance` | Green | Emerald | Banking, Accounting, Money |
| `restaurant` | Orange | Red | Food, Dining, Hospitality |
| `professional` | Indigo | Violet | Consulting, Services |
| `manufacturing` | Teal | Blue | Industry, Production |
| `retail` | Yellow | Amber | Shopping, E-commerce |
| `creative` | Purple | Pink | Design, Art, Media |
| `default` | Gray | Slate | Corporate, General |

### 3. Using Themed Components

```tsx
import { ThemedButton } from '@/components/ui/themed-button'
import { ThemedCard, ThemedCardHeader, ThemedCardTitle } from '@/components/ui/themed-card'

// Gradient button (uses module theme automatically)
<ThemedButton gradient>
  Create New
</ThemedButton>

// Themed card with gradient background
<ThemedCard gradient hover>
  <ThemedCardHeader>
    <ThemedCardTitle>Welcome</ThemedCardTitle>
  </ThemedCardHeader>
</ThemedCard>
```

### 4. Custom Theme Colors

You can also use custom colors:

```tsx
<UniversalLayout
  title="Custom Pro"
  icon={Star}
  sidebarItems={items}
  brandGradient="from-rose-400 to-pink-600"
  accentGradient="from-rose-50/90 to-pink-50/90"
  backgroundGradient="from-rose-50 via-pink-50 to-white"
  baseUrl="/custom"
>
  {children}
</UniversalLayout>
```

## Features

### Sidebar Features
- **Expandable**: Hovering expands the sidebar with smooth animations
- **Tooltips**: Icons show tooltips when sidebar is collapsed
- **Badges**: Support for notification badges on menu items
- **Quick Actions**: Modal with quick action buttons
- **Active State**: Visual indicator for current page
- **Gradient Design**: Beautiful gradient backgrounds matching module theme
- **Responsive**: Works on all screen sizes

### Theme Features
- **Automatic Detection**: Theme is selected based on current module
- **Consistent Gradients**: Brand, accent, and background gradients
- **Hover States**: Module-specific hover colors
- **Themed Components**: Buttons and cards that match the module

## Migration Steps

### From SalonProductionSidebar
1. Replace `SalonProductionSidebar` import with `UniversalLayout`
2. Move sidebar items to layout configuration
3. Apply salon theme: `const theme = getModuleTheme('salon')`

### From Other Sidebars
1. Extract navigation items to `sidebarItems` array
2. Create layout wrapper using `UniversalLayout`
3. Choose appropriate theme or create custom colors
4. Update page components to remove duplicate navigation

## Best Practices

1. **Consistent Icons**: Use Lucide React icons (same size: w-5 h-5)
2. **Meaningful Badges**: Use for counts, status, or important indicators
3. **Logical Grouping**: Order items by frequency of use
4. **Quick Actions**: Include 4-6 most common tasks
5. **Color Coding**: Use theme-appropriate hover colors
6. **Descriptive Labels**: Keep labels short but clear

## Examples in Repository

- **Salon**: Pink/Purple gradient (original design)
- **Healthcare**: Blue/Cyan for medical feel
- **Finance**: Green/Emerald for money/growth
- **Restaurant**: Orange/Red for warmth/appetite

Each layout demonstrates the same beautiful design with module-appropriate colors!