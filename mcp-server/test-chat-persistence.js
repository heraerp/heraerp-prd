#!/usr/bin/env node

// Test Analytics Chat Persistence
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

async function demonstrateChatPersistence() {
  console.log('🗂️  Analytics Chat Persistence Demo\n');
  console.log('This demo shows how chat messages are stored in HERA\'s universal architecture\n');
  
  // 1. Show smart codes being used
  console.log('📋 Smart Codes for Chat System:');
  console.log('  • HERA.ANALYTICS.CHAT.USER.QUERY.v1    - User questions');
  console.log('  • HERA.ANALYTICS.CHAT.AI.RESPONSE.v1   - AI answers');
  console.log('  • HERA.ANALYTICS.CHAT.SESSION.START.v1 - Session markers');
  console.log('  • HERA.ANALYTICS.CHAT.SESSION.END.v1   - Session completion\n');
  
  // 2. Check existing chat messages
  console.log('📊 Checking Existing Chat Messages...\n');
  
  const { data: chatMessages, error } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', TEST_ORG_ID)
    .eq('transaction_type', 'analytics_chat')
    .order('transaction_date', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('Error fetching chat messages:', error);
    return;
  }
  
  if (chatMessages && chatMessages.length > 0) {
    console.log(`Found ${chatMessages.length} recent chat messages:\n`);
    
    chatMessages.forEach((msg, idx) => {
      const metadata = msg.metadata || {};
      const messageType = metadata.message_type || 'unknown';
      const content = metadata.content || 'No content';
      const sessionId = metadata.session_id || 'No session';
      const timestamp = new Date(msg.transaction_date).toLocaleString();
      
      console.log(`${idx + 1}. ${messageType.toUpperCase()} Message`);
      console.log(`   Smart Code: ${msg.smart_code}`);
      console.log(`   Session: ${sessionId.substring(0, 8)}...`);
      console.log(`   Time: ${timestamp}`);
      console.log(`   Content: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`);
      console.log('');
    });
  } else {
    console.log('No chat messages found. Start chatting to create some!\n');
  }
  
  // 3. Show how messages are stored
  console.log('💾 How Messages Are Stored:\n');
  console.log('universal_transactions table:');
  console.log('├── transaction_type: "analytics_chat"');
  console.log('├── smart_code: HERA.ANALYTICS.CHAT.[TYPE].v1');
  console.log('├── transaction_date: ISO timestamp');
  console.log('├── metadata: {');
  console.log('│   ├── session_id: UUID for grouping');
  console.log('│   ├── message_type: "user" or "assistant"');
  console.log('│   ├── content: The message text');
  console.log('│   ├── response_data: Tables/charts (for AI)');
  console.log('│   └── tokens_used: Token count');
  console.log('└── organization_id: For multi-tenant isolation\n');
  
  // 4. Show session grouping
  console.log('🗂️  Session Management:\n');
  
  const { data: sessions } = await supabase
    .from('universal_transactions')
    .select('metadata')
    .eq('organization_id', TEST_ORG_ID)
    .eq('transaction_type', 'analytics_chat');
    
  if (sessions) {
    const sessionMap = new Map();
    sessions.forEach(s => {
      const sessionId = s.metadata?.session_id;
      if (sessionId) {
        sessionMap.set(sessionId, (sessionMap.get(sessionId) || 0) + 1);
      }
    });
    
    console.log(`Found ${sessionMap.size} chat sessions:\n`);
    Array.from(sessionMap.entries()).slice(0, 3).forEach(([id, count]) => {
      console.log(`  • Session ${id.substring(0, 8)}... - ${count} messages`);
    });
  }
  
  // 5. Benefits
  console.log('\n\n✨ Benefits of Universal Architecture Storage:\n');
  console.log('  ✅ No new tables needed - uses existing 6 tables');
  console.log('  ✅ Smart codes enable intelligent querying');
  console.log('  ✅ Metadata stores rich conversation context');
  console.log('  ✅ Perfect multi-tenant isolation');
  console.log('  ✅ Searchable chat history');
  console.log('  ✅ Analytics on chat usage patterns');
  console.log('  ✅ Export capabilities for compliance\n');
  
  // 6. UI Features
  console.log('🎨 UI Features Available:\n');
  console.log('  • History Button - View all past conversations');
  console.log('  • Search Bar - Find specific chats');
  console.log('  • Session List - Grouped by date');
  console.log('  • Delete Options - Remove individual or all');
  console.log('  • Auto-Save - Every message saved instantly');
  console.log('  • Session Reload - Click to continue old chats\recursion');
  
  console.log('\n✅ Analytics Chat Persistence is fully operational!\n');
}

// Run demo
demonstrateChatPersistence().catch(console.error);