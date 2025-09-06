# HERA DNA Assessment Dashboard Component

## Overview

The Assessment Dashboard DNA component is a reusable, WCAG AAA compliant dashboard UI component designed specifically for assessment and scoring interfaces in HERA. It automatically handles all accessibility concerns, color contrast issues, and provides a consistent user experience across the application.

## Key Features

- **WCAG AAA Compliant**: All color combinations meet or exceed WCAG AAA standards for text contrast
- **Automatic Score Coloring**: Intelligent color coding based on score ranges
- **Tab Navigation**: Built-in accessible tab navigation with high-contrast inactive states
- **Animated UI**: Smooth animations with Framer Motion
- **Dark Mode Support**: Perfect visibility in both light and dark themes
- **Reusable Components**: Modular design with helper components

## Usage

### Basic Example

```tsx
import { AssessmentDashboardDNA, AssessmentScoreCard, AssessmentStatusBadge } from '@/lib/dna/components/ui/assessment-dashboard-dna'

function MyAssessmentDashboard() {
  return (
    <AssessmentDashboardDNA
      title="ERP Readiness Assessment"
      subtitle="Comprehensive evaluation of your organization's ERP readiness"
      score={75}
      scoreLabel="Overall Readiness"
      tabs={[
        {
          value: 'overview',
          label: 'Overview',
          content: <OverviewContent />
        },
        {
          value: 'categories',
          label: 'Categories',
          content: <CategoriesContent />
        },
        {
          value: 'details',
          label: 'Details',
          content: <DetailsContent />
        }
      ]}
      actions={
        <>
          <Button variant="outline">Export Report</Button>
          <Button>Start New Assessment</Button>
        </>
      }
    />
  )
}
```

### Score Card Usage

```tsx
<AssessmentScoreCard
  label="Strategy & Vision"
  score={18}
  total={20}
/>
```

### Status Badge Usage

```tsx
<AssessmentStatusBadge status="complete" />
<AssessmentStatusBadge status="pending" />
<AssessmentStatusBadge status="incomplete" />
```

## Color Palette

The component uses a predefined color palette that ensures WCAG AAA compliance:

### Score Colors
- **Excellent (80%+)**: Emerald green with proper contrast
- **Good (60-79%)**: Blue with proper contrast
- **Fair (40-59%)**: Amber with proper contrast
- **Poor (<40%)**: Red with proper contrast

### Text Colors
- **Primary**: `text-gray-900 dark:text-gray-100`
- **Secondary**: `text-gray-700 dark:text-gray-200`
- **Muted**: `text-gray-600 dark:text-gray-300`

### Tab Colors
- **Inactive**: `text-teal-200 hover:text-teal-100` (high visibility)
- **Active**: `text-white`

## Accessibility Features

1. **Color Contrast**: All text meets WCAG AAA standards (7:1 contrast ratio)
2. **Keyboard Navigation**: Full keyboard support for tabs and actions
3. **Screen Reader Support**: Proper ARIA labels and semantic HTML
4. **Focus Indicators**: Clear focus states for all interactive elements
5. **Motion Preferences**: Respects `prefers-reduced-motion`

## Props

### AssessmentDashboardDNA Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| title | string | - | Main dashboard title |
| subtitle | string | - | Optional subtitle |
| score | number | - | Overall score (0-100) |
| scoreLabel | string | "Overall Score" | Label for the score display |
| tabs | TabConfig[] | - | Tab configuration array |
| actions | ReactNode | - | Action buttons/elements |
| className | string | - | Additional CSS classes |
| children | ReactNode | - | Content when not using tabs |

### TabConfig

```typescript
interface TabConfig {
  value: string
  label: string
  content: React.ReactNode
}
```

## Migration Guide

To migrate from a custom dashboard to this DNA component:

1. Replace custom Card components with `AssessmentDashboardDNA`
2. Move tab content into the `tabs` prop configuration
3. Replace custom score displays with `AssessmentScoreCard`
4. Replace custom status badges with `AssessmentStatusBadge`
5. Remove all custom color classes - the component handles this automatically

## Benefits

1. **Time Savings**: No more debugging color contrast issues
2. **Consistency**: Same UI pattern across all assessment dashboards
3. **Accessibility**: WCAG AAA compliance out of the box
4. **Maintenance**: Single source of truth for assessment UI
5. **Performance**: Optimized animations and rendering

## HERA DNA Integration

This component is part of the HERA DNA UI system and follows these principles:

- **Universal Reusability**: Works across all HERA modules
- **Zero Configuration**: Sensible defaults with optional customization
- **Theme Aware**: Automatically adapts to light/dark themes
- **Future Proof**: Easy to update globally when requirements change

## Examples in Production

- ERP Readiness Assessment Dashboard
- Employee Performance Reviews
- Vendor Evaluation Scorecards
- Project Health Assessments
- Compliance Audit Dashboards

## Version History

- **v1.0.0** (2025-09-06): Initial release with WCAG AAA compliance
  - Automatic score coloring
  - High-contrast tab navigation
  - Animated UI with Framer Motion
  - Complete dark mode support