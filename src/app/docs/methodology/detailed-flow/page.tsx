'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Download } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEffect, useRef } from 'react'

// Mermaid component
function MermaidDiagram({ chart, id }: { chart: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && typeof window !== 'undefined') {
      const loadMermaid = async () => {
        const mermaid = (await import('mermaid')).default
        const isDarkMode = document.documentElement.classList.contains('dark')
        mermaid.initialize({
          startOnLoad: true,
          theme: isDarkMode ? 'dark' : 'default',
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true
          }
        })

        ref.current!.innerHTML = chart
        mermaid.contentLoaded()
      }
      loadMermaid()

      // Listen for theme changes
      const observer = new MutationObserver(() => {
        loadMermaid()
      })

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      })

      return () => observer.disconnect()
    }
  }, [chart])

  return <div ref={ref} id={id} className="mermaid" />
}

export default function DetailedFlowPage() {
  const router = useRouter()

  const flowDiagram = `
flowchart TD
  A[Client Intake<br/>Requirements & KPIs] --> B[MCP Orchestrator<br/>Normalize + Map]
  B --> C{Intelligent Classification<br/>Industry • Module • Type • Subtype}
  C --> D[Config Draft<br/>entities + dynamic data]
  D --> E[Module Reuse Toggle<br/>Finance • Controlling • Purchasing • P2P • O2C]
  E --> F[Sandbox Provisioning<br/>client.heraerp.com/{vertical}]
  F --> G[Template Load<br/>COA, Vendors, Customers, Fiscal Calendar]
  G --> H[Sample DNA Scenarios<br/>P2P • O2C • Approvals]
  H --> I[MCP Runtime Validation<br/>Guardrails: org_id, classification, GL balance]
  I --> J[Client Playground & Feedback<br/>Chat-based rule tweaks]
  J --> K[Data Conversion Pilot<br/>COA, Opening Balances, Masters]
  K --> L[UAT Pack Generation<br/>Test cases per requirement]
  L --> M[Execute UAT<br/>Capture Evidence & Results]
  M --> N[UAT Sign-off<br/>transactions: UAT_SIGNOFF]
  N --> O[Cutover Readiness Check<br/>CI Guardrails block_on_error]
  O --> P[Production Copy<br/>Config + Clean Data]
  P --> Q[Go-Live Enablement<br/>client.heraerp.com/{org}]
  Q --> R[Post-Go-Live MCP<br/>Rule updates w/o structural changes]
  R --> S[Fiscal DNA Ops<br/>Period Close • Year-End Close • Consolidation]
  S --> T[Continuous Improvement<br/>Version evolution v2, v3]

  %% Guards
  I -. hard blocks .-> X[Guardrails v2.0<br/>Universal structure protection]
  I -. multi-tenancy .-> Y[Enforce organization_id on all reads/writes]
  I -. GL .-> Z[Balance per currency]

  %% Data Backbone
  subgraph Universal Foundation
    D
    K
    L
    M
    N
    P
    S
  end

  style A fill:#e1f5fe,stroke:#01579b,stroke-width:2px
  style B fill:#fff3e0,stroke:#e65100,stroke-width:2px
  style C fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
  style I fill:#ffebee,stroke:#b71c1c,stroke-width:3px
  style Q fill:#e8f5e9,stroke:#1b5e20,stroke-width:3px
  style X fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px
  style Y fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px
  style Z fill:#ffcdd2,stroke:#d32f2f,stroke-width:2px
`

  const swimlaneDiagram = `
sequenceDiagram
  participant CL as Client Team
  participant MCP as MCP Orchestrator (Claude/OpenAI)
  participant HC as HERA Core
  participant GR as Guardrails v2.0
  participant DP as Data Pipelines (ETL/MCP)
  participant UAT as UAT Council
  participant OPS as Prod Ops

  CL->>MCP: Business goals, processes (Finance/Controlling/Purchasing, P2P, O2C)
  MCP->>MCP: Normalize → Intelligent Classification
  MCP->>HC: Create entities + dynamic data (DRAFT)
  MCP->>HC: Enable module DNA (reuse toggles, not rebuild)
  HC->>GR: Validate org isolation, classification, invariants
  GR-->>HC: OK or Errors (autofix suggestions)

  MCP->>OPS: Provision sandbox client.heraerp.com/{vertical}
  OPS-->>HC: Seed templates (COA, Vendors, Customers, Fiscal Calendar)
  MCP->>HC: Generate sample transactions (P2P/O2C) for demos
  HC->>GR: Runtime checks (GL balanced, approvals, period status)
  CL->>MCP: Feedback ("raise PO approval to $5k", etc.)
  MCP->>HC: Update JSON rules (no structural change)

  CL->>DP: Provide legacy data (Excel/Tally/POS)
  DP->>HC: Load masters & opening balances with org_id + classification
  HC->>GR: ETL validation (hard blocks on violations)
  MCP->>UAT: Auto-generate test pack per requirement
  UAT->>HC: Execute tests as transactions (evidence linked)
  UAT-->>MCP: Sign-off decision
  MCP->>HC: Record UAT_SIGNOFF

  MCP->>OPS: Cutover checklist → CI guardrails (block_on_error)
  OPS->>HC: Promote config + clean data to production
  OPS-->>CL: Go-live client.heraerp.com/{org}

  loop BAU
    CL->>HC: Daily ops (orders, invoices, receipts, payouts)
    HC->>GR: Continuous enforcement (multi-tenancy, GL, approvals)
    MCP->>HC: Hot-rule updates via JSON / versioning
  end

  Note over HC: Fiscal DNA: periods, closes, YE, consolidation<br/>All recorded in transactions
`

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-50 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-gray-900/10 dark:border-gray-50/[0.06] bg-white/95 dark:bg-gray-900/75">
        <div className="max-w-7xl mx-auto">
          <div className="px-4 py-4 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/docs/methodology')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Methodology
                </Button>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 text-transparent bg-clip-text">
                  Detailed Implementation Flow
                </h1>
              </div>
              <Link href="/docs">
                <Button variant="outline">Documentation Hub</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative px-4 py-8 mx-auto max-w-7xl">
        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>MCP Orchestration Architecture</CardTitle>
            <CardDescription>
              Complete visual representation of the HERA ERP delivery lifecycle with Model Context
              Protocol (MCP) orchestration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Link href="/HERA-ERP-DELIVERY-MCP-ORCHESTRATION.md" target="_blank">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  View Full Documentation
                </Button>
              </Link>
              <Link href="/HERA-ERP-DELIVERY-MCP-ORCHESTRATION.md" download>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Download Markdown
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Diagrams */}
        <Tabs defaultValue="flow" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="flow">End-to-End Flow</TabsTrigger>
            <TabsTrigger value="swimlane">Swimlane Diagram</TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>End-to-End Delivery Flow</CardTitle>
                <CardDescription>
                  Complete 23-step journey from client intake to continuous improvement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div style={{ minWidth: '1200px', minHeight: '800px' }}>
                    <MermaidDiagram chart={flowDiagram} id="flow-diagram" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Key Features:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                    <li>MCP orchestration at every step</li>
                    <li>Guardrail enforcement points (red boxes)</li>
                    <li>Sacred Six table touchpoints highlighted</li>
                    <li>Color-coded phases for clarity</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="swimlane" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Swimlane: Roles & Interactions</CardTitle>
                <CardDescription>
                  Detailed interactions between all stakeholders in the implementation process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full overflow-x-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  <div style={{ minWidth: '1000px', minHeight: '600px' }}>
                    <MermaidDiagram chart={swimlaneDiagram} id="swimlane-diagram" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    <strong>Participants:</strong>
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                    <li>
                      <strong>Client Team:</strong> Business stakeholders and end users
                    </li>
                    <li>
                      <strong>MCP Orchestrator:</strong> AI-powered automation (Claude/OpenAI)
                    </li>
                    <li>
                      <strong>HERA Core:</strong> The universal foundation
                    </li>
                    <li>
                      <strong>Guardrails v2.0:</strong> Enforcement and validation layer
                    </li>
                    <li>
                      <strong>Data Pipelines:</strong> ETL and migration tools
                    </li>
                    <li>
                      <strong>UAT Council:</strong> Testing and approval team
                    </li>
                    <li>
                      <strong>Prod Ops:</strong> Production operations team
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Key Concepts */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Guardrails v2.0</CardTitle>
              <CardDescription>Always-on enforcement</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">🛡️</span>
                  <span>
                    <strong>Architecture Protection:</strong> Universal structure maintained
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">🛡️</span>
                  <span>
                    <strong>Multi-Tenancy:</strong> organization_id required everywhere
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">🛡️</span>
                  <span>
                    <strong>Business Classification:</strong> Required on all entities/transactions
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">🛡️</span>
                  <span>
                    <strong>GL Balance:</strong> Must balance per currency
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">🛡️</span>
                  <span>
                    <strong>Fiscal Control:</strong> Period status enforcement
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Module DNA Reuse</CardTitle>
              <CardDescription>Toggle, don't rebuild</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">🧬</span>
                  <span>
                    <strong>Finance DNA:</strong> COA, GL posting, fiscal periods
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">🧬</span>
                  <span>
                    <strong>Controlling DNA:</strong> Cost centers, profit analytics
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">🧬</span>
                  <span>
                    <strong>Purchasing DNA:</strong> Vendors, POs, 3-way match
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">🧬</span>
                  <span>
                    <strong>P2P DNA:</strong> Purchase-to-Pay workflow
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">🧬</span>
                  <span>
                    <strong>O2C DNA:</strong> Order-to-Cash workflow
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Implementation Examples */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Implementation Code Examples</CardTitle>
            <CardDescription>Real examples from each phase of the implementation</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="requirements" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="requirements">Requirements</TabsTrigger>
                <TabsTrigger value="sandbox">Sandbox Testing</TabsTrigger>
                <TabsTrigger value="uat">UAT Sign-off</TabsTrigger>
              </TabsList>

              <TabsContent value="requirements" className="mt-4">
                <div className="bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-gray-400">
                    // Phase 1: MCP captures requirements as draft entities
                  </div>
                  <pre>{`const requirement = {
  entity_type: 'project_requirement',
  entity_name: 'P2P Approval Workflow',
  business_context: 'PROJECT.REQ.P2P.APPROVAL.v1',
  status: 'DRAFT',
  dynamic_data: {
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
}`}</pre>
                </div>
              </TabsContent>

              <TabsContent value="sandbox" className="mt-4">
                <div className="bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-gray-400">
                    // Phase 3: Generate test transactions in sandbox
                  </div>
                  <pre>{`const testPO = {
  transaction_type: 'purchase_order',
  business_context: 'MANUFACTURING.P2P.PO.TEST.v1',
  total_amount: 7500,
  approval_required: true,
  lines: [
    { 
      entity_id: 'raw_material_001', 
      quantity: 100, 
      unit_price: 75 
    }
  ]
}`}</pre>
                </div>
              </TabsContent>

              <TabsContent value="uat" className="mt-4">
                <div className="bg-gray-900 dark:bg-gray-950 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="text-gray-400">// Phase 5: UAT sign-off as transaction</div>
                  <pre>{`const signoff = {
  transaction_type: 'project_milestone',
  business_context: 'PROJECT.UAT.SIGNOFF.v1',
  approved_by: 'cfo_user_id',
  approval_date: '2025-09-15',
  metadata: {
    test_cases_passed: 147,
    test_cases_failed: 0,
    defects_resolved: 3,
    sign_off_status: 'APPROVED'
  }
}`}</pre>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Success Metrics */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Success Metrics</CardTitle>
            <CardDescription>Proven results from HERA implementations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">20x</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Faster Delivery</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">90%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Cost Reduction</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">0</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Structure Changes</div>
              </div>
              <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">100%</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Module Reuse</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
