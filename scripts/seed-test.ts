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

const envString = (key: string, fallback: string) => {
  const value = process.env[key]
  return value && value.trim().length > 0 ? value : fallback
}

const envNumberString = (key: string, fallback: number) => {
  const value = process.env[key]
  if (!value || value.trim().length === 0) return String(fallback)
  const parsed = Number(value)
  return Number.isFinite(parsed) ? String(parsed) : String(fallback)
}

const envBooleanSql = (key: string, fallback: boolean) => {
  const value = process.env[key]
  if (!value || value.trim().length === 0) return fallback ? 'TRUE' : 'FALSE'
  const normalized = value.trim().toLowerCase()
  const truthy = normalized === 'true' || normalized === '1' || normalized === 'yes'
  return truthy ? 'TRUE' : 'FALSE'
}

const productConfig = {
  name: envString('SEED_PRODUCT_1_NAME', 'Signature Repair Serum'),
  code: envString('SEED_PRODUCT_1_CODE', 'PROD-001'),
  description: envString('SEED_PRODUCT_1_DESCRIPTION', 'Flagship retail serum for salon demos'),
  smartCode: envString('SEED_PRODUCT_1_SMART_CODE', 'HERA.SALON.PROD.ENT.RETAIL.v1'),
  price: envNumberString('SEED_PRODUCT_1_PRICE', 19.99),
  currency: envString('SEED_PRODUCT_1_CURRENCY', 'AED'),
  qtyOnHand: envNumberString('SEED_PRODUCT_1_QTY_ON_HAND', 120),
  requiresInventory: envBooleanSql('SEED_PRODUCT_1_REQUIRES_INVENTORY', true),
  category: envString('SEED_PRODUCT_1_CATEGORY', 'Hair Care')
}

const categoryHaircareConfig = {
  name: envString('SEED_CATEGORY_HAIRCARE_NAME', 'Hair Care'),
  code: envString('SEED_CATEGORY_HAIRCARE_CODE', 'CAT-HAIR'),
  description: envString(
    'SEED_CATEGORY_HAIRCARE_DESCRIPTION',
    'Retail shampoos, conditioners, and treatment serums'
  ),
  smartCode: envString('SEED_CATEGORY_HAIRCARE_SMART_CODE', 'HERA.SALON.PROD.CATEGORY.HAIRCARE.v1'),
  color: envString('SEED_CATEGORY_HAIRCARE_COLOR', '#D4AF37'),
  icon: envString('SEED_CATEGORY_HAIRCARE_ICON', 'Tag'),
  sortOrder: envNumberString('SEED_CATEGORY_HAIRCARE_SORT_ORDER', 1),
  productCount: envNumberString('SEED_CATEGORY_HAIRCARE_PRODUCT_COUNT', 24)
}

const categoryStylingConfig = {
  name: envString('SEED_CATEGORY_STYLING_NAME', 'Styling Essentials'),
  code: envString('SEED_CATEGORY_STYLING_CODE', 'CAT-STYLING'),
  description: envString(
    'SEED_CATEGORY_STYLING_DESCRIPTION',
    'Finishing sprays, creams, and styling aids'
  ),
  smartCode: envString('SEED_CATEGORY_STYLING_SMART_CODE', 'HERA.SALON.PROD.CATEGORY.STYLING.v1'),
  color: envString('SEED_CATEGORY_STYLING_COLOR', '#8C7853'),
  icon: envString('SEED_CATEGORY_STYLING_ICON', 'Sparkles'),
  sortOrder: envNumberString('SEED_CATEGORY_STYLING_SORT_ORDER', 2),
  productCount: envNumberString('SEED_CATEGORY_STYLING_PRODUCT_COUNT', 18)
}

const categoryToolsConfig = {
  name: envString('SEED_CATEGORY_TOOLS_NAME', 'Tools & Accessories'),
  code: envString('SEED_CATEGORY_TOOLS_CODE', 'CAT-TOOLS'),
  description: envString(
    'SEED_CATEGORY_TOOLS_DESCRIPTION',
    'Professional hot tools, brushes, and accessories'
  ),
  smartCode: envString('SEED_CATEGORY_TOOLS_SMART_CODE', 'HERA.SALON.PROD.CATEGORY.TOOLS.v1'),
  color: envString('SEED_CATEGORY_TOOLS_COLOR', '#4A90E2'),
  icon: envString('SEED_CATEGORY_TOOLS_ICON', 'Package'),
  sortOrder: envNumberString('SEED_CATEGORY_TOOLS_SORT_ORDER', 3),
  productCount: envNumberString('SEED_CATEGORY_TOOLS_PRODUCT_COUNT', 12)
}

const placeholders = {
  ORG_ID: process.env.SEED_ORG_ID || genId(),
  ORG_NAME: process.env.SEED_ORG_NAME || 'HERA Test Org',
  ENTITY_PRODUCT_1: genId(),
  ENTITY_CUSTOMER_1: genId(),
  ENTITY_PRODUCT_CATEGORY_HAIRCARE: genId(),
  ENTITY_PRODUCT_CATEGORY_STYLING: genId(),
  ENTITY_PRODUCT_CATEGORY_TOOLS: genId(),
  TX_ORDER_1: genId(),
  PRODUCT_1_NAME: productConfig.name,
  PRODUCT_1_CODE: productConfig.code,
  PRODUCT_1_DESCRIPTION: productConfig.description,
  PRODUCT_1_SMART_CODE: productConfig.smartCode,
  PRODUCT_1_PRICE: productConfig.price,
  PRODUCT_1_CURRENCY: productConfig.currency,
  PRODUCT_1_QTY_ON_HAND: productConfig.qtyOnHand,
  PRODUCT_1_REQUIRES_INVENTORY: productConfig.requiresInventory,
  PRODUCT_1_CATEGORY: productConfig.category,
  CATEGORY_HAIRCARE_NAME: categoryHaircareConfig.name,
  CATEGORY_HAIRCARE_CODE: categoryHaircareConfig.code,
  CATEGORY_HAIRCARE_DESCRIPTION: categoryHaircareConfig.description,
  CATEGORY_HAIRCARE_SMART_CODE: categoryHaircareConfig.smartCode,
  CATEGORY_HAIRCARE_COLOR: categoryHaircareConfig.color,
  CATEGORY_HAIRCARE_ICON: categoryHaircareConfig.icon,
  CATEGORY_HAIRCARE_SORT_ORDER: categoryHaircareConfig.sortOrder,
  CATEGORY_HAIRCARE_PRODUCT_COUNT: categoryHaircareConfig.productCount,
  CATEGORY_STYLING_NAME: categoryStylingConfig.name,
  CATEGORY_STYLING_CODE: categoryStylingConfig.code,
  CATEGORY_STYLING_DESCRIPTION: categoryStylingConfig.description,
  CATEGORY_STYLING_SMART_CODE: categoryStylingConfig.smartCode,
  CATEGORY_STYLING_COLOR: categoryStylingConfig.color,
  CATEGORY_STYLING_ICON: categoryStylingConfig.icon,
  CATEGORY_STYLING_SORT_ORDER: categoryStylingConfig.sortOrder,
  CATEGORY_STYLING_PRODUCT_COUNT: categoryStylingConfig.productCount,
  CATEGORY_TOOLS_NAME: categoryToolsConfig.name,
  CATEGORY_TOOLS_CODE: categoryToolsConfig.code,
  CATEGORY_TOOLS_DESCRIPTION: categoryToolsConfig.description,
  CATEGORY_TOOLS_SMART_CODE: categoryToolsConfig.smartCode,
  CATEGORY_TOOLS_COLOR: categoryToolsConfig.color,
  CATEGORY_TOOLS_ICON: categoryToolsConfig.icon,
  CATEGORY_TOOLS_SORT_ORDER: categoryToolsConfig.sortOrder,
  CATEGORY_TOOLS_PRODUCT_COUNT: categoryToolsConfig.productCount
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
