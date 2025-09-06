#!/usr/bin/env node

/**
 * HERA MCP E2E Test Runner
 * Smart Code: HERA.SCRIPT.E2E.MCP.RUNNER.v1
 * 
 * Runs Playwright E2E tests with MCP integration
 */

const { spawn } = require('child_process')
const path = require('path')

const COLORS = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
}

function log(message, color = COLORS.WHITE) {
  console.log(`${color}${message}${COLORS.RESET}`)
}

function logHeader(message) {
  console.log(`\n${COLORS.BOLD}${COLORS.CYAN}${'='.repeat(60)}`)
  console.log(`${COLORS.BOLD}${COLORS.CYAN}🧪 ${message}`)
  console.log(`${COLORS.BOLD}${COLORS.CYAN}${'='.repeat(60)}${COLORS.RESET}\n`)
}

function logStep(step, message) {
  console.log(`${COLORS.BOLD}${COLORS.YELLOW}[${step}]${COLORS.RESET} ${message}`)
}

function logSuccess(message) {
  console.log(`${COLORS.BOLD}${COLORS.GREEN}✅ ${message}${COLORS.RESET}`)
}

function logError(message) {
  console.log(`${COLORS.BOLD}${COLORS.RED}❌ ${message}${COLORS.RESET}`)
}

function logWarning(message) {
  console.log(`${COLORS.BOLD}${COLORS.YELLOW}⚠️  ${message}${COLORS.RESET}`)
}

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    logStep('CMD', `Running: ${command} ${args.join(' ')}`)
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    })
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code)
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })
    
    child.on('error', (error) => {
      reject(error)
    })
  })
}

async function checkPrerequisites() {
  logStep('1', 'Checking prerequisites...')
  
  try {
    // Check if Playwright is installed
    await runCommand('npx', ['playwright', '--version'])
    logSuccess('Playwright is installed')
    
    // Check if MCP server is available (by checking the directory)
    const fs = require('fs')
    const mcpServerPath = path.join(process.cwd(), 'mcp-server')
    
    if (fs.existsSync(mcpServerPath)) {
      logSuccess('MCP server directory found')
    } else {
      logWarning('MCP server directory not found - some tests may fail')
    }
    
    // Check environment variables
    if (process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID) {
      logSuccess(`Organization ID: ${process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID}`)
    } else {
      logWarning('NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID not set, using demo-org-123')
    }
    
  } catch (error) {
    logError(`Prerequisites check failed: ${error.message}`)
    throw error
  }
}

async function installPlaywright() {
  logStep('2', 'Installing Playwright browsers...')
  
  try {
    await runCommand('npx', ['playwright', 'install'])
    logSuccess('Playwright browsers installed')
  } catch (error) {
    logError(`Failed to install Playwright browsers: ${error.message}`)
    throw error
  }
}

async function runMCPE2ETests(testType = 'all', options = {}) {
  logStep('3', `Running MCP E2E tests (${testType})...`)
  
  const playwrightArgs = ['playwright', 'test']
  
  // Add specific test file based on type
  if (testType === 'questionnaire' || testType === 'mcp') {
    playwrightArgs.push('tests/e2e/readiness-questionnaire-mcp.spec.ts')
  }
  
  // Add options
  if (options.headed) {
    playwrightArgs.push('--headed')
  }
  
  if (options.ui) {
    playwrightArgs.push('--ui')
  }
  
  if (options.debug) {
    playwrightArgs.push('--debug')
  }
  
  if (options.browser) {
    playwrightArgs.push('--project', options.browser)
  }
  
  if (options.grep) {
    playwrightArgs.push('--grep', options.grep)
  }
  
  try {
    await runCommand('npx', playwrightArgs)
    logSuccess('MCP E2E tests completed successfully')
  } catch (error) {
    logError(`MCP E2E tests failed: ${error.message}`)
    throw error
  }
}

async function generateReport() {
  logStep('4', 'Opening test report...')
  
  try {
    await runCommand('npx', ['playwright', 'show-report'])
  } catch (error) {
    logWarning('Could not open test report automatically')
  }
}

async function main() {
  logHeader('HERA MCP E2E Test Runner')
  
  const args = process.argv.slice(2)
  const command = args[0] || 'run'
  
  const options = {
    headed: args.includes('--headed'),
    ui: args.includes('--ui'),
    debug: args.includes('--debug'),
    browser: args.find(arg => arg.startsWith('--browser='))?.split('=')[1],
    grep: args.find(arg => arg.startsWith('--grep='))?.split('=')[1],
    skipInstall: args.includes('--skip-install'),
    skipReport: args.includes('--skip-report')
  }
  
  log(`Command: ${command}`)
  log(`Options: ${JSON.stringify(options, null, 2)}`)
  
  try {
    switch (command) {
      case 'run':
      case 'test':
      case 'mcp':
        await checkPrerequisites()
        if (!options.skipInstall) {
          await installPlaywright()
        }
        await runMCPE2ETests('mcp', options)
        if (!options.skipReport && !options.ui) {
          await generateReport()
        }
        break
        
      case 'questionnaire':
        await checkPrerequisites()
        if (!options.skipInstall) {
          await installPlaywright()
        }
        await runMCPE2ETests('questionnaire', options)
        if (!options.skipReport && !options.ui) {
          await generateReport()
        }
        break
        
      case 'install':
        await installPlaywright()
        break
        
      case 'report':
        await generateReport()
        break
        
      case 'help':
      default:
        showHelp()
        break
    }
    
    logSuccess('All operations completed successfully!')
    
  } catch (error) {
    logError(`Operation failed: ${error.message}`)
    process.exit(1)
  }
}

function showHelp() {
  console.log(`
${COLORS.BOLD}${COLORS.CYAN}HERA MCP E2E Test Runner${COLORS.RESET}

${COLORS.BOLD}Usage:${COLORS.RESET}
  node scripts/run-mcp-e2e-tests.js [command] [options]

${COLORS.BOLD}Commands:${COLORS.RESET}
  run, test, mcp     Run MCP E2E tests (default)
  questionnaire      Run questionnaire-specific tests
  install            Install Playwright browsers
  report             Open test report
  help               Show this help

${COLORS.BOLD}Options:${COLORS.RESET}
  --headed           Run tests in headed mode (visible browser)
  --ui               Open Playwright UI for interactive testing
  --debug            Run tests in debug mode
  --browser=<name>   Run tests on specific browser (chromium, firefox, webkit)
  --grep=<pattern>   Run tests matching pattern
  --skip-install     Skip Playwright browser installation
  --skip-report      Skip opening test report

${COLORS.BOLD}Examples:${COLORS.RESET}
  ${COLORS.GREEN}# Run all MCP tests${COLORS.RESET}
  node scripts/run-mcp-e2e-tests.js run

  ${COLORS.GREEN}# Run tests in headed mode${COLORS.RESET}
  node scripts/run-mcp-e2e-tests.js run --headed

  ${COLORS.GREEN}# Open Playwright UI${COLORS.RESET}
  node scripts/run-mcp-e2e-tests.js run --ui

  ${COLORS.GREEN}# Run specific test${COLORS.RESET}
  node scripts/run-mcp-e2e-tests.js run --grep="restaurant business"

  ${COLORS.GREEN}# Debug tests${COLORS.RESET}
  node scripts/run-mcp-e2e-tests.js run --debug

${COLORS.BOLD}NPM Scripts:${COLORS.RESET}
  npm run test:e2e:mcp          # Run MCP tests
  npm run test:e2e:mcp:headed   # Run with visible browser
  npm run test:e2e:mcp:ui       # Open Playwright UI
  npm run test:e2e:mcp:debug    # Debug mode
`)
}

// Run the script
if (require.main === module) {
  main().catch((error) => {
    logError(`Script failed: ${error.message}`)
    process.exit(1)
  })
}

module.exports = {
  runMCPE2ETests,
  checkPrerequisites,
  installPlaywright
}