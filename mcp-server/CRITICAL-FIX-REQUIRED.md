# 🚨 CRITICAL FIX REQUIRED - Transaction RPC Blocked

## TL;DR

**Transaction CRUD is 100% blocked** due to smart code validation bug.

**Fix**: Change **ONE CHARACTER** in `hera_txn_create_v1` validation regex:
- **Find**: `\.v[0-9]+$`
- **Replace**: `\.V[0-9]+$`
- **Location**: Line 48 area (based on error context)

---

## The Problem

### Current Validation Regex (WRONG)
```regex
^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$
                                                 ↑
                                          lowercase v (WRONG)
```

### Required Regex (CORRECT)
```regex
^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.V[0-9]+$
                                                 ↑
                                          UPPERCASE V (HERA DNA)
```

---

## Error When Testing

```
P0001: SMART_CODE_INVALID: header.smart_code must match
^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$

Error context: PL/pgSQL function hera_txn_create_v1(jsonb,jsonb,uuid) line 48
```

**Every transaction creation fails** with this error, even with valid HERA DNA smart codes like:
- ❌ `HERA.SALON.SALE.TXN.RETAIL.V1`
- ❌ `HERA.FIN.GL.TXN.JOURNAL.V1`
- ❌ `HERA.SALON.SERVICE.LINE.HAIRCUT.V1`

---

## How to Fix

### Step 1: Open Supabase SQL Editor

Navigate to: **Supabase Dashboard → SQL Editor**

### Step 2: Find the Validation Code

Look for this validation in `hera_txn_create_v1` (around line 48):

```sql
-- Header smart_code validation
IF (p_header->>'smart_code') !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$' THEN
  RAISE EXCEPTION 'SMART_CODE_INVALID: header.smart_code must match ...';
END IF;
```

### Step 3: Change ONE Character

**Change lowercase `v` to uppercase `V`**:

```sql
-- Header smart_code validation
IF (p_header->>'smart_code') !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.V[0-9]+$' THEN
  RAISE EXCEPTION 'SMART_CODE_INVALID: header.smart_code must match ...';
END IF;
```

### Step 4: Also Check Line Validation

If there's line-level smart code validation, update it too:

```sql
-- Line smart_code validation (if exists)
IF (line_smart_code) !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.V[0-9]+$' THEN
  RAISE EXCEPTION 'SMART_CODE_INVALID: line smart_code must match ...';
END IF;
```

### Step 5: Execute Update

Run the updated function SQL in Supabase SQL Editor

### Step 6: Reload Schema Cache

**Supabase Dashboard → Settings → API → Reload Schema Cache**

---

## Verification

After fix, run this test:

```bash
cd mcp-server
node test-fresh-create.mjs
```

**Expected result**: ✅ All 5 tests PASS

---

## Why This Happened

The regex pattern was written with lowercase `v` (possibly copied from another system), but HERA DNA specification requires UPPERCASE `V`.

**All HERA documentation uses `.V1`**:
- ✅ CLAUDE.md examples: `HERA.SALON.POS.CART.ACTIVE.V1`
- ✅ TRANSACTIONS_RPC_INDEX.md: `HERA.FIN.GL.TXN.JOURNAL.V1`
- ✅ Finance docs: `HERA.SALON.FINANCE.TXN.EXPENSE.SALARY.V1`

---

## Impact

**Until this is fixed**:
- ❌ ZERO transactions can be created
- ❌ POS operations blocked
- ❌ Financial transactions blocked
- ❌ Appointment transactions blocked
- ❌ All business operations dependent on transactions are halted

**After this is fixed**:
- ✅ Transaction CRUD fully functional
- ✅ Complete test suite passes
- ✅ Production-ready deployment
- ✅ All business operations resume

---

## One-Line Summary

**Change `.v[0-9]+$` to `.V[0-9]+$` in `hera_txn_create_v1` line 48 validation regex.**

That's it. One character. One minute fix. Unblocks everything.
