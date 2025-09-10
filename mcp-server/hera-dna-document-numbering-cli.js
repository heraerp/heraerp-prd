#!/usr/bin/env node

/**
 * HERA DNA Document Numbering CLI Tool
 * Manage universal document numbering across all industries
 * 
 * Usage:
 *   node hera-dna-document-numbering-cli.js generate --org <org-id> --type sales_order --industry furniture
 *   node hera-dna-document-numbering-cli.js industries
 *   node hera-dna-document-numbering-cli.js config --industry restaurant
 *   node hera-dna-document-numbering-cli.js test --org <org-id>
 */

const { createClient } = require('@supabase/supabase-js')

require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// 🧬 HERA DNA: Industry Configurations (matching the TypeScript component)
const HERA_DNA_DOCUMENT_CONFIGS = {
  furniture: {
    industry_code: 'FRN',
    documents: {
      sales_order: { prefix: 'SO-FRN', sequence_start: 1001, description: 'Sales Order' },
      proforma_invoice: { prefix: 'PI-FRN', sequence_start: 2001, description: 'Proforma Invoice' },
      invoice: { prefix: 'INV-FRN', sequence_start: 3001, description: 'Commercial Invoice' },
      delivery_note: { prefix: 'DN-FRN', sequence_start: 4001, description: 'Delivery Note' },
      purchase_order: { prefix: 'PO-FRN', sequence_start: 5001, description: 'Purchase Order' },
      journal_entry: { prefix: 'JE-FRN', sequence_start: 6001, description: 'Journal Entry' },
      quotation: { prefix: 'QT-FRN', sequence_start: 7001, description: 'Quotation' }
    }
  },
  restaurant: {
    industry_code: 'REST',
    documents: {
      sales_order: { prefix: 'SO-REST', sequence_start: 1001, description: 'Food Order' },
      invoice: { prefix: 'INV-REST', sequence_start: 3001, description: 'Restaurant Invoice' },
      kitchen_order: { prefix: 'KO-REST', sequence_start: 8001, description: 'Kitchen Order' },
      table_bill: { prefix: 'TB-REST', sequence_start: 9001, description: 'Table Bill' },
      journal_entry: { prefix: 'JE-REST', sequence_start: 6001, description: 'Journal Entry' },
      purchase_order: { prefix: 'PO-REST', sequence_start: 5001, description: 'Supplier Order' },
      delivery_receipt: { prefix: 'DR-REST', sequence_start: 4001, description: 'Delivery Receipt' }
    }
  },
  salon: {
    industry_code: 'SALON',
    documents: {
      appointment: { prefix: 'APT-SALON', sequence_start: 1001, description: 'Service Appointment' },
      service_invoice: { prefix: 'SVC-SALON', sequence_start: 3001, description: 'Service Invoice' },
      product_sale: { prefix: 'PS-SALON', sequence_start: 2001, description: 'Product Sale' },
      commission_note: { prefix: 'CM-SALON', sequence_start: 7001, description: 'Commission Note' },
      journal_entry: { prefix: 'JE-SALON', sequence_start: 6001, description: 'Journal Entry' },
      purchase_order: { prefix: 'PO-SALON', sequence_start: 5001, description: 'Supply Order' },
      gift_certificate: { prefix: 'GC-SALON', sequence_start: 8001, description: 'Gift Certificate' }
    }
  },
  healthcare: {
    industry_code: 'HLTH',
    documents: {
      patient_record: { prefix: 'PR-HLTH', sequence_start: 1001, description: 'Patient Record' },
      medical_invoice: { prefix: 'MI-HLTH', sequence_start: 3001, description: 'Medical Invoice' },
      prescription: { prefix: 'RX-HLTH', sequence_start: 2001, description: 'Prescription' },
      insurance_claim: { prefix: 'IC-HLTH', sequence_start: 4001, description: 'Insurance Claim' },
      journal_entry: { prefix: 'JE-HLTH', sequence_start: 6001, description: 'Journal Entry' },
      lab_report: { prefix: 'LR-HLTH', sequence_start: 7001, description: 'Lab Report' },
      appointment: { prefix: 'APT-HLTH', sequence_start: 8001, description: 'Medical Appointment' }
    }
  },
  manufacturing: {
    industry_code: 'MFG',
    documents: {
      work_order: { prefix: 'WO-MFG', sequence_start: 1001, description: 'Work Order' },
      production_order: { prefix: 'PO-MFG', sequence_start: 2001, description: 'Production Order' },
      quality_report: { prefix: 'QR-MFG', sequence_start: 3001, description: 'Quality Report' },
      material_receipt: { prefix: 'MR-MFG', sequence_start: 4001, description: 'Material Receipt' },
      journal_entry: { prefix: 'JE-MFG', sequence_start: 6001, description: 'Journal Entry' },
      purchase_order: { prefix: 'PR-MFG', sequence_start: 5001, description: 'Purchase Request' },
      shipping_note: { prefix: 'SN-MFG', sequence_start: 7001, description: 'Shipping Note' }
    }
  },
  retail: {
    industry_code: 'RTL',
    documents: {
      sales_receipt: { prefix: 'SR-RTL', sequence_start: 1001, description: 'Sales Receipt' },
      return_receipt: { prefix: 'RR-RTL', sequence_start: 2001, description: 'Return Receipt' },
      invoice: { prefix: 'INV-RTL', sequence_start: 3001, description: 'Customer Invoice' },
      stock_receipt: { prefix: 'ST-RTL', sequence_start: 4001, description: 'Stock Receipt' },
      journal_entry: { prefix: 'JE-RTL', sequence_start: 6001, description: 'Journal Entry' },
      purchase_order: { prefix: 'PO-RTL', sequence_start: 5001, description: 'Purchase Order' },
      layaway_ticket: { prefix: 'LT-RTL', sequence_start: 7001, description: 'Layaway Ticket' }
    }
  }
}

// Generate document number using HERA DNA logic
function generateDNADocumentNumber(documentType, industry) {
  const industryConfig = HERA_DNA_DOCUMENT_CONFIGS[industry] || HERA_DNA_DOCUMENT_CONFIGS.furniture
  const documentConfig = industryConfig.documents[documentType]
  
  if (!documentConfig) {
    const timestamp = Date.now()
    const prefix = documentType.toUpperCase().slice(0, 3)
    return `${prefix}-${industryConfig.industry_code}-${timestamp}`
  }

  const currentYear = new Date().getFullYear()
  const timestamp = Date.now()
  const sequence = documentConfig.sequence_start + parseInt(timestamp.toString().slice(-4))
  const paddedSequence = sequence.toString().padStart(4, '0')
  
  return `${documentConfig.prefix}-${currentYear}-${paddedSequence}`
}

// Command handlers
const commands = {
  async generate(args) {
    const orgId = args.org || process.env.DEFAULT_ORGANIZATION_ID
    const docType = args.type || 'sales_order'
    const industry = args.industry || 'furniture'
    
    if (!orgId) {
      console.error('❌ Organization ID required')
      return
    }
    
    console.log('\n🧬 HERA DNA Document Number Generation')
    console.log(`Organization: ${orgId}`)
    console.log(`Document Type: ${docType}`)
    console.log(`Industry: ${industry}`)
    
    try {
      const docNumber = generateDNADocumentNumber(docType, industry)
      
      console.log(`\n✅ Generated Document Number: ${docNumber}`)
      
      // Parse and display details
      const parts = docNumber.split('-')
      if (parts.length >= 4) {
        const [type, industryCode, year, sequence] = parts
        console.log(`\n📋 Document Details:`)
        console.log(`  Type Code: ${type}`)
        console.log(`  Industry Code: ${industryCode}`)
        console.log(`  Year: ${year}`)
        console.log(`  Sequence: ${sequence}`)
        console.log(`  Format: HERA DNA Professional`)
      }
      
    } catch (error) {
      console.error('❌ Generation failed:', error.message)
    }
  },

  async industries(args) {
    console.log('\n🧬 HERA DNA Supported Industries')
    console.log('='.repeat(50))
    
    Object.entries(HERA_DNA_DOCUMENT_CONFIGS).forEach(([industry, config]) => {
      console.log(`\n📊 ${industry.toUpperCase()} (${config.industry_code})`)
      console.log(`   Documents: ${Object.keys(config.documents).length} types`)
      
      if (args.verbose) {
        Object.entries(config.documents).forEach(([docType, docConfig]) => {
          const sample = `${docConfig.prefix}-2025-${(docConfig.sequence_start + 1).toString().padStart(4, '0')}`
          console.log(`     ${docConfig.description.padEnd(20)} → ${sample}`)
        })
      }
    })
    
    console.log('\n🔧 Usage:')
    console.log('  node hera-dna-document-numbering-cli.js generate --type sales_order --industry furniture')
    console.log('  node hera-dna-document-numbering-cli.js config --industry restaurant')
  },

  async config(args) {
    const industry = args.industry || 'furniture'
    
    console.log(`\n🧬 HERA DNA ${industry.toUpperCase()} Configuration`)
    console.log('='.repeat(50))
    
    const config = HERA_DNA_DOCUMENT_CONFIGS[industry]
    if (!config) {
      console.error(`❌ Unknown industry: ${industry}`)
      return
    }
    
    console.log(`Industry Code: ${config.industry_code}`)
    console.log(`Document Types: ${Object.keys(config.documents).length}`)
    console.log('')
    
    console.log('📄 Document Type Configuration:')
    console.log('-'.repeat(50))
    
    Object.entries(config.documents).forEach(([docType, docConfig]) => {
      const sample = `${docConfig.prefix}-2025-${(docConfig.sequence_start + 1).toString().padStart(4, '0')}`
      
      console.log(`${docConfig.description}`)
      console.log(`  Type: ${docType}`)
      console.log(`  Prefix: ${docConfig.prefix}`)
      console.log(`  Sequence Start: ${docConfig.sequence_start}`)
      console.log(`  Sample: ${sample}`)
      console.log('')
    })
  },

  async test(args) {
    const orgId = args.org || process.env.DEFAULT_ORGANIZATION_ID
    
    if (!orgId) {
      console.error('❌ Organization ID required')
      return
    }
    
    console.log('\n🧬 HERA DNA Document Numbering Test Suite')
    console.log(`Organization: ${orgId}`)
    
    try {
      console.log('\n🔢 Testing All Industries & Document Types...')
      
      let totalTests = 0
      let successfulTests = 0
      
      Object.entries(HERA_DNA_DOCUMENT_CONFIGS).forEach(([industry, config]) => {
        console.log(`\n📊 Testing ${industry.toUpperCase()}:`)
        
        Object.keys(config.documents).forEach(docType => {
          totalTests++
          try {
            const docNumber = generateDNADocumentNumber(docType, industry)
            const parts = docNumber.split('-')
            const isValid = parts.length >= 4 && parts[2].length === 4 && parseInt(parts[2]) >= 2020
            
            if (isValid) {
              console.log(`  ✅ ${docType.padEnd(20)} → ${docNumber}`)
              successfulTests++
            } else {
              console.log(`  ⚠️ ${docType.padEnd(20)} → ${docNumber} (fallback)`)
            }
          } catch (error) {
            console.log(`  ❌ ${docType.padEnd(20)} → ERROR: ${error.message}`)
          }
        })
      })
      
      console.log('\n📊 Test Results:')
      console.log(`  Total Tests: ${totalTests}`)
      console.log(`  Successful: ${successfulTests}`)
      console.log(`  Success Rate: ${((successfulTests / totalTests) * 100).toFixed(1)}%`)
      
      if (successfulTests === totalTests) {
        console.log('\n🎉 All tests passed! HERA DNA Document Numbering is working perfectly.')
      } else {
        console.log('\n⚠️ Some tests used fallback numbering. This is normal and safe.')
      }
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message)
    }
  },

  help() {
    console.log('\n🧬 HERA DNA Document Numbering CLI Tool')
    console.log('='.repeat(50))
    console.log('\nCommands:')
    console.log('  generate --org <org-id> --type <doc-type> --industry <industry>')
    console.log('    Generate a professional document number')
    console.log('')
    console.log('  industries [--verbose]')
    console.log('    List all supported industries and document types')
    console.log('')
    console.log('  config --industry <industry>')
    console.log('    Show configuration for specific industry')
    console.log('')
    console.log('  test --org <org-id>')
    console.log('    Run comprehensive test suite')
    console.log('')
    console.log('  help')
    console.log('    Show this help message')
    console.log('')
    console.log('Examples:')
    console.log('  node hera-dna-document-numbering-cli.js generate --type sales_order --industry furniture')
    console.log('  node hera-dna-document-numbering-cli.js industries --verbose')
    console.log('  node hera-dna-document-numbering-cli.js config --industry restaurant')
    console.log('  node hera-dna-document-numbering-cli.js test')
  }
}

// Parse command line arguments
const args = {}
const command = process.argv[2] || 'help'

process.argv.slice(3).forEach((arg, index) => {
  if (arg.startsWith('--')) {
    const key = arg.slice(2)
    const nextArg = process.argv[index + 4] // Adjust for slice offset
    
    if (nextArg && !nextArg.startsWith('--')) {
      args[key] = nextArg
    } else {
      args[key] = true
    }
  }
})

// Execute command
if (commands[command]) {
  commands[command](args)
} else {
  console.error(`❌ Unknown command: ${command}`)
  commands.help()
}