# Salon Dashboard Implementation Guide

## Overview
The Salon Dashboard provides a comprehensive view of daily operations, KPIs, and quick access to all major features. Built with Sacred Six compliance, full organization isolation, and WCAG AA accessibility.

## Architecture

### Sacred Six Compliance
- **core_organizations**: Multi-tenant isolation
- **core_entities**: Products, customers, staff entities
- **core_dynamic_data**: Custom fields and settings
- **core_relationships**: Status workflows
- **universal_transactions**: Sales, appointments
- **universal_transaction_lines**: Transaction details

### Smart Codes Used
```typescript
// Dashboard operations
'HERA.SALON.DASHBOARD.VIEW.v1'        // Dashboard access
'HERA.SALON.DASHBOARD.KPI.REFRESH.v1' // KPI data refresh
'HERA.SALON.DASHBOARD.ALERT.VIEW.v1'  // Alert visibility

// Component-specific
'HERA.SALON.APPOINTMENT.LIST.TODAY.v1' // Today's appointments
'HERA.SALON.SALES.SUMMARY.DAILY.v1'   // Daily sales summary
'HERA.SALON.INVENTORY.LOW.STOCK.v1'   // Low stock alerts
'HERA.SALON.STAFF.UTILIZATION.v1'     // Staff productivity
```

## Components

### 1. KpiCards (`/src/components/dashboard/KpiCards.tsx`)
Displays 6 key metrics:
- Today's Gross Sales (from universal_transactions)
- Today's Net Revenue (calculated with VAT deduction)
- Appointments Today (from appointments API)
- Average Ticket (gross sales / transaction count)
- WhatsApp Delivery Rate (from WhatsApp metrics)
- Low Stock Items (from inventory API)

### 2. AlertsStrip (`/src/components/dashboard/AlertsStrip.tsx`)
Shows critical business alerts:
- Unposted journal entries
- Low stock warnings
- Pending appointments
- Staff overtime alerts

### 3. RevenueSparkline (`/src/components/dashboard/RevenueSparkline.tsx`)
Visual representation of:
- Last 7 days revenue trend
- Percentage change from yesterday
- Interactive hover tooltips

### 4. UpcomingAppointments (`/src/components/dashboard/UpcomingAppointments.tsx`)
Lists next 8 appointments with:
- Customer name and service
- Time slots
- Status badges (confirmed, in_progress, service_complete)
- Quick action buttons (View Details, POS for completed)

### 5. LowStockList (`/src/components/dashboard/LowStockList.tsx`)
Shows critical inventory items:
- Product name and code
- Current vs reorder quantity
- Criticality badges (Out of Stock, Critical, Low)
- Link to product details

### 6. StaffUtilization (`/src/components/dashboard/StaffUtilization.tsx`)
Staff productivity metrics:
- Utilization percentage bars
- Appointments count
- Hours booked vs available
- Sorted by highest utilization

### 7. QuickActions (`/src/components/dashboard/QuickActions.tsx`)
One-click navigation to:
- View Daily Sales → `/reports/sales/daily`
- New Appointment → `/appointments/new`
- POS Terminal → `/pos`
- WhatsApp Templates → `/whatsapp/templates`
- Staff Schedule → `/staff/schedule`
- Low Stock Alert → `/inventory/alerts`

## API Integration

### Data Fetching Strategy
```typescript
// Parallel data loading with React Query
const queries = [
  useSalesReports({ organizationId, date }),
  useAppointmentStats({ organizationId, date }),
  useWhatsappMetrics({ organizationId }),
  useInventoryApiSimple().listLowStock({ organizationId }),
  useStaffUtilization({ organizationId, date })
]

// Automatic caching and background refetch
// staleTime: 5 minutes for KPIs
// cacheTime: 10 minutes
```

### Error Handling
- Graceful fallbacks for failed API calls
- Loading skeletons during data fetch
- Error boundaries for component isolation
- Retry logic with exponential backoff

## Responsive Design

### Breakpoints
- **Mobile** (< 640px): Single column, stacked cards
- **Tablet** (640-1024px): 2 columns, condensed layout
- **Desktop** (> 1024px): Full grid layout, 3-4 columns

### Grid Layouts
```css
/* KPI Cards: 2-3-6 columns */
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));

/* Main sections: 1-2-3 columns */
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));

/* Quick actions: 2-3-3 columns */
grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
```

## Accessibility Features

### WCAG AA Compliance
- **Color Contrast**: All text meets 4.5:1 ratio
- **Focus Indicators**: Visible focus rings (violet-500)
- **Screen Reader Support**: Proper ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **Reduced Motion**: Respects prefers-reduced-motion

### Semantic HTML
```html
<main role="main" aria-label="Salon Dashboard">
  <section aria-label="Key Performance Indicators">
  <section aria-label="Upcoming Appointments">
  <nav aria-label="Quick Actions">
```

## Performance Optimization

### Loading Strategy
1. **Priority Loading**: KPIs and alerts load first
2. **Progressive Enhancement**: Charts load after critical data
3. **Lazy Loading**: Staff utilization loads on viewport entry
4. **Data Prefetching**: Prefetch appointment details on hover

### Bundle Optimization
- Component code splitting with dynamic imports
- Memoization of expensive calculations
- Virtual scrolling for long lists
- Image optimization with next/image

## Testing

### Unit Tests
- KPI calculations and formatting
- Appointment filtering and sorting
- Currency and percentage formatting
- Date range calculations

### E2E Tests
- Login and dashboard load
- KPI data visibility
- Navigation to all linked pages
- Mobile responsiveness
- Organization switching

## Deployment Checklist

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_HERA_WA_API= # For WhatsApp metrics
DEFAULT_ORGANIZATION_ID= # For development
```

### Production Readiness
- [ ] All API endpoints configured
- [ ] Error tracking enabled (Sentry)
- [ ] Performance monitoring active
- [ ] SSL certificates valid
- [ ] CDN configured for assets
- [ ] Database indexes optimized

## Common Issues & Solutions

### Issue: KPIs showing zero
**Solution**: Check organization_id is passed to all API calls

### Issue: WhatsApp metrics not loading
**Solution**: Verify NEXT_PUBLIC_HERA_WA_API environment variable

### Issue: Appointments not updating
**Solution**: Check React Query cache invalidation after mutations

### Issue: Slow dashboard load
**Solution**: Enable API response caching and pagination

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live KPIs
2. **Customizable Layout**: Drag-and-drop dashboard widgets
3. **Advanced Analytics**: Trend analysis and predictions
4. **Export Functions**: PDF/Excel export for reports
5. **Multi-Branch View**: Consolidated metrics across locations
6. **AI Insights**: Automated business recommendations