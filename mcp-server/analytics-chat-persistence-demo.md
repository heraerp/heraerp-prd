# Analytics Chat Persistence with HERA Universal Architecture 🗂️

## Overview
Analytics Chat now saves all conversations using HERA's universal 6-table architecture, storing messages as transactions with smart codes.

## How It Works

### 1. **Data Storage Model**
```
universal_transactions table:
- transaction_type: 'analytics_chat'
- smart_code: HERA.ANALYTICS.CHAT.USER.QUERY.v1 (for user messages)
- smart_code: HERA.ANALYTICS.CHAT.AI.RESPONSE.v1 (for AI responses)
- metadata: {
    session_id: UUID for grouping conversations
    message_type: 'user' or 'assistant'
    content: The actual message text
    response_data: Tables, charts, insights (for AI responses)
    tokens_used: Token consumption tracking
  }
```

### 2. **Smart Code System**
- `HERA.ANALYTICS.CHAT.USER.QUERY.v1` - User questions
- `HERA.ANALYTICS.CHAT.AI.RESPONSE.v1` - AI answers
- `HERA.ANALYTICS.CHAT.SESSION.START.v1` - Session markers
- `HERA.ANALYTICS.CHAT.SESSION.END.v1` - Session completion

### 3. **Key Features**

#### 📚 Chat History
- Click the **History** button in the header to view past conversations
- Conversations grouped by date and session
- Shows message count and preview of last message

#### 🔍 Search Functionality
- Search bar to find specific conversations
- Searches through both questions and answers
- Real-time filtering of results

#### 🗑️ Delete Options
- Delete individual chat sessions
- Clear all history with one click
- Confirmation dialog for safety

#### 💾 Automatic Saving
- Every message automatically saved
- No manual save needed
- Instant persistence to database

### 4. **User Experience Flow**

1. **Start Chatting**: New session created automatically
2. **Ask Questions**: Each query saved with smart code
3. **Get Responses**: AI answers saved with metadata
4. **View History**: Click History button to see past chats
5. **Search**: Find specific conversations by keyword
6. **Delete**: Remove individual sessions or clear all

### 5. **Technical Implementation**

#### Storage Library (`/src/lib/analytics-chat-storage.ts`)
```typescript
// Save a message
await chatStorage.saveMessage({
  session_id: currentSession,
  message_type: 'user',
  content: 'Show revenue this month',
  timestamp: new Date().toISOString()
})

// Get chat history
const history = await chatStorage.getChatHistory({
  limit: 50,
  offset: 0
})

// Search conversations
const results = await chatStorage.searchChatHistory('revenue')

// Delete session
await chatStorage.deleteSession(sessionId)
```

#### API Routes
- `POST /api/v1/analytics/chat/save` - Save messages
- `GET /api/v1/analytics/chat/history` - Retrieve history
- `GET /api/v1/analytics/chat/sessions` - Get session list
- `DELETE /api/v1/analytics/chat/[id]` - Delete messages

### 6. **Multi-Tenant Security**
- All messages filtered by organization_id
- Users can only see their organization's chats
- Complete data isolation
- Secure deletion permissions

### 7. **Benefits of Universal Architecture**
- ✅ No new tables needed - uses existing 6 tables
- ✅ Smart codes enable intelligent querying
- ✅ Metadata stores rich context
- ✅ Relationships can link related conversations
- ✅ Standard HERA patterns apply

### 8. **UI Components**

#### History Sidebar
- Clean list of past conversations
- Date grouping (Today, Yesterday, Last 7 days, etc.)
- Message count badges
- Hover effects for interactivity

#### Session Display
```
📅 Today at 2:45 PM (5 messages)
"Show revenue from haircuts this month"

📅 Yesterday at 10:30 AM (12 messages)
"Compare customer growth year over year"
```

#### Delete Confirmation
```
Delete this conversation?
This will permanently remove 5 messages.
[Cancel] [Delete]
```

### 9. **Advanced Features**
- Export chat history to CSV/JSON
- Analytics on chat usage patterns
- Token usage tracking for cost management
- Session duration statistics
- Most asked questions analysis

## Try It Out!

1. Ask any analytics question in the chat
2. Click the **History** button to see it saved
3. Search for keywords in past conversations
4. Click any session to reload that conversation
5. Delete old conversations to keep history clean

The Analytics Chat now provides enterprise-grade persistence using HERA's universal architecture - no schema changes needed!