# HERA Industry Dashboard Examples
## Complete Industry-Specific Dashboard Components

---

## 🎯 Overview

The **HERA Industry Dashboard Examples** provide complete, production-ready dashboard components for different business types. Each dashboard demonstrates industry-specific metrics, workflows, and user interfaces built with HERA DNA components.

### Key Features
- 🏢 **Industry-Specific** - Tailored for restaurant, salon, and healthcare operations
- 📊 **Real-Time Metrics** - Live KPIs and performance indicators
- 📱 **Mobile-Responsive** - Optimized for all device sizes
- 🎨 **HERA DNA Styled** - Consistent with HERA design system
- 🔧 **Fully Customizable** - Easy to adapt for specific business needs
- 📈 **Enterprise-Grade** - Production-ready with comprehensive data tables

---

## 🚀 Quick Start

### Basic Implementation
```typescript
import { RestaurantDashboard, SalonDashboard, HealthcareDashboard } from '@/lib/dna/examples/dashboards'

// Use specific industry dashboard
<RestaurantDashboard organizationId="org-123" />
<SalonDashboard organizationId="org-456" />
<HealthcareDashboard organizationId="org-789" />
```

### Dynamic Loading
```typescript
import { loadIndustryDashboard, getDashboardInfo } from '@/lib/dna/examples/dashboards'

// Load dashboard dynamically
const RestaurantDashboard = await loadIndustryDashboard('restaurant')

// Get dashboard metadata
const info = getDashboardInfo('restaurant')
console.log(info.features) // ['Daily Sales', 'Order Management', ...]
```

---

## 🍽️ Restaurant Dashboard

### Features
- **Daily Sales Tracking** - Revenue, orders, average order value
- **Real-Time Order Management** - Live order status and kitchen display
- **Menu Performance** - Top-selling items and profitability analysis
- **Table Occupancy** - Current capacity and utilization rates
- **Kitchen Status** - Order queue and preparation times
- **Inventory Alerts** - Low stock and out-of-stock notifications

### Key Metrics
```typescript
interface RestaurantMetrics {
  dailySales: number           // Total daily revenue
  dailySalesChange: number     // % change from previous day
  ordersToday: number         // Number of orders completed
  ordersChange: number        // % change in order volume
  averageOrderValue: number   // Average spend per order
  aovChange: number          // % change in AOV
  tableOccupancy: number     // Current table utilization %
  occupancyChange: number    // % change in occupancy
}
```

### Usage Example
```typescript
import { RestaurantDashboard } from '@/lib/dna/examples/dashboards'

<RestaurantDashboard 
  organizationId="mario-restaurant"
  className="restaurant-dashboard"
/>
```

### Sample Data Structure
```typescript
const restaurantData = {
  dailySales: 8750.50,
  ordersToday: 145,
  averageOrderValue: 60.35,
  tableOccupancy: 78,
  recentOrders: [
    {
      id: 'ord-001',
      table: 'Table 7',
      items: 3,
      total: 67.50,
      status: 'preparing',
      server: 'Maria'
    }
  ],
  menuItems: [
    {
      name: 'Margherita Pizza',
      category: 'Pizza',
      price: 18.00,
      orderCount: 23,
      profitMargin: 68.5
    }
  ]
}
```

---

## ✂️ Salon Dashboard

### Features
- **Appointment Management** - Daily schedule and client bookings
- **Staff Utilization** - Stylist availability and performance
- **Service Performance** - Popular services and revenue analysis
- **Client Satisfaction** - Ratings and feedback tracking
- **Inventory Management** - Product stock levels and alerts
- **Revenue Tracking** - Daily earnings and growth trends

### Key Metrics
```typescript
interface SalonMetrics {
  dailyRevenue: number        // Total daily earnings
  revenueChange: number       // % change from previous day
  appointmentsToday: number   // Scheduled appointments
  appointmentsChange: number  // % change in bookings
  clientsServed: number      // Completed services
  clientsChange: number      // % change in client volume
  utilization: number        // Staff utilization rate %
  utilizationChange: number  // % change in utilization
}
```

### Usage Example
```typescript
import { SalonDashboard } from '@/lib/dna/examples/dashboards'

<SalonDashboard 
  organizationId="hair-talkz-salon"
  className="salon-dashboard"
/>
```

### Sample Data Structure
```typescript
const salonData = {
  dailyRevenue: 3250.75,
  appointmentsToday: 28,
  clientsServed: 24,
  utilization: 85,
  appointments: [
    {
      clientName: 'Sarah Johnson',
      service: 'Hair Cut & Color',
      stylist: 'Emma',
      time: '10:30 AM',
      duration: 120,
      price: 185.00,
      status: 'in_progress'
    }
  ],
  stylists: [
    {
      name: 'Emma Rodriguez',
      specialties: ['Hair Color', 'Cutting', 'Styling'],
      appointmentsToday: 8,
      revenue: 1240.00,
      rating: 4.9,
      availability: 'busy'
    }
  ]
}
```

---

## 🏥 Healthcare Dashboard

### Features
- **Patient Management** - Active patients and admission status
- **Appointment Scheduling** - Doctor availability and bookings
- **Medical Staff Status** - Doctor specializations and current status
- **Emergency Alerts** - Critical patient notifications
- **Bed Occupancy** - Hospital capacity and utilization
- **Performance Metrics** - Patient satisfaction and treatment outcomes

### Key Metrics
```typescript
interface HealthcareMetrics {
  dailyRevenue: number          // Total daily revenue
  revenueChange: number         // % change from previous day
  patientsToday: number        // Patients seen today
  patientsChange: number       // % change in patient volume
  appointmentsCompleted: number // Completed appointments
  completedChange: number      // % change in completions
  bedOccupancy: number         // Current bed utilization %
  occupancyChange: number      // % change in occupancy
}
```

### Usage Example
```typescript
import { HealthcareDashboard } from '@/lib/dna/examples/dashboards'

<HealthcareDashboard 
  organizationId="city-general-medical"
  className="healthcare-dashboard"
/>
```

### Sample Data Structure
```typescript
const healthcareData = {
  dailyRevenue: 15750.25,
  patientsToday: 42,
  appointmentsCompleted: 38,
  bedOccupancy: 78,
  patients: [
    {
      name: 'John Smith',
      age: 45,
      condition: 'Chest Pain',
      doctor: 'Dr. Johnson',
      status: 'in_consultation',
      urgency: 'high'
    }
  ],
  doctors: [
    {
      name: 'Dr. Emily Johnson',
      specialization: 'Cardiology',
      patientsToday: 12,
      availability: 'busy',
      rating: 4.9,
      experience: 15
    }
  ]
}
```

---

## 🎨 Design System Integration

### HERA DNA Components Used
All dashboards leverage HERA DNA components for consistency:

```typescript
// Core UI Components
import { StatCardDNA } from '@/lib/dna/components/ui/stat-card-dna'
import { EnterpriseDataTable } from '@/lib/dna/components/organisms/EnterpriseDataTable'

// Standard shadcn/ui Components
import { Card, Badge, Button, Progress, Avatar } from '@/components/ui'

// Motion and Animation
import { motion } from 'framer-motion'
```

### Theming
```css
/* Industry-specific color schemes */
.restaurant-dashboard {
  --primary-color: oklch(0.69 0.12 85);     /* Warm amber */
  --accent-color: oklch(0.57 0.192 250);    /* HERA blue */
}

.salon-dashboard {
  --primary-color: oklch(0.58 0.192 280);   /* Purple */
  --accent-color: oklch(0.64 0.12 160);     /* Emerald */
}

.healthcare-dashboard {
  --primary-color: oklch(0.68 0.12 200);    /* Medical blue */
  --accent-color: oklch(0.64 0.12 160);     /* Green */
}
```

---

## 📱 Mobile Optimization

### Responsive Design
- **Grid Layouts** - Adaptive column counts based on screen size
- **Stat Cards** - Stack vertically on mobile devices
- **Data Tables** - Horizontal scrolling with touch gestures
- **Navigation** - Collapsible menus and touch-friendly buttons

### Mobile-Specific Features
```typescript
// Mobile-optimized metric cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCardDNA {...metrics} />
</div>

// Touch-friendly data tables
<EnterpriseDataTable
  data={data}
  columns={columns}
  pagination={true}
  mobileOptimized={true}
/>
```

---

## 🔧 Customization Guide

### Adding Custom Metrics
```typescript
// Extend the metrics interface
interface CustomRestaurantMetrics extends RestaurantMetrics {
  deliveryOrders: number
  deliveryRevenue: number
  customerSatisfaction: number
}

// Add new stat cards
<StatCardDNA
  title="Delivery Orders"
  value={metrics.deliveryOrders.toString()}
  icon={Truck}
  description="Orders for delivery"
/>
```

### Custom Data Tables
```typescript
// Define custom columns
const customColumns = [
  {
    accessorKey: 'customField',
    header: 'Custom Data',
    cell: ({ row }) => (
      <CustomComponent data={row.original.customField} />
    )
  }
]

// Use in dashboard
<EnterpriseDataTable
  data={customData}
  columns={customColumns}
  searchable={true}
  exportable={true}
/>
```

### Industry-Specific Styling
```typescript
// Create custom dashboard variant
export function RetailDashboard({ organizationId }: DashboardProps) {
  return (
    <div className="retail-dashboard space-y-6">
      {/* Retail-specific metrics */}
      <StatCardDNA
        title="Inventory Turnover"
        value="4.2x"
        icon={Package}
        className="retail-stat-card"
      />
      
      {/* Custom retail components */}
      <InventoryManagementCard />
      <SalesChannelAnalysis />
    </div>
  )
}
```

---

## 🔄 Dynamic Dashboard Loading

### Registry System
```typescript
import { 
  loadIndustryDashboard, 
  getDashboardInfo, 
  getAvailableDashboards 
} from '@/lib/dna/examples/dashboards'

// Get all available dashboards
const dashboards = getAvailableDashboards()
// ['restaurant', 'salon', 'healthcare']

// Load dashboard based on user selection
const Dashboard = await loadIndustryDashboard(selectedIndustry)

// Get dashboard metadata
const info = getDashboardInfo('restaurant')
// {
//   name: 'Restaurant Dashboard',
//   description: 'Complete restaurant operations...',
//   features: ['Daily Sales', 'Order Management', ...]
// }
```

### Conditional Rendering
```typescript
const DynamicDashboard = ({ industry, organizationId }) => {
  const [Dashboard, setDashboard] = useState(null)
  
  useEffect(() => {
    loadIndustryDashboard(industry)
      .then(module => setDashboard(module.default))
      .catch(error => console.error('Failed to load dashboard', error))
  }, [industry])
  
  if (!Dashboard) return <DashboardSkeleton />
  
  return <Dashboard organizationId={organizationId} />
}
```

---

## 📊 Performance Considerations

### Optimization Strategies
1. **Lazy Loading** - Load dashboards on demand
2. **Data Caching** - Cache frequently accessed metrics
3. **Virtual Scrolling** - For large data tables
4. **Image Optimization** - Optimize avatars and icons
5. **Bundle Splitting** - Separate bundles by industry

### Performance Monitoring
```typescript
// Track dashboard performance
const DashboardWithMetrics = ({ industry, ...props }) => {
  useEffect(() => {
    // Track load time
    const startTime = performance.now()
    
    return () => {
      const loadTime = performance.now() - startTime
      analytics.track('dashboard_load_time', {
        industry,
        loadTime,
        timestamp: new Date().toISOString()
      })
    }
  }, [industry])
  
  return <IndustryDashboard {...props} />
}
```

---

## 🎯 Best Practices

1. **Data Consistency**
   ```typescript
   // Use consistent data structures
   interface BaseMetrics {
     dailyRevenue: number
     revenueChange: number
     // Common fields for all industries
   }
   ```

2. **Error Handling**
   ```typescript
   // Implement proper error boundaries
   <ErrorBoundary>
     <RestaurantDashboard organizationId={orgId} />
   </ErrorBoundary>
   ```

3. **Loading States**
   ```typescript
   // Provide loading feedback
   {isLoading ? <DashboardSkeleton /> : <Dashboard />}
   ```

4. **Accessibility**
   ```typescript
   // Use semantic HTML and ARIA labels
   <section aria-label="Restaurant Metrics">
     <StatCardDNA title="Daily Sales" value={sales} />
   </section>
   ```

---

These industry dashboard examples provide comprehensive, production-ready solutions that demonstrate the power and flexibility of the HERA DNA component system across different business verticals.