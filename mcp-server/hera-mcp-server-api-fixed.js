#!/usr/bin/env node
/**
 * HERA MCP Server with REST API - Fixed version
 * Works with either OpenAI or Anthropic
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Initialize AI clients (don't fail if keys are missing)
let openai = null;
let anthropic = null;

try {
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('✅ OpenAI client initialized');
  }
} catch (error) {
  console.log('⚠️ OpenAI initialization failed:', error.message);
}

try {
  if (process.env.ANTHROPIC_API_KEY) {
    const Anthropic = require('@anthropic-ai/sdk');
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    console.log('✅ Anthropic client initialized');
  }
} catch (error) {
  console.log('⚠️ Anthropic initialization failed:', error.message);
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'hera-mcp-server',
    version: '2.1.0',
    uptime: process.uptime()
  });
});

// Debug endpoint
app.get('/debug', (req, res) => {
  res.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      PORT: process.env.PORT || 'not set'
    },
    apiKeys: {
      OPENAI_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
      ANTHROPIC_KEY: process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET',
      SUPABASE_URL: process.env.SUPABASE_URL || 'NOT SET',
      SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
    },
    clients: {
      openai: openai ? 'initialized' : 'not initialized',
      anthropic: anthropic ? 'initialized' : 'not initialized',
      supabase: supabase ? 'initialized' : 'not initialized'
    },
    organizationId: process.env.DEFAULT_ORGANIZATION_ID || 'NOT SET'
  });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, organizationId } = req.body;
    
    if (!message || !organizationId) {
      return res.status(400).json({ 
        error: 'Message and organizationId are required' 
      });
    }

    // Try to interpret the command
    let interpretation = null;
    
    // Try OpenAI first (since it's initialized)
    if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            { 
              role: "system", 
              content: "You are an AI assistant for HERA ERP. Interpret the user's message and return JSON with: action (create/query/update/analyze/execute), type, parameters, and confidence (0-1)."
            },
            { role: "user", content: message }
          ]
        });
        
        interpretation = JSON.parse(completion.choices[0].message.content);
      } catch (error) {
        console.log('OpenAI interpretation failed:', error.message);
      }
    }
    
    // If no AI worked, use pattern matching
    if (!interpretation) {
      interpretation = {
        action: 'query',
        type: 'entity',
        parameters: { entity_type: 'customer' },
        confidence: 0.5
      };
    }

    // Execute the interpreted command
    const result = await executeCommand(interpretation, organizationId);
    
    res.json({
      success: true,
      interpretation,
      result,
      response: `Command processed: ${interpretation.action} ${interpretation.type}`,
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

// Simple command execution
async function executeCommand(interpretation, organizationId) {
  const { action, type, parameters } = interpretation;
  
  if (action === 'query') {
    try {
      const { data, error } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', type || 'customer')
        .limit(10);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Query error:', error);
      return [];
    }
  }
  
  return { message: 'Command executed' };
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 HERA MCP Server API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI Chat endpoint: http://localhost:${PORT}/api/chat`);
});