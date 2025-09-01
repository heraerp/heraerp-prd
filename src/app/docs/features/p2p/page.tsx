'use client'

import Link from 'next/link'
import { useState } from 'react'
import { 
  ShoppingCart, 
  FileText, 
  CheckCircle2,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
  Package,
  CreditCard,
  AlertCircle
} from 'lucide-react'

export default function P2PDoc() {
  const [activeTab, setActiveTab] = useState('overview')
  
  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Procure to Pay</h3>
          <a href="#overview" className="docs-nav-link" onClick={() => setActiveTab('overview')}>Overview</a>
          <a href="#features" className="docs-nav-link">Key Features</a>
          <a href="#workflow" className="docs-nav-link">Purchase Workflow</a>
          <a href="#automation" className="docs-nav-link">Automation</a>
          <a href="#implementation" className="docs-nav-link">Getting Started</a>
          <a href="#metrics" className="docs-nav-link">Success Metrics</a>
          <a href="#examples" className="docs-nav-link">Use Cases</a>
        </div>
        
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Related Topics</h3>
          <Link href="/docs/features/fin" className="docs-nav-link">Financial Management</Link>
          <Link href="/docs/features/vendor-portal" className="docs-nav-link">Vendor Portal</Link>
          <Link href="/docs/features/approvals" className="docs-nav-link">Approval Workflows</Link>
        </div>
      </nav>
      
      <main className="docs-main">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/docs" className="hover:text-accent-fg">Docs</Link>
            <span>/</span>
            <Link href="/docs/features" className="hover:text-accent-fg">Features</Link>
            <span>/</span>
            <span>Procure to Pay</span>
          </div>
          
          <h1>Procure to Pay (P2P)</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Streamline your entire purchasing process from requisition to payment with intelligent automation
          </p>
        </div>
        
        <div className="docs-note docs-note-success mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Production Ready</strong>
              <p className="text-sm mt-1">
                Processing over 10,000+ purchase orders monthly with 75% faster cycle times and $340K average annual savings.
              </p>
            </div>
          </div>
        </div>
        
        <section id="overview" className="mb-12">
          <h2>Overview</h2>
          <p>
            HERA P2P transforms your procurement operations with end-to-end automation, intelligent approvals, 
            and real-time visibility. From purchase requisitions to vendor payments, every step is optimized 
            for speed, accuracy, and control.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">Traditional Procurement</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 5-10 day approval cycles</li>
                <li>• Manual PO creation</li>
                <li>• Paper-based processes</li>
                <li>• Lost invoices and payments</li>
                <li>• No spend visibility</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">HERA P2P</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Same-day approvals
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Automated PO generation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  100% digital workflow
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  3-way match automation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Real-time analytics
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
                <ShoppingCart className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Smart Purchase Requisitions</h3>
                  <p className="text-muted-foreground mb-3">
                    Create requisitions in seconds with intelligent item suggestions, budget checking, and automatic routing.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="docs-badge">Catalog Management</span>
                    <span className="docs-badge">Budget Validation</span>
                    <span className="docs-badge">Approval Routing</span>
                    <span className="docs-badge">Mobile Access</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Automated Purchase Orders</h3>
                  <p className="text-muted-foreground mb-3">
                    Convert approved requisitions to POs instantly with vendor selection, price negotiation, and terms management.
                  </p>
                  <pre className="text-xs bg-canvas-inset p-3 rounded overflow-x-auto">
{`// Automatic PO Generation
Requisition approved → PO created → Vendor notified
Total time: < 2 minutes`}</pre>
                </div>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <CreditCard className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">3-Way Match & Payment</h3>
                  <p className="text-muted-foreground mb-3">
                    Automatically match POs, receipts, and invoices. Process payments with full audit trail and GL posting.
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">PO Amount</p>
                      <p className="font-semibold">$5,000</p>
                    </div>
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Receipt</p>
                      <p className="font-semibold">✓ Match</p>
                    </div>
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Invoice</p>
                      <p className="font-semibold">✓ Match</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section id="workflow" className="mb-12">
          <h2>Purchase Workflow</h2>
          
          <div className="docs-note docs-note-info mb-6">
            <strong>End-to-End Automation:</strong> Every step from requisition to payment is automated, 
            reducing manual work by 85% while improving accuracy and control.
          </div>
          
          <div className="space-y-4">
            <div className="docs-card">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-emphasis text-white rounded-full flex items-center justify-center font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Create Requisition</h4>
                  <p className="text-sm text-muted-foreground">
                    Users submit purchase requests with automatic budget validation and approval routing
                  </p>
                </div>
                <span className="text-xs bg-success-subtle text-success-fg px-2 py-1 rounded">2 min</span>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-emphasis text-white rounded-full flex items-center justify-center font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Approval Workflow</h4>
                  <p className="text-sm text-muted-foreground">
                    Multi-level approvals based on amount, category, and department with mobile notifications
                  </p>
                </div>
                <span className="text-xs bg-success-subtle text-success-fg px-2 py-1 rounded">< 1 day</span>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-emphasis text-white rounded-full flex items-center justify-center font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Generate PO</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatic PO creation with vendor selection, terms, and delivery instructions
                  </p>
                </div>
                <span className="text-xs bg-success-subtle text-success-fg px-2 py-1 rounded">Instant</span>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-emphasis text-white rounded-full flex items-center justify-center font-semibold">
                  4
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Receive & Match</h4>
                  <p className="text-sm text-muted-foreground">
                    Record receipts and automatically match with PO and invoice for payment approval
                  </p>
                </div>
                <span className="text-xs bg-success-subtle text-success-fg px-2 py-1 rounded">Automated</span>
              </div>
            </div>
            
            <div className="docs-card">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-accent-emphasis text-white rounded-full flex items-center justify-center font-semibold">
                  5
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Process Payment</h4>
                  <p className="text-sm text-muted-foreground">
                    Schedule payments with automatic GL posting and vendor notification
                  </p>
                </div>
                <span className="text-xs bg-success-subtle text-success-fg px-2 py-1 rounded">On schedule</span>
              </div>
            </div>
          </div>
        </section>
        
        <section id="automation" className="mb-12">
          <h2>Intelligent Automation</h2>
          
          <div className="grid gap-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Approval Matrix</h3>
              <p className="text-muted-foreground mb-3">
                Dynamic approval routing based on purchase amount, category, and organizational hierarchy:
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Amount Range</th>
                    <th className="text-left py-2">Required Approvals</th>
                    <th className="text-left py-2">SLA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2">$0 - $1,000</td>
                    <td className="py-2">Direct Manager</td>
                    <td className="py-2">2 hours</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">$1,001 - $10,000</td>
                    <td className="py-2">Manager + Department Head</td>
                    <td className="py-2">4 hours</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2">$10,001 - $50,000</td>
                    <td className="py-2">Department Head + CFO</td>
                    <td className="py-2">1 day</td>
                  </tr>
                  <tr>
                    <td className="py-2">$50,001+</td>
                    <td className="py-2">CFO + CEO</td>
                    <td className="py-2">2 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Smart Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Purchase Intelligence</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Duplicate PO detection</li>
                    <li>• Price variance alerts</li>
                    <li>• Vendor performance scoring</li>
                    <li>• Budget impact analysis</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Process Optimization</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Bulk PO processing</li>
                    <li>• Recurring purchase automation</li>
                    <li>• Contract compliance checking</li>
                    <li>• Early payment discounts</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        <section id="implementation" className="mb-12">
          <h2>Getting Started</h2>
          
          <h3 className="mb-4">Week 1: Foundation</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Import vendor master data</li>
              <li>✓ Configure approval matrix</li>
              <li>✓ Set up product catalogs</li>
              <li>✓ Define GL account mappings</li>
            </ul>
          </div>
          
          <h3 className="mb-4">Week 2: Process Setup</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Create purchase categories</li>
              <li>✓ Configure approval workflows</li>
              <li>✓ Set up vendor portals</li>
              <li>✓ Test end-to-end flow</li>
            </ul>
          </div>
          
          <h3 className="mb-4">Week 3: Training & Launch</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Train procurement team</li>
              <li>✓ Onboard department users</li>
              <li>✓ Run pilot transactions</li>
              <li>✓ Go live with support</li>
            </ul>
          </div>
          
          <h3 className="mb-4">Week 4: Optimization</h3>
          <div className="docs-card">
            <ul className="space-y-2">
              <li>✓ Review analytics and KPIs</li>
              <li>✓ Fine-tune approval rules</li>
              <li>✓ Expand to all departments</li>
              <li>✓ Activate advanced features</li>
            </ul>
          </div>
        </section>
        
        <section id="metrics" className="mb-12">
          <h2>Success Metrics</h2>
          
          <div className="docs-card bg-success-emphasis text-white">
            <h3 className="text-xl font-semibold mb-4">Proven Results Across Industries</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold">75%</p>
                <p className="text-sm opacity-90">Faster purchase cycle times</p>
              </div>
              <div>
                <p className="text-3xl font-bold">$340K</p>
                <p className="text-sm opacity-90">Average annual savings</p>
              </div>
              <div>
                <p className="text-3xl font-bold">92%</p>
                <p className="text-sm opacity-90">First-time match rate</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Efficiency Gains</h4>
              <ul className="space-y-2 text-sm">
                <li>• PO creation time: 15 min → 2 min</li>
                <li>• Approval cycle: 5 days → 4 hours</li>
                <li>• Invoice processing: 3 days → Same day</li>
                <li>• Month-end close: 5 days → 1 day</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Cost Savings</h4>
              <ul className="space-y-2 text-sm">
                <li>• 8-15% reduction in procurement costs</li>
                <li>• 2-3% early payment discount capture</li>
                <li>• 90% reduction in processing errors</li>
                <li>• 60% reduction in maverick spending</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section id="examples" className="mb-12">
          <h2>Use Cases</h2>
          
          <div className="grid gap-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Restaurant Chain</h3>
              <p className="text-muted-foreground mb-3">
                Mario's Restaurant Group streamlined purchasing across 15 locations:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Centralized vendor management for 200+ suppliers</li>
                <li>• Automated weekly food & beverage orders</li>
                <li>• Real-time inventory integration</li>
                <li>• Result: 35% reduction in food costs, 80% faster ordering</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Healthcare System</h3>
              <p className="text-muted-foreground mb-3">
                Regional hospital network transformed medical supply procurement:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Managed 10,000+ SKUs across departments</li>
                <li>• Automated reorder points for critical supplies</li>
                <li>• Contract price enforcement</li>
                <li>• Result: $2.3M annual savings, zero stockouts</li>
              </ul>
            </div>
            
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Manufacturing Company</h3>
              <p className="text-muted-foreground mb-3">
                Global manufacturer optimized raw material purchasing:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Multi-currency vendor management</li>
                <li>• Automated RFQ process for high-value items</li>
                <li>• JIT delivery coordination</li>
                <li>• Result: 12% material cost reduction, 95% on-time delivery</li>
              </ul>
            </div>
          </div>
        </section>
        
        <section>
          <h2>Next Steps</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/docs/features/vendor-portal" className="docs-card hover:border-accent-fg transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Vendor Portal</h4>
                  <p className="text-sm text-muted-foreground">
                    Enable vendors to manage catalogs and invoices directly
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent-fg" />
              </div>
            </Link>
            
            <Link href="/docs/features/analytics" className="docs-card hover:border-accent-fg transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Procurement Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Deep insights into spending patterns and savings opportunities
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
                <strong>Ready to transform your procurement?</strong>
                <p className="text-sm mt-1">
                  HERA P2P can be implemented in just 4 weeks with immediate ROI. 
                  <Link href="/contact" className="underline">Contact us</Link> to see a demo tailored to your industry.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}