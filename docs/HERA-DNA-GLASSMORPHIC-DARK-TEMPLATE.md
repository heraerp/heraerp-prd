# HERA DNA Design Template: Glassmorphic Dark

## Overview

The **Glassmorphic Dark** template is a premium design system for HERA applications featuring a sophisticated dark theme with glassmorphic effects, animated gradients, and professional depth. This template was extracted from the successful ISP module implementation and standardized for reuse across all HERA modules.

## Key Features

### 1. **Dark Slate Base**
- Primary background: Gradient from primary color through `slate-950` to dark base
- Card backgrounds: `bg-slate-900/50` with backdrop blur
- Professional dark aesthetic perfect for data-heavy interfaces

### 2. **Animated Background Blobs**
- Three floating gradient orbs with `mix-blend-multiply`
- Staggered animations for organic movement
- Opacity levels: 30-40% for subtle depth
- Creates dynamic, living interface

### 3. **Glassmorphic Cards**
- Semi-transparent backgrounds with backdrop blur
- Subtle borders: `border-white/10`
- Hover effects with gradient glow
- Consistent `rounded-2xl` for modern look

### 4. **Three-Color Gradient System**
- **Primary**: Main brand color (darker blue/navy)
- **Secondary**: Lighter accent (cyan/teal)
- **Accent**: Bright highlight (gold/yellow)
- **Danger**: Alert states (pink/red)
- All gradients use `from-to` or `from-via-to` patterns

### 5. **Professional Interactions**
- Hover states: Opacity transitions from 0 to 40%
- Button shadows: `hover:shadow-lg hover:shadow-[color]/40`
- Smooth transitions: `transition-all duration-300`
- Group hover effects for complex components

## Pre-Built Color Themes

### ISP/Telecom (Blue Spectrum)
```javascript
primary: '#0049B7'    // Deep blue
secondary: '#0099CC'  // Cyan
accent: '#FFD700'     // Gold
```

### Healthcare (Teal Spectrum)
```javascript
primary: '#00695C'    // Deep teal
secondary: '#00897B'  // Light teal
accent: '#64DD17'     // Lime
```

### Finance (Navy Spectrum)
```javascript
primary: '#1A237E'    // Navy
secondary: '#5C6BC0'  // Purple-blue
accent: '#FFC107'     // Amber
```

### Restaurant (Warm Spectrum)
```javascript
primary: '#E65100'    // Deep orange
secondary: '#FF6F00'  // Bright orange
accent: '#FFEB3B'     // Yellow
```

### Manufacturing (Industrial)
```javascript
primary: '#37474F'    // Blue-grey
secondary: '#546E7A'  // Light blue-grey
accent: '#FF9800'     // Orange
```

### Retail (Purple Spectrum)
```javascript
primary: '#6A1B9A'    // Deep purple
secondary: '#AB47BC'  // Light purple
accent: '#FFD600'     // Gold
```

## Component Patterns

### Layout Structure
```jsx
<div className="min-h-screen bg-gradient-to-br from-[primary] via-slate-950 to-[darkBase]">
  {/* Animated blobs */}
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {/* 3 animated gradient orbs */}
  </div>
  
  {/* Main content */}
  {children}
</div>
```

### Card Pattern
```jsx
<div className="relative group">
  {/* Hover glow */}
  <div className="absolute -inset-0.5 bg-gradient-to-r from-[secondary] to-[primary] 
                  rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
  
  {/* Card content */}
  <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
    {content}
  </div>
</div>
```

### Button Pattern
```jsx
<button className="relative group">
  {/* Hover glow */}
  <div className="absolute -inset-0.5 bg-gradient-to-r from-[secondary] to-[primary] 
                  rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
  
  {/* Button content */}
  <div className="relative flex items-center space-x-2 px-4 py-2 
                  bg-gradient-to-r from-[secondary] to-[primary] text-white rounded-lg 
                  font-medium hover:shadow-lg hover:shadow-[secondary]/40 
                  transition-all duration-300">
    <Icon className="h-5 w-5" />
    <span>Button Text</span>
  </div>
</button>
```

### Stat Card Pattern
```jsx
<div className="relative group">
  <div className="absolute -inset-0.5 bg-gradient-to-r from-[color] to-[color2] 
                  rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
  <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-xl p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-white/60 text-sm">Metric Label</p>
        <p className="text-2xl font-bold text-white mt-1">Value</p>
      </div>
      <div className="p-2 bg-gradient-to-br from-[secondary] to-[primary] rounded-lg">
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
</div>
```

## Usage Guidelines

### 1. **Color Selection**
- Choose colors with sufficient contrast against dark backgrounds
- Primary color should be darker than secondary
- Accent color should be bright enough to stand out
- Test all gradients for visibility

### 2. **Opacity Levels**
- Background cards: `bg-slate-900/50` (50% opacity)
- Hover states: `opacity-40` for effects
- Animated blobs: `opacity-30` to `opacity-40`
- Borders: `border-white/10` for subtle definition

### 3. **Gradient Directions**
- `to-r`: Left to right for horizontal elements
- `to-br`: Top-left to bottom-right for cards
- `to-b`: Top to bottom for vertical elements
- Always use smooth color transitions

### 4. **Responsive Design**
- Use responsive grid layouts
- Hide non-essential elements on mobile
- Ensure touch targets are adequate
- Test blur effects on lower-end devices

### 5. **Performance**
- Limit animated elements per page
- Use `pointer-events-none` on decorative elements
- Consider reducing blur on mobile devices
- Lazy load heavy components

## Implementation Example

```typescript
// In your module layout
import { glassmorphicThemes } from '@/lib/dna/templates/glassmorphic-dark-template'

// Select or customize theme
const theme = glassmorphicThemes.healthcare // or create custom

// Apply to layout
export default function HealthcareLayout({ children }) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-[${theme.colors.primary}] via-slate-950 to-[${theme.colors.darkBase}]`}>
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Add animated blobs with theme colors */}
      </div>
      
      {/* Sidebar with glassmorphic style */}
      <aside className="bg-slate-900/50 backdrop-blur-xl border-r border-white/10">
        {/* Navigation */}
      </aside>
      
      {/* Main content */}
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}
```

## Best Practices

1. **Maintain Consistency**
   - Use the same gradient patterns throughout
   - Keep opacity levels consistent
   - Apply hover effects uniformly

2. **Accessibility**
   - Ensure text contrast meets WCAG standards
   - Provide focus indicators
   - Test with reduced motion preferences

3. **Customization**
   - Start with pre-built themes
   - Adjust colors to match brand
   - Test thoroughly in different lighting

4. **Module Integration**
   - Each HERA module can have its own theme
   - Share common components
   - Maintain visual hierarchy

This template provides a sophisticated, modern design system that enhances the professional appearance of HERA applications while maintaining excellent usability and performance.