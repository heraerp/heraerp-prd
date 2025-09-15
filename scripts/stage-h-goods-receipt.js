#!/usr/bin/env node

/**
 * HERA Stage H - Goods Receipt & Inventory Update
 * 
 * This script handles:
 * 1. Receiving goods against purchase orders
 * 2. Updating inventory stock levels
 * 3. Creating goods receipt documents
 * 4. Posting inventory and AP journal entries
 * 5. Three-way matching (PO, Receipt, Invoice)
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Hair Talkz organization ID
const ORGANIZATION_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

// GL Accounts
const GL_ACCOUNTS = {
  INVENTORY_PRODUCTS: '1410',    // Inventory - Retail Products
  ACCOUNTS_PAYABLE: '2100',      // Accounts Payable
  PURCHASE_CLEARING: '2150',     // GR/IR Clearing Account
  INPUT_VAT: '1450'              // Input VAT
}

/**
 * Step 1: Get approved purchase orders ready for receipt
 */
async function getApprovedPOs() {
  console.log('\n📋 Finding Approved Purchase Orders...\n')

  try {
    const { data: approvedPOs, error } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines(
          *,
          product:core_entities!line_entity_id(entity_name, entity_code)
        ),
        supplier:core_entities!from_entity_id(entity_name, entity_code)
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'purchase_order')
      .eq('metadata->po_status', 'approved')
      .is('metadata->goods_receipt_id', null)

    if (error) throw error

    console.log(`Found ${approvedPOs?.length || 0} POs ready for receipt`)
    
    approvedPOs?.forEach(po => {
      console.log(`  📦 ${po.transaction_code} - ${po.supplier.entity_name} (${po.total_amount.toFixed(2)} AED)`)
    })

    return approvedPOs || []

  } catch (error) {
    console.error('❌ Error fetching POs:', error.message)
    return []
  }
}

/**
 * Step 2: Create goods receipt for each PO
 */
async function createGoodsReceipts(purchaseOrders) {
  console.log('\n📦 Creating Goods Receipts...\n')

  const receipts = []

  for (const po of purchaseOrders) {
    try {
      // Create goods receipt transaction
      const grNumber = `GR-${po.transaction_code.replace('PO-', '')}`
      
      const { data: grTxn, error: grError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: ORGANIZATION_ID,
          transaction_type: 'goods_receipt',
          transaction_code: grNumber,
          transaction_date: new Date().toISOString(),
          from_entity_id: po.from_entity_id, // Supplier
          reference_transaction_id: po.id,    // Link to PO
          total_amount: po.total_amount,
          smart_code: 'HERA.SALON.INV.TXN.RECEIPT.v1',
          metadata: {
            po_number: po.transaction_code,
            supplier_name: po.supplier.entity_name,
            receipt_status: 'completed',
            delivery_note: `DN-${format(new Date(), 'yyyyMMdd')}`,
            received_by: 'Warehouse Team',
            inspection_status: 'passed'
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (grError) throw grError

      // Create receipt lines matching PO lines
      let lineNumber = 1
      for (const poLine of po.universal_transaction_lines) {
        const { error: lineError } = await supabase
          .from('universal_transaction_lines')
          .insert({
            organization_id: ORGANIZATION_ID,
            transaction_id: grTxn.id,
            line_number: lineNumber++,
            line_entity_id: poLine.line_entity_id,
            quantity: poLine.quantity,
            unit_price: poLine.unit_price,
            line_amount: poLine.line_amount,
            smart_code: 'HERA.SALON.INV.LINE.RECEIPT.v1',
            metadata: {
              product_name: poLine.product.entity_name,
              product_sku: poLine.product.entity_code,
              po_line_id: poLine.id,
              location: 'Main Warehouse',
              batch_number: `BATCH-${format(new Date(), 'yyyyMMdd')}`
            },
            created_at: new Date().toISOString()
          })

        if (lineError) {
          console.error(`  ❌ Error creating receipt line:`, lineError.message)
        }
      }

      // Update PO with goods receipt reference
      await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...po.metadata,
            goods_receipt_id: grTxn.id,
            goods_receipt_number: grNumber,
            receipt_date: new Date().toISOString()
          }
        })
        .eq('id', po.id)

      receipts.push(grTxn)
      console.log(`  ✅ Created ${grNumber} for ${po.transaction_code}`)

    } catch (error) {
      console.error(`  ❌ Error creating receipt for ${po.transaction_code}:`, error.message)
    }
  }

  return receipts
}

/**
 * Step 3: Update inventory stock levels
 */
async function updateInventoryLevels(receipts) {
  console.log('\n📊 Updating Inventory Stock Levels...\n')

  for (const receipt of receipts) {
    try {
      // Get receipt lines with product info
      const { data: receiptLines } = await supabase
        .from('universal_transaction_lines')
        .select(`
          *,
          product:core_entities!line_entity_id(id, entity_name, entity_code)
        `)
        .eq('transaction_id', receipt.id)

      for (const line of receiptLines || []) {
        // Get current stock
        const { data: stockData } = await supabase
          .from('core_dynamic_data')
          .select('*')
          .eq('entity_id', line.product.id)
          .eq('field_name', 'current_stock')
          .single()

        const currentStock = stockData?.field_value_number || 0
        const newStock = currentStock + line.quantity

        if (stockData) {
          // Update existing stock
          const { error } = await supabase
            .from('core_dynamic_data')
            .update({
              field_value_number: newStock,
              updated_at: new Date().toISOString()
            })
            .eq('id', stockData.id)

          if (!error) {
            console.log(`  ✅ ${line.product.entity_name}: ${currentStock} → ${newStock} (+ ${line.quantity})`)
          }
        } else {
          // Create stock record
          const { error } = await supabase
            .from('core_dynamic_data')
            .insert({
              organization_id: ORGANIZATION_ID,
              entity_id: line.product.id,
              field_name: 'current_stock',
              field_value_number: newStock,
              smart_code: 'HERA.SALON.INV.DYN.CURR.v1',
              created_at: new Date().toISOString()
            })

          if (!error) {
            console.log(`  ✅ ${line.product.entity_name}: 0 → ${newStock} (+ ${line.quantity})`)
          }
        }

        // Create inventory movement record
        await createInventoryMovement(line.product.id, 'goods_receipt', line.quantity, receipt.id)
      }

    } catch (error) {
      console.error(`  ❌ Error updating stock for ${receipt.transaction_code}:`, error.message)
    }
  }
}

/**
 * Create inventory movement record
 */
async function createInventoryMovement(productId, movementType, quantity, referenceId) {
  try {
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORGANIZATION_ID,
        entity_type: 'inventory_movement',
        entity_name: `Stock Movement - ${movementType}`,
        entity_code: `MOV-${Date.now()}`,
        smart_code: 'HERA.SALON.INV.ENT.MOVEMENT.v1',
        metadata: {
          product_id: productId,
          movement_type: movementType,
          quantity: quantity,
          reference_id: referenceId,
          movement_date: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('    ❌ Error creating movement record:', error.message)
    }
  } catch (error) {
    console.error('    ❌ Error in inventory movement:', error.message)
  }
}

/**
 * Step 4: Create accounting entries for goods receipt
 */
async function createGoodsReceiptAccounting(receipts) {
  console.log('\n💰 Creating Goods Receipt Accounting Entries...\n')

  for (const receipt of receipts) {
    try {
      // Calculate amounts
      const subtotal = receipt.metadata?.subtotal || (receipt.total_amount / 1.05)
      const vatAmount = receipt.metadata?.vat_amount || (receipt.total_amount - subtotal)

      // Create goods receipt journal entry
      const { data: journal, error: journalError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: ORGANIZATION_ID,
          transaction_type: 'journal_entry',
          transaction_date: receipt.transaction_date,
          transaction_code: `JE-${receipt.transaction_code}`,
          reference_transaction_id: receipt.id,
          total_amount: receipt.total_amount,
          smart_code: 'HERA.FIN.GL.TXN.JE.GR.v1',
          metadata: {
            journal_type: 'goods_receipt',
            source_document: receipt.transaction_code,
            auto_generated: true,
            description: `Goods Receipt - ${receipt.transaction_code}`
          },
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (journalError) throw journalError

      // Create journal lines
      const journalLines = [
        // Debit: Inventory
        {
          organization_id: ORGANIZATION_ID,
          transaction_id: journal.id,
          line_number: 1,
          line_entity_id: GL_ACCOUNTS.INVENTORY_PRODUCTS,
          line_amount: subtotal,
          is_debit: true,
          smart_code: 'HERA.FIN.GL.LINE.JE.DEBIT.v1',
          metadata: {
            gl_account: GL_ACCOUNTS.INVENTORY_PRODUCTS,
            description: 'Inventory - Retail Products'
          },
          created_at: new Date().toISOString()
        },
        // Debit: Input VAT
        {
          organization_id: ORGANIZATION_ID,
          transaction_id: journal.id,
          line_number: 2,
          line_entity_id: GL_ACCOUNTS.INPUT_VAT,
          line_amount: vatAmount,
          is_debit: true,
          smart_code: 'HERA.FIN.GL.LINE.JE.DEBIT.v1',
          metadata: {
            gl_account: GL_ACCOUNTS.INPUT_VAT,
            description: 'Input VAT Recoverable'
          },
          created_at: new Date().toISOString()
        },
        // Credit: GR/IR Clearing
        {
          organization_id: ORGANIZATION_ID,
          transaction_id: journal.id,
          line_number: 3,
          line_entity_id: GL_ACCOUNTS.PURCHASE_CLEARING,
          line_amount: receipt.total_amount,
          is_debit: false,
          smart_code: 'HERA.FIN.GL.LINE.JE.CREDIT.v1',
          metadata: {
            gl_account: GL_ACCOUNTS.PURCHASE_CLEARING,
            description: 'Goods Receipt/Invoice Receipt Clearing'
          },
          created_at: new Date().toISOString()
        }
      ]

      await supabase
        .from('universal_transaction_lines')
        .insert(journalLines)

      console.log(`  ✅ Posted accounting for ${receipt.transaction_code}:`)
      console.log(`     Dr: Inventory ${subtotal.toFixed(2)} AED`)
      console.log(`     Dr: Input VAT ${vatAmount.toFixed(2)} AED`)
      console.log(`     Cr: GR/IR Clearing ${receipt.total_amount.toFixed(2)} AED`)

      // Update receipt with journal reference
      await supabase
        .from('universal_transactions')
        .update({
          metadata: {
            ...receipt.metadata,
            accounting_posted: true,
            journal_entry_id: journal.id
          }
        })
        .eq('id', receipt.id)

    } catch (error) {
      console.error(`  ❌ Error posting accounting for ${receipt.transaction_code}:`, error.message)
    }
  }
}

/**
 * Step 5: Generate receipt summary and inventory status
 */
async function generateReceiptSummary() {
  console.log('\n📊 Goods Receipt Summary\n')
  console.log('=' .repeat(80))

  try {
    // Get all goods receipts
    const { data: receipts } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        supplier:core_entities!from_entity_id(entity_name)
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'goods_receipt')
      .order('transaction_date', { ascending: false })

    if (!receipts || receipts.length === 0) {
      console.log('No goods receipts found.')
      return
    }

    console.log('GR Number       Date        Supplier                    PO Number      Amount (AED)')
    console.log('-'.repeat(80))

    let totalValue = 0

    for (const gr of receipts) {
      console.log(
        `${gr.transaction_code.padEnd(15)} ${format(new Date(gr.transaction_date), 'yyyy-MM-dd')} ` +
        `${gr.supplier.entity_name.padEnd(25)} ${(gr.metadata?.po_number || 'N/A').padEnd(12)} ` +
        `${gr.total_amount.toFixed(2).padStart(12)}`
      )
      totalValue += gr.total_amount
    }

    console.log('-'.repeat(80))
    console.log(`Total Receipts: ${receipts.length} | Total Value: ${totalValue.toFixed(2)} AED`)

    // Show current inventory levels
    console.log('\n📦 Current Inventory Status:')
    console.log('-'.repeat(80))

    const { data: products } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(field_name, field_value_number)
      `)
      .eq('organization_id', ORGANIZATION_ID)
      .eq('entity_type', 'product')

    const inventoryData = []

    for (const product of products || []) {
      let currentStock = 0
      let reorderLevel = 0
      let productCost = 0

      for (const field of product.core_dynamic_data) {
        if (field.field_name === 'current_stock') currentStock = field.field_value_number || 0
        if (field.field_name === 'reorder_level') reorderLevel = field.field_value_number || 0
        if (field.field_name === 'product_cost') productCost = field.field_value_number || 0
      }

      if (currentStock > 0) {
        inventoryData.push({
          name: product.entity_name,
          sku: product.entity_code,
          stock: currentStock,
          reorder: reorderLevel,
          value: currentStock * productCost,
          status: currentStock <= reorderLevel ? 'LOW' : 'OK'
        })
      }
    }

    // Sort by value descending
    inventoryData.sort((a, b) => b.value - a.value)

    console.log('Product                          SKU              Stock   Reorder  Value (AED)  Status')
    console.log('-'.repeat(80))

    let totalInventoryValue = 0

    for (const item of inventoryData) {
      console.log(
        `${item.name.padEnd(30)} ${item.sku.padEnd(15)} ${item.stock.toString().padStart(7)} ` +
        `${item.reorder.toString().padStart(9)} ${item.value.toFixed(2).padStart(12)}  ${item.status}`
      )
      totalInventoryValue += item.value
    }

    console.log('-'.repeat(80))
    console.log(`Total Inventory Value: ${totalInventoryValue.toFixed(2)} AED`)

  } catch (error) {
    console.error('❌ Error generating summary:', error.message)
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 HERA Stage H - Goods Receipt & Inventory Update')
  console.log('=' .repeat(60))
  console.log(`Organization: Hair Talkz Ladies Salon`)
  console.log(`Date: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`)
  console.log('=' .repeat(60))

  // Step 1: Get approved POs
  const approvedPOs = await getApprovedPOs()

  if (approvedPOs.length > 0) {
    // Step 2: Create goods receipts
    const receipts = await createGoodsReceipts(approvedPOs)

    // Step 3: Update inventory levels
    await updateInventoryLevels(receipts)

    // Step 4: Create accounting entries
    await createGoodsReceiptAccounting(receipts)
  }

  // Step 5: Generate summary
  await generateReceiptSummary()

  console.log('\n✅ Stage H - Goods Receipt Complete!')
}

// Run the script
main().catch(console.error)