const { z } = require('zod')
const { SmartCode } = require('./smart-code')

const Procedure = z.object({
  smart_code: SmartCode, // HERA.{INDUSTRY}.{MODULE}.{PROC}.vN
  preconditions: z.array(z.string()).default([]),
  inputs: z
    .object({
      required: z.array(z.any()),
      optional: z.array(z.any()).default([]),
    })
    .default({ required: [] }),
  outputs: z
    .object({
      entities_created: z.array(z.string()).default([]),
      transactions_emitted: z.array(z.string()).default([]),
    })
    .default({ entities_created: [], transactions_emitted: [] }),
  happy_path: z.array(z.object({ step: z.string() })).default([]),
  errors: z.array(z.object({ code: z.string(), when: z.string() })).default([]),
  checks: z.array(z.object({ description: z.string() })).default([]),
})

module.exports = {
  Procedure,
}

