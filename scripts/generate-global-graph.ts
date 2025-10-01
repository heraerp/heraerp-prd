/* scripts/generate-global-graph.ts
 * Builds a global Mermaid graph from your entityPresets registry.
 * Outputs:
 *   - docs/diagrams/global-entity-map.mmd
 *   - docs/diagrams/global-entity-map.svg  (if mermaid-cli is available)
 *
 * Assumptions:
 * - You export `entityPresets` from src/hooks/entityPresets.ts
 * - Relationship entries include at least:
 *     { type: string, smart_code: string, cardinality?: 'one'|'many' }
 *   Target entities are extracted from smart_code patterns
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { exec as _exec } from 'node:child_process'
import { promisify } from 'node:util'

const exec = promisify(_exec)

// Import your entity presets
import { entityPresets } from '../src/hooks/entityPresets'
import type { Role, DynamicFieldDefUI, RelationshipDefUI } from '../src/hooks/entityPresets'

type EntityPreset = {
  entity_type: string
  labels?: { singular?: string; plural?: string }
  permissions?: {
    create?: (role: Role) => boolean
    edit?: (role: Role) => boolean
    delete?: (role: Role) => boolean
    view?: (role: Role) => boolean
  }
  dynamicFields?: DynamicFieldDefUI[]
  relationships?: RelationshipDefUI[]
}

// ---------- Config ----------
const OUT_DIR = path.resolve('docs/diagrams')
const OUT_MMD = path.join(OUT_DIR, 'global-entity-map.mmd')
const OUT_SVG = path.join(OUT_DIR, 'global-entity-map.svg')

// Colors for professional styling
const NODE_FILL = '#f8fafc'        // slate-50
const NODE_STROKE = '#0f172a'      // slate-900
const EDGE_COLOR = '#2563eb'       // blue-600
const REL_LABEL_BG = '#eef2ff'     // indigo-50

// ---------- Helpers ----------
function safeLabel(s?: string, fallback?: string) {
  return (s ?? fallback ?? 'Unknown').replace(/"/g, '\\"')
}

function cardinalityBadge(c?: string) {
  if (!c) return ''
  const badge = c === 'many' ? 'N' : '1'
  return `«${badge}»`
}

function edgeLabel(rel: { type: string; cardinality?: string }) {
  const type = rel.type || 'REL'
  const card = cardinalityBadge(rel.cardinality)
  return [type, card].filter(Boolean).join(' ')
}

function extractTargetFromSmartCode(smartCode: string): string | null {
  // Extract target entity from smart codes like:
  // HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1 -> CATEGORY
  // HERA.SALON.CUSTOMER.REL.PREFERRED_STYLIST.v1 -> STYLIST (maps to EMPLOYEE)
  // HERA.SALON.PRODUCT.REL.SUPPLIED_BY.v1 -> VENDOR
  
  const relMatch = smartCode.match(/\.REL\.(\w+)\./)
  if (!relMatch) return null
  
  const relType = relMatch[1]
  
  // Map relationship types to entity types
  const relationshipMap: Record<string, string> = {
    'HAS_CATEGORY': 'CATEGORY',
    'HAS_BRAND': 'BRAND', 
    'SUPPLIED_BY': 'VENDOR',
    'FOR_CUSTOMER': 'CUSTOMER',
    'WITH_EMPLOYEE': 'EMPLOYEE',
    'INCLUDES_SERVICE': 'SERVICE',
    'REFERRED_BY': 'CUSTOMER',
    'PREFERRED_STYLIST': 'EMPLOYEE',
    'HAS_ROLE': 'ROLE',
    'REPORTS_TO': 'EMPLOYEE',
    'CAN_PERFORM': 'SERVICE',
    'SUPPLIES_CATEGORY': 'CATEGORY',
    'PARENT_CATEGORY': 'CATEGORY',
    'PARENT': 'CATEGORY',
    'OWNED_BY_VENDOR': 'VENDOR',
    'OWNED_BY': 'VENDOR',
    'PERFORMED_BY_ROLE': 'ROLE',
    'REQUIRES_PRODUCT': 'PRODUCT'
  }
  
  return relationshipMap[relType] || null
}

function extractEdges(registry: Record<string, EntityPreset>) {
  // Deduplicate edges by a composite key
  const seen = new Set<string>()
  const edges: Array<{
    from: string
    to: string
    type: string
    cardinality?: string
    smart_code?: string
  }> = []

  for (const [k, preset] of Object.entries(registry)) {
    const rels = preset.relationships ?? []
    for (const rel of rels) {
      const toKey = extractTargetFromSmartCode(rel.smart_code)
      if (!toKey || !registry[toKey]) continue
      
      const id = `${k}::${rel.type}::${toKey}::${rel.cardinality ?? ''}`
      if (seen.has(id)) continue
      seen.add(id)
      
      edges.push({
        from: k,
        to: toKey,
        type: rel.type,
        cardinality: rel.cardinality,
        smart_code: rel.smart_code
      })
    }
  }
  return edges
}

function presetNodeLine(preset: EntityPreset, key: string) {
  // Create compact node representation
  const label = preset.labels?.singular || preset.entity_type || key
  const entityType = preset.entity_type
  const fieldCount = preset.dynamicFields?.length || 0
  const relCount = preset.relationships?.length || 0
  
  const title = `${safeLabel(label)}\\n(${safeLabel(entityType)})\\n${fieldCount} fields, ${relCount} rels`
  return `${key}["${title}"]`
}

function edgeLine(e: ReturnType<typeof extractEdges>[number]) {
  const lbl = edgeLabel({ type: e.type, cardinality: e.cardinality })
  // Use --- for undirected visuals
  return `${e.from} ---|"${lbl}"| ${e.to}`
}

function styleBlock(registry: Record<string, EntityPreset>) {
  const nodeStyles: string[] = []
  for (const key of Object.keys(registry)) {
    nodeStyles.push(`style ${key} fill:${NODE_FILL},stroke:${NODE_STROKE},stroke-width:2px,rx:8px,ry:8px`)
  }
  return nodeStyles.join('\n')
}

function header() {
  return [
    '%% Auto-generated by scripts/generate-global-graph.ts',
    '%% Do not edit this file manually; update entityPresets instead.',
    '%% Mermaid reference: https://mermaid.js.org/',
    'flowchart LR',
    '  %% Layout hints',
    `  classDef relLabel fill:${REL_LABEL_BG},color:#111827,stroke:#c7d2fe,stroke-width:1px;`,
    `  %% Global edge color`,
    `  linkStyle default stroke:${EDGE_COLOR},stroke-width:2px,opacity:0.8;`,
  ].join('\n')
}

function buildMMD(registry: Record<string, EntityPreset>) {
  const nodes = Object.entries(registry).map(([key, preset]) => presetNodeLine(preset, key)).join('\n  ')
  const edges = extractEdges(registry).map(edgeLine).join('\n  ')
  const styles = styleBlock(registry)

  return [
    header(),
    '',
    '  %% Entity Nodes',
    `  ${nodes}`,
    '',
    '  %% Relationships',
    `  ${edges}`,
    '',
    '  %% Node Styling',
    `  ${styles}`,
    ''
  ].join('\n')
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

async function writeFile(file: string, content: string) {
  await fs.writeFile(file, content, 'utf8')
  console.log(`📝 Wrote ${path.relative(process.cwd(), file)}`)
}

async function tryRenderSVG(mmdPath: string, svgPath: string) {
  try {
    // Try to use mermaid-cli to render SVG
    const cmd = `npx mmdc -i "${mmdPath}" -o "${svgPath}" -t default -b transparent --width 2400 --height 1600`
    await exec(cmd)
    console.log(`🖼️  Rendered ${path.relative(process.cwd(), svgPath)}`)
  } catch (err) {
    console.warn('⚠️  Mermaid CLI not found or failed to render SVG. Install it with:')
    console.warn('    npm i -D @mermaid-js/mermaid-cli')
    console.warn('  The .mmd source has still been generated.')
  }
}

async function main() {
  const registry = entityPresets as unknown as Record<string, EntityPreset>
  if (!registry || Object.keys(registry).length === 0) {
    throw new Error('entityPresets registry is empty or not found.')
  }

  console.log(`🔍 Found ${Object.keys(registry).length} entity presets`)
  console.log(`📊 Generating global entity relationship map...`)

  const mmd = buildMMD(registry)

  await ensureDir(OUT_DIR)
  await writeFile(OUT_MMD, mmd)
  await tryRenderSVG(OUT_MMD, OUT_SVG)
  
  console.log(`✅ Global entity map generated successfully`)
  console.log(`📁 Files: ${path.relative(process.cwd(), OUT_MMD)}, ${path.relative(process.cwd(), OUT_SVG)}`)
}

main().catch((e) => {
  console.error('❌ Failed to generate global entity map:', e)
  process.exit(1)
})