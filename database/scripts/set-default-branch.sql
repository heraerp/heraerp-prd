-- Set default branch for Hair Talkz organization
UPDATE core_organizations
SET settings = jsonb_set(
  coalesce(settings,'{}'::jsonb),
  '{salon,default_branch_entity_id}',
  to_jsonb('f854255f-e2e9-4d14-835a-7520a88ee274'::uuid),
  true
)
WHERE id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

-- Verify the update
SELECT id, entity_name, settings->'salon'->>'default_branch_entity_id' AS default_branch
FROM core_organizations
WHERE id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

-- Optional: Backfill recent POS transactions to use this branch
UPDATE universal_transactions
SET source_entity_id = 'f854255f-e2e9-4d14-835a-7520a88ee274'::uuid,
    business_context = jsonb_set(
      coalesce(business_context,'{}'::jsonb),
      '{branch_id}',
      to_jsonb('f854255f-e2e9-4d14-835a-7520a88ee274'::uuid),
      true
    )
WHERE organization_id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
  AND transaction_type IN ('pos_sale','sale')
  AND source_entity_id IS NULL
  AND created_at::date = CURRENT_DATE;

-- Check recent transactions
SELECT id, transaction_type, source_entity_id, business_context->>'branch_id' AS branch_id, smart_code, total_amount
FROM universal_transactions
WHERE organization_id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
ORDER BY created_at DESC
LIMIT 5;