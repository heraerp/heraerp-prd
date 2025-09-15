#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applySalonSeeds() {
  try {
    console.log('Applying salon organization seeds...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'hera', 'seeds', 'salon', 'orgs.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If RPC doesn't exist, try direct approach
      console.log('RPC not available, trying direct insert...');
      
      // Insert organizations - matching actual schema
      const organizations = [
        {
          organization_name: 'Head Office (Dubai)',
          organization_code: 'ORG-HO-DXB',
          organization_type: 'services',
          industry_classification: 'beauty_services',
          status: 'active',
          settings: { 
            role: 'head_office', 
            finance_dna_enabled: true, 
            country: 'AE',
            default_currency: 'AED',
            timezone: 'Asia/Dubai',
            features_enabled: { finance_dna: true }
          }
        },
        {
          organization_name: 'Branch 1 - Dubai Main',
          organization_code: 'ORG-BR-DXB1',
          organization_type: 'services',
          industry_classification: 'beauty_services',
          status: 'active',
          settings: { 
            role: 'branch', 
            parent_org_code: 'ORG-HO-DXB', 
            country: 'AE', 
            area: 'Main',
            default_currency: 'AED',
            timezone: 'Asia/Dubai',
            features_enabled: { finance_dna: true }
          }
        },
        {
          organization_name: 'Branch 2 - Dubai Marina',
          organization_code: 'ORG-BR-DXB2',
          organization_type: 'services',
          industry_classification: 'beauty_services',
          status: 'active',
          settings: { 
            role: 'branch', 
            parent_org_code: 'ORG-HO-DXB', 
            country: 'AE', 
            area: 'Marina',
            default_currency: 'AED',
            timezone: 'Asia/Dubai',
            features_enabled: { finance_dna: true }
          }
        }
      ];
      
      const { data: insertData, error: insertError } = await supabase
        .from('core_organizations')
        .upsert(organizations, { onConflict: 'organization_code' })
        .select();
      
      if (insertError) {
        throw insertError;
      }
      
      console.log('Organizations inserted successfully');
    }
    
    // Verify the organizations exist
    const { data: orgs, error: verifyError } = await supabase
      .from('core_organizations')
      .select('id, organization_code, organization_name, settings, status')
      .in('organization_code', ['ORG-HO-DXB', 'ORG-BR-DXB1', 'ORG-BR-DXB2'])
      .order('organization_code');
    
    if (verifyError) {
      throw verifyError;
    }
    
    console.log('\nVerification - Organizations created:');
    console.table(orgs);
    
    console.log('\nIMPORTANT: Save these organization IDs for the next steps:');
    orgs.forEach(org => {
      const roleKey = org.organization_code.replace('ORG-', '').replace('-', '_') + '_ID';
      console.log(`${roleKey}: ${org.id}`);
    });
    
  } catch (error) {
    console.error('Error applying salon seeds:', error);
    process.exit(1);
  }
}

applySalonSeeds();