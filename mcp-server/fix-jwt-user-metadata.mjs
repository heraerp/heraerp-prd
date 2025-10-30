#!/usr/bin/env node

/**
 * Fix JWT User Metadata - Add Organization Context
 *
 * ROOT CAUSE IDENTIFIED:
 * - User HAS valid MEMBER_OF relationship in core_relationships ✅
 * - Organization context exists in database ✅
 * - JWT token is MISSING organization_id in user metadata ❌
 *
 * This script updates the user's JWT metadata to include organization_id,
 * which will be included in all future JWT tokens after refresh/re-login.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const userId = 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7'
const organizationId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const userEmail = 'hairtalkz02@gmail.com'

async function fixJWTMetadata() {
  console.log('\n🔧 FIXING JWT USER METADATA')
  console.log('=' .repeat(80))
  console.log('User ID:', userId)
  console.log('Email:', userEmail)
  console.log('Organization ID:', organizationId)
  console.log('=' .repeat(80))

  try {
    // Update user metadata using Supabase Admin API
    console.log('\n📝 Updating user metadata with organization_id...')

    const { data, error } = await supabase.auth.admin.updateUserById(
      userId,
      {
        user_metadata: {
          organization_id: organizationId
        }
      }
    )

    if (error) {
      console.error('❌ Failed to update user metadata:', error)
      return
    }

    console.log('✅ User metadata updated successfully!')
    console.log('\n📋 Updated User Metadata:', data.user.user_metadata)

    // Verify the update
    console.log('\n🔍 Verifying update...')
    const { data: { user }, error: getUserError } = await supabase.auth.admin.getUserById(userId)

    if (getUserError) {
      console.error('❌ Failed to verify update:', getUserError)
      return
    }

    console.log('✅ Verification successful!')
    console.log('   User Metadata:', user.user_metadata)
    console.log('   Organization ID:', user.user_metadata.organization_id)

    console.log('\n' + '='.repeat(80))
    console.log('✅ FIX COMPLETED SUCCESSFULLY')
    console.log('=' .repeat(80))

    console.log('\n📋 NEXT STEPS:')
    console.log('1. User MUST log out of the application')
    console.log('2. User MUST log back in (this generates new JWT with organization_id)')
    console.log('3. New JWT will include organization_id in token payload')
    console.log('4. verifyAuth() will use jwtOrg from token metadata')
    console.log('5. Product operations should work without session expired errors')

    console.log('\n🧪 TESTING:')
    console.log('After re-login, test these operations:')
    console.log('   ✓ Create new product')
    console.log('   ✓ Restore archived product')
    console.log('   ✓ Update existing product')
    console.log('   ✓ Check that no "session expired" redirect occurs')

    console.log('\n💡 WHY THIS FIXES THE ISSUE:')
    console.log('Before:')
    console.log('   - JWT token: { sub: "user-id" } (no organization_id)')
    console.log('   - verifyAuth() queries memberships but may fail due to RLS')
    console.log('   - Falls back to empty allowedOrgs → 401 Unauthorized')
    console.log('\nAfter:')
    console.log('   - JWT token: { sub: "user-id", organization_id: "org-id" }')
    console.log('   - verifyAuth() uses jwtOrg directly from token')
    console.log('   - Validates against memberships → Success!')

  } catch (error) {
    console.error('\n❌ UNEXPECTED ERROR:', error)
  }
}

fixJWTMetadata().catch(console.error)
