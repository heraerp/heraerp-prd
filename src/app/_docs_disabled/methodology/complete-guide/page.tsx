// Force dynamic rendering
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import {
  Download,
  BookOpen,
  FileText,
  Zap,
  Target,
  Code2,
  DollarSign,
  Clock,
  TrendingDown,
  CheckCircle,
  Package,
  ArrowRight,
  ExternalLink
} from 'lucide-react'

export default function CompleteGuidePage() {
  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Methodology</h3>
          <Link href="/docs/methodology" className="docs-nav-link">
            Overview
          </Link>
          <Link href="/docs/methodology/detailed-flow" className="docs-nav-link">
            Detailed Flow
          </Link>
          <Link href="/docs/methodology/complete-guide" className="docs-nav-link active">
            Complete Guide
          </Link>
        </div>

        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Guide Contents</h3>
          <a href="#executive-summary" className="docs-nav-link">
            Executive Summary
          </a>
          <a href="#implementation-phases" className="docs-nav-link">
            Implementation Phases
          </a>
          <a href="#technical-architecture" className="docs-nav-link">
            Technical Architecture
          </a>
          <a href="#success-metrics" className="docs-nav-link">
            Success Metrics
          </a>
          <a href="#code-examples" className="docs-nav-link">
            Code Examples
          </a>
          <a href="#roi-calculator" className="docs-nav-link">
            ROI Calculator
          </a>
        </div>

        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Download</h3>
          <a
            href="/HERA-IMPLEMENTATION-METHODOLOGY-BUNDLE.md"
            download
            className="docs-nav-link flex items-center gap-2 text-accent-fg hover:text-accent-fg hover:bg-canvas-subtle"
          >
            <Download className="h-4 w-4" />
            Download Bundle (MD)
          </a>
        </div>
      </nav>

      <main className="docs-main">
        <div className="max-w-4xl">
          <h1 id="complete-guide">Complete Implementation Guide</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Everything you need to implement HERA ERP in 21 days with MCP orchestration
          </p>

          {/* Download Section */}
          <div className="border border-border dark:border-border rounded-lg p-6 mb-8 bg-muted dark:bg-muted/50">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2 text-gray-100 dark:text-foreground">
                  HERA Implementation Methodology Bundle
                </h3>
                <p className="text-muted-foreground dark:text-gray-300 mb-4">
                  Comprehensive guide including diagrams, code examples, ROI calculator, and
                  step-by-step instructions.
                </p>
                <div className="flex gap-4">
                  <a
                    href="/HERA-IMPLEMENTATION-METHODOLOGY-BUNDLE.md"
                    download
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-foreground rounded-md transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download Bundle
                  </a>
                  <a
                    href="/HERA-IMPLEMENTATION-METHODOLOGY-BUNDLE.md"
                    target="_blank"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-border dark:border-border rounded-md hover:bg-muted dark:hover:bg-muted-foreground/10 transition-colors text-gray-700 dark:text-gray-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View in Browser
                  </a>
                </div>
              </div>
              <FileText className="h-12 w-12 text-muted-foreground dark:text-muted-foreground" />
            </div>
          </div>

          {/* Key Metrics */}
          <h2
            id="key-metrics"
            className="text-2xl font-semibold text-gray-100 dark:text-foreground"
          >
            Key Implementation Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="border border-border dark:border-border rounded-lg p-6 bg-background dark:bg-muted">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-primary dark:text-blue-400" />
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Time to Deploy
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-100 dark:text-foreground">21 Days</div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                vs 6-18 months
              </div>
            </div>

            <div className="border border-border dark:border-border rounded-lg p-6 bg-background dark:bg-muted">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Cost Reduction
                </span>
              </div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">90%</div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                $50-100K total
              </div>
            </div>

            <div className="border border-border dark:border-border rounded-lg p-6 bg-background dark:bg-muted">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Success Rate
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-100 dark:text-foreground">95%+</div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                vs 60% average
              </div>
            </div>

            <div className="border border-border dark:border-border rounded-lg p-6 bg-background dark:bg-muted">
              <div className="flex items-center gap-3 mb-2">
                <Package className="h-5 w-5 text-primary dark:text-blue-400" />
                <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                  Module Reuse
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-100 dark:text-foreground">100%</div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                Zero custom dev
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <h2
            id="executive-summary"
            className="text-2xl font-semibold text-gray-100 dark:text-foreground mb-4"
          >
            Executive Summary
          </h2>
          <div className="prose prose-gray dark:prose-invert max-w-none mb-12">
            <p>
              HERA revolutionizes ERP implementation with a{' '}
              <strong>21-day journey from requirements to production</strong>, achieving:
            </p>
            <ul>
              <li>
                <strong>20x faster delivery</strong> than traditional ERP (21 days vs 6-18 months)
              </li>
              <li>
                <strong>90% cost reduction</strong> ($50-100K vs $500K-5M)
              </li>
              <li>
                <strong>Flexible architecture</strong> - Handles all business complexity
              </li>
              <li>
                <strong>100% module reuse</strong> - Toggle existing DNA, don't rebuild
              </li>
              <li>
                <strong>95%+ success rate</strong> vs 60% industry average
              </li>
            </ul>
          </div>

          {/* Bundle Contents */}
          <h2
            id="bundle-contents"
            className="text-2xl font-semibold text-gray-100 dark:text-foreground mb-6"
          >
            What's in the Bundle
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="border border-border dark:border-border rounded-lg p-6 bg-background dark:bg-muted">
              <div className="flex items-center gap-3 mb-4">
                <Target className="h-6 w-6 text-primary dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-100 dark:text-foreground">
                  Business Content
                </h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground dark:text-gray-300">
                  <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                  Executive summary with ROI metrics
                </li>
                <li className="flex items-center gap-2 text-muted-foreground dark:text-gray-300">
                  <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                  21-day implementation timeline
                </li>
                <li className="flex items-center gap-2 text-muted-foreground dark:text-gray-300">
                  <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                  Success stories and case studies
                </li>
                <li className="flex items-center gap-2 text-muted-foreground dark:text-gray-300">
                  <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                  5-year TCO comparison
                </li>
              </ul>
            </div>

            <div className="border border-border dark:border-border rounded-lg p-6 bg-background dark:bg-muted">
              <div className="flex items-center gap-3 mb-4">
                <Code2 className="h-6 w-6 text-primary dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-100 dark:text-foreground">
                  Technical Content
                </h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground dark:text-gray-300">
                  <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                  MCP orchestration architecture
                </li>
                <li className="flex items-center gap-2 text-muted-foreground dark:text-gray-300">
                  <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                  Complete flow & swimlane diagrams
                </li>
                <li className="flex items-center gap-2 text-muted-foreground dark:text-gray-300">
                  <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                  Code examples for each phase
                </li>
                <li className="flex items-center gap-2 text-muted-foreground dark:text-gray-300">
                  <ArrowRight className="h-4 w-4 text-muted-foreground dark:text-muted-foreground" />
                  Deployment guide & scripts
                </li>
              </ul>
            </div>
          </div>

          {/* Implementation Phases */}
          <h2
            id="implementation-phases"
            className="text-2xl font-semibold text-gray-100 dark:text-foreground mb-6"
          >
            6-Phase Implementation Journey
          </h2>
          <div className="space-y-4 mb-12">
            {[
              {
                phase: 1,
                name: 'Requirements Gathering',
                days: '1-3',
                description: 'Conversational intake via MCP, auto-mapping to universal structure'
              },
              {
                phase: 2,
                name: 'Module Configuration',
                days: '4-5',
                description:
                  'Toggle module DNA (Finance, Purchasing, P2P), configure business rules'
              },
              {
                phase: 3,
                name: 'Sandbox Testing',
                days: '6-10',
                description: 'Client playground at client.heraerp.com/sandbox, real-time feedback'
              },
              {
                phase: 4,
                name: 'Data Migration',
                days: '11-15',
                description: 'ETL from legacy systems with guardrail validation'
              },
              {
                phase: 5,
                name: 'User Acceptance Testing',
                days: '16-20',
                description: 'Auto-generated test cases, formal sign-off capture'
              },
              {
                phase: 6,
                name: 'Production Go-Live',
                days: '21',
                description: 'Cutover with CI guardrails, activate at client.heraerp.com/{org}'
              }
            ].map(item => (
              <div
                key={item.phase}
                className="border border-border dark:border-border rounded-lg p-6 bg-background dark:bg-muted"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-500 text-foreground text-sm font-semibold">
                        {item.phase}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-100 dark:text-foreground">
                        {item.name}
                      </h3>
                      <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                        Days {item.days}
                      </span>
                    </div>
                    <p className="text-muted-foreground dark:text-gray-300 ml-12">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Architecture */}
          <h2
            id="technical-architecture"
            className="text-2xl font-semibold text-gray-100 dark:text-foreground mb-6"
          >
            Technical Architecture
          </h2>
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-gray-100 dark:text-foreground mb-4">
              Universal Foundation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {[
                { name: 'Organizations', desc: 'Multi-tenant isolation' },
                { name: 'Entities', desc: 'All business objects' },
                { name: 'Dynamic Data', desc: 'Flexible custom fields' },
                { name: 'Relationships', desc: 'Entity connections' },
                { name: 'Transactions', desc: 'All business events' },
                { name: 'Transaction Details', desc: 'Line item information' }
              ].map(table => (
                <div
                  key={table.name}
                  className="border border-border dark:border-border rounded-lg p-4 bg-background dark:bg-muted"
                >
                  <code className="text-sm font-mono text-primary dark:text-blue-400">
                    {table.name}
                  </code>
                  <p className="text-sm text-muted-foreground dark:text-gray-300 mt-1">
                    {table.desc}
                  </p>
                </div>
              ))}
            </div>

            <h3 className="text-lg font-semibold text-gray-100 dark:text-foreground mb-4">
              Intelligent Classification
            </h3>
            <div className="border border-border dark:border-border rounded-lg p-4 bg-muted dark:bg-muted mb-8">
              <div className="text-sm mb-4 text-gray-100 dark:text-foreground">
                Industry-specific • Module-aware • Type-driven • Version-controlled
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong className="text-gray-100 dark:text-foreground">Examples:</strong>
                  <ul className="mt-2 space-y-1 text-xs text-gray-700 dark:text-gray-300">
                    <li>Manufacturing Purchase Orders</li>
                    <li>Retail Tax Invoicing</li>
                    <li>Project UAT Sign-offs</li>
                  </ul>
                </div>
                <div>
                  <strong className="text-gray-100 dark:text-foreground">Benefits:</strong>
                  <ul className="mt-2 space-y-1 text-gray-700 dark:text-gray-300">
                    <li>• Intelligent business context</li>
                    <li>• Version control built-in</li>
                    <li>• Industry-specific routing</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Code Examples */}
          <h2
            id="code-examples"
            className="text-2xl font-semibold text-gray-100 dark:text-foreground mb-6"
          >
            Implementation Code Examples
          </h2>
          <div className="space-y-6 mb-12">
            <div>
              <h3 className="text-md font-semibold text-gray-100 dark:text-foreground mb-2">
                Phase 1: Requirement Capture
              </h3>
              <pre className="language-typescript bg-background dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                <code>{`const requirement = {
  type: 'project_requirement',
  name: 'P2P Approval Workflow',
  category: 'P2P_APPROVAL',
  status: 'DRAFT',
  custom_data: {
    approval_limits: { 
      level1: 1000, 
      level2: 5000, 
      cfo: 10000 
    },
    business_rules: { 
      three_way_match: true, 
      tolerance: 0.02 
    }
  }
}`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-md font-semibold text-gray-100 dark:text-foreground mb-2">
                Phase 5: UAT Sign-off
              </h3>
              <pre className="language-typescript bg-background dark:bg-gray-950 p-4 rounded-lg overflow-x-auto">
                <code>{`const signoff = {
  type: 'project_milestone',
  category: 'UAT_SIGNOFF',
  approved_by: 'cfo_user_id',
  approval_date: '2025-09-15',
  metadata: {
    test_cases_passed: 147,
    test_cases_failed: 0,
    defects_resolved: 3,
    sign_off_status: 'APPROVED'
  }
}`}</code>
              </pre>
            </div>
          </div>

          {/* ROI Calculator */}
          <h2
            id="roi-calculator"
            className="text-2xl font-semibold text-gray-100 dark:text-foreground mb-6"
          >
            ROI Calculator
          </h2>
          <div className="border border-border dark:border-border rounded-lg p-6 mb-12 bg-background dark:bg-muted">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
                  Traditional ERP
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground dark:text-muted-foreground">
                      Implementation:
                    </dt>
                    <dd className="font-mono text-gray-100 dark:text-foreground">$2,000,000</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground dark:text-muted-foreground">Timeline:</dt>
                    <dd className="font-mono text-gray-100 dark:text-foreground">12 months</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground dark:text-muted-foreground">
                      Customization:
                    </dt>
                    <dd className="font-mono text-gray-100 dark:text-foreground">$500,000</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground dark:text-muted-foreground">
                      Annual Maintenance:
                    </dt>
                    <dd className="font-mono text-gray-100 dark:text-foreground">$400,000</dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border dark:border-border">
                    <dt className="font-semibold text-gray-100 dark:text-foreground">
                      5-Year TCO:
                    </dt>
                    <dd className="font-mono font-semibold text-gray-100 dark:text-foreground">
                      $4,500,000
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 text-green-600 dark:text-green-400">
                  HERA with MCP
                </h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground dark:text-muted-foreground">
                      Implementation:
                    </dt>
                    <dd className="font-mono text-gray-100 dark:text-foreground">$75,000</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground dark:text-muted-foreground">Timeline:</dt>
                    <dd className="font-mono text-gray-100 dark:text-foreground">21 days</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground dark:text-muted-foreground">
                      Customization:
                    </dt>
                    <dd className="font-mono text-gray-100 dark:text-foreground">$0</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground dark:text-muted-foreground">
                      Annual Maintenance:
                    </dt>
                    <dd className="font-mono text-gray-100 dark:text-foreground">$60,000</dd>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border dark:border-border">
                    <dt className="font-semibold text-gray-100 dark:text-foreground">
                      5-Year TCO:
                    </dt>
                    <dd className="font-mono font-semibold text-gray-100 dark:text-foreground">
                      $375,000
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-600 dark:border-green-500 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-green-700 dark:text-green-300">
                    Total Savings
                  </div>
                  <div className="text-2xl font-bold text-gray-100 dark:text-foreground">
                    $4,125,000
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-700 dark:text-green-300">
                    Cost Reduction
                  </div>
                  <div className="text-2xl font-bold text-gray-100 dark:text-foreground">91.7%</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-700 dark:text-green-300">ROI Period</div>
                  <div className="text-2xl font-bold text-gray-100 dark:text-foreground">
                    2 months
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Success Metrics */}
          <h2
            id="success-metrics"
            className="text-2xl font-semibold text-gray-100 dark:text-foreground mb-6"
          >
            Proven Success Metrics
          </h2>
          <div className="border border-border dark:border-border rounded-lg overflow-hidden mb-12">
            <table className="w-full">
              <thead className="bg-muted dark:bg-muted border-b border-border dark:border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-100 dark:text-foreground">
                    Metric
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-100 dark:text-foreground">
                    Traditional ERP
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-100 dark:text-foreground">
                    HERA with MCP
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-gray-100 dark:text-foreground">
                    Improvement
                  </th>
                </tr>
              </thead>
              <tbody className="bg-background dark:bg-background">
                <tr className="border-b border-border dark:border-border">
                  <td className="px-6 py-3 text-gray-100 dark:text-foreground">
                    Implementation Time
                  </td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">6-18 months</td>
                  <td className="px-6 py-3 text-green-600 dark:text-green-400 font-semibold">
                    21 days
                  </td>
                  <td className="px-6 py-3 text-green-600 dark:text-green-400">20x faster</td>
                </tr>
                <tr className="border-b border-border dark:border-border">
                  <td className="px-6 py-3 text-gray-100 dark:text-foreground">Total Cost</td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">$500K-5M</td>
                  <td className="px-6 py-3 text-green-600 dark:text-green-400 font-semibold">
                    $50K-100K
                  </td>
                  <td className="px-6 py-3 text-green-600 dark:text-green-400">90% less</td>
                </tr>
                <tr className="border-b border-border dark:border-border">
                  <td className="px-6 py-3 text-gray-100 dark:text-foreground">Schema Changes</td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">Hundreds</td>
                  <td className="px-6 py-3 text-green-600 dark:text-green-400 font-semibold">
                    Zero
                  </td>
                  <td className="px-6 py-3 text-green-600 dark:text-green-400">100% reduction</td>
                </tr>
                <tr className="border-b border-border dark:border-border">
                  <td className="px-6 py-3 text-gray-100 dark:text-foreground">Module Reuse</td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">0%</td>
                  <td className="px-6 py-3 text-green-600 dark:text-green-400 font-semibold">
                    100%
                  </td>
                  <td className="px-6 py-3 text-green-600 dark:text-green-400">Complete reuse</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 text-gray-100 dark:text-foreground">Success Rate</td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">60%</td>
                  <td className="px-6 py-3 text-green-600 dark:text-green-400 font-semibold">
                    95%+
                  </td>
                  <td className="px-6 py-3 text-green-600 dark:text-green-400">58% increase</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Next Steps */}
          <div className="border-2 border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-100 dark:text-foreground">
              Ready to Transform Your Business?
            </h2>
            <p className="text-lg text-muted-foreground dark:text-gray-300 mb-6">
              Join hundreds of businesses that have revolutionized their operations with HERA's
              21-day implementation
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/HERA-IMPLEMENTATION-METHODOLOGY-BUNDLE.md"
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 dark:bg-blue-500 text-foreground rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors text-lg"
              >
                <Download className="h-5 w-5" />
                Download Complete Bundle
              </a>
              <Link
                href="/docs/methodology"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border dark:border-border rounded-md hover:bg-muted dark:hover:bg-muted transition-colors text-lg text-gray-700 dark:text-gray-200"
              >
                View Methodology Overview
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
