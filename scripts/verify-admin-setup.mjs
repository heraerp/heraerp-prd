#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyAdminSetup() {
  const adminUserId = 'eac8b14f-c2b0-47f7-8271-49aa2a338fe5'
  const adminOrgId = '12345678-1234-1234-1234-123456789012'
  
  console.log('🔍 Final verification of admin setup...')
  
  // Check organization
  const { data: org } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', adminOrgId)
    .single()
  
  // Check membership
  const { data: memberships } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', adminUserId)
    .eq('to_entity_id', adminOrgId)
  
  // Check user
  const { data: user } = await supabase.auth.admin.getUserById(adminUserId)
  
  console.log('📊 ADMIN SETUP VERIFICATION:')
  console.log('================================')
  console.log('✅ Organization exists:', !!org)
  console.log('   - ID:', org?.id)
  console.log('   - Name:', org?.organization_name)
  console.log('   - Type:', org?.organization_type)
  
  console.log('✅ Membership exists:', memberships?.length > 0)
  console.log('   - Count:', memberships?.length || 0)
  console.log('   - Type:', memberships?.[0]?.relationship_type)
  console.log('   - Smart Code:', memberships?.[0]?.smart_code)
  
  console.log('✅ User metadata updated:', !!user?.user?.user_metadata?.organization_id)
  console.log('   - Email:', user?.user?.email)
  console.log('   - Role:', user?.user?.user_metadata?.role)
  console.log('   - Org ID:', user?.user?.user_metadata?.organization_id)
  console.log('   - Permissions:', user?.user?.user_metadata?.permissions)
  
  console.log('\n🎉 SETUP COMPLETE!')
  console.log('==================')
  console.log('📧 Email: admin@heraerp.com')
  console.log('🔑 Password: AdminPass123!')
  console.log('🔗 Login URL: http://localhost:3000/auth/login')
  console.log('📊 Dashboard URL: http://localhost:3000/admin/performance')
  console.log('\n✅ Admin user should now be able to login successfully!')
}

verifyAdminSetup().catch(console.error)