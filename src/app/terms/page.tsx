import HeadingAnchor from '@/components/legal/HeadingAnchor'
import Toc from '@/components/legal/Toc'

const sections = [
  { id: 'introduction', text: '1. Introduction', level: 'h2' as const },
  { id: 'acceptance', text: '2. Acceptance of Terms', level: 'h2' as const },
  { id: 'services', text: '3. Description of Services', level: 'h2' as const },
  { id: 'account-registration', text: '4. Account Registration', level: 'h2' as const },
  { id: 'user-responsibilities', text: '5. User Responsibilities', level: 'h2' as const },
  { id: 'acceptable-use', text: '6. Acceptable Use Policy', level: 'h2' as const },
  { id: 'data-security', text: '7. Data Security & Privacy', level: 'h2' as const },
  { id: 'intellectual-property', text: '8. Intellectual Property', level: 'h2' as const },
  { id: 'subscription-billing', text: '9. Subscription & Billing', level: 'h2' as const },
  { id: 'termination', text: '10. Termination', level: 'h2' as const },
  { id: 'warranties', text: '11. Warranties & Disclaimers', level: 'h2' as const },
  { id: 'limitation-liability', text: '12. Limitation of Liability', level: 'h2' as const },
  { id: 'indemnification', text: '13. Indemnification', level: 'h2' as const },
  { id: 'governing-law', text: '14. Governing Law', level: 'h2' as const },
  { id: 'changes', text: '15. Changes to Terms', level: 'h2' as const },
  { id: 'contact', text: '16. Contact Information', level: 'h2' as const }
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative border-b border-border bg-gradient-to-br from-indigo-600/5 via-fuchsia-600/5 to-cyan-600/5">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
          <h1 className="text-3xl font-bold ink md:text-4xl lg:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-lg ink-muted">
            Effective Date: January 1, 2025
          </p>
          <p className="mt-2 text-sm ink-muted">
            Last Updated: January 27, 2025
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex gap-12">
          {/* Main Content */}
          <article className="prose prose-lg max-w-none flex-1 ink">
            <HeadingAnchor id="introduction">
              1. Introduction
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              Welcome to HERA Universal ERP ("HERA", "we", "our", or "us"). These Terms of Service ("Terms") govern your use of our enterprise resource planning software, services, and related applications (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms and our Privacy Policy.
            </p>
            <p className="ink-muted leading-relaxed">
              HERA provides a revolutionary universal ERP platform built on a 6-table architecture designed to handle infinite business complexity with zero schema changes. Our Services include multi-tenant SaaS authentication, universal API access, AI-powered automation, and comprehensive business management tools.
            </p>

            <HeadingAnchor id="acceptance">
              2. Acceptance of Terms
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              By creating an account, accessing, or using the Services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you are using the Services on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
            </p>
            <p className="ink-muted leading-relaxed">
              If you do not agree to these Terms, you must not access or use the Services.
            </p>

            <HeadingAnchor id="services">
              3. Description of Services
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              HERA provides cloud-based enterprise resource planning software that includes:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted">
              <li>Universal 6-table schema architecture for infinite business modeling</li>
              <li>Multi-tenant SaaS platform with organization-based isolation</li>
              <li>AI-powered auto-journal posting and financial automation</li>
              <li>Industry-specific templates and configurations</li>
              <li>Real-time financial reporting and analytics</li>
              <li>Universal API access for custom integrations</li>
              <li>Mobile-responsive progressive web application</li>
              <li>Enterprise-grade security with SSO/SAML support</li>
            </ul>
            <p className="ink-muted leading-relaxed">
              We reserve the right to modify, suspend, or discontinue any part of the Services at any time with reasonable notice.
            </p>

            <HeadingAnchor id="account-registration">
              4. Account Registration
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              To use our Services, you must create an account and provide accurate, complete, and current information. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your account information remains accurate and up-to-date</li>
            </ul>
            <p className="ink-muted leading-relaxed">
              You must be at least 18 years old to create an account. We reserve the right to refuse service, terminate accounts, or cancel orders at our discretion.
            </p>

            <HeadingAnchor id="user-responsibilities">
              5. User Responsibilities
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              As a user of our Services, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted">
              <li>Use the Services in compliance with all applicable laws and regulations</li>
              <li>Not use the Services for any illegal or unauthorized purpose</li>
              <li>Maintain the security and confidentiality of your data</li>
              <li>Ensure proper backup of your critical business data</li>
              <li>Not attempt to gain unauthorized access to any part of the Services</li>
              <li>Not interfere with or disrupt the Services or servers</li>
              <li>Not reverse engineer or attempt to extract source code</li>
            </ul>

            <HeadingAnchor id="acceptable-use">
              6. Acceptable Use Policy
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              You may not use the Services to:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted">
              <li>Violate any laws, regulations, or third-party rights</li>
              <li>Transmit viruses, malware, or other harmful code</li>
              <li>Engage in fraudulent or deceptive practices</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Attempt to bypass security measures or access restrictions</li>
              <li>Use automated systems to access the Services without permission</li>
              <li>Resell or redistribute the Services without authorization</li>
              <li>Store or process prohibited content as defined in our policies</li>
            </ul>

            <HeadingAnchor id="data-security">
              7. Data Security & Privacy
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              We implement enterprise-grade security measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted">
              <li>End-to-end encryption for data in transit and at rest</li>
              <li>Multi-tenant isolation with organization-based data separation</li>
              <li>Row-level security (RLS) enforcement</li>
              <li>Regular security audits and compliance certifications</li>
              <li>Complete audit trails for all data modifications</li>
            </ul>
            <p className="ink-muted leading-relaxed">
              Your use of the Services is also governed by our Privacy Policy, which describes how we collect, use, and protect your information. You retain all rights to your data and may export it at any time through our universal API.
            </p>

            <HeadingAnchor id="intellectual-property">
              8. Intellectual Property
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              The Services and all associated intellectual property rights are owned by HERA Corporation. This includes but is not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted">
              <li>The HERA Universal ERP platform and software</li>
              <li>The Sacred 6-table architecture and universal patterns</li>
              <li>Smart Code system and DNA components</li>
              <li>All documentation, APIs, and user interfaces</li>
              <li>Trademarks, logos, and brand elements</li>
            </ul>
            <p className="ink-muted leading-relaxed">
              You retain ownership of all data you input into the Services. By using the Services, you grant us a limited license to process your data solely for the purpose of providing the Services to you.
            </p>

            <HeadingAnchor id="subscription-billing">
              9. Subscription & Billing
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              Our Services are offered on a subscription basis with various pricing tiers:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted">
              <li>Subscriptions are billed monthly or annually in advance</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>Prices may change with 30 days' notice</li>
              <li>You authorize automatic renewal and billing</li>
              <li>Late payments may result in service suspension</li>
            </ul>
            <p className="ink-muted leading-relaxed">
              Free trials, if offered, automatically convert to paid subscriptions unless cancelled before the trial period ends.
            </p>

            <HeadingAnchor id="termination">
              10. Termination
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              Either party may terminate these Terms:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted">
              <li>You may cancel your subscription at any time through your account settings</li>
              <li>We may suspend or terminate your access for violations of these Terms</li>
              <li>We may terminate for non-payment of fees</li>
              <li>Upon termination, your right to use the Services ceases immediately</li>
              <li>We will provide data export capabilities for 30 days after termination</li>
            </ul>

            <HeadingAnchor id="warranties">
              11. Warranties & Disclaimers
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DISCLAIM ALL WARRANTIES INCLUDING:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted uppercase">
              <li>MERCHANTABILITY</li>
              <li>FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>NON-INFRINGEMENT</li>
              <li>ACCURACY OR COMPLETENESS OF DATA</li>
              <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
            </ul>
            <p className="ink-muted leading-relaxed">
              We do not warrant that the Services will meet all your requirements or that defects will be corrected. You use the Services at your own risk.
            </p>

            <HeadingAnchor id="limitation-liability">
              12. Limitation of Liability
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, HERA AND ITS AFFILIATES SHALL NOT BE LIABLE FOR:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted">
              <li>Any indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, revenue, data, or business opportunities</li>
              <li>Service interruptions or system failures</li>
              <li>Third-party actions or content</li>
            </ul>
            <p className="ink-muted leading-relaxed">
              Our total liability shall not exceed the fees paid by you in the twelve months preceding the event giving rise to liability.
            </p>

            <HeadingAnchor id="indemnification">
              13. Indemnification
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              You agree to indemnify, defend, and hold harmless HERA, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted">
              <li>Your use or misuse of the Services</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Your content or data processed through the Services</li>
            </ul>

            <HeadingAnchor id="governing-law">
              14. Governing Law
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              These Terms are governed by the laws of the United Arab Emirates, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration in accordance with the rules of the Dubai International Arbitration Centre (DIAC).
            </p>
            <p className="ink-muted leading-relaxed">
              You waive any right to a jury trial and agree that any disputes will be resolved individually, not as part of a class action.
            </p>

            <HeadingAnchor id="changes">
              15. Changes to Terms
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              We may modify these Terms at any time. We will notify you of material changes through:
            </p>
            <ul className="list-disc pl-6 space-y-2 ink-muted">
              <li>Email notification to your registered email address</li>
              <li>In-app notifications within the Services</li>
              <li>Posting the updated Terms with a new effective date</li>
            </ul>
            <p className="ink-muted leading-relaxed">
              Continued use of the Services after changes become effective constitutes acceptance of the modified Terms.
            </p>

            <HeadingAnchor id="contact">
              16. Contact Information
            </HeadingAnchor>
            <p className="ink-muted leading-relaxed">
              For questions about these Terms or our Services, please contact us:
            </p>
            <div className="mt-4 space-y-2 ink-muted">
              <p><strong className="ink">HERA Corporation</strong></p>
              <p>Email: legal@heraerp.com</p>
              <p>Support: support@heraerp.com</p>
              <p>Website: https://heraerp.com</p>
              <p>Address: Dubai, United Arab Emirates</p>
            </div>
            <p className="mt-6 ink-muted leading-relaxed">
              For technical support, visit our documentation at https://docs.heraerp.com or contact our support team.
            </p>

            {/* Additional Sections */}
            <div className="mt-12 border-t border-border pt-12">
              <h3 className="text-lg font-semibold ink mb-4">Additional Provisions</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium ink mb-2">Severability</h4>
                  <p className="ink-muted">
                    If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium ink mb-2">Entire Agreement</h4>
                  <p className="ink-muted">
                    These Terms, together with our Privacy Policy and any other agreements referenced herein, constitute the entire agreement between you and HERA regarding the Services.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium ink mb-2">Assignment</h4>
                  <p className="ink-muted">
                    You may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium ink mb-2">Force Majeure</h4>
                  <p className="ink-muted">
                    Neither party shall be liable for delays or failures in performance resulting from circumstances beyond their reasonable control.
                  </p>
                </div>
              </div>
            </div>

            {/* Enterprise Addendum */}
            <div className="mt-12 border-t border-border pt-12">
              <h3 className="text-lg font-semibold ink mb-4">Enterprise Addendum</h3>
              <p className="ink-muted mb-4">
                For Enterprise customers with custom agreements, the following additional terms may apply:
              </p>
              <ul className="list-disc pl-6 space-y-2 ink-muted">
                <li>Service Level Agreements (SLAs) with guaranteed uptime</li>
                <li>Dedicated support channels and response times</li>
                <li>Custom data retention and backup policies</li>
                <li>Advanced security features and compliance certifications</li>
                <li>Volume-based pricing and custom billing arrangements</li>
                <li>On-premises deployment options where available</li>
              </ul>
              <p className="mt-4 ink-muted">
                Enterprise agreements supersede these standard Terms where explicitly stated in writing.
              </p>
            </div>
          </article>

          {/* Sticky TOC */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24">
              <Toc sections={sections} />
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}