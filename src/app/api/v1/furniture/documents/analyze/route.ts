import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateFurnitureInvoice, createSupplierIfNotExists } from '@/lib/furniture/validation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Furniture-specific account mappings for journal entries
const FURNITURE_ACCOUNTS = {
  'cash': { code: '1111000', name: 'Cash in Hand' },
  'bank': { code: '1112000', name: 'Bank Account' },
  'payables': { code: '2111000', name: 'Trade Payables - Suppliers' },
  'raw_materials': { code: '1131000', name: 'Raw Materials - Wood & Timber' },
  'hardware': { code: '1132000', name: 'Hardware & Fittings' },
  'fabric': { code: '1135000', name: 'Fabric & Upholstery Materials' },
  'material_cost': { code: '5111000', name: 'Wood & Timber Costs' },
  'hardware_cost': { code: '5112000', name: 'Hardware & Fittings Cost' },
  'fabric_cost': { code: '5113000', name: 'Fabric & Upholstery Cost' },
  'transport_cost': { code: '5310000', name: 'Transportation & Delivery' },
  'utilities': { code: '5410000', name: 'Electricity & Utilities' },
  'other_expense': { code: '5900000', name: 'Other Operating Expenses' }
}

// Known furniture suppliers and keywords for validation
const FURNITURE_KEYWORDS = [
  'wood', 'timber', 'plywood', 'veneer', 'lumber',
  'hardware', 'hinge', 'drawer', 'handle', 'screw', 'nail',
  'fabric', 'upholstery', 'foam', 'cushion', 'textile',
  'furniture', 'carpenter', 'woodwork', 'joinery',
  'polish', 'varnish', 'paint', 'coating', 'finish'
]

const NON_FURNITURE_VENDORS = [
  'restaurant', 'food', 'grocery', 'medical', 'pharma',
  'software', 'technology', 'consulting', 'travel',
  'hotel', 'telecom', 'insurance', 'bank'
]

// Function to validate if invoice is furniture-related
function isFurnitureRelated(vendorName: string, items: any[]): boolean {
  const lowerVendor = vendorName.toLowerCase()
  const itemDescriptions = items.map(item => item.description?.toLowerCase() || '').join(' ')
  const allText = `${lowerVendor} ${itemDescriptions}`.toLowerCase()
  
  // Check for non-furniture indicators
  for (const keyword of NON_FURNITURE_VENDORS) {
    if (allText.includes(keyword)) {
      return false
    }
  }
  
  // Check for furniture indicators
  for (const keyword of FURNITURE_KEYWORDS) {
    if (allText.includes(keyword)) {
      return true
    }
  }
  
  return false // Default to false if uncertain
}

// Mock AI analysis for document (in production, this would use OCR + AI)
function mockAnalyzeDocument(fileName: string): any {
  // Simulate AI extraction based on filename patterns
  const lowerName = fileName.toLowerCase()
  
  const vendors = [
    { name: 'Wood Suppliers Ltd', category: 'materials' },
    { name: 'Hardware Express', category: 'hardware' },
    { name: 'Fabric World', category: 'fabric' },
    { name: 'Transport Services', category: 'transport' },
    { name: 'City Electricity Board', category: 'utilities' }
  ]
  
  const randomVendor = vendors[Math.floor(Math.random() * vendors.length)]
  const baseAmount = Math.floor(Math.random() * 50000) + 5000
  
  // Determine expense category based on vendor or filename
  let expenseAccount = 'other_expense'
  let inventoryAccount = null
  
  if (randomVendor.category === 'materials' || lowerName.includes('wood') || lowerName.includes('timber')) {
    expenseAccount = 'material_cost'
    inventoryAccount = 'raw_materials'
  } else if (randomVendor.category === 'hardware' || lowerName.includes('hardware')) {
    expenseAccount = 'hardware_cost'
    inventoryAccount = 'hardware'
  } else if (randomVendor.category === 'fabric' || lowerName.includes('fabric')) {
    expenseAccount = 'fabric_cost'
    inventoryAccount = 'fabric'
  } else if (randomVendor.category === 'transport' || lowerName.includes('transport')) {
    expenseAccount = 'transport_cost'
  } else if (randomVendor.category === 'utilities' || lowerName.includes('utility')) {
    expenseAccount = 'utilities'
  }
  
  // Generate line items
  const items = []
  if (inventoryAccount) {
    items.push({
      description: `${randomVendor.category} purchase`,
      quantity: Math.floor(Math.random() * 100) + 10,
      unit: randomVendor.category === 'materials' ? 'sq ft' : 'units',
      amount: baseAmount
    })
  } else {
    items.push({
      description: `${randomVendor.category} services`,
      amount: baseAmount
    })
  }
  
  return {
    vendor_name: randomVendor.name,
    invoice_number: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    amount: baseAmount,
    tax_amount: Math.floor(baseAmount * 0.18), // 18% GST
    total_amount: Math.floor(baseAmount * 1.18),
    items: items,
    category: randomVendor.category,
    confidence: 0.95,
    expense_account: expenseAccount,
    inventory_account: inventoryAccount
  }
}

export async function POST(request: NextRequest) {
  try {
    const { fileId, fileName, organizationId } = await request.json()
    
    if (!fileId || !fileName || !organizationId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 })
    }

    // In production, this would:
    // 1. Fetch the file from Supabase storage
    // 2. Use OCR to extract text
    // 3. Use AI to analyze and structure the data
    
    // For now, we'll use mock analysis
    const analysis = mockAnalyzeDocument(fileName)
    
    // Validate the invoice
    const validation = await validateFurnitureInvoice(
      analysis.vendor_name,
      analysis.items,
      organizationId
    )
    
    // If not furniture-related, suggest general expense
    if (!validation.isFurnitureRelated) {
      return NextResponse.json({
        success: true,
        message: 'Document analyzed - Not furniture related',
        data: {
          analysis: {
            ...analysis,
            is_furniture_related: false,
            validation: validation,
            suggested_action: 'general_expense'
          },
          journalEntry: {
            debits: [{
              account: 'General Operating Expenses',
              amount: analysis.total_amount
            }],
            credits: [{
              account: 'Trade Payables',
              amount: analysis.total_amount
            }]
          },
          suggestedMessage: `Record general expense for ${analysis.vendor_name} - ${analysis.total_amount.toLocaleString('en-IN')}. ${validation.message}`,
          warning: validation.message
        }
      })
    }
    
    // If supplier doesn't exist, create them
    let supplierId = validation.supplierId
    if (!validation.supplierExists) {
      const supplierResult = await createSupplierIfNotExists(
        analysis.vendor_name,
        organizationId,
        validation.suggestedCategory
      )
      
      if (supplierResult.success) {
        supplierId = supplierResult.supplierId
      }
    }
    
    // Generate journal entry based on analysis
    const journalEntry = {
      debits: [],
      credits: []
    }
    
    // If it's an inventory purchase, debit inventory account
    if (analysis.inventory_account) {
      journalEntry.debits.push({
        account: FURNITURE_ACCOUNTS[analysis.inventory_account].name,
        amount: analysis.amount
      })
    } else {
      // Otherwise, debit expense account
      journalEntry.debits.push({
        account: FURNITURE_ACCOUNTS[analysis.expense_account].name,
        amount: analysis.amount
      })
    }
    
    // Add tax as separate debit
    if (analysis.tax_amount > 0) {
      journalEntry.debits.push({
        account: 'Input Tax Credit - GST',
        amount: analysis.tax_amount
      })
    }
    
    // Credit payables or cash/bank
    journalEntry.credits.push({
      account: FURNITURE_ACCOUNTS.payables.name,
      amount: analysis.total_amount
    })
    
    // Store analysis in core_dynamic_data
    const { error: analysisError } = await supabase
      .from('core_dynamic_data')
      .insert({
        entity_id: fileId,
        organization_id: organizationId,
        field_name: 'document_analysis',
        field_value_json: {
          ...analysis,
          supplier_id: supplierId,
          validation: validation,
          analyzed_at: new Date().toISOString(),
          confidence_score: analysis.confidence
        },
        smart_code: 'HERA.FURNITURE.DOCUMENT.ANALYSIS.v1'
      })

    if (analysisError) {
      console.error('Error storing analysis:', analysisError)
    }

    // Create suggested message for the chat
    const suggestedMessage = `Paid ${analysis.vendor_name} ${analysis.total_amount.toLocaleString('en-IN')} for ${
      analysis.items.map(item => item.description).join(', ')
    }`
    
    // Update document entity with vendor info
    const { error: updateError } = await supabase
      .from('core_entities')
      .update({
        entity_name: `${analysis.vendor_name} - ${fileName}`,
        metadata: {
          vendor_name: analysis.vendor_name,
          invoice_number: analysis.invoice_number,
          invoice_date: analysis.date,
          total_amount: analysis.total_amount,
          supplier_id: supplierId,
          is_furniture_related: validation.isFurnitureRelated,
          category: validation.suggestedCategory,
          analyzed: true
        }
      })
      .eq('id', fileId)

    if (updateError) {
      console.error('Error updating document entity:', updateError)
    }

    // Record analysis transaction
    const { error: transactionError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'document_analysis',
        transaction_code: `ANALYSIS-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        source_entity_id: fileId,
        target_entity_id: supplierId, // Link to supplier
        smart_code: 'HERA.FURNITURE.DOCUMENT.ANALYSIS.TXN.v1',
        metadata: {
          vendor_name: analysis.vendor_name,
          invoice_amount: analysis.total_amount,
          confidence: analysis.confidence,
          is_furniture_related: validation.isFurnitureRelated,
          category: validation.suggestedCategory,
          validation_message: validation.message,
          supplier_created: !validation.supplierExists,
          action: 'ai_analysis'
        }
      })

    if (transactionError) {
      console.error('Error creating analysis transaction:', transactionError)
    }

    return NextResponse.json({
      success: true,
      message: 'Document analyzed successfully',
      data: {
        analysis,
        journalEntry,
        suggestedMessage
      }
    })
    
  } catch (error) {
    console.error('Document analysis error:', error)
    return NextResponse.json({
      success: false,
      message: 'Document analysis failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}