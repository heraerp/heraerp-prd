#!/usr/bin/env node
/**
 * Diagnostic Script: Branch Address Investigation
 *
 * Purpose: Check what address data is stored for branches to diagnose
 * the issue of wrong/concatenated addresses appearing on receipts.
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnoseBranchAddress() {
  console.log('🔍 Branch Address Diagnostic Tool\n')
  console.log('=' .repeat(80))

  try {
    // Step 1: Get all branches
    console.log('\n📍 Step 1: Fetching all branches...\n')

    const { data: branches, error: branchesError } = await supabase
      .from('core_entities')
      .select('id, entity_name, organization_id')
      .eq('entity_type', 'branch')
      .order('entity_name')

    if (branchesError) {
      console.error('❌ Error fetching branches:', branchesError)
      return
    }

    if (!branches || branches.length === 0) {
      console.log('⚠️  No branches found in database')
      return
    }

    console.log(`✅ Found ${branches.length} branches:\n`)
    branches.forEach((branch, index) => {
      console.log(`${index + 1}. ${branch.entity_name}`)
      console.log(`   ID: ${branch.id}`)
      console.log(`   Org: ${branch.organization_id}\n`)
    })

    // Step 2: Check dynamic data for each branch
    console.log('=' .repeat(80))
    console.log('\n📋 Step 2: Checking dynamic data for each branch...\n')

    for (const branch of branches) {
      console.log(`\n🏢 Branch: ${branch.entity_name}`)
      console.log(`   ID: ${branch.id}`)
      console.log('-'.repeat(80))

      // Get all dynamic fields for this branch
      const { data: fields, error: fieldsError } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_type, field_value_text, field_value_number, field_value_json')
        .eq('entity_id', branch.id)
        .eq('organization_id', branch.organization_id)
        .order('field_name')

      if (fieldsError) {
        console.error(`   ❌ Error fetching fields:`, fieldsError.message)
        continue
      }

      if (!fields || fields.length === 0) {
        console.log('   ⚠️  No dynamic data found')
        continue
      }

      console.log(`   ✅ Found ${fields.length} dynamic fields:\n`)

      // Check for address fields specifically
      const addressFields = fields.filter(f =>
        f.field_name.toLowerCase().includes('address')
      )

      if (addressFields.length > 0) {
        console.log('   🏠 ADDRESS FIELDS:')
        addressFields.forEach(field => {
          console.log(`      • ${field.field_name}: "${field.field_value_text}"`)
          if (field.field_value_text && field.field_value_text.length > 100) {
            console.log(`        ⚠️  WARNING: Address is ${field.field_value_text.length} characters long!`)
          }
          // Check for concatenated addresses (commas or multiple street names)
          if (field.field_value_text && (
            (field.field_value_text.match(/,/g) || []).length > 2 ||
            field.field_value_text.includes('Hotel') && field.field_value_text.split('Hotel').length > 2
          )) {
            console.log(`        🚨 POTENTIAL ISSUE: Address appears to contain multiple locations!`)
          }
        })
        console.log('')
      }

      // Show all other fields
      const otherFields = fields.filter(f =>
        !f.field_name.toLowerCase().includes('address')
      )

      if (otherFields.length > 0) {
        console.log('   📄 OTHER FIELDS:')
        otherFields.forEach(field => {
          let value = field.field_value_text || field.field_value_number || JSON.stringify(field.field_value_json)
          if (typeof value === 'string' && value.length > 50) {
            value = value.substring(0, 47) + '...'
          }
          console.log(`      • ${field.field_name}: ${value}`)
        })
      }
    }

    // Step 3: Specific check for Park Regis branch mentioned in the issue
    console.log('\n' + '='.repeat(80))
    console.log('\n🎯 Step 3: Checking "Park Regis" branch specifically...\n')

    const parkRegisBranch = branches.find(b =>
      b.entity_name.toLowerCase().includes('park regis')
    )

    if (parkRegisBranch) {
      console.log(`✅ Found Park Regis branch: ${parkRegisBranch.entity_name}`)
      console.log(`   ID: ${parkRegisBranch.id}\n`)

      const { data: parkRegisFields, error } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', parkRegisBranch.id)
        .eq('organization_id', parkRegisBranch.organization_id)

      if (error) {
        console.error('   ❌ Error:', error.message)
      } else {
        console.log('   📋 Raw data from core_dynamic_data:')
        console.log(JSON.stringify(parkRegisFields, null, 2))
      }
    } else {
      console.log('⚠️  No "Park Regis" branch found')
    }

    console.log('\n' + '='.repeat(80))
    console.log('\n✅ Diagnostic complete!\n')

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

// Run the diagnostic
diagnoseBranchAddress()
