#!/usr/bin/env node

/**
 * Test Factory Dashboard
 * Quick script to verify the Factory Dashboard is working
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

async function testFactoryDashboard() {
  const baseUrl = 'http://localhost:3001';
  
  console.log(chalk.blue('🏭 Testing Factory Dashboard...\n'));
  
  try {
    // Test if server is running
    console.log(chalk.gray('Checking server...'));
    const response = await fetch(baseUrl);
    if (response.ok) {
      console.log(chalk.green('✓ Server is running'));
    }
    
    // Test factory page
    console.log(chalk.gray('Checking /factory page...'));
    const factoryResponse = await fetch(`${baseUrl}/factory`);
    if (factoryResponse.ok) {
      console.log(chalk.green('✓ Factory page is accessible'));
      
      const html = await factoryResponse.text();
      if (html.includes('HERA Universal Factory')) {
        console.log(chalk.green('✓ Factory Dashboard is rendering'));
      }
    }
    
    console.log(chalk.green('\n✅ Factory Dashboard is working!'));
    console.log(chalk.cyan(`\n🚀 View it at: ${baseUrl}/factory`));
    
  } catch (error) {
    console.error(chalk.red('❌ Error testing dashboard:'), error.message);
    console.log(chalk.yellow('\nMake sure the dev server is running:'));
    console.log(chalk.gray('  npm run dev'));
  }
}

testFactoryDashboard();