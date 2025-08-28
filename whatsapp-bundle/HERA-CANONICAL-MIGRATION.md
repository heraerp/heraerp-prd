# WhatsApp HERA Canonical Architecture Migration Guide

## Overview

This guide explains how to migrate from the current WhatsApp implementation to the canonical HERA 6-table architecture.

## Canonical Architecture Structure

### 1. Entities (core_entities)

#### Customer Entity
```typescript
{
  entity_type: 'customer',
  entity_name: 'WhatsApp User +971501234567',
  entity_code: 'WA-971501234567',
  smart_code: 'HERA.BEAUTY.CRM.CUSTOMER.PERSON.V1',
  metadata: {
    wa_id: '971501234567',
    phone: '971501234567',
    source: 'whatsapp'
  }
}
```

#### Channel Entity (One per WABA number)
```typescript
{
  entity_type: 'channel',
  entity_name: 'WhatsApp Business 117606954726963',
  entity_code: 'WABA-117606954726963',
  smart_code: 'HERA.BEAUTY.COMMS.CHANNEL.WHATSAPP.V1',
  metadata: {
    phone_number_id: '117606954726963',
    channel_type: 'whatsapp_business'
  }
}
```

#### Conversation Entity (24-hour windows)
```typescript
{
  entity_type: 'conversation',
  entity_name: 'WhatsApp Chat with +971501234567',
  entity_code: 'CONV-971501234567-2024-01-15',
  smart_code: 'HERA.BEAUTY.COMMS.CONVERSATION.WHATSAPP.V1',
  metadata: {
    wa_id: '971501234567',
    customer_id: 'customer-entity-id',
    channel_id: 'channel-entity-id',
    status: 'active',
    started_at: '2024-01-15T10:00:00Z'
  }
}
```

### 2. Transactions (universal_transactions)

#### Message as Transaction
```typescript
{
  transaction_type: 'whatsapp_message',
  transaction_code: 'WA-MSG-1705312800000',
  transaction_date: '2024-01-15T10:00:00Z',
  occurred_at: '2024-01-15T10:00:00Z',
  total_amount: 0,
  external_id: 'wamid.HBgLNTcxNTAxMjM0NTY3FQIAEhggRDQ2', // waba_message_id
  smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.RECEIVED.V1', // or SENT
  metadata: {
    direction: 'inbound',
    message_type: 'text',
    wa_id: '971501234567'
  }
}
```

### 3. Transaction Lines (universal_transaction_lines)

#### Text Content Line
```typescript
{
  transaction_id: 'message-transaction-id',
  line_number: 1,
  line_type: 'TEXT',
  quantity: 1,
  unit_price: 0,
  line_amount: 0,
  smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.LINE.TEXT.V1',
  metadata: {
    content_type: 'text'
  }
}
```

#### Media Content Line
```typescript
{
  transaction_id: 'message-transaction-id',
  line_number: 2,
  line_type: 'IMAGE',
  quantity: 1,
  unit_price: 0,
  line_amount: 0,
  smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.LINE.IMAGE.V1',
  metadata: {
    content_type: 'image',
    media_id: 'media-id',
    mime_type: 'image/jpeg'
  }
}
```

### 4. Dynamic Data (core_dynamic_data)

#### Message Text
```typescript
{
  entity_id: 'transaction-id',
  entity_type: 'transaction',
  field_name: 'text',
  field_value_text: 'Hello, I want to book an appointment',
  smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.DYN.TEXT.V1'
}
```

#### WhatsApp Message ID
```typescript
{
  entity_id: 'transaction-id',
  entity_type: 'transaction',
  field_name: 'waba_message_id',
  field_value_text: 'wamid.HBgLNTcxNTAxMjM0NTY3FQIAEhggRDQ2',
  smart_code: 'HERA.BEAUTY.COMMS.MESSAGE.DYN.WABAID.V1'
}
```

### 5. Relationships (core_relationships)

#### Transaction ↔ Customer
```typescript
{
  from_entity_id: 'transaction-id',
  to_entity_id: 'customer-id',
  relationship_type: 'message_from',
  smart_code: 'HERA.BEAUTY.COMMS.LINK.SENDER.V1',
  metadata: { link_type: 'sender' }
}
```

#### Transaction ↔ Channel
```typescript
{
  from_entity_id: 'transaction-id',
  to_entity_id: 'channel-id',
  relationship_type: 'message_via',
  smart_code: 'HERA.BEAUTY.COMMS.LINK.CHANNEL.V1',
  metadata: { link_type: 'channel' }
}
```

#### Transaction ↔ Conversation
```typescript
{
  from_entity_id: 'transaction-id',
  to_entity_id: 'conversation-id',
  relationship_type: 'message_in',
  smart_code: 'HERA.BEAUTY.COMMS.LINK.CONVERSATION.V1',
  metadata: { link_type: 'conversation' }
}
```

## Migration Steps

### 1. Update Webhook Handler

Use the new `WhatsAppProcessorV2` which implements the canonical structure:

```typescript
// In webhook/route.ts
import { WhatsAppProcessorV2 } from '@/lib/whatsapp/processor-v2'

const processor = new WhatsAppProcessorV2({
  organizationId,
  supabase
})

await processor.initialize() // Creates channel entity
await processor.processMessage(message)
```

### 2. Update Display Components

Use the new API endpoint that reads from the canonical structure:

```typescript
// Fetch messages with full relationship data
const response = await fetch('/api/v1/whatsapp/messages-v2')
```

### 3. Data Migration Script (Optional)

If you have existing messages in the old format, you can migrate them:

```sql
-- Example migration approach (adjust based on your data)
-- 1. Create customer entities from existing conversations
-- 2. Create channel entity for your WABA number
-- 3. Convert existing messages to transactions with proper relationships
-- 4. Move metadata to core_dynamic_data
```

## Benefits of Canonical Architecture

1. **Universal Patterns**: Same structure works for SMS, Email, Slack, etc.
2. **Infinite Extensibility**: Add fields via dynamic_data without schema changes
3. **Perfect Audit Trail**: All relationships tracked with timestamps
4. **Multi-Channel Support**: Easy to add new communication channels
5. **Advanced Analytics**: Query patterns work across all communication types

## Testing the Migration

1. Access the canonical viewer: `/salon/whatsapp-canonical`
2. Send test messages to verify proper storage
3. Check that all relationships are created correctly
4. Verify dynamic data is properly stored

## Rollback Plan

The old and new systems can run in parallel during migration:
- Old endpoints: `/api/v1/whatsapp/webhook`
- New endpoints: `/api/v1/whatsapp/webhook-v2`

Switch back by updating the webhook URL in WhatsApp Business API settings.