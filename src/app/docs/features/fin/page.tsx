'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  Calculator, 
  FileText, 
  CheckCircle2,
  TrendingUp,
  Clock,
  DollarSign,
  Building2,
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
  PieChart,
  Receipt,
  AlertCircle,
  Globe
} from 'lucide-react'

export default function FINDoc() {
  const [activeTab, setActiveTab] = useState('overview')
  
  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Financial Management</h3>
          <a href="#overview" className="docs-nav-link" onClick={() => setActiveTab('overview')}>Overview</a>
          <a href="#features" className="docs-nav-link">Key Features</a>
          <a href="#general-ledger" className="docs-nav-link">General Ledger</a>
          <a href="#reporting" className="docs-nav-link">Financial Reporting</a>
          <a href="#consolidation" className="docs-nav-link">Multi-Company</a>
          <a href="#implementation" className="docs-nav-link">Getting Started</a>
          <a href="#metrics" className="docs-nav-link">Success Metrics</a>
          <a href="#examples" className="docs-nav-link">Use Cases</a>
        </div>
        
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Related Topics</h3>
          <Link href="/docs/features/chart-of-accounts" className="docs-nav-link">Chart of Accounts</Link>
          <Link href="/docs/features/budgeting" className="docs-nav-link">Budgeting & Planning</Link>
          <Link href="/docs/features/auto-journal" className="docs-nav-link">Auto-Journal Engine</Link>
        </div>
      </nav>
      
      <main className="docs-main">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/docs" className="hover:text-accent-fg">Docs</Link>
            <span>/</span>
            <Link href="/docs/features" className="hover:text-accent-fg">Features</Link>
            <span>/</span>
            <span>Financial Management</span>
          </div>
          
          <h1>Financial Management (FIN)</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Real-time financial control with automated posting, instant reporting, and AI-powered insights
          </p>
        </div>
        
        <div className="docs-note docs-note-success mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Production Ready</strong>
              <p className="text-sm mt-1">
                Processing millions in transactions daily with same-day closing, 85% automation, and real-time reporting.
                Trusted by CFOs for complete financial control.
              </p>
            </div>
          </div>
        </div>
        
        <section id="overview" className="mb-12">
          <h2>Overview</h2>
          <p>
            HERA FIN delivers enterprise-grade financial management with revolutionary simplicity. From automated 
            journal entries to real-time consolidation, every financial process is optimized for accuracy, 
            speed, and compliance.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">Traditional Financial Systems</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 5-10 day month-end close</li>
                <li>• Manual journal entries</li>
                <li>• Delayed reporting</li>
                <li>• Complex consolidation</li>
                <li>• Limited visibility</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">HERA FIN</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Same-day closing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  85% automated posting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Real-time reporting
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  One-click consolidation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Complete transparency
                </li>
              </ul>
            </div>
          </div>
        </section>
        
        <section id="features" className="mb-12">
          <h2>Key Features</h2>
          
          <div className="grid gap-6 mt-6">
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <Calculator className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Intelligent General Ledger</h3>
                  <p className="text-muted-foreground mb-3">
                    Real-time GL with automatic posting from all business transactions and intelligent account determination.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="docs-badge">Auto-Posting</span>
                    <span className="docs-badge">Real-time Balances</span>
                    <span className="docs-badge">Multi-Currency</span>
                    <span className="docs-badge">Audit Trail</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <BarChart3 className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Instant Financial Reporting</h3>
                  <p className="text-muted-foreground mb-3">
                    Generate financial statements in seconds with drill-down capabilities and variance analysis.
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Balance Sheet</p>
                      <p className="font-semibold">Real-time</p>
                    </div>
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Income Statement</p>
                      <p className="font-semibold">Instant</p>
                    </div>
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Cash Flow</p>
                      <p className="font-semibold">Live</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <Globe className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Multi-Company Consolidation</h3>
                  <p className="text-muted-foreground mb-3">
                    Consolidate unlimited entities with automatic eliminations and currency translation.
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>• Full, proportional, and equity methods</li>
                    <li>• Intercompany eliminations</li>
                    <li>• Multi-currency translation</li>
                    <li>• Minority interest calculation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section id="general-ledger" className="mb-12">
          <h2>General Ledger Excellence</h2>
          
          <div className="docs-note docs-note-info mb-6">
            <strong>Automatic GL Posting:</strong> Every business transaction automatically creates proper 
            journal entries with complete audit trail and real-time balance updates.
          </div>
          
          <div className="grid gap-4">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Automated Journal Creation</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Receipt className="w-5 h-5 text-accent-fg flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Sales Transactions</p>
                    <p className="text-sm text-muted-foreground">
                      DR: Accounts Receivable | CR: Revenue, Sales Tax
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Receipt className="w-5 h-5 text-accent-fg flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Purchase Orders</p>
                    <p className="text-sm text-muted-foreground">
                      DR: Inventory/Expense | CR: Accounts Payable
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Receipt className="w-5 h-5 text-accent-fg flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Payroll Processing</p>
                    <p className="text-sm text-muted-foreground">
                      DR: Salary Expense | CR: Payroll Liabilities, Cash
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">GL Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Account Management</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Unlimited chart of accounts</li>
                    <li>• Multi-level hierarchies</li>
                    <li>• Segment accounting</li>
                    <li>• Statistical accounts</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Period Control</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Flexible fiscal periods</li>
                    <li>• Soft and hard close</li>
                    <li>• Prior period adjustments</li>
                    <li>• Year-end automation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section id="reporting" className="mb-12">
          <h2>Financial Reporting</h2>
          
          <div className="docs-card mb-6">
            <h3 className="text-lg font-semibold mb-3">Real-Time Financial Statements</h3>
            <p className="text-muted-foreground mb-4">
              Generate any financial report instantly with complete accuracy:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-canvas-inset p-4 rounded">
                <h4 className="font-medium mb-2">Standard Reports</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Balance Sheet (Statement of Financial Position)</li>
                  <li>• Income Statement (P&L)</li>
                  <li>• Cash Flow Statement</li>
                  <li>• Statement of Changes in Equity</li>
                  <li>• Trial Balance</li>
                  <li>• General Ledger Detail</li>
                </ul>
              </div>
              <div className="bg-canvas-inset p-4 rounded">
                <h4 className="font-medium mb-2">Management Reports</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Budget vs Actual Analysis</li>
                  <li>• Department P&L</li>
                  <li>• Project Profitability</li>
                  <li>• Cash Position Report</li>
                  <li>• Aging Analysis</li>
                  <li>• Financial Ratios Dashboard</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="docs-card">
            <h3 className="text-lg font-semibold mb-3">Financial Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="text-center p-3 bg-canvas-inset rounded">
                <PieChart className="w-8 h-8 mx-auto mb-2 text-accent-fg" />
                <p className="font-medium text-sm">Ratio Analysis</p>
                <p className="text-xs text-muted-foreground">Automated KPI calculation</p>
              </div>
              <div className="text-center p-3 bg-canvas-inset rounded">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-accent-fg" />
                <p className="font-medium text-sm">Trend Analysis</p>
                <p className="text-xs text-muted-foreground">Multi-period comparison</p>
              </div>
              <div className="text-center p-3 bg-canvas-inset rounded">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-accent-fg" />
                <p className="font-medium text-sm">Anomaly Detection</p>
                <p className="text-xs text-muted-foreground">AI-powered alerts</p>
              </div>
            </div>
          </div>
        </section>
        
        <section id="consolidation" className="mb-12">
          <h2>Multi-Company Consolidation</h2>
          
          <div className="docs-card mb-6">
            <h3 className="text-lg font-semibold mb-3">Enterprise Consolidation Engine</h3>
            <p className="text-muted-foreground mb-3">
              Consolidate complex corporate structures with automatic eliminations:
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent-emphasis text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">1</div>
                <div className="flex-1">
                  <p className="font-medium">Data Collection</p>
                  <p className="text-sm text-muted-foreground">Automatic gathering from all subsidiaries</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent-emphasis text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">2</div>
                <div className="flex-1">
                  <p className="font-medium">Currency Translation</p>
                  <p className="text-sm text-muted-foreground">Multi-currency conversion with CTA calculation</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent-emphasis text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">3</div>
                <div className="flex-1">
                  <p className="font-medium">Eliminations</p>
                  <p className="text-sm text-muted-foreground">Automatic intercompany transaction removal</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-accent-emphasis text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">4</div>
                <div className="flex-1">
                  <p className="font-medium">Consolidated Reports</p>
                  <p className="text-sm text-muted-foreground">Group financial statements in minutes</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="docs-card">
            <h3 className="text-lg font-semibold mb-3">Consolidation Methods</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Ownership %</th>
                  <th className="text-left py-2">Method</th>
                  <th className="text-left py-2">Treatment</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">100%</td>
                  <td className="py-2">Full Consolidation</td>
                  <td className="py-2">Include all assets/liabilities</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">50-99%</td>
                  <td className="py-2">Full + Minority Interest</td>
                  <td className="py-2">Full consolidation with NCI</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">20-49%</td>
                  <td className="py-2">Equity Method</td>
                  <td className="py-2">Single line investment</td>
                </tr>
                <tr>
                  <td className="py-2">&lt;20%</td>
                  <td className="py-2">Cost Method</td>
                  <td className="py-2">Investment at cost</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        
        <section id="implementation" className="mb-12">
          <h2>Getting Started</h2>
          
          <h3 className="mb-4">Week 1: Foundation</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Set up chart of accounts</li>
              <li>✓ Configure fiscal periods</li>
              <li>✓ Import opening balances</li>
              <li>✓ Define GL posting rules</li>
            </ul>
          </div>
          
          <h3 className="mb-4">Week 2: Integration</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Connect P2P module</li>
              <li>✓ Connect O2C module</li>
              <li>✓ Connect HCM module</li>
              <li>✓ Test auto-posting</li>
            </ul>
          </div>
          
          <h3 className="mb-4">Week 3: Reporting</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Configure financial statements</li>
              <li>✓ Set up management reports</li>
              <li>✓ Create dashboards</li>
              <li>✓ Train finance team</li>
            </ul>
          </div>
          
          <h3 className="mb-4">Week 4: Advanced Features</h3>
          <div className="docs-card">
            <ul className="space-y-2">
              <li>✓ Set up consolidation</li>
              <li>✓ Configure budgeting</li>
              <li>✓ Activate AI insights</li>
              <li>✓ Go live with support</li>
            </ul>
          </div>
        </section>
        
        <section id="metrics" className="mb-12">
          <h2>Success Metrics</h2>
          
          <div className="docs-card bg-success-emphasis text-white">
            <h3 className="text-xl font-semibold mb-4">Proven Results Across Industries</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold">Same Day</p>
                <p className="text-sm opacity-90">Month-end close time</p>
              </div>
              <div>
                <p className="text-3xl font-bold">85%</p>
                <p className="text-sm opacity-90">Journal automation rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold">$450K</p>
                <p className="text-sm opacity-90">Average annual savings</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Efficiency Gains</h4>
              <ul className="space-y-2 text-sm">
                <li>• Close time: 5-10 days → Same day</li>
                <li>• Journal entries: Manual → 85% automated</li>
                <li>• Report generation: Hours → Seconds</li>
                <li>• Consolidation: 1 week → 1 hour</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Quality Improvements</h4>
              <ul className="space-y-2 text-sm">
                <li>• 99.9% accuracy rate</li>
                <li>• Complete audit trail</li>
                <li>• Real-time compliance</li>
                <li>• Zero reconciliation issues</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section id="examples" className="mb-12">
          <h2>Use Cases</h2>
          
          <div className="grid gap-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Multi-National Corporation</h3>
              <p className="text-muted-foreground mb-3">
                Global manufacturer with 50+ entities transformed financial operations:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Consolidated 50 companies across 25 countries</li>
                <li>• Automated multi-currency translation</li>
                <li>• Real-time intercompany eliminations</li>
                <li>• Result: 5-day close to same-day, $2M annual savings</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Fast-Growing Tech Company</h3>
              <p className="text-muted-foreground mb-3">
                SaaS company scaled financial operations without adding headcount:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Automated revenue recognition</li>
                <li>• Real-time SaaS metrics</li>
                <li>• Investor-ready reporting</li>
                <li>• Result: IPO-ready financials, 90% efficiency gain</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Healthcare Network</h3>
              <p className="text-muted-foreground mb-3">
                Hospital system unified financial management across facilities:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Centralized GL for 15 hospitals</li>
                <li>• Department-level P&L reporting</li>
                <li>• Grant and fund accounting</li>
                <li>• Result: 80% reduction in reporting time, perfect compliance</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section>
          <h2>Next Steps</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/docs/features/budgeting" className="docs-card hover:border-accent-fg transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Budgeting & Planning</h4>
                  <p className="text-sm text-muted-foreground">
                    Create budgets and track performance in real-time
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent-fg" />
              </div>
            </Link>
            
            <Link href="/docs/features/financial-analytics" className="docs-card hover:border-accent-fg transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Advanced Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    AI-powered insights and predictive analytics
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent-fg" />
              </div>
            </Link>
          </div>
          
          <div className="docs-note docs-note-info mt-8">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Ready for real-time financial control?</strong>
                <p className="text-sm mt-1">
                  HERA FIN can be implemented in just 4 weeks with immediate improvements in closing time and accuracy. 
                  <Link href="/contact" className="underline">Contact us</Link> to see how we can transform your financial operations.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}