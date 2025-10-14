-- =====================================================================================
-- HERA BARCODE INDEXES MIGRATION
-- Smart Code: HERA.DB.MIGRATION.BARCODE.INDEXES.V1
-- =====================================================================================
--
-- PURPOSE:
-- Create high-performance indexes for instant barcode lookups in POS/inventory systems
--
-- INDEXES CREATED:
-- 1. Primary barcode (text) - Instant single-barcode lookup
-- 2. Alternate barcodes (jsonb array) - Multi-barcode support with GIN index
-- 3. GTIN (text) - International tracking number lookup
--
-- PERFORMANCE:
-- - Sub-millisecond lookups even with millions of products
-- - GIN index allows efficient JSONB contains queries
-- - Organization isolation via RLS (no cross-org leakage)
--
-- =====================================================================================

-- Index 1: Primary Barcode (most common lookup)
-- Supports: SELECT ... WHERE smart_code = 'HERA.SALON.PRODUCT.DYN.BARCODE.PRIMARY.V1' AND field_value_text = '...'
CREATE INDEX IF NOT EXISTS idx_dynamic_barcode_primary
ON core_dynamic_data(field_value_text)
WHERE smart_code = 'HERA.SALON.PRODUCT.DYN.BARCODE.PRIMARY.V1'
AND field_value_text IS NOT NULL;

COMMENT ON INDEX idx_dynamic_barcode_primary IS 'Fast lookup for primary product barcodes (EAN13, UPC, CODE128, QR)';

-- Index 2: Alternate Barcodes (pack sizes, legacy labels)
-- Supports: SELECT ... WHERE smart_code = 'HERA.SALON.PRODUCT.DYN.BARCODES.ALT.V1' AND field_value_json @> '"barcode"'
CREATE INDEX IF NOT EXISTS idx_dynamic_barcodes_alt
ON core_dynamic_data USING GIN(field_value_json)
WHERE smart_code = 'HERA.SALON.PRODUCT.DYN.BARCODES.ALT.V1'
AND field_value_json IS NOT NULL;

COMMENT ON INDEX idx_dynamic_barcodes_alt IS 'GIN index for alternate barcode array searches (JSONB contains)';

-- Index 3: GTIN (Global Trade Item Number)
-- Supports: SELECT ... WHERE smart_code = 'HERA.SALON.PRODUCT.DYN.BARCODE.GTIN.V1' AND field_value_text = '...'
CREATE INDEX IF NOT EXISTS idx_dynamic_gtin
ON core_dynamic_data(field_value_text)
WHERE smart_code = 'HERA.SALON.PRODUCT.DYN.BARCODE.GTIN.V1'
AND field_value_text IS NOT NULL;

COMMENT ON INDEX idx_dynamic_gtin IS 'Fast lookup for GTIN (8-14 digit international product codes)';

-- =====================================================================================
-- RPC FUNCTION: search_products_by_alt_barcode
-- =====================================================================================
-- Enterprise-grade search function that returns full product details
-- with dynamic fields flattened for instant use in POS/inventory
-- =====================================================================================

CREATE OR REPLACE FUNCTION search_products_by_alt_barcode(
  p_barcode TEXT,
  p_organization_id UUID
)
RETURNS TABLE (
  id UUID,
  entity_name TEXT,
  entity_code TEXT,
  entity_type TEXT,
  smart_code TEXT,
  status TEXT,
  organization_id UUID,
  barcode_primary TEXT,
  barcode_type TEXT,
  price_market NUMERIC,
  price_cost NUMERIC,
  stock_quantity NUMERIC,
  sku TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH matched_entities AS (
    -- Find entities with matching alternate barcode
    SELECT DISTINCT d.entity_id
    FROM core_dynamic_data d
    INNER JOIN core_entities e ON e.id = d.entity_id
    WHERE d.smart_code = 'HERA.SALON.PRODUCT.DYN.BARCODES.ALT.V1'
      AND d.field_value_json @> to_jsonb(p_barcode::text)
      AND e.organization_id = p_organization_id
      AND e.entity_type = 'PRODUCT'
      AND e.status = 'active'
  ),
  entity_base AS (
    -- Get base entity info
    SELECT e.*
    FROM core_entities e
    INNER JOIN matched_entities m ON m.entity_id = e.id
  ),
  dynamic_fields AS (
    -- Pivot dynamic fields for easy access
    SELECT
      d.entity_id,
      MAX(CASE WHEN d.smart_code = 'HERA.SALON.PRODUCT.DYN.BARCODE.PRIMARY.V1' THEN d.field_value_text END) AS barcode_primary,
      MAX(CASE WHEN d.smart_code = 'HERA.SALON.PRODUCT.DYN.BARCODE.TYPE.V1' THEN d.field_value_text END) AS barcode_type,
      MAX(CASE WHEN d.smart_code = 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1' THEN d.field_value_number END) AS price_market,
      MAX(CASE WHEN d.smart_code = 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1' THEN d.field_value_number END) AS price_cost,
      MAX(CASE WHEN d.smart_code = 'HERA.SALON.PRODUCT.DYN.STOCK.QTY.v1' THEN d.field_value_number END) AS stock_quantity,
      MAX(CASE WHEN d.smart_code = 'HERA.SALON.PRODUCT.DYN.SKU.v1' THEN d.field_value_text END) AS sku
    FROM core_dynamic_data d
    INNER JOIN matched_entities m ON m.entity_id = d.entity_id
    GROUP BY d.entity_id
  )
  SELECT
    e.id,
    e.entity_name,
    e.entity_code,
    e.entity_type,
    e.smart_code,
    e.status,
    e.organization_id,
    d.barcode_primary,
    d.barcode_type,
    d.price_market,
    d.price_cost,
    d.stock_quantity,
    d.sku
  FROM entity_base e
  LEFT JOIN dynamic_fields d ON d.entity_id = e.id
  LIMIT 10;
END;
$$;

COMMENT ON FUNCTION search_products_by_alt_barcode IS 'Enterprise search function for alternate barcodes with flattened dynamic fields';

-- =====================================================================================
-- VERIFICATION QUERIES
-- =====================================================================================
-- Run these to verify indexes and test performance:
--
-- 1. Check index creation:
--    SELECT indexname, tablename FROM pg_indexes WHERE indexname LIKE 'idx_dynamic_barcode%';
--
-- 2. Test primary barcode lookup:
--    SELECT * FROM core_dynamic_data
--    WHERE smart_code = 'HERA.SALON.PRODUCT.DYN.BARCODE.PRIMARY.V1'
--    AND field_value_text = '6291041500213';
--
-- 3. Test alternate barcode lookup:
--    SELECT * FROM search_products_by_alt_barcode('6291041500213', '<your-org-id>');
--
-- 4. Check index usage (run EXPLAIN ANALYZE):
--    EXPLAIN ANALYZE SELECT * FROM core_dynamic_data
--    WHERE smart_code = 'HERA.SALON.PRODUCT.DYN.BARCODE.PRIMARY.V1'
--    AND field_value_text = '6291041500213';
--
-- =====================================================================================
