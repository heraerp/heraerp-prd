#!/bin/bash

echo "🧪 Direct Database Message Test"
echo "=============================="
echo ""

# Direct SQL to check if we can insert a message
cat << 'EOF' > test-message.sql
-- Check if we can insert a WhatsApp message directly
INSERT INTO universal_transactions (
  organization_id,
  transaction_type,
  transaction_code,
  transaction_date,
  total_amount,
  source_entity_id,
  smart_code,
  metadata
) VALUES (
  '44d2d8f8-167d-46a7-a704-c0e5435863d6',
  'whatsapp_message',
  'MSG-DIRECT-TEST',
  NOW(),
  0,
  '266b8042-f932-4faf-8cc5-4df8a65d9418',
  'HERA.WHATSAPP.MSG.INBOUND.v1',
  '{"text": "Direct test message", "direction": "inbound"}'::jsonb
) RETURNING id;
EOF

echo "To test directly in Supabase SQL Editor:"
echo ""
cat test-message.sql
echo ""
echo "If this fails, it will show the exact constraint/permission issue."