'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  Globe,
  Shield,
  FileText,
  CheckCircle2,
  Building2,
  TrendingUp,
  Database,
  BarChart3,
  ArrowRight,
  Award,
  Briefcase,
  Calculator
} from 'lucide-react'

export default function IFRSComplianceDoc() {
  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">IFRS Compliance</h3>
          <a href="#overview" className="docs-nav-link">
            Overview
          </a>
          <a href="#standards" className="docs-nav-link">
            Standards Coverage
          </a>
          <a href="#implementation" className="docs-nav-link">
            Implementation
          </a>
          <a href="#field-mapping" className="docs-nav-link">
            Field Mapping
          </a>
          <a href="#reporting" className="docs-nav-link">
            Financial Reporting
          </a>
          <a href="#consolidation" className="docs-nav-link">
            Consolidation
          </a>
          <a href="#audit" className="docs-nav-link">
            Audit Support
          </a>
        </div>

        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Related Topics</h3>
          <Link href="/docs/features/chart-of-accounts" className="docs-nav-link">
            Chart of Accounts
          </Link>
          <Link href="/docs/features/auto-journal" className="docs-nav-link">
            Auto-Journal Engine
          </Link>
          <Link href="/docs/features/budgeting" className="docs-nav-link">
            Budgeting System
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
            <span>IFRS Compliance</span>
          </div>

          <h1>IFRS Compliance</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Built-in International Financial Reporting Standards compliance for global businesses
          </p>
        </div>

        <div className="docs-note docs-note-success mb-8">
          <div className="flex items-start gap-3">
            <Award className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Industry First</strong>
              <p className="text-sm mt-1">
                HERA is the first ERP system with built-in IFRS compliance by default. Every Chart
                of Accounts generated includes complete IFRS lineage automatically - no additional
                cost or configuration.
              </p>
            </div>
          </div>
        </div>

        <section id="overview" className="mb-12">
          <h2>Overview</h2>
          <p className="mb-6">
            HERA's IFRS compliance system ensures that every financial transaction and report meets
            international standards. With automatic classification, statement mapping, and
            consolidation support, HERA delivers enterprise-grade compliance without complexity.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="docs-card">
              <div className="flex items-center gap-3 mb-3">
                <Globe className="w-6 h-6 text-accent-fg" />
                <h3 className="font-semibold">Global Standards</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Full compliance with IFRS as issued by IASB, covering all major standards and
                interpretations
              </p>
            </div>

            <div className="docs-card">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-accent-fg" />
                <h3 className="font-semibold">Automatic Compliance</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Every account created includes mandatory IFRS fields with intelligent default
                mappings
              </p>
            </div>

            <div className="docs-card">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-6 h-6 text-accent-fg" />
                <h3 className="font-semibold">Complete Reporting</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Generate IFRS-compliant financial statements with proper classifications and
                disclosures
              </p>
            </div>
          </div>
        </section>

        <section id="standards" className="mb-12">
          <h2>Standards Coverage</h2>
          <p className="mb-6">
            HERA supports all major IFRS standards with built-in classification and measurement
            rules:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Core Standards</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg flex-shrink-0" />
                  <span>IAS 1 - Presentation of Financial Statements</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg flex-shrink-0" />
                  <span>IAS 7 - Statement of Cash Flows</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg flex-shrink-0" />
                  <span>IAS 8 - Accounting Policies & Estimates</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg flex-shrink-0" />
                  <span>IAS 16 - Property, Plant and Equipment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg flex-shrink-0" />
                  <span>IAS 38 - Intangible Assets</span>
                </li>
              </ul>
            </div>

            <div className="docs-card">
              <h4 className="font-semibold mb-3">Advanced Standards</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg flex-shrink-0" />
                  <span>IFRS 9 - Financial Instruments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg flex-shrink-0" />
                  <span>IFRS 15 - Revenue from Contracts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg flex-shrink-0" />
                  <span>IFRS 16 - Leases</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg flex-shrink-0" />
                  <span>IFRS 10 - Consolidated Statements</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg flex-shrink-0" />
                  <span>IFRS 3 - Business Combinations</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="field-mapping" className="mb-12">
          <h2>IFRS Field Structure</h2>
          <p className="mb-6">
            Every GL account in HERA includes 11 mandatory IFRS fields for complete compliance:
          </p>

          <div className="docs-card mb-6">
            <pre className="text-sm bg-canvas-inset p-4 rounded overflow-x-auto">
              {`{
  // Classification Fields
  "ifrs_classification": "Assets",              // Primary category
  "ifrs_sub_classification": "Current Assets",  // Secondary category
  "ifrs_line_item": "Cash and cash equivalents", // Statement line item
  
  // Statement Mapping
  "statement_type": "SFP",                      // SFP, SPL, SCE, SCF, NOTES
  "statement_section": "Current Assets",        // Section on statement
  "statement_order": 110,                       // Display order
  
  // Hierarchy & Consolidation
  "parent_account_id": "uuid-of-parent",        // Parent for roll-up
  "account_level": 3,                           // 1-5 hierarchy level
  "is_leaf_account": true,                      // Can post transactions
  
  // Measurement & Recognition
  "measurement_basis": "Historical Cost",       // Fair value, amortized cost
  "consolidation_method": "Full"                // Full, equity, none
}`}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Classification Hierarchy</h4>
              <div className="space-y-2 text-sm">
                <div className="pl-0">Level 1: Assets</div>
                <div className="pl-4">Level 2: Current Assets</div>
                <div className="pl-8">Level 3: Cash and cash equivalents</div>
                <div className="pl-12">Level 4: Operating bank accounts</div>
                <div className="pl-16">Level 5: Specific bank account</div>
              </div>
            </div>

            <div className="docs-card">
              <h4 className="font-semibold mb-3">Statement Types</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>SFP</strong> - Statement of Financial Position
                </li>
                <li>
                  <strong>SPL</strong> - Statement of Profit or Loss
                </li>
                <li>
                  <strong>SCE</strong> - Statement of Changes in Equity
                </li>
                <li>
                  <strong>SCF</strong> - Statement of Cash Flows
                </li>
                <li>
                  <strong>NOTES</strong> - Notes to Financial Statements
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section id="implementation" className="mb-12">
          <h2>Implementation Examples</h2>

          <div className="space-y-6">
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Creating IFRS-Compliant Account</h4>
              <pre className="text-sm bg-canvas-inset p-3 rounded overflow-x-auto">
                {`// Create account with IFRS fields
const account = await universalApi.createEntity({
  entity_type: 'gl_account',
  entity_code: '1510',
  entity_name: 'Trade Receivables',
  smart_code: 'HERA.FIN.GL.ASSET.AR.v1'
})

// Add IFRS properties
await universalApi.bulkSetDynamicFields(account.id, {
  ifrs_classification: 'Assets',
  ifrs_sub_classification: 'Current Assets', 
  ifrs_line_item: 'Trade and other receivables',
  statement_type: 'SFP',
  statement_section: 'Current Assets',
  statement_order: 130,
  measurement_basis: 'Amortized Cost',
  expected_credit_loss_rate: 0.02
})`}
              </pre>
            </div>

            <div className="docs-card">
              <h4 className="font-semibold mb-3">Generating IFRS Statements</h4>
              <pre className="text-sm bg-canvas-inset p-3 rounded overflow-x-auto">
                {`// Generate Statement of Financial Position
const sofp = await universalApi.generateIFRSStatement({
  organizationId: 'org-123',
  statementType: 'SFP',
  periodEnd: '2024-12-31',
  comparativePeriod: '2023-12-31',
  consolidationScope: 'standalone'
})

// Result includes proper IFRS formatting
{
  "statement": "Statement of Financial Position",
  "sections": {
    "assets": {
      "non_current": [...],
      "current": [
        {
          "line_item": "Cash and cash equivalents",
          "current_year": 125000,
          "prior_year": 98000,
          "notes_reference": "Note 8"
        }
      ]
    }
  }
}`}
              </pre>
            </div>
          </div>
        </section>

        <section id="reporting" className="mb-12">
          <h2>Financial Reporting</h2>

          <div className="docs-note docs-note-info mb-6">
            HERA automatically generates all required IFRS financial statements with proper
            formatting, comparatives, and note references.
          </div>

          <div className="grid gap-4">
            <div className="docs-card">
              <div className="flex items-start gap-4">
                <BarChart3 className="w-6 h-6 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2">Primary Statements</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Statement of Financial Position (Balance Sheet)</li>
                    <li>• Statement of Profit or Loss and OCI</li>
                    <li>• Statement of Changes in Equity</li>
                    <li>• Statement of Cash Flows (Direct or Indirect)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="docs-card">
              <div className="flex items-start gap-4">
                <FileText className="w-6 h-6 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold mb-2">Disclosure Notes</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Accounting policies and estimates</li>
                    <li>• Segment reporting (IFRS 8)</li>
                    <li>• Financial instruments disclosures</li>
                    <li>• Related party transactions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="consolidation" className="mb-12">
          <h2>Group Consolidation</h2>
          <p className="mb-6">
            HERA supports complex group structures with automatic consolidation and elimination
            entries:
          </p>

          <div className="docs-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Consolidation Methods</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-accent-fg" />
                    <span>
                      <strong>Full Consolidation</strong> - Subsidiaries (&gt;50%)
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-attention-fg" />
                    <span>
                      <strong>Equity Method</strong> - Associates (20-50%)
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-success-fg" />
                    <span>
                      <strong>Fair Value</strong> - Investments (&lt;20%)
                    </span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Automatic Eliminations</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Intercompany transactions</li>
                  <li>• Unrealized profits</li>
                  <li>• Dividend distributions</li>
                  <li>• Investment balances</li>
                  <li>• Non-controlling interests</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="audit" className="mb-12">
          <h2>Audit Support</h2>
          <p className="mb-6">
            Complete audit trail and documentation support for IFRS compliance verification:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="docs-card text-center">
              <Shield className="w-8 h-8 text-accent-fg mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Audit Trail</h4>
              <p className="text-sm text-muted-foreground">
                Every transaction tracked with user, timestamp, and changes
              </p>
            </div>

            <div className="docs-card text-center">
              <Database className="w-8 h-8 text-success-fg mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Data Integrity</h4>
              <p className="text-sm text-muted-foreground">
                Immutable transaction history with version control
              </p>
            </div>

            <div className="docs-card text-center">
              <FileText className="w-8 h-8 text-attention-fg mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Documentation</h4>
              <p className="text-sm text-muted-foreground">
                Automatic working papers and reconciliations
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2>Industry Recognition</h2>
          <div className="docs-card bg-success-emphasis text-foreground">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold mb-2">100%</p>
                <p className="text-sm opacity-90">IFRS compliance rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold mb-2">Zero</p>
                <p className="text-sm opacity-90">Additional configuration needed</p>
              </div>
              <div>
                <p className="text-3xl font-bold mb-2">132</p>
                <p className="text-sm opacity-90">Pre-configured templates</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2>Next Steps</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/docs/features/chart-of-accounts"
              className="docs-card hover:border-accent-fg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Chart of Accounts</h4>
                  <p className="text-sm text-muted-foreground">
                    See how IFRS compliance is built into every COA
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent-fg" />
              </div>
            </Link>

            <Link
              href="/showcase/financial"
              className="docs-card hover:border-accent-fg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Live Demo</h4>
                  <p className="text-sm text-muted-foreground">
                    Experience IFRS reporting in action
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
