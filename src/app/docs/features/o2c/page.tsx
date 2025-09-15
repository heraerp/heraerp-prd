'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState } from 'react'
import {
  ShoppingBag,
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
  CreditCard,
  Package,
  AlertCircle,
  Receipt
} from 'lucide-react'

export default function O2CDoc() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Order to Cash</h3>
          <a href="#overview" className="docs-nav-link" onClick={() => setActiveTab('overview')}>
            Overview
          </a>
          <a href="#features" className="docs-nav-link">
            Key Features
          </a>
          <a href="#order-management" className="docs-nav-link">
            Order Management
          </a>
          <a href="#invoicing" className="docs-nav-link">
            Automated Invoicing
          </a>
          <a href="#collections" className="docs-nav-link">
            Smart Collections
          </a>
          <a href="#implementation" className="docs-nav-link">
            Getting Started
          </a>
          <a href="#metrics" className="docs-nav-link">
            Success Metrics
          </a>
          <a href="#examples" className="docs-nav-link">
            Use Cases
          </a>
        </div>

        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Related Topics</h3>
          <Link href="/docs/features/fin" className="docs-nav-link">
            Financial Management
          </Link>
          <Link href="/docs/features/customer-portal" className="docs-nav-link">
            Customer Portal
          </Link>
          <Link href="/docs/features/credit-management" className="docs-nav-link">
            Credit Management
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
            <span>Order to Cash</span>
          </div>

          <h1>Order to Cash (O2C)</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Accelerate your revenue cycle from order capture to cash collection with intelligent
            automation
          </p>
        </div>

        <div className="docs-note docs-note-success mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Production Ready</strong>
              <p className="text-sm mt-1">
                Processing $500M+ in annual transactions with 65% faster collections and 92% invoice
                accuracy. Proven across B2B and B2C industries.
              </p>
            </div>
          </div>
        </div>

        <section id="overview" className="mb-12">
          <h2>Overview</h2>
          <p>
            HERA O2C transforms your revenue operations with automated order processing, intelligent
            invoicing, and proactive collections management. Every step from quote to cash is
            optimized for speed, accuracy, and customer satisfaction.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">Traditional Order Processing</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Manual order entry</li>
                <li>• 2-3 day invoicing delays</li>
                <li>• 45-60 day DSO</li>
                <li>• Limited payment options</li>
                <li>• Reactive collections</li>
              </ul>
            </div>

            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">HERA O2C</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Automated order capture
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Real-time invoicing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  25-30 day DSO
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Omnichannel payments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Predictive collections
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
                <ShoppingBag className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Intelligent Order Management</h3>
                  <p className="text-muted-foreground mb-3">
                    Capture orders from any channel with automatic validation, pricing, and
                    inventory allocation.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="docs-badge">Multi-Channel</span>
                    <span className="docs-badge">Credit Check</span>
                    <span className="docs-badge">ATP/CTP</span>
                    <span className="docs-badge">Dynamic Pricing</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="docs-card">
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Automated Invoicing</h3>
                  <p className="text-muted-foreground mb-3">
                    Generate and deliver invoices instantly with customizable templates and
                    automatic GL posting.
                  </p>
                  <pre className="text-xs bg-canvas-inset p-3 rounded overflow-x-auto">
                    {`// Invoice Generation Flow
Order Shipped → Invoice Created → Customer Notified → GL Posted
Total time: < 5 minutes`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="docs-card">
              <div className="flex items-start gap-4">
                <CreditCard className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Smart Collections</h3>
                  <p className="text-muted-foreground mb-3">
                    AI-powered collections with automated reminders, payment plans, and risk
                    scoring.
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Risk Score</p>
                      <p className="font-semibold">AI-Driven</p>
                    </div>
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Follow-ups</p>
                      <p className="font-semibold">Automated</p>
                    </div>
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Recovery</p>
                      <p className="font-semibold">+35%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="order-management" className="mb-12">
          <h2>Order Management Excellence</h2>

          <div className="docs-note docs-note-info mb-6">
            <strong>Omnichannel Order Capture:</strong> Accept orders from web, mobile, EDI, email,
            or phone with automatic consolidation and intelligent routing.
          </div>

          <div className="grid gap-4">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Order Processing Workflow</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent-emphasis text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Order Capture & Validation</p>
                    <p className="text-sm text-muted-foreground">
                      Credit check, inventory availability, pricing rules
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent-emphasis text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Fulfillment Orchestration</p>
                    <p className="text-sm text-muted-foreground">
                      Warehouse allocation, shipping optimization, tracking
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent-emphasis text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Revenue Recognition</p>
                    <p className="text-sm text-muted-foreground">
                      Automatic invoicing based on delivery confirmation
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Advanced Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Order Intelligence</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Duplicate order detection</li>
                    <li>• Fraud prevention</li>
                    <li>• Upsell recommendations</li>
                    <li>• Bundle optimization</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Customer Experience</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Real-time order tracking</li>
                    <li>• Proactive notifications</li>
                    <li>• Self-service portal</li>
                    <li>• Easy returns/exchanges</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="invoicing" className="mb-12">
          <h2>Automated Invoicing</h2>

          <div className="docs-card mb-6">
            <h3 className="text-lg font-semibold mb-3">Invoice Automation Engine</h3>
            <p className="text-muted-foreground mb-4">
              Generate accurate invoices instantly with intelligent data capture and validation:
            </p>

            <div className="grid gap-4">
              <div className="bg-canvas-inset p-4 rounded">
                <h4 className="font-medium mb-2">Invoice Types Supported</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <span>• Standard Invoice</span>
                  <span>• Pro Forma</span>
                  <span>• Credit Note</span>
                  <span>• Debit Note</span>
                  <span>• Recurring Invoice</span>
                  <span>• Milestone Billing</span>
                  <span>• Consolidated</span>
                  <span>• Time & Material</span>
                </div>
              </div>

              <div className="bg-canvas-inset p-4 rounded">
                <h4 className="font-medium mb-2">Delivery Channels</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-muted-foreground">PDF with payment link</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Portal</p>
                    <p className="text-xs text-muted-foreground">Customer self-service</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">EDI</p>
                    <p className="text-xs text-muted-foreground">B2B integration</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="docs-card">
            <h3 className="text-lg font-semibold mb-3">Tax Compliance</h3>
            <p className="text-muted-foreground mb-3">
              Built-in tax engines for global compliance:
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="docs-badge">US Sales Tax</span>
              <span className="docs-badge">VAT/GST</span>
              <span className="docs-badge">Withholding Tax</span>
              <span className="docs-badge">Digital Services Tax</span>
              <span className="docs-badge">Multi-Jurisdiction</span>
            </div>
          </div>
        </section>

        <section id="collections" className="mb-12">
          <h2>Smart Collections Management</h2>

          <div className="docs-card mb-6">
            <h3 className="text-lg font-semibold mb-3">AI-Powered Collections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Predictive Analytics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Payment probability scoring</span>
                    <span className="text-success-fg">95% accuracy</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Optimal contact timing</span>
                    <span className="text-success-fg">+40% response</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Channel preference</span>
                    <span className="text-success-fg">3x effectiveness</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Automation Features</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Graduated reminder campaigns</li>
                  <li>• Payment plan suggestions</li>
                  <li>• Dispute management</li>
                  <li>• Promise-to-pay tracking</li>
                  <li>• Escalation workflows</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="docs-card">
            <h3 className="text-lg font-semibold mb-3">Collection Strategies</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Days Past Due</th>
                  <th className="text-left py-2">Action</th>
                  <th className="text-left py-2">Channel</th>
                  <th className="text-left py-2">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">0-15 days</td>
                  <td className="py-2">Friendly reminder</td>
                  <td className="py-2">Email</td>
                  <td className="py-2">75%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">16-30 days</td>
                  <td className="py-2">Payment options</td>
                  <td className="py-2">Email + SMS</td>
                  <td className="py-2">60%</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">31-60 days</td>
                  <td className="py-2">Personal outreach</td>
                  <td className="py-2">Phone</td>
                  <td className="py-2">45%</td>
                </tr>
                <tr>
                  <td className="py-2">60+ days</td>
                  <td className="py-2">Escalation</td>
                  <td className="py-2">Account Manager</td>
                  <td className="py-2">30%</td>
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
              <li>✓ Import customer master data</li>
              <li>✓ Configure product catalog</li>
              <li>✓ Set up pricing rules</li>
              <li>✓ Define credit policies</li>
            </ul>
          </div>

          <h3 className="mb-4">Week 2: Process Setup</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Configure order workflows</li>
              <li>✓ Set up invoice templates</li>
              <li>✓ Define collection strategies</li>
              <li>✓ Test payment gateways</li>
            </ul>
          </div>

          <h3 className="mb-4">Week 3: Integration</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Connect sales channels</li>
              <li>✓ Integrate shipping providers</li>
              <li>✓ Set up customer portal</li>
              <li>✓ Test end-to-end flow</li>
            </ul>
          </div>

          <h3 className="mb-4">Week 4: Launch</h3>
          <div className="docs-card">
            <ul className="space-y-2">
              <li>✓ Train sales and CS teams</li>
              <li>✓ Migrate open orders</li>
              <li>✓ Go live with support</li>
              <li>✓ Monitor KPIs</li>
            </ul>
          </div>
        </section>

        <section id="metrics" className="mb-12">
          <h2>Success Metrics</h2>

          <div className="docs-card bg-success-emphasis text-white">
            <h3 className="text-xl font-semibold mb-4">Proven Results Across Industries</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-3xl font-bold">65%</p>
                <p className="text-sm opacity-90">Faster collections</p>
              </div>
              <div>
                <p className="text-3xl font-bold">92%</p>
                <p className="text-sm opacity-90">Invoice accuracy</p>
              </div>
              <div>
                <p className="text-3xl font-bold">$225K</p>
                <p className="text-sm opacity-90">Average annual savings</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Operational Improvements</h4>
              <ul className="space-y-2 text-sm">
                <li>• Order processing: 30 min → 2 min</li>
                <li>• Invoice delivery: 2 days → Real-time</li>
                <li>• DSO reduction: 55 days → 28 days</li>
                <li>• Customer inquiries: 70% self-service</li>
              </ul>
            </div>

            <div className="docs-card">
              <h4 className="font-semibold mb-3">Financial Impact</h4>
              <ul className="space-y-2 text-sm">
                <li>• 35% improvement in cash flow</li>
                <li>• 90% reduction in billing errors</li>
                <li>• 25% increase in on-time payments</li>
                <li>• 50% reduction in bad debt</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="examples" className="mb-12">
          <h2>Use Cases</h2>

          <div className="grid gap-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">B2B Wholesale Distributor</h3>
              <p className="text-muted-foreground mb-3">
                Food distributor transformed order-to-cash cycle:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Automated EDI order processing for 500+ customers</li>
                <li>• Dynamic pricing based on volume and contracts</li>
                <li>• Automated credit management and holds</li>
                <li>• Result: 40% reduction in DSO, $3M working capital improvement</li>
              </ul>
            </div>

            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">SaaS Company</h3>
              <p className="text-muted-foreground mb-3">
                Software company streamlined subscription billing:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Automated recurring billing for 10,000+ customers</li>
                <li>• Usage-based pricing with real-time metering</li>
                <li>• Dunning management for failed payments</li>
                <li>• Result: 95% collection rate, 80% reduction in churn</li>
              </ul>
            </div>

            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Professional Services Firm</h3>
              <p className="text-muted-foreground mb-3">
                Consulting firm optimized project billing:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Time and expense capture integration</li>
                <li>• Milestone-based invoicing</li>
                <li>• Multi-currency billing for global clients</li>
                <li>• Result: 15-day faster payments, 99% billing accuracy</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2>Next Steps</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/docs/features/customer-portal"
              className="docs-card hover:border-accent-fg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Customer Portal</h4>
                  <p className="text-sm text-muted-foreground">
                    Self-service portal for orders, invoices, and payments
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent-fg" />
              </div>
            </Link>

            <Link
              href="/docs/features/revenue-analytics"
              className="docs-card hover:border-accent-fg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Revenue Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Deep insights into sales performance and cash flow
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
                <strong>Ready to accelerate your revenue?</strong>
                <p className="text-sm mt-1">
                  HERA O2C can be implemented in just 4 weeks with immediate impact on cash flow.
                  <Link href="/contact" className="underline">
                    Contact us
                  </Link>{' '}
                  to see how we can transform your revenue cycle.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
