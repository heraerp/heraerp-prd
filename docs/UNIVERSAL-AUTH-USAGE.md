# Universal Authentication System Usage Guide

The HERA Universal Authentication System provides reusable authentication components that work across all HERA applications.

## Core Components

### 1. UniversalAuthenticatedLayout
The main authentication wrapper component with full customization options.

### 2. withUniversalAuth HOC
Higher-order component for wrapping page components with authentication.

### 3. App-Specific Auth Layouts
Pre-configured authentication layouts for each HERA application.

## Usage Examples

### Option 1: Using App-Specific Layouts (Recommended)

#### Salon Application
```tsx
// src/app/salon/layout.tsx
import { SalonAuthLayout } from '@/components/auth/app-layouts'
import { ToastProvider } from '@/components/ui/use-toast'

export default function SalonLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <SalonAuthLayout>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </SalonAuthLayout>
    </ToastProvider>
  )
}
```

#### Restaurant Application
```tsx
// src/app/restaurant/layout.tsx
import { RestaurantAuthLayout } from '@/components/auth/app-layouts'

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  return (
    <RestaurantAuthLayout>
      {/* Your restaurant app content */}
      {children}
    </RestaurantAuthLayout>
  )
}
```

#### Healthcare Application
```tsx
// src/app/healthcare/layout.tsx
import { HealthcareAuthLayout } from '@/components/auth/app-layouts'

export default function HealthcareLayout({ children }: { children: React.ReactNode }) {
  return (
    <HealthcareAuthLayout requiredRole={['admin', 'doctor', 'nurse']}>
      {/* Your healthcare app content */}
      {children}
    </HealthcareAuthLayout>
  )
}
```

### Option 2: Using Universal Layout Directly

```tsx
// For custom applications
import { UniversalAuthenticatedLayout } from '@/components/auth/UniversalAuthenticatedLayout'
import { Factory } from 'lucide-react'

export default function ManufacturingLayout({ children }: { children: React.ReactNode }) {
  return (
    <UniversalAuthenticatedLayout
      appName="HERA Manufacturing"
      appIcon={
        <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Factory className="w-8 h-8 text-white" />
        </div>
      }
      backgroundColor="bg-gradient-to-br from-gray-50 via-blue-50 to-slate-50"
      requiredRole={['admin', 'manager', 'operator']}
    >
      {children}
    </UniversalAuthenticatedLayout>
  )
}
```

### Option 3: Using HOC Pattern

```tsx
// For individual pages
import { withUniversalAuth } from '@/components/auth/app-layouts'
import { Gem } from 'lucide-react'

function JewelryInventoryPage() {
  return (
    <div>
      {/* Your page content */}
    </div>
  )
}

export default withUniversalAuth(JewelryInventoryPage, {
  appName: 'HERA Jewelry',
  requiredRole: ['admin', 'manager'],
  appIcon: (
    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Gem className="w-8 h-8 text-white" />
    </div>
  )
})
```

## Configuration Options

### UniversalAuthenticatedLayout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | ReactNode | Required | The content to render when authenticated |
| `requiredRole` | string \| string[] | undefined | Role(s) required to access the content |
| `redirectTo` | string | '/auth/login' | Where to redirect unauthenticated users |
| `onboardingPath` | string | '/onboarding' | Where to redirect users without organization |
| `loadingComponent` | ReactNode | undefined | Custom loading component |
| `appName` | string | 'HERA' | Application name for branding |
| `appIcon` | ReactNode | undefined | Custom icon for loading state |
| `backgroundColor` | string | 'bg-gradient-to-br from-blue-50 via-white to-purple-50' | Background color for loading state |

## Role-Based Access Control

```tsx
// Single role requirement
<UniversalAuthenticatedLayout requiredRole="admin">
  {/* Admin only content */}
</UniversalAuthenticatedLayout>

// Multiple roles (user needs one of these)
<UniversalAuthenticatedLayout requiredRole={['admin', 'manager']}>
  {/* Admin or manager content */}
</UniversalAuthenticatedLayout>
```

## Custom Loading States

```tsx
<UniversalAuthenticatedLayout
  loadingComponent={
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <YourCustomLoader />
        <p>Loading your workspace...</p>
      </div>
    </div>
  }
>
  {children}
</UniversalAuthenticatedLayout>
```

## Migration Guide

### From Old Auth Pattern
```tsx
// Old pattern in salon pages
const { isAuthenticated, isLoading, organization } = useAuth()

useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push('/auth/login')
  } else if (!isLoading && isAuthenticated && !organization?.id) {
    toast({ title: 'Organization Required', ... })
    router.push('/onboarding')
  }
}, [isAuthenticated, isLoading, organization, router, toast])

if (isLoading) return <LoadingComponent />
if (!isAuthenticated || !organization?.id) return null
```

### To New Universal Pattern
```tsx
// New pattern - just wrap with auth layout
import { UniversalAuthenticatedLayout } from '@/components/auth/UniversalAuthenticatedLayout'

export default function YourLayout({ children }) {
  return (
    <UniversalAuthenticatedLayout appName="Your App">
      {children}
    </UniversalAuthenticatedLayout>
  )
}
```

## Benefits

1. **Consistency**: Same authentication flow across all HERA applications
2. **Reduced Code**: No need to implement auth checks in every page/layout
3. **Better UX**: Consistent loading states and error handling
4. **Type Safety**: Full TypeScript support with proper typing
5. **Flexibility**: Easily customize for different apps while maintaining consistency
6. **Role Support**: Built-in role-based access control
7. **Performance**: Auth checks happen at the layout level, not in every component

## Best Practices

1. **Use App-Specific Layouts**: For consistency within each application domain
2. **Apply at Layout Level**: Put authentication at the layout level, not individual pages
3. **Customize Branding**: Use app-specific icons and colors for better UX
4. **Handle Roles Properly**: Define roles at the app level, not page level when possible
5. **Custom Loading States**: Provide app-specific loading states for better perceived performance