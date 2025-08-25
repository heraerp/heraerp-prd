#!/usr/bin/env node
/**
 * Railway Deployment Debug Script
 * Helps diagnose environment variable and API key issues
 */

console.log('🔍 RAILWAY DEPLOYMENT DIAGNOSTICS');
console.log('=================================\n');

// Check Node version
console.log('📦 Node.js Version:', process.version);
console.log('🖥️  Platform:', process.platform);
console.log('🔧 Environment:', process.env.NODE_ENV || 'not set');
console.log('\n');

// Check critical environment variables
console.log('🔑 ENVIRONMENT VARIABLES CHECK:');
console.log('-------------------------------');

const envVars = [
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'DEFAULT_ORGANIZATION_ID',
  'NODE_ENV',
  'RAILWAY_ENVIRONMENT',
  'RAILWAY_PROJECT_ID',
  'RAILWAY_SERVICE_ID'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    if (varName.includes('KEY') || varName.includes('SECRET')) {
      const masked = value.substring(0, 10) + '...' + value.substring(value.length - 4);
      console.log(`✅ ${varName}: ${masked}`);
    } else if (varName === 'SUPABASE_URL') {
      console.log(`✅ ${varName}: ${value}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n');

// Test AI clients initialization
console.log('🤖 AI CLIENTS INITIALIZATION:');
console.log('-----------------------------');

// Test OpenAI
if (process.env.OPENAI_API_KEY) {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI client initialized successfully');
    
    // Test the API key
    openai.models.list()
      .then(() => console.log('✅ OpenAI API key is valid'))
      .catch(err => console.log('❌ OpenAI API key error:', err.message));
  } catch (error) {
    console.log('❌ OpenAI initialization error:', error.message);
  }
} else {
  console.log('❌ OpenAI API key not found');
}

// Test Anthropic
if (process.env.ANTHROPIC_API_KEY) {
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    console.log('✅ Anthropic client initialized successfully');
    
    // Note: Anthropic doesn't have a simple test endpoint like OpenAI
    console.log('ℹ️  Anthropic API key format looks valid');
  } catch (error) {
    console.log('❌ Anthropic initialization error:', error.message);
  }
} else {
  console.log('❌ Anthropic API key not found');
}

console.log('\n');

// Test Supabase connection
console.log('🗄️  SUPABASE CONNECTION TEST:');
console.log('----------------------------');

if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('✅ Supabase client initialized');
    
    // Test connection
    supabase
      .from('core_organizations')
      .select('count')
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.log('❌ Supabase connection error:', error.message);
        } else {
          console.log('✅ Supabase connection successful');
        }
      });
  } catch (error) {
    console.log('❌ Supabase initialization error:', error.message);
  }
} else {
  console.log('❌ Supabase credentials not found');
}

console.log('\n');
console.log('📝 DIAGNOSTIC SUMMARY:');
console.log('--------------------');
console.log('Run this script on Railway to diagnose deployment issues.');
console.log('Check the logs above for any ❌ marks indicating problems.');