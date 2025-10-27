# HERA App Configuration System

## Overview

The HERA App Configuration System enables you to define complete enterprise applications using YAML configuration files. Once configured, the system automatically generates:

- ✅ **Entity Definitions** with dynamic fields and relationships
- ✅ **Transaction Types** with validation and business rules  
- ✅ **Workflow Processes** with AI assistance and automation
- ✅ **UI Components** including dashboards, forms, and navigation
- ✅ **API Endpoints** following HERA v1 standards
- ✅ **Database Schema** using Sacred Six architecture
- ✅ **Deployment Configuration** with permissions and roles

## Quick Start

### 1. Define Your App Configuration

Create a YAML file following the HERA App Schema:

```yaml
app:
  name: "My Business App"
  code: "MBA"
  version: "1.0.0"
  smart_code: "HERA.MBA.APP.SYSTEM.v1"
  organization:
    id: "your_org_id"
    name: "Your Organization"

entities:
  - entity_type: "CUSTOMER"
    entity_name: "Customer"
    smart_code: "HERA.MBA.CUSTOMER.ENTITY.v1"
    dynamic_fields:
      - name: "customer_type"
        type: "text"
        required: true
        smart_code: "HERA.MBA.CUSTOMER.FIELD.TYPE.v1"
        options: ["individual", "business"]

# ... continue with transactions, workflows, ui, etc.
```

### 2. Generate Your Application

Use the HERA App Generator component:

```typescript
import HERAAppGenerator from '@/components/app-generator/HERAAppGenerator';

function MyAppBuilder() {
  return (
    <HERAAppGenerator 
      onAppGenerated={(appStructure) => {
        // Handle generated app structure
        console.log('Generated:', appStructure);
      }}
    />
  );
}
```

### 3. Deploy and Use

The generated application includes:
- Ready-to-use React components
- Configured API endpoints  
- Database relationships
- Business logic and validations

## Configuration Schema

### App Definition
```yaml
app:
  name: string              # Human-readable app name
  code: string              # Short app code (3-15 chars)
  version: string           # Semantic version
  description: string       # App description
  smart_code: string        # HERA smart code pattern
  organization:
    id: string              # Organization ID
    name: string            # Organization name
  module:
    code: string            # Module code
    icon: string            # Icon name
    color: string           # Theme color
    category: string        # App category
```

### Entity Definition
```yaml
entities:
  - entity_type: string     # Uppercase entity type
    entity_name: string     # Display name
    description: string     # Entity description
    smart_code: string      # HERA smart code
    icon: string            # UI icon
    
    dynamic_fields:         # Custom fields
      - name: string        # Field name
        type: text|number|boolean|date|json
        required: boolean   # Is required
        smart_code: string  # Field smart code
        options: [string]   # Select options
        default: any        # Default value
        min: number         # Min value (numbers)
        max: number         # Max value (numbers)
        pattern: string     # Regex pattern (text)
        
    relationships:          # Entity relationships  
      - type: string        # Relationship type
        target_entity: string # Target entity type
        cardinality: one|many # Relationship cardinality
        smart_code: string  # Relationship smart code
        required: boolean   # Is required
```

### Transaction Definition
```yaml
transactions:
  - transaction_type: string # Transaction type
    transaction_name: string # Display name
    description: string     # Description
    smart_code: string      # HERA smart code
    category: string        # Transaction category
    
    line_types:             # Transaction line types
      - name: string        # Line type name
        description: string # Line description
        required: boolean   # Is required
        smart_code: string  # Line smart code
        account_type: string # GL account type
        side: DR|CR         # Debit or Credit
        
    validation_rules:       # Business rules
      - rule: string        # Rule name
        description: string # Rule description
        condition: string   # Validation condition
        
    balancing_rules:        # Balancing rules
      - rule: string        # Rule name
        description: string # Rule description
        condition: string   # Balance condition
```

### Workflow Definition
```yaml
workflows:
  - workflow_name: string   # Workflow name
    workflow_code: string   # Workflow code
    description: string     # Description
    smart_code: string      # HERA smart code
    trigger_entity: string  # Triggering entity
    
    steps:                  # Workflow steps
      - step_name: string   # Step name
        step_code: string   # Step code
        description: string # Step description
        actor_role: string  # Who performs step
        ai_assistance: boolean # AI help available
        auto_execute: boolean # Auto execution
        transaction_type: string # Transaction to create
        condition: string   # Execution condition
```

### UI Configuration
```yaml
ui:
  dashboard:                # Dashboard config
    title: string          # Dashboard title
    layout: string         # Layout type
    refresh_interval: number # Refresh seconds
    
    widgets:               # Dashboard widgets
      - type: metric|chart # Widget type
        title: string      # Widget title
        entity: string     # Data entity
        calculation: count|sum|avg # Calculation
        field: string      # Field to calculate
        filter: string     # Data filter
        color: string      # Widget color
        
  navigation:              # App navigation
    - section: string      # Navigation section
      items:               # Section items
        - label: string    # Item label
          entity: string   # Target entity
          view: list|create|custom # View type
          component: string # Custom component
          icon: string     # Item icon
          
  list_views:              # List view configs
    ENTITY_TYPE:           # Entity type
      columns:             # Table columns
        - field: string    # Field path
          title: string    # Column title
          sortable: boolean # Is sortable
          searchable: boolean # Is searchable
          filter: boolean  # Has filter
          format: currency|date|number # Display format
          
      filters:             # Available filters
        - field: string    # Field path
          type: select|range|date # Filter type
          options: [string] # Select options
          min: number      # Range minimum
          max: number      # Range maximum
```

## Example Applications

### 1. CRM System
Complete customer relationship management with leads, opportunities, and sales tracking.

**Key Features:**
- Customer entity with tiers and preferences
- Lead to customer conversion workflow
- Sales opportunity pipeline
- Revenue tracking transactions

[View CRM Example](./hera-app-schema.yaml)

### 2. Salon Management
Comprehensive salon management with appointments, services, and staff.

**Key Features:**
- Customer profiles with preferences and allergies
- Service catalog with duration and pricing
- Staff management with skills and commissions
- Appointment booking and workflow automation

[View Salon Example](./examples/salon-app.yaml)

### 3. Inventory Management
Advanced inventory system with multi-warehouse support and automation.

**Key Features:**
- Product catalog with specifications
- Multi-warehouse stock tracking
- Automated reorder point management
- Cycle counting workflows

[View Inventory Example](./examples/inventory-app.yaml)

## Best Practices

### Smart Code Patterns
Always follow HERA smart code standards:
```
Pattern: HERA.{MODULE}.{ENTITY}.{TYPE}.{SPECIFIC}.v{VERSION}
Example: HERA.CRM.CUSTOMER.FIELD.EMAIL.v1
```

### Entity Relationships
Design relationships carefully:
- Use clear relationship types (`HAS_`, `BELONGS_TO_`, `OWNS_`)
- Consider cardinality (one vs many)
- Plan for future extensibility

### Transaction Design
Structure transactions properly:
- Include all necessary line types
- Add validation and balancing rules  
- Consider audit and compliance needs

### Workflow Planning
Design efficient workflows:
- Break complex processes into clear steps
- Use AI assistance where beneficial
- Plan for exception handling

### UI/UX Considerations
Create intuitive interfaces:
- Group related functions in navigation
- Design useful dashboard widgets
- Provide appropriate filters and search

## Advanced Features

### AI Assistance Integration
```yaml
ai_assistance:
  features:
    - feature: "lead_scoring"
      description: "Auto-score leads based on profile"
      entity: "LEAD"
      model: "lead_scoring_v1"
      
  suggestions:
    - context: "creating_customer"
      suggestions:
        - "Suggest customer type based on email domain"
        - "Recommend tier based on company size"
```

### External Integrations
```yaml
integrations:
  external_apis:
    - name: "Email Marketing"
      type: "webhook"
      endpoint: "https://api.mailchimp.com/3.0/"
      events: ["CUSTOMER_CREATED"]
      
  hera_modules:
    - module: "FINANCE"
      integration_type: "transaction_sync"
      sync_transactions: ["SALE"]
```

### Security and Permissions
```yaml
deployment:
  permissions:
    roles:
      - role: "admin"
        permissions: ["create", "read", "update", "delete"]
        entities: ["*"]
        
      - role: "user"
        permissions: ["read", "update"]
        entities: ["CUSTOMER"]
        conditions:
          - "assigned_to == current_user.id"
```

### Testing Configuration
```yaml
testing:
  sample_data:
    CUSTOMER:
      - entity_code: "CUST-0001"
        entity_name: "Test Customer"
        customer_type: "individual"
        
  test_scenarios:
    - scenario: "customer_onboarding"
      description: "Test complete customer setup"
      steps:
        - "Create customer record"
        - "Verify required fields"
        - "Test workflow triggers"
```

## API Generation

The system automatically generates REST APIs following HERA patterns:

### Generated Endpoints
```
GET    /api/{app}/entities/{type}        # List entities
POST   /api/{app}/entities/{type}        # Create entity
GET    /api/{app}/entities/{type}/{id}   # Get entity
PUT    /api/{app}/entities/{type}/{id}   # Update entity
DELETE /api/{app}/entities/{type}/{id}   # Delete entity

POST   /api/{app}/transactions/{type}    # Create transaction
GET    /api/{app}/transactions/{type}    # List transactions

POST   /api/{app}/workflows/{code}/trigger # Trigger workflow
GET    /api/{app}/workflows/{code}/status  # Workflow status
```

### Authentication
All APIs use HERA authentication and organization-level security.

## Database Schema

The system uses HERA's Sacred Six table architecture:

### Core Tables
- `core_entities` - Master entity records
- `core_dynamic_data` - Custom field values  
- `core_relationships` - Entity relationships
- `universal_transactions` - Transaction headers
- `universal_transaction_lines` - Transaction lines
- `core_workflows` - Workflow state tracking

### Organization Isolation
All data is automatically filtered by organization ID for security.

## Deployment

### Development
```bash
# Generate app from YAML
npm run hera:generate-app config/my-app.yaml

# Start development server
npm run dev

# View generated app
open http://localhost:3000/my-app
```

### Production
```bash
# Build for production
npm run build

# Deploy to HERA cloud
npm run hera:deploy

# Configure environment
export HERA_ORG_ID=your_org_id
export HERA_API_KEY=your_api_key
```

## Support

### Documentation
- [HERA API Documentation](../api/README.md)
- [Component Library](../components/README.md)
- [Workflow Engine](../workflows/README.md)

### Community
- GitHub Issues: [Report problems](https://github.com/hera-erp/issues)
- Discord: [Join discussions](https://discord.gg/hera-erp)
- Email: support@hera-erp.com

---

**Start building your HERA application today!** 🚀

Simply create a YAML configuration file and let HERA generate your complete enterprise application.