#!/usr/bin/env node

/**
 * Example usage of the verify-checklist script
 * This demonstrates various ways to use the verification tool
 */

import { ChecklistVerifier, VerificationReport } from './verify-checklist';
import * as fs from 'fs';
import * as path from 'path';

async function runExamples() {
  console.log('🚀 HERA Playbook Test Verification Examples\n');

  const checklistPath = path.join(__dirname, 'CHECKLIST.md');
  const baseTestPath = __dirname;

  // Example 1: Basic verification with human-readable output
  console.log('Example 1: Basic Verification');
  console.log('─'.repeat(50));
  const verifier1 = new ChecklistVerifier(checklistPath, baseTestPath);
  const report1 = await verifier1.verify({ format: 'human' });
  console.log(`\nOverall coverage: ${report1.overallCoverage}%\n`);

  // Example 2: Generate JSON report for CI/CD
  console.log('Example 2: JSON Report for CI/CD');
  console.log('─'.repeat(50));
  const verifier2 = new ChecklistVerifier(checklistPath, baseTestPath);
  const report2 = await verifier2.verify({ 
    format: 'json',
    output: 'ci-report.json'
  });
  console.log('JSON report saved to ci-report.json\n');

  // Example 3: Check specific sections only
  console.log('Example 3: Check Specific Sections');
  console.log('─'.repeat(50));
  const verifier3 = new ChecklistVerifier(checklistPath, baseTestPath);
  await verifier3.verify({ 
    sections: ['1', '8', '12'], // Creation, Security, Permissions
    verbose: true,
    showMissing: true
  });

  // Example 4: Programmatic usage with custom processing
  console.log('\nExample 4: Programmatic Usage');
  console.log('─'.repeat(50));
  const verifier4 = new ChecklistVerifier(checklistPath, baseTestPath);
  const report4 = await verifier4.verify({ format: 'json' });
  
  // Find sections with low coverage
  const lowCoverageSections = Array.from(report4.sections.values())
    .filter(section => section.coverage < 70)
    .map(section => ({
      name: section.name,
      coverage: section.coverage,
      missing: section.totalItems - section.itemsWithTests
    }));

  console.log('Sections needing attention:');
  lowCoverageSections.forEach(section => {
    console.log(`  - ${section.name}: ${section.coverage}% (${section.missing} items missing tests)`);
  });

  // Example 5: Generate coverage badge
  console.log('\n\nExample 5: Coverage Badge Generation');
  console.log('─'.repeat(50));
  const verifier5 = new ChecklistVerifier(checklistPath, baseTestPath);
  await verifier5.verify({ 
    badge: true,
    badgeOutput: 'coverage-badge.svg'
  });
  console.log('Coverage badge saved to coverage-badge.svg');

  // Example 6: Integration with Jest results
  console.log('\n\nExample 6: Integration with Jest Results');
  console.log('─'.repeat(50));
  
  // Simulate Jest results
  const mockJestResults = {
    "numTotalTests": 120,
    "numPassedTests": 105,
    "numFailedTests": 10,
    "numPendingTests": 5,
    "testResults": [
      {
        "testFilePath": path.join(baseTestPath, "playbook-crud.test.ts"),
        "numPassingTests": 15,
        "numFailingTests": 1,
        "numPendingTests": 0
      }
    ]
  };

  // Save mock results
  const resultsPath = path.join(baseTestPath, 'playbook-crud.test.results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(mockJestResults.testResults[0]));

  const verifier6 = new ChecklistVerifier(checklistPath, baseTestPath);
  const report6 = await verifier6.verify({ verbose: true });
  
  // Clean up mock results
  if (fs.existsSync(resultsPath)) {
    fs.unlinkSync(resultsPath);
  }

  // Example 7: Custom report generation
  console.log('\n\nExample 7: Custom Report Generation');
  console.log('─'.repeat(50));
  const verifier7 = new ChecklistVerifier(checklistPath, baseTestPath);
  const report7 = await verifier7.verify({ format: 'json' });

  // Generate markdown summary
  const markdownReport = `
# Test Coverage Summary

Generated: ${new Date().toISOString()}

## Overall Statistics
- **Total Checklist Items**: ${report7.totalItems}
- **Items with Tests**: ${report7.itemsWithTests}
- **Overall Coverage**: ${report7.overallCoverage}%

## Coverage by Section
${Array.from(report7.sections.values())
  .map(section => `- **${section.name}**: ${section.coverage}% (${section.itemsWithTests}/${section.totalItems})`)
  .join('\n')}

## Next Steps
${report7.overallCoverage < 80 ? '⚠️ Coverage is below 80% threshold. Please add more tests.' : '✅ Great job! Coverage meets the target.'}
`;

  fs.writeFileSync('coverage-summary.md', markdownReport);
  console.log('Markdown summary saved to coverage-summary.md');

  // Clean up generated files
  console.log('\n\nCleaning up example files...');
  ['ci-report.json', 'coverage-badge.svg', 'coverage-summary.md'].forEach(file => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`  - Removed ${file}`);
    }
  });

  console.log('\n✅ All examples completed successfully!');
}

// Run examples if called directly
if (require.main === module) {
  runExamples().catch(console.error);
}