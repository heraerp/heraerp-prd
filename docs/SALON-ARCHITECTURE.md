# HERA Salon Architecture Documentation

## Overview

The HERA Salon application is a comprehensive salon management system built on the Sacred Six tables architecture with full multi-tenant support, role-based access control (RBAC), and demo/tenant split functionality.

## Architecture Highlights

### Sacred Six Compliance ✅

All data is stored in the 6 universal tables:
- `core_organizations` - Multi-tenant isolation
- `core_entities` - Customers, services, products, staff
- `core_dynamic_data` - Custom fields and attributes  
- `core_relationships` - Status workflows, hierarchies
- `universal_transactions` - Sales, appointments, payments
- `universal_transaction_lines` - Service/product details

### Demo vs Tenant Split

The application supports two modes:

**Demo Mode**:
- Accessed via `/demo` entry point
- Automatic demo user and organization assignment
- Limited write capabilities enforced by demo policy
- Headers: `x-hera-org-mode: demo`, `x-hera-org-id: <demo-org-id>`

**Tenant Mode**:
- Accessed via subdomain (e.g., `acme.heraerp.com`)
- Full multi-tenant isolation
- Complete feature access
- Headers: `x-hera-org-mode: tenant`, `x-hera-tenant-slug: acme`

### RBAC System (7 Roles)

1. **Owner** - Full access to all features
2. **Admin** - Administrative functions
3. **Manager** - Operational management  
4. **Stylist** - Appointments and schedule only
5. **Cashier** - POS and basic appointments
6. **Customer** - Customer portal access
7. **Accountant** - Financial reports and GL management (NEW)

Each role has:
- Specific landing page
- Allowed navigation paths
- Role-based UI components

### Key Components

#### Dashboard Components
- **KpiCards** - 6 key business metrics
- **AlertsStrip** - Critical business alerts
- **RevenueSparkline** - 7-day revenue visualization
- **UpcomingAppointments** - Today's schedule with POS links
- **LowStockList** - Inventory warnings
- **StaffUtilization** - Employee productivity
- **QuickActions** - Common task shortcuts

#### API Client Enhancement
The API client (`/src/lib/api/client.ts`) now includes:
- Automatic organization context resolution
- Demo/tenant mode detection
- Tenant organization caching
- Headers injection for all requests

#### Guard System
Enhanced auth guard (`/src/lib/auth/guard.tsx`) with:
- Path-based access control
- Role requirements checking
- Automatic redirects to role landing pages
- Loading states and error handling

#### Demo Write Policy
New demo policy service (`/src/lib/services/demo-policy.ts`):
- Allowed entity types in demo
- Create limits per entity type
- Blocked actions list
- Policy enforcement wrapper

## Smart Code Classifications

### Dashboard Components
- `HERA.SALON.DASHBOARD.MAIN.v1` - Main dashboard page
- `HERA.SALON.DASHBOARD.KPI.v1` - KPI cards component
- `HERA.SALON.DASHBOARD.ALERTS.v1` - Alerts strip
- `HERA.SALON.DASHBOARD.REVENUE.v1` - Revenue sparkline
- `HERA.SALON.DASHBOARD.APPOINTMENTS.v1` - Upcoming appointments
- `HERA.SALON.DASHBOARD.INVENTORY.v1` - Low stock list
- `HERA.SALON.DASHBOARD.STAFF.v1` - Staff utilization
- `HERA.SALON.DASHBOARD.ACTIONS.v1` - Quick actions
- `HERA.SALON.DASHBOARD.ACCOUNTANT.v1` - Accountant dashboard

### RBAC Operations
- `HERA.AUTH.RBAC.v1` - Core RBAC configuration
- `HERA.AUTH.RBAC.ROLE.ASSIGN.v1` - Role assignment
- `HERA.AUTH.RBAC.ACCESS.CHECK.v1` - Access verification
- `HERA.AUTH.GUARD.RBAC.v1` - Guard component

### API Operations
- `HERA.API.CLIENT.CORE.v1` - Enhanced API client
- `HERA.DEMO.POLICY.v1` - Demo write policy

## Navigation Structure

### Owner/Manager Navigation
- Dashboard (`/dashboard`)
- Appointments (`/appointments`)
- POS (`/pos/sale`)
- Inventory (`/inventory/products`)
- Reports (`/reports/*`)
- Finance (`/finance/closing`)
- WhatsApp (`/whatsapp/*`)
- Settings (`/settings/*`)

### Accountant Navigation
- Dashboard (`/accountant`)
- Reports (`/reports/*`)
- Period Closing (`/finance/closing`)
- GL Rules (`/finance/rules`)

## Testing Strategy

### Unit Tests
- RBAC system tests (`/src/lib/auth/__tests__/rbac.test.ts`)
- API client tests (`/src/lib/api/__tests__/client.test.ts`)
- Demo policy tests

### E2E Tests
- Dashboard navigation (`/tests/e2e/salon-dashboard.spec.ts`)
- Role-based access scenarios
- Demo mode interactions

## Security Considerations

1. **Organization Isolation**: Every API call filtered by organization_id
2. **Path-Based Access**: Middleware enforces role-allowed paths
3. **Demo Limitations**: Write operations restricted in demo mode
4. **Audit Trail**: All operations logged with smart codes

## Performance Optimizations

1. **React Query**: Data caching and synchronization
2. **Lazy Loading**: Component code splitting
3. **Tenant Cache**: Organization data cached client-side
4. **Optimistic Updates**: UI updates before server confirmation

## Deployment Notes

### Environment Variables
```bash
NEXT_PUBLIC_DEMO_ORG_ID=e3a9ff9e-bb83-43a8-b062-b85e7a2b4258
NEXT_PUBLIC_API_BASE=https://api.heraerp.com
```

### Middleware Headers
The middleware sets organization context headers:
- `x-hera-org-mode`: 'demo' | 'tenant'
- `x-hera-org-id`: Organization UUID (demo mode)
- `x-hera-tenant-slug`: Subdomain (tenant mode)

## Future Enhancements

1. **Real-time Updates**: WebSocket for live dashboard
2. **Advanced Analytics**: ML-powered insights
3. **Mobile App**: React Native implementation
4. **Voice Commands**: AI assistant integration
5. **Automated Scheduling**: Smart appointment optimization