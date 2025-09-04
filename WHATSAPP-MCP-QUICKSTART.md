# WhatsApp MCP Integration Quick Start Guide

## 🚀 5-Minute Setup

### 1. Configure Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and add your credentials
```

Required configurations:
- `DEFAULT_ORGANIZATION_ID` - Get from your HERA database
- `NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID` - Same as above
- `WHATSAPP_*` - From Facebook Developer Console (optional for testing)
- `CLAUDE_API_KEY` - From Anthropic (optional for testing)

### 2. Test MCP Tools Integration

```bash
# Make sure your Next.js app is running
npm run dev

# In another terminal, test the MCP tools
node test-mcp-integration.js
```

### 3. Access WhatsApp Desktop

Open http://localhost:3002/salon-whatsapp-desktop

## 📱 WhatsApp Business API Setup (For Production)

### Prerequisites
1. Facebook Business Account
2. WhatsApp Business Account
3. Phone number not registered with WhatsApp

### Setup Steps

1. **Create WhatsApp Business App**
   - Go to https://developers.facebook.com
   - Create new app → Business → WhatsApp
   - Add WhatsApp product to your app

2. **Configure Phone Number**
   - Add phone number in WhatsApp > API Setup
   - Verify the phone number
   - Note your Phone Number ID

3. **Generate Access Token**
   - Go to WhatsApp > API Setup
   - Generate permanent token
   - Copy the token to `.env.local`

4. **Configure Webhook**
   - In WhatsApp > Configuration
   - Callback URL: `https://your-domain.com/api/v1/whatsapp/webhook`
   - Verify token: Your custom token from `.env.local`
   - Subscribe to: `messages`, `message_status`

## 🧪 Testing Without WhatsApp API

The app works in demo mode without WhatsApp configuration:

1. **Mock Window States**: Random open/closed states
2. **Simulated Messages**: Test sending without real API
3. **Cost Calculations**: See how pricing works
4. **MCP Tools**: All tools work with mock data

## 🛠️ Available MCP Tools

### Calendar Tools
```javascript
// Find available appointment slots
POST /api/v1/mcp/tools
{
  "tool": "calendar.find_slots",
  "input": {
    "organization_id": "your-org-id",
    "duration": 60,
    "date_range": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-07T00:00:00Z"
    }
  }
}

// Book appointment
POST /api/v1/mcp/tools
{
  "tool": "calendar.book",
  "input": {
    "organization_id": "your-org-id",
    "customer_id": "customer-uuid",
    "service_ids": ["service-1", "service-2"],
    "slot": {
      "start": "2024-01-01T10:00:00Z",
      "end": "2024-01-01T11:00:00Z"
    },
    "location_id": "location-uuid"
  }
}
```

### WhatsApp Tools
```javascript
// Check 24-hour window state
POST /api/v1/mcp/tools
{
  "tool": "wa.window_state",
  "input": {
    "organization_id": "your-org-id",
    "wa_contact_id": "1234567890"
  }
}

// Send message
POST /api/v1/mcp/tools
{
  "tool": "wa.send",
  "input": {
    "organization_id": "your-org-id",
    "to": "1234567890",
    "kind": "freeform",
    "body": "Hello from HERA!"
  }
}
```

### HERA Database Tools
```javascript
// Create/update entity
POST /api/v1/mcp/tools
{
  "tool": "hera.entity.upsert",
  "input": {
    "organization_id": "your-org-id",
    "entity_type": "customer",
    "payload": {
      "entity_name": "John Doe",
      "smart_code": "HERA.SALON.CUSTOMER.PERSON.v1",
      "metadata": {
        "phone": "+1234567890"
      }
    }
  }
}

// Write transaction
POST /api/v1/mcp/tools
{
  "tool": "hera.txn.write",
  "input": {
    "organization_id": "your-org-id",
    "header": {
      "transaction_type": "WHATSAPP_MESSAGE",
      "smart_code": "HERA.SALON.WHATSAPP.MESSAGE.v1"
    },
    "lines": [
      {
        "line_type": "message",
        "description": "Customer inquiry"
      }
    ]
  }
}
```

## 🔧 Local Development with Ngrok

For WhatsApp webhooks in local development:

```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3002

# Use the HTTPS URL for webhook configuration
# Example: https://abc123.ngrok.io/api/v1/whatsapp/webhook
```

## 📊 Cost Tracking

The system tracks costs automatically:

- **Within 24h window**: Free messages
- **Outside window**: Template messages (charged)
- **Utility templates**: ~$0.05 per message
- **Marketing templates**: ~$0.08 per message

## 🚨 Common Issues

### "Organization ID not found"
- Check `DEFAULT_ORGANIZATION_ID` in `.env.local`
- Run `cd mcp-server && node hera-cli.js query core_organizations` to find your org ID

### "MCP tool failed"
- Ensure Next.js server is running (`npm run dev`)
- Check browser console for detailed errors
- Verify API endpoint: http://localhost:3002/api/v1/mcp/tools

### "Window state always closed"
- This is normal in demo mode (70% chance of closed)
- With real WhatsApp API, it tracks actual message history

## 📈 Next Steps

1. **Set up real WhatsApp Business API** for production
2. **Configure Claude AI** for intelligent routing
3. **Customize message templates** in WhatsApp Business Manager
4. **Set up monitoring** for cost tracking
5. **Implement custom business logic** in message router

## 🔗 Useful Links

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [HERA Sacred Tables Guide](./CLAUDE.md)
- [MCP Integration Guide](./MCP-WHATSAPP-INTEGRATION-GUIDE.md)
- [Message Router Implementation](./src/lib/whatsapp/message-router.ts)