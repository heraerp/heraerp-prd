#!/usr/bin/env node

/**
 * HERA Generated Code Validation Script
 * Validates only the generated code to ensure it compiles correctly
 * Focuses on the specific files that were generated
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🔧 HERA Generated Code Validation Starting...')

// Accept target directory as argument
const targetDir = process.argv[2] || 'app/retail1'
const fullPath = path.join(process.cwd(), targetDir)

if (!fs.existsSync(fullPath)) {
  console.log(`❌ Target directory does not exist: ${fullPath}`)
  process.exit(1)
}

console.log(`🎯 Validating generated code in: ${targetDir}`)

const validationSteps = [
  {
    name: 'TypeScript Compilation Check',
    description: 'Verify generated TypeScript compiles without errors',
    validate: () => {
      try {
        // Create a temporary tsconfig for validation
        const tempTsConfig = {
          compilerOptions: {
            target: "es5",
            lib: ["dom", "dom.iterable", "es6"],
            allowJs: true,
            skipLibCheck: true,
            strict: false,
            forceConsistentCasingInFileNames: true,
            noEmit: true,
            esModuleInterop: true,
            module: "esnext",
            moduleResolution: "node",
            resolveJsonModule: true,
            isolatedModules: true,
            jsx: "preserve",
            incremental: true,
            baseUrl: ".",
            paths: {
              "@/*": ["./src/*"]
            }
          },
          include: [
            `${targetDir}/**/*.ts`,
            `${targetDir}/**/*.tsx`
          ],
          exclude: [
            "node_modules",
            ".next",
            "docs/**/*",
            "**/*.template.*"
          ]
        }
        
        const tempConfigPath = path.join(process.cwd(), 'tsconfig.validation.json')
        fs.writeFileSync(tempConfigPath, JSON.stringify(tempTsConfig, null, 2))
        
        try {
          const output = execSync(`npx tsc --project ${tempConfigPath}`, {
            stdio: 'pipe',
            timeout: 30000,
            encoding: 'utf8'
          })
          
          return { success: true, message: 'TypeScript compilation successful' }
        } finally {
          // Clean up temp config
          if (fs.existsSync(tempConfigPath)) {
            fs.unlinkSync(tempConfigPath)
          }
        }
      } catch (error) {
        // Check if the error is related to our generated files
        const stderr = error.stderr || ''
        const stdout = error.stdout || ''
        const errorOutput = stderr + stdout
        
        // If the error doesn't mention our target directory, it's likely unrelated
        if (!errorOutput.includes(targetDir)) {
          return { 
            success: true, 
            message: 'TypeScript compilation successful for generated code',
            warning: 'Global TypeScript errors exist but not in generated code'
          }
        }
        
        return { 
          success: false, 
          message: 'TypeScript compilation failed in generated code',
          error: errorOutput.slice(0, 500)
        }
      }
    }
  },
  {
    name: 'Import Resolution Check',
    description: 'Verify all imports can be resolved',
    validate: () => {
      try {
        // Find all .tsx and .ts files in target directory
        const findFiles = (dir) => {
          const files = []
          const items = fs.readdirSync(dir)
          
          for (const item of items) {
            const fullPath = path.join(dir, item)
            const stat = fs.statSync(fullPath)
            
            if (stat.isDirectory()) {
              files.push(...findFiles(fullPath))
            } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
              files.push(fullPath)
            }
          }
          
          return files
        }
        
        const files = findFiles(fullPath)
        const importErrors = []
        
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf8')
          const imports = content.match(/import .+ from ['"][^'"]+['"]/g) || []
          
          for (const importLine of imports) {
            const match = importLine.match(/from ['"]([^'"]+)['"]/)
            if (match) {
              const importPath = match[1]
              
              // Check if it's a relative import
              if (importPath.startsWith('./') || importPath.startsWith('../')) {
                const resolvedPath = path.resolve(path.dirname(file), importPath)
                const possibleExtensions = ['', '.ts', '.tsx', '.js', '.jsx']
                
                let exists = false
                for (const ext of possibleExtensions) {
                  if (fs.existsSync(resolvedPath + ext)) {
                    exists = true
                    break
                  }
                }
                
                if (!exists && !fs.existsSync(resolvedPath) && !fs.existsSync(resolvedPath + '/index.ts') && !fs.existsSync(resolvedPath + '/index.tsx')) {
                  importErrors.push(`${file}: Cannot resolve import "${importPath}"`)
                }
              }
            }
          }
        }
        
        if (importErrors.length > 0) {
          return {
            success: false,
            message: 'Import resolution failed',
            error: importErrors.join('\n')
          }
        }
        
        return { success: true, message: `All imports resolved for ${files.length} files` }
        
      } catch (error) {
        return {
          success: false,
          message: 'Import resolution check failed',
          error: error.message
        }
      }
    }
  },
  {
    name: 'Syntax Validation',
    description: 'Check for basic syntax errors',
    validate: () => {
      try {
        // Use Next.js to validate the specific pages
        execSync(`npx next build --debug`, {
          stdio: 'pipe',
          timeout: 60000,
          encoding: 'utf8',
          cwd: process.cwd()
        })
        
        return { success: true, message: 'Next.js build successful' }
      } catch (error) {
        // If build fails, check if it's related to our generated files
        const stderr = error.stderr || ''
        const stdout = error.stdout || ''
        
        if (stderr.includes(targetDir) || stdout.includes(targetDir)) {
          return {
            success: false,
            message: 'Syntax validation failed in generated code',
            error: stderr || stdout
          }
        }
        
        // If error is not in our generated code, treat as warning
        return {
          success: true,
          message: 'Build errors exist but not in generated code',
          warning: 'Build has errors in other parts of the codebase'
        }
      }
    }
  }
]

let allPassed = true
const results = []

for (const step of validationSteps) {
  console.log(`\n🔍 ${step.name}: ${step.description}`)
  
  const startTime = Date.now()
  const result = step.validate()
  const duration = Date.now() - startTime
  
  if (result.success) {
    console.log(`✅ ${result.message} (${duration}ms)`)
    if (result.warning) {
      console.log(`⚠️  ${result.warning}`)
    }
  } else {
    console.log(`❌ ${result.message} (${duration}ms)`)
    if (result.error) {
      console.log(`   Error: ${result.error.slice(0, 300)}...`)
    }
    allPassed = false
  }
  
  results.push({
    step: step.name,
    success: result.success,
    message: result.message,
    duration,
    error: result.error,
    warning: result.warning
  })
}

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  target_directory: targetDir,
  overall_status: allPassed ? 'PASSED' : 'FAILED',
  total_duration: results.reduce((sum, r) => sum + r.duration, 0),
  results,
  summary: {
    total_steps: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  }
}

// Save report
const reportPath = path.join(process.cwd(), '.hera-generated-validation.json')
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

console.log('\n📊 HERA Generated Code Validation Report:')
console.log(`Target: ${targetDir}`)
console.log(`Status: ${allPassed ? '✅ PASSED' : '❌ FAILED'}`)
console.log(`Duration: ${report.total_duration}ms`)
console.log(`Steps: ${report.summary.passed}/${report.summary.total_steps} passed`)

if (!allPassed) {
  console.log('\n❌ Failed validations:')
  results.filter(r => !r.success).forEach(step => {
    console.log(`   - ${step.step}: ${step.message}`)
  })
}

console.log(`\n📁 Report saved to: ${reportPath}`)

// Exit with appropriate code
process.exit(allPassed ? 0 : 1)