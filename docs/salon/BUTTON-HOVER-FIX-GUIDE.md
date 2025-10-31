# Salon Button Hover Fix Guide

## Problem
Buttons across `/salon` components have bright, flashy hover effects that feel unprofessional and jarring.

## Root Cause
1. Using generic Shadcn `Button` component with `transition-colors` default
2. Using `hover:opacity-90` which creates brightness flashes
3. Inline gradient styles without proper hover states

## Solution: Use SalonLuxeButton

### ❌ **WRONG** - Bright Flash Hover
```tsx
import { Button } from '@/components/ui/button'

// BAD: Opacity change creates brightness flash
<Button
  className="hover:opacity-90"
  style={{
    background: `linear-gradient(135deg, ${COLORS.gold} 0%, #B8860B 100%)`
  }}
>
  Click Me
</Button>

// BAD: Generic Button with inline gradients
<Button
  style={{
    background: `linear-gradient(135deg, ${COLORS.gold} 0%, #B8860B 100%)`,
    color: COLORS.charcoal
  }}
>
  Click Me
</Button>
```

### ✅ **CORRECT** - Subtle Scale Hover
```tsx
import { SalonLuxeButton } from '@/components/salon/shared/SalonLuxeButton'

// GOOD: Uses subtle scale (1.02) + shadow
<SalonLuxeButton
  variant="primary"
  size="md"
  icon={<Plus className="w-4 h-4" />}
>
  Click Me
</SalonLuxeButton>

// GOOD: Outline variant with consistent hover
<SalonLuxeButton
  variant="outline"
  size="md"
>
  Cancel
</SalonLuxeButton>
```

## Available Variants

### 1. Primary (Gold Gradient)
```tsx
<SalonLuxeButton variant="primary" size="md">
  Confirm
</SalonLuxeButton>
```
- **Use for**: Primary actions, confirmations, main CTA
- **Hover**: Subtle scale (1.02) + brighter gradient + shadow
- **Colors**: Gold gradient on dark charcoal text

### 2. Outline (Transparent with Border)
```tsx
<SalonLuxeButton variant="outline" size="md">
  Cancel
</SalonLuxeButton>
```
- **Use for**: Secondary actions, cancel buttons
- **Hover**: Subtle gold background glow (rgba 0.05)
- **Colors**: Gold border with champagne text

### 3. Danger (Rose/Pink for Destructive)
```tsx
<SalonLuxeButton variant="danger" size="md">
  Delete
</SalonLuxeButton>
```
- **Use for**: Destructive actions, warnings
- **Hover**: Subtle scale + border highlight
- **Colors**: Rose background with rose text

### 4. Ghost (Minimal)
```tsx
<SalonLuxeButton variant="ghost" size="sm">
  Skip
</SalonLuxeButton>
```
- **Use for**: Tertiary actions, dismissals
- **Hover**: Subtle charcoal background
- **Colors**: Transparent with secondary text

### 5. Tile (Glassmorphism)
```tsx
<SalonLuxeButton variant="tile" size="lg">
  Appointments
</SalonLuxeButton>
```
- **Use for**: Dashboard tiles, navigation cards
- **Hover**: Spring animation (translateY + scale) + glow
- **Colors**: Glassmorphism with gold borders

## Size Options
```tsx
size="sm"  // h-9, px-4, text-sm
size="md"  // h-12, px-6, text-base (default)
size="lg"  // h-14, px-8, text-lg
```

## Additional Features

### Loading State
```tsx
<SalonLuxeButton
  variant="primary"
  loading={isSubmitting}
>
  {isSubmitting ? 'Saving...' : 'Save'}
</SalonLuxeButton>
```

### With Icon
```tsx
<SalonLuxeButton
  variant="primary"
  icon={<Plus className="w-4 h-4" />}
>
  Add Item
</SalonLuxeButton>
```

### Disabled State
```tsx
<SalonLuxeButton
  variant="primary"
  disabled={!isValid}
>
  Submit
</SalonLuxeButton>
```

## Migration Checklist

When migrating buttons across `/salon`:

- [ ] Replace `import { Button }` with `import { SalonLuxeButton }`
- [ ] Change `<Button` to `<SalonLuxeButton`
- [ ] Replace `variant="outline"` with proper salon variant
- [ ] Remove `hover:opacity-*` classes
- [ ] Remove inline `style` props for gradients (handled by variant)
- [ ] Use `icon` prop instead of inline icon elements
- [ ] Use `loading` prop instead of manual loading states
- [ ] Remove custom transition classes (handled internally)

## Testing
After migration, verify:
1. ✅ No bright flashes on hover
2. ✅ Smooth scale animation (should feel "pressed")
3. ✅ Consistent with other salon components
4. ✅ Loading states work correctly
5. ✅ Disabled states are visually clear

## Examples

### Before (Bad)
```tsx
<Button
  onClick={handleSubmit}
  style={{
    background: `linear-gradient(135deg, ${COLORS.gold} 0%, #B8860B 100%)`,
    color: COLORS.charcoal
  }}
  className="hover:opacity-90 transition-all"
>
  <Plus className="w-4 h-4 mr-2" />
  Add Item
</Button>
```

### After (Good)
```tsx
<SalonLuxeButton
  onClick={handleSubmit}
  variant="primary"
  size="md"
  icon={<Plus className="w-4 h-4" />}
>
  Add Item
</SalonLuxeButton>
```

## Reference Implementation
- **Component**: `/src/components/salon/shared/SalonLuxeButton.tsx`
- **Fixed Component**: `/src/components/salon/pos/ScanToCart.tsx` (see commit eeee6cb00)
- **Colors**: `/src/lib/constants/salon-luxe-colors.ts`

## Hover Physics

SalonLuxeButton uses proper interaction physics:
- **Scale**: `1.0 → 1.02` (subtle growth)
- **Shadow**: Increases depth on hover
- **Timing**: 300ms ease transition
- **Active**: `scale(0.95)` for pressed state
- **No opacity changes** - prevents brightness flashes

This creates a tactile, responsive feel without visual jarring.
