#!/usr/bin/env node
/**
 * HERA System Organization Setup
 * Creates the master template organization with all standard patterns
 * This serves as the reference implementation for all HERA deployments
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupHeraSystemOrg() {
  console.log('\n🏛️ HERA System Organization Setup\n');
  console.log('Creating the master template organization with all universal patterns...\n');

  try {
    // Step 1: Create HERA System Organization
    console.log('1️⃣ Creating HERA System Organization...\n');
    
    const { data: systemOrg, error: orgError } = await supabase
      .from('core_organizations')
      .insert({
        organization_name: 'HERA Universal System',
        organization_code: 'HERA-SYSTEM-MASTER',
        organization_type: 'hera_system',
        industry_classification: 'universal_template',
        ai_insights: {
          purpose: 'Master template and reference implementation for all HERA patterns',
          features: [
            'Universal entity types catalog',
            'Standard dynamic fields registry',
            'Relationship patterns library',
            'Transaction templates repository',
            'Workflow status definitions',
            'Smart code registry'
          ]
        },
        ai_confidence: 1.0,
        ai_classification: 'SYSTEM',
        settings: {
          is_template: true,
          is_system_org: true,
          allow_cloning: true,
          version: '2.0'
        },
        status: 'active'
      })
      .select()
      .single();

    if (orgError) throw orgError;
    
    console.log(`✅ Created HERA System Organization: ${systemOrg.id}\n`);
    const orgId = systemOrg.id;

    // Step 2: Create Universal Entity Type Catalog
    console.log('2️⃣ Creating Universal Entity Type Catalog...\n');
    
    const entityTypes = [
      // Core Business Entities
      { code: 'CUSTOMER', name: 'Customer', category: 'business', smart: 'HERA.UNIV.CUST.TEMPLATE.v1' },
      { code: 'VENDOR', name: 'Vendor/Supplier', category: 'business', smart: 'HERA.UNIV.VEND.TEMPLATE.v1' },
      { code: 'PRODUCT', name: 'Product/Service', category: 'business', smart: 'HERA.UNIV.PROD.TEMPLATE.v1' },
      { code: 'EMPLOYEE', name: 'Employee/Staff', category: 'business', smart: 'HERA.UNIV.EMPL.TEMPLATE.v1' },
      { code: 'USER', name: 'System User', category: 'system', smart: 'HERA.UNIV.USER.TEMPLATE.v1' },
      
      // Financial Entities
      { code: 'GL_ACCOUNT', name: 'General Ledger Account', category: 'financial', smart: 'HERA.FIN.GL.TEMPLATE.v1' },
      { code: 'COST_CENTER', name: 'Cost Center', category: 'financial', smart: 'HERA.FIN.CC.TEMPLATE.v1' },
      { code: 'BUDGET', name: 'Budget', category: 'financial', smart: 'HERA.FIN.BUDGET.TEMPLATE.v1' },
      
      // Workflow Entities
      { code: 'WORKFLOW_STATUS', name: 'Workflow Status', category: 'workflow', smart: 'HERA.WF.STATUS.TEMPLATE.v1' },
      { code: 'APPROVAL_LEVEL', name: 'Approval Level', category: 'workflow', smart: 'HERA.WF.APPROVAL.TEMPLATE.v1' },
      
      // Location/Asset Entities
      { code: 'LOCATION', name: 'Location/Branch', category: 'asset', smart: 'HERA.LOC.SITE.TEMPLATE.v1' },
      { code: 'WAREHOUSE', name: 'Warehouse', category: 'asset', smart: 'HERA.LOC.WH.TEMPLATE.v1' },
      { code: 'ASSET', name: 'Fixed Asset', category: 'asset', smart: 'HERA.ASSET.FIXED.TEMPLATE.v1' },
      
      // Project/Task Entities
      { code: 'PROJECT', name: 'Project', category: 'project', smart: 'HERA.PROJ.MAIN.TEMPLATE.v1' },
      { code: 'TASK', name: 'Task/Activity', category: 'project', smart: 'HERA.PROJ.TASK.TEMPLATE.v1' },
      { code: 'DEVELOPMENT_TASK', name: 'Development Task', category: 'project', smart: 'HERA.DEV.TASK.TEMPLATE.v1' }
    ];

    for (const entityType of entityTypes) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'entity_type_definition',
          entity_name: entityType.name,
          entity_code: `ET-${entityType.code}`,
          entity_description: `Universal template for ${entityType.name} entities`,
          smart_code: entityType.smart,
          metadata: {
            category: entityType.category,
            is_template: true,
            usage_count: 0,
            standard_fields: []
          },
          ai_confidence: 1.0,
          ai_classification: 'TEMPLATE',
          status: 'active'
        })
        .select();

      if (!error) {
        console.log(`  ✅ Created entity type: ${entityType.name}`);
      }
    }

    // Step 3: Create Standard Dynamic Fields Registry
    console.log('\n3️⃣ Creating Standard Dynamic Fields Registry...\n');
    
    const standardFields = [
      // Contact Fields
      { name: 'email', type: 'text', category: 'contact', validation: 'email' },
      { name: 'phone', type: 'text', category: 'contact', validation: 'phone' },
      { name: 'mobile', type: 'text', category: 'contact', validation: 'phone' },
      { name: 'fax', type: 'text', category: 'contact', validation: 'phone' },
      { name: 'website', type: 'text', category: 'contact', validation: 'url' },
      
      // Address Fields
      { name: 'address_line_1', type: 'text', category: 'address' },
      { name: 'address_line_2', type: 'text', category: 'address' },
      { name: 'city', type: 'text', category: 'address' },
      { name: 'state', type: 'text', category: 'address' },
      { name: 'postal_code', type: 'text', category: 'address' },
      { name: 'country', type: 'text', category: 'address' },
      
      // Financial Fields
      { name: 'credit_limit', type: 'number', category: 'financial' },
      { name: 'payment_terms', type: 'text', category: 'financial' },
      { name: 'tax_id', type: 'text', category: 'financial' },
      { name: 'bank_account', type: 'text', category: 'financial' },
      { name: 'currency', type: 'text', category: 'financial', default: 'USD' },
      
      // Classification Fields
      { name: 'category', type: 'text', category: 'classification' },
      { name: 'subcategory', type: 'text', category: 'classification' },
      { name: 'tags', type: 'json', category: 'classification' },
      { name: 'priority', type: 'text', category: 'classification' },
      
      // Operational Fields
      { name: 'start_date', type: 'date', category: 'operational' },
      { name: 'end_date', type: 'date', category: 'operational' },
      { name: 'due_date', type: 'date', category: 'operational' },
      { name: 'completion_percentage', type: 'number', category: 'operational' }
    ];

    for (const field of standardFields) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'field_definition',
          entity_name: `Field: ${field.name}`,
          entity_code: `FIELD-${field.name.toUpperCase()}`,
          smart_code: `HERA.FIELD.${field.category.toUpperCase()}.${field.name.toUpperCase()}.v1`,
          metadata: {
            field_type: field.type,
            category: field.category,
            validation: field.validation || null,
            default_value: field.default || null,
            is_standard: true
          },
          ai_confidence: 1.0,
          status: 'active'
        })
        .select();

      if (!error) {
        console.log(`  ✅ Registered field: ${field.name} (${field.type})`);
      }
    }

    // Step 4: Create Standard Workflow Statuses
    console.log('\n4️⃣ Creating Standard Workflow Statuses...\n');
    
    const workflowStatuses = [
      { code: 'DRAFT', name: 'Draft', order: 1, color: '#94a3b8' },
      { code: 'PENDING', name: 'Pending', order: 2, color: '#f59e0b' },
      { code: 'IN_PROGRESS', name: 'In Progress', order: 3, color: '#3b82f6' },
      { code: 'UNDER_REVIEW', name: 'Under Review', order: 4, color: '#8b5cf6' },
      { code: 'APPROVED', name: 'Approved', order: 5, color: '#10b981' },
      { code: 'REJECTED', name: 'Rejected', order: 6, color: '#ef4444' },
      { code: 'COMPLETED', name: 'Completed', order: 7, color: '#22c55e' },
      { code: 'CANCELLED', name: 'Cancelled', order: 8, color: '#6b7280' },
      { code: 'ON_HOLD', name: 'On Hold', order: 9, color: '#f97316' },
      { code: 'ARCHIVED', name: 'Archived', order: 10, color: '#64748b' }
    ];

    const statusIds = {};
    
    for (const status of workflowStatuses) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'workflow_status',
          entity_name: status.name,
          entity_code: `STATUS-${status.code}`,
          smart_code: `HERA.WF.STATUS.${status.code}.v1`,
          metadata: {
            display_order: status.order,
            color_code: status.color,
            is_terminal: ['COMPLETED', 'REJECTED', 'CANCELLED', 'ARCHIVED'].includes(status.code),
            is_initial: status.code === 'DRAFT',
            allow_skip: false
          },
          ai_confidence: 1.0,
          status: 'active'
        })
        .select()
        .single();

      if (!error) {
        statusIds[status.code] = data.id;
        console.log(`  ✅ Created status: ${status.name}`);
      }
    }

    // Step 5: Create Standard Relationship Types
    console.log('\n5️⃣ Creating Standard Relationship Types...\n');
    
    const relationshipTypes = [
      // Status Relationships
      { code: 'HAS_STATUS', name: 'Has Status', category: 'workflow' },
      { code: 'PREVIOUS_STATUS', name: 'Previous Status', category: 'workflow' },
      
      // Hierarchical Relationships
      { code: 'PARENT_OF', name: 'Parent Of', category: 'hierarchy' },
      { code: 'CHILD_OF', name: 'Child Of', category: 'hierarchy' },
      { code: 'REPORTS_TO', name: 'Reports To', category: 'hierarchy' },
      
      // Business Relationships
      { code: 'CUSTOMER_OF', name: 'Customer Of', category: 'business' },
      { code: 'VENDOR_OF', name: 'Vendor Of', category: 'business' },
      { code: 'OWNS', name: 'Owns', category: 'business' },
      { code: 'MANAGES', name: 'Manages', category: 'business' },
      
      // Reference Relationships
      { code: 'REFERS_TO', name: 'Refers To', category: 'reference' },
      { code: 'RELATED_TO', name: 'Related To', category: 'reference' },
      { code: 'DEPENDS_ON', name: 'Depends On', category: 'reference' },
      
      // Approval Relationships
      { code: 'APPROVED_BY', name: 'Approved By', category: 'approval' },
      { code: 'SUBMITTED_TO', name: 'Submitted To', category: 'approval' },
      { code: 'ASSIGNED_TO', name: 'Assigned To', category: 'approval' }
    ];

    for (const relType of relationshipTypes) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'relationship_type',
          entity_name: relType.name,
          entity_code: `REL-${relType.code}`,
          smart_code: `HERA.REL.${relType.category.toUpperCase()}.${relType.code}.v1`,
          metadata: {
            category: relType.category,
            is_bidirectional: false,
            cardinality: 'many-to-many',
            is_standard: true
          },
          ai_confidence: 1.0,
          status: 'active'
        })
        .select();

      if (!error) {
        console.log(`  ✅ Created relationship type: ${relType.name}`);
      }
    }

    // Step 6: Create Standard Transaction Types
    console.log('\n6️⃣ Creating Standard Transaction Types...\n');
    
    const transactionTypes = [
      // Sales Transactions
      { code: 'SALE', name: 'Sale', category: 'revenue' },
      { code: 'SALE_RETURN', name: 'Sale Return', category: 'revenue' },
      { code: 'QUOTATION', name: 'Quotation', category: 'revenue' },
      { code: 'SALES_ORDER', name: 'Sales Order', category: 'revenue' },
      
      // Purchase Transactions
      { code: 'PURCHASE', name: 'Purchase', category: 'expense' },
      { code: 'PURCHASE_RETURN', name: 'Purchase Return', category: 'expense' },
      { code: 'PURCHASE_ORDER', name: 'Purchase Order', category: 'expense' },
      
      // Payment Transactions
      { code: 'PAYMENT', name: 'Payment', category: 'financial' },
      { code: 'RECEIPT', name: 'Receipt', category: 'financial' },
      { code: 'TRANSFER', name: 'Transfer', category: 'financial' },
      
      // Accounting Transactions
      { code: 'JOURNAL_ENTRY', name: 'Journal Entry', category: 'accounting' },
      { code: 'ADJUSTMENT', name: 'Adjustment', category: 'accounting' },
      
      // Inventory Transactions
      { code: 'STOCK_IN', name: 'Stock In', category: 'inventory' },
      { code: 'STOCK_OUT', name: 'Stock Out', category: 'inventory' },
      { code: 'STOCK_TRANSFER', name: 'Stock Transfer', category: 'inventory' },
      { code: 'STOCK_ADJUSTMENT', name: 'Stock Adjustment', category: 'inventory' }
    ];

    for (const txType of transactionTypes) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'transaction_type',
          entity_name: txType.name,
          entity_code: `TXN-${txType.code}`,
          smart_code: `HERA.TXN.${txType.category.toUpperCase()}.${txType.code}.v1`,
          metadata: {
            category: txType.category,
            requires_approval: ['PURCHASE_ORDER', 'SALES_ORDER', 'JOURNAL_ENTRY'].includes(txType.code),
            affects_inventory: txType.category === 'inventory',
            affects_accounting: ['revenue', 'expense', 'financial', 'accounting'].includes(txType.category),
            is_standard: true
          },
          ai_confidence: 1.0,
          status: 'active'
        })
        .select();

      if (!error) {
        console.log(`  ✅ Created transaction type: ${txType.name}`);
      }
    }

    // Step 7: Create Sample Workflow Transition Rules
    console.log('\n7️⃣ Creating Workflow Transition Rules...\n');
    
    const transitions = [
      { from: 'DRAFT', to: 'PENDING', name: 'Submit for Review' },
      { from: 'PENDING', to: 'IN_PROGRESS', name: 'Start Processing' },
      { from: 'PENDING', to: 'REJECTED', name: 'Reject' },
      { from: 'IN_PROGRESS', to: 'UNDER_REVIEW', name: 'Submit for Review' },
      { from: 'UNDER_REVIEW', to: 'APPROVED', name: 'Approve' },
      { from: 'UNDER_REVIEW', to: 'REJECTED', name: 'Reject' },
      { from: 'APPROVED', to: 'COMPLETED', name: 'Complete' },
      { from: '*', to: 'CANCELLED', name: 'Cancel' },
      { from: 'COMPLETED', to: 'ARCHIVED', name: 'Archive' }
    ];

    for (const transition of transitions) {
      if (statusIds[transition.from] && statusIds[transition.to]) {
        const { error } = await supabase
          .from('core_relationships')
          .insert({
            organization_id: orgId,
            from_entity_id: statusIds[transition.from],
            to_entity_id: statusIds[transition.to],
            relationship_type: 'can_transition_to',
            relationship_direction: 'forward',
            smart_code: `HERA.WF.TRANSITION.${transition.from}_TO_${transition.to}.v1`,
            metadata: {
              transition_name: transition.name,
              requires_comment: ['REJECTED', 'CANCELLED'].includes(transition.to),
              is_standard: true
            }
          });

        if (!error) {
          console.log(`  ✅ Created transition: ${transition.from} → ${transition.to}`);
        }
      }
    }

    // Step 8: Create Master Smart Code Registry
    console.log('\n8️⃣ Creating Smart Code Registry...\n');
    
    const smartCodePatterns = [
      { pattern: 'HERA.{INDUSTRY}.{MODULE}.{FUNCTION}.{TYPE}.v{VERSION}', name: 'Standard Pattern' },
      { pattern: 'HERA.UNIV.{TYPE}.TEMPLATE.v1', name: 'Universal Template' },
      { pattern: 'HERA.WF.{ACTION}.{DETAIL}.v1', name: 'Workflow Pattern' },
      { pattern: 'HERA.FIN.{MODULE}.{ACTION}.v1', name: 'Financial Pattern' },
      { pattern: 'HERA.REL.{CATEGORY}.{TYPE}.v1', name: 'Relationship Pattern' }
    ];

    for (const pattern of smartCodePatterns) {
      const { error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'smart_code_pattern',
          entity_name: pattern.name,
          entity_code: `PATTERN-${pattern.name.replace(/\s+/g, '_').toUpperCase()}`,
          smart_code: 'HERA.SYSTEM.PATTERN.REGISTRY.v1',
          metadata: {
            pattern: pattern.pattern,
            description: `Template for ${pattern.name}`,
            examples: [],
            is_active: true
          },
          ai_confidence: 1.0,
          status: 'active'
        })
        .select();

      if (!error) {
        console.log(`  ✅ Registered pattern: ${pattern.name}`);
      }
    }

    // Final Summary
    console.log('\n✅ HERA System Organization Setup Complete!\n');
    console.log(`Organization ID: ${orgId}`);
    console.log('\nThis organization now contains:');
    console.log('  • Universal entity type catalog');
    console.log('  • Standard dynamic fields registry');
    console.log('  • Workflow status definitions');
    console.log('  • Relationship type library');
    console.log('  • Transaction type templates');
    console.log('  • Smart code patterns');
    console.log('\n🎯 Use this as the template for all new organizations!');
    
    // Update .env suggestion
    console.log('\n💡 To use this as your default organization:');
    console.log(`   Update .env: DEFAULT_ORGANIZATION_ID=${orgId}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the setup
setupHeraSystemOrg();