#!/usr/bin/env node

/**
 * HERA GA Environment Validation Script
 * Validates required environment variables for production deployment
 */

const chalk = require('chalk')
const fs = require('fs')
const path = require('path')

// Required environment variables for production
const REQUIRED_ENV_VARS = [
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    pattern: /^https:\/\/.+\.supabase\.co$/
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key',
    pattern: /^[a-zA-Z0-9._-]+$/
  },
  {
    name: 'SUPABASE_SERVICE_KEY',
    description: 'Supabase service key (admin)',
    pattern: /^[a-zA-Z0-9._-]+$/
  },
  {
    name: 'NEXT_PUBLIC_HERA_WA_API',
    description: 'HERA WhatsApp MSP API endpoint',
    pattern: /^https:\/\/.+$/
  },
  {
    name: 'DEFAULT_ORGANIZATION_ID',
    description: 'Default organization UUID',
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  }
]

// Optional but recommended
const RECOMMENDED_ENV_VARS = [
  {
    name: 'WHATSAPP_WEBHOOK_TOKEN',
    description: 'WhatsApp webhook verification token'
  },
  {
    name: 'NODE_ENV',
    description: 'Node environment',
    expectedValue: 'production'
  },
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    description: 'Sentry error tracking DSN'
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key for AI features'
  },
  {
    name: 'ANTHROPIC_API_KEY',
    description: 'Anthropic API key for AI features'
  }
]

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env.production')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=', 2)
        if (key && value && !process.env[key]) {
          process.env[key] = value.trim()
        }
      }
    })
  }
}

function validateEnvironment() {
  console.log(chalk.blue.bold('\n🔍 HERA GA Environment Validation\n'))

  loadEnvFile()

  let errors = 0
  let warnings = 0

  // Check required variables
  console.log(chalk.white.bold('Required Environment Variables:'))
  REQUIRED_ENV_VARS.forEach(({ name, description, pattern }) => {
    const value = process.env[name]
    if (!value) {
      console.log(chalk.red(`❌ ${name}: Missing (${description})`))
      errors++
    } else if (pattern && !pattern.test(value)) {
      console.log(chalk.red(`❌ ${name}: Invalid format (${description})`))
      errors++
    } else {
      const displayValue = name.includes('KEY') || name.includes('SECRET') 
        ? value.substring(0, 10) + '...' 
        : value
      console.log(chalk.green(`✅ ${name}: ${displayValue}`))
    }
  })

  // Check recommended variables
  console.log(chalk.white.bold('\nRecommended Environment Variables:'))
  RECOMMENDED_ENV_VARS.forEach(({ name, description, expectedValue }) => {
    const value = process.env[name]
    if (!value) {
      console.log(chalk.yellow(`⚠️  ${name}: Not set (${description})`))
      warnings++
    } else if (expectedValue && value !== expectedValue) {
      console.log(chalk.yellow(`⚠️  ${name}: Expected '${expectedValue}' but got '${value}'`))
      warnings++
    } else {
      const displayValue = name.includes('KEY') || name.includes('DSN') 
        ? value.substring(0, 10) + '...' 
        : value
      console.log(chalk.green(`✅ ${name}: ${displayValue}`))
    }
  })

  // Check for production mode
  console.log(chalk.white.bold('\nProduction Mode Check:'))
  if (process.env.NODE_ENV === 'production') {
    console.log(chalk.green('✅ NODE_ENV is set to production'))
  } else {
    console.log(chalk.yellow(`⚠️  NODE_ENV is '${process.env.NODE_ENV || 'not set'}', should be 'production'`))
    warnings++
  }

  // Check for development artifacts
  console.log(chalk.white.bold('\nDevelopment Artifact Check:'))
  const devFiles = ['.env.local', '.env.development']
  const foundDevFiles = devFiles.filter(file => fs.existsSync(path.resolve(process.cwd(), file)))
  if (foundDevFiles.length > 0) {
    console.log(chalk.yellow(`⚠️  Found development files: ${foundDevFiles.join(', ')}`))
    warnings++
  } else {
    console.log(chalk.green('✅ No development environment files found'))
  }

  // Summary
  console.log(chalk.white.bold('\n📊 Summary:'))
  if (errors === 0 && warnings === 0) {
    console.log(chalk.green.bold('✅ All environment checks passed!'))
    console.log(chalk.green('Environment is ready for production deployment.'))
    process.exit(0)
  } else {
    if (errors > 0) {
      console.log(chalk.red(`❌ ${errors} critical error(s) found`))
    }
    if (warnings > 0) {
      console.log(chalk.yellow(`⚠️  ${warnings} warning(s) found`))
    }
    console.log(chalk.white('\nPlease fix the issues above before deploying to production.'))
    console.log(chalk.white('Refer to DEPLOYMENT-GUIDE.md for configuration instructions.'))
    process.exit(errors > 0 ? 1 : 0)
  }
}

// Run validation
validateEnvironment()