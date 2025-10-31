# GL Posting Engine v2.0 - Verification Guide

## ✅ Implementation Status

**ALL CODE IS IMPLEMENTED AND READY:**

### 1. Core GL Posting Engine ✅
- File: `/src/lib/finance/gl-posting-engine.ts`
- Status: Complete (650+ lines)
- Features:
  - Revenue breakdown by service/product
  - Cart discount proportional allocation
  - Staff-based tip allocation
  - GL line generation with dimensions
  - Balance validation (DR = CR)
  - Enhanced metadata generation

### 2. POS Integration ✅
- File: `/src/hooks/usePosCheckout.ts`
- Status: Integrated (lines 386-528)
- GL v2.0 posting happens automatically on every POS sale

### 3. Reports Hook Integration ✅
- File: `/src/hooks/useSalonSalesReports.ts`
- Status: Updated with v2.0 support
- Backward compatible with v1.0 entries
- Exports `dimensionalBreakdown` for advanced analytics

### 4. Daily Report Page ✅
- File: `/src/app/salon/reports/sales/daily/page.tsx`
- Status: Already displays service/product split (lines 381-420)
- Shows: Service Revenue | Product Revenue | Tips | VAT | Gross

### 5. Monthly Report Page ✅
- File: `/src/app/salon/reports/sales/monthly/page.tsx`
- Status: Already displays service/product split (lines 489-541)
- Shows: Service Revenue | Product Revenue | Tips | VAT | Gross

## 🔍 How to Verify It's Working

### Step 1: Create a NEW POS Sale
1. Go to POS (/salon/pos)
2. Add BOTH service items AND product items to cart
3. Add a cart-level discount (optional)
4. Add tips (optional)
5. Process payment

### Step 2: Check Console Logs
Look for these log entries (in browser console):
```
[GL Auto-Post V2] 🚀 Starting enterprise GL posting engine...
[GL Auto-Post V2] 📊 Revenue Breakdown: {service: {...}, product: {...}}
[GL Auto-Post V2] 💰 Tip Allocation: [...]
[GL Auto-Post V2] ⚖️ Balance Validation: ✅ BALANCED
[GL Auto-Post V2] ✅ ENTERPRISE GL Journal Entry Created
```

### Step 3: Verify GL_JOURNAL Metadata
Query the database to see the enhanced metadata:

```sql
SELECT
  id,
  transaction_code,
  metadata->'gl_engine_version' as engine_version,
  metadata->'service_revenue_net' as service_net,
  metadata->'product_revenue_net' as product_net,
  metadata->'vat_on_services' as service_vat,
  metadata->'vat_on_products' as product_vat,
  metadata->'tips_by_staff' as tips_allocation
FROM universal_transactions
WHERE transaction_type = 'GL_JOURNAL'
  AND smart_code = 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE.v2'
ORDER BY created_at DESC
LIMIT 5;
```

Expected results for v2.0 entries:
- `engine_version`: "v2.0.0"
- `service_net`: actual service revenue amount
- `product_net`: actual product revenue amount
- `service_vat`: VAT on services (5%)
- `product_vat`: VAT on products (5%)
- `tips_allocation`: JSON array with staff allocations

### Step 4: Check Reports
1. Go to `/salon/reports/sales/daily`
2. Select today's date
3. You should see:
   - Service Revenue column (green)
   - Product Revenue column (purple)
   - Both columns populated correctly

## ⚠️ Important Notes

### v1.0 vs v2.0 GL Entries

**v1.0 (OLD) GL Entries:**
- Created BEFORE code update
- `gl_engine_version`: missing or "v1.0.0"
- All revenue in `net_revenue` field
- NO service/product split
- Reports will show all revenue in "Service Revenue" column

**v2.0 (NEW) GL Entries:**
- Created AFTER code update
- `gl_engine_version`: "v2.0.0"
- Revenue split: `service_revenue_net` + `product_revenue_net`
- VAT split: `vat_on_services` + `vat_on_products`
- Tips allocated: `tips_by_staff` array
- Reports will show correct split in both columns

### Backward Compatibility

The system is 100% backward compatible:
- ✅ Old v1.0 entries still work in reports
- ✅ New v2.0 entries show enhanced splits
- ✅ You can have BOTH types in the database
- ✅ Reports automatically detect and use correct fields

## 🐛 Troubleshooting

### Issue: Reports showing zero product revenue

**Likely Cause:** Sale created before code update (v1.0 entry)

**Solution:** Create a NEW sale after code update

**Verification:**
```sql
-- Check which GL engine version was used
SELECT
  transaction_code,
  metadata->>'gl_engine_version' as version,
  created_at
FROM universal_transactions
WHERE transaction_type = 'GL_JOURNAL'
ORDER BY created_at DESC
LIMIT 10;
```

### Issue: Console shows GL posting failed

**Check:** Browser console for detailed error message

**Common Issues:**
1. Balance not matching (DR != CR) - Check discount calculations
2. Missing organization_id - Check auth context
3. RPC function error - Check database connection

**Fix:** Review console error details and verify POS cart totals

### Issue: Split not showing in reports

**Check:** Hook is returning `service_net` and `product_net`

**Verification:**
1. Open browser DevTools
2. Go to React DevTools Components tab
3. Find `useDailySalesReport` or `useMonthlySalesReport` hook
4. Check returned `summary` object for `total_service` and `total_product` values

## 📊 Expected Results

### For a POS sale with:
- 2 services @ AED 100 each = AED 200
- 1 product @ AED 50 = AED 50
- Cart discount 10% = AED 25
- Tips = AED 20
- VAT 5%

### Expected GL v2.0 Metadata:
```json
{
  "gl_engine_version": "v2.0.0",
  "service_revenue_gross": 200,
  "service_revenue_net": 180,  // 200 - 20 cart discount
  "service_discount_total": 20,
  "product_revenue_gross": 50,
  "product_revenue_net": 45,   // 50 - 5 cart discount
  "product_discount_total": 5,
  "vat_on_services": 9,        // 180 * 5%
  "vat_on_products": 2.25,     // 45 * 5%
  "tips_by_staff": [
    {
      "staff_id": "...",
      "tip_amount": 20,
      "service_count": 2
    }
  ]
}
```

### Expected Report Display:
- **Service Revenue**: AED 180.00 (green)
- **Product Revenue**: AED 45.00 (purple)
- **Tips**: AED 20.00 (bronze)
- **VAT**: AED 11.25 (sapphire)
- **Gross Total**: AED 256.25 (gold)

## 🚀 Next Steps

1. **Test in Development:**
   - Create test POS sale with service + product
   - Verify console logs show v2.0 engine
   - Check reports show split correctly

2. **Database Migration:**
   - Run: `/migrations/20250131_add_gl_dimensional_indexes.sql`
   - This adds JSONB GIN indexes for fast queries
   - Zero downtime (uses CONCURRENTLY)

3. **Monitor Production:**
   - Watch console logs for GL posting errors
   - Verify GL balance (DR = CR) for all entries
   - Compare dashboard vs reports revenue totals

4. **Document for Team:**
   - Share this verification guide
   - Train staff on new split reporting
   - Update standard operating procedures

## ✅ Success Criteria

You'll know v2.0 is working when:
- [  ] Console shows `[GL Auto-Post V2] ✅ ENTERPRISE GL Journal Entry Created`
- [  ] Database shows `gl_engine_version: "v2.0.0"` in metadata
- [  ] Reports display both service AND product revenue columns populated
- [  ] Service + Product totals match previous total revenue
- [  ] VAT split adds up to total VAT (service_vat + product_vat = total_vat)
- [  ] Tips allocated correctly to staff members

