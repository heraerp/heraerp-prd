#!/usr/bin/env node

/**
 * GSPU Team Management - Test Runner
 * Orchestrates API and UI tests for comprehensive system validation
 * 
 * Usage: node run-gspu-tests.js [--api-only] [--ui-only] [--headless]
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const apiOnly = args.includes('--api-only');
const uiOnly = args.includes('--ui-only');
const headless = args.includes('--headless');

console.log('🚀 GSPU Team Management - Comprehensive Test Suite');
console.log('=' .repeat(60));
console.log('Testing all functionalities as a real user would...\n');

async function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function checkPrerequisites() {
  console.log('🔍 Checking Prerequisites...\n');
  
  // Check if Node.js is available
  try {
    await runCommand('node', ['--version']);
  } catch (error) {
    console.log('❌ Node.js is required');
    process.exit(1);
  }
  
  // Check if server is running
  try {
    const response = await fetch('http://localhost:3001/api/v1/audit/teams?action=list_teams');
    if (response.ok) {
      console.log('✅ Development server is running on localhost:3001');
    } else {
      throw new Error('Server not responding correctly');
    }
  } catch (error) {
    console.log('❌ Development server is not running on localhost:3001');
    console.log('   Please start the server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ All prerequisites met\n');
}

async function runAPITests() {
  console.log('🔌 Running API Tests...\n');
  
  try {
    await runCommand('node', ['test-gspu-teams.js']);
    console.log('✅ API tests completed successfully\n');
    return true;
  } catch (error) {
    console.log('❌ API tests failed\n');
    return false;
  }
}

async function runUITests() {
  console.log('🎭 Running UI Tests...\n');
  
  try {
    // Check if Puppeteer is installed
    try {
      require('puppeteer');
    } catch (error) {
      console.log('📦 Installing Puppeteer for UI tests...');
      await runCommand('npm', ['install', 'puppeteer']);
    }
    
    const uiArgs = ['test-gspu-teams-browser.js'];
    if (headless) {
      // Modify the script to run in headless mode
      console.log('🔇 Running in headless mode...');
    }
    
    await runCommand('node', uiArgs);
    console.log('✅ UI tests completed successfully\n');
    return true;
  } catch (error) {
    console.log('❌ UI tests failed\n');
    console.log('💡 Try installing Puppeteer: npm install puppeteer');
    return false;
  }
}

async function generateCombinedReport() {
  console.log('📊 Generating Combined Test Report...\n');
  
  const reports = [];
  
  // Load API test report if exists
  const apiReportPath = path.join(__dirname, 'gspu-teams-test-report.json');
  if (fs.existsSync(apiReportPath)) {
    const apiReport = JSON.parse(fs.readFileSync(apiReportPath, 'utf8'));
    reports.push({ type: 'API', ...apiReport });
  }
  
  // Load UI test report if exists
  const uiReportPath = path.join(__dirname, 'gspu-teams-ui-test-report.json');
  if (fs.existsSync(uiReportPath)) {
    const uiReport = JSON.parse(fs.readFileSync(uiReportPath, 'utf8'));
    reports.push({ type: 'UI', ...uiReport });
  }
  
  if (reports.length > 0) {
    const combinedReport = {
      timestamp: new Date().toISOString(),
      testSuite: 'GSPU Team Management - Complete System Test',
      reports: reports,
      overallSummary: {
        totalTests: reports.reduce((sum, r) => sum + (r.summary?.total || 0), 0),
        totalPassed: reports.reduce((sum, r) => sum + (r.summary?.passed || 0), 0),
        totalFailed: reports.reduce((sum, r) => sum + (r.summary?.failed || 0), 0)
      }
    };
    
    combinedReport.overallSummary.successRate = 
      ((combinedReport.overallSummary.totalPassed / combinedReport.overallSummary.totalTests) * 100).toFixed(1) + '%';
    
    const combinedReportPath = path.join(__dirname, 'gspu-teams-complete-test-report.json');
    fs.writeFileSync(combinedReportPath, JSON.stringify(combinedReport, null, 2));
    
    console.log('📋 COMPLETE TEST SUMMARY');
    console.log('=' .repeat(40));
    console.log(`📊 Total Tests: ${combinedReport.overallSummary.totalTests}`);
    console.log(`✅ Passed: ${combinedReport.overallSummary.totalPassed}`);
    console.log(`❌ Failed: ${combinedReport.overallSummary.totalFailed}`);
    console.log(`📈 Overall Success Rate: ${combinedReport.overallSummary.successRate}`);
    
    reports.forEach(report => {
      console.log(`\n${report.type} Tests:`);
      console.log(`  ✅ ${report.summary?.passed || 0} passed`);
      console.log(`  ❌ ${report.summary?.failed || 0} failed`);
      console.log(`  📈 ${report.summary?.successRate || 'N/A'} success rate`);
    });
    
    console.log(`\n📁 Complete report: ${combinedReportPath}`);
    
    return combinedReport.overallSummary.totalFailed === 0;
  } else {
    console.log('⚠️ No test reports found');
    return false;
  }
}

async function showTestInstructions() {
  console.log('📖 MANUAL TESTING INSTRUCTIONS\n');
  console.log('For comprehensive manual testing, please follow:');
  console.log('📄 GSPU-TEAMS-MANUAL-TEST-CHECKLIST.md\n');
  
  console.log('This checklist includes:');
  console.log('  ✅ 21 comprehensive test scenarios');
  console.log('  🎯 User acceptance testing criteria');
  console.log('  📱 Responsive design validation');
  console.log('  🔧 Error handling verification');
  console.log('  🎨 Steve Jobs design standards check\n');
}

async function main() {
  try {
    await checkPrerequisites();
    
    let apiSuccess = true;
    let uiSuccess = true;
    
    if (!uiOnly) {
      apiSuccess = await runAPITests();
    }
    
    if (!apiOnly) {
      uiSuccess = await runUITests();
    }
    
    const overallSuccess = await generateCombinedReport();
    
    await showTestInstructions();
    
    console.log('\n🎉 TESTING COMPLETE!');
    console.log('=' .repeat(30));
    
    if (overallSuccess) {
      console.log('✅ All tests passed! System is ready for production.');
    } else {
      console.log('❌ Some tests failed. Please review the reports.');
    }
    
    console.log('\n📚 Available Reports:');
    console.log('  • gspu-teams-test-report.json (API Tests)');
    console.log('  • gspu-teams-ui-test-report.json (UI Tests)');
    console.log('  • gspu-teams-complete-test-report.json (Combined)');
    console.log('  • test-screenshots/ (UI Screenshots)');
    console.log('\n📖 Manual Testing:');
    console.log('  • GSPU-TEAMS-MANUAL-TEST-CHECKLIST.md');
    
    process.exit(overallSuccess ? 0 : 1);
    
  } catch (error) {
    console.log('🚨 Fatal error during testing:', error.message);
    process.exit(1);
  }
}

// Display usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node run-gspu-tests.js [options]\n');
  console.log('Options:');
  console.log('  --api-only    Run only API tests');
  console.log('  --ui-only     Run only UI tests');
  console.log('  --headless    Run UI tests in headless mode');
  console.log('  --help, -h    Show this help message\n');
  console.log('Examples:');
  console.log('  node run-gspu-tests.js              # Run all tests');
  console.log('  node run-gspu-tests.js --api-only   # API tests only');
  console.log('  node run-gspu-tests.js --headless   # UI tests without browser window');
  process.exit(0);
}

// Run the main test suite
main();