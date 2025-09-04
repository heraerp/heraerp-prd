# HERA Design System™
**Official Design Guidelines for HERA ERP Applications**

## Core Design Principles

### 1. **Gradient-First Design**
- Primary gradient: Purple → Blue → Cyan (`#7C3AED` → `#3B82F6` → `#06B6D4`)
- Subtle, professional gradients that add depth without distraction
- Background gradients fade to white/off-white at bottom for readability

### 2. **Enterprise-Ready Typography**
- **Font Stack**: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- **Font Weights**: 
  - Regular text: `font-medium` (500)
  - Important text: `font-semibold` (600) 
  - Headlines: `font-bold` (700) to `font-black` (900)
- **High Contrast**: All text uses darker shades for maximum readability
  - Primary text: `text-gray-800` or darker
  - Secondary text: `text-gray-700` minimum
  - Never use `text-gray-400` or lighter for content

### 3. **Single-Screen Philosophy**
- Login/auth pages fit perfectly on one screen without scrolling
- Use flexbox with `flex-grow` and `flex-shrink` for optimal space distribution
- Responsive spacing that adapts to screen size

### 4. **Subtle Animations**
- Background elements: 8s+ animation duration for gentle movement
- Small opacity changes (0.15 → 0.25 max)
- Minimal scale transformations (1 → 1.05 max)
- Hover effects: `hover:scale-105` with smooth transitions

### 5. **Mobile-First Responsive Design**
- Input heights: `h-10 md:h-12` (40px mobile, 48px desktop)
- Text sizes scale appropriately: `text-base md:text-lg`
- Spacing adjusts: `mb-4 md:mb-6`
- Some elements hidden on mobile for cleaner experience

## Color Palette

### Primary Colors
```css
/* Gradient stops */
--hera-purple: #7C3AED;
--hera-purple-dark: #6366F1;
--hera-blue: #3B82F6;
--hera-sky: #0EA5E9;
--hera-cyan: #06B6D4;

/* Action colors */
--hera-violet-600: #7C3AED;
--hera-violet-700: #6D28D9;
--hera-violet-800: #5B21B6;
```

### Text Colors
```css
/* Always high contrast */
--text-primary: #1F2937;    /* gray-800 */
--text-secondary: #374151;  /* gray-700 */
--text-tertiary: #4B5563;   /* gray-600 */
--text-light: #6B7280;      /* gray-500 - use sparingly */
```

### Background Colors
```css
--bg-white: #FFFFFF;
--bg-off-white: #F8FAFC;
--bg-input: #F9FAFB;        /* gray-50 */
--bg-card: rgba(255, 255, 255, 0.98);
```

## Component Standards

### Cards
```css
.hera-card {
  @apply bg-white shadow-2xl border border-gray-100 transition-all duration-300;
}
```

### Buttons
```css
.hera-button-primary {
  @apply bg-gradient-to-r from-violet-600 to-sky-600 
         hover:from-violet-700 hover:to-sky-700
         text-white font-semibold shadow-lg hover:shadow-xl 
         transform hover:-translate-y-0.5 transition-all duration-200;
}
```

### Inputs
```css
.hera-input {
  @apply h-10 md:h-12 bg-gray-50 border-gray-200 
         focus:ring-2 focus:ring-violet-500 focus:border-transparent 
         transition-all;
}
```

### Background Effects
```css
/* Subtle animated blobs */
.hera-blob {
  @apply rounded-full filter blur-3xl animate-subtle-pulse;
}

/* Sizes: Mobile first */
.hera-blob-sm { @apply w-32 h-32 md:w-48 md:h-48; }
.hera-blob-md { @apply w-48 h-48 md:w-64 md:h-64; }
.hera-blob-lg { @apply w-64 h-64 md:w-80 md:h-80; }

/* Opacity levels */
.hera-blob-subtle { @apply opacity-10; }
.hera-blob-light { @apply opacity-15; }
.hera-blob-medium { @apply opacity-20; }
```

## Animation Timing
```css
/* Subtle pulse for background elements */
@keyframes subtle-pulse {
  0%, 100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.25; transform: scale(1.05); }
}

/* Animation durations */
--animation-fast: 0.2s;      /* Micro-interactions */
--animation-normal: 0.3s;    /* Hover effects */
--animation-slow: 0.5s;      /* Page transitions */
--animation-bg-slow: 8s;     /* Background animations */
--animation-gradient: 20s;   /* Gradient animations */
```

## Logo Standards
- Use PNG logo at `/public/logo.png`
- Heights: `h-16 md:h-20` (64px mobile, 80px desktop)
- Always include hover effect: `transform hover:scale-105 transition-transform duration-300`

## Typography Scale
```css
/* Mobile → Desktop */
.hera-text-xs { @apply text-xs; }
.hera-text-sm { @apply text-sm md:text-base; }
.hera-text-base { @apply text-base md:text-lg; }
.hera-text-lg { @apply text-lg md:text-xl; }
.hera-text-xl { @apply text-xl md:text-2xl; }
.hera-text-2xl { @apply text-2xl md:text-3xl; }
.hera-text-3xl { @apply text-3xl md:text-4xl; }
```

## Page Layout Structure
```jsx
<div className="h-screen flex items-center justify-center relative overflow-hidden">
  {/* Gradient background */}
  <div className="absolute inset-0 animate-gradient-x" style={{
    background: 'linear-gradient(135deg, #7dd3fc 0%, #c084fc 50%, #f0f4f8 100%)'
  }} />
  
  {/* Animated blobs */}
  <div className="absolute inset-0">
    <div className="hera-blob hera-blob-sm hera-blob-light absolute top-10 left-10" />
    <div className="hera-blob hera-blob-sm hera-blob-subtle absolute top-1/3 right-10" />
  </div>
  
  {/* White overlay for bottom */}
  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60" />
  
  {/* Content */}
  <div className="relative z-10">
    {/* Your content here */}
  </div>
</div>
```

## Spacing System
```css
/* Use consistent spacing scale */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

## Implementation Guidelines

### 1. **Always Mobile First**
- Design for small screens first
- Add desktop enhancements with `md:` prefix
- Test on real devices, not just browser DevTools

### 2. **Accessibility**
- Maintain WCAG AA contrast ratios
- All interactive elements need focus states
- Include proper ARIA labels
- Test with keyboard navigation

### 3. **Performance**
- Use CSS transforms for animations (GPU accelerated)
- Limit blur effects on mobile for better performance
- Lazy load images and heavy components
- Keep animation frame rate smooth (60fps)

### 4. **Brand Consistency**
- Always use the gradient color palette
- Maintain the subtle, professional aesthetic
- Keep animations smooth and non-distracting
- Ensure readability is never compromised for style

## Usage Examples

### Login Page Implementation
See `/src/app/test-canva-colors/page.tsx` for the reference implementation

### Component Library
All HERA UI components should follow these patterns:
- `HeraButton`
- `HeraCard` 
- `HeraInput`
- `HeraSelect`
- `HeraModal`
- `HeraTable`

## Design Tokens
```typescript
export const heraTheme = {
  colors: {
    primary: {
      50: '#F0F9FF',
      100: '#E0F2FE',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    violet: {
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
    },
    cyan: {
      500: '#06B6D4',
      600: '#0891B2',
      700: '#0E7490',
    }
  },
  animation: {
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
    bgSlow: '8000ms',
    gradient: '20000ms',
  }
}
```

---

## Summary
The HERA Design System prioritizes:
1. **Professional gradients** with subtle animations
2. **High contrast** for readability
3. **Mobile-first** responsive design
4. **Enterprise-ready** components
5. **Consistent spacing** and typography
6. **Performance** and accessibility

This design system creates a cohesive, modern, and professional appearance across all HERA applications while maintaining excellent usability and performance.