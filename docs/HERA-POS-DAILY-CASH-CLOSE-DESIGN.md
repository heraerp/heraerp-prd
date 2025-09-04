# HERA POS Daily Cash Close & Card Authorization Design
**Smart Code: HERA.POS.DAILY.CASH.CLOSE.DESIGN.v1**

## Overview
Complete POS daily cash close implementation with card authorization capture using only HERA's six sacred tables.

## Sacred Tables Usage

### 1. core_entities (WHAT)
```sql
-- Register Entity
{
  entity_type: 'register',
  entity_name: 'Register 1 - Main',
  entity_code: 'REG-001',
  smart_code: 'HERA.POS.REGISTER.MAIN.v1',
  organization_id: 'org-uuid'
}

-- Shift Entity
{
  entity_type: 'shift',
  entity_name: 'Shift 2025-01-15 Morning',
  entity_code: 'SHIFT-20250115-001',
  smart_code: 'HERA.POS.SHIFT.DAILY.v1',
  organization_id: 'org-uuid'
}

-- Tender Type Entity
{
  entity_type: 'tender_type',
  entity_name: 'Visa Card',
  entity_code: 'TENDER-VISA',
  smart_code: 'HERA.POS.TENDER.CARD.VISA.v1',
  organization_id: 'org-uuid'
}

-- Acquirer Profile Entity
{
  entity_type: 'acquirer_profile',
  entity_name: 'Network International',
  entity_code: 'ACQ-NETWORK',
  smart_code: 'HERA.POS.ACQUIRER.NETWORK.v1',
  organization_id: 'org-uuid'
}

-- Payment Intent Entity (for card auth anchoring)
{
  entity_type: 'payment_intent',
  entity_name: 'Card Auth PI-20250115-0001',
  entity_code: 'PI-20250115-0001',
  smart_code: 'HERA.POS.PAYMENT.INTENT.CARD.v1',
  organization_id: 'org-uuid'
}
```

### 2. core_relationships (WHY)
```sql
-- Register → Shift
{
  from_entity_id: 'shift-uuid',
  to_entity_id: 'register-uuid',
  relationship_type: 'assigned_to',
  smart_code: 'HERA.POS.REL.SHIFT.REGISTER.v1'
}

-- Shift → Staff
{
  from_entity_id: 'shift-uuid',
  to_entity_id: 'staff-uuid',
  relationship_type: 'operated_by',
  smart_code: 'HERA.POS.REL.SHIFT.OPERATOR.v1'
}

-- Sale → Payment Intent
{
  from_entity_id: 'sale-txn-uuid',
  to_entity_id: 'payment-intent-uuid',
  relationship_type: 'has_payment',
  smart_code: 'HERA.POS.REL.SALE.PAYMENT.v1'
}

-- Card Batch → Payment Intents
{
  from_entity_id: 'batch-txn-uuid',
  to_entity_id: 'payment-intent-uuid',
  relationship_type: 'includes_auth',
  smart_code: 'HERA.POS.REL.BATCH.AUTH.v1'
}
```

### 3. core_dynamic_data (HOW)
```sql
-- Payment Intent Status
{
  entity_id: 'payment-intent-uuid',
  field_name: 'status',
  field_value_text: 'authorized',
  smart_code: 'HERA.POS.DYN.PAYMENT.STATUS.v1'
}

-- Authorization Details
{
  entity_id: 'payment-intent-uuid',
  field_name: 'auth_id',
  field_value_text: 'AUTH-123456',
  smart_code: 'HERA.POS.DYN.AUTH.ID.v1'
}

-- Register Float Amount
{
  entity_id: 'register-uuid',
  field_name: 'float_amount',
  field_value_number: 500.00,
  smart_code: 'HERA.POS.DYN.REGISTER.FLOAT.v1'
}
```

### 4. universal_transactions (WHEN)

#### SHIFT.OPEN Transaction
```json
{
  "transaction_type": "SHIFT_OPEN",
  "transaction_code": "SHF-20250115-0001",
  "smart_code": "HERA.POS.SHIFT.OPEN.v1",
  "organization_id": "org-uuid",
  "from_entity_id": "register-uuid",
  "to_entity_id": "staff-uuid",
  "transaction_date": "2025-01-15T06:00:00Z",
  "total_amount": 500.00,
  "fiscal_year": 2025,
  "fiscal_period": 1,
  "posting_period_code": "2025-01",
  "business_context": {
    "register_id": "REG-001",
    "shift_id": "SHIFT-20250115-001",
    "operator_id": "STAFF-001",
    "terminal_id": "TERM-001",
    "opening_float": 500.00
  },
  "metadata": {
    "shift_type": "morning",
    "expected_duration": "8h",
    "location": "main_store"
  }
}
```

#### POS.SALE.RECEIPT Transaction (with card authorization)
```json
{
  "transaction_type": "POS_SALE",
  "transaction_code": "RCP-20250115-0042",
  "smart_code": "HERA.POS.SALE.RECEIPT.v1",
  "organization_id": "org-uuid",
  "from_entity_id": "customer-uuid",
  "to_entity_id": "register-uuid",
  "transaction_date": "2025-01-15T10:30:00Z",
  "total_amount": 157.50,
  "fiscal_year": 2025,
  "fiscal_period": 1,
  "posting_period_code": "2025-01",
  "business_context": {
    "register_id": "REG-001",
    "shift_id": "SHIFT-20250115-001",
    "receipt_no": "R-000042",
    "customer_id": "CUST-WALK-IN",
    "staff_id": "STAFF-001",
    "terminal_id": "TERM-001"
  },
  "metadata": {
    "channel": "in_store",
    "payment_methods": ["card"],
    "items_count": 3
  }
}
```

#### CASH.MOVEMENT Transaction
```json
{
  "transaction_type": "CASH_MOVEMENT",
  "transaction_code": "CASH-20250115-DROP-001",
  "smart_code": "HERA.POS.CASH.MOVEMENT.DROP.v1",
  "organization_id": "org-uuid",
  "from_entity_id": "register-uuid",
  "to_entity_id": "safe-uuid",
  "transaction_date": "2025-01-15T12:00:00Z",
  "total_amount": -1000.00,
  "fiscal_year": 2025,
  "fiscal_period": 1,
  "posting_period_code": "2025-01",
  "business_context": {
    "register_id": "REG-001",
    "shift_id": "SHIFT-20250115-001",
    "movement_type": "drop",
    "reason": "excess_cash",
    "performed_by": "STAFF-001"
  },
  "metadata": {
    "denomination_breakdown": {
      "100": 8,
      "50": 4
    },
    "witness": "STAFF-002"
  }
}
```

#### SHIFT.CLOSE Transaction
```json
{
  "transaction_type": "SHIFT_CLOSE",
  "transaction_code": "SHF-CLOSE-20250115-0001",
  "smart_code": "HERA.POS.SHIFT.CLOSE.v1",
  "organization_id": "org-uuid",
  "from_entity_id": "register-uuid",
  "to_entity_id": "staff-uuid",
  "transaction_date": "2025-01-15T14:00:00Z",
  "total_amount": 2500.00,
  "fiscal_year": 2025,
  "fiscal_period": 1,
  "posting_period_code": "2025-01",
  "business_context": {
    "register_id": "REG-001",
    "shift_id": "SHIFT-20250115-001",
    "operator_id": "STAFF-001",
    "terminal_id": "TERM-001",
    "cash_expected": 2480.00,
    "cash_counted": 2500.00,
    "variance": 20.00,
    "sales_count": 42,
    "void_count": 2
  },
  "metadata": {
    "close_reason": "end_of_shift",
    "duration_hours": 8,
    "break_minutes": 30
  }
}
```

#### POS.CARD.BATCH Transaction
```json
{
  "transaction_type": "CARD_BATCH",
  "transaction_code": "BATCH-20250115-NETWORK-001",
  "smart_code": "HERA.POS.CARD.BATCH.v1",
  "organization_id": "org-uuid",
  "from_entity_id": "acquirer-uuid",
  "to_entity_id": "register-uuid",
  "transaction_date": "2025-01-15T23:00:00Z",
  "total_amount": 5250.00,
  "fiscal_year": 2025,
  "fiscal_period": 1,
  "posting_period_code": "2025-01",
  "business_context": {
    "batch_id": "BATCH-NETWORK-20250115-001",
    "acquirer_id": "ACQ-NETWORK",
    "merchant_id": "MID-1234567",
    "terminal_id": "TERM-001",
    "gateway": "network_international",
    "auth_count": 28,
    "total_sales": 5350.00,
    "total_refunds": 100.00,
    "net_amount": 5250.00
  },
  "metadata": {
    "batch_status": "submitted",
    "settlement_date": "2025-01-16",
    "currency": "AED"
  }
}
```

### 5. universal_transaction_lines (DETAILS)

#### Sale Transaction Lines with Card Payment
```json
[
  {
    "line_number": 1,
    "line_type": "ITEM",
    "description": "Premium Hair Cut",
    "quantity": 1,
    "unit_amount": 120.00,
    "line_amount": 120.00,
    "smart_code": "HERA.POS.SALE.LINE.ITEM.v1",
    "line_data": {
      "product_id": "PROD-001",
      "product_code": "SRV-HAIRCUT",
      "category": "services"
    }
  },
  {
    "line_number": 2,
    "line_type": "ITEM",
    "description": "Hair Styling Product",
    "quantity": 1,
    "unit_amount": 30.00,
    "line_amount": 30.00,
    "smart_code": "HERA.POS.SALE.LINE.ITEM.v1",
    "line_data": {
      "product_id": "PROD-002",
      "product_code": "PRD-STYLE-GEL",
      "category": "products"
    }
  },
  {
    "line_number": 3,
    "line_type": "TAX",
    "description": "UAE VAT 5%",
    "quantity": 1,
    "unit_amount": 7.50,
    "line_amount": 7.50,
    "smart_code": "HERA.POS.SALE.LINE.TAX.VAT.v1",
    "line_data": {
      "tax_rate": 0.05,
      "tax_code": "UAE-VAT-5",
      "taxable_amount": 150.00
    }
  },
  {
    "line_number": 4,
    "line_type": "PAYMENT",
    "description": "Visa Card Payment",
    "quantity": 1,
    "unit_amount": 157.50,
    "line_amount": 157.50,
    "smart_code": "HERA.POS.SALE.LINE.PAYMENT.CARD.v1",
    "line_data": {
      "payment_method": "visa_card",
      "authorization_id": "AUTH-123456",
      "gateway": "network_international",
      "acquirer": "ACQ-NETWORK",
      "terminal_id": "TERM-001",
      "merchant_id": "MID-1234567",
      "card_last_four": "1234",
      "card_brand": "visa",
      "entry_mode": "chip",
      "approval_code": "APP-789"
    }
  }
]
```

#### Shift Close Lines
```json
[
  {
    "line_number": 1,
    "line_type": "CASH_EXPECTED",
    "description": "Expected Cash Balance",
    "quantity": 1,
    "unit_amount": 2480.00,
    "line_amount": 2480.00,
    "smart_code": "HERA.POS.SHIFT.LINE.CASH.EXPECTED.v1",
    "line_data": {
      "calculation": "opening_float + cash_sales - drops + pickups",
      "opening_float": 500.00,
      "cash_sales": 3200.00,
      "drops": 1220.00,
      "pickups": 0
    }
  },
  {
    "line_number": 2,
    "line_type": "CASH_COUNTED",
    "description": "Actual Cash Counted",
    "quantity": 1,
    "unit_amount": 2500.00,
    "line_amount": 2500.00,
    "smart_code": "HERA.POS.SHIFT.LINE.CASH.COUNTED.v1",
    "line_data": {
      "denomination_breakdown": {
        "200": 10,
        "100": 4,
        "50": 2,
        "20": 0,
        "10": 0,
        "5": 0,
        "1": 0
      },
      "counted_by": "STAFF-001",
      "verified_by": "STAFF-002"
    }
  },
  {
    "line_number": 3,
    "line_type": "OVER_SHORT",
    "description": "Cash Over",
    "quantity": 1,
    "unit_amount": 20.00,
    "line_amount": 20.00,
    "smart_code": "HERA.POS.SHIFT.LINE.OVER.v1",
    "line_data": {
      "variance_type": "over",
      "variance_percentage": 0.81,
      "within_tolerance": true,
      "tolerance_limit": 50.00
    }
  }
]
```

## SQL Snippets

### Expected vs Counted Cash
```sql
-- Get expected vs counted cash for a shift
WITH shift_cash AS (
  SELECT 
    t.id as shift_id,
    t.business_context->>'shift_id' as shift_code,
    -- Opening float
    COALESCE((
      SELECT tl.line_amount 
      FROM universal_transaction_lines tl 
      WHERE tl.transaction_id = (
        SELECT id FROM universal_transactions 
        WHERE smart_code = 'HERA.POS.SHIFT.OPEN.v1'
        AND business_context->>'shift_id' = t.business_context->>'shift_id'
      )
      LIMIT 1
    ), 0) as opening_float,
    -- Cash sales
    COALESCE((
      SELECT SUM(tl.line_amount)
      FROM universal_transaction_lines tl
      INNER JOIN universal_transactions sale ON tl.transaction_id = sale.id
      WHERE sale.smart_code = 'HERA.POS.SALE.RECEIPT.v1'
      AND sale.business_context->>'shift_id' = t.business_context->>'shift_id'
      AND tl.line_type = 'PAYMENT'
      AND tl.line_data->>'payment_method' = 'cash'
    ), 0) as cash_sales,
    -- Drops
    COALESCE((
      SELECT SUM(t2.total_amount)
      FROM universal_transactions t2
      WHERE t2.smart_code = 'HERA.POS.CASH.MOVEMENT.DROP.v1'
      AND t2.business_context->>'shift_id' = t.business_context->>'shift_id'
    ), 0) as cash_drops,
    -- Expected
    (
      SELECT tl.line_amount
      FROM universal_transaction_lines tl
      WHERE tl.transaction_id = t.id
      AND tl.line_type = 'CASH_EXPECTED'
    ) as expected_cash,
    -- Counted
    (
      SELECT tl.line_amount
      FROM universal_transaction_lines tl
      WHERE tl.transaction_id = t.id
      AND tl.line_type = 'CASH_COUNTED'
    ) as counted_cash,
    -- Variance
    (
      SELECT tl.line_amount
      FROM universal_transaction_lines tl
      WHERE tl.transaction_id = t.id
      AND tl.line_type = 'OVER_SHORT'
    ) as variance
  FROM universal_transactions t
  WHERE t.smart_code = 'HERA.POS.SHIFT.CLOSE.v1'
  AND t.organization_id = ?
  AND t.transaction_date::date = ?
)
SELECT 
  shift_code,
  opening_float,
  cash_sales,
  cash_drops,
  expected_cash,
  counted_cash,
  variance,
  CASE 
    WHEN variance > 0 THEN 'OVER'
    WHEN variance < 0 THEN 'SHORT'
    ELSE 'BALANCED'
  END as variance_type
FROM shift_cash;
```

### Unsettled Card Authorizations
```sql
-- Get unsettled card authorizations
SELECT 
  pi.entity_code as payment_intent_id,
  pi.created_at as auth_date,
  sale.transaction_code as receipt_no,
  tl.line_amount as auth_amount,
  tl.line_data->>'authorization_id' as auth_id,
  tl.line_data->>'gateway' as gateway,
  tl.line_data->>'acquirer' as acquirer,
  tl.line_data->>'merchant_id' as merchant_id,
  COALESCE(dd.field_value_text, 'pending') as auth_status
FROM core_entities pi
INNER JOIN core_relationships rel ON rel.to_entity_id = pi.id
INNER JOIN universal_transactions sale ON sale.id = rel.from_entity_id
INNER JOIN universal_transaction_lines tl ON tl.transaction_id = sale.id
LEFT JOIN core_dynamic_data dd ON dd.entity_id = pi.id 
  AND dd.field_name = 'status'
WHERE pi.entity_type = 'payment_intent'
AND pi.smart_code = 'HERA.POS.PAYMENT.INTENT.CARD.v1'
AND sale.smart_code = 'HERA.POS.SALE.RECEIPT.v1'
AND tl.line_type = 'PAYMENT'
AND tl.line_data->>'payment_method' LIKE '%card%'
AND NOT EXISTS (
  -- Not yet batched
  SELECT 1 FROM core_relationships batch_rel
  WHERE batch_rel.to_entity_id = pi.id
  AND batch_rel.relationship_type = 'includes_auth'
)
AND pi.organization_id = ?
AND sale.transaction_date::date = ?
ORDER BY sale.transaction_date;
```

### VAT Totals Per Period
```sql
-- Get VAT totals for a period
SELECT 
  t.posting_period_code,
  COUNT(DISTINCT t.id) as transaction_count,
  SUM(
    CASE 
      WHEN tl.line_type = 'TAX' 
      AND tl.smart_code LIKE '%VAT%'
      THEN tl.line_amount 
      ELSE 0 
    END
  ) as total_vat_collected,
  SUM(
    CASE 
      WHEN tl.line_type = 'TAX' 
      AND tl.smart_code LIKE '%VAT%'
      THEN (tl.line_data->>'taxable_amount')::numeric
      ELSE 0 
    END
  ) as total_taxable_sales,
  -- Group by tax rate
  tl.line_data->>'tax_rate' as vat_rate,
  COUNT(DISTINCT t.id) FILTER (
    WHERE tl.line_type = 'TAX' 
    AND tl.smart_code LIKE '%VAT%'
  ) as transactions_with_vat
FROM universal_transactions t
INNER JOIN universal_transaction_lines tl ON tl.transaction_id = t.id
WHERE t.smart_code = 'HERA.POS.SALE.RECEIPT.v1'
AND t.organization_id = ?
AND t.posting_period_code = ?
GROUP BY t.posting_period_code, tl.line_data->>'tax_rate'
ORDER BY t.posting_period_code, vat_rate;
```

## Pseudocode for EOD Automation

```typescript
// EOD Automation Process
async function runEndOfDayProcess(registerId: string, date: Date) {
  try {
    // 1. Check all shifts are closed
    const openShifts = await getOpenShifts(registerId, date)
    if (openShifts.length > 0) {
      throw new Error('Cannot run EOD with open shifts')
    }
    
    // 2. Gather all cash movements for the day
    const cashMovements = await getCashMovements(registerId, date)
    const totalCashSales = cashMovements.sales
    const totalDrops = cashMovements.drops
    const totalPickups = cashMovements.pickups
    const netCash = cashMovements.opening + totalCashSales - totalDrops + totalPickups
    
    // 3. Process card authorizations by acquirer
    const cardAuths = await getUnsettledCardAuths(registerId, date)
    const authsByAcquirer = groupBy(cardAuths, 'acquirer')
    
    // 4. Create card batches for each acquirer
    for (const [acquirer, auths] of Object.entries(authsByAcquirer)) {
      const batchTx = await createTransaction({
        transaction_type: 'CARD_BATCH',
        smart_code: 'HERA.POS.CARD.BATCH.v1',
        total_amount: sum(auths, 'amount'),
        business_context: {
          batch_id: generateBatchId(acquirer, date),
          acquirer_id: acquirer,
          auth_count: auths.length,
          merchant_id: getMerchantId(acquirer),
          terminal_id: registerId
        }
      })
      
      // Link batch to payment intents
      for (const auth of auths) {
        await createRelationship({
          from_entity_id: batchTx.id,
          to_entity_id: auth.payment_intent_id,
          relationship_type: 'includes_auth',
          smart_code: 'HERA.POS.REL.BATCH.AUTH.v1'
        })
        
        // Update payment intent status
        await updateDynamicData(auth.payment_intent_id, 'status', 'batched')
      }
    }
    
    // 5. Create EOD settlement transaction
    const eodTx = await createTransaction({
      transaction_type: 'EOD_SETTLEMENT',
      smart_code: 'HERA.POS.EOD.SETTLEMENT.v1',
      total_amount: getTotalSales(registerId, date),
      business_context: {
        register_id: registerId,
        business_date: date,
        shift_count: getShiftCount(registerId, date),
        total_transactions: getTransactionCount(registerId, date),
        cash_final: netCash,
        card_batches: Object.keys(authsByAcquirer).length
      },
      metadata: {
        generated_at: new Date(),
        generated_by: 'system',
        reports: ['z_report', 'vat_summary', 'payment_summary']
      }
    })
    
    // 6. Create EOD transaction lines with summary
    await createTransactionLines(eodTx.id, [
      {
        line_type: 'SALES_GROSS',
        description: 'Gross Sales',
        line_amount: getTotalSales(registerId, date),
        smart_code: 'HERA.POS.EOD.LINE.SALES.GROSS.v1'
      },
      {
        line_type: 'TAX_COLLECTED',
        description: 'VAT Collected',
        line_amount: getTotalVAT(registerId, date),
        smart_code: 'HERA.POS.EOD.LINE.TAX.VAT.v1'
      },
      {
        line_type: 'PAYMENT_CASH',
        description: 'Cash Payments',
        line_amount: totalCashSales,
        smart_code: 'HERA.POS.EOD.LINE.PAYMENT.CASH.v1'
      },
      {
        line_type: 'PAYMENT_CARD',
        description: 'Card Payments',
        line_amount: getTotalCardSales(registerId, date),
        smart_code: 'HERA.POS.EOD.LINE.PAYMENT.CARD.v1'
      },
      {
        line_type: 'VARIANCE_TOTAL',
        description: 'Total Cash Variance',
        line_amount: getTotalVariance(registerId, date),
        smart_code: 'HERA.POS.EOD.LINE.VARIANCE.v1'
      }
    ])
    
    // 7. Generate Z Report
    const zReport = await generateZReport(registerId, date, eodTx.id)
    
    // 8. Lock the business date
    await updateDynamicData(registerId, 'last_eod_date', date.toISOString())
    await updateDynamicData(registerId, 'eod_status', 'completed')
    
    return {
      success: true,
      eod_transaction_id: eodTx.id,
      z_report: zReport,
      cash_final: netCash,
      card_batches: Object.keys(authsByAcquirer).length
    }
    
  } catch (error) {
    // Log error and rollback if needed
    await createTransaction({
      transaction_type: 'EOD_ERROR',
      smart_code: 'HERA.POS.EOD.ERROR.v1',
      metadata: {
        error: error.message,
        attempted_at: new Date()
      }
    })
    throw error
  }
}

// Helper function to generate Z Report
async function generateZReport(registerId: string, date: Date, eodTxId: string) {
  const report = {
    report_type: 'Z_REPORT',
    register_id: registerId,
    business_date: date,
    generated_at: new Date(),
    
    // Sales Summary
    sales: {
      gross_sales: await getTotalSales(registerId, date),
      net_sales: await getNetSales(registerId, date),
      transaction_count: await getTransactionCount(registerId, date),
      average_ticket: await getAverageTicket(registerId, date),
      void_count: await getVoidCount(registerId, date),
      refund_count: await getRefundCount(registerId, date)
    },
    
    // Payment Summary
    payments: {
      cash: await getCashPayments(registerId, date),
      card: await getCardPayments(registerId, date),
      digital_wallet: await getDigitalPayments(registerId, date),
      total: await getTotalPayments(registerId, date)
    },
    
    // Tax Summary
    tax: {
      vat_collected: await getVATCollected(registerId, date),
      taxable_sales: await getTaxableSales(registerId, date),
      exempt_sales: await getExemptSales(registerId, date)
    },
    
    // Cash Management
    cash: {
      opening_balance: await getOpeningCash(registerId, date),
      cash_sales: await getCashSales(registerId, date),
      drops: await getCashDrops(registerId, date),
      pickups: await getCashPickups(registerId, date),
      expected_closing: await getExpectedCash(registerId, date),
      actual_closing: await getActualCash(registerId, date),
      variance: await getCashVariance(registerId, date)
    },
    
    // Staff Summary
    staff: {
      operators: await getUniqueOperators(registerId, date),
      shifts: await getShiftCount(registerId, date),
      average_sales_per_operator: await getAvgSalesPerOperator(registerId, date)
    }
  }
  
  // Store Z Report as entity
  await createEntity({
    entity_type: 'report',
    entity_name: `Z Report ${date.toISOString().split('T')[0]}`,
    entity_code: `Z-${registerId}-${date.toISOString().split('T')[0]}`,
    smart_code: 'HERA.POS.REPORT.Z.v1',
    metadata: report
  })
  
  return report
}
```

## Z Report Format

```json
{
  "report_type": "Z_REPORT",
  "register_id": "REG-001",
  "business_date": "2025-01-15",
  "generated_at": "2025-01-16T00:15:00Z",
  "sales": {
    "gross_sales": 12500.00,
    "net_sales": 11900.00,
    "transaction_count": 142,
    "average_ticket": 88.03,
    "void_count": 3,
    "refund_count": 2
  },
  "payments": {
    "cash": 3200.00,
    "card": 8700.00,
    "digital_wallet": 600.00,
    "total": 12500.00
  },
  "tax": {
    "vat_collected": 595.24,
    "taxable_sales": 11904.76,
    "exempt_sales": 0.00
  },
  "cash": {
    "opening_balance": 500.00,
    "cash_sales": 3200.00,
    "drops": 1220.00,
    "pickups": 0.00,
    "expected_closing": 2480.00,
    "actual_closing": 2500.00,
    "variance": 20.00
  },
  "card_batches": [
    {
      "acquirer": "Network International",
      "batch_id": "BATCH-NETWORK-20250115-001",
      "auth_count": 62,
      "total_amount": 8700.00,
      "status": "submitted"
    }
  ],
  "staff": {
    "operators": ["STAFF-001", "STAFF-002"],
    "shifts": 2,
    "average_sales_per_operator": 6250.00
  }
}
```

## Variance Summary Table

```sql
-- Daily variance summary across all registers
CREATE VIEW pos_daily_variance AS
SELECT 
  DATE(t.transaction_date) as business_date,
  ce.entity_code as register_code,
  ce.entity_name as register_name,
  COUNT(DISTINCT t.business_context->>'shift_id') as shift_count,
  SUM(
    CASE 
      WHEN tl.line_type = 'CASH_EXPECTED' 
      THEN tl.line_amount 
      ELSE 0 
    END
  ) as total_expected,
  SUM(
    CASE 
      WHEN tl.line_type = 'CASH_COUNTED' 
      THEN tl.line_amount 
      ELSE 0 
    END
  ) as total_counted,
  SUM(
    CASE 
      WHEN tl.line_type = 'OVER_SHORT' 
      THEN tl.line_amount 
      ELSE 0 
    END
  ) as total_variance,
  CASE 
    WHEN SUM(CASE WHEN tl.line_type = 'OVER_SHORT' THEN tl.line_amount ELSE 0 END) > 0 
    THEN 'OVER'
    WHEN SUM(CASE WHEN tl.line_type = 'OVER_SHORT' THEN tl.line_amount ELSE 0 END) < 0 
    THEN 'SHORT'
    ELSE 'BALANCED'
  END as variance_status,
  ABS(
    SUM(CASE WHEN tl.line_type = 'OVER_SHORT' THEN tl.line_amount ELSE 0 END) /
    NULLIF(SUM(CASE WHEN tl.line_type = 'CASH_EXPECTED' THEN tl.line_amount ELSE 0 END), 0) * 100
  ) as variance_percentage
FROM universal_transactions t
INNER JOIN universal_transaction_lines tl ON tl.transaction_id = t.id
INNER JOIN core_entities ce ON ce.id = t.from_entity_id
WHERE t.smart_code = 'HERA.POS.SHIFT.CLOSE.v1'
AND ce.entity_type = 'register'
GROUP BY DATE(t.transaction_date), ce.entity_code, ce.entity_name
ORDER BY business_date DESC, register_code;
```

## Key Implementation Notes

1. **Organization ID**: Every row carries organization_id for multi-tenant isolation
2. **Smart Codes**: All follow HERA.{MODULE}.{FUNCTION}.{TYPE}.v1 pattern
3. **No Schema Changes**: Uses only the six sacred tables
4. **JSON Columns**: business_context (headers), metadata (headers), line_data (lines)
5. **Fiscal Stamps**: fiscal_year, fiscal_period, posting_period_code on all headers
6. **Card Authorization**: Each card payment line stores complete auth details in line_data
7. **Payment Intent**: Optional but recommended for robust auth tracking
8. **Cash Movements**: Drops use negative amounts, pickups use positive
9. **Variance Tracking**: OVER_SHORT line type captures cash differences
10. **Batch Processing**: Groups auths by acquirer/gateway for efficient settlement
11. **Z Report**: Comprehensive daily summary stored as report entity
12. **EOD Automation**: Complete workflow from open to settlement

This design provides a complete, auditable POS cash close system with card authorization capture, all within HERA's universal architecture.