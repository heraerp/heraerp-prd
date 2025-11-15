#!/usr/bin/env node

/**
 * Final React Import Fix
 * Comprehensive scan and fix for all remaining React import issues
 */

const fs = require('fs')
const path = require('path')

console.log('🔄 Final React Import Fix - Starting comprehensive scan...')

function findAllTsxFiles(dir, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      findAllTsxFiles(fullPath, results)
    } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
      results.push(fullPath)
    }
  }
  
  return results
}

function analyzeAndFixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')
    
    // Check if it's a client component
    let hasUseClient = false
    let reactImportLine = -1
    let reactImportContent = ''
    let hasReactImport = false
    
    // Scan first 20 lines for directives and imports
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const line = lines[i].trim()
      
      if (line === "'use client'" || line === '"use client"') {
        hasUseClient = true
      }
      
      if (line.startsWith('import React') && line.includes('from') && line.includes("'react'")) {
        reactImportLine = i
        reactImportContent = line
        hasReactImport = true
      }
    }
    
    if (!hasUseClient) {
      return { isClientComponent: false }
    }
    
    // For client components, check what hooks are used
    const hooksUsed = new Set()
    
    const hookPatterns = [
      /\buseState\s*\(/g,
      /\buseEffect\s*\(/g,
      /\buseRef\s*\(/g,
      /\buseCallback\s*\(/g,
      /\buseMemo\s*\(/g,
      /\buseContext\s*\(/g,
      /\buseReducer\s*\(/g,
      /\buseLayoutEffect\s*\(/g,
      /\buseImperativeHandle\s*\(/g,
      /\buseDebugValue\s*\(/g
    ]
    
    const hookNames = [
      'useState',
      'useEffect', 
      'useRef',
      'useCallback',
      'useMemo',
      'useContext',
      'useReducer',
      'useLayoutEffect',
      'useImperativeHandle',
      'useDebugValue'
    ]
    
    for (let i = 0; i < hookPatterns.length; i++) {
      if (hookPatterns[i].test(content)) {
        hooksUsed.add(hookNames[i])
      }
    }
    
    if (hooksUsed.size === 0) {
      // No hooks used, just needs basic React import
      if (!hasReactImport) {
        return {
          isClientComponent: true,
          needsFix: true,
          fixType: 'ADD_BASIC_REACT',
          hooksUsed: Array.from(hooksUsed)
        }
      }
      return { isClientComponent: true, needsFix: false }
    }
    
    // Check if current import has all needed hooks
    let currentHooks = new Set()
    if (hasReactImport) {
      const match = reactImportContent.match(/import\s+React(?:,\s*\{([^}]+)\})?\s+from\s+['"]react['"]/)
      if (match && match[1]) {
        const imports = match[1].split(',').map(h => h.trim())
        imports.forEach(hook => currentHooks.add(hook))
      }
    }
    
    const missingHooks = new Set([...hooksUsed].filter(hook => !currentHooks.has(hook)))
    
    if (missingHooks.size > 0 || !hasReactImport) {
      return {
        isClientComponent: true,
        needsFix: true,
        fixType: hasReactImport ? 'UPDATE_IMPORTS' : 'ADD_REACT_WITH_HOOKS',
        hooksUsed: Array.from(hooksUsed),
        currentHooks: Array.from(currentHooks),
        missingHooks: Array.from(missingHooks),
        reactImportLine,
        reactImportContent
      }
    }
    
    return { isClientComponent: true, needsFix: false }
    
  } catch (error) {
    return { error: error.message }
  }
}

function fixFile(filePath, analysis) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    const lines = content.split('\n')
    
    if (analysis.fixType === 'ADD_BASIC_REACT') {
      // Find insertion point after 'use client'
      let insertIndex = 0
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        if (lines[i].trim() === "'use client'" || lines[i].trim() === '"use client"') {
          insertIndex = i + 1
          break
        }
      }
      
      // Add empty line and React import
      lines.splice(insertIndex, 0, '', "import React from 'react'")
      
    } else if (analysis.fixType === 'ADD_REACT_WITH_HOOKS') {
      // Find insertion point after 'use client'
      let insertIndex = 0
      for (let i = 0; i < Math.min(10, lines.length); i++) {
        if (lines[i].trim() === "'use client'" || lines[i].trim() === '"use client"') {
          insertIndex = i + 1
          break
        }
      }
      
      const hooks = analysis.hooksUsed.sort()
      const hooksImport = hooks.length > 0 ? `, { ${hooks.join(', ')} }` : ''
      const newImport = `import React${hooksImport} from 'react'`
      
      // Add empty line and React import
      lines.splice(insertIndex, 0, '', newImport)
      
    } else if (analysis.fixType === 'UPDATE_IMPORTS') {
      // Update existing import line
      const allHooks = [...new Set([...analysis.currentHooks, ...analysis.hooksUsed])].sort()
      const hooksImport = allHooks.length > 0 ? `, { ${allHooks.join(', ')} }` : ''
      const newImport = `import React${hooksImport} from 'react'`
      
      lines[analysis.reactImportLine] = newImport
    }
    
    const newContent = lines.join('\n')
    fs.writeFileSync(filePath, newContent, 'utf8')
    return true
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message)
    return false
  }
}

// Main execution
const srcDir = path.join(__dirname, '..', 'src')
const tsxFiles = findAllTsxFiles(srcDir)

console.log(`📁 Found ${tsxFiles.length} .tsx files`)

let clientComponents = 0
let needsFix = 0
let fixed = 0

for (const file of tsxFiles) {
  const analysis = analyzeAndFixFile(file)
  
  if (analysis.error) {
    console.error(`❌ Error analyzing ${file}: ${analysis.error}`)
    continue
  }
  
  if (analysis.isClientComponent) {
    clientComponents++
    
    if (analysis.needsFix) {
      needsFix++
      const relativePath = path.relative(process.cwd(), file)
      
      if (fixFile(file, analysis)) {
        console.log(`✅ Fixed: ${relativePath}`)
        console.log(`   Type: ${analysis.fixType}`)
        if (analysis.hooksUsed?.length > 0) {
          console.log(`   Hooks: ${analysis.hooksUsed.join(', ')}`)
        }
        fixed++
      } else {
        console.log(`❌ Failed to fix: ${relativePath}`)
      }
    }
  }
}

console.log(`\n📊 Final Summary:`)
console.log(`  Total .tsx files: ${tsxFiles.length}`)
console.log(`  Client components: ${clientComponents}`)
console.log(`  Files needing fixes: ${needsFix}`)
console.log(`  Files fixed: ${fixed}`)

if (fixed > 0) {
  console.log(`\n✅ Fixed ${fixed} React import issues!`)
} else if (needsFix === 0) {
  console.log(`\n🎉 All React imports are correct!`)
} else {
  console.log(`\n⚠️ Some files could not be fixed automatically`)
}

console.log('\n🔄 Final React Import Fix complete!')