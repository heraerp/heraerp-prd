# HERA Universal Sidebar - Usage Guide

The HERA Sidebar DNA component provides a reusable, feature-rich sidebar layout for any HERA application.

## Features

- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Apps Modal** - Expandable apps grid with search
- ✅ **Customizable Theming** - Gradients and colors
- ✅ **Bottom Widget** - Display key metrics
- ✅ **Badge Support** - Show counts and statuses
- ✅ **Active State Detection** - Automatic route highlighting
- ✅ **Header Customization** - Add custom header content

## Basic Usage

```tsx
import { HeraSidebar } from '@/lib/dna/components/layout/hera-sidebar-dna'
import { 
  LayoutDashboard, 
  Package, 
  DollarSign,
  Building 
} from 'lucide-react'

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/myapp', 
    icon: LayoutDashboard 
  },
  { 
    name: 'Inventory', 
    href: '/myapp/inventory', 
    icon: Package,
    badge: '3'
  },
  { 
    name: 'Financial', 
    href: '/myapp/financial', 
    icon: DollarSign,
    badge: 'New',
    badgeVariant: 'secondary'
  },
]

export default function MyAppLayout({ children }) {
  return (
    <HeraSidebar
      title="My Business"
      subtitle="ERP System"
      logo={Building}
      navigation={navigation}
    >
      {children}
    </HeraSidebar>
  )
}
```

## Advanced Usage with Apps Modal

```tsx
const additionalApps = [
  {
    name: 'Analytics Chat',
    icon: MessageSquare,
    href: '/analytics-chat',
    description: 'AI-powered insights',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    name: 'Warehouse',
    icon: Warehouse,
    href: '/myapp/warehouse',
    description: 'Warehouse operations',
    color: 'from-orange-500 to-red-600'
  }
]

<HeraSidebar
  title="My Business"
  subtitle="Manufacturing"
  logo={Factory}
  navigation={navigation}
  additionalApps={additionalApps}
  theme={{
    primary: 'from-blue-500 to-purple-600',
    sidebar: 'from-gray-900 to-gray-950',
    accent: 'from-blue-500 to-purple-600'
  }}
  bottomWidget={{
    title: "Today's Revenue",
    value: "$12,345",
    subtitle: "+15% from yesterday",
    icon: TrendingUp,
    gradient: 'from-green-500 to-emerald-600'
  }}
>
  {children}
</HeraSidebar>
```

## Real-World Examples

### Ice Cream Manufacturing
```tsx
import { HeraSidebar } from '@/lib/dna'
import { Snowflake, Activity } from 'lucide-react'

const iceCreamNav = [
  { name: 'Dashboard', href: '/icecream', icon: LayoutDashboard },
  { name: 'Production', href: '/icecream/production', icon: Factory },
  { name: 'Quality Control', href: '/icecream/quality', icon: FlaskConical, badge: '3' },
  { name: 'Financial', href: '/icecream-financial', icon: DollarSign, badge: 'New', badgeVariant: 'secondary' },
]

<HeraSidebar
  title="Kochi Ice Cream"
  subtitle="Manufacturing ERP"
  logo={Snowflake}
  navigation={iceCreamNav}
  theme={{
    primary: 'from-pink-500 to-purple-600',
    sidebar: 'from-gray-900 to-gray-950',
    accent: 'from-pink-500 to-purple-600'
  }}
  bottomWidget={{
    title: "Today's Production",
    value: "1,420 L",
    subtitle: "97.93% efficiency",
    icon: Activity,
    gradient: 'from-cyan-500 to-blue-600'
  }}
>
  {children}
</HeraSidebar>
```

### Healthcare Clinic
```tsx
const healthcareNav = [
  { name: 'Dashboard', href: '/clinic', icon: LayoutDashboard },
  { name: 'Patients', href: '/clinic/patients', icon: Users, badge: '127' },
  { name: 'Appointments', href: '/clinic/appointments', icon: Calendar, badge: '8' },
  { name: 'Pharmacy', href: '/clinic/pharmacy', icon: Pill },
  { name: 'Billing', href: '/clinic/billing', icon: CreditCard },
]

<HeraSidebar
  title="City Medical Center"
  subtitle="Healthcare ERP"
  logo={Heart}
  navigation={healthcareNav}
  theme={{
    primary: 'from-red-500 to-pink-600',
    sidebar: 'from-gray-900 to-gray-950',
    accent: 'from-red-500 to-pink-600'
  }}
  bottomWidget={{
    title: "Patients Today",
    value: "42",
    subtitle: "6 waiting",
    icon: Users,
    gradient: 'from-blue-500 to-cyan-600'
  }}
>
  {children}
</HeraSidebar>
```

## Props Reference

### Required Props
- `title` (string) - Main title for the sidebar
- `logo` (LucideIcon) - Icon component for the logo
- `navigation` (HeraSidebarNavItem[]) - Array of navigation items
- `children` (React.ReactNode) - Page content

### Optional Props
- `subtitle` (string) - Subtitle text below title
- `additionalApps` (HeraSidebarApp[]) - Apps for the modal
- `theme` (object) - Theming configuration
- `bottomWidget` (object) - Bottom widget configuration
- `headerContent` (React.ReactNode) - Custom header content

## Navigation Item Structure
```typescript
interface HeraSidebarNavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string | number
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
}
```

## Additional App Structure
```typescript
interface HeraSidebarApp {
  name: string
  icon: LucideIcon
  href: string
  description: string
  color: string // Gradient classes e.g. "from-blue-500 to-cyan-600"
}
```

## Theme Configuration
```typescript
interface Theme {
  primary?: string    // Logo gradient
  sidebar?: string    // Sidebar background gradient
  accent?: string     // Active state gradient
}
```

## Bottom Widget Configuration
```typescript
interface BottomWidget {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  gradient?: string
}
```

## Benefits

1. **Consistency** - Same sidebar experience across all HERA apps
2. **Rapid Development** - No need to rebuild sidebar for each module
3. **Maintainability** - Update once, apply everywhere
4. **Accessibility** - Built-in keyboard navigation and ARIA labels
5. **Performance** - Optimized rendering and lazy loading
6. **Customization** - Theme and configure for any industry

## Migration Guide

To migrate an existing layout to use HeraSidebar:

1. Import the component:
   ```tsx
   import { HeraSidebar } from '@/lib/dna'
   ```

2. Convert your navigation array to the required format

3. Replace your sidebar implementation with HeraSidebar

4. Add any additional apps to the apps modal

5. Configure theme and widgets as needed

The HERA Sidebar DNA component is now the standard for all HERA applications, ensuring consistency and rapid development across the platform.