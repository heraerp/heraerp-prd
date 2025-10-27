#!/usr/bin/env node

/**
 * Enterprise Smart Codes Generator
 * Generates smart codes for all enterprise modules
 */

const fs = require('fs')
const path = require('path')

// Enterprise Module Definitions
const enterpriseModules = {
  // Sales & CRM Module
  SALES: {
    CRM: {
      entities: ['LEAD', 'OPP', 'CUST', 'CONT', 'CAMP', 'TERR', 'PIPE', 'FORE'],
      transactions: ['QUAL', 'CONV', 'QUOT', 'ORD', 'INV', 'PAY'],
      reports: ['PIPE', 'FORE', 'PERF', 'CONV', 'REV', 'TERR']
    },
    SD: {
      entities: ['PROD', 'PRIC', 'CUST', 'SHIP', 'BILL'],
      transactions: ['ORD', 'DEL', 'INV', 'RET', 'PAY'],
      reports: ['SALE', 'ORD', 'DEL', 'REV', 'CUST']
    }
  },

  // Finance Module
  FIN: {
    GL: {
      entities: ['ACC', 'COA', 'JE', 'CCTR', 'PCTR'],
      transactions: ['JE', 'POST', 'REV', 'CLOS', 'ADJ'],
      reports: ['TB', 'BS', 'PL', 'CF', 'GL']
    },
    AP: {
      entities: ['VEND', 'INV', 'PAY', 'TERM', 'TAX'],
      transactions: ['PR', 'PO', 'GR', 'IR', 'PAY'],
      reports: ['AGE', 'PAY', 'VEND', 'EXP', 'TAX']
    },
    AR: {
      entities: ['CUST', 'INV', 'PAY', 'TERM', 'CRED'],
      transactions: ['ORD', 'INV', 'PAY', 'CRED', 'COLL'],
      reports: ['AGE', 'COLL', 'CUST', 'REV', 'BAD']
    }
  },

  // Manufacturing Module
  MFG: {
    PP: {
      entities: ['BOM', 'RTG', 'WC', 'CAP', 'PLAN'],
      transactions: ['MRP', 'PLAN', 'SCH', 'CAP', 'MAT'],
      reports: ['PLAN', 'CAP', 'MAT', 'SCH', 'PERF']
    },
    PE: {
      entities: ['PO', 'OP', 'WO', 'QC', 'MAT'],
      transactions: ['REL', 'CONF', 'MOV', 'QC', 'COMP'],
      reports: ['PROD', 'EFF', 'QUA', 'WIP', 'UTIL']
    },
    QM: {
      entities: ['PLAN', 'INSP', 'CERT', 'NC', 'CA'],
      transactions: ['INSP', 'TEST', 'CERT', 'NC', 'CA'],
      reports: ['QUA', 'DEF', 'CERT', 'COST', 'PERF']
    }
  },

  // Procurement Module
  PROC: {
    SRC: {
      entities: ['RFQ', 'BID', 'EVAL', 'CONT', 'SUPP'],
      transactions: ['RFQ', 'BID', 'EVAL', 'NEGO', 'AWRD'],
      reports: ['SRC', 'BID', 'SAVE', 'SUPP', 'PERF']
    },
    PUR: {
      entities: ['REQ', 'PO', 'SUPP', 'CAT', 'CONT'],
      transactions: ['REQ', 'PO', 'GR', 'IR', 'PAY'],
      reports: ['SPEND', 'SUPP', 'SAVE', 'COMP', 'PERF']
    },
    INV: {
      entities: ['SUPP', 'INV', 'MATCH', 'PAY', 'DISC'],
      transactions: ['REC', 'MATCH', 'APP', 'PAY', 'DISC'],
      reports: ['PROC', 'AUTO', 'EXC', 'DISC', 'TAX']
    }
  }
}

function generateSmartCodes() {
  const smartCodes = []
  const timestamp = new Date().toISOString()

  Object.entries(enterpriseModules).forEach(([module, subModules]) => {
    Object.entries(subModules).forEach(([subModule, operations]) => {
      // Generate Entity smart codes
      operations.entities?.forEach(entityType => {
        smartCodes.push({
          smart_code: `HERA.${module}.${subModule}.ENT.${entityType}.v1`,
          module,
          sub_module: subModule,
          function_type: 'ENT',
          entity_type: entityType,
          version: 'v1',
          description: `${module} ${subModule} - Entity management for ${entityType}`,
          generated_at: timestamp,
          generated_by: 'HERA_ENTERPRISE_SMART_CODE_GENERATOR'
        })
      })

      // Generate Transaction smart codes
      operations.transactions?.forEach(transactionType => {
        smartCodes.push({
          smart_code: `HERA.${module}.${subModule}.TXN.${transactionType}.v1`,
          module,
          sub_module: subModule,
          function_type: 'TXN',
          entity_type: transactionType,
          version: 'v1',
          description: `${module} ${subModule} - Transaction processing for ${transactionType}`,
          generated_at: timestamp,
          generated_by: 'HERA_ENTERPRISE_SMART_CODE_GENERATOR'
        })
      })

      // Generate Report smart codes
      operations.reports?.forEach(reportType => {
        smartCodes.push({
          smart_code: `HERA.${module}.${subModule}.RPT.${reportType}.v1`,
          module,
          sub_module: subModule,
          function_type: 'RPT',
          entity_type: reportType,
          version: 'v1',
          description: `${module} ${subModule} - Reporting for ${reportType}`,
          generated_at: timestamp,
          generated_by: 'HERA_ENTERPRISE_SMART_CODE_GENERATOR'
        })
      })
    })
  })

  return smartCodes
}

function generateValidations(smartCodes) {
  const validations = smartCodes.map(sc => ({
    smart_code: sc.smart_code,
    validation_rules: {
      required_fields: ['organization_id', 'entity_name', 'status'],
      entity_type_constraints: {
        [sc.entity_type]: {
          naming_pattern: `^${sc.module}_${sc.entity_type}_[A-Z0-9_]+$`,
          status_values: ['DRAFT', 'ACTIVE', 'APPROVED', 'COMPLETED', 'CANCELLED', 'ARCHIVED'],
          workflow_states: getWorkflowStates(sc.module, sc.function_type, sc.entity_type)
        }
      },
      business_rules: getBusinessRules(sc.module, sc.sub_module, sc.entity_type)
    },
    generated_at: sc.generated_at,
    generated_by: sc.generated_by
  }))

  return validations
}

function getWorkflowStates(module, functionType, entityType) {
  const defaultStates = ['DRAFT', 'SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  
  const specificStates = {
    'SALES.CRM.LEAD': ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'],
    'SALES.CRM.OPP': ['IDENTIFIED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'],
    'FIN.AP.PO': ['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'INVOICED', 'PAID'],
    'PROC.PUR.REQ': ['DRAFT', 'SUBMITTED', 'APPROVED', 'ORDERED', 'RECEIVED', 'COMPLETED'],
    'MFG.PE.PO': ['CREATED', 'RELEASED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  }

  const key = `${module}.${functionType === 'ENT' ? '' : functionType + '.'}${entityType}`
  return specificStates[key] || defaultStates
}

function getBusinessRules(module, subModule, entityType) {
  const baseRules = {
    audit_required: true,
    approval_required: ['APPROVED', 'COMPLETED'],
    delete_restrictions: ['APPROVED', 'COMPLETED', 'IN_PROGRESS']
  }

  const moduleSpecificRules = {
    FIN: {
      ...baseRules,
      posting_period_validation: true,
      fiscal_year_validation: true,
      multi_currency_support: true
    },
    SALES: {
      ...baseRules,
      territory_validation: true,
      commission_calculation: true,
      credit_limit_check: true
    },
    PROC: {
      ...baseRules,
      vendor_validation: true,
      budget_check: true,
      contract_compliance: true
    },
    MFG: {
      ...baseRules,
      material_availability_check: true,
      capacity_validation: true,
      bom_validation: true
    }
  }

  return moduleSpecificRules[module] || baseRules
}

function generateSQL(smartCodes) {
  const sqlStatements = [
    '-- Enterprise Smart Codes SQL Generation',
    '-- Generated automatically - DO NOT EDIT MANUALLY',
    '',
    '-- Insert smart codes into smart_codes table',
    'INSERT INTO smart_codes (smart_code, module, sub_module, function_type, entity_type, version, description, business_rules, is_active, created_at, updated_at) VALUES'
  ]

  const values = smartCodes.map(sc => {
    const businessRules = JSON.stringify(getBusinessRules(sc.module, sc.sub_module, sc.entity_type))
    return `  ('${sc.smart_code}', '${sc.module}', '${sc.sub_module}', '${sc.function_type}', '${sc.entity_type}', '${sc.version}', '${sc.description}', '${businessRules}', true, NOW(), NOW())`
  })

  sqlStatements.push(values.join(',\n'))
  sqlStatements.push('ON CONFLICT (smart_code) DO UPDATE SET')
  sqlStatements.push('  description = EXCLUDED.description,')
  sqlStatements.push('  business_rules = EXCLUDED.business_rules,')
  sqlStatements.push('  updated_at = NOW();')
  sqlStatements.push('')

  return sqlStatements.join('\n')
}

function generateTypeScript(smartCodes) {
  const entityTypes = [...new Set(smartCodes.map(sc => sc.entity_type))].sort()
  const modules = [...new Set(smartCodes.map(sc => sc.module))].sort()
  const subModules = [...new Set(smartCodes.map(sc => sc.sub_module))].sort()

  return `// Enterprise Smart Codes TypeScript Definitions
// Generated automatically - DO NOT EDIT MANUALLY

export interface EnterpriseSmartCode {
  smart_code: string
  module: EnterpriseModule
  sub_module: EnterpriseSubModule
  function_type: 'ENT' | 'TXN' | 'RPT'
  entity_type: EnterpriseEntityType
  version: string
  description: string
  generated_at: string
  generated_by: string
}

export type EnterpriseModule = ${modules.map(m => `'${m}'`).join(' | ')}

export type EnterpriseSubModule = ${subModules.map(sm => `'${sm}'`).join(' | ')}

export type EnterpriseEntityType = ${entityTypes.map(et => `'${et}'`).join(' | ')}

export const ENTERPRISE_SMART_CODES = {
${modules.map(module => `  ${module}: {
${Object.keys(enterpriseModules[module] || {}).map(subModule => `    ${subModule}: {
      ENTITIES: [${(enterpriseModules[module][subModule].entities || []).map(e => `'${e}'`).join(', ')}],
      TRANSACTIONS: [${(enterpriseModules[module][subModule].transactions || []).map(t => `'${t}'`).join(', ')}],
      REPORTS: [${(enterpriseModules[module][subModule].reports || []).map(r => `'${r}'`).join(', ')}]
    }`).join(',\n')}
  }`).join(',\n')}
} as const

export const ENTERPRISE_SMART_CODE_LIST: EnterpriseSmartCode[] = ${JSON.stringify(smartCodes, null, 2)}
`
}

// Main execution
function main() {
  console.log('🚀 Generating Enterprise Smart Codes...')

  const smartCodes = generateSmartCodes()
  const validations = generateValidations(smartCodes)
  const sql = generateSQL(smartCodes)
  const typescript = generateTypeScript(smartCodes)

  // Ensure generated directory exists
  const generatedDir = path.join(__dirname, '..', 'generated')
  if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true })
  }

  // Write files
  fs.writeFileSync(
    path.join(generatedDir, 'enterprise-smart-codes.json'), 
    JSON.stringify(smartCodes, null, 2)
  )

  fs.writeFileSync(
    path.join(generatedDir, 'enterprise-smart-code-validations.json'), 
    JSON.stringify(validations, null, 2)
  )

  fs.writeFileSync(
    path.join(generatedDir, 'enterprise-smart-codes.sql'), 
    sql
  )

  fs.writeFileSync(
    path.join(generatedDir, 'enterprise-smart-codes.ts'), 
    typescript
  )

  console.log(`✅ Generated ${smartCodes.length} enterprise smart codes`)
  console.log('📁 Files created:')
  console.log('  - enterprise-smart-codes.json')
  console.log('  - enterprise-smart-code-validations.json')
  console.log('  - enterprise-smart-codes.sql')
  console.log('  - enterprise-smart-codes.ts')
  console.log('')
  console.log('📊 Summary:')
  console.log(`  - Modules: ${Object.keys(enterpriseModules).length}`)
  console.log(`  - Sub-modules: ${Object.values(enterpriseModules).reduce((sum, m) => sum + Object.keys(m).length, 0)}`)
  console.log(`  - Smart codes: ${smartCodes.length}`)
}

if (require.main === module) {
  main()
}

module.exports = { generateSmartCodes, generateValidations }