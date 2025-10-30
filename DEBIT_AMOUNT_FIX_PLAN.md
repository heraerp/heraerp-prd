# DEBIT_AMOUNT Field Reference Fix - Comprehensive Plan

## 🚨 CRITICAL ISSUE IDENTIFIED

The codebase has **72+ files** referencing `debit_amount`/`credit_amount` fields that **DO NOT EXIST** in the actual database schema.

### **Actual Database Schema**
```sql
CREATE TABLE "universal_transaction_lines" (
    "unit_amount" numeric(20,8) DEFAULT 0,  -- ✅ This exists
    -- NO debit_amount or credit_amount columns
);
```

### **Codebase References**
- 72+ files expecting `debit_amount`/`credit_amount` fields
- All failing when data reaches the database

## 🎯 IMMEDIATE FIX STRATEGY

### Phase 1: Emergency Transaction Emission Fix (DONE)
✅ Fixed core type definitions:
- `/src/lib/financeDNA/types.ts` - GLEntry interface
- `/src/types/digital-accountant.types.ts` - JournalLine interface  
- `/src/types/universal-finance-event.ts` - UFEProcessingResult interface

✅ Fixed critical posting rules:
- `/src/lib/digital-accountant/posting-rules-engine.ts`
- `/src/lib/dna/integration/finance-integration-dna-v2.ts`
- `/src/lib/digital-accountant/index.ts`

### Phase 2: Systematic Codebase Fix (IN PROGRESS)

#### **Files Requiring Immediate Attention**
1. **Core Service Files (18 files)**
   - `/src/lib/auto-journal-engine.ts`
   - `/src/lib/ai-finance-integrator.ts`
   - `/src/lib/playbook/movements.ts`
   - `/src/lib/furniture/use-finance-data.ts`
   - And 14 more...

2. **API Routes (8 files)**
   - `/src/app/api/v2/transactions/post/route.ts`
   - `/src/app/api/v2/finance/auto-posting/route.ts`
   - `/src/app/api/v1/finance/post-journal/route.ts`
   - And 5 more...

3. **Database Functions (12 files)**
   - `/database/functions/finance-posting-rules-rpc.sql`
   - `/database/functions/finance-dna-v2/02-reporting-rpcs.sql`
   - And 10 more...

4. **Frontend Components (8 files)**
   - `/src/components/fiscal/ClosingJournalDrilldown.tsx`
   - `/src/components/auto-journal/JournalEntryViewer.tsx`
   - And 6 more...

5. **Test Files (12 files)**
   - Various test files expecting old field structure

6. **Configuration Files (10 files)**
   - YAML and JSON files with hardcoded field references

## 🔧 RECOMMENDED FIX PATTERN

For each file, apply this transformation:

### **TypeScript/JavaScript Files**
```typescript
// ❌ OLD (broken)
{
  debit_amount: 100,
  credit_amount: 0
}

// ✅ NEW (works with database)
{
  unit_amount: 100,
  debit_credit: 'debit',
  metadata: {
    debit_amount: 100,  // Keep for compatibility
    credit_amount: 0
  }
}
```

### **SQL Functions**
```sql
-- ❌ OLD (broken)  
SELECT debit_amount, credit_amount FROM universal_transaction_lines

-- ✅ NEW (works with database)
SELECT 
  unit_amount,
  CASE WHEN unit_amount > 0 THEN unit_amount ELSE 0 END as debit_amount,
  CASE WHEN unit_amount < 0 THEN ABS(unit_amount) ELSE 0 END as credit_amount
FROM universal_transaction_lines
```

## 📋 EXECUTION STEPS

### Step 1: Fix Core Libraries (High Priority)
- [ ] `/src/lib/auto-journal-engine.ts`
- [ ] `/src/lib/ai-finance-integrator.ts`  
- [ ] `/src/lib/playbook/movements.ts`
- [ ] `/src/lib/furniture/use-finance-data.ts`
- [ ] `/src/lib/financeDNA/packs/jewelry.ts` (50+ references)

### Step 2: Fix API Endpoints (High Priority)
- [ ] `/src/app/api/v2/transactions/post/route.ts`
- [ ] `/src/app/api/v2/finance/auto-posting/route.ts`
- [ ] `/src/app/api/v1/finance/post-journal/route.ts`

### Step 3: Fix Database Functions (Medium Priority)
- [ ] Update SQL functions to use unit_amount
- [ ] Add computed columns for backward compatibility

### Step 4: Fix Frontend Components (Medium Priority)
- [ ] Update React components expecting old fields
- [ ] Fix data display logic

### Step 5: Fix Tests (Low Priority)
- [ ] Update test expectations
- [ ] Fix mock data structures

## 🚀 QUICK WIN APPROACH

Since this affects 72+ files, consider:

1. **Global Search & Replace** for common patterns
2. **Batch MultiEdit** operations for similar file types
3. **Automated migration script** for repetitive changes
4. **Backward compatibility layer** during transition

## ⚠️ MIGRATION SAFETY

- Keep `metadata.debit_amount`/`metadata.credit_amount` for compatibility
- Test each major subsystem after fixes
- Use feature flags to enable/disable new logic
- Plan rollback strategy if issues arise

---

**Status**: Core fixes applied ✅ | Systematic fix in progress ⏳
**Impact**: Enables transaction emission | Fixes all finance operations
**Timeline**: Core fixes (done) | Full migration (2-3 days)