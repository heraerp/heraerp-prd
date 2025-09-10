# HERA CLI HANDOVER PACKAGE
**For Codex (Engineer/Tester/CI) Implementation**

## 🎯 OPERATING MODEL SUMMARY

**Roles:**
- **Claude (Designer/Spec Author)**: CLI UX spec, command contracts, error design, examples, mocks ✅ COMPLETE
- **Codex (Engineer/Tester/CI)**: Code, tests, pipelines, release automation ⏳ READY TO START
- **You (Product/Owner)**: Approve specs, steward HERA rules (six-table + smart codes) ⏳ REVIEW REQUIRED

## 📋 DEFINITION OF DONE (PER COMMAND)

- [ ] Contract tested (unit + API), e2e happy path + 1 failure
- [ ] Writes flow through universal_transactions + universal_transaction_lines; no ad-hoc tables
- [ ] Smart Codes validated (HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{N}) + versioned
- [ ] Telemetry + logs (success/failure, latency) and CLI --json output stable
- [ ] Docs snippet in AGENTS.md + --help updated

## 🔧 CLI COMMAND SPECIFICATIONS

### Command 1: `hera init`

**Purpose**: Bootstrap workspace against HERA org, verify guardrails + schema access

**Input Schema** (JSON Schema):
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "org": {
      "type": "string",
      "format": "uuid",
      "description": "Organization UUID (optional; interactive if absent)"
    },
    "url": {
      "type": "string",
      "format": "uri",
      "description": "Database URL or API endpoint"
    },
    "writeConfig": {
      "type": "boolean",
      "default": false,
      "description": "Write .hera/config.json"
    }
  }
}
```

**Output Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "organization_id": {
      "type": "string",
      "format": "uuid"
    },
    "sacred_tables_ok": {
      "type": "boolean"
    },
    "guardrails_version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
    },
    "capabilities": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["finance_dna", "fiscal_year_close", "auto_journal", "universal_cashflow"]
      }
    }
  },
  "required": ["organization_id", "sacred_tables_ok", "guardrails_version"]
}
```

**Exit Codes**:
- 0: Success
- 10: Connection/auth failure
- 11: Missing Sacred Six access
- 12: Organization not found/unauthorized  
- 13: Guardrail charter not available

**Test Vectors**:
```bash
# Happy path
hera init --org 11111111-1111-1111-1111-111111111111 --write-config

# Missing org (should prompt)
hera init

# Invalid org
hera init --org invalid-uuid-format

# Connection failure
HERA_DB_URL=invalid://url hera init
```

---

### Command 2: `hera smart-code validate`

**Purpose**: Validate Smart Code against HERA pattern + optional semantic checks

**Input Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "smart_code": {
      "type": "string",
      "pattern": "^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$",
      "description": "Smart code to validate"
    },
    "json": {
      "type": "boolean",
      "default": false,
      "description": "Output in JSON format"
    }
  },
  "required": ["smart_code"]
}
```

**Output Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "smart_code": {
      "type": "string"
    },
    "valid": {
      "type": "boolean"
    },
    "pattern": {
      "type": "string"
    },
    "hints": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "semantic_checks": {
      "type": "object",
      "properties": {
        "industry_valid": {"type": "boolean"},
        "module_recognized": {"type": "boolean"},
        "version_current": {"type": "boolean"}
      }
    }
  },
  "required": ["smart_code", "valid", "pattern"]
}
```

**Exit Codes**:
- 0: Valid
- 20: Invalid format
- 21: Reserved or deprecated version

**Test Vectors**:
```bash
# Valid codes
hera smart-code validate "HERA.RESTAURANT.POS.TXN.SALE.v1"
hera smart-code validate "HERA.ACCOUNTING.COA.ACCOUNT.GL.ASSET.v1"

# Invalid codes
hera smart-code validate "hera.restaurant.pos.txn.sale.v1"  # lowercase
hera smart-code validate "HERA.REST.SALE"  # missing version
hera smart-code validate "INVALID.CODE.FORMAT.v1"  # wrong prefix
```

---

### Command 3: `hera tx create`

**Purpose**: Create universal transaction with lines, respecting multi-tenancy + smart codes + balancing

**Input Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "org": {
      "type": "string",
      "format": "uuid",
      "description": "Organization UUID"
    },
    "code": {
      "type": "string",
      "pattern": "^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$",
      "description": "Transaction smart code"
    },
    "type": {
      "type": "string",
      "enum": ["SALE", "PURCHASE", "PAYMENT", "RECEIPT", "GL_JE", "TRANSFER"],
      "description": "Transaction type"
    },
    "total": {
      "type": "number",
      "minimum": 0,
      "description": "Total amount (computed from lines if omitted)"
    },
    "txDate": {
      "type": "string",
      "format": "date-time",
      "description": "Transaction date (default now)"
    },
    "meta": {
      "type": "object",
      "description": "Additional metadata"
    },
    "lines": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "line_number": {"type": "integer", "minimum": 1},
          "line_type": {"type": "string", "enum": ["ITEM", "GL", "TAX", "FEE", "DISCOUNT"]},
          "entity_id": {"type": "string", "format": "uuid"},
          "quantity": {"type": "number", "minimum": 0, "default": 1},
          "unit_amount": {"type": "number"},
          "line_amount": {"type": "number"},
          "tax_amount": {"type": "number", "default": 0},
          "smart_code": {
            "type": "string",
            "pattern": "^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$"
          },
          "line_data": {"type": "object"}
        },
        "required": ["line_number", "line_type", "line_amount", "smart_code"]
      }
    }
  },
  "required": ["code", "type", "lines"]
}
```

**Output Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "transaction_id": {"type": "string", "format": "uuid"},
    "organization_id": {"type": "string", "format": "uuid"},
    "transaction_type": {"type": "string"},
    "smart_code": {"type": "string"},
    "transaction_date": {"type": "string", "format": "date-time"},
    "total_amount": {"type": "number"},
    "lines": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {"type": "string", "format": "uuid"},
          "line_number": {"type": "integer"},
          "line_type": {"type": "string"},
          "entity_id": {"type": "string", "format": "uuid"},
          "line_amount": {"type": "number"},
          "smart_code": {"type": "string"}
        }
      }
    },
    "ai_confidence": {"type": "number", "minimum": 0, "maximum": 1},
    "ai_insights": {"type": "object"},
    "guardrails_passed": {
      "type": "object",
      "properties": {
        "multi_tenant": {"type": "boolean"},
        "smart_codes_valid": {"type": "boolean"},
        "gl_balanced": {"type": "boolean"}
      }
    }
  },
  "required": ["transaction_id", "organization_id", "transaction_type", "total_amount"]
}
```

**Exit Codes**:
- 0: Success
- 30: Missing organization_id (multi-tenancy violation)
- 31: Invalid smart code (header or lines)
- 32: GL not balanced per currency
- 33: Schema constraint violation

**Test Vectors**:
```bash
# Sale with item line
hera tx create \
  --org 11111111-1111-1111-1111-111111111111 \
  --type SALE \
  --code HERA.RETAIL.ORDERS.SALE.ONLINE.v1 \
  --lines '[{
    "line_number":1,
    "line_type":"ITEM",
    "entity_id":"22222222-2222-2222-2222-222222222222",
    "quantity":1,
    "unit_amount":19.99,
    "line_amount":19.99,
    "smart_code":"HERA.RETAIL.ORDERS.LINE.ITEM.v1"
  }]'

# Balanced GL journal
hera tx create \
  --org 11111111-1111-1111-1111-111111111111 \
  --type GL_JE \
  --code HERA.ACCOUNTING.GL.JOURNAL.ENTRY.v1 \
  --lines '[{
    "line_number":1,
    "line_type":"GL",
    "line_amount":100,
    "smart_code":"HERA.ACCOUNTING.GL.LINE.DEBIT.v1",
    "line_data":{"account":"1000","currency":"USD"}
  },{
    "line_number":2,
    "line_type":"GL", 
    "line_amount":-100,
    "smart_code":"HERA.ACCOUNTING.GL.LINE.CREDIT.v1",
    "line_data":{"account":"2000","currency":"USD"}
  }]'

# Unbalanced GL (should fail with exit 32)
hera tx create \
  --org 11111111-1111-1111-1111-111111111111 \
  --type GL_JE \
  --code HERA.ACCOUNTING.GL.JOURNAL.ENTRY.v1 \
  --lines '[{
    "line_number":1,
    "line_type":"GL",
    "line_amount":100,
    "smart_code":"HERA.ACCOUNTING.GL.LINE.DEBIT.v1"
  },{
    "line_number":2,
    "line_type":"GL",
    "line_amount":-50,
    "smart_code":"HERA.ACCOUNTING.GL.LINE.CREDIT.v1"
  }]'
```

## 🧪 TESTING MATRIX

| Case | `init` | `smart-code validate` | `tx create` |
|------|--------|----------------------|-------------|
| **Happy path** | Sacred Six visible → ok | Valid code → valid:true | SALE header+line inserts; totals computed |
| **Missing org** | prompt/flag required | n/a | exit 30, message about org_id |
| **Invalid code** | n/a | exit 20 | exit 31 |
| **Schema fail** | n/a | n/a | remove line_type to trigger 33 |
| **GL balance** | n/a | n/a | balanced → ok; unbalanced → 32 |

## 🛡️ HERA GUARDRAILS (MANDATORY ENFORCEMENT)

### Sacred Six Tables (NEVER VIOLATE)
```typescript
const SACRED_TABLES = [
  'core_organizations',
  'core_entities', 
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
] as const
```

### Smart Code Regex (STRICT ENFORCEMENT)
```typescript
const SMART_CODE_PATTERN = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/
```

### Multi-Tenancy Filter (ALWAYS REQUIRED)
```typescript
// Every query MUST include organization_id filter
const enforceOrgFilter = (query: any, orgId: string) => {
  if (!orgId) throw new Error('organization_id required for multi-tenancy')
  return query.where('organization_id', orgId)
}
```

### GL Balancing Rule (FOR JOURNAL ENTRIES)
```typescript
const validateGLBalance = (lines: TransactionLine[]) => {
  const balances = new Map<string, number>()
  
  lines.forEach(line => {
    if (line.line_type === 'GL') {
      const currency = line.line_data?.currency || 'USD'
      balances.set(currency, (balances.get(currency) || 0) + line.line_amount)
    }
  })
  
  return Array.from(balances.values()).every(balance => Math.abs(balance) < 0.01)
}
```

## 🏗️ IMPLEMENTATION SCAFFOLDS

### CLI Entry Point (`src/cli/index.ts`)
```typescript
#!/usr/bin/env node
import { Command } from 'commander'
import { initCommand } from './commands/init'
import { smartCodeCommand } from './commands/smart-code'
import { txCommand } from './commands/tx'

const program = new Command()

program
  .name('hera')
  .description('HERA Universal ERP CLI')
  .version('1.0.0')

program
  .command('init')
  .description('Initialize HERA workspace')
  .option('--org <uuid>', 'Organization UUID')
  .option('--url <url>', 'Database URL')
  .option('--write-config', 'Write .hera/config.json')
  .action(initCommand)

program
  .command('smart-code')
  .description('Smart code operations')
  .command('validate <code>')
  .option('--json', 'JSON output')
  .action(smartCodeCommand.validate)

program
  .command('tx')
  .description('Transaction operations')
  .command('create')
  .requiredOption('--code <smart_code>', 'Transaction smart code')
  .requiredOption('--type <type>', 'Transaction type')
  .requiredOption('--lines <json>', 'Transaction lines JSON')
  .option('--org <uuid>', 'Organization UUID')
  .option('--json', 'JSON output')
  .action(txCommand.create)

program.parse()
```

### Zod Validation Schemas (`src/cli/schemas.ts`)
```typescript
import { z } from 'zod'

export const SmartCodeSchema = z.string().regex(
  /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/,
  'Invalid smart code format'
)

export const UUIDSchema = z.string().uuid()

export const TransactionLineSchema = z.object({
  line_number: z.number().int().positive(),
  line_type: z.enum(['ITEM', 'GL', 'TAX', 'FEE', 'DISCOUNT']),
  entity_id: UUIDSchema.optional(),
  quantity: z.number().nonnegative().default(1),
  unit_amount: z.number().optional(),
  line_amount: z.number(),
  tax_amount: z.number().default(0),
  smart_code: SmartCodeSchema,
  line_data: z.record(z.any()).optional()
})

export const CreateTransactionSchema = z.object({
  org: UUIDSchema.optional(),
  code: SmartCodeSchema,
  type: z.enum(['SALE', 'PURCHASE', 'PAYMENT', 'RECEIPT', 'GL_JE', 'TRANSFER']),
  total: z.number().nonnegative().optional(),
  txDate: z.string().datetime().optional(),
  meta: z.record(z.any()).optional(),
  lines: z.array(TransactionLineSchema).min(1)
})
```

### Test Structure (`tests/cli/`)
```
tests/cli/
├── unit/
│   ├── init.test.ts
│   ├── smart-code.test.ts
│   └── tx.test.ts
├── api/
│   ├── init.api.test.ts
│   ├── smart-code.api.test.ts  
│   └── tx.api.test.ts
├── e2e/
│   ├── happy-path.e2e.test.ts
│   └── failure-modes.e2e.test.ts
└── fixtures/
    ├── organizations.json
    ├── entities.json
    └── transactions.json
```

### Vitest Config (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'coverage/']
    }
  }
})
```

### Playwright E2E (`tests/e2e/cli.spec.ts`)
```typescript
import { test, expect } from '@playwright/test'
import { execSync } from 'child_process'

test.describe('HERA CLI E2E', () => {
  test('init → smart-code → tx create happy path', async () => {
    // Test the full workflow
    const initResult = execSync('hera init --org 11111111-1111-1111-1111-111111111111 --write-config', {
      encoding: 'utf8'
    })
    expect(initResult).toContain('organization_id')
    
    const validateResult = execSync('hera smart-code validate "HERA.RETAIL.ORDERS.SALE.ONLINE.v1" --json', {
      encoding: 'utf8'
    })
    const validation = JSON.parse(validateResult)
    expect(validation.valid).toBe(true)
    
    const txResult = execSync(`hera tx create --type SALE --code "HERA.RETAIL.ORDERS.SALE.ONLINE.v1" --lines '[{"line_number":1,"line_type":"ITEM","line_amount":19.99,"smart_code":"HERA.RETAIL.ORDERS.LINE.ITEM.v1"}]' --json`, {
      encoding: 'utf8'
    })
    const transaction = JSON.parse(txResult)
    expect(transaction.transaction_id).toBeDefined()
  })
})
```

## 🚀 CI/CD PIPELINE

### GitHub Actions (`.github/workflows/ci.yml`)
```yaml
name: HERA CLI CI/CD

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-and-type:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      
  schema-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci  
      - run: npm run schema:validate
      - run: npm run schema:types
      
  test-suite:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        test-type: [unit, api, e2e-smoke]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:${{ matrix.test-type }}
      
  guardrail-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run guardrail:check
      - run: npm run sacred:validate
      
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm audit --audit-level=high
      - run: npm run security:scan
      
  build-artifact:
    runs-on: ubuntu-latest
    needs: [lint-and-type, schema-validation, test-suite, guardrail-gates]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build
      - run: npm pack
      - uses: actions/upload-artifact@v4
        with:
          name: hera-cli-tarball
          path: '*.tgz'
```

## 📝 REVIEW CHECKLIST (For Codex)

### Code Review Requirements
- [ ] ✅ Uses only Sacred Six tables
- [ ] ✅ Smart Code present & valid on all entities/transactions  
- [ ] ✅ organization_id always present and filtered
- [ ] ✅ No schema drift (no new tables/columns)
- [ ] ✅ Transactions balanced per currency (GL entries)
- [ ] ✅ Complete audit trail fields populated
- [ ] ✅ All exit codes documented and tested
- [ ] ✅ JSON output stable and schema-compliant
- [ ] ✅ Error messages helpful and actionable

### CI Gates (MUST PASS)
- [ ] build, type-check, lint/format ✅
- [ ] schema:types + schema:validate ✅  
- [ ] unit + API + e2e:smoke on PR ✅
- [ ] full e2e on main ✅
- [ ] security scan (audit/SAST) ✅
- [ ] guardrail validation ✅

### Performance Requirements
- [ ] Median CI time <12 min PR; <20 min main
- [ ] Command response time <5s for typical operations
- [ ] Memory usage <100MB for CLI operations
- [ ] Flake rate <2%; seed determinism 100%

## 🎯 SUCCESS METRICS

- **💚 % PRs merged on first review pass**: Target >70%
- **⏱️ Median CI time**: <12 min PR; <20 min main  
- **🧪 Flake rate**: <2%; seed determinism 100%
- **📈 Command crash rate**: <0.5% in preview
- **🔒 Security violations**: 0 in production
- **📊 Schema drift incidents**: 0 per release

## 🚨 COMMON PITFALLS TO AVOID

1. **Ambiguous CLI output** - Always provide --json option
2. **Tests bypassing universal tables** - Use Sacred Six only
3. **Smart Codes without version bumps** - Always increment versions
4. **Spec drift after review** - Freeze contracts per release tag
5. **Missing organization_id** - Multi-tenancy is sacred
6. **GL entries not balanced** - Validate debits = credits per currency
7. **Schema changes** - Use dynamic fields instead
8. **Hard-coded values** - Use environment/config
9. **Missing error handling** - Every operation can fail
10. **Poor test coverage** - Cover all exit codes and edge cases

---

## 📞 HANDOFF READY

**Codex**: You now have everything needed to implement the HERA CLI:

1. ✅ Complete command specifications with I/O contracts
2. ✅ JSON schemas for validation  
3. ✅ Test scaffolds (Vitest + Playwright)
4. ✅ CI/CD pipeline configuration
5. ✅ Sacred guardrails and validation rules
6. ✅ Implementation patterns and examples
7. ✅ Review checklist and success metrics

**Start with `hera init` command first** - it's the foundation for all other commands.

**Questions for first review cycle:**
- Are the JSON schemas complete and accurate?
- Do the exit codes cover all failure modes?
- Is the test matrix sufficient for coverage?
- Any missing guardrails or validation rules?

Ready to begin implementation! 🚀