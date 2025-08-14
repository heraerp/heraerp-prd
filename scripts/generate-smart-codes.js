#!/usr/bin/env node

/**
 * HERA Smart Code Generator
 * 
 * Generates industry-specific smart codes following HERA patterns
 * Usage: npm run generate-smart-codes --module=inventory
 * 
 * Pattern: HERA.{MODULE}.{SUB}.{FUNCTION}.{TYPE}.{VERSION}
 */

const fs = require('fs')
const path = require('path')

// Get command line arguments
const args = process.argv.slice(2)
const getModule = () => args.find(arg => arg.startsWith('--module='))?.split('=')[1]

const moduleName = getModule()

if (!moduleName) {
  console.error('❌ Module name is required: --module=module_name')
  console.log('Example: npm run generate-smart-codes --module=inventory')
  process.exit(1)
}

console.log(`🧠 Generating Smart Codes for: ${moduleName.toUpperCase()}`)
console.log('')

// Smart code templates by module type
const smartCodeTemplates = {
  // Business Modules
  inventory: {
    prefix: 'INV',
    codes: [
      // Entities
      'HERA.INV.ITM.ENT.PROD.v1', // Product items
      'HERA.INV.ITM.ENT.CAT.v1',  // Categories
      'HERA.INV.ITM.ENT.LOC.v1',  // Locations
      'HERA.INV.SUP.ENT.VEN.v1',  // Vendors
      
      // Transactions
      'HERA.INV.RCV.TXN.IN.v1',   // Receiving
      'HERA.INV.ISS.TXN.OUT.v1',  // Issuing
      'HERA.INV.ADJ.TXN.CNT.v1',  // Count adjustments
      'HERA.INV.TRF.TXN.LOC.v1',  // Transfers
      
      // Reports
      'HERA.INV.VAL.RPT.STK.v1',  // Stock valuation
      'HERA.INV.MOV.RPT.HIS.v1',  // Movement history
      'HERA.INV.ABC.RPT.ANL.v1',  // ABC analysis
      'HERA.INV.REO.RPT.SUG.v1',  // Reorder suggestions
      
      // Validations
      'HERA.INV.STK.VAL.MIN.v1',  // Minimum stock validation
      'HERA.INV.PRC.VAL.CST.v1',  // Cost price validation
      'HERA.INV.EXP.VAL.DAT.v1',  // Expiration date validation
    ]
  },
  
  financial: {
    prefix: 'FIN',
    codes: [
      // General Ledger
      'HERA.FIN.GL.ENT.ACC.v1',   // Chart of accounts
      'HERA.FIN.GL.TXN.JE.v1',    // Journal entries
      'HERA.FIN.GL.RPT.TB.v1',    // Trial balance
      'HERA.FIN.GL.RPT.IS.v1',    // Income statement
      'HERA.FIN.GL.RPT.BS.v1',    // Balance sheet
      
      // Accounts Receivable
      'HERA.FIN.AR.ENT.CUS.v1',   // Customer master
      'HERA.FIN.AR.TXN.INV.v1',   // Invoices
      'HERA.FIN.AR.TXN.PAY.v1',   // Payments
      'HERA.FIN.AR.RPT.AGE.v1',   // Aging report
      
      // Accounts Payable
      'HERA.FIN.AP.ENT.VEN.v1',   // Vendor master
      'HERA.FIN.AP.TXN.BIL.v1',   // Bills
      'HERA.FIN.AP.TXN.PAY.v1',   // Payments
      'HERA.FIN.AP.RPT.AGE.v1',   // Aging report
      
      // Validations
      'HERA.FIN.GL.VAL.BAL.v1',   // Balance validation
      'HERA.FIN.AR.VAL.CRD.v1',   // Credit limit validation
      'HERA.FIN.AP.VAL.DUP.v1',   // Duplicate invoice validation
    ]
  },
  
  crm: {
    prefix: 'CRM',
    codes: [
      // Customer Management
      'HERA.CRM.CUS.ENT.PROF.v1', // Customer profiles
      'HERA.CRM.CUS.ENT.CON.v1',  // Contacts
      'HERA.CRM.CUS.ENT.OPP.v1',  // Opportunities
      'HERA.CRM.CUS.ENT.LEA.v1',  // Leads
      
      // Sales Process
      'HERA.CRM.SAL.TXN.QUO.v1',  // Quotes
      'HERA.CRM.SAL.TXN.ORD.v1',  // Sales orders
      'HERA.CRM.SAL.TXN.INV.v1',  // Invoices
      'HERA.CRM.SAL.TXN.RET.v1',  // Returns
      
      // Marketing
      'HERA.CRM.MKT.ENT.CAM.v1',  // Campaigns
      'HERA.CRM.MKT.TXN.EMA.v1',  // Email marketing
      'HERA.CRM.MKT.RPT.ROI.v1',  // ROI reports
      
      // Service
      'HERA.CRM.SVC.TXN.TIC.v1',  // Support tickets
      'HERA.CRM.SVC.TXN.CAL.v1',  // Service calls
      'HERA.CRM.SVC.RPT.SAT.v1',  // Satisfaction reports
    ]
  },
  
  // Industry Modules
  restaurant: {
    prefix: 'REST',
    codes: [
      // Menu Management
      'HERA.REST.MNU.ENT.ITM.v1', // Menu items
      'HERA.REST.MNU.ENT.CAT.v1', // Categories
      'HERA.REST.MNU.ENT.MOD.v1', // Modifiers
      'HERA.REST.MNU.ENT.RCP.v1', // Recipes
      
      // Operations
      'HERA.REST.OPS.TXN.ORD.v1', // Orders
      'HERA.REST.OPS.TXN.TAB.v1', // Tables
      'HERA.REST.OPS.TXN.RES.v1', // Reservations
      'HERA.REST.OPS.TXN.DEL.v1', // Delivery
      
      // Kitchen
      'HERA.REST.KIT.TXN.TIC.v1', // Kitchen tickets
      'HERA.REST.KIT.TXN.PRE.v1', // Prep schedules
      'HERA.REST.KIT.RPT.TIM.v1', // Timing reports
      
      // Financial Integration
      'HERA.REST.FIN.TXN.SAL.v1', // Sales transactions
      'HERA.REST.FIN.RPT.DSR.v1', // Daily sales reports
      'HERA.REST.FIN.RPT.CST.v1', // Cost analysis
      
      // Inventory Integration
      'HERA.REST.INV.TXN.USE.v1', // Ingredient usage
      'HERA.REST.INV.RPT.WAS.v1', // Waste tracking
    ]
  },
  
  healthcare: {
    prefix: 'HLTH',
    codes: [
      // Patient Management
      'HERA.HLTH.PAT.ENT.REC.v1', // Patient records
      'HERA.HLTH.PAT.ENT.INS.v1', // Insurance info
      'HERA.HLTH.PAT.ENT.EMR.v1', // Medical records
      'HERA.HLTH.PAT.ENT.ALL.v1', // Allergies
      
      // Clinical Operations
      'HERA.HLTH.CLN.TXN.APT.v1', // Appointments
      'HERA.HLTH.CLN.TXN.VIS.v1', // Visits
      'HERA.HLTH.CLN.TXN.DIA.v1', // Diagnoses
      'HERA.HLTH.CLN.TXN.PRE.v1', // Prescriptions
      
      // Billing
      'HERA.HLTH.BIL.TXN.CLM.v1', // Insurance claims
      'HERA.HLTH.BIL.TXN.PAY.v1', // Payments
      'HERA.HLTH.BIL.RPT.REV.v1', // Revenue reports
      
      // Compliance
      'HERA.HLTH.CMP.VAL.HIP.v1', // HIPAA compliance
      'HERA.HLTH.CMP.RPT.AUD.v1', // Audit reports
    ]
  },
  
  manufacturing: {
    prefix: 'MFG',
    codes: [
      // Production Planning
      'HERA.MFG.PLN.ENT.BOM.v1',  // Bill of materials
      'HERA.MFG.PLN.ENT.ROU.v1',  // Routing
      'HERA.MFG.PLN.ENT.CAP.v1',  // Capacity
      'HERA.MFG.PLN.TXN.SCH.v1',  // Scheduling
      
      // Production Execution
      'HERA.MFG.EXE.TXN.ORD.v1',  // Production orders
      'HERA.MFG.EXE.TXN.ISS.v1',  // Material issues
      'HERA.MFG.EXE.TXN.REC.v1',  // Production receipts
      'HERA.MFG.EXE.TXN.SCR.v1',  // Scrap reporting
      
      // Quality Control
      'HERA.MFG.QUA.TXN.INS.v1',  // Inspections
      'HERA.MFG.QUA.TXN.NCR.v1',  // Non-conformance
      'HERA.MFG.QUA.RPT.SPC.v1',  // Statistical process control
      
      // Costing
      'HERA.MFG.CST.TXN.VAR.v1',  // Variance reporting
      'HERA.MFG.CST.RPT.ACT.v1',  // Actual costs
    ]
  }
}

// Get the template for the module
const template = smartCodeTemplates[moduleName.toLowerCase()]
if (!template) {
  console.error(`❌ No smart code template found for module: ${moduleName}`)
  console.log('Available modules:', Object.keys(smartCodeTemplates).join(', '))
  process.exit(1)
}

// Generate smart codes
console.log(`📋 Generating ${template.codes.length} smart codes for ${moduleName.toUpperCase()}:`)
console.log('')

const smartCodes = template.codes.map(code => {
  const parts = code.split('.')
  return {
    smart_code: code,
    module: parts[1],
    sub_module: parts[2],
    function_type: parts[3],
    entity_type: parts[4],
    version: parts[5],
    description: generateDescription(code),
    generated_at: new Date().toISOString(),
    generated_by: 'HERA_SMART_CODE_GENERATOR'
  }
})

// Generate descriptions based on smart code patterns
function generateDescription(code) {
  const parts = code.split('.')
  const [, module, sub, func, type, version] = parts
  
  const descriptions = {
    ENT: 'Entity management',
    TXN: 'Transaction processing',
    RPT: 'Report generation',
    VAL: 'Validation rule',
    CFG: 'Configuration setting'
  }
  
  const functionDesc = descriptions[func] || 'Business function'
  return `${module} ${sub} - ${functionDesc} for ${type}`
}

// Output smart codes
smartCodes.forEach((sc, index) => {
  console.log(`${(index + 1).toString().padStart(2, '0')}. ${sc.smart_code}`)
  console.log(`    ${sc.description}`)
})

console.log('')

// Save to file
const outputDir = path.join(process.cwd(), 'generated')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const outputFile = path.join(outputDir, `${moduleName}-smart-codes.json`)
fs.writeFileSync(outputFile, JSON.stringify(smartCodes, null, 2))

// Generate SQL for database insertion
const sqlInserts = smartCodes.map(sc => {
  return `INSERT INTO core_entities (
    organization_id, 
    entity_type, 
    entity_name, 
    entity_code, 
    smart_code,
    status,
    created_at
  ) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'smart_code_template',
    '${sc.description}',
    '${sc.smart_code}',
    '${sc.smart_code}',
    'active',
    NOW()
  );`
}).join('\n\n')

const sqlFile = path.join(outputDir, `${moduleName}-smart-codes.sql`)
fs.writeFileSync(sqlFile, sqlInserts)

// Generate TypeScript definitions
const tsDefinitions = `/**
 * ${moduleName.toUpperCase()} Smart Code Definitions
 * Generated by HERA Smart Code Generator
 */

export const ${moduleName.toUpperCase()}_SMART_CODES = {
${smartCodes.map(sc => {
  const key = sc.smart_code.replace(/\./g, '_').replace(/v\d+$/, '')
  return `  ${key}: '${sc.smart_code}'`
}).join(',\n')}
} as const

export type ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}SmartCode = typeof ${moduleName.toUpperCase()}_SMART_CODES[keyof typeof ${moduleName.toUpperCase()}_SMART_CODES]
`

const tsFile = path.join(outputDir, `${moduleName}-smart-codes.ts`)
fs.writeFileSync(tsFile, tsDefinitions)

// Generate validation file
const validationRules = smartCodes.map(sc => ({
  smart_code: sc.smart_code,
  validation_rules: {
    syntax: {
      pattern: /^HERA\.[A-Z]{3,4}\.[A-Z]{3}\.[A-Z]{3}\.[A-Z]{3,4}\.v\d+$/,
      required_parts: 6,
      version_format: /v\d+$/
    },
    semantic: {
      module_exists: true,
      function_valid: ['ENT', 'TXN', 'RPT', 'VAL', 'CFG'].includes(sc.function_type),
      industry_alignment: true
    },
    performance: {
      max_length: 50,
      indexable: true,
      cache_friendly: true
    }
  }
}))

const validationFile = path.join(outputDir, `${moduleName}-smart-code-validations.json`)
fs.writeFileSync(validationFile, JSON.stringify(validationRules, null, 2))

console.log('📁 Generated files:')
console.log(`  ✅ JSON: ${outputFile}`)
console.log(`  ✅ SQL: ${sqlFile}`)
console.log(`  ✅ TypeScript: ${tsFile}`)
console.log(`  ✅ Validations: ${validationFile}`)
console.log('')
console.log('🎯 Smart Code Summary:')
console.log(`  📊 Total Codes: ${smartCodes.length}`)
console.log(`  🏷️  Module Prefix: ${template.prefix}`)
console.log(`  🧠 Pattern: HERA.${template.prefix}.{SUB}.{FUNCTION}.{TYPE}.v1`)
console.log('')
console.log('🚀 Next Steps:')
console.log('1. Review generated smart codes')
console.log('2. Import SQL into database')
console.log('3. Use TypeScript definitions in your code')
console.log('4. Validate codes using HERA validation API')
console.log('')
console.log('🎉 Smart Code Generation Complete!')