#!/usr/bin/env node

/**
 * Clean duplicate React imports created by the fixer
 */

const fs = require('fs')
const path = require('path')

console.log('🧹 Cleaning duplicate React imports...')

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

function cleanDuplicateReactImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    // Check for duplicate React imports
    const reactImportMatches = content.match(/import React.*from ['"]react['"];?\s*\n/g)
    
    if (reactImportMatches && reactImportMatches.length > 1) {
      // Keep only the first comprehensive React import
      const lines = content.split('\n')
      const cleanedLines = []
      let foundReactImport = false
      
      for (const line of lines) {
        if (line.match(/import React.*from ['"]react['"];?\s*$/)) {
          if (!foundReactImport) {
            // Keep the most comprehensive React import
            const hasHooks = line.includes('{') && line.includes('}')
            if (hasHooks || !foundReactImport) {
              cleanedLines.push(line)
              foundReactImport = true
              modified = true
            }
          }
          // Skip additional React imports
        } else {
          cleanedLines.push(line)
        }
      }
      
      if (modified) {
        content = cleanedLines.join('\n')
        fs.writeFileSync(filePath, content, 'utf8')
        return true
      }
    }
    
    return false
  } catch (err) {
    console.error(`Error cleaning ${filePath}:`, err.message)
    return false
  }
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src')
const tsxFiles = findFiles(srcDir, /\.tsx$/)

console.log(`📁 Checking ${tsxFiles.length} .tsx files for duplicates`)

let cleanedCount = 0

for (const file of tsxFiles) {
  if (cleanDuplicateReactImports(file)) {
    const relativePath = path.relative(process.cwd(), file)
    console.log(`✅ Cleaned: ${relativePath}`)
    cleanedCount++
  }
}

console.log(`\n🎉 Cleaned ${cleanedCount} files with duplicate React imports`)

console.log('\n✅ React import cleanup complete!')