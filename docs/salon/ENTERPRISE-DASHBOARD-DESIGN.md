# HERA Salon Enterprise Dashboard Design Specification

**Version**: 1.0
**Date**: January 2025
**Status**: Design Phase
**Target Users**: Salon Owners, Managers, Financial Controllers

---

## Executive Summary

This document outlines the comprehensive design for an enterprise-grade salon dashboard that provides salon owners with real-time business insights, financial analytics, staff performance metrics, and customer intelligence needed to make data-driven decisions.

### Key Objectives
- Provide real-time visibility into all business operations
- Enable data-driven decision making for salon owners
- Track staff performance and productivity
- Monitor customer satisfaction and retention
- Forecast revenue and identify trends
- Optimize resource allocation and scheduling

### Business Impact
- **30% faster decision making**: Real-time KPIs eliminate guesswork
- **20% revenue increase**: Data-driven service pricing and upselling
- **15% cost reduction**: Staff optimization and inventory management
- **25% better customer retention**: Proactive customer engagement insights

---

## Current State Analysis

### Existing Features ✅
- **Basic KPIs**: Total Revenue, Total Customers, Active Staff
- **Secondary KPIs**: Active Services, Total Products, Inventory Value, Low Stock Items
- **Quick Insights**: VIP customers, service catalog, stock health
- **Luxe Design**: Premium gold/bronze/emerald color scheme
- **Refresh Functionality**: Manual data refresh capability

### Missing Enterprise Features ❌
1. **Appointment Analytics**: No breakdown of appointment statuses, conversion rates, or booking trends
2. **Revenue Trends**: No time-series charts showing revenue patterns
3. **Staff Performance**: No individual staff metrics, utilization rates, or leaderboards
4. **Customer Analytics**: No retention metrics, lifetime value, or acquisition tracking
5. **Service Popularity**: No ranking of most/least popular services
6. **Time Analysis**: No peak hours, busiest days, or seasonal trends
7. **Financial Forecasting**: No predictive analytics or revenue projections
8. **Profit Margins**: No service-level profitability analysis
9. **Cancellation Tracking**: No no-show rates or cancellation patterns
10. **Comparative Analysis**: No period-over-period comparisons (today vs yesterday, etc.)

---

## Enterprise Dashboard Architecture

### Dashboard Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                      PREMIUM HEADER                             │
│  Organization Name | Today's Date | User Info | Refresh | Logout│
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   HERO METRICS (3 columns)                      │
│  Today's Revenue  |  Today's Appointments  |  Active Staff      │
│  + comparison     |  + status breakdown    |  + on duty now     │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────────┬─────────────────────────────────────┐
│  APPOINTMENT ANALYTICS    │   REVENUE TRENDS (Chart)            │
│  - Status breakdown       │   - Last 7 days                     │
│  - Today's schedule       │   - Month-to-date                   │
│  - Conversion rate        │   - Comparison vs last period       │
│  - Peak hours             │   - Forecast for next 7 days        │
└───────────────────────────┴─────────────────────────────────────┘

┌───────────────────────────┬─────────────────────────────────────┐
│  STAFF PERFORMANCE        │   CUSTOMER INSIGHTS                 │
│  - Leaderboard (top 5)    │   - New customers today             │
│  - Utilization rates      │   - Returning customers             │
│  - Revenue per staff      │   - VIP customer activity           │
│  - Service count          │   - Customer satisfaction           │
└───────────────────────────┴─────────────────────────────────────┘

┌───────────────────────────┬─────────────────────────────────────┐
│  SERVICE ANALYTICS        │   FINANCIAL OVERVIEW                │
│  - Most popular services  │   - Profit margin by service        │
│  - Service revenue        │   - Average ticket value            │
│  - Service duration       │   - Payment method breakdown        │
│  - Pricing optimization   │   - Outstanding payments            │
└───────────────────────────┴─────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   INVENTORY & ALERTS                            │
│  Low Stock Alerts | Expiring Products | Reorder Suggestions     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   QUICK ACTIONS                                 │
│  New Appointment | New Customer | POS | Staff Schedule | Reports│
└─────────────────────────────────────────────────────────────────┘
```

---

## Detailed Feature Specifications

### 1. Hero Metrics Section

**Today's Revenue**
- **Primary Metric**: Total revenue for today (AED X,XXX)
- **Comparison**: vs yesterday (+X% or -X%)
- **Breakdown**: Cash vs Card vs Other
- **Target Progress**: Progress bar showing % of daily target
- **Trend Indicator**: Up/down arrow with percentage

**Today's Appointments**
- **Primary Metric**: Total appointments today
- **Status Breakdown**:
  - Completed: X appointments (green)
  - In Progress: X appointments (blue)
  - Pending: X appointments (yellow)
  - Cancelled: X appointments (red)
  - No Show: X appointments (orange)
- **Conversion Rate**: Completed / Total
- **Live Update**: Real-time updates as status changes

**Active Staff**
- **Primary Metric**: Staff on duty now
- **Total Staff**: X / Y active
- **Utilization Rate**: % of staff currently serving
- **Top Performer Today**: Staff member with most revenue
- **Availability**: Staff available for walk-ins

### 2. Appointment Analytics Section

**Visual Components**:
- **Status Pie Chart**: Distribution of appointment statuses
- **Timeline View**: Today's appointments in chronological order
- **Peak Hours Heatmap**: Busiest times of day
- **Booking Source**: Walk-in vs Online vs Phone bookings

**Key Metrics**:
- **Appointment Conversion Rate**: Completed / Total bookings
- **Average Appointment Value**: Revenue / Appointments
- **No-Show Rate**: No shows / Total bookings
- **Cancellation Rate**: Cancellations / Total bookings
- **Average Service Duration**: Actual vs scheduled
- **Booking Lead Time**: Average days between booking and appointment

**Alerts**:
- Unusually high cancellation rate warning
- No-show pattern detection
- Overbooking risk alerts
- Staff availability gaps

### 3. Revenue Trends Section

**Chart Types**:
- **Line Chart**: Daily revenue for last 30 days
- **Bar Chart**: Revenue by service category
- **Area Chart**: Cumulative revenue month-to-date
- **Comparison Chart**: This month vs last month

**Time Periods**:
- Today
- Last 7 days
- Last 30 days
- This month
- Last month
- This year

**Revenue Metrics**:
- **Gross Revenue**: Total sales before discounts
- **Net Revenue**: After discounts and vouchers
- **Average Transaction Value**: Revenue / Transactions
- **Revenue per Staff**: Total revenue / Active staff
- **Revenue per Customer**: Revenue / Unique customers
- **Service Revenue**: Revenue from services only
- **Product Revenue**: Revenue from retail products
- **Growth Rate**: Period-over-period growth

**Forecasting**:
- **Next 7 Days Forecast**: ML-based prediction
- **Month-End Projection**: Estimated month-end revenue
- **Target vs Actual**: Progress towards monthly target
- **Confidence Interval**: Forecast accuracy range

### 4. Staff Performance Section

**Staff Leaderboard**:
- **Rank**: 1, 2, 3, 4, 5
- **Staff Name**: With photo/avatar
- **Total Revenue**: AED generated today/this week
- **Number of Services**: Appointments completed
- **Average Rating**: Customer satisfaction score
- **Utilization Rate**: % of scheduled time used

**Performance Metrics**:
- **Individual Performance Cards**: One per staff member
  - Services completed today
  - Revenue generated
  - Average service time
  - Customer ratings
  - On-time completion rate
- **Comparative Analysis**:
  - Performance vs team average
  - Performance vs last period
  - Trend (improving/declining)
- **Skill Analysis**:
  - Most requested services
  - Service specialization
  - Cross-selling success rate

**Staff Utilization**:
- **Hours Worked**: Today / This week / This month
- **Scheduled vs Actual**: Adherence to schedule
- **Idle Time**: Gaps between appointments
- **Overtime Hours**: Hours beyond normal schedule
- **Productivity Score**: Revenue per hour worked

### 5. Customer Insights Section

**Customer Metrics**:
- **New Customers Today**: First-time visitors
- **Returning Customers**: Repeat visits
- **VIP Customer Activity**: VIP visits today
- **Customer Retention Rate**: % returning within 30 days
- **Customer Lifetime Value**: Average revenue per customer
- **Churn Rate**: Customers not returning

**Customer Segmentation**:
- **VIP Customers**: High-value customers
- **Regular Customers**: 3+ visits per month
- **Occasional Customers**: 1-2 visits per month
- **At-Risk Customers**: No visit in 60+ days
- **Dormant Customers**: No visit in 90+ days

**Customer Satisfaction**:
- **Average Rating**: Overall satisfaction score
- **Net Promoter Score**: Likelihood to recommend
- **Feedback Summary**: Recent reviews and comments
- **Complaint Resolution**: Open vs closed issues

**Customer Engagement**:
- **Birthday Customers**: Customers with birthdays this month
- **Anniversary Customers**: Customers celebrating milestones
- **Referral Sources**: How new customers found the salon
- **Marketing Campaign Performance**: ROI of promotions

### 6. Service Analytics Section

**Service Performance**:
- **Top 5 Services**: Most booked services
- **Service Revenue Ranking**: Highest revenue services
- **Service Profitability**: Profit margin by service
- **Service Duration**: Average time per service
- **Service Popularity Trends**: Rising/declining services

**Service Metrics**:
- **Number of Services**: Total services offered
- **Active Services**: Currently bookable
- **Service Utilization**: % of capacity used
- **Service Pricing**: Average price per service type
- **Upsell Rate**: Additional services per appointment

**Optimization Insights**:
- **Underperforming Services**: Low booking services
- **Pricing Recommendations**: Services to reprice
- **Bundling Opportunities**: Service package suggestions
- **Seasonal Patterns**: Services popular by season
- **Resource Requirements**: Staff/equipment needed per service

### 7. Financial Overview Section

**Financial Metrics**:
- **Gross Profit**: Revenue - Cost of services
- **Profit Margin**: Gross profit / Revenue
- **Average Ticket Value**: Revenue / Transactions
- **Revenue per Customer**: Total revenue / Customers
- **Cash Flow**: Money in vs money out

**Payment Analysis**:
- **Payment Method Breakdown**:
  - Cash: X% (AED XXX)
  - Card: X% (AED XXX)
  - Bank Transfer: X% (AED XXX)
  - Voucher: X% (AED XXX)
- **Outstanding Payments**: Unpaid invoices
- **Payment Trends**: Preferred payment methods

**Cost Analysis**:
- **Cost of Goods Sold**: Product costs
- **Service Costs**: Labor + materials per service
- **Operating Expenses**: Rent, utilities, etc.
- **Profit per Service**: Revenue - costs

**Tax & Compliance**:
- **VAT Collected**: Total tax collected
- **VAT Payable**: Tax due to government
- **Tax Reports**: Ready-to-file tax summaries

### 8. Inventory & Alerts Section

**Stock Alerts**:
- **Low Stock Items**: Products below reorder level
- **Out of Stock**: Products with zero inventory
- **Expiring Products**: Products expiring in 30 days
- **Overstock Items**: Products with excess inventory

**Inventory Metrics**:
- **Total Inventory Value**: Cost of all stock
- **Stock Turnover Rate**: How fast inventory moves
- **Reorder Recommendations**: AI-suggested reorders
- **Supplier Performance**: Delivery times and reliability

**Product Analytics**:
- **Best Selling Products**: Top retail items
- **Product Revenue**: Sales from retail products
- **Product Profitability**: Margin on retail items
- **Product Bundles**: Frequently purchased together

### 9. Quick Actions Section

**Navigation Shortcuts**:
- **New Appointment**: Open appointment booking
- **Walk-In Customer**: Quick POS entry
- **View Schedule**: Today's appointment calendar
- **Staff Management**: Staff roster and scheduling
- **Reports**: Access detailed reports
- **Settings**: System configuration

---

## Data Requirements

### Data Sources

**From `universal_transactions` table**:
- All sales transactions (SALE type)
- Transaction date, time, amount
- Payment method breakdown
- Transaction status (completed, pending, cancelled)
- Customer ID, staff ID references
- Service and product line items

**From `universal_transaction_lines` table**:
- Individual service and product details
- Quantities, unit prices, line amounts
- Service duration and staff assignment
- Cost basis for profit calculations

**From `core_entities` table**:
- **Customers**: All customer records with VIP status
- **Staff**: All staff records with status
- **Services**: Service catalog with pricing
- **Products**: Product inventory with stock levels

**From `core_relationships` table**:
- Customer-to-appointment relationships
- Staff-to-appointment relationships
- Service-to-appointment relationships

**From `core_dynamic_data` table**:
- Customer lifetime value
- Staff performance ratings
- Service popularity scores
- Product reorder levels
- Custom KPI configurations

### Calculated Metrics

**Revenue Calculations**:
```typescript
// Today's revenue
const todayRevenue = transactions
  .filter(t => isToday(t.transaction_date) && t.transaction_status === 'completed')
  .reduce((sum, t) => sum + t.total_amount, 0)

// Revenue growth
const yesterdayRevenue = transactions
  .filter(t => isYesterday(t.transaction_date) && t.transaction_status === 'completed')
  .reduce((sum, t) => sum + t.total_amount, 0)

const revenueGrowth = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
```

**Staff Performance**:
```typescript
// Staff revenue
const staffRevenue = transactions
  .filter(t => t.transaction_status === 'completed')
  .reduce((acc, t) => {
    const staffId = t.metadata?.staff_id
    if (staffId) {
      acc[staffId] = (acc[staffId] || 0) + t.total_amount
    }
    return acc
  }, {})

// Staff utilization
const staffUtilization = appointments
  .filter(a => a.status === 'in_progress' || a.status === 'completed')
  .reduce((acc, a) => {
    const staffId = a.stylist_id
    const duration = differenceInMinutes(a.end_time, a.start_time)
    acc[staffId] = (acc[staffId] || 0) + duration
    return acc
  }, {})
```

**Customer Analytics**:
```typescript
// Customer retention rate
const totalCustomers = customers.length
const returningCustomers = customers.filter(c => {
  const appointments = getCustomerAppointments(c.id)
  return appointments.length > 1
}).length

const retentionRate = (returningCustomers / totalCustomers) * 100

// Customer lifetime value
const customerLTV = customers.map(c => {
  const revenue = transactions
    .filter(t => t.customer_id === c.id && t.transaction_status === 'completed')
    .reduce((sum, t) => sum + t.total_amount, 0)
  return { customerId: c.id, ltv: revenue }
})
```

---

## Technical Implementation

### Enhanced Hook: `useSalonDashboardEnterprise.ts`

```typescript
export interface EnterpriseDashboardKPIs extends SalonDashboardKPIs {
  // Today's metrics
  todayRevenue: number
  todayAppointments: number
  todayRevenueGrowth: number // vs yesterday
  todayAppointmentsGrowth: number

  // Appointment analytics
  appointmentsByStatus: {
    completed: number
    in_progress: number
    pending: number
    cancelled: number
    no_show: number
  }
  appointmentConversionRate: number
  averageAppointmentValue: number
  noShowRate: number
  cancellationRate: number

  // Revenue trends
  last7DaysRevenue: Array<{ date: string; revenue: number }>
  monthToDateRevenue: number
  revenueVsLastMonth: number
  averageTransactionValue: number
  revenueByService: Array<{ service: string; revenue: number }>
  revenueByProduct: Array<{ product: string; revenue: number }>

  // Staff performance
  staffLeaderboard: Array<{
    staffId: string
    staffName: string
    revenue: number
    servicesCompleted: number
    averageRating: number
    utilizationRate: number
  }>
  staffUtilizationRate: number
  totalStaffHours: number

  // Customer insights
  newCustomersToday: number
  returningCustomersToday: number
  customerRetentionRate: number
  customerLifetimeValue: number
  vipCustomerActivity: number
  averageCustomerRating: number

  // Service analytics
  topServices: Array<{ service: string; bookings: number; revenue: number }>
  serviceUtilizationRate: number
  averageServiceDuration: number

  // Financial metrics
  grossProfit: number
  profitMargin: number
  outstandingPayments: number
  paymentMethodBreakdown: {
    cash: number
    card: number
    bank_transfer: number
    voucher: number
  }

  // Forecasting
  next7DaysForecast: Array<{ date: string; predictedRevenue: number }>
  monthEndProjection: number
  targetProgress: number
}
```

### Component Structure

```
src/app/salon/dashboard/
├── page.tsx                              # Main dashboard page
├── components/
│   ├── HeroMetrics.tsx                  # Today's key metrics
│   ├── AppointmentAnalytics.tsx         # Appointment breakdown
│   ├── RevenueTrends.tsx                # Revenue charts
│   ├── StaffPerformance.tsx             # Staff leaderboard
│   ├── CustomerInsights.tsx             # Customer analytics
│   ├── ServiceAnalytics.tsx             # Service performance
│   ├── FinancialOverview.tsx            # Financial metrics
│   ├── InventoryAlerts.tsx              # Stock alerts
│   └── QuickActions.tsx                 # Action shortcuts
└── charts/
    ├── LineChart.tsx                    # Recharts line chart
    ├── BarChart.tsx                     # Recharts bar chart
    ├── PieChart.tsx                     # Recharts pie chart
    └── HeatMap.tsx                      # Peak hours heatmap
```

### Chart Library: Recharts

```bash
npm install recharts
```

**Why Recharts?**
- Composable chart components built on React
- Responsive and mobile-friendly
- Supports all chart types needed (line, bar, pie, area)
- Excellent TypeScript support
- Active maintenance and community
- Great documentation

### Performance Optimization

**Data Caching**:
- Use React Query for automatic caching
- Cache duration: 5 minutes for dashboard data
- Background refetch every 30 seconds for critical metrics
- Optimistic updates for real-time feel

**Lazy Loading**:
- Load chart components only when visible
- Use React.lazy() for non-critical sections
- Implement virtual scrolling for large lists

**Database Optimization**:
- Create materialized views for complex aggregations
- Use database indexes on frequently queried fields
- Implement server-side pagination for large datasets
- Cache expensive calculations in Redis

---

## Design System

### Color Palette (Luxe Theme)

```typescript
const LUXE_COLORS = {
  // Base colors
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  charcoalLight: '#232323',
  charcoalDark: '#0F0F0F',

  // Accent colors
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',

  // Status colors
  emerald: '#0F6F5C',     // Success, positive growth
  ruby: '#DC2626',        // Danger, negative growth
  sapphire: '#2563EB',    // Info, neutral
  amber: '#F59E0B',       // Warning, attention needed

  // Chart colors
  chartColors: [
    '#D4AF37', // Gold
    '#0F6F5C', // Emerald
    '#8C7853', // Bronze
    '#2563EB', // Blue
    '#F59E0B', // Amber
    '#DC2626', // Ruby
  ]
}
```

### Typography

```typescript
const TYPOGRAPHY = {
  // Headings
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-2xl font-semibold',
  h3: 'text-xl font-semibold',
  h4: 'text-lg font-medium',

  // Body
  body: 'text-base',
  small: 'text-sm',
  xs: 'text-xs',

  // Special
  metric: 'text-3xl font-bold',
  label: 'text-sm font-medium uppercase tracking-wide'
}
```

### Animations

```typescript
const ANIMATIONS = {
  // Hover effects
  cardHover: 'transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl',

  // Loading states
  shimmer: 'animate-shimmer',
  pulse: 'animate-pulse',
  spin: 'animate-spin',

  // Fade in
  fadeIn: 'animate-in fade-in duration-500',
  slideUp: 'animate-in slide-in-from-bottom duration-500'
}
```

---

## User Personas

### Persona 1: Sarah - Salon Owner
**Age**: 35
**Tech Savviness**: Medium
**Primary Goals**:
- Monitor overall business health
- Track revenue trends
- Ensure profitability
- Make strategic decisions

**Dashboard Priorities**:
1. Revenue metrics and trends
2. Profit margins
3. Staff performance
4. Customer retention
5. Financial forecasting

**Pain Points**:
- Too much data, not enough insights
- Needs quick overview without drilling down
- Wants alerts for critical issues
- Limited time to analyze reports

**Dashboard Solutions**:
- Hero metrics showing today's performance
- Clear trend indicators (up/down arrows)
- Automated alerts for issues
- Executive summary view

### Persona 2: Ahmed - Salon Manager
**Age**: 28
**Tech Savviness**: High
**Primary Goals**:
- Optimize staff scheduling
- Manage appointments
- Improve customer satisfaction
- Increase service quality

**Dashboard Priorities**:
1. Staff performance and utilization
2. Appointment analytics
3. Customer feedback
4. Service quality metrics
5. Operational efficiency

**Pain Points**:
- Staff scheduling conflicts
- Uneven workload distribution
- Customer complaints not visible
- Can't identify training needs

**Dashboard Solutions**:
- Staff utilization heatmap
- Real-time appointment tracking
- Customer satisfaction scores
- Performance comparison charts

### Persona 3: Fatima - Financial Controller
**Age**: 42
**Tech Savviness**: High
**Primary Goals**:
- Ensure accurate financial reporting
- Monitor cash flow
- Manage tax compliance
- Control costs

**Dashboard Priorities**:
1. Financial metrics (revenue, profit, costs)
2. Payment method breakdown
3. Outstanding payments
4. Tax reports
5. Cost analysis

**Pain Points**:
- Manual financial calculations
- Tax report preparation time-consuming
- No real-time financial visibility
- Cost allocation unclear

**Dashboard Solutions**:
- Automated financial calculations
- Real-time profit margin tracking
- Tax summary section
- Cost breakdown by service

---

## Success Metrics

### Dashboard Adoption Metrics
- **Daily Active Users**: 80%+ of salon staff use dashboard daily
- **Time on Dashboard**: Average 5-10 minutes per session
- **Feature Usage**: 70%+ of features used weekly
- **Mobile Usage**: 40%+ of access from mobile devices

### Business Impact Metrics
- **Revenue Growth**: 15-20% increase in 6 months
- **Customer Retention**: 10% improvement
- **Staff Productivity**: 25% increase in services per staff
- **Decision Speed**: 50% faster business decisions
- **Cost Savings**: 10-15% reduction in operational costs

### User Satisfaction Metrics
- **Net Promoter Score (NPS)**: 50+
- **User Satisfaction**: 4.5/5 stars
- **Feature Requests**: 5+ new feature requests per month
- **Support Tickets**: <5% of users need help

---

## Current Implementation Status

### ✅ Completed (Phase 0: Foundation)
**Date Completed**: January 2025

| Component | Status | File Location |
|-----------|--------|---------------|
| **Enterprise Design Specification** | ✅ Complete | `/docs/salon/ENTERPRISE-DASHBOARD-DESIGN.md` |
| **Enhanced Dashboard Hook** | ✅ Complete | `/src/hooks/useSalonDashboard.ts` |
| **Network International Payment Integration Plan** | ✅ Complete | `/docs/HERA-NETWORK-INTERNATIONAL-INTEGRATION.md` |
| **Base Dashboard UI** | ✅ Complete | `/src/app/salon/dashboard/page.tsx` |

**What's Working Now:**
- All 25+ enterprise metrics are being calculated automatically
- Dashboard hook returns comprehensive KPIs including:
  - Today's metrics (revenue, appointments, staff)
  - Appointment analytics (conversion rates, status breakdown)
  - Revenue trends (7-day, 30-day, month-to-date)
  - Staff performance (leaderboard, utilization)
  - Customer insights (retention, lifetime value)
  - Service analytics (top/least popular)
  - Financial metrics (profit, payment methods)
- Existing UI shows: Total Revenue, Customers, Staff, Services, Products, Inventory
- Luxury design system implemented with gold/bronze/emerald theme

**What's Missing:**
- Visual components for new analytics (charts, graphs)
- Hero metrics section UI
- Staff leaderboard UI component
- Revenue trend charts (line/bar charts)
- Appointment status visualization
- Customer insights section UI
- Financial breakdown section UI

---

## Implementation Roadmap

### Phase 1: Chart Library Setup (Week 1)
**Goal**: Prepare charting infrastructure for data visualization

#### Tasks:
- [ ] **1.1**: Install Recharts library
  ```bash
  npm install recharts
  npm install --save-dev @types/recharts
  ```
- [ ] **1.2**: Create reusable chart components in `/src/components/salon/dashboard/charts/`
  - `LineChart.tsx` - For revenue trends
  - `BarChart.tsx` - For staff performance
  - `PieChart.tsx` - For appointment status
  - `DonutChart.tsx` - For payment methods
  - `HeatMap.tsx` - For peak hours (future)
- [ ] **1.3**: Create chart theme configuration matching luxe design
  ```typescript
  // /src/components/salon/dashboard/charts/chartTheme.ts
  export const CHART_THEME = {
    colors: [LUXE_COLORS.gold, LUXE_COLORS.emerald, LUXE_COLORS.bronze, ...],
    grid: { stroke: LUXE_COLORS.bronze + '20' },
    tooltip: {
      backgroundColor: LUXE_COLORS.charcoal,
      border: `1px solid ${LUXE_COLORS.gold}20`
    }
  }
  ```
- [ ] **1.4**: Test chart responsiveness on mobile/tablet/desktop

**Deliverables**:
- Chart library installed and configured
- 4-5 reusable chart components
- Chart theme matching salon design
- Responsive chart behavior verified

**Estimated Time**: 3-5 days

---

### Phase 2: Hero Metrics Section (Week 2)
**Goal**: Create prominent "today's performance" section at top of dashboard

#### Tasks:
- [ ] **2.1**: Create `HeroMetrics.tsx` component in `/src/components/salon/dashboard/`
- [ ] **2.2**: Implement Today's Revenue card
  - Primary: `kpis.todayRevenue` formatted as currency
  - Comparison: `kpis.todayRevenueGrowth` with up/down arrow
  - Breakdown: Cash vs Card vs Other (from `kpis.paymentMethodBreakdown`)
  - Visual: Mini sparkline showing last 7 days
- [ ] **2.3**: Implement Today's Appointments card
  - Primary: `kpis.todayAppointments` count
  - Comparison: `kpis.todayAppointmentsGrowth` percentage
  - Status badges:
    - Completed: `kpis.appointmentsByStatus.completed` (green)
    - In Progress: `kpis.appointmentsByStatus.in_progress` (blue)
    - Pending: `kpis.appointmentsByStatus.pending` (yellow)
    - Cancelled: `kpis.appointmentsByStatus.cancelled` (red)
  - Conversion rate: `kpis.appointmentConversionRate`
- [ ] **2.4**: Implement Active Staff card
  - Primary: `kpis.todayOnDutyStaff` / `kpis.activeStaff`
  - Utilization: `kpis.averageStaffUtilization` percentage
  - Top performer: First staff from `kpis.staffLeaderboard[0]`
  - Visual: Staff utilization gauge/progress bar
- [ ] **2.5**: Add animations and hover effects matching existing design
- [ ] **2.6**: Make cards clickable to drill down into details

**Deliverables**:
- 3 hero metric cards prominently displayed
- Real-time growth indicators
- Visual progress bars and badges
- Drill-down navigation ready

**Estimated Time**: 5-7 days

---

### Phase 3: Appointment Analytics Section (Week 3)
**Goal**: Visualize appointment pipeline and conversion metrics

#### Tasks:
- [ ] **3.1**: Create `AppointmentAnalytics.tsx` component
- [ ] **3.2**: Implement status distribution pie chart
  - Data: `kpis.appointmentsByStatus`
  - Colors: Green (completed), Blue (in_progress), Yellow (pending), Red (cancelled), Orange (no_show)
  - Show percentages on hover
  - Click to filter appointments by status
- [ ] **3.3**: Add key metrics cards
  - Conversion Rate: `kpis.appointmentConversionRate` with gauge
  - Average Value: `kpis.averageAppointmentValue` formatted as currency
  - No-Show Rate: `kpis.noShowRate` with warning if >10%
  - Cancellation Rate: `kpis.cancellationRate` with trend indicator
- [ ] **3.4**: Create today's appointment timeline (optional)
  - Show appointments chronologically
  - Color-code by status
  - Show time gaps (availability)
- [ ] **3.5**: Add alerts for anomalies
  - High cancellation rate warning
  - Unusual no-show pattern
  - Overbooking risk alert

**Deliverables**:
- Appointment status pie chart
- 4 key conversion metrics
- Timeline view (optional)
- Automated alert system

**Estimated Time**: 5-7 days

---

### Phase 4: Revenue Trends Section (Week 4)
**Goal**: Show revenue patterns and growth over time

#### Tasks:
- [ ] **4.1**: Create `RevenueTrends.tsx` component
- [ ] **4.2**: Implement 7-day revenue line chart
  - Data: `kpis.last7DaysRevenue[]`
  - X-axis: Date labels
  - Y-axis: Revenue formatted as currency
  - Show data points on hover
  - Gradient fill under line
- [ ] **4.3**: Implement 30-day revenue line chart (tabbed view)
  - Data: `kpis.last30DaysRevenue[]`
  - Toggle between 7-day and 30-day views
  - Add trend line overlay
- [ ] **4.4**: Add period selector
  - Buttons: Today | Week | Month | Year
  - Update chart based on selection
- [ ] **4.5**: Show key revenue metrics
  - Month-to-Date: `kpis.monthToDateRevenue`
  - Average Transaction: `kpis.averageTransactionValue`
  - Revenue vs Last Month: `kpis.revenueVsLastMonth` (when implemented)
- [ ] **4.6**: Add revenue forecast line (ML-based, future enhancement)

**Deliverables**:
- Dual-view revenue chart (7-day/30-day)
- Period selector interface
- Key revenue metrics summary
- Foundation for forecasting

**Estimated Time**: 5-7 days

---

### Phase 5: Staff Performance Section (Week 5)
**Goal**: Show staff productivity and ranking

#### Tasks:
- [ ] **5.1**: Create `StaffPerformance.tsx` component
- [ ] **5.2**: Implement staff leaderboard table
  - Data: `kpis.staffLeaderboard[]` (top 5)
  - Columns:
    - Rank: 1, 2, 3, 4, 5 with medal icons
    - Staff Name: With avatar/photo
    - Revenue: `staffMember.revenue` formatted as currency
    - Services: `staffMember.servicesCompleted` count
    - Rating: `staffMember.averageRating` stars
    - Utilization: `staffMember.utilizationRate` progress bar
  - Highlight top performer with gold styling
- [ ] **5.3**: Add staff comparison bar chart
  - X-axis: Staff names
  - Y-axis: Revenue generated
  - Color bars by utilization rate
- [ ] **5.4**: Show team metrics
  - Average Utilization: `kpis.averageStaffUtilization`
  - Total Staff Hours: `kpis.totalStaffHoursToday`
  - On Duty: `kpis.todayOnDutyStaff`
- [ ] **5.5**: Add staff filter/search
  - View all staff (not just top 5)
  - Filter by date range
  - Sort by different metrics

**Deliverables**:
- Top 5 staff leaderboard
- Staff comparison chart
- Team performance metrics
- Staff filtering capability

**Estimated Time**: 5-7 days

---

### Phase 6: Customer Insights Section (Week 6)
**Goal**: Track customer acquisition, retention, and value

#### Tasks:
- [ ] **6.1**: Create `CustomerInsights.tsx` component
- [ ] **6.2**: Implement customer acquisition metrics
  - New Today: `kpis.newCustomersToday` with trend
  - Returning Today: `kpis.returningCustomersToday` with percentage
  - Total Customers: `kpis.totalCustomers`
  - VIP Count: `kpis.vipCustomers`
- [ ] **6.3**: Add retention metrics
  - Retention Rate: `kpis.customerRetentionRate` with gauge
  - VIP Activity: `kpis.vipCustomerActivityToday` count
  - Customer LTV: `kpis.averageCustomerLifetimeValue` formatted as currency
- [ ] **6.4**: Create customer segmentation donut chart
  - Segments: VIP, Regular, Occasional, New
  - Show count and revenue per segment
- [ ] **6.5**: Add customer engagement indicators
  - Birthday customers this month
  - Customers at risk (no visit in 60+ days)
  - High-value customers
- [ ] **6.6**: Implement customer quick actions
  - Send birthday message
  - Re-engage dormant customers
  - Upgrade to VIP campaign

**Deliverables**:
- Customer acquisition metrics
- Retention rate visualization
- Customer segmentation chart
- Engagement action buttons

**Estimated Time**: 5-7 days

---

### Phase 7: Service Analytics Section (Week 7)
**Goal**: Optimize service offerings and pricing

#### Tasks:
- [ ] **7.1**: Create `ServiceAnalytics.tsx` component
- [ ] **7.2**: Implement top services ranking
  - Data: `kpis.topServices[]` (top 5)
  - Columns:
    - Service Name
    - Bookings: `service.bookings` count
    - Revenue: `service.revenue` formatted
    - Avg Price: `service.averagePrice` formatted
    - Popularity Rank: Visual stars/bars
  - Highlight most popular with gold styling
- [ ] **7.3**: Show underperforming services
  - Data: `kpis.leastPopularServices[]` (bottom 5)
  - Warning indicators for services with <5 bookings
  - Suggest price adjustments or removal
- [ ] **7.4**: Add service revenue bar chart
  - Compare revenue across all services
  - Color by profitability
- [ ] **7.5**: Show service optimization metrics
  - Average Duration: `kpis.averageServiceDuration`
  - Service Utilization: Bookings / Available slots
  - Pricing Suggestions: Based on demand
- [ ] **7.6**: Add service quick actions
  - Adjust pricing
  - Mark as featured
  - Hide from booking
  - Bundle suggestions

**Deliverables**:
- Top 5 services ranking
- Underperforming services alert
- Service revenue chart
- Optimization recommendations
- Service management actions

**Estimated Time**: 5-7 days

---

### Phase 8: Financial Overview Section (Week 8)
**Goal**: Comprehensive financial health dashboard

#### Tasks:
- [ ] **8.1**: Create `FinancialOverview.tsx` component
- [ ] **8.2**: Implement profit metrics
  - Gross Profit: `kpis.grossProfit` formatted
  - Profit Margin: `kpis.profitMargin` percentage with gauge
  - Revenue vs Target: Progress bar
- [ ] **8.3**: Add payment method breakdown donut chart
  - Data: `kpis.paymentMethodBreakdown`
  - Segments: Cash, Card, Bank Transfer, Voucher
  - Show amount and percentage for each
  - Click to see transaction details
- [ ] **8.4**: Show financial trends
  - Weekly revenue comparison
  - Monthly revenue comparison
  - Quarterly projections
- [ ] **8.5**: Add cost analysis (future)
  - Cost of Goods Sold
  - Operating Expenses
  - Service Costs
  - Break-even point
- [ ] **8.6**: Create financial alerts
  - Low profit margin warning
  - Unusual expense patterns
  - Cash flow issues

**Deliverables**:
- Profit margin visualization
- Payment method breakdown
- Financial trend charts
- Cost analysis (basic)
- Automated financial alerts

**Estimated Time**: 5-7 days

---

### Phase 9: Inventory & Alerts Section (Week 9)
**Goal**: Proactive stock management

#### Tasks:
- [ ] **9.1**: Create `InventoryAlerts.tsx` component
- [ ] **9.2**: Show critical stock alerts
  - Low Stock: `kpis.lowStockProducts` count
  - Out of Stock: Items with zero inventory
  - Expiring Products: Items expiring in 30 days
- [ ] **9.3**: Add inventory value metrics
  - Total Value: `kpis.inventoryValue` formatted
  - Fast-moving items
  - Slow-moving items
- [ ] **9.4**: Implement reorder recommendations
  - AI-suggested reorder quantities
  - Reorder points by product
  - Supplier information
- [ ] **9.5**: Create product performance table
  - Top selling products
  - Product revenue contribution
  - Stock turnover rate
- [ ] **9.6**: Add inventory quick actions
  - Create purchase order
  - Adjust stock levels
  - Mark as discontinued

**Deliverables**:
- Stock alert dashboard
- Inventory value metrics
- Reorder recommendations
- Product performance table
- Quick inventory actions

**Estimated Time**: 3-5 days

---

### Phase 10: Quick Actions Bar (Week 10)
**Goal**: Fast navigation to common tasks

#### Tasks:
- [ ] **10.1**: Create `QuickActions.tsx` component
- [ ] **10.2**: Add action buttons
  - New Appointment → Open booking modal
  - Walk-In Customer → Quick POS entry
  - View Schedule → Today's calendar
  - Staff Management → Staff roster
  - Reports → Detailed reports page
  - Settings → System configuration
- [ ] **10.3**: Implement keyboard shortcuts
  - `Cmd/Ctrl + N` - New appointment
  - `Cmd/Ctrl + P` - Open POS
  - `Cmd/Ctrl + S` - View schedule
- [ ] **10.4**: Add recent actions history
  - Show last 5 actions taken
  - Quick undo capability
- [ ] **10.5**: Create action search
  - Type to find action
  - Smart suggestions

**Deliverables**:
- Quick action button bar
- Keyboard shortcut support
- Action history
- Action search functionality

**Estimated Time**: 3-5 days

---

### Phase 11: Testing & Optimization (Week 11-12)
**Goal**: Ensure quality and performance

#### Tasks:
- [ ] **11.1**: Performance testing
  - Load test with 1000+ transactions
  - Measure dashboard load time (<3 seconds)
  - Optimize slow queries
  - Implement data caching (Redis)
- [ ] **11.2**: Mobile responsiveness testing
  - Test on iOS Safari, Android Chrome
  - Verify charts render correctly
  - Test touch interactions
  - Optimize for small screens
- [ ] **11.3**: Cross-browser testing
  - Chrome, Firefox, Safari, Edge
  - Fix browser-specific issues
- [ ] **11.4**: User acceptance testing
  - Test with actual salon staff
  - Gather usability feedback
  - Identify confusing elements
  - Document bugs and improvements
- [ ] **11.5**: Accessibility testing
  - Screen reader compatibility
  - Keyboard navigation
  - Color contrast ratios
  - ARIA labels
- [ ] **11.6**: Security testing
  - Permission enforcement
  - Data isolation between organizations
  - SQL injection protection
  - XSS vulnerability scanning

**Deliverables**:
- Performance benchmarks met
- Mobile-responsive dashboard
- Cross-browser compatibility
- UAT feedback incorporated
- Accessibility compliant
- Security audit passed

**Estimated Time**: 10-14 days

---

### Phase 12: Documentation & Training (Week 13)
**Goal**: Prepare for launch and user adoption

#### Tasks:
- [ ] **12.1**: Create user documentation
  - Dashboard overview guide
  - Metric definitions document
  - How-to guides for each section
  - Troubleshooting guide
- [ ] **12.2**: Create video tutorials
  - Dashboard walkthrough (5 min)
  - Understanding metrics (10 min)
  - Advanced features (15 min)
- [ ] **12.3**: Prepare training materials
  - Staff training presentation
  - Quick reference cards
  - FAQ document
- [ ] **12.4**: Document technical details
  - API endpoints used
  - Data calculation methods
  - Component architecture
  - Deployment process
- [ ] **12.5**: Create support resources
  - Support ticket system
  - Known issues list
  - Release notes

**Deliverables**:
- Complete user documentation
- Video tutorial series
- Training materials
- Technical documentation
- Support infrastructure

**Estimated Time**: 5-7 days

---

### Phase 13: Deployment (Week 14)
**Goal**: Launch to production

#### Tasks:
- [ ] **13.1**: Pre-deployment checklist
  - All tests passing
  - Documentation complete
  - Training completed
  - Backup plan ready
- [ ] **13.2**: Staged rollout
  - Deploy to staging environment
  - Beta test with 2-3 salons
  - Monitor for issues
  - Fix critical bugs
- [ ] **13.3**: Production deployment
  - Deploy during off-peak hours
  - Monitor system metrics
  - Watch for errors
  - Have rollback ready
- [ ] **13.4**: Post-deployment monitoring
  - Monitor performance (24 hours)
  - Track user adoption
  - Gather initial feedback
  - Address urgent issues
- [ ] **13.5**: Success measurement
  - Track dashboard usage metrics
  - Measure user satisfaction
  - Monitor business impact
  - Document lessons learned

**Deliverables**:
- Successful production deployment
- Zero critical issues
- Positive user feedback
  - Monitoring dashboard active
- Success metrics tracked

**Estimated Time**: 3-5 days

---

## Total Implementation Timeline

**Total Duration**: 14 weeks (3.5 months)

| Phase | Duration | Dependencies | Priority |
|-------|----------|--------------|----------|
| Phase 1: Chart Library | 1 week | None | Critical |
| Phase 2: Hero Metrics | 1 week | Phase 1 | Critical |
| Phase 3: Appointment Analytics | 1 week | Phase 1 | High |
| Phase 4: Revenue Trends | 1 week | Phase 1 | High |
| Phase 5: Staff Performance | 1 week | Phase 1 | High |
| Phase 6: Customer Insights | 1 week | Phase 1 | Medium |
| Phase 7: Service Analytics | 1 week | Phase 1 | Medium |
| Phase 8: Financial Overview | 1 week | Phase 1 | Medium |
| Phase 9: Inventory & Alerts | 1 week | None | Low |
| Phase 10: Quick Actions | 1 week | None | Low |
| Phase 11: Testing & Optimization | 2 weeks | Phases 1-10 | Critical |
| Phase 12: Documentation | 1 week | Phase 11 | Critical |
| Phase 13: Deployment | 1 week | Phases 11-12 | Critical |

**Fast Track Option**: Phases 1-5 (5 weeks) delivers 80% of value

**Minimum Viable Product**: Phases 1-4 (4 weeks) for core analytics

---

## Next Steps

### Immediate Actions (Week 0)
**Status**: READY TO BEGIN
**Owner**: Development Team

1. **Review & Approve**:
   - [ ] Review this complete specification document
   - [ ] Approve implementation phases 1-4 (MVP - 4 weeks)
   - [ ] Confirm resource allocation (1 developer, 4 weeks)
   - [ ] Set start date for Phase 1

2. **Prepare Development Environment**:
   - [ ] Ensure Node.js and npm are up to date
   - [ ] Verify project builds successfully
   - [ ] Review existing dashboard code at `/src/app/salon/dashboard/page.tsx`
   - [ ] Familiarize with enhanced hook at `/src/hooks/useSalonDashboard.ts`

3. **Set Up Project Tracking**:
   - [ ] Create project board (Trello/Jira/GitHub Projects)
   - [ ] Add all Phase 1-4 tasks as tickets
   - [ ] Assign priorities and deadlines
   - [ ] Schedule daily standup meetings

### Fast Track Implementation (4 Weeks MVP)
**Recommended Path**: Focus on Phases 1-4 for maximum impact

**Week 1**: Phase 1 - Chart Library Setup
**Week 2**: Phase 2 - Hero Metrics Section
**Week 3**: Phase 3 - Appointment Analytics
**Week 4**: Phase 4 - Revenue Trends

**After 4 Weeks**: You'll have a powerful dashboard with:
- ✅ Today's key metrics (revenue, appointments, staff)
- ✅ Appointment conversion tracking
- ✅ 7-day & 30-day revenue trends
- ✅ Beautiful visualizations
- ✅ 80% of business value delivered

### Long-Term Roadmap (14 Weeks Full Implementation)
**For Complete Enterprise Dashboard**:

Follow all 13 phases outlined above for:
- Staff performance leaderboard
- Customer retention analytics
- Service optimization insights
- Financial health dashboard
- Inventory management
- Complete testing & deployment

### Decision Points
**You Need to Decide**:

1. **Timeline**: Fast Track (4 weeks MVP) or Full Implementation (14 weeks)?
2. **Resources**: Solo developer or team?
3. **Priorities**: Which phases are most important for your business?
4. **Budget**: Any external resources needed (designers, testers)?

### Key Contacts & References
**For Questions or Support**:
- **Design Specification**: This document (`/docs/salon/ENTERPRISE-DASHBOARD-DESIGN.md`)
- **Technical Implementation**: `/src/hooks/useSalonDashboard.ts`
- **Payment Integration Plan**: `/docs/HERA-NETWORK-INTERNATIONAL-INTEGRATION.md`
- **Current Dashboard UI**: `/src/app/salon/dashboard/page.tsx`

### Success Criteria
**You'll Know Implementation is Successful When**:
- Dashboard loads in <3 seconds
- All KPIs update in real-time
- Charts are responsive on mobile
- Salon staff use it daily
- Business decisions improve measurably

---

## Appendix

### A. Sample Dashboard Queries

```typescript
// Get today's revenue
const getTodayRevenue = async (organizationId: string) => {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const transactions = await universalApi.read({
    table: 'universal_transactions',
    filters: [
      { field: 'organization_id', operator: 'eq', value: organizationId },
      { field: 'transaction_type', operator: 'eq', value: 'SALE' },
      { field: 'transaction_status', operator: 'eq', value: 'completed' },
      { field: 'transaction_date', operator: 'gte', value: startOfToday.toISOString() }
    ]
  })

  return transactions.data.reduce((sum, t) => sum + t.total_amount, 0)
}

// Get staff leaderboard
const getStaffLeaderboard = async (organizationId: string, period: 'today' | 'week' | 'month') => {
  const startDate = getStartDate(period)

  const transactions = await universalApi.read({
    table: 'universal_transactions',
    filters: [
      { field: 'organization_id', operator: 'eq', value: organizationId },
      { field: 'transaction_type', operator: 'eq', value: 'SALE' },
      { field: 'transaction_status', operator: 'eq', value: 'completed' },
      { field: 'transaction_date', operator: 'gte', value: startDate.toISOString() }
    ]
  })

  // Aggregate by staff
  const staffStats = transactions.data.reduce((acc, t) => {
    const staffId = t.metadata?.staff_id
    if (!staffId) return acc

    if (!acc[staffId]) {
      acc[staffId] = {
        staffId,
        revenue: 0,
        servicesCompleted: 0,
        transactions: []
      }
    }

    acc[staffId].revenue += t.total_amount
    acc[staffId].servicesCompleted += 1
    acc[staffId].transactions.push(t)

    return acc
  }, {})

  // Sort by revenue
  return Object.values(staffStats)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5) // Top 5
}
```

### B. Chart Configuration Examples

```typescript
// Line chart configuration
const revenueLineChart = {
  data: last7DaysRevenue,
  xAxis: { dataKey: 'date' },
  yAxis: { tickFormatter: (value) => formatCurrency(value) },
  lines: [
    { dataKey: 'revenue', stroke: LUXE_COLORS.gold, strokeWidth: 3 }
  ],
  tooltip: {
    formatter: (value) => formatCurrency(value),
    contentStyle: {
      backgroundColor: LUXE_COLORS.charcoal,
      border: `1px solid ${LUXE_COLORS.gold}20`,
      color: LUXE_COLORS.champagne
    }
  }
}

// Pie chart configuration
const appointmentStatusPie = {
  data: [
    { name: 'Completed', value: 45, fill: LUXE_COLORS.emerald },
    { name: 'In Progress', value: 12, fill: LUXE_COLORS.sapphire },
    { name: 'Pending', value: 23, fill: LUXE_COLORS.amber },
    { name: 'Cancelled', value: 3, fill: LUXE_COLORS.ruby }
  ],
  innerRadius: '60%',
  outerRadius: '80%',
  labelLine: false
}
```

---

**End of Document**
