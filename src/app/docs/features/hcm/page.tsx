'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { useState } from 'react'
import {
  Users,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Clock,
  DollarSign,
  Building2,
  BarChart3,
  Zap,
  Shield,
  ArrowRight,
  CreditCard,
  Award,
  AlertCircle,
  Calculator
} from 'lucide-react'

export default function HCMDoc() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="docs-container">
      <nav className="docs-sidebar">
        <div className="docs-nav-section">
          <h3 className="docs-nav-section-title">Human Capital Management</h3>
          <a href="#overview" className="docs-nav-link" onClick={() => setActiveTab('overview')}>
            Overview
          </a>
          <a href="#features" className="docs-nav-link">
            Key Features
          </a>
          <a href="#payroll" className="docs-nav-link">
            Payroll Automation
          </a>
          <a href="#self-service" className="docs-nav-link">
            Employee Self-Service
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
          <Link href="/docs/features/time-tracking" className="docs-nav-link">
            Time & Attendance
          </Link>
          <Link href="/docs/features/benefits" className="docs-nav-link">
            Benefits Administration
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
            <span>Human Capital Management</span>
          </div>

          <h1>Human Capital Management (HCM)</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Complete workforce management from hiring to retirement with automated payroll and
            self-service
          </p>
        </div>

        <div className="docs-note docs-note-success mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Production Ready</strong>
              <p className="text-sm mt-1">
                Managing 50,000+ employees globally with 90% payroll automation and 2-hour
                processing time. Trusted by enterprises for mission-critical HR operations.
              </p>
            </div>
          </div>
        </div>

        <section id="overview" className="mb-12">
          <h2>Overview</h2>
          <p>
            HERA HCM revolutionizes human resources management with intelligent automation, employee
            self-service, and real-time analytics. From recruitment to retirement, every aspect of
            the employee lifecycle is streamlined and optimized.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">Traditional HR Systems</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• 3-5 day payroll processing</li>
                <li>• Manual leave calculations</li>
                <li>• Paper-based onboarding</li>
                <li>• Disconnected HR data</li>
                <li>• Limited employee access</li>
              </ul>
            </div>

            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-2">HERA HCM</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  2-hour payroll processing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Automated compliance
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Digital onboarding
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  Unified employee data
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success-fg" />
                  24/7 self-service portal
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
                <Users className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Complete Employee Lifecycle</h3>
                  <p className="text-muted-foreground mb-3">
                    Manage every stage from recruitment to retirement with automated workflows and
                    compliance tracking.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="docs-badge">Recruiting</span>
                    <span className="docs-badge">Onboarding</span>
                    <span className="docs-badge">Performance</span>
                    <span className="docs-badge">Development</span>
                    <span className="docs-badge">Succession</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="docs-card">
              <div className="flex items-start gap-4">
                <Calendar className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Time & Attendance</h3>
                  <p className="text-muted-foreground mb-3">
                    Smart time tracking with geo-fencing, shift management, and automatic overtime
                    calculations.
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Clock In/Out</p>
                      <p className="font-semibold">Mobile</p>
                    </div>
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Scheduling</p>
                      <p className="font-semibold">AI-Optimized</p>
                    </div>
                    <div className="bg-canvas-inset p-2 rounded">
                      <p className="text-xs text-muted-foreground">Approval</p>
                      <p className="font-semibold">Automated</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="docs-card">
              <div className="flex items-start gap-4">
                <Award className="w-8 h-8 text-accent-fg flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Benefits Administration</h3>
                  <p className="text-muted-foreground mb-3">
                    Comprehensive benefits management with enrollment workflows and real-time
                    eligibility tracking.
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>• Health insurance enrollment</li>
                    <li>• Retirement plan management</li>
                    <li>• Leave balance tracking</li>
                    <li>• Flexible benefits selection</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="payroll" className="mb-12">
          <h2>Payroll Automation</h2>

          <div className="docs-note docs-note-info mb-6">
            <strong>90% Automation Rate:</strong> From time capture to bank transfer, HERA automates
            the entire payroll process while ensuring 100% accuracy and compliance.
          </div>

          <div className="grid gap-4">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Automated Calculations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Earnings</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Base salary proration</li>
                    <li>• Overtime (1.5x, 2x rates)</li>
                    <li>• Shift differentials</li>
                    <li>• Commission calculations</li>
                    <li>• Bonus processing</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Deductions</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Tax withholdings</li>
                    <li>• Social insurance</li>
                    <li>• Benefit deductions</li>
                    <li>• Loan repayments</li>
                    <li>• Garnishments</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Multi-Country Compliance</h3>
              <p className="text-muted-foreground mb-3">
                Built-in compliance for 50+ countries with automatic updates for regulatory changes:
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="docs-badge">USA - Federal & State</span>
                <span className="docs-badge">UK - PAYE & NI</span>
                <span className="docs-badge">UAE - WPS</span>
                <span className="docs-badge">Singapore - CPF</span>
                <span className="docs-badge">India - PF & ESI</span>
                <span className="docs-badge">Canada - CRA</span>
              </div>
            </div>

            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Processing Timeline</h3>
              <div className="relative">
                <div className="absolute left-8 top-8 bottom-0 w-0.5 bg-border"></div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-accent-emphasis rounded-full"></div>
                    <div>
                      <p className="font-medium">Time & Attendance Import</p>
                      <p className="text-sm text-muted-foreground">
                        Automatic sync from time systems
                      </p>
                    </div>
                    <span className="ml-auto text-xs bg-canvas-inset px-2 py-1 rounded">5 min</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-accent-emphasis rounded-full"></div>
                    <div>
                      <p className="font-medium">Calculation Engine</p>
                      <p className="text-sm text-muted-foreground">
                        Process earnings and deductions
                      </p>
                    </div>
                    <span className="ml-auto text-xs bg-canvas-inset px-2 py-1 rounded">
                      15 min
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-accent-emphasis rounded-full"></div>
                    <div>
                      <p className="font-medium">Review & Approval</p>
                      <p className="text-sm text-muted-foreground">
                        Exception handling and validation
                      </p>
                    </div>
                    <span className="ml-auto text-xs bg-canvas-inset px-2 py-1 rounded">
                      30 min
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-4 h-4 bg-accent-emphasis rounded-full"></div>
                    <div>
                      <p className="font-medium">Bank File Generation</p>
                      <p className="text-sm text-muted-foreground">
                        Create payment files and GL posting
                      </p>
                    </div>
                    <span className="ml-auto text-xs bg-canvas-inset px-2 py-1 rounded">
                      10 min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="self-service" className="mb-12">
          <h2>Employee Self-Service Portal</h2>

          <div className="docs-card mb-6">
            <h3 className="text-lg font-semibold mb-3">24/7 Access for Employees</h3>
            <p className="text-muted-foreground mb-4">
              Empower employees with direct access to their information and common HR tasks:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-canvas-inset p-4 rounded">
                <h4 className="font-medium mb-2">Personal Information</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Update contact details</li>
                  <li>• Emergency contacts</li>
                  <li>• Banking information</li>
                  <li>• Document uploads</li>
                </ul>
              </div>
              <div className="bg-canvas-inset p-4 rounded">
                <h4 className="font-medium mb-2">Time & Leave</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Request time off</li>
                  <li>• View schedules</li>
                  <li>• Clock in/out</li>
                  <li>• Overtime requests</li>
                </ul>
              </div>
              <div className="bg-canvas-inset p-4 rounded">
                <h4 className="font-medium mb-2">Compensation</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• View payslips</li>
                  <li>• Tax documents</li>
                  <li>• Benefit elections</li>
                  <li>• Expense claims</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="docs-card">
            <h3 className="text-lg font-semibold mb-3">Manager Dashboard</h3>
            <p className="text-muted-foreground mb-3">
              Complete team management tools with real-time insights:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <li>• Team attendance overview</li>
              <li>• Approve leave requests</li>
              <li>• Performance reviews</li>
              <li>• Headcount analytics</li>
              <li>• Compensation planning</li>
              <li>• Succession planning</li>
            </ul>
          </div>
        </section>

        <section id="implementation" className="mb-12">
          <h2>Getting Started</h2>

          <h3 className="mb-4">Week 1: Data Migration</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Import employee master data</li>
              <li>✓ Set up organizational structure</li>
              <li>✓ Configure pay components</li>
              <li>✓ Define leave policies</li>
            </ul>
          </div>

          <h3 className="mb-4">Week 2: System Configuration</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Set up payroll calendars</li>
              <li>✓ Configure tax tables</li>
              <li>✓ Create approval workflows</li>
              <li>✓ Test payroll calculations</li>
            </ul>
          </div>

          <h3 className="mb-4">Week 3: Training & Testing</h3>
          <div className="docs-card mb-4">
            <ul className="space-y-2">
              <li>✓ Train HR team</li>
              <li>✓ Manager training sessions</li>
              <li>✓ Employee portal rollout</li>
              <li>✓ Parallel payroll run</li>
            </ul>
          </div>

          <h3 className="mb-4">Week 4: Go Live</h3>
          <div className="docs-card">
            <ul className="space-y-2">
              <li>✓ Launch self-service portal</li>
              <li>✓ Process first live payroll</li>
              <li>✓ Monitor and support</li>
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
                <p className="text-3xl font-bold">90%</p>
                <p className="text-sm opacity-90">Payroll automation rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold">2 hours</p>
                <p className="text-sm opacity-90">Total payroll processing time</p>
              </div>
              <div>
                <p className="text-3xl font-bold">$180K</p>
                <p className="text-sm opacity-90">Average annual savings</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="docs-card">
              <h4 className="font-semibold mb-3">Efficiency Improvements</h4>
              <ul className="space-y-2 text-sm">
                <li>• Payroll processing: 3 days → 2 hours</li>
                <li>• Leave requests: 2 days → Instant</li>
                <li>• Onboarding: 1 week → 1 day</li>
                <li>• HR inquiries: 80% self-service</li>
              </ul>
            </div>

            <div className="docs-card">
              <h4 className="font-semibold mb-3">Compliance & Accuracy</h4>
              <ul className="space-y-2 text-sm">
                <li>• 100% tax compliance</li>
                <li>• Zero payroll errors</li>
                <li>• Automatic regulatory updates</li>
                <li>• Complete audit trail</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="examples" className="mb-12">
          <h2>Use Cases</h2>

          <div className="grid gap-6">
            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Retail Chain - 5,000 Employees</h3>
              <p className="text-muted-foreground mb-3">
                Fashion retailer transformed HR operations across 150 stores:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Automated shift scheduling for hourly workers</li>
                <li>• Mobile clock-in with geo-fencing</li>
                <li>• Real-time overtime alerts</li>
                <li>• Result: 40% reduction in scheduling conflicts, $1.2M overtime savings</li>
              </ul>
            </div>

            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Healthcare Network - 12,000 Employees</h3>
              <p className="text-muted-foreground mb-3">
                Hospital system streamlined complex workforce management:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Multi-facility payroll consolidation</li>
                <li>• Automated shift differentials</li>
                <li>• Credential tracking and alerts</li>
                <li>• Result: 95% payroll accuracy, 70% reduction in HR inquiries</li>
              </ul>
            </div>

            <div className="docs-card">
              <h3 className="text-lg font-semibold mb-3">Tech Company - 2,000 Employees</h3>
              <p className="text-muted-foreground mb-3">
                Software company modernized global HR operations:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Multi-country payroll in 15 locations</li>
                <li>• Automated equity vesting calculations</li>
                <li>• Performance-based compensation</li>
                <li>• Result: 2-day global payroll, 100% compliance across regions</li>
              </ul>
            </div>
          </div>
        </section>

        <section>
          <h2>Next Steps</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/docs/features/performance"
              className="docs-card hover:border-accent-fg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Performance Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Goal setting, reviews, and continuous feedback
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-accent-fg" />
              </div>
            </Link>

            <Link
              href="/docs/features/learning"
              className="docs-card hover:border-accent-fg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Learning & Development</h4>
                  <p className="text-sm text-muted-foreground">
                    Training programs and skill development tracking
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
                <strong>Ready to modernize your HR?</strong>
                <p className="text-sm mt-1">
                  HERA HCM can be implemented in just 4 weeks with immediate efficiency gains.
                  <Link href="/contact" className="underline">
                    Contact us
                  </Link>{' '}
                  to see how we can transform your workforce management.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
