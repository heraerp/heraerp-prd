# HERA Theme System Documentation

## Overview

The HERA Theme System is a comprehensive theming solution that provides semantic color tokens, consistent styling patterns, and perfect light/dark mode support across all HERA modules. It was born from a real production issue where dark text on dark backgrounds made values unreadable, leading to the creation of a universal solution.

## Quick Start

### 1. Wrap Your Module with ThemeProviderDNA

```tsx
import { ThemeProviderDNA } from '@/lib/dna/theme/theme-provider-dna'

export default function YourModuleLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProviderDNA defaultTheme="ice-cream-enterprise" defaultMode="system">
      {children}
    </ThemeProviderDNA>
  )
}
```

### 2. Use StatCardDNA Components

Instead of manually creating stat cards, use the DNA components that automatically handle dark mode:

```tsx
import { StatCardDNA, StatCardGrid } from '@/lib/dna/components/ui/stat-card-dna'

<StatCardGrid columns={4}>
  <StatCardDNA
    title="Total Revenue"
    value="₹12,45,678"
    change="+12.5% from last month"
    changeType="positive"
    icon={DollarSign}
    iconGradient="from-green-500 to-emerald-500"
  />
</StatCardGrid>
```

### 3. Access Theme Colors and Utilities

```tsx
import { useTheme, useIsDarkMode, useThemeColors } from '@/lib/dna/theme/theme-provider-dna'

function YourComponent() {
  const { toggleMode } = useTheme()
  const isDark = useIsDarkMode()
  const colors = useThemeColors()
  
  return (
    <div style={{ color: colors.foreground }}>
      Current mode: {isDark ? 'Dark' : 'Light'}
    </div>
  )
}
```

## Architecture

### Core Components

1. **ThemeConfig** (`/src/lib/dna/theme/hera-theme-system.ts`)
   - Defines the structure of a theme
   - Includes semantic colors, gradients, component styles, and effects

2. **ThemeProviderDNA** (`/src/lib/dna/theme/theme-provider-dna.tsx`)
   - React context provider for theme management
   - Handles theme switching, persistence, and CSS variable injection
   - Supports system preference detection

3. **Theme Definitions** (`/src/lib/dna/theme/themes/`)
   - Individual theme files (e.g., `ice-cream-enterprise.ts`)
   - Each theme provides complete color palettes for light and dark modes

4. **StatCardDNA** (`/src/lib/dna/components/ui/stat-card-dna.tsx`)
   - Pre-built components that automatically handle dark mode visibility
   - Uses `!important` to override global CSS rules

## Color System

### Semantic Color Tokens

The theme system uses semantic naming for colors, making it clear what each color represents:

```typescript
interface SemanticColors {
  // Base colors
  background: string      // Page background
  foreground: string      // Primary text color
  
  // Card/Container colors
  card: string           // Card background
  cardForeground: string // Text on cards
  
  // Interactive elements
  primary: string        // Primary brand color
  secondary: string      // Secondary brand color
  
  // Feedback colors
  success: string        // Success states
  warning: string        // Warning states
  danger: string         // Error states
  info: string           // Information states
  
  // Neutral colors
  muted: string          // Muted backgrounds
  mutedForeground: string // Muted text
  
  // Borders and dividers
  border: string         // Default borders
  borderSubtle: string   // Subtle borders
}
```

### Color Scale

Base colors use the oklch color format for perceptually uniform colors:

```typescript
const heraColors = {
  blue: {
    50: 'oklch(0.97 0.012 250)',
    // ... scale from 50 to 950
    500: 'oklch(0.57 0.192 250)', // Primary
  },
  // ... other color scales
}
```

## Theme Implementation

### Ice Cream Enterprise Theme

The ice cream theme demonstrates the complete theme structure:

```typescript
export const iceCreamEnterpriseTheme: ThemeConfig = {
  name: 'Ice Cream Enterprise',
  
  colors: {
    light: {
      background: iceCreamColors.cream[50],
      foreground: heraColors.gray[900],
      primary: iceCreamColors.strawberry,
      // ... complete light mode palette
    },
    dark: {
      background: heraColors.gray[950],
      foreground: heraColors.gray[50],
      primary: heraColors.pink[400],
      // ... complete dark mode palette
    }
  },
  
  gradients: {
    light: {
      primary: `linear-gradient(to bottom right, ${heraColors.pink[500]}, ${heraColors.purple[500]})`,
      // ... other gradients
    },
    dark: {
      primary: `linear-gradient(to bottom right, ${heraColors.pink[400]}, ${heraColors.purple[400]})`,
      // ... adjusted for dark mode
    }
  },
  
  components: {
    // Component-specific styling tokens
  }
}
```

## Common Patterns

### 1. Force Text Visibility (The Dark Mode Fix)

The original issue was that global CSS rules were overriding Tailwind classes. The solution:

```css
/* Global CSS causing the issue */
.text-xl.font-bold {
  color: rgb(17 24 39); /* gray-900 */
}
```

```tsx
// Solution: Use !important modifier
<p className="text-2xl font-bold !text-gray-900 dark:!text-gray-100">
  {value}
</p>
```

The StatCardDNA component automatically applies this fix:

```tsx
// Built into StatCardDNA
<p className="text-3xl font-bold !text-gray-900 dark:!text-gray-100">
  {value}
</p>
```

### 2. Glassmorphism Effects

```tsx
// Card with glassmorphism
<Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-pink-200/50 dark:border-pink-800/50">
  {/* Content */}
</Card>
```

### 3. Gradient Icons

```tsx
<div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
  <Icon className="w-7 h-7 text-white" />
</div>
```

### 4. Status Badges

```tsx
// Success badge
<Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
  Active
</Badge>
```

## Creating New Themes

### 1. Define Your Theme

Create a new file in `/src/lib/dna/theme/themes/`:

```typescript
import { ThemeConfig, heraColors, createSemanticColors, createGradientPalette } from '../hera-theme-system'

export const yourTheme: ThemeConfig = {
  name: 'Your Theme Name',
  description: 'Theme description',
  
  colors: {
    light: {
      ...createSemanticColors('light'),
      // Override specific colors
      primary: '#your-color',
    },
    dark: {
      ...createSemanticColors('dark'),
      // Override for dark mode
      primary: '#your-dark-color',
    }
  },
  
  gradients: {
    light: createGradientPalette('light'),
    dark: createGradientPalette('dark')
  },
  
  // ... other theme properties
}
```

### 2. Register Your Theme

Add it to the theme registry in `theme-provider-dna.tsx`:

```typescript
const themes: Record<string, ThemeConfig> = {
  'ice-cream-enterprise': iceCreamEnterpriseTheme,
  'your-theme': yourTheme, // Add your theme
}
```

### 3. Use Your Theme

```tsx
<ThemeProviderDNA defaultTheme="your-theme">
  {/* Your app */}
</ThemeProviderDNA>
```

## Best Practices

### 1. Always Use Semantic Colors

❌ Don't use raw color values:
```tsx
<div className="text-gray-900 dark:text-gray-100">
```

✅ Use semantic tokens:
```tsx
<div className="text-foreground">
```

### 2. Handle Dark Mode from the Start

❌ Don't add dark mode as an afterthought:
```tsx
<Badge className="bg-green-100 text-green-700">
```

✅ Include dark mode classes:
```tsx
<Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
```

### 3. Use DNA Components When Available

❌ Don't create manual stat cards:
```tsx
<Card>
  <CardContent>
    <p className="text-sm">Total Revenue</p>
    <p className="text-2xl font-bold">₹12,345</p>
  </CardContent>
</Card>
```

✅ Use StatCardDNA:
```tsx
<StatCardDNA
  title="Total Revenue"
  value="₹12,345"
  icon={DollarSign}
/>
```

### 4. Test in Both Modes

Always verify your UI works in both light and dark modes:
- Toggle between modes using the theme toggle
- Check contrast ratios for accessibility
- Ensure all text remains visible
- Verify interactive states (hover, focus)

## Troubleshooting

### Issue: Text Not Visible in Dark Mode

**Symptom**: Dark text on dark background or light text on light background

**Solution**: Use the `!important` modifier pattern:
```tsx
<p className="!text-gray-900 dark:!text-gray-100">{value}</p>
```

### Issue: Theme Not Applying

**Symptom**: Colors not changing when switching themes

**Checklist**:
1. Is the component wrapped in `ThemeProviderDNA`?
2. Are you using CSS variables (`var(--color-primary)`) for dynamic colors?
3. Check browser console for errors
4. Verify theme is registered in the theme registry

### Issue: Global CSS Conflicts

**Symptom**: Styles being overridden unexpectedly

**Solution**: 
1. Check `globals.css` for conflicting rules
2. Use more specific selectors or `!important` when necessary
3. Consider using CSS modules or styled-components for isolation

## Migration Guide

### Migrating Existing Components

1. **Wrap with ThemeProvider**:
   ```tsx
   // Before
   export default function Layout({ children }) {
     return <div>{children}</div>
   }
   
   // After
   export default function Layout({ children }) {
     return (
       <ThemeProviderDNA defaultTheme="your-theme">
         <div>{children}</div>
       </ThemeProviderDNA>
     )
   }
   ```

2. **Replace Stat Cards**:
   ```tsx
   // Before
   <Card>
     <CardContent>
       <p>Title</p>
       <p className="text-2xl font-bold">{value}</p>
     </CardContent>
   </Card>
   
   // After
   <StatCardDNA
     title="Title"
     value={value}
   />
   ```

3. **Update Color Classes**:
   ```tsx
   // Before
   <p className="text-gray-900">{text}</p>
   
   // After
   <p className="!text-gray-900 dark:!text-gray-100">{text}</p>
   ```

## Future Enhancements

### Planned Features

1. **Theme Studio**: Visual theme builder
2. **Automatic Contrast Checking**: WCAG compliance validation
3. **Theme Marketplace**: Share and download community themes
4. **Dynamic Theme Generation**: AI-powered theme creation based on brand colors
5. **Component Library**: Extended DNA components with theme support

### Contributing

To contribute to the theme system:

1. Follow the existing patterns and conventions
2. Ensure all themes support both light and dark modes
3. Test across different browsers and devices
4. Document any new features or patterns
5. Submit PR with screenshots showing both modes

## Conclusion

The HERA Theme System transforms a common UI problem into a comprehensive solution that ensures consistent, accessible, and beautiful interfaces across all HERA modules. By using semantic color tokens, DNA components, and proper dark mode handling, developers can build interfaces that work perfectly in any lighting condition.

Remember: **Always use StatCardDNA and other DNA components** - they handle the complexity so you don't have to!