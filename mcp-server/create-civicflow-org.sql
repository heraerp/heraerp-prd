-- Create the CivicFlow demo organization
INSERT INTO core_organizations (id, organization_name, organization_code, created_at, updated_at)
VALUES (
  '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77',
  'CivicFlow Demo Organization',
  'CIVICFLOW-DEMO',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
