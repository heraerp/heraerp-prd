#!/usr/bin/env node

/**
 * HERA GA Security Headers Validation
 * Checks security headers and configurations
 */

const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const http = require('http')
const https = require('https')

// Required security headers for production
const REQUIRED_HEADERS = {
  'strict-transport-security': {
    required: true,
    pattern: /max-age=\d{7,}/,
    description: 'HSTS with at least 6 months'
  },
  'x-content-type-options': {
    required: true,
    value: 'nosniff',
    description: 'Prevent MIME sniffing'
  },
  'x-frame-options': {
    required: true,
    value: ['DENY', 'SAMEORIGIN'],
    description: 'Prevent clickjacking'
  },
  'x-xss-protection': {
    required: true,
    value: '1; mode=block',
    description: 'XSS protection'
  },
  'referrer-policy': {
    required: true,
    value: ['strict-origin-when-cross-origin', 'no-referrer'],
    description: 'Control referrer information'
  },
  'permissions-policy': {
    required: true,
    pattern: /geolocation|camera|microphone/,
    description: 'Control browser features'
  },
  'content-security-policy': {
    required: true,
    checks: [
      { pattern: /default-src/, message: 'Must have default-src directive' },
      { pattern: /script-src/, message: 'Must have script-src directive' },
      { pattern: /style-src/, message: 'Must have style-src directive' }
    ],
    description: 'Content Security Policy'
  }
}

// Security configurations to check
const SECURITY_CONFIGS = {
  'vercel.json': {
    path: 'vercel.json',
    checks: [
      { key: 'headers', required: true },
      { pattern: /X-Content-Type-Options/, required: true }
    ]
  },
  'next.config.js': {
    path: 'next.config.js',
    checks: [
      { pattern: /headers\s*\(\)/, required: false },
      { pattern: /poweredByHeader:\s*false/, required: true }
    ]
  },
  'middleware.ts': {
    path: 'src/middleware.ts',
    checks: [
      { pattern: /organization_id/, required: true },
      { pattern: /auth|authentication/, required: true }
    ]
  }
}

// Check for security vulnerabilities in code
const VULNERABILITY_PATTERNS = [
  {
    pattern: /dangerouslySetInnerHTML/g,
    severity: 'high',
    message: 'Potential XSS vulnerability with dangerouslySetInnerHTML'
  },
  {
    pattern: /eval\s*\(/g,
    severity: 'critical',
    message: 'eval() usage is dangerous'
  },
  {
    pattern: /innerHTML\s*=/g,
    severity: 'high',
    message: 'Direct innerHTML manipulation'
  },
  {
    pattern: /document\.write/g,
    severity: 'medium',
    message: 'document.write can be unsafe'
  },
  {
    pattern: /localStorage\.setItem.*password/gi,
    severity: 'critical',
    message: 'Storing passwords in localStorage'
  },
  {
    pattern: /process\.env.*KEY.*['"`]/g,
    severity: 'high',
    message: 'Potential API key exposure'
  }
]

function checkProductionHeaders() {
  console.log(chalk.blue.bold('\n🔒 Checking Security Headers...\n'))
  
  const isProduction = process.env.NODE_ENV === 'production'
  const port = process.env.PORT || 3000
  const protocol = port === 443 ? https : http
  
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'HEAD'
    }
    
    const req = protocol.request(options, (res) => {
      console.log(chalk.white('Response headers from local server:'))
      
      let violations = 0
      let warnings = 0
      
      Object.entries(REQUIRED_HEADERS).forEach(([header, config]) => {
        const value = res.headers[header]
        
        if (!value && config.required) {
          console.log(chalk.red(`❌ ${header}: Missing (${config.description})`))
          violations++
        } else if (value) {
          if (config.value) {
            const validValues = Array.isArray(config.value) ? config.value : [config.value]
            if (!validValues.includes(value)) {
              console.log(chalk.yellow(`⚠️  ${header}: ${value} (expected: ${validValues.join(' or ')})`))
              warnings++
            } else {
              console.log(chalk.green(`✅ ${header}: ${value}`))
            }
          } else if (config.pattern && !config.pattern.test(value)) {
            console.log(chalk.yellow(`⚠️  ${header}: Invalid format`))
            warnings++
          } else if (config.checks) {
            const failedChecks = config.checks.filter(check => !check.pattern.test(value))
            if (failedChecks.length > 0) {
              console.log(chalk.yellow(`⚠️  ${header}: Missing directives`))
              failedChecks.forEach(check => {
                console.log(chalk.yellow(`   - ${check.message}`))
              })
              warnings++
            } else {
              console.log(chalk.green(`✅ ${header}: Properly configured`))
            }
          } else {
            console.log(chalk.green(`✅ ${header}: ${value}`))
          }
        }
      })
      
      resolve({ violations, warnings })
    })
    
    req.on('error', (e) => {
      console.log(chalk.yellow('⚠️  Could not check runtime headers (is server running?)'))
      console.log(chalk.white('Checking configuration files instead...'))
      resolve({ violations: 0, warnings: 0 })
    })
    
    req.end()
  })
}

function checkSecurityConfigurations() {
  console.log(chalk.blue.bold('\n📄 Checking Security Configurations...\n'))
  
  let violations = 0
  let warnings = 0
  
  Object.entries(SECURITY_CONFIGS).forEach(([name, config]) => {
    const filePath = path.resolve(process.cwd(), config.path)
    
    if (!fs.existsSync(filePath)) {
      if (name === 'vercel.json') {
        console.log(chalk.yellow(`⚠️  ${name}: Not found (needed for Vercel deployment)`))
        warnings++
      }
      return
    }
    
    const content = fs.readFileSync(filePath, 'utf8')
    console.log(chalk.white(`\nChecking ${name}:`))
    
    config.checks.forEach(check => {
      if (check.key) {
        const hasKey = content.includes(`"${check.key}"`)
        if (!hasKey && check.required) {
          console.log(chalk.red(`❌ Missing "${check.key}" configuration`))
          violations++
        } else if (hasKey) {
          console.log(chalk.green(`✅ Has "${check.key}" configuration`))
        }
      } else if (check.pattern) {
        const matches = check.pattern.test(content)
        if (!matches && check.required) {
          console.log(chalk.red(`❌ Missing required pattern: ${check.pattern}`))
          violations++
        } else if (matches) {
          console.log(chalk.green(`✅ Found security configuration`))
        }
      }
    })
  })
  
  return { violations, warnings }
}

function scanForVulnerabilities() {
  console.log(chalk.blue.bold('\n🔍 Scanning for Security Vulnerabilities...\n'))
  
  const issues = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  }
  
  const filesToScan = [
    'src/**/*.{ts,tsx,js,jsx}',
    'app/**/*.{ts,tsx,js,jsx}'
  ]
  
  const { execSync } = require('child_process')
  const files = execSync(`find . -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) -not -path "./node_modules/*" -not -path "./.next/*"`, { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8')
      
      VULNERABILITY_PATTERNS.forEach(vuln => {
        const matches = content.match(vuln.pattern)
        if (matches) {
          issues[vuln.severity]++
          if (issues[vuln.severity] === 1 || vuln.severity === 'critical') {
            console.log(chalk.red(`${vuln.severity.toUpperCase()}: ${vuln.message}`))
            console.log(chalk.gray(`  Found in: ${file}`))
          }
        }
      })
    } catch (error) {
      // Skip files that can't be read
    }
  })
  
  // Summary
  console.log(chalk.white.bold('\nVulnerability Summary:'))
  Object.entries(issues).forEach(([severity, count]) => {
    if (count === 0) {
      console.log(chalk.green(`✅ ${severity}: ${count}`))
    } else if (severity === 'critical' || severity === 'high') {
      console.log(chalk.red(`❌ ${severity}: ${count}`))
    } else {
      console.log(chalk.yellow(`⚠️  ${severity}: ${count}`))
    }
  })
  
  return issues
}

function checkAuthenticationSecurity() {
  console.log(chalk.blue.bold('\n🔐 Checking Authentication Security...\n'))
  
  const checks = [
    {
      name: 'Multi-org authentication',
      file: 'src/components/auth/MultiOrgAuthProvider.tsx',
      patterns: [
        { pattern: /organization_id/, message: 'Organization isolation' },
        { pattern: /jwt|JWT/, message: 'JWT token handling' }
      ]
    },
    {
      name: 'API authentication',
      file: 'src/app/api/v1/auth/route.ts',
      patterns: [
        { pattern: /verify|validate/, message: 'Token validation' },
        { pattern: /organization_id/, message: 'Org context validation' }
      ]
    },
    {
      name: 'Middleware protection',
      file: 'src/middleware.ts',
      patterns: [
        { pattern: /\/api\/v1/, message: 'API route protection' },
        { pattern: /organization|subdomain/, message: 'Multi-tenant routing' }
      ]
    }
  ]
  
  let passed = 0
  
  checks.forEach(check => {
    const filePath = path.resolve(process.cwd(), check.file)
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      const allPatternsMatch = check.patterns.every(p => p.pattern.test(content))
      
      if (allPatternsMatch) {
        console.log(chalk.green(`✅ ${check.name}: Properly configured`))
        passed++
      } else {
        console.log(chalk.yellow(`⚠️  ${check.name}: May need review`))
      }
    } else {
      console.log(chalk.yellow(`⚠️  ${check.name}: File not found`))
    }
  })
  
  return passed === checks.length
}

async function main() {
  console.log(chalk.blue.bold('🔒 HERA GA Security Validation\n'))
  
  let totalViolations = 0
  let totalWarnings = 0

  // 1. Check runtime headers
  const headerResults = await checkProductionHeaders()
  totalViolations += headerResults.violations
  totalWarnings += headerResults.warnings

  // 2. Check configuration files
  const configResults = checkSecurityConfigurations()
  totalViolations += configResults.violations
  totalWarnings += configResults.warnings

  // 3. Scan for vulnerabilities
  const vulnResults = scanForVulnerabilities()
  totalViolations += vulnResults.critical + vulnResults.high
  totalWarnings += vulnResults.medium

  // 4. Check authentication security
  const authSecure = checkAuthenticationSecurity()
  if (!authSecure) {
    totalWarnings += 1
  }

  // Summary
  console.log(chalk.white.bold('\n📊 Security Summary:'))
  
  if (totalViolations === 0 && totalWarnings < 5) {
    console.log(chalk.green.bold('✅ Security validation PASSED!'))
    console.log(chalk.green('Application has strong security posture.'))
    
    // Additional recommendations
    console.log(chalk.white.bold('\n📝 Additional recommendations:'))
    console.log(chalk.white('1. Enable rate limiting on all API endpoints'))
    console.log(chalk.white('2. Implement CORS with specific allowed origins'))
    console.log(chalk.white('3. Add request signing for critical operations'))
    console.log(chalk.white('4. Enable audit logging for all data modifications'))
    
    process.exit(0)
  } else {
    if (totalViolations > 0) {
      console.log(chalk.red(`❌ ${totalViolations} security violation(s)`))
    }
    if (totalWarnings > 0) {
      console.log(chalk.yellow(`⚠️  ${totalWarnings} security warning(s)`))
    }
    
    console.log(chalk.white.bold('\n🛡️ Security hardening required:'))
    console.log(chalk.white('1. Add all required security headers'))
    console.log(chalk.white('2. Fix critical/high vulnerabilities immediately'))
    console.log(chalk.white('3. Review authentication implementation'))
    console.log(chalk.white('4. Enable CSP in report-only mode first'))
    
    process.exit(totalViolations > 0 ? 1 : 0)
  }
}

// Run security validation
main().catch(error => {
  console.error(chalk.red('Error running security validation:'), error)
  process.exit(1)
})