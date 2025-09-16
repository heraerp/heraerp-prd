'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  Zap,
  Brain,
  TrendingUp,
  Clock,
  DollarSign,
  Shield,
  CheckCircle2,
  Code2,
  BarChart3,
  AlertCircle,
  ArrowRight,
  Cpu
} from 'lucide-react'

export default function AutoJournalDoc() {
  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Auto-Journal Engine</h3>
          <a href="#overview" className="docs-nav-link">
            Overview
          </a>
          <a href="#how-it-works" className="docs-nav-link">
            How It Works
          </a>
          <a href="#processing-modes" className="docs-nav-link">
            Processing Modes
          </a>
          <a href="#smart-codes" className="docs-nav-link">
            Business Classification
          </a>
          <a href="#business-impact" className="docs-nav-link">
            Business Impact
          </a>
          <a href="#api-reference" className="docs-nav-link">
            API Reference
          </a>
          <a href="#configuration" className="docs-nav-link">
            Configuration
          </a>
        </div>

        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Related Topics</h3>
          <Link href="/docs/features/chart-of-accounts" className="docs-nav-link">
            Chart of Accounts
          </Link>
          <Link href="/docs/features/smart-codes" className="docs-nav-link">
            Business Classification
          </Link>
          <Link href="/docs/features/ai-integration" className="docs-nav-link">
            AI Integration
          </Link>
        </div>
      </nav>

      <main className="docs-main">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/docs" className="hover:text-accent-fg">
              Docs
            </Link>
            <span>/</span>
            <Link href="/docs/features" className="hover:text-accent-fg">
              Features
            </Link>
            <span>/</span>
            <span>Auto-Journal Engine</span>
          </div>

          <h1>Auto-Journal Posting Engine</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Revolutionary AI-powered journal automation with 85% automation rate
          </p>
        </div>

        <div className="docs-note docs-note-success mb-8">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <strong>World's First</strong>
              <p className="text-sm mt-1">
                HERA is the only ERP system with intelligent auto-journal posting built-in by
                default. Save $34,560 annually per organization through automated journal entry
                creation.
              </p>
            </div>
          </div>
        </div>

        <section id="overview" className="mb-12">
          <h2>Overview</h2>
          <p className="mb-6">
            The HERA Auto-Journal Engine transforms accounting by automatically creating journal
            entries from business transactions. Using a combination of rule-based logic (95% of
            cases) and AI analysis for complex scenarios, it eliminates traditional accounting
            bottlenecks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="docs-card text-center">
              <div className="text-3xl font-bold text-accent-fg mb-2">85%</div>
              <p className="text-sm text-muted-foreground">Automation Rate</p>
            </div>
            <div className="docs-card text-center">
              <div className="text-3xl font-bold text-success-fg mb-2">92%</div>
              <p className="text-sm text-muted-foreground">Time Savings</p>
            </div>
            <div className="docs-card text-center">
              <div className="text-3xl font-bold text-attention-fg mb-2">2%</div>
              <p className="text-sm text-muted-foreground">Error Rate</p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mb-12">
          <h2>How It Works</h2>

          <div className="docs-card mb-6">
            <h3 className="text-lg font-semibold mb-4">Processing Flow</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent-emphasis text-foreground flex items-center justify-center flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Transaction Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    System examines transaction type, business classification, and metadata to
                    determine journal relevance
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent-emphasis text-foreground flex items-center justify-center flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Business Classification</h4>
                  <p className="text-sm text-muted-foreground">
                    Business classification provides instant context for appropriate GL account
                    mapping
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent-emphasis text-foreground flex items-center justify-center flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Rule Engine Processing</h4>
                  <p className="text-sm text-muted-foreground">
                    95% of transactions handled by deterministic rules for speed and accuracy
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent-emphasis text-foreground flex items-center justify-center flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">AI Enhancement (Optional)</h4>
                  <p className="text-sm text-muted-foreground">
                    Complex or ambiguous transactions analyzed by AI for correct posting
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-success-emphasis text-foreground flex items-center justify-center flex-shrink-0">
                  5
                </div>
                <div>
                  <h4 className="font-semibold">Automatic Journal Creation</h4>
                  <p className="text-sm text-muted-foreground">
                    Journal entries created with complete audit trail and confidence scoring
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Rule-Based Processing (95%)</h4>
              <pre className="text-sm bg-canvas-inset p-3 rounded overflow-x-auto">
                {`// Restaurant sale example
if (smartCode === 'HERA.REST.SALE.ORDER.v1') {
  return {
    debit: [
      { account: '1100', amount: total }
    ],
    credit: [
      { account: '4110', amount: subtotal },
      { account: '2250', amount: tax }
    ]
  }
}`}
              </pre>
            </div>

            <div className="docs-card">
              <h4 className="font-semibold mb-3">AI Processing (5%)</h4>
              <pre className="text-sm bg-canvas-inset p-3 rounded overflow-x-auto">
                {`// Complex transaction
{
  "analysis": "Multi-party transaction",
  "confidence": 0.87,
  "suggested_posting": {
    "reasoning": "Split payment scenario",
    "entries": [...]
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        <section id="processing-modes" className="mb-12">
          <h2>Processing Modes</h2>

          <div className="grid gap-6">
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <Clock className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Immediate Processing</h3>
                  <p className="text-muted-foreground mb-3">
                    Critical transactions processed in real-time for instant financial visibility
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>• Large transactions (&gt;$1,000)</li>
                    <li>• Payments and receipts</li>
                    <li>
                      • Transactions with <code>.CRITICAL.</code> smart codes
                    </li>
                    <li>• Manual journal entries</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="docs-card">
              <div className="flex items-start gap-4">
                <BarChart3 className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
                  <p className="text-muted-foreground mb-3">
                    Small transactions aggregated for efficient processing
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>• Routine sales &lt;$100</li>
                    <li>• End-of-day summarization</li>
                    <li>• Grouped by transaction type</li>
                    <li>• Consolidated journal entries</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="smart-codes" className="mb-12">
          <h2>Smart Code Classifications</h2>

          <div className="docs-note docs-note-info mb-6">
            Smart codes provide instant context for automatic GL posting without configuration
          </div>

          <table className="w-full">
            <thead>
              <tr>
                <th>Smart Code Pattern</th>
                <th>Processing Type</th>
                <th>Example Posting</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <code>HERA.FIN.GL.TXN.JE.*</code>
                </td>
                <td>Direct Journal</td>
                <td>As specified in entry</td>
              </tr>
              <tr>
                <td>
                  <code>HERA.FIN.AP.TXN.PAY.*</code>
                </td>
                <td>Immediate</td>
                <td>DR: AP Account, CR: Bank</td>
              </tr>
              <tr>
                <td>
                  <code>HERA.FIN.AR.TXN.RCP.*</code>
                </td>
                <td>Immediate</td>
                <td>DR: Bank, CR: AR Account</td>
              </tr>
              <tr>
                <td>
                  <code>HERA.REST.POS.TXN.SALE.*</code>
                </td>
                <td>Conditional</td>
                <td>DR: Cash/Card, CR: Revenue, Tax</td>
              </tr>
              <tr>
                <td>
                  <code>HERA.INV.ADJ.TXN.*</code>
                </td>
                <td>Rule-based</td>
                <td>Based on adjustment type</td>
              </tr>
              <tr>
                <td>
                  <code>*.DRAFT</code>
                </td>
                <td>Never</td>
                <td>No journal entry</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section id="business-impact" className="mb-12">
          <h2>Business Impact Analysis</h2>

          <div className="docs-card bg-success-emphasis text-foreground mb-6">
            <h3 className="text-xl font-semibold mb-4">Quantified Benefits</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Time Savings</h4>
                <table className="text-sm">
                  <tbody>
                    <tr>
                      <td className="pr-4">Manual entries/day:</td>
                      <td className="font-mono">50 → 7.5</td>
                    </tr>
                    <tr>
                      <td className="pr-4">Hours saved/day:</td>
                      <td className="font-mono">3.6 hours</td>
                    </tr>
                    <tr>
                      <td className="pr-4">Monthly hours saved:</td>
                      <td className="font-mono">79.2 hours</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Cost Savings</h4>
                <table className="text-sm">
                  <tbody>
                    <tr>
                      <td className="pr-4">Monthly savings:</td>
                      <td className="font-mono">$2,880</td>
                    </tr>
                    <tr>
                      <td className="pr-4">Annual savings:</td>
                      <td className="font-mono">$34,560</td>
                    </tr>
                    <tr>
                      <td className="pr-4">Error reduction:</td>
                      <td className="font-mono">86.7%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="docs-card text-center">
              <CheckCircle2 className="w-8 h-8 text-success-fg mx-auto mb-2" />
              <h4 className="font-semibold">Real-Time Books</h4>
              <p className="text-sm text-muted-foreground">Always current financials</p>
            </div>
            <div className="docs-card text-center">
              <Shield className="w-8 h-8 text-accent-fg mx-auto mb-2" />
              <h4 className="font-semibold">Audit Ready</h4>
              <p className="text-sm text-muted-foreground">Complete trail & validation</p>
            </div>
            <div className="docs-card text-center">
              <Brain className="w-8 h-8 text-done-fg mx-auto mb-2" />
              <h4 className="font-semibold">AI Enhanced</h4>
              <p className="text-sm text-muted-foreground">Handles complex scenarios</p>
            </div>
          </div>
        </section>

        <section id="api-reference" className="mb-12">
          <h2>API Reference</h2>

          <div className="space-y-6">
            <div className="docs-card">
              <h3 className="font-semibold mb-3">Process Transaction for Auto-Journal</h3>
              <pre className="text-sm bg-canvas-inset p-3 rounded overflow-x-auto">
                {`// Process single transaction
const result = await universalApi.processTransactionForAutoJournal(
  transactionId
)

// Response
{
  "status": "success",
  "journalCreated": true,
  "journalId": "je-123",
  "confidence": 0.98,
  "processingMode": "immediate",
  "entries": [
    {
      "account": "1100",
      "debit": 1000,
      "credit": 0
    },
    {
      "account": "4100", 
      "debit": 0,
      "credit": 1000
    }
  ]
}`}
              </pre>
            </div>

            <div className="docs-card">
              <h3 className="font-semibold mb-3">Batch Journal Processing</h3>
              <pre className="text-sm bg-canvas-inset p-3 rounded overflow-x-auto">
                {`// Run end-of-day batch
const batchResult = await universalApi.runBatchJournalProcessing({
  date: '2024-01-31',
  mode: 'end_of_day'
})

// Response
{
  "status": "success",
  "transactionsProcessed": 247,
  "journalsCreated": 15,
  "batchSummary": {
    "sales": { count: 180, total: 4500 },
    "expenses": { count: 67, total: 1200 }
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        <section id="configuration" className="mb-12">
          <h2>Configuration Options</h2>

          <div className="docs-card">
            <pre className="text-sm bg-canvas-inset p-3 rounded overflow-x-auto">
              {`// Auto-journal configuration
{
  "autoJournal": {
    "enabled": true,
    "immediateThreshold": 1000,
    "batchInterval": "daily",
    "aiEnabled": true,
    "confidenceThreshold": 0.85,
    "excludePatterns": ["*.DRAFT", "*.TEMP"],
    "customRules": [
      {
        "pattern": "CUSTOM.SPECIAL.*",
        "handler": "customSpecialHandler"
      }
    ]
  }
}`}
            </pre>
          </div>
        </section>

        <section>
          <h2>Next Steps</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/docs/features/smart-codes"
              className="docs-card hover:border-accent-fg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Smart Code System</h4>
                  <p className="text-sm text-muted-foreground">
                    Learn how smart codes enable automatic business logic
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent-fg" />
              </div>
            </Link>

            <Link href="/fi-demo" className="docs-card hover:border-accent-fg transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Live Demo</h4>
                  <p className="text-sm text-muted-foreground">
                    See the auto-journal engine in action
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent-fg" />
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
