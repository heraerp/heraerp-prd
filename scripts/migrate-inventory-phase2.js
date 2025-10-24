#!/usr/bin/env node

/**
 * Phase 1 → Phase 2 Inventory Migration Script
 *
 * Run: node scripts/migrate-inventory-phase2.js
 */

const readline = require('readline');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

async function main() {
  log.title('🚀 HERA Phase 2 Inventory Migration');

  // Read organization ID from environment or prompt
  const orgId = process.env.DEFAULT_ORGANIZATION_ID;

  if (!orgId) {
    log.error('DEFAULT_ORGANIZATION_ID not set in .env');
    log.info('Please add DEFAULT_ORGANIZATION_ID=<your-org-uuid> to .env.local');
    process.exit(1);
  }

  log.info(`Organization ID: ${orgId}`);
  log.info('This will create STOCK_LEVEL entities for all products at all branches');

  // Confirmation prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await new Promise((resolve) => {
    rl.question('\nProceed with migration? (yes/no): ', (answer) => {
      rl.close();
      if (answer.toLowerCase() !== 'yes') {
        log.warn('Migration cancelled');
        process.exit(0);
      }
      resolve();
    });
  });

  console.log('');

  // Import and run migration
  try {
    // Dynamically import the migration module
    const migrationPath = '../src/lib/inventory/migrate-to-phase2.ts';

    log.info('Starting migration...');
    log.warn('Note: This script needs to be run in a browser context or converted to server-side');
    log.info('');
    log.info('RECOMMENDED APPROACH:');
    log.info('1. Start your dev server: npm run dev');
    log.info('2. Navigate to /salon/inventory');
    log.info('3. Open browser console');
    log.info('4. Run this command:');
    console.log('');
    console.log(`${colors.cyan}const { migrateToPhase2 } = await import('/src/lib/inventory/migrate-to-phase2.ts');`);
    console.log(`const result = await migrateToPhase2('${orgId}');`);
    console.log(`console.log('Migration result:', result);${colors.reset}`);
    console.log('');

  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);
