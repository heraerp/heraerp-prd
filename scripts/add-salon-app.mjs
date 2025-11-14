#!/usr/bin/env node

/**
 * Add Salon Application to Platform Organization
 * Enables admin user to access the salon management system
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

async function addSalonAppToPlatform() {
  try {
    console.log('💇 Adding Salon application to HERA PLATFORM organization...')
    
    // Update platform organization settings to include salon app
    console.log('⚙️ Updating platform organization settings with salon app...')
    const { data: updateResult, error: updateError } = await supabase
      .from('core_organizations')
      .update({
        settings: {
          admin_access: true,
          available_apps: [
            {
              code: 'SALON',
              name: 'Salon Management',
              url: '/salon',
              type: 'business',
              icon: 'scissors',
              description: 'Complete salon management system'
            },
            {
              code: 'ADMIN',
              name: 'Admin Dashboard',
              url: '/admin',
              type: 'admin',
              icon: 'shield',
              description: 'Administrative dashboard and management tools'
            },
            {
              code: 'PERFORMANCE',
              name: 'Performance Dashboard', 
              url: '/admin/performance',
              type: 'monitoring',
              icon: 'bar-chart',
              description: 'Real-time performance monitoring and analytics'
            },
            {
              code: 'USERS',
              name: 'User Management',
              url: '/admin/users', 
              type: 'management',
              icon: 'users',
              description: 'Team and user management system'
            }
          ],
          default_app: 'SALON',
          salon_features: {
            appointments: true,
            inventory: true,
            pos: true,
            reports: true,
            staff_management: true
          }
        }
      })
      .eq('id', PLATFORM_ORG_ID)
      .select()
    
    if (updateError) {
      console.warn('⚠️ Could not update organization settings:', updateError.message)
    } else {
      console.log('✅ Platform organization settings updated with salon app')
    }
    
    // Create salon app entity for completeness
    console.log('📱 Creating salon app entity...')
    const adminUserId = 'eac8b14f-c2b0-47f7-8271-49aa2a338fe5'
    
    const { data: salonAppResult, error: salonAppError } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: adminUserId,
      p_organization_id: PLATFORM_ORG_ID,
      p_entity: {
        entity_type: 'APPLICATION',
        entity_name: 'Salon Management System',
        entity_code: 'SALON',
        smart_code: 'HERA.PLATFORM.APP.SALON.v1'
      },
      p_dynamic: {
        app_type: {
          field_type: 'text',
          field_value_text: 'business',
          smart_code: 'HERA.PLATFORM.APP.FIELD.TYPE.v1'
        },
        app_url: {
          field_type: 'text',
          field_value_text: '/salon',
          smart_code: 'HERA.PLATFORM.APP.FIELD.URL.v1'
        },
        description: {
          field_type: 'text',
          field_value_text: 'Complete salon management system with appointments, POS, inventory, and staff management',
          smart_code: 'HERA.PLATFORM.APP.FIELD.DESCRIPTION.v1'
        },
        features: {
          field_type: 'json',
          field_value_json: {
            appointments: true,
            inventory: true,
            pos: true,
            reports: true,
            staff_management: true
          },
          smart_code: 'HERA.PLATFORM.APP.FIELD.FEATURES.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    })
    
    if (salonAppError && !salonAppError.message?.includes('duplicate')) {
      console.warn('⚠️ Could not create salon app entity:', salonAppError.message)
    } else {
      console.log('✅ Salon app entity ready')
    }
    
    // Verify the setup
    console.log('🔍 Verifying salon app configuration...')
    const { data: verifyOrg } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', PLATFORM_ORG_ID)
      .single()
    
    console.log('📊 SALON APP VERIFICATION:')
    console.log('===========================')
    console.log('✅ Organization settings updated:', !!verifyOrg?.settings?.available_apps)
    console.log('✅ Available apps count:', verifyOrg?.settings?.available_apps?.length || 0)
    console.log('✅ Default app:', verifyOrg?.settings?.default_app)
    console.log('✅ Salon features enabled:', !!verifyOrg?.settings?.salon_features)
    
    if (verifyOrg?.settings?.available_apps) {
      console.log('\n📱 Available Apps:')
      verifyOrg.settings.available_apps.forEach(app => {
        console.log(`   - ${app.name} (${app.code}): ${app.url}`)
      })
    }
    
    console.log('\n🎉 SALON APP ADDED TO PLATFORM!')
    console.log('================================')
    console.log('📧 Email: admin@heraerp.com')
    console.log('🔑 Password: AdminPass123!')
    console.log('🏛️ Organization: HERA PLATFORM')
    console.log('💇 Default App: Salon Management')
    console.log('📱 Apps: Salon, Admin, Performance, Users')
    console.log('\n🔗 Access URLs:')
    console.log('   - Login: http://localhost:3000/auth/login')
    console.log('   - Salon: http://localhost:3000/salon')
    console.log('   - Admin: http://localhost:3000/admin')
    console.log('   - Performance: http://localhost:3000/admin/performance')
    console.log('\n✅ Admin user can now access salon and all admin features!')
    
  } catch (error) {
    console.error('❌ Error adding salon app:', error.message)
    throw error
  }
}

addSalonAppToPlatform().catch(console.error)