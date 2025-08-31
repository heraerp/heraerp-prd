# HERA DNA High Contrast UI Guidelines

## Overview
Based on learnings from the Ice Cream Manufacturing UI implementation, these guidelines ensure all HERA DNA generated interfaces have excellent visibility and contrast.

## 🎨 Core Principles

### 1. **Numbers Must Always Be Readable**
- **Primary numbers**: `text-black dark:text-white` (maximum contrast)
- **Zero values**: `text-gray-500 dark:text-gray-300` (special handling for empty states)
- **Font size**: `text-4xl font-black` for important metrics
- **Never use**: Low contrast combinations like `text-gray-500` on `bg-gray-800`

### 2. **Dark Theme by Default**
```typescript
// Card backgrounds
className="bg-white dark:bg-gray-800"

// Main background
className="bg-gray-50 dark:bg-gray-900"

// Nested elements
className="bg-gray-50 dark:bg-gray-900"
```

### 3. **Sidebar Must Use Inverted Colors**
```typescript
// Sidebar container
className="bg-gradient-to-b from-gray-900 to-gray-950"

// Sidebar text
className="text-gray-100" // Primary
className="text-gray-300" // Secondary
className="text-gray-400" // Tertiary

// Never use dark text on dark sidebar
```

## 📋 Implementation Checklist

### Stats Cards
- [ ] Dark background: `bg-gray-800`
- [ ] Light title text: `text-gray-300`
- [ ] White numbers: `text-white`
- [ ] Special zero handling: `text-gray-300` when value is 0
- [ ] Proper borders: `border-gray-700`

### Navigation
- [ ] Dark sidebar: `bg-gray-900`
- [ ] Light text: `text-gray-100` to `text-gray-300`
- [ ] Icon containers: `bg-gray-800` with hover states
- [ ] Active state: Gradient background with white text

### Data Display
- [ ] Currency/amounts: `font-semibold text-white`
- [ ] Percentages: `text-2xl font-bold text-white`
- [ ] Labels: `text-gray-300`
- [ ] Descriptions: `text-gray-400`

## 🚫 Common Mistakes to Avoid

1. **Glass Morphism Abuse**
   ```typescript
   // ❌ WRONG - Low contrast
   className="bg-white/20 backdrop-blur-xl"
   
   // ✅ CORRECT - Solid backgrounds
   className="bg-gray-800"
   ```

2. **Wrong Text Colors on Dark Backgrounds**
   ```typescript
   // ❌ WRONG
   className="text-gray-600 dark:text-gray-400" // Too dark
   
   // ✅ CORRECT
   className="text-gray-300" // Readable on dark
   ```

3. **Inconsistent Zero Handling**
   ```typescript
   // ❌ WRONG
   <span className="text-gray-500">{value}</span>
   
   // ✅ CORRECT
   <span className={value === 0 ? "text-gray-300" : "text-white"}>
     {value}
   </span>
   ```

## 🔧 HERA DNA Integration

### Using the High Contrast Generator
```typescript
import { generateStatsCard, generateSidebar, HERA_HIGH_CONTRAST_SCHEME } from '@/lib/dna/high-contrast-ui-generator'

// Generate a stats card
const statsCard = generateStatsCard({
  title: 'Total Revenue',
  valueKey: 'revenue',
  icon: 'DollarSign',
  gradient: 'from-green-500 to-emerald-600'
})

// Generate sidebar
const sidebar = generateSidebar({
  appName: 'My Business',
  appSubtitle: 'ERP System',
  navItems: [
    { name: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard' },
    { name: 'Products', href: '/products', icon: 'Package' }
  ],
  logoIcon: 'Store'
})
```

### Database DNA Patterns
```sql
-- Use high contrast patterns
SELECT * FROM core_entities 
WHERE smart_code IN (
  'HERA.UI.PATTERN.DARK.CONTRAST.v1',
  'HERA.UI.COMPONENT.STATS.CARD.HC.v1',
  'HERA.UI.COMPONENT.SIDEBAR.NAV.HC.v1'
)
AND organization_id = 'f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944';
```

## 📊 Color Reference Table

| Element | Light Mode | Dark Mode | Notes |
|---------|------------|-----------|-------|
| Background | `bg-gray-50` | `bg-gray-900` | Main app background |
| Card | `bg-white` | `bg-gray-800` | Component containers |
| Text Primary | `text-gray-900` | `text-white` | Headlines, numbers |
| Text Secondary | `text-gray-700` | `text-gray-300` | Labels, subtitles |
| Text Tertiary | `text-gray-600` | `text-gray-400` | Descriptions |
| Zero Values | `text-gray-500` | `text-gray-300` | Special visibility |
| Borders | `border-gray-200` | `border-gray-700` | All borders |
| Sidebar | N/A | `bg-gray-900` | Always dark |
| Sidebar Text | N/A | `text-gray-100` | Always light |

## 🚀 Quick Start Template

```typescript
// Complete high-contrast dashboard template
export default function HighContrastDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-gradient-to-b from-gray-900 to-gray-950">
        {/* Sidebar content with light text */}
      </aside>
      
      {/* Main Content */}
      <main className="lg:pl-72 p-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mt-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardContent>
              <div className="text-4xl font-black text-black dark:text-white">
                {value || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
```

## ✅ Validation Checklist

Before deploying any HERA DNA generated UI:

1. [ ] Can you read all numbers clearly?
2. [ ] Are zero values visible?
3. [ ] Is the sidebar text readable?
4. [ ] Do cards have proper borders?
5. [ ] Are hover states visible?
6. [ ] Does it work in both light and dark modes?
7. [ ] Is the contrast ratio ≥ 4.5:1 for normal text?
8. [ ] Is the contrast ratio ≥ 3:1 for large text?

## 🎯 Result

Following these guidelines ensures:
- **100% readable text** in all conditions
- **Professional appearance** with proper contrast
- **Accessibility compliance** (WCAG AA)
- **Consistent user experience** across all HERA applications
- **Reduced eye strain** for users

These patterns are now part of HERA DNA and will be automatically applied to all future builds!