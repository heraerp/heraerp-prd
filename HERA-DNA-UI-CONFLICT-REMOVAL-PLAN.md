# HERA DNA UI Conflict Removal Plan

## 🚨 Critical Conflicts to Remove

### 1. **Global CSS Overrides in `globals.css`**

#### Lines to Remove/Comment Out:
```css
/* REMOVE Lines 1714-1950: Global text color overrides */
/* These force colors and override DNA component styling */

/* REMOVE Lines 1837-1898: Global card and table styling */
/* These interfere with DNA glass effects */

/* REMOVE Lines 1922-1930: Input field global styling */
/* Conflicts with DNA form components */
```

#### Specific Issues:
- **Line 1714-1830**: Forces text colors based on parent background, breaking DNA theme system
- **Line 1837-1849**: Hardcoded card backgrounds that override glass effects
- **Line 1883-1898**: Table row styling that conflicts with Enterprise Table component
- **Line 1902-1909**: Forced table header styles with `!important`

### 2. **Multiple Theme Providers**

#### Remove:
- `/src/components/universal/ui/HeraThemeProvider.tsx` - Old theme provider
- Keep only: `/src/lib/dna/theme/theme-provider-dna.tsx`

#### Update All Imports:
```typescript
// OLD (Remove)
import { HeraThemeProvider } from '@/components/universal/ui/HeraThemeProvider'

// NEW (Use)
import { ThemeProviderDNA } from '@/lib/dna/theme/theme-provider-dna'
```

### 3. **Component-Specific CSS Files**

#### Files to Integrate into DNA:
- `/src/app/(auth)/salon/calendar/salon-calendar.css` - Move to DNA calendar component
- Any other `.css` files with hardcoded styles

### 4. **Non-DNA Component Usage**

#### Replace Throughout Codebase:
```typescript
// OLD components to replace
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'

// NEW DNA components
import { GlassCard } from '@/lib/dna/components/molecules/GlassCard'
import { HeraDNAButton } from '@/lib/dna/components/molecules/Button'
import { EnterpriseDataTable } from '@/lib/dna/components/organisms/EnterpriseDataTable'
```

### 5. **Hardcoded Styles in Components**

#### Anti-patterns to Remove:
```typescript
// BAD - Hardcoded backgrounds
<div className="bg-gray-900 text-white">

// GOOD - DNA theme-aware
<GlassPanel variant="dark" intensity="strong">
```

```typescript
// BAD - Fixed colors
<div style={{ backgroundColor: '#f3f4f6' }}>

// GOOD - DNA tokens
<div className={cn(glassStyles.surface)}>
```

## 📋 Removal Implementation Steps

### Step 1: Create Clean `globals.css`
```css
/* Keep only essential resets and DNA-compatible styles */
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

/* DNA Glass Animations */
@import "./dna/design-system/glass-animations.css";

/* Keep HERA CSS variables (lines 1-500) */
/* Remove all global overrides (lines 1714-1950) */
/* Keep accessibility helpers but make them opt-in classes */
```

### Step 2: Update Component Imports Script
```bash
# Create migration script
npm run migrate-to-dna-components

# This will:
# 1. Find all non-DNA component imports
# 2. Replace with DNA equivalents
# 3. Update props to match DNA API
```

### Step 3: Remove Conflicting Patterns

#### Pattern 1: Global Text Color Forces
```css
/* REMOVE THIS PATTERN */
.bg-gray-900 h1 { color: rgb(243 244 246) !important; }

/* USE DNA PATTERN */
<HeraDNAHeading theme="dark" contrast="high" />
```

#### Pattern 2: Card Background Overrides
```css
/* REMOVE THIS */
.card { background-color: rgba(255, 255, 255, 0.8); }

/* USE DNA */
<GlassCard intensity="medium" variant="default" />
```

#### Pattern 3: Table Styling
```css
/* REMOVE THIS */
tbody tr:nth-child(even) { background-color: rgba(249, 250, 251, 0.5); }

/* USE DNA */
<EnterpriseDataTable glassIntensity="subtle" />
```

### Step 4: Documentation Updates

Remove references to:
- `DualAuthProvider` 
- Old component paths
- Non-DNA styling approaches

Update to:
- `MultiOrgAuthProvider` only
- DNA component paths
- DNA styling patterns

## 🛠️ Safe CSS to Keep

### Keep These Sections:
1. **CSS Variables** (lines 1-500) - HERA color system
2. **Animations** (lines 500-700) - Shimmer, glow, etc.
3. **Accessibility Utilities** (as opt-in classes, not global)
4. **Print Styles** (lines 1452-1460)
5. **PWA Animations** (lines 1475-1488)

### Transform These:
1. **Dropdown Fixes** → Move to DNA dropdown component
2. **Dialog Styles** → Move to DNA modal component
3. **Form Styles** → Move to DNA form components

## 🚀 Migration Script

```typescript
// scripts/migrate-to-dna-ui.ts
import { Project } from 'ts-morph';

export async function migrateToHeraDNA() {
  const project = new Project();
  
  // Component mapping
  const componentMap = {
    '@/components/ui/card': '@/lib/dna/components/molecules/GlassCard',
    '@/components/ui/button': '@/lib/dna/components/molecules/Button',
    '@/components/ui/table': '@/lib/dna/components/organisms/EnterpriseDataTable',
    // ... more mappings
  };
  
  // Find and replace imports
  const sourceFiles = project.getSourceFiles('src/**/*.{ts,tsx}');
  
  for (const file of sourceFiles) {
    let hasChanges = false;
    
    // Update imports
    file.getImportDeclarations().forEach(importDecl => {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (componentMap[moduleSpecifier]) {
        importDecl.setModuleSpecifier(componentMap[moduleSpecifier]);
        hasChanges = true;
      }
    });
    
    // Update className patterns
    if (hasChanges) {
      // Replace hardcoded styles with DNA equivalents
      const text = file.getText();
      const updatedText = text
        .replace(/className="bg-gray-\d+/g, 'className="')
        .replace(/className="text-gray-\d+/g, 'className="');
      
      file.replaceText([0, text.length], updatedText);
    }
    
    if (hasChanges) {
      await file.save();
    }
  }
}
```

## 📊 Expected Results After Removal

1. **No Style Conflicts**: DNA components render with proper glass effects
2. **Theme Consistency**: Single theme provider controls all styling
3. **Performance**: Reduced CSS bundle size and specificity battles
4. **Maintainability**: All styling through DNA tokens and components
5. **Enterprise Quality**: Consistent, professional UI across entire app

## ⚡ Quick Wins

1. **Comment out lines 1714-1950** in `globals.css` immediately
2. **Replace `HeraThemeProvider` with `ThemeProviderDNA`** in layout files
3. **Update critical pages** to use DNA components first
4. **Test dark mode** thoroughly after changes

## 🎯 Success Criteria

- [ ] No `!important` CSS rules forcing colors
- [ ] All components use DNA imports
- [ ] Single theme provider active
- [ ] Glass effects render properly
- [ ] Dark mode works without overrides
- [ ] No hardcoded colors in components
- [ ] All styling through DNA tokens

This plan ensures HERA DNA UI can work at its full potential without conflicts!