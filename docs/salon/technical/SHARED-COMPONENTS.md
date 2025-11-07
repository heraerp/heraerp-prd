# SHARED-COMPONENTS.md - HERA Salon Luxe Component Library Reference

**Technical Guide** | Last Updated: 2025-11-07
**Status**: ✅ Production | **Theme**: Charcoal + Gold Aesthetic

---

## 📋 Table of Contents

1. [Component Library Overview](#component-library-overview)
2. [Design System (SALON_LUXE_COLORS)](#design-system-salon_luxe_colors)
3. [SalonLuxePage](#salonluxepage)
4. [SalonLuxeKPICard](#salonluxekpicard)
5. [SalonLuxeButton](#salonluxebutton)
6. [SalonLuxeModal](#salonluxemodal)
7. [Mobile Components](#mobile-components)
8. [Form Components](#form-components)
9. [UI Components](#ui-components)
10. [Best Practices](#best-practices)

---

## Component Library Overview

### 🎨 **Salon Luxe Design Philosophy**

HERA's Salon component library implements a **premium dark theme** with:
- **Charcoal backgrounds** (#0F0F0F to #303030)
- **Gold accents** (#D4AF37 primary)
- **Champagne text** (#F5F7FA for readability)
- **Glassmorphism effects** (blur + transparency)
- **Animated gradients** (subtle golden glows)

**Core Principles**:
1. **Inline styles only** - Prevents global CSS overrides
2. **Mobile-first** - All components responsive by default
3. **Accessibility** - WCAG 2.1 AA compliance
4. **Performance** - Lazy loading and code splitting
5. **Consistency** - Unified color system and spacing

---

## Design System (SALON_LUXE_COLORS)

### 🎨 **Color Constants**

```typescript
// File: /src/lib/constants/salon-luxe-colors.ts
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

// Charcoal Backgrounds
SALON_LUXE_COLORS.charcoal.dark      // '#0F0F0F' - Deepest
SALON_LUXE_COLORS.charcoal.base      // '#1A1A1A' - Base
SALON_LUXE_COLORS.charcoal.light     // '#252525' - Lighter
SALON_LUXE_COLORS.charcoal.lighter   // '#303030' - Lightest

// Gold Accent (Primary Brand Color)
SALON_LUXE_COLORS.gold.base          // '#D4AF37' - Primary gold
SALON_LUXE_COLORS.gold.light         // '#E3C75F' - Lighter
SALON_LUXE_COLORS.gold.lighter       // '#F0D584' - Lightest
SALON_LUXE_COLORS.gold.dark          // '#B8860B' - Darker

// Champagne (Text Colors)
SALON_LUXE_COLORS.champagne.lightest // '#fefdf9' - Brightest
SALON_LUXE_COLORS.champagne.base     // '#f5e9b8' - Base
SALON_LUXE_COLORS.text.primary       // '#F5F7FA' - Primary text
SALON_LUXE_COLORS.text.secondary     // '#C7CCD4' - Secondary text
SALON_LUXE_COLORS.text.onGold        // '#0F0F0F' - Text on gold backgrounds

// State Colors
SALON_LUXE_COLORS.success.base       // '#0F6F5C' - Emerald green
SALON_LUXE_COLORS.danger.base        // '#E8B4B8' - Rose/pink
SALON_LUXE_COLORS.error.base         // '#FF6B93' - Vibrant pink/red

// Extended Palette
SALON_LUXE_COLORS.emerald.base       // '#10B981' - Vibrant emerald
SALON_LUXE_COLORS.rose.base          // '#E8B4B8' - Soft rose
SALON_LUXE_COLORS.bronze.base        // '#8C7853' - Bronze/muted gold
```

### 🎨 **Gradient Helpers**

```typescript
import { SALON_LUXE_GRADIENTS } from '@/lib/constants/salon-luxe-colors'

// Pre-built gradients
SALON_LUXE_GRADIENTS.charcoal        // Charcoal 135deg gradient
SALON_LUXE_GRADIENTS.gold            // Gold 135deg gradient
SALON_LUXE_GRADIENTS.goldAccent      // Subtle gold overlay
SALON_LUXE_GRADIENTS.success         // Success gradient
SALON_LUXE_GRADIENTS.error           // Error gradient
```

### 🎨 **Opacity Helper**

```typescript
import { withOpacity } from '@/lib/constants/salon-luxe-colors'

// Create rgba from hex with custom opacity
const semiTransparentGold = withOpacity('#D4AF37', 0.5) // 'rgba(212, 175, 55, 0.5)'
```

---

## SalonLuxePage

### 📄 **Page Wrapper Component**

Main container for all salon pages with consistent theme and animations.

```typescript
interface SalonLuxePageProps {
  children: ReactNode
  title?: string                           // Gradient title (desktop only)
  description?: string                     // Subtitle (desktop only)
  actions?: ReactNode                      // Header actions (desktop only)
  showAnimatedBackground?: boolean         // Animated gradients (default: true)
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full' // Container max-width
  padding?: 'sm' | 'md' | 'lg'            // Padding size
  className?: string
}
```

**Usage Example**:
```tsx
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'

export default function DashboardPage() {
  return (
    <SalonLuxePage
      title="Dashboard"                      // Shows on desktop only
      description="Salon performance overview"
      actions={<Button>New Appointment</Button>}
      maxWidth="full"
      padding="lg"
    >
      {/* Mobile header (separate component) */}
      <MobileHeader />

      {/* Page content */}
      <div>Your content here</div>
    </SalonLuxePage>
  )
}
```

**Features**:
- ✅ Animated golden gradient backgrounds
- ✅ Glassmorphism container effects
- ✅ Desktop header with gradient title
- ✅ Responsive max-width options
- ✅ Fade-in animations on mount

---

## SalonLuxeKPICard

### 📊 **KPI Metric Card**

Enterprise-grade card for displaying key performance indicators.

```typescript
interface SalonLuxeKPICardProps {
  title: string                            // Card title
  value: string | number                   // Main metric value
  icon: LucideIcon                         // Icon from lucide-react
  color: string                            // Primary color (hex)
  gradient?: string                        // Optional gradient override
  description?: string                     // Description below value
  percentageBadge?: string                 // Optional badge (e.g., "85%")
  onClick?: () => void                     // Optional click handler
  animationDelay?: number                  // Animation delay (ms)
}
```

**Usage Example**:
```tsx
import { SalonLuxeKPICard } from '@/components/salon/shared/SalonLuxeKPICard'
import { DollarSign, Calendar, Users, TrendingUp } from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

// KPI grid (2 columns mobile, 4 columns desktop)
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6">
  <SalonLuxeKPICard
    title="Revenue"
    value={`AED ${revenue.toLocaleString()}`}
    icon={DollarSign}
    color={SALON_LUXE_COLORS.gold.base}
    description="Current month"
    percentageBadge="+12%"
    animationDelay={0}
  />
  <SalonLuxeKPICard
    title="Appointments"
    value={appointmentCount}
    icon={Calendar}
    color={SALON_LUXE_COLORS.emerald.base}
    description="Today"
    animationDelay={100}
  />
  <SalonLuxeKPICard
    title="Customers"
    value={customerCount}
    icon={Users}
    color={SALON_LUXE_COLORS.bronze.base}
    onClick={() => router.push('/salon/customers')}
    animationDelay={200}
  />
  <SalonLuxeKPICard
    title="Growth"
    value="+18%"
    icon={TrendingUp}
    color={SALON_LUXE_COLORS.emerald.base}
    description="vs last month"
    animationDelay={300}
  />
</div>
```

**Features**:
- ✅ Animated shimmer effect on hover
- ✅ Icon badge in top-left corner
- ✅ Percentage badge support
- ✅ Clickable cards with active state
- ✅ Staggered entrance animations
- ✅ Mobile-responsive sizing

---

## SalonLuxeButton

### 🔘 **Enterprise Button Component**

Five button variants with hover states and loading support.

```typescript
interface SalonLuxeButtonProps {
  variant?: 'primary' | 'danger' | 'outline' | 'ghost' | 'tile'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  // ... extends HTMLButtonElement props
}
```

**Variants**:

**1. Primary (Solid Gold)**:
```tsx
<SalonLuxeButton variant="primary" onClick={handleSubmit}>
  Confirm Booking
</SalonLuxeButton>
// Solid gold gradient, dark text, maximum visibility
```

**2. Danger (Rose/Pink)**:
```tsx
<SalonLuxeButton variant="danger" onClick={handleDelete}>
  Delete
</SalonLuxeButton>
// Rose/pink for destructive actions
```

**3. Outline (Transparent with Border)**:
```tsx
<SalonLuxeButton variant="outline" onClick={handleCancel}>
  Cancel
</SalonLuxeButton>
// Transparent with gold border
```

**4. Ghost (Minimal)**:
```tsx
<SalonLuxeButton variant="ghost" onClick={handleInfo}>
  More Info
</SalonLuxeButton>
// Minimal styling, hover reveals background
```

**5. Tile (Glassmorphism)**:
```tsx
<SalonLuxeButton variant="tile" size="lg" className="w-full h-32">
  Appointments
</SalonLuxeButton>
// Glassmorphism tile style with golden borders
```

**With Icon and Loading**:
```tsx
import { Save, Loader2 } from 'lucide-react'

<SalonLuxeButton
  variant="primary"
  icon={<Save className="w-5 h-5" />}
  loading={isSaving}
  disabled={isSaving}
  onClick={handleSave}
>
  {isSaving ? 'Saving...' : 'Save Changes'}
</SalonLuxeButton>
```

**Features**:
- ✅ Three sizes (sm, md, lg)
- ✅ Loading state with spinner
- ✅ Icon support
- ✅ Disabled state handling
- ✅ Hover animations
- ✅ Active state feedback (scale-95)

---

## SalonLuxeModal

### 🪟 **Enterprise Modal Component**

Full-featured modal with validation, animations, and theme consistency.

```typescript
interface SalonLuxeModalProps {
  open: boolean
  onClose: (open?: boolean) => void
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showCloseButton?: boolean
  className?: string
  validationErrors?: ValidationError[]
  showValidationSummary?: boolean
}

interface ValidationError {
  field: string
  message: string
}
```

**Basic Usage**:
```tsx
import { SalonLuxeModal } from '@/components/salon/shared/SalonLuxeModal'
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
import { Sparkles } from 'lucide-react'

const [isOpen, setIsOpen] = useState(false)

<SalonLuxeModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="New Appointment"
  description="Schedule a new customer appointment"
  icon={<Sparkles className="w-6 h-6" />}
  size="lg"
  footer={
    <>
      <SalonLuxeButton variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </SalonLuxeButton>
      <SalonLuxeButton variant="primary" onClick={handleSubmit}>
        Confirm
      </SalonLuxeButton>
    </>
  }
>
  <div>Modal content here</div>
</SalonLuxeModal>
```

**With Validation**:
```tsx
const [errors, setErrors] = useState<ValidationError[]>([])

const validateForm = () => {
  const newErrors: ValidationError[] = []
  if (!name) newErrors.push({ field: 'name', message: 'Name is required' })
  if (!phone) newErrors.push({ field: 'phone', message: 'Phone is required' })
  setErrors(newErrors)
  return newErrors.length === 0
}

<SalonLuxeModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="New Customer"
  validationErrors={errors}
  showValidationSummary={errors.length > 0}
  footer={
    <SalonLuxeButton
      variant="primary"
      onClick={() => {
        if (validateForm()) {
          handleSubmit()
        }
      }}
    >
      Save Customer
    </SalonLuxeButton>
  }
>
  <form>...</form>
</SalonLuxeModal>
```

**Features**:
- ✅ Animated entrance (slide + 3D tilt)
- ✅ 3D tilt effect on mouse move
- ✅ Dynamic border glow following mouse
- ✅ Built-in validation error display
- ✅ Custom scrollbar styling
- ✅ Glassmorphism effects
- ✅ Five size options
- ✅ Focus trapping and ESC to close

---

## Mobile Components

### 📱 **SalonMobileBottomNav**

iOS/Android-style bottom tab navigation.

```typescript
interface SalonMobileBottomNavProps {
  userRole?: string
  customItems?: NavItem[]
  badges?: Record<string, number>
}

interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
}
```

**Usage**:
```tsx
import { SalonMobileBottomNav } from '@/components/salon/mobile/SalonMobileBottomNav'

// Automatically uses role-based navigation
<SalonMobileBottomNav
  userRole="owner"
  badges={{
    '/salon/appointments': 3,
    '/salon/customers': 1
  }}
/>
```

See **MOBILE-LAYOUT.md** for complete mobile navigation documentation.

---

## Form Components

### 📝 **SalonLuxeInput**

```tsx
import { SalonLuxeInput } from '@/components/salon/shared/SalonLuxeInput'

<SalonLuxeInput
  label="Customer Name"
  placeholder="Enter name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
  required
/>
```

### 📝 **SalonLuxeSelect**

```tsx
import { SalonLuxeSelect } from '@/components/salon/shared/SalonLuxeSelect'

<SalonLuxeSelect
  label="Service Category"
  options={categories}
  value={selectedCategory}
  onChange={setSelectedCategory}
/>
```

### 🏷️ **SalonLuxeBadge**

```tsx
import { SalonLuxeBadge } from '@/components/salon/shared/SalonLuxeBadge'

<SalonLuxeBadge variant="success">Active</SalonLuxeBadge>
<SalonLuxeBadge variant="danger">Cancelled</SalonLuxeBadge>
<SalonLuxeBadge variant="warning">Pending</SalonLuxeBadge>
```

---

## UI Components

### 💬 **StatusToast**

```tsx
import { StatusToastProvider, useStatusToast } from '@/components/salon/ui/StatusToastProvider'

// Wrap your page
<StatusToastProvider>
  <YourPage />
</StatusToastProvider>

// Use in component
const { showToast } = useStatusToast()

showToast({
  title: 'Success',
  description: 'Appointment created successfully',
  variant: 'success'
})
```

### 🔄 **SalonLuxeLoadingOverlay**

```tsx
import { SalonLuxeLoadingOverlay } from '@/components/salon/shared/SalonLuxeLoadingOverlay'

<SalonLuxeLoadingOverlay
  isLoading={isLoading}
  message="Saving changes..."
/>
```

---

## Best Practices

### ✅ **DO's**

1. **Always use SALON_LUXE_COLORS for styling**:
   ```tsx
   // ✅ CORRECT
   style={{ color: SALON_LUXE_COLORS.text.primary }}

   // ❌ WRONG
   style={{ color: '#FFFFFF' }}
   ```

2. **Use inline styles to prevent CSS overrides**:
   ```tsx
   // ✅ CORRECT - Inline styles
   <div style={{ backgroundColor: SALON_LUXE_COLORS.charcoal.base }}>

   // ❌ WRONG - CSS classes can be overridden
   <div className="bg-charcoal">
   ```

3. **Lazy load heavy components**:
   ```tsx
   // ✅ CORRECT
   const Modal = lazy(() => import('./Modal'))
   <Suspense fallback={<Skeleton />}>
     <Modal />
   </Suspense>
   ```

4. **Mobile-first responsive design**:
   ```tsx
   // ✅ CORRECT - Mobile first, desktop enhanced
   className="text-sm md:text-base lg:text-lg"
   className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6"
   ```

5. **Touch-friendly targets on mobile**:
   ```tsx
   // ✅ CORRECT - 44px minimum
   className="min-h-[44px] min-w-[44px] active:scale-95"
   ```

### ❌ **DON'Ts**

1. **Don't use plain shadcn/ui components**:
   ```tsx
   // ❌ WRONG
   import { Button } from '@/components/ui/button'

   // ✅ CORRECT
   import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'
   ```

2. **Don't hardcode colors**:
   ```tsx
   // ❌ WRONG
   style={{ color: '#D4AF37' }}

   // ✅ CORRECT
   style={{ color: SALON_LUXE_COLORS.gold.base }}
   ```

3. **Don't skip mobile testing**:
   ```tsx
   // ❌ WRONG - Desktop only
   <div className="grid-cols-4 gap-6">

   // ✅ CORRECT - Responsive
   <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
   ```

4. **Don't ignore touch feedback**:
   ```tsx
   // ❌ WRONG - No feedback
   <button onClick={handleClick}>

   // ✅ CORRECT - Touch feedback
   <button className="active:scale-95 transition-transform" onClick={handleClick}>
   ```

5. **Don't bypass validation in modals**:
   ```tsx
   // ❌ WRONG - No validation
   <SalonLuxeModal>

   // ✅ CORRECT - With validation
   <SalonLuxeModal
     validationErrors={errors}
     showValidationSummary={errors.length > 0}
   >
   ```

---

## 🎯 Quick Reference

### **Essential Components**:
- **SalonLuxePage** - Page wrapper
- **SalonLuxeKPICard** - Metric cards
- **SalonLuxeButton** - Buttons (5 variants)
- **SalonLuxeModal** - Modals with validation
- **SalonMobileBottomNav** - Mobile navigation

### **Color System**:
```typescript
SALON_LUXE_COLORS.charcoal.*   // Backgrounds
SALON_LUXE_COLORS.gold.*       // Primary accent
SALON_LUXE_COLORS.text.*       // Text colors
SALON_LUXE_GRADIENTS.*         // Pre-built gradients
```

### **Related Documentation**:
- **MOBILE-LAYOUT.md** - Mobile-first design
- **DATA-MODELS.md** - Data patterns
- **AUTHENTICATION.md** - Auth integration
- **HOOKS.md** - Data hooks

**HERA's Salon Luxe component library provides enterprise-grade UI with consistent theme and mobile-first design.**
