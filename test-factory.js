#!/usr/bin/env node

/**
 * Test Factory Dashboard Availability
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

async function testFactory() {
  try {
    console.log(chalk.blue('🏭 Testing Factory Dashboard availability...\n'));
    
    const baseUrl = 'http://localhost:3001';
    
    // Test main page
    console.log(chalk.gray('Testing main page...'));
    const mainResponse = await fetch(baseUrl);
    console.log(chalk.green(`✓ Main page: ${mainResponse.status}`));
    
    // Test factory page
    console.log(chalk.gray('Testing factory page...'));
    const factoryResponse = await fetch(`${baseUrl}/factory`);
    console.log(chalk.green(`✓ Factory page: ${factoryResponse.status}`));
    
    if (factoryResponse.ok) {
      const html = await factoryResponse.text();
      if (html.includes('HERA Universal Factory')) {
        console.log(chalk.green('✓ Factory Dashboard is rendering correctly'));
      } else {
        console.log(chalk.yellow('⚠ Factory Dashboard may not be rendering completely'));
      }
    }
    
    console.log(chalk.cyan('\n🚀 Factory Dashboard should be available at:'));
    console.log(chalk.gray(`   ${baseUrl}/factory`));
    
  } catch (error) {
    console.error(chalk.red('❌ Error testing Factory Dashboard:'), error.message);
    console.log(chalk.yellow('\n💡 Make sure the development server is running:'));
    console.log(chalk.gray('   npm run dev'));
  }
}

testFactory();