# HERA CRM Sales/Lead Management Module

## Overview

This is the foundational module for the HERA CRM platform, providing comprehensive sales and lead management capabilities. It demonstrates the complete YAML-driven app development approach and serves as the template for building additional CRM modules.

## Features

### 🎯 Core Functionality
- **Lead Management**: Capture, score, and qualify leads from multiple sources
- **Opportunity Tracking**: Manage sales pipeline from prospecting to close
- **Customer Management**: Maintain comprehensive customer profiles
- **Quote Generation**: Create formal proposals with pricing and terms
- **Territory Management**: Organize sales by geographic or logical regions
- **Sales Rep Management**: Track sales team performance and assignments

### 🤖 AI-Powered Features
- **Lead Scoring**: Automatic scoring based on historical conversion data
- **Opportunity Insights**: Win probability and next best action recommendations
- **Quote Optimization**: Intelligent pricing recommendations
- **Smart Assignment**: Automatic lead and opportunity routing

### 🎨 Modern UI/UX
- **Fiori-Style Interface**: SAP-inspired design with glassmorphism effects
- **4-Step Master Data Wizards**: Guided entity creation process
- **S/4HANA Transaction Wizards**: Business process automation
- **Interactive Dashboards**: Real-time metrics and KPIs
- **Mobile-Responsive**: Optimized for desktop, tablet, and mobile

### 🔒 Security & Compliance
- **Role-Based Access Control**: Sales rep, manager, and admin roles
- **Organization Isolation**: Multi-tenant data separation
- **Audit Trails**: Complete change tracking with actor stamping
- **Data Validation**: Comprehensive business rule enforcement

## Architecture

### Platform Organization Pattern
```
Platform Organization (org_hera_platform_00000000)
├── APP_TEMPLATE: Sales/Lead Management
├── UNIVERSAL_COMPONENT: Master Data Wizard
├── UNIVERSAL_COMPONENT: Transaction Wizard
└── Smart Code Patterns: HERA.CRM.SALES.*

Demo Organization (00000000000001)
├── Deployed Application Instance
├── Test Data & Sample Records
└── User Accounts for Testing
```

### Entity Relationship Model
```
TERRITORY
    ├── SALES_REP (many-to-one)
    └── CUSTOMER (many-to-one)

SALES_REP
    ├── LEAD (assigned_to)
    ├── OPPORTUNITY (owned_by)
    └── CUSTOMER (sales_rep)

LEAD
    └── OPPORTUNITY (converts_to)

CUSTOMER
    ├── OPPORTUNITY (belongs_to)
    └── QUOTE (for_customer)

OPPORTUNITY
    └── QUOTE (for_opportunity)
```

### Smart Code Patterns
All components follow the HERA smart code pattern:
```
HERA.CRM.SALES.{ENTITY}.{FIELD}.v1
```

Examples:
- `HERA.CRM.SALES.LEAD.ENTITY.v1`
- `HERA.CRM.SALES.LEAD.FIELD.EMAIL.v1`
- `HERA.CRM.SALES.TXN.LEAD_QUALIFICATION.v1`

## File Structure

```
src/templates/app-config/modules/
├── crm-sales-leads.yaml          # Main YAML configuration
├── README.md                     # This documentation
└── examples/                     # Additional examples and variants

src/scripts/
├── deploy-sales-template.ts      # Save template to Platform Org
├── deploy-to-demo-org.ts         # Deploy to Demo Organization
└── test-sales-module.ts          # Comprehensive testing suite
```

## Quick Start

### 1. Deploy Template to Platform Organization

```bash
# Save the YAML template to Platform Organization
npm run hera:template:deploy src/templates/app-config/modules/crm-sales-leads.yaml

# Or use the TypeScript script directly
npx tsx src/scripts/deploy-sales-template.ts
```

### 2. Deploy to Demo Organization

```bash
# Deploy from Platform Organization to Demo Organization
npm run hera:demo:deploy <template-id> --include-test-data

# Or use the TypeScript script directly
npx tsx src/scripts/deploy-to-demo-org.ts <template-id> --include-test-data
```

### 3. Run Comprehensive Tests

```bash
# Run full test suite
npm run hera:test:sales <template-id>

# Or use the TypeScript script directly
npx tsx src/scripts/test-sales-module.ts <template-id>
```

## Detailed Setup

### Prerequisites

1. **HERA Platform Access**: Valid organization with proper permissions
2. **Node.js Environment**: Version 18+ with TypeScript support
3. **Database Access**: PostgreSQL with Sacred Six tables
4. **Authentication**: Valid JWT tokens for API access

### Step-by-Step Deployment

#### Phase 1: Template Storage
```bash
# 1. Validate YAML configuration
npm run hera:validate src/templates/app-config/modules/crm-sales-leads.yaml

# 2. Deploy to Platform Organization
npx tsx src/scripts/deploy-sales-template.ts

# Expected output:
# ✅ Template saved successfully!
#    - Template ID: template_crm_sales_001
#    - Entity Code: TEMPLATE-123456
#    - Smart Code: HERA.PLATFORM.APP_TEMPLATE.CRM_SALES_LEADS.v1
```

#### Phase 2: Demo Deployment
```bash
# 1. Deploy to Demo Organization
npx tsx src/scripts/deploy-to-demo-org.ts template_crm_sales_001 --include-test-data

# Expected output:
# 🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!
#    - Entities deployed: 6
#    - Transactions deployed: 3
#    - UI components: 15
#    - Test data included: true
```

#### Phase 3: Testing & Validation
```bash
# 1. Run comprehensive tests
npx tsx src/scripts/test-sales-module.ts template_crm_sales_001

# Expected output:
# 📊 TEST SUMMARY
#    Suite: Sales/Lead Management Module
#    Total Tests: 45
#    ✅ Passed: 43
#    ❌ Failed: 0
#    ⏭️  Skipped: 2
#    Success Rate: 95.6%
```

## Configuration Details

### Entities

| Entity | Description | Key Fields | Relationships |
|--------|-------------|------------|---------------|
| **LEAD** | Potential customers | first_name, last_name, email, lead_score | → SALES_REP, → OPPORTUNITY |
| **OPPORTUNITY** | Sales deals | opportunity_name, stage, amount, probability | → CUSTOMER, → SALES_REP, → QUOTE |
| **CUSTOMER** | Qualified prospects | customer_type, industry, annual_revenue | → SALES_REP, → TERRITORY |
| **SALES_REP** | Sales team members | first_name, last_name, role, quota | → TERRITORY, → MANAGER |
| **TERRITORY** | Sales regions | territory_name, region, countries | → SALES_REP (manager) |
| **QUOTE** | Formal proposals | quote_number, total_amount, status | → OPPORTUNITY, → CUSTOMER |

### Transactions

| Transaction | Description | Triggers | AI Assistance |
|-------------|-------------|----------|---------------|
| **LEAD_QUALIFICATION** | Score and qualify leads | New lead creation | ✅ Lead scoring |
| **OPPORTUNITY_CREATION** | Convert lead to opportunity | Lead qualification | ✅ Amount estimation |
| **QUOTE_GENERATION** | Generate formal quotes | Opportunity progression | ✅ Pricing optimization |

### Workflows

| Workflow | Description | Steps | Duration |
|----------|-------------|-------|----------|
| **Lead to Customer** | Complete conversion process | Contact → Qualify → Convert → Quote | ~30 days |
| **Sales Pipeline** | Opportunity management | Prospect → Propose → Negotiate → Close | ~60 days |

### User Roles

| Role | Permissions | Access Level | Use Cases |
|------|-------------|--------------|-----------|
| **sales_rep** | Create, Read, Update (own records) | Limited | Daily sales activities |
| **sales_manager** | Create, Read, Update, Delete (team records) | Team-wide | Team management, reporting |
| **sales_admin** | Full access to all records | Organization-wide | System administration |

## Testing Strategy

### Test Categories

1. **Configuration Tests**: YAML structure, smart codes, relationships
2. **CRUD Tests**: Entity create, read, update, delete operations
3. **Transaction Tests**: Business process execution and validation
4. **Workflow Tests**: End-to-end process automation
5. **UI Tests**: Component rendering, navigation, wizards
6. **Security Tests**: RBAC, organization isolation, audit trails
7. **Performance Tests**: Query speed, concurrent operations
8. **Integration Tests**: AI services, external APIs

### Sample Test Data

The module includes comprehensive test data covering:
- **5 Territories**: North America, Europe, Asia Pacific, etc.
- **15 Sales Reps**: Various roles and experience levels
- **50 Leads**: Different sources, scores, and qualification states
- **25 Opportunities**: Various stages and amounts
- **30 Customers**: Different types and industries
- **20 Quotes**: Various statuses and amounts

### Performance Benchmarks

| Operation | Target | Acceptable | Unacceptable |
|-----------|--------|------------|--------------|
| Entity CRUD | < 100ms | < 500ms | > 1000ms |
| Transaction Execution | < 200ms | < 1000ms | > 2000ms |
| Workflow Completion | < 500ms | < 2000ms | > 5000ms |
| Dashboard Load | < 300ms | < 1000ms | > 3000ms |

## Customization Guide

### Adding New Entity Fields

1. Update the YAML configuration:
```yaml
dynamic_fields:
  - name: "new_field"
    type: "text"
    required: true
    smart_code: "HERA.CRM.SALES.ENTITY.FIELD.NEW_FIELD.v1"
```

2. Redeploy the template:
```bash
npx tsx src/scripts/deploy-sales-template.ts
```

### Creating Custom Transactions

1. Define in YAML:
```yaml
transactions:
  - transaction_type: "CUSTOM_PROCESS"
    transaction_name: "Custom Business Process"
    smart_code: "HERA.CRM.SALES.TXN.CUSTOM_PROCESS.v1"
    line_types:
      - name: "custom_step"
        description: "Custom processing step"
        required: true
```

2. Test the transaction:
```bash
npx tsx src/scripts/test-sales-module.ts <template-id>
```

### Modifying UI Components

1. Update dashboard widgets:
```yaml
ui:
  dashboard:
    widgets:
      - type: "metric"
        title: "Custom Metric"
        entity: "LEAD"
        calculation: "count"
        filter: "custom_field == 'value'"
```

2. Add navigation items:
```yaml
ui:
  navigation:
    - section: "Custom Section"
      items:
        - label: "Custom View"
          entity: "LEAD"
          view: "custom"
          icon: "star"
```

## Production Deployment

### Requirements Checklist

- [ ] **Database**: Sacred Six tables created and accessible
- [ ] **Authentication**: JWT authentication configured
- [ ] **Organization**: Target organization created and accessible
- [ ] **Permissions**: Proper role assignments for users
- [ ] **Integration**: External APIs configured (if needed)
- [ ] **Monitoring**: Logging and metrics collection enabled

### Deployment Steps

1. **Environment Preparation**
```bash
# Set environment variables
export HERA_ORG_ID="your_production_org_id"
export HERA_API_BASE="https://api.yourcompany.com"
export HERA_AUTH_TOKEN="your_jwt_token"
```

2. **Template Deployment**
```bash
# Deploy to production organization
npx tsx src/scripts/deploy-to-demo-org.ts <template-id> \
  --target-org $HERA_ORG_ID \
  --skip-test-data
```

3. **Production Testing**
```bash
# Run subset of tests suitable for production
npm run hera:test:production <template-id>
```

### Monitoring & Maintenance

- **Health Checks**: Automated validation of core functionality
- **Performance Monitoring**: Track response times and error rates
- **Usage Analytics**: Monitor feature adoption and user behavior
- **Regular Updates**: Apply template updates and security patches

## Troubleshooting

### Common Issues

#### Template Deployment Fails
```
Error: Smart code validation failed
Solution: Check smart code patterns match HERA.CRM.SALES.*.v1
```

#### Entity Creation Fails
```
Error: Required field missing
Solution: Verify all required dynamic fields are provided
```

#### Permission Denied
```
Error: Access denied for operation
Solution: Check user role assignments and permissions
```

#### Performance Issues
```
Error: Query timeout
Solution: Check database indexes and query optimization
```

### Debug Commands

```bash
# Validate YAML syntax
npm run hera:yaml:validate crm-sales-leads.yaml

# Check template status
npm run hera:template:status <template-id>

# View deployment logs
npm run hera:logs --module=sales --level=debug

# Test connectivity
npm run hera:health:check --org=<org-id>
```

## Support & Documentation

### Additional Resources

- **HERA Platform Documentation**: [/docs/HERA-Universal-Operating-Guide.md](../../docs/HERA-Universal-Operating-Guide.md)
- **API Reference**: [/docs/api/README.md](../../docs/api/README.md)
- **Security Guide**: [/docs/SECURITY-IMPLEMENTATION.md](../../docs/SECURITY-IMPLEMENTATION.md)
- **Platform Architecture**: [/docs/PLATFORM-ORG-ARCHITECTURE.md](../../docs/PLATFORM-ORG-ARCHITECTURE.md)

### Getting Help

1. **Check Documentation**: Review the comprehensive guides above
2. **Run Diagnostics**: Use the built-in testing and validation tools
3. **Community Support**: Join the HERA developer community
4. **Professional Support**: Contact the HERA platform team

### Contributing

To contribute improvements to this module:

1. **Fork the Repository**: Create your own copy
2. **Make Changes**: Update YAML, scripts, or documentation
3. **Test Thoroughly**: Run the complete test suite
4. **Submit Pull Request**: Include detailed description of changes

---

**Next Steps**: After successfully deploying and testing the Sales/Lead Management module, you can replicate this pattern for additional CRM modules:

1. **Customer Support Module**
2. **Marketing Automation Module**  
3. **Inventory Management Module**
4. **Project Management Module**
5. **Reporting & Analytics Module**

Each module will follow the same YAML-driven approach, using the established patterns and infrastructure demonstrated in this foundational module.