#!/usr/bin/env node

/**
 * HERA React Import Fixer
 * Automatically finds and fixes missing React imports in client components
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔍 HERA React Import Fixer - Starting...')

function findFiles(dir, pattern, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      findFiles(fullPath, pattern, results)
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath)
    }
  }
  
  return results
}

function hasUseClient(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return content.includes("'use client'") || content.includes('"use client"')
  } catch (err) {
    return false
  }
}

function hasReactImport(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    return /import\s+.*React.*from\s+['"]react['"]/.test(content)
  } catch (err) {
    return false
  }
}

function fixReactImport(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    // Pattern 1: import { useState, useEffect } from 'react'
    const pattern1 = /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]react['"];?/
    if (pattern1.test(content) && !content.includes('import React,')) {
      content = content.replace(pattern1, (match, imports) => {
        modified = true
        return `import React, { ${imports} } from 'react'`
      })
    }
    
    // Pattern 2: No React import but has hooks/jsx
    if (!hasReactImport(filePath) && hasUseClient(filePath)) {
      // Find the first import statement to insert React import
      const firstImportMatch = content.match(/^import\s+.*$/m)
      if (firstImportMatch) {
        const insertIndex = content.indexOf(firstImportMatch[0])
        content = content.slice(0, insertIndex) + 
                 "import React from 'react'\n" + 
                 content.slice(insertIndex)
        modified = true
      } else {
        // No imports found, add at the top after 'use client'
        const useClientMatch = content.match(/['"]use client['"];?\s*\n/)
        if (useClientMatch) {
          const insertIndex = content.indexOf(useClientMatch[0]) + useClientMatch[0].length
          content = content.slice(0, insertIndex) + 
                   "\nimport React from 'react'\n" + 
                   content.slice(insertIndex)
          modified = true
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      return true
    }
    
    return false
  } catch (err) {
    console.error(`Error fixing ${filePath}:`, err.message)
    return false
  }
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src')
const tsxFiles = findFiles(srcDir, /\.tsx$/)

console.log(`📁 Found ${tsxFiles.length} .tsx files`)

const clientComponents = tsxFiles.filter(hasUseClient)
console.log(`👤 Found ${clientComponents.length} client components`)

const missingReactImports = clientComponents.filter(file => !hasReactImport(file))
console.log(`❌ Found ${missingReactImports.length} files missing React imports`)

if (missingReactImports.length === 0) {
  console.log('✅ All client components have React imports!')
} else {
  console.log('\n🔧 Fixing React imports...')
  
  let fixedCount = 0
  
  for (const file of missingReactImports) {
    const relativePath = path.relative(process.cwd(), file)
    
    if (fixReactImport(file)) {
      console.log(`✅ Fixed: ${relativePath}`)
      fixedCount++
    } else {
      console.log(`⚠️ Could not fix: ${relativePath}`)
    }
  }
  
  console.log(`\n🎉 Fixed ${fixedCount} out of ${missingReactImports.length} files`)
  
  if (fixedCount > 0) {
    console.log('\n🧪 Testing development server...')
    try {
      // Test if the dev server can start
      const testProcess = execSync('timeout 10s npm run dev:no-cc || true', { 
        stdio: 'pipe',
        encoding: 'utf8'
      })
      
      if (testProcess.includes('Ready in')) {
        console.log('✅ Development server test passed!')
      } else {
        console.log('⚠️ Development server test inconclusive')
      }
    } catch (err) {
      console.log('⚠️ Could not test development server')
    }
  }
}

console.log('\n📋 Summary:')
console.log(`  Total .tsx files: ${tsxFiles.length}`)
console.log(`  Client components: ${clientComponents.length}`)
console.log(`  Files missing React: ${missingReactImports.length}`)
console.log(`  Files fixed: ${fixedCount || 0}`)

if (missingReactImports.length > 0 && fixedCount === 0) {
  console.log('\n🔍 Manual inspection needed for:')
  missingReactImports.forEach(file => {
    console.log(`  ${path.relative(process.cwd(), file)}`)
  })
}

console.log('\n🛠️ Debug commands available in browser console:')
console.log('  window.heraDebug.checkReact() - Check React availability')
console.log('  window.heraDebug.getDebugSummary() - Get debug summary')

process.exit(0)