#!/usr/bin/env node

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createKochiOrganization() {
  console.log('Creating Kochi Ice Cream organization...')
  
  const { data, error } = await supabase
    .from('core_organizations')
    .insert({
      organization_name: 'Kochi Ice Cream Manufacturing',
      organization_code: 'ORG.COCHIN.ICECREAM',
      organization_type: 'business_unit',
      industry_classification: 'food_manufacturing',
      settings: {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        fiscal_year_start: 'April',
        gst_registered: true,
        gstin: '32AABCK1234L1Z5',
        food_license: 'FSSAI-10014051000123'
      },
      ai_insights: {
        business_model: 'manufacturing_retail',
        outlets_count: 2,
        product_categories: ['ice_cream', 'frozen_desserts'],
        compliance_requirements: ['FSSAI', 'GST', 'ISO22000']
      },
      status: 'active'
    })
    .select()
    .single()
    
  if (error) {
    console.error('Error creating organization:', error)
    return null
  }
  
  console.log('✅ Organization created successfully!')
  console.log('ID:', data.id)
  console.log('Code:', data.organization_code)
  
  return data
}

createKochiOrganization()