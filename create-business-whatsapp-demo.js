const { config } = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Use the salon demo organization ID (Hair Talkz • Park Regis)
const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

async function createBusinessWhatsAppDemo() {
  console.log('🔧 Creating business WhatsApp conversations...');
  console.log('📍 Using organization ID:', organizationId);
  
  try {
    // Define multiple customer conversations
    const customerConversations = [
      {
        customer: {
          name: 'Maria Garcia',
          phone: '+971501234001',
          email: 'maria@example.com'
        },
        messages: [
          { content: 'Hi, I need to book a hair coloring appointment', direction: 'inbound', time: -120 },
          { content: 'Hello Maria! 👋 I\'d be happy to help you with hair coloring. We have excellent colorists available. What type of color service are you looking for? Full color, highlights, or balayage?', direction: 'outbound', time: -115 },
          { content: 'I want balayage with blonde highlights', direction: 'inbound', time: -110 },
          { content: 'Great choice! Balayage with blonde highlights will look stunning. Our balayage service takes about 3-4 hours and costs AED 450-650 depending on hair length. When would you like to come in?', direction: 'outbound', time: -105 },
          { content: 'Do you have anything available this Saturday?', direction: 'inbound', time: -90 },
          { content: 'Let me check Saturday\'s availability for you... I have these slots:\n• 10:00 AM with Emma (Senior Colorist)\n• 2:00 PM with Sarah (Color Specialist)\n• 4:00 PM with Jessica (Master Stylist)\n\nWhich works best for you?', direction: 'outbound', time: -85 },
          { content: '2pm with Sarah sounds perfect!', direction: 'inbound', time: -60 },
          { content: '✅ Perfect! I\'ve booked you for:\n\n📅 Date: This Saturday\n⏰ Time: 2:00 PM\n💇‍♀️ Service: Balayage with Blonde Highlights\n👩‍🎨 Stylist: Sarah (Color Specialist)\n💰 Price: AED 550 (for medium length hair)\n📍 Location: Hair Talkz, Park Regis Hotel, Karama\n\nWe\'ll send you a reminder 24 hours before. See you Saturday!', direction: 'outbound', time: -55 }
        ]
      },
      {
        customer: {
          name: 'Fatima Al-Hassan',
          phone: '+971502345002',
          email: 'fatima@example.com'
        },
        messages: [
          { content: 'Hello, what treatments do you offer for damaged hair?', direction: 'inbound', time: -180 },
          { content: 'Hi Fatima! We offer several treatments for damaged hair:\n\n🌟 Keratin Treatment (AED 350-500)\n💫 Olaplex Treatment (AED 250)\n✨ Deep Conditioning Mask (AED 150)\n🌺 Protein Treatment (AED 200)\n\nWhich concerns do you have with your hair? This will help me recommend the best treatment.', direction: 'outbound', time: -175 },
          { content: 'My hair is very dry and has split ends from coloring', direction: 'inbound', time: -170 },
          { content: 'Based on what you\'ve described, I\'d recommend our Olaplex Treatment combined with a trim. Olaplex repairs broken bonds in the hair from chemical damage, while trimming will remove the split ends. Would you like to book this service?', direction: 'outbound', time: -165 }
        ]
      },
      {
        customer: {
          name: 'Emma Wilson',
          phone: '+971503456003',
          email: 'emma@example.com'
        },
        messages: [
          { content: 'Hi! My wedding is in 3 weeks. Do you do bridal packages?', direction: 'inbound', time: -240 },
          { content: 'Congratulations on your upcoming wedding! 🎊 Yes, we absolutely do bridal packages!\n\n👰 BRIDAL PACKAGES:\n• Basic (AED 800): Hair styling + Basic makeup\n• Premium (AED 1200): Hair + HD Makeup + Manicure\n• Luxury (AED 1800): Hair + Airbrush Makeup + Mani/Pedi + Trial session\n\nAll packages include false lashes and hair accessories. Would you like to schedule a consultation?', direction: 'outbound', time: -235 },
          { content: 'The luxury package sounds perfect. Can I book a trial first?', direction: 'inbound', time: -200 },
          { content: 'Absolutely! Trial sessions are so important to get everything perfect for your big day. The trial is included in your Luxury package.\n\nWhen would you like to come in for your trial? We recommend doing it 1-2 weeks before the wedding. We have availability this week on:\n• Thursday 3:00 PM\n• Friday 11:00 AM\n• Saturday 2:00 PM', direction: 'outbound', time: -195 }
        ]
      },
      {
        customer: {
          name: 'Ahmed Khalil',
          phone: '+971504567004',
          email: 'ahmed@example.com'
        },
        messages: [
          { content: 'Do you do mens haircuts?', direction: 'inbound', time: -300 },
          { content: 'Yes, we absolutely do! Our stylists are experienced with all types of men\'s haircuts:\n\n💈 Classic Cut: AED 50\n✂️ Fade/Taper: AED 60\n🪒 Cut + Beard Trim: AED 80\n💆‍♂️ Cut + Hair Treatment: AED 120\n\nWould you like to book an appointment?', direction: 'outbound', time: -295 },
          { content: 'I\'ll take the cut with beard trim. Do you have anything today?', direction: 'inbound', time: -290 },
          { content: 'Let me check today\'s availability... Yes! We have:\n• 5:30 PM with Mike\n• 6:15 PM with Hassan\n• 7:00 PM with Alex\n\nAll our stylists are excellent with men\'s grooming. Which time works for you?', direction: 'outbound', time: -285 },
          { content: '6:15 with Hassan', direction: 'inbound', time: -280 },
          { content: '✅ Booked! See you at 6:15 PM today with Hassan for haircut + beard trim (AED 80). Our address is Hair Talkz, Park Regis Hotel, Karama. See you soon!', direction: 'outbound', time: -275 }
        ]
      },
      {
        customer: {
          name: 'Layla Ibrahim',
          phone: '+971505678005',
          email: 'layla@example.com'
        },
        messages: [
          { content: 'Hi, I missed my appointment yesterday. Can I reschedule?', direction: 'inbound', time: -30 },
          { content: 'Hi Layla! No worries, these things happen. I see you had a hair treatment appointment yesterday. I\'d be happy to help you reschedule. When would work best for you?', direction: 'outbound', time: -25 },
          { content: 'Can I come tomorrow morning?', direction: 'inbound', time: -20 },
          { content: 'Of course! Tomorrow morning I have:\n• 9:00 AM\n• 10:30 AM\n• 11:45 AM\n\nWhich time suits you best?', direction: 'outbound', time: -15 },
          { content: '10:30 please', direction: 'inbound', time: -10 },
          { content: '✅ Perfect! I\'ve rescheduled your hair treatment for tomorrow at 10:30 AM. We\'ll see you then! 💕', direction: 'outbound', time: -5 }
        ]
      }
    ];

    for (const conv of customerConversations) {
      // Create customer
      const { data: customer, error: customerError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'customer',
          entity_name: conv.customer.name,
          entity_code: `WA-CUST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          smart_code: 'HERA.SALON.CUSTOMER.PROFILE.v1',
          metadata: {
            phone: conv.customer.phone,
            wa_id: conv.customer.phone.replace('+', ''),
            email: conv.customer.email,
            source: 'whatsapp',
            tags: ['whatsapp_customer', 'active']
          }
        })
        .select()
        .single();
      
      if (customerError) throw customerError;
      console.log(`✅ Created customer: ${customer.entity_name}`);
      
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'whatsapp_conversation',
          entity_name: `Chat with ${conv.customer.name}`,
          entity_code: `WA-CONV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          smart_code: 'HERA.WHATSAPP.CONVERSATION.v1',
          metadata: {
            wa_id: conv.customer.phone.replace('+', ''),
            phone: conv.customer.phone,
            customer_name: conv.customer.name,
            window_state: conv.messages.length > 4 ? 'closed' : 'open',
            window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            unread_count: 0,
            conversation_cost: conv.messages.length * 0.05,
            tags: ['salon_inquiry', 'appointment_booking']
          }
        })
        .select()
        .single();
      
      if (convError) throw convError;
      console.log(`✅ Created conversation for ${conv.customer.name}`);
      
      // Create messages
      for (const msg of conv.messages) {
        const { data: transaction, error: txnError } = await supabase
          .from('universal_transactions')
          .insert({
            organization_id: organizationId,
            transaction_type: 'whatsapp_message',
            transaction_code: `WA-MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            transaction_date: new Date(Date.now() + msg.time * 60 * 1000).toISOString(),
            total_amount: 0,
            transaction_status: 'completed',
            smart_code: msg.direction === 'inbound' ? 
              'HERA.WHATSAPP.MESSAGE.RECEIVED.v1' : 
              'HERA.WHATSAPP.MESSAGE.SENT.v1',
            external_reference: `wamid.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            metadata: {
              direction: msg.direction,
              wa_id: conv.customer.phone.replace('+', ''),
              message_type: 'text',
              text: msg.content,
              status: msg.direction === 'outbound' ? 'delivered' : 'received',
              conversation_id: conversation.id,
              customer_name: conv.customer.name
            }
          })
          .select()
          .single();
        
        if (txnError) throw txnError;
      }
      console.log(`✅ Created ${conv.messages.length} messages for ${conv.customer.name}`);
    }
    
    console.log('\n✨ Business WhatsApp demo data created successfully!');
    console.log(`📱 Created ${customerConversations.length} conversations with real business scenarios`);
    console.log('💬 Total messages:', customerConversations.reduce((sum, c) => sum + c.messages.length, 0));
    
  } catch (error) {
    console.error('❌ Error creating demo data:', error);
  }
}

createBusinessWhatsAppDemo();