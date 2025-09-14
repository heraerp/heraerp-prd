const { z } = require('zod')
const { SmartCode } = require('./smart-code')

// Orchestration contract schema
const Orchestration = z.object({
  smart_code: SmartCode, // HERA.SYSTEM.PLAYBOOK.{NAME}.v1
  contracts: z.array(z.string()), // relative paths to child YAMLs
  graph: z.array(z.tuple([z.string(), z.string()])).optional(), // ["a.yaml","b.yaml"] => a→b
  vars: z.record(z.any()).default({}),
})

module.exports = {
  Orchestration,
}

