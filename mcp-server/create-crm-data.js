const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Kerala Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';

async function seedCRMData() {
  console.log('🚀 Starting CRM data seeding...');

  try {
    // 1. Create Accounts
    console.log('\n📊 Creating accounts...');
    const accounts = [
      {
        entity_type: 'account',
        entity_name: 'Infosys Ltd',
        entity_code: 'ACC-INFOSYS',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.ENTERPRISE.ACTIVE.v1',
        metadata: {
          industry: 'Technology',
          segment: 'Enterprise',
          annual_revenue: 18500000000,
          employees: 350000,
          founded: '1981'
        }
      },
      {
        entity_type: 'account',
        entity_name: 'Tata Consultancy Services',
        entity_code: 'ACC-TCS',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.ENTERPRISE.ACTIVE.v1',
        metadata: {
          industry: 'Technology',
          segment: 'Enterprise',
          annual_revenue: 25700000000,
          employees: 600000,
          founded: '1968'
        }
      },
      {
        entity_type: 'account',
        entity_name: 'Wipro Limited',
        entity_code: 'ACC-WIPRO',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.ENTERPRISE.ACTIVE.v1',
        metadata: {
          industry: 'Technology',
          segment: 'Enterprise',
          annual_revenue: 11000000000,
          employees: 250000,
          founded: '1945'
        }
      },
      {
        entity_type: 'account',
        entity_name: 'HCL Technologies',
        entity_code: 'ACC-HCL',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.ENTERPRISE.ACTIVE.v1',
        metadata: {
          industry: 'Technology',
          segment: 'Enterprise',
          annual_revenue: 13000000000,
          employees: 220000,
          founded: '1976'
        }
      },
      {
        entity_type: 'account',
        entity_name: 'Tech Mahindra',
        entity_code: 'ACC-TECH-MAHINDRA',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.SMB.ACTIVE.v1',
        metadata: {
          industry: 'Technology',
          segment: 'SMB',
          annual_revenue: 6500000000,
          employees: 150000,
          founded: '1986'
        }
      },
      {
        entity_type: 'account',
        entity_name: 'Mindtree',
        entity_code: 'ACC-MINDTREE',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.SMB.ACTIVE.v1',
        metadata: {
          industry: 'Technology',
          segment: 'SMB',
          annual_revenue: 1200000000,
          employees: 35000,
          founded: '1999'
        }
      },
      {
        entity_type: 'account',
        entity_name: 'Cognizant',
        entity_code: 'ACC-COGNIZANT',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.ENTERPRISE.ACTIVE.v1',
        metadata: {
          industry: 'Technology',
          segment: 'Enterprise',
          annual_revenue: 19400000000,
          employees: 350000,
          founded: '1994'
        }
      },
      {
        entity_type: 'account',
        entity_name: 'Mphasis',
        entity_code: 'ACC-MPHASIS',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.SMB.INACTIVE.v1',
        metadata: {
          industry: 'Technology',
          segment: 'SMB',
          annual_revenue: 1600000000,
          employees: 30000,
          founded: '1992'
        }
      }
    ];

    const { data: accountsData, error: accountsError } = await supabase
      .from('core_entities')
      .insert(accounts)
      .select();

    if (accountsError) throw accountsError;
    console.log(`✅ Created ${accountsData.length} accounts`);

    // 2. Create Contacts
    console.log('\n👥 Creating contacts...');
    const contacts = [
      {
        entity_type: 'contact',
        entity_name: 'Rajesh Kumar',
        entity_code: 'CON-RAJESH-KUMAR',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.DECISION_MAKER.ACTIVE.v1',
        metadata: {
          title: 'VP Technology',
          department: 'IT Infrastructure',
          decision_maker: true
        }
      },
      {
        entity_type: 'contact',
        entity_name: 'Priya Sharma',
        entity_code: 'CON-PRIYA-SHARMA',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.DECISION_MAKER.ACTIVE.v1',
        metadata: {
          title: 'CTO',
          department: 'Technology',
          decision_maker: true
        }
      },
      {
        entity_type: 'contact',
        entity_name: 'Vikram Singh',
        entity_code: 'CON-VIKRAM-SINGH',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.INFLUENCER.ACTIVE.v1',
        metadata: {
          title: 'Network Manager',
          department: 'IT Operations',
          decision_maker: false
        }
      },
      {
        entity_type: 'contact',
        entity_name: 'Anjali Gupta',
        entity_code: 'CON-ANJALI-GUPTA',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.DECISION_MAKER.ACTIVE.v1',
        metadata: {
          title: 'Director IT',
          department: 'IT',
          decision_maker: true
        }
      },
      {
        entity_type: 'contact',
        entity_name: 'Suresh Reddy',
        entity_code: 'CON-SURESH-REDDY',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.INFLUENCER.ACTIVE.v1',
        metadata: {
          title: 'Infrastructure Lead',
          department: 'IT Infrastructure',
          decision_maker: false
        }
      },
      {
        entity_type: 'contact',
        entity_name: 'Deepak Joshi',
        entity_code: 'CON-DEEPAK-JOSHI',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.DECISION_MAKER.ACTIVE.v1',
        metadata: {
          title: 'VP Operations',
          department: 'Operations',
          decision_maker: true
        }
      },
      {
        entity_type: 'contact',
        entity_name: 'Ravi Krishnan',
        entity_code: 'CON-RAVI-KRISHNAN',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.CHAMPION.ACTIVE.v1',
        metadata: {
          title: 'CIO',
          department: 'IT',
          decision_maker: true
        }
      },
      {
        entity_type: 'contact',
        entity_name: 'Kavita Nair',
        entity_code: 'CON-KAVITA-NAIR',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.INFLUENCER.INACTIVE.v1',
        metadata: {
          title: 'IT Manager',
          department: 'IT',
          decision_maker: false
        }
      }
    ];

    const { data: contactsData, error: contactsError } = await supabase
      .from('core_entities')
      .insert(contacts)
      .select();

    if (contactsError) throw contactsError;
    console.log(`✅ Created ${contactsData.length} contacts`);

    // 3. Create Contact Dynamic Data (email, phone)
    console.log('\n📧 Adding contact details...');
    const contactDetails = [
      // Rajesh Kumar
      {
        entity_id: contactsData[0].id,
        field_name: 'email',
        field_value_text: 'rajesh.kumar@infosys.com',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.FIELD.EMAIL.PRIMARY.v1'
      },
      {
        entity_id: contactsData[0].id,
        field_name: 'phone',
        field_value_text: '+91 98765 43210',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.FIELD.PHONE.MOBILE.v1'
      },
      // Priya Sharma
      {
        entity_id: contactsData[1].id,
        field_name: 'email',
        field_value_text: 'priya.sharma@tcs.com',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.FIELD.EMAIL.PRIMARY.v1'
      },
      {
        entity_id: contactsData[1].id,
        field_name: 'phone',
        field_value_text: '+91 98765 43211',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.FIELD.PHONE.MOBILE.v1'
      },
      // Vikram Singh
      {
        entity_id: contactsData[2].id,
        field_name: 'email',
        field_value_text: 'vikram.singh@wipro.com',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.FIELD.EMAIL.PRIMARY.v1'
      },
      {
        entity_id: contactsData[2].id,
        field_name: 'phone',
        field_value_text: '+91 98765 43212',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CONTACT.FIELD.PHONE.MOBILE.v1'
      }
    ];

    const { error: contactDetailsError } = await supabase
      .from('core_dynamic_data')
      .insert(contactDetails);

    if (contactDetailsError) throw contactDetailsError;
    console.log(`✅ Added contact details`);

    // 4. Create Account Dynamic Data (website, industry)
    console.log('\n🌐 Adding account details...');
    const accountDetails = [
      {
        entity_id: accountsData[0].id,
        field_name: 'website',
        field_value_text: 'https://www.infosys.com',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.FIELD.WEBSITE.PRIMARY.v1'
      },
      {
        entity_id: accountsData[0].id,
        field_name: 'industry',
        field_value_text: 'Information Technology',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.FIELD.INDUSTRY.v1'
      },
      {
        entity_id: accountsData[1].id,
        field_name: 'website',
        field_value_text: 'https://www.tcs.com',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.FIELD.WEBSITE.PRIMARY.v1'
      },
      {
        entity_id: accountsData[1].id,
        field_name: 'industry',
        field_value_text: 'Information Technology',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.ACCOUNT.FIELD.INDUSTRY.v1'
      }
    ];

    const { error: accountDetailsError } = await supabase
      .from('core_dynamic_data')
      .insert(accountDetails);

    if (accountDetailsError) throw accountDetailsError;
    console.log(`✅ Added account details`);

    // 5. Create Relationships (Account-Contact)
    console.log('\n🔗 Creating account-contact relationships...');
    const relationships = [
      {
        from_entity_id: accountsData[0].id, // Infosys
        to_entity_id: contactsData[0].id,   // Rajesh Kumar
        relationship_type: 'ACCOUNT_HAS_CONTACT',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.REL.ACCOUNT_CONTACT.PRIMARY.v1'
      },
      {
        from_entity_id: accountsData[1].id, // TCS
        to_entity_id: contactsData[1].id,   // Priya Sharma
        relationship_type: 'ACCOUNT_HAS_CONTACT',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.REL.ACCOUNT_CONTACT.PRIMARY.v1'
      },
      {
        from_entity_id: accountsData[2].id, // Wipro
        to_entity_id: contactsData[2].id,   // Vikram Singh
        relationship_type: 'ACCOUNT_HAS_CONTACT',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.REL.ACCOUNT_CONTACT.PRIMARY.v1'
      },
      {
        from_entity_id: accountsData[3].id, // HCL
        to_entity_id: contactsData[3].id,   // Anjali Gupta
        relationship_type: 'ACCOUNT_HAS_CONTACT',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.REL.ACCOUNT_CONTACT.PRIMARY.v1'
      }
    ];

    const { error: relationshipsError } = await supabase
      .from('core_relationships')
      .insert(relationships);

    if (relationshipsError) throw relationshipsError;
    console.log(`✅ Created account-contact relationships`);

    // 6. Create Opportunities
    console.log('\n💼 Creating opportunities...');
    const opportunities = [
      {
        entity_type: 'opportunity',
        entity_name: 'Enterprise Broadband - Infosys',
        entity_code: 'OPP-INFOSYS-001',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.OPPORTUNITY.NEGOTIATION.ACTIVE.v1',
        metadata: {
          stage: 'Negotiation',
          amount: 8500000,
          probability: 80,
          close_date: '2024-06-30',
          description: 'Large enterprise broadband deployment across 5 locations',
          next_step: 'Final pricing approval'
        }
      },
      {
        entity_type: 'opportunity',
        entity_name: 'Cloud Connect - TCS',
        entity_code: 'OPP-TCS-001',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.OPPORTUNITY.PROPOSAL.ACTIVE.v1',
        metadata: {
          stage: 'Proposal',
          amount: 6200000,
          probability: 60,
          close_date: '2024-07-15',
          description: 'Direct cloud connectivity for their data centers',
          next_step: 'Technical review meeting'
        }
      },
      {
        entity_type: 'opportunity',
        entity_name: 'SD-WAN Solution - Wipro',
        entity_code: 'OPP-WIPRO-001',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.OPPORTUNITY.QUALIFICATION.ACTIVE.v1',
        metadata: {
          stage: 'Qualification',
          amount: 5400000,
          probability: 40,
          close_date: '2024-07-31',
          description: 'Complete SD-WAN transformation project',
          next_step: 'Requirements gathering'
        }
      },
      {
        entity_type: 'opportunity',
        entity_name: 'Managed Services - HCL',
        entity_code: 'OPP-HCL-001',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.OPPORTUNITY.NEGOTIATION.ACTIVE.v1',
        metadata: {
          stage: 'Negotiation',
          amount: 4800000,
          probability: 75,
          close_date: '2024-06-25',
          description: '24x7 managed network services',
          next_step: 'Contract finalization'
        }
      }
    ];

    const { data: opportunitiesData, error: opportunitiesError } = await supabase
      .from('core_entities')
      .insert(opportunities)
      .select();

    if (opportunitiesError) throw opportunitiesError;
    console.log(`✅ Created ${opportunitiesData.length} opportunities`);

    // 7. Create Opportunity Relationships
    console.log('\n🔗 Creating opportunity relationships...');
    const oppRelationships = [
      {
        from_entity_id: accountsData[0].id, // Infosys
        to_entity_id: opportunitiesData[0].id,
        relationship_type: 'ACCOUNT_HAS_OPPORTUNITY',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.REL.ACCOUNT_OPPORTUNITY.ACTIVE.v1'
      },
      {
        from_entity_id: opportunitiesData[0].id,
        to_entity_id: contactsData[0].id, // Rajesh Kumar
        relationship_type: 'OPPORTUNITY_CONTACT',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.REL.OPPORTUNITY_CONTACT.PRIMARY.v1'
      },
      {
        from_entity_id: accountsData[1].id, // TCS
        to_entity_id: opportunitiesData[1].id,
        relationship_type: 'ACCOUNT_HAS_OPPORTUNITY',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.REL.ACCOUNT_OPPORTUNITY.ACTIVE.v1'
      },
      {
        from_entity_id: opportunitiesData[1].id,
        to_entity_id: contactsData[1].id, // Priya Sharma
        relationship_type: 'OPPORTUNITY_CONTACT',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.REL.OPPORTUNITY_CONTACT.PRIMARY.v1'
      }
    ];

    const { error: oppRelError } = await supabase
      .from('core_relationships')
      .insert(oppRelationships);

    if (oppRelError) throw oppRelError;
    console.log(`✅ Created opportunity relationships`);

    // 8. Create Leads
    console.log('\n🎯 Creating leads...');
    const leads = [
      {
        entity_type: 'lead',
        entity_name: 'Accenture India',
        entity_code: 'LEAD-ACCENTURE-001',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.LEAD.QUALIFIED.ACTIVE.v1',
        metadata: {
          source: 'Website',
          status: 'qualified',
          company: 'Accenture',
          title: 'Infrastructure Modernization',
          budget: 12000000,
          timeline: 'Q3 2024'
        }
      },
      {
        entity_type: 'lead',
        entity_name: 'Capgemini Chennai',
        entity_code: 'LEAD-CAPGEMINI-001',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.LEAD.NEW.ACTIVE.v1',
        metadata: {
          source: 'Trade Show',
          status: 'new',
          company: 'Capgemini',
          title: 'Network Upgrade',
          budget: 8000000,
          timeline: 'Q4 2024'
        }
      },
      {
        entity_type: 'lead',
        entity_name: 'IBM India Private Limited',
        entity_code: 'LEAD-IBM-001',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.LEAD.QUALIFIED.ACTIVE.v1',
        metadata: {
          source: 'Partner Referral',
          status: 'qualified',
          company: 'IBM',
          title: 'Cloud Migration Services',
          budget: 15000000,
          timeline: 'Q2 2024'
        }
      }
    ];

    const { data: leadsData, error: leadsError } = await supabase
      .from('core_entities')
      .insert(leads)
      .select();

    if (leadsError) throw leadsError;
    console.log(`✅ Created ${leadsData.length} leads`);

    // 9. Create Campaigns
    console.log('\n📢 Creating campaigns...');
    const campaigns = [
      {
        entity_type: 'campaign',
        entity_name: 'Summer Enterprise Promotion 2024',
        entity_code: 'CAMP-SUMMER-2024',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CAMPAIGN.EMAIL.ACTIVE.v1',
        metadata: {
          type: 'Email',
          status: 'Active',
          start_date: '2024-06-01',
          end_date: '2024-08-31',
          budget: 500000,
          expected_revenue: 25000000,
          target_audience: 'Enterprise IT Decision Makers'
        }
      },
      {
        entity_type: 'campaign',
        entity_name: 'Cloud Connect Webinar Series',
        entity_code: 'CAMP-WEBINAR-2024',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CAMPAIGN.WEBINAR.ACTIVE.v1',
        metadata: {
          type: 'Webinar',
          status: 'Active',
          start_date: '2024-05-15',
          end_date: '2024-07-15',
          budget: 200000,
          expected_revenue: 10000000,
          target_audience: 'CTOs and IT Directors'
        }
      }
    ];

    const { data: campaignsData, error: campaignsError } = await supabase
      .from('core_entities')
      .insert(campaigns)
      .select();

    if (campaignsError) throw campaignsError;
    console.log(`✅ Created ${campaignsData.length} campaigns`);

    // 10. Create Cases
    console.log('\n🎫 Creating support cases...');
    const cases = [
      {
        entity_type: 'case',
        entity_name: 'Network Outage - Infosys Bangalore',
        entity_code: 'CASE-INF-001',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CASE.TECHNICAL.HIGH.v1',
        metadata: {
          type: 'Technical',
          priority: 'High',
          status: 'Open',
          description: 'Complete network outage at Bangalore campus',
          sla: '4 hours',
          opened_date: '2024-06-15 10:30:00'
        }
      },
      {
        entity_type: 'case',
        entity_name: 'Billing Inquiry - TCS Mumbai',
        entity_code: 'CASE-TCS-001',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CASE.BILLING.MEDIUM.v1',
        metadata: {
          type: 'Billing',
          priority: 'Medium',
          status: 'In Progress',
          description: 'Discrepancy in last month invoice',
          sla: '24 hours',
          opened_date: '2024-06-14 14:20:00'
        }
      },
      {
        entity_type: 'case',
        entity_name: 'Service Request - Wipro Chennai',
        entity_code: 'CASE-WIP-001',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.CASE.SERVICE.LOW.v1',
        metadata: {
          type: 'Service Request',
          priority: 'Low',
          status: 'Resolved',
          description: 'Request for bandwidth upgrade',
          sla: '72 hours',
          opened_date: '2024-06-10 09:15:00',
          resolved_date: '2024-06-12 16:45:00'
        }
      }
    ];

    const { data: casesData, error: casesError } = await supabase
      .from('core_entities')
      .insert(cases)
      .select();

    if (casesError) throw casesError;
    console.log(`✅ Created ${casesData.length} cases`);

    // 11. Create Case Relationships
    console.log('\n🔗 Creating case relationships...');
    const caseRelationships = [
      {
        from_entity_id: casesData[0].id,
        to_entity_id: accountsData[0].id, // Infosys
        relationship_type: 'CASE_FOR_ACCOUNT',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.REL.CASE_ACCOUNT.ACTIVE.v1'
      },
      {
        from_entity_id: casesData[0].id,
        to_entity_id: contactsData[0].id, // Rajesh Kumar
        relationship_type: 'CASE_FOR_CONTACT',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.REL.CASE_CONTACT.PRIMARY.v1'
      },
      {
        from_entity_id: casesData[1].id,
        to_entity_id: accountsData[1].id, // TCS
        relationship_type: 'CASE_FOR_ACCOUNT',
        organization_id: KERALA_VISION_ORG_ID,
        smart_code: 'HERA.CRM.REL.CASE_ACCOUNT.ACTIVE.v1'
      }
    ];

    const { error: caseRelError } = await supabase
      .from('core_relationships')
      .insert(caseRelationships);

    if (caseRelError) throw caseRelError;
    console.log(`✅ Created case relationships`);

    // 12. Create Activities (Transactions)
    console.log('\n📅 Creating activities...');
    const activities = [
      {
        transaction_type: 'crm_activity',
        transaction_code: 'ACT-CALL-001',
        total_amount: 0,
        organization_id: KERALA_VISION_ORG_ID,
        source_entity_id: contactsData[0].id, // Rajesh Kumar
        target_entity_id: opportunitiesData[0].id, // Infosys opportunity
        smart_code: 'HERA.CRM.ACTIVITY.CALL.COMPLETED.v1',
        business_context: {
          activity_type: 'call',
          title: 'Follow-up call with Infosys',
          duration_minutes: 45,
          outcome: 'Positive - moving to final approval',
          next_action: 'Send revised proposal'
        }
      },
      {
        transaction_type: 'crm_activity',
        transaction_code: 'ACT-EMAIL-001',
        total_amount: 0,
        organization_id: KERALA_VISION_ORG_ID,
        source_entity_id: contactsData[1].id, // Priya Sharma
        target_entity_id: opportunitiesData[1].id, // TCS opportunity
        smart_code: 'HERA.CRM.ACTIVITY.EMAIL.SENT.v1',
        business_context: {
          activity_type: 'email',
          title: 'Proposal sent to TCS',
          subject: 'Cloud Connect Proposal - Kerala Vision',
          attachments: ['proposal.pdf', 'pricing.xlsx']
        }
      },
      {
        transaction_type: 'crm_activity',
        transaction_code: 'ACT-MEETING-001',
        total_amount: 0,
        organization_id: KERALA_VISION_ORG_ID,
        source_entity_id: contactsData[2].id, // Vikram Singh
        target_entity_id: opportunitiesData[2].id, // Wipro opportunity
        smart_code: 'HERA.CRM.ACTIVITY.MEETING.SCHEDULED.v1',
        business_context: {
          activity_type: 'meeting',
          title: 'Demo meeting with Wipro',
          scheduled_date: '2024-06-20 14:00:00',
          location: 'Wipro Office, Bangalore',
          attendees: ['Vikram Singh', 'Sales Team', 'Technical Team']
        }
      }
    ];

    const { data: activitiesData, error: activitiesError } = await supabase
      .from('universal_transactions')
      .insert(activities)
      .select();

    if (activitiesError) throw activitiesError;
    console.log(`✅ Created ${activitiesData.length} activities`);

    console.log('\n✨ CRM data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Accounts: ${accountsData.length}`);
    console.log(`   - Contacts: ${contactsData.length}`);
    console.log(`   - Opportunities: ${opportunitiesData.length}`);
    console.log(`   - Leads: ${leadsData.length}`);
    console.log(`   - Campaigns: ${campaignsData.length}`);
    console.log(`   - Cases: ${casesData.length}`);
    console.log(`   - Activities: ${activitiesData.length}`);

  } catch (error) {
    console.error('❌ Error seeding CRM data:', error);
    process.exit(1);
  }
}

// Run the seeding
seedCRMData();