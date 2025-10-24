# 🚀 Dashboard Filter - Quick Reference

## 5-Minute Integration Guide

### 1. Add Filter to Your Component (3 lines of code)

```tsx
import { useDashboardFilter } from '@/contexts/DashboardFilterContext'
import { FilterOverrideControl } from '@/components/salon/dashboard/FilterOverrideControl'

const COMPONENT_ID = 'my-component'

export function MyComponent() {
  const { getComponentPeriod } = useDashboardFilter()
  const period = getComponentPeriod(COMPONENT_ID)

  return (
    <div>
      <h2>My Component</h2>
      <FilterOverrideControl
        componentId={COMPONENT_ID}
        availablePeriods={['last7Days', 'last30Days']}
      />
      <p>Showing: {period}</p>
    </div>
  )
}
```

### 2. Filter Your Data

```tsx
const data = useMemo(() => {
  switch (period) {
    case 'today':
      return todayData
    case 'last7Days':
      return weekData
    case 'last30Days':
      return monthData
    default:
      return allData
  }
}, [period, todayData, weekData, monthData, allData])
```

### 3. Done! ✅

Your component now:
- ✅ Respects global filter by default
- ✅ Can override with custom filter
- ✅ Shows visual feedback
- ✅ Integrates with global "Clear All" button

---

## Common Patterns

### Pattern 1: Simple Override Control

```tsx
<FilterOverrideControl
  componentId="revenue-trends"
  availablePeriods={['today', 'last7Days', 'last30Days']}
/>
```

### Pattern 2: With Status Badge

```tsx
<div className="flex items-center gap-2">
  <h2>Revenue Trends</h2>
  <FilterStatusBadge componentId="revenue-trends" />
</div>

<FilterOverrideControl
  componentId="revenue-trends"
  availablePeriods={['last7Days', 'last30Days']}
  showGlobalIndicator={true}
/>
```

### Pattern 3: Compact Mode

```tsx
<FilterOverrideControl
  componentId="revenue-trends"
  availablePeriods={['today', 'last7Days', 'last30Days']}
  compact={true}  // Shows "7D" instead of "Last 7 Days"
/>
```

### Pattern 4: Custom Period Labels

```tsx
import { getPeriodLabel, getPeriodShortLabel } from '@/contexts/DashboardFilterContext'

const label = getPeriodLabel('last7Days')      // "Last 7 Days"
const short = getPeriodShortLabel('last7Days') // "7D"
```

---

## API Cheat Sheet

### Hook: `useDashboardFilter()`

```typescript
const {
  // Global filter
  globalPeriod,              // Current global period
  setGlobalPeriod,           // (period: TimePeriod) => void

  // Component overrides
  getComponentPeriod,        // (id: string) => TimePeriod
  setComponentOverride,      // (id: string, period: TimePeriod | null) => void
  hasOverride,               // (id: string) => boolean
  clearComponentOverride,    // (id: string) => void
  clearAllOverrides,         // () => void

  // Metadata
  getOverrideCount,          // () => number
  getAllOverrides            // () => ComponentFilter[]
} = useDashboardFilter()
```

### Available Periods

```typescript
type TimePeriod =
  | 'today'
  | 'last7Days'
  | 'last30Days'
  | 'yearToDate'
  | 'allTime'
```

---

## Examples

### Example 1: Read-Only Component (No Override)

```tsx
const COMPONENT_ID = 'summary-metrics'

export function SummaryMetrics() {
  const { getComponentPeriod } = useDashboardFilter()
  const period = getComponentPeriod(COMPONENT_ID)

  // Uses global filter, no override UI
  return <div>Showing {getPeriodLabel(period)} data</div>
}
```

### Example 2: Component with Override

```tsx
const COMPONENT_ID = 'revenue-chart'

export function RevenueChart() {
  const { getComponentPeriod } = useDashboardFilter()
  const period = getComponentPeriod(COMPONENT_ID)

  const data = useMemo(() => {
    return filterRevenue(period)
  }, [period])

  return (
    <div>
      <h2>Revenue Chart</h2>
      <FilterOverrideControl
        componentId={COMPONENT_ID}
        availablePeriods={['last7Days', 'last30Days']}
      />
      <Chart data={data} />
    </div>
  )
}
```

### Example 3: Global Filter Bar

```tsx
export function GlobalFilterBar() {
  const {
    globalPeriod,
    setGlobalPeriod,
    getOverrideCount,
    clearAllOverrides
  } = useDashboardFilter()

  return (
    <div>
      <h3>Global Filter</h3>

      {/* Period buttons */}
      {['today', 'last7Days', 'last30Days'].map(period => (
        <button
          key={period}
          onClick={() => setGlobalPeriod(period as TimePeriod)}
          className={globalPeriod === period ? 'active' : ''}
        >
          {getPeriodLabel(period as TimePeriod)}
        </button>
      ))}

      {/* Override indicator */}
      {getOverrideCount() > 0 && (
        <div>
          {getOverrideCount()} custom filter(s) active
          <button onClick={clearAllOverrides}>Clear All</button>
        </div>
      )}
    </div>
  )
}
```

---

## Visual States

### Global Filter (Blue/Sapphire)
```
┌────────────────────────┐
│ ℹ️ Global              │
│ [🔵 7D] [30D] [YTD]    │
└────────────────────────┘
```

### Custom Override (Gold)
```
┌────────────────────────┐
│ [7D] [🟡 30D] [YTD] 🔄 │
└────────────────────────┘
```

### With Status Badge
```
┌─────────────────────────────────────────┐
│ 📊 Revenue Trends                       │
│ [Custom Filter: 30D (Global: 7D)]       │
│                                          │
│ [7D] [🟡 30D] [YTD] 🔄                  │
└─────────────────────────────────────────┘
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "must be used within DashboardFilterProvider" | Wrap app with `<DashboardFilterProvider>` |
| Override not showing | Check `componentId` is unique |
| Data not updating | Ensure `useMemo` dependencies include `period` |

---

## Color Codes

| Color | Usage | Hex |
|-------|-------|-----|
| 🔵 Sapphire | Global filter | `LUXE_COLORS.sapphire` |
| 🟡 Gold | Override active | `LUXE_COLORS.gold` |
| 🔴 Ruby | Reset/Clear | `LUXE_COLORS.ruby` |

---

## Files You Need

```
src/
├── contexts/
│   └── DashboardFilterContext.tsx          ← Import from here
├── components/
│   └── salon/dashboard/
│       └── FilterOverrideControl.tsx       ← Use this component
└── app/
    └── salon/dashboard/
        └── page.tsx                         ← Example implementation
```

---

## Complete Minimal Example

```tsx
import { DashboardFilterProvider, useDashboardFilter } from '@/contexts/DashboardFilterContext'
import { FilterOverrideControl } from '@/components/salon/dashboard/FilterOverrideControl'

// Wrap your app
export default function App() {
  return (
    <DashboardFilterProvider>
      <Dashboard />
    </DashboardFilterProvider>
  )
}

// Use in components
function Dashboard() {
  const { globalPeriod, setGlobalPeriod } = useDashboardFilter()

  return (
    <div>
      <button onClick={() => setGlobalPeriod('last7Days')}>7 Days</button>
      <button onClick={() => setGlobalPeriod('last30Days')}>30 Days</button>
      <MyChart />
    </div>
  )
}

function MyChart() {
  const { getComponentPeriod } = useDashboardFilter()
  const period = getComponentPeriod('my-chart')

  return (
    <div>
      <FilterOverrideControl
        componentId="my-chart"
        availablePeriods={['last7Days', 'last30Days']}
      />
      <p>Showing: {period}</p>
    </div>
  )
}
```

---

**Need more details?** See `/docs/architecture/DASHBOARD-FILTER-ARCHITECTURE.md`

**Quick Questions?**
- How do I add a filter? → Use `FilterOverrideControl` component
- How do I read the filter? → Use `getComponentPeriod(id)` hook
- How do I show a badge? → Use `FilterStatusBadge` component
- How do I clear overrides? → Use `clearAllOverrides()` or reset button

---

**Status**: ✅ Production Ready | **Version**: 1.0.0
