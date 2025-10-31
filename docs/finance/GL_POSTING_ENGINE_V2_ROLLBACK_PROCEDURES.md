# GL Posting Engine v2.0 - Rollback Procedures

**Smart Code:** `HERA.FINANCE.DOCS.GL_ROLLBACK.v1`
**Version:** 2.0.0
**Last Updated:** 2025-01-31
**Production Status:** ✅ PRODUCTION READY

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [When to Rollback](#when-to-rollback)
3. [Rollback Strategies](#rollback-strategies)
4. [Step-by-Step Rollback Procedures](#step-by-step-rollback-procedures)
5. [Data Integrity Verification](#data-integrity-verification)
6. [Emergency Contacts](#emergency-contacts)
7. [Post-Rollback Actions](#post-rollback-actions)

---

## Overview

The GL Posting Engine v2.0 implements an **enterprise-grade, backward-compatible** GL posting system with comprehensive rollback capabilities. This document provides detailed procedures for safely rolling back the v2.0 enhancements while preserving data integrity.

### Key Principles

✅ **Backward Compatibility:** v2.0 is 100% compatible with v1.0 GL entries
✅ **Non-Breaking Changes:** v2.0 only ADDS features, never removes v1.0 functionality
✅ **Zero Data Loss:** Rollback preserves all existing GL_JOURNAL entries
✅ **Gradual Transition:** System can operate with mixed v1.0 and v2.0 GL entries

---

## When to Rollback

### Rollback Triggers (Decision Matrix)

| Severity | Trigger | Recommended Action | Rollback Type |
|----------|---------|-------------------|---------------|
| **P0 Critical** | GL entries unbalanced in production | IMMEDIATE ROLLBACK | Full |
| **P0 Critical** | POS sales failing due to GL errors | IMMEDIATE ROLLBACK | Code-only |
| **P1 High** | Dashboard revenue showing incorrect totals | Investigate, then rollback if confirmed | Partial |
| **P2 Medium** | Slow GL posting performance | Monitor, optimize indexes | None |
| **P3 Low** | Missing dimensional data in reports | Fix forward, no rollback | None |

### ⚠️ DO NOT ROLLBACK IF:

- ❌ Only cosmetic UI issues (fix forward)
- ❌ Missing features that were never in v1.0 (expected behavior)
- ❌ Performance issues that can be resolved with index tuning
- ❌ Minor logging or console output issues

---

## Rollback Strategies

### Strategy 1: Code-Only Rollback (RECOMMENDED)
**Timeline:** 5-10 minutes
**Risk:** Low
**Data Impact:** Zero

Reverts application code to v1.0 GL posting while preserving all v2.0 GL data. System automatically falls back to v1.0 metadata extraction.

**Use When:**
- POS sales are failing due to v2.0 GL posting errors
- Dashboard shows incorrect totals due to v2.0 metadata
- Need to immediately restore service while investigating root cause

### Strategy 2: Partial Rollback (Database Indexes Only)
**Timeline:** 10-15 minutes
**Risk:** Low
**Data Impact:** Zero (indexes only)

Removes v2.0 JSONB GIN indexes while keeping v2.0 code active. Useful if indexes are causing performance degradation.

**Use When:**
- Database performance degradation after index deployment
- Disk space issues due to large indexes
- Index corruption or blocking queries

### Strategy 3: Full Rollback (Code + Indexes + Data Cleanup)
**Timeline:** 30-60 minutes
**Risk:** Medium
**Data Impact:** Removes v2.0-specific metadata fields (preserves core GL data)

Complete rollback to v1.0 state, including data cleanup of v2.0 enhanced metadata.

**Use When:**
- Unrecoverable v2.0 bugs requiring extended investigation
- Decision to permanently abandon v2.0 enhancements
- Data integrity issues with v2.0 metadata structure

---

## Step-by-Step Rollback Procedures

### Strategy 1: Code-Only Rollback

#### Prerequisites
- [ ] Git access to repository
- [ ] Deployment access (production)
- [ ] Database read access (verification only)

#### Steps

**1. Revert POS Checkout Hook (5 minutes)**

```bash
# Navigate to repository
cd /home/san/PRD/heraerp-dev

# Create rollback branch
git checkout -b rollback/gl-v2-code-only

# Revert usePosCheckout.ts to v1.0
git log src/hooks/usePosCheckout.ts  # Find commit before v2.0 integration
git checkout <commit-hash-before-v2> -- src/hooks/usePosCheckout.ts

# Verify revert
git diff src/hooks/usePosCheckout.ts
```

**Expected Changes:**
- Removes `import` statements for GL v2.0 engine
- Removes `PosCartItem` and `PosPayment` interface exports
- Reverts GL posting section (lines 386-528) to v1.0 simple posting
- Restores v1.0 metadata structure: `{ origin_transaction_id, posting_source, total_dr, total_cr, net_revenue, tips }`

**2. Test POS Sales (2 minutes)**

```bash
# Build and test locally
npm run build

# If build succeeds, test POS flow
# - Add items to cart (service + product)
# - Apply discount
# - Add tips
# - Process payment
# - Verify GL_JOURNAL created with v1.0 metadata
```

**3. Deploy to Production (3 minutes)**

```bash
# Commit rollback
git add src/hooks/usePosCheckout.ts
git commit -m "ROLLBACK: GL Posting Engine v2.0 → v1.0 (Code-only)"

# Push to production
git push origin rollback/gl-v2-code-only

# Trigger deployment (Railway, Vercel, etc.)
# ... deployment commands ...
```

**4. Verify Rollback Success**

```bash
# Test production POS sale
# Expected: GL_JOURNAL with v1.0 metadata (no service_revenue_net, etc.)

# Check dashboard revenue calculation
# Expected: Dashboard uses v1.0 fallback calculation
```

**5. Monitor Production (24 hours)**

- [ ] POS sales completing successfully
- [ ] GL_JOURNAL entries balanced (DR = CR)
- [ ] Dashboard showing correct revenue totals
- [ ] No GL posting errors in logs

---

### Strategy 2: Partial Rollback (Indexes Only)

#### Prerequisites
- [ ] PostgreSQL superuser access (Supabase dashboard)
- [ ] Database connection string

#### Steps

**1. Connect to Database**

```bash
# Via Supabase dashboard SQL Editor
# OR via psql
psql $DATABASE_URL
```

**2. Drop v2.0 JSONB GIN Indexes (10 minutes)**

```sql
-- Drop dimensional query indexes (CONCURRENTLY for zero downtime)
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_revenue_type;
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_staff_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_payment_method;
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_branch_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_customer_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_ut_metadata_gl_engine_version;
DROP INDEX CONCURRENTLY IF EXISTS idx_ut_metadata_origin_transaction_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_ut_gl_dashboard_queries;
DROP INDEX CONCURRENTLY IF EXISTS idx_utl_line_data_gl_account_code;

-- Drop monitoring view
DROP VIEW IF EXISTS v_gl_index_health;
```

**3. Verify Index Removal**

```sql
-- Check that v2.0 indexes are gone
SELECT indexname
FROM pg_indexes
WHERE indexname LIKE 'idx_utl_line_data_%'
   OR indexname LIKE 'idx_ut_metadata_%'
   OR indexname = 'idx_ut_gl_dashboard_queries';

-- Expected: No results (all dropped)
```

**4. Test Query Performance**

```sql
-- Test dimensional query (should still work, just slower)
EXPLAIN ANALYZE
SELECT
  line_data->>'revenue_type' AS revenue_type,
  COUNT(*) AS line_count,
  SUM((line_data->>'amount')::numeric) AS total_amount
FROM universal_transaction_lines
WHERE line_data->>'revenue_type' IN ('service', 'product')
GROUP BY line_data->>'revenue_type';

-- Expected: Sequential scan (no index), but query still completes
```

**5. Monitor Database Performance (24 hours)**

- [ ] Query response times acceptable
- [ ] No blocking locks or deadlocks
- [ ] Disk space recovered
- [ ] CPU/memory usage normal

---

### Strategy 3: Full Rollback (Code + Indexes + Data)

#### ⚠️ WARNING
This is a **DESTRUCTIVE** operation that removes v2.0 enhanced metadata from existing GL_JOURNAL entries. Only perform if:
- Complete abandonment of v2.0 features
- Data integrity issues require cleanup
- Explicit approval from technical leadership

#### Prerequisites
- [ ] Database backup completed and verified
- [ ] Technical leadership approval
- [ ] Maintenance window scheduled
- [ ] Rollback communication sent to users

#### Steps

**1. Create Database Backup (15 minutes)**

```bash
# Via Supabase dashboard: Database → Backups → Create backup
# OR via pg_dump
pg_dump $DATABASE_URL \
  --table=universal_transactions \
  --table=universal_transaction_lines \
  --file=gl_backup_before_v2_rollback_$(date +%Y%m%d_%H%M%S).sql
```

**2. Execute Code-Only Rollback First**

Follow "Strategy 1: Code-Only Rollback" steps above to revert application code.

**3. Drop Database Indexes**

Follow "Strategy 2: Partial Rollback" steps above to remove v2.0 indexes.

**4. Clean v2.0 Enhanced Metadata (DESTRUCTIVE)**

```sql
-- ⚠️ DESTRUCTIVE: Removes v2.0 metadata fields from GL_JOURNAL entries
-- Preserves backward-compatible v1.0 fields

UPDATE universal_transactions
SET metadata = jsonb_build_object(
  'origin_transaction_id', metadata->>'origin_transaction_id',
  'origin_transaction_code', metadata->>'origin_transaction_code',
  'posting_source', CASE
    WHEN metadata->>'posting_source' = 'pos_auto_post_v2'
    THEN 'pos_auto_post_v1'
    ELSE metadata->>'posting_source'
  END,
  'total_dr', metadata->>'total_dr',
  'total_cr', metadata->>'total_cr',
  'net_revenue', COALESCE(
    (metadata->>'service_revenue_net')::numeric +
    (metadata->>'product_revenue_net')::numeric,
    (metadata->>'net_revenue')::numeric,
    0
  ),
  'tips', COALESCE(
    (SELECT SUM((tip->>'tip_amount')::numeric)
     FROM jsonb_array_elements(metadata->'tips_by_staff') AS tip),
    (metadata->>'tips')::numeric,
    0
  ),
  'branch_id', metadata->>'branch_id'
)
WHERE transaction_type = 'GL_JOURNAL'
  AND smart_code = 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v1'
  AND metadata ? 'gl_engine_version'; -- Only update v2.0 entries

-- Verify cleanup
SELECT COUNT(*) AS v2_entries_cleaned
FROM universal_transactions
WHERE transaction_type = 'GL_JOURNAL'
  AND metadata ? 'service_revenue_net'; -- Should be 0

-- Expected: 0 (all v2.0 metadata cleaned)
```

**5. Verify Data Integrity**

```sql
-- Check that v1.0 fields are preserved
SELECT
  id,
  metadata->>'origin_transaction_id' AS origin_txn,
  metadata->>'total_dr' AS total_dr,
  metadata->>'total_cr' AS total_cr,
  metadata->>'net_revenue' AS net_revenue,
  metadata->>'tips' AS tips
FROM universal_transactions
WHERE transaction_type = 'GL_JOURNAL'
ORDER BY created_at DESC
LIMIT 10;

-- Expected: All rows have non-null v1.0 fields
```

**6. Test Full Application Flow**

- [ ] POS sale completes successfully
- [ ] GL_JOURNAL created with v1.0 metadata only
- [ ] Dashboard shows correct revenue (using v1.0 calculation)
- [ ] Reports show correct totals
- [ ] No v2.0 references in logs or UI

---

## Data Integrity Verification

### Verification Checklist (Run After ANY Rollback)

**1. GL Balance Validation**

```sql
-- Verify all GL entries are balanced (DR = CR)
SELECT
  id,
  transaction_code,
  (metadata->>'total_dr')::numeric AS total_dr,
  (metadata->>'total_cr')::numeric AS total_cr,
  ABS((metadata->>'total_dr')::numeric - (metadata->>'total_cr')::numeric) AS diff
FROM universal_transactions
WHERE transaction_type = 'GL_JOURNAL'
  AND ABS((metadata->>'total_dr')::numeric - (metadata->>'total_cr')::numeric) > 0.01
ORDER BY created_at DESC;

-- Expected: 0 rows (all balanced)
```

**2. Revenue Totals Consistency**

```sql
-- Compare SALE vs GL_JOURNAL revenue totals
WITH sale_totals AS (
  SELECT
    DATE(transaction_date) AS sale_date,
    SUM(total_amount) AS sale_revenue
  FROM universal_transactions
  WHERE transaction_type = 'SALE'
    AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(transaction_date)
),
gl_totals AS (
  SELECT
    DATE(transaction_date) AS gl_date,
    SUM((metadata->>'total_cr')::numeric) AS gl_revenue
  FROM universal_transactions
  WHERE transaction_type = 'GL_JOURNAL'
    AND transaction_date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY DATE(transaction_date)
)
SELECT
  COALESCE(s.sale_date, g.gl_date) AS date,
  s.sale_revenue,
  g.gl_revenue,
  ABS(COALESCE(s.sale_revenue, 0) - COALESCE(g.gl_revenue, 0)) AS diff
FROM sale_totals s
FULL OUTER JOIN gl_totals g ON s.sale_date = g.gl_date
WHERE ABS(COALESCE(s.sale_revenue, 0) - COALESCE(g.gl_revenue, 0)) > 1.00
ORDER BY date DESC;

-- Expected: 0 rows (perfect match) or minor rounding differences only
```

**3. Dashboard vs Database Consistency**

```bash
# Manual verification
# 1. Open dashboard: /salon/dashboard
# 2. Note today's revenue total
# 3. Run SQL query:

SELECT
  DATE(transaction_date) AS date,
  SUM((metadata->>'total_cr')::numeric) AS gross_revenue
FROM universal_transactions
WHERE transaction_type = 'GL_JOURNAL'
  AND DATE(transaction_date) = CURRENT_DATE
GROUP BY DATE(transaction_date);

# 4. Compare: Dashboard revenue === SQL gross_revenue
# Expected: Exact match (within $0.01)
```

---

## Emergency Contacts

### Escalation Path

| Issue Severity | Contact | Response SLA |
|----------------|---------|--------------|
| **P0 - Production Down** | Technical Lead + DevOps | 15 minutes |
| **P1 - Critical Bug** | Technical Lead | 1 hour |
| **P2 - Non-Critical Issue** | Development Team | 4 hours |
| **P3 - Enhancement Request** | Product Manager | 1 business day |

### Communication Templates

**P0 Production Issue Template:**

```
🚨 PRODUCTION ISSUE - GL Posting v2.0

**Severity:** P0 Critical
**Impact:** [POS sales failing / Dashboard incorrect / etc.]
**Affected Users:** [All / Specific branches / etc.]
**Rollback Decision:** [Code-only / Partial / Full]
**ETA:** [Time to complete rollback]
**Next Update:** [15 minutes / 30 minutes / etc.]

**Action Taken:**
- [Detailed steps]

**Status:** [In Progress / Monitoring / Resolved]
```

---

## Post-Rollback Actions

### Immediate (Within 1 Hour)

- [ ] **Incident Report:** Document root cause, impact, and resolution
- [ ] **User Communication:** Notify affected users of service restoration
- [ ] **Monitoring:** Set up alerts for GL balance violations
- [ ] **Log Analysis:** Review application logs for error patterns

### Short-term (Within 24 Hours)

- [ ] **Root Cause Analysis:** Identify why v2.0 failed
- [ ] **Fix Development:** Create bug fix or enhancement
- [ ] **Test Coverage:** Add unit/integration tests for failure scenario
- [ ] **Staging Deployment:** Test fix in non-production environment

### Long-term (Within 1 Week)

- [ ] **Retrospective:** Team meeting to discuss lessons learned
- [ ] **Documentation Update:** Revise deployment procedures
- [ ] **Monitoring Enhancement:** Add proactive alerts
- [ ] **Rollback Testing:** Practice rollback procedures in staging

---

## Rollback Success Criteria

### ✅ Rollback Complete When:

**Code-Only Rollback:**
- [ ] POS sales processing successfully (0 errors for 2 hours)
- [ ] GL_JOURNAL entries balanced (DR = CR)
- [ ] Dashboard revenue matches database totals
- [ ] Application logs show no GL posting errors
- [ ] No user reports of incorrect totals

**Partial Rollback (Indexes):**
- [ ] All v2.0 indexes dropped successfully
- [ ] Query performance acceptable (< 2s for reports)
- [ ] No database blocking or deadlocks
- [ ] Disk space recovered (if applicable)

**Full Rollback (Code + Indexes + Data):**
- [ ] All code-only rollback criteria met
- [ ] All index rollback criteria met
- [ ] No v2.0 metadata fields in GL_JOURNAL entries
- [ ] Database backup verified and accessible
- [ ] Incident report completed and approved

---

## Appendix: Rollback Decision Flowchart

```
┌─────────────────────────────┐
│ Production Issue Detected   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Is POS sales failing?       │
├─────────────────────────────┤
│ YES → IMMEDIATE CODE        │
│       ROLLBACK (Strategy 1) │
│ NO  → Continue              │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Is dashboard showing wrong  │
│ totals?                     │
├─────────────────────────────┤
│ YES → Verify data integrity │
│       then Code Rollback    │
│ NO  → Continue              │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Is database performance     │
│ degraded?                   │
├─────────────────────────────┤
│ YES → Partial Rollback      │
│       (Strategy 2 - Indexes)│
│ NO  → Continue              │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Is data corrupted or        │
│ v2.0 completely failed?     │
├─────────────────────────────┤
│ YES → Full Rollback         │
│       (Strategy 3)          │
│ NO  → Fix forward, no       │
│       rollback needed       │
└─────────────────────────────┘
```

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-31 | GL v2.0 Team | Initial rollback procedures document |

---

## Related Documentation

- **GL Posting Engine v2.0 Technical Spec:** `/src/lib/finance/gl-posting-engine.ts`
- **Database Migration Script:** `/migrations/20250131_add_gl_dimensional_indexes.sql`
- **Unit Tests:** `/src/lib/finance/__tests__/gl-posting-engine.test.ts`
- **Sales Reports Hook:** `/src/hooks/useSalonSalesReports.ts`
- **POS Checkout Hook:** `/src/hooks/usePosCheckout.ts`

---

**📞 Emergency Hotline:** See "Emergency Contacts" section above
**📧 Support Email:** [Insert production support email]
**📚 Knowledge Base:** [Insert internal wiki link]

---

**⚠️ IMPORTANT:** Always create a database backup before executing any rollback procedure. When in doubt, escalate to technical leadership before proceeding with destructive operations.
