import { Command } from 'commander'
import { SmartCodeValidateInputSchema, SmartCodeValidateOutputSchema } from '../schemas'
import { HERAGuardrails, SMART_CODE_PATTERN } from '../../lib/guardrails/hera-guardrails'

const KNOWN_INDUSTRIES = ['RETAIL', 'RESTAURANT', 'ACCOUNTING', 'CRM', 'INVENTORY', 'ERP', 'HLTH', 'FIN', 'MFG', 'HR']

export function registerSmartCode(cmd: Command) {
  const sc = cmd.command('smart-code').description('Smart code operations')

  sc
    .command('validate')
    .argument('<smart_code>', 'Smart Code to validate')
    .option('--semantic', 'Run semantic checks', false)
    .option('--json', 'Output JSON', false)
    .action(async (smart_code: string, opts) => {
      const parsed = SmartCodeValidateInputSchema.safeParse({ smart_code, semantic: !!opts.semantic, json: !!opts.json })
      if (!parsed.success) {
        console.error(parsed.error.flatten())
        process.exit(1)
      }
      const input = parsed.data

      const result = HERAGuardrails.validateSmartCode(input.smart_code)
      const parts = input.smart_code.split('.')
      const industry = parts[1]
      const moduleSeg = parts[2]

      const output = {
        smart_code: input.smart_code,
        valid: result.passed,
        pattern: SMART_CODE_PATTERN.source,
        hints: result.passed ? [] : result.violations.map(v => v.message),
        semantic_checks: input.semantic
          ? {
              industry_valid: KNOWN_INDUSTRIES.includes(industry),
              module_recognized: moduleSeg?.length >= 2,
              version_current: true
            }
          : undefined,
        suggestions: result.passed ? [] : ['Verify industry/module segments and use a numeric version suffix like v1']
      }

      const validated = SmartCodeValidateOutputSchema.safeParse(output)
      if (!validated.success) {
        console.error('Validation output failed schema:', validated.error.flatten())
        process.exit(1)
      }

      if (input.json || opts.json) console.log(JSON.stringify(validated.data, null, 2))
      else console.log(validated.data)
    })
}
