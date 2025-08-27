# HERA Client SDK Usage Guide

The HERA Client SDK provides a production-ready TypeScript/JavaScript client for interacting with the HERA Ledger Engine. It includes automatic retry logic, idempotency support, and comprehensive error handling.

## Installation

```bash
# npm
npm install @hera/sdk

# yarn
yarn add @hera/sdk

# pnpm
pnpm add @hera/sdk
```

## Quick Start

```typescript
import { createLedgerClient } from '@hera/sdk';

// Initialize the client
const client = createLedgerClient({
  baseUrl: 'https://api.heraerp.com',
  organizationId: 'org-123',
  apiKey: 'sk_live_your_api_key'
});

// Simulate a journal entry
const simulation = await client.simulate({
  organization_id: 'org-123',
  event_smart_code: 'HERA.POS.SALE.v1',
  total_amount: 540,
  currency: 'AED',
  business_context: {
    org_unit: 'BR-01',
    staff_id: 'EMP-9',
    tip_amount: 40
  }
});

if (simulation.ok) {
  console.log('Simulation successful:', simulation.data);
  
  // Post the journal with automatic idempotency
  const result = await client.postWithIdempotency({
    ...simulation.data,
    simulate: false
  });
  
  if (result.ok) {
    console.log('Posted successfully:', result.data.transaction_id);
  }
}
```

## Configuration

### Full Configuration Options

```typescript
const client = createLedgerClient({
  // Required
  baseUrl: 'https://api.heraerp.com',
  organizationId: 'org-123',
  
  // Optional
  apiKey: 'sk_live_your_api_key',
  defaultHeaders: {
    'X-Custom-Header': 'value'
  },
  timeoutMs: 30000, // 30 seconds
  
  // Retry configuration
  retry: {
    maxAttempts: 3,
    baseDelayMs: 250,
    maxDelayMs: 4000
  },
  
  // Idempotency configuration
  idempotency: {
    storage: 'memory', // or 'local' for browser localStorage
    prefix: 'hera:extref:'
  },
  
  // Retry callback
  onRetry: ({ attempt, delay, error }) => {
    console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`);
  }
});
```

## Core Methods

### simulate(request: LedgerRequest): Promise<Result<SimulateResponse>>

Simulates a journal entry without persisting to the database. Use this to validate and preview journal entries.

```typescript
const result = await client.simulate({
  organization_id: 'org-123',
  event_smart_code: 'HERA.POS.SALE.ORDER.COMPLETE.v1',
  total_amount: 100.50,
  currency: 'USD',
  business_context: {
    order_id: 'ORDER-789',
    customer_id: 'CUST-456'
  }
});

if (result.ok) {
  console.log('Journal header:', result.data.header);
  console.log('Journal lines:', result.data.lines);
} else {
  console.error('Simulation failed:', result.error.message);
}
```

### post(request: LedgerRequest): Promise<Result<PostResponse>>

Posts a journal entry to the ledger. This persists the entry to the database.

```typescript
const result = await client.post({
  organization_id: 'org-123',
  event_smart_code: 'HERA.FIN.GL.JOURNAL.MANUAL.v1',
  total_amount: 1000,
  currency: 'EUR',
  external_reference: 'INV-2025-001' // Optional idempotency key
});

if (result.ok) {
  console.log('Transaction ID:', result.data.transaction_id);
} else {
  console.error('Post failed:', result.error.code, result.error.message);
}
```

### postWithIdempotency(request: LedgerRequest): Promise<Result<PostResponse>>

Posts a journal entry with automatic idempotency handling. If no `external_reference` is provided, one will be generated automatically.

```typescript
// First call - creates transaction
const result1 = await client.postWithIdempotency({
  organization_id: 'org-123',
  event_smart_code: 'HERA.POS.PAYMENT.RECEIVED.v1',
  total_amount: 250,
  currency: 'GBP',
  external_reference: 'PAYMENT-123' // Optional
});

// Second call with same reference - returns existing transaction
const result2 = await client.postWithIdempotency({
  organization_id: 'org-123',
  event_smart_code: 'HERA.POS.PAYMENT.RECEIVED.v1',
  total_amount: 250,
  currency: 'GBP',
  external_reference: 'PAYMENT-123'
});

// result2.meta.idempotent === true
// result2.data.transaction_id === result1.data.transaction_id
```

## Error Handling

The SDK uses a `Result<T>` type for all responses, making error handling explicit and type-safe.

```typescript
const result = await client.post(request);

if (result.ok) {
  // Success path
  const transactionId = result.data.transaction_id;
  showSuccess(`Posted: ${transactionId}`);
} else {
  // Error path
  const error = result.error;
  
  switch (error.code) {
    case 'E_UNBALANCED':
      showError('Journal is not balanced');
      break;
      
    case 'E_DIM_MISSING':
      const missing = error.details?.missingByLine[0].missing;
      showError(`Missing dimensions: ${missing.join(', ')}`);
      break;
      
    case 'E_PERIOD_CLOSED':
      showWarning('Period is closed - will retry automatically');
      break;
      
    default:
      showError(error.message);
  }
}
```

## Retry Behavior

The SDK automatically retries requests for specific error codes with exponential backoff and full jitter:

### Retryable Errors
- `E_PERIOD_CLOSED` (409) - Posting period temporarily closed
- `E_UPSTREAM` (502) - External service unavailable
- `E_INTERNAL` (500) - Temporary server error

### Retry Configuration

```typescript
const client = createLedgerClient({
  baseUrl: 'https://api.heraerp.com',
  organizationId: 'org-123',
  retry: {
    maxAttempts: 5,      // Try up to 5 times
    baseDelayMs: 500,    // Start with 500ms delay
    maxDelayMs: 10000    // Cap at 10 seconds
  },
  onRetry: ({ attempt, delay, error }) => {
    updateUI(`Retrying (${attempt}/5) in ${delay}ms...`);
  }
});
```

### Retry Backoff Formula

The SDK uses exponential backoff with full jitter:

```
delay = random(0, min(maxDelay, baseDelay * 2^attempt))
```

For example, with baseDelay=250ms and maxDelay=4000ms:
- Attempt 1: 0-250ms
- Attempt 2: 0-500ms
- Attempt 3: 0-1000ms
- Attempt 4: 0-2000ms
- Attempt 5: 0-4000ms

## Idempotency

Idempotency prevents duplicate transactions when retrying failed requests.

### External Reference Format

The SDK generates UUIDs for external references:
```
Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
Example: 550e8400-e29b-41d4-a716-446655440000
```

With namespace:
```
Format: namespace:xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
Example: order:550e8400-e29b-41d4-a716-446655440000
```

### Storage Options

```typescript
// In-memory storage (default)
const client = createLedgerClient({
  baseUrl: 'https://api.heraerp.com',
  organizationId: 'org-123',
  idempotency: {
    storage: 'memory'
  }
});

// Browser localStorage
const client = createLedgerClient({
  baseUrl: 'https://api.heraerp.com',
  organizationId: 'org-123',
  idempotency: {
    storage: 'local',
    prefix: 'myapp:refs:' // Custom prefix
  }
});
```

### Manual Idempotency Management

```typescript
import { makeExternalRef, IdempotencyManager } from '@hera/sdk';

// Generate reference
const ref = makeExternalRef({ namespace: 'invoice' });

// Manual management
const manager = new IdempotencyManager();
manager.remember(ref, 'txn-123');
const txnId = manager.recall(ref); // 'txn-123'
```

## Handling E_UPSTREAM Example

Here's a complete example showing how the SDK handles upstream errors with retries:

```typescript
let attemptCount = 0;

const client = createLedgerClient({
  baseUrl: 'https://api.heraerp.com',
  organizationId: 'org-123',
  retry: {
    maxAttempts: 3,
    baseDelayMs: 1000
  },
  onRetry: ({ attempt, delay, error }) => {
    attemptCount++;
    console.log(`Attempt ${attempt} failed with ${error.code}`);
    console.log(`Retrying in ${delay}ms...`);
  }
});

try {
  const result = await client.post({
    organization_id: 'org-123',
    event_smart_code: 'HERA.POS.SALE.v1',
    total_amount: 100,
    currency: 'USD'
  });
  
  if (result.ok) {
    console.log(`Success after ${attemptCount + 1} attempts`);
    console.log(`Transaction: ${result.data.transaction_id}`);
  }
} catch (error) {
  console.error('All retry attempts exhausted');
}
```

## Best Practices

### 1. Always Use Idempotency for Critical Operations

```typescript
// ✅ Good - prevents duplicates
const result = await client.postWithIdempotency({
  ...request,
  external_reference: `payment-${paymentId}`
});

// ❌ Risky - could create duplicates on retry
const result = await client.post(request);
```

### 2. Handle Both Success and Error Cases

```typescript
const result = await client.postWithIdempotency(request);

if (result.ok) {
  if (result.meta?.idempotent) {
    showInfo('Transaction already processed');
  } else {
    showSuccess('Transaction created');
  }
  navigateToReceipt(result.data.transaction_id);
} else {
  handleError(result.error);
}
```

### 3. Map Engine Errors to User-Friendly Messages

```typescript
function getErrorMessage(error: HeraError): string {
  const errorMessages: Record<HeraErrorCode, string> = {
    'E_ORG_REQUIRED': 'Please select an organization',
    'E_UNBALANCED': 'The journal entry is not balanced',
    'E_DIM_MISSING': 'Required information is missing',
    'E_PERIOD_CLOSED': 'The accounting period is closed',
    'E_NOT_FOUND': 'The specified account was not found',
    // ... other mappings
  };
  
  return errorMessages[error.code] || error.message;
}
```

### 4. Monitor Retry Behavior

```typescript
const client = createLedgerClient({
  baseUrl: 'https://api.heraerp.com',
  organizationId: 'org-123',
  onRetry: ({ attempt, delay, error }) => {
    // Log to monitoring service
    logger.warn('Ledger retry', {
      attempt,
      delay,
      errorCode: error.code,
      errorMessage: error.message
    });
    
    // Update UI
    setRetryStatus({
      isRetrying: true,
      attempt,
      nextRetryIn: delay
    });
  }
});
```

### 5. Set Appropriate Timeouts

```typescript
// For interactive operations
const client = createLedgerClient({
  baseUrl: 'https://api.heraerp.com',
  organizationId: 'org-123',
  timeoutMs: 10000 // 10 seconds
});

// For batch operations
const batchClient = createLedgerClient({
  baseUrl: 'https://api.heraerp.com',
  organizationId: 'org-123',
  timeoutMs: 60000 // 60 seconds
});
```

## TypeScript Support

The SDK is fully typed with TypeScript. All types are exported for use in your application:

```typescript
import type {
  LedgerRequest,
  SimulateResponse,
  PostResponse,
  Result,
  HeraError,
  HeraErrorCode
} from '@hera/sdk';

// Type-safe error handling
function isBalanceError(result: Result<any>): boolean {
  return !result.ok && result.error.code === 'E_UNBALANCED';
}

// Type-safe request building
const request: LedgerRequest = {
  organization_id: 'org-123',
  event_smart_code: 'HERA.POS.SALE.v1',
  total_amount: 100,
  currency: 'USD'
};
```

## Framework Integration

The SDK is framework-agnostic and works with any JavaScript environment that supports the Fetch API:

- ✅ Node.js 18+
- ✅ Deno
- ✅ Modern browsers
- ✅ React/Next.js
- ✅ Vue/Nuxt
- ✅ Angular
- ✅ Svelte/SvelteKit

### React Hook Example

```typescript
import { useState } from 'react';
import { createLedgerClient, type Result, type PostResponse } from '@hera/sdk';

function usePostJournal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const client = createLedgerClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL!,
    organizationId: useAuth().organizationId,
    apiKey: useAuth().apiKey
  });
  
  const postJournal = async (request: LedgerRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await client.postWithIdempotency(request);
      
      if (result.ok) {
        return result.data;
      } else {
        setError(result.error.message);
        return null;
      }
    } finally {
      setLoading(false);
    }
  };
  
  return { postJournal, loading, error };
}
```

## Version Information

Current SDK version: **0.1.0**

```typescript
import { SDK_VERSION } from '@hera/sdk';
console.log(`HERA SDK v${SDK_VERSION}`);
```