#!/usr/bin/env node

/**
 * HERA MCP Bundle Tools
 * Exposes bundle lint/plan/graph, tx guard, and provenance SQL as MCP-style tools.
 * Smart Code: HERA.MCP.BUNDLE.TOOLS.v1
 */

const cp = require('child_process')
const fs = require('fs')
const path = require('path')

function runNode(script, args = [], stdin) {
  const res = cp.spawnSync('node', [script, ...args], { encoding: 'utf8', input: stdin })
  if (res.error) throw res.error
  return { code: res.status, stdout: res.stdout, stderr: res.stderr }
}

const TOOLS = {
  'hera.bundle.lint': {
    description: 'Lint a HERA bundle (optional compat normalization in-memory)',
    parameters: {
      bundle: { type: 'string', required: true },
      compat: { type: 'boolean', default: true },
      strict_compat: { type: 'boolean', default: false },
    },
    handler: async ({ bundle, compat = true, strict_compat = false }) => {
      const args = ['mcp-server/contract-lint.js', '--bundle', bundle]
      if (compat) args.push('--compat')
      if (strict_compat) args.push('--strict-compat')
      const { code, stdout, stderr } = runNode(...[args.shift(), args])
      let report = null
      try { report = JSON.parse(stdout || '{}') } catch {}
      return { exit_code: code, report, stderr }
    },
  },

  'hera.bundle.plan': {
    description: 'Plan a HERA bundle (DAG) with optional baseline catalog',
    parameters: {
      bundle: { type: 'string', required: true },
      baseline: { type: 'string', required: false },
    },
    handler: async ({ bundle, baseline }) => {
      const args = ['mcp-server/contract-plan.js', '--bundle', bundle]
      if (baseline) args.push('--baseline', baseline)
      const { code, stdout, stderr } = runNode(...[args.shift(), args])
      let plan = null
      try { plan = JSON.parse(stdout || '{}') } catch {}
      return { exit_code: code, plan, stderr }
    },
  },

  'hera.bundle.graph': {
    description: 'Render deterministic DOT/SVG for a HERA bundle DAG',
    parameters: {
      bundle: { type: 'string', required: true },
      baseline: { type: 'string', required: false },
    },
    handler: async ({ bundle, baseline }) => {
      const args = ['mcp-server/contract-graph.js', bundle]
      if (baseline) args.push('--baseline', baseline)
      const { code, stdout, stderr } = runNode(...[args.shift(), args])
      let out = null
      try { out = JSON.parse(stdout || '{}') } catch {}
      return { exit_code: code, outputs: out, stderr }
    },
  },

  'hera.tx.guard': {
    description: 'Validate and normalize a transaction header + lines before DB write',
    parameters: {
      header: { type: 'object', required: true },
      lines: { type: 'array', required: true },
      compat: { type: 'boolean', default: true },
    },
    handler: async ({ header, lines, compat = true }) => {
      // Pipe payload files via stdin temp files
      const tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'hera-tx-'))
      const hPath = path.join(tmpDir, 'header.json')
      const lPath = path.join(tmpDir, 'lines.json')
      fs.writeFileSync(hPath, JSON.stringify(header))
      fs.writeFileSync(lPath, JSON.stringify(lines))
      const args = ['mcp-server/src/cli/tx-create.js', hPath, lPath]
      if (compat) args.push('--compat')
      const { code, stdout, stderr } = runNode(...[args.shift(), args])
      let out = null
      try { out = JSON.parse(stdout || '{}') } catch {}
      return { exit_code: code, result: out, stderr }
    },
  },

  'hera.bundle.provenance': {
    description: 'Emit SQL for ARTIFACT entity upsert + HERA.SYSTEM.APPLY.BUNDLE provenance transaction',
    parameters: {
      bundle: { type: 'string', required: true },
    },
    handler: async ({ bundle }) => {
      const args = ['mcp-server/src/cli/contract-apply-dryrun.js', bundle]
      const { code, stdout, stderr } = runNode(...[args.shift(), args])
      let out = null
      try { out = JSON.parse(stdout || '{}') } catch {}
      return { exit_code: code, outputs: out, stderr }
    },
  },
}

async function handleMCPRequest(tool, params) {
  const t = TOOLS[tool]
  if (!t) {
    return { error: 'UNKNOWN_TOOL', tools: Object.keys(TOOLS) }
  }
  return await t.handler(params || {})
}

module.exports = {
  MCP_BUNDLE_TOOLS: TOOLS,
  handleMCPRequest,
}

// CLI fallback for quick testing
if (require.main === module) {
  const [tool, paramsJson] = process.argv.slice(2)
  if (!tool) {
    console.log('Usage: node mcp-bundle-tools.js <tool> \'' + JSON.stringify({ bundle: '.', compat: true }) + '\'')
    console.log('Tools:', Object.keys(TOOLS).join(', '))
    process.exit(0)
  }
  const params = paramsJson ? JSON.parse(paramsJson) : {}
  handleMCPRequest(tool, params)
    .then((r) => console.log(JSON.stringify(r, null, 2)))
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
}

