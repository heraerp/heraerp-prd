#!/usr/bin/env node

/**
 * HERA Costing & Profitability MCP Server
 * Exposes costing and profitability tools to AI agents
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Costing & Profitability MCP Tools
const costingTools = {
  // Standard Cost Estimate
  'costing.run_standard_estimate': {
    description: 'Run a standard cost roll-up for a product/plant/variant and persist results',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string', description: 'Organization ID' },
        product_id: { type: 'string', description: 'Product entity ID' },
        plant: { type: 'string', description: 'Plant code' },
        variant: { type: 'string', description: 'Costing variant (e.g., STDZ)' },
        run_id: { type: 'string', description: 'Unique run identifier' }
      },
      required: ['organization_id', 'product_id', 'plant', 'variant', 'run_id']
    },
    handler: async (params) => {
      try {
        // Create standard cost estimate transaction
        const { data: transaction, error } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: params.organization_id,
            transaction_type: 'cost_estimate',
            transaction_code: `CE-${Date.now()}`,
            transaction_date: new Date().toISOString(),
            smart_code: 'HERA.COSTING.STD.ESTIMATE.v1',
            metadata: {
              product_id: params.product_id,
              plant: params.plant,
              variant: params.variant,
              run_id: params.run_id
            }
          })
          .select()
          .single();

        if (error) throw error;

        // Auto-trigger will handle the calculation
        return {
          success: true,
          transaction_id: transaction.id,
          message: 'Standard cost estimate initiated',
          status: 'processing'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  },

  // Activity Rate Management
  'costing.set_activity_rate': {
    description: 'Set or update activity rates for a plant/variant',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string' },
        plant: { type: 'string' },
        variant: { type: 'string' },
        activity_type: { type: 'string', description: 'e.g., labor, machine, setup' },
        rate: { type: 'number', description: 'Rate per hour' },
        currency: { type: 'string', description: 'Currency code (default: USD)' }
      },
      required: ['organization_id', 'plant', 'variant', 'activity_type', 'rate']
    },
    handler: async (params) => {
      try {
        // Store rate in core_dynamic_data
        const { error } = await supabase
          .from('core_dynamic_data')
          .upsert({
            organization_id: params.organization_id,
            entity_id: `${params.plant}-${params.activity_type}`,
            field_name: 'activity_rate',
            field_value_number: params.rate,
            smart_code: 'HERA.COSTING.RATE.SET.v1',
            metadata: {
              plant: params.plant,
              variant: params.variant,
              activity_type: params.activity_type,
              currency: params.currency || 'USD',
              effective_date: new Date().toISOString()
            }
          }, {
            onConflict: 'organization_id,entity_id,field_name'
          });

        if (error) throw error;

        return {
          success: true,
          message: `Activity rate set: ${params.activity_type} = ${params.rate} ${params.currency || 'USD'}/hour`
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  },

  // Allocation Execution
  'costing.run_allocation': {
    description: 'Execute an assessment/distribution allocation using configured drivers',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string' },
        allocation_type: { 
          type: 'string', 
          enum: ['assessment', 'distribution'],
          description: 'Type of allocation'
        },
        sender_cc: { type: 'string', description: 'Sender cost center ID' },
        receivers: { 
          type: 'array',
          items: { type: 'string' },
          description: 'Receiver cost center IDs'
        },
        driver: { type: 'string', description: 'Driver name (e.g., headcount, sqft)' },
        period: {
          type: 'object',
          properties: {
            year: { type: 'integer' },
            month: { type: 'integer' }
          }
        }
      },
      required: ['organization_id', 'allocation_type', 'sender_cc', 'receivers', 'driver', 'period']
    },
    handler: async (params) => {
      try {
        const smartCode = params.allocation_type === 'assessment' 
          ? 'HERA.COSTING.ALLOC.ASSESS.v1'
          : 'HERA.COSTING.ALLOC.DISTRIB.v1';

        const { data: transaction, error } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: params.organization_id,
            transaction_type: 'allocation',
            transaction_code: `ALLOC-${Date.now()}`,
            transaction_date: new Date().toISOString(),
            smart_code: smartCode,
            metadata: {
              sender_cc: params.sender_cc,
              receivers: params.receivers,
              drivers: params.driver,
              period: params.period,
              allocation_type: params.allocation_type
            }
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          transaction_id: transaction.id,
          message: `${params.allocation_type} allocation initiated`,
          status: 'processing'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  },

  // Contribution Margin Calculation
  'profit.run_margin': {
    description: 'Compute contribution margins for a given slice (dimensions)',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string' },
        slice: {
          type: 'object',
          properties: {
            dims: {
              type: 'object',
              properties: {
                product: { type: 'array', items: { type: 'string' } },
                customer: { type: 'array', items: { type: 'string' } },
                region: { type: 'array', items: { type: 'string' } },
                channel: { type: 'array', items: { type: 'string' } }
              }
            }
          },
          description: 'Dimensional slice for analysis'
        },
        period: {
          type: 'object',
          properties: {
            year: { type: 'integer' },
            month: { type: 'integer' }
          }
        },
        margin_levels: {
          type: 'array',
          items: { type: 'string', enum: ['CM1', 'CM2', 'CM3', 'EBIT'] },
          description: 'Margin levels to calculate'
        }
      },
      required: ['organization_id', 'slice', 'period']
    },
    handler: async (params) => {
      try {
        const { data: transaction, error } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: params.organization_id,
            transaction_type: 'profitability_analysis',
            transaction_code: `CM-${Date.now()}`,
            transaction_date: new Date().toISOString(),
            smart_code: 'HERA.PROFIT.CM.CALC.v1',
            metadata: {
              slice: params.slice,
              period: params.period,
              margin_levels: params.margin_levels || ['CM1', 'CM2', 'CM3']
            }
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          transaction_id: transaction.id,
          message: 'Contribution margin calculation initiated',
          status: 'processing'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  },

  // Get Cost Estimate Status
  'costing.get_estimate_status': {
    description: 'Get the status and results of a cost estimate',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string' },
        transaction_id: { type: 'string', description: 'Cost estimate transaction ID' }
      },
      required: ['organization_id', 'transaction_id']
    },
    handler: async (params) => {
      try {
        // Get transaction with lines
        const { data: transaction, error: txError } = await supabase
          .from('universal_transactions')
          .select(`
            *,
            universal_transaction_lines(*)
          `)
          .eq('id', params.transaction_id)
          .eq('organization_id', params.organization_id)
          .single();

        if (txError) throw txError;

        // Summarize cost components
        const costSummary = {};
        transaction.universal_transaction_lines?.forEach(line => {
          const element = line.metadata?.cost_element || 'other';
          costSummary[element] = (costSummary[element] || 0) + line.line_amount;
        });

        return {
          success: true,
          status: transaction.transaction_status,
          total_cost: transaction.total_amount,
          cost_breakdown: costSummary,
          line_count: transaction.universal_transaction_lines?.length || 0,
          calculated_at: transaction.updated_at,
          insights: transaction.ai_insights
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  },

  // Create BOM for Costing
  'costing.create_bom': {
    description: 'Create or update a bill of materials for costing',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string' },
        product_id: { type: 'string', description: 'Parent product entity ID' },
        plant: { type: 'string' },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              component_id: { type: 'string', description: 'Component entity ID' },
              quantity: { type: 'number' },
              uom: { type: 'string' },
              scrap_percent: { type: 'number', description: 'Scrap percentage (optional)' }
            }
          }
        }
      },
      required: ['organization_id', 'product_id', 'plant', 'components']
    },
    handler: async (params) => {
      try {
        const relationships = [];

        for (const component of params.components) {
          relationships.push({
            organization_id: params.organization_id,
            from_entity_id: params.product_id,
            to_entity_id: component.component_id,
            relationship_type: 'has_component',
            smart_code: 'HERA.COSTING.BOM.COSTED.v1',
            metadata: {
              plant: params.plant,
              quantity: component.quantity,
              uom: component.uom,
              scrap_percent: component.scrap_percent || 0,
              valid_from: new Date().toISOString()
            }
          });
        }

        const { error } = await supabase
          .from('core_relationships')
          .insert(relationships);

        if (error) throw error;

        return {
          success: true,
          message: `BOM created with ${params.components.length} components`,
          product_id: params.product_id,
          plant: params.plant
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  },

  // Price-Volume-Mix Analysis
  'profit.run_pvm_analysis': {
    description: 'Run price-volume-mix analysis comparing periods',
    inputSchema: {
      type: 'object',
      properties: {
        organization_id: { type: 'string' },
        base_period: {
          type: 'object',
          properties: {
            year: { type: 'integer' },
            month: { type: 'integer' }
          }
        },
        comparison_period: {
          type: 'object',
          properties: {
            year: { type: 'integer' },
            month: { type: 'integer' }
          }
        },
        dimensions: {
          type: 'array',
          items: { type: 'string', enum: ['product', 'customer', 'region'] }
        }
      },
      required: ['organization_id', 'base_period', 'comparison_period']
    },
    handler: async (params) => {
      try {
        const { data: transaction, error } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: params.organization_id,
            transaction_type: 'pvm_analysis',
            transaction_code: `PVM-${Date.now()}`,
            transaction_date: new Date().toISOString(),
            smart_code: 'HERA.PROFIT.PVM.CALC.v1',
            metadata: {
              base_period: params.base_period,
              comparison_period: params.comparison_period,
              dimensions: params.dimensions || ['product']
            }
          })
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          transaction_id: transaction.id,
          message: 'Price-Volume-Mix analysis initiated',
          status: 'processing'
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
  }
};

// Start MCP server
function startMCPServer() {
  console.log('🚀 HERA Costing & Profitability MCP Server starting...');
  console.log('📊 Available tools:');
  Object.keys(costingTools).forEach(tool => {
    console.log(`   - ${tool}: ${costingTools[tool].description}`);
  });

  // In a real implementation, this would:
  // 1. Listen for MCP protocol messages
  // 2. Route to appropriate tool handlers
  // 3. Return responses in MCP format
  
  console.log('\n✅ Costing & Profitability MCP Server ready for AI agent connections');
}

// Export for testing
module.exports = { costingTools };

// Start server if run directly
if (require.main === module) {
  startMCPServer();
}