#!/usr/bin/env node
/**
 * HERA MCP Server with SACRED UNIVERSAL RULES
 * 
 * This server enforces the SACRED HERA principles:
 * 1. SACRED organization_id filtering (NEVER VIOLATE)
 * 2. NEVER ALTER SCHEMA (Use Dynamic Fields)
 * 3. Universal Patterns Only (No Business-Specific Logic)
 * 4. AI-Native Fields Built-In (Not Separate)
 * 5. Smart Code Intelligence (Required)
 */

require('dotenv').config();

// Import authorization tools
const { 
  getAuthorizationTools, 
  getAuthorizationHandlers, 
  validateHeraAuthRules 
} = require('./hera-mcp-auth-tools');

// Import build police tools
const {
  getBuildPoliceTools,
  getBuildPoliceHandlers,
  architecturePolice,
  HERA_FORMULA
} = require('./hera-build-police');

// Import master verification tools
const {
  getMasterVerificationTools,
  getMasterVerificationHandlers
} = require('./hera-master-verification');

// ==========================================
// 🛡️ SACRED VALIDATION GUARDS
// ==========================================

/**
 * SACRED RULE #1: Validate organization_id is always present
 */
const validateOrganizationId = (organizationId) => {
  if (!organizationId || typeof organizationId !== 'string' || organizationId.trim() === '') {
    throw new Error('🔥 SACRED VIOLATION: organization_id is required for ALL operations. Multi-tenant isolation is non-negotiable.');
  }
  return organizationId.trim();
};

/**
 * SACRED RULE #2: Ensure only universal tables are used
 */
const validateUniversalTable = (tableName) => {
  const SACRED_TABLES = [
    'core_organizations',
    'core_entities', 
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ];
  
  if (!SACRED_TABLES.includes(tableName)) {
    throw new Error(`🔥 UNIVERSAL VIOLATION: Only the sacred 6 tables allowed. Attempted: ${tableName}. Valid tables: ${SACRED_TABLES.join(', ')}`);
  }
  return tableName;
};

/**
 * SACRED RULE #3: Generate Smart Codes for all operations
 */
const generateSmartCode = (type, context = {}) => {
  // Industry mapping
  const industry = context.industry || detectIndustry(type) || 'UNIV';
  
  // Domain mapping based on entity/transaction type
  const domainMap = {
    // Entities
    'customer': 'CUST',
    'vendor': 'VEND',
    'product': 'PROD',
    'employee': 'EMPL',
    'account': 'ACCT',
    'menu_item': 'MENU',
    'patient': 'PAT',
    'location': 'LOC',
    'project': 'PROJ',
    'development_task': 'DEV',
    'user': 'USER',
    'ai_agent': 'AI',
    
    // Transactions
    'sale': 'SALE',
    'purchase': 'PURCH',
    'payment': 'PAY',
    'transfer': 'XFER',
    'journal_entry': 'JE',
    'order': 'ORDER',
    'invoice': 'INV',
    'receipt': 'RCPT'
  };
  
  const domain = domainMap[type] || 'ENT';
  const operation = context.operation || 'CREATE';
  const version = context.version || 1;
  
  return `HERA.${industry}.${domain}.${operation}.v${version}`;
};

/**
 * Detect industry from entity type
 */
const detectIndustry = (type) => {
  const industryMap = {
    'menu_item': 'REST',
    'patient': 'HLTH',
    'bom_component': 'MFG',
    'account': 'FIN',
    'development_task': 'TECH'
  };
  return industryMap[type] || 'UNIV';
};

/**
 * SACRED RULE #4: Validate and enforce Smart Code format
 */
const validateSmartCode = (smartCode) => {
  if (!smartCode || !smartCode.startsWith('HERA.')) {
    throw new Error(`🔥 SMART CODE VIOLATION: All codes must start with 'HERA.' Got: ${smartCode}`);
  }
  
  // Validate format: HERA.INDUSTRY.MODULE.FUNCTION.TYPE.vVERSION
  const pattern = /^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/;
  if (!pattern.test(smartCode)) {
    console.warn(`⚠️ Smart Code format warning: ${smartCode} doesn't match standard pattern`);
  }
  
  return smartCode;
};

/**
 * SACRED RULE #5: Add AI-native fields to all entities
 */
const enrichWithAI = (data, confidence = 0.95) => {
  return {
    ...data,
    ai_confidence: confidence,
    ai_classification: data.smart_code?.split('.')[1] || 'UNIV',
    ai_last_analysis: new Date().toISOString(),
    metadata: {
      ...data.metadata,
      ai_enhanced: true,
      ai_version: '1.0'
    }
  };
};

/**
 * Validate entity type is universal (not business-specific)
 */
const validateEntityType = (entityType) => {
  // These are universal patterns that work for any business
  const UNIVERSAL_TYPES = [
    'customer', 'vendor', 'product', 'employee', 'user',
    'location', 'project', 'account', 'document',
    'task', 'asset', 'service', 'contract', 'policy',
    'menu_item', 'patient', 'student', 'member', 'partner'
  ];
  
  // Warn if using non-standard type
  if (!UNIVERSAL_TYPES.includes(entityType)) {
    console.warn(`⚠️ Non-standard entity type: ${entityType}. Consider using a universal type.`);
  }
  
  return entityType;
};

/**
 * Validate transaction type is universal
 */
const validateTransactionType = (transactionType) => {
  const UNIVERSAL_TYPES = [
    'sale', 'purchase', 'payment', 'receipt', 'transfer',
    'journal_entry', 'adjustment', 'order', 'invoice',
    'credit_note', 'debit_note', 'refund', 'allocation'
  ];
  
  if (!UNIVERSAL_TYPES.includes(transactionType)) {
    console.warn(`⚠️ Non-standard transaction type: ${transactionType}. Consider using a universal type.`);
  }
  
  return transactionType;
};

// ==========================================
// 🚀 HERA MCP SERVER IMPLEMENTATION
// ==========================================

async function startServer() {
  // Dynamic imports for ES modules
  const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const { createClient } = await import('@supabase/supabase-js');

  // Initialize Supabase client with service role for full access
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  // Initialize admin client for user creation (same client with service role)
  const supabaseAdmin = supabase;

  // Sacred organization context - MUST be set
  let currentOrganizationId = validateOrganizationId(
    process.env.DEFAULT_ORGANIZATION_ID || 'hera_software_inc'
  );

  // Get authorization tools and handlers
  const authTools = getAuthorizationTools(supabase, supabaseAdmin);
  const authHandlers = getAuthorizationHandlers(supabase, supabaseAdmin);

  // Get build police tools and handlers
  const buildPoliceTools = getBuildPoliceTools();
  const buildPoliceHandlers = getBuildPoliceHandlers(supabase);

  // Get master verification tools and handlers
  const masterVerificationTools = getMasterVerificationTools();
  const masterVerificationHandlers = getMasterVerificationHandlers(supabase);

  /**
   * HERA MCP Server with SACRED Rules Enforcement
   */
  class HeraMcpServer {
    constructor() {
      this.server = new Server(
        {
          name: "hera-universal-sacred",
          version: "2.0.0",
        },
        {
          capabilities: {
            tools: {},
            resources: {},
          },
        }
      );

      this.setupTools();
      this.setupResources();
    }

    setupTools() {
      // Tool list with SACRED validation
      this.server.setRequestHandler("tools/list", async () => {
        return {
          tools: [
            {
              name: "create-entity",
              description: "Create a universal business entity with SACRED rules enforcement",
              inputSchema: {
                type: "object",
                properties: {
                  entity_type: { 
                    type: "string", 
                    description: "Universal entity type (customer, product, etc.)" 
                  },
                  entity_name: { 
                    type: "string", 
                    description: "Name of the entity" 
                  },
                  entity_code: { 
                    type: "string", 
                    description: "Unique code (optional, auto-generated if not provided)" 
                  },
                  metadata: { 
                    type: "object", 
                    description: "Additional universal metadata" 
                  },
                  organization_id: {
                    type: "string",
                    description: "SACRED: Organization ID for multi-tenant isolation"
                  }
                },
                required: ["entity_type", "entity_name"]
              }
            },
            {
              name: "create-transaction",
              description: "Create a universal transaction with SACRED validation",
              inputSchema: {
                type: "object",
                properties: {
                  transaction_type: { 
                    type: "string",
                    description: "Universal transaction type (sale, purchase, payment, etc.)"
                  },
                  total_amount: { 
                    type: "number",
                    description: "Total transaction amount"
                  },
                  reference_entity_id: {
                    type: "string",
                    description: "Reference to related entity (customer, vendor, etc.)"
                  },
                  line_items: { 
                    type: "array",
                    description: "Transaction line items",
                    items: {
                      type: "object",
                      properties: {
                        entity_id: { type: "string" },
                        quantity: { type: "number" },
                        unit_price: { type: "number" }
                      }
                    }
                  },
                  organization_id: {
                    type: "string",
                    description: "SACRED: Organization ID for multi-tenant isolation"
                  }
                },
                required: ["transaction_type"]
              }
            },
            {
              name: "set-dynamic-field",
              description: "Set dynamic field (NEVER alter schema)",
              inputSchema: {
                type: "object",
                properties: {
                  entity_id: { type: "string" },
                  field_name: { type: "string" },
                  field_value: { type: ["string", "number", "boolean"] },
                  field_type: { 
                    type: "string", 
                    enum: ["text", "number", "boolean", "date", "json"] 
                  },
                  organization_id: {
                    type: "string",
                    description: "SACRED: Organization ID"
                  }
                },
                required: ["entity_id", "field_name", "field_value"]
              }
            },
            {
              name: "create-relationship",
              description: "Create universal relationship with validation",
              inputSchema: {
                type: "object",
                properties: {
                  parent_entity_id: { type: "string" },
                  child_entity_id: { type: "string" },
                  relationship_type: { type: "string" },
                  metadata: { type: "object" },
                  organization_id: {
                    type: "string",
                    description: "SACRED: Organization ID"
                  }
                },
                required: ["parent_entity_id", "child_entity_id", "relationship_type"]
              }
            },
            {
              name: "query-universal",
              description: "Query SACRED 6 tables with enforced filtering",
              inputSchema: {
                type: "object",
                properties: {
                  table: { 
                    type: "string",
                    enum: [
                      "core_organizations",
                      "core_entities",
                      "core_dynamic_data",
                      "core_relationships",
                      "universal_transactions",
                      "universal_transaction_lines"
                    ]
                  },
                  filters: { type: "object" },
                  limit: { type: "number", default: 50 },
                  organization_id: {
                    type: "string",
                    description: "SACRED: Organization ID (required for all tables except core_organizations)"
                  }
                },
                required: ["table"]
              }
            },
            // Add authorization tools
            ...authTools,
            // Add build police tools
            ...buildPoliceTools,
            // Add master verification tools
            ...masterVerificationTools
          ]
        };
      });

      // Tool execution with SACRED enforcement
      this.server.setRequestHandler("tools/call", async (request) => {
        const { name, arguments: args } = request.params || {};
        
        if (!name) {
          return { 
            content: [{ 
              type: "text", 
              text: "❌ Error: Tool name is required" 
            }] 
          };
        }

        try {
          // SACRED: Use provided org_id or fall back to current context
          const orgId = validateOrganizationId(args.organization_id || currentOrganizationId);

          // 🛡️ REAL-TIME ARCHITECTURE POLICE ENFORCEMENT
          const architectureViolations = await architecturePolice.checkSacredRules(supabase, {
            ...args,
            organization_id: orgId,
            operation: name,
            table: name.includes('query') ? args.table : 'core_entities'
          });

          // Block operation if critical violations found
          const criticalViolations = architectureViolations.filter(v => v.severity === 'CRITICAL');
          if (criticalViolations.length > 0) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  success: false,
                  blocked: true,
                  message: "🚨 OPERATION BLOCKED - SACRED RULE VIOLATIONS",
                  violations: criticalViolations,
                  enforcement: "Real-time HERA architecture protection active"
                }, null, 2)
              }]
            };
          }

          if (name === "create-entity") {
            // Validate entity type is universal
            const entityType = validateEntityType(args.entity_type);
            
            // Generate Smart Code
            const smartCode = args.smart_code || generateSmartCode(entityType, {
              operation: 'CREATE'
            });
            validateSmartCode(smartCode);
            
            // Build entity data with AI enrichment
            let entityData = {
              organization_id: orgId, // SACRED
              entity_type: entityType,
              entity_name: args.entity_name,
              entity_code: args.entity_code || `${entityType.toUpperCase()}-${Date.now()}`,
              smart_code: smartCode,
              metadata: args.metadata || {},
              status: 'active',
              created_at: new Date().toISOString()
            };
            
            // Enrich with AI fields
            entityData = enrichWithAI(entityData);
            
            const { data, error } = await supabase
              .from('core_entities')
              .insert(entityData)
              .select()
              .single();

            if (error) {
              return { 
                content: [{ 
                  type: "text", 
                  text: `❌ Error creating entity: ${error.message}` 
                }] 
              };
            }
            
            return { 
              content: [{ 
                type: "text", 
                text: JSON.stringify({ 
                  success: true,
                  message: "✅ Entity created with SACRED rules enforced",
                  entity: data 
                }, null, 2) 
              }] 
            };
          }

          if (name === "create-transaction") {
            // Validate transaction type
            const txType = validateTransactionType(args.transaction_type);
            
            // Generate Smart Code for transaction
            const smartCode = generateSmartCode(txType, {
              operation: 'TXN'
            });
            validateSmartCode(smartCode);
            
            // Create transaction header with AI enrichment
            let txData = {
              organization_id: orgId, // SACRED
              transaction_type: txType,
              transaction_date: new Date().toISOString(),
              transaction_number: `TXN-${Date.now()}`,
              smart_code: smartCode,
              total_amount: args.total_amount || 0,
              reference_entity_id: args.reference_entity_id,
              status: 'pending',
              metadata: args.metadata || {}
            };
            
            txData = enrichWithAI(txData, 0.98);
            
            const { data: transaction, error: txError } = await supabase
              .from('universal_transactions')
              .insert(txData)
              .select()
              .single();

            if (txError) {
              return { 
                content: [{ 
                  type: "text", 
                  text: `❌ Transaction error: ${txError.message}` 
                }] 
              };
            }

            // Create transaction lines if provided
            let lineCount = 0;
            if (args.line_items && args.line_items.length > 0) {
              const lines = args.line_items.map((item, index) => ({
                transaction_id: transaction.id,
                organization_id: orgId, // SACRED - even lines need org_id
                line_number: index + 1,
                line_entity_id: item.entity_id,
                quantity: item.quantity || 1,
                unit_price: item.unit_price || 0,
                line_amount: (item.quantity || 1) * (item.unit_price || 0),
                smart_code: generateSmartCode(txType, { operation: 'LINE' }),
                metadata: item.metadata || {}
              }));

              const { error: lineError } = await supabase
                .from('universal_transaction_lines')
                .insert(lines);

              if (!lineError) {
                lineCount = lines.length;
              }
            }

            return { 
              content: [{ 
                type: "text", 
                text: JSON.stringify({ 
                  success: true,
                  message: "✅ Transaction created with SACRED validation",
                  transaction,
                  line_count: lineCount 
                }, null, 2) 
              }] 
            };
          }

          if (name === "set-dynamic-field") {
            // SACRED: Never alter schema, use dynamic fields
            const fieldData = {
              entity_id: args.entity_id,
              field_name: args.field_name,
              organization_id: orgId, // SACRED
              smart_code: generateSmartCode('field', { operation: 'DYN' }),
              metadata: {
                set_at: new Date().toISOString(),
                set_by: 'mcp_server'
              }
            };

            // Set appropriate field based on type
            const fieldType = args.field_type || 'text';
            if (fieldType === 'number') {
              fieldData.field_value_number = Number(args.field_value);
            } else if (fieldType === 'boolean') {
              fieldData.field_value_boolean = Boolean(args.field_value);
            } else if (fieldType === 'date') {
              fieldData.field_value_date = args.field_value;
            } else if (fieldType === 'json') {
              fieldData.field_value_json = args.field_value;
            } else {
              fieldData.field_value_text = String(args.field_value);
            }

            const { data, error } = await supabase
              .from('core_dynamic_data')
              .upsert(fieldData, {
                onConflict: 'entity_id,field_name,organization_id'
              })
              .select()
              .single();

            if (error) {
              return { 
                content: [{ 
                  type: "text", 
                  text: `❌ Dynamic field error: ${error.message}` 
                }] 
              };
            }
            
            return { 
              content: [{ 
                type: "text", 
                text: JSON.stringify({ 
                  success: true,
                  message: "✅ Dynamic field set (schema unchanged)",
                  field: data 
                }, null, 2) 
              }] 
            };
          }

          if (name === "create-relationship") {
            const smartCode = generateSmartCode('relationship', {
              operation: 'REL'
            });
            
            const relData = {
              organization_id: orgId, // SACRED
              parent_entity_id: args.parent_entity_id,
              child_entity_id: args.child_entity_id,
              relationship_type: args.relationship_type,
              smart_code: smartCode,
              metadata: args.metadata || {},
              status: 'active',
              created_at: new Date().toISOString()
            };
            
            const { data, error } = await supabase
              .from('core_relationships')
              .insert(relData)
              .select()
              .single();

            if (error) {
              return { 
                content: [{ 
                  type: "text", 
                  text: `❌ Relationship error: ${error.message}` 
                }] 
              };
            }
            
            return { 
              content: [{ 
                  type: "text", 
                text: JSON.stringify({ 
                  success: true,
                  message: "✅ Relationship created with validation",
                  relationship: data 
                }, null, 2) 
              }] 
            };
          }

          if (name === "query-universal") {
            // Validate table is one of the SACRED 6
            const table = validateUniversalTable(args.table);
            
            let query = supabase.from(table).select('*');
            
            // SACRED: Always filter by organization_id (except for core_organizations)
            if (table !== 'core_organizations') {
              const queryOrgId = args.organization_id || currentOrganizationId;
              validateOrganizationId(queryOrgId);
              query = query.eq('organization_id', queryOrgId);
            }

            // Apply additional filters
            if (args.filters) {
              Object.entries(args.filters).forEach(([key, value]) => {
                query = query.eq(key, value);
              });
            }

            query = query.limit(args.limit || 50);

            const { data, error } = await query;
            
            if (error) {
              return { 
                content: [{ 
                  type: "text", 
                  text: `❌ Query error: ${error.message}` 
                }] 
              };
            }
            
            return { 
              content: [{ 
                type: "text", 
                text: JSON.stringify({ 
                  success: true,
                  message: `✅ Query executed with SACRED filtering`,
                  table,
                  organization_filter: table !== 'core_organizations' ? (args.organization_id || currentOrganizationId) : 'N/A',
                  count: data.length,
                  data 
                }, null, 2) 
              }] 
            };
          }

          // Check authorization tools
          if (authHandlers[name]) {
            const result = await authHandlers[name](args);
            return { 
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2) 
              }] 
            };
          }

          // Check build police tools
          if (buildPoliceHandlers[name]) {
            const result = await buildPoliceHandlers[name](args);
            return { 
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2) 
              }] 
            };
          }

          // Check master verification tools
          if (masterVerificationHandlers[name]) {
            const result = await masterVerificationHandlers[name](args);
            return { 
              content: [{ 
                type: "text", 
                text: JSON.stringify(result, null, 2) 
              }] 
            };
          }

          return { 
            content: [{ 
              type: "text", 
              text: `❌ Unknown tool: ${name}` 
            }] 
          };
          
        } catch (error) {
          // SACRED violations are critical - log and return error
          console.error('🔥 SACRED VIOLATION:', error.message);
          return { 
            content: [{ 
              type: "text", 
              text: `🔥 SACRED VIOLATION: ${error.message}` 
            }] 
          };
        }
      });
    }

    setupResources() {
      // Resource list
      this.server.setRequestHandler("resources/list", async () => {
        return {
          resources: [
            {
              uri: "hera://schema/universal",
              name: "HERA Universal Schema (SACRED 6 Tables)",
              description: "The complete 6-table universal architecture",
              mimeType: "application/json"
            },
            {
              uri: "hera://rules/sacred",
              name: "SACRED HERA Rules",
              description: "The 5 sacred rules that must never be violated",
              mimeType: "application/json"
            },
            {
              uri: "hera://context/organization",
              name: "Organization Context",
              description: "Current organization and multi-tenant boundary",
              mimeType: "application/json"
            }
          ]
        };
      });

      // Resource reader
      this.server.setRequestHandler("resources/read", async (request) => {
        const { uri } = request.params;

        if (uri === "hera://schema/universal") {
          return {
            contents: [{
              uri: "hera://schema/universal",
              mimeType: "application/json",
              text: JSON.stringify({
                sacred_tables: {
                  core_organizations: {
                    description: "WHO: Multi-tenant business isolation",
                    sacred_rule: "Root of all multi-tenancy",
                    key_fields: ["id", "organization_name", "organization_code"],
                    ai_fields: ["ai_confidence", "ai_classification"]
                  },
                  core_entities: {
                    description: "WHAT: All business objects",
                    sacred_rule: "Never create business-specific tables",
                    key_fields: ["id", "entity_type", "entity_name", "smart_code", "organization_id"],
                    ai_fields: ["ai_confidence", "ai_classification", "ai_last_analysis"]
                  },
                  core_dynamic_data: {
                    description: "HOW: Unlimited custom fields",
                    sacred_rule: "Never alter schema, use dynamic fields",
                    key_fields: ["entity_id", "field_name", "field_value_*", "organization_id"],
                    field_types: ["text", "number", "boolean", "date", "json"]
                  },
                  core_relationships: {
                    description: "WHY: Universal connections",
                    sacred_rule: "All relationships are universal patterns",
                    key_fields: ["parent_entity_id", "child_entity_id", "relationship_type", "organization_id"]
                  },
                  universal_transactions: {
                    description: "WHEN: All business transactions",
                    sacred_rule: "One pattern for all transaction types",
                    key_fields: ["id", "transaction_type", "smart_code", "total_amount", "organization_id"],
                    ai_fields: ["ai_confidence", "ai_classification"]
                  },
                  universal_transaction_lines: {
                    description: "DETAILS: Transaction breakdowns",
                    sacred_rule: "Universal line items for any transaction",
                    key_fields: ["transaction_id", "line_entity_id", "quantity", "unit_price", "line_amount"]
                  }
                }
              }, null, 2)
            }]
          };
        }

        if (uri === "hera://rules/sacred") {
          return {
            contents: [{
              uri: "hera://rules/sacred",
              mimeType: "application/json",
              text: JSON.stringify({
                sacred_rules: {
                  rule_1: {
                    name: "SACRED organization_id Filtering",
                    description: "NEVER query or modify data without organization_id filter",
                    severity: "CRITICAL",
                    enforcement: "Automatic validation on all operations"
                  },
                  rule_2: {
                    name: "NEVER ALTER SCHEMA",
                    description: "Use core_dynamic_data for custom fields, never add columns or tables",
                    severity: "CRITICAL",
                    enforcement: "Schema changes blocked, dynamic fields enforced"
                  },
                  rule_3: {
                    name: "Universal Patterns Only",
                    description: "No business-specific logic, use universal entity and transaction types",
                    severity: "HIGH",
                    enforcement: "Type validation and warnings"
                  },
                  rule_4: {
                    name: "AI-Native Fields Required",
                    description: "All entities must include AI confidence and classification",
                    severity: "HIGH",
                    enforcement: "Automatic AI field population"
                  },
                  rule_5: {
                    name: "Smart Code Intelligence",
                    description: "Every operation must have a HERA Smart Code",
                    severity: "HIGH",
                    enforcement: "Automatic Smart Code generation and validation"
                  }
                }
              }, null, 2)
            }]
          };
        }

        if (uri === "hera://context/organization") {
          const { data: org } = await supabase
            .from('core_organizations')
            .select('*')
            .eq('id', currentOrganizationId)
            .single();

          return {
            contents: [{
              uri: "hera://context/organization",
              mimeType: "application/json",
              text: JSON.stringify({
                current_organization: org,
                sacred_boundary: currentOrganizationId,
                multi_tenant_isolation: "ENFORCED",
                validation_status: "ACTIVE",
                rules_enforcement: "STRICT"
              }, null, 2)
            }]
          };
        }

        return {
          contents: [{
            uri,
            mimeType: "text/plain",
            text: "Resource not found"
          }]
        };
      });
    }

    async run() {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error("🛡️ HERA MCP Server v2.0 - SACRED RULES ENFORCED");
      console.error(`📍 Organization: ${currentOrganizationId}`);
      console.error(`🔐 Multi-tenant isolation: ACTIVE`);
      console.error(`✅ Schema protection: ENFORCED`);
      console.error(`🧠 Smart Codes: REQUIRED`);
      console.error(`🤖 AI Integration: ENABLED`);
    }
  }

  // Initialize and run server
  const server = new HeraMcpServer();
  await server.run();
}

// Start the server with error handling
startServer().catch(error => {
  console.error('🔥 FATAL ERROR:', error.message);
  process.exit(1);
});