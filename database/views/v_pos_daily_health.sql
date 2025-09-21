-- Daily POS Health View
-- Provides per-organization and per-branch daily POS metrics
-- Zero schema changes - uses existing universal tables

CREATE OR REPLACE VIEW v_pos_daily_health AS
WITH tx AS (
  SELECT
    ut.organization_id,
    ut.from_entity_id AS branch_entity_id,  -- Using from_entity_id for branch
    date_trunc('day', ut.created_at) AS day,
    ut.id,
    ut.transaction_code,
    ut.total_amount
  FROM universal_transactions ut
  WHERE ut.transaction_type = 'sale'  -- Using 'sale' as per HERA conventions
    AND ut.smart_code LIKE '%POS.SALE%'
)
, line_details AS (
  SELECT
    t.organization_id,
    t.branch_entity_id,
    t.day,
    t.id as transaction_id,
    t.transaction_code,
    l.id as line_id,
    l.line_number,
    l.line_amount,
    l.smart_code,
    CASE 
      WHEN l.smart_code LIKE '%PAYMENT%' THEN 'PAYMENT'
      WHEN l.smart_code LIKE '%SERVICE%' THEN 'SERVICE'
      WHEN l.smart_code LIKE '%PRODUCT%' THEN 'PRODUCT'
      WHEN l.smart_code LIKE '%DISCOUNT%' THEN 'DISCOUNT'
      WHEN l.smart_code LIKE '%TIP%' THEN 'TIP'
      WHEN l.smart_code LIKE '%TAX%' THEN 'TAX'
      WHEN l.smart_code LIKE '%COMMISSION%' THEN 'COMMISSION'
      ELSE 'OTHER'
    END as line_type,
    l.quantity,
    l.unit_price
  FROM tx t
  JOIN universal_transaction_lines l ON l.transaction_id = t.id
)
, agg AS (
  SELECT
    ld.organization_id,
    ld.branch_entity_id,
    ld.day,
    COUNT(DISTINCT ld.transaction_id) as transaction_count,
    -- Payment totals (should be negative in POS context)
    SUM(CASE WHEN ld.line_type = 'PAYMENT' THEN ABS(ld.line_amount) ELSE 0 END) AS payments,
    -- Revenue items (services + products)
    SUM(CASE WHEN ld.line_type IN ('SERVICE', 'PRODUCT') THEN ld.line_amount ELSE 0 END) AS revenue,
    -- Other line types
    SUM(CASE WHEN ld.line_type = 'DISCOUNT' THEN ABS(ld.line_amount) ELSE 0 END) AS discounts,
    SUM(CASE WHEN ld.line_type = 'TIP' THEN ld.line_amount ELSE 0 END) AS tips,
    SUM(CASE WHEN ld.line_type = 'TAX' THEN ld.line_amount ELSE 0 END) AS tax,
    SUM(CASE WHEN ld.line_type = 'COMMISSION' THEN ld.line_amount ELSE 0 END) AS commissions,
    -- Net total
    SUM(ld.line_amount) AS net,
    -- Service/product counts
    COUNT(*) FILTER (WHERE ld.line_type IN ('SERVICE','PRODUCT')) AS item_count,
    COUNT(*) FILTER (WHERE ld.line_type = 'SERVICE') AS service_count,
    COUNT(*) FILTER (WHERE ld.line_type = 'PRODUCT') AS product_count,
    -- Zero-priced items (potential data issue)
    COUNT(*) FILTER (WHERE ld.line_type IN ('SERVICE','PRODUCT')
                     AND COALESCE(ld.unit_price, 0) = 0) AS zero_priced_count,
    -- Commission lines count (for commission mode tracking)
    COUNT(*) FILTER (WHERE ld.line_type = 'COMMISSION') AS commission_line_count
  FROM line_details ld
  GROUP BY 1,2,3
)
, org_settings AS (
  -- Get commission settings for each org
  SELECT 
    id as organization_id,
    entity_name as organization_name,
    COALESCE((settings->'salon'->'commissions'->>'enabled')::boolean, true) as commissions_enabled
  FROM core_organizations
)
SELECT 
  a.*,
  os.organization_name,
  os.commissions_enabled,
  -- Flag potential issues
  CASE 
    WHEN a.commission_line_count > 0 AND NOT os.commissions_enabled THEN true
    ELSE false
  END as has_commission_violation,
  -- Branch name lookup
  be.entity_name as branch_name
FROM agg a
LEFT JOIN org_settings os ON os.organization_id = a.organization_id
LEFT JOIN core_entities be ON be.id = a.branch_entity_id;

-- Grant appropriate permissions
GRANT SELECT ON v_pos_daily_health TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW v_pos_daily_health IS 'Daily POS health metrics per organization and branch. Used for operational monitoring and commission mode tracking.';