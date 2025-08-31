#!/usr/bin/env node

// HERA Analytics MCP Server - Strict 6-Table Architecture with Guardrails
// The analytical brain for HERA's universal ERP/BI system

require('dotenv').config();
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Sacred 6 Tables - NO OTHER TABLES EXIST
const SACRED_TABLES = [
  'core_organizations',
  'core_entities',
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
];

// Guardrail Error Codes
const GUARDRAIL_ERRORS = {
  ORG_FILTER_MISSING: 'Organization ID is required for all queries',
  SMART_CODE_INVALID: 'Smart code is invalid or deprecated',
  GL_UNBALANCED: 'GL transaction lines must balance (debits = credits)',
  TABLE_VIOLATION: 'Only sacred 6 tables allowed',
  DDL_VIOLATION: 'Cannot create tables or columns',
  PRIVACY_VIOLATION: 'PII/PHI data must be anonymized',
  FANOUT_VIOLATION: 'Relationship depth cannot exceed 2'
};

class HeraAnalyticsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'hera-analytics-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'search_smart_codes',
          description: 'Search for smart codes by free text description',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: {
                type: 'string',
                description: 'Organization UUID (required)'
              },
              search_text: {
                type: 'string',
                description: 'Free text to search smart codes'
              },
              industry: {
                type: 'string',
                description: 'Industry filter (optional)'
              },
              module: {
                type: 'string',
                description: 'Module filter (optional)'
              }
            },
            required: ['organization_id', 'search_text']
          }
        },
        {
          name: 'validate_smart_code',
          description: 'Validate a smart code and check version',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: {
                type: 'string',
                description: 'Organization UUID (required)'
              },
              smart_code: {
                type: 'string',
                description: 'Smart code to validate'
              }
            },
            required: ['organization_id', 'smart_code']
          }
        },
        {
          name: 'query_entities',
          description: 'Query entities with optional filters (auto-expands dynamic data)',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: {
                type: 'string',
                description: 'Organization UUID (required)'
              },
              entity_type: {
                type: 'string',
                description: 'Entity type filter'
              },
              smart_code: {
                type: 'string',
                description: 'Smart code filter'
              },
              filters: {
                type: 'object',
                description: 'Dynamic field filters'
              },
              select: {
                type: 'array',
                items: { type: 'string' },
                description: 'Fields to select'
              },
              limit: {
                type: 'number',
                description: 'Max results (default 50, max 1000)'
              }
            },
            required: ['organization_id']
          }
        },
        {
          name: 'query_transactions',
          description: 'Query transactions with aggregation support',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: {
                type: 'string',
                description: 'Organization UUID (required)'
              },
              transaction_type: {
                type: 'string',
                description: 'Transaction type filter'
              },
              smart_code: {
                type: 'string',
                description: 'Smart code filter'
              },
              time: {
                type: 'object',
                properties: {
                  start: { type: 'string', description: 'Start date (ISO)' },
                  end: { type: 'string', description: 'End date (ISO)' },
                  grain: {
                    type: 'string',
                    enum: ['hour', 'day', 'week', 'month', 'quarter', 'year'],
                    description: 'Time aggregation grain'
                  }
                }
              },
              filters: {
                type: 'object',
                description: 'Dynamic field filters'
              },
              group_by: {
                type: 'array',
                items: { type: 'string' },
                description: 'Fields to group by'
              },
              metrics: {
                type: 'array',
                items: { type: 'string' },
                description: 'Metrics to calculate (count, sum, avg, etc.)'
              },
              limit: {
                type: 'number',
                description: 'Max results (default 100, max 1000)'
              }
            },
            required: ['organization_id']
          }
        },
        {
          name: 'search_relationships',
          description: 'Traverse entity relationships (max depth 2)',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: {
                type: 'string',
                description: 'Organization UUID (required)'
              },
              from_entity_id: {
                type: 'string',
                description: 'Starting entity ID'
              },
              relationship_type: {
                type: 'string',
                description: 'Type of relationship'
              },
              direction: {
                type: 'string',
                enum: ['outgoing', 'incoming', 'both'],
                description: 'Direction to traverse'
              },
              depth: {
                type: 'number',
                description: 'Max depth (1 or 2)'
              }
            },
            required: ['organization_id', 'from_entity_id']
          }
        },
        {
          name: 'post_transaction',
          description: 'Create new transaction with balanced lines',
          inputSchema: {
            type: 'object',
            properties: {
              organization_id: {
                type: 'string',
                description: 'Organization UUID (required)'
              },
              transaction_code: {
                type: 'string',
                description: 'Transaction smart code (validated)'
              },
              header: {
                type: 'object',
                description: 'Transaction header data'
              },
              lines: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    line_number: { type: 'number' },
                    line_type: { type: 'string', enum: ['debit', 'credit'] },
                    line_amount: { type: 'number' },
                    smart_code: { type: 'string' }
                  }
                },
                description: 'Transaction lines (must balance for GL)'
              }
            },
            required: ['organization_id', 'transaction_code', 'lines']
          }
        }
      ]
    }));

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Guardrail: Always require organization_id
        if (!args.organization_id) {
          throw new Error(`${GUARDRAIL_ERRORS.ORG_FILTER_MISSING}. Add "organization_id" to your request.`);
        }

        let result;

        switch (name) {
          case 'search_smart_codes':
            result = await this.searchSmartCodes(args);
            break;

          case 'validate_smart_code':
            result = await this.validateSmartCode(args);
            break;

          case 'query_entities':
            result = await this.queryEntities(args);
            break;

          case 'query_transactions':
            result = await this.queryTransactions(args);
            break;

          case 'search_relationships':
            result = await this.searchRelationships(args);
            break;

          case 'post_transaction':
            result = await this.postTransaction(args);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error.message,
                guardrail: this.identifyGuardrail(error.message),
                correction: this.suggestCorrection(error.message)
              })
            }
          ],
          isError: true
        };
      }
    });
  }

  // Tool implementations

  async searchSmartCodes(args) {
    const { organization_id, search_text, industry, module } = args;
    
    // Search smart codes in entity metadata
    let query = supabase
      .from('core_entities')
      .select('smart_code, entity_name, entity_type, metadata')
      .eq('organization_id', organization_id)
      .not('smart_code', 'is', null);
    
    // Apply filters
    if (industry) {
      query = query.ilike('smart_code', `HERA.${industry}%`);
    }
    if (module) {
      query = query.ilike('smart_code', `%${module}%`);
    }
    
    const { data, error } = await query.limit(20);
    if (error) throw error;
    
    // Extract unique smart codes and patterns
    const smartCodes = [...new Set(data?.map(d => d.smart_code) || [])];
    
    // Filter by search text
    const filtered = smartCodes.filter(code => 
      code.toLowerCase().includes(search_text.toLowerCase()) ||
      this.extractCodeMeaning(code).toLowerCase().includes(search_text.toLowerCase())
    );
    
    return {
      found: filtered.length,
      codes: filtered.slice(0, 10).map(code => ({
        code,
        meaning: this.extractCodeMeaning(code),
        version: this.extractVersion(code),
        usage_count: data.filter(d => d.smart_code === code).length
      })),
      suggestion: filtered.length === 0 ? 
        'Try broader search terms or check available industries/modules' : null
    };
  }

  async validateSmartCode(args) {
    const { organization_id, smart_code } = args;
    
    // Validate format - flexible parts between HERA and version
    const pattern = /^HERA(\.[A-Z0-9]+)+\.v\d+$/;
    if (!pattern.test(smart_code)) {
      return {
        valid: false,
        error: 'Invalid smart code format. Expected: HERA.{PARTS}.v{N}',
        suggestion: 'Use search_smart_codes to find valid codes'
      };
    }
    
    // Check if code exists in organization
    const { data, error } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organization_id)
      .eq('smart_code', smart_code)
      .limit(1);
    
    if (error) throw error;
    
    const exists = data && data.length > 0;
    const version = this.extractVersion(smart_code);
    
    // Check for newer versions
    const baseCode = smart_code.replace(/\.v\d+$/, '');
    const { data: versions } = await supabase
      .from('core_entities')
      .select('smart_code')
      .eq('organization_id', organization_id)
      .ilike('smart_code', `${baseCode}.v%`)
      .limit(10);
    
    const allVersions = versions?.map(v => this.extractVersion(v.smart_code)) || [];
    const latestVersion = Math.max(...allVersions, version);
    
    return {
      valid: exists,
      code: smart_code,
      version,
      latest_version: latestVersion,
      upgrade_available: latestVersion > version,
      suggested_code: latestVersion > version ? `${baseCode}.v${latestVersion}` : null
    };
  }

  async queryEntities(args) {
    const { organization_id, entity_type, smart_code, filters = {}, select = [], limit = 50 } = args;
    
    // Guardrail: Max limit 1000
    const safeLimit = Math.min(limit, 1000);
    
    // Base query
    let query = supabase
      .from('core_entities')
      .select('*, core_dynamic_data(*)')
      .eq('organization_id', organization_id);
    
    // Apply filters
    if (entity_type) query = query.eq('entity_type', entity_type);
    if (smart_code) query = query.eq('smart_code', smart_code);
    
    const { data, error } = await query.limit(safeLimit);
    if (error) throw error;
    
    // Filter by dynamic fields
    let filtered = data || [];
    if (Object.keys(filters).length > 0) {
      filtered = filtered.filter(entity => {
        for (const [field, value] of Object.entries(filters)) {
          const dynamicField = entity.core_dynamic_data?.find(d => d.field_name === field);
          if (!dynamicField) return false;
          
          const fieldValue = dynamicField.field_value_text || 
                            dynamicField.field_value_number || 
                            dynamicField.field_value_boolean;
          if (fieldValue !== value) return false;
        }
        return true;
      });
    }
    
    // Transform results
    const results = filtered.map(entity => {
      const fields = {};
      entity.core_dynamic_data?.forEach(field => {
        fields[field.field_name] = field.field_value_text || 
                                  field.field_value_number || 
                                  field.field_value_boolean ||
                                  field.field_value_date;
      });
      
      const base = {
        id: entity.id,
        entity_type: entity.entity_type,
        entity_name: entity.entity_name,
        entity_code: entity.entity_code,
        smart_code: entity.smart_code,
        status: entity.status
      };
      
      // Apply field selection
      if (select.length > 0) {
        const selected = {};
        select.forEach(field => {
          if (base[field] !== undefined) selected[field] = base[field];
          if (fields[field] !== undefined) selected[field] = fields[field];
        });
        return { ...selected, id: entity.id };
      }
      
      return { ...base, ...fields };
    });
    
    return {
      count: results.length,
      limit: safeLimit,
      data: results
    };
  }

  async queryTransactions(args) {
    const { 
      organization_id, 
      transaction_type, 
      smart_code,
      time = {},
      filters = {},
      group_by = [],
      metrics = [],
      limit = 100
    } = args;
    
    // Guardrail: Require time grain for aggregates
    if (group_by.length > 0 && !time.grain) {
      throw new Error('Time grain required for aggregated queries. Add time.grain (hour/day/week/month)');
    }
    
    // Default time range if not specified
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 30);
    
    const startDate = time.start || defaultStart.toISOString();
    const endDate = time.end || now.toISOString();
    
    // Base query
    let query = supabase
      .from('universal_transactions')
      .select('*, universal_transaction_lines(*)')
      .eq('organization_id', organization_id)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);
    
    // Apply filters
    if (transaction_type) query = query.eq('transaction_type', transaction_type);
    if (smart_code) query = query.eq('smart_code', smart_code);
    
    const { data, error } = await query.limit(Math.min(limit, 1000));
    if (error) throw error;
    
    // If no aggregation requested, return raw data (limited)
    if (group_by.length === 0) {
      return {
        count: data?.length || 0,
        data: data?.slice(0, 50) || [], // Max 50 raw rows
        warning: data?.length > 50 ? 'Showing first 50 rows. Use aggregation for larger datasets.' : null
      };
    }
    
    // Perform aggregation
    const aggregated = this.aggregateTransactions(data || [], {
      time_grain: time.grain,
      group_by,
      metrics
    });
    
    return {
      aggregation: {
        time_grain: time.grain,
        group_by,
        metrics
      },
      count: aggregated.length,
      data: aggregated
    };
  }

  async searchRelationships(args) {
    const { organization_id, from_entity_id, relationship_type, direction = 'outgoing', depth = 1 } = args;
    
    // Guardrail: Max depth 2
    if (depth > 2) {
      throw new Error(`${GUARDRAIL_ERRORS.FANOUT_VIOLATION}. Set depth to 1 or 2.`);
    }
    
    // First level relationships
    let query = supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', organization_id);
    
    if (direction === 'outgoing' || direction === 'both') {
      query = query.eq('from_entity_id', from_entity_id);
    }
    if (direction === 'incoming' || direction === 'both') {
      query = query.or(`to_entity_id.eq.${from_entity_id}`);
    }
    if (relationship_type) {
      query = query.eq('relationship_type', relationship_type);
    }
    
    const { data: level1, error } = await query.limit(100);
    if (error) throw error;
    
    const relationships = level1 || [];
    
    // Second level if requested
    if (depth === 2 && relationships.length > 0) {
      const nextIds = relationships.map(r => 
        r.from_entity_id === from_entity_id ? r.to_entity_id : r.from_entity_id
      );
      
      const { data: level2 } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('organization_id', organization_id)
        .in('from_entity_id', nextIds)
        .limit(50); // Limit fanout
        
      relationships.push(...(level2 || []));
    }
    
    return {
      count: relationships.length,
      depth,
      relationships: relationships.map(r => ({
        id: r.id,
        type: r.relationship_type,
        from_entity_id: r.from_entity_id,
        to_entity_id: r.to_entity_id,
        strength: r.relationship_strength || 1.0,
        metadata: r.metadata
      }))
    };
  }

  async postTransaction(args) {
    const { organization_id, transaction_code, header = {}, lines = [] } = args;
    
    // Validate smart code first
    const validation = await this.validateSmartCode({ organization_id, smart_code: transaction_code });
    if (!validation.valid) {
      throw new Error(`${GUARDRAIL_ERRORS.SMART_CODE_INVALID}: ${transaction_code}. ${validation.suggestion || ''}`);
    }
    
    // GL Balance check
    if (transaction_code.includes('.GL.')) {
      const debits = lines.filter(l => l.line_type === 'debit').reduce((sum, l) => sum + l.line_amount, 0);
      const credits = lines.filter(l => l.line_type === 'credit').reduce((sum, l) => sum + l.line_amount, 0);
      
      if (Math.abs(debits - credits) > 0.01) {
        throw new Error(`${GUARDRAIL_ERRORS.GL_UNBALANCED}. Debits: ${debits}, Credits: ${credits}. Adjust lines.`);
      }
    }
    
    // Create transaction
    const { data: transaction, error: txError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id,
        transaction_type: this.extractTransactionType(transaction_code),
        transaction_code: `TXN-${Date.now()}`,
        smart_code: transaction_code,
        transaction_date: header.transaction_date || new Date().toISOString(),
        source_entity_id: header.source_entity_id || null,
        target_entity_id: header.target_entity_id || null,
        total_amount: lines.reduce((sum, l) => sum + l.line_amount, 0),
        metadata: header,
        transaction_status: header.status || 'pending'
      })
      .select()
      .single();
      
    if (txError) throw txError;
    
    // Create lines
    const lineData = lines.map((line, idx) => ({
      transaction_id: transaction.id,
      line_number: line.line_number || (idx + 1),
      line_entity_id: line.entity_id || null,
      quantity: line.quantity || 1,
      unit_price: line.unit_price || line.line_amount,
      line_amount: line.line_amount,
      smart_code: line.smart_code || 'HERA.ACCOUNTING.GL.LINE.v1',
      metadata: { ...line, line_type: line.line_type }
    }));
    
    const { error: lineError } = await supabase
      .from('universal_transaction_lines')
      .insert(lineData);
      
    if (lineError) throw lineError;
    
    return {
      success: true,
      transaction_id: transaction.id,
      transaction_code: transaction.transaction_code,
      total_amount: transaction.total_amount,
      line_count: lines.length
    };
  }

  // Helper methods

  extractCodeMeaning(smartCode) {
    const parts = smartCode.split('.');
    return parts.slice(1, -1).join(' ').toLowerCase();
  }

  extractVersion(smartCode) {
    const match = smartCode.match(/v(\d+)$/);
    return match ? parseInt(match[1]) : 1;
  }

  extractTransactionType(smartCode) {
    const parts = smartCode.split('.');
    return parts[3] || 'general';
  }

  identifyGuardrail(errorMessage) {
    for (const [code, message] of Object.entries(GUARDRAIL_ERRORS)) {
      if (errorMessage.includes(message)) return code;
    }
    return null;
  }

  suggestCorrection(errorMessage) {
    if (errorMessage.includes('Organization ID')) {
      return 'Add "organization_id" parameter to your request';
    }
    if (errorMessage.includes('Smart code')) {
      return 'Use search_smart_codes to find valid codes';
    }
    if (errorMessage.includes('balance')) {
      return 'Ensure sum of debits equals sum of credits';
    }
    return 'Check request parameters and retry';
  }

  aggregateTransactions(data, { time_grain, group_by, metrics }) {
    // Simple aggregation implementation
    const groups = {};
    
    data.forEach(txn => {
      // Create group key
      const key = group_by.map(field => {
        if (field === 'time') {
          return this.truncateDate(txn.transaction_date, time_grain);
        }
        return txn[field] || txn.metadata?.[field] || 'unknown';
      }).join('|');
      
      if (!groups[key]) {
        groups[key] = {
          count: 0,
          sum: 0,
          transactions: []
        };
      }
      
      groups[key].count++;
      groups[key].sum += txn.total_amount || 0;
      groups[key].transactions.push(txn);
    });
    
    // Convert to results
    return Object.entries(groups).map(([key, data]) => {
      const values = key.split('|');
      const result = {};
      
      group_by.forEach((field, idx) => {
        result[field] = values[idx];
      });
      
      metrics.forEach(metric => {
        if (metric === 'count') result.count = data.count;
        if (metric === 'sum' || metric === 'sum.amount') result.sum = data.sum;
        if (metric === 'avg' || metric === 'avg.amount') result.avg = data.sum / data.count;
      });
      
      return result;
    });
  }

  truncateDate(date, grain) {
    const d = new Date(date);
    switch (grain) {
      case 'hour':
        d.setMinutes(0, 0, 0);
        break;
      case 'day':
        d.setHours(0, 0, 0, 0);
        break;
      case 'week':
        d.setDate(d.getDate() - d.getDay());
        d.setHours(0, 0, 0, 0);
        break;
      case 'month':
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        break;
      case 'quarter':
        d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
        d.setHours(0, 0, 0, 0);
        break;
      case 'year':
        d.setMonth(0, 1);
        d.setHours(0, 0, 0, 0);
        break;
    }
    return d.toISOString();
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('HERA Analytics MCP Server running with strict guardrails...');
  }
}

// Start the server
if (require.main === module) {
  const server = new HeraAnalyticsMCPServer();
  server.run().catch(console.error);
}

module.exports = HeraAnalyticsMCPServer;