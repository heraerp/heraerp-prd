-- Function to calculate stock on hand for products
CREATE OR REPLACE FUNCTION public.calculate_stock_on_hand(
  p_organization_id UUID,
  p_product_ids UUID[],
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  product_id UUID,
  stock_on_hand NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH stock_movements AS (
    SELECT
      utl.line_entity_id AS product_id,
      CASE 
        -- Inbound movements (add to stock)
        WHEN ut.transaction_type IN ('goods_receipt', 'stock_transfer') AND 
             (p_branch_id IS NULL OR ut.to_entity_id = p_branch_id) THEN utl.quantity
        WHEN ut.transaction_type = 'stock_adjustment' AND 
             utl.quantity > 0 THEN utl.quantity
        -- Outbound movements (subtract from stock)  
        WHEN ut.transaction_type IN ('sale', 'stock_transfer') AND
             (p_branch_id IS NULL OR ut.from_entity_id = p_branch_id) THEN -utl.quantity
        WHEN ut.transaction_type = 'stock_adjustment' AND 
             utl.quantity < 0 THEN utl.quantity
        ELSE 0
      END AS quantity_change
    FROM universal_transaction_lines utl
    INNER JOIN universal_transactions ut ON ut.id = utl.transaction_id
    WHERE ut.organization_id = p_organization_id
      AND utl.line_entity_id = ANY(p_product_ids)
      AND ut.transaction_type IN ('goods_receipt', 'sale', 'stock_adjustment', 'stock_transfer')
      AND (p_branch_id IS NULL OR 
           ut.from_entity_id = p_branch_id OR 
           ut.to_entity_id = p_branch_id)
  )
  SELECT 
    sm.product_id,
    COALESCE(SUM(sm.quantity_change), 0) AS stock_on_hand
  FROM stock_movements sm
  GROUP BY sm.product_id
  
  UNION ALL
  
  -- Include products with no movements (0 stock)
  SELECT 
    pid AS product_id,
    0 AS stock_on_hand
  FROM unnest(p_product_ids) AS pid
  WHERE NOT EXISTS (
    SELECT 1 FROM stock_movements sm WHERE sm.product_id = pid
  );
END;
$$;