# SALON LUXE THEME SYSTEM

**Enterprise-Grade Component Library for Salon Applications**

This system provides consistent, override-proof styling for all salon modals and components.

## 🎯 Problem Solved

Global CSS rules were overriding component styles, causing:
- Available badge showing black text on black background
- Cancel buttons not appearing in red
- Inconsistent colors across modals
- Theme breaking when CSS specificity conflicts

## ✅ Solution

**Inline Style System** - All colors defined as explicit hex/rgba values in inline styles, preventing any CSS overrides.

---

## 📦 Core Components

### 1. **Color Constants** (`src/lib/constants/salon-luxe-colors.ts`)

All salon luxe colors in one place with explicit hex values:

```typescript
import { SALON_LUXE_COLORS, SALON_LUXE_GRADIENTS, SALON_LUXE_STYLES } from '@/lib/constants/salon-luxe-colors'

// Direct color access
SALON_LUXE_COLORS.charcoal.dark     // '#0F0F0F'
SALON_LUXE_COLORS.gold.base         // '#D4AF37'
SALON_LUXE_COLORS.champagne.base    // '#f5e9b8'
SALON_LUXE_COLORS.danger.base       // '#E8B4B8'
SALON_LUXE_COLORS.success.base      // '#0F6F5C'

// Pre-built gradients
SALON_LUXE_GRADIENTS.charcoal       // Modal backgrounds
SALON_LUXE_GRADIENTS.gold           // Primary buttons

// Pre-configured styles
SALON_LUXE_STYLES.modalBackground   // Complete modal styling
SALON_LUXE_STYLES.textPrimary       // Primary text color
```

### 2. **SalonLuxeModal** (`src/components/salon/shared/SalonLuxeModal.tsx`)

Consistent modal wrapper with automatic theme application:

```typescript
import { SalonLuxeModal } from '@/components/salon/shared'
import { Sparkles } from 'lucide-react'

<SalonLuxeModal
  open={isOpen}
  onClose={handleClose}
  title="Select Staff Member"
  description="Required for this service"
  icon={<Sparkles className="w-6 h-6" />}
  size="md" // sm | md | lg | xl
  footer={
    <>
      <SalonLuxeButton variant="danger" onClick={handleClose}>
        Cancel
      </SalonLuxeButton>
      <SalonLuxeButton variant="primary" onClick={handleConfirm}>
        Confirm
      </SalonLuxeButton>
    </>
  }
>
  {/* Your modal content */}
  <div>Modal content here</div>
</SalonLuxeModal>
```

**Features:**
- ✅ Charcoal gradient background with gold border
- ✅ Animated gradient overlay
- ✅ Consistent header with icon support
- ✅ Custom scrollbar styling
- ✅ Optional close button
- ✅ Footer area for actions
- ✅ 4 size options (sm, md, lg, xl)

### 3. **SalonLuxeTile** (`src/components/salon/shared/SalonLuxeTile.tsx`) - **NEW**

Enterprise-grade tile/card component with appointments page styling:

```typescript
import { SalonLuxeTile } from '@/components/salon/shared'

// Grid tile (lifts up on hover)
<SalonLuxeTile mode="grid" className="p-6">
  <h3>Appointment Title</h3>
  <p>Customer details...</p>
</SalonLuxeTile>

// List tile (slides horizontally on hover)
<SalonLuxeTile mode="list" className="flex items-center p-4">
  <div>Content here</div>
</SalonLuxeTile>

// Disabled/archived tile
<SalonLuxeTile mode="grid" opacity={0.6}>
  <div>Archived content</div>
</SalonLuxeTile>
```

**Features:**
- ✅ Glassmorphism with 8px backdrop blur
- ✅ Golden gradient borders (25% opacity → 60% on hover)
- ✅ Mouse-tracking radial gradient (follows cursor movement)
- ✅ Spring animations (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- ✅ Grid mode: `translateY(-8px) scale(1.03)` on hover
- ✅ List mode: `translateX(6px)` on hover
- ✅ Inset shadows for 3D depth effect
- ✅ Auto-resets on mouse leave

**Props:**
- `mode` - Display mode: 'grid' or 'list' (default: 'grid')
- `enableMouseTracking` - Enable radial gradient following cursor (default: true)
- `enableHoverEffects` - Enable hover animations (default: true)
- `opacity` - Tile opacity for disabled/archived states (default: 1)
- `borderColor` - Custom border color override
- `background` - Custom background override

### 4. **SalonLuxeButton** (`src/components/salon/shared/SalonLuxeButton.tsx`)

Enterprise-grade buttons with 4 variants:

```typescript
import { SalonLuxeButton } from '@/components/salon/shared'
import { Save, Trash } from 'lucide-react'

// Primary (Gold)
<SalonLuxeButton variant="primary" size="md">
  Confirm Selection
</SalonLuxeButton>

// Danger (Rose)
<SalonLuxeButton variant="danger" size="md">
  Cancel
</SalonLuxeButton>

// Outline (Transparent with border)
<SalonLuxeButton variant="outline" icon={<Save />}>
  Save Draft
</SalonLuxeButton>

// Ghost (Minimal)
<SalonLuxeButton variant="ghost">
  Skip
</SalonLuxeButton>

// With loading state
<SalonLuxeButton variant="primary" loading={isLoading}>
  Processing...
</SalonLuxeButton>

// Tile variant (glassmorphism style from appointments page)
<SalonLuxeButton variant="tile" size="lg">
  Save New Time
</SalonLuxeButton>
```

**Variants:**
- `primary` - Gold gradient background, dark text (main actions)
- `danger` - Rose color for destructive actions
- `outline` - Transparent with gold border (secondary actions)
- `ghost` - Minimal styling (tertiary actions)
- `tile` - **NEW** Glassmorphism style with golden borders (appointments page style - enterprise-grade)

**Sizes:**
- `sm` - Height 36px, small padding
- `md` - Height 48px, medium padding (default)
- `lg` - Height 56px, large padding

**Props:**
- `variant` - Button style variant
- `size` - Button size
- `loading` - Show loading spinner
- `icon` - Optional icon before text
- `disabled` - Disabled state

### 5. **SalonLuxeBadge** (`src/components/salon/shared/SalonLuxeBadge.tsx`)

Status badges with champagne text for readability:

```typescript
import { SalonLuxeBadge } from '@/components/salon/shared'

// Available badge (green + champagne)
<SalonLuxeBadge variant="success" emphasis="medium">
  Available
</SalonLuxeBadge>

// Skill badges
<SalonLuxeBadge variant="skill" size="sm">
  Hair Styling
</SalonLuxeBadge>

// Warning
<SalonLuxeBadge variant="warning">
  Low Stock
</SalonLuxeBadge>

// Danger
<SalonLuxeBadge variant="danger">
  Out of Stock
</SalonLuxeBadge>

// Gold border
<SalonLuxeBadge variant="gold">
  Premium
</SalonLuxeBadge>
```

**Variants:**
- `success` - Green background + champagne text (e.g., Available)
- `warning` - Gold background + gold text
- `danger` - Rose background + rose text
- `skill` - Charcoal background + muted text (for tags)
- `gold` - Gold border + gold text
- `info` - Default charcoal styling

**Emphasis Levels:**
- `low` - Subtle (10% bg opacity)
- `medium` - Standard (15% bg opacity) - default
- `high` - Strong (20% bg opacity)

**Sizes:**
- `sm` - Small padding, xs text
- `md` - Medium padding, xs text (default)
- `lg` - Large padding, sm text

### 6. **SalonLuxeInput** (`src/components/salon/shared/SalonLuxeInput.tsx`) - **NEW**

Enterprise-grade text input with glassmorphism and golden focus effects:

```typescript
import { SalonLuxeInput } from '@/components/salon/shared'
import { User, Mail, Phone, Search } from 'lucide-react'

// Basic input
<SalonLuxeInput
  placeholder="Enter customer name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// With left icon
<SalonLuxeInput
  type="email"
  placeholder="Email address"
  leftIcon={<Mail className="w-4 h-4" />}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With right icon
<SalonLuxeInput
  type="search"
  placeholder="Search appointments..."
  rightIcon={<Search className="w-4 h-4" />}
/>

// Error state
<SalonLuxeInput
  placeholder="Phone number"
  value={phone}
  error={!isValidPhone}
  onChange={(e) => setPhone(e.target.value)}
/>

// Success state
<SalonLuxeInput
  placeholder="Verification code"
  value={code}
  success={isVerified}
/>

// Disabled state
<SalonLuxeInput
  placeholder="Disabled field"
  disabled
/>
```

**Features:**
- ✅ Glassmorphism with 8px backdrop blur
- ✅ Golden borders (25% → 60% opacity on focus)
- ✅ Smooth spring animations (`cubic-bezier(0.34, 1.56, 0.64, 1)`)
- ✅ Error/success states with color feedback (red/green borders + shadows)
- ✅ Optional left/right icons with color transitions
- ✅ Placeholder with bronze color (70% opacity)
- ✅ Soft rounded corners (12px)
- ✅ Inset shadows for 3D depth
- ✅ Height: 48px (h-12) for comfortable touch targets

**Props:**
- `leftIcon` - Icon to display on the left (ReactNode)
- `rightIcon` - Icon to display on the right (ReactNode)
- `error` - Error state with red border/shadow (boolean)
- `success` - Success state with green border/shadow (boolean)
- All standard HTML input props (type, placeholder, value, onChange, disabled, etc.)

### 7. **SalonLuxeSelect** (`src/components/salon/shared/SalonLuxeSelect.tsx`) - **NEW**

Complete set of dropdown components with salon luxe theme:

```typescript
import {
  SalonLuxeSelect,
  SalonLuxeSelectTrigger,
  SalonLuxeSelectValue,
  SalonLuxeSelectContent,
  SalonLuxeSelectItem,
  SalonLuxeSelectLabel,
  SalonLuxeSelectSeparator
} from '@/components/salon/shared'

// Basic select
<SalonLuxeSelect value={selectedStaff} onValueChange={setSelectedStaff}>
  <SalonLuxeSelectTrigger>
    <SalonLuxeSelectValue placeholder="Select a stylist" />
  </SalonLuxeSelectTrigger>
  <SalonLuxeSelectContent>
    <SalonLuxeSelectItem value="staff1">Jane Smith</SalonLuxeSelectItem>
    <SalonLuxeSelectItem value="staff2">John Doe</SalonLuxeSelectItem>
    <SalonLuxeSelectItem value="staff3">Sarah Johnson</SalonLuxeSelectItem>
  </SalonLuxeSelectContent>
</SalonLuxeSelect>

// With groups and labels
<SalonLuxeSelect value={service} onValueChange={setService}>
  <SalonLuxeSelectTrigger>
    <SalonLuxeSelectValue placeholder="Select a service" />
  </SalonLuxeSelectTrigger>
  <SalonLuxeSelectContent>
    <SalonLuxeSelectLabel>Hair Services</SalonLuxeSelectLabel>
    <SalonLuxeSelectItem value="haircut">Haircut</SalonLuxeSelectItem>
    <SalonLuxeSelectItem value="coloring">Coloring</SalonLuxeSelectItem>

    <SalonLuxeSelectSeparator />

    <SalonLuxeSelectLabel>Nail Services</SalonLuxeSelectLabel>
    <SalonLuxeSelectItem value="manicure">Manicure</SalonLuxeSelectItem>
    <SalonLuxeSelectItem value="pedicure">Pedicure</SalonLuxeSelectItem>
  </SalonLuxeSelectContent>
</SalonLuxeSelect>

// Disabled option
<SalonLuxeSelectItem value="unavailable" disabled>
  Not Available
</SalonLuxeSelectItem>
```

**Features:**
- ✅ **Trigger**: Glassmorphism with 8px blur, golden borders (25% → 60% on focus)
- ✅ **Content**: Dark glassmorphism dropdown (16px blur), golden border (35% opacity)
- ✅ **Items**: Hover with golden gradient background (15% → 8%)
- ✅ **Icons**: Golden ChevronDown/ChevronUp with color transitions
- ✅ **Check Mark**: Golden check icon for selected items
- ✅ **Labels**: Golden text for section headers
- ✅ **Separator**: Golden line (20% opacity)
- ✅ Smooth spring animations on all interactions
- ✅ Professional dropdown shadow and layering
- ✅ Soft rounded corners (12px)
- ✅ Height: 48px (h-12) trigger for consistent form layouts

**Components:**
- `SalonLuxeSelect` - Root select component
- `SalonLuxeSelectTrigger` - Clickable trigger button
- `SalonLuxeSelectValue` - Selected value display
- `SalonLuxeSelectContent` - Dropdown content container
- `SalonLuxeSelectItem` - Individual option item
- `SalonLuxeSelectLabel` - Section label
- `SalonLuxeSelectSeparator` - Visual separator line
- `SalonLuxeSelectGroup` - Group options together
- `SalonLuxeSelectScrollUpButton` - Scroll up button
- `SalonLuxeSelectScrollDownButton` - Scroll down button

---

## 🌐 Page-Level Theme Application (NEW)

### **SalonLuxePage Wrapper Component**

Enterprise-grade page wrapper that applies the salon luxe theme to entire pages.

```typescript
import { SalonLuxePage, SalonLuxeButton, SalonLuxeTile } from '@/components/salon/shared'

export default function MyPage() {
  return (
    <SalonLuxePage
      title="Appointments"
      description="Manage salon appointments and bookings with elegance"
      maxWidth="xl"
      padding="lg"
      actions={
        <>
          <SalonLuxeButton variant="outline">
            Export
          </SalonLuxeButton>
          <SalonLuxeButton variant="tile" size="lg">
            New Appointment
          </SalonLuxeButton>
        </>
      }
    >
      <div className="p-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <SalonLuxeTile mode="grid" className="p-6">
            <h3>Total</h3>
            <p className="text-3xl">245</p>
          </SalonLuxeTile>
          {/* More cards... */}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {items.map(item => (
            <SalonLuxeTile key={item.id} mode="grid" className="p-6">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </SalonLuxeTile>
          ))}
        </div>
      </div>
    </SalonLuxePage>
  )
}
```

**Features:**
- ✅ Black background with animated golden gradients
- ✅ Glassmorphism container with golden borders
- ✅ Gradient title text (champagne → gold)
- ✅ 20-second animated radial gradient background
- ✅ Consistent header with actions
- ✅ Responsive max-width options (sm/md/lg/xl/full)
- ✅ Padding options (sm/md/lg)
- ✅ Auto-applies salon luxe aesthetic

**Props:**
- `title` - Page title with gradient text
- `description` - Page subtitle/description
- `actions` - Header buttons/actions (ReactNode)
- `showAnimatedBackground` - Enable animated gradients (default: true)
- `maxWidth` - Container width: 'sm' | 'md' | 'lg' | 'xl' | 'full' (default: 'full')
- `padding` - Page padding: 'sm' | 'md' | 'lg' (default: 'lg')
- `className` - Custom className for content container

### **Page Theming Patterns**

**Pattern 1: Full Page Wrapper (Recommended)**
```typescript
// Entire page with consistent theme
<SalonLuxePage title="Dashboard" actions={<Actions />}>
  <div className="p-8">
    {/* Your content with automatic theme */}
  </div>
</SalonLuxePage>
```

**Pattern 2: Manual Page Theme (Advanced)**
```typescript
// Custom page layout with manual styling
<div
  className="min-h-screen p-6"
  style={{
    backgroundColor: SALON_LUXE_COLORS.charcoal.dark,
    backgroundImage: `
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.15) 0%, transparent 50%)
    `
  }}
>
  <div
    className="max-w-7xl mx-auto rounded-2xl p-8 backdrop-blur-xl"
    style={{
      background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(15,15,15,0.95) 100%)',
      border: `1px solid ${SALON_LUXE_COLORS.gold}15`,
      boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
    }}
  >
    {/* Page content */}
  </div>
</div>
```

**Pattern 3: Grid Layout with Tiles**
```typescript
<SalonLuxePage title="Services" maxWidth="xl">
  <div className="p-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map(service => (
        <SalonLuxeTile key={service.id} mode="grid" className="p-6">
          <h3 style={{ color: SALON_LUXE_COLORS.champagne }}>
            {service.name}
          </h3>
          <p style={{ color: SALON_LUXE_COLORS.bronze }}>
            {service.description}
          </p>
          <SalonLuxeBadge variant="success">
            Available
          </SalonLuxeBadge>
        </SalonLuxeTile>
      ))}
    </div>
  </div>
</SalonLuxePage>
```

**Pattern 4: List View with Tiles**
```typescript
<SalonLuxePage title="Staff Members" maxWidth="lg">
  <div className="p-8 space-y-4">
    {staff.map(member => (
      <SalonLuxeTile key={member.id} mode="list" className="p-4 flex items-center gap-6">
        <Avatar />
        <div className="flex-1">
          <h3 style={{ color: SALON_LUXE_COLORS.champagne }}>
            {member.name}
          </h3>
          <p style={{ color: SALON_LUXE_COLORS.bronze }}>
            {member.role}
          </p>
        </div>
        <SalonLuxeBadge variant="success">Available</SalonLuxeBadge>
      </SalonLuxeTile>
    ))}
  </div>
</SalonLuxePage>
```

---

## ✨ Glassmorphism & Golden Borders (NEW)

The salon luxe theme now includes enterprise-grade glassmorphism effects and golden tile borders for a premium aesthetic.

### **Modal Enhancements**
- **Enhanced Glassmorphism**: `backdropFilter: 'blur(24px)'` for smooth frosted glass effect
- **Golden Border Lines**: Sections separated with `rgba(212, 175, 55, 0.25)` borders
- **Soft Animations**: 12-second gradient animation with cubic-bezier easing
- **Layered Lighting**: Multiple radial gradients for depth and dimension
- **Inset Shadows**: `boxShadow` with inset highlights for 3D effect

### **Button Tile Variant**
Inspired by the appointments page "Save New Time" button:
- **Glassmorphism**: 16px blur with semi-transparent gold gradient background
- **Golden Border**: 2px solid border with 0.60 opacity (0.90 on hover)
- **Spring Animation**: `cubic-bezier(0.34, 1.56, 0.64, 1)` for bounce effect
- **Hover Transform**: `translateY(-3px) scale(1.02)` for lift effect
- **Inset Highlights**: Inner white glow for glass-like appearance

```typescript
// Glassmorphism button example
<SalonLuxeButton variant="tile" size="lg" onClick={handleSave}>
  <Clock className="w-4 h-4 mr-2" />
  💾 Save New Time
</SalonLuxeButton>
```

---

## 🔧 Usage Examples

### Using SalonLuxeTile for Grid/List Views

**Grid View with Mouse Tracking:**
```typescript
import { SalonLuxeTile, SalonLuxeBadge } from '@/components/salon/shared'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {appointments.map((appointment) => (
    <SalonLuxeTile
      key={appointment.id}
      mode="grid"
      opacity={appointment.status === 'archived' ? 0.6 : 1}
      onClick={() => handleViewAppointment(appointment.id)}
      className="p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 style={{ color: SALON_LUXE_COLORS.champagne }}>
            {appointment.customer_name}
          </h3>
          <p style={{ color: SALON_LUXE_COLORS.bronze }}>
            {appointment.stylist_name}
          </p>
        </div>
        <SalonLuxeBadge variant="success" emphasis="medium">
          {appointment.status}
        </SalonLuxeBadge>
      </div>

      {/* Details */}
      <div className="space-y-2">
        <p style={{ color: SALON_LUXE_COLORS.text.secondary }}>
          {appointment.date} • {appointment.time}
        </p>
      </div>
    </SalonLuxeTile>
  ))}
</div>
```

**List View with Horizontal Slide:**
```typescript
<div className="space-y-4">
  {appointments.map((appointment) => (
    <SalonLuxeTile
      key={appointment.id}
      mode="list"
      className="flex items-center justify-between p-4"
    >
      <div className="flex-1 flex items-center gap-6">
        <div>
          <h3 style={{ color: SALON_LUXE_COLORS.champagne }}>
            {appointment.customer_name}
          </h3>
        </div>
        <div style={{ color: SALON_LUXE_COLORS.bronze }}>
          {appointment.date}
        </div>
        <SalonLuxeBadge variant="success">
          {appointment.status}
        </SalonLuxeBadge>
      </div>
    </SalonLuxeTile>
  ))}
</div>
```

### Converting Existing Modal

**Before (with CSS override issues):**
```typescript
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
    </DialogHeader>
    <div>{children}</div>
    <div className="flex gap-3">
      <Button variant="outline" onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm}>Confirm</Button>
    </div>
  </DialogContent>
</Dialog>
```

**After (with guaranteed styling):**
```typescript
import { SalonLuxeModal, SalonLuxeButton } from '@/components/salon/shared'

<SalonLuxeModal
  open={open}
  onClose={onClose}
  title={title}
  icon={<Icon className="w-6 h-6" />}
  footer={
    <>
      <SalonLuxeButton variant="danger" onClick={onClose}>
        Cancel
      </SalonLuxeButton>
      <SalonLuxeButton variant="primary" onClick={onConfirm}>
        Confirm
      </SalonLuxeButton>
    </>
  }
>
  {children}
</SalonLuxeModal>
```

### Staff Card with Badges

```typescript
import { SalonLuxeBadge } from '@/components/salon/shared'

<Card>
  <CardContent>
    <div className="flex justify-between items-start">
      <div>
        <h3 style={{ color: SALON_LUXE_COLORS.text.primary }}>
          Staff Name
        </h3>
        <p style={{ color: SALON_LUXE_COLORS.text.secondary }}>
          Senior Stylist
        </p>
      </div>
      <SalonLuxeBadge variant="success" emphasis="medium">
        Available
      </SalonLuxeBadge>
    </div>

    {/* Skills */}
    <div className="flex gap-2 mt-3">
      <SalonLuxeBadge variant="skill" size="sm">Hair Styling</SalonLuxeBadge>
      <SalonLuxeBadge variant="skill" size="sm">Coloring</SalonLuxeBadge>
      <SalonLuxeBadge variant="skill" size="sm">Treatments</SalonLuxeBadge>
    </div>
  </CardContent>
</Card>
```

### Custom Elements with Direct Colors

For elements not covered by components, use the color constants:

```typescript
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

// Text
<h1 style={{ color: SALON_LUXE_COLORS.text.primary }}>
  Main Heading
</h1>

<p style={{ color: SALON_LUXE_COLORS.text.secondary }}>
  Secondary text
</p>

// Borders
<div style={{
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: SALON_LUXE_COLORS.border.base
}}>
  Content
</div>

// Backgrounds
<div style={{
  backgroundColor: SALON_LUXE_COLORS.charcoal.light,
  color: SALON_LUXE_COLORS.text.primary
}}>
  Card content
</div>

// Icons
<Icon style={{ color: SALON_LUXE_COLORS.gold.base }} />
```

---

## 🎨 Color Palette Reference

### Charcoal (Backgrounds)
```
charcoal.dark    = #0F0F0F  (Deepest - modal backgrounds)
charcoal.base    = #1A1A1A  (Base - card backgrounds)
charcoal.light   = #252525  (Light - hover states)
charcoal.lighter = #303030  (Lighter - active states)
```

### Gold (Primary Accent)
```
gold.dark    = #B8860B  (Darker variant)
gold.base    = #D4AF37  (Primary gold)
gold.light   = #E3C75F  (Lighter variant)
gold.lighter = #F0D584  (Lightest variant)
```

### Champagne (Text on Dark)
```
champagne.light = #faf4db  (High emphasis text)
champagne.base  = #f5e9b8  (Standard readable text)
champagne.dark  = #D4AF37  (Same as gold)
```

### Text Colors
```
text.primary   = #F5F7FA  (Main text - very light)
text.secondary = #C7CCD4  (Secondary text - muted)
text.tertiary  = #9AA3AE  (Tertiary text - more muted)
text.onGold    = #0F0F0F  (Dark text on gold backgrounds)
```

### State Colors
```
success.base = #0F6F5C  (Emerald green)
danger.base  = #E8B4B8  (Rose pink)
```

---

## 🚀 Migration Guide

### Step 1: Import Components
```typescript
import {
  SalonLuxeModal,
  SalonLuxeButton,
  SalonLuxeBadge
} from '@/components/salon/shared'

import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
```

### Step 2: Replace Dialog with SalonLuxeModal
```typescript
// Old
<Dialog>...</Dialog>

// New
<SalonLuxeModal>...</SalonLuxeModal>
```

### Step 3: Replace Buttons
```typescript
// Old
<Button variant="outline">Cancel</Button>
<Button>Confirm</Button>

// New
<SalonLuxeButton variant="danger">Cancel</SalonLuxeButton>
<SalonLuxeButton variant="primary">Confirm</SalonLuxeButton>
```

### Step 4: Replace Badges
```typescript
// Old
<Badge className="bg-green-500 text-white">Available</Badge>

// New
<SalonLuxeBadge variant="success" emphasis="medium">
  Available
</SalonLuxeBadge>
```

### Step 5: Update Custom Text/Icons
```typescript
// Old
<h1 className="text-salon-text">Title</h1>

// New
<h1 style={{ color: SALON_LUXE_COLORS.text.primary }}>Title</h1>
```

---

## ✅ Benefits

1. **No CSS Overrides** - Inline styles guarantee your styling
2. **Consistency** - Same look across all salon modals
3. **Type Safety** - TypeScript ensures correct usage
4. **Easy Maintenance** - Update colors in one place
5. **Enterprise Grade** - Professional contrast and aesthetics
6. **Accessible** - Meets AA contrast standards
7. **Reusable** - Works everywhere in salon module

---

## 📝 Best Practices

1. **Always use components first** - SalonLuxeModal, SalonLuxeButton, SalonLuxeBadge
2. **Use color constants for custom elements** - SALON_LUXE_COLORS
3. **Prefer inline styles over className** - For guaranteed styling
4. **Use emphasis levels** - Control badge visibility appropriately
5. **Match button variants to actions** - primary/danger/outline/ghost/tile
6. **Consistent icon colors** - Use gold for primary icons
7. **Test in dark mode** - All components work in dark theme
8. **Use tile variant for primary actions** - Glassmorphism style for important CTAs
9. **Leverage golden borders** - Modals automatically include golden section separators

---

## 🔍 Troubleshooting

### Issue: Colors still being overridden
**Solution:** Check that you're using inline `style` prop, not `className`

### Issue: Text not readable
**Solution:** Use champagne colors for text on dark backgrounds

### Issue: Buttons look inconsistent
**Solution:** Use SalonLuxeButton component instead of custom styling

### Issue: Modal background wrong color
**Solution:** Ensure using SalonLuxeModal wrapper, not Dialog directly

---

## 📚 Complete Example (With Glassmorphism)

```typescript
import { useState } from 'react'
import { Sparkles, Award, Clock } from 'lucide-react'
import {
  SalonLuxeModal,
  SalonLuxeButton,
  SalonLuxeBadge
} from '@/components/salon/shared'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

export function StaffSelectionExample() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  return (
    <SalonLuxeModal
      open={open}
      onClose={() => setOpen(false)}
      title="Select Staff Member"
      description="Choose a stylist for this service"
      icon={<Sparkles className="w-6 h-6" />}
      size="md"
      footer={
        <>
          <SalonLuxeButton
            variant="danger"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </SalonLuxeButton>
          {/* NEW: Tile variant with glassmorphism */}
          <SalonLuxeButton
            variant="tile"
            onClick={() => console.log('Confirmed')}
            disabled={!selected}
            className="flex-1"
            size="lg"
          >
            <Clock className="w-4 h-4 mr-2" />
            💾 Confirm Selection
          </SalonLuxeButton>
        </>
      }
    >
      <div className="space-y-3">
        {staff.map((member) => (
          <div
            key={member.id}
            className="p-4 rounded-lg cursor-pointer transition-all"
            style={{
              backgroundColor: selected === member.id
                ? SALON_LUXE_COLORS.charcoal.lighter
                : SALON_LUXE_COLORS.charcoal.light,
              borderWidth: '2px',
              borderStyle: 'solid',
              borderColor: selected === member.id
                ? SALON_LUXE_COLORS.gold.base
                : SALON_LUXE_COLORS.border.muted,
            }}
            onClick={() => setSelected(member.id)}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 style={{ color: SALON_LUXE_COLORS.text.primary }}>
                  {member.name}
                </h3>
                <p style={{ color: SALON_LUXE_COLORS.text.secondary }}>
                  {member.role}
                </p>
              </div>
              <SalonLuxeBadge variant="success" emphasis="medium">
                Available
              </SalonLuxeBadge>
            </div>

            <div className="flex gap-2">
              {member.skills.map((skill) => (
                <SalonLuxeBadge key={skill} variant="skill" size="sm">
                  {skill}
                </SalonLuxeBadge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SalonLuxeModal>
  )
}
```

---

## 🎯 Summary

**Use this system for all salon modals to ensure:**
- ✅ Consistent salon luxe theme
- ✅ No global CSS override issues
- ✅ Enterprise-grade contrast
- ✅ Maintainable codebase
- ✅ Type-safe development
- ✅ Accessible UI

**Key Files:**
- `/src/lib/constants/salon-luxe-colors.ts` - All colors
- `/src/components/salon/shared/SalonLuxePage.tsx` - Page wrapper ✨ NEW
- `/src/components/salon/shared/SalonLuxeModal.tsx` - Modal/Dialog wrapper
- `/src/components/salon/shared/SalonLuxeTile.tsx` - Tile/card component ✨ NEW
- `/src/components/salon/shared/SalonLuxeButton.tsx` - Buttons
- `/src/components/salon/shared/SalonLuxeBadge.tsx` - Badges
- `/src/components/salon/shared/SalonLuxeInput.tsx` - Text inputs ✨ NEW
- `/src/components/salon/shared/SalonLuxeSelect.tsx` - Dropdowns ✨ NEW
- `/src/components/salon/shared/index.ts` - Export all

**Import Pattern:**
```typescript
import {
  SalonLuxePage,
  SalonLuxeModal,
  SalonLuxeTile,
  SalonLuxeButton,
  SalonLuxeBadge,
  SalonLuxeInput,
  SalonLuxeSelect,
  SalonLuxeSelectTrigger,
  SalonLuxeSelectValue,
  SalonLuxeSelectContent,
  SalonLuxeSelectItem
} from '@/components/salon/shared'

import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'
```

## 🆕 What's New (Glassmorphism Update)

### **NEW: SalonLuxePage Component** 🎨
- ✅ **Full Page Wrapper**: Apply salon luxe theme to entire pages
- ✅ Black background with animated golden gradients
- ✅ Glassmorphism container with golden borders
- ✅ Gradient title text (champagne → gold)
- ✅ 20-second animated radial gradient background
- ✅ Consistent header with action buttons
- ✅ Responsive max-width options (sm/md/lg/xl/full)
- ✅ Padding options (sm/md/lg)

### **NEW: SalonLuxeTile Component** 🌟
- ✅ **Grid/List Tile Component**: Enterprise-grade appointments page tile styling
- ✅ 8px backdrop blur for subtle glassmorphism
- ✅ Mouse-tracking radial gradient (follows cursor movement)
- ✅ Spring animations with soft bounce effects
- ✅ Grid mode: Lifts up 8px and scales to 1.03 on hover
- ✅ List mode: Slides 6px horizontally on hover
- ✅ Golden gradient borders (25% → 60% opacity on hover)
- ✅ Inset shadows for 3D depth
- ✅ Auto-reset on mouse leave

### **Enhanced SalonLuxeButton**
- ✅ **NEW Tile Variant**: Appointments page-style glassmorphism button
- ✅ 16px backdrop blur for frosted glass effect
- ✅ Spring animation curve for smooth, bouncy transitions
- ✅ 2px golden borders with hover effects
- ✅ Inset shadows for 3D depth

### **Enhanced SalonLuxeModal**
- ✅ 24px backdrop blur for premium glassmorphism
- ✅ Golden tile borders separating header/content/footer
- ✅ 12-second gradient animation with scaling effects
- ✅ Layered radial gradients for lighting depth
- ✅ Enhanced icon container with glassmorphism
- ✅ **Dialog Support**: SalonLuxeModal handles all dialog needs (no separate dialog component needed)

### **NEW: SalonLuxeInput Component** 📝
- ✅ **Enterprise Form Input**: Glassmorphism text input with golden focus effects
- ✅ 8px backdrop blur for subtle frosted glass
- ✅ Golden borders (25% → 60% opacity on focus)
- ✅ Spring animations with smooth transitions
- ✅ Error/success states with red/green borders and shadows
- ✅ Optional left/right icons with color transitions
- ✅ Bronze placeholder (70% opacity)
- ✅ 48px height for comfortable touch targets
- ✅ Inset shadows for 3D depth

### **NEW: SalonLuxeSelect Component** 🎯
- ✅ **Complete Dropdown System**: Full set of themed select components
- ✅ **Trigger**: 8px blur glassmorphism, golden borders (25% → 60% on focus)
- ✅ **Content**: 16px blur dark dropdown, golden border (35% opacity)
- ✅ **Items**: Hover with golden gradient background (15% → 8%)
- ✅ **Icons**: Golden chevrons with color transitions
- ✅ **Check Marks**: Golden selected state indicators
- ✅ **Labels**: Golden section headers
- ✅ **Separators**: Golden divider lines (20% opacity)
- ✅ Spring animations on all interactions
- ✅ Professional shadows and layering
- ✅ 48px trigger height for form consistency

### **Usage**
```typescript
// NEW: Wrap entire pages with salon luxe theme
<SalonLuxePage
  title="Dashboard"
  description="Manage your salon"
  actions={<SalonLuxeButton variant="tile">New</SalonLuxeButton>}
>
  <div className="p-8">
    {/* Your content here */}
  </div>
</SalonLuxePage>

// NEW: Use SalonLuxeTile for grid/list views
<SalonLuxeTile mode="grid" className="p-6">
  <h3>Content with mouse-tracking gradient</h3>
</SalonLuxeTile>

// Use tile variant for primary CTAs
<SalonLuxeButton variant="tile" size="lg">
  <Clock className="w-4 h-4 mr-2" />
  💾 Save Changes
</SalonLuxeButton>

// Modals automatically include golden borders and glassmorphism
<SalonLuxeModal /* automatically enhanced */>
  {children}
</SalonLuxeModal>

// NEW: Form inputs with glassmorphism
<SalonLuxeInput
  placeholder="Customer name"
  leftIcon={<User className="w-4 h-4" />}
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// NEW: Dropdown selects with golden theme
<SalonLuxeSelect value={staff} onValueChange={setStaff}>
  <SalonLuxeSelectTrigger>
    <SalonLuxeSelectValue placeholder="Select stylist" />
  </SalonLuxeSelectTrigger>
  <SalonLuxeSelectContent>
    <SalonLuxeSelectItem value="jane">Jane Smith</SalonLuxeSelectItem>
    <SalonLuxeSelectItem value="john">John Doe</SalonLuxeSelectItem>
  </SalonLuxeSelectContent>
</SalonLuxeSelect>
```

---

## 💬 FAQ

### Q: Do I need a separate dialog component for the salon luxe theme?
**A:** No! **SalonLuxeModal already handles all dialog/modal needs.** It's built on top of Radix Dialog, so you can use it for:
- Confirmation dialogs
- Form modals
- Selection dialogs
- Information modals
- Any other dialog use case

Just use `<SalonLuxeModal>` wherever you need a dialog with salon luxe styling.

### Q: Can I use regular shadcn Input/Select components?
**A:** You can, but they won't have the salon luxe theme (glassmorphism, golden borders, spring animations). For consistency across your salon application, always use **SalonLuxeInput** and **SalonLuxeSelect** instead.

### Q: Do form components work with React Hook Form?
**A:** Yes! Both components accept standard HTML input/select props and work seamlessly with React Hook Form:

```typescript
import { useForm } from 'react-hook-form'
import { SalonLuxeInput, SalonLuxeSelect } from '@/components/salon/shared'

const { register, handleSubmit } = useForm()

<form onSubmit={handleSubmit(onSubmit)}>
  <SalonLuxeInput
    {...register('customerName')}
    placeholder="Customer name"
  />

  {/* Select works with Controller from react-hook-form */}
</form>
```

### Q: How do I show validation errors?
**A:** Use the `error` and `success` props on **SalonLuxeInput**:

```typescript
<SalonLuxeInput
  placeholder="Email"
  value={email}
  error={!isValidEmail && email.length > 0}
  success={isValidEmail}
  onChange={(e) => setEmail(e.target.value)}
/>
```

---

🎨 **Salon Luxe Theme = Charcoal + Gold + Champagne + Glassmorphism = Enterprise Excellence**
