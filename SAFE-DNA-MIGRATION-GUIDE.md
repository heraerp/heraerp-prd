# Safe HERA DNA UI Migration Guide

## 🛡️ Principle: No Breaking Changes

This guide ensures zero downtime and gradual migration to HERA DNA UI without breaking existing functionality.

## 📋 Migration Phases

### Phase 1: Assessment (No Changes Made)
```bash
# Check current state
node scripts/safe-migrate-to-dna.js check

# This will identify:
# - Conflicting CSS rules
# - Multiple theme providers
# - Components ready for migration
```

### Phase 2: Preparation (Create Safety Net)
```bash
# Create backups and migration files
node scripts/safe-migrate-to-dna.js prepare

# This creates:
# - .hera-migration-backup/ (backup of critical files)
# - .hera-migration-status.json (tracks migration progress)
```

### Phase 3: CSS Migration (Side-by-Side)
```bash
# Create DNA-compatible CSS
node scripts/safe-migrate-to-dna.js migrate-css

# This creates:
# - globals-dna-safe.css (clean CSS without conflicts)
# - globals-migration-test.css (imports both for testing)
```

**Test the new CSS:**
```typescript
// In app/layout.tsx - FOR TESTING ONLY
// import './globals.css' // Original
import './globals-migration-test.css' // Test both together
```

### Phase 4: Component Migration (One at a Time)

#### Step 1: Migrate StatCard Components First
These have a known fix for dark mode issues:

```bash
# Create DNA version of a component
node scripts/safe-migrate-to-dna.js migrate-component src/components/dashboard/StatCard.tsx
```

This creates `StatCard.dna.tsx` alongside the original.

#### Step 2: Test DNA Version
```typescript
// In your page file, temporarily import both
import { StatCard } from '@/components/dashboard/StatCard'
import { StatCard as StatCardDNA } from '@/components/dashboard/StatCard.dna'

// Use them side by side
<div className="grid grid-cols-2 gap-4">
  <StatCard title="Original" value="123" />
  <StatCardDNA title="DNA Version" value="123" />
</div>
```

#### Step 3: Gradual Replacement
Once verified, replace imports one by one:

```typescript
// OLD
import { StatCard } from '@/components/dashboard/StatCard'

// NEW
import { StatCardDNA as StatCard } from '@/lib/dna/components/ui/stat-card-dna'
```

### Phase 5: Theme Provider Migration

#### Safe Approach:
```typescript
// 1. First, wrap DNA provider around existing provider
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <HeraThemeProvider> {/* Keep existing */}
          <ThemeProviderDNA> {/* Add DNA provider */}
            {children}
          </ThemeProviderDNA>
        </HeraThemeProvider>
      </body>
    </html>
  )
}

// 2. Test thoroughly

// 3. Then remove old provider
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProviderDNA> {/* DNA provider only */}
          {children}
        </ThemeProviderDNA>
      </body>
    </html>
  )
}
```

## 🔧 Component-by-Component Migration

### Safe Migration Order:
1. **Leaf Components First** (no children)
   - Buttons
   - Inputs
   - Stat Cards
   
2. **Container Components**
   - Cards
   - Panels
   - Sections

3. **Layout Components**
   - Navigation
   - Sidebars
   - Headers

4. **Page Components Last**

### Migration Pattern for Each Component:

```typescript
// Step 1: Add migration class to identify
<Card className="migration-in-progress">
  {/* Existing content */}
</Card>

// Step 2: Import DNA component with alias
import { GlassCard } from '@/lib/dna/components/molecules/GlassCard'

// Step 3: Use DNA component with fallback
const CardComponent = GlassCard || Card // Fallback if DNA not ready

// Step 4: Replace gradually
<CardComponent>
  {/* Content remains the same */}
</CardComponent>
```

## 🎨 CSS Conflict Resolution

### Temporary Overrides (While Migrating):
```css
/* In component styles or CSS modules */
.migration-override {
  /* Temporarily override problematic global styles */
  all: revert-layer !important;
}

/* For specific fixes */
.migration-text-fix {
  color: inherit !important; /* Override global text colors */
}
```

### Component-Level Fixes:
```typescript
// Wrap problematic components during migration
<div className="isolate"> {/* Creates new stacking context */}
  <YourComponent />
</div>
```

## 📊 Testing Strategy

### 1. Visual Regression Testing
```bash
# Before migration
npm run screenshot:capture -- --tag pre-migration

# After each component migration
npm run screenshot:capture -- --tag post-${component}

# Compare
npm run screenshot:diff
```

### 2. Dark Mode Testing
```typescript
// Test component in both modes
<div className="grid grid-cols-2">
  <div className="light">
    <YourComponent />
  </div>
  <div className="dark bg-gray-900">
    <YourComponent />
  </div>
</div>
```

### 3. A/B Testing in Production
```typescript
// Use feature flags
const useNewDNA = features.includes('dna-ui')

return useNewDNA ? (
  <GlassCard {...props} />
) : (
  <Card {...props} />
)
```

## ⚠️ Common Issues and Solutions

### Issue 1: Text Not Visible in Dark Mode
```typescript
// Temporary fix while migrating
<div className="!text-gray-900 dark:!text-gray-100">
  {/* Content */}
</div>
```

### Issue 2: Glass Effects Not Showing
```css
/* Add to component during migration */
.migration-glass-fix {
  isolation: isolate; /* Prevent backdrop-filter conflicts */
  z-index: 0; /* Reset z-index stacking */
}
```

### Issue 3: Theme Variables Not Available
```typescript
// Use CSS variables with fallbacks
style={{
  color: 'var(--hera-500, #3b82f6)' // Fallback to blue
}}
```

## 🚀 Final Cutover

### When You're Ready:
1. **Replace CSS Import**
   ```typescript
   // In app/layout.tsx
   import './globals-dna-safe.css' // Use DNA CSS only
   ```

2. **Remove Old Components**
   ```bash
   # After all .dna.tsx files are tested
   rm src/components/dashboard/StatCard.tsx
   mv src/components/dashboard/StatCard.dna.tsx src/components/dashboard/StatCard.tsx
   ```

3. **Clean Up**
   ```bash
   # Remove migration artifacts
   rm -rf .hera-migration-backup
   rm globals-migration-test.css
   rm .hera-migration-status.json
   ```

## ✅ Success Checklist

- [ ] All components render correctly
- [ ] Dark mode works without text visibility issues
- [ ] Glass effects display properly
- [ ] No console errors
- [ ] Performance metrics maintained or improved
- [ ] All tests pass
- [ ] Stakeholders approve visual changes

## 💡 Pro Tips

1. **Use DNA Classes During Migration**
   ```typescript
   className="hera-card-dna" // Instead of hardcoded styles
   ```

2. **Keep Both Imports Available**
   ```typescript
   // During migration
   import * as OldUI from '@/components/ui'
   import * as DNA from '@/lib/dna/components'
   ```

3. **Monitor Bundle Size**
   ```bash
   npm run analyze -- --before migration
   npm run analyze -- --after migration
   ```

4. **Document Changes**
   ```typescript
   /**
    * @migrated-to-dna
    * @migration-date 2024-01-20
    * @verified-by teamlead
    */
   ```

This approach ensures HERA DNA UI is adopted safely without breaking existing functionality!