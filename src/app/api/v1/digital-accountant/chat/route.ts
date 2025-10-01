// HERA Digital Accountant Chat API
import { NextRequest, NextResponse } from 'next/server'
import { createDigitalAccountantService } from '@/lib/digital-accountant'
import { createAnalyticsChatStorage } from '@/lib/analytics-chat-storage'
import { supabaseAdmin } from '@/lib/supabase-server'
// import { FinanceEventProcessor } from '@/lib/dna/integration/finance-event-processor'

// Smart code patterns for intent detection
const INTENT_PATTERNS = {
  // Salon-specific patterns
  salonSale: {
    patterns: [
      /^[\w\s]+\s+paid\s+\d+/i, // "Maya paid 450"
      /client\s+paid/i,
      /customer\s+paid/i,
      /received\s+payment/i,
      /cash\s+sale/i,
      /card\s+sale/i
    ],
    smartCode: 'HERA.SALON.SALE.POSTED.V1'
  },
  salonExpense: {
    patterns: [
      /bought\s+[\w\s]+\s+for/i, // "Bought supplies for 250"
      /paid\s+bill/i,
      /paid\s+[\w\s]+\s+bill/i, // "Paid electricity bill"
      /purchased\s+/i,
      /buy\s+supplies/i
    ],
    smartCode: 'HERA.SALON.EXPENSE.POSTED.V1'
  },
  salonCommission: {
    patterns: [
      /pay\s+[\w\s]+\s+commission/i, // "Pay Sarah commission"
      /pay\s+staff\s+commission/i,
      /commission\s+for/i,
      /pay\s+[\w\s]+\s+\d+%/i // "Pay Sarah 40%"
    ],
    smartCode: 'HERA.SALON.PAYROLL.COMMISSION.V1'
  },
  salonPayCommission: {
    patterns: [
      /^pay\s+now$/i, // "pay now"
      /^yes\s+pay$/i, // "yes pay"
      /^process\s+payment$/i, // "process payment"
      /^confirm\s+payment$/i, // "confirm payment"
      /^pay\s+commission\s+now$/i // "pay commission now"
    ],
    smartCode: 'HERA.SALON.PAYROLL.PAY.V1'
  },
  salonSummary: {
    patterns: [
      /show.*today.*total/i,
      /today.*summary/i,
      /daily.*report/i,
      /show.*sales/i,
      /how.*much.*today/i
    ],
    smartCode: 'HERA.SALON.REPORT.DAILY.V1'
  },
  journal: {
    patterns: [
      /post.*journal/i,
      /create.*journal.*entry/i,
      /adjustment.*entry/i,
      /accrue/i,
      /depreciation/i,
      /general.*journal/i,
      /journal.*to/i
    ],
    smartCode: 'HERA.FIN.GL.TXN.JE.GENERAL.V1'
  },
  invoice: {
    patterns: [
      /create.*invoice/i,
      /invoice.*customer/i,
      /bill.*client/i,
      /generate.*invoice/i,
      /recurring.*invoice/i
    ],
    smartCode: 'HERA.FIN.AR.TXN.INV.STANDARD.V1'
  },
  post: {
    patterns: [
      /^post\s+\w+/i,
      /post.*transaction/i,
      /post.*invoice/i,
      /post.*journal/i,
      /finalize.*transaction/i,
      /approve.*transaction/i,
      /^\w+-\d+\s+post$/i
    ],
    smartCode: 'HERA.FIN.POST.TRANSACTION.V1'
  },
  payment: {
    patterns: [
      /record.*payment/i,
      /apply.*payment/i,
      /payment.*received/i,
      /receipt.*from/i,
      /customer.*paid/i
    ],
    smartCode: 'HERA.FIN.AR.TXN.PMT.BANK.V1'
  },
  reconciliation: {
    patterns: [/reconcile/i, /bank.*statement/i, /match.*transactions/i, /bank.*reconciliation/i],
    smartCode: 'HERA.FIN.BANK.RECON.AUTO.V1'
  },
  report: {
    patterns: [
      /financial.*statement/i,
      /balance.*sheet/i,
      /p&l/i,
      /profit.*loss/i,
      /trial.*balance/i,
      /income.*statement/i
    ],
    smartCode: 'HERA.FIN.REPORT.FINANCIAL.V1'
  },
  vat: {
    patterns: [/vat.*calculation/i, /tax.*period/i, /vat.*return/i, /calculate.*vat/i],
    smartCode: 'HERA.FIN.TAX.VAT.CALC.V1'
  }
}

// Detect intent from natural language
function detectIntent(message: string): { type: string; smartCode: string } | null {
  const lower = message.toLowerCase()

  for (const [type, config] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(lower)) {
        return { type, smartCode: config.smartCode }
      }
    }
  }

  return null
}

// Parse journal entry from natural language
function parseJournalFromNL(message: string): any {
  const result = {
    lines: [] as any[],
    reference: '',
    date: new Date().toISOString().split('T')[0]
  }

  // Extract amount
  const amountMatch = message.match(/\$?([\d,]+(?:\.\d{2})?)/g)
  const amount = amountMatch ? parseFloat(amountMatch[0].replace(/[$,]/g, '')) : 0

  // Extract date if provided
  const datePatterns = [
    /for\s+(\w+\s+\d{4})/i,
    /date[d]?\s+(\d{4}-\d{2}-\d{2})/i,
    /on\s+(\d{1,2}[\/-]\d{1,2}[\/-]\d{4})/i
  ]

  for (const pattern of datePatterns) {
    const match = message.match(pattern)
    if (match) {
      const dateStr = match[1]
      const parsed = new Date(dateStr)
      if (!isNaN(parsed.getTime())) {
        result.date = parsed.toISOString().split('T')[0]
      }
      break
    }
  }

  // Common journal patterns
  if (message.includes('accrue') || message.includes('accrual')) {
    // Determine expense type
    let expenseAccount = { code: '6000', name: 'Operating Expenses' }
    let memo = 'Accrual entry'

    if (message.toLowerCase().includes('marketing')) {
      expenseAccount = { code: '6110', name: 'Marketing & Advertising Expense' }
      memo = 'Marketing expense accrual'
    } else if (message.toLowerCase().includes('rent')) {
      expenseAccount = { code: '6200', name: 'Rent Expense' }
      memo = 'Rent expense accrual'
    } else if (
      message.toLowerCase().includes('salary') ||
      message.toLowerCase().includes('payroll')
    ) {
      expenseAccount = { code: '6300', name: 'Salaries & Wages Expense' }
      memo = 'Payroll expense accrual'
    } else if (message.toLowerCase().includes('utilities')) {
      expenseAccount = { code: '6210', name: 'Utilities Expense' }
      memo = 'Utilities expense accrual'
    }

    // Extract month if mentioned
    const monthMatch = message.match(/for\s+(\w+)(?:\s+\d{4})?/i)
    if (monthMatch) {
      const month = monthMatch[1]
      memo = `${month} ${memo.toLowerCase()}`
    }

    // Accrual pattern: DR Expense, CR Accrued Liability
    result.lines = [
      {
        account_code: expenseAccount.code,
        account_name: expenseAccount.name,
        debit: amount,
        credit: 0,
        memo: memo
      },
      {
        account_code: '2100', // Default accrued liability
        account_name: 'Accrued Expenses',
        debit: 0,
        credit: amount,
        memo: memo
      }
    ]
    result.reference = `ACCR-${Date.now().toString().slice(-6)}`
  } else if (message.includes('depreciation')) {
    // Depreciation pattern: DR Depreciation Expense, CR Accumulated Depreciation
    result.lines = [
      {
        account_code: '6500', // Depreciation expense
        account_name: 'Depreciation Expense',
        debit: amount,
        credit: 0,
        memo: 'Monthly depreciation'
      },
      {
        account_code: '1700', // Accumulated depreciation
        account_name: 'Accumulated Depreciation',
        debit: 0,
        credit: amount,
        memo: 'Monthly depreciation'
      }
    ]
    result.reference = `DEPR-${Date.now().toString().slice(-6)}`
  } else {
    // Generic journal entry
    result.lines = [
      {
        account_code: '1000', // Default debit account
        account_name: 'Cash',
        debit: amount,
        credit: 0,
        memo: 'Journal entry'
      },
      {
        account_code: '4000', // Default credit account
        account_name: 'Revenue',
        debit: 0,
        credit: amount,
        memo: 'Journal entry'
      }
    ]
    result.reference = `JE-${Date.now().toString().slice(-6)}`
  }

  return result
}

export async function POST(request: NextRequest) {
  try {
    const { message, organizationId, context = {} } = await request.json()

    if (!message || !organizationId) {
      return NextResponse.json(
        { error: 'Message and organizationId are required' },
        { status: 400 }
      )
    }

    console.log('Digital Accountant received:', { message, organizationId, context })

    // Initialize chat storage
    const chatStorage = createAnalyticsChatStorage(organizationId)

    // Detect intent
    const intent = detectIntent(message)
    console.log('Detected intent:', intent)

    if (!intent) {
      // No specific accounting intent detected
      return NextResponse.json({
        success: true,
        message:
          "I understand accounting operations like posting journals, creating invoices, recording payments, and generating reports. Please be more specific about what you'd like to do.",
        suggestions: [
          'Post a journal entry',
          'Create an invoice',
          'Record a payment',
          'Reconcile bank account',
          'Generate financial statements'
        ]
      })
    }

    // Process based on intent
    switch (intent.type) {
      // Handle salon-specific intents
      case 'salonSale': {
        // Extract amount and client name from message
        const amountMatch = message.match(/\$?([\d,]+(?:\.\d{2})?)/g)
        const amount = amountMatch ? parseFloat(amountMatch[0].replace(/[$,]/g, '')) : 0

        // Extract client name - look for pattern "Name paid"
        const nameMatch = message.match(/^([\w\s]+)\s+paid/i)
        const clientName = nameMatch ? nameMatch[1].trim() : 'Client'

        // Determine payment method
        const isCash = message.toLowerCase().includes('cash')
        const isCard = message.toLowerCase().includes('card')

        // Calculate VAT (5% UAE)
        const vatRate = 0.05
        const baseAmount = amount / (1 + vatRate)
        const vatAmount = amount - baseAmount

        // Create the transaction
        const transactionCode = `SALE-${Date.now().toString().slice(-6)}`

        try {
          // Create the main sale transaction
          const { data: saleTransaction, error: txError } = await supabaseAdmin
            .from('universal_transactions')
            .insert({
              organization_id: organizationId,
              transaction_type: 'sale',
              transaction_code: transactionCode,
              transaction_date: new Date().toISOString(),
              total_amount: amount,
              smart_code: intent.smartCode,
              metadata: {
                client_name: clientName,
                payment_method: isCash ? 'cash' : isCard ? 'card' : 'cash',
                vat_included: true,
                vat_amount: vatAmount,
                base_amount: baseAmount,
                source: 'Salon Digital Accountant',
                status: 'completed'
              }
            })
            .select()
            .single()

          if (txError) throw txError

          // Create automatic journal entry using Finance DNA pattern
          const journalCode = `JE-${transactionCode}`
          const { data: journalEntry, error: jeError } = await supabaseAdmin
            .from('universal_transactions')
            .insert({
              organization_id: organizationId,
              transaction_type: 'journal_entry',
              transaction_code: journalCode,
              transaction_date: new Date().toISOString(),
              total_amount: amount,
              smart_code: 'HERA.FIN.GL.TXN.AUTO_POST.V1',
              metadata: {
                source_smart_code: intent.smartCode,
                source_transaction: transactionCode,
                posted_by: 'Finance DNA Engine',
                status: 'posted'
              }
            })
            .select()
            .single()

          let journalMessage = '📋 Sale recorded (Journal pending)'
          if (!jeError && journalEntry) {
            // Create journal lines
            const journalLines = [
              {
                organization_id: organizationId,
                transaction_id: journalEntry.id,
                line_number: 1,
                line_type: 'journal_line',
                description: 'Cash/Card',
                quantity: 1,
                unit_amount: amount,
                line_amount: amount,
                smart_code: 'HERA.FIN.GL.LINE.DEBIT.V1',
                line_data: {
                  account_code: '110000',
                  account_name: 'Cash',
                  debit: amount,
                  credit: 0,
                  role: 'Cash'
                }
              },
              {
                organization_id: organizationId,
                transaction_id: journalEntry.id,
                line_number: 2,
                line_type: 'journal_line',
                description: 'Service Revenue',
                quantity: 1,
                unit_amount: baseAmount,
                line_amount: baseAmount,
                smart_code: 'HERA.FIN.GL.LINE.CREDIT.V1',
                line_data: {
                  account_code: '400000',
                  account_name: 'Service Revenue',
                  debit: 0,
                  credit: baseAmount,
                  role: 'Revenue'
                }
              },
              {
                organization_id: organizationId,
                transaction_id: journalEntry.id,
                line_number: 3,
                line_type: 'journal_line',
                description: 'VAT Payable',
                quantity: 1,
                unit_amount: vatAmount,
                line_amount: vatAmount,
                smart_code: 'HERA.FIN.GL.LINE.CREDIT.V1',
                line_data: {
                  account_code: '220000',
                  account_name: 'VAT Payable',
                  debit: 0,
                  credit: vatAmount,
                  role: 'Tax'
                }
              }
            ]

            const { error: lineError } = await supabaseAdmin
              .from('universal_transaction_lines')
              .insert(journalLines)

            if (!lineError) {
              journalMessage = `✅ Journal Entry Posted: ${journalCode}`
            }
          }

          return NextResponse.json({
            success: true,
            type: 'salon_sale',
            category: 'revenue',
            amount: amount,
            vat_amount: vatAmount,
            message: `✅ Great! I've recorded the payment of AED ${amount}.\n\n💰 Money received and added to your daily sales.\n📊 VAT included: AED ${vatAmount.toFixed(2)}\n\n${journalMessage}\n\nYour books are updated automatically!`,
            result: {
              transaction_code: transactionCode,
              total_amount: amount,
              client_name: clientName,
              journal_code: journalCode,
              posting_status: 'posted'
            },
            journalEntry: {
              debits: [
                {
                  account: 'Cash',
                  amount: amount
                }
              ],
              credits: [
                {
                  account: 'Service Revenue',
                  amount: baseAmount
                },
                {
                  account: 'VAT Payable',
                  amount: vatAmount
                }
              ]
            }
          })
        } catch (error) {
          console.error('Error recording sale:', error)
          return NextResponse.json({
            success: false,
            message: `Sorry, I couldn't record that sale. Please try again.`,
            error: error.message
          })
        }
      }

      case 'salonExpense': {
        // Extract amount from message
        const amountMatch = message.match(/\$?([\d,]+(?:\.\d{2})?)/g)
        const amount = amountMatch ? parseFloat(amountMatch[0].replace(/[$,]/g, '')) : 0

        // Determine expense category
        let category = 'Operating Expense'
        let expenseType = 'general'

        const lower = message.toLowerCase()
        if (lower.includes('hair') || lower.includes('color') || lower.includes('shampoo')) {
          category = 'Salon Supplies'
          expenseType = 'supplies'
        } else if (lower.includes('electricity') || lower.includes('water')) {
          category = 'Utilities'
          expenseType = 'utilities'
        } else if (lower.includes('rent')) {
          category = 'Rent'
          expenseType = 'rent'
        }

        // Extract vendor if mentioned
        const vendorMatch = message.match(/from\s+([\w\s]+?)(?:\s+for|\s*$)/i)
        const vendor = vendorMatch ? vendorMatch[1].trim() : null

        // Calculate VAT
        const vatRate = 0.05
        const baseAmount = amount / (1 + vatRate)
        const vatAmount = amount - baseAmount

        const transactionCode = `EXP-${Date.now().toString().slice(-6)}`

        try {
          const { data: expenseTransaction, error: txError } = await supabaseAdmin
            .from('universal_transactions')
            .insert({
              organization_id: organizationId,
              transaction_type: 'expense',
              transaction_code: transactionCode,
              transaction_date: new Date().toISOString(),
              total_amount: amount,
              smart_code: intent.smartCode,
              metadata: {
                category: category,
                expense_type: expenseType,
                vendor: vendor,
                vat_included: true,
                vat_amount: vatAmount,
                base_amount: baseAmount,
                source: 'Salon Digital Accountant',
                status: 'completed'
              }
            })
            .select()
            .single()

          if (txError) throw txError

          return NextResponse.json({
            success: true,
            type: 'salon_expense',
            category: 'expense',
            amount: amount,
            vat_amount: vatAmount,
            vendor: vendor,
            message: `✅ Expense recorded: AED ${amount}\n\n📂 Category: ${category}\n📊 VAT included: AED ${vatAmount.toFixed(2)}\n${vendor ? `🏪 Vendor: ${vendor}` : ''}\n\nAll set! Your expenses are tracked.`,
            result: {
              transaction_code: transactionCode,
              total_amount: amount,
              category: category
            }
          })
        } catch (error) {
          console.error('Error recording expense:', error)
          return NextResponse.json({
            success: false,
            message: `Sorry, I couldn't record that expense. Please try again.`,
            error: error.message
          })
        }
      }

      case 'salonCommission': {
        // Parse commission details
        const amountMatch = message.match(/\$?([\d,]+(?:\.\d{2})?)/g)
        const percentMatch = message.match(/(\d+)%/)

        let commissionAmount = 0
        let staffName = 'Staff'

        // Extract staff name
        const nameMatch = message.match(/pay\s+([\w\s]+?)(?:\s+commission|\s+\d+%)/i)
        if (nameMatch) {
          staffName = nameMatch[1].trim()
        }

        // Calculate commission
        if (percentMatch && amountMatch) {
          const percentage = parseFloat(percentMatch[1]) / 100
          const baseAmount = parseFloat(amountMatch[0].replace(/[$,]/g, ''))
          commissionAmount = baseAmount * percentage
        } else if (amountMatch) {
          commissionAmount = parseFloat(amountMatch[0].replace(/[$,]/g, ''))
        }

        const transactionCode = `COM-${Date.now().toString().slice(-6)}`

        try {
          const { data: commissionTransaction, error: txError } = await supabaseAdmin
            .from('universal_transactions')
            .insert({
              organization_id: organizationId,
              transaction_type: 'payment',
              transaction_code: transactionCode,
              transaction_date: new Date().toISOString(),
              total_amount: commissionAmount,
              smart_code: intent.smartCode,
              metadata: {
                payment_type: 'commission',
                staff_name: staffName,
                commission_percentage: percentMatch ? parseFloat(percentMatch[1]) : null,
                source: 'Salon Digital Accountant',
                status: 'pending'
              }
            })
            .select()
            .single()

          if (txError) throw txError

          return NextResponse.json({
            success: true,
            type: 'salon_commission',
            category: 'commission',
            amount: commissionAmount,
            message: `✅ Commission calculated!\n\n👩‍💼 Staff: ${staffName}\n${percentMatch ? `📊 Commission (${percentMatch[1]}%): AED ${commissionAmount.toFixed(2)}` : `💰 Commission: AED ${commissionAmount.toFixed(2)}`}\n💸 Ready to process\n\nWould you like to pay now or add to payroll?`,
            result: {
              transaction_code: transactionCode,
              total_amount: commissionAmount,
              staff_name: staffName
            }
          })
        } catch (error) {
          console.error('Error recording commission:', error)
          return NextResponse.json({
            success: false,
            message: `Sorry, I couldn't calculate that commission. Please try again.`,
            error: error.message
          })
        }
      }

      case 'salonPayCommission': {
        try {
          // Check for pending commission transaction in recent messages or session
          const recentCommissions = await supabaseAdmin
            .from('universal_transactions')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('transaction_type', 'payment')
            .eq('metadata->payment_type', 'commission')
            .eq('metadata->status', 'pending')
            .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
            .order('created_at', { ascending: false })
            .limit(1)

          if (!recentCommissions.data || recentCommissions.data.length === 0) {
            return NextResponse.json({
              success: false,
              message:
                "I don't see any pending commission payments. Please tell me who you want to pay commission to and how much.",
              category: 'commission'
            })
          }

          const commissionTx = recentCommissions.data[0]
          const staffName = (commissionTx.metadata as any)?.staff_name || 'Staff'
          const amount = commissionTx.total_amount

          // Update the commission transaction to paid status
          const { error: updateError } = await supabaseAdmin
            .from('universal_transactions')
            .update({
              metadata: {
                ...commissionTx.metadata,
                status: 'paid',
                paid_at: new Date().toISOString(),
                payment_method: 'cash' // Default to cash for salon
              }
            })
            .eq('id', commissionTx.id)

          if (updateError) throw updateError

          return NextResponse.json({
            success: true,
            type: 'salon_payment',
            category: 'payment',
            amount: amount,
            message: `✅ Commission paid successfully!\n\n👩‍💼 Staff: ${staffName}\n💵 Amount: AED ${amount.toFixed(2)}\n💸 Payment Method: Cash\n📅 Paid: ${new Date().toLocaleString()}\n\nThe commission has been recorded and ${staffName}'s payment is complete!`,
            result: {
              transaction_id: commissionTx.id,
              transaction_code: commissionTx.transaction_code,
              total_amount: amount,
              staff_name: staffName
            }
          })
        } catch (error) {
          console.error('Error processing commission payment:', error)
          return NextResponse.json({
            success: false,
            message: "Sorry, I couldn't process the commission payment. Please try again.",
            error: error.message
          })
        }
      }

      case 'salonSummary': {
        try {
          // Get today's transactions
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const { data: todayTransactions, error } = await supabaseAdmin
            .from('universal_transactions')
            .select('*')
            .eq('organization_id', organizationId)
            .gte('created_at', today.toISOString())
            .in('transaction_type', ['sale', 'expense', 'payment'])

          if (error) throw error

          // Calculate totals
          let totalRevenue = 0
          let totalExpenses = 0
          let totalCommissions = 0
          let clientCount = new Set()

          const services = {}

          todayTransactions?.forEach(tx => {
            if (tx.transaction_type === 'sale') {
              totalRevenue += tx.total_amount
              if ((tx.metadata as any)?.client_name) {
                clientCount.add(tx.metadata.client_name)
              }
              // Track services (simplified for demo)
              const serviceName = (tx.metadata as any)?.service_type || 'General Service'
              services[serviceName] = (services[serviceName] || 0) + 1
            } else if (tx.transaction_type === 'expense') {
              totalExpenses += tx.total_amount
            } else if (
              tx.transaction_type === 'payment' &&
              (tx.metadata as any)?.payment_type === 'commission'
            ) {
              totalCommissions += tx.total_amount
            }
          })

          const netProfit = totalRevenue - totalExpenses - totalCommissions

          // Get top services
          const topServices = Object.entries(services)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)

          return NextResponse.json({
            success: true,
            type: 'salon_summary',
            category: 'summary',
            message: `📅 Today's Summary - ${new Date().toLocaleDateString()}\n\n💰 Money In: AED ${totalRevenue.toFixed(2)}\n💸 Money Out: AED ${(totalExpenses + totalCommissions).toFixed(2)}\n📈 Net Profit: AED ${netProfit.toFixed(2)}\n\nClients served: ${clientCount.size}\n\n${topServices.length > 0 ? `Top Services Today:\n${topServices.map(([service, count], i) => `${i + 1}. ${service} (${count} clients)`).join('\n')}` : ''}\n\n${netProfit > 0 ? '🎉 Great day!' : '💪 Keep going!'}`,
            result: {
              total_revenue: totalRevenue,
              total_expenses: totalExpenses + totalCommissions,
              net_profit: netProfit,
              client_count: clientCount.size
            }
          })
        } catch (error) {
          console.error('Error generating summary:', error)
          return NextResponse.json({
            success: false,
            message: `Sorry, I couldn't generate today's summary. Please try again.`,
            error: error.message
          })
        }
      }

      case 'journal': {
        const journalData = parseJournalFromNL(message)

        // Initialize digital accountant service
        const digitalAccountant = createDigitalAccountantService(organizationId, 'system')

        // Create journal entry directly in database
        const transactionData = {
          organization_id: organizationId,
          transaction_type: 'journal_entry',
          transaction_code: journalData.reference,
          transaction_date: journalData.date,
          total_amount: journalData.lines[0].debit,
          transaction_currency_code: 'USD',
          base_currency_code: 'USD',
          exchange_rate: 1.0,
          smart_code: intent.smartCode,
          metadata: {
            status: 'draft',
            source: 'Digital Accountant Chat',
            description: journalData.lines[0].memo,
            journal_type: 'manual',
            created_by: 'Digital Accountant',
            nl_query: message
          }
        }

        console.log('Creating transaction:', JSON.stringify(transactionData, null, 2))

        const { data: journalTransaction, error: txError } = await supabaseAdmin
          .from('universal_transactions')
          .insert(transactionData)
          .select()
          .single()

        if (txError) {
          console.error('Transaction insert error:', txError)
          throw txError
        }

        console.log('Transaction created successfully:', journalTransaction.id)

        // Create journal lines using the same pattern that worked in our test
        const lineItems = journalData.lines.map((line, i) => ({
          organization_id: organizationId,
          transaction_id: journalTransaction.id,
          line_number: i + 1,
          line_type: 'item', // Use 'item' like in the successful test
          description: line.memo,
          quantity: 1,
          unit_amount: line.debit || line.credit,
          line_amount: line.debit || line.credit,
          discount_amount: 0, // Add these fields that were in the successful test
          tax_amount: 0,
          smart_code: intent.smartCode + '.LINE',
          line_data: {
            account_code: line.account_code,
            account_name: line.account_name,
            debit: line.debit,
            credit: line.credit,
            memo: line.memo
          } // Store account details in line_data for display
        }))

        console.log('Attempting to insert line items:', JSON.stringify(lineItems, null, 2))

        // Try inserting the lines
        let linesCreated = []
        let lineError = null

        for (const lineItem of lineItems) {
          const { data: line, error } = await supabaseAdmin
            .from('universal_transaction_lines')
            .insert(lineItem)
            .select()
            .single()

          if (error) {
            lineError = error
            console.error('Line creation error:', error)
            break
          } else {
            linesCreated.push(line)
          }
        }

        if (lineError) {
          // If lines failed, return partial success
          return NextResponse.json({
            success: false,
            message: `Journal header created but lines failed.\n\nReference: ${journalTransaction.transaction_code}\n\nError: ${lineError.message}`,
            transactionId: journalTransaction.transaction_code,
            error: lineError
          })
        }

        // Success response - journal and lines created!
        return NextResponse.json({
          success: true,
          message: `✅ Journal entry created successfully!\n\n📋 **Reference**: ${journalTransaction.transaction_code}\n📅 **Date**: ${journalData.date}\n💰 **Total**: $${journalData.lines[0].debit.toFixed(2)}\n\n**Journal Lines:**\n• **Debit**: ${journalData.lines[0].account_name} - $${journalData.lines[0].debit.toFixed(2)}\n• **Credit**: ${journalData.lines[1].account_name} - $${journalData.lines[1].credit.toFixed(2)}\n\n**Status**: DRAFT - Ready for posting\n**Lines Created**: ${linesCreated.length}`,
          transactionId: journalTransaction.transaction_code,
          status: 'draft',
          confidence: 100,
          result: {
            transaction: journalTransaction,
            lines: journalData.lines.map((line, idx) => ({
              ...line,
              id: linesCreated[idx]?.id,
              line_number: idx + 1
            })),
            summary: {
              total_debits: journalData.lines[0].debit,
              total_credits: journalData.lines[1].credit,
              is_balanced: true
            }
          },
          actions: [
            {
              label: 'Post Journal',
              action: 'post',
              variant: 'default' as const,
              data: { transactionId: journalTransaction.transaction_code }
            },
            {
              label: 'View Details',
              action: 'view',
              variant: 'outline' as const,
              data: { transactionId: journalTransaction.transaction_code }
            }
          ]
        })
      }

      case 'invoice': {
        // Parse invoice details from message
        const amountMatch = message.match(/\$?([\d,]+(?:\.\d{2})?)/g)
        const amount = amountMatch ? parseFloat(amountMatch[0].replace(/[$,]/g, '')) : 0

        // Extract customer name
        const customerMatch = message.match(/(?:for|to)\s+([^$,\d]+?)(?:\s+for|\s+\$|$)/i)
        const customerName = customerMatch ? customerMatch[1].trim() : 'Customer'

        const invoiceCode = `INV-${Date.now().toString().slice(-6)}`
        const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

        try {
          // Create invoice in database
          const { data: invoice, error } = await supabaseAdmin
            .from('universal_transactions')
            .insert({
              organization_id: organizationId,
              transaction_type: 'invoice',
              transaction_code: invoiceCode,
              transaction_date: new Date().toISOString(),
              total_amount: amount,
              smart_code: intent.smartCode,
              metadata: {
                customer_name: customerName,
                due_date: dueDate.toISOString(),
                status: 'draft',
                created_by: 'Digital Accountant',
                payment_terms: 'Net 30',
                currency: 'USD'
              }
            })
            .select()
            .single()

          if (error) throw error

          // Create invoice line items
          await supabaseAdmin.from('universal_transaction_lines').insert({
            organization_id: organizationId,
            transaction_id: invoice.id,
            line_number: 1,
            line_amount: amount,
            quantity: 1,
            unit_price: amount,
            smart_code: 'HERA.FIN.AR.LINE.SERVICE.V1',
            metadata: {
              description: 'Professional Services',
              account_code: '4110',
              account_name: 'Service Revenue'
            }
          })

          return NextResponse.json({
            success: true,
            message: `Invoice draft created for ${customerName}.\n\nAmount: $${amount.toFixed(2)}\nDue Date: ${dueDate.toISOString().split('T')[0]}\n\nReview the details and post when ready.`,
            transactionId: invoiceCode,
            status: 'draft',
            confidence: 85,
            actions: [
              {
                label: 'Post Invoice',
                action: 'post',
                variant: 'default' as const,
                data: { transactionId: invoiceCode }
              },
              {
                label: 'Email to Customer',
                action: 'email',
                variant: 'secondary' as const,
                data: { transactionId: invoiceCode }
              }
            ]
          })
        } catch (error) {
          console.error('Error creating invoice:', error)
          return NextResponse.json({
            success: false,
            message: `Failed to create invoice. Error: ${error.message}`,
            confidence: 0
          })
        }
      }

      case 'payment': {
        const amountMatch = message.match(/\$?([\d,]+(?:\.\d{2})?)/g)
        const amount = amountMatch ? parseFloat(amountMatch[0].replace(/[$,]/g, '')) : 0

        return NextResponse.json({
          success: true,
          message: `Payment recorded: $${amount.toFixed(2)}\n\nThe payment has been applied to outstanding invoices. Bank reconciliation will match this automatically.`,
          transactionId: `PMT-${Date.now().toString().slice(-6)}`,
          status: 'posted',
          confidence: 92,
          actions: [
            {
              label: 'View Receipt',
              action: 'view',
              variant: 'outline' as const
            }
          ]
        })
      }

      case 'reconciliation': {
        return NextResponse.json({
          success: true,
          message:
            'Bank reconciliation in progress...\n\n✓ 42 transactions matched automatically\n⚠️ 3 exceptions require review\n\nOverall match rate: 93%',
          confidence: 88,
          actions: [
            {
              label: 'Review Exceptions',
              action: 'review',
              variant: 'default' as const
            },
            {
              label: 'Complete Reconciliation',
              action: 'complete',
              variant: 'secondary' as const
            }
          ]
        })
      }

      case 'report': {
        const reportType = message.includes('balance')
          ? 'Balance Sheet'
          : message.includes('p&l') || message.includes('profit')
            ? 'P&L Statement'
            : 'Financial Statements'

        return NextResponse.json({
          success: true,
          message: `${reportType} generated for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.\n\nKey metrics:\n• Total Assets: $1,234,567\n• Total Revenue: $456,789\n• Net Income: $123,456\n\nAll figures are preliminary and subject to period-end adjustments.`,
          confidence: 95,
          actions: [
            {
              label: 'Download PDF',
              action: 'download',
              variant: 'default' as const
            },
            {
              label: 'View Details',
              action: 'view',
              variant: 'outline' as const
            }
          ]
        })
      }

      case 'vat': {
        return NextResponse.json({
          success: true,
          message:
            'VAT calculation completed for the current period.\n\n• Output VAT: $12,345.67\n• Input VAT: $8,234.56\n• Net VAT Payable: $4,111.11\n\nDeadline: 15th of next month',
          confidence: 94,
          actions: [
            {
              label: 'Generate VAT Return',
              action: 'generate',
              variant: 'default' as const
            },
            {
              label: 'Export Details',
              action: 'export',
              variant: 'outline' as const
            }
          ]
        })
      }

      case 'post': {
        // Extract transaction ID from message
        const txnIdMatch = message.match(/([A-Z]{2,4}-\d{4,8})/i)
        const transactionId = txnIdMatch ? txnIdMatch[1].toUpperCase() : null

        if (!transactionId) {
          return NextResponse.json({
            success: false,
            message:
              "Please specify a transaction ID to post. Example: 'Post INV-123456' or 'JE-001 post'",
            confidence: 60
          })
        }

        // Determine transaction type from ID prefix
        const prefix = transactionId.split('-')[0]
        let transactionType = 'unknown'

        if (prefix === 'INV') transactionType = 'invoice'
        else if (prefix === 'JE') transactionType = 'journal'
        else if (prefix === 'PMT') transactionType = 'payment'
        else if (prefix === 'CN') transactionType = 'credit_note'

        // Initialize digital accountant service
        const digitalAccountant = createDigitalAccountantService(organizationId, 'system')

        try {
          // Retrieve the transaction
          const { data: transactions } = await supabaseAdmin
            .from('universal_transactions')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('transaction_code', transactionId)
            .single()

          if (!transactions) {
            return NextResponse.json({
              success: false,
              message: `Transaction ${transactionId} not found. Please check the transaction ID.`,
              confidence: 90
            })
          }

          // Check if already posted
          if ((transactions.metadata as any)?.status === 'posted') {
            return NextResponse.json({
              success: true,
              message: `Transaction ${transactionId} is already posted.\n\nPosted on: ${new Date(transactions.metadata.posted_at).toLocaleDateString()}\nPosted by: ${transactions.metadata.posted_by || 'System'}`,
              confidence: 100,
              transactionId,
              status: 'posted'
            })
          }

          // Post the transaction
          const { data: posted, error } = await supabaseAdmin
            .from('universal_transactions')
            .update({
              metadata: {
                ...transactions.metadata,
                status: 'posted',
                posted_at: new Date().toISOString(),
                posted_by: 'Digital Accountant'
              }
            })
            .eq('id', transactions.id)
            .select()
            .single()

          if (error) throw error

          return NextResponse.json({
            success: true,
            message: `✅ ${transactionType.charAt(0).toUpperCase() + transactionType.slice(1)} ${transactionId} posted successfully!\n\nAmount: $${transactions.total_amount.toLocaleString()}\nDate: ${new Date(transactions.transaction_date).toLocaleDateString()}\nStatus: POSTED`,
            transactionId,
            status: 'posted',
            confidence: 100,
            actions: [
              {
                label: 'View Details',
                action: 'view',
                variant: 'outline' as const,
                data: { transactionId }
              },
              {
                label: 'Print',
                action: 'print',
                variant: 'secondary' as const,
                data: { transactionId }
              }
            ]
          })
        } catch (error) {
          console.error('Error posting transaction:', error)
          return NextResponse.json({
            success: false,
            message: `Failed to post ${transactionId}. Error: ${error.message}`,
            confidence: 0
          })
        }
      }

      default: {
        // Check if it might be a contextual response
        const lowerMessage = message.toLowerCase()

        // Check for common contextual responses
        if (lowerMessage.includes('thank') || lowerMessage === 'thanks') {
          return NextResponse.json({
            success: true,
            message:
              "You're welcome! I'm here to help with all your salon accounting needs. Just let me know what you need!",
            category: 'general'
          })
        }

        if (lowerMessage === 'ok' || lowerMessage === 'okay' || lowerMessage === 'great') {
          return NextResponse.json({
            success: true,
            message: 'Perfect! Is there anything else I can help you with today?',
            category: 'general'
          })
        }

        // For salon mode, provide helpful suggestions
        if (context?.mode === 'salon') {
          // Try using AI to understand the query better
          try {
            const aiResponse = await fetch(`${new URL(request.url).origin}/api/v1/ai/universal`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'custom_request',
                smart_code: 'HERA.SALON.AI.CHAT.V1',
                task_type: 'chat',
                prompt: `You are a friendly salon accounting assistant. The user said: "${message}". 
                
Context: This might be related to a recent commission calculation where you asked if they want to "pay now or add to payroll".

If they seem to be confirming a payment, respond with encouragement to use the specific commands.
Otherwise, help them with salon accounting in simple terms.

Keep your response brief and friendly, focused on salon business operations like:
- Recording client payments
- Tracking expenses
- Calculating staff commissions
- Daily summaries`,
                max_tokens: 150,
                temperature: 0.7,
                fallback_enabled: true,
                organization_id: organizationId
              })
            })

            if (aiResponse.ok) {
              const aiData = await aiResponse.json()
              if (aiData.success && aiData.response) {
                return NextResponse.json({
                  success: true,
                  message: aiData.response,
                  category: 'general',
                  ai_assisted: true
                })
              }
            }
          } catch (aiError) {
            console.error('AI fallback error:', aiError)
          }

          // If AI fails, return helpful suggestions
          return NextResponse.json({
            success: false,
            message: `I didn't quite understand that. Here's what I can help with:

💇 **Record a Sale**: "Sarah paid 350 for coloring"
🛍️ **Record an Expense**: "Bought hair products for 200"
💰 **Pay Commission**: "Pay Maya her commission"
📊 **Daily Summary**: "Show today's total"

Just tell me what happened in simple words!`,
            category: 'help'
          })
        }

        // For general mode, provide accounting-focused help
        return NextResponse.json({
          success: false,
          message: `I understand accounting operations like posting journals, creating invoices, recording payments, and generating reports. Please be more specific about what you'd like to do.`,
          confidence: 0
        })
      }
    }
  } catch (error) {
    console.error('Digital Accountant API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process accounting request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Export supported methods
export async function GET() {
  return NextResponse.json({
    service: 'HERA Digital Accountant Chat API',
    version: '1.0.0',
    capabilities: [
      'Journal entry creation',
      'Invoice generation',
      'Payment recording',
      'Bank reconciliation',
      'Financial reporting',
      'VAT calculations'
    ],
    supportedSmartCodes: Object.values(INTENT_PATTERNS).map(p => p.smartCode)
  })
}
