# WhatsApp Appointment Booking System

## Overview

HERA includes a complete WhatsApp Business API integration for appointment booking, enabling businesses to accept bookings through WhatsApp conversations. This feature is particularly useful for salons, healthcare providers, and service businesses.

## Architecture

The WhatsApp appointment booking system uses:
- **WhatsApp Business API** for messaging
- **Webhook integration** for real-time message processing
- **Session management** for multi-step conversations
- **Universal 6-table architecture** for data storage

## Key Components

### 1. Appointment Handler (`src/lib/whatsapp/appointment-handler.ts`)
- Manages the conversation flow for appointment booking
- Supports multi-step booking process:
  - Service selection
  - Staff selection
  - Date selection
  - Time selection
  - Booking confirmation
- Session-based state management
- Handles restart/cancel commands

### 2. Webhook Route (`src/app/api/v1/whatsapp/webhook/route.ts`)
- Receives incoming messages from Meta/WhatsApp
- Handles webhook verification for Meta
- Routes messages to appropriate handlers
- Manages organization context

### 3. Message Router (`src/lib/whatsapp/message-router.ts`)
- Intelligently routes messages to different handlers
- Supports multiple conversation types
- Extensible for additional features

### 4. WhatsApp Client (`src/lib/whatsapp/whatsapp-client.ts`)
- Handles outbound message sending
- Manages API authentication
- Provides message formatting utilities

## Configuration

### Environment Variables

Create a `.env.local` file with:

```bash
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_APP_SECRET=your_app_secret

# Webhook Configuration
WHATSAPP_WEBHOOK_TOKEN=your_secure_webhook_token
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_secure_webhook_token

# Business Phone Number
WHATSAPP_BUSINESS_NUMBER=+1234567890

# Organization Mapping
DEFAULT_ORGANIZATION_ID=your-org-uuid
```

### Webhook Setup

1. **Configure Webhook URL in Meta Business Manager:**
   ```
   https://yourdomain.com/api/v1/whatsapp/webhook
   ```

2. **Set Verify Token:**
   Use the same token as `WHATSAPP_WEBHOOK_TOKEN`

3. **Subscribe to Webhook Fields:**
   - messages
   - message_status
   - message_template_status_update

## Booking Flow

### Customer Experience

1. **Customer sends:** "I want to book an appointment"
2. **Bot responds:** Welcome message + service menu
3. **Customer selects:** Service by number (1-5)
4. **Bot responds:** Staff selection menu
5. **Customer selects:** Preferred stylist
6. **Bot responds:** Available dates (next 7 days)
7. **Customer selects:** Preferred date
8. **Bot responds:** Available time slots
9. **Customer selects:** Preferred time
10. **Bot responds:** Booking summary for confirmation
11. **Customer confirms:** "YES" to confirm
12. **Bot responds:** Confirmation message with details

### Available Services (Configurable)

- Haircut & Style (60min - AED 150)
- Hair Color (180min - AED 280)
- Keratin Treatment (180min - AED 350)
- Bridal Package (360min - AED 800)
- Spa Treatment (120min - AED 300)

### Available Staff (Configurable)

- Rocky - Senior Stylist
- Maya - Color Specialist
- Sophia - Bridal Specialist
- Any Available - First Available

## Testing

### Test Scripts Included

1. **Basic Integration Test:**
   ```bash
   ./test-whatsapp-integration.sh
   ```

2. **Appointment Booking Flow Test:**
   ```bash
   ./test-whatsapp-booking.sh
   ```

3. **Quick API Test:**
   ```bash
   ./scripts/test-whatsapp-api.sh
   ```

4. **Webhook Message Test:**
   ```bash
   ./test-webhook-message.sh
   ```

### Manual Testing

1. **Send test message via cURL:**
   ```bash
   curl -X POST "https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages" \
     -H "Authorization: Bearer ${ACCESS_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "messaging_product": "whatsapp",
       "to": "1234567890",
       "type": "text",
       "text": {
         "body": "Hello from HERA!"
       }
     }'
   ```

2. **Simulate incoming webhook:**
   ```bash
   ./test-webhook-message.sh
   ```

## Production Deployment

### Railway Configuration

Add these environment variables to Railway:
- All WhatsApp API credentials
- Webhook verification token
- Organization mapping

### Security Considerations

1. **Webhook Signature Validation:** Enable in production (currently commented out)
2. **Rate Limiting:** Implement to prevent abuse
3. **Session Timeout:** Add automatic session cleanup
4. **Access Token Security:** Use permanent tokens, store securely

## Extending the System

### Adding New Conversation Types

1. Create new handler in `src/lib/whatsapp/`
2. Add routing logic to `message-router.ts`
3. Register handler in webhook route

### Custom Business Logic

- Integrate with calendar systems
- Add payment processing
- Send appointment reminders
- Handle cancellations/rescheduling

## Smart Code Integration

The system uses HERA Smart Codes for tracking:
- `HERA.COMM.WHATSAPP.MSG.IN.v1` - Incoming messages
- `HERA.COMM.WHATSAPP.MSG.OUT.v1` - Outgoing messages
- `HERA.SALON.APPT.BOOK.v1` - Appointment bookings

## Troubleshooting

1. **Webhook not receiving messages:**
   - Check webhook URL configuration
   - Verify token matches
   - Check SSL certificate

2. **Messages not sending:**
   - Verify access token is valid
   - Check phone number format
   - Ensure number is registered

3. **Session issues:**
   - Implement Redis for production
   - Add session timeout handling
   - Clear old sessions periodically

## Future Enhancements

- [ ] Redis session storage
- [ ] Multi-language support
- [ ] Rich media messages
- [ ] Template messages
- [ ] Group booking support
- [ ] Integration with calendar systems
- [ ] Automated reminders
- [ ] Payment integration