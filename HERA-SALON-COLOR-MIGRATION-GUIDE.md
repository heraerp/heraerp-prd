# HERA Salon Color Palette Migration Guide

This guide will help you apply the new HERA Salon design system colors to your existing salon app while maintaining consistency and minimizing disruption.

## 🎨 Color Mapping Strategy

### Current Colors → HERA Salon Colors

| Current Usage | Current Color | New HERA Salon Color | CSS Variable |
|--------------|---------------|---------------------|--------------|
| Primary buttons/links | `purple-*` | Royal Purple | `hera-primary-*` |
| Pink accents | `pink-*` | Vibrant Magenta | `hera-pink-*` |
| Success/eco elements | `green-*`, `emerald-*` | Fresh Teal | `hera-teal-*` |
| Backgrounds | `gray-50`, `white` | HERA backgrounds | `hera-bg`, `hera-bg-subtle` |
| Borders | `gray-200` | HERA borders | `hera-line-200` |
| Text | `gray-900`, `gray-600` | HERA ink | `hera-ink`, `hera-ink-muted` |

## 🔧 Step-by-Step Migration Process

### Step 1: Update Tailwind Configuration

1. **Backup current config**:
```bash
cp tailwind.config.ts tailwind.config.backup.ts
```

2. **Merge HERA Salon colors** into your existing config:
```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      // Keep existing colors
      ...existingColors,
      
      // Add HERA Salon brand colors
      hera: {
        primary: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#8B80F9',
          500: '#7C7CF4',
          600: '#6366F1',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81'
        },
        pink: {
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843'
        },
        teal: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B'
        },
        // ... rest of HERA colors
      }
    }
  }
}
```

### Step 2: Add CSS Variables to globals.css

Add these to your existing `globals.css` (keep your current styles):

```css
@layer base {
  :root {
    /* HERA Salon Semantic Tokens - Light Mode */
    --hera-primary: 99 102 241; /* hera.primary.600 */
    --hera-primary-foreground: 255 255 255;
    --hera-secondary: 236 72 153; /* hera.pink.500 */
    --hera-accent: 16 185 129; /* hera.teal.500 */
    --hera-bg: 255 255 255;
    --hera-bg-subtle: 249 250 251;
    --hera-line-200: 229 231 235;
    --hera-ink: 17 24 39;
    --hera-ink-muted: 75 85 99;
  }

  .dark {
    /* HERA Salon Semantic Tokens - Dark Mode */
    --hera-primary: 139 128 249; /* hera.primary.400 */
    --hera-secondary: 244 114 182; /* hera.pink.400 */
    --hera-accent: 52 211 153; /* hera.teal.400 */
    --hera-bg: 17 24 39;
    --hera-bg-subtle: 55 65 81;
    --hera-line-200: 55 65 81;
    --hera-ink: 249 250 251;
    --hera-ink-muted: 156 163 175;
  }
}
```

### Step 3: Update Component Colors

#### 3.1 Global Find & Replace (Automated)

Use these regex patterns in VS Code to quickly update colors:

```regex
# Primary colors
purple-500 → hera-primary-500
purple-600 → hera-primary-600
purple-700 → hera-primary-700
bg-purple-100 → bg-hera-primary-100
text-purple-800 → text-hera-primary-800

# Pink colors
pink-500 → hera-pink-500
pink-600 → hera-pink-600
bg-pink-100 → bg-hera-pink-100
text-pink-800 → text-hera-pink-800

# Teal/Green colors
green-500 → hera-teal-500
emerald-500 → hera-teal-500
bg-green-100 → bg-hera-teal-100
text-green-800 → text-hera-teal-800

# Grays
gray-50 → hera-bg-50
gray-100 → hera-bg-100
gray-200 → hera-line-200
gray-600 → hera-ink-600
gray-900 → hera-ink-900
```

#### 3.2 Component-Specific Updates

**Buttons** (`/salon-data/page.tsx`):
```tsx
// Before
<Button className="bg-purple-600 hover:bg-purple-700">

// After
<Button className="bg-hera-primary-600 hover:bg-hera-primary-700">
```

**Cards & Backgrounds**:
```tsx
// Before
<Card className="bg-white dark:bg-gray-800 border-gray-200">

// After  
<Card className="bg-white dark:bg-hera-card border-hera-line-200">
```

**Badges**:
```tsx
// Before
<Badge className="bg-purple-100 text-purple-800">

// After
<Badge className="bg-hera-primary-100 text-hera-primary-700">
```

**Gradient Updates**:
```tsx
// Before
<div className="bg-gradient-to-r from-purple-400 to-pink-600">

// After
<div className="bg-gradient-to-r from-hera-primary-400 to-hera-pink-600">
```

### Step 4: Update Specific Salon Components

#### SalonCalendar Components
```tsx
// SalonCalendar.tsx - Update stylist colors
const getStylistColor = (level: string): string => {
  switch (level) {
    case 'celebrity': return '#8b5cf6' // Use hera-primary-500
    case 'senior': return '#3b82f6'    // Keep or use hera-primary-600
    case 'junior': return '#6b7280'    // Use hera-ink-500
  }
}

// Change to:
const getStylistColor = (level: string): string => {
  switch (level) {
    case 'celebrity': return '#7C7CF4' // hera-primary-500
    case 'senior': return '#6366F1'    // hera-primary-600
    case 'junior': return '#6B7280'    // hera-ink-500
  }
}
```

#### ModernSalonCalendar
```tsx
// Update stat card colors
<div className="bg-gradient-to-br from-blue-50 to-indigo-50">
// Change to:
<div className="bg-gradient-to-br from-hera-primary-50 to-hera-primary-100">

// Update badge colors
<Badge className="bg-purple-100 text-purple-800">
// Change to:
<Badge className="bg-hera-primary-100 text-hera-primary-700">
```

#### BookAppointmentModal
```tsx
// Update VIP badge colors
getVipBadgeColor(vipLevel) {
  switch (vipLevel) {
    case 'platinum': return 'bg-purple-100 text-purple-800'
    case 'gold': return 'bg-yellow-100 text-yellow-800'
    // Change to:
    case 'platinum': return 'bg-hera-primary-100 text-hera-primary-700'
    case 'gold': return 'bg-hera-pink-100 text-hera-pink-700'
  }
}
```

### Step 5: Update Layout Components

#### Salon Layout (`/salon/layout.tsx`)
```tsx
// Update sidebar colors
<div className="bg-gray-900 text-white">
// Change to:
<div className="bg-hera-ink-900 text-white">

// Update navigation items
<Link className="hover:bg-gray-800 text-gray-300">
// Change to:
<Link className="hover:bg-hera-ink-700 text-gray-300">
```

### Step 6: Update Dark Mode Classes

Replace dark mode specific colors:

```tsx
// Before
dark:bg-gray-800 → dark:bg-hera-card
dark:bg-gray-900 → dark:bg-hera-bg
dark:border-gray-700 → dark:border-hera-border
dark:text-gray-100 → dark:text-hera-ink
dark:text-gray-400 → dark:text-hera-ink-muted
```

## 🎯 Priority Pages to Update

1. **High Traffic Pages** (Update First):
   - `/salon-data` - Main dashboard
   - `/salon/appointments` - Core functionality
   - `/salon/clients` - Customer management
   - `/salon/calendar` - Scheduling

2. **Secondary Pages**:
   - `/salon/services`
   - `/salon/staff`
   - `/salon/products`
   - `/salon/reports`

3. **Settings/Admin**:
   - `/salon/settings`
   - `/salon/marketing`
   - `/salon/loyalty`

## 🔍 Testing Checklist

After applying colors, test:

- [ ] Light mode appearance
- [ ] Dark mode appearance  
- [ ] Hover states
- [ ] Focus states
- [ ] Loading states
- [ ] Error states
- [ ] Disabled states
- [ ] Mobile responsive views

## 💡 Quick Reference Card

```tsx
// Primary Actions
className="bg-hera-primary-600 hover:bg-hera-primary-700 text-white"

// Secondary Actions  
className="bg-hera-pink-500 hover:bg-hera-pink-600 text-white"

// Success/Eco
className="bg-hera-teal-500 hover:bg-hera-teal-600 text-white"

// Cards
className="bg-white dark:bg-hera-card border-hera-line-200 dark:border-hera-border"

// Text
className="text-hera-ink dark:text-hera-ink"
className="text-hera-ink-muted dark:text-hera-ink-muted"

// Badges (VIP Levels)
platinum: "bg-hera-primary-100 text-hera-primary-700"
gold: "bg-hera-pink-100 text-hera-pink-700"  
silver: "bg-hera-bg-100 text-hera-ink-700"
```

## 🚀 Gradual Migration Strategy

If you need to migrate gradually:

1. **Phase 1**: Add HERA colors to Tailwind config without removing old colors
2. **Phase 2**: Update high-traffic pages first
3. **Phase 3**: Update components one by one
4. **Phase 4**: Remove old color references
5. **Phase 5**: Clean up unused color definitions

## 🛠️ Utility Script

Create a migration script to help automate color updates:

```js
// scripts/migrate-colors.js
const fs = require('fs');
const path = require('path');

const colorMappings = {
  'purple-500': 'hera-primary-500',
  'purple-600': 'hera-primary-600',
  'purple-700': 'hera-primary-700',
  'pink-500': 'hera-pink-500',
  'pink-600': 'hera-pink-600',
  'green-500': 'hera-teal-500',
  'emerald-500': 'hera-teal-500',
  // Add more mappings
};

function updateColors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  Object.entries(colorMappings).forEach(([old, new]) => {
    const regex = new RegExp(`\\b${old}\\b`, 'g');
    content = content.replace(regex, new);
  });
  
  fs.writeFileSync(filePath, content);
}

// Run on salon files
const salonFiles = glob.sync('src/app/salon/**/*.tsx');
salonFiles.forEach(updateColors);
```

## ✅ Validation

After migration, validate that:

1. **Brand consistency**: All primary actions use `hera-primary-*`
2. **Semantic correctness**: Success uses teal, warnings use yellow
3. **Accessibility**: Contrast ratios meet WCAG AA standards
4. **Dark mode**: All elements visible in both themes
5. **Hover states**: Interactive elements have proper feedback

This migration will give your salon app a cohesive, premium look that aligns with the HERA Salon brand identity! 💅✨