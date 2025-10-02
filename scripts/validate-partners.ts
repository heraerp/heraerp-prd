#!/usr/bin/env tsx

import { allPartners } from '../.contentlayer/generated/index.mjs'
import type { Partner } from '../.contentlayer/generated/types'
import { existsSync, readdirSync } from 'fs'
import { join } from 'path'

const SMART_CODE_PATTERN = /^HERA\.CHANNEL\.PARTNER\.[A-Z]+\.PROFILE\.v\d+$/
const CONTENT_DIR = join(process.cwd(), 'content', 'partners')

function validatePartners(): void {
  console.log('🔍 Validating partner content...\n')

  let hasErrors = false
  const errors: string[] = []

  // Check that content directory exists
  if (!existsSync(CONTENT_DIR)) {
    console.error('❌ Content directory not found:', CONTENT_DIR)
    process.exit(1)
  }

  // Get all MDX files
  const mdxFiles = readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => f.replace('.mdx', ''))

  console.log(`Found ${allPartners.length} partners in ${mdxFiles.length} MDX files\n`)

  // Check for unique slugs
  const slugs = new Set<string>()
  const duplicateSlugs: string[] = []

  for (const partner of allPartners) {
    if (slugs.has(partner.slug)) {
      duplicateSlugs.push(partner.slug)
      errors.push(`Duplicate slug found: ${partner.slug}`)
      hasErrors = true
    }
    slugs.add(partner.slug)
  }

  // Validate each partner
  for (const partner of allPartners) {
    const partnerErrors: string[] = []

    // Check filename matches slug
    const expectedFile = `${partner.slug}.mdx`
    if (!mdxFiles.includes(partner.slug)) {
      partnerErrors.push(`Filename mismatch: expected ${expectedFile}`)
    }

    // Validate required fields
    if (!partner.name) {
      partnerErrors.push('Missing required field: name')
    }

    if (!partner.slug) {
      partnerErrors.push('Missing required field: slug')
    }

    if (!partner.smart_code) {
      partnerErrors.push('Missing required field: smart_code')
    } else if (!SMART_CODE_PATTERN.test(partner.smart_code)) {
      partnerErrors.push(
        `Invalid smart_code format: ${partner.smart_code}\n` +
        `  Expected pattern: HERA.CHANNEL.PARTNER.[TYPE].PROFILE.v[VERSION]`
      )
    }

    // Validate URL format if provided
    if (partner.website) {
      try {
        new URL(partner.website)
      } catch {
        partnerErrors.push(`Invalid website URL: ${partner.website}`)
      }
    }

    // Validate contacts if provided
    if (partner.contacts && Array.isArray(partner.contacts)) {
      partner.contacts.forEach((contact: any, index: number) => {
        if (!contact.name) {
          partnerErrors.push(`Contact ${index + 1} missing name`)
        }
        if (contact.email && !isValidEmail(contact.email)) {
          partnerErrors.push(`Contact ${index + 1} has invalid email: ${contact.email}`)
        }
      })
    }

    // Report partner-specific errors
    if (partnerErrors.length > 0) {
      hasErrors = true
      console.log(`\n❌ Partner: ${partner.name} (${partner.slug})`)
      partnerErrors.forEach(error => {
        console.log(`   ${error}`)
        errors.push(`${partner.slug}: ${error}`)
      })
    } else {
      console.log(`✅ Partner: ${partner.name} (${partner.slug})`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  if (hasErrors) {
    console.error(`\n❌ Validation failed with ${errors.length} error(s)`)
    process.exit(1)
  } else {
    console.log('\n✅ All partners validated successfully!')
    console.log(`   - ${allPartners.length} partners`)
    console.log(`   - All slugs unique`)
    console.log(`   - All filenames match slugs`)
    console.log(`   - All smart codes valid`)
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Run validation
try {
  validatePartners()
} catch (error) {
  console.error('❌ Validation error:', error)
  process.exit(1)
}