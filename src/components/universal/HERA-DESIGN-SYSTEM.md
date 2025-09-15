# HERA Universal Design System 🎨

A comprehensive design system extracted from the PWM (Private Wealth Management) system, standardized for universal use across all HERA applications.

## Overview

The HERA Universal Design System provides a consistent, premium dark-mode experience with sophisticated animations and glass morphism effects. Built on the success of the PWM system, it offers reusable components and CSS utilities that work seamlessly across all HERA Universal APIs.

## Core Philosophy

- **Premium Dark-First**: Sophisticated dark theme with subtle brand tinting
- **Smooth Animations**: Physics-based animations using advanced easing functions
- **Glass Morphism**: Modern glass effects with backdrop blur and depth
- **Universal Patterns**: Components that work across all business domains
- **Performance Optimized**: CSS variables and efficient animations

## Color System

### HERA Brand Colors (Oklahoma LCH)

```css
/* Primary Brand Colors */
--hera-500: oklch(0.57 0.192 250); /* Primary Blue */
--hera-cyan-500: oklch(0.68 0.12 200); /* Secondary Cyan */
--hera-emerald-500: oklch(0.64 0.12 160); /* Success Green */
--hera-amber-500: oklch(0.69 0.12 85); /* Warning Gold */
--hera-purple-500: oklch(0.58 0.192 280); /* Accent Purple */
```

### Dark Theme Variables

```css
/* Enhanced Dark Surfaces */
--dark-surface-1: oklch(0.09 0.01 250); /* Background */
--dark-surface-2: oklch(0.12 0.02 250); /* Cards */
--dark-surface-3: oklch(0.15 0.03 250); /* Elevated */
--dark-surface-elevated: oklch(0.18 0.04 250); /* Popover */
```

### Gradients

```css
/* Universal Gradients */
--hera-gradient: linear-gradient(
  45deg,
  var(--hera-500),
  var(--hera-cyan-500),
  var(--hera-emerald-500)
);
--hera-gradient-wealth: linear-gradient(
  135deg,
  var(--hera-500) 0%,
  var(--hera-cyan-600) 50%,
  var(--hera-emerald-500) 100%
);
--hera-gradient-dark: linear-gradient(
  135deg,
  var(--hera-900) 0%,
  var(--hera-800) 50%,
  var(--hera-700) 100%
);
```

## Animation System

### Durations & Easing

```css
/* Animation Durations */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-ultra-slow: 800ms;

/* Advanced Easing Functions */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
--ease-in-out-circ: cubic-bezier(0.785, 0.135, 0.15, 0.86);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Universal Animation Classes

```tsx
// Entry Animations
<div className="animate-fade-in">Fade In</div>
<div className="animate-slide-up">Slide Up</div>
<div className="animate-slide-down">Slide Down</div>
<div className="animate-scale-in">Scale In</div>
<div className="animate-bounce-in">Bounce In</div>

// Continuous Animations
<div className="animate-glow">Glowing Effect</div>
<div className="animate-shimmer">Shimmer Loading</div>
<div className="animate-float">Floating Motion</div>
<div className="animate-pulse-slow">Slow Pulse</div>

// Animation Delays
<div className="animate-fade-in animate-delay-150">Delayed Animation</div>
```

## Component Library

### HeraCard

Premium card component with multiple variants:

```tsx
import { HeraCard, HeraWealthCard, HeraGlassCard } from '@/components/universal/ui';

// Basic Card
<HeraCard variant="default" animation="fade-in">
  Content
</HeraCard>

// Wealth-specific styling
<HeraWealthCard interactive glow="primary">
  Wealth metrics
</HeraWealthCard>

// Glass morphism effect
<HeraGlassCard animation="slide-up" animationDelay={200}>
  Glass content
</HeraGlassCard>
```

**Props:**

- `variant`: 'default' | 'glass' | 'wealth' | 'metric' | 'elevated'
- `interactive`: boolean - Adds hover effects
- `glow`: 'none' | 'primary' | 'success' | 'warning'
- `animation`: Entry animation type
- `animationDelay`: Delay in milliseconds

### HeraMetric

Universal metric display component:

```tsx
import { HeraMetric, HeraWealthMetric } from '@/components/universal/ui';

// Standard Metric
<HeraMetric
  title="Total Revenue"
  value={2500000}
  format="currency"
  change={{ value: 125000, percentage: 5.2, period: "vs last month" }}
  trend="up"
  icon={<DollarSign className="h-5 w-5" />}
/>

// Wealth-specific variant
<HeraWealthMetric
  title="Portfolio Value"
  value={250000000}
  currency="USD"
  change={{ percentage: 2.4, period: "24h" }}
  trend="up"
/>
```

**Features:**

- Automatic number formatting (currency, percentage, large numbers)
- Trend indicators with icons
- Multiple size variants
- Interactive hover effects

### HeraProgress

Advanced progress indicators:

```tsx
import { HeraProgress, HeraWealthProgress, HeraGoalProgress } from '@/components/universal/ui';

// Gradient Progress
<HeraWealthProgress
  value={75}
  label="Portfolio Allocation"
  showPercentage
  animated
/>

// Goal Tracking
<HeraGoalProgress
  current={1250000}
  target={2000000}
  title="Annual Revenue Goal"
/>

// Risk Assessment
<HeraRiskProgress riskLevel={35} />
```

### HeraLayout System

Flexible layout components:

```tsx
import {
  HeraLayout,
  HeraGrid,
  HeraStack,
  HeraDashboardLayout,
  HeraPageHeader
} from '@/components/universal/ui';

// Dashboard Layout
<HeraDashboardLayout>
  <HeraPageHeader
    title="Wealth Management"
    subtitle="Monitor and manage your portfolio"
    actions={<Button>Export Data</Button>}
  />

  <HeraGrid cols={3} responsive gap="lg">
    <HeraCard>Metric 1</HeraCard>
    <HeraCard>Metric 2</HeraCard>
    <HeraCard>Metric 3</HeraCard>
  </HeraGrid>
</HeraDashboardLayout>

// Flexible Stacking
<HeraStack direction="horizontal" justify="between" align="center">
  <div>Left Content</div>
  <div>Right Content</div>
</HeraStack>
```

## CSS Utility Classes

### Glass Effects

```css
.hera-glass-card     /* Premium glass card */
.hera-wealth-card    /* Wealth-specific styling */
.hera-metric-card    /* Metric display card */
```

### Status Indicators

```css
.hera-status-positive  /* Green trend indicators */
.hera-status-negative  /* Red trend indicators */
.hera-status-neutral   /* Neutral gray indicators */
```

### Interactive Elements

```css
.hera-interactive     /* Hover effects */
.hera-glow-primary    /* Primary glow effect */
.hera-glow-success    /* Success glow effect */
.hera-glow-warning    /* Warning glow effect */
```

### Layout Utilities

```css
.hera-stack-vertical    /* Vertical flex stack */
.hera-stack-horizontal  /* Horizontal flex stack */
.hera-center           /* Center alignment */
.hera-surface-1        /* Background surface */
.hera-surface-2        /* Card background */
.hera-surface-elevated /* Elevated surface */
```

## Usage Examples

### Wealth Management Dashboard

```tsx
function WealthDashboard() {
  return (
    <HeraDashboardLayout>
      <HeraPageHeader title="Portfolio Overview" subtitle="$250M+ under management" />

      <HeraGrid cols={4} gap="lg">
        <HeraWealthMetric
          title="Total Value"
          value={250000000}
          change={{ percentage: 2.4 }}
          trend="up"
        />

        <HeraMetric
          title="Daily P&L"
          value={125000}
          format="currency"
          trend="up"
          variant="metric"
        />

        <HeraProgress label="Risk Exposure" value={35} variant="warning" showPercentage />

        <HeraGlassCard animation="slide-up" animationDelay={300}>
          <h3>AI Insights</h3>
          <p>Market opportunities detected...</p>
        </HeraGlassCard>
      </HeraGrid>
    </HeraDashboardLayout>
  )
}
```

### Restaurant Management

```tsx
function RestaurantDashboard() {
  return (
    <HeraDashboardLayout>
      <HeraPageHeader
        title="Restaurant Operations"
        subtitle="Real-time kitchen and order management"
      />

      <HeraGrid cols={3} gap="md">
        <HeraMetricCard interactive>
          <HeraMetric
            title="Daily Revenue"
            value={8500}
            format="currency"
            trend="up"
            icon={<DollarSign />}
          />
        </HeraMetricCard>

        <HeraMetricCard>
          <HeraMetric title="Orders Today" value={145} trend="up" icon={<ShoppingBag />} />
        </HeraMetricCard>

        <HeraMetricCard>
          <HeraGoalProgress current={8500} target={10000} title="Daily Goal" />
        </HeraMetricCard>
      </HeraGrid>
    </HeraDashboardLayout>
  )
}
```

## Implementation Notes

### Performance

- All animations use CSS transforms for GPU acceleration
- CSS variables enable efficient theme switching
- Backdrop-filter has fallbacks for older browsers

### Accessibility

- All interactive elements have focus states
- Color combinations meet WCAG contrast requirements
- Animations respect `prefers-reduced-motion`

### Browser Support

- Modern browsers with CSS custom properties
- Graceful degradation for older browsers
- Progressive enhancement for advanced features

## Migration Guide

### From Existing Components

```tsx
// Old approach
<div className="bg-gray-800 rounded-lg p-6 shadow-lg">
  <h3>Metric</h3>
  <div className="text-2xl font-bold">$1,250,000</div>
</div>

// New HERA approach
<HeraMetric
  title="Metric"
  value={1250000}
  format="currency"
  variant="wealth"
  animation="slide-up"
/>
```

### CSS Class Migration

```css
/* Old classes */
.custom-card { background: #1e293b; }
.fade-in { animation: fadeIn 0.3s ease; }

/* New HERA classes */
.hera-metric-card  /* Pre-built card styling */
.animate-fade-in   /* Advanced easing and timing */
```

## Future Enhancements

- [ ] Theme customization system
- [ ] Motion presets for different business domains
- [ ] Advanced data visualization components
- [ ] Mobile-specific component variants
- [ ] RTL language support
- [ ] High contrast mode themes

---

_The HERA Universal Design System - Built for the future of enterprise applications._
