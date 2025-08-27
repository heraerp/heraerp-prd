#!/bin/bash

echo "🧪 Bulk WhatsApp Message Testing"
echo "================================"
echo ""

WEBHOOK_URL=${1:-"https://heraerp.com/api/v1/whatsapp/webhook"}
COUNT=${2:-5}

echo "Sending $COUNT test messages to $WEBHOOK_URL"
echo ""

# Test messages
MESSAGES=(
    "Hello"
    "I want to book an appointment for tomorrow"
    "What services do you offer?"
    "How much is a haircut?"
    "Cancel my appointment"
)

for i in $(seq 0 $((COUNT-1))); do
    MSG_INDEX=$((i % ${#MESSAGES[@]}))
    MESSAGE="${MESSAGES[$MSG_INDEX]}"
    TIMESTAMP=$(date +%s)
    
    echo "Sending message $((i+1)): $MESSAGE"
    
    curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d '{
            "object": "whatsapp_business_account",
            "entry": [{
                "id": "1112225330318984",
                "changes": [{
                    "value": {
                        "messaging_product": "whatsapp",
                        "messages": [{
                            "from": "919945896033",
                            "id": "wamid.TEST_'$TIMESTAMP'_'$i'",
                            "timestamp": "'$TIMESTAMP'",
                            "text": {
                                "body": "'"$MESSAGE"'"
                            },
                            "type": "text"
                        }]
                    },
                    "field": "messages"
                }]
            }]
        }' \
        -w " - Status: %{http_code}\n"
    
    # Small delay between messages
    sleep 0.5
done

echo ""
echo "✅ Bulk test complete!"
echo ""
echo "Check results:"
echo "- Dashboard: https://heraerp.com/salon/whatsapp"
echo "- Debug endpoint: curl https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq"