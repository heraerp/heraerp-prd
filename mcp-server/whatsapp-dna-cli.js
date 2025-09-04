#!/usr/bin/env node

// ================================================================================
// HERA UNIVERSAL WHATSAPP DNA CLI TOOL
// Command-line interface for WhatsApp Business Integration & Automation
// Smart Code: HERA.WHATSAPP.DNA.CLI.v1
// MCP-Enabled for direct integration with salon-manager and other MCP tools
// ================================================================================

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Command-line arguments
const command = process.argv[2];
const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

// Hair Talkz organizations for testing
const HAIR_TALKZ_ORGS = [
  {
    id: "e3a9ff9e-bb83-43a8-b062-b85e7a2b4258",
    code: "SALON-BR1",
    name: "Hair Talkz • Park Regis Kris Kin (Karama)",
    whatsapp_number: "+971501234567"
  },
  {
    id: "0b1b37cd-4096-4718-8cd4-e370f234005b", 
    code: "SALON-BR2",
    name: "Hair Talkz • Mercure Gold (Al Mina Rd)",
    whatsapp_number: "+971501234568"
  },
  {
    id: "849b6efe-2bf0-438f-9c70-01835ac2fe15",
    code: "SALON-GROUP", 
    name: "Salon Group",
    whatsapp_number: "+971501234569"
  }
];

// ================================================================================
// WHATSAPP DNA CONFIGURATION
// ================================================================================

const WHATSAPP_DNA_CONFIG = {
  // Universal DNA Component Definition
  component_id: 'HERA.WHATSAPP.BUSINESS.ENGINE.v1',
  component_name: 'Universal WhatsApp Business Integration Engine',
  version: '1.0.0',
  
  // Core capabilities
  capabilities: [
    'Interactive Booking Flows',
    'Automated Customer Lifecycle',
    'Catalog & Product Showcase',
    'Payment Integration',
    'Waitlist Management',
    'Smart Template Messaging',
    'Lead Generation & Conversion',
    'Customer Service Automation',
    'Analytics & Performance Tracking',
    'MCP Integration for AI-Powered Conversations'
  ],
  
  // WhatsApp message types
  message_types: {
    text: {
      name: 'Text Message',
      description: 'Simple text messages',
      use_case: 'General communication, confirmations'
    },
    interactive: {
      name: 'Interactive Message',
      description: 'Buttons and lists for user selection',
      use_case: 'Booking flows, service selection'
    },
    template: {
      name: 'Template Message',
      description: 'Pre-approved templates for marketing/utility',
      use_case: 'Reminders, promotions, notifications'
    },
    media: {
      name: 'Media Message',
      description: 'Images, videos, documents',
      use_case: 'Before/after photos, care guides'
    },
    location: {
      name: 'Location Message',
      description: 'Share location coordinates',
      use_case: 'Salon location, directions'
    },
    contacts: {
      name: 'Contact Message',
      description: 'Share contact information',
      use_case: 'Stylist contact, emergency contact'
    }
  },
  
  // Template categories
  template_categories: {
    marketing: {
      name: 'Marketing Templates',
      description: 'Promotional messages (24h+ window)',
      examples: ['service_promotion', 'seasonal_offer', 'referral_program']
    },
    utility: {
      name: 'Utility Templates',
      description: 'Transactional updates',
      examples: ['appointment_reminder', 'booking_confirmation', 'payment_receipt']
    },
    authentication: {
      name: 'Authentication Templates',
      description: 'OTP and verification codes',
      examples: ['login_otp', 'booking_verification']
    }
  },
  
  // Customer journey flows
  customer_flows: {
    booking: {
      name: '60-Second Booking Flow',
      steps: [
        'Service Selection (List)',
        'Stylist Selection (Buttons)',
        'Date/Time Selection (Flow)',
        'Customer Details (Flow)',
        'Confirmation & Payment',
        'Receipt & Calendar'
      ],
      smart_code: 'HERA.WHATSAPP.FLOW.BOOKING.FAST.v1'
    },
    upsell: {
      name: 'Pre-Visit Upsell',
      steps: [
        'T-24h Reminder',
        'Add-on Suggestions',
        'Quick Selection',
        'Price Update',
        'Confirmation'
      ],
      smart_code: 'HERA.WHATSAPP.FLOW.UPSELL.PREVISI.v1'
    },
    rebook: {
      name: 'Post-Visit Rebook',
      steps: [
        'Service Feedback',
        'Care Tips & Receipt',
        'Rebook Suggestion',
        'Loyalty Points',
        'Referral Offer'
      ],
      smart_code: 'HERA.WHATSAPP.FLOW.REBOOK.POSTVISI.v1'
    },
    winback: {
      name: 'Customer Win-Back',
      steps: [
        'Identify Inactive Customers',
        'Personalized Offer',
        'Limited Time Incentive',
        'Easy Booking',
        'Welcome Back Experience'
      ],
      smart_code: 'HERA.WHATSAPP.FLOW.WINBACK.INACTIVE.v1'
    }
  },
  
  // Industry-specific configurations
  industry_configs: {
    salon: {
      name: 'Salon & Beauty',
      services: ['haircut', 'color', 'treatment', 'styling', 'makeup'],
      booking_window: 60, // days
      reminder_times: [24, 2], // hours before appointment
      upsell_window: 24, // hours before appointment
      rebook_window: 42, // days after appointment
      templates: {
        booking_confirmation: 'appointment_confirmed_salon',
        reminder: 'appointment_reminder_salon',
        upsell: 'service_addon_salon',
        receipt: 'service_receipt_salon'
      }
    },
    restaurant: {
      name: 'Restaurant & Dining',
      services: ['reservation', 'takeaway', 'delivery', 'catering'],
      booking_window: 30,
      reminder_times: [4, 1],
      templates: {
        reservation_confirmed: 'table_booking_confirmed',
        order_ready: 'order_ready_pickup'
      }
    }
  }
};

// ================================================================================
// CORE WHATSAPP FUNCTIONS
// ================================================================================

/**
 * Get WhatsApp Conversation Analytics
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Conversation analytics and performance metrics
 */
async function getWhatsAppAnalytics(organizationId, options = {}) {
  try {
    const { 
      startDate = new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate = new Date(),
      phoneNumber = null
    } = options;

    // Get WhatsApp conversations (stored as transactions)
    let query = supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(*)
      `)
      .eq('organization_id', organizationId)
      .in('transaction_type', ['whatsapp_conversation', 'whatsapp_message'])
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (phoneNumber) {
      query = query.eq('metadata->>phone_number', phoneNumber);
    }

    const { data: conversations, error } = await query;
    if (error) throw error;

    // Process analytics
    const analytics = {
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      },
      summary: {
        total_conversations: 0,
        total_messages: 0,
        inbound_messages: 0,
        outbound_messages: 0,
        template_messages: 0,
        interactive_messages: 0,
        unique_customers: new Set(),
        conversion_rate: 0,
        response_rate: 0
      },
      conversation_types: {
        booking: 0,
        customer_service: 0,
        marketing: 0,
        support: 0
      },
      performance: {
        avg_response_time_minutes: 0,
        first_response_time_minutes: 0,
        resolution_rate: 0,
        customer_satisfaction: 0
      },
      conversions: {
        bookings_made: 0,
        products_sold: 0,
        total_revenue: 0,
        avg_order_value: 0
      },
      flows: {},
      templates: {}
    };

    // Process conversations and messages
    conversations?.forEach(conv => {
      if (conv.transaction_type === 'whatsapp_conversation') {
        analytics.summary.total_conversations++;
        const customerId = conv.from_entity_id;
        if (customerId) {
          analytics.summary.unique_customers.add(customerId);
        }
        
        const convType = conv.metadata?.conversation_type || 'customer_service';
        analytics.conversation_types[convType] = (analytics.conversation_types[convType] || 0) + 1;
        
        // Track conversions
        if (conv.metadata?.resulted_in_booking) {
          analytics.conversions.bookings_made++;
        }
        
        if (conv.metadata?.revenue_generated) {
          analytics.conversions.total_revenue += parseFloat(conv.metadata.revenue_generated);
        }
      }
      
      // Process message lines
      conv.universal_transaction_lines?.forEach(line => {
        analytics.summary.total_messages++;
        
        const messageType = line.metadata?.message_type;
        const direction = line.metadata?.direction; // inbound/outbound
        
        if (direction === 'inbound') {
          analytics.summary.inbound_messages++;
        } else if (direction === 'outbound') {
          analytics.summary.outbound_messages++;
        }
        
        if (messageType === 'template') {
          analytics.summary.template_messages++;
          const templateName = line.metadata?.template_name;
          if (templateName) {
            analytics.templates[templateName] = (analytics.templates[templateName] || 0) + 1;
          }
        } else if (messageType === 'interactive') {
          analytics.summary.interactive_messages++;
        }
        
        // Track flow performance
        const flowId = line.metadata?.flow_id;
        if (flowId) {
          if (!analytics.flows[flowId]) {
            analytics.flows[flowId] = {
              flow_name: line.metadata?.flow_name || flowId,
              starts: 0,
              completions: 0,
              conversion_rate: 0
            };
          }
          
          if (line.metadata?.flow_step === 'start') {
            analytics.flows[flowId].starts++;
          } else if (line.metadata?.flow_step === 'complete') {
            analytics.flows[flowId].completions++;
          }
        }
      });
    });

    // Calculate metrics
    analytics.summary.unique_customers = analytics.summary.unique_customers.size;
    
    if (analytics.summary.total_conversations > 0) {
      analytics.summary.conversion_rate = (analytics.conversions.bookings_made / analytics.summary.total_conversations) * 100;
    }
    
    if (analytics.summary.inbound_messages > 0) {
      analytics.summary.response_rate = (analytics.summary.outbound_messages / analytics.summary.inbound_messages) * 100;
    }
    
    if (analytics.conversions.bookings_made > 0) {
      analytics.conversions.avg_order_value = analytics.conversions.total_revenue / analytics.conversions.bookings_made;
    }
    
    // Calculate flow conversion rates
    Object.values(analytics.flows).forEach(flow => {
      if (flow.starts > 0) {
        flow.conversion_rate = (flow.completions / flow.starts) * 100;
      }
    });

    // Generate insights
    const insights = generateWhatsAppInsights(analytics);

    return {
      success: true,
      component: 'HERA.WHATSAPP.ANALYTICS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: analytics,
      insights
    };

  } catch (error) {
    console.error('Error in getWhatsAppAnalytics:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.WHATSAPP.ANALYTICS.v1'
    };
  }
}

/**
 * Get Active WhatsApp Campaigns
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Campaign performance and status
 */
async function getWhatsAppCampaigns(organizationId, options = {}) {
  try {
    const {
      status = 'all', // active, completed, scheduled
      campaignType = 'all' // marketing, utility, booking
    } = options;

    // Get campaign data (stored as entities with campaign type)
    let query = supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*),
        core_relationships!from_entity_id(*)
      `)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'whatsapp_campaign');

    const { data: campaigns, error } = await query;
    if (error) throw error;

    // Get campaign messages and responses
    const campaignData = [];

    for (const campaign of campaigns || []) {
      const dynamicData = campaign.core_dynamic_data || [];
      
      const campaignInfo = {
        campaign_id: campaign.id,
        campaign_name: campaign.entity_name,
        campaign_code: campaign.entity_code,
        campaign_type: getDynamicValue(dynamicData, 'campaign_type', 'text') || 'marketing',
        status: getDynamicValue(dynamicData, 'status', 'text') || 'draft',
        template_name: getDynamicValue(dynamicData, 'template_name', 'text'),
        target_audience: getDynamicValue(dynamicData, 'target_audience', 'text'),
        scheduled_date: getDynamicValue(dynamicData, 'scheduled_date', 'date'),
        sent_count: getDynamicValue(dynamicData, 'sent_count', 'number') || 0,
        delivered_count: getDynamicValue(dynamicData, 'delivered_count', 'number') || 0,
        read_count: getDynamicValue(dynamicData, 'read_count', 'number') || 0,
        replied_count: getDynamicValue(dynamicData, 'replied_count', 'number') || 0,
        conversion_count: getDynamicValue(dynamicData, 'conversion_count', 'number') || 0,
        revenue_generated: getDynamicValue(dynamicData, 'revenue_generated', 'number') || 0
      };

      // Calculate performance metrics
      campaignInfo.delivery_rate = campaignInfo.sent_count > 0 
        ? (campaignInfo.delivered_count / campaignInfo.sent_count) * 100 
        : 0;
      campaignInfo.read_rate = campaignInfo.delivered_count > 0 
        ? (campaignInfo.read_count / campaignInfo.delivered_count) * 100 
        : 0;
      campaignInfo.response_rate = campaignInfo.delivered_count > 0 
        ? (campaignInfo.replied_count / campaignInfo.delivered_count) * 100 
        : 0;
      campaignInfo.conversion_rate = campaignInfo.delivered_count > 0 
        ? (campaignInfo.conversion_count / campaignInfo.delivered_count) * 100 
        : 0;
      campaignInfo.roas = campaignInfo.conversion_count > 0 
        ? campaignInfo.revenue_generated / (campaignInfo.conversion_count * 10) // Assume $10 cost per conversion
        : 0;

      campaignData.push(campaignInfo);
    }

    // Filter by status and type
    const filteredCampaigns = campaignData.filter(campaign => {
      if (status !== 'all' && campaign.status !== status) return false;
      if (campaignType !== 'all' && campaign.campaign_type !== campaignType) return false;
      return true;
    });

    // Calculate summary metrics
    const summary = {
      total_campaigns: filteredCampaigns.length,
      active_campaigns: filteredCampaigns.filter(c => c.status === 'active').length,
      total_sent: filteredCampaigns.reduce((sum, c) => sum + c.sent_count, 0),
      total_delivered: filteredCampaigns.reduce((sum, c) => sum + c.delivered_count, 0),
      total_conversions: filteredCampaigns.reduce((sum, c) => sum + c.conversion_count, 0),
      total_revenue: filteredCampaigns.reduce((sum, c) => sum + c.revenue_generated, 0),
      avg_delivery_rate: 0,
      avg_conversion_rate: 0,
      avg_roas: 0
    };

    if (filteredCampaigns.length > 0) {
      summary.avg_delivery_rate = filteredCampaigns.reduce((sum, c) => sum + c.delivery_rate, 0) / filteredCampaigns.length;
      summary.avg_conversion_rate = filteredCampaigns.reduce((sum, c) => sum + c.conversion_rate, 0) / filteredCampaigns.length;
      summary.avg_roas = filteredCampaigns.reduce((sum, c) => sum + c.roas, 0) / filteredCampaigns.length;
    }

    // Generate insights
    const insights = generateCampaignInsights(filteredCampaigns, summary);

    return {
      success: true,
      component: 'HERA.WHATSAPP.CAMPAIGNS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        campaigns: filteredCampaigns.sort((a, b) => new Date(b.scheduled_date || b.created_at) - new Date(a.scheduled_date || a.created_at)),
        summary
      },
      insights
    };

  } catch (error) {
    console.error('Error in getWhatsAppCampaigns:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.WHATSAPP.CAMPAIGNS.v1'
    };
  }
}

/**
 * Get Customer Journey Analytics
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Customer journey and touchpoint analysis
 */
async function getCustomerJourneyAnalytics(organizationId, options = {}) {
  try {
    const {
      customerId = null,
      journeyType = 'all', // booking, rebook, winback
      timeframe = 30
    } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    // Get customer interactions
    let query = supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(*),
        core_entities!from_entity_id(
          id,
          entity_name,
          entity_code
        )
      `)
      .eq('organization_id', organizationId)
      .gte('transaction_date', startDate.toISOString());

    if (customerId) {
      query = query.eq('from_entity_id', customerId);
    }

    const { data: interactions, error } = await query;
    if (error) throw error;

    // Analyze customer journeys
    const customerJourneys = {};
    
    interactions?.forEach(interaction => {
      const custId = interaction.from_entity_id;
      const custName = interaction.core_entities?.entity_name || 'Unknown Customer';
      
      if (!customerJourneys[custId]) {
        customerJourneys[custId] = {
          customer_id: custId,
          customer_name: custName,
          journey_start: interaction.transaction_date,
          journey_end: interaction.transaction_date,
          touchpoints: [],
          total_interactions: 0,
          whatsapp_interactions: 0,
          bookings_made: 0,
          revenue_generated: 0,
          journey_stage: 'awareness',
          conversion_time: null,
          last_interaction: null
        };
      }

      const journey = customerJourneys[custId];
      journey.total_interactions++;
      
      if (interaction.transaction_type.includes('whatsapp')) {
        journey.whatsapp_interactions++;
      }
      
      if (interaction.transaction_type === 'appointment' || interaction.transaction_type === 'booking') {
        journey.bookings_made++;
        journey.revenue_generated += parseFloat(interaction.total_amount || 0);
        journey.journey_stage = 'conversion';
        
        if (!journey.conversion_time) {
          journey.conversion_time = Math.ceil((new Date(interaction.transaction_date) - new Date(journey.journey_start)) / (1000 * 60 * 60 * 24));
        }
      }
      
      // Track touchpoint
      const touchpoint = {
        date: interaction.transaction_date,
        type: interaction.transaction_type,
        channel: interaction.metadata?.channel || 'whatsapp',
        action: interaction.metadata?.action || 'message',
        outcome: interaction.metadata?.outcome || 'pending'
      };
      
      journey.touchpoints.push(touchpoint);
      journey.journey_end = interaction.transaction_date;
      journey.last_interaction = interaction.transaction_date;
    });

    // Calculate journey metrics
    const journeyMetrics = {
      total_customers: Object.keys(customerJourneys).length,
      avg_touchpoints: 0,
      avg_conversion_time: 0,
      conversion_rate: 0,
      whatsapp_engagement_rate: 0,
      journey_stages: {
        awareness: 0,
        consideration: 0,
        conversion: 0,
        retention: 0
      },
      top_touchpoints: {},
      drop_off_points: {}
    };

    const journeyList = Object.values(customerJourneys);
    
    if (journeyList.length > 0) {
      journeyMetrics.avg_touchpoints = journeyList.reduce((sum, j) => sum + j.touchpoints.length, 0) / journeyList.length;
      
      const conversions = journeyList.filter(j => j.bookings_made > 0);
      if (conversions.length > 0) {
        journeyMetrics.avg_conversion_time = conversions.reduce((sum, j) => sum + (j.conversion_time || 0), 0) / conversions.length;
        journeyMetrics.conversion_rate = (conversions.length / journeyList.length) * 100;
      }
      
      journeyMetrics.whatsapp_engagement_rate = journeyList.reduce((sum, j) => sum + (j.whatsapp_interactions / j.total_interactions), 0) / journeyList.length * 100;
      
      // Count journey stages
      journeyList.forEach(journey => {
        journeyMetrics.journey_stages[journey.journey_stage]++;
      });
    }

    // Identify common touchpoint sequences
    const touchpointSequences = {};
    journeyList.forEach(journey => {
      const sequence = journey.touchpoints.map(t => t.type).join(' → ');
      touchpointSequences[sequence] = (touchpointSequences[sequence] || 0) + 1;
    });

    // Generate insights
    const insights = generateJourneyInsights(journeyMetrics, touchpointSequences);

    return {
      success: true,
      component: 'HERA.WHATSAPP.CUSTOMER.JOURNEY.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        metrics: journeyMetrics,
        customer_journeys: journeyList.slice(0, 20), // Top 20 for display
        touchpoint_sequences: touchpointSequences,
        common_paths: Object.entries(touchpointSequences)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([path, count]) => ({ path, count }))
      },
      insights
    };

  } catch (error) {
    console.error('Error in getCustomerJourneyAnalytics:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.WHATSAPP.CUSTOMER.JOURNEY.v1'
    };
  }
}

/**
 * Get Template Performance Analysis
 * @param {string} organizationId 
 * @param {object} options 
 * @returns {object} Template usage and performance metrics
 */
async function getTemplatePerformance(organizationId, options = {}) {
  try {
    const {
      templateId = null,
      category = 'all', // marketing, utility, authentication
      timeframe = 30
    } = options;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeframe);

    // Get template messages
    const { data: templateMessages, error } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(*)
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'whatsapp_template')
      .gte('transaction_date', startDate.toISOString());

    if (error) throw error;

    // Analyze template performance
    const templateStats = {};
    
    templateMessages?.forEach(msg => {
      const templateName = msg.metadata?.template_name || 'unknown';
      const templateCategory = msg.metadata?.template_category || 'utility';
      
      if (!templateStats[templateName]) {
        templateStats[templateName] = {
          template_name: templateName,
          template_id: msg.metadata?.template_id,
          category: templateCategory,
          sent_count: 0,
          delivered_count: 0,
          read_count: 0,
          replied_count: 0,
          clicked_count: 0,
          conversion_count: 0,
          cost: 0,
          revenue: 0,
          first_used: msg.transaction_date,
          last_used: msg.transaction_date
        };
      }

      const template = templateStats[templateName];
      template.sent_count++;
      
      if (new Date(msg.transaction_date) < new Date(template.first_used)) {
        template.first_used = msg.transaction_date;
      }
      if (new Date(msg.transaction_date) > new Date(template.last_used)) {
        template.last_used = msg.transaction_date;
      }

      // Process message lines for detailed metrics
      msg.universal_transaction_lines?.forEach(line => {
        const status = line.metadata?.delivery_status;
        const action = line.metadata?.user_action;
        
        if (status === 'delivered') template.delivered_count++;
        if (status === 'read') template.read_count++;
        if (action === 'replied') template.replied_count++;
        if (action === 'clicked') template.clicked_count++;
        if (action === 'converted') {
          template.conversion_count++;
          template.revenue += parseFloat(line.metadata?.conversion_value || 0);
        }
        
        template.cost += parseFloat(line.metadata?.message_cost || 0.05); // Estimate
      });
    });

    // Calculate performance metrics for each template
    Object.values(templateStats).forEach(template => {
      template.delivery_rate = template.sent_count > 0 
        ? (template.delivered_count / template.sent_count) * 100 
        : 0;
      template.read_rate = template.delivered_count > 0 
        ? (template.read_count / template.delivered_count) * 100 
        : 0;
      template.response_rate = template.delivered_count > 0 
        ? (template.replied_count / template.delivered_count) * 100 
        : 0;
      template.click_rate = template.delivered_count > 0 
        ? (template.clicked_count / template.delivered_count) * 100 
        : 0;
      template.conversion_rate = template.delivered_count > 0 
        ? (template.conversion_count / template.delivered_count) * 100 
        : 0;
      template.roas = template.cost > 0 
        ? template.revenue / template.cost 
        : 0;
    });

    // Filter templates
    const filteredTemplates = Object.values(templateStats).filter(template => {
      if (category !== 'all' && template.category !== category) return false;
      if (templateId && template.template_id !== templateId) return false;
      return true;
    });

    // Calculate summary
    const summary = {
      total_templates: filteredTemplates.length,
      total_sent: filteredTemplates.reduce((sum, t) => sum + t.sent_count, 0),
      total_delivered: filteredTemplates.reduce((sum, t) => sum + t.delivered_count, 0),
      total_conversions: filteredTemplates.reduce((sum, t) => sum + t.conversion_count, 0),
      total_revenue: filteredTemplates.reduce((sum, t) => sum + t.revenue, 0),
      total_cost: filteredTemplates.reduce((sum, t) => sum + t.cost, 0),
      avg_delivery_rate: 0,
      avg_conversion_rate: 0,
      avg_roas: 0,
      best_performer: null,
      worst_performer: null
    };

    if (filteredTemplates.length > 0) {
      summary.avg_delivery_rate = filteredTemplates.reduce((sum, t) => sum + t.delivery_rate, 0) / filteredTemplates.length;
      summary.avg_conversion_rate = filteredTemplates.reduce((sum, t) => sum + t.conversion_rate, 0) / filteredTemplates.length;
      summary.avg_roas = summary.total_cost > 0 ? summary.total_revenue / summary.total_cost : 0;
      
      summary.best_performer = filteredTemplates.reduce((best, current) => 
        current.conversion_rate > best.conversion_rate ? current : best
      );
      
      summary.worst_performer = filteredTemplates.reduce((worst, current) => 
        current.conversion_rate < worst.conversion_rate ? current : worst
      );
    }

    // Generate insights
    const insights = generateTemplateInsights(filteredTemplates, summary);

    return {
      success: true,
      component: 'HERA.WHATSAPP.TEMPLATE.PERFORMANCE.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        templates: filteredTemplates.sort((a, b) => b.conversion_rate - a.conversion_rate),
        summary,
        by_category: groupTemplatesByCategory(filteredTemplates)
      },
      insights
    };

  } catch (error) {
    console.error('Error in getTemplatePerformance:', error);
    return {
      success: false,
      error: error.message,
      component: 'HERA.WHATSAPP.TEMPLATE.PERFORMANCE.v1'
    };
  }
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

function getDynamicValue(dynamicData, fieldName, dataType) {
  const field = dynamicData.find(d => d.field_name === fieldName);
  if (!field) return null;
  
  switch(dataType) {
    case 'text':
      return field.field_value_text;
    case 'number':
      return parseFloat(field.field_value_number || 0);
    case 'date':
      return field.field_value_date;
    case 'json':
      return field.field_value_json;
    default:
      return field.field_value_text;
  }
}

function generateWhatsAppInsights(analytics) {
  const insights = [];
  
  // Conversion rate insights
  if (analytics.summary.conversion_rate > 0) {
    if (analytics.summary.conversion_rate > 15) {
      insights.push(`Excellent WhatsApp conversion rate of ${analytics.summary.conversion_rate.toFixed(1)}% - above industry benchmark`);
    } else if (analytics.summary.conversion_rate < 5) {
      insights.push(`Low conversion rate of ${analytics.summary.conversion_rate.toFixed(1)}% - optimize booking flows and templates`);
    }
  }
  
  // Response rate insights
  if (analytics.summary.response_rate > 80) {
    insights.push('High customer response rate indicates strong engagement');
  } else if (analytics.summary.response_rate < 50) {
    insights.push('Low response rate - consider more interactive message types and timing optimization');
  }
  
  // Flow performance
  const bestFlow = Object.values(analytics.flows).sort((a, b) => b.conversion_rate - a.conversion_rate)[0];
  if (bestFlow && bestFlow.conversion_rate > 20) {
    insights.push(`${bestFlow.flow_name} flow performing well with ${bestFlow.conversion_rate.toFixed(1)}% conversion rate`);
  }
  
  // Customer engagement
  if (analytics.summary.unique_customers > 0) {
    const avgMessagesPerCustomer = analytics.summary.total_messages / analytics.summary.unique_customers;
    if (avgMessagesPerCustomer > 5) {
      insights.push(`High customer engagement with ${avgMessagesPerCustomer.toFixed(1)} messages per customer on average`);
    }
  }
  
  return insights;
}

function generateCampaignInsights(campaigns, summary) {
  const insights = [];
  
  if (summary.avg_conversion_rate > 10) {
    insights.push(`Strong campaign performance with ${summary.avg_conversion_rate.toFixed(1)}% average conversion rate`);
  }
  
  if (summary.avg_roas > 3) {
    insights.push(`Excellent ROI with ${summary.avg_roas.toFixed(1)}x return on ad spend`);
  }
  
  const topCampaign = campaigns.sort((a, b) => b.conversion_rate - a.conversion_rate)[0];
  if (topCampaign && topCampaign.conversion_rate > 15) {
    insights.push(`"${topCampaign.campaign_name}" is your best performing campaign with ${topCampaign.conversion_rate.toFixed(1)}% conversion`);
  }
  
  const marketingCampaigns = campaigns.filter(c => c.campaign_type === 'marketing');
  const utilityCampaigns = campaigns.filter(c => c.campaign_type === 'utility');
  
  if (marketingCampaigns.length > 0 && utilityCampaigns.length > 0) {
    const marketingAvg = marketingCampaigns.reduce((sum, c) => sum + c.conversion_rate, 0) / marketingCampaigns.length;
    const utilityAvg = utilityCampaigns.reduce((sum, c) => sum + c.conversion_rate, 0) / utilityCampaigns.length;
    
    if (utilityAvg > marketingAvg) {
      insights.push('Utility messages outperform marketing messages - focus on transactional communications');
    }
  }
  
  return insights;
}

function generateJourneyInsights(metrics, sequences) {
  const insights = [];
  
  if (metrics.avg_conversion_time > 0) {
    insights.push(`Average customer conversion time: ${metrics.avg_conversion_time.toFixed(0)} days`);
  }
  
  if (metrics.whatsapp_engagement_rate > 70) {
    insights.push('WhatsApp is the dominant customer engagement channel');
  }
  
  const conversionStage = metrics.journey_stages.conversion;
  const awarenessStage = metrics.journey_stages.awareness;
  
  if (conversionStage > 0 && awarenessStage > 0) {
    const conversionFunnel = (conversionStage / awarenessStage) * 100;
    insights.push(`Customer conversion funnel efficiency: ${conversionFunnel.toFixed(1)}%`);
  }
  
  const topSequence = Object.entries(sequences).sort((a, b) => b[1] - a[1])[0];
  if (topSequence) {
    insights.push(`Most common customer journey: ${topSequence[0]}`);
  }
  
  return insights;
}

function generateTemplateInsights(templates, summary) {
  const insights = [];
  
  if (summary.best_performer && summary.best_performer.conversion_rate > 15) {
    insights.push(`"${summary.best_performer.template_name}" is your top template with ${summary.best_performer.conversion_rate.toFixed(1)}% conversion`);
  }
  
  if (summary.avg_roas > 2) {
    insights.push(`Templates generating ${summary.avg_roas.toFixed(1)}x return on investment`);
  }
  
  const marketingTemplates = templates.filter(t => t.category === 'marketing');
  const utilityTemplates = templates.filter(t => t.category === 'utility');
  
  if (marketingTemplates.length > 0 && utilityTemplates.length > 0) {
    const marketingAvg = marketingTemplates.reduce((sum, t) => sum + t.conversion_rate, 0) / marketingTemplates.length;
    const utilityAvg = utilityTemplates.reduce((sum, t) => sum + t.conversion_rate, 0) / utilityTemplates.length;
    
    insights.push(`${utilityAvg > marketingAvg ? 'Utility' : 'Marketing'} templates perform better on average`);
  }
  
  const lowPerformers = templates.filter(t => t.conversion_rate < 2 && t.sent_count > 10);
  if (lowPerformers.length > 0) {
    insights.push(`${lowPerformers.length} templates underperforming - consider A/B testing new versions`);
  }
  
  return insights;
}

function groupTemplatesByCategory(templates) {
  const categories = {};
  
  templates.forEach(template => {
    if (!categories[template.category]) {
      categories[template.category] = {
        count: 0,
        total_sent: 0,
        total_conversions: 0,
        total_revenue: 0,
        avg_conversion_rate: 0
      };
    }
    
    const cat = categories[template.category];
    cat.count++;
    cat.total_sent += template.sent_count;
    cat.total_conversions += template.conversion_count;
    cat.total_revenue += template.revenue;
  });
  
  // Calculate averages
  Object.values(categories).forEach(cat => {
    cat.avg_conversion_rate = cat.total_sent > 0 ? (cat.total_conversions / cat.total_sent) * 100 : 0;
  });
  
  return categories;
}

// ================================================================================
// CLI INTERFACE
// ================================================================================

async function main() {
  console.log('🧬 HERA WHATSAPP DNA CLI');
  console.log('=========================\n');

  if (!command) {
    console.log('Available commands:');
    console.log('  analytics [orgId]         - WhatsApp conversation analytics');
    console.log('  campaigns [orgId]         - Campaign performance analysis');
    console.log('  journey [orgId]           - Customer journey analytics');
    console.log('  templates [orgId]         - Template performance analysis');
    console.log('  test                      - Run with Hair Talkz demo data');
    console.log('\nExample: node whatsapp-dna-cli.js analytics');
    process.exit(0);
  }

  const orgId = process.argv[3] || organizationId;

  if (!orgId && command !== 'test') {
    console.error('❌ Organization ID required. Set DEFAULT_ORGANIZATION_ID in .env or pass as argument.');
    process.exit(1);
  }

  try {
    switch(command) {
      case 'analytics':
        console.log('📊 Fetching WhatsApp analytics...\n');
        const analyticsResult = await getWhatsAppAnalytics(orgId);
        console.log(JSON.stringify(analyticsResult, null, 2));
        break;

      case 'campaigns':
        console.log('📢 Analyzing campaign performance...\n');
        const campaignResult = await getWhatsAppCampaigns(orgId);
        console.log(JSON.stringify(campaignResult, null, 2));
        break;

      case 'journey':
        console.log('🗺️ Analyzing customer journeys...\n');
        const journeyResult = await getCustomerJourneyAnalytics(orgId);
        console.log(JSON.stringify(journeyResult, null, 2));
        break;

      case 'templates':
        console.log('📝 Analyzing template performance...\n');
        const templateResult = await getTemplatePerformance(orgId);
        console.log(JSON.stringify(templateResult, null, 2));
        break;

      case 'test':
        console.log('🧪 Running test with Hair Talkz organizations...\n');
        for (const org of HAIR_TALKZ_ORGS) {
          console.log(`\n📊 ${org.name} (${org.whatsapp_number})`);
          console.log('='.repeat(50));
          
          const analytics = await getWhatsAppAnalytics(org.id);
          if (analytics.success) {
            console.log(`WhatsApp Performance:`);
            console.log(`- Conversations: ${analytics.data.summary.total_conversations}`);
            console.log(`- Messages: ${analytics.data.summary.total_messages}`);
            console.log(`- Customers: ${analytics.data.summary.unique_customers}`);
            console.log(`- Conversion Rate: ${analytics.data.summary.conversion_rate.toFixed(1)}%`);
          }
          
          const campaigns = await getWhatsAppCampaigns(org.id);
          if (campaigns.success) {
            console.log(`\nCampaigns:`);
            console.log(`- Active: ${campaigns.data.summary.active_campaigns}`);
            console.log(`- Avg Conversion: ${campaigns.data.summary.avg_conversion_rate.toFixed(1)}%`);
            console.log(`- Total Revenue: ${campaigns.data.summary.total_revenue.toFixed(2)} AED`);
          }
        }
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other modules
module.exports = {
  getWhatsAppAnalytics,
  getWhatsAppCampaigns,
  getCustomerJourneyAnalytics,
  getTemplatePerformance,
  WHATSAPP_DNA_CONFIG
};

// Run CLI if called directly
if (require.main === module) {
  main();
}