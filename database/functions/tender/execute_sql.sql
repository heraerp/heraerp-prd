-- Function to execute parameterized SQL queries for tender management
-- This is used by the tender API routes to run complex queries

CREATE OR REPLACE FUNCTION execute_sql(
  query text,
  params text[] DEFAULT '{}'::text[]
)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Security check: Ensure the query is a SELECT statement
  IF NOT (query ILIKE 'WITH%SELECT%' OR query ILIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Execute the query with parameters
  RETURN QUERY EXECUTE query USING params;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql(text, text[]) TO authenticated;

-- Create view for tender status (used by metrics queries)
CREATE OR REPLACE VIEW v_tender_status AS
SELECT 
  t.id as tender_id,
  t.organization_id,
  COALESCE(
    (SELECT s.entity_code
     FROM core_relationships r
     JOIN core_entities s ON s.id = r.to_entity_id
     WHERE r.from_entity_id = t.id 
       AND r.relationship_type = 'has_status'
       AND s.entity_type = 'workflow_status'
     ORDER BY r.created_at DESC
     LIMIT 1),
    'draft'
  ) as status
FROM core_entities t
WHERE t.entity_type = 'HERA.FURNITURE.TENDER.NOTICE.V1';

-- Grant select on view
GRANT SELECT ON v_tender_status TO authenticated;

-- Index for performance on tender queries
CREATE INDEX IF NOT EXISTS idx_core_entities_tender_type 
ON core_entities(entity_type, organization_id) 
WHERE entity_type = 'HERA.FURNITURE.TENDER.NOTICE.V1';

CREATE INDEX IF NOT EXISTS idx_core_dynamic_data_tender_fields 
ON core_dynamic_data(entity_id, field_name, organization_id);

CREATE INDEX IF NOT EXISTS idx_universal_transactions_tender_smart_codes 
ON universal_transactions(smart_code, organization_id, created_at)
WHERE smart_code LIKE 'HERA.FURNITURE.TENDER.%';

CREATE INDEX IF NOT EXISTS idx_core_relationships_status 
ON core_relationships(from_entity_id, relationship_type, created_at DESC)
WHERE relationship_type = 'has_status';