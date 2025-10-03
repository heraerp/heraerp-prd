#!/usr/bin/env node

/**
 * Generate combined SQL for HERA V2 Functions
 * Outputs SQL that can be run in Supabase SQL Editor
 */

const fs = require('fs').promises;
const path = require('path');

async function main() {
  console.log('-- ============================================');
  console.log('-- HERA V2 Entity Functions - Combined SQL');
  console.log('-- ============================================');
  console.log('-- Run this in Supabase SQL Editor');
  console.log('-- ============================================\n');
  
  const functions = [
    'hera_entity_read_v2.sql',
    'hera_entity_delete_v2.sql'
  ];
  
  for (const filename of functions) {
    const sqlPath = path.join(__dirname, '../database/functions/v2', filename);
    try {
      const sql = await fs.readFile(sqlPath, 'utf8');
      console.log(`\n-- ============================================`);
      console.log(`-- ${filename}`);
      console.log(`-- ============================================\n`);
      console.log(sql);
      console.log('\n');
    } catch (error) {
      console.error(`-- ERROR: Could not read ${filename}: ${error.message}`);
    }
  }
  
  console.log('\n-- ============================================');
  console.log('-- End of combined SQL');
  console.log('-- ============================================');
}

main().catch(console.error);