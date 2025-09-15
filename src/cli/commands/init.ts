import { Command } from 'commander'
import { InitInputSchema, InitOutputSchema } from '../schemas'
import { HERAGuardrails, SACRED_TABLES, CLI_EXIT_CODES } from '../../lib/guardrails/hera-guardrails'
import { getDb, checkTable } from '../db'

export function registerInit(cmd: Command) {
  cmd
    .command('init')
    .description('Workspace bootstrapping with organization verification')
    .option('--org <uuid>', 'Organization ID (UUID)')
    .option('--url <url>', 'API URL (optional)')
    .option('--write-config', 'Write local CLI config', false)
    .option('--interactive', 'Interactive mode', true)
    .option('--json', 'Output JSON', false)
    .action(async opts => {
      const parsed = InitInputSchema.safeParse(opts)
      if (!parsed.success) {
        console.error('Invalid input:', parsed.error.flatten())
        process.exit(1)
      }

      const input = parsed.data
      let connection_status: 'connected' | 'mock' | 'offline' = 'offline'
      const output: any = {
        organization_id: input.org || '00000000-0000-0000-0000-000000000000',
        sacred_tables_ok: false,
        guardrails_version: '2.0.0',
        capabilities: ['finance_dna', 'auto_journal', 'universal_cashflow'],
        connection_status
      }

      try {
        const client = getDb()
        await client.connect()
        connection_status = 'connected'
        // Check sacred tables
        for (const t of SACRED_TABLES) {
          await checkTable(client, t)
        }

        output.sacred_tables_ok = true
        output.connection_status = connection_status

        // Org verification (if provided)
        if (input.org) {
          const r = await client.query('SELECT id FROM core_organizations WHERE id = $1', [
            input.org
          ])
          if (r.rowCount === 0) {
            console.error('Organization not found')
            await client.end()
            process.exit(CLI_EXIT_CODES.ORG_NOT_FOUND)
          }
          output.organization_id = input.org
        } else {
          // Try to pick a default org if exists
          const r = await client.query(
            'SELECT id FROM core_organizations ORDER BY created_at ASC LIMIT 1'
          )
          if (r.rowCount > 0) output.organization_id = r.rows[0].id
        }

        await client.end()
      } catch (e: any) {
        // If DB not reachable, fall back to mock mode
        output.connection_status = 'mock'
      }

      // Optionally write config
      if (input.writeConfig) {
        try {
          const fs = await import('node:fs')
          const path = await import('node:path')
          const configPath = path.resolve(process.cwd(), '.hera-cli.json')
          const config = {
            organization_id: output.organization_id,
            output_format: 'table',
            guardrails: {
              enforce_smart_codes: true,
              enforce_multi_tenancy: true,
              enforce_gl_balance: true
            }
          }
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
          output.config_written = true
        } catch {
          output.config_written = false
        }
      }

      const validated = InitOutputSchema.safeParse(output)
      if (!validated.success) {
        console.error('Init produced invalid output shape:', validated.error.flatten())
        process.exit(1)
      }

      if (opts.json) console.log(JSON.stringify(validated.data, null, 2))
      else
        console.log(
          'HERA initialized for org',
          validated.data.organization_id,
          `(${validated.data.connection_status})`
        )
    })
}
