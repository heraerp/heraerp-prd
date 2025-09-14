#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const bundle = process.argv[2] || '.'
const orch = ['orchestration.yml', 'orchestration.yaml', 'universal_orchestration.yaml']
  .map((f) => path.join(bundle, f))
  .find((p) => fs.existsSync(p))
if (!orch) {
  console.error('ORCH_NOT_FOUND')
  process.exit(1)
}

const reportPath = path.join(bundle, '.hera', 'report.json')
if (!fs.existsSync(reportPath)) {
  console.error('REPORT_NOT_FOUND')
  process.exit(1)
}
const jar = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
const digest = crypto.createHash('sha256').update(JSON.stringify(jar)).digest('hex')

const org = process.env.HERA_ORG_ID || '00000000-0000-0000-0000-000000000000'
const artifactCode = path.basename(path.resolve(bundle)).replace(/[^a-z0-9_]/gi, '_').toLowerCase()
const now = new Date().toISOString()

// Collect files mentioned in report (artifacts/files)
const files = []
for (const a of jar.artifacts || []) if (a.file) files.push(a.file)
for (const m of jar.errors || []) if (m.file) files.push(m.file)
for (const m of jar.warnings || []) if (m.file) files.push(m.file)
for (const m of jar.info || []) if (m.file) files.push(m.file)

const uniqueFiles = Array.from(new Set(files)).map((f) => path.basename(f))

const sql = `
-- Artifact registry (as ENTITY rows)
INSERT INTO core_entities (id, organization_id, entity_type, entity_name, entity_code, metadata, status)
VALUES (gen_random_uuid(), '${org}', 'ARTIFACT', 'Bundle ${artifactCode}', '${artifactCode}',
        jsonb_build_object('digest','${digest}','orchestration','${path.basename(orch)}','generated_at','${now}'),
        'active')
ON CONFLICT (organization_id, entity_type, entity_code) DO UPDATE
  SET metadata = EXCLUDED.metadata, updated_at = now();

-- Provenance transaction
WITH tx AS (
  INSERT INTO universal_transactions
    (id, organization_id, transaction_type, transaction_number, transaction_date, currency_code, total_amount, status, smart_code, metadata)
  VALUES
    (gen_random_uuid(), '${org}', 'apply', 'apply-${digest.slice(0, 12)}', now(), 'XXX', 0, 'posted',
     'HERA.SYSTEM.APPLY.BUNDLE.v1', jsonb_build_object('artifact_code','${artifactCode}','digest','${digest}'))
  RETURNING id
)
INSERT INTO universal_transaction_lines
  (id, organization_id, transaction_id, line_number, line_type, quantity, unit_of_measure, unit_price, line_amount, metadata)
SELECT gen_random_uuid(), '${org}', tx.id, row_number() over (), 'service', 1, 'EA', 0, 0,
       jsonb_build_object('file', f)
FROM tx, unnest(ARRAY[${uniqueFiles.map((f) => `'${f.replace(/'/g, "''")}'`).join(', ')}]) AS f(f);
`.trim()

const outDir = path.join(bundle, '.hera')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
const out = path.join(outDir, 'apply_provenance.sql')
fs.writeFileSync(out, sql + '\n')
console.log(JSON.stringify({ sql: '.hera/apply_provenance.sql', digest }, null, 2))

