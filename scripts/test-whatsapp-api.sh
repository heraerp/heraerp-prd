#!/bin/bash

# WhatsApp API Test Script
# Tests various WhatsApp Business API endpoints

echo "🔍 WhatsApp Business API Test Suite"
echo "===================================="

# Configuration from your environment
PHONE_NUMBER_ID="712631301940690"
BUSINESS_ACCOUNT_ID="1112225330318984"
ACCESS_TOKEN="EAAkj2JA2DYEBPYc6SZBr6H7NcjeWGvhRrif4tNHaux6l5GWuvpGkcwYdcnMlLIvZAfppuaGuJx17ZCqtGOZCJ8tr5hDQwja85ZBLrIpZCz1ZBEjDWAt2puJd7Sw1EAp3SUkcJ6VZAH8cVLy9br8HlrdDXyRP7YfYEZCvn8vEU5f0EbIX7HUtSust4QZAquWQjeBwZDZD"
BUSINESS_NUMBER="+919945896033"
TEST_RECIPIENT="+919945896033"  # Change this to your test number

echo -e "\n1️⃣  Testing Phone Number Status"
echo "--------------------------------"
curl -X GET \
  "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.'

echo -e "\n2️⃣  Testing Business Account Info"
echo "-----------------------------------"
curl -X GET \
  "https://graph.facebook.com/v18.0/${BUSINESS_ACCOUNT_ID}?fields=id,name,timezone,message_template_namespace&access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.'

echo -e "\n3️⃣  Checking Phone Number Registration"
echo "----------------------------------------"
curl -X GET \
  "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/register?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.'

echo -e "\n4️⃣  Testing Simple Text Message (Dry Run)"
echo "-------------------------------------------"
echo "Payload that would be sent:"
cat << EOF | jq '.'
{
  "messaging_product": "whatsapp",
  "to": "${TEST_RECIPIENT}",
  "type": "text",
  "text": {
    "body": "Hello from HERA ERP! This is a test message."
  }
}
EOF

echo -e "\n5️⃣  Actual Message Send Test"
echo "------------------------------"
echo "Sending test message to ${TEST_RECIPIENT}..."
curl -X POST \
  "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "'${TEST_RECIPIENT}'",
    "type": "text",
    "text": {
      "body": "Test from HERA ERP: Connection successful! 🎉"
    }
  }' 2>/dev/null | jq '.'

echo -e "\n6️⃣  Testing Template Message"
echo "------------------------------"
# First, let's check available templates
echo "Checking available message templates..."
curl -X GET \
  "https://graph.facebook.com/v18.0/${BUSINESS_ACCOUNT_ID}/message_templates?access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.data[] | {name: .name, status: .status, language: .language}'

echo -e "\n7️⃣  Testing Media Capabilities"
echo "--------------------------------"
echo "Checking supported media types..."
curl -X GET \
  "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}?fields=supported_apps&access_token=${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" 2>/dev/null | jq '.'

echo -e "\n📊 Test Summary"
echo "---------------"
echo "Phone Number ID: ${PHONE_NUMBER_ID}"
echo "Business Account ID: ${BUSINESS_ACCOUNT_ID}"
echo "Business Number: ${BUSINESS_NUMBER}"
echo "API Version: v18.0"
echo ""
echo "⚠️  Common Issues to Check:"
echo "  1. Phone number verification expired"
echo "  2. Access token permissions"
echo "  3. Phone number not registered"
echo "  4. Test recipient not opted in"
echo ""
echo "✅ Next Steps:"
echo "  1. Verify phone number in Meta Business Manager"
echo "  2. Ensure test recipient has messaged your number first"
echo "  3. Check webhook configuration for receiving messages"