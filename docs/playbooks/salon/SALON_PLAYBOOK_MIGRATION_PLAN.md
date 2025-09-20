# SALON PLAYBOOK MIGRATION PLAN - Strangler Fig Pattern

## Overview

This plan outlines a low-risk migration strategy to transition the `/salon` app from direct database writes to the Universal Workflow Engine using playbooks/procedures, while keeping the existing UI intact.

## 🎯 Migration Principles

1. **UI Preservation**: Keep all React components, styling, and user experience unchanged
2. **Write-First Migration**: Replace write operations with playbook calls, leave reads as-is initially
3. **Feature Flag Control**: Per-organization, per-feature toggles for safe rollout
4. **Instant Rollback**: Legacy paths remain available behind feature flags
5. **Hair Talkz First**: Canary deployment with Hair Talkz organization

## 📋 Phase 0: Inventory & Classification

### Current Salon Routes Analysis

| Route Path | Type | Operations | Priority | Complexity |
|------------|------|------------|----------|------------|
| `/api/v1/salon/appointments` | READ/WRITE | List, Create, Update | HIGH | Medium |
| `/api/v1/salon/appointments/[id]` | READ/WRITE | Get, Update, Cancel | HIGH | Medium |
| `/api/v1/salon/customers` | READ/WRITE | List, Create, Update | MEDIUM | Low |
| `/api/v1/salon/customers/[id]` | READ/WRITE | Get, Update | MEDIUM | Low |
| `/api/v1/salon/pos/carts` | WRITE | Create, Update | HIGH | High |
| `/api/v1/salon/pos/carts/[id]/reprice` | WRITE | Reprice | HIGH | High |
| `/api/v1/salon/pos/checkout` | WRITE | Process Payment | CRITICAL | High |
| `/api/v1/salon/pos/sales` | READ | List Sales | LOW | Low |
| `/api/v1/salon/calendar` | READ | View Schedule | LOW | Low |
| `/api/v1/salon/whatsapp/send` | WRITE | Send Notification | MEDIUM | Medium |

### Feature Flag Structure

```typescript
// Feature flags per organization
const FEATURE_FLAGS = {
  playbook_mode: {
    appointments: false,    // HERA.SALON.APPOINTMENT.*
    customers: false,       // HERA.SALON.CUSTOMER.*
    pos_cart: false,       // HERA.SALON.POS.CART.*
    pos_checkout: false,   // HERA.SALON.POS.CHECKOUT.*
    whatsapp: false        // HERA.SALON.COMMS.WHATSAPP.*
  }
}
```

## 🔧 Phase 1: Playbook Adapter Implementation

### Core Adapter

```typescript
// lib/playbook-adapter.ts
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { generateCorrelationId } from '@/lib/correlation'
import { createHash } from 'crypto'

export interface PlaybookResult<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    correlation_id: string
    execution_time_ms: number
    procedure_version?: string
  }
}

export async function runPlaybook<T = any>(
  smartCode: string,
  payload: any,
  opts?: {
    idempotencyKey?: string
    organizationId?: string
    userId?: string
    timeout?: number
  }
): Promise<PlaybookResult<T>> {
  const startTime = Date.now()
  const supabase = await createSupabaseServerClient()
  
  // 1. Normalize smart code format (.v1 → .V1)
  const normalizedSmartCode = smartCode.toUpperCase().replace(/\.V(\d+)$/i, '.V$1')
  
  // 2. Generate or use correlation ID
  const correlationId = generateCorrelationId()
  
  // 3. Generate idempotency key if not provided
  const idempotencyKey = opts?.idempotencyKey || 
    createHash('sha256')
      .update(`${normalizedSmartCode}-${JSON.stringify(payload)}-${opts?.organizationId}`)
      .digest('hex')
      .substring(0, 16)
  
  // 4. Prepare procedure call
  const procedurePayload = {
    ...payload,
    organization_id: opts?.organizationId || payload.organization_id,
    user_id: opts?.userId || payload.user_id,
    correlation_id: correlationId,
    idempotency_key: idempotencyKey,
    request_source: 'playbook_adapter'
  }
  
  try {
    // 5. Call the procedure through Supabase RPC
    const { data, error } = await supabase.rpc(
      smartCode.toLowerCase().replace(/\./g, '_'), // Convert to function name
      procedurePayload
    )
    
    if (error) {
      return {
        success: false,
        error: {
          code: error.code || 'PROCEDURE_ERROR',
          message: error.message,
          details: error.details
        },
        metadata: {
          correlation_id: correlationId,
          execution_time_ms: Date.now() - startTime
        }
      }
    }
    
    return {
      success: true,
      data: data,
      metadata: {
        correlation_id: correlationId,
        execution_time_ms: Date.now() - startTime,
        procedure_version: data?._procedure_version
      }
    }
  } catch (error) {
    console.error(`Playbook execution failed for ${smartCode}:`, error)
    return {
      success: false,
      error: {
        code: 'EXECUTION_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error
      },
      metadata: {
        correlation_id: correlationId,
        execution_time_ms: Date.now() - startTime
      }
    }
  }
}

// Helper to check if playbook mode is enabled
export async function isPlaybookModeEnabled(
  feature: string,
  organizationId: string
): Promise<boolean> {
  const supabase = await createSupabaseServerClient()
  
  // Check organization-specific flag
  const { data } = await supabase
    .from('core_dynamic_data')
    .select('value_json')
    .eq('organization_id', organizationId)
    .eq('key_slug', `playbook_mode_${feature}`)
    .single()
  
  return data?.value_json === true
}

// Typed playbook functions for each domain
export const salonPlaybooks = {
  appointments: {
    create: (payload: CreateAppointmentPayload) => 
      runPlaybook<Appointment>('HERA.SALON.APPOINTMENT.CREATE.V1', payload),
    
    update: (payload: UpdateAppointmentPayload) => 
      runPlaybook<Appointment>('HERA.SALON.APPOINTMENT.UPDATE.V1', payload),
    
    cancel: (payload: CancelAppointmentPayload) => 
      runPlaybook<void>('HERA.SALON.APPOINTMENT.CANCEL.V1', payload)
  },
  
  pos: {
    createCart: (payload: CreateCartPayload) => 
      runPlaybook<Cart>('HERA.SALON.POS.CART.CREATE.V1', payload),
    
    repriceCart: (payload: RepriceCartPayload) => 
      runPlaybook<Cart>('HERA.SALON.POS.CART.REPRICE.V1', payload),
    
    checkout: (payload: CheckoutPayload) => 
      runPlaybook<Sale>('HERA.SALON.POS.CHECKOUT.PROCESS.V1', payload)
  },
  
  customers: {
    create: (payload: CreateCustomerPayload) => 
      runPlaybook<Customer>('HERA.SALON.CUSTOMER.CREATE.V1', payload),
    
    update: (payload: UpdateCustomerPayload) => 
      runPlaybook<Customer>('HERA.SALON.CUSTOMER.UPDATE.V1', payload)
  }
}
```

### Migration Pattern for Routes

```typescript
// Example: Migrating appointment creation
// /api/v1/salon/appointments/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { runPlaybook, isPlaybookModeEnabled } from '@/lib/playbook-adapter'
import { createAppointmentLegacy } from './legacy'

export async function POST(request: NextRequest) {
  const payload = await request.json()
  const { organizationId, userId } = await getAuthContext(request)
  
  // Check feature flag
  const usePlaybook = await isPlaybookModeEnabled('appointments', organizationId)
  
  if (usePlaybook) {
    // NEW: Playbook path
    const result = await runPlaybook(
      'HERA.SALON.APPOINTMENT.CREATE.V1',
      payload,
      {
        organizationId,
        userId,
        idempotencyKey: request.headers.get('Idempotency-Key') || undefined
      }
    )
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }
    
    return NextResponse.json(result.data, {
      headers: {
        'X-Correlation-ID': result.metadata?.correlation_id || ''
      }
    })
  } else {
    // LEGACY: Direct database path
    return createAppointmentLegacy(payload, { organizationId, userId })
  }
}
```

## 📝 Phase 2: Playbook Implementation

### Sample Playbook: Cart Repricing

```yaml
# /hera/procedures/HERA.SALON.POS.CART.REPRICE.V1.yml
smart_code: HERA.SALON.POS.CART.REPRICE.V1
intent: Reprice salon POS cart with current pricing rules and promotions
scope:
  in_scope:
    - retrieve cart and line items
    - apply current service pricing
    - calculate discounts and promotions
    - update cart totals
  out_of_scope:
    - payment processing
    - inventory updates
preconditions:
  - cart exists and is not checked out
  - organization has valid pricing configuration
inputs:
  required:
    - organization_id: uuid
    - cart_id: uuid
  optional:
    - promotion_codes: array
    - membership_id: uuid
happy_path:
  - step: load cart and line items
  - step: load current pricing rules
  - step: apply service-specific pricing
  - step: calculate membership discounts
  - step: apply promotion codes
  - step: update cart totals
  - step: return repriced cart
outputs:
  cart:
    id: uuid
    subtotal: number
    discount_amount: number
    tax_amount: number
    total_amount: number
    line_items: array
errors:
  - code: CART_NOT_FOUND
  - code: CART_ALREADY_CHECKED_OUT
  - code: INVALID_PROMOTION_CODE
```

### Implementation in Universal Tables

```sql
-- Cart stored as transaction
INSERT INTO universal_transactions (
  smart_code,
  transaction_type,
  transaction_status,
  organization_id,
  total_amount,
  metadata
) VALUES (
  'HERA.SALON.POS.CART.ACTIVE.V1',
  'cart',
  'active',
  $organization_id,
  0,
  jsonb_build_object(
    'customer_id', $customer_id,
    'stylist_id', $stylist_id,
    'created_by', $user_id
  )
);

-- Line items as transaction lines
INSERT INTO universal_transaction_lines (
  transaction_id,
  line_entity_id,  -- service entity
  quantity,
  unit_price,
  line_amount,
  smart_code,
  metadata
) VALUES (
  $cart_id,
  $service_entity_id,
  1,
  $service_price,
  $service_price,
  'HERA.SALON.POS.LINE.SERVICE.V1',
  jsonb_build_object(
    'service_duration_minutes', 30,
    'stylist_id', $stylist_id
  )
);
```

## 🚀 Phase 3: Rollout Strategy

### Week 1: Hair Talkz Canary
- Enable `playbook_mode.pos_cart` for Hair Talkz
- Monitor for 48 hours
- Validate cart operations work correctly
- Check performance metrics

### Week 2: Expand POS Features
- Enable `playbook_mode.pos_checkout` for Hair Talkz
- Add 2 more pilot salons
- Monitor payment processing closely

### Week 3: Appointments Migration
- Enable `playbook_mode.appointments` for pilot salons
- Test workflow triggers (confirmations, reminders)
- Validate calendar integration

### Week 4: Full Rollout
- Enable remaining features for all organizations
- Keep legacy paths available for 30 days
- Monitor and optimize based on usage patterns

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | < 200ms | p95 latency |
| Error Rate | < 0.1% | Failed requests / Total |
| Rollback Count | 0 | Number of feature flag reversions |
| Data Consistency | 100% | Validation checks pass rate |
| User Experience | No degradation | Customer feedback |

## 🛟 Rollback Plan

### Instant Rollback (< 30 seconds)
```typescript
// Disable feature flag for organization
await updateFeatureFlag('playbook_mode.pos_cart', organizationId, false)
```

### Monitoring During Rollback
- Verify traffic shifts back to legacy path
- Check for any in-flight operations
- Monitor error rates return to baseline
- Validate data consistency

## 🔍 Observability

### Required Logging
```typescript
// Log every playbook execution
logger.info('playbook_execution', {
  smart_code: normalizedSmartCode,
  organization_id: organizationId,
  correlation_id: correlationId,
  idempotency_key: idempotencyKey,
  execution_time_ms: executionTime,
  success: result.success,
  legacy_mode: !usePlaybook
})
```

### Dashboards to Create
1. **Migration Progress**: % of traffic on playbook vs legacy
2. **Performance Comparison**: Legacy vs Playbook response times
3. **Error Tracking**: Failures by smart code
4. **Feature Flag Status**: Current state per org/feature

## ✅ Pre-Migration Checklist

- [ ] All playbook procedures created and tested
- [ ] Feature flag system operational
- [ ] Monitoring dashboards configured
- [ ] Rollback procedures tested
- [ ] Hair Talkz notified of canary plan
- [ ] Support team briefed on changes
- [ ] Performance baselines captured

## 🎯 End State Vision

After successful migration:
1. All writes go through Universal Workflow Engine
2. Complete audit trail and correlation tracking
3. Workflow automation triggers enabled
4. Ready for read migration in Phase 4
5. Legacy code can be safely removed

This approach ensures zero disruption while gaining all benefits of the Universal Architecture!