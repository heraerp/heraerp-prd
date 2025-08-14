#!/usr/bin/env node
/**
 * HERA MCP Server
 * Model Context Protocol server for HERA's Universal 6-Table Architecture
 * 
 * This server provides Claude Code with direct access to:
 * - Universal schema operations (6 sacred tables)
 * - Smart Code intelligence
 * - Organization-aware context
 * - DNA component patterns
 */

require('dotenv').config();

async function startServer() {
  // Dynamic imports for ES modules
  const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
  const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
  const { createClient } = await import('@supabase/supabase-js');

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  // Sacred organization context
  let currentOrganizationId = process.env.DEFAULT_ORGANIZATION_ID || 'hera_software_inc';

  /**
   * HERA MCP Server Implementation
   */
  class HeraMcpServer {
    constructor() {
      this.server = new Server(
        {
          name: "hera-universal",
          version: "1.0.0",
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
      // Tool: Create Entity (Universal Table 2)
      this.server.setRequestHandler("tools/list", async () => {
        return {
          tools: [
            {
              name: "create-entity",
              description: "Create a business entity in core_entities table",
              inputSchema: {
                type: "object",
                properties: {
                  entity_type: { type: "string", description: "Type of entity (customer, product, etc.)" },
                  entity_name: { type: "string", description: "Name of the entity" },
                  entity_code: { type: "string", description: "Unique code for the entity" },
                  smart_code: { type: "string", description: "HERA Smart Code" },
                  metadata: { type: "object", description: "Additional metadata" }
                },
                required: ["entity_type", "entity_name"]
              }
            },
            {
              name: "create-transaction",
              description: "Create a universal transaction with line items",
              inputSchema: {
                type: "object",
                properties: {
                  transaction_type: { type: "string" },
                  smart_code: { type: "string" },
                  total_amount: { type: "number" },
                  line_items: { type: "array" }
                },
                required: ["transaction_type", "smart_code"]
              }
            },
            {
              name: "set-dynamic-field",
              description: "Set a dynamic field value for an entity",
              inputSchema: {
                type: "object",
                properties: {
                  entity_id: { type: "string" },
                  field_name: { type: "string" },
                  field_value: { type: ["string", "number", "boolean"] },
                  field_type: { type: "string", enum: ["text", "number", "boolean", "date"] }
                },
                required: ["entity_id", "field_name", "field_value"]
              }
            },
            {
              name: "query-universal",
              description: "Query any of the 6 universal tables",
              inputSchema: {
                type: "object",
                properties: {
                  table: { type: "string" },
                  filters: { type: "object" },
                  limit: { type: "number" }
                },
                required: ["table"]
              }
            }
          ]
        };
      });

      // Tool: Create Entity
      this.server.setRequestHandler("tools/call", async (request) => {
        const { name, arguments: args } = request.params;

        if (name === "create-entity") {
          const { entity_type, entity_name, entity_code, smart_code, metadata } = args;
          
          const { data, error } = await supabase
            .from('core_entities')
            .insert({
              organization_id: currentOrganizationId,
              entity_type,
              entity_name,
              entity_code,
              smart_code,
              metadata,
              status: 'active',
              created_at: new Date().toISOString()
            })
            .select()
            .single();

          if (error) {
            return { 
              content: [{ 
                type: "text", 
                text: `Error creating entity: ${error.message}` 
              }] 
            };
          }
          
          return { 
            content: [{ 
              type: "text", 
              text: JSON.stringify({ entity: data }, null, 2) 
            }] 
          };
        }

        if (name === "create-transaction") {
          const { transaction_type, smart_code, total_amount, line_items } = args;
          
          // Create transaction header
          const { data: transaction, error: txError } = await supabase
            .from('universal_transactions')
            .insert({
              organization_id: currentOrganizationId,
              transaction_type,
              smart_code,
              total_amount,
              transaction_date: new Date().toISOString(),
              status: 'pending'
            })
            .select()
            .single();

          if (txError) {
            return { 
              content: [{ 
                type: "text", 
                text: `Error creating transaction: ${txError.message}` 
              }] 
            };
          }

          // Create transaction lines if provided
          if (line_items && line_items.length > 0) {
            const lines = line_items.map((item, index) => ({
              transaction_id: transaction.id,
              line_number: index + 1,
              line_entity_id: item.entity_id,
              quantity: item.quantity,
              unit_price: item.unit_price,
              line_amount: item.quantity * item.unit_price,
              smart_code: item.smart_code || smart_code
            }));

            const { error: lineError } = await supabase
              .from('universal_transaction_lines')
              .insert(lines);

            if (lineError) {
              return { 
                content: [{ 
                  type: "text", 
                  text: `Transaction created but line items failed: ${lineError.message}` 
                }] 
              };
            }
          }

          return { 
            content: [{ 
              type: "text", 
              text: JSON.stringify({ 
                transaction, 
                line_count: line_items?.length || 0 
              }, null, 2) 
            }] 
          };
        }

        if (name === "set-dynamic-field") {
          const { entity_id, field_name, field_value, field_type = 'text' } = args;
          
          const fieldData = {
            entity_id,
            field_name,
            organization_id: currentOrganizationId
          };

          // Set appropriate field based on type
          if (field_type === 'number') {
            fieldData.field_value_number = field_value;
          } else if (field_type === 'boolean') {
            fieldData.field_value_boolean = field_value;
          } else if (field_type === 'date') {
            fieldData.field_value_date = field_value;
          } else {
            fieldData.field_value_text = field_value;
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
                text: `Error setting dynamic field: ${error.message}` 
              }] 
            };
          }
          
          return { 
            content: [{ 
              type: "text", 
              text: JSON.stringify({ field: data }, null, 2) 
            }] 
          };
        }

        if (name === "query-universal") {
          const { table, filters = {}, limit = 50 } = args;
          
          // Validate table is one of the sacred 6
          const validTables = [
            'core_organizations',
            'core_entities', 
            'core_dynamic_data',
            'core_relationships',
            'universal_transactions',
            'universal_transaction_lines'
          ];

          if (!validTables.includes(table)) {
            return { 
              content: [{ 
                type: "text", 
                text: `Invalid table. Must be one of the sacred 6: ${validTables.join(', ')}` 
              }] 
            };
          }

          let query = supabase.from(table).select('*');
          
          // Always filter by organization_id (SACRED boundary)
          if (table !== 'core_organizations') {
            query = query.eq('organization_id', currentOrganizationId);
          }

          // Apply additional filters
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });

          query = query.limit(limit);

          const { data, error } = await query;
          
          if (error) {
            return { 
              content: [{ 
                type: "text", 
                text: `Error querying ${table}: ${error.message}` 
              }] 
            };
          }
          
          return { 
            content: [{ 
              type: "text", 
              text: JSON.stringify({ 
                table,
                count: data.length,
                data 
              }, null, 2) 
            }] 
          };
        }

        return { 
          content: [{ 
            type: "text", 
            text: `Unknown tool: ${name}` 
          }] 
        };
      });
    }

    setupResources() {
      // Resource: Schema Information
      this.server.setRequestHandler("resources/list", async () => {
        return {
          resources: [
            {
              uri: "hera://schema/universal",
              name: "HERA Universal Schema",
              description: "Complete 6-table universal architecture schema",
              mimeType: "application/json"
            },
            {
              uri: "hera://context/organization",
              name: "Organization Context",
              description: "Current organization and security context",
              mimeType: "application/json"
            }
          ]
        };
      });

      this.server.setRequestHandler("resources/read", async (request) => {
        const { uri } = request.params;

        if (uri === "hera://schema/universal") {
          return {
            contents: [{
              uri: "hera://schema/universal",
              mimeType: "application/json",
              text: JSON.stringify({
                tables: {
                  core_organizations: {
                    description: "WHO: Multi-tenant business isolation",
                    key_fields: ["id", "organization_name", "organization_code"]
                  },
                  core_entities: {
                    description: "WHAT: All business objects",
                    key_fields: ["id", "entity_type", "entity_name", "smart_code", "organization_id"]
                  },
                  core_dynamic_data: {
                    description: "HOW: Unlimited custom fields",
                    key_fields: ["entity_id", "field_name", "field_value_*", "organization_id"]
                  },
                  core_relationships: {
                    description: "WHY: Universal connections",
                    key_fields: ["parent_entity_id", "child_entity_id", "relationship_type", "organization_id"]
                  },
                  universal_transactions: {
                    description: "WHEN: All business transactions",
                    key_fields: ["id", "transaction_type", "smart_code", "total_amount", "organization_id"]
                  },
                  universal_transaction_lines: {
                    description: "DETAILS: Transaction breakdowns",
                    key_fields: ["transaction_id", "line_entity_id", "quantity", "unit_price", "line_amount"]
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
                organization: org,
                sacred_boundary: currentOrganizationId,
                multi_tenant_isolation: true
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
      console.error("HERA MCP Server running with Universal 6-Table Architecture");
      console.error(`Organization: ${currentOrganizationId}`);
      console.error(`Supabase URL: ${process.env.SUPABASE_URL}`);
    }
  }

  // Initialize and run server
  const server = new HeraMcpServer();
  await server.run();
}

// Start the server
startServer().catch(console.error);