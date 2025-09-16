#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Files to check with specific known issues
const specificChecks = [
  {
    file: 'src/components/furniture/NewSalesOrderModal.tsx',
    checks: [
      {
        lineNum: 97,
        pattern: /}\)\s*\/\/.*const/,
        description: 'Comment and const declaration on same line'
      },
      {
        lineNum: 103,
        pattern: /tax_percent:\s*\d+\s*\/\/.*}\)/,
        description: 'Comment inside object declaration'
      }
    ]
  },
  {
    file: 'src/app/furniture/products/catalog/page.tsx',
    checks: [
      {
        lineNum: 25,
        pattern: /}\s*\/\/\s*Category/,
        description: 'Comment immediately after closing brace'
      }
    ]
  },
  {
    file: 'src/app/furniture/production/tracking/page.tsx',
    checks: [
      {
        lineNum: 25,
        pattern: /}\)\s*\/\/\s*Load/,
        description: 'Comment immediately after function call'
      }
    ]
  }
];

async function checkFile(fileSpec) {
  try {
    const fullPath = path.resolve(fileSpec.file);
    const content = await fs.readFile(fullPath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    for (const check of fileSpec.checks) {
      const lineIndex = check.lineNum - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        if (check.pattern.test(line)) {
          issues.push({
            line: check.lineNum,
            description: check.description,
            content: line.trim().substring(0, 80) + (line.length > 80 ? '...' : '')
          });
        }
      }
    }
    
    return { file: fileSpec.file, issues };
  } catch (error) {
    return { file: fileSpec.file, error: error.message };
  }
}

async function main() {
  console.log('🔍 Checking specific known compressed syntax issues...\n');
  
  let totalIssues = 0;
  
  for (const fileSpec of specificChecks) {
    const result = await checkFile(fileSpec);
    
    if (result.error) {
      console.log(`❌ Error checking ${fileSpec.file}: ${result.error}`);
    } else if (result.issues.length === 0) {
      console.log(`✅ ${fileSpec.file} - All specific issues fixed`);
    } else {
      console.log(`⚠️  ${fileSpec.file} - Found ${result.issues.length} remaining issues:`);
      result.issues.forEach(issue => {
        console.log(`   Line ${issue.line}: ${issue.description}`);
        console.log(`   Content: ${issue.content}`);
      });
      totalIssues += result.issues.length;
    }
  }
  
  console.log(`\n📊 Summary: ${totalIssues} specific issues remaining`);
  
  if (totalIssues === 0) {
    console.log('✨ All known compressed syntax issues have been fixed!');
    console.log('\n📝 The files are now properly formatted for Next.js 15 compatibility.');
  } else {
    console.log('🔧 Some specific issues may still need manual attention.');
  }
}

main().catch(console.error);