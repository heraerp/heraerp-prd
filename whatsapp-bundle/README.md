# WhatsApp Business Integration for HERA Salon

## Overview

This bundle contains the complete WhatsApp Business API integration for the HERA Salon application, enabling automated customer conversations, appointment booking, and business messaging.

## Features

- ✅ **Automated Conversations**: AI-powered chatbot for customer inquiries
- ✅ **Appointment Booking**: Book salon appointments via WhatsApp
- ✅ **Service Menu**: Interactive service catalog with prices
- ✅ **Staff Portal**: Staff can check schedules and manage appointments
- ✅ **Customer Management**: Track conversations and customer history
- ✅ **Multi-language Support**: Handles multiple languages intelligently
- ✅ **Dashboard**: Real-time conversation management interface

## Quick Start

1. **Environment Setup**:
   ```bash
   # Add to your .env file
   WHATSAPP_ACCESS_TOKEN=your-access-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-id
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=hera-whatsapp-webhook-2024-secure-token
   WHATSAPP_BUSINESS_ACCOUNT_ID=your-waba-id
   DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6
   ```

2. **Deploy to Railway**:
   ```bash
   railway up
   ```

3. **Configure Webhook in Facebook**:
   - URL: `https://your-app.railway.app/api/v1/whatsapp/webhook`
   - Verify Token: `hera-whatsapp-webhook-2024-secure-token`
   - Subscribe to: `messages`

4. **Access Dashboard**:
   - Navigate to: `/salon/whatsapp`

## Architecture

### Universal 6-Table Implementation

The WhatsApp integration uses HERA's universal architecture:

- **Conversations**: Stored as entities with `entity_type = 'whatsapp_conversation'`
- **Messages**: Stored as transactions with `transaction_type = 'whatsapp_message'`
- **Customer Data**: Dynamic fields in `core_dynamic_data`
- **Relationships**: Links between customers, conversations, and appointments

### Key Components

1. **Webhook Handler** (`/api/v1/whatsapp/webhook`)
   - Receives WhatsApp messages
   - Verifies webhook challenges
   - Routes to message processor

2. **Message Processor** (`/lib/whatsapp/processor.ts`)
   - Intent recognition
   - Business logic execution
   - Response generation

3. **Dashboard UI** (`/app/salon/whatsapp`)
   - Real-time conversation view
   - Message history
   - Quick actions

## API Endpoints

### Webhook
```
GET/POST /api/v1/whatsapp/webhook
```

### Testing
```
GET /api/v1/whatsapp/test-store
GET /api/v1/whatsapp/debug-dashboard
```

## Testing Tools

### 1. Send Test Message
```bash
curl -X POST https://your-app.railway.app/api/v1/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d @test-scripts/test-message.json
```

### 2. Check Storage
```bash
curl https://your-app.railway.app/api/v1/whatsapp/test-store
```

### 3. Debug Dashboard
```bash
curl https://your-app.railway.app/api/v1/whatsapp/debug-dashboard
```

## Deployment

### Railway Deployment

1. **Set Environment Variables**:
   ```bash
   railway variables set WHATSAPP_ACCESS_TOKEN=your-token
   railway variables set WHATSAPP_PHONE_NUMBER_ID=your-phone-id
   railway variables set WHATSAPP_WEBHOOK_VERIFY_TOKEN=hera-whatsapp-webhook-2024-secure-token
   railway variables set WHATSAPP_BUSINESS_ACCOUNT_ID=your-waba-id
   railway variables set DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6
   ```

2. **Deploy**:
   ```bash
   railway up
   ```

3. **Get URL**:
   ```bash
   railway open
   ```

## Bundle Contents

- `README.md` - This file
- `SETUP-GUIDE.md` - Detailed setup instructions
- `API-REFERENCE.md` - Complete API documentation
- `TROUBLESHOOTING.md` - Common issues and solutions
- `test-scripts/` - Testing utilities
- `code-snippets/` - Reusable code examples
- `deployment/` - Deployment configurations

## Version

- Bundle Version: 2.0.0
- Last Updated: August 27, 2024
- Compatible with: HERA v1.2.1+

## Support

- Documentation: https://docs.anthropic.com/en/docs/claude-code
- Issues: https://github.com/anthropics/claude-code/issues
- HERA Docs: See `/docs` directory in main repository