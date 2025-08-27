# HERA Ledger Engine Error Reference

## Overview

The HERA Ledger Engine uses a unified error system with consistent codes, HTTP mappings, and retry policies. All errors follow the `Result<T>` pattern for explicit error handling.

## Error Codes

### E_ORG_REQUIRED
**HTTP Status**: 400 Bad Request  
**Retryable**: No  
**When it triggers**: Organization ID is missing or invalid in the request  
**User action**: Include a valid UUID organization_id in the request  
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_ORG_REQUIRED",
    "message": "Organization ID is required",
    "retryable": false
  }
}
```

### E_SMART_CODE_REQUIRED  
**HTTP Status**: 400 Bad Request  
**Retryable**: No  
**When it triggers**: Required smart code is missing or has invalid format  
**User action**: Ensure all entities, transactions, and lines have valid smart codes  
**Format**: `HERA.INDUSTRY.MODULE.TYPE.SUBTYPE.v1`  
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_SMART_CODE_REQUIRED",
    "message": "Invalid smart code format",
    "details": { "providedCode": "INVALID" },
    "hint": "Use format: HERA.INDUSTRY.MODULE.TYPE.SUBTYPE.v1",
    "retryable": false
  }
}
```

### E_SCHEMA
**HTTP Status**: 404 Not Found  
**Retryable**: No  
**When it triggers**: No posting schema found for the event/organization combination  
**User action**: Configure a posting schema for this event type  
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_SCHEMA",
    "message": "No posting schema found for event HERA.POS.SALE.v1",
    "retryable": false
  }
}
```

### E_DIM_MISSING
**HTTP Status**: 422 Unprocessable Entity  
**Retryable**: No  
**When it triggers**: Required dimensions are missing from ledger lines  
**User action**: Add the required dimensions to all affected lines  
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_DIM_MISSING",
    "message": "Required dimensions are missing from ledger lines",
    "details": {
      "missingByLine": [
        { "lineIndex": 0, "missing": ["cost_center", "location"] }
      ],
      "requiredDimensions": ["cost_center", "location"]
    },
    "hint": "Ensure all lines have the required dimensions: cost_center, location",
    "retryable": false
  }
}
```

### E_TAX_PROFILE
**HTTP Status**: 424 Failed Dependency  
**Retryable**: No  
**When it triggers**: Tax profile not bound to organization or invalid  
**User action**: Bind a valid tax profile to the organization  
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_TAX_PROFILE",
    "message": "No tax profile bound to organization",
    "hint": "Use bind_tax_profile() to associate a tax profile",
    "retryable": false
  }
}
```

### E_RATE_RESOLUTION
**HTTP Status**: 422 Unprocessable Entity  
**Retryable**: No  
**When it triggers**: Tax rate could not be resolved for an item  
**User action**: Check tax category mappings and profile configuration  
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_RATE_RESOLUTION",
    "message": "Could not resolve tax rate for category 'unknown_category'",
    "details": { "category": "unknown_category", "profile": "AE_VAT" },
    "retryable": false
  }
}
```

### E_UNBALANCED
**HTTP Status**: 422 Unprocessable Entity  
**Retryable**: No  
**When it triggers**: Journal entry debits don't equal credits  
**User action**: Ensure total debits equal total credits for each currency  
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_UNBALANCED",
    "message": "Journal entry is not balanced",
    "details": {
      "imbalances": [{
        "currency": "USD",
        "debits": 100.00,
        "credits": 90.00,
        "difference": 10.00
      }],
      "tolerance": 0.005
    },
    "hint": "Ensure total debits equal total credits for each currency",
    "retryable": false
  }
}
```

### E_PERIOD_CLOSED
**HTTP Status**: 409 Conflict  
**Retryable**: Yes  
**When it triggers**: Attempting to post to a closed accounting period  
**User action**: Wait for period to open or post to a different period  
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_PERIOD_CLOSED",
    "message": "Posting period 2024-12 is closed",
    "details": {
      "periodCode": "2024-12",
      "status": "closed",
      "postingDate": "2024-12-15T00:00:00.000Z"
    },
    "hint": "Wait for the period to be opened or post to a different period",
    "retryable": true
  }
}
```

### E_NOT_FOUND
**HTTP Status**: 404 Not Found  
**Retryable**: No  
**When it triggers**: Referenced entity/account doesn't exist  
**User action**: Verify entity IDs and ensure accounts exist  
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_NOT_FOUND",
    "message": "Account not found",
    "hint": "Ensure the account entity exists and is accessible",
    "retryable": false
  }
}
```

### E_IDEMPOTENT
**HTTP Status**: 200 OK (Special case - treated as success)  
**Retryable**: No  
**When it triggers**: Duplicate external_reference detected  
**User action**: None - request already processed  
**Special handling**: Returns existing transaction_id with meta.idempotent = true  
**Example**:
```json
{
  "success": true,
  "data": {
    "transaction_id": "existing-transaction-id"
  },
  "meta": {
    "idempotent": true
  }
}
```

### E_GUARDRAIL
**HTTP Status**: 400 Bad Request  
**Retryable**: No  
**When it triggers**: Request violates business rules or guardrails  
**User action**: Fix the validation issue and retry  
**Common causes**:
- Invalid request format
- Business rule violations  
- Security constraints
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_GUARDRAIL",
    "message": "Invalid request",
    "details": {
      "issues": [{
        "path": "currency",
        "message": "Invalid ISO 4217 currency code"
      }]
    },
    "retryable": false
  }
}
```

### E_UPSTREAM
**HTTP Status**: 502 Bad Gateway  
**Retryable**: Yes  
**When it triggers**: External dependency failed (database, network, etc.)  
**User action**: Retry after delay (see Retry-After header)  
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_UPSTREAM",
    "message": "Database connection failed",
    "retryable": true
  }
}
```

### E_INTERNAL
**HTTP Status**: 500 Internal Server Error  
**Retryable**: Yes  
**When it triggers**: Unexpected error in the system  
**User action**: Retry after delay; contact support if persists  
**Example**:
```json
{
  "success": false,
  "error": {
    "code": "E_INTERNAL",
    "message": "An unexpected error occurred",
    "retryable": true
  }
}
```

## Retry Policy

Errors marked as retryable should be retried with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | 5 seconds |
| 2 | 10 seconds |
| 3 | 20 seconds |
| 4 | 40 seconds |
| 5+ | Stop retrying |

The `Retry-After` header indicates the minimum delay before retrying.

## Client Implementation Example

```typescript
async function postWithRetry(request: LedgerRequest, maxAttempts = 5): Promise<PostResponse> {
  let attempt = 0;
  let delay = 5000; // Start with 5 seconds

  while (attempt < maxAttempts) {
    attempt++;
    
    try {
      const response = await fetch('/api/ledger/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const result = await response.json();

      if (result.success) {
        // Handle idempotency
        if (result.meta?.idempotent) {
          console.log('Transaction already exists:', result.data.transaction_id);
        }
        return result.data;
      }

      // Check if retryable
      if (!result.error.retryable || attempt >= maxAttempts) {
        throw new Error(`${result.error.code}: ${result.error.message}`);
      }

      // Wait before retry
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay;
      
      console.log(`Retrying after ${waitTime}ms (attempt ${attempt}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      delay *= 2; // Exponential backoff
    } catch (error) {
      if (attempt >= maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  throw new Error('Max retry attempts exceeded');
}
```

## Best Practices

1. **Always check error.retryable** before implementing retry logic
2. **Use external_reference** for idempotency on critical operations
3. **Include organization_id** in all requests (multi-tenant safety)
4. **Validate smart codes** before submission to avoid E_SMART_CODE_REQUIRED
5. **Pre-validate journal balance** client-side to avoid E_UNBALANCED
6. **Cache tax profiles** to reduce E_TAX_PROFILE errors
7. **Monitor E_INTERNAL errors** - these indicate system issues
8. **Respect E_PERIOD_CLOSED** - don't retry immediately

## Error Context

Errors may include additional context to help with debugging:

```typescript
interface ErrorContext {
  organization_id?: string;     // Which org triggered the error
  event_smart_code?: string;    // The event being processed
  transaction_id?: string;      // Related transaction (if any)
  external_reference?: string;  // Idempotency key used
}
```

Use this context in logging and support tickets for faster resolution.