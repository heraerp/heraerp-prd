#!/usr/bin/env tsx
// scripts/load-salon-ucr-templates.ts
// Load SALON industry UCR templates into database

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { saveUCRBundle, listUCRBundles } from '@/lib/universal/ucr-loader';
import { UCRBundle } from '@/lib/universal/ucr-types';

const TEMPLATES_DIR = join(process.cwd(), 'src/lib/universal/ucr-templates');

async function loadTemplates() {
  console.log('🚀 Loading SALON UCR Templates...\n');

  // Get all JSON files in templates directory
  const files = readdirSync(TEMPLATES_DIR)
    .filter(file => file.endsWith('.json'))
    .filter(file => file.startsWith('salon-')); // Only salon templates

  let loaded = 0;
  let failed = 0;

  for (const file of files) {
    try {
      console.log(`📦 Loading ${file}...`);
      
      // Read and parse template
      const content = readFileSync(join(TEMPLATES_DIR, file), 'utf-8');
      const bundle = JSON.parse(content) as UCRBundle;
      
      // Save to database (global scope for templates)
      const result = await saveUCRBundle(bundle, null);
      
      if (result.success) {
        console.log(`✅ Loaded: ${bundle.metadata.title} (${bundle.code})`);
        loaded++;
      } else {
        console.error(`❌ Failed: ${bundle.metadata.title} - ${result.error}`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ Error loading ${file}:`, error);
      failed++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully loaded: ${loaded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📁 Total files: ${files.length}`);

  // List all loaded bundles
  console.log('\n📋 Available UCR Bundles:');
  const bundles = await listUCRBundles(null);
  
  bundles
    .filter(b => b.smartCode.includes('SALON'))
    .forEach(bundle => {
      console.log(`  - ${bundle.smartCode}: ${bundle.title} (${bundle.version})`);
    });
}

// Run if called directly
if (require.main === module) {
  loadTemplates()
    .then(() => {
      console.log('\n✨ Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Fatal error:', error);
      process.exit(1);
    });
}

export { loadTemplates };