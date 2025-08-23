#!/usr/bin/env node
/**
 * HERA MCP Server with REST API for AI Chatbot Integration
 * Deployable on Railway with OpenAI integration
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

// Initialize services
const app = express();
const PORT = process.env.PORT || 3000;

// Check required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.log('Please set these in Railway environment variables');
}

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// OpenAI client - optional
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'hera-mcp-server',
    version: '2.0.0',
    uptime: process.uptime()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'HERA MCP Server API',
    endpoints: {
      health: '/health',
      chat: '/api/chat',
      query: '/api/query',
      create: '/api/create',
      execute: '/api/execute'
    }
  });
});

/**
 * AI Chatbot endpoint - Process natural language with OpenAI
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, organizationId, context = {} } = req.body;
    
    if (!message || !organizationId) {
      return res.status(400).json({ 
        error: 'Message and organizationId are required' 
      });
    }

    // Get AI interpretation of the command
    const interpretation = await interpretCommand(message, context);
    
    // Execute the interpreted command
    const result = await executeCommand(interpretation, organizationId);
    
    // Generate natural language response
    const response = await generateResponse(interpretation, result);
    
    res.json({
      success: true,
      interpretation,
      result,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process chat message',
      details: error.message 
    });
  }
});

/**
 * Direct query endpoint
 */
app.post('/api/query', async (req, res) => {
  try {
    const { table, organizationId, filters = {} } = req.body;
    
    // Validate sacred tables
    const SACRED_TABLES = [
      'core_entities', 'core_dynamic_data', 'core_relationships',
      'universal_transactions', 'universal_transaction_lines'
    ];
    
    if (!SACRED_TABLES.includes(table)) {
      return res.status(400).json({ 
        error: `Invalid table. Must be one of: ${SACRED_TABLES.join(', ')}` 
      });
    }
    
    // Build query with organization isolation
    let query = supabase.from(table).select('*');
    
    // SACRED: Always filter by organization_id
    if (table !== 'core_organizations') {
      query = query.eq('organization_id', organizationId);
    }
    
    // Apply additional filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ 
      error: 'Query failed',
      details: error.message 
    });
  }
});

/**
 * Create entity endpoint
 */
app.post('/api/create', async (req, res) => {
  try {
    const { type, organizationId, data } = req.body;
    
    if (!type || !organizationId || !data) {
      return res.status(400).json({ 
        error: 'Type, organizationId, and data are required' 
      });
    }
    
    const result = await createEntity(type, organizationId, data);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ 
      error: 'Failed to create entity',
      details: error.message 
    });
  }
});

/**
 * Execute complex operations
 */
app.post('/api/execute', async (req, res) => {
  try {
    const { operation, organizationId, params = {} } = req.body;
    
    if (!operation || !organizationId) {
      return res.status(400).json({ 
        error: 'Operation and organizationId are required' 
      });
    }
    
    const result = await executeOperation(operation, organizationId, params);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Execute error:', error);
    res.status(500).json({ 
      error: 'Operation failed',
      details: error.message 
    });
  }
});

// Helper Functions

/**
 * Interpret natural language command using OpenAI
 */
async function interpretCommand(message, context) {
  // If no OpenAI, use simple pattern matching
  if (!openai) {
    return simpleInterpretation(message);
  }
  
  const systemPrompt = `You are an AI assistant for HERA ERP system. 
  HERA uses a universal 6-table architecture where everything is stored as:
  - Entities (customers, products, services, staff, etc.)
  - Transactions (sales, appointments, transfers, etc.)
  - Relationships (status, hierarchy, associations)
  - Dynamic data (custom fields)
  
  Interpret the user's message and return a structured command.
  
  Return JSON with:
  {
    "action": "create" | "query" | "update" | "analyze",
    "type": "entity type or transaction type",
    "parameters": { relevant parameters },
    "confidence": 0-1
  }`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: message }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content);
}

/**
 * Simple pattern-based interpretation when OpenAI is not available
 */
function simpleInterpretation(message) {
  const lowerMessage = message.toLowerCase();
  
  // Summary patterns - check FIRST before other patterns
  if ((lowerMessage.includes('summary') || lowerMessage.includes('report')) && 
      (lowerMessage.includes('today') || lowerMessage.includes('daily') || lowerMessage.includes('sales'))) {
    return {
      action: 'execute',
      type: 'daily_summary',
      parameters: {},
      confidence: 0.9
    };
  }
  
  // Create patterns
  if (lowerMessage.includes('create') || lowerMessage.includes('add') || lowerMessage.includes('new')) {
    if (lowerMessage.includes('customer') || lowerMessage.includes('client')) {
      return {
        action: 'create',
        type: 'customer',
        parameters: { name: extractName(message) },
        confidence: 0.8
      };
    }
    if (lowerMessage.includes('appointment') || lowerMessage.includes('booking')) {
      return {
        action: 'create',
        type: 'appointment',
        parameters: extractAppointmentDetails(message),
        confidence: 0.7
      };
    }
    if (lowerMessage.includes('sale') || lowerMessage.includes('transaction') || lowerMessage.includes('order')) {
      return {
        action: 'create',
        type: 'sale',
        parameters: { amount: extractAmount(message) },
        confidence: 0.8
      };
    }
    if (lowerMessage.includes('product') || lowerMessage.includes('item')) {
      return {
        action: 'create',
        type: 'product',
        parameters: { name: extractName(message) },
        confidence: 0.7
      };
    }
  }
  
  // Query patterns
  if (lowerMessage.includes('show') || lowerMessage.includes('list') || lowerMessage.includes('get')) {
    const type = extractEntityType(message);
    return {
      action: 'query',
      type: type,
      parameters: {},
      confidence: 0.7
    };
  }
  
  // Default
  return {
    action: 'unknown',
    type: 'unknown',
    parameters: { originalMessage: message },
    confidence: 0.3
  };
}

function extractName(message) {
  const patterns = [
    /named?\s+([A-Za-z\s]+)/i,
    /customer\s+([A-Za-z\s]+)/i,
    /client\s+([A-Za-z\s]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1].trim();
  }
  
  return 'New Customer';
}

function extractEntityType(message) {
  const types = ['customer', 'appointment', 'service', 'product', 'staff'];
  const lowerMessage = message.toLowerCase();
  
  for (const type of types) {
    if (lowerMessage.includes(type)) return type;
  }
  
  return 'entity';
}

function extractAppointmentDetails(message) {
  // Simple extraction - can be enhanced
  return {
    date: 'today',
    time: '14:00',
    service: 'consultation'
  };
}

function extractAmount(message) {
  // Extract numeric amount from message
  const patterns = [
    /\$(\d+(?:\.\d+)?)/,           // $150 or $150.50
    /(\d+(?:\.\d+)?)\s*dollars?/i, // 150 dollars
    /for\s+(\d+(?:\.\d+)?)/i,      // for 150
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return parseFloat(match[1]);
  }
  
  return 100; // Default amount
}

/**
 * Execute interpreted command
 */
async function executeCommand(interpretation, organizationId) {
  const { action, type, parameters } = interpretation;
  
  switch (action) {
    case 'create':
      return await handleCreate(type, organizationId, parameters);
    
    case 'query':
      return await handleQuery(type, organizationId, parameters);
    
    case 'update':
      return await handleUpdate(type, organizationId, parameters);
    
    case 'analyze':
      return await handleAnalyze(type, organizationId, parameters);
    
    case 'execute':
      if (type === 'daily_summary') {
        return await getDailySummary(organizationId);
      }
      return await executeOperation(type, organizationId, parameters);
    
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Handle entity creation
 */
async function handleCreate(type, organizationId, params) {
  // Map common types to entity types
  const typeMap = {
    'customer': 'customer',
    'client': 'customer',
    'appointment': 'appointment',
    'booking': 'appointment',
    'service': 'service',
    'product': 'product',
    'staff': 'staff',
    'employee': 'staff'
  };
  
  const entityType = typeMap[type.toLowerCase()] || type;
  
  // Handle different creation types
  if (['appointment', 'booking', 'sale', 'order'].includes(entityType)) {
    // Create as transaction
    return await createTransaction(entityType, organizationId, params);
  } else {
    // Create as entity
    return await createEntity(entityType, organizationId, params);
  }
}

/**
 * Create entity in database
 */
async function createEntity(entityType, organizationId, data) {
  const entity = {
    organization_id: organizationId,
    entity_type: entityType,
    entity_name: data.name || `New ${entityType}`,
    entity_code: `${entityType.toUpperCase()}-${Date.now()}`,
    status: 'active',
    smart_code: generateSmartCode(entityType, 'CREATE'),
    metadata: data
  };
  
  const { data: result, error } = await supabase
    .from('core_entities')
    .insert(entity)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

/**
 * Create transaction in database
 */
async function createTransaction(type, organizationId, params) {
  const transaction = {
    organization_id: organizationId,
    transaction_type: type,
    transaction_code: `TXN-${Date.now()}`,
    transaction_date: params.date || new Date().toISOString(),
    from_entity_id: params.customerId || params.fromEntityId,
    to_entity_id: params.staffId || params.toEntityId || params.locationId,
    total_amount: params.amount || 0,
    smart_code: generateSmartCode(type, 'CREATE'),
    metadata: params
  };
  
  const { data: result, error } = await supabase
    .from('universal_transactions')
    .insert(transaction)
    .select()
    .single();
  
  if (error) throw error;
  return result;
}

/**
 * Generate smart codes
 */
function generateSmartCode(type, operation) {
  const industry = detectIndustry(type);
  const domain = type.toUpperCase().slice(0, 4);
  return `HERA.${industry}.${domain}.${operation}.v1`;
}

/**
 * Detect industry from type
 */
function detectIndustry(type) {
  const map = {
    'appointment': 'SALON',
    'service': 'SALON',
    'menu_item': 'REST',
    'patient': 'HLTH',
    'student': 'EDU'
  };
  return map[type] || 'UNIV';
}

/**
 * Generate natural language response
 */
async function generateResponse(interpretation, result) {
  // If no OpenAI, use template responses
  if (!openai) {
    return generateTemplateResponse(interpretation, result);
  }
  
  const prompt = `Given this action and result, generate a friendly response:
  Action: ${JSON.stringify(interpretation)}
  Result: ${JSON.stringify(result)}
  
  Generate a natural, helpful response for the user.`;
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a helpful HERA ERP assistant." },
      { role: "user", content: prompt }
    ]
  });
  
  return completion.choices[0].message.content;
}

/**
 * Generate template-based responses when OpenAI is not available
 */
function generateTemplateResponse(interpretation, result) {
  const { action, type } = interpretation;
  
  if (action === 'create' && result && result.id) {
    return `✅ Successfully created ${type}: ${result.entity_name || result.name || 'New ' + type}\n\nID: ${result.id}\nCode: ${result.entity_code || result.transaction_code || 'N/A'}`;
  }
  
  if (action === 'query' && Array.isArray(result)) {
    if (result.length === 0) {
      return `No ${type}s found. Would you like to create one?`;
    }
    return `Found ${result.length} ${type}${result.length === 1 ? '' : 's'}:\n\n${result.slice(0, 5).map(r => `• ${r.entity_name || r.name || r.id}`).join('\n')}${result.length > 5 ? `\n... and ${result.length - 5} more` : ''}`;
  }
  
  if (action === 'execute' && type === 'daily_summary') {
    if (!result || result.totalTransactions === 0) {
      return `📊 Today's Sales Summary\n\nNo sales recorded today.\n\nWould you like to create a test sale?`;
    }
    let response = `📊 Today's Sales Summary\n\n`;
    response += `Total Transactions: ${result.totalTransactions}\n`;
    response += `Total Revenue: $${result.totalRevenue.toFixed(2)}\n\n`;
    
    if (result.byType && Object.keys(result.byType).length > 0) {
      response += `By Transaction Type:\n`;
      Object.entries(result.byType).forEach(([type, data]) => {
        response += `• ${type}: ${data.count} transactions, $${data.amount.toFixed(2)}\n`;
      });
    }
    return response;
  }
  
  if (action === 'unknown') {
    return `I'm not sure how to help with that. Try commands like:\n• "Create a new customer named John"\n• "Show all appointments"\n• "List services"\n• "Show today's sales summary"`;
  }
  
  return `Operation completed successfully.`;
}

/**
 * Handle queries
 */
async function handleQuery(type, organizationId, params) {
  // Determine table based on type
  let table = 'core_entities';
  let filters = { entity_type: type };
  
  if (['appointment', 'sale', 'order'].includes(type)) {
    table = 'universal_transactions';
    filters = { transaction_type: type };
  }
  
  // Add any additional filters from params
  if (params.name) {
    filters.entity_name = params.name;
  }
  
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('organization_id', organizationId)
    .match(filters);
  
  if (error) throw error;
  return data;
}

/**
 * Execute complex operations
 */
async function executeOperation(operation, organizationId, params) {
  switch (operation) {
    case 'daily_summary':
      return await getDailySummary(organizationId);
    
    case 'process_appointments':
      return await processAppointments(organizationId);
    
    case 'generate_report':
      return await generateReport(organizationId, params);
    
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

/**
 * Get daily summary
 */
async function getDailySummary(organizationId) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get today's transactions
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('transaction_date', today)
    .lt('transaction_date', today + 'T23:59:59');
  
  // Calculate summary
  const summary = {
    date: today,
    totalTransactions: transactions?.length || 0,
    totalRevenue: transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0,
    byType: {}
  };
  
  // Group by type
  transactions?.forEach(t => {
    if (!summary.byType[t.transaction_type]) {
      summary.byType[t.transaction_type] = {
        count: 0,
        amount: 0
      };
    }
    summary.byType[t.transaction_type].count++;
    summary.byType[t.transaction_type].amount += t.total_amount || 0;
  });
  
  return summary;
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HERA MCP Server API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Chat endpoint: http://localhost:${PORT}/api/chat`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});