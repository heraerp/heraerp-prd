# HERA Chart of Accounts System - Complete Implementation Guide

## 🎯 Overview

The HERA Chart of Accounts (COA) System is a comprehensive, scalable solution for managing chart of accounts across multiple organizations, industries, and countries. Built on the Sacred Six architecture, it provides universal templates with industry and country-specific variations.

## 📋 Table of Contents

1. [System Architecture](#system-architecture)
2. [Components Overview](#components-overview)
3. [Installation Guide](#installation-guide)
4. [Usage Examples](#usage-examples)
5. [API Reference](#api-reference)
6. [Templates Reference](#templates-reference)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## 🏗️ System Architecture

### Sacred Six Foundation
```
Platform Organization (00000000-0000-0000-0000-000000000000)
├── Universal COA Template (80+ accounts)
├── Industry Templates (5 industries × 10-15 accounts each)
├── Country Templates (5 countries × 8-12 accounts each)
└── Template Entities (assignment framework)

Target Organizations
├── Assigned Templates (via relationships)
└── Copied COA (operational accounts)
```

### Data Flow
```
1. Templates Created → Platform Organization
2. Templates Assigned → Target Organization (relationships)
3. COA Copied → Target Organization (working accounts)
4. Customization → Organization-specific adjustments
```

## 🧩 Components Overview

### Core Scripts

| Script | Purpose | Status |
|--------|---------|--------|
| `create-platform-universal-coa.js` | Universal base COA template | ✅ Complete |
| `create-industry-coa-templates.js` | Industry-specific accounts | ✅ Complete |
| `create-country-localization-coa.js` | Country compliance accounts | ✅ Complete |
| `create-coa-assignment-system.js` | Template assignment framework | ✅ Complete |
| `test-coa-system-complete.js` | Comprehensive integration tests | ✅ Complete |
| `deploy-coa-system.js` | Production deployment orchestrator | ✅ Complete |

### Templates Included

**Universal Template (80+ accounts)**
- Assets: Cash, Receivables, Inventory, PPE
- Liabilities: Payables, Accruals, Deferred Revenue
- Equity: Share Capital, Retained Earnings
- Revenue: Service, Product, Subscription
- Expenses: COGS, Personnel, Operations

**Industry Templates**
- **Salon**: Beauty equipment, stylist commissions, treatment packages
- **Restaurant**: Kitchen equipment, food inventory, server tips
- **Telecom**: Network infrastructure, subscription revenue, agent commissions
- **Manufacturing**: Production equipment, manufacturing overhead, QA
- **Retail**: Merchandise inventory, store fixtures, visual merchandising

**Country Templates**
- **UAE**: VAT 5%, FTA compliance, Excise tax
- **India**: GST (CGST/SGST/IGST), TDS compliance, ROC requirements
- **USA**: Federal/State taxes, Sales tax, Payroll tax
- **UK**: VAT 20%, Corporation tax, PAYE integration
- **Generic**: Universal tax compliance for any jurisdiction

## 🚀 Installation Guide

### Prerequisites
```bash
# Environment Variables Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Node.js Dependencies
npm install @supabase/supabase-js dotenv
```

### Quick Start (Recommended)
```bash
# Navigate to MCP server directory
cd mcp-server

# Run complete deployment
node deploy-coa-system.js deploy

# Verify installation
node deploy-coa-system.js test
```

### Manual Step-by-Step Installation
```bash
# 1. Create Universal COA Template
node create-platform-universal-coa.js

# 2. Create Industry Templates
node create-industry-coa-templates.js

# 3. Create Country Templates
node create-country-localization-coa.js

# 4. Create Assignment System
node create-coa-assignment-system.js

# 5. Run Integration Tests
node test-coa-system-complete.js
```

### Deployment Options
```bash
# Production deployment
node deploy-coa-system.js deploy

# Dry run (preview changes)
node deploy-coa-system.js deploy --dry-run

# Force overwrite existing data
node deploy-coa-system.js deploy --force

# Skip tests for faster deployment
node deploy-coa-system.js deploy --no-tests

# Quiet mode (minimal output)
node deploy-coa-system.js deploy --quiet
```

## 💡 Usage Examples

### Basic Organization Setup

```javascript
const { assignCompleteCOA, copyCOAFromTemplates } = require('./create-coa-assignment-system.js');

// 1. Assign COA package to organization
await assignCompleteCOA('your-org-id', 'salon', 'uae', {
  actorUserId: 'user-id',
  reason: 'Initial COA setup for UAE salon'
});

// 2. Copy templates to working COA
await copyCOAFromTemplates('your-org-id', 'user-id');
```

### Advanced Assignment Scenarios

```javascript
// Multi-industry business (e.g., salon with retail)
await assignCompleteCOA('org-id', 'salon', 'uae');
await assignCOATemplate('org-id', 'industry', 'retail');

// International business (multiple countries)
await assignCompleteCOA('org-id', 'manufacturing', 'usa');
await assignCOATemplate('org-id', 'country', 'uk'); // Additional country

// Generic setup for new jurisdiction
await assignCompleteCOA('org-id', 'telecom', 'generic');
```

### Querying Assignments

```javascript
// Get all COA assignments for organization
const assignments = await getCOAAssignments('org-id');

console.log('Assigned Templates:');
assignments.forEach(assignment => {
  const data = assignment.relationship_data;
  console.log(`• ${data.template_type}: ${data.template_name}`);
});
```

## 📚 API Reference

### Core Functions

#### `assignCompleteCOA(organizationId, industry, country, options)`
Assigns a complete COA package (Universal + Industry + Country) to an organization.

**Parameters:**
- `organizationId` (string): Target organization ID
- `industry` (string): Industry type ('salon', 'restaurant', 'telecom', 'manufacturing', 'retail')
- `country` (string): Country code ('uae', 'india', 'usa', 'uk', 'generic')
- `options` (object): Additional options
  - `actorUserId` (string): User performing the assignment
  - `reason` (string): Assignment reason for audit trail
  - `autoAssigned` (boolean): Whether assignment was automatic

**Returns:** Array of assignment relationships

#### `copyCOAFromTemplates(organizationId, actorUserId)`
Copies COA from assigned templates to the organization for operational use.

**Parameters:**
- `organizationId` (string): Target organization ID
- `actorUserId` (string): User performing the copy

**Returns:** Object with copy statistics

#### `getCOAAssignments(organizationId)`
Retrieves all COA template assignments for an organization.

**Parameters:**
- `organizationId` (string): Organization ID to query

**Returns:** Array of assignment relationships with template details

### Template Creation Functions

#### `createUniversalCOA()`
Creates the universal base COA template in the platform organization.

#### `createAllIndustryTemplates()`
Creates all industry-specific COA templates.

#### `createAllCountryTemplates()`
Creates all country localization COA templates.

#### `createCOATemplateEntities()`
Creates the template entities for the assignment system.

## 📖 Templates Reference

### Account Code Structure

**Universal Accounts (Platform):**
```
1000000-1999999  Assets
2000000-2999999  Liabilities  
3000000-3999999  Equity
4000000-4999999  Revenue
5000000-6999999  Expenses
```

**Industry-Specific Accounts:**
```
Salon:         1350000-1360000 (Assets), 4150000-4170000 (Revenue)
Restaurant:    1370000-1390000 (Assets), 4180000-4350000 (Revenue)
Telecom:       1400000-1410000 (Assets), 4360000-4380000 (Revenue)
Manufacturing: 1420000-1430000 (Assets), 4390000 (Revenue)
Retail:        1440000-1450000 (Assets), 4400000-4450000 (Revenue)
```

**Country-Specific Accounts:**
```
UAE:     1250000-1260000 (VAT Assets), 2410000-2430000 (VAT Liabilities)
India:   1270000-1300000 (GST Assets), 2440000-2480000 (GST Liabilities)  
USA:     1310000-1330000 (Tax Assets), 2490000-2520000 (Tax Liabilities)
UK:      1340000-1350000 (Tax Assets), 2530000-2550000 (Tax Liabilities)
Generic: 1360000-1370000 (Tax Assets), 2560000-2580000 (Tax Liabilities)
```

### Smart Code Patterns

**Format:** `HERA.{CONTEXT}.FINANCE.GL.{TYPE}.{SUBTYPE}.{DETAIL}.v1`

**Examples:**
```
Universal:     HERA.PLATFORM.FINANCE.GL.ASSET.CASH.CONTROL.v1
Salon:         HERA.SALON.FINANCE.GL.REVENUE.HAIR.v1
UAE:           HERA.UAE.FINANCE.GL.LIABILITY.VAT.OUTPUT.v1
Assignment:    HERA.SALON.FINANCE.GL.TEMPLATE.INDUSTRY.v1
```

### Features by Template

**Salon Template Features:**
- Stylist commission tracking
- Beauty product inventory management
- Treatment package liability
- Tips management system
- Bridal services revenue tracking

**Restaurant Template Features:**
- Kitchen equipment depreciation
- Food and beverage inventory
- Server tips distribution
- Delivery platform integration
- Catering service revenue

**UAE Template Features:**
- VAT 5% compliance (Input/Output)
- FTA integration ready
- Excise tax support
- AED currency optimization
- Economic Substance Regulation compliance

**India Template Features:**
- GST compliance (CGST/SGST/IGST)
- TDS (Tax Deducted at Source) management
- ROC (Registrar of Companies) compliance
- Professional tax handling
- INR currency optimization

## 🐛 Troubleshooting

### Common Issues

#### 1. "Template not found" Error
```bash
# Verify templates exist
node -e "
const { supabase } = require('./create-coa-assignment-system.js');
supabase.from('core_entities')
  .select('entity_code, entity_name')
  .eq('organization_id', '00000000-0000-0000-0000-000000000000')
  .eq('entity_type', 'coa_template')
  .then(({data}) => console.log(data));
"

# Recreate templates if missing
node deploy-coa-system.js deploy --force
```

#### 2. "Duplicate account code" Error
```bash
# Check for existing accounts
node -e "
const { supabase } = require('./create-coa-assignment-system.js');
supabase.from('core_entities')
  .select('entity_code, count(*)')
  .eq('entity_type', 'gl_account')
  .group('entity_code')
  .having('count(*)', 'gt', 1)
  .then(({data}) => console.log('Duplicates:', data));
"
```

#### 3. "Organization not found" Error
```bash
# Verify organization exists
node -e "
const { supabase } = require('./create-coa-assignment-system.js');
supabase.from('core_entities')
  .select('id, entity_name')
  .eq('id', 'your-org-id')
  .then(({data}) => console.log(data));
"
```

#### 4. Permission Errors
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify the service role has necessary permissions
- Check RLS policies are not blocking operations

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* node your-script.js

# Check deployment logs
node deploy-coa-system.js deploy --verbose
```

### Database Integrity Check
```bash
# Run complete system test
node test-coa-system-complete.js

# Manual validation queries
node -e "
const { validateAccountStructure } = require('./test-coa-system-complete.js');
validateAccountStructure('universal', 'HERA.PLATFORM.FINANCE.GL.%')
  .then(result => console.log('Validation:', result));
"
```

## ⭐ Best Practices

### 1. Organization Onboarding Workflow

```javascript
async function onboardOrganization(orgId, industry, country, actorUserId) {
  try {
    // Step 1: Assign templates
    await assignCompleteCOA(orgId, industry, country, {
      actorUserId,
      reason: `Initial setup for ${industry} business in ${country}`
    });
    
    // Step 2: Copy COA
    await copyCOAFromTemplates(orgId, actorUserId);
    
    // Step 3: Customize as needed
    // Add organization-specific accounts here
    
    // Step 4: Set opening balances
    // Initialize account balances here
    
    console.log('Organization onboarded successfully');
  } catch (error) {
    console.error('Onboarding failed:', error);
    // Implement rollback logic here
  }
}
```

### 2. Multi-Industry Support

```javascript
// For businesses spanning multiple industries
async function setupMultiIndustryBusiness(orgId, industries, country, actorUserId) {
  // Always start with universal + primary industry
  await assignCompleteCOA(orgId, industries[0], country, { actorUserId });
  
  // Add additional industry templates
  for (let i = 1; i < industries.length; i++) {
    await assignCOATemplate(orgId, 'industry', industries[i], {
      actorUserId,
      reason: `Additional industry: ${industries[i]}`
    });
  }
  
  await copyCOAFromTemplates(orgId, actorUserId);
}
```

### 3. Template Customization

```javascript
// Add custom accounts after copying templates
async function addCustomAccounts(orgId, customAccounts, actorUserId) {
  for (const account of customAccounts) {
    await supabase.from('core_entities').insert({
      organization_id: orgId,
      entity_type: 'gl_account',
      entity_code: account.code,
      entity_name: account.name,
      smart_code: `HERA.CUSTOM.${account.type.toUpperCase()}.${account.code}.v1`,
      created_by: actorUserId,
      updated_by: actorUserId,
      status: 'active',
      metadata: {
        custom_account: true,
        ...account.metadata
      }
    });
  }
}
```

### 4. Maintenance Procedures

```javascript
// Regular maintenance tasks
async function performMaintenance() {
  // 1. Validate data integrity
  await runValidationChecks();
  
  // 2. Update template versions
  await updateTemplateVersions();
  
  // 3. Clean up orphaned data
  await cleanupOrphanedData();
  
  // 4. Generate compliance reports
  await generateComplianceReports();
}

// Schedule maintenance
// 0 2 * * 0 (Weekly on Sunday at 2 AM)
```

### 5. Performance Optimization

```javascript
// Batch operations for better performance
async function batchCopyAccounts(orgId, accountIds, actorUserId) {
  const batchSize = 50;
  
  for (let i = 0; i < accountIds.length; i += batchSize) {
    const batch = accountIds.slice(i, i + batchSize);
    await processBatch(batch, orgId, actorUserId);
  }
}
```

### 6. Backup and Recovery

```bash
# Backup COA templates
pg_dump --table=core_entities --table=core_dynamic_data \
  --where="organization_id='00000000-0000-0000-0000-000000000000'" \
  > coa-templates-backup.sql

# Restore from backup
psql < coa-templates-backup.sql
```

## 📊 Monitoring and Analytics

### Key Metrics to Track

1. **Template Usage**
   - Most assigned industries/countries
   - Assignment success rates
   - Copy completion rates

2. **Data Quality**
   - Duplicate account codes
   - Missing smart codes
   - Invalid relationships

3. **Performance**
   - Assignment completion time
   - Copy operation duration
   - Database query performance

### Monitoring Queries

```sql
-- Template assignment analytics
SELECT 
  r.relationship_data->>'template_type' as template_type,
  r.relationship_data->>'template_name' as template_name,
  COUNT(*) as usage_count
FROM core_relationships r
WHERE r.relationship_type = 'USES_COA_TEMPLATE'
  AND r.expiration_date IS NULL
GROUP BY template_type, template_name
ORDER BY usage_count DESC;

-- Data quality checks
SELECT 
  COUNT(*) FILTER (WHERE smart_code IS NULL) as missing_smart_codes,
  COUNT(*) FILTER (WHERE entity_code ~ '^[0-9]+$') as numeric_codes,
  COUNT(DISTINCT entity_code) as unique_codes,
  COUNT(*) as total_accounts
FROM core_entities 
WHERE entity_type = 'gl_account';
```

## 🔐 Security Considerations

### Access Control
- All operations require valid `actorUserId`
- Platform organization access restricted to system users
- Assignment operations logged with full audit trail

### Data Integrity
- Smart code validation enforced
- Account code uniqueness maintained
- Referential integrity via relationships

### Compliance
- All templates include IFRS mapping
- Country-specific regulatory requirements included
- Audit trail maintained for all operations

## 📞 Support

### Getting Help

1. **Documentation**: Check this README and inline code comments
2. **Testing**: Run `node test-coa-system-complete.js` for validation
3. **Logs**: Check deployment logs with `--verbose` flag
4. **Database**: Query directly using provided SQL examples

### Contributing

1. Follow existing code patterns and smart code conventions
2. Add comprehensive tests for new features
3. Update documentation for any changes
4. Ensure backward compatibility

### Version Information

- **Current Version**: 1.0.0
- **Last Updated**: 2024-11-15
- **Compatibility**: HERA Sacred Six v2.2+
- **Node.js**: 16.0.0+
- **Dependencies**: @supabase/supabase-js, dotenv

---

## ✨ Conclusion

The HERA Chart of Accounts System provides a robust, scalable foundation for managing financial data across diverse organizations, industries, and countries. By following this guide, you can successfully deploy and maintain a world-class COA infrastructure that grows with your business needs.

**🎉 Happy Accounting!**