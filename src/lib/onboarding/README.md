# HERA Universal Onboarding System

A Smart Code-driven onboarding framework built on React-Joyride with HERA-specific abstractions. Provides drop-in, reusable guided tours for any HERA React application while maintaining the sacred 6-table architecture and universal transaction tracking.

## 🎯 Overview

The HERA Onboarding System transforms traditional product tours into universal business intelligence events. Every step, every interaction, and every completion is tracked through `universal_transactions` and `universal_transaction_lines`, providing complete audit trails and analytics without requiring new database tables.

### Key Features

- **Smart Code Driven**: Tours identified by HERA Smart Codes (`HERA.UI.ONBOARD.*`)
- **Universal Architecture**: Zero schema changes - uses existing 6 tables
- **Multi-Tenant Ready**: Organization isolation built-in
- **i18n Support**: Type-safe internationalization with fallbacks
- **Theme System**: Light, dark, and high-contrast themes
- **Accessibility**: Keyboard navigation, ARIA labels, reduced motion support
- **Analytics**: Automatic event emission for tracking and insights
- **Resilient**: DOM readiness checks, route guards, retry logic
- **TypeScript**: Full type safety throughout

## 🚀 Quick Start

### Installation

```bash
npm install react-joyride
npm install -D @types/react-joyride
```

### Basic Usage

```tsx
import { HeraOnboardingProvider, useOnboarding } from '@/lib/onboarding'

// Wrap your app with the provider
function App() {
  return (
    <HeraOnboardingProvider
      organizationId="org_123"
      enabledTours={['HERA.UI.ONBOARD.CONSOLE.DASHBOARD.V1']}
      theme="light"
      onEmit={(txn, lines) => console.log('Event:', { txn, lines })}
    >
      <YourApp />
    </HeraOnboardingProvider>
  )
}

// Use in any component
function Dashboard() {
  const { startTour } = useOnboarding()

  return (
    <button onClick={() => startTour('HERA.UI.ONBOARD.CONSOLE.DASHBOARD.V1')}>Start Tour</button>
  )
}
```

## 📋 Defining Tours

Tours are defined using HERA Smart Codes and registered centrally:

```typescript
import { registerTour } from '@/lib/onboarding'

const myTour = {
  tourSmartCode: 'HERA.UI.ONBOARD.MYMODULE.OVERVIEW.V1',
  autoStart: false,
  allowSkip: true,
  steps: [
    {
      smartCode: 'HERA.UI.ONBOARD.MYMODULE.STEP1.V1',
      selector: '[data-testid="feature-button"]',
      titleKey: 'ui.onboard.mymodule.step1.title',
      bodyKey: 'ui.onboard.mymodule.step1.body',
      placement: 'bottom',
      spotlightPadding: 8,
      waitFor: '[data-testid="feature-button"]',
      timeoutMs: 5000
    },
    {
      smartCode: 'HERA.UI.ONBOARD.MYMODULE.STEP2.V1',
      selector: '.data-table',
      titleKey: 'ui.onboard.mymodule.step2.title',
      bodyKey: 'ui.onboard.mymodule.step2.body',
      placement: 'top',
      route: '/mymodule/data' // Navigate before showing
    }
  ]
}

// Register the tour
registerTour(myTour)
```

### Step Options

- `smartCode`: Unique Smart Code for the step
- `selector`: CSS selector for target element
- `titleKey`: i18n key for step title
- `bodyKey`: i18n key for step body
- `placement`: Tooltip placement (top, right, bottom, left, auto, center)
- `spotlightPadding`: Padding around highlighted element
- `route`: Route to navigate to before showing step
- `waitFor`: Selector or function to wait for readiness
- `timeoutMs`: Timeout for wait conditions
- `disableBeacon`: Hide pulsing beacon
- `hideCloseButton`: Hide close button
- `hideBackButton`: Hide back button
- `metadata`: Additional data for analytics

## 🌍 Internationalization

### Default Messages

The system includes comprehensive English messages. Override or extend as needed:

```typescript
const customMessages = {
  'ui.onboard.mymodule.step1.title': 'Welcome to My Module',
  'ui.onboard.mymodule.step1.body': 'This module helps you manage data efficiently.',
  // ... more messages
};

<HeraOnboardingProvider messages={customMessages}>
```

### Message Interpolation

Support for variable substitution:

```typescript
const messages = {
  'ui.onboard.welcome': 'Welcome {{name}} to {{module}}!'
}

// Result: "Welcome John to Dashboard!"
```

### Multi-Language Support

```typescript
// Create language manager
const i18nManager = new I18nManager(async lang => {
  const response = await fetch(`/api/i18n/${lang}.json`)
  return response.json()
})

// Load language
const messages = await i18nManager.loadMessages('es')
```

## 🎨 Theming

### Built-in Themes

Three themes are provided out of the box:

```typescript
<HeraOnboardingProvider theme="light">   // Default
<HeraOnboardingProvider theme="dark">    // Dark mode
<HeraOnboardingProvider theme="highContrast"> // Accessibility
```

### Custom Styling

The theme system integrates with HERA's design tokens:

```typescript
const customTheme = {
  name: 'custom',
  tokens: {
    bubbleBackground: 'oklch(0.95 0.05 250)',
    bubbleText: '#1a1a1a',
    beaconColor: 'oklch(0.57 0.192 250)'
    // ... more tokens
  }
}
```

## 📊 Analytics & Events

### Event Emission

Every interaction emits universal transactions:

```typescript
<HeraOnboardingProvider
  onEmit={(transaction, lines) => {
    // Send to your analytics API
    await analyticsApi.track(transaction, lines);

    // Or store locally
    localStorage.setItem('onboarding_events', JSON.stringify({ transaction, lines }));
  }}
>
```

### Event Types

- **Tour Started**: When tour begins
- **Step Shown**: When step displays
- **Step Completed**: When user advances
- **Tour Completed**: When tour finishes
- **Tour Dismissed**: When user skips/closes
- **Step Error**: When step fails to show

### Transaction Structure

```typescript
// universal_transactions
{
  id: 'txn_abc123',
  organization_id: 'org_123',
  smart_code: 'HERA.UI.ONBOARD.CONSOLE.DASHBOARD.V1',
  occurred_at: '2024-01-01T12:00:00Z',
  ai_confidence: null,
  ai_insights: null,
  metadata: {
    event_type: 'onboarding',
    user_agent: 'Mozilla/5.0...',
    screen_resolution: '1920x1080',
    timezone: 'America/New_York',
  }
}

// universal_transaction_lines
{
  id: 'line_def456',
  transaction_id: 'txn_abc123',
  line_index: 0,
  smart_code: 'HERA.UI.ONBOARD.CONSOLE.DASHBOARD.WELCOME.V1',
  status: 'completed',
  duration_ms: 3500,
  metadata: {
    step_index: 0,
    selector: '[data-testid="page-title"]',
  }
}
```

## 🛡️ Guards & Resilience

### DOM Readiness

Wait for elements before showing steps:

```typescript
{
  selector: '.dynamic-content',
  waitFor: '.dynamic-content',  // Wait for selector
  timeoutMs: 5000,
}

// Or use a function
{
  waitFor: async () => {
    const data = await fetchData();
    return data.loaded;
  },
}
```

### Route Navigation

Automatically navigate to required routes:

```typescript
{
  route: '/dashboard/analytics',  // String route
}

// Or custom navigation
{
  route: async (router) => {
    await router.push({
      pathname: '/dashboard',
      query: { tab: 'analytics' },
    });
  },
}
```

### Multiple Conditions

```typescript
const isReady = await isStepReady('.target', {
  route: '/dashboard',
  waitFor: '.data-loaded',
  timeoutMs: 10000,
  router: nextRouter
})
```

## ♿ Accessibility

### Keyboard Navigation

- `Tab` / `Shift+Tab`: Navigate between buttons
- `Enter` / `Space`: Activate buttons
- `Escape`: Close tour
- Arrow keys: Supported by screen readers

### Reduced Motion

Automatically detects and respects `prefers-reduced-motion`:

```typescript
<HeraOnboardingProvider respectReducedMotion={true}>
```

### ARIA Support

All elements include proper ARIA labels and roles for screen reader compatibility.

### High Contrast Mode

Special theme with enhanced visibility:

```typescript
<HeraOnboardingProvider theme="highContrast">
```

## 🔧 Advanced Usage

### Programmatic Control

```typescript
const { startTour, stopTour, next, back, getState, isActive, currentStep, totalSteps } =
  useOnboarding()

// Start with options
startTour('HERA.UI.ONBOARD.CONSOLE.DASHBOARD.V1', {
  auto: true, // Auto-start
  startAt: 2, // Start at step 3
  overrides: {
    // Override tour config
    allowSkip: false
  }
})

// Check state
const state = getState()
console.log(state.stepDurations) // Time spent per step
```

### Conditional Tours

Filter steps based on conditions:

```typescript
const filteredSteps = filterSteps(tour.steps, step => {
  // Only show admin features to admin users
  return !step.smartCode.includes('ADMIN') || user.isAdmin
})
```

### Mini Tours

Create contextual tours for specific features:

```typescript
const miniTour = createMiniTour('WIDGET.KPI', [
  {
    selector: '.kpi-card',
    titleKey: 'ui.widget.kpi.title',
    bodyKey: 'ui.widget.kpi.body',
    placement: 'bottom'
  }
])

registerTour(miniTour)
```

### Feature Flags

Control which tours are available:

```typescript
const enabledTours = user.features
  .filter(f => f.startsWith('onboarding.'))
  .map(f => `HERA.UI.ONBOARD.${f.replace('onboarding.', '').toUpperCase()}.v1`);

<HeraOnboardingProvider enabledTours={enabledTours}>
```

## 🏗️ HERA Architecture Alignment

### 6-Table Promise

The onboarding system maintains HERA's sacred 6-table architecture:

1. **core_organizations**: Organization isolation for tours
2. **core_entities**: Users are entities that take tours
3. **core_dynamic_data**: Could store tour preferences
4. **core_relationships**: User-to-tour completion relationships
5. **universal_transactions**: Tour events (start, complete, skip)
6. **universal_transaction_lines**: Step-level details and timing

### Smart Code Intelligence

Every tour and step has a Smart Code providing business context:

```
HERA.UI.ONBOARD.{MODULE}.{FEATURE}.{STEP}.v{VERSION}

Examples:
HERA.UI.ONBOARD.CONSOLE.DASHBOARD.V1
HERA.UI.ONBOARD.CRM.CUSTOMERS.LIST.V1
HERA.UI.ONBOARD.FINANCIAL.GL.ACCOUNTS.V1
```

### Universal Transactions

No custom tables needed. All events flow through universal architecture:

```sql
-- Find users who completed onboarding
SELECT DISTINCT t.metadata->>'user_id' as user_id
FROM universal_transactions t
WHERE t.smart_code LIKE 'HERA.UI.ONBOARD.%'
  AND t.metadata->>'event' = 'tour_completed'
  AND t.organization_id = ?

-- Average time per step
SELECT
  tl.smart_code,
  AVG(tl.duration_ms) as avg_duration
FROM universal_transaction_lines tl
JOIN universal_transactions t ON tl.transaction_id = t.id
WHERE t.smart_code LIKE 'HERA.UI.ONBOARD.%'
  AND tl.status = 'completed'
GROUP BY tl.smart_code
```

## 🧪 Testing

### Unit Tests

```bash
npm test src/lib/onboarding
```

Test coverage includes:

- Step transformations
- Event emission
- Guard conditions
- i18n resolution
- Theme application

### Integration Testing

```typescript
import { render, screen } from '@testing-library/react';
import { HeraOnboardingProvider } from '@/lib/onboarding';

test('tour starts when button clicked', async () => {
  render(
    <HeraOnboardingProvider {...props}>
      <MyComponent />
    </HeraOnboardingProvider>
  );

  fireEvent.click(screen.getByText('Start Tour'));

  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
```

## 📝 License

React-Joyride is MIT licensed. The HERA Onboarding System maintains the same license compatibility.

## 🤝 Contributing

When adding new features:

1. Maintain Smart Code format for new tours
2. Ensure multi-tenant isolation
3. Emit proper universal transactions
4. Add i18n keys with English defaults
5. Include TypeScript types
6. Write unit tests
7. Update this README

## 🚨 Troubleshooting

### Tour doesn't start

- Check if tour is in `enabledTours` array
- Verify target elements exist in DOM
- Check browser console for errors
- Ensure organization ID is provided

### Steps timeout

- Increase `timeoutMs` for slow-loading content
- Use `waitFor` conditions appropriately
- Check if routes are navigating correctly
- Verify selectors are unique and stable

### Wrong theme

- Check system theme preference
- Verify theme prop is passed correctly
- Ensure CSS is loading properly
- Try explicit theme override

### Events not tracking

- Verify `onEmit` callback is provided
- Check organization ID is set
- Ensure no errors in emission logic
- Monitor network tab for API calls

## 🎉 Summary

The HERA Onboarding System proves that complex features can be built on universal architecture without schema changes. By using Smart Codes, universal transactions, and the sacred 6-table foundation, we've created a production-ready onboarding solution that scales infinitely while maintaining perfect data consistency and multi-tenant isolation.

This isn't just an onboarding library - it's a demonstration of HERA's promise that **any business complexity can be modeled with just 6 tables**.
