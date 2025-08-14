#!/usr/bin/env node

/**
 * HERA Documentation Setup Script
 * Creates sample documentation content using the universal 6-table architecture
 */

const sampleDocPages = {
  dev: [
    {
      slug: 'getting-started',
      title: 'Getting Started',
      section: 'Setup',
      order: 1,
      description: 'Set up your development environment and understand core concepts',
      content: `# Getting Started

Welcome to HERA development! This guide will help you set up your development environment and understand the core concepts.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

## Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-org/hera-erp.git
cd hera-erp
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

## Understanding HERA

HERA is built on a universal 6-table architecture:

- **core_organizations** - Multi-tenant isolation
- **core_entities** - All business objects
- **core_dynamic_data** - Custom fields
- **core_relationships** - Entity connections
- **universal_transactions** - Business transactions
- **universal_transaction_lines** - Transaction details

## Next Steps

- [Architecture Overview](/docs/dev/architecture/overview)
- [Database Setup](/docs/dev/database/setup)  
- [API Development](/docs/dev/api/development)`
    },
    {
      slug: 'architecture/overview',
      title: 'Architecture Overview',
      section: 'Architecture',
      order: 2,
      description: 'Deep dive into HERA\'s universal 6-table architecture',
      content: `# HERA Architecture Overview

HERA is built on a revolutionary universal 6-table database architecture that can handle any business complexity without requiring schema changes.

## Universal 6-Table Schema

### 1. core_organizations
Multi-tenant isolation with organization_id filtering throughout the application.

\`\`\`sql
CREATE TABLE core_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  organization_type VARCHAR(100),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### 2. core_entities  
All business objects (products, customers, employees, etc.) are stored as entities with a universal entity_type classification.

\`\`\`sql
CREATE TABLE core_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(100) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  entity_code VARCHAR(100),
  organization_id UUID NOT NULL REFERENCES core_organizations(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
\`\`\`

### 3. core_dynamic_data
Unlimited custom fields for any entity through flexible key-value relationships.

### 4. core_relationships
Entity connections and workflow relationships enable complex business logic.

### 5. universal_transactions
All business transactions (sales, purchases, payments, transfers) follow a universal pattern.

### 6. universal_transaction_lines
Transaction line items and details provide complete audit trails.

## Design Principles

- **Multi-tenant by design**: Sacred organization_id filtering
- **Universal patterns**: Avoid business-specific database schemas  
- **AI-native preparation**: System designed for future AI classification
- **Audit everything**: Complete transaction history and relationships

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Database**: Supabase with PostgreSQL
- **Authentication**: NextAuth.js with Supabase adapters
- **UI**: Shadcn/ui with Tailwind CSS
- **State Management**: Zustand + TanStack Query`
    },
    {
      slug: 'database/setup',
      title: 'Database Development',
      section: 'Database',
      order: 3,
      description: 'Learn how to work with HERA\'s universal database architecture',
      content: `# Database Development Guide

Learn how to work with HERA's universal database architecture effectively.

## Entity Management

All business objects use the \`core_entities\` table:

\`\`\`sql
INSERT INTO core_entities (
  entity_type,
  entity_name,
  entity_code,
  organization_id
) VALUES (
  'customer',
  'Acme Corporation',
  'ACME001',
  $1
);
\`\`\`

## Dynamic Fields

Add custom fields via \`core_dynamic_data\`:

\`\`\`sql
INSERT INTO core_dynamic_data (
  entity_id,
  field_name,
  field_type,
  field_value,
  organization_id
) VALUES (
  $1, -- entity_id
  'industry',
  'text',
  'Manufacturing',
  $2 -- organization_id
);
\`\`\`

## Relationships

Connect entities via \`core_relationships\`:

\`\`\`sql
INSERT INTO core_relationships (
  source_entity_id,
  target_entity_id,
  relationship_type,
  relationship_data,
  organization_id
) VALUES (
  $1, -- customer_id
  $2, -- contact_id
  'customer_contact',
  '{"is_primary": true}'::jsonb,
  $3 -- organization_id
);
\`\`\`

## Row Level Security (RLS)

All tables must implement RLS policies:

\`\`\`sql
-- Enable RLS
ALTER TABLE core_entities ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "org_isolation" ON core_entities
  USING (organization_id = current_setting('app.current_organization_id')::uuid);
\`\`\`

## Common Patterns

### Entity with Custom Fields
\`\`\`typescript
// Create product with custom fields
const product = await createEntity({
  entity_type: 'product',
  entity_name: 'Widget Pro',
  entity_code: 'WIDGET001',
  custom_fields: {
    price: 99.99,
    category: 'electronics',
    in_stock: true
  }
})
\`\`\`

### Complex Queries
\`\`\`sql
-- Find products with relationships
SELECT 
  e.entity_name,
  cd.field_value as price,
  r.relationship_type
FROM core_entities e
JOIN core_dynamic_data cd ON e.id = cd.entity_id 
LEFT JOIN core_relationships r ON e.id = r.source_entity_id
WHERE e.entity_type = 'product'
  AND e.organization_id = $1
  AND cd.field_name = 'price';
\`\`\``
    },
    {
      slug: 'api/development',
      title: 'API Development',
      section: 'Development',
      order: 4,
      description: 'Build robust APIs using HERA\'s universal patterns',
      content: `# API Development Guide

Build robust APIs using HERA's universal patterns and Next.js App Router.

## Entity Endpoints

### Create Entity
\`\`\`typescript
// POST /api/v1/entities
{
  "entity_type": "product",
  "entity_name": "Widget Pro",
  "entity_code": "WIDGET001",
  "metadata": {
    "category": "electronics",
    "status": "active"
  },
  "custom_fields": {
    "price": 99.99,
    "description": "Professional widget"
  }
}
\`\`\`

### Search Entities
\`\`\`typescript
// POST /api/v1/entities/search
{
  "entity_type": "customer",
  "filters": {
    "metadata.status": "active"
  },
  "include_dynamic_data": true,
  "include_relationships": true,
  "limit": 20,
  "offset": 0
}
\`\`\`

## Universal Search

The universal search endpoint searches across all entity types:

\`\`\`typescript
// POST /api/v1/universal/search
{
  "query": "widget",
  "entity_types": ["product", "customer"],
  "include_dynamic_data": true,
  "filters": {
    "metadata.status": "active"
  }
}
\`\`\`

## Authentication & Authorization

All endpoints require JWT authentication with organization_id claims:

\`\`\`typescript
const token = jwt.sign({
  user_id: "user_uuid",
  organization_id: "org_uuid",
  role: "user",
  permissions: ["read", "write"]
}, JWT_SECRET);
\`\`\`

### Route Protection
\`\`\`typescript
// app/api/v1/entities/route.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Ensure organization_id is set
  const organizationId = session.user.organization_id
  if (!organizationId) {
    return Response.json({ error: "No organization" }, { status: 403 })
  }
  
  // Process request...
}
\`\`\`

## Error Handling

Use consistent error responses:

\`\`\`typescript
// Standard error format
{
  "error": "Validation failed",
  "message": "Entity name is required",
  "code": "VALIDATION_ERROR",
  "details": {
    "field": "entity_name",
    "value": null
  }
}
\`\`\`

## Transaction Endpoints

### Create Transaction
\`\`\`typescript
// POST /api/v1/transactions
{
  "transaction_type": "sale",
  "description": "Product sale to customer",
  "transaction_data": {
    "customer_id": "uuid",
    "payment_method": "credit_card"
  },
  "transaction_lines": [
    {
      "entity_id": "product_uuid",
      "quantity": 2,
      "unit_price": 99.99,
      "line_data": {
        "discount": 10
      }
    }
  ]
}
\`\`\``
    }
  ],
  user: [
    {
      slug: 'getting-started',
      title: 'Getting Started',
      section: 'Basics',
      order: 1,
      description: 'Learn the basics of using HERA applications', 
      content: `# Getting Started with HERA

Welcome to HERA! This guide will help you get started with using HERA applications effectively.

## What is HERA?

HERA (Hierarchical Enterprise Resource Architecture) is a revolutionary ERP platform that adapts to any business without requiring custom development or schema changes.

## Creating Your Account

1. **Sign Up**: Visit the registration page and create your account
2. **Verify Email**: Check your email and click the verification link
3. **Organization Setup**: Create or join an organization
4. **Profile Setup**: Complete your user profile

## First Login

When you first log in, you'll see:

- **Dashboard**: Overview of your key metrics and activities
- **Navigation Menu**: Access to all application features
- **Profile Menu**: Account settings and preferences
- **Help Center**: Documentation and support resources

## Basic Navigation

### Main Menu
The main navigation menu provides access to:

- **Dashboard** - Overview and key metrics
- **Entities** - Manage customers, products, employees
- **Transactions** - Sales, purchases, payments
- **Reports** - Analytics and insights
- **Settings** - Configuration and preferences

### Search
Use the global search to find:
- Customers and contacts
- Products and services  
- Transactions and orders
- Documents and files

## Key Concepts

### Entities
Everything in HERA is an entity:
- **Customers** - People and companies you do business with
- **Products** - Items and services you sell
- **Employees** - Your team members
- **Projects** - Work initiatives and campaigns

### Relationships
Entities can be connected:
- Customer ↔ Contact Person
- Product ↔ Supplier
- Employee ↔ Department
- Project ↔ Team Members

### Transactions
All business activities are transactions:
- Sales and purchases
- Payments and receipts
- Inventory movements
- Time tracking

## Next Steps

- [Dashboard Overview](/docs/user/dashboard/overview)
- [Core Features](/docs/user/features/core)
- [Account Management](/docs/user/account/management)`
    },
    {
      slug: 'dashboard/overview',
      title: 'Dashboard Overview',
      section: 'Interface',
      order: 2,
      description: 'Navigate and customize your HERA dashboard',
      content: `# Dashboard Overview

Your dashboard is the central hub for monitoring your business activities and key metrics.

## Dashboard Layout

### Header
- **Organization Switcher** - Switch between organizations
- **Global Search** - Find anything in the system
- **Notifications** - Important alerts and updates
- **User Menu** - Profile and account settings

### Main Content Area
- **Key Metrics** - Important numbers at a glance
- **Recent Activity** - Latest transactions and updates
- **Quick Actions** - Common tasks and shortcuts
- **Charts & Graphs** - Visual data representation

### Sidebar Navigation
- **Main Menu** - Access to all features
- **Favorites** - Your bookmarked items
- **Recent Items** - Recently viewed entities

## Key Metrics Widgets

### Financial Overview
- **Revenue** - Total sales for the period
- **Expenses** - Total costs and expenses
- **Profit** - Net profit margin
- **Cash Flow** - Money in vs money out

### Activity Metrics
- **New Customers** - Recent customer acquisitions
- **Orders** - Sales orders and fulfillment
- **Inventory** - Stock levels and alerts
- **Tasks** - Pending items requiring attention

## Customizing Your Dashboard

### Widget Management
1. Click the **Edit Dashboard** button
2. **Add Widgets** - Choose from available options
3. **Rearrange** - Drag and drop to reorder
4. **Resize** - Adjust widget sizes
5. **Remove** - Delete widgets you don't need

### Personal Preferences
- **Theme** - Light or dark mode
- **Language** - Interface language
- **Timezone** - Your local timezone
- **Date Format** - Preferred date display

## Quick Actions

### Create New
- **Customer** - Add new customer record
- **Product** - Create product or service
- **Transaction** - Record sale or purchase
- **Task** - Add to-do item

### Recent Access
- **Continue Editing** - Resume incomplete items
- **Recent Searches** - Repeat common searches
- **Bookmarks** - Quick access to important items

## Mobile Dashboard

The mobile version includes:
- **Simplified Layout** - Optimized for small screens
- **Swipe Navigation** - Easy gesture controls
- **Push Notifications** - Real-time alerts
- **Offline Access** - Basic functionality without internet

## Tips for Effective Use

1. **Customize Regularly** - Adjust widgets based on your needs
2. **Use Bookmarks** - Save frequently accessed items
3. **Set Up Alerts** - Get notified of important changes
4. **Review Daily** - Start each day with a dashboard review`
    },
    {
      slug: 'features/core',
      title: 'Core Features',
      section: 'Features',
      order: 3,
      description: 'Master the essential features of HERA applications',
      content: `# Core Features Guide

Learn how to use HERA's essential features effectively.

## Entity Management

### Creating Entities
1. Navigate to the appropriate section (Customers, Products, etc.)
2. Click **New** or **Add**
3. Fill in required fields
4. Add custom fields as needed
5. Save the entity

### Custom Fields
HERA allows unlimited custom fields:
- **Text Fields** - Names, descriptions, notes
- **Numbers** - Prices, quantities, measurements  
- **Dates** - Deadlines, schedules, events
- **Selections** - Categories, statuses, types
- **Files** - Documents, images, attachments

### Entity Relationships
Connect related entities:
- **Link Customers** to their Contact Persons
- **Associate Products** with Suppliers
- **Connect Employees** to Departments
- **Relate Projects** to Team Members

## Transaction Processing

### Sales Transactions
1. **Create Sale** - Select customer and products
2. **Add Line Items** - Specify quantities and prices
3. **Apply Discounts** - Percentage or fixed amounts
4. **Process Payment** - Record payment method
5. **Generate Invoice** - Create customer invoice

### Purchase Transactions  
1. **Create Purchase** - Select supplier and items
2. **Add Purchase Lines** - Quantities and costs
3. **Track Delivery** - Expected and actual dates
4. **Process Payment** - Record payment to supplier
5. **Update Inventory** - Receive items into stock

### Payment Processing
- **Receive Payments** - Customer payments
- **Make Payments** - Supplier payments
- **Bank Transfers** - Between accounts
- **Expense Tracking** - Business expenses

## Search and Filtering

### Global Search
Use the search bar to find:
- **Entities** - By name, code, or description
- **Transactions** - By reference, customer, date
- **Custom Fields** - By field values
- **Full Text** - Search within descriptions and notes

### Advanced Filters
- **Date Ranges** - Filter by time periods
- **Entity Types** - Focus on specific types
- **Custom Field Values** - Filter by custom data
- **Status Filters** - Active, inactive, pending
- **Relationship Filters** - Connected entities

## Reporting and Analytics

### Standard Reports
- **Sales Reports** - Revenue, trends, performance
- **Customer Reports** - Analysis and segmentation
- **Product Reports** - Performance and inventory
- **Financial Reports** - P&L, balance sheet, cash flow

### Custom Reports
1. **Report Builder** - Drag and drop interface
2. **Data Selection** - Choose entities and fields
3. **Filters** - Apply criteria and conditions
4. **Visualization** - Charts, graphs, tables
5. **Scheduling** - Automated report generation

## Data Import/Export

### Importing Data
1. **Prepare File** - CSV or Excel format
2. **Map Fields** - Match columns to HERA fields
3. **Validate Data** - Check for errors
4. **Import** - Load data into system
5. **Review Results** - Confirm successful import

### Exporting Data
- **Select Data** - Choose entities or transactions
- **Format Options** - CSV, Excel, PDF
- **Field Selection** - Include specific fields
- **Filters** - Export subsets of data
- **Schedule Exports** - Automated regular exports

## Collaboration Features

### User Management
- **Invite Users** - Add team members
- **Assign Roles** - Define permissions
- **Manage Access** - Control feature access
- **User Groups** - Organize team members

### Sharing and Permissions
- **Entity Sharing** - Share specific records
- **View Permissions** - Read-only access
- **Edit Permissions** - Modification rights
- **Admin Access** - Full system control`
    }
  ]
}

/**
 * Setup function to create documentation data via HERA API
 */
async function setupDocumentationData() {
  console.log('Setting up HERA documentation data...')
  
  try {
    // Create documentation organizations
    const devOrg = await createOrganization({
      organization_name: 'HERA Developer Documentation',
      organization_type: 'documentation',
      settings: {
        doc_type: 'developer',
        access_level: 'internal',
        theme: 'technical',
        auto_generate_nav: true
      }
    })

    const userOrg = await createOrganization({
      organization_name: 'HERA User Documentation',
      organization_type: 'documentation', 
      settings: {
        doc_type: 'user',
        access_level: 'public',
        theme: 'user-friendly',
        auto_generate_nav: true
      }
    })

    // Create documentation pages
    for (const docType of ['dev', 'user']) {
      const pages = sampleDocPages[docType]
      const orgId = docType === 'dev' ? devOrg.id : userOrg.id

      for (const page of pages) {
        // Create page entity
        const pageEntity = await createEntity({
          entity_type: 'doc_page',
          entity_name: page.title,
          entity_code: page.slug,
          organization_id: orgId,
          metadata: {
            doc_type: docType,
            section: page.section,
            order: page.order,
            status: 'published'
          }
        })

        // Add content as dynamic data
        await createDynamicData({
          entity_id: pageEntity.id,
          field_name: 'content',
          field_type: 'text',
          field_value: page.content,
          organization_id: orgId
        })

        // Add description
        if (page.description) {
          await createDynamicData({
            entity_id: pageEntity.id,
            field_name: 'description', 
            field_type: 'text',
            field_value: page.description,
            organization_id: orgId
          })
        }

        console.log(\`Created \${docType} page: \${page.title}\`)
      }
    }

    console.log('✅ Documentation data setup complete!')
  } catch (error) {
    console.error('❌ Error setting up documentation data:', error)
  }
}

// Helper functions (these would use your actual HERA API)
async function createOrganization(data) {
  const response = await fetch('/api/v1/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}

async function createEntity(data) {
  const response = await fetch('/api/v1/entities', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}

async function createDynamicData(data) {
  const response = await fetch('/api/v1/dynamic-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setupDocumentationData, sampleDocPages }
}

// Run if called directly
if (require.main === module) {
  setupDocumentationData()
}