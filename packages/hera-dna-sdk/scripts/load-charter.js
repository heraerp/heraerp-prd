#!/usr/bin/env node
/**
 * HERA DNA Charter Loader
 * Loads and validates the HERA DNA configuration
 */

const fs = require('fs');
const path = require('path');

const DNA_CONFIG_PATH = path.join(process.cwd(), 'hera.dna.json');

console.log('🧬 HERA DNA Charter Loader\n');

try {
  // Check if DNA config exists
  if (!fs.existsSync(DNA_CONFIG_PATH)) {
    console.error('❌ hera.dna.json not found in project root');
    process.exit(1);
  }

  // Load and parse DNA config
  const dnaConfig = JSON.parse(fs.readFileSync(DNA_CONFIG_PATH, 'utf8'));
  
  console.log('📋 DNA Configuration Loaded:');
  console.log(`   Version: ${dnaConfig.version}`);
  console.log(`   Sacred Tables: ${dnaConfig.sacred_tables.length}`);
  console.log(`   Modules: ${dnaConfig.modules.length}`);
  console.log(`   Entity Types: ${dnaConfig.entity_types.length}`);
  console.log(`   Forbidden Patterns: ${dnaConfig.forbidden_patterns.length}`);
  
  // Validate configuration
  const requiredFields = ['version', 'sacred_tables', 'smart_code_pattern', 'modules'];
  const missingFields = requiredFields.filter(field => !dnaConfig[field]);
  
  if (missingFields.length > 0) {
    console.error(`\n❌ Missing required fields: ${missingFields.join(', ')}`);
    process.exit(1);
  }
  
  // Validate smart code pattern is a valid regex
  try {
    new RegExp(dnaConfig.smart_code_pattern);
    console.log(`\n✅ Smart Code Pattern: Valid regex`);
  } catch (error) {
    console.error(`\n❌ Invalid smart code regex pattern: ${error.message}`);
    process.exit(1);
  }
  
  // Save to environment for other scripts
  process.env.HERA_DNA_CONFIG = JSON.stringify(dnaConfig);
  
  console.log('\n✅ DNA Charter loaded successfully!');
  
} catch (error) {
  console.error(`\n❌ Failed to load DNA charter: ${error.message}`);
  process.exit(1);
}