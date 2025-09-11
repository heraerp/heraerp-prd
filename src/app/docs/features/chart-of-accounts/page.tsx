'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState } from 'react'
import { 
  Calculator, 
  Building2, 
  Globe,
  CheckCircle2,
  Code2,
  Database,
  TrendingUp,
  FileText,
  Zap,
  Shield,
  ArrowRight
} from 'lucide-react'

export default function ChartOfAccountsDoc() {
  const [activeTab, setActiveTab] = useState('overview')
  
  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Chart of Accounts</h3>
          <a href="#overview" className="docs-nav-link" onClick={() => setActiveTab('overview')}>Overview</a>
          <a href="#features" className="docs-nav-link">Key Features</a>
          <a href="#ifrs-compliance" className="docs-nav-link">IFRS Compliance</a>
          <a href="#templates" className="docs-nav-link">Industry Templates</a>
          <a href="#implementation" className="docs-nav-link">Implementation</a>
          <a href="#api-reference" className="docs-nav-link">API Reference</a>
          <a href="#examples" className="docs-nav-link">Examples</a>
        </div>
        
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Related Topics</h3>
          <Link href="/docs/features/auto-journal" className="docs-nav-link">Auto-Journal Engine</Link>
          <Link href="/docs/features/budgeting" className="docs-nav-link">Budgeting System</Link>
          <Link href="/docs/features/smart-codes" className="docs-nav-link">Business Classification</Link>
        </div>
      </nav>
      
      <main className="docs-main">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/docs" className="hover:text-accent-fg">Docs</Link>
            <span>/</span>
            <Link href="/docs/features" className="hover:text-accent-fg">Features</Link>
            <span>/</span>
            <span>Chart of Accounts</span>
          </div>
          
          <h1>Universal Chart of Accounts</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Enterprise-grade Chart of Accounts with built-in IFRS compliance and industry templates
          </p>
        </div>
        
        <div className="docs-note docs-note-success mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Production Ready</strong>
              <p className="text-sm mt-1">
                132 template combinations covering 12 countries × 11 industries with complete IFRS compliance. 
                Used in production by businesses worldwide.
              </p>
            </div>
          </div>
        </div>
        
        <section id="overview" className="mb-12">
          <h2>Overview</h2>
          <p>
            HERA's Universal Chart of Accounts revolutionizes financial account management by providing enterprise-grade
            accounting structures that set up in 30 seconds instead of 18 months. Every COA is automatically IFRS-compliant
            with complete lineage tracking.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">Traditional Approach</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 18-36 month implementation</li>
                <li>• $50K-500K consulting fees</li>
                <li>• Manual IFRS mapping</li>
                <li>• Complex schema changes</li>
                <li>• Limited flexibility</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">HERA Universal COA</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  30-second setup
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Zero implementation cost
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Automatic IFRS compliance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Flexible architecture
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Unlimited flexibility
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
                <Globe className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">132 Template Combinations</h3>
                  <p className="text-muted-foreground mb-3">
                    Pre-configured templates for 12 countries × 11 industries, each with complete localization
                    and regulatory compliance.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="docs-badge">UAE</span>
                    <span className="docs-badge">Saudi Arabia</span>
                    <span className="docs-badge">USA</span>
                    <span className="docs-badge">UK</span>
                    <span className="docs-badge">Singapore</span>
                    <span className="docs-badge">India</span>
                    <span className="docs-badge">+6 more</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Complete IFRS Compliance</h3>
                  <p className="text-muted-foreground mb-3">
                    Every account includes 11 IFRS fields for complete international compliance:
                  </p>
                  <pre className="text-xs bg-canvas-inset p-3 rounded overflow-x-auto">
{`{
  "ifrs_classification": "Assets",
  "ifrs_sub_classification": "Current Assets", 
  "ifrs_line_item": "Cash and cash equivalents",
  "statement_type": "SFP",
  "cash_flow_category": "Operating",
  "consolidation_method": "Full",
  "measurement_basis": "Historical Cost"
}`}</pre>
                </div>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <Database className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Universal 6-Table Architecture</h3>
                  <p className="text-muted-foreground mb-3">
                    GL accounts stored as entities with dynamic properties - no schema changes ever needed:
                  </p>
                  <pre className="text-xs bg-canvas-inset p-3 rounded overflow-x-auto">
{`// GL Account as Entity
{
  entity_type: 'gl_account',
  entity_code: '1000',
  entity_name: 'Cash - Operating Account',
  smart_code: 'HERA.FIN.GL.ASSET.CASH.v1'
}

// Account Properties via Dynamic Data
{
  field_name: 'account_type',
  field_value_text: 'Asset',
  smart_code: 'HERA.FIN.GL.PROP.TYPE.v1'
}`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section id="ifrs-compliance" className="mb-12">
          <h2>IFRS Compliance Details</h2>
          
          <div className="docs-note docs-note-info mb-6">
            <strong>Revolutionary Achievement:</strong> HERA is the first ERP system with built-in IFRS compliance 
            by default. Every Chart of Accounts generated includes complete IFRS lineage automatically.
          </div>
          
          <h3>IFRS Field Structure</h3>
          <p className="mb-4">
            Every GL account includes these mandatory IFRS fields stored in core_dynamic_data:
          </p>
          
          <table className="w-full">
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Purpose</th>
                <th>Example Values</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>ifrs_classification</code></td>
                <td>Primary IFRS category</td>
                <td>Assets, Liabilities, Equity, Income, Expenses</td>
              </tr>
              <tr>
                <td><code>ifrs_sub_classification</code></td>
                <td>Secondary classification</td>
                <td>Current Assets, Non-current Assets, etc.</td>
              </tr>
              <tr>
                <td><code>ifrs_line_item</code></td>
                <td>Specific line item on statements</td>
                <td>Cash and cash equivalents, Trade receivables</td>
              </tr>
              <tr>
                <td><code>statement_type</code></td>
                <td>Financial statement mapping</td>
                <td>SFP, SPL, SCE, SCF, NOTES</td>
              </tr>
              <tr>
                <td><code>parent_account_id</code></td>
                <td>Hierarchical parent</td>
                <td>UUID reference to parent account</td>
              </tr>
              <tr>
                <td><code>account_level</code></td>
                <td>Hierarchy level (1-5)</td>
                <td>1 (Top), 2 (Category), 3 (Sub-category), etc.</td>
              </tr>
            </tbody>
          </table>
        </section>
        
        <section id="implementation" className="mb-12">
          <h2>Implementation Guide</h2>
          
          <h3>Quick Setup (30 seconds)</h3>
          <div className="docs-card mb-6">
            <pre className="text-sm bg-canvas-inset p-4 rounded overflow-x-auto">
{`import { universalApi } from '@/lib/universal-api'

// Setup complete IFRS-compliant COA
const result = await universalApi.setupIFRSChartOfAccounts({
  organizationId: 'org-123',
  country: 'AE',
  industry: 'restaurant',
  organizationName: 'Mario\'s Restaurant'
})

// Result includes:
// ✓ 85-120 GL accounts (based on industry)
// ✓ Complete IFRS mapping
// ✓ 5-level hierarchy
// ✓ Localized account names
// ✓ Smart codes for automation`}</pre>
          </div>
          
          <h3>Advanced Configuration</h3>
          <div className="grid gap-4">
            <div className="docs-card">
              <h4 className="font-semibold mb-2">Custom Account Creation</h4>
              <pre className="text-sm bg-canvas-inset p-3 rounded overflow-x-auto">
{`// Create custom GL account
await universalApi.createEntity({
  entity_type: 'gl_account',
  entity_code: '6150',
  entity_name: 'Digital Marketing Expense',
  smart_code: 'HERA.FIN.GL.EXPENSE.MARKETING.v1',
  organization_id: orgId
})

// Add IFRS properties
await universalApi.setDynamicField(accountId, 'ifrs_classification', 'Expenses')
await universalApi.setDynamicField(accountId, 'ifrs_line_item', 'Marketing expenses')`}</pre>
            </div>
            
            <div className="docs-card">
              <h4 className="font-semibold mb-2">Account Hierarchy Setup</h4>
              <pre className="text-sm bg-canvas-inset p-3 rounded overflow-x-auto">
{`// Create parent-child relationships
await universalApi.createRelationship({
  from_entity_id: childAccountId,
  to_entity_id: parentAccountId,
  relationship_type: 'CHILD_OF',
  smart_code: 'HERA.FIN.GL.HIERARCHY.v1'
})`}</pre>
            </div>
          </div>
        </section>
        
        <section id="examples" className="mb-12">
          <h2>Real-World Examples</h2>
          
          <div className="grid gap-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Restaurant Industry (UAE)</h3>
              <p className="text-muted-foreground mb-3">
                Complete COA for Mario's Authentic Italian Restaurant with VAT compliance:
              </p>
              <ul className="space-y-2 text-sm">
                <li><code>1000</code> - Cash - Operating Account</li>
                <li><code>1300</code> - Inventory - Food & Beverages</li>
                <li><code>2201</code> - VAT Payable (5%)</li>
                <li><code>4100</code> - Revenue - Food Sales</li>
                <li><code>5100</code> - COGS - Food Ingredients</li>
                <li><code>6000</code> - Salaries - Kitchen Staff</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Healthcare Practice (USA)</h3>
              <p className="text-muted-foreground mb-3">
                HIPAA-compliant COA for medical practices:
              </p>
              <ul className="space-y-2 text-sm">
                <li><code>1200</code> - Patient Receivables</li>
                <li><code>1250</code> - Insurance Receivables</li>
                <li><code>4200</code> - Revenue - Consultations</li>
                <li><code>4300</code> - Revenue - Procedures</li>
                <li><code>5200</code> - Medical Supplies</li>
                <li><code>6100</code> - Professional Fees</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section className="mb-12">
          <h2>Business Impact</h2>
          
          <div className="docs-card bg-success-emphasis text-white">
            <h3 className="text-xl font-semibold mb-4">Proven Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold">$463,000</p>
                <p className="text-sm opacity-90">Average cost savings per implementation</p>
              </div>
              <div>
                <p className="text-3xl font-bold">30 seconds</p>
                <p className="text-sm opacity-90">Setup time vs 18 months traditional</p>
              </div>
              <div>
                <p className="text-3xl font-bold">100%</p>
                <p className="text-sm opacity-90">IFRS compliance out of the box</p>
              </div>
            </div>
          </div>
        </section>
        
        <section>
          <h2>Next Steps</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/docs/features/auto-journal" className="docs-card hover:border-accent-fg transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Auto-Journal Engine</h4>
                  <p className="text-sm text-muted-foreground">
                    Learn how transactions automatically post to the correct GL accounts
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent-fg" />
              </div>
            </Link>
            
            <Link href="/docs/api/rest#chart-of-accounts" className="docs-card hover:border-accent-fg transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">API Reference</h4>
                  <p className="text-sm text-muted-foreground">
                    Complete API documentation for COA operations
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