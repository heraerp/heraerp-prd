#!/usr/bin/env node
/**
 * Create Merchandising Domain Hierarchy for Database-Driven Workspace
 * Creates: Domain → Section → Workspace structure for merchandising/planning/main
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000000';
const DEFAULT_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createMerchandisingHierarchy() {
  console.log('🏗️  Creating Merchandising Domain Hierarchy for Database-Driven Workspace\n');

  try {
    // Step 1: Create Merchandising Domain
    console.log('📍 STEP 1: Creating Merchandising Domain');
    console.log('======================================');
    
    const createDomainResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: DEFAULT_USER_ID,
      p_organization_id: DEFAULT_ORG_ID,
      p_entity: {
        entity_type: 'APP_DOMAIN',
        entity_name: 'Merchandising & Category',
        entity_code: 'NAV-DOM-MERCHANDISING',
        entity_description: 'Product category management, merchandising strategies, and assortment planning',
        smart_code: 'HERA.PLATFORM.NAV.APPDOMAIN.MERCHANDISING.v1',
        metadata: {
          slug: 'merchandising',
          subtitle: 'Product categorization & merchandising',
          icon: 'tags'
        }
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    });

    if (createDomainResult.error) {
      console.error('❌ Failed to create merchandising domain:', createDomainResult.error);
      return;
    }

    const domainId = createDomainResult.data?.items?.[0]?.id || createDomainResult.data?.entity_id;
    console.log(`✅ Created merchandising domain: ${domainId}`);

    // Step 2: Create Planning Section under Merchandising Domain  
    console.log('\n📍 STEP 2: Creating Planning Section');
    console.log('===================================');
    
    const createSectionResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: DEFAULT_USER_ID,
      p_organization_id: DEFAULT_ORG_ID,
      p_entity: {
        entity_type: 'APP_SECTION',
        entity_name: 'Category Planning',
        entity_code: 'NAV-SEC-MERCHANDISING-PLANNING',
        entity_description: 'Category strategy, assortment planning, and seasonal merchandising',
        smart_code: 'HERA.PLATFORM.NAV.APPSECTION.MERCHANDISING.PLANNING.v1',
        parent_entity_id: domainId,
        metadata: {
          slug: 'planning',
          subtitle: 'Category & assortment planning',
          icon: 'calendar'
        }
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: {}
    });

    if (createSectionResult.error) {
      console.error('❌ Failed to create planning section:', createSectionResult.error);
      return;
    }

    const sectionId = createSectionResult.data?.items?.[0]?.id || createSectionResult.data?.entity_id;
    console.log(`✅ Created planning section: ${sectionId}`);

    // Step 3: Create Main Workspace under Planning Section
    console.log('\n📍 STEP 3: Creating Main Workspace');
    console.log('=================================');
    
    const createWorkspaceResult = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: DEFAULT_USER_ID,
      p_organization_id: DEFAULT_ORG_ID,
      p_entity: {
        entity_type: 'APP_WORKSPACE',
        entity_name: 'Category Planning Workspace',
        entity_code: 'NAV-WORK-MERCHANDISING-PLANNING-MAIN',
        entity_description: 'Main workspace for category planning, assortment strategy, and merchandising operations',
        smart_code: 'HERA.PLATFORM.NAV.APPWORKSPACE.MERCHANDISING.PLANNING.MAIN.v1',
        parent_entity_id: sectionId,
        metadata: {
          slug: 'main',
          subtitle: 'Category strategy and assortment planning workspace',
          icon: 'calendar',
          color: 'purple',
          persona_label: 'Category Manager',
          visible_roles: ['category_manager', 'merchandising_manager', 'admin'],
          default_nav: 'master-data'
        }
      },
      p_dynamic: {
        subtitle: {
          field_type: 'text',
          field_value_text: 'Category strategy and assortment planning workspace',
          smart_code: 'HERA.PLATFORM.NAV.FIELD.SUBTITLE.v1'
        },
        icon: {
          field_type: 'text', 
          field_value_text: 'Calendar',
          smart_code: 'HERA.PLATFORM.NAV.FIELD.ICON.v1'
        },
        color: {
          field_type: 'text',
          field_value_text: 'purple',
          smart_code: 'HERA.PLATFORM.NAV.FIELD.COLOR.v1'
        },
        persona_label: {
          field_type: 'text',
          field_value_text: 'Category Manager',
          smart_code: 'HERA.PLATFORM.NAV.FIELD.PERSONA.v1'
        },
        default_nav: {
          field_type: 'text',
          field_value_text: 'master-data',
          smart_code: 'HERA.PLATFORM.NAV.FIELD.DEFAULT_NAV.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    });

    if (createWorkspaceResult.error) {
      console.error('❌ Failed to create main workspace:', createWorkspaceResult.error);
      return;
    }

    const workspaceId = createWorkspaceResult.data?.items?.[0]?.id || createWorkspaceResult.data?.entity_id;
    console.log(`✅ Created main workspace: ${workspaceId}`);

    // Step 4: Verify the complete hierarchy
    console.log('\n📍 STEP 4: Verifying Complete Hierarchy');
    console.log('=====================================');
    
    // Test the API call that would be made
    console.log('🧪 Testing database-driven API call...');
    
    const testResponse = await fetch('http://localhost:3000/api/v2/merchandising/planning/main');
    const testResult = await testResponse.text();
    
    if (testResponse.ok) {
      console.log('✅ API test successful!');
      const data = JSON.parse(testResult);
      console.log(`   Workspace: ${data.workspace?.entity_name}`);
      console.log(`   Sections: ${data.layout_config?.sections?.length || 0} sections`);
    } else {
      console.log('❌ API test failed:', testResponse.status);
      console.log('   Response:', testResult);
    }

    console.log('\n🎉 MERCHANDISING DOMAIN HIERARCHY COMPLETE!');
    console.log('============================================');
    console.log(`🏢 Domain: Merchandising & Category (${domainId})`);
    console.log(`📦 Section: Category Planning (${sectionId})`);
    console.log(`🏗️  Workspace: Main (${workspaceId})`);
    console.log(`\n🔗 Hierarchy: merchandising → planning → main`);
    console.log(`🌐 URL: http://localhost:3000/retail/domains/merchandising/sections/planning`);
    console.log(`📊 Database-driven workspace configuration is now ready!`);

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

createMerchandisingHierarchy();