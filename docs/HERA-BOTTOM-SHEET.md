# HERA Bottom Sheet Component

## Overview

The HERA Bottom Sheet is a production-ready mobile UI component that provides a smooth, gesture-based panel that slides up from the bottom of the screen. It follows HERA DNA design patterns and provides an excellent mobile experience while working seamlessly on desktop devices.

## Features

### Core Features
- ✅ **Gesture-Based Interactions** - Smooth drag to dismiss with velocity detection
- ✅ **Multiple Snap Points** - Support for full, half, auto, or custom snap positions
- ✅ **Backdrop Overlay** - Customizable opacity with click-to-dismiss support
- ✅ **Keyboard-Aware** - Automatically adjusts for on-screen keyboards
- ✅ **Full Accessibility** - ARIA labels, focus trap, keyboard navigation
- ✅ **Mobile-First Design** - Optimized for touch with desktop compatibility

### Visual Design
- 🎨 **HERA DNA Styling** - Consistent with the HERA design system
- ✨ **Smooth Animations** - Framer Motion powered with spring physics
- 📱 **Handle Indicator** - Visual affordance for dragging
- 🌗 **Theme Support** - Full light/dark mode compatibility
- 🔒 **Safe Area Handling** - Respects mobile device safe areas

### Developer Experience
- 📝 **Simple API** - Declarative component with intuitive props
- 🎮 **Controlled/Uncontrolled** - Works in both modes
- 🔧 **Customizable** - Extensive customization options
- 📞 **Event Callbacks** - Rich event system for integration
- 🚀 **Portal Rendering** - Proper layering without z-index issues

## Installation

The Bottom Sheet component is part of the HERA DNA component library and has the following dependencies:

```bash
# Already included in HERA:
- react
- framer-motion
- lucide-react
- tailwindcss
```

## Basic Usage

```tsx
import { BottomSheet, useBottomSheet } from '@/lib/dna/components/mobile/BottomSheet'
import { HeraButtonDNA } from '@/lib/dna/components/ui/hera-button-dna'

function MyComponent() {
  const { isOpen, open, close, sheetProps } = useBottomSheet()

  return (
    <>
      <HeraButtonDNA onClick={open}>
        Open Bottom Sheet
      </HeraButtonDNA>

      <BottomSheet
        {...sheetProps}
        title="Select an Option"
        description="Choose from the available options below"
      >
        <div className="space-y-4">
          <button className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
            Option 1
          </button>
          <button className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
            Option 2
          </button>
          <button className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
            Option 3
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
```

## Advanced Usage

### Custom Snap Points

```tsx
<BottomSheet
  open={isOpen}
  onClose={handleClose}
  snapPoints={['25%', '50%', '90%']} // Or use pixels: [200, 400, 600]
  defaultSnapPoint={1} // Start at 50%
  onSnapChange={(index) => console.log('Snapped to:', index)}
  title="Multi-Height Sheet"
>
  <div className="min-h-[600px]">
    <p>Drag to resize between snap points</p>
  </div>
</BottomSheet>
```

### Imperative Control

```tsx
function ControlledExample() {
  const sheetRef = useRef<BottomSheetRef>(null)

  const handleExpand = () => {
    sheetRef.current?.expand() // Snap to full height
  }

  const handleCollapse = () => {
    sheetRef.current?.collapse() // Snap to minimum height
  }

  const handleSnapToMiddle = () => {
    sheetRef.current?.snapTo(1) // Snap to index 1
  }

  return (
    <BottomSheet
      ref={sheetRef}
      open={true}
      snapPoints={['25%', '50%', '90%']}
    >
      <div className="space-y-4">
        <button onClick={handleExpand}>Expand</button>
        <button onClick={handleCollapse}>Collapse</button>
        <button onClick={handleSnapToMiddle}>Snap to Middle</button>
      </div>
    </BottomSheet>
  )
}
```

### Custom Header and Footer

```tsx
<BottomSheet
  open={isOpen}
  onClose={handleClose}
  header={
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold">Custom Header</h2>
      <button className="text-blue-600">Action</button>
    </div>
  }
  footer={
    <div className="flex gap-4">
      <HeraButtonDNA variant="outline" fullWidth onClick={handleClose}>
        Cancel
      </HeraButtonDNA>
      <HeraButtonDNA fullWidth onClick={handleConfirm}>
        Confirm
      </HeraButtonDNA>
    </div>
  }
>
  <div className="py-8">Content goes here</div>
</BottomSheet>
```

### Using Presets

```tsx
import { BottomSheet, BottomSheetPresets } from '@/lib/dna/components/mobile/BottomSheet'

// Full screen modal
<BottomSheet
  {...BottomSheetPresets.fullScreen}
  open={isOpen}
  onClose={handleClose}
>
  <FullScreenContent />
</BottomSheet>

// Picker style
<BottomSheet
  {...BottomSheetPresets.picker}
  open={isOpen}
  onClose={handleClose}
>
  <PickerContent />
</BottomSheet>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls visibility state |
| `onClose` | `() => void` | - | Callback when sheet requests to close |
| `children` | `ReactNode` | - | Sheet content (required) |
| `title` | `string` | - | Accessibility title |
| `description` | `string` | - | Accessibility description |
| `snapPoints` | `(number \| string)[]` | `['25%', '50%', '90%']` | Height snap points |
| `defaultSnapPoint` | `number` | `1` | Initial snap point index |
| `enableDrag` | `boolean` | `true` | Enable drag gestures |
| `enableBackdropDismiss` | `boolean` | `true` | Click backdrop to close |
| `backdropOpacity` | `number` | `0.5` | Backdrop opacity (0-1) |
| `className` | `string` | - | Custom sheet container class |
| `contentClassName` | `string` | - | Custom content wrapper class |
| `onSnapChange` | `(index: number) => void` | - | Snap point change callback |
| `showHandle` | `boolean` | `true` | Show drag handle indicator |
| `closeButton` | `'none' \| 'icon' \| 'text'` | `'icon'` | Close button variant |
| `header` | `ReactNode` | - | Custom header content |
| `footer` | `ReactNode` | - | Custom footer content |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `lockBodyScroll` | `boolean` | `true` | Prevent body scroll when open |
| `animationDuration` | `number` | `300` | Animation duration in ms |
| `disableAnimation` | `boolean` | `false` | Disable animations |

## Imperative API

The `BottomSheetRef` provides these methods:

```tsx
interface BottomSheetRef {
  snapTo: (index: number) => void       // Snap to specific point
  getCurrentSnapPoint: () => number      // Get current snap index
  expand: () => void                    // Expand to full height
  collapse: () => void                  // Collapse to minimum
}
```

## Accessibility

The Bottom Sheet component follows WAI-ARIA guidelines for dialogs:

- **Role**: `dialog` with `aria-modal="true"`
- **Labeling**: Uses `aria-labelledby` and `aria-describedby`
- **Focus Management**: Traps focus within the sheet
- **Keyboard Navigation**: 
  - `Escape` closes the sheet
  - `Tab` cycles through focusable elements
  - `Shift+Tab` reverse cycles
- **Screen Reader**: Announces title and description

## Styling & Customization

### Using Tailwind Classes

```tsx
<BottomSheet
  className="bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-gray-800"
  contentClassName="px-8 py-6"
  open={isOpen}
  onClose={handleClose}
>
  <StyledContent />
</BottomSheet>
```

### Theme Variables

The component automatically adapts to your theme:

```css
/* Light mode */
--sheet-bg: white
--sheet-border: rgb(229 231 235)
--sheet-shadow: 0 -4px 20px rgba(0,0,0,0.1)

/* Dark mode */
--sheet-bg: rgb(17 24 39)
--sheet-border: rgb(55 65 81)
--sheet-shadow: 0 -4px 20px rgba(0,0,0,0.3)
```

## Performance Considerations

1. **Portal Rendering**: The sheet renders in a portal to avoid z-index issues
2. **Lazy Mounting**: Content is only rendered when `open={true}`
3. **GPU Acceleration**: Transforms use `translateY` for smooth animations
4. **Debounced Resize**: Window resize events are optimized
5. **Focus Management**: Only queries focusable elements when needed

## Mobile Considerations

1. **Safe Areas**: Includes `pb-safe` class for iPhone notches
2. **Touch Gestures**: Optimized touch targets (min 44px)
3. **Momentum Scrolling**: Uses `-webkit-overflow-scrolling: touch`
4. **Viewport Lock**: Prevents body scroll when open
5. **Keyboard Handling**: Adjusts position for on-screen keyboards

## Common Use Cases

### 1. Action Sheets
```tsx
<BottomSheet {...sheetProps} title="Share">
  <ShareOptions onSelect={handleShare} />
</BottomSheet>
```

### 2. Form Inputs
```tsx
<BottomSheet {...sheetProps} title="Edit Profile">
  <ProfileForm onSubmit={handleSubmit} />
</BottomSheet>
```

### 3. Filters & Settings
```tsx
<BottomSheet {...sheetProps} snapPoints={['auto', '90%']}>
  <FilterOptions filters={filters} onChange={handleFilterChange} />
</BottomSheet>
```

### 4. Media Pickers
```tsx
<BottomSheet {...sheetProps} title="Choose Photo">
  <PhotoGrid photos={photos} onSelect={handlePhotoSelect} />
</BottomSheet>
```

## Browser Support

- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (Desktop & iOS)
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet
- ⚠️ IE11 (Not supported - requires polyfills)

## Best Practices

1. **Content Height**: Ensure content fits within snap points
2. **Touch Targets**: Keep interactive elements ≥44px
3. **Loading States**: Show loading indicators for async content
4. **Error Handling**: Provide clear error messages
5. **Responsive Design**: Test on various screen sizes
6. **Animation Performance**: Use `will-change` for heavy content
7. **Accessibility**: Always provide title/description
8. **Memory Management**: Clean up event listeners properly