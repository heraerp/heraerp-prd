# HERA Salon Functionality Analysis for Playwright Testing

## Overview
HERA includes a comprehensive salon management system with both single-tenant (`/salon/*`) and multi-tenant (`/org/salon/*`) implementations. The system uses the universal 6-table architecture with salon-specific features.

## URL Structures
### Single-Tenant URLs (Development)
- `/salon` - Main dashboard
- `/salon/appointments` - Appointment management
- `/salon/clients` - Client management
- `/salon/services` - Service catalog
- `/salon/staff` - Staff management
- `/salon/inventory` - Product inventory
- `/salon/pos` - Point of sale
- `/salon/payments` - Payment processing
- `/salon/loyalty` - Loyalty program
- `/salon/marketing` - Marketing campaigns
- `/salon/reports` - Business reports
- `/salon/settings` - Configuration

### Multi-Tenant URLs (Production)
- `/org/salon` - Organization salon dashboard
- `/org/salon/appointments` - Multi-tenant appointments
- `/org/salon/clients` - Multi-tenant clients
- `/org/salon/staff` - Multi-tenant staff
- `/org/salon/inventory` - Multi-tenant inventory
- `/org/salon/pos` - Multi-tenant POS

### Subdomain URLs (Production)
- `{subdomain}.heraerp.com/salon/*` - Subdomain-based access
- `/~{subdomain}/salon/*` - Local development subdomain simulation

## Core Features

### 1. Appointments (`/salon/appointments`)
- **List View**: Calendar and list views of appointments
- **Create**: `/salon/appointments/new` or modal
- **Edit**: `/salon/appointments/[id]/edit`
- **Statuses**: confirmed, pending, completed, cancelled
- **Fields**: client, service, stylist, time, duration, price, notes
- **API**: `/api/v1/salon/appointments`

### 2. Clients (`/salon/clients`)
- **List View**: Searchable client database
- **Create**: Modal or dedicated page
- **View Details**: `/salon/clients/[id]`
- **Edit**: `/salon/clients/[id]/edit`
- **Fields**: name, phone, email, preferences, history
- **API**: `/api/v1/salon/clients`

### 3. Services (`/salon/services`)
- **Service Catalog**: Hair, nails, spa treatments
- **Categories**: `/salon/categories` for service grouping
- **Pricing**: Individual and package pricing
- **Duration**: Service time management
- **API**: `/api/v1/salon/services`

### 4. Staff Management (`/salon/staff`)
- **Staff Profiles**: Stylists, therapists, assistants
- **Skills**: `/salon/staff-skills` for specializations
- **Roles**: `/salon/staff-roles` for permissions
- **Schedule**: Availability and bookings
- **API**: `/api/v1/salon/staff`

### 5. Inventory (`/salon/inventory`)
- **Products**: `/salon/products` for retail items
- **Brands**: `/salon/brands` for product brands
- **Suppliers**: `/salon/suppliers` for vendors
- **Stock Locations**: `/salon/stock-locations`
- **Stock Tracking**: Low stock alerts
- **API**: `/api/v1/salon/inventory`

### 6. Point of Sale (`/salon/pos`)
- **Service Sales**: Quick service checkout
- **Product Sales**: Retail product sales
- **Payment Methods**: Cash, card, digital
- **Receipt Generation**: Digital receipts
- **API**: `/api/v1/salon/pos`

### 7. Payments (`/salon/payments`)
- **Transaction History**: All payment records
- **Payment Methods**: Multiple payment options
- **Refunds**: Process refunds
- **Reports**: Daily cash reconciliation
- **API**: `/api/v1/salon/payments`

### 8. Loyalty Program (`/salon/loyalty`)
- **Points System**: Earn and redeem points
- **VIP Tiers**: Bronze, Silver, Gold, Platinum
- **Rewards**: Discounts and free services
- **Member Benefits**: Special offers
- **API**: `/api/v1/salon/loyalty`

### 9. Marketing (`/salon/marketing`)
- **Campaigns**: Email and SMS campaigns
- **Promotions**: Special offers and discounts
- **Customer Segmentation**: Target marketing
- **Analytics**: Campaign performance
- **API**: `/api/v1/salon/marketing`

### 10. Reports (`/salon/reports`)
- **Revenue Reports**: Daily, weekly, monthly
- **Service Analytics**: Popular services
- **Staff Performance**: Bookings and revenue
- **Client Analytics**: Retention and frequency
- **API**: `/api/v1/salon/reports`

### 11. Settings (`/salon/settings`)
- **Business Info**: Salon details
- **Operating Hours**: Schedule configuration
- **Service Settings**: Default durations
- **Notification Settings**: SMS/Email preferences
- **API**: `/api/v1/salon/settings`

## Additional Features

### Extended Apps (Accessible via "More Apps" in sidebar)
- `/salon/finance` - Financial management
- `/salon/costing` - Service cost analysis
- `/salon/profitability` - Profit tracking
- `/salon/accounting` - Bookkeeping
- `/salon/analytics` - Business intelligence
- `/salon/operations` - Operations management
- `/salon/hr` - HR management
- `/salon/cash` - Cash management

## UI Components

### Main Layout
- **SalonProductionSidebar**: Collapsible sidebar with navigation
- **Quick Actions Modal**: Fast access to common tasks
- **Notifications**: Real-time alerts
- **Pink/Purple Theme**: Salon-specific gradient design

### Common UI Elements
- **Cards**: Information display containers
- **Tables**: Data listings with sorting/filtering
- **Modals**: Create/edit forms
- **Badges**: Status indicators and counts
- **Tabs**: Content organization
- **Date Pickers**: Appointment scheduling
- **Search Bars**: Client/service lookup

## API Patterns
All salon APIs follow HERA's universal architecture:
- **GET**: List and filter records
- **POST**: Create new records
- **PUT**: Update existing records
- **DELETE**: Remove records (soft delete)

### Common Query Parameters
- `organization_id`: Multi-tenant filtering
- `date`: Date-based filtering
- `status`: Status filtering
- `search`: Text search
- `limit`/`offset`: Pagination

## Authentication & Authorization
- Uses `MultiOrgAuthProvider` for multi-tenant auth
- Organization context required for all operations
- Subdomain routing for production deployments
- Role-based access control via universal entities

## Test Scenarios for Playwright

### Critical User Flows
1. **Book Appointment**: Client selection → Service selection → Staff selection → Time slot → Confirmation
2. **Client Check-in**: Search client → View history → Start service → Complete payment
3. **Inventory Management**: Check stock → Create purchase order → Receive goods → Update stock
4. **Daily Operations**: View dashboard → Check appointments → Process payments → Generate reports
5. **Marketing Campaign**: Create campaign → Select audience → Send messages → Track results

### Key Test Points
- Multi-tenant isolation (data separation)
- Subdomain routing functionality
- Real-time updates (appointments, inventory)
- Payment processing flow
- Report generation accuracy
- Mobile responsiveness
- Quick action workflows

## Database Structure (Universal Tables)
- **core_entities**: Clients, staff, services, products (entity_type: 'salon_client', 'salon_staff', etc.)
- **universal_transactions**: Appointments, sales, payments (transaction_type: 'appointment', 'salon_sale')
- **core_relationships**: Client preferences, staff skills, loyalty tiers
- **core_dynamic_data**: Custom fields for clients, services
- **universal_transaction_lines**: Service/product line items

## Progressive Features
- `/salon-progressive/*`: IndexedDB-based trial version
- 30-day trial period with full functionality
- Seamless conversion to production with data migration