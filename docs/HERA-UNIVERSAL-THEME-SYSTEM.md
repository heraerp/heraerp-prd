# HERA Universal Theme System

## Complete Dynamic Theming with Configuration Rules

---

## 🎯 Overview

The **HERA Universal Theme System** provides a sophisticated, rule-based theming solution that automatically adapts to organization profiles, industry types, and user preferences. It features 6 carefully crafted theme variants with multiple color shades to create visual depth and professional interfaces.

### Key Features
- 🎨 **6 Professional Theme Variants** - Each with 11 shades for main and accent colors
- ⚙️ **Dynamic Configuration Rules** - Automatic theme selection based on business context
- 🏢 **Industry-Specific Themes** - Optimized themes for different business types
- 👤 **User Preference Support** - Personal theme customization within business rules
- 🎭 **Visual Depth** - Multiple color shades create sophisticated visual hierarchy
- 📱 **Accessibility Ready** - High contrast and reduced motion support
- 🔧 **Zero Schema Changes** - Configuration stored in universal 6-table architecture

---

## 🎨 Available Theme Variants

### 1. Professional (Blue)
**Best for:** Professional services, consulting, finance
- **Main Colors:** Blue spectrum (50-950 shades)
- **Accent Colors:** Cyan spectrum
- **Character:** Trust, reliability, corporate elegance

### 2. Elegant (Purple)
**Best for:** Salon, spa, luxury services, premium brands
- **Main Colors:** Purple spectrum
- **Accent Colors:** Pink spectrum
- **Character:** Sophistication, luxury, creativity

### 3. Vibrant (Green)
**Best for:** Retail, startups, environmental, health & fitness
- **Main Colors:** Green spectrum
- **Accent Colors:** Amber spectrum
- **Character:** Growth, energy, freshness

### 4. Modern (Slate)
**Best for:** Manufacturing, technology, B2B software
- **Main Colors:** Slate spectrum
- **Accent Colors:** Orange spectrum
- **Character:** Innovation, efficiency, minimalism

### 5. Warm (Earth)
**Best for:** Restaurant, hospitality, food service
- **Main Colors:** Brown/earth spectrum
- **Accent Colors:** Red spectrum
- **Character:** Comfort, hospitality, approachability

### 6. Cool (Teal)
**Best for:** Healthcare, medical, scientific
- **Main Colors:** Teal spectrum
- **Accent Colors:** Indigo spectrum
- **Character:** Calm, medical precision, trust

---

## 🚀 Quick Start

### Basic Implementation

```typescript
import { UniversalThemeProvider, useUniversalTheme } from '@/lib/dna/theme'

// Wrap your app with the theme provider
function App() {
  const configurationRules = {
    organizationId: 'your-org-id',
    industryType: 'restaurant',
    userPreferences: {
      themeVariant: 'warm',
      darkMode: false
    }
  }

  return (
    <UniversalThemeProvider
      defaultVariant="professional"
      configurationRules={configurationRules}
    >
      <YourApp />
    </UniversalThemeProvider>
  )
}

// Use theme in components
function MyComponent() {
  const { currentTheme, setTheme, getSemanticColor } = useUniversalTheme()
  
  return (
    <div className="bg-theme-background text-theme-foreground">
      <h1 className="text-theme-primary">Welcome</h1>
      <button className="btn-theme-primary">Primary Action</button>
    </div>
  )
}
```

### Dynamic Configuration

```typescript
import { applySmartThemeConfiguration } from '@/lib/dna/theme'

// Automatically configure theme based on organization and user
const { configuration, appliedRules } = await applySmartThemeConfiguration(
  'organization-id',
  'user-id',
  customRules // Optional custom rules
)

console.log('Applied theme:', configuration.theme.variant)
console.log('Enabled features:', configuration.features)
console.log('Applied rules:', appliedRules)
```

---

## 🎨 Color System Architecture

### Color Shades (11 levels for depth)

Each theme variant includes 11 carefully calculated shades:

```typescript
interface ColorShades {
  50: string    // Lightest - backgrounds, subtle highlights
  100: string   // Very light - hover states, disabled elements
  200: string   // Light - borders, dividers
  300: string   // Medium light - secondary text, placeholders
  400: string   // Medium - inactive states
  500: string   // Base color - primary usage ⭐
  600: string   // Medium dark - hover states, focus
  700: string   // Dark - active states, pressed
  800: string   // Very dark - high contrast text
  900: string   // Darkest - maximum contrast, headers
  950: string   // Ultra dark - deep shadows, overlays
}
```

### CSS Custom Properties

The system automatically generates CSS custom properties:

```css
:root {
  /* Main color spectrum */
  --color-main-50: #eff6ff;
  --color-main-500: #3b82f6;  /* Base */
  --color-main-900: #1e3a8a;
  
  /* Accent color spectrum */
  --color-accent-50: #f0f9ff;
  --color-accent-500: #0ea5e9;  /* Base */
  --color-accent-900: #0c4a6e;
  
  /* Semantic colors */
  --color-primary: var(--color-main-500);
  --color-secondary: var(--color-accent-500);
  --color-background: var(--color-main-50);
  --color-surface: var(--color-main-100);
}
```

### CSS Classes with Depth

```css
/* Background classes */
.bg-main-50    /* Lightest background */
.bg-main-500   /* Primary background */
.bg-main-900   /* Darkest background */

/* Text classes */
.text-main-500     /* Primary text color */
.text-accent-600   /* Accent text with emphasis */

/* Interactive states */
.hover:bg-main-600:hover      /* Darker on hover */
.active:bg-main-700:active    /* Even darker when pressed */

/* Semantic utility classes */
.bg-theme-primary       /* Uses semantic primary color */
.text-theme-secondary   /* Uses semantic secondary color */
.border-theme-border    /* Uses semantic border color */
```

---

## ⚙️ Configuration Rules Engine

### Industry-Based Auto-Configuration

```typescript
// Automatic theme selection based on industry
const industryRules = {
  restaurant: 'warm',      // Earth tones for hospitality
  salon: 'elegant',        // Purple for luxury/beauty
  healthcare: 'cool',      // Teal for medical trust
  retail: 'vibrant',       // Green for growth/energy
  manufacturing: 'modern', // Slate for efficiency
  professional: 'professional' // Blue for corporate
}
```

### Business Rules Configuration

```typescript
interface UniversalConfigurationRules {
  organizationId: string
  industryType?: 'restaurant' | 'salon' | 'healthcare' | 'retail' | 'manufacturing' | 'professional'
  
  brandColors?: {
    primary?: string     // Custom brand primary color
    secondary?: string   // Custom brand secondary color
  }
  
  userPreferences?: {
    themeVariant?: string    // User's preferred theme
    darkMode?: boolean       // Dark/light mode preference
    highContrast?: boolean   // Accessibility preference
    reducedMotion?: boolean  // Accessibility preference
  }
  
  businessRules?: {
    allowCustomThemes?: boolean      // Can users customize themes?
    enforceIndustryTheme?: boolean   // Force industry-specific theme?
    availableVariants?: string[]     // Limit available theme options
  }
}
```

### Custom Configuration Rules

```typescript
const customRule: ConfigurationRule = {
  id: 'premium-customers',
  name: 'Premium Customer Theme',
  description: 'Apply elegant theme for premium tier customers',
  priority: 300,
  conditions: [
    {
      type: 'organization',
      operator: 'equals',
      field: 'tier',
      value: 'premium'
    }
  ],
  actions: [
    {
      type: 'set_theme',
      target: 'variant',
      value: 'elegant',
      override: true
    }
  ]
}
```

---

## 🎯 Visual Depth Implementation

### Progressive Color Usage

**Light Elements (50-200):**
```css
.bg-main-50    /* Page backgrounds */
.bg-main-100   /* Card surfaces */
.bg-main-200   /* Hover states for light elements */
```

**Medium Elements (300-500):**
```css
.text-main-300  /* Placeholder text */
.text-main-400  /* Secondary text */
.text-main-500  /* Primary text and buttons */
```

**Dark Elements (600-950):**
```css
.bg-main-600    /* Button hover states */
.bg-main-700    /* Button active states */
.bg-main-900    /* High contrast text */
.bg-main-950    /* Deep shadows and overlays */
```

### Enhanced Component Styles

```css
/* Buttons with depth progression */
.btn-theme-primary {
  background-color: var(--color-primary);     /* 500 shade */
  color: var(--color-primary-subtle);         /* 50 shade */
}

.btn-theme-primary:hover {
  background-color: var(--color-primary-hover); /* 600 shade */
  transform: translateY(-1px);                   /* Physical depth */
  box-shadow: 0 4px 12px rgba(var(--color-primary), 0.3);
}

.btn-theme-primary:active {
  background-color: var(--color-primary-active); /* 700 shade */
  transform: translateY(0);                       /* Return to surface */
}
```

### Card Components with Layered Depth

```css
.card-theme-surface {
  background-color: var(--color-surface);        /* 100 shade */
  border: 1px solid var(--color-border);         /* 200 shade */
  box-shadow: 0 1px 3px rgba(var(--color-main-900), 0.1);
}

.card-theme-surface:hover {
  transform: translateY(-2px);                   /* Lift on hover */
  box-shadow: 0 4px 12px rgba(var(--color-main-900), 0.15);
  border-color: var(--color-primary);            /* 500 shade */
}
```

---

## 🎛️ Advanced Usage

### Theme-Aware Components

```typescript
import { useUniversalTheme } from '@/lib/dna/theme'

function SmartComponent() {
  const { currentTheme, getColorShade, getSemanticColor } = useUniversalTheme()
  
  const primaryColor = getColorShade('main', 500)
  const hoverColor = getColorShade('main', 600)
  const accentColor = getSemanticColor('accent')
  
  return (
    <div 
      style={{
        backgroundColor: primaryColor,
        borderColor: hoverColor
      }}
      className="transition-colors duration-200"
    >
      Content with dynamic colors
    </div>
  )
}
```

### Custom Theme Creation

```typescript
import { createCustomTheme } from '@/lib/dna/theme'

const myCustomTheme = createCustomTheme(
  'corporate-red',
  'Corporate Red',
  'Custom red theme for corporate branding',
  {
    // Main color shades (red spectrum)
    50: '#fef2f2',
    100: '#fee2e2',
    // ... all 11 shades
    900: '#7f1d1d',
    950: '#450a0a'
  },
  {
    // Accent color shades (blue spectrum)
    50: '#eff6ff',
    100: '#dbeafe',
    // ... all 11 shades
    900: '#1e3a8a',
    950: '#172554'
  }
)
```

### Theme Persistence

```typescript
import { ConfigurationPersistence } from '@/lib/dna/theme'

// Save theme configuration to universal database
const persistence = new ConfigurationPersistence('organization-id')

await persistence.saveConfiguration(configuration, appliedRules)

// Load saved configuration
const savedConfig = await persistence.loadConfiguration()
```

---

## 📱 Component Integration

### Enhanced Stat Cards

```typescript
import { StatCardDNA } from '@/lib/dna/components/ui/stat-card-dna'

<StatCardDNA
  title="Revenue"
  value="$12,500"
  trend="+15.3%"
  trendDirection="up"
  icon={DollarSign}
  className="bg-theme-surface border-theme-border hover:shadow-theme-md"
/>
```

### Industry Dashboard Integration

```typescript
// Restaurant dashboard automatically uses warm theme
<RestaurantDashboard 
  organizationId="mario-restaurant"
  className="theme-warm"  // Applies warm-specific enhancements
/>

// Salon dashboard automatically uses elegant theme
<SalonDashboard 
  organizationId="hair-talkz"
  className="theme-elegant"  // Applies elegant-specific enhancements
/>
```

---

## 🔧 Development Workflow

### 1. Define Organization Profile

```typescript
const organizationProfile: OrganizationProfile = {
  organizationId: 'your-org-id',
  industryType: 'restaurant',
  businessSize: 'medium',
  brandColors: {
    primary: '#f97316',
    secondary: '#0ea5e9'
  }
}
```

### 2. Configure Theme Rules

```typescript
const configurationRules: UniversalConfigurationRules = {
  organizationId: 'your-org-id',
  industryType: 'restaurant',
  userPreferences: {
    themeVariant: 'warm'
  },
  businessRules: {
    allowCustomThemes: true,
    enforceIndustryTheme: false
  }
}
```

### 3. Apply Theme Provider

```typescript
<UniversalThemeProvider
  defaultVariant="professional"
  configurationRules={configurationRules}
  onThemeChange={(theme, config) => {
    console.log('Theme applied:', theme.name)
  }}
>
  <App />
</UniversalThemeProvider>
```

### 4. Use Theme Classes

```typescript
<div className="bg-theme-background">
  <h1 className="text-theme-foreground">Title</h1>
  <button className="btn-theme-primary">Action</button>
  <div className="card-theme-surface shadow-theme-md">
    Content with automatic theme adaptation
  </div>
</div>
```

---

## 🎯 Best Practices

### 1. **Use Semantic Colors First**
```css
/* ✅ Good - uses semantic color */
.bg-theme-primary

/* ❌ Avoid - hardcoded shade */
.bg-main-500
```

### 2. **Progressive Depth Hierarchy**
```css
/* ✅ Good - follows depth progression */
.bg-main-50     /* Background */
.bg-main-100    /* Surface */
.bg-main-200    /* Elevated surface */
.bg-main-500    /* Interactive element */
.bg-main-600    /* Hover state */
.bg-main-700    /* Active state */
```

### 3. **Industry-Appropriate Defaults**
```typescript
// ✅ Good - respects industry context
const industryDefaults = {
  restaurant: 'warm',      // Hospitality feeling
  healthcare: 'cool',      // Medical trust
  salon: 'elegant'         // Luxury/beauty
}
```

### 4. **Accessibility Considerations**
```typescript
// ✅ Good - supports accessibility
userPreferences: {
  highContrast: true,      // Increases contrast ratios
  reducedMotion: true,     // Minimizes animations
  themeVariant: 'professional' // High contrast variant
}
```

---

## 📊 Business Impact

| Benefit | Traditional Theming | HERA Universal Theme |
|---------|-------------------|---------------------|
| **Setup Time** | 2-4 weeks | 0 seconds (automatic) |
| **Customization** | Code changes required | Configuration-driven |
| **Industry Adaptation** | Manual for each business | Automatic recognition |
| **Accessibility** | Separate implementation | Built-in support |
| **Brand Compliance** | Custom CSS per brand | Rule-based application |
| **Maintenance** | Ongoing developer effort | Self-maintaining |
| **Visual Depth** | Manual shade selection | Professional 11-shade system |

---

## 🚀 Integration Examples

### Complete Theme Configuration Demo

```typescript
import { ThemeConfigurationExample } from '@/lib/dna/examples/theme-configuration-example'

// Complete interactive demo showing:
// - Organization profile selection
// - User preference configuration  
// - Real-time theme application
// - Configuration rules visualization
// - Generated CSS preview
// - Live component examples

<ThemeConfigurationExample />
```

### Advanced Custom Rules

```typescript
// Time-based theme switching
const timeBasedRule: ConfigurationRule = {
  id: 'night-mode',
  conditions: [
    {
      type: 'time_based',
      operator: 'between',
      field: 'hour',
      value: [18, 6] // 6 PM to 6 AM
    }
  ],
  actions: [
    {
      type: 'set_theme',
      target: 'darkMode',
      value: true
    }
  ]
}

// Region-based customization
const regionBasedRule: ConfigurationRule = {
  id: 'middle-east-theme',
  conditions: [
    {
      type: 'organization',
      operator: 'equals',
      field: 'region',
      value: 'middle_east'
    }
  ],
  actions: [
    {
      type: 'set_theme',
      target: 'textDirection',
      value: 'rtl'
    }
  ]
}
```

---

This Universal Theme System revolutionizes how HERA applications handle theming by providing intelligent, rule-based theme selection that automatically adapts to business context while maintaining professional visual depth through carefully crafted color progressions.

The system eliminates manual theme configuration work while ensuring every business gets an optimized, industry-appropriate visual experience that can be further customized based on brand requirements and user preferences.
