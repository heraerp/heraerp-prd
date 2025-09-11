#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const { config } = require('dotenv')
const path = require('path')

// Load environment variables
config({ path: path.join(__dirname, '..', '.env.local') })
config({ path: path.join(__dirname, '..', '.env') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Smart codes for CRM entities
const SMART_CODES = {
  lead: {
    create: 'HERA.CRM.LEAD.CREATE.v1',
    qualify: 'HERA.CRM.LEAD.QUALIFY.v1',
    convert: 'HERA.CRM.LEAD.CONVERT.v1'
  },
  opportunity: {
    create: 'HERA.CRM.OPP.CREATE.v1',
    advance: 'HERA.CRM.OPP.ADVANCE.v1',
    close: 'HERA.CRM.OPP.CLOSE.v1'
  },
  account: {
    create: 'HERA.CRM.ACC.CREATE.v1',
    onboard: 'HERA.CRM.ACC.ONBOARD.v1'
  },
  contact: {
    create: 'HERA.CRM.CONT.CREATE.v1',
    engage: 'HERA.CRM.CONT.ENGAGE.v1'
  },
  activity: {
    create: 'HERA.CRM.ACT.CREATE.v1',
    complete: 'HERA.CRM.ACT.COMPLETE.v1'
  }
}

// Demo data for TechVantage Solutions
const demoData = {
  leads: [
    {
      company_name: 'Innovate Tech Corp',
      contact_name: 'Michael Johnson',
      email: 'michael.johnson@innovatetech.com',
      phone: '+1 (555) 123-4567',
      lead_source: 'website',
      lead_score: 85,
      status: 'qualified'
    },
    {
      company_name: 'Digital Solutions LLC',
      contact_name: 'Sarah Williams',
      email: 'sarah.williams@digitalsolutions.com',
      phone: '+1 (555) 234-5678',
      lead_source: 'referral',
      lead_score: 75,
      status: 'contacted'
    },
    {
      company_name: 'Future Systems Inc',
      contact_name: 'David Chen',
      email: 'david.chen@futuresystems.com',
      phone: '+1 (555) 345-6789',
      lead_source: 'event',
      lead_score: 60,
      status: 'new'
    },
    {
      company_name: 'NextGen Analytics',
      contact_name: 'Emily Davis',
      email: 'emily.davis@nextgenanalytics.com',
      phone: '+1 (555) 456-7890',
      lead_source: 'social_media',
      lead_score: 90,
      status: 'qualified'
    },
    {
      company_name: 'Cloud Dynamics',
      contact_name: 'Robert Martinez',
      email: 'robert.martinez@clouddynamics.com',
      phone: '+1 (555) 567-8901',
      lead_source: 'cold_call',
      lead_score: 45,
      status: 'new'
    }
  ],
  
  opportunities: [
    {
      name: 'Global Manufacturing ERP Implementation',
      account_name: 'Global Manufacturing Corp',
      amount: 750000,
      stage: 'proposal',
      probability: 85,
      close_date: '2024-12-15',
      next_step: 'Executive presentation scheduled'
    },
    {
      name: 'Healthcare System Integration',
      account_name: 'Regional Healthcare Network',
      amount: 450000,
      stage: 'negotiation',
      probability: 90,
      close_date: '2024-11-30',
      next_step: 'Contract review with legal'
    },
    {
      name: 'Financial Services Digital Transformation',
      account_name: 'Community Credit Union',
      amount: 275000,
      stage: 'proposal',
      probability: 70,
      close_date: '2025-01-15',
      next_step: 'ROI analysis presentation'
    },
    {
      name: 'Retail Chain POS Upgrade',
      account_name: 'Fashion Forward Retail',
      amount: 125000,
      stage: 'qualification',
      probability: 60,
      close_date: '2025-02-28',
      next_step: 'Technical requirements gathering'
    },
    {
      name: 'AI Analytics Platform',
      account_name: 'Data Insights Corp',
      amount: 325000,
      stage: 'needs_analysis',
      probability: 75,
      close_date: '2025-01-30',
      next_step: 'Solution architecture design'
    }
  ],
  
  accounts: [
    {
      name: 'Global Manufacturing Corp',
      industry: 'Manufacturing',
      annual_revenue: 500000000,
      employee_count: 2500,
      account_tier: 'Enterprise'
    },
    {
      name: 'Regional Healthcare Network',
      industry: 'Healthcare',
      annual_revenue: 250000000,
      employee_count: 1200,
      account_tier: 'Enterprise'
    },
    {
      name: 'Community Credit Union',
      industry: 'Financial Services',
      annual_revenue: 75000000,
      employee_count: 350,
      account_tier: 'Mid-Market'
    },
    {
      name: 'Fashion Forward Retail',
      industry: 'Retail',
      annual_revenue: 150000000,
      employee_count: 800,
      account_tier: 'Mid-Market'
    }
  ],
  
  contacts: [
    {
      first_name: 'John',
      last_name: 'Smith',
      title: 'VP of Operations',
      email: 'john.smith@globalmanufacturing.com',
      phone: '+1 (555) 111-2222',
      account: 'Global Manufacturing Corp',
      decision_maker: true
    },
    {
      first_name: 'Lisa',
      last_name: 'Anderson',
      title: 'CTO',
      email: 'lisa.anderson@regionalhealthcare.com',
      phone: '+1 (555) 222-3333',
      account: 'Regional Healthcare Network',
      decision_maker: true
    },
    {
      first_name: 'Mark',
      last_name: 'Thompson',
      title: 'Director of IT',
      email: 'mark.thompson@communitycu.com',
      phone: '+1 (555) 333-4444',
      account: 'Community Credit Union',
      decision_maker: false
    }
  ],
  
  activities: [
    {
      type: 'call',
      subject: 'Initial discovery call with Global Manufacturing',
      description: 'Discussed ERP requirements and pain points',
      due_date: '2024-10-25',
      priority: 'high',
      status: 'completed',
      related_to: 'Global Manufacturing Corp'
    },
    {
      type: 'meeting',
      subject: 'Solution demo for Healthcare System',
      description: 'Present integration capabilities and timeline',
      due_date: '2024-10-30',
      priority: 'high',
      status: 'scheduled',
      related_to: 'Regional Healthcare Network'
    },
    {
      type: 'email',
      subject: 'Follow up on proposal - Credit Union',
      description: 'Send revised pricing and implementation plan',
      due_date: '2024-11-01',
      priority: 'medium',
      status: 'pending',
      related_to: 'Community Credit Union'
    }
  ]
}

async function seedCRMData() {
  console.log('🌱 Seeding CRM demo data...')
  
  try {
    // Get or create default organization
    const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || process.env.DEFAULT_ORGANIZATION_ID
    if (!orgId) {
      console.error('❌ NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID not set in environment')
      process.exit(1)
    }
    
    console.log(`📍 Using organization: ${orgId}`)
    
    // Seed Leads
    console.log('\n📋 Creating leads...')
    for (const lead of demoData.leads) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'lead',
          entity_name: lead.company_name,
          entity_code: `LEAD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          smart_code: SMART_CODES.lead.create,
          status: 'active',
          created_by: 'demo-seed',
          metadata: {
            contact_name: lead.contact_name,
            email: lead.email,
            phone: lead.phone,
            lead_source: lead.lead_source,
            lead_score: lead.lead_score,
            status: lead.status
          }
        })
        .select()
        .single()
      
      if (error) {
        console.error(`❌ Error creating lead ${lead.company_name}:`, error.message)
      } else {
        console.log(`✅ Created lead: ${lead.company_name}`)
        
        // Add dynamic data
        const dynamicFields = [
          { field_name: 'contact_name', field_value_text: lead.contact_name },
          { field_name: 'email', field_value_text: lead.email },
          { field_name: 'phone', field_value_text: lead.phone },
          { field_name: 'lead_source', field_value_text: lead.lead_source },
          { field_name: 'lead_score', field_value_number: lead.lead_score },
          { field_name: 'status', field_value_text: lead.status }
        ]
        
        for (const field of dynamicFields) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: orgId,
              entity_id: data.id,
              ...field,
              field_type: field.field_value_number !== undefined ? 'number' : 'text',
              created_by: 'demo-seed'
            })
        }
      }
    }
    
    // Seed Accounts
    console.log('\n🏢 Creating accounts...')
    for (const account of demoData.accounts) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'account',
          entity_name: account.name,
          entity_code: `ACC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          smart_code: SMART_CODES.account.create,
          status: 'active',
          created_by: 'demo-seed',
          metadata: {
            industry: account.industry,
            annual_revenue: account.annual_revenue,
            employee_count: account.employee_count,
            account_tier: account.account_tier
          }
        })
        .select()
        .single()
      
      if (error) {
        console.error(`❌ Error creating account ${account.name}:`, error.message)
      } else {
        console.log(`✅ Created account: ${account.name}`)
        
        // Add dynamic data
        const dynamicFields = [
          { field_name: 'industry', field_value_text: account.industry },
          { field_name: 'annual_revenue', field_value_number: account.annual_revenue },
          { field_name: 'employee_count', field_value_number: account.employee_count },
          { field_name: 'account_tier', field_value_text: account.account_tier }
        ]
        
        for (const field of dynamicFields) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: orgId,
              entity_id: data.id,
              ...field,
              field_type: field.field_value_number !== undefined ? 'number' : 'text',
              created_by: 'demo-seed'
            })
        }
      }
    }
    
    // Seed Opportunities
    console.log('\n💰 Creating opportunities...')
    for (const opp of demoData.opportunities) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'opportunity',
          entity_name: opp.name,
          entity_code: `OPP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          smart_code: SMART_CODES.opportunity.create,
          status: 'active',
          created_by: 'demo-seed',
          metadata: {
            account_name: opp.account_name,
            amount: opp.amount,
            stage: opp.stage,
            probability: opp.probability,
            close_date: opp.close_date,
            next_step: opp.next_step
          }
        })
        .select()
        .single()
      
      if (error) {
        console.error(`❌ Error creating opportunity ${opp.name}:`, error.message)
      } else {
        console.log(`✅ Created opportunity: ${opp.name}`)
        
        // Add dynamic data
        const dynamicFields = [
          { field_name: 'account_name', field_value_text: opp.account_name },
          { field_name: 'amount', field_value_number: opp.amount },
          { field_name: 'stage', field_value_text: opp.stage },
          { field_name: 'probability', field_value_number: opp.probability },
          { field_name: 'close_date', field_value_text: opp.close_date },
          { field_name: 'next_step', field_value_text: opp.next_step }
        ]
        
        for (const field of dynamicFields) {
          await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: orgId,
              entity_id: data.id,
              ...field,
              field_type: field.field_value_number !== undefined ? 'number' : 'text',
              created_by: 'demo-seed'
            })
        }
      }
    }
    
    // Seed Contacts
    console.log('\n👥 Creating contacts...')
    for (const contact of demoData.contacts) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'contact',
          entity_name: `${contact.first_name} ${contact.last_name}`,
          entity_code: `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          smart_code: SMART_CODES.contact.create,
          status: 'active',
          created_by: 'demo-seed',
          metadata: {
            first_name: contact.first_name,
            last_name: contact.last_name,
            title: contact.title,
            email: contact.email,
            phone: contact.phone,
            account: contact.account,
            decision_maker: contact.decision_maker
          }
        })
        .select()
        .single()
      
      if (error) {
        console.error(`❌ Error creating contact ${contact.first_name} ${contact.last_name}:`, error.message)
      } else {
        console.log(`✅ Created contact: ${contact.first_name} ${contact.last_name}`)
      }
    }
    
    // Seed Activities
    console.log('\n📅 Creating activities...')
    for (const activity of demoData.activities) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'activity',
          entity_name: activity.subject,
          entity_code: `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          smart_code: SMART_CODES.activity.create,
          status: 'active',
          created_by: 'demo-seed',
          metadata: {
            activity_type: activity.type,
            description: activity.description,
            due_date: activity.due_date,
            priority: activity.priority,
            activity_status: activity.status,
            related_to: activity.related_to
          }
        })
        .select()
        .single()
      
      if (error) {
        console.error(`❌ Error creating activity ${activity.subject}:`, error.message)
      } else {
        console.log(`✅ Created activity: ${activity.subject}`)
      }
    }
    
    console.log('\n✨ CRM demo data seeded successfully!')
    console.log('\n📊 Summary:')
    console.log(`- ${demoData.leads.length} leads created`)
    console.log(`- ${demoData.accounts.length} accounts created`)
    console.log(`- ${demoData.opportunities.length} opportunities created`)
    console.log(`- ${demoData.contacts.length} contacts created`)
    console.log(`- ${demoData.activities.length} activities created`)
    
  } catch (error) {
    console.error('❌ Error seeding CRM data:', error)
    process.exit(1)
  }
}

// Run the seeding
if (require.main === module) {
  seedCRMData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { seedCRMData }