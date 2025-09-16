#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Files to verify
const filesToCheck = [
  'src/components/furniture/NewSalesOrderModal.tsx',
  'src/app/furniture/products/catalog/page.tsx',
  'src/app/furniture/production/tracking/page.tsx',
  'src/app/furniture/tender/watchlist/page.tsx',
  'src/app/furniture/tender/documents/page.tsx'
];

// Patterns that indicate compressed syntax
const compressedPatterns = [
  // Multiple statements on one line
  /}\s*const\s+/g,
  /}\s*useEffect/g,
  /}\s*useState/g,
  // Comments on same line as code
  /\)\s*\/\/.*\s*const/g,
  /}\s*\/\/.*\s*(const|let|var)/g,
  // Multiple imports on single line (more than 100 chars)
  /^import\s*{[^}]{100,}}/gm,
  // Object declarations on single line (more than 80 chars)
  /const\s+\w+\s*=\s*{[^}]{80,}}/g,
  // Interface properties on single line (more than 80 chars)
  /\w+:\s*{[^}]{80,}}/g
];

async function checkFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    const issues = [];
    
    // Check each pattern
    for (const pattern of compressedPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Find line number
          const lines = content.split('\n');
          let lineNum = 0;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(match.trim())) {
              lineNum = i + 1;
              break;
            }
          }
          
          issues.push({
            line: lineNum,
            pattern: pattern.toString(),
            match: match.substring(0, 100) + (match.length > 100 ? '...' : '')
          });
        });
      }
    }
    
    // Special check for the known line 97 issue in NewSalesOrderModal
    if (filePath.includes('NewSalesOrderModal')) {
      const lines = content.split('\n');
      if (lines[96] && lines[96].includes('}) // Data loading const')) {
        issues.push({
          line: 97,
          pattern: 'Known compressed syntax',
          match: lines[96].substring(0, 100)
        });
      }
    }
    
    return { file: filePath, issues };
  } catch (error) {
    return { file: filePath, error: error.message };
  }
}

async function main() {
  console.log('🔍 Verifying syntax fixes...\n');
  
  let totalIssues = 0;
  
  for (const file of filesToCheck) {
    const result = await checkFile(file);
    
    if (result.error) {
      console.log(`❌ Error checking ${file}: ${result.error}`);
    } else if (result.issues.length === 0) {
      console.log(`✅ ${file} - No compressed syntax found`);
    } else {
      console.log(`⚠️  ${file} - Found ${result.issues.length} potential issues:`);
      result.issues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.match}`);
      });
      totalIssues += result.issues.length;
    }
  }
  
  console.log(`\n📊 Summary: ${totalIssues} total issues found`);
  
  if (totalIssues === 0) {
    console.log('✨ All files appear to be properly formatted!');
  } else {
    console.log('🔧 Some compressed syntax may still need attention.');
  }
}

main().catch(console.error);