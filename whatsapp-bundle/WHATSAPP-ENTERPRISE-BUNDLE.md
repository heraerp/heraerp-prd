# HERA WhatsApp Enterprise Bundle

## Overview

This bundle contains a complete enterprise-ready WhatsApp Business integration for HERA ERP, built using the universal 6-table architecture. The implementation includes a WhatsApp Desktop-style interface, message management, status tracking, and full compliance with WhatsApp Business API requirements.

## Key Features

### 1. **WhatsApp Desktop Interface** (`/whatsapp-desktop`)
- Professional desktop-style layout (30% sidebar, 70% chat area)
- Real-time message updates without page refresh
- Dark/light theme support
- Full keyboard shortcuts
- Rich media support

### 2. **Enterprise WhatsApp** (`/enterprise/whatsapp`)
- Business-focused interface
- Agent assignment and handoff
- 24-hour window compliance
- Template messages
- Auto-refresh with background updates

### 3. **Message Features**
- Reply to messages
- Forward to multiple contacts
- Star important messages
- Message status tracking (sent, delivered, read)
- Context menu with all actions
- Emoji picker
- File attachments

### 4. **HERA Architecture**
- All data stored in 6 universal tables
- Multi-tenant isolation
- Smart code classification
- Complete audit trail
- No custom tables required

## File Structure

```
whatsapp-bundle/
├── src/
│   ├── app/
│   │   ├── whatsapp-desktop/
│   │   │   └── page.tsx                    # Full WhatsApp Desktop interface
│   │   ├── enterprise/
│   │   │   └── whatsapp/
│   │   │       └── page.tsx                # Enterprise WhatsApp with auto-refresh
│   │   ├── salon/
│   │   │   └── whatsapp-canonical/
│   │   │       └── page.tsx                # Original canonical implementation
│   │   └── api/v1/whatsapp/
│   │       ├── conversations/route.ts      # Conversation management
│   │       ├── messages/[id]/route.ts      # Message operations
│   │       ├── messages-simple/route.ts    # Simplified message API
│   │       ├── send/route.ts               # Send messages
│   │       ├── agents/route.ts             # Agent management
│   │       ├── webhook/route.ts            # WhatsApp webhooks
│   │       └── search/route.ts             # Global search
│   ├── components/whatsapp/
│   │   ├── MessageContextMenu.tsx          # Right-click menu
│   │   ├── AttachmentMenu.tsx              # File attachment UI
│   │   ├── EmojiPicker.tsx                 # Emoji selection
│   │   ├── MediaMessage.tsx                # Media display
│   │   ├── ForwardMessageDialog.tsx        # Forward messages
│   │   ├── TemplateMessageDialog.tsx       # Template messages
│   │   ├── InteractiveMessage.tsx          # Interactive components
│   │   ├── MessageStatusHistory.tsx        # Status timeline
│   │   └── KeyboardShortcuts.tsx           # Shortcuts help
│   └── lib/whatsapp/
│       └── processor-v2.ts                 # Message processor
├── database/
│   └── whatsapp-schema.sql                 # Schema documentation
├── test/
│   ├── test-whatsapp-messages.js           # Message test data
│   ├── test-whatsapp-status.js             # Status webhook test
│   └── test-whatsapp-canonical.js          # Canonical test
└── docs/
    ├── WHATSAPP-DESKTOP-GUIDE.md           # Desktop guide
    ├── STATUS-TRACKING.md                  # Status tracking guide
    └── WHATSAPP-INTEGRATION.md             # Integration overview
```

## Installation

### 1. Install Dependencies
```bash
npm install
npm install next-themes
npx shadcn@latest add context-menu
```

### 2. Environment Variables
```env
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Default organization
DEFAULT_ORGANIZATION_ID=3df8cc52-3d81-42d5-b088-7736ae26cc7c

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 3. Run the Application
```bash
npm run dev
```

### 4. Access Points
- WhatsApp Desktop: `http://localhost:3000/whatsapp-desktop`
- Enterprise WhatsApp: `http://localhost:3000/enterprise/whatsapp`
- Canonical Version: `http://localhost:3000/salon/whatsapp-canonical`

## HERA Universal Architecture

### Table Usage

#### 1. **Conversations** (`core_entities`)
```sql
-- entity_type: 'whatsapp_conversation'
-- Stores all WhatsApp conversations
-- metadata contains: phone, wa_id, unread_count, last_activity
```

#### 2. **Messages** (`universal_transactions`)
```sql
-- transaction_type: 'whatsapp_message'
-- Inbound: source_entity_id = conversation_id
-- Outbound: target_entity_id = conversation_id
-- metadata contains: text, direction, status, waba_message_id
```

#### 3. **Status Updates** (`universal_transactions`)
```sql
-- transaction_type: 'whatsapp_status'
-- Tracks message delivery status
-- Smart codes: HERA.COMM.WHATSAPP.STATUS.{SENT|DELIVERED|READ|FAILED}.v1
```

#### 4. **Relationships** (`core_relationships`)
```sql
-- Pin status: relationship_type = 'is_pinned'
-- Archive status: relationship_type = 'is_archived'
-- Agent assignment: relationship_type = 'assigned_to'
-- Status updates: relationship_type = 'status_update'
```

## API Documentation

### Send Message
```javascript
POST /api/v1/whatsapp/send
{
  "conversationId": "uuid",
  "text": "Hello!",
  "to": "+971501234567",
  "template": { /* template data */ },
  "interactive": { /* interactive data */ }
}
```

### Get Conversations
```javascript
GET /api/v1/whatsapp/conversations
// Returns all conversations with metadata
```

### Message Operations
```javascript
// Star/unstar message
PUT /api/v1/whatsapp/messages/{id}
{ "action": "star", "value": true }

// Delete message
DELETE /api/v1/whatsapp/messages/{id}

// Mark as read
PUT /api/v1/whatsapp/messages/{id}
{ "action": "mark_read" }
```

## Testing

### 1. Insert Test Data
```bash
node test-whatsapp-messages.js
```

### 2. Test Status Updates
```bash
node test-whatsapp-status.js
```

### 3. Test Canonical Implementation
```bash
node test-whatsapp-canonical.js
```

## Features Implemented

### ✅ Core Features
- [x] WhatsApp Desktop UI with sidebar
- [x] Real-time message updates
- [x] Message reply functionality
- [x] Forward messages to multiple contacts
- [x] Star important messages
- [x] Message status tracking
- [x] Context menu on messages
- [x] Emoji picker
- [x] File attachments
- [x] 24-hour window compliance
- [x] Template messages
- [x] Interactive components
- [x] Agent assignment
- [x] Auto-refresh without page reload
- [x] Dark/light theme
- [x] Keyboard shortcuts

### ✅ Enterprise Features
- [x] Multi-tenant isolation
- [x] Audit trail
- [x] Smart code classification
- [x] HERA universal architecture
- [x] Status webhook handling
- [x] Global search
- [x] Pin/archive conversations

### 🚧 Future Enhancements
- [ ] Voice message recording
- [ ] Video calls (WebRTC)
- [ ] Group conversations
- [ ] Broadcast lists
- [ ] Multi-language support
- [ ] Analytics dashboard

## Production Deployment

### 1. Build
```bash
npm run build
```

### 2. Configure Webhooks
- URL: `https://yourdomain.com/api/v1/whatsapp/webhook`
- Verify Token: Set in environment
- Subscribe to: messages, message_status

### 3. Security
- Enable webhook signature verification
- Implement rate limiting
- Use HTTPS only
- Regular security audits

## Support

For issues or questions:
- GitHub Issues: https://github.com/anthropics/claude-code/issues
- Documentation: https://docs.anthropic.com/en/docs/claude-code

## License

This implementation is part of HERA ERP and follows the same licensing terms.