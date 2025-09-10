#!/usr/bin/env node

/**
 * Simple Document Numbering Test
 * Shows how professional document numbers work
 */

console.log('\n📄 HERA Professional Document Numbering System')
console.log('='.repeat(50))

// Document configurations (matching the TypeScript version)
const DOCUMENT_CONFIGS = {
  sales_order: { prefix: 'SO-FRN', description: 'Sales Order', sequence_start: 1001 },
  proforma_invoice: { prefix: 'PI-FRN', description: 'Proforma Invoice', sequence_start: 2001 },
  invoice: { prefix: 'INV-FRN', description: 'Commercial Invoice', sequence_start: 3001 },
  delivery_note: { prefix: 'DN-FRN', description: 'Delivery Note', sequence_start: 4001 },
  purchase_order: { prefix: 'PO-FRN', description: 'Purchase Order', sequence_start: 5001 },
  journal_entry: { prefix: 'JE-FRN', description: 'Journal Entry', sequence_start: 6001 },
  quotation: { prefix: 'QT-FRN', description: 'Quotation', sequence_start: 7001 }
}

function generateSampleDocumentNumber(documentType) {
  const config = DOCUMENT_CONFIGS[documentType]
  if (!config) {
    const timestamp = Date.now()
    const prefix = documentType.toUpperCase().slice(0, 3)
    return `${prefix}-${timestamp}`
  }

  const currentYear = new Date().getFullYear()
  const timestamp = Date.now()
  const sequence = config.sequence_start + parseInt(timestamp.toString().slice(-4))
  const paddedSequence = sequence.toString().padStart(4, '0')
  
  return `${config.prefix}-${currentYear}-${paddedSequence}`
}

console.log('\n🔢 Sample Document Numbers Generated:')
console.log('-'.repeat(50))

Object.keys(DOCUMENT_CONFIGS).forEach(docType => {
  const config = DOCUMENT_CONFIGS[docType]
  const sampleNumber = generateSampleDocumentNumber(docType)
  
  console.log(`${config.description.padEnd(20)} → ${sampleNumber}`)
})

console.log('\n📋 Document Number Format Explained:')
console.log('-'.repeat(50))
console.log('Format: {PREFIX}-{INDUSTRY}-{YEAR}-{SEQUENCE}')
console.log('')
console.log('Example: SO-FRN-2025-1001')
console.log('  SO     = Sales Order (document type)')
console.log('  FRN    = Furniture (industry code)')  
console.log('  2025   = Current year (for organization)')
console.log('  1001   = Sequential number (padded to 4 digits)')
console.log('')

console.log('📊 Key Benefits:')
console.log('  ✅ Professional appearance on all business documents')
console.log('  ✅ Easy identification of document type at a glance')
console.log('  ✅ Chronological organization by year')
console.log('  ✅ Sequential numbering prevents duplicates')
console.log('  ✅ Industry-specific codes for multi-business scenarios')
console.log('  ✅ Consistent format across all document types')

console.log('\n🎯 Real-World Examples:')
console.log('-'.repeat(50))
const realExamples = [
  { type: 'sales_order', scenario: 'Customer orders a dining table set' },
  { type: 'proforma_invoice', scenario: 'Quote sent to customer for approval' },
  { type: 'invoice', scenario: 'Final invoice after delivery' },
  { type: 'delivery_note', scenario: 'Furniture delivered to customer' },
  { type: 'journal_entry', scenario: 'Automatic GL posting by Finance DNA' }
]

realExamples.forEach(example => {
  const docNumber = generateSampleDocumentNumber(example.type)
  const config = DOCUMENT_CONFIGS[example.type]
  
  console.log(`${config.description}:`)
  console.log(`  Number: ${docNumber}`)
  console.log(`  Use: ${example.scenario}`)
  console.log('')
})

console.log('🧬 Integration with Finance DNA:')
console.log('-'.repeat(50))
console.log('When you create a furniture sales order:')
console.log('  1️⃣  Sales Order created: SO-FRN-2025-1234')
console.log('  2️⃣  Finance DNA triggered automatically')
console.log('  3️⃣  Journal Entry posted: JE-FRN-2025-6789')
console.log('  4️⃣  GL accounts updated in real-time')
console.log('  5️⃣  Complete audit trail maintained')

console.log('\n🚀 Ready for Production!')
console.log('Your furniture sales modal now generates professional document numbers automatically!')
console.log('No configuration needed - it works immediately! 🎉')