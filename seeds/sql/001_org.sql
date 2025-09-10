-- Placeholders are replaced by seed-test.ts
INSERT INTO core_organizations (id, name, created_at)
VALUES ('${ORG_ID}', '${ORG_NAME}', NOW())
ON CONFLICT (id) DO NOTHING;

