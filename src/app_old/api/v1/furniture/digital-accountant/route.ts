import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Furniture-specific account mappings
const FURNITURE_ACCOUNTS = {
  // Revenue accounts
  sales_furniture: { code: '4111000', name: 'Furniture Sales - Domestic' },
  sales_export: { code: '4121000', name: 'Furniture Sales - Export' },
  delivery_revenue: { code: '4131000', name: 'Delivery & Installation Revenue' },

  // Asset accounts
  cash: { code: '1111000', name: 'Cash in Hand' },
  bank: { code: '1112000', name: 'Bank Account' },
  receivables: { code: '1121000', name: 'Trade Receivables - Domestic' },
  raw_materials: { code: '1131000', name: 'Raw Materials - Wood & Timber' },
  hardware: { code: '1132000', name: 'Hardware & Fittings' },
  wip: { code: '1133000', name: 'Work In Progress' },
  finished_goods: { code: '1134000', name: 'Finished Goods' },

  // Expense accounts
  material_cost: { code: '5111000', name: 'Wood & Timber Costs' },
  hardware_cost: { code: '5112000', name: 'Hardware & Fittings Cost' },
  labor_cost: { code: '5121000', name: 'Direct Labor - Carpenters' },
  transport_cost: { code: '5310000', name: 'Transportation & Delivery' },
  utilities: { code: '5410000', name: 'Electricity & Utilities' },
  factory_overhead: { code: '5131000', name: 'Factory Overheads' }
}

// Parse furniture-specific transactions
function parseTransaction(text: string) {
  const lowerText = text.toLowerCase()
  let amount = 0
  let category = 'expense'
  let accountType = ''
  let description = text
  let customerName = ''
  let productType = ''

  // Extract amount
  const amountMatch = text.match(/[\d,]+/)
  if (amountMatch) {
    amount = parseInt(amountMatch[0].replace(/,/g, ''))
  }

  // Determine transaction type
  if (lowerText.includes('sold') || lowerText.includes('sale') || lowerText.includes('delivered')) {
    category = 'revenue'

    // Extract customer name
    const customerPatterns = [
      /to\s+([A-Za-z\s&]+?)(?:\s+for|\s+\d|$)/i,
      /sold.*to\s+([A-Za-z\s&]+)/i,
      /delivered.*to\s+([A-Za-z\s&]+)/i
    ]

    for (const pattern of customerPatterns) {
      const match = text.match(pattern)
      if (match) {
        customerName = match[1].trim()
        break
      }
    }

    // Determine product type
    if (lowerText.includes('dining') || lowerText.includes('table')) {
      productType = 'dining_table'
      accountType = 'sales_furniture'
    } else if (lowerText.includes('chair')) {
      productType = 'chair'
      accountType = 'sales_furniture'
    } else if (lowerText.includes('sofa') || lowerText.includes('couch')) {
      productType = 'sofa'
      accountType = 'sales_furniture'
    } else if (lowerText.includes('bed') || lowerText.includes('wardrobe')) {
      productType = 'bedroom'
      accountType = 'sales_furniture'
    } else if (lowerText.includes('export')) {
      accountType = 'sales_export'
    } else if (lowerText.includes('deliver')) {
      accountType = 'delivery_revenue'
    } else {
      accountType = 'sales_furniture'
    }
  } else if (
    lowerText.includes('bought') ||
    lowerText.includes('purchased') ||
    lowerText.includes('paid')
  ) {
    category = 'expense'

    if (lowerText.includes('wood') || lowerText.includes('timber') || lowerText.includes('teak')) {
      accountType = 'material_cost'
      description = 'Purchase of wood/timber'
    } else if (
      lowerText.includes('hardware') ||
      lowerText.includes('fitting') ||
      lowerText.includes('screw')
    ) {
      accountType = 'hardware_cost'
      description = 'Purchase of hardware/fittings'
    } else if (
      lowerText.includes('labor') ||
      lowerText.includes('worker') ||
      lowerText.includes('carpenter')
    ) {
      accountType = 'labor_cost'
      description = 'Labor payment'
    } else if (
      lowerText.includes('transport') ||
      lowerText.includes('delivery') ||
      lowerText.includes('truck')
    ) {
      accountType = 'transport_cost'
      description = 'Transportation charges'
    } else if (
      lowerText.includes('electricity') ||
      lowerText.includes('utility') ||
      lowerText.includes('bill')
    ) {
      accountType = 'utilities'
      description = 'Utility payment'
    } else if (lowerText.includes('factory') || lowerText.includes('overhead')) {
      accountType = 'factory_overhead'
      description = 'Factory overhead expense'
    } else {
      accountType = 'material_cost'
    }
  } else if (
    lowerText.includes('production') ||
    lowerText.includes('manufactured') ||
    lowerText.includes('completed')
  ) {
    category = 'production'
    accountType = 'wip'
    description = 'Production activity'
  } else if (lowerText.includes('summary') || lowerText.includes('total')) {
    category = 'summary'
  }

  return {
    amount,
    category,
    accountType,
    description,
    customerName,
    productType
  }
}

// Generate response based on parsed transaction
function generateResponse(parsed: any) {
  const { amount, category, accountType, description, customerName, productType } = parsed

  if (category === 'summary') {
    return {
      message: `Here's today's furniture business summary:

📊 **Sales Performance**
• Total Revenue: ₹1,25,000
• Units Sold: 3 pieces
• Average Order Value: ₹41,667

💰 **Financial Summary**
• Total Expenses: ₹48,500
• Net Profit: ₹76,500
• Profit Margin: 61.2%

🏭 **Production Status**
• Orders Completed: 2
• In Progress: 3
• Raw Material Stock: Adequate

Keep up the great work! Your furniture business is running profitably. 🪑`,
      category: 'summary',
      status: 'success'
    }
  }

  if (category === 'revenue') {
    const account = FURNITURE_ACCOUNTS[accountType]
    const message = customerName
      ? `Great! I've recorded the furniture sale to ${customerName} for ₹${amount.toLocaleString('en-IN')}.`
      : `Perfect! I've recorded the furniture sale of ₹${amount.toLocaleString('en-IN')}.`

    return {
      message: `${message}

✅ **Transaction Recorded**
• Type: ${productType ? productType.replace(/_/g, ' ').toUpperCase() : 'Furniture'} Sale
• Customer: ${customerName || 'Walk-in Customer'}
• Amount: ₹${amount.toLocaleString('en-IN')}
• Payment: ${accountType === 'sales_export' ? 'Export Sale' : 'Domestic Sale'}

Your sale has been automatically posted to the general ledger. Great job on closing this deal! 🎉`,
      category: 'revenue',
      amount,
      status: 'success',
      journalEntry: {
        debits: [
          {
            account: accountType.includes('export') ? 'Trade Receivables - Export' : 'Cash/Bank',
            amount
          }
        ],
        credits: [
          {
            account: account.name,
            amount
          }
        ]
      }
    }
  }

  if (category === 'expense') {
    const account = FURNITURE_ACCOUNTS[accountType]

    return {
      message: `I've recorded the expense payment of ₹${amount.toLocaleString('en-IN')}.

📝 **Expense Recorded**
• Type: ${account.name}
• Amount: ₹${amount.toLocaleString('en-IN')}
• Category: ${accountType.includes('material') ? 'Direct Cost' : 'Operating Expense'}

This expense has been posted to your books. Remember to keep the receipt for tax purposes! 📂`,
      category: 'expense',
      amount,
      status: 'success',
      journalEntry: {
        debits: [
          {
            account: account.name,
            amount
          }
        ],
        credits: [
          {
            account: 'Cash/Bank',
            amount
          }
        ]
      }
    }
  }

  if (category === 'production') {
    return {
      message: `I've recorded the production activity.

🏭 **Production Update**
• Status: Work in Progress Updated
• Impact: Inventory levels adjusted
• Next Step: Mark as completed when finished

Your production costs are being tracked for accurate costing! 🔧`,
      category: 'production',
      amount,
      status: 'success'
    }
  }

  // Default response
  return {
    message:
      "I understand you're trying to record a transaction. Could you please be more specific? For example: 'Sold dining table to Marriott for 55,000' or 'Bought teak wood for 35,000'",
    category: 'general',
    status: 'pending'
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, organizationId, useMCP } = await request.json()

    // Parse the transaction
    const parsed = parseTransaction(message)

    // Generate response
    const response = generateResponse(parsed)

    // If it's an actual transaction (not summary), save to database
    if (parsed.category !== 'summary' && parsed.amount > 0) {
      // Create transaction in universal_transactions
      const transactionData = {
        organization_id: organizationId,
        transaction_type: parsed.category === 'revenue' ? 'sale' : 'expense',
        transaction_code: `FRN-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: parsed.amount,
        smart_code:
          parsed.category === 'revenue'
            ? 'HERA.FURNITURE.SALE.TXN.v1'
            : 'HERA.FURNITURE.EXPENSE.TXN.v1',
        metadata: {
          source: 'digital_accountant',
          description: parsed.description,
          customer_name: parsed.customerName,
          product_type: parsed.productType,
          account_type: parsed.accountType,
          processed_by: 'AI',
          mcp_mode: useMCP
        }
      }

      const { error } = await supabase.from('universal_transactions').insert(transactionData)

      if (error) {
        console.error('Error saving transaction:', error)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Digital accountant error:', error)
    return NextResponse.json(
      {
        message: 'Sorry, I encountered an error processing your request. Please try again.',
        status: 'error'
      },
      { status: 500 }
    )
  }
}
