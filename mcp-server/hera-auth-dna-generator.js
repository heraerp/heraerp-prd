#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * HERA Authorization DNA Generator
 * Generates complete demo authentication infrastructure for any industry
 */

// Industry templates with roles and scopes
const INDUSTRY_TEMPLATES = {
  salon: {
    name: 'Beauty Salon',
    demo_org_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    session_duration: 30 * 60 * 1000,
    roles: {
      receptionist: {
        name: 'Salon Receptionist',
        scopes: [
          'read:HERA.SALON.SERVICE.APPOINTMENT',
          'write:HERA.SALON.SERVICE.APPOINTMENT',
          'read:HERA.SALON.CRM.CUSTOMER',
          'write:HERA.SALON.CRM.CUSTOMER',
          'read:HERA.SALON.SERVICE.CATALOG',
          'read:HERA.SALON.INVENTORY.PRODUCT'
        ]
      },
      stylist: {
        name: 'Hair Stylist',
        scopes: [
          'read:HERA.SALON.SERVICE.APPOINTMENT',
          'write:HERA.SALON.SERVICE.APPOINTMENT',
          'read:HERA.SALON.CRM.CUSTOMER',
          'read:HERA.SALON.SERVICE.CATALOG',
          'write:HERA.SALON.SERVICE.TREATMENT'
        ]
      },
      manager: {
        name: 'Salon Manager',
        scopes: [
          'read:HERA.SALON.SERVICE.APPOINTMENT',
          'write:HERA.SALON.SERVICE.APPOINTMENT',
          'read:HERA.SALON.CRM.CUSTOMER',
          'write:HERA.SALON.CRM.CUSTOMER',
          'read:HERA.SALON.SERVICE.CATALOG',
          'write:HERA.SALON.SERVICE.CATALOG',
          'read:HERA.SALON.INVENTORY.PRODUCT',
          'write:HERA.SALON.INVENTORY.PRODUCT',
          'read:HERA.SALON.STAFF.SCHEDULE'
        ]
      }
    }
  },
  restaurant: {
    name: 'Restaurant',
    demo_org_id: '3740d358-f283-47e8-8055-852b67eee1a6',
    session_duration: 30 * 60 * 1000,
    roles: {
      cashier: {
        name: 'Restaurant Cashier',
        scopes: [
          'read:HERA.REST.POS.ORDER',
          'write:HERA.REST.POS.ORDER',
          'read:HERA.REST.MENU.ITEM',
          'read:HERA.REST.CRM.CUSTOMER'
        ]
      },
      server: {
        name: 'Restaurant Server',
        scopes: [
          'read:HERA.REST.POS.ORDER',
          'write:HERA.REST.POS.ORDER',
          'read:HERA.REST.MENU.ITEM',
          'read:HERA.REST.TABLE.ASSIGNMENT',
          'write:HERA.REST.TABLE.STATUS'
        ]
      },
      manager: {
        name: 'Restaurant Manager',
        scopes: [
          'read:HERA.REST.POS.ORDER',
          'write:HERA.REST.POS.ORDER',
          'read:HERA.REST.MENU.ITEM',
          'write:HERA.REST.MENU.ITEM',
          'read:HERA.REST.INVENTORY.PRODUCT',
          'write:HERA.REST.INVENTORY.PRODUCT',
          'read:HERA.REST.FIN.REVENUE',
          'read:HERA.REST.STAFF.SCHEDULE'
        ]
      }
    }
  },
  healthcare: {
    name: 'Healthcare Practice',
    demo_org_id: '037aac11-2323-4a71-8781-88a8454c9695',
    session_duration: 45 * 60 * 1000,
    roles: {
      nurse: {
        name: 'Registered Nurse',
        scopes: [
          'read:HERA.HLTH.PAT.RECORD',
          'write:HERA.HLTH.PAT.RECORD',
          'read:HERA.HLTH.APPOINTMENT',
          'write:HERA.HLTH.VITAL.SIGNS',
          'read:HERA.HLTH.MEDICATION'
        ]
      },
      doctor: {
        name: 'Medical Doctor',
        scopes: [
          'read:HERA.HLTH.PAT.RECORD',
          'write:HERA.HLTH.PAT.RECORD',
          'read:HERA.HLTH.APPOINTMENT',
          'write:HERA.HLTH.APPOINTMENT',
          'write:HERA.HLTH.PRESCRIPTION',
          'read:HERA.HLTH.MEDICATION',
          'write:HERA.HLTH.DIAGNOSIS'
        ]
      },
      receptionist: {
        name: 'Medical Receptionist',
        scopes: [
          'read:HERA.HLTH.APPOINTMENT',
          'write:HERA.HLTH.APPOINTMENT',
          'read:HERA.HLTH.PAT.BASIC',
          'write:HERA.HLTH.PAT.BASIC',
          'read:HERA.HLTH.INSURANCE'
        ]
      }
    }
  },
  manufacturing: {
    name: 'Manufacturing Plant',
    demo_org_id: uuidv4(), // Generate new for manufacturing
    session_duration: 60 * 60 * 1000, // Longer for manufacturing shifts
    roles: {
      operator: {
        name: 'Machine Operator',
        scopes: [
          'read:HERA.MFG.PRODUCTION.ORDER',
          'write:HERA.MFG.PRODUCTION.STATUS',
          'read:HERA.MFG.WORK.INSTRUCTION',
          'write:HERA.MFG.QUALITY.CHECK'
        ]
      },
      supervisor: {
        name: 'Production Supervisor',
        scopes: [
          'read:HERA.MFG.PRODUCTION.ORDER',
          'write:HERA.MFG.PRODUCTION.ORDER',
          'read:HERA.MFG.WORK.INSTRUCTION',
          'write:HERA.MFG.WORK.INSTRUCTION',
          'read:HERA.MFG.QUALITY.CHECK',
          'write:HERA.MFG.QUALITY.APPROVAL',
          'read:HERA.MFG.STAFF.SCHEDULE'
        ]
      },
      planner: {
        name: 'Production Planner',
        scopes: [
          'read:HERA.MFG.PRODUCTION.ORDER',
          'write:HERA.MFG.PRODUCTION.ORDER',
          'read:HERA.MFG.INVENTORY.MATERIAL',
          'write:HERA.MFG.SCHEDULE.PLAN',
          'read:HERA.MFG.BOM.COMPONENT',
          'read:HERA.MFG.CAPACITY.PLAN'
        ]
      }
    }
  }
};

class HERAAuthDNAGenerator {
  constructor() {
    this.platformOrgId = '00000000-0000-0000-0000-000000000000';
  }

  /**
   * Generate complete demo authentication infrastructure for an industry
   */
  async generateIndustryAuth(industryKey, options = {}) {
    console.log(`🧬 Generating HERA Authorization DNA for ${industryKey}...`);
    
    const template = INDUSTRY_TEMPLATES[industryKey];
    if (!template) {
      throw new Error(`Industry template not found: ${industryKey}`);
    }

    const results = {
      industry: industryKey,
      demo_org_id: template.demo_org_id,
      users_created: [],
      anchor_created: null,
      memberships_created: []
    };

    try {
      // Step 1: Ensure demo organization exists (skip if already exists)
      await this.ensureDemoOrganization(template, industryKey);

      // Step 2: Create organization anchor
      const anchorId = await this.createOrganizationAnchor(template.demo_org_id, industryKey);
      results.anchor_created = anchorId;

      // Step 3: Create demo users for each role
      for (const [roleKey, roleConfig] of Object.entries(template.roles)) {
        const userId = await this.createDemoUser(industryKey, roleKey, roleConfig, template);
        const membershipId = await this.createMembership(userId, anchorId, roleKey, roleConfig, template);
        
        results.users_created.push({
          role: roleKey,
          user_id: userId,
          membership_id: membershipId,
          supabase_user_id: `demo|${industryKey}-${roleKey}`
        });
      }

      console.log(`✅ ${industryKey} Authorization DNA generated successfully!`);
      return results;

    } catch (error) {
      console.error(`💥 Failed to generate ${industryKey} Authorization DNA:`, error);
      throw error;
    }
  }

  /**
   * Ensure demo organization exists
   */
  async ensureDemoOrganization(template, industryKey) {
    const { data: existing } = await supabase
      .from('core_organizations')
      .select('id')
      .eq('id', template.demo_org_id)
      .single();

    if (existing) {
      console.log(`   ✅ Demo organization exists: ${template.demo_org_id}`);
      return;
    }

    // Create demo organization
    const { error } = await supabase
      .from('core_organizations')
      .insert({
        id: template.demo_org_id,
        organization_name: `${template.name} (Demo)`,
        organization_type: industryKey,
        organization_status: 'active',
        metadata: {
          demo: true,
          industry: industryKey,
          created_by: 'hera-auth-dna-generator'
        }
      });

    if (error) {
      throw new Error(`Failed to create demo organization: ${error.message}`);
    }

    console.log(`   ✅ Created demo organization: ${template.name} (Demo)`);
  }

  /**
   * Create organization anchor entity
   */
  async createOrganizationAnchor(orgId, industryKey) {
    const anchorId = uuidv4();
    
    const { error } = await supabase
      .from('core_entities')
      .insert({
        id: anchorId,
        organization_id: orgId,
        entity_type: 'org_anchor',
        entity_name: `${industryKey.charAt(0).toUpperCase() + industryKey.slice(1)} Membership Anchor`,
        entity_code: `ANCHOR-${industryKey.toUpperCase()}`,
        smart_code: 'HERA.SEC.ORG.ANCHOR.MEMBERSHIP.v1',
        metadata: {
          purpose: 'membership_anchor',
          industry: industryKey,
          demo: true
        }
      });

    if (error) {
      throw new Error(`Failed to create organization anchor: ${error.message}`);
    }

    console.log(`   ✅ Created organization anchor: ${anchorId}`);
    return anchorId;
  }

  /**
   * Create demo user in Platform organization
   */
  async createDemoUser(industryKey, roleKey, roleConfig, template) {
    const userId = uuidv4();
    const supabaseUserId = `demo|${industryKey}-${roleKey}`;

    const { error } = await supabase
      .from('core_entities')
      .insert({
        id: userId,
        organization_id: this.platformOrgId,
        entity_type: 'user',
        entity_name: `Demo ${roleConfig.name}`,
        entity_code: `DEMO-${industryKey.toUpperCase()}-${roleKey.toUpperCase()}`,
        smart_code: `HERA.SEC.DEMO.USER.${industryKey.toUpperCase()}.v1`,
        metadata: {
          supabase_user_id: supabaseUserId,
          demo: true,
          industry: industryKey,
          role: roleKey,
          created_by: 'hera-auth-dna-generator'
        }
      });

    if (error) {
      throw new Error(`Failed to create demo user: ${error.message}`);
    }

    console.log(`   ✅ Created demo user: ${roleConfig.name} (${userId})`);
    return userId;
  }

  /**
   * Create membership relationship
   */
  async createMembership(userId, anchorId, roleKey, roleConfig, template) {
    const membershipId = uuidv4();
    const expiresAt = new Date(Date.now() + template.session_duration);

    const { error } = await supabase
      .from('core_relationships')
      .insert({
        id: membershipId,
        organization_id: template.demo_org_id,
        from_entity_id: userId,
        to_entity_id: anchorId,
        relationship_type: 'membership',
        relationship_data: {
          role: `HERA.SEC.ROLE.${roleKey.toUpperCase()}.DEMO.v1`,
          scopes: roleConfig.scopes,
          permissions: roleConfig.scopes.map(scope => scope.split(':')[1]),
          created_by: 'hera-auth-dna-generator'
        },
        smart_code: `HERA.SEC.MEMBERSHIP.DEMO.${template.demo_org_id.split('-')[0].toUpperCase()}.v1`,
        is_active: true,
        effective_date: new Date().toISOString(),
        expiration_date: expiresAt.toISOString()
      });

    if (error) {
      throw new Error(`Failed to create membership: ${error.message}`);
    }

    console.log(`   ✅ Created membership: ${roleKey} → ${anchorId}`);
    return membershipId;
  }

  /**
   * Generate demo user configuration for code
   */
  generateDemoUserConfig(industryKey) {
    const template = INDUSTRY_TEMPLATES[industryKey];
    if (!template) {
      throw new Error(`Industry template not found: ${industryKey}`);
    }

    const config = {};
    
    for (const [roleKey, roleConfig] of Object.entries(template.roles)) {
      const configKey = `${industryKey}-${roleKey}`;
      config[configKey] = {
        supabase_user_id: `demo|${industryKey}-${roleKey}`,
        organization_id: template.demo_org_id,
        redirect_path: `/${industryKey}/dashboard`,
        session_duration: template.session_duration,
        role: `HERA.SEC.ROLE.${roleKey.toUpperCase()}.DEMO.v1`,
        scopes: roleConfig.scopes
      };
    }

    return config;
  }

  /**
   * List all available industry templates
   */
  listIndustries() {
    console.log('🏭 Available Industry Templates:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const [key, template] of Object.entries(INDUSTRY_TEMPLATES)) {
      console.log(`📋 ${key.toUpperCase()}: ${template.name}`);
      console.log(`   Roles: ${Object.keys(template.roles).join(', ')}`);
      console.log(`   Session: ${template.session_duration / 60000} minutes`);
      console.log(`   Demo Org: ${template.demo_org_id}`);
      console.log('');
    }
  }
}

// CLI Interface
async function main() {
  const generator = new HERAAuthDNAGenerator();
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help') {
    console.log('🧬 HERA Authorization DNA Generator');
    console.log('');
    console.log('Usage:');
    console.log('  node hera-auth-dna-generator.js <command> [options]');
    console.log('');
    console.log('Commands:');
    console.log('  list                     List available industry templates');
    console.log('  generate <industry>      Generate complete auth DNA for industry');
    console.log('  config <industry>        Generate demo user configuration');
    console.log('  all                      Generate auth DNA for all industries');
    console.log('');
    console.log('Examples:');
    console.log('  node hera-auth-dna-generator.js list');
    console.log('  node hera-auth-dna-generator.js generate salon');
    console.log('  node hera-auth-dna-generator.js generate manufacturing');
    console.log('  node hera-auth-dna-generator.js config restaurant');
    console.log('  node hera-auth-dna-generator.js all');
    return;
  }

  const command = args[0];
  const industry = args[1];

  try {
    switch (command) {
      case 'list':
        generator.listIndustries();
        break;
        
      case 'generate':
        if (!industry) {
          console.error('❌ Industry required. Use: generate <industry>');
          process.exit(1);
        }
        const result = await generator.generateIndustryAuth(industry);
        console.log('');
        console.log('📋 Generation Summary:');
        console.log(`Industry: ${result.industry}`);
        console.log(`Demo Org: ${result.demo_org_id}`);
        console.log(`Users Created: ${result.users_created.length}`);
        console.log(`Anchor: ${result.anchor_created}`);
        break;
        
      case 'config':
        if (!industry) {
          console.error('❌ Industry required. Use: config <industry>');
          process.exit(1);
        }
        const config = generator.generateDemoUserConfig(industry);
        console.log('📝 Demo User Configuration:');
        console.log(JSON.stringify(config, null, 2));
        break;
        
      case 'all':
        console.log('🚀 Generating Authorization DNA for ALL industries...');
        for (const industryKey of Object.keys(INDUSTRY_TEMPLATES)) {
          console.log(`\n📋 Processing ${industryKey}...`);
          await generator.generateIndustryAuth(industryKey);
        }
        console.log('\n🎉 All industries generated successfully!');
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Generation failed:', error.message);
    process.exit(1);
  }
}

// Execute if called directly
if (require.main === module) {
  main();
}

module.exports = { HERAAuthDNAGenerator, INDUSTRY_TEMPLATES };