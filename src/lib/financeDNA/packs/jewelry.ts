/**
 * HERA Finance DNA - Jewelry Pack
 * Automatic GL posting rules for jewelry business transactions
 */

import type { GLEntry, FinanceContext } from '../types'

interface JewelryTransactionHeader {
  transaction_type: string
  smart_code: string
  total_amount: number
  business_context: {
    place_of_supply?: string
    gold_rate_per_gram?: number
    customer_id?: string
    payment_method?: string
  }
}

interface JewelryTransactionLine {
  line_number: number
  line_entity_id?: string
  line_amount: number
  smart_code: string
  quantity?: number
  unit_price?: number
  gross_weight?: number
  stone_weight?: number
  net_weight?: number
  purity_karat?: number
  purity_factor?: number
  making_charge_rate?: number
  making_charge_type?: 'per_gram' | 'fixed' | 'percent'
  gold_rate_per_gram?: number
  gst_rate?: number
  old_gold_weight?: number
  old_gold_purity?: number
  old_gold_rate?: number
}

/**
 * Calculate metal value based on weight, purity, and rate
 */
function calculateMetalValue(
  netWeight: number, 
  purityFactor: number, 
  ratePerGram: number
): number {
  return netWeight * purityFactor * ratePerGram
}

/**
 * Calculate making charges based on type and rate
 */
function calculateMakingCharges(
  type: string,
  rate: number,
  netWeight: number,
  metalValue: number
): number {
  switch (type) {
    case 'per_gram':
      return rate * netWeight
    case 'fixed':
      return rate
    case 'percent':
      return (metalValue * rate) / 100
    default:
      return 0
  }
}

/**
 * Determine GST mode based on place of supply
 */
function determineGSTMode(placeOfSupply: string, businessLocation: string = '07'): 'CGST_SGST' | 'IGST' {
  // If place of supply matches business location, use CGST+SGST
  // Otherwise use IGST for inter-state transactions
  return placeOfSupply === businessLocation ? 'CGST_SGST' : 'IGST'
}

/**
 * Process SALE.POS transaction
 */
function processSalePOS(
  header: JewelryTransactionHeader,
  lines: JewelryTransactionLine[],
  orgCtx: FinanceContext
): { glEntries: GLEntry[], errors: string[] } {
  const glEntries: GLEntry[] = []
  const errors: string[] = []
  
  let totalRevenue = 0
  let totalCOGS = 0
  let totalGST = 0
  let oldGoldAdjustment = 0
  
  const gstMode = determineGSTMode(
    header.business_context.place_of_supply || '07',
    orgCtx.businessLocation || '07'
  )
  
  for (const line of lines) {
    try {
      if (line.smart_code.includes('ITEM.RETAIL')) {
        // Calculate metal value
        const metalValue = calculateMetalValue(
          line.net_weight || 0,
          line.purity_factor || (line.purity_karat || 22) / 24,
          line.gold_rate_per_gram || header.business_context.gold_rate_per_gram || 5000
        )
        
        // Calculate making charges
        const makingCharges = calculateMakingCharges(
          line.making_charge_type || 'per_gram',
          line.making_charge_rate || 500,
          line.net_weight || 0,
          metalValue
        )
        
        // Stone value (if any)
        const stoneValue = line.stone_weight ? line.stone_weight * 1000 : 0 // Placeholder rate
        
        const itemRevenue = metalValue + makingCharges + stoneValue
        totalRevenue += itemRevenue
        
        // COGS calculation (80% of metal value + stone cost)
        const itemCOGS = metalValue * 0.8 + stoneValue * 0.7
        totalCOGS += itemCOGS
        
        // Revenue posting
        glEntries.push({
          account_code: '4100', // Sales Revenue
          account_name: 'Jewelry Sales Revenue',
          debit_amount: 0,
          credit_amount: itemRevenue,
          smart_code: line.smart_code,
          line_reference: `Line ${line.line_number}`
        })
        
        // COGS posting
        glEntries.push({
          account_code: '5100', // Cost of Goods Sold
          account_name: 'Cost of Goods Sold - Jewelry',
          debit_amount: itemCOGS,
          credit_amount: 0,
          smart_code: line.smart_code,
          line_reference: `COGS Line ${line.line_number}`
        })
        
        // Inventory credit
        glEntries.push({
          account_code: '1300', // Inventory
          account_name: 'Jewelry Inventory',
          debit_amount: 0,
          credit_amount: itemCOGS,
          smart_code: line.smart_code,
          line_reference: `Inventory Line ${line.line_number}`
        })
        
      } else if (line.smart_code.includes('MAKING.CHARGE')) {
        // Making charges already included in item revenue calculation
        
      } else if (line.smart_code.includes('STONE.VALUE')) {
        // Stone value already included in item calculation
        
      } else if (line.smart_code.includes('TAX.GST')) {
        totalGST += line.line_amount
        
        if (gstMode === 'CGST_SGST') {
          // Split GST into CGST and SGST (50% each)
          glEntries.push({
            account_code: '2301', // CGST Payable
            account_name: 'CGST Payable',
            debit_amount: 0,
            credit_amount: line.line_amount / 2,
            smart_code: line.smart_code,
            line_reference: `CGST Line ${line.line_number}`
          })
          
          glEntries.push({
            account_code: '2302', // SGST Payable
            account_name: 'SGST Payable',
            debit_amount: 0,
            credit_amount: line.line_amount / 2,
            smart_code: line.smart_code,
            line_reference: `SGST Line ${line.line_number}`
          })
        } else {
          // IGST for inter-state
          glEntries.push({
            account_code: '2303', // IGST Payable
            account_name: 'IGST Payable',
            debit_amount: 0,
            credit_amount: line.line_amount,
            smart_code: line.smart_code,
            line_reference: `IGST Line ${line.line_number}`
          })
        }
        
      } else if (line.smart_code.includes('EXCHANGE.OLDGOLD')) {
        oldGoldAdjustment += Math.abs(line.line_amount) // Should be negative
        
        // Old gold intake as inventory
        glEntries.push({
          account_code: '1310', // Old Gold Inventory
          account_name: 'Old Gold Inventory',
          debit_amount: Math.abs(line.line_amount),
          credit_amount: 0,
          smart_code: line.smart_code,
          line_reference: `Old Gold Line ${line.line_number}`
        })
        
      } else if (line.smart_code.includes('ADJUSTMENT.ROUNDING')) {
        // Rounding adjustment
        if (line.line_amount > 0) {
          glEntries.push({
            account_code: '6900', // Rounding Income
            account_name: 'Rounding Income',
            debit_amount: 0,
            credit_amount: line.line_amount,
            smart_code: line.smart_code,
            line_reference: `Rounding Line ${line.line_number}`
          })
        } else {
          glEntries.push({
            account_code: '6901', // Rounding Expense
            account_name: 'Rounding Expense',
            debit_amount: Math.abs(line.line_amount),
            credit_amount: 0,
            smart_code: line.smart_code,
            line_reference: `Rounding Line ${line.line_number}`
          })
        }
      }
    } catch (error) {
      errors.push(`Error processing line ${line.line_number}: ${error}`)
    }
  }
  
  // Cash/Bank receipt
  const paymentMethod = header.business_context.payment_method || 'cash'
  const netAmount = header.total_amount - oldGoldAdjustment
  
  if (paymentMethod === 'cash') {
    glEntries.push({
      account_code: '1000', // Cash
      account_name: 'Cash in Hand',
      debit_amount: netAmount,
      credit_amount: 0,
      smart_code: header.smart_code,
      line_reference: 'Cash Receipt'
    })
  } else {
    glEntries.push({
      account_code: '1100', // Bank
      account_name: 'Bank Account',
      debit_amount: netAmount,
      credit_amount: 0,
      smart_code: header.smart_code,
      line_reference: 'Bank Receipt'
    })
  }
  
  return { glEntries, errors }
}

/**
 * Process EXCHANGE.OLDGOLD transaction
 */
function processExchangeOldGold(
  header: JewelryTransactionHeader,
  lines: JewelryTransactionLine[],
  orgCtx: FinanceContext
): { glEntries: GLEntry[], errors: string[] } {
  const glEntries: GLEntry[] = []
  const errors: string[] = []
  
  for (const line of lines) {
    if (line.smart_code.includes('EXCHANGE.OLDGOLD')) {
      const assayValue = Math.abs(line.line_amount)
      
      // Old gold intake
      glEntries.push({
        account_code: '1310', // Old Gold Inventory
        account_name: 'Old Gold Inventory',
        debit_amount: assayValue,
        credit_amount: 0,
        smart_code: line.smart_code,
        line_reference: `Old Gold Line ${line.line_number}`
      })
      
      // Customer payable (if standalone exchange)
      glEntries.push({
        account_code: '2100', // Accounts Payable
        account_name: 'Customer Payable - Old Gold',
        debit_amount: 0,
        credit_amount: assayValue,
        smart_code: line.smart_code,
        line_reference: `Customer Payable Line ${line.line_number}`
      })
    }
  }
  
  return { glEntries, errors }
}

/**
 * Process JOBWORK.ISSUE transaction
 */
function processJobworkIssue(
  header: JewelryTransactionHeader,
  lines: JewelryTransactionLine[],
  orgCtx: FinanceContext
): { glEntries: GLEntry[], errors: string[] } {
  const glEntries: GLEntry[] = []
  const errors: string[] = []
  
  for (const line of lines) {
    const materialValue = line.line_amount
    
    // Transfer from inventory to job work (off-balance)
    glEntries.push({
      account_code: '1320', // Job Work Inventory
      account_name: 'Materials Issued for Job Work',
      debit_amount: materialValue,
      credit_amount: 0,
      smart_code: line.smart_code,
      line_reference: `Issue Line ${line.line_number}`
    })
    
    glEntries.push({
      account_code: '1300', // Main Inventory
      account_name: 'Jewelry Inventory',
      debit_amount: 0,
      credit_amount: materialValue,
      smart_code: line.smart_code,
      line_reference: `Inventory Transfer Line ${line.line_number}`
    })
  }
  
  return { glEntries, errors }
}

/**
 * Process JOBWORK.RECEIPT transaction
 */
function processJobworkReceipt(
  header: JewelryTransactionHeader,
  lines: JewelryTransactionLine[],
  orgCtx: FinanceContext
): { glEntries: GLEntry[], errors: string[] } {
  const glEntries: GLEntry[] = []
  const errors: string[] = []
  
  let totalLabourCost = 0
  let totalMaterialValue = 0
  
  for (const line of lines) {
    if (line.smart_code.includes('ITEM.RETAIL')) {
      // Finished goods receipt
      const finishedValue = line.line_amount
      totalMaterialValue += finishedValue * 0.8 // Assuming 80% material
      totalLabourCost += finishedValue * 0.2 // 20% labour
      
      // Finished goods to inventory
      glEntries.push({
        account_code: '1300', // Inventory
        account_name: 'Jewelry Inventory',
        debit_amount: finishedValue,
        credit_amount: 0,
        smart_code: line.smart_code,
        line_reference: `Receipt Line ${line.line_number}`
      })
      
    } else if (line.smart_code.includes('MAKING.CHARGE')) {
      totalLabourCost += line.line_amount
    }
  }
  
  // Clear job work inventory (material component)
  glEntries.push({
    account_code: '1320', // Job Work Inventory
    account_name: 'Materials Issued for Job Work',
    debit_amount: 0,
    credit_amount: totalMaterialValue,
    smart_code: header.smart_code,
    line_reference: 'Clear Issued Materials'
  })
  
  // Labour expense
  glEntries.push({
    account_code: '5200', // Labour Expense
    account_name: 'Job Work Labour Expense',
    debit_amount: totalLabourCost,
    credit_amount: 0,
    smart_code: header.smart_code,
    line_reference: 'Labour Cost'
  })
  
  // Karigar payable
  glEntries.push({
    account_code: '2100', // Accounts Payable
    account_name: 'Karigar Payable',
    debit_amount: 0,
    credit_amount: totalLabourCost,
    smart_code: header.smart_code,
    line_reference: 'Karigar Payment Due'
  })
  
  return { glEntries, errors }
}

/**
 * Process MELT.SCRAP transaction
 */
function processMeltScrap(
  header: JewelryTransactionHeader,
  lines: JewelryTransactionLine[],
  orgCtx: FinanceContext
): { glEntries: GLEntry[], errors: string[] } {
  const glEntries: GLEntry[] = []
  const errors: string[] = []
  
  let totalScrapValue = 0
  let totalBullionValue = 0
  
  for (const line of lines) {
    if (line.smart_code.includes('ITEM.RETAIL')) {
      // Original item value (being scrapped)
      totalScrapValue += line.line_amount
      
      // Remove from finished goods inventory
      glEntries.push({
        account_code: '1300', // Inventory
        account_name: 'Jewelry Inventory',
        debit_amount: 0,
        credit_amount: line.line_amount,
        smart_code: line.smart_code,
        line_reference: `Scrap Line ${line.line_number}`
      })
      
    } else if (line.smart_code.includes('METAL')) {
      // Recovered bullion value
      totalBullionValue += line.line_amount
      
      // Add to bullion inventory
      glEntries.push({
        account_code: '1330', // Bullion Inventory
        account_name: 'Gold Bullion Inventory',
        debit_amount: line.line_amount,
        credit_amount: 0,
        smart_code: line.smart_code,
        line_reference: `Bullion Line ${line.line_number}`
      })
    }
  }
  
  // Melting gain/loss
  const gainLoss = totalBullionValue - totalScrapValue
  if (gainLoss > 0) {
    glEntries.push({
      account_code: '6100', // Other Income
      account_name: 'Melting Gain',
      debit_amount: 0,
      credit_amount: gainLoss,
      smart_code: header.smart_code,
      line_reference: 'Melting Gain'
    })
  } else if (gainLoss < 0) {
    glEntries.push({
      account_code: '6200', // Other Expense
      account_name: 'Melting Loss',
      debit_amount: Math.abs(gainLoss),
      credit_amount: 0,
      smart_code: header.smart_code,
      line_reference: 'Melting Loss'
    })
  }
  
  return { glEntries, errors }
}

/**
 * Main jewelry finance rules processor
 */
export function applyJewelryFinanceRules(
  header: JewelryTransactionHeader,
  lines: JewelryTransactionLine[],
  orgCtx: FinanceContext
): { glEntries: GLEntry[], errors: string[] } {
  
  if (!header.smart_code.includes('HERA.JEWELRY.')) {
    return { glEntries: [], errors: [] }
  }
  
  try {
    if (header.smart_code.includes('SALE.POS')) {
      return processSalePOS(header, lines, orgCtx)
    } else if (header.smart_code.includes('EXCHANGE.OLDGOLD')) {
      return processExchangeOldGold(header, lines, orgCtx)
    } else if (header.smart_code.includes('JOBWORK.ISSUE')) {
      return processJobworkIssue(header, lines, orgCtx)
    } else if (header.smart_code.includes('JOBWORK.RECEIPT')) {
      return processJobworkReceipt(header, lines, orgCtx)
    } else if (header.smart_code.includes('MELT.SCRAP')) {
      return processMeltScrap(header, lines, orgCtx)
    }
    
    return { glEntries: [], errors: [`Unsupported jewelry transaction type: ${header.smart_code}`] }
    
  } catch (error) {
    return { 
      glEntries: [], 
      errors: [`Failed to process jewelry transaction: ${error instanceof Error ? error.message : error}`] 
    }
  }
}

/**
 * Validate that GL entries are balanced
 */
export function validateJewelryGLBalance(glEntries: GLEntry[]): { balanced: boolean, difference: number } {
  const totalDebits = glEntries.reduce((sum, entry) => sum + entry.debit_amount, 0)
  const totalCredits = glEntries.reduce((sum, entry) => sum + entry.credit_amount, 0)
  const difference = Math.abs(totalDebits - totalCredits)
  
  return {
    balanced: difference < 0.01, // Allow 1 paisa tolerance for rounding
    difference
  }
}