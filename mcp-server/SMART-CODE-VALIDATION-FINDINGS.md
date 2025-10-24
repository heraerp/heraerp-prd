# Smart Code Validation Findings

**Date**: October 23, 2025
**Issue**: Transaction CREATE failing with SMART_CODE_INVALID error

---

## Summary

The deployed `hera_txn_create_v1` function has a smart code validation regex, but testing reveals the regex is **correctly formatted** and should work. The issue appears to be with **regex escaping in the deployed Postgres function**.

---

## Correct HERA DNA Smart Code Format (CONFIRMED)

**Format**: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v1`

**Rules**:
- Prefix: `HERA` (required)
- Industry segment: 3-15 uppercase alphanumeric characters
- Additional segments: 3-8 segments of 2-30 uppercase alphanumeric/underscore characters
- Version: lowercase `.v1`, `.v2`, etc.

**Examples that SHOULD pass**:
✅ `HERA.SALON.SALE.TXN.RETAIL.v1` - 4 segments after SALON
✅ `HERA.FIN.GL.TXN.JOURNAL.v1` - 4 segments after FIN
✅ `HERA.SALON.POS.CART.ACTIVE.v1` - 4 segments after SALON

**Examples that SHOULD fail**:
❌ `HERA.SALON.SALE.TXN.v1` - Only 3 segments after SALON (need 3+ but count is off)
❌ `HERA.SALON.SALE.v1` - Only 2 segments after SALON

---

## JavaScript Regex Test Results

**Pattern**: `/^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/`

This pattern **PASSES** for `HERA.SALON.SALE.TXN.RETAIL.v1`:

```javascript
const pattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;
console.log(pattern.test('HERA.SALON.SALE.TXN.RETAIL.v1')); // ✅ true
```

---

## Postgres Function Error

**Error from deployed function**:
```
P0001: SMART_CODE_INVALID: header.smart_code must match
^HERA\\\\.[A-Z0-9]{3,15}(?:\\\\.[A-Z0-9_]{2,30}){3,8}\\\\.v[0-9]+$
```

**Notice**: The error shows **FOUR backslashes** (`\\\\`) instead of TWO (`\\`)

---

## Root Cause Analysis

### Pattern Escaping Issue

In Postgres regex patterns:
- `\.` matches a literal dot
- `\\.` in SQL string literals becomes `\.` in the regex
- `\\\\.` (four backslashes) becomes `\\.` which tries to match backslash-dot literally!

### The Fix Required

The deployed function likely has:

```sql
-- ❌ WRONG - Over-escaped
IF (p_header->>'smart_code') !~ '^HERA\\\\.[A-Z0-9]{3,15}...'

-- ✅ CORRECT - Proper escaping
IF (p_header->>'smart_code') !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$'
```

In Postgres, when using `!~` or `~` operators:
- The regex pattern is NOT a string literal
- You don't need to escape backslashes
- Just use: `\.` to match a literal dot

---

## Recommended Fix

### Option 1: Fix Regex Escaping (RECOMMENDED)

Update the smart code validation in `hera_txn_create_v1` (line 48):

**Find**:
```sql
IF (p_header->>'smart_code') !~ '^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$' THEN
  RAISE EXCEPTION 'SMART_CODE_INVALID: header.smart_code must match ...';
END IF;
```

**Replace with**:
```sql
IF (p_header->>'smart_code') !~ '^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$' THEN
  RAISE EXCEPTION 'SMART_CODE_INVALID: header.smart_code must match pattern';
END IF;
```

**Change**: Remove extra backslashes (use `\.` not `\\.`)

### Option 2: Use String Literal with Proper Escaping

If the pattern is in a string literal (e.g., using `~`), then use double backslashes:

```sql
IF NOT (p_header->>'smart_code' ~ E'^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$') THEN
  RAISE EXCEPTION 'SMART_CODE_INVALID';
END IF;
```

---

## Test Cases for Validation

After fix, these should pass:

```sql
-- ✅ SHOULD PASS
'HERA.SALON.SALE.TXN.RETAIL.v1'    -- 5 total segments (1 industry + 4 additional)
'HERA.FIN.GL.TXN.JOURNAL.v1'       -- 5 total segments
'HERA.SALON.POS.CART.ACTIVE.v1'    -- 5 total segments

-- ❌ SHOULD FAIL
'HERA.SALON.SALE.v1'               -- Only 3 total segments (too few)
'HERA.SALON.SALE.TXN.RETAIL.V1'    -- Uppercase V (should be lowercase v)
```

---

## Segment Counting Clarification

The regex `{3,8}` means **3-8 additional segments AFTER the industry segment**:

```
HERA.SALON.SALE.TXN.RETAIL.v1
│    │     │    │   │      │
│    │     └────┴───┴──────┴─ 4 additional segments (SALE, TXN, RETAIL, then version)
│    └─ Industry segment (SALON)
└─ Prefix (HERA)
```

So minimum valid pattern is: `HERA.{INDUSTRY}.{SEG1}.{SEG2}.{SEG3}.v1`

---

## Next Steps

1. ✅ Locate the smart code validation in `hera_txn_create_v1` (around line 48)
2. ✅ Fix the regex escaping (remove extra backslashes)
3. ✅ Deploy updated function to Supabase
4. ✅ Reload schema cache
5. ✅ Re-run test: `node test-fresh-create.mjs`

---

**Expected Result**: All tests should pass once regex escaping is fixed.
