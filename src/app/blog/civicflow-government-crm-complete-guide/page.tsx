import { Metadata } from 'next'
import Link from 'next/link'
import {
  Users,
  Building2,
  Briefcase,
  DollarSign,
  FileText,
  MessageSquare,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  Shield,
  Zap,
  Target,
  BarChart3,
  Workflow,
  Globe,
  Lock,
  ArrowRight
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'CivicFlow: Complete Guide to Modern Government CRM & Grants Management Software | HERA ERP',
  description:
    'Transform your public sector operations with CivicFlow. 1-week implementation, 90% cost reduction vs traditional government CRM. Built-in grants management, AI-powered automation, and compliance tracking for government agencies and non-profits.',
  keywords:
    'government CRM, constituent management, grants management software, public sector CRM, case management system, non-profit CRM, civic engagement platform, grant administration, eligibility screening, compliance reporting, government workflow automation, citizen services platform, community services software, local government CRM, council management system',
  openGraph: {
    title: 'CivicFlow: Modern Government CRM & Grants Management Software',
    description:
      '1-week implementation, 90% cost savings. Transform your constituent management, grants administration, and case tracking with AI-powered CivicFlow.',
    url: 'https://heraerp.com/blog/civicflow-government-crm-complete-guide',
    siteName: 'HERA ERP',
    images: [
      {
        url: 'https://heraerp.com/og-civicflow-guide.jpg',
        width: 1200,
        height: 630,
        alt: 'CivicFlow Government CRM Complete Guide'
      }
    ],
    locale: 'en_GB',
    type: 'article'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CivicFlow: Complete Guide to Modern Government CRM Software',
    description:
      '1-week implementation for government agencies. 90% cost reduction vs traditional CRM. Built-in grants management and compliance.',
    images: ['https://heraerp.com/og-civicflow-guide.jpg']
  },
  alternates: {
    canonical: 'https://heraerp.com/blog/civicflow-government-crm-complete-guide'
  }
}

export default function CivicFlowBlogPost() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* SEO-optimized article structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: 'CivicFlow: Complete Guide to Modern Government CRM & Grants Management Software',
            description:
              'Comprehensive guide to CivicFlow government CRM platform. Learn how public sector agencies achieve 1-week implementation, 90% cost reduction, and complete grants management automation.',
            image: 'https://heraerp.com/og-civicflow-guide.jpg',
            datePublished: '2025-01-10T00:00:00+00:00',
            dateModified: '2025-01-10T00:00:00+00:00',
            author: {
              '@type': 'Organization',
              name: 'HERA ERP',
              url: 'https://heraerp.com'
            },
            publisher: {
              '@type': 'Organization',
              name: 'HERA ERP',
              logo: {
                '@type': 'ImageObject',
                url: 'https://heraerp.com/logo.png'
              }
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': 'https://heraerp.com/blog/civicflow-government-crm-complete-guide'
            },
            keywords:
              'government CRM, constituent management, grants management software, public sector CRM, case management system, non-profit CRM, civic engagement, grant administration'
          })
        }}
      />

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-900 dark:via-blue-950 dark:to-indigo-950">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-8 flex justify-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-4 py-1.5 text-sm font-semibold text-blue-900 dark:text-blue-100">
                <Activity className="mr-2 h-4 w-4" />
                Government CRM Guide
              </span>
              <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/50 px-4 py-1.5 text-sm font-semibold text-green-900 dark:text-green-100">
                <CheckCircle className="mr-2 h-4 w-4" />
                1-Week Implementation
              </span>
            </div>
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              CivicFlow: The Complete Guide to Modern{' '}
              <span className="text-blue-200">Government CRM</span>
            </h1>
            <p className="mb-10 text-xl leading-8 text-blue-50 sm:text-2xl">
              Transform your public sector operations with AI-powered constituent management, grants
              administration, and case tracking. 90% cost reduction vs traditional government CRM
              platforms.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="https://heraerp.com/civicflow"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50 dark:bg-blue-100 dark:hover:bg-blue-200"
              >
                Schedule Free Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="https://heraerp.com/civicflow/trial"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <article className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        {/* The Crisis Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-4xl font-bold text-gray-900 dark:text-gray-100">
            The Public Sector CRM Crisis
          </h2>
          <div className="mb-8 space-y-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            <p>
              Government agencies and public sector organizations are hemorrhaging resources on
              outdated constituent management systems. The average government CRM implementation
              costs <strong>£150,000-£500,000 upfront</strong> with annual maintenance of{' '}
              <strong>£50,000-£150,000</strong>, yet <strong>45% of projects fail</strong> to
              deliver expected outcomes.
            </p>
          </div>

          {/* Problem Stats */}
          <div className="my-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-6">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Operational Challenges
                </h4>
              </div>
              <ul className="mt-4 space-y-2 text-gray-700 dark:text-gray-300">
                <li>• 14-21 days average citizen wait times</li>
                <li>• 60% staff time on data entry vs service</li>
                <li>• Data scattered across 8-12 systems</li>
                <li>• 20-30% grant administrative overhead</li>
              </ul>
            </div>

            <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-6">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Financial Impact
                </h4>
              </div>
              <ul className="mt-4 space-y-2 text-gray-700 dark:text-gray-300">
                <li>• £150K-£500K implementation costs</li>
                <li>• £50K-£150K annual maintenance</li>
                <li>• 30-40% of total IT budget wasted</li>
                <li>• 45% project failure rate</li>
              </ul>
            </div>
          </div>

          {/* The Solution Callout */}
          <div className="my-10 rounded-xl border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-8">
            <h4 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
              The CivicFlow Solution
            </h4>
            <ul className="space-y-3 text-lg text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <span>
                  <strong>1-week implementation</strong> from requirements to fully operational
                  system
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <span>
                  <strong>90% cost reduction</strong> vs traditional government CRM platforms
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <span>
                  <strong>AI-powered automation</strong> for case routing, eligibility screening,
                  and compliance
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                <span>
                  <strong>Complete grants management</strong> built-in with zero additional modules
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* What is CivicFlow Section */}
        <section className="mb-16">
          <h2 className="mb-6 text-4xl font-bold text-gray-900 dark:text-gray-100">
            What is CivicFlow?
          </h2>
          <div className="mb-8 space-y-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            <p>
              <strong>CivicFlow</strong> is a comprehensive constituent relationship management and
              grants administration platform specifically designed for government agencies, local
              councils, non-profit organizations, and public sector service providers.
            </p>
            <p>
              Unlike traditional government CRMs built on rigid, outdated architectures, CivicFlow
              leverages HERA's <strong>patent-pending Universal Data Model</strong> to deliver
              enterprise-grade capabilities with modern SaaS simplicity.
            </p>
          </div>

          {/* Core Features Grid */}
          <div className="my-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 dark:bg-blue-900/50 p-3">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Constituent Management
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Complete 360-degree view of every citizen with unified profiles, interaction
                history, eligibility tracking, and privacy controls.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-green-100 dark:bg-green-900/50 p-3">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Case Management
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Professional service request tracking with automated routing, SLA monitoring, and
                performance analytics.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-purple-100 dark:bg-purple-900/50 p-3">
                  <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Grants Management
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                End-to-end grant administration from program design to disbursement and compliance
                reporting.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-900/50 p-3">
                  <MessageSquare className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Communications
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Multi-channel constituent outreach with email campaigns, SMS notifications, and
                automated workflows.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-cyan-100 dark:bg-cyan-900/50 p-3">
                  <BarChart3 className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Analytics & Reporting
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Real-time insights, compliance reporting, and AI-powered recommendations for service
                delivery.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition hover:shadow-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-indigo-100 dark:bg-indigo-900/50 p-3">
                  <Workflow className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Workflow Automation
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                No-code automation for eligibility screening, case routing, compliance checks, and
                notifications.
              </p>
            </div>
          </div>
        </section>

        {/* Revolutionary Architecture */}
        <section className="mb-16">
          <h2 className="mb-6 text-4xl font-bold text-gray-900 dark:text-gray-100">
            Revolutionary Architecture
          </h2>
          <div className="mb-8 space-y-6 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
            <p>
              CivicFlow is built on HERA's <strong>patent-pending Universal Data Model</strong> - a
              breakthrough architecture that eliminates the complexity and cost of traditional ERP
              systems.
            </p>
          </div>

          <div className="my-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-gradient-to-br from-blue-500 to-blue-600 p-4">
                  <Zap className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                1-Week Implementation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                From requirements to fully operational system
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-gradient-to-br from-green-500 to-green-600 p-4">
                  <Target className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                Zero Customization
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Infinitely flexible out-of-the-box configuration
              </p>
            </div>

            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-gradient-to-br from-purple-500 to-purple-600 p-4">
                  <Activity className="h-8 w-8 text-white" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                AI-Native Design
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Built-in intelligence for government workflows
              </p>
            </div>
          </div>
        </section>

        {/* Success Stories */}
        <section className="mb-16">
          <h2 className="mb-6 text-4xl font-bold text-gray-900 dark:text-gray-100">
            Real-World Success Stories
          </h2>

          <div className="space-y-8">
            {/* Case Study 1 */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900 p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Riverside County Community Services
                </h3>
              </div>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Managing constituent services across housing assistance, senior programs, and youth
                development with 6 different spreadsheets and paper files.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-white dark:bg-gray-900 p-4">
                  <div className="mb-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
                    68%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Reduction in case resolution time (18 days → 5.8 days)
                  </div>
                </div>
                <div className="rounded-lg bg-white dark:bg-gray-900 p-4">
                  <div className="mb-1 text-3xl font-bold text-green-600 dark:text-green-400">
                    94%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    SLA compliance (up from 61%)
                  </div>
                </div>
              </div>
              <blockquote className="mt-6 border-l-4 border-blue-500 pl-4 italic text-gray-700 dark:text-gray-300">
                "CivicFlow transformed how we serve our community. Our residents notice the
                difference, and our staff morale has never been higher."
                <footer className="mt-2 text-sm font-semibold not-italic">
                  — Margaret Chen, Director of Community Services
                </footer>
              </blockquote>
            </div>

            {/* Case Study 2 */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-gray-900 p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Briefcase className="h-6 w-6 text-green-600 dark:text-green-400" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Community Development Foundation
                </h3>
              </div>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Processing 150 grant applications per year using manual spreadsheets, email
                submissions, and paper scoring sheets.
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-white dark:bg-gray-900 p-4">
                  <div className="mb-1 text-3xl font-bold text-green-600 dark:text-green-400">
                    70%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Reduction in admin time (35% → 10%)
                  </div>
                </div>
                <div className="rounded-lg bg-white dark:bg-gray-900 p-4">
                  <div className="mb-1 text-3xl font-bold text-blue-600 dark:text-blue-400">
                    95%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Process automation achieved
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mb-16">
          <h2 className="mb-6 text-4xl font-bold text-gray-900 dark:text-gray-100">
            CivicFlow vs Traditional Government CRM
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                  <th className="p-4 font-semibold text-gray-900 dark:text-gray-100">Feature</th>
                  <th className="p-4 font-semibold text-green-600 dark:text-green-400">
                    CivicFlow
                  </th>
                  <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">
                    Traditional CRM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                    Implementation
                  </td>
                  <td className="p-4 text-green-600 dark:text-green-400">1 week</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">12-24 months</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="p-4 font-medium text-gray-900 dark:text-gray-100">Setup Cost</td>
                  <td className="p-4 text-green-600 dark:text-green-400">£800</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">£80,000-£250,000</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                    Monthly Cost (50 users)
                  </td>
                  <td className="p-4 text-green-600 dark:text-green-400">£2,800</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">£8,500-£15,000</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                    Grants Management
                  </td>
                  <td className="p-4 text-green-600 dark:text-green-400">✅ Built-in</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">❌ Custom build</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                  <td className="p-4 font-medium text-gray-900 dark:text-gray-100">
                    AI Automation
                  </td>
                  <td className="p-4 text-green-600 dark:text-green-400">✅ AI-powered</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">❌ Manual</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-16">
          <h2 className="mb-10 text-4xl font-bold text-gray-900 dark:text-gray-100">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            {/* FAQ 1 */}
            <div className="rounded-xl border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-6">
              <h4 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-100">
                How is CivicFlow different from Salesforce or Microsoft Dynamics?
              </h4>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                <strong>
                  CivicFlow is purpose-built for government and non-profit constituent services
                </strong>
                , not adapted from corporate sales CRM. We include built-in grants management,
                eligibility screening workflows, compliance reporting, and case management designed
                for service delivery - not sales opportunities.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Additionally, CivicFlow costs <strong>80-90% less</strong> than enterprise platforms
                when you factor in implementation, customization, and ongoing maintenance.
              </p>
            </div>

            {/* FAQ 2 */}
            <div className="rounded-xl border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-6">
              <h4 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-100">
                How long does it take to implement CivicFlow in my organization?
              </h4>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                <strong>1 week to deploy, fully operational in 5-7 business days.</strong>
              </p>
              <ul className="list-inside list-disc space-y-2 text-gray-700 dark:text-gray-300">
                <li>
                  <strong>Day 1-2</strong>: Initial setup and data migration
                </li>
                <li>
                  <strong>Day 3-4</strong>: Program configuration and workflow setup
                </li>
                <li>
                  <strong>Day 5-7</strong>: Staff training and go-live
                </li>
              </ul>
              <p className="mt-4 text-gray-700 dark:text-gray-300">
                Most organizations are processing real cases and applications by end of week one.
              </p>
            </div>

            {/* FAQ 3 */}
            <div className="rounded-xl border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-6">
              <h4 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-100">
                Can CivicFlow handle complex grant management requirements?
              </h4>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                <strong>
                  Yes, CivicFlow includes comprehensive grants management with multi-stage
                  workflows, custom scoring, and compliance tracking.
                </strong>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Our grants module supports custom application forms, multi-stage reviews, scoring
                rubrics, conflict of interest detection, disbursement tracking, and compliance
                monitoring with portfolio dashboards.
              </p>
            </div>

            {/* FAQ 4 */}
            <div className="rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-6">
              <h4 className="mb-3 text-xl font-bold text-gray-900 dark:text-gray-100">
                Is my constituent data secure and compliant with privacy regulations?
              </h4>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                <strong>Yes, CivicFlow is built with government-grade security and compliance.</strong>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                We provide data encryption (AES-256), role-based access control, audit logs,
                multi-factor authentication, and certifications including GDPR, HIPAA, SOC 2 Type
                II, and Section 508 accessibility standards.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mb-16">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 text-center shadow-xl">
            <h2 className="mb-4 text-3xl font-bold text-white">
              Transform Your Public Sector Operations Today
            </h2>
            <p className="mb-8 text-xl text-blue-50">
              Join the growing community of government agencies and non-profits that have eliminated
              constituent management chaos with CivicFlow.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="https://heraerp.com/civicflow"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition hover:bg-blue-50"
              >
                Schedule Free Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="https://heraerp.com/civicflow/trial"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition hover:bg-white/10"
              >
                Start Free 14-Day Trial
              </Link>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="border-t border-gray-200 dark:border-gray-800 pt-16">
          <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            About HERA & CivicFlow
          </h3>
          <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
            CivicFlow is built on <strong>HERA (Hierarchical Enterprise Resource Architecture)</strong>,
            the revolutionary ERP platform with a patent-pending Universal Data Model that eliminates
            the complexity and cost of traditional enterprise software.
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Link
              href="/blog/ai-erp-jewellery-business-complete-guide"
              className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center transition hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                HERA Jewellery
              </span>
            </Link>
            <Link
              href="/salon"
              className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center transition hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                HERA Salon
              </span>
            </Link>
            <Link
              href="/civicflow"
              className="rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4 text-center"
            >
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                CivicFlow
              </span>
            </Link>
            <Link
              href="/"
              className="rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-center transition hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Learn More
              </span>
            </Link>
          </div>
        </section>
      </article>

      {/* FAQ Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How is CivicFlow different from Salesforce or Microsoft Dynamics?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'CivicFlow is purpose-built for government and non-profit constituent services, not adapted from corporate sales CRM. We include built-in grants management, eligibility screening workflows, compliance reporting, and case management designed for service delivery. Additionally, CivicFlow costs 80-90% less than traditional enterprise platforms.'
                }
              },
              {
                '@type': 'Question',
                name: 'How long does it take to implement CivicFlow in my organization?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '1 week to deploy, fully operational in 5-7 business days. Day 1-2: Initial setup and data migration. Day 3-4: Program configuration and workflow setup. Day 5-7: Staff training and go-live. Most organizations are processing real cases and applications by end of week one.'
                }
              },
              {
                '@type': 'Question',
                name: 'Can CivicFlow handle complex grant management requirements?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, CivicFlow includes comprehensive grants management with multi-stage workflows, custom scoring, and compliance tracking. Our grants module supports custom application forms, multi-stage reviews, scoring rubrics, conflict of interest detection, disbursement tracking, and compliance monitoring.'
                }
              },
              {
                '@type': 'Question',
                name: 'Is my constituent data secure and compliant with privacy regulations?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Yes, CivicFlow is built with government-grade security and compliance. We provide data encryption (AES-256), role-based access control, audit logs, multi-factor authentication, and certifications including GDPR, HIPAA, SOC 2 Type II, and Section 508 accessibility standards.'
                }
              }
            ]
          })
        }}
      />
    </div>
  )
}
