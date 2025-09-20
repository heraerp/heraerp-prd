#!/usr/bin/env node

/**
 * HERA Contract-First Development CLI
 * 
 * This CLI tool enforces contract-first development and prevents implementation
 * without proper contracts and failing tests.
 * 
 * Usage:
 *   node scripts/contract-first-cli.js handshake --user-request "Create grants management"
 *   node scripts/contract-first-cli.js validate-handshake --id handshake-123
 *   node scripts/contract-first-cli.js execute-workflow --id handshake-123
 *   node scripts/contract-first-cli.js check-readiness --plan-id plan-123
 */

const { program } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

// Since we're in a JS file calling TS modules, we'll use dynamic imports
let ClaudeContractHandshakeSystem;
let ContractFirstEnforcer;

async function initializeModules() {
  try {
    // Dynamically import the TypeScript modules
    const handshakeModule = await import('../src/scripts/claude-contract-handshake.js');
    const enforcerModule = await import('../src/scripts/contract-first-enforcer.js');
    
    ClaudeContractHandshakeSystem = handshakeModule.default;
    ContractFirstEnforcer = enforcerModule.default;
  } catch (error) {
    console.error(chalk.red('Failed to load TypeScript modules. Make sure to build first:'));
    console.error(chalk.yellow('npm run build'));
    process.exit(1);
  }
}

// Utility functions
function displaySuccess(message) {
  console.log(chalk.green('✅ ' + message));
}

function displayError(message) {
  console.log(chalk.red('❌ ' + message));
}

function displayWarning(message) {
  console.log(chalk.yellow('⚠️  ' + message));
}

function displayInfo(message) {
  console.log(chalk.blue('ℹ️  ' + message));
}

function displayHeader(title) {
  console.log();
  console.log(chalk.bold.cyan('='.repeat(60)));
  console.log(chalk.bold.cyan(`  ${title}`));
  console.log(chalk.bold.cyan('='.repeat(60)));
  console.log();
}

// Command: Create handshake template
program
  .command('handshake')
  .description('Create a handshake template for Claude to fill out')
  .requiredOption('-r, --user-request <request>', 'The user request that needs implementation')
  .option('-o, --output <file>', 'Output file for the handshake template', './handshake-template.json')
  .action(async (options) => {
    await initializeModules();
    
    displayHeader('HERA Contract-First Development - Create Handshake');
    
    try {
      const handshakeSystem = new ClaudeContractHandshakeSystem();
      const template = handshakeSystem.createHandshakeTemplate(options.userRequest);
      
      fs.writeFileSync(options.output, JSON.stringify(template, null, 2));
      
      displaySuccess(`Handshake template created: ${options.output}`);
      displayInfo('Claude must fill out this template completely before implementation');
      displayInfo('All [CLAUDE: ...] placeholders must be replaced with actual content');
      
      console.log(chalk.gray('\nNext steps:'));
      console.log(chalk.gray('1. Claude fills out the handshake template'));
      console.log(chalk.gray('2. Run: node scripts/contract-first-cli.js validate-handshake --file ' + options.output));
      console.log(chalk.gray('3. If approved, run: node scripts/contract-first-cli.js execute-workflow --id <handshake-id>'));
      
    } catch (error) {
      displayError('Failed to create handshake template: ' + error.message);
      process.exit(1);
    }
  });

// Command: Validate handshake
program
  .command('validate-handshake')
  .description('Validate a completed handshake from Claude')
  .option('-f, --file <file>', 'Handshake file to validate')
  .option('-i, --id <id>', 'Handshake ID to validate')
  .action(async (options) => {
    await initializeModules();
    
    displayHeader('HERA Contract-First Development - Validate Handshake');
    
    try {
      let handshakeData;
      
      if (options.file) {
        if (!fs.existsSync(options.file)) {
          displayError(`Handshake file not found: ${options.file}`);
          process.exit(1);
        }
        handshakeData = JSON.parse(fs.readFileSync(options.file, 'utf-8'));
      } else if (options.id) {
        const handshakePath = `./handshakes/${options.id}.json`;
        if (!fs.existsSync(handshakePath)) {
          displayError(`Handshake not found: ${handshakePath}`);
          process.exit(1);
        }
        handshakeData = JSON.parse(fs.readFileSync(handshakePath, 'utf-8'));
      } else {
        displayError('Either --file or --id must be provided');
        process.exit(1);
      }
      
      const handshakeSystem = new ClaudeContractHandshakeSystem();
      const result = await handshakeSystem.validateClaudeHandshake(handshakeData);
      
      if (result.success) {
        displaySuccess('Handshake validation passed!');
        displayInfo(`Handshake ID: ${result.handshakeId}`);
        
        if (result.warnings.length > 0) {
          console.log(chalk.yellow('\nWarnings:'));
          result.warnings.forEach(warning => displayWarning(warning));
        }
        
        console.log(chalk.gray('\nNext steps:'));
        result.nextSteps.forEach(step => console.log(chalk.gray('• ' + step)));
        
      } else {
        displayError('Handshake validation failed!');
        console.log(chalk.red('\nErrors:'));
        result.errors.forEach(error => displayError(error));
        
        if (result.warnings.length > 0) {
          console.log(chalk.yellow('\nWarnings:'));
          result.warnings.forEach(warning => displayWarning(warning));
        }
        
        process.exit(1);
      }
      
    } catch (error) {
      displayError('Failed to validate handshake: ' + error.message);
      process.exit(1);
    }
  });

// Command: Execute complete workflow
program
  .command('execute-workflow')
  .description('Execute the complete contract-first workflow')
  .requiredOption('-i, --id <id>', 'Handshake ID to execute workflow for')
  .action(async (options) => {
    await initializeModules();
    
    displayHeader('HERA Contract-First Development - Execute Workflow');
    
    try {
      const handshakeSystem = new ClaudeContractHandshakeSystem();
      const result = await handshakeSystem.executeContractFirstWorkflow(options.id);
      
      if (result.success) {
        displaySuccess(`Workflow completed successfully! Status: ${result.status}`);
        
        if (result.errors.length > 0) {
          console.log(chalk.yellow('\nNon-critical issues:'));
          result.errors.forEach(error => displayWarning(error));
        }
        
        console.log(chalk.green('\nNext actions:'));
        result.nextActions.forEach(action => console.log(chalk.green('• ' + action)));
        
      } else {
        displayError(`Workflow failed! Status: ${result.status}`);
        
        console.log(chalk.red('\nErrors:'));
        result.errors.forEach(error => displayError(error));
        
        console.log(chalk.yellow('\nRequired actions:'));
        result.nextActions.forEach(action => console.log(chalk.yellow('• ' + action)));
        
        process.exit(1);
      }
      
    } catch (error) {
      displayError('Failed to execute workflow: ' + error.message);
      process.exit(1);
    }
  });

// Command: Check implementation readiness
program
  .command('check-readiness')
  .description('Check if implementation can proceed')
  .requiredOption('-p, --plan-id <planId>', 'Plan ID to check readiness for')
  .action(async (options) => {
    await initializeModules();
    
    displayHeader('HERA Contract-First Development - Check Implementation Readiness');
    
    try {
      const enforcer = new ContractFirstEnforcer();
      const validation = await enforcer.validateImplementationReadiness(options.planId);
      
      if (validation.canImplement) {
        displaySuccess('Implementation can proceed!');
        console.log(chalk.green('\n🚀 All requirements met:'));
        console.log(chalk.green('  ✅ Contracts defined'));
        console.log(chalk.green('  ✅ Tests created and failing appropriately'));
        console.log(chalk.green('  ✅ TypeScript compilation clean'));
        console.log(chalk.green('  ✅ ESLint validation passed'));
        
      } else {
        displayError('Implementation is BLOCKED!');
        
        console.log(chalk.red('\nErrors:'));
        validation.errors.forEach(error => displayError(error));
        
        console.log(chalk.yellow('\nRequired actions:'));
        validation.requirements.forEach(req => console.log(chalk.yellow('• ' + req)));
        
        process.exit(1);
      }
      
    } catch (error) {
      displayError('Failed to check readiness: ' + error.message);
      process.exit(1);
    }
  });

// Command: Force block implementation (emergency use)
program
  .command('block-implementation')
  .description('Emergency command to block all implementation until contracts are fixed')
  .requiredOption('-r, --reason <reason>', 'Reason for blocking implementation')
  .action(async (options) => {
    displayHeader('HERA Contract-First Development - EMERGENCY BLOCK');
    
    const blockFile = './IMPLEMENTATION_BLOCKED.flag';
    const blockReason = {
      blocked: true,
      reason: options.reason,
      timestamp: new Date().toISOString(),
      unblock_command: 'rm IMPLEMENTATION_BLOCKED.flag'
    };
    
    fs.writeFileSync(blockFile, JSON.stringify(blockReason, null, 2));
    
    displayError('🚫 IMPLEMENTATION BLOCKED 🚫');
    displayError(`Reason: ${options.reason}`);
    displayInfo(`To unblock: rm ${blockFile}`);
    
    process.exit(1);
  });

// Command: Status overview
program
  .command('status')
  .description('Show overall status of contract-first development system')
  .action(async () => {
    displayHeader('HERA Contract-First Development - System Status');
    
    // Check if implementation is blocked
    const blockFile = './IMPLEMENTATION_BLOCKED.flag';
    if (fs.existsSync(blockFile)) {
      const blockInfo = JSON.parse(fs.readFileSync(blockFile, 'utf-8'));
      displayError('🚫 IMPLEMENTATION IS BLOCKED 🚫');
      displayError(`Reason: ${blockInfo.reason}`);
      displayError(`Since: ${blockInfo.timestamp}`);
      displayInfo(`To unblock: ${blockInfo.unblock_command}`);
      return;
    }
    
    // Check directories
    const dirs = ['./handshakes', './plans', './src/contracts', './tests/type-safety'];
    console.log(chalk.blue('📁 Directory Status:'));
    
    dirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        displaySuccess(`${dir}: ${files.length} files`);
      } else {
        displayWarning(`${dir}: Not found`);
      }
    });
    
    // Check recent activity
    console.log(chalk.blue('\n📊 Recent Activity:'));
    
    if (fs.existsSync('./handshakes')) {
      const handshakes = fs.readdirSync('./handshakes').length;
      displayInfo(`Handshakes created: ${handshakes}`);
    }
    
    if (fs.existsSync('./plans')) {
      const plans = fs.readdirSync('./plans').length;
      displayInfo(`Plans created: ${plans}`);
    }
    
    console.log(chalk.green('\n✅ Contract-First Development System is operational'));
  });

// Main program
program
  .name('contract-first-cli')
  .description('HERA Contract-First Development CLI - Prevents Claude from coding wrongly')
  .version('1.0.0');

// Handle no command
if (process.argv.length === 2) {
  displayHeader('HERA Contract-First Development CLI');
  console.log(chalk.cyan('This tool enforces contract-first development and prevents implementation'));
  console.log(chalk.cyan('without proper contracts and failing tests.'));
  console.log();
  program.help();
}

program.parse();