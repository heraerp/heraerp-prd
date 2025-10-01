#!/usr/bin/env tsx
/**
 * HERA V1 to V2 Codemod Script
 * Scans for V1 API usage and suggests/applies V2 replacements
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

type ReplacementRule = {
  pattern: RegExp
  replacement: string
  description: string
}

type FileChange = {
  file: string
  line: number
  oldCode: string
  newCode: string
  description: string
}

const V1_TO_V2_RULES: ReplacementRule[] = [
  // API endpoint replacements
  {
    pattern: /\/api\/v1\/entities/g,
    replacement: '/api/v2/entities',
    description: 'Migrate entities endpoint to V2'
  },
  {
    pattern: /\/api\/v1\/relationships/g,
    replacement: '/api/v2/relationships',
    description: 'Migrate relationships endpoint to V2'
  },
  {
    pattern: /\/api\/v1\/transactions/g,
    replacement: '/api/v2/transactions',
    description: 'Migrate transactions endpoint to V2'
  },
  
  // Universal client imports
  {
    pattern: /import\s+\{[^}]*\}\s+from\s+['"]@\/lib\/universal-api['"];?/g,
    replacement: "import { apiV2 } from '@/lib/universal/v2/client';",
    description: 'Replace legacy universal API import with V2 client'
  },
  {
    pattern: /import\s+\{[^}]*\}\s+from\s+['"]@\/lib\/universal-api-v1['"];?/g,
    replacement: "import { apiV2 } from '@/lib/universal/v2/client';",
    description: 'Replace V1 universal API import with V2 client'
  },
  
  // Universal hook imports
  {
    pattern: /import\s+\{[^}]*useUniversalApi[^}]*\}\s+from\s+['"]@\/hooks\/useUniversalApi['"];?/g,
    replacement: "import { useUniversalV2Api } from '@/lib/universal/v2/hooks';",
    description: 'Replace legacy useUniversalApi with V2 hook'
  },
  {
    pattern: /import\s+\{[^}]*useUniversalEntity[^}]*\}\s+from\s+['"]@\/hooks\/useUniversalEntity['"];?/g,
    replacement: "import { useEntity, useEntities, useUpsertEntity } from '@/lib/universal/v2/hooks';",
    description: 'Replace useUniversalEntity with V2 hooks'
  },
  
  // API method calls
  {
    pattern: /universalApi\.(get|post|put|delete|patch)/g,
    replacement: 'apiV2.$1',
    description: 'Replace universalApi calls with apiV2'
  },
  {
    pattern: /apiGet\(/g,
    replacement: 'apiV2.get(',
    description: 'Replace apiGet with apiV2.get'
  },
  {
    pattern: /apiPost\(/g,
    replacement: 'apiV2.post(',
    description: 'Replace apiPost with apiV2.post'
  },
  
  // Hook usage patterns
  {
    pattern: /useUniversalApi\(\)/g,
    replacement: 'useUniversalV2Api()',
    description: 'Replace useUniversalApi hook with V2 version'
  },
  
  // Headers and API version enforcement
  {
    pattern: /'x-hera-api-version':\s*'v1'/g,
    replacement: "'x-hera-api-version': 'v2'",
    description: 'Update API version header to V2'
  },
  {
    pattern: /"apiVersion":\s*"v1"/g,
    replacement: '"apiVersion": "v2"',
    description: 'Update API version in request body to V2'
  }
]

const ADDITIONAL_SUGGESTIONS = [
  {
    pattern: /fetch\(['"`]\/api\/v1\//,
    suggestion: 'Consider using apiV2 client instead of direct fetch for better type safety and error handling'
  },
  {
    pattern: /useQuery.*\/api\/v1\//,
    suggestion: 'Consider using V2 hooks (useEntity, useRelationships, useTransactions) for better type safety'
  },
  {
    pattern: /useMutation.*\/api\/v1\//,
    suggestion: 'Consider using V2 mutation hooks (useUpsertEntity, useUpsertRelationship, useEmitTransaction)'
  }
]

class V1ToV2Codemod {
  private changes: FileChange[] = []
  private dryRun: boolean
  private verbose: boolean

  constructor(options: { dryRun?: boolean; verbose?: boolean } = {}) {
    this.dryRun = options.dryRun ?? true
    this.verbose = options.verbose ?? false
  }

  async scanDirectory(dir: string = 'src'): Promise<void> {
    console.log(`🔍 Scanning ${dir}/ for V1 API usage...`)
    
    const files = await glob('**/*.{ts,tsx}', { 
      cwd: dir,
      absolute: true,
      ignore: ['node_modules/**', '.next/**', 'dist/**', '**/*.d.ts']
    })

    console.log(`📁 Found ${files.length} files to analyze`)

    for (const file of files) {
      await this.scanFile(file)
    }
  }

  private async scanFile(filePath: string): Promise<void> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineNumber = i + 1

        // Check replacement rules
        for (const rule of V1_TO_V2_RULES) {
          const matches = line.match(rule.pattern)
          if (matches) {
            const newLine = line.replace(rule.pattern, rule.replacement)
            this.changes.push({
              file: path.relative(process.cwd(), filePath),
              line: lineNumber,
              oldCode: line.trim(),
              newCode: newLine.trim(),
              description: rule.description
            })
          }
        }

        // Check additional suggestions
        for (const suggestion of ADDITIONAL_SUGGESTIONS) {
          if (suggestion.pattern.test(line)) {
            console.log(`💡 ${path.relative(process.cwd(), filePath)}:${lineNumber}`)
            console.log(`   Suggestion: ${suggestion.suggestion}`)
            console.log(`   Code: ${line.trim()}`)
            console.log()
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error reading file ${filePath}:`, error)
    }
  }

  async applyChanges(): Promise<void> {
    if (this.changes.length === 0) {
      console.log('✅ No V1 API usage found!')
      return
    }

    console.log(`\n📋 Found ${this.changes.length} potential changes:`)
    
    // Group changes by file
    const changesByFile = new Map<string, FileChange[]>()
    for (const change of this.changes) {
      if (!changesByFile.has(change.file)) {
        changesByFile.set(change.file, [])
      }
      changesByFile.get(change.file)!.push(change)
    }

    // Display changes
    for (const [file, fileChanges] of changesByFile) {
      console.log(`\n📄 ${file}`)
      for (const change of fileChanges) {
        console.log(`  Line ${change.line}: ${change.description}`)
        console.log(`    - ${change.oldCode}`)
        console.log(`    + ${change.newCode}`)
      }
    }

    if (this.dryRun) {
      console.log('\n🏃 Dry run mode - no files were modified')
      console.log('Run with --apply to make changes')
      return
    }

    // Apply changes
    console.log('\n🔧 Applying changes...')
    for (const [file, fileChanges] of changesByFile) {
      await this.applyFileChanges(file, fileChanges)
    }

    console.log(`✅ Applied ${this.changes.length} changes across ${changesByFile.size} files`)
  }

  private async applyFileChanges(filePath: string, changes: FileChange[]): Promise<void> {
    try {
      const fullPath = path.resolve(filePath)
      let content = await fs.promises.readFile(fullPath, 'utf-8')
      
      // Sort changes by line number in reverse order to avoid offset issues
      const sortedChanges = changes.sort((a, b) => b.line - a.line)
      
      for (const change of sortedChanges) {
        // Apply the replacement to the entire content
        const lines = content.split('\n')
        if (lines[change.line - 1]) {
          // Find the rule that matches this change
          const rule = V1_TO_V2_RULES.find(r => 
            change.oldCode.match(r.pattern)
          )
          if (rule) {
            lines[change.line - 1] = lines[change.line - 1].replace(rule.pattern, rule.replacement)
            content = lines.join('\n')
          }
        }
      }
      
      await fs.promises.writeFile(fullPath, content, 'utf-8')
      
      if (this.verbose) {
        console.log(`  ✓ Updated ${filePath}`)
      }
    } catch (error) {
      console.error(`❌ Error updating file ${filePath}:`, error)
    }
  }

  generateReport(): void {
    if (this.changes.length === 0) {
      console.log('\n✅ V1 to V2 Migration Report: All clear!')
      return
    }

    console.log('\n📊 V1 to V2 Migration Report')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    const changesByType = new Map<string, number>()
    for (const change of this.changes) {
      changesByType.set(change.description, (changesByType.get(change.description) || 0) + 1)
    }

    for (const [description, count] of changesByType) {
      console.log(`${count.toString().padStart(3)} × ${description}`)
    }

    console.log(`\nTotal: ${this.changes.length} changes across ${new Set(this.changes.map(c => c.file)).size} files`)
    
    if (this.dryRun) {
      console.log('\n🏃 To apply these changes, run:')
      console.log('tsx scripts/codemods/ban-v1-to-v2.ts --apply')
    }
  }
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const isDryRun = !args.includes('--apply')
  const isVerbose = args.includes('--verbose')
  const targetDir = args.find(arg => !arg.startsWith('--')) || 'src'

  console.log('🚀 HERA V1 to V2 Migration Codemod')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  if (isDryRun) {
    console.log('📋 Mode: Dry run (use --apply to make changes)')
  } else {
    console.log('🔧 Mode: Apply changes')
  }

  const codemod = new V1ToV2Codemod({ dryRun: isDryRun, verbose: isVerbose })
  
  await codemod.scanDirectory(targetDir)
  await codemod.applyChanges()
  codemod.generateReport()
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Codemod failed:', error)
    process.exit(1)
  })
}

export { V1ToV2Codemod }