// scripts/seed-test.ts
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import process from 'node:process'
import * as dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()
const DRY = process.argv.includes('--dry-run')

const required = ['DATABASE_URL'] as const
for (const k of required) if (!process.env[k]) throw new Error(`Missing ${k}`)

const genId = () => crypto.randomUUID()

const placeholders = {
  ORG_ID: process.env.SEED_ORG_ID || genId(),
  ORG_NAME: process.env.SEED_ORG_NAME || 'HERA Test Org',
  ENTITY_PRODUCT_1: genId(),
  ENTITY_CUSTOMER_1: genId(),
  TX_ORDER_1: genId()
}

const root = path.dirname(fileURLToPath(import.meta.url))
const dir = path.resolve(root, '../seeds/sql')
const files = fs
  .readdirSync(dir)
  .filter(f => f.endsWith('.sql'))
  .sort((a, b) => a.localeCompare(b))

const loadAndSub = (p: string) => {
  let sql = fs.readFileSync(p, 'utf8')
  for (const [k, v] of Object.entries(placeholders)) {
    const re = new RegExp(`\\$\\{${k}\\}`, 'g')
    sql = sql.replace(re, v)
  }
  return sql
}

const run = async () => {
  const sql = files.map(f => loadAndSub(path.join(dir, f))).join('\n\n')
  if (DRY) {
    console.log(sql)
    return
  }
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')
    console.log('✅ Seed applied with org:', placeholders.ORG_ID)
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('❌ Seed failed:', e)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

run()
