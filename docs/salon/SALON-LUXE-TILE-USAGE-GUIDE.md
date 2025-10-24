# Salon Luxe Tile Usage Guide
**Enterprise-Grade Glassmorphism Tiles**
**Date**: October 23, 2025
**Component**: `/src/components/salon/shared/SalonLuxeTile.tsx`

---

## 🎯 Overview

The `SalonLuxeTile` component provides the beautiful enterprise-grade tile design from the `/appointments` page. This component features:

✨ **Glassmorphism** - Backdrop blur with semi-transparent gradients
✨ **Mouse Tracking** - Radial gradient follows cursor position
✨ **Spring Animations** - Smooth hover effects with spring easing
✨ **Golden Accents** - Luxe borders that brighten on hover
✨ **Depth Effects** - Inset shadows for 3D appearance

---

## 🚀 Quick Start

### Import the Component

```typescript
import { SalonLuxeTile } from '@/components/salon/shared/SalonLuxeTile'
```

### Basic Usage

```tsx
<SalonLuxeTile mode="grid" className="p-6">
  <h3>Your Content</h3>
  <p>Beautiful glassmorphism tile</p>
</SalonLuxeTile>
```

---

## 📋 Component API

### SalonLuxeTile Props

```typescript
interface SalonLuxeTileProps {
  /** Display mode: 'grid' (vertical lift) or 'list' (horizontal slide) */
  mode?: 'grid' | 'list'

  /** Enable mouse tracking radial gradient (default: true) */
  enableMouseTracking?: boolean

  /** Enable hover animations (default: true) */
  enableHoverEffects?: boolean

  /** Opacity for disabled/archived states (default: 1) */
  opacity?: number

  /** Custom border color (default: golden with 25% opacity) */
  borderColor?: string

  /** Custom background gradient (default: champagne to gold gradient) */
  background?: string

  /** Standard HTML div attributes */
  className?: string
  style?: React.CSSProperties
  onClick?: () => void
  children: ReactNode
}
```

---

## 🎨 Usage Patterns

### 1. Grid Tiles (Dashboard Cards, Service Cards)

**Perfect for**: Service cards, product cards, appointment cards, dashboard widgets

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {services.map(service => (
    <SalonLuxeTile
      key={service.id}
      mode="grid"
      className="p-6"
      onClick={() => handleEdit(service)}
      enableMouseTracking
      enableHoverEffects
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-bold text-champagne">
          {service.entity_name}
        </h3>
        <span className="text-2xl">✨</span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-bronze">Price</span>
          <span className="font-semibold text-gold">
            {currency} {service.price_market}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-bronze">Duration</span>
          <span className="text-champagne">{service.duration_min} min</span>
        </div>
      </div>
    </SalonLuxeTile>
  ))}
</div>
```

**Hover Effect**: Lifts up 8px and scales to 1.03x

---

### 2. List Tiles (Table Rows, List Items)

**Perfect for**: Table rows, list items, transaction history

```tsx
<div className="space-y-3">
  {appointments.map(appointment => (
    <SalonLuxeTile
      key={appointment.id}
      mode="list"
      className="p-4 flex items-center justify-between"
      onClick={() => viewDetails(appointment)}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-gold" />
        </div>
        <div>
          <h4 className="font-semibold text-champagne">{appointment.customer_name}</h4>
          <p className="text-sm text-bronze">{appointment.service_name}</p>
        </div>
      </div>

      <div className="text-right">
        <div className="font-bold text-gold">{appointment.time}</div>
        <div className="text-xs text-bronze">{appointment.status}</div>
      </div>
    </SalonLuxeTile>
  ))}
</div>
```

**Hover Effect**: Slides right 6px horizontally

---

### 3. Stat/KPI Cards

**Perfect for**: Dashboard KPIs, statistics, metrics

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <SalonLuxeTile mode="grid" className="p-6">
    <div className="flex items-start justify-between mb-3">
      <span className="text-sm font-medium tracking-wide uppercase text-bronze">
        Total Services
      </span>
      <Sparkles className="w-5 h-5 text-gold" />
    </div>
    <div className="text-3xl font-bold text-champagne mb-1">
      {stats.total}
    </div>
    <div className="text-xs text-bronze">All services</div>
  </SalonLuxeTile>

  {/* More stat cards... */}
</div>
```

---

### 4. Disabled/Archived States

**For archived or disabled items:**

```tsx
<SalonLuxeTile
  mode="grid"
  opacity={0.6}  // Reduced opacity for archived
  enableHoverEffects={false}  // Disable animations
  className="p-6"
>
  <div className="space-y-2">
    <h3 className="text-champagne">Archived Service</h3>
    <span className="text-xs text-bronze/60">This service is no longer active</span>
  </div>
</SalonLuxeTile>
```

---

### 5. Custom Colors for Different Categories

**Color-coded tiles:**

```tsx
const categoryColors = {
  'Hair': 'rgba(212, 175, 55, 0.25)',  // Gold
  'Nails': 'rgba(232, 180, 184, 0.25)', // Rose
  'Spa': 'rgba(15, 111, 92, 0.25)'     // Emerald
}

<SalonLuxeTile
  mode="grid"
  borderColor={categoryColors[service.category]}
  className="p-6"
>
  {/* Content */}
</SalonLuxeTile>
```

---

## 🎭 Animation Details

### Grid Mode Hover
- **Transform**: `translateY(-8px) scale(1.03)`
- **Shadow**: `0 20px 40px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.15)`
- **Border**: Brightens to 60% opacity
- **Duration**: 500ms
- **Easing**: Spring curve `cubic-bezier(0.34, 1.56, 0.64, 1)`

### List Mode Hover
- **Transform**: `translateX(6px)` (slides right)
- **Shadow**: Same as grid mode
- **Border**: Same as grid mode

### Mouse Tracking
- **Effect**: Radial gradient follows cursor
- **Center**: Full gold glow (15% opacity)
- **Middle**: Reduced glow (8% opacity)
- **Edge**: Subtle glow (3% opacity)

---

## 📐 Layout Patterns

### Responsive Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  {items.map(item => (
    <SalonLuxeTile key={item.id} mode="grid" className="p-6">
      {/* Content */}
    </SalonLuxeTile>
  ))}
</div>
```

### List with Spacing

```tsx
<div className="space-y-3 md:space-y-4">
  {items.map(item => (
    <SalonLuxeTile key={item.id} mode="list" className="p-4">
      {/* Content */}
    </SalonLuxeTile>
  ))}
</div>
```

---

## ✅ Best Practices

### DO ✅
- Use `mode="grid"` for cards that are stacked in a grid
- Use `mode="list"` for items in a vertical list
- Add `p-6` (padding) for grid tiles, `p-4` for list tiles
- Enable mouse tracking for interactive elements
- Use `opacity={0.6}` for archived/disabled states
- Wrap in responsive grids: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`

### DON'T ❌
- Don't disable animations on clickable tiles (breaks UX)
- Don't use list mode for grid layouts (wrong animation direction)
- Don't forget padding classes (content will touch edges)
- Don't nest tiles inside tiles (performance issue)
- Don't override `transitionTimingFunction` (breaks spring animation)

---

## 🔥 Page Migration Checklist

When updating a page to use SalonLuxeTile:

- [ ] Replace old card/div wrappers with `<SalonLuxeTile>`
- [ ] Choose correct mode: `grid` or `list`
- [ ] Add appropriate padding: `p-6` (grid) or `p-4` (list)
- [ ] Verify hover effects work correctly
- [ ] Test mouse tracking gradient
- [ ] Check mobile responsiveness
- [ ] Verify archived/disabled states use `opacity={0.6}`
- [ ] Test click handlers still work

---

## 📱 Mobile Optimization

**The tile component is fully mobile-optimized:**

```tsx
{/* Mobile: Stack vertically, Desktop: Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <SalonLuxeTile mode="grid" className="p-4 md:p-6">
    {/* Smaller padding on mobile */}
  </SalonLuxeTile>
</div>
```

**Touch devices:**
- Mouse tracking is automatically disabled on touch devices
- Hover effects still work with active/focus states
- Spring animations provide tactile feedback

---

## 🎯 Examples from /appointments Page

The appointments page uses this tile design perfectly. Reference:

**Location**: `/src/app/salon/appointments/page.tsx`
**Lines**: 1083-1125 (Main appointment tile implementation)

Key features implemented:
- ✅ Glassmorphism background
- ✅ Mouse tracking radial gradient
- ✅ Spring animation on hover
- ✅ Golden border that brightens
- ✅ Inset shadow for depth
- ✅ Archived state with opacity

---

## 🚀 Quick Migration Example

### Before (Old Card)
```tsx
<div className="bg-charcoal rounded-lg p-6 border border-gold/20 hover:border-gold/40">
  <h3>{service.name}</h3>
  <p>{service.price}</p>
</div>
```

### After (SalonLuxeTile)
```tsx
<SalonLuxeTile mode="grid" className="p-6" onClick={() => editService(service)}>
  <h3>{service.name}</h3>
  <p>{service.price}</p>
</SalonLuxeTile>
```

**Result**: Instant enterprise-grade design with all animations! 🎉

---

## 📚 Related Components

- **SalonLuxePage**: Main page wrapper with glassmorphism container
- **SalonLuxeKPICard**: Pre-built KPI cards (can be nested in tiles)
- **PremiumMobileHeader**: Mobile-first header component

---

## 🎨 Color Reference

```typescript
const LUXE_COLORS = {
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  charcoal: '#1A1A1A',
  black: '#0B0B0B'
}
```

**Default gradient:**
```css
background: linear-gradient(135deg,
  rgba(245,230,200,0.08) 0%,
  rgba(212,175,55,0.05) 50%,
  rgba(184,134,11,0.03) 100%
)
```

---

**Ready to use! Import `SalonLuxeTile` and transform your pages into enterprise-grade designs! ✨**
