#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const { Orchestration } = require('./src/schemas/orchestration')
const { Entities } = require('./src/schemas/entities')
const { DynamicData } = require('./src/schemas/dynamic-data')
const { Relationships } = require('./src/schemas/relationships')
const { Procedure } = require('./src/schemas/procedures')
const { SMART_CODE_REGEX } = require('./src/schemas/smart-code')
const { _compatNormalizeHeader, _compatNormalizeLine } = require('./src/validators/db-universal')

// Vocabulary alias loader (for non-canonical term detection)
const VOCAB_REL = path.resolve(process.cwd(), 'playbooks/registry/vocabulary/relationships.vocab.yml')
function loadVocabAliases() {
  const map = new Map()
  try {
    if (!fs.existsSync(VOCAB_REL)) return map
    const y = yaml.load(fs.readFileSync(VOCAB_REL, 'utf8'))
    for (const r of (y?.rows || [])) {
      if (r?.relationship_type !== 'TERM_SYNONYM_OF') continue
      const from = String(r.from_slug || '')
      const to = String(r.to_slug || '')
      const alias = from.includes(':') ? from.split(':')[1] : from
      const parts = to.split(':')
      if (alias && parts.length === 2) {
        const kind = parts[0]
        const canon = parts[1]
        map.set(alias.toLowerCase(), { kind, canon })
      }
    }
  } catch (e) {
    // ignore errors
  }
  return map
}
const VOCAB_ALIASES = loadVocabAliases()
const isVocabFile = (f) => /playbooks[\/\\]registry[\/\\]vocabulary[\/\\]/.test(f)

function readYaml(filePath) {
  const text = fs.readFileSync(filePath, 'utf8')
  return yaml.load(text)
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function guessSchema(contractObj) {
  if (contractObj?.items) return { name: 'entities', schema: Entities }
  if (Array.isArray(contractObj?.rows) && contractObj?.rows?.[0]?.relationship_type) return { name: 'relationships', schema: Relationships }
  if (Array.isArray(contractObj?.rows) && contractObj?.rows?.[0]?.key_slug) return { name: 'dynamic_data', schema: DynamicData }
  if (contractObj?.happy_path || contractObj?.inputs || contractObj?.outputs) return { name: 'procedures', schema: Procedure }
  return null
}

function buildReport() {
  return { errors: [], warnings: [], info: [], artifacts: [], summary: {}, compat_mode: false }
}

function addFinding(report, severity, id, message, extra) {
  const entry = { id, message, ...extra }
  report[severity === 'error' ? 'errors' : severity === 'warn' ? 'warnings' : 'info'].push(entry)
}

function lintBundle(bundlePath, opts = {}) {
  const report = buildReport()
  report.compat_mode = !!opts.compat
  const root = path.resolve(bundlePath)
  let orchestration
  try {
    const orchPath = path.join(root, 'universal_orchestration.yaml')
    orchestration = readYaml(orchPath)
    const parsed = Orchestration.safeParse(orchestration)
    if (!parsed.success) {
      addFinding(report, 'error', 'SCHEMA_INVALID', 'Orchestration schema invalid', { issues: parsed.error.issues })
      return report
    }
  } catch (e) {
    addFinding(report, 'error', 'FILE_MISSING', 'universal_orchestration.yaml not found or unreadable', { error: String(e.message || e) })
    return report
  }

  // Smart code check for orchestration
  if (!SMART_CODE_REGEX.test(orchestration.smart_code)) {
    addFinding(report, 'error', 'SMART_CODE_INVALID', 'Invalid orchestration smart_code', { smart_code: orchestration.smart_code })
  }

  // Track uniqueness across artifacts
  const seenSmartCodes = new Set([orchestration.smart_code])

  for (const rel of orchestration.contracts || []) {
    const cPath = path.join(root, rel)
    let obj
    let srcText
    try {
      srcText = fs.readFileSync(cPath, 'utf8')
      obj = yaml.load(srcText)
    } catch (e) {
      addFinding(report, 'error', 'FILE_MISSING', 'Contract file not found or unreadable', { file: rel, error: String(e.message || e) })
      continue
    }

    // Optional compat rewrite for example payloads inside contracts
    let topChanged = false
    if (opts.compat && obj && typeof obj === 'object' && obj.header && Array.isArray(obj.lines)) {
      const warnings = []
      const beforeH = JSON.stringify(obj.header)
      const beforeL = JSON.stringify(obj.lines)
      obj.header = _compatNormalizeHeader(obj.header, warnings)
      obj.lines = obj.lines.map((l) => _compatNormalizeLine(l, warnings))
      topChanged = JSON.stringify(obj.header) !== beforeH || JSON.stringify(obj.lines) !== beforeL
      if (warnings.length) report.info.push({ id: 'COMPAT_REWRITE', message: 'Normalized legacy fields in example payloads', file: rel, warnings })
      if (topChanged && opts.compat && !opts.compatWrite && opts.strictCompat) {
        addFinding(report, 'error', 'COMPAT_REQUIRED', 'Legacy fields detected. Run with --compat-write (or npm run schema:compat:write) to persist rewrites.', { file: rel })
      }
      if (topChanged && opts.compatWrite) {
        try {
          const bak = cPath + (opts.backupExt || '.bak')
          if (!fs.existsSync(bak)) fs.writeFileSync(bak, srcText)
          const out = yaml.dump(obj)
          if (out !== srcText) {
            fs.writeFileSync(cPath, out)
            addFinding(report, 'warn', 'COMPAT_WRITE', 'Rewrote legacy fields → production names', { file: rel })
          }
        } catch (e) {
          addFinding(report, 'warn', 'COMPAT_WRITE_FAILED', 'Failed to persist compat rewrite', { file: rel, error: String(e.message || e) })
        }
      }
    }

    // Heuristic 2: scan any arrays named 'lines' with line-like objects
    if (opts.compat && obj && typeof obj === 'object') {
      const compatWarnings = []
      let changed = false
      for (const k of Object.keys(obj)) {
        const v = obj[k]
        if (Array.isArray(v) && v.length && typeof v[0] === 'object' && v[0].quantity !== undefined) {
          const before = JSON.stringify(v)
          obj[k] = v.map((l) => _compatNormalizeLine(l, compatWarnings))
          if (JSON.stringify(obj[k]) !== before) changed = true
        }
      }
      if (changed) {
        report.info.push({ id: 'COMPAT_REWRITE_SCAN', message: 'Normalized legacy fields in arrays', file: rel, warnings: compatWarnings })
        if (opts.compat && !opts.compatWrite && opts.strictCompat) {
          addFinding(report, 'error', 'COMPAT_REQUIRED', 'Legacy fields detected. Run with --compat-write (or npm run schema:compat:write) to persist rewrites.', { file: rel })
        }
        // If compatWrite enabled, persist rewrite with backup
        if (opts.compatWrite) {
          try {
            const filePath = cPath
            const src = fs.readFileSync(filePath, 'utf8')
            const bak = filePath + (opts.backupExt || '.bak')
            if (!fs.existsSync(bak)) fs.writeFileSync(bak, src)
            const out = yaml.dump(obj)
            if (out !== src) {
              fs.writeFileSync(filePath, out)
              addFinding(report, 'warn', 'COMPAT_WRITE', 'Rewrote legacy fields → production names', { file: rel })
            }
          } catch (e) {
            addFinding(report, 'warn', 'COMPAT_WRITE_FAILED', 'Failed to persist compat rewrite', { file: rel, error: String(e.message || e) })
          }
        }
      }
    }

    // Vocabulary enforcement: block synonyms outside the vocabulary bundle
    if (!isVocabFile(rel)) {
      const flagAlias = (term, slot, where) => {
        if (!term) return
        const hit = VOCAB_ALIASES.get(String(term).toLowerCase())
        if (hit) {
          addFinding(report, 'error', 'NON_CANONICAL_TERM', `Found synonym "${term}" in ${where}.${slot}. Use canonical ${hit.kind} "${hit.canon}" (define synonyms only in vocabulary bundle).`, { file: rel })
        }
      }
      if (obj?.items) {
        for (const it of obj.items) {
          if (it && typeof it === 'object') {
            if (it.entity_type) flagAlias(it.entity_type, 'entity_type', 'items')
            if (it.line_type) flagAlias(it.line_type, 'line_type', 'items')
            if (it.transaction_type) flagAlias(it.transaction_type, 'transaction_type', 'items')
          }
        }
      }
      if (obj?.rows) {
        for (const r of obj.rows) {
          if (r && typeof r === 'object') {
            if (r.relationship_type) flagAlias(r.relationship_type, 'relationship_type', 'rows')
          }
        }
      }
      const prec = Array.isArray(obj?.preconditions) ? obj.preconditions : []
      for (const s of prec) {
        const re = /\b(ENTITY_TYPE|TRANSACTION_TYPE|LINE_TYPE|REL_TYPE)::([a-z0-9_]+)\b/g
        for (const m of String(s).matchAll(re)) {
          const alias = m[2]
          const hit = VOCAB_ALIASES.get(alias)
          if (hit) {
            addFinding(report, 'error', 'NON_CANONICAL_TERM', `Precondition uses synonym "${alias}". Use ${hit.kind}::${hit.canon}.`, { file: rel })
          }
        }
      }
    }

    const which = guessSchema(obj)
    if (!which) {
      addFinding(report, 'warn', 'UNKNOWN_CONTRACT', 'Could not infer contract type; skipping schema validation', { file: rel })
      continue
    }

    const parsed = which.schema.safeParse(obj)
    if (!parsed.success) {
      addFinding(report, 'error', 'SCHEMA_INVALID', `Schema invalid for ${which.name}`, { file: rel, issues: parsed.error.issues })
      continue
    }

    // Smart code presence/regex
    if (!SMART_CODE_REGEX.test(obj.smart_code)) {
      addFinding(report, 'error', 'SMART_CODE_INVALID', `Invalid smart_code in ${which.name}`, { file: rel, smart_code: obj.smart_code })
    } else if (seenSmartCodes.has(obj.smart_code)) {
      addFinding(report, 'error', 'SMART_CODE_CONFLICT', 'Duplicate smart_code across artifacts', { file: rel, smart_code: obj.smart_code })
    } else {
      seenSmartCodes.add(obj.smart_code)
    }

    report.artifacts.push({ file: rel, type: which.name })

    // Additional uniqueness within Entities: (entity_type, slug)
    if (which.name === 'entities') {
      const seenPairs = new Set()
      for (const it of obj.items || []) {
        const key = `${it.entity_type}/${it.slug}`
        if (seenPairs.has(key)) {
          addFinding(report, 'error', 'SLUG_CONFLICT', 'Duplicate (entity_type, slug) in entities catalog', { file: rel, entity_type: it.entity_type, slug: it.slug })
        } else {
          seenPairs.add(key)
        }
      }
    }
  }

  report.summary = {
    artifact_count: report.artifacts.length,
    errors: report.errors.length,
    warnings: report.warnings.length,
  }

  return report
}

function writeReport(root, report) {
  const outDir = path.join(root, '.hera')
  ensureDir(outDir)
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2))
}

if (require.main === module) {
  const args = process.argv.slice(2)
  const idx = args.indexOf('--bundle')
  const bundle = idx >= 0 ? args[idx + 1] : process.cwd()
  const compat = args.includes('--compat')
  const compatWrite = args.includes('--compat-write')
  const strictCompat = args.includes('--strict-compat')
  const bexIdx = args.indexOf('--backup-ext')
  const backupExt = bexIdx >= 0 ? args[bexIdx + 1] : '.bak'
  const rep = lintBundle(bundle, { compat, compatWrite, strictCompat, backupExt })
  writeReport(bundle, rep)
  const hasErrors = rep.errors.length > 0
  console.log(JSON.stringify(rep, null, 2))
  process.exit(hasErrors ? 1 : 0)
}

module.exports = { lintBundle }
