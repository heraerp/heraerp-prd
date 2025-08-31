#!/usr/bin/env node
/**
 * HERA MCP Server UAT Enhanced Version
 * Comprehensive business operations testing through natural language
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize services
const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// AI clients
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
}) : null;

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// Middleware
app.use(cors());
app.use(express.json());

// Enhanced System Prompt for UAT with Advanced AI Capabilities
const UAT_SYSTEM_PROMPT = `You are HERA AI, an advanced ERP assistant with deep understanding of business operations and natural language.

CORE CAPABILITIES:
1. NATURAL LANGUAGE UNDERSTANDING
   - Interpret complex, ambiguous, or incomplete requests
   - Extract implicit context from conversations
   - Handle typos, slang, and colloquialisms
   - Understand business intent behind queries

2. HERA UNIVERSAL ARCHITECTURE (6 Sacred Tables)
   - core_organizations: Multi-tenant business isolation
   - core_entities: All business objects (customers, products, employees, GL accounts)
   - core_dynamic_data: Unlimited custom fields without schema changes
   - core_relationships: Entity connections, hierarchies, status workflows
   - universal_transactions: All business transaction headers
   - universal_transaction_lines: Transaction details and breakdowns

3. BUSINESS OPERATIONS EXPERTISE
   - POS & Sales: Create transactions, process payments, handle returns/exchanges
   - Inventory: Track stock levels, manage transfers, adjust quantities, check availability
   - Customer Management: Profiles, purchase history, preferences, loyalty programs
   - Financial: Generate invoices, track payments, manage accounts receivable
   - Reporting: Sales analysis, inventory reports, customer insights, financial statements
   - Appointments: Scheduling, availability checking, reminders, rescheduling

4. INTELLIGENT FEATURES
   - CONTEXT AWARENESS: Remember conversation context and previous queries
   - SMART DEFAULTS: Apply sensible defaults when information is missing
   - ERROR RECOVERY: Suggest corrections for invalid requests
   - PREDICTIVE ASSISTANCE: Anticipate follow-up needs
   - MULTI-STEP WORKFLOWS: Handle complex operations requiring multiple actions

5. QUERY UNDERSTANDING
   - "Show me sales" → Generate today's sales report
   - "Create invoice for John" → Search for customer John and create sales transaction
   - "What's in stock?" → Generate current inventory report
   - "Book Sarah tomorrow 2pm" → Create appointment for Sarah at 2pm tomorrow
   - "How much did we sell yesterday?" → Generate yesterday's sales summary

RESPONSE FORMAT:
{
  "action": "pos-sale|inventory|appointment|payment|report|customer|query|analysis",
  "operation": "create|update|delete|query|process|analyze|summarize",
  "parameters": {
    // Intelligently extracted and inferred parameters
    // Include smart defaults where appropriate
  },
  "context": {
    "original_intent": "What the user really wants",
    "inferred_data": "Data we intelligently assumed",
    "suggestions": ["Helpful follow-up actions"]
  },
  "workflow": "workflow name if multi-step",
  "confidence": 0.0-1.0,
  "explanation": "Brief explanation of interpretation"
}

IMPORTANT RULES:
- Always try to fulfill the user's intent, even with incomplete information
- Use the organization context provided in requests
- Apply business logic and common sense
- Suggest helpful follow-ups or clarifications when needed
- For amounts without currency symbol, assume dollars
- For dates like "tomorrow" or "next week", calculate actual dates
- Handle product/customer names intelligently (fuzzy matching)`;

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'hera-mcp-server-uat',
    version: '3.0.0',
    features: ['pos', 'inventory', 'appointments', 'reporting']
  });
});

// Root endpoint with UAT tools
app.get('/', (req, res) => {
  res.json({
    service: 'HERA MCP Server UAT Enhanced',
    endpoints: {
      health: '/health',
      chat: '/api/chat',
      // UAT specific endpoints
      pos: '/api/uat/pos',
      inventory: '/api/uat/inventory',
      appointments: '/api/uat/appointments',
      reports: '/api/uat/reports',
      scenarios: '/api/uat/scenarios'
    }
  });
});

// Enhanced chat endpoint with UAT capabilities
app.post('/api/chat', async (req, res) => {
  try {
    const { message, organizationId, context = {} } = req.body;
    
    if (!message || !organizationId) {
      return res.status(400).json({ 
        error: 'Message and organizationId are required' 
      });
    }

    // Enhanced interpretation for UAT
    const interpretation = await interpretUATCommand(message, context);
    
    // Execute based on interpretation
    const result = await executeUATCommand(interpretation, organizationId);
    
    // Generate response
    const response = await generateUATResponse(interpretation, result);
    
    res.json({
      success: true,
      interpretation,
      result,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('UAT Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process UAT command',
      details: error.message
    });
  }
});

// POS Transaction endpoint
app.post('/api/uat/pos', async (req, res) => {
  try {
    const { items, payment, customer, organizationId } = req.body;
    
    // Create POS transaction with all details
    const transaction = await createPOSTransaction({
      organizationId,
      items,
      payment,
      customer,
      taxRate: 0.05 // 5% tax
    });
    
    res.json({ success: true, transaction });
  } catch (error) {
    console.error('POS error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Inventory management endpoint
app.post('/api/uat/inventory', async (req, res) => {
  try {
    const { action, productId, quantity, reason, organizationId } = req.body;
    
    const result = await manageInventory({
      action,
      productId,
      quantity,
      reason,
      organizationId
    });
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Inventory error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Appointment scheduling endpoint
app.post('/api/uat/appointments', async (req, res) => {
  try {
    const { action, appointment, organizationId } = req.body;
    
    const result = await manageAppointments({
      action,
      appointment,
      organizationId
    });
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Appointment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reporting endpoint
app.post('/api/uat/reports', async (req, res) => {
  try {
    const { reportType, dateRange, filters, organizationId } = req.body;
    
    const report = await generateReport({
      reportType,
      dateRange,
      filters,
      organizationId
    });
    
    res.json({ success: true, report });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// UAT Scenario runner
app.post('/api/uat/scenarios', async (req, res) => {
  try {
    const { scenario, organizationId } = req.body;
    
    const result = await runUATScenario(scenario, organizationId);
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Scenario error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced interpretation for UAT commands
async function interpretUATCommand(message, context) {
  // Try AI interpretation first
  if (openai || anthropic) {
    try {
      const aiInterpretation = await getAIInterpretation(message, context);
      if (aiInterpretation) return aiInterpretation;
    } catch (error) {
      console.log('AI interpretation failed, using patterns:', error.message);
    }
  }
  
  // Enhanced pattern matching for UAT
  return interpretWithPatterns(message, context);
}

// AI interpretation with UAT context
async function getAIInterpretation(message, context) {
  const prompt = UAT_SYSTEM_PROMPT + "\n\nUser message: " + message;
  
  if (anthropic) {
    try {
      const completion = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022", // Using latest and most powerful model
        max_tokens: 500,
        temperature: 0.3, // More focused responses
        system: UAT_SYSTEM_PROMPT,
        messages: [
          { 
            role: "user", 
            content: `Organization ID: ${context.organizationId || 'Not specified'}
Previous context: ${JSON.stringify(context.previousCommands || [])}
Current time: ${new Date().toISOString()}

User request: ${message}

Please interpret this request and provide a structured response for the HERA ERP system.`
          }
        ]
      });
      
      const response = JSON.parse(completion.content[0].text);
      console.log('Claude AI interpretation:', response);
      return response;
    } catch (error) {
      console.log('Claude interpretation failed:', error.message);
    }
  }
  
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: UAT_SYSTEM_PROMPT },
          { role: "user", content: message }
        ]
      });
      
      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.log('OpenAI interpretation failed:', error.message);
    }
  }
  
  return null;
}

// Pattern-based interpretation for UAT
function interpretWithPatterns(message, context) {
  const lowerMessage = message.toLowerCase();
  
  // POS patterns
  if (lowerMessage.match(/(?:create|process|ring up|checkout) (?:a )?sale/i) ||
      lowerMessage.includes('charge') || lowerMessage.includes('bill')) {
    return {
      action: 'pos-sale',
      operation: 'create',
      parameters: extractPOSDetails(message),
      confidence: 0.8
    };
  }
  
  // Inventory patterns
  if (lowerMessage.match(/(?:add|remove|adjust) .*inventory/i) ||
      lowerMessage.includes('stock') || lowerMessage.includes('transfer')) {
    return {
      action: 'inventory',
      operation: extractInventoryAction(message),
      parameters: extractInventoryDetails(message),
      confidence: 0.8
    };
  }
  
  // Appointment patterns
  if (lowerMessage.match(/(?:book|schedule|create) .*appointment/i) ||
      lowerMessage.includes('available slots') || lowerMessage.includes('reschedule')) {
    return {
      action: 'appointment',
      operation: 'create',
      parameters: extractAppointmentDetails(message),
      confidence: 0.7
    };
  }
  
  // Report patterns
  if (lowerMessage.includes('report') || lowerMessage.includes('summary') ||
      lowerMessage.includes('analytics')) {
    return {
      action: 'report',
      operation: 'generate',
      parameters: extractReportDetails(message),
      confidence: 0.8
    };
  }
  
  // Default
  return {
    action: 'unknown',
    operation: 'unknown',
    parameters: { originalMessage: message },
    confidence: 0.3
  };
}

// Execute UAT commands
async function executeUATCommand(interpretation, organizationId) {
  const { action, operation, parameters } = interpretation;
  
  switch (action) {
    case 'pos-sale':
      return await createPOSTransaction({
        organizationId,
        ...parameters
      });
      
    case 'inventory':
      return await manageInventory({
        organizationId,
        action: operation,
        ...parameters
      });
      
    case 'appointment':
      return await manageAppointments({
        organizationId,
        action: operation,
        ...parameters
      });
      
    case 'report':
      return await generateReport({
        organizationId,
        ...parameters
      });
      
    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

// Create POS transaction with full workflow
async function createPOSTransaction({ organizationId, items = [], payment, customer, taxRate = 0.05 }) {
  // 1. Validate items and check inventory
  const validatedItems = await validateAndPrepareItems(items, organizationId);
  
  // 2. Calculate totals
  const subtotal = validatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  
  // 3. Create transaction
  const transaction = {
    organization_id: organizationId,
    transaction_type: 'sale',
    transaction_code: `SALE-${Date.now()}`,
    transaction_date: new Date().toISOString(),
    total_amount: total,
    smart_code: 'HERA.POS.SALE.TXN.v1'
  };
  
  const { data: txn, error } = await supabase
    .from('universal_transactions')
    .insert(transaction)
    .select()
    .single();
    
  if (error) throw error;
  
  // 4. Create transaction lines
  const lines = validatedItems.map((item, index) => ({
    transaction_id: txn.id,
    line_entity_id: item.entity_id,
    line_number: index + 1,
    quantity: item.quantity,
    unit_price: item.price,
    line_amount: item.price * item.quantity
  }));
  
  await supabase
    .from('universal_transaction_lines')
    .insert(lines);
    
  // 5. Update inventory
  await updateInventoryForSale(validatedItems, organizationId);
  
  // 6. Process payment
  const paymentResult = await processPayment({
    transactionId: txn.id,
    amount: total,
    method: payment?.method || 'cash',
    details: payment?.details
  });
  
  return {
    transaction: txn,
    lines,
    payment: paymentResult,
    receipt: generateReceipt(txn, lines, payment)
  };
}

// Inventory management
async function manageInventory({ action, productId, quantity, reason, organizationId }) {
  switch (action) {
    case 'adjust':
      return await adjustInventory(productId, quantity, reason, organizationId);
      
    case 'transfer':
      return await transferInventory(productId, quantity, organizationId);
      
    case 'count':
      return await getInventoryCount(productId, organizationId);
      
    default:
      throw new Error(`Unknown inventory action: ${action}`);
  }
}

// Appointment management
async function manageAppointments({ action, appointment, organizationId }) {
  switch (action) {
    case 'create':
      return await createAppointment(appointment, organizationId);
      
    case 'check-availability':
      return await checkAvailability(appointment, organizationId);
      
    case 'reschedule':
      return await rescheduleAppointment(appointment, organizationId);
      
    case 'cancel':
      return await cancelAppointment(appointment.id, organizationId);
      
    default:
      throw new Error(`Unknown appointment action: ${action}`);
  }
}

// Report generation
async function generateReport({ reportType, dateRange, filters, organizationId }) {
  const startDate = dateRange?.start || new Date().toISOString().split('T')[0];
  const endDate = dateRange?.end || new Date().toISOString().split('T')[0];
  
  switch (reportType) {
    case 'sales':
      return await generateSalesReport(startDate, endDate, organizationId);
      
    case 'inventory':
      return await generateInventoryReport(organizationId);
      
    case 'customer':
      return await generateCustomerReport(filters?.customerId, organizationId);
      
    case 'appointment':
      return await generateAppointmentReport(startDate, endDate, organizationId);
      
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

// Sales report
async function generateSalesReport(startDate, endDate, organizationId) {
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'sale')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate + 'T23:59:59');
    
  const summary = {
    period: { start: startDate, end: endDate },
    totalTransactions: transactions?.length || 0,
    totalRevenue: transactions?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0,
    averageTransaction: 0,
    topProducts: [],
    hourlyBreakdown: {}
  };
  
  if (summary.totalTransactions > 0) {
    summary.averageTransaction = summary.totalRevenue / summary.totalTransactions;
  }
  
  return summary;
}

// UAT Scenario runner
async function runUATScenario(scenarioName, organizationId) {
  const scenarios = {
    'complete-salon-visit': [
      { action: 'create-customer', params: { name: 'Test Customer' } },
      { action: 'book-appointment', params: { service: 'haircut', time: '14:00' } },
      { action: 'check-in', params: { appointmentId: null } },
      { action: 'provide-service', params: { duration: 30 } },
      { action: 'recommend-products', params: { products: ['shampoo'] } },
      { action: 'create-sale', params: { services: ['haircut'], products: ['shampoo'] } },
      { action: 'process-payment', params: { method: 'card', amount: 75 } },
      { action: 'generate-receipt', params: {} },
      { action: 'book-followup', params: { weeks: 4 } }
    ],
    
    'restaurant-order': [
      { action: 'create-order', params: { items: ['pizza', 'soda'] } },
      { action: 'check-inventory', params: { items: ['pizza', 'soda'] } },
      { action: 'process-order', params: {} },
      { action: 'prepare-order', params: { time: 15 } },
      { action: 'complete-order', params: {} },
      { action: 'process-payment', params: { method: 'cash', amount: 25 } },
      { action: 'update-inventory', params: {} }
    ]
  };
  
  const steps = scenarios[scenarioName];
  if (!steps) throw new Error(`Unknown scenario: ${scenarioName}`);
  
  const results = [];
  let context = { organizationId };
  
  for (const step of steps) {
    try {
      const result = await executeScenarioStep(step, context);
      results.push({ step: step.action, status: 'success', result });
      
      // Update context with results
      if (step.action === 'create-customer' && result.id) {
        context.customerId = result.id;
      }
      if (step.action === 'book-appointment' && result.id) {
        context.appointmentId = result.id;
      }
    } catch (error) {
      results.push({ step: step.action, status: 'failed', error: error.message });
      break;
    }
  }
  
  return {
    scenario: scenarioName,
    steps: results,
    success: results.every(r => r.status === 'success')
  };
}

// Helper functions
function extractPOSDetails(message) {
  // Extract items, quantities, prices from natural language
  const items = [];
  
  // Check for simple amount transaction first
  const amountMatch = message.match(/\$(\d+(?:\.\d{2})?)/);
  if (amountMatch && items.length === 0) {
    // Create a generic sale item with the specified amount
    items.push({
      quantity: 1,
      name: 'General Sale',
      price: parseFloat(amountMatch[1])
    });
  } else {
    // Pattern: "2 haircuts and 1 hair color"
    const itemPattern = /(\d+)\s+([a-zA-Z\s]+?)(?:\s+and\s+|,\s*|$)/gi;
    let match;
    
    while ((match = itemPattern.exec(message)) !== null) {
      items.push({
        quantity: parseInt(match[1]),
        name: match[2].trim()
      });
    }
  }
  
  // Extract payment method
  const payment = {
    method: 'cash'
  };
  
  if (message.includes('card')) {
    payment.method = 'card';
    const cardPattern = /ending in (\d{4})/i;
    const cardMatch = message.match(cardPattern);
    if (cardMatch) {
      payment.lastFour = cardMatch[1];
    }
  }
  
  return { items, payment };
}

function extractInventoryAction(message) {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('transfer')) return 'transfer';
  if (lowerMessage.includes('count')) return 'count';
  return 'adjust';
}

function extractInventoryDetails(message) {
  const quantityPattern = /(\d+)\s+(?:units?|items?)?/i;
  const match = message.match(quantityPattern);
  
  return {
    quantity: match ? parseInt(match[1]) : 1,
    reason: message.includes('damage') ? 'damage' : 'adjustment'
  };
}

function extractAppointmentDetails(message) {
  const details = {
    date: 'today',
    time: '14:00',
    service: 'consultation'
  };
  
  // Extract time
  const timePattern = /at\s+(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)/i;
  const timeMatch = message.match(timePattern);
  if (timeMatch) {
    details.time = normalizeTime(timeMatch[1]);
  }
  
  // Extract date
  if (message.includes('tomorrow')) {
    details.date = 'tomorrow';
  } else if (message.includes('next')) {
    details.date = 'next-week';
  }
  
  return details;
}

function extractReportDetails(message) {
  const details = {
    reportType: 'sales',
    dateRange: {}
  };
  
  if (message.includes('inventory')) {
    details.reportType = 'inventory';
  } else if (message.includes('customer')) {
    details.reportType = 'customer';
  } else if (message.includes('appointment')) {
    details.reportType = 'appointment';
  }
  
  // Extract date range
  if (message.includes('today')) {
    details.dateRange = {
      start: new Date().toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    };
  } else if (message.includes('this month')) {
    const now = new Date();
    details.dateRange = {
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    };
  }
  
  return details;
}

function generateReceipt(transaction, lines, payment) {
  const subtotal = lines.reduce((sum, l) => sum + l.line_amount, 0);
  const tax = transaction.total_amount - subtotal;
  
  return {
    receiptNumber: `RCP-${transaction.transaction_code}`,
    date: transaction.transaction_date,
    items: lines.map((l, idx) => ({
      name: `Item ${idx + 1}`,
      quantity: l.quantity,
      price: l.unit_price,
      total: l.line_amount
    })),
    subtotal: subtotal,
    tax: tax,
    total: transaction.total_amount,
    payment: {
      method: payment?.method || 'cash',
      amount: transaction.total_amount
    }
  };
}

// Generate UAT response
async function generateUATResponse(interpretation, result) {
  const { action, operation } = interpretation;
  
  if (action === 'pos-sale' && result.transaction) {
    return `✅ Sale completed successfully!
    
Receipt #${result.receipt.receiptNumber}
Total: $${result.receipt.total.toFixed(2)}
Payment: ${result.receipt.payment.method}

Transaction ID: ${result.transaction.id}`;
  }
  
  if (action === 'inventory' && result) {
    return `✅ Inventory ${operation} completed successfully!
    
${JSON.stringify(result, null, 2)}`;
  }
  
  if (action === 'appointment' && result) {
    return `✅ Appointment ${operation} successful!
    
${JSON.stringify(result, null, 2)}`;
  }
  
  if (action === 'report' && result) {
    return formatReportResponse(result);
  }
  
  return `Operation completed: ${JSON.stringify(result, null, 2)}`;
}

function formatReportResponse(report) {
  if (report.totalTransactions !== undefined) {
    return `📊 Sales Report
    
Period: ${report.period.start} to ${report.period.end}
Total Transactions: ${report.totalTransactions}
Total Revenue: $${report.totalRevenue.toFixed(2)}
Average Transaction: $${report.averageTransaction.toFixed(2)}`;
  }
  
  return `📊 Report Generated\n\n${JSON.stringify(report, null, 2)}`;
}

// Helper stubs - implement based on your needs
async function validateAndPrepareItems(items, organizationId) {
  // Lookup items in database and get prices
  return items.map((item, index) => ({
    ...item,
    entity_id: `temp-${Date.now()}-${index}`,
    price: item.price || 50.00 // Use provided price or default
  }));
}

async function updateInventoryForSale(items, organizationId) {
  // Update inventory levels
  return true;
}

async function processPayment({ transactionId, amount, method, details }) {
  // Process payment
  return {
    success: true,
    authCode: `AUTH-${Date.now()}`,
    method,
    amount
  };
}

async function adjustInventory(productId, quantity, reason, organizationId) {
  // Adjust inventory
  return { productId, newQuantity: quantity, reason };
}

async function createAppointment(appointment, organizationId) {
  // Create appointment
  return {
    id: `APT-${Date.now()}`,
    ...appointment,
    status: 'booked'
  };
}

function normalizeTime(timeStr) {
  // Convert various time formats to 24hr
  return timeStr;
}

// Additional helper functions for enhanced UAT
async function generateInventoryReport(organizationId) {
  const { data: products } = await supabase
    .from('core_entities')
    .select('*, core_dynamic_data(*)')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'product');
    
  return {
    totalProducts: products?.length || 0,
    lowStock: products?.filter(p => {
      // Check stock level in dynamic data
      const stockData = p.core_dynamic_data?.find(d => d.field_name === 'stock_level');
      return stockData && stockData.field_value_number < 10;
    }).length || 0,
    totalValue: 0, // Calculate based on stock * price
    products: products || []
  };
}

async function generateCustomerReport(customerId, organizationId) {
  const filter = { organization_id: organizationId };
  if (customerId) filter.id = customerId;
  
  const { data: customers } = await supabase
    .from('core_entities')
    .select('*')
    .match(filter)
    .eq('entity_type', 'customer');
    
  return {
    totalCustomers: customers?.length || 0,
    customers: customers || []
  };
}

async function generateAppointmentReport(startDate, endDate, organizationId) {
  const { data: appointments } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'appointment')
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate + 'T23:59:59');
    
  return {
    period: { start: startDate, end: endDate },
    totalAppointments: appointments?.length || 0,
    appointments: appointments || []
  };
}

async function executeScenarioStep(step, context) {
  // Simplified scenario step execution
  return { 
    success: true, 
    action: step.action,
    params: step.params,
    result: `Executed ${step.action}`
  };
}

async function transferInventory(productId, quantity, organizationId) {
  return {
    success: true,
    productId,
    quantity,
    action: 'transfer',
    message: `Transferred ${quantity} units`
  };
}

async function getInventoryCount(productId, organizationId) {
  return {
    productId,
    currentStock: 100, // Default for testing
    lastUpdated: new Date().toISOString()
  };
}

async function checkAvailability(appointment, organizationId) {
  return {
    available: true,
    slots: [
      { time: '09:00', available: true },
      { time: '10:00', available: true },
      { time: '14:00', available: true },
      { time: '15:00', available: true }
    ]
  };
}

async function rescheduleAppointment(appointment, organizationId) {
  return {
    success: true,
    appointmentId: appointment.id,
    newTime: appointment.newTime || '14:00',
    message: 'Appointment rescheduled successfully'
  };
}

async function cancelAppointment(appointmentId, organizationId) {
  return {
    success: true,
    appointmentId,
    status: 'cancelled',
    message: 'Appointment cancelled successfully'
  };
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HERA MCP Server UAT Enhanced running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 UAT Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`🛍️ POS endpoint: http://localhost:${PORT}/api/uat/pos`);
  console.log(`📦 Inventory endpoint: http://localhost:${PORT}/api/uat/inventory`);
  console.log(`📅 Appointments endpoint: http://localhost:${PORT}/api/uat/appointments`);
  console.log(`📊 Reports endpoint: http://localhost:${PORT}/api/uat/reports`);
  console.log(`🧪 Scenarios endpoint: http://localhost:${PORT}/api/uat/scenarios`);
  
  // AI Status
  console.log('\n🤖 AI Integration Status:');
  if (anthropic) {
    console.log('✅ Claude AI (Anthropic) - ACTIVE with Claude 3.5 Sonnet');
  } else {
    console.log('❌ Claude AI - Not configured (add ANTHROPIC_API_KEY)');
  }
  if (openai) {
    console.log('✅ OpenAI GPT - ACTIVE');
  } else {
    console.log('❌ OpenAI - Not configured (add OPENAI_API_KEY)');
  }
  console.log(anthropic || openai ? '🧠 AI-powered natural language understanding enabled!' : '⚠️  Using pattern matching only (limited capabilities)');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});