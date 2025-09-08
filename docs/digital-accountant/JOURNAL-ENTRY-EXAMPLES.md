# 🤖 HERA Digital Accountant - Journal Entry Examples

## 🔑 Required Fields for Journal Entry in HERA

### At the Header Level (universal_transactions)

From schema + guardrails:

- **organization_id** → Which tenant the posting belongs to
- **transaction_type** → e.g., `JOURNAL_ENTRY`, `SALE`, `PAYMENT`
- **smart_code** → Must follow HERA pattern (e.g., `HERA.ACCOUNTING.GL.JOURNAL.v1`)
- **transaction_date** → Serves as document date (business event date)
- **fiscal_year + fiscal_period** (or posting_period_code) → Which accounting period this belongs to
- **total_amount** → Journal total (debits = credits, enforced per currency)
- **Currency fields** if multi-currency: `transaction_currency_code`, `base_currency_code`, `exchange_rate`

### At the Line Level (universal_transaction_lines)

Required per guardrails:

- **organization_id**
- **transaction_id** → Link back to header
- **line_number** → Sequential
- **line_type** → `DEBIT` / `CREDIT` / `TAX` etc.
- **entity_id** → The account (from core_entities with ledger semantics)
- **smart_code** → Must reflect GL context (e.g., `HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1`)
- **line_amount** → Debit or credit amount

✅ **Guardrail rule**: GL lines must balance (sum debits = sum credits) per currency.

## 🤖 How the Digital Accountant Handles This

The Digital Accountant layer (natural language + AI posting agent) works like this:

1. **User input** (plain language):
   ```
   "Maya paid 450 for haircut"
   ```

2. **Event recognition**:
   - Recognizes as a revenue event + payment
   - Assigns smart codes:
     - `HERA.SALON.SALE.REVENUE.v1` (service income)
     - `HERA.ACCOUNTING.GL.PAYMENT.CASH.v1` (payment line)

3. **Auto-generation of Journal Entry**:
   - Creates header in `universal_transactions` with:
     - `transaction_type = JOURNAL_ENTRY`
     - `transaction_date = today` (document date)
     - `fiscal_period = current open period`
     - `total_amount = 450`
   - Creates lines in `universal_transaction_lines`:
     - Debit: Cash (450)
     - Credit: Service Revenue (450)

4. **Validation**:
   - Guardrail checks: organization isolation, smart code pattern, balanced debits/credits
   - Fiscal DNA checks: period is open (from fiscal_period rules)

5. **Posting**:
   - Entry is written to the ledger automatically
   - Audit trail fields (`metadata`, `ai_confidence`, `ai_insights`) capture how it was derived

## 🎯 Key Advantage vs SAP

In SAP you must manually enter document date + posting date.

In HERA, the Digital Accountant derives both automatically:
- `transaction_date` = event date
- `posting_period_code` = resolved from Fiscal DNA (open period rules)

If there's a mismatch (e.g., user wants to backdate), HERA will route to approval (`approval_required=true`).

---

# 📋 Concrete Examples

## 1️⃣ Minimal Cash Sale (No VAT) → Auto-Journal

### A. App emits a UniversalFinanceEvent
```json
{
  "organization_id": "3f3d6e4a-7a2f-4c2a-8a1e-12b3c4567890",
  "event_type": "SALE",
  "event_id": "evt_0001",
  "event_timestamp": "2025-09-08T10:15:00Z",
  "document": {
    "document_date": "2025-09-08",
    "reference": "POS-98431"
  },
  "parties": {
    "customer_id": "b21c2b1f-12e3-4d56-9abc-111111111111"
  },
  "amounts": {
    "currency": "GBP",
    "gross_amount": 450.00
  },
  "lines": [
    {
      "description": "Haircut (Maya)",
      "quantity": 1,
      "unit_amount": 450.00,
      "smart_code": "HERA.SALON.SALE.SERVICE.REVENUE.v1"
    }
  ],
  "posting": {
    "policy": "AUTO",
    "desired_period": "2025-09"
  },
  "metadata": {
    "source_app": "Salon POS",
    "captured_by": "assistant_nlu",
    "utterance": "Maya paid 450"
  }
}
```

### B. Digital Accountant resolves → GL journal (what HERA writes)

#### Header: universal_transactions (one row)
```json
{
  "organization_id": "3f3d6e4a-7a2f-4c2a-8a1e-12b3c4567890",
  "transaction_type": "JOURNAL_ENTRY",
  "transaction_date": "2025-09-08T10:15:00Z",
  "reference_number": "POS-98431",
  "smart_code": "HERA.ACCOUNTING.GL.JOURNAL.SALES.v1",
  "fiscal_year": 2025,
  "fiscal_period": 9,
  "posting_period_code": "2025-09",
  "transaction_currency_code": "GBP",
  "base_currency_code": "GBP",
  "exchange_rate": 1.0,
  "total_amount": 450.00,
  "ai_confidence": 0.96,
  "ai_insights": {
    "posting_recipe": "CASH_SALE_NO_TAX",
    "source_event_id": "evt_0001"
  },
  "business_context": {
    "customer_id": "b21c2b1f-12e3-4d56-9abc-111111111111"
  },
  "metadata": {
    "source_app": "Salon POS",
    "finance_dna_version": "v1"
  }
}
```

#### Lines: universal_transaction_lines (two rows)
```json
[
  {
    "organization_id": "3f3d6e4a-7a2f-4c2a-8a1e-12b3c4567890",
    "transaction_id": "<link-to-header>",
    "line_number": 1,
    "line_type": "DEBIT",
    "entity_id": "<account:Cash_on_Hand>",
    "description": "Cash received - POS-98431",
    "line_amount": 450.00,
    "smart_code": "HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.CASH.v1"
  },
  {
    "organization_id": "3f3d6e4a-7a2f-4c2a-8a1e-12b3c4567890",
    "transaction_id": "<link-to-header>",
    "line_number": 2,
    "line_type": "CREDIT",
    "entity_id": "<account:Service_Revenue>",
    "description": "Service revenue - Haircut",
    "line_amount": 450.00,
    "smart_code": "HERA.ACCOUNTING.COA.ACCOUNT.GL.REVENUE.SERVICE.v1"
  }
]
```

**✅ Balanced by construction** (debits == credits). If the period "2025-09" is closed, Digital Accountant flips `approval_required=true` on the header and queues an exception with options (repost to next open period / request reopen).

---

## 2️⃣ Sale with VAT (20%) and Card Payment

### A. Event
```json
{
  "organization_id": "3f3d6e4a-7a2f-4c2a-8a1e-12b3c4567890",
  "event_type": "SALE",
  "event_id": "evt_0002",
  "document": {
    "document_date": "2025-09-08",
    "reference": "POS-98432"
  },
  "amounts": {
    "currency": "GBP",
    "net_amount": 375.00,
    "tax_amount": 75.00,
    "gross_amount": 450.00,
    "tax_code": "UK.VAT.STD.20"
  },
  "payment": {
    "method": "CARD",
    "processor_ref": "cp_7f9a"
  },
  "lines": [
    {
      "description": "Haircut",
      "quantity": 1,
      "unit_amount": 375.00,
      "smart_code": "HERA.SALON.SALE.SERVICE.REVENUE.v1"
    }
  ],
  "posting": {
    "policy": "AUTO"
  }
}
```

### B. Resulting journal

#### Header similar to Example #1 (amounts/codes updated)

#### Lines (three rows)
```json
[
  {
    "line_number": 1,
    "line_type": "DEBIT",
    "entity_id": "<account:Card_Clearing>",
    "line_amount": 450.00,
    "smart_code": "HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.CARD_CLEARING.v1",
    "description": "Card clearing - POS-98432"
  },
  {
    "line_number": 2,
    "line_type": "CREDIT",
    "entity_id": "<account:Service_Revenue>",
    "line_amount": 375.00,
    "smart_code": "HERA.ACCOUNTING.COA.ACCOUNT.GL.REVENUE.SERVICE.v1",
    "description": "Net service revenue"
  },
  {
    "line_number": 3,
    "line_type": "CREDIT",
    "entity_id": "<account:VAT_Output_Tax>",
    "line_amount": 75.00,
    "smart_code": "HERA.ACCOUNTING.COA.ACCOUNT.GL.TAX.OUTPUT.VAT.v1",
    "description": "VAT 20% on POS-98432"
  }
]
```

---

## 3️⃣ Multi-Currency Example (Invoice in EUR, Base GBP)

### A. Event
```json
{
  "organization_id": "3f3d6e4a-7a2f-4c2a-8a1e-12b3c4567890",
  "event_type": "SALE_INVOICE",
  "event_id": "evt_0003",
  "document": {
    "document_date": "2025-09-07",
    "reference": "INV-2025-0912"
  },
  "amounts": {
    "currency": "EUR",
    "gross_amount": 1000.00
  },
  "fx": {
    "base_currency": "GBP",
    "rate": 0.85,
    "rate_date": "2025-09-07"
  },
  "posting": {
    "policy": "AUTO"
  }
}
```

### B. Header (key parts)
```json
{
  "transaction_currency_code": "EUR",
  "base_currency_code": "GBP",
  "exchange_rate": 0.85,
  "exchange_rate_date": "2025-09-07",
  "total_amount": 1000.00
}
```

### C. Lines (example 2-line revenue recognition)
- **Debit** Accounts Receivable (EUR 1,000)
- **Credit** Revenue (EUR 1,000)

Base reporting is derived via exchange fields; realized FX differences are handled on settlement events by the same DNA.

---

## 🧠 How the Digital Accountant (DA) Decides & Fills Fields

### 1. **Detect recipe from smart codes + event_type**
   - e.g., SALE + ...REVENUE... + payment.method=CARD → `CARD_SALE_VAT_OUTPUT` recipe

### 2. **Resolve accounts (Account Derivation Engine)**
   - Organization's COA + business rules:
     - Product family → revenue account
     - Tax_code → output VAT account
     - Payment method → card clearing

### 3. **Resolve period**
   - If `posting.desired_period` present and open → use it
   - Else choose current open fiscal period
   - If closed → mark `approval_required=true` and emit a clear exception message

### 4. **Assemble header**
   - Set `transaction_type="JOURNAL_ENTRY"`
   - `transaction_date=document_date`
   - Period fields, currencies, smart_code for the journal type
   - `ai_confidence`, `ai_insights`

### 5. **Assemble lines**
   - Create balanced DEBIT/CREDIT lines with:
     - Proper `entity_id` (account)
     - `line_type`, `line_amount`
     - Line-level smart_code

### 6. **Validate & post**
   - Ensure org isolation, smart code pattern
   - GL balance per currency
   - Persist to universal tables
   - Attach metadata & business_context for audit

---

## 📊 Quick SAP → HERA Mapping (Dates)

| SAP Field | HERA Field | Location |
|-----------|------------|----------|
| Document Date | `transaction_date` | Header |
| Posting Date | `fiscal_year` + `fiscal_period` + `posting_period_code` | Header |
| Optional explicit "other date" fields | Can live in `core_dynamic_data` | If you want both side-by-side for controls/audits |

---

## 🚀 Natural Language Examples for Salon

### Simple Cash Sale
**Input**: "Sarah paid 350 cash for hair color"

**Generated Journal**:
```
DR Cash                350.00
CR Service Revenue     350.00
```

### Sale with Product
**Input**: "Sold shampoo to Maya for 85, she paid by card"

**Generated Journal**:
```
DR Card Clearing       85.00
CR Product Revenue     85.00
```

### Commission Payment
**Input**: "Pay Sarah 40% commission on 2000 revenue"

**Generated Journal**:
```
DR Commission Expense  800.00
CR Commission Payable  800.00
```

### Expense Recording
**Input**: "Bought hair supplies from Beauty Depot for 450"

**Generated Journal**:
```
DR Salon Supplies      450.00
CR Accounts Payable    450.00
```

### Complex Transaction with VAT
**Input**: "Client paid 600 for full treatment package including 5% VAT"

**Generated Journal**:
```
DR Cash                600.00
CR Service Revenue     571.43
CR VAT Output Tax       28.57
```

---

## 💡 Key Benefits

1. **Zero Manual Entry**: Natural language → complete journal entry
2. **Automatic Validation**: Balanced entries, period checks, org isolation
3. **AI Intelligence**: Smart code assignment, account derivation, tax calculation
4. **Audit Trail**: Complete tracking of how each entry was derived
5. **Multi-Currency**: Automatic FX handling with base conversion
6. **Error Prevention**: Guardrails prevent unbalanced or invalid entries

## 🔧 TypeScript Helper Example

```typescript
// Transform natural language to journal entry
async function postJournal(utterance: string, organizationId: string) {
  // 1. Send to Digital Accountant API
  const response = await fetch('/api/v1/digital-accountant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: utterance,
      organizationId,
      context: {
        mode: 'journal_entry',
        autoPost: true
      }
    })
  });

  // 2. Get structured journal entry
  const journal = await response.json();
  
  // 3. Journal is automatically posted to universal_transactions
  return journal;
}

// Example usage
const journal = await postJournal(
  "Maya paid 450 for haircut", 
  "3f3d6e4a-7a2f-4c2a-8a1e-12b3c4567890"
);
```

---

## 📚 Further Reading

- [HERA Auto-Journal DNA Component](/docs/auto-journal-dna.md)
- [Universal Transaction Schema](/docs/universal-transactions.md)
- [Smart Code Architecture](/docs/smart-codes.md)
- [Fiscal Period Management](/docs/fiscal-dna.md)