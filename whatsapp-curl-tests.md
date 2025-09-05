# WhatsApp Business API Test Commands

## Configuration
```bash
APP_ID="2572687829765505"
PHONE_NUMBER_ID="712631301940690"
WHATSAPP_BUSINESS_ACCOUNT_ID="1112225330318984"
ACCESS_TOKEN="EAAkj2JA2DYEBPQeZC1D0my0wZClW6uw3VBAANDpFzm6B7jr91bKJCnvhg9J2U0kAZAX3ZCJAek6K6NekOPXd5paBgN8Au3EOV0O6ob1pZChsDunIxxtAmr83MDSHXbMxA1hLo58zujSXPKhkZCyATNIZAa39i0l3h2PLRHJE2fzB5ZAz4UEaNwTH6fTOL6iUxAZDZD"
WEBHOOK_URL="https://heraerp.com/api/v1/whatsapp/webhook"
```

## 1. Test Webhook Verification
```bash
# Replace YOUR_VERIFY_TOKEN with your actual verify token
curl -X GET "https://heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.challenge=test-challenge-123&hub.verify_token=YOUR_VERIFY_TOKEN"
```

## 2. Send Text Message
```bash
# Replace 971501234567 with actual recipient number (without + sign)
curl -X POST "https://graph.facebook.com/v21.0/712631301940690/messages" \
  -H "Authorization: Bearer EAAkj2JA2DYEBPQeZC1D0my0wZClW6uw3VBAANDpFzm6B7jr91bKJCnvhg9J2U0kAZAX3ZCJAek6K6NekOPXd5paBgN8Au3EOV0O6ob1pZChsDunIxxtAmr83MDSHXbMxA1hLo58zujSXPKhkZCyATNIZAa39i0l3h2PLRHJE2fzB5ZAz4UEaNwTH6fTOL6iUxAZDZD" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "971501234567",
    "type": "text",
    "text": {
      "body": "Hello from HERA ERP! This is a test message."
    }
  }'
```

## 3. Send Template Message (hello_world)
```bash
curl -X POST "https://graph.facebook.com/v21.0/712631301940690/messages" \
  -H "Authorization: Bearer EAAkj2JA2DYEBPQeZC1D0my0wZClW6uw3VBAANDpFzm6B7jr91bKJCnvhg9J2U0kAZAX3ZCJAek6K6NekOPXd5paBgN8Au3EOV0O6ob1pZChsDunIxxtAmr83MDSHXbMxA1hLo58zujSXPKhkZCyATNIZAa39i0l3h2PLRHJE2fzB5ZAz4UEaNwTH6fTOL6iUxAZDZD" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "971501234567",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": {
        "code": "en_US"
      }
    }
  }'
```

## 4. Test Webhook Endpoint (Simulate Incoming Message)
```bash
curl -X POST "https://heraerp.com/api/v1/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "1112225330318984",
        "changes": [
          {
            "value": {
              "messaging_product": "whatsapp",
              "metadata": {
                "display_phone_number": "971501234567",
                "phone_number_id": "712631301940690"
              },
              "contacts": [
                {
                  "profile": {
                    "name": "Test Customer"
                  },
                  "wa_id": "971501234567"
                }
              ],
              "messages": [
                {
                  "from": "971501234567",
                  "id": "wamid.TEST_MESSAGE_ID",
                  "timestamp": "1703123456",
                  "text": {
                    "body": "I want to book an appointment"
                  },
                  "type": "text"
                }
              ]
            },
            "field": "messages"
          }
        ]
      }
    ]
  }'
```

## 5. Get Phone Numbers
```bash
curl -X GET "https://graph.facebook.com/v21.0/1112225330318984/phone_numbers" \
  -H "Authorization: Bearer EAAkj2JA2DYEBPQeZC1D0my0wZClW6uw3VBAANDpFzm6B7jr91bKJCnvhg9J2U0kAZAX3ZCJAek6K6NekOPXd5paBgN8Au3EOV0O6ob1pZChsDunIxxtAmr83MDSHXbMxA1hLo58zujSXPKhkZCyATNIZAa39i0l3h2PLRHJE2fzB5ZAz4UEaNwTH6fTOL6iUxAZDZD"
```

## 6. Get Message Templates
```bash
curl -X GET "https://graph.facebook.com/v21.0/1112225330318984/message_templates" \
  -H "Authorization: Bearer EAAkj2JA2DYEBPQeZC1D0my0wZClW6uw3VBAANDpFzm6B7jr91bKJCnvhg9J2U0kAZAX3ZCJAek6K6NekOPXd5paBgN8Au3EOV0O6ob1pZChsDunIxxtAmr83MDSHXbMxA1hLo58zujSXPKhkZCyATNIZAa39i0l3h2PLRHJE2fzB5ZAz4UEaNwTH6fTOL6iUxAZDZD"
```

## 7. Upload Media (for sending images)
```bash
# First upload the media
curl -X POST "https://graph.facebook.com/v21.0/712631301940690/media" \
  -H "Authorization: Bearer EAAkj2JA2DYEBPQeZC1D0my0wZClW6uw3VBAANDpFzm6B7jr91bKJCnvhg9J2U0kAZAX3ZCJAek6K6NekOPXd5paBgN8Au3EOV0O6ob1pZChsDunIxxtAmr83MDSHXbMxA1hLo58zujSXPKhkZCyATNIZAa39i0l3h2PLRHJE2fzB5ZAz4UEaNwTH6fTOL6iUxAZDZD" \
  -F "file=@/path/to/your/image.jpg" \
  -F "type=image/jpeg" \
  -F "messaging_product=whatsapp"
```

## Important Notes:
1. **Replace the recipient number** with a real WhatsApp number
2. **Update the verify token** in the webhook verification test
3. **Ensure webhook URL is accessible** from the internet
4. **Check Meta Business Suite** for webhook logs
5. **The access token may expire** - generate a new one if needed

## Testing Checklist:
- [ ] Webhook verification returns challenge
- [ ] Text message sends successfully
- [ ] Template message sends (if templates are approved)
- [ ] Webhook receives incoming messages
- [ ] Phone numbers list correctly
- [ ] Templates list shows available templates