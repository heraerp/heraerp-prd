#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function checkFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const issues = [];
    
    // Check for common syntax issues
    lines.forEach((line, index) => {
      // Check for 'use client' on same line as import
      if (line.includes("'use client'") && line.includes('import') && !line.trim().startsWith('//')) {
        issues.push({
          line: index + 1,
          issue: "'use client' directive and import on same line",
          content: line.trim()
        });
      }
      
      // Check for export and import on same line
      if (line.includes('export const') && line.includes('import') && !line.trim().startsWith('//')) {
        issues.push({
          line: index + 1,
          issue: "export and import statements on same line",
          content: line.trim()
        });
      }
      
      // Check for multiple statements without proper separation
      if (line.includes('}') && line.includes('interface') && !line.includes('export interface')) {
        issues.push({
          line: index + 1,
          issue: "Multiple statements on same line",
          content: line.trim()
        });
      }
    });
    
    return { filePath, issues };
  } catch (error) {
    return { filePath, error: error.message };
  }
}

async function checkDirectory(dir) {
  const results = [];
  
  try {
    const files = await fs.readdir(dir, { recursive: true });
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.jsx'))) {
        const result = await checkFile(filePath);
        if (result.issues && result.issues.length > 0) {
          results.push(result);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return results;
}

async function main() {
  console.log('🔍 Checking Furniture Module for Syntax Issues\n');
  
  const directories = [
    path.join(process.cwd(), 'src/app/furniture'),
    path.join(process.cwd(), 'src/components/furniture')
  ];
  
  let totalIssues = 0;
  
  for (const dir of directories) {
    console.log(`Checking ${path.relative(process.cwd(), dir)}...`);
    const results = await checkDirectory(dir);
    
    if (results.length > 0) {
      console.log(`\n❌ Found issues in ${results.length} files:\n`);
      
      for (const result of results) {
        console.log(`📄 ${path.relative(process.cwd(), result.filePath)}`);
        for (const issue of result.issues) {
          console.log(`   Line ${issue.line}: ${issue.issue}`);
          console.log(`   > ${issue.content}`);
          totalIssues++;
        }
        console.log('');
      }
    } else {
      console.log('✅ No syntax issues found\n');
    }
  }
  
  console.log('='.repeat(60));
  if (totalIssues === 0) {
    console.log('✨ All furniture files have proper syntax!');
  } else {
    console.log(`⚠️  Found ${totalIssues} potential syntax issues`);
    console.log('Please review and fix the issues above.');
  }
}

main().catch(console.error);